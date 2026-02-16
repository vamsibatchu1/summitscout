import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, MapPin, TrendingUp, Info, ShieldCheck, Plane, MessageSquare, Layers, Baby, Dog, Zap, Check, Bookmark } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { NPS_API_KEY, NPS_BASE_URL } from '../config/npsConfig';
import SUMMIT_SCOUT_DATA from '../data/summit_scout.json';
import CAMPING_DATA from '../data/intelligence/camping.json';
import PERMITS_DATA from '../data/intelligence/vehicle_permits.json';
import FEES_DATA from '../data/intelligence/fees.json';
import GETTING_THERE_DATA from '../data/intelligence/getting-there.json';

const FAMOUS_LANDMARKS = {
    'yose': ['Half Dome', 'El Capitan', 'Yosemite Falls', 'Mirror Lake'],
    'grca': ['Mather Point', 'Bright Angel Trail', 'Desert View Watchtower', 'Havasu Falls'],
    'romo': ['Longs Peak', 'Bear Lake', 'Trail Ridge Road', 'Dream Lake'],
    'acad': ['Cadillac Mountain', 'Jordan Pond', 'Thunder Hole', 'Beehive Trail'],
    'zion': ['Angels Landing', 'The Narrows', 'Observation Point', 'Zion Canyon'],
    'glac': ['Logan Pass', 'Lake McDonald', 'Going-to-the-Sun Road', 'Many Glacier'],
    'olym': ['Hurricane Ridge', 'Hoh Rain Forest', 'Ruby Beach', 'Mount Olympus'],
    'yell': ['Old Faithful', 'Grand Prismatic Spring', 'Yellowstone Falls', 'Lamar Valley']
};

const generateVisitorData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => {
        // Simple bell curve logic to simulate peaks in summer
        const distFromJuly = Math.abs(index - 6);
        const visitors = Math.max(10, 100 - (distFromJuly * 12)) + Math.floor(Math.random() * 10);
        return { month, visitors };
    });
};

const getNPSIcon = (name, color = 'black') => {
    return `https://raw.githubusercontent.com/nationalparkservice/symbol-library/gh-pages/src/standalone/${name}-${color}-22.svg`;
};



