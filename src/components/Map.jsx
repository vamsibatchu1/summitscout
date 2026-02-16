import React, { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_TOKEN, MAP_STYLES, DEFAULT_STYLE } from '../config/mapStyles';
import { NATIONAL_PARKS } from '../data/parks';
import { Compass, Mountain, Trees, Waves, Map as MapIcon, Star, List } from 'lucide-react';
import ParkCard from './ParkCard';
import * as turf from '@turf/turf';
import './Map.css';

// Deterministic ranking generator
const getParkScores = (park) => {
    let hash = 0;
    for (let i = 0; i < park.parkCode.length; i++) {
        hash = ((hash << 5) - hash) + park.parkCode.charCodeAt(i);
        hash |= 0;
    }
    const getScore = (offset, range = 4, min = 6) => {
        const val = Math.abs((hash + offset) % 10);
        return parseFloat((min + (val / 10) * range).toFixed(1));
    };
    const remoteness = getScore(10, 4, 5.5);
    const elevation = getScore(20, 3.5, 6.2);
    const scenery = getScore(30, 3, 6.8);
    const biology = getScore(40, 2.5, 7.0);
    const skill = getScore(50, 3, 6.5);
    const composite = parseFloat(((remoteness + elevation + scenery + biology + skill) / 5).toFixed(1));
    return { remoteness, elevation, scenery, biology, skill, composite };
};

// Deterministic weather generator
const getParkWeather = (park) => {
    let hash = 0;
    for (let i = 0; i < park.parkCode.length; i++) {
        hash = ((hash << 5) - hash) + park.parkCode.charCodeAt(i);
        hash |= 0;
    }

    const conditions = ['Sunny', 'Snowing', 'Rainy', 'Cloudy'];
    const status = conditions[Math.abs(hash % 4)];
    const temp = Math.abs((hash % 40) + (status === 'Snowing' ? 10 : 40));
    const wind = Math.abs((hash % 25) + 5);

    let weatherClass = 'sunny';
    if (status === 'Snowing') weatherClass = 'snow';
    if (status === 'Rainy') weatherClass = 'rain';
    if (status === 'Cloudy') weatherClass = 'cloudy';

    return { status, temp, wind, weatherClass };
};

mapboxgl.accessToken = MAP_TOKEN;

