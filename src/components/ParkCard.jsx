import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, MapPin, TrendingUp, Info, ShieldCheck, Plane, MessageSquare, Layers, Baby, Dog, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { NPS_API_KEY, NPS_BASE_URL } from '../config/npsConfig';

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

const ACTIVITY_ICON_MAP = {
    'Hiking': 'hiking',
    'Camping': 'camping',
    'Climbing': 'climbing',
    'Biking': 'biking',
    'Fishing': 'fishing',
    'Boating': 'boating-permit',
    'Swimming': 'swimming',
    'Wildlife Watching': 'birding-wildlife-viewing',
    'Photography': 'photography',
    'Stargazing': 'star-gazing',
    'Junior Ranger Program': 'junior-ranger',
    'Visitor Center': 'information',
    'Birdwatching': 'birding-wildlife-viewing',
    'Horseback Riding': 'horseback-riding',
    'Backcountry Camping': 'backcountry-camping'
};

const ParkCard = ({ park, isSelected, onClick, activeStyle, viewMode }) => {
    const [npsData, setNpsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Summary');
    const visitorData = useMemo(() => generateVisitorData(), []);

    const dummyInfo = {
        summary: {
            elevation: "1,200 - 13,000 ft",
            peakSeason: "June - September",
            weather: "Varies by elevation, alpine conditions above 8,000 ft.",
            states: park.location
        },
        specs: [
            { icon: 'strollers', label: "Kid Friendly", status: "YES" },
            { icon: 'pets-on-leash', label: "Pet Friendly", status: "LEASHED" },
            { icon: 'climbing', label: "Beginner Friendly", status: "MODERATE" },
            { icon: 'backcountry-camping', label: "Permits Required", status: "BACKCOUNTRY" }
        ],
        logistics: [
            { icon: 'airport', label: 'AIRPORT', value: "International Airport (4h drive)" },
            { icon: 'automobiles', label: 'TRANSPORT', value: "Rental Car highly recommended. No shuttle system." },
            { icon: 'lodging', label: 'STAY', value: "Lodges, Backcountry camping, Nearby hotels." }
        ],
        reports: {
            reddit: "Avoid the main vista at sunset, head to the secret overlook instead.",
            google: "Must visit the breakfast spot just outside the south entrance.",
            offbeat: "The hidden cave behind the waterfall is worth the scramble."
        },
        combos: [
            "Combine with Great Sand Dunes for a desert-to-mountain tour.",
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
            {viewMode === 'ranked' && (
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: '#cd5c5c',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.9rem',
                    fontFamily: '"PT Sans Narrow", sans-serif',
                    fontWeight: 'bold',
                    zIndex: 2
                }}>
                    SC {composite}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingRight: viewMode === 'ranked' ? '60px' : '0' }}>
                <Mountain
                    size={16}
                    strokeWidth={isSelected ? 2.5 : 2}
                    color={isSelected ? '#cd5c5c' : '#888'}
                />
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

            {viewMode === 'ranked' && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '4px 12px',
                        fontSize: '0.65rem',
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
                                    {['Summary', 'Specs', 'Logistics', 'Reports', 'Combos'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
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
                                            {/* --- HIGHLIGHT TAGS --- */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {npsData?.activities?.slice(0, 4).map((act, i) => {
                                                    const iconName = ACTIVITY_ICON_MAP[act.name];
                                                    return (
                                                        <span key={i} style={{
                                                            fontSize: '0.6rem',
                                                            background: '#f0f0f0',
                                                            color: '#666',
                                                            padding: '4px 10px',
                                                            borderRadius: '2px',
                                                            fontFamily: '"PT Sans Narrow", sans-serif',
                                                            fontWeight: 'bold',
                                                            letterSpacing: '0.5px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            border: '1px solid #e0e0e0'
                                                        }}>
                                                            {iconName && (
                                                                <img
                                                                    src={getNPSIcon(iconName)}
                                                                    alt=""
                                                                    style={{ width: '14px', height: '14px', opacity: 0.7 }}
                                                                />
                                                            )}
                                                            {act.name.toUpperCase()}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            <div style={{
                                                fontSize: '1.25rem',
                                                color: '#444',
                                                lineHeight: '1.4',
                                                fontFamily: '"Caveat", cursive',
                                                background: '#fcfaf2',
                                                padding: '12px',
                                                borderLeft: '3px solid #e6e2d3'
                                            }}>
                                                {npsData?.description || park.description}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontFamily: '"PT Sans Narrow", sans-serif' }}>
                                                <div style={{ background: '#f5f5f5', padding: '8px' }}>
                                                    <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: '#999', fontWeight: 'bold' }}>ELEVATION</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#333' }}>{dummyInfo.summary.elevation}</div>
                                                </div>
                                                <div style={{ background: '#f5f5f5', padding: '8px' }}>
                                                    <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: '#999', fontWeight: 'bold' }}>PEAK SEASON</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#333' }}>{dummyInfo.summary.peakSeason}</div>
                                                </div>
                                            </div>

                                            {/* --- MOVED SPECS CARDS HERE --- */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {dummyInfo.specs.map((spec, i) => (
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

                                    {activeTab === 'Specs' && (
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

                                    {activeTab === 'Logistics' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {dummyInfo.logistics.map((item, i) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    gap: '12px',
                                                    background: '#fcfcfc',
                                                    padding: '10px',
                                                    border: '1px solid #eee'
                                                }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        opacity: 0.6
                                                    }}>
                                                        <img
                                                            src={getNPSIcon(item.icon)}
                                                            alt=""
                                                            style={{ width: '100%', height: '100%' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.6rem', color: '#999', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>{item.label}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#333', fontFamily: '"PT Serif", serif', fontStyle: 'italic' }}>{item.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'Reports' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ background: '#fff5f5', padding: '12px', border: '1px dashed #cd5c5c' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <MessageSquare size={12} color="#cd5c5c" />
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#cd5c5c', letterSpacing: '1px' }}>REDDIT INTEL</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#444', fontStyle: 'italic', fontFamily: '"PT Serif", serif' }}>"{dummyInfo.reports.reddit}"</div>
                                            </div>
                                            <div style={{ background: '#fcfcfc', padding: '12px', border: '1px solid #eee' }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#666', letterSpacing: '1px', marginBottom: '6px' }}>OFFBEAT GEM</div>
                                                <div style={{ fontSize: '0.85rem', color: '#444', fontFamily: '"PT Serif", serif' }}>{dummyInfo.reports.offbeat}</div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Combos' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {dummyInfo.combos.map((combo, i) => (
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