const ParkCard = ({ park, isSelected, onClick, activeStyle, viewMode, isVisited, onToggleVisited, activeTab, onTabChange }) => {
    const [npsData, setNpsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const visitorData = useMemo(() => generateVisitorData(), []);

    const parkIntelligence = SUMMIT_SCOUT_DATA[park.parkCode] || {};

    const info = {
        summary: {
            elevation: parkIntelligence.summary?.elevation || "1,200 - 13,000 ft",
            peakSeason: parkIntelligence.summary?.peakSeason || "June - September",
            weather: parkIntelligence.summary?.weather || "Varies by elevation, alpine conditions.",
            states: park.location
        },
        specs: (parkIntelligence.specs || []).map(s => ({
            label: s.label,
            status: s.status,
            icon: s.label.toLowerCase().includes('kid') ? 'strollers' :
                s.label.toLowerCase().includes('pet') ? 'pets-on-leash' :
                    s.label.toLowerCase().includes('beginner') ? 'climbing' :
                        s.label.toLowerCase().includes('permit') ? 'entrance-station' :
                            'backcountry-camping'
        })),
        logistics: parkIntelligence.logistics ? [
            { icon: 'airport', label: 'AIRPORT', value: parkIntelligence.logistics.airport },
            { icon: 'automobiles', label: 'TRANSPORT', value: parkIntelligence.logistics.transport },
            { icon: 'lodging', label: 'STAY', value: parkIntelligence.logistics.stay }
        ] : [
            { icon: 'airport', label: 'AIRPORT', value: "International Airport (4h drive)" },
            { icon: 'automobiles', label: 'TRANSPORT', value: "Rental Car recommended." },
            { icon: 'lodging', label: 'STAY', value: "Nearby lodges and camping." }
        ],
        reports: {
            reddit: parkIntelligence.reports?.reddit || "High traffic at main peaks during midday.",
            google: parkIntelligence.reports?.google || "Local dining options available in gateway towns.",
            offbeat: parkIntelligence.reports?.offbeat || "Hidden overlooks provide the best sunset views."
        },
        combos: parkIntelligence.combos || [
            "Pairs well with nearby State Parks for fewer crowds."
        ]
    };

    const { remoteness, elevation, scenery, biology, skill, composite } = park.scores || {};

    useEffect(() => {
        if (!isSelected || npsData) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const parkRes = await fetch(`${NPS_BASE_URL}/parks?parkCode=${park.parkCode}&api_key=${NPS_API_KEY}`);
                const parkJson = await parkRes.json();

                if (parkJson.data?.[0]) setNpsData(parkJson.data[0]);
            } catch (err) {
                console.error("Error fetching NPS data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSelected, park.parkCode, npsData]);

    const landmarks = FAMOUS_LANDMARKS[park.parkCode] || [];

    return (
        <motion.div
            layout
            onClick={onClick}
            initial={false}
            style={{
                cursor: 'pointer',
                padding: '15px',
                marginBottom: '15px',
                background: '#fff',
                border: `1px solid ${isSelected ? '#cd5c5c' : '#e0e0e0'}`,
                borderRadius: '0',
                boxShadow: isSelected ? '4px 4px 0 rgba(205, 92, 92, 0.2)' : '2px 2px 0 rgba(0,0,0,0.05)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                overflow: 'hidden',
                position: 'relative'
            }}
            whileHover={{ y: isSelected ? 0 : -2, boxShadow: '4px 4px 0 rgba(205, 92, 92, 0.2)', borderColor: '#cd5c5c' }}
        >
            <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: isVisited ? '#333' : '#cd5c5c',
                color: '#fff',
                padding: '4px 8px',
                fontSize: '0.9rem',
                fontFamily: '"PT Sans Narrow", sans-serif',
                fontWeight: 'bold',
                zIndex: 2
            }}>
                SC {composite}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingRight: '60px' }}>
                {isVisited ? (
                    <Check
                        size={16}
                        strokeWidth={isSelected ? 3 : 2}
                        color="#333"
                    />
                ) : (
                    <Mountain
                        size={16}
                        strokeWidth={isSelected ? 2.5 : 2}
                        color={isSelected ? '#cd5c5c' : '#888'}
                    />
                )}
                <motion.h3 layout="position" style={{
                    margin: 0,
                    fontFamily: '"PT Serif", serif',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: isSelected ? '#cd5c5c' : '#333'
                }}>
                    {park.name.toUpperCase()}
                </motion.h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <motion.p layout="position" style={{
                    margin: 0,
                    fontFamily: '"PT Sans Narrow", sans-serif',
                    fontSize: '0.9rem',
                    color: '#666',
                    lineHeight: '1.4',
                    textTransform: 'uppercase'
                }}>
                    {park.location}
                </motion.p>
            </div>

            {isSelected && (
                <div style={{ display: 'flex', marginTop: '12px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisited();
                        }}
                        style={{
                            padding: '6px 16px',
                            background: isVisited ? '#333' : 'transparent',
                            border: `1px solid ${isVisited ? '#333' : '#cd5c5c'}`,
                            color: isVisited ? '#fff' : '#cd5c5c',
                            borderRadius: '0',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            fontFamily: '"PT Sans Narrow", sans-serif',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            letterSpacing: '1px'
                        }}
                    >
                        VISITED
                    </button>
                </div>
            )}

            {(viewMode === 'ranked' || isSelected) && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '10px',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '4px 12px',
                        fontSize: '0.9rem',
                        fontFamily: '"PT Sans Narrow", sans-serif',
                        color: '#999',
                        borderTop: '1px solid #f0f0f0',
                        paddingTop: '8px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>REMOTENESS <span style={{ color: '#cd5c5c', fontWeight: 'bold' }}>{remoteness}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>ELEVATION <span style={{ color: '#cd5c5c', fontWeight: 'bold' }}>{elevation}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>SCENERY <span style={{ color: '#cd5c5c', fontWeight: 'bold' }}>{scenery}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>BIODIVERSITY <span style={{ color: '#cd5c5c', fontWeight: 'bold' }}>{biology}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>TECHNICALITY <span style={{ color: '#cd5c5c', fontWeight: 'bold' }}>{skill}</span></div>
                </motion.div>
            )}

            {viewMode === 'weather' && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '10px',
                        background: '#f8f9fa',
                        padding: '8px 12px',
                        borderLeft: '3px solid #00ccff',
                        fontFamily: '"PT Sans Narrow", sans-serif',
                        fontSize: '0.75rem',
                        color: '#444',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                    }}
                >
                    <div style={{ color: '#00ccff', fontWeight: 'bold', fontSize: '0.65rem', letterSpacing: '1px' }}>LIVE CLIMATE LOG</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>TEMP: <b style={{ color: '#333' }}>{park.weather?.temp}°F</b></span>
                        <span>WIND: <b style={{ color: '#333' }}>{park.weather?.wind}MPH</b></span>
                        <span style={{ color: '#cd5c5c', fontWeight: 'bold' }}>{park.weather?.status.toUpperCase()}</span>
                    </div>
                </motion.div>
            )}

            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}
                    >
                        {loading ? (
                            <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#999', letterSpacing: '1px' }}
                                >
                                    ESTABLISHING SATELLITE LINK...
                                </motion.div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* --- DISCOVERY PHOTO --- */}
                                {npsData?.images?.[0] && (
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '140px',
                                        overflow: 'hidden',
                                        border: '4px solid #fff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transform: 'rotate(-1deg)',
                                        marginBottom: '5px'
                                    }}>
                                        <img
                                            src={npsData.images[0].url}
                                            alt={npsData.images[0].altText}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                                            padding: '10px',
                                            color: '#fff',
                                            fontSize: '0.65rem',
                                            fontFamily: '"PT Sans Narrow", sans-serif',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}>
                                            {npsData.images[0].title}
                                        </div>
                                    </div>
                                )}

                                {/* --- SUB TABS NAVIGATION --- */}
                                <div style={{
                                    display: 'flex',
                                    borderBottom: '1px solid #eee',
                                    gap: '15px',
                                    overflowX: 'auto',
                                    paddingBottom: '2px'
                                }} className="no-scrollbar">
                                    {['Summary', 'Basics', 'Getting There', 'Fees', 'CAMPING', 'Permits', 'Reviews', 'Related'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={(e) => { e.stopPropagation(); onTabChange(tab); }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                borderBottom: activeTab === tab ? '2px solid #cd5c5c' : '2px solid transparent',
                                                padding: '8px 0',
                                                fontSize: '0.7rem',
                                                fontFamily: '"PT Sans Narrow", sans-serif',
                                                fontWeight: 'bold',
                                                color: activeTab === tab ? '#cd5c5c' : '#999',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* --- TAB CONTENT --- */}
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ minHeight: '150px' }}
                                >
                                    {activeTab === 'Summary' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontFamily: '"PT Sans Narrow", sans-serif' }}>
                                                <div style={{ background: '#f5f5f5', padding: '8px' }}>
                                                    <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: '#999', fontWeight: 'bold' }}>ELEVATION</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#333' }}>{info.summary.elevation}</div>
                                                </div>
                                                <div style={{ background: '#f5f5f5', padding: '8px' }}>
                                                    <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: '#999', fontWeight: 'bold' }}>PEAK SEASON</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#333' }}>{info.summary.peakSeason}</div>
                                                </div>
                                            </div>

                                            {/* --- ACTIVITY HIGHLIGHT CARDS --- */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {npsData?.activities?.slice(0, 4).map((act, i) => {
                                                    const iconName = 'birding-wildlife-viewing';
                                                    return (
                                                        <div key={i} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '8px',
                                                            background: '#fcfcfc',
                                                            border: '1px solid #eee',
                                                            borderRadius: '2px'
                                                        }}>
                                                            <div style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                background: '#cd5c5c',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderRadius: '2px',
                                                                flexShrink: 0
                                                            }}>
                                                                <img
                                                                    src={getNPSIcon(iconName, 'white')}
                                                                    alt=""
                                                                    style={{ width: '18px', height: '18px' }}
                                                                />
                                                            </div>
                                                            <div style={{ overflow: 'hidden' }}>
                                                                <div style={{ fontSize: '0.5rem', color: '#999', fontWeight: 'bold', letterSpacing: '0.5px' }}>ACTIVITY</div>
                                                                <div style={{
                                                                    fontSize: '0.7rem',
                                                                    color: '#333',
                                                                    fontWeight: 'bold',
                                                                    fontFamily: '"PT Sans Narrow", sans-serif',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }} title={act.name}>
                                                                    {act.name.toUpperCase()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* --- MOVED SPECS CARDS HERE --- */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {info.specs.map((spec, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px',
                                                        background: '#fcfcfc',
                                                        border: '1px solid #eee'
                                                    }}>
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            background: '#cd5c5c',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderRadius: '2px'
                                                        }}>
                                                            <img
                                                                src={getNPSIcon(spec.icon, 'white')}
                                                                alt=""
                                                                style={{ width: '18px', height: '18px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.55rem', color: '#999', fontWeight: 'bold', letterSpacing: '0.5px' }}>{spec.label.toUpperCase()}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#333', fontWeight: 'bold', fontFamily: '"PT Sans Narrow", sans-serif' }}>{spec.status}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Basics' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {/* --- MOVED GRAPH HERE --- */}
                                            <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.7rem', fontFamily: '"PT Sans Narrow", sans-serif', fontWeight: 'bold', color: '#cd5c5c', letterSpacing: '1px' }}>
                                                    <TrendingUp size={12} /> SEASONAL VISITOR TRAFFIC
                                                </div>
                                                <div style={{ width: '100%', height: '140px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={visitorData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                                                            <Area type="monotone" dataKey="visitors" stroke="#cd5c5c" fill="#cd5c5c" fillOpacity={0.1} strokeWidth={2} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic', fontFamily: '"PT Sans Narrow", sans-serif' }}>
                                                * Traffic analysis based on historical NPS visitation patterns.
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Getting There' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {/* Transport Cards */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(() => {
                                                    const transport = GETTING_THERE_DATA[park.parkCode]?.transportation || {};
                                                    const config = [
                                                        { key: 'car', icon: 'automobiles', label: 'BY CAR' },
                                                        { key: 'plane', icon: 'airport', label: 'BY PLANE' },
                                                        { key: 'train', icon: 'rail-station', label: 'BY TRAIN' },
                                                        { key: 'bus', icon: 'bus-stop', label: 'BY BUS' },
                                                        { key: 'shuttle_taxi', icon: 'tram-tour', label: 'SHUTTLE / TAXI' }
                                                    ];

                                                    return config.map(item => {
                                                        const value = transport[item.key];
                                                        if (!value || value.toLowerCase().includes('none') || value.toLowerCase().includes('no public')) return null;

                                                        return (
                                                            <div key={item.key} style={{
                                                                display: 'flex',
                                                                gap: '12px',
                                                                background: '#fcfcfc',
                                                                padding: '12px',
                                                                border: '1px solid #eee',
                                                                borderRadius: '4px'
                                                            }}>
                                                                <div style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    flexShrink: 0,
                                                                    opacity: 0.7
                                                                }}>
                                                                    <img
                                                                        src={getNPSIcon(item.icon)}
                                                                        alt=""
                                                                        style={{ width: '100%', height: '100%' }}
                                                                    />
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '4px' }}>{item.label}</div>
                                                                    <div style={{ fontSize: '0.85rem', color: '#444', fontFamily: '"PT Serif", serif', lineHeight: '1.4' }}>{value}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>

                                            {/* Key Places */}
                                            {GETTING_THERE_DATA[park.parkCode]?.places?.length > 0 && (
                                                <div style={{ marginTop: '5px' }}>
                                                    <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>KEY ENTRY POINTS / PLACES</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {GETTING_THERE_DATA[park.parkCode].places.map((place, i) => (
                                                            <span key={i} style={{
                                                                fontSize: '0.7rem',
                                                                background: '#f0f0f0',
                                                                padding: '4px 10px',
                                                                borderRadius: '0',
                                                                color: '#555',
                                                                fontFamily: '"PT Sans Narrow", sans-serif',
                                                                fontWeight: 'bold',
                                                                border: '1px solid #e0e0e0'
                                                            }}>
                                                                {place.toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {GETTING_THERE_DATA[park.parkCode]?.url && (
                                                <a
                                                    href={GETTING_THERE_DATA[park.parkCode].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: '#cd5c5c',
                                                        textDecoration: 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        fontFamily: '"PT Sans Narrow", sans-serif',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px',
                                                        marginTop: '10px'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MapPin size={14} /> OFFICIAL DIRECTIONS & MAPS
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'Fees' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {FEES_DATA[park.parkCode]?.entranceFees?.length > 0 && (
                                                <div style={{ background: '#fcfcfc', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ background: '#f5f5f5', padding: '8px 12px', fontSize: '0.7rem', fontWeight: 'bold', color: '#666', borderBottom: '1px solid #eee' }}>ENTRANCE FEES</div>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <tbody>
                                                            {FEES_DATA[park.parkCode].entranceFees.map((fee, i) => (
                                                                <tr key={i} style={{ borderBottom: i === FEES_DATA[park.parkCode].entranceFees.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                                                    <td style={{ padding: '10px 12px', color: '#333', fontWeight: '500' }}>{fee.title}</td>
                                                                    <td style={{ padding: '10px 12px', color: '#cd5c5c', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>{fee.cost}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {FEES_DATA[park.parkCode]?.entrancePasses?.length > 0 && (
                                                <div style={{ background: '#fcfcfc', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ background: '#f5f5f5', padding: '8px 12px', fontSize: '0.7rem', fontWeight: 'bold', color: '#666', borderBottom: '1px solid #eee' }}>ANNUAL PASSES</div>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <tbody>
                                                            {FEES_DATA[park.parkCode].entrancePasses.map((pass, i) => (
                                                                <tr key={i} style={{ borderBottom: i === FEES_DATA[park.parkCode].entrancePasses.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                                                    <td style={{ padding: '10px 12px', color: '#333', fontWeight: '500' }}>{pass.title}</td>
                                                                    <td style={{ padding: '10px 12px', color: '#cd5c5c', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>{pass.cost}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {(!FEES_DATA[park.parkCode] || (FEES_DATA[park.parkCode].entranceFees?.length === 0 && FEES_DATA[park.parkCode].entrancePasses?.length === 0)) && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                    No standard entrance fees found for this park.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'CAMPING' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{
                                                background: '#fcfcfc',
                                                padding: '12px',
                                                fontFamily: '"PT Serif", serif',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.6',
                                                color: '#444'
                                            }}>
                                                {CAMPING_DATA[park.parkCode]?.summary || "No specific camping intelligence available for this sector."}
                                            </div>
                                            {CAMPING_DATA[park.parkCode]?.url && (
                                                <a
                                                    href={CAMPING_DATA[park.parkCode].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: '#cd5c5c',
                                                        textDecoration: 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        fontFamily: '"PT Sans Narrow", sans-serif',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info size={14} /> OFFICIAL NPS CAMPING GUIDE
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'Permits' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{
                                                background: '#fcfcfc',
                                                padding: '12px',
                                                fontFamily: '"PT Serif", serif',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.6',
                                                color: '#444'
                                            }}>
                                                {PERMITS_DATA[park.parkCode]?.summary || "No specific permit intelligence available for this sector."}
                                            </div>
                                            {PERMITS_DATA[park.parkCode]?.url && (
                                                <a
                                                    href={PERMITS_DATA[park.parkCode].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: '#cd5c5c',
                                                        textDecoration: 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        fontFamily: '"PT Sans Narrow", sans-serif',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info size={14} /> OFFICIAL NPS PERMIT GUIDE
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'Reviews' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ background: '#fff5f5', padding: '12px', border: '1px dashed #cd5c5c' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <MessageSquare size={12} color="#cd5c5c" />
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#cd5c5c', letterSpacing: '1px' }}>REDDIT INTEL</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#444', fontStyle: 'italic', fontFamily: '"PT Serif", serif' }}>"{info.reports.reddit}"</div>
                                            </div>
                                            <div style={{ background: '#fcfcfc', padding: '12px', border: '1px solid #eee' }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#666', letterSpacing: '1px', marginBottom: '6px' }}>OFFBEAT GEM</div>
                                                <div style={{ fontSize: '0.85rem', color: '#444', fontFamily: '"PT Serif", serif' }}>{info.reports.offbeat}</div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Related' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {info.combos.map((combo, i) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'flex-start',
                                                    padding: '10px',
                                                    background: '#fcfcfc',
                                                    borderLeft: '4px solid #cd5c5c'
                                                }}>
                                                    <Layers size={16} color="#cd5c5c" style={{ marginTop: '2px' }} />
                                                    <div style={{ fontSize: '0.85rem', color: '#444', fontFamily: '"PT Serif", serif' }}>{combo}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                <div style={{
                                    marginTop: '5px',
                                    textAlign: 'right',
                                    fontSize: '0.7rem',
                                    fontFamily: '"Caveat", cursive',
                                    color: '#888',
                                    borderTop: '1px solid #eee',
                                    paddingTop: '8px'
                                }}>
                                    Verified: National Park Service HQ
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ParkCard;
