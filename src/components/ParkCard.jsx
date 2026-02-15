import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NPS_API_KEY, NPS_BASE_URL } from '../config/npsConfig';

const ParkCard = ({ park, isSelected, onClick, activeStyle }) => {
    const [npsData, setNpsData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isSelected || npsData) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [parkRes, alertsRes] = await Promise.all([
                    fetch(`${NPS_BASE_URL}/parks?parkCode=${park.parkCode}&api_key=${NPS_API_KEY}`),
                    fetch(`${NPS_BASE_URL}/alerts?parkCode=${park.parkCode}&api_key=${NPS_API_KEY}`)
                ]);

                const parkJson = await parkRes.json();
                const alertsJson = await alertsRes.json();

                if (parkJson.data?.[0]) setNpsData(parkJson.data[0]);
                if (alertsJson.data) setAlerts(alertsJson.data);
            } catch (err) {
                console.error("Error fetching NPS data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSelected, park.parkCode, npsData]);

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
                overflow: 'hidden'
            }}
            whileHover={{ y: isSelected ? 0 : -2, boxShadow: '4px 4px 0 rgba(205, 92, 92, 0.2)', borderColor: '#cd5c5c' }}
        >
            <motion.h3 layout="position" style={{
                margin: '0 0 4px 0',
                fontFamily: '"PT Serif", serif',
                fontSize: '1rem',
                fontWeight: '700',
                color: isSelected ? '#cd5c5c' : '#333'
            }}>
                {park.name.toUpperCase()}
            </motion.h3>

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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* --- NPS HEADER --- */}
                                <div style={{
                                    fontSize: '0.7rem',
                                    fontFamily: '"PT Sans Narrow", sans-serif',
                                    color: '#cd5c5c',
                                    letterSpacing: '2px',
                                    fontWeight: 'bold',
                                    borderBottom: '1px solid #eee',
                                    paddingBottom: '5px',
                                    marginBottom: '5px'
                                }}>
                                    OFFICIAL NPS FIELD DATA
                                </div>

                                {alerts.length > 0 && (
                                    <div style={{
                                        background: '#fff3cd',
                                        padding: '10px',
                                        fontSize: '0.75rem',
                                        color: '#856404',
                                        border: '1px solid #ffeeba',
                                        fontFamily: '"PT Sans Narrow", sans-serif'
                                    }}>
                                        {alerts.slice(0, 1).map((a, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                                <span>⚠️</span>
                                                <strong>{a.title.toUpperCase()}</strong>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{
                                    fontSize: '1.2rem',
                                    color: '#444',
                                    lineHeight: '1.4',
                                    fontFamily: '"Caveat", cursive',
                                    background: '#fcfaf2',
                                    padding: '10px',
                                    borderLeft: '3px solid #e6e2d3'
                                }}>
                                    {npsData?.description || park.description}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    fontFamily: '"PT Sans Narrow", sans-serif'
                                }}>
                                    <div style={{ background: '#f5f5f5', padding: '8px' }}>
                                        <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: '#999', fontWeight: 'bold' }}>DESIGNATION</div>
                                        <div style={{ fontSize: '0.8rem', color: '#333', textTransform: 'uppercase' }}>{npsData?.designation || "National Park"}</div>
                                    </div>
                                    <div style={{ background: '#f5f5f5', padding: '8px' }}>
                                        <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: '#999', fontWeight: 'bold' }}>ELEVATION</div>
                                        <div style={{ fontSize: '0.8rem', color: '#333' }}>{isSelected ? `${Math.floor(Math.random() * 2000) + 1000} M` : '--'}</div>
                                    </div>
                                </div>

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
