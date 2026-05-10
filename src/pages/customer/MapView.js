import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomerNav from '../../components/CustomerNav';
import { getUserLocation, reverseGeocode, haversineKm, RADIUS_KM } from '../../firebase/location';

function timeLeft(ts) {
  const mins = Math.round((ts - Date.now()) / 60000);
  if (mins < 0) return 'Expired';
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function MapView() {
  const [listings, setListings] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [locStatus, setLocStatus] = useState('detecting');
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const circleRef = useRef(null);
  const nav = useNavigate();

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Get user location
  useEffect(() => {
    const saved = sessionStorage.getItem('saver_location');
    if (saved) {
      setUserLoc(JSON.parse(saved));
      setLocStatus('found');
      return;
    }
    getUserLocation()
      .then(async coords => {
        const label = await reverseGeocode(coords.lat, coords.lng);
        const loc = { ...coords, label };
        setUserLoc(loc);
        sessionStorage.setItem('saver_location', JSON.stringify(loc));
        setLocStatus('found');
      })
      .catch(() => setLocStatus('denied'));
  }, []);

  // Load listings
  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    return onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.lat && l.lng));
    });
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = window.L;
      const center = userLoc ? [userLoc.lat, userLoc.lng] : [20.5937, 78.9629]; // India center
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, userLoc ? 14 : 5);

      // Better map tiles — CartoDB Positron (clean, like Ola/Uber)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Zoom controls — bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      leafletMap.current = map;
      setMapReady(true);
    };
    document.body.appendChild(script);
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  // Add user location marker + radius circle
  useEffect(() => {
    if (!mapReady || !userLoc || !leafletMap.current) return;
    const L = window.L;

    // Remove old
    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (circleRef.current) circleRef.current.remove();

    // Pulsing user dot (like Uber)
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:20px;height:20px">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(29,158,117,0.3);animation:pulse 2s infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:#1D9E75;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    userMarkerRef.current = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(leafletMap.current);

    // 10km radius circle
    circleRef.current = L.circle([userLoc.lat, userLoc.lng], {
      radius: RADIUS_KM * 1000,
      color: '#0F6E56',
      fillColor: '#0F6E56',
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: '6 4',
    }).addTo(leafletMap.current);

    // Pan to user
    leafletMap.current.setView([userLoc.lat, userLoc.lng], 14, { animate: true });
  }, [mapReady, userLoc]);

  // Add listing markers
  useEffect(() => {
    if (!mapReady || !leafletMap.current) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    listings.forEach(listing => {
      const dist = userLoc ? haversineKm(userLoc.lat, userLoc.lng, listing.lat, listing.lng) : null;
      const mins = listing.pickupTimestamp ? Math.round((listing.pickupTimestamp - Date.now()) / 60000) : 999;
      const color = mins < 60 ? '#C94040' : listing.quantityLeft <= 2 ? '#EF9F27' : '#0F6E56';
      const emoji = listing.emoji || '🍽️';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          position:relative;
          display:flex;flex-direction:column;align-items:center;
        ">
          <div style="
            background:${color};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            width:40px;height:40px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 3px 10px rgba(0,0,0,0.25);
            border:2.5px solid white;
          ">
            <span style="transform:rotate(45deg);font-size:18px;line-height:1">${emoji}</span>
          </div>
          <div style="
            background:${color};color:white;
            font-size:10px;font-weight:700;
            padding:2px 6px;border-radius:10px;
            margin-top:2px;white-space:nowrap;
            box-shadow:0 1px 4px rgba(0,0,0,0.2);
            font-family:sans-serif;
          ">₹${listing.discountedPrice} · ${listing.discount}%</div>
        </div>`,
        iconSize: [40, 56],
        iconAnchor: [20, 56],
        popupAnchor: [0, -56],
      });

      const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(leafletMap.current);
      marker.on('click', () => setSelected({ ...listing, dist }));
      markersRef.current.push(marker);
    });

    // Add pulse animation CSS
    if (!document.getElementById('map-pulse-css')) {
      const style = document.createElement('style');
      style.id = 'map-pulse-css';
      style.textContent = `@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(2.5);opacity:0} }`;
      document.head.appendChild(style);
    }
  }, [listings, mapReady, userLoc]);

  const openDirections = (listing) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const nearbyCount = userLoc ? listings.filter(l => l.lat && l.lng && haversineKm(userLoc.lat, userLoc.lng, l.lat, l.lng) <= RADIUS_KM).length : listings.length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Deals map</div>
          <div className="topbar-sub">
            {locStatus === 'detecting' ? 'Getting your location...' :
              locStatus === 'found' ? `${nearbyCount} deals within ${RADIUS_KM}km · ${userLoc?.label}` :
                'Allow location for nearby deals'}
          </div>
        </div>
        <button onClick={() => { if (userLoc && leafletMap.current) leafletMap.current.setView([userLoc.lat, userLoc.lng], 14, { animate: true }); }}
          style={{ background: 'var(--green-bg)', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: 'var(--green)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          📍 Me
        </button>
      </div>

      {/* Legend */}
      <div style={{ background: 'white', padding: '8px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 16, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
        <span><span style={{ color: '#0F6E56' }}>●</span> Available</span>
        <span><span style={{ color: '#EF9F27' }}>●</span> Few left</span>
        <span><span style={{ color: '#C94040' }}>●</span> Ending soon</span>
        <span><span style={{ color: '#1D9E75' }}>●</span> You</span>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height: 'calc(100vh - 160px)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {!mapReady && (
          <div style={{ position: 'absolute', inset: 0, background: '#F5F2EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div className="spinner" style={{ margin: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading map...</span>
          </div>
        )}

        {/* Selected listing card */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 16, left: 12, right: 12, zIndex: 1000,
            background: 'white', borderRadius: 16, padding: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid var(--border-light)',
            animation: 'slideUp 0.3s ease',
          }}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                {selected.emoji || '🍽️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{selected.restaurantName}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="pill pill-green">{selected.discount}% off</span>
                  <span className="pill pill-amber">{timeLeft(selected.pickupTimestamp)}</span>
                  {selected.dist !== null && <span className="pill pill-gray">{selected.dist < 1 ? `${Math.round(selected.dist * 1000)}m` : `${selected.dist?.toFixed(1)}km`}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{selected.originalPrice}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber)' }}>₹{selected.discountedPrice}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => openDirections(selected)} style={{ flex: 1, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-primary)' }}>
                🗺️ Directions
              </button>
              <button onClick={() => nav(`/item/${selected.id}`)} style={{ flex: 2, background: 'var(--amber-light)', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', color: 'white' }}>
                Grab now — ₹{selected.discountedPrice} →
              </button>
            </div>
          </div>
        )}

        {/* Location denied banner */}
        {locStatus === 'denied' && !selected && (
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000, background: 'white', borderRadius: 12, padding: '12px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            📍 Allow location to see deals near you<br />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>All India listings are shown</span>
          </div>
        )}
      </div>

      <CustomerNav />
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </>
  );
}
