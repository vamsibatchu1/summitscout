import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_TOKEN, MAP_STYLES, DEFAULT_STYLE } from '../config/mapStyles';
import { NATIONAL_PARKS } from '../data/parks';
import { Compass, Mountain, Trees, Waves } from 'lucide-react';
import ParkCard from './ParkCard';
import './Map.css';

mapboxgl.accessToken = MAP_TOKEN;

const Map = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const popupRef = useRef(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(9);
    const [currentStyle, setCurrentStyle] = useState(DEFAULT_STYLE);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const rotationRequestRef = useRef(null);

    const stopRotation = () => {
        if (rotationRequestRef.current) {
            cancelAnimationFrame(rotationRequestRef.current);
            rotationRequestRef.current = null;
        }
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

    const handleParkClick = (park) => {
        if (!map.current) return;
        stopRotation();

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
            <div ref={mapContainer} className="map-container" style={{ flex: '0 0 70%', height: '100%', position: 'relative' }} />

            <div className="sidebar no-scrollbar" style={{
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
                <div style={{ padding: '30px 20px', flexGrow: 1 }}>
                    {/* --- APP HEADER --- */}
                    <h1 style={{
                        fontFamily: '"Londrina Solid", cursive',
                        fontSize: '3.5rem',
                        color: '#cd5c5c',
                        textAlign: 'left',
                        margin: '0 0 20px 0',
                        lineHeight: '1',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                    }}>
                        SUMMIT SCOUT
                    </h1>

                    {/* --- FILTER BUTTONS --- */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: '12px',
                        marginBottom: '30px'
                    }}>
                        {[
                            { icon: <Compass size={20} />, label: 'All' },
                            { icon: <Mountain size={20} />, label: 'Peaks' },
                            { icon: <Trees size={20} />, label: 'Forests' },
                            { icon: <Waves size={20} />, label: 'Water' }
                        ].map((filter, i) => (
                            <button
                                key={i}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    border: '1px solid #cd5c5c',
                                    color: '#cd5c5c',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '0'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#cd5c5c';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#cd5c5c';
                                }}
                            >
                                {filter.icon}
                            </button>
                        ))}
                    </div>

                    {NATIONAL_PARKS.map(park => (
                        <ParkCard
                            key={park.id}
                            park={park}
                            isSelected={selectedFeature?.properties?.name === park.name}
                            onClick={() => {
                                if (selectedFeature?.properties?.name === park.name) {
                                    setSelectedFeature(null);
                                    if (popupRef.current) popupRef.current.remove();
                                    map.current.flyTo({ zoom: 4, pitch: 0, bearing: 0 });
                                } else {
                                    handleParkClick(park);
                                }
                            }}
                            activeStyle={currentStyle.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Map;
