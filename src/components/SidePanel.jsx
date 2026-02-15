import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NPS_API_KEY, NPS_BASE_URL } from '../config/npsConfig';
import './SidePanel.css';

const SidePanel = ({ feature, onClose, activeStyle, embedded }) => {
    const [npsData, setNpsData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    const parkCode = feature?.properties?.parkCode;

    useEffect(() => {
        if (!parkCode) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch basic park info and alerts in parallel
                const [parkRes, alertsRes] = await Promise.all([
                    fetch(`${NPS_BASE_URL}/parks?parkCode=${parkCode}&api_key=${NPS_API_KEY}`),
                    fetch(`${NPS_BASE_URL}/alerts?parkCode=${parkCode}&api_key=${NPS_API_KEY}`)
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
    }, [parkCode]);

    if (!feature) return null;

    let themeClass = activeStyle === 'american-memory' ? 'american-panel' : 'oil-panel';
    if (embedded) themeClass += ' embedded';

    const name = feature.properties.name || feature.properties.name_en || "UNNAMED_PEAK";
    // Check if it's actually a peak, otherwise fallback to generic land feature
    const isPeak = (feature.properties.class === 'peak') || (feature.properties.type === 'peak') || (feature.properties.ele !== undefined);
    const type = isPeak ? "MOUNTAIN SUMMIT" : "SURVEY POINT";

    // Memoize random stats to prevent flickering on re-renders
    const stats = useMemo(() => {
        const realElevation = feature.properties.ele;
        const elev = realElevation ? `${realElevation} M` : `${Math.floor(Math.random() * 3000) + 2000} M`;

        return {
            elevation: elev,
            prominence: Math.floor(Math.random() * 800) + 100,
            firstAscent: 1850 + Math.floor(Math.random() * 120),
            difficulty: ["Class 3 Scramble", "Technical Alpine", "Walk-up", "Extreme Expedition"][Math.floor(Math.random() * 4)],
            resourceId: `PK-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
        };
    }, [feature.id, feature.properties.ele]); // Recalculate if ID or elevation changes

    // Atlas-style coordinates formatting
    const lat = feature.geometry?.coordinates?.[1];
    const lng = feature.geometry?.coordinates?.[0];
    const latDMS = lat ? `${Math.abs(Math.floor(lat))}° ${Math.floor((Math.abs(lat) % 1) * 60)}' N` : 'N/A';
    const lngDMS = lng ? `${Math.abs(Math.floor(lng))}° ${Math.floor((Math.abs(lng) % 1) * 60)}' W` : 'N/A';

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={feature.properties.name}
                className={themeClass}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: '100%', overflowY: 'auto' }}
            >
                {/* --- BACK NAVIGATION --- */}
                <div
                    onClick={onClose}
                    style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        fontFamily: '"PT Sans Narrow", sans-serif',
                        color: '#666',
                        background: '#f5f5f5',
                        borderBottom: '1px solid #ddd',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#cd5c5c';
                        e.currentTarget.style.background = '#eee';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#666';
                        e.currentTarget.style.background = '#f5f5f5';
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>←</span> BACK TO LIST
                </div>

                {loading && (
                    <div style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', opacity: 0.6 }}>
                        Retrieving satellite data...
                    </div>
                )}

                {/* --- LIVE ALERTS BLOCK --- */}
                {!loading && alerts.length > 0 && (
                    <div style={{
                        background: '#fff3cd',
                        padding: '10px 20px',
                        borderBottom: '1px solid #ffeeba',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                    }}>
                        {alerts.slice(0, 2).map((alert, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: '#856404', display: 'flex', gap: '5px' }}>
                                <span>⚠️</span>
                                <span style={{ fontWeight: 'bold' }}>{alert.title}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- HEADER BLOCK --- */}
                <div className={`${themeClass}-header`}>
                    <div className="oil-header-meta">
                        <span>SURVEY SECTOR 0{Math.floor(Math.random() * 9)}</span>
                        <span className="oil-id-badge">{stats.resourceId}</span>
                    </div>
                    <div className={`${themeClass}-title`}>
                        {name}
                    </div>
                    <div className="oil-subtitle">
                        {npsData?.designation || type.toUpperCase()} • {stats.elevation}
                    </div>
                </div>

                <div className={`${themeClass}-content`}>

                    {/* --- GEOSPATIAL DATA --- */}
                    <div className={`${themeClass}-section`}>
                        <div className="oil-divider-title">GEODETIC REFERENCE</div>
                        <div className={`${themeClass}-grid primary-grid`}>
                            <div className={`${themeClass}-stat`}>
                                <span>LATITUDE</span>
                                <b>{latDMS}</b>
                            </div>
                            <div className={`${themeClass}-stat`}>
                                <span>LONGITUDE</span>
                                <b>{lngDMS}</b>
                            </div>
                            <div className={`${themeClass}-stat`}>
                                <span>ELEVATION</span>
                                <b>{stats.elevation}</b>
                            </div>
                            <div className={`${themeClass}-stat`}>
                                <span>PROMINENCE</span>
                                <b>{stats.prominence} M</b>
                            </div>
                        </div>
                    </div>

                    {/* --- GEOLOGICAL ANALYSIS --- */}
                    <div className={`${themeClass}-section`}>
                        <div className="oil-divider-title">GEOLOGICAL SURVEY</div>
                        <div className="oil-report-block">
                            <div className="oil-report-row">
                                <span className="oil-icon">⛰</span>
                                <div className="oil-report-detail">
                                    <span className="label">TERRAIN CLASS</span>
                                    <span className="value">{stats.difficulty}</span>
                                </div>
                            </div>
                            <div className="oil-report-row">
                                <span className="oil-icon">⛏</span>
                                <div className="oil-report-detail">
                                    <span className="label">FIRST ASCENT</span>
                                    <span className="value">{stats.firstAscent}</span>
                                </div>
                            </div>
                            <div className="oil-report-row">
                                <span className="oil-icon">❄</span>
                                <div className="oil-report-detail">
                                    <span className="label">GLACIAL STATUS</span>
                                    <span className="value">{Math.random() > 0.5 ? "Active Recession" : "Stable Ice Cap"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- FIELD NOTES / LEGEND --- */}
                    <div className={`${themeClass}-section`}>
                        <div className="oil-divider-title">CARTOGRAPHIC KEY</div>
                        <div className="oil-legend-compact">
                            <div className="legend-pair">
                                <span className="dot" style={{ background: '#cd5c5c' }}></span>
                                <span>Major Peak</span>
                            </div>
                            <div className="legend-pair">
                                <span className="dot" style={{ background: '#a5d6e6' }}></span>
                                <span>Glacial Runoff</span>
                            </div>
                            <div className="legend-pair">
                                <span className="dot" style={{ border: '1px dashed #666' }}></span>
                                <span>Ridge Line</span>
                            </div>
                            <div className="legend-pair">
                                <span className="dot" style={{ background: '#2c2c2c' }}></span>
                                <span>Base Camp</span>
                            </div>
                        </div>
                        <div className="oil-narrative">
                            <p style={{ lineHeight: '1.5' }}>
                                <strong>FIELD LOG:</strong> {npsData?.description || "Survey region exhibits signs of heavy erosion. Survey team noted potential unmapped ridgelines to the North-East."}
                            </p>
                        </div>
                    </div>

                    {/* --- FOOTER --- */}
                    <div className={`${themeClass}-footer`}>
                        <div className="oil-signature">
                            APPROVED BY: <span style={{ fontFamily: 'cursive' }}>National Park Service</span>
                        </div>
                        <div className="oil-timestamp">
                            {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const MemoizedSidePanel = React.memo(SidePanel);
export default MemoizedSidePanel;