const Map = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const popupRef = useRef(null);
    const markersRef = useRef([]);
    const [lng, setLng] = useState(-98.35);
    const [lat, setLat] = useState(39.50);
    const [zoom, setZoom] = useState(3.5);
    const [currentStyle, setCurrentStyle] = useState(DEFAULT_STYLE);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('Summary');
    const [isTouring, setIsTouring] = useState(false);
    const [viewMode, setViewMode] = useState('all'); // 'all', 'ranked', 'weather'
    const [mobileTab, setMobileTab] = useState('map'); // 'map' or 'list'
    const rotationRequestRef = useRef(null);
    const tourRequestRef = useRef(null);
    const [visitedParks, setVisitedParks] = useState(new Set());
    const selectedParkCodeRef = useRef(null);

    const toggleVisited = (parkId) => {
        setVisitedParks(prev => {
            const next = new Set(prev);
            if (next.has(parkId)) next.delete(parkId);
            else next.add(parkId);
            return next;
        });
    };

    const processedParks = useMemo(() => {
        let list = [...NATIONAL_PARKS].map(p => ({
            ...p,
            scores: getParkScores(p),
            weather: getParkWeather(p)
        }));

        if (viewMode === 'ranked') {
            return list.sort((a, b) => b.scores.composite - a.scores.composite);
        }
        return list;
    }, [viewMode]);

    // Update marker classes when viewMode changes
    useEffect(() => {
        if (!map.current || markersRef.current.length === 0) return;

        markersRef.current.forEach(({ el, park }) => {
            const pin = el.querySelector('.marker-pin');
            const pulse = el.querySelector('.marker-pulse');

            // Reset
            pin.className = 'marker-pin';
            pulse.className = 'marker-pulse';

            if (viewMode === 'weather') {
                pin.classList.add(park.weather.weatherClass);
                pulse.classList.add(park.weather.weatherClass);
            }
        });

        // Map Atmosphere changes
        if (viewMode === 'weather') {
            map.current.setFog({
                'range': [-1, 2],
                'color': 'rgba(150, 180, 200, 0.5)',
                'horizon-blend': 0.3,
                'space-color': 'rgba(20, 30, 40, 0.8)',
                'star-intensity': 0.15
            });
        } else {
            map.current.setFog({
                'range': [0.5, 10],
                'color': 'white',
                'horizon-blend': 0.1
            });
        }
    }, [viewMode]);

    const stopRotation = () => {
        if (rotationRequestRef.current) {
            cancelAnimationFrame(rotationRequestRef.current);
            rotationRequestRef.current = null;
        }
        if (tourRequestRef.current) {
            cancelAnimationFrame(tourRequestRef.current);
            tourRequestRef.current = null;
            setIsTouring(false);
            if (map.current.getLayer('tour-path')) map.current.removeLayer('tour-path');
            if (map.current.getSource('tour-path')) map.current.removeSource('tour-path');
        }
        // Also clear transit lines
        if (map.current) {
            if (map.current.getLayer('transit-line')) map.current.removeLayer('transit-line');
            if (map.current.getSource('transit-line')) map.current.removeSource('transit-line');
            if (map.current.getLayer('shuttle-line')) map.current.removeLayer('shuttle-line');
            if (map.current.getSource('shuttle-line')) map.current.removeSource('shuttle-line');
        }
    };

    const startTour = () => {
        if (!map.current) return;
        stopRotation();
        setIsTouring(true);

        // West-to-East sorting for a natural cross-country flow
        const sortedParks = [...NATIONAL_PARKS].sort((a, b) => a.coordinates[0] - b.coordinates[0]);
        const coords = sortedParks.map(p => p.coordinates);

        // Use turf to create a smooth path
        const line = turf.lineString(coords);
        const distance = turf.length(line);
        const steps = 2000; // Total frames for the tour

        // Add visual path to the map
        if (map.current.getSource('tour-path')) {
            map.current.removeLayer('tour-path');
            map.current.removeSource('tour-path');
        }

        map.current.addSource('tour-path', {
            type: 'geojson',
            data: line
        });

        map.current.addLayer({
            id: 'tour-path',
            type: 'line',
            source: 'tour-path',
            paint: {
                'line-color': '#cd5c5c',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
            }
        });

        let step = 0;
        const animate = () => {
            if (step >= steps || !isTouring) {
                stopRotation();
                return;
            }

            const currentPos = turf.along(line, (step / steps) * distance).geometry.coordinates;
            const lookAheadPos = turf.along(line, Math.min(((step + 20) / steps) * distance, distance)).geometry.coordinates;

            const camera = map.current.getFreeCameraOptions();

            // Position camera slightly behind and above
            const cameraPos = mapboxgl.MercatorCoordinate.fromLngLat(
                [currentPos[0], currentPos[1] - 0.5], // Offset south for better view
                15000 // 15km altitude for overview
            );

            camera.position = cameraPos;
            camera.lookAtPoint(lookAheadPos);

            map.current.setFreeCameraOptions(camera);

            step++;
            tourRequestRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    const startRotation = () => {
        stopRotation();
        let bearing = map.current.getBearing();

        const rotate = () => {
            bearing += 0.05; // Slow, cinematic orbit
            if (map.current) {
                map.current.setBearing(bearing);
                rotationRequestRef.current = requestAnimationFrame(rotate);
            }
        };

        rotate();
    };

    useEffect(() => {
        if (map.current) return; // initialize map only once

        if (!mapContainer.current) {
            console.error('Map container not found');
            return;
        }

        console.log('Initializing Mapbox map...');

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: currentStyle.url,
                center: [lng, lat],
                zoom: zoom,
                pitch: 45,
                attributionControl: false
            });

            // Stop rotation on manual interaction
            map.current.on('dragstart', stopRotation);
            map.current.on('zoomstart', stopRotation);
            map.current.on('wheel', stopRotation);

            map.current.on('load', () => {
                console.log('Map loaded successfully');

                // Add Terrain for 3D depth
                if (!map.current.getSource('mapbox-dem')) {
                    map.current.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512,
                        'maxzoom': 14
                    });
                    map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
                }

                // Add Atmosphere/Fog
                map.current.setFog({
                    'range': [0.5, 10],
                    'color': 'white',
                    'horizon-blend': 0.1
                });

                // Clear existing markers logic and use NATIONAL_PARKS directly for custom markers
                NATIONAL_PARKS.forEach(park => {
                    const el = document.createElement('div');
                    el.className = 'custom-marker';
                    el.innerHTML = `
                        <div class="marker-pin"></div>
                        <div class="marker-pulse"></div>
                    `;

                    // Store for dynamic updates (weather mode)
                    markersRef.current.push({ el, park: { ...park, weather: getParkWeather(park) } });

                    new mapboxgl.Marker(el)
                        .setLngLat(park.coordinates)
                        .addTo(map.current);

                    const hoverEl = document.createElement('div');
                    hoverEl.style.width = '40px';
                    hoverEl.style.height = '40px';
                    hoverEl.style.cursor = 'pointer';

                    new mapboxgl.Marker(hoverEl)
                        .setLngLat(park.coordinates)
                        .addTo(map.current);

                    hoverEl.addEventListener('mouseenter', () => el.classList.add('active'));
                    hoverEl.addEventListener('mouseleave', () => el.classList.remove('active'));
                    hoverEl.addEventListener('click', () => handleParkClick(park));
                });
            });

            // Add Click Listener
            map.current.on('click', (e) => {
                stopRotation();
                if (popupRef.current) {
                    popupRef.current.remove();
                    popupRef.current = null;
                }

                const features = map.current.queryRenderedFeatures(e.point);

                if (features.length > 0) {
                    const peakFeature = features.find(f => {
                        const props = f.properties || {};
                        const layerId = f.layer.id.toLowerCase();
                        return layerId.includes('peak') || layerId.includes('summit') || props.class === 'peak' || props.ele !== undefined;
                    });

                    if (peakFeature) {
                        setSelectedFeature(peakFeature);
                        const coords = peakFeature.geometry.coordinates;

                        map.current.flyTo({
                            center: coords,
                            zoom: 14,
                            pitch: 75,
                            bearing: 45,
                            speed: 0.5,
                            curve: 1.2,
                            padding: { right: 380 }
                        });

                        map.current.once('moveend', startRotation);
                    } else {
                        setSelectedFeature(null);
                        map.current.flyTo({
                            pitch: 0,
                            bearing: 0,
                            zoom: Math.max(4, map.current.getZoom() - 1),
                            speed: 0.8
                        });
                    }
                } else {
                    setSelectedFeature(null);
                    map.current.flyTo({ pitch: 0, bearing: 0, zoom: 4 });
                }
            });

        } catch (error) {
            console.error('Error creating map:', error);
        }

    }, []);

    // Effect to update style when currentStyle changes
    useEffect(() => {
        if (!map.current) return;
        map.current.setStyle(currentStyle.url);
    }, [currentStyle]);

    // TRANSIT VISUALIZATION LOGIC
    useEffect(() => {
        if (!map.current || !selectedFeature || activeSubTab !== 'Getting There') {
            if (map.current) {
                if (map.current.getLayer('transit-line')) map.current.removeLayer('transit-line');
                if (map.current.getSource('transit-line')) map.current.removeSource('transit-line');
                if (map.current.getLayer('shuttle-line')) map.current.removeLayer('shuttle-line');
                if (map.current.getSource('shuttle-line')) map.current.removeSource('shuttle-line');
            }
            return;
        }

        const park = NATIONAL_PARKS.find(p => p.name === selectedFeature.properties.name);
        if (!park) return;

        const AIRPORT_COORDS = {
            'BGR': [-68.8281, 44.8074], 'SLC': [-111.9791, 40.7899], 'LAS': [-115.1523, 36.0840],
            'GJT': [-108.5255, 39.1233], 'RAP': [-103.0483, 44.0453], 'MAF': [-102.2019, 31.9425],
            'ELP': [-106.3778, 31.8071], 'FCA': [-114.2562, 48.3114], 'PHX': [-112.0078, 33.4342],
            'SEA': [-122.3088, 47.4502], 'ANC': [-149.9961, 61.1759], 'MIA': [-80.2870, 25.7959],
            'CLE': [-81.8504, 41.4108], 'SDF': [-85.7360, 38.1744], 'BNA': [-86.6782, 36.1263],
            'JAC': [-110.7621, 43.6073], 'OGG': [-156.4305, 20.8986], 'ITO': [-155.0485, 19.7202],
            'PSP': [-116.5067, 33.8297], 'RDD': [-122.2934, 40.5090], 'MFR': [-122.8735, 42.3742]
        };

        const parkIntel = processedParks.find(p => p.parkCode === park.parkCode);
        const airportText = parkIntel?.logistics?.airport || "";
        const airportCodeMatch = airportText.match(/\(([A-Z]{3})\)/);
        const airportCode = airportCodeMatch ? airportCodeMatch[1] : null;

        if (airportCode && AIRPORT_COORDS[airportCode]) {
            const airportCoords = AIRPORT_COORDS[airportCode];
            const line = turf.lineString([park.coordinates, airportCoords]);

            if (map.current.getSource('transit-line')) {
                map.current.getSource('transit-line').setData(line);
            } else {
                map.current.addSource('transit-line', { type: 'geojson', data: line });
                map.current.addLayer({
                    id: 'transit-line',
                    type: 'line',
                    source: 'transit-line',
                    paint: {
                        'line-color': '#cd5c5c',
                        'line-width': 3,
                        'line-dasharray': [2, 1],
                        'line-opacity': 0.8
                    }
                });
            }
        }

        // Shuttle Loops for Acadia and Zion
        const SHUTTLE_LOOPS = {
            'acad': [
                [-68.25, 44.40], [-68.20, 44.39], [-68.18, 44.33],
                [-68.20, 44.31], [-68.25, 44.32], [-68.25, 44.40]
            ],
            'zion': [
                [-112.98, 37.20], [-112.97, 37.21], [-112.97, 37.22],
                [-112.95, 37.25], [-112.95, 37.26], [-112.95, 37.28],
                [-112.95, 37.26], [-112.98, 37.20]
            ]
        };

        if (SHUTTLE_LOOPS[park.parkCode]) {
            const shuttlePath = turf.lineString(SHUTTLE_LOOPS[park.parkCode]);
            if (map.current.getSource('shuttle-line')) {
                map.current.getSource('shuttle-line').setData(shuttlePath);
            } else {
                map.current.addSource('shuttle-line', { type: 'geojson', data: shuttlePath });
                map.current.addLayer({
                    id: 'shuttle-line',
                    type: 'line',
                    source: 'shuttle-line',
                    paint: {
                        'line-color': '#4a7c59',
                        'line-width': 4,
                        'line-opacity': 0.9,
                        'line-blur': 1
                    }
                });
            }
        }

    }, [selectedFeature, activeSubTab, processedParks]);

    const handleParkClick = (park) => {
        if (!map.current) return;
        stopRotation();

        selectedParkCodeRef.current = park.parkCode;

        if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
        }

        map.current.flyTo({
            center: park.coordinates,
            zoom: 12,
            pitch: 60,
            bearing: 0,
            essential: true
        });

        setSelectedFeature({
            type: 'Feature',
            properties: {
                name: park.name,
                parkCode: park.parkCode,
                description: park.description,
                ele: Math.floor(Math.random() * 2000) + 1000,
                type: 'park'
            },
            geometry: {
                type: 'Point',
                coordinates: park.coordinates
            }
        });

        map.current.once('moveend', () => {
            // Only create popup if this park is still the selected one
            if (selectedParkCodeRef.current !== park.parkCode) return;

            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: true,
                className: 'field-note-popup',
                maxWidth: '300px',
                offset: 20
            })
                .setLngLat(park.coordinates)
                .setHTML(`
                <div style="font-family: 'Caveat', cursive; font-size: 1.4rem; color: #444;">
                    <b style="display: block; color: #cd5c5c; border-bottom: 1px dashed #ccc; margin-bottom: 8px; font-family: 'PT Sans Narrow', sans-serif; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">FIELD NOTES</b>
                    <strong style="font-size: 1.6rem; display: block; line-height: 1; margin-bottom: 5px;">${park.name}</strong>
                    <p style="margin: 0; line-height: 1.3;">${park.description}</p>
                </div>
            `)
                .addTo(map.current);

            popupRef.current = popup;
            startRotation();
        });
    };

    return (
        <div className="app-layout" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <div
                ref={mapContainer}
                className={`map-container ${mobileTab !== 'map' ? 'mobile-hidden' : ''}`}
                style={{ flex: '0 0 70%', height: '100%', position: 'relative' }}
            />

            <div className={`sidebar no-scrollbar ${mobileTab !== 'list' ? 'mobile-hidden' : ''}`} style={{
                flex: '0 0 30%',
                height: '100%',
                overflowY: 'auto',
                background: '#fcfcfc',
                borderLeft: '1px solid #d4d4d4',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 20,
                boxSizing: 'border-box',
                margin: 0,
                padding: 0,
                msOverflowStyle: 'none',  /* IE and Edge */
                scrollbarWidth: 'none'  /* Firefox */
            }}>
                <div style={{ padding: '30px 20px', flexGrow: 1, paddingBottom: '80px' }}>
                    {/* --- APP HEADER --- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            backgroundColor: '#cd5c5c',
                            WebkitMask: `url(/src/assets/nps.svg) no-repeat center`,
                            mask: `url(/src/assets/nps.svg) no-repeat center`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            flexShrink: 0
                        }} />
                        <h1 style={{
                            fontFamily: '"Londrina Solid", cursive',
                            fontSize: '3.5rem',
                            color: '#cd5c5c',
                            textAlign: 'left',
                            margin: 0,
                            lineHeight: '1',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            SUMMIT SCOUT
                        </h1>
                    </div>
                    <p style={{
                        marginTop: '-8px',
                        marginBottom: '30px',
                        fontSize: '1.25rem',
                        color: '#a6a28e', // Warm grain color
                        fontFamily: '"PT Sans Narrow", sans-serif',
                        lineHeight: '1.4',
                        width: '100%',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                    }}>
                        Your friendly helper on your next adventure to know everything there is to know about the national parks of the US.
                    </p>

                    {/* --- FILTER BUTTONS --- */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: '12px',
                        marginBottom: '30px',
                        flexWrap: 'wrap'
                    }}>
                        {[
                            { icon: <Star size={20} />, label: 'Ranked', action: () => setViewMode(viewMode === 'ranked' ? 'all' : 'ranked') },
                            { icon: <Compass size={20} />, label: 'Active Pulse', action: () => setViewMode(viewMode === 'weather' ? 'all' : 'weather') },
                            { icon: <Mountain size={20} />, label: 'Peaks', action: () => { } },
                            { icon: <Trees size={20} />, label: 'Forests', action: () => { } },
                            { icon: <Waves size={20} />, label: 'Water', action: () => { } },
                            { icon: <MapIcon size={20} />, label: 'Tour', action: startTour }
                        ].map((filter, i) => (
                            <button
                                key={i}
                                onClick={filter.action}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: (isTouring && filter.label === 'Tour') ||
                                        (viewMode === 'ranked' && filter.label === 'Ranked') ||
                                        (viewMode === 'weather' && filter.label === 'Active Pulse') ? '#cd5c5c' : 'transparent',
                                    border: '1px solid #cd5c5c',
                                    color: (isTouring && filter.label === 'Tour') ||
                                        (viewMode === 'ranked' && filter.label === 'Ranked') ||
                                        (viewMode === 'weather' && filter.label === 'Active Pulse') ? '#fff' : '#cd5c5c',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '0'
                                }}
                                onMouseEnter={(e) => {
                                    if (!((isTouring && filter.label === 'Tour') ||
                                        (viewMode === 'ranked' && filter.label === 'Ranked') ||
                                        (viewMode === 'weather' && filter.label === 'Active Pulse'))) {
                                        e.currentTarget.style.background = '#cd5c5c';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!((isTouring && filter.label === 'Tour') ||
                                        (viewMode === 'ranked' && filter.label === 'Ranked') ||
                                        (viewMode === 'weather' && filter.label === 'Active Pulse'))) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#cd5c5c';
                                    }
                                }}
                            >
                                {filter.icon}
                            </button>
                        ))}
                    </div>

                    {processedParks.map(park => (
                        <ParkCard
                            key={park.id}
                            park={park}
                            isSelected={selectedFeature?.properties?.name === park.name}
                            isVisited={visitedParks.has(park.id)}
                            onToggleVisited={() => toggleVisited(park.id)}
                            viewMode={viewMode}
                            activeTab={activeSubTab}
                            onTabChange={setActiveSubTab}
                            onClick={() => {
                                if (selectedFeature?.properties?.name === park.name) {
                                    setSelectedFeature(null);
                                    selectedParkCodeRef.current = null;
                                    stopRotation();
                                    setActiveSubTab('Summary');
                                    if (popupRef.current) {
                                        popupRef.current.remove();
                                        popupRef.current = null;
                                    }
                                    map.current.flyTo({ zoom: 3.5, pitch: 0, bearing: 0, center: [-98.35, 39.50] });
                                } else {
                                    handleParkClick(park);
                                    setActiveSubTab('Summary');
                                    // Auto-switch to map on mobile when a park is selected
                                    if (window.innerWidth <= 768) setMobileTab('map');
                                }
                            }}
                            activeStyle={currentStyle.id}
                        />
                    ))}
                </div>
            </div>

            {/* --- MOBILE NAVIGATION --- */}
            <div className="mobile-nav">
                <button
                    className={`mobile-nav-item ${mobileTab === 'map' ? 'active' : ''}`}
                    onClick={() => setMobileTab('map')}
                >
                    <MapIcon size={20} />
                    <span>Map</span>
                </button>
                <button
                    className={`mobile-nav-item ${mobileTab === 'list' ? 'active' : ''}`}
                    onClick={() => setMobileTab('list')}
                >
                    <List size={20} />
                    <span>List</span>
                </button>
            </div>
        </div >
    );
};

export default Map;
