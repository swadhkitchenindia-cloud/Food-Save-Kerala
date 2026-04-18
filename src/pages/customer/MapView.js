import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomerNav from '../../components/CustomerNav';

// Kerala district coordinates for geocoding restaurant locations
const KERALA_LOCATIONS = {
  'kochi': [9.9312, 76.2673], 'ernakulam': [9.9816, 76.2999],
  'mg road': [9.9312, 76.2673], 'vytilla': [9.9499, 76.3069],
  'edapally': [10.0209, 76.3088], 'palarivattom': [9.9874, 76.2927],
  'kakkanad': [10.0159, 76.3419], 'fort kochi': [9.9658, 76.2421],
  'thiruvananthapuram': [8.5241, 76.9366], 'trivandrum': [8.5241, 76.9366],
  'kozhikode': [11.2588, 75.7804], 'calicut': [11.2588, 75.7804],
  'thrissur': [10.5276, 76.2144], 'kollam': [8.8932, 76.6141],
  'alappuzha': [9.4981, 76.3388], 'alleppey': [9.4981, 76.3388],
  'palakkad': [10.7867, 76.6548], 'kannur': [11.8745, 75.3704],
  'malappuram': [11.0730, 76.0740], 'wayanad': [11.6854, 76.1320],
  'pathanamthitta': [9.2648, 76.7870], 'idukki': [9.9189, 77.1025],
  'kasaragod': [12.4996, 74.9869], 'kottayam': [9.5916, 76.5222],
  'default': [10.1632, 76.6413],
};

function guessCoords(location) {
  if (!location) return [...KERALA_LOCATIONS['default']];
  const low = location.toLowerCase();
  for (const [key, coords] of Object.entries(KERALA_LOCATIONS)) {
    if (low.includes(key)) return [...coords];
  }
  // Add small random offset so pins don't stack
  const base = [...KERALA_LOCATIONS['default']];
  return [base[0] + (Math.random() - 0.5) * 0.3, base[1] + (Math.random() - 0.5) * 0.3];
}

function getPinColor(listing) {
  const mins = (listing.pickupTimestamp - Date.now()) / 60000;
  if (mins < 60 || listing.quantityLeft <= 1) return '#E24B4A';
  if (listing.quantityLeft <= 3 || listing.discount >= 50) return '#EF9F27';
  return '#0F6E56';
}

export default function MapView() {
  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
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

  // Load listings
  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    return onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
        .setView([10.1632, 76.6413], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      leafletMap.current = map;
      setMapReady(true);
    };
    document.body.appendChild(script);
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  // Add/update markers when listings or map changes
  useEffect(() => {
    if (!mapReady || !leafletMap.current) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    listings.forEach(listing => {
      const [lat, lng] = guessCoords(listing.restaurantLocation);
      const color = getPinColor(listing);
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color};color:white;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;
          font-size:16px;
        "><span style="transform:rotate(45deg)">${listing.emoji || '🍽️'}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(leafletMap.current);
      marker.on('click', () => setSelected(listing));
      markersRef.current.push(marker);
    });
  }, [listings, mapReady]);

  const timeLeft = (l) => {
    const mins = Math.round((l.pickupTimestamp - Date.now()) / 60000);
    if (mins < 60) return `${mins}m left`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Map view</div>
          <div className="topbar-sub">{listings.length} active deals in Kerala</div>
        </div>
      </div>

      {/* Map legend */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 16px', background: 'var(--white)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)' }}>
        <span><span style={{ color: '#0F6E56' }}>●</span> Available</span>
        <span><span style={{ color: '#EF9F27' }}>●</span> Few left / Hot deal</span>
        <span><span style={{ color: '#E24B4A' }}>●</span> Ending soon</span>
      </div>

      {/* Map container */}
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)', width: '100%' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {!mapReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f4', flexDirection: 'column', gap: 12 }}>
            <div className="spinner" style={{ margin: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading map...</span>
          </div>
        )}

        {/* Selected listing popup */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000,
            background: 'var(--white)', borderRadius: 16, padding: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1px solid var(--border)',
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{ fontSize: 32, width: 52, height: 52, background: 'var(--gray)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selected.emoji || '🍽️'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{selected.restaurantName}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="pill pill-green">{selected.discount}% off</span>
                <span className="pill pill-amber">{timeLeft(selected)}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{selected.originalPrice}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>₹{selected.discountedPrice}</div>
              <button onClick={() => nav(`/customer/item/${selected.id}`)} style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Reserve →
              </button>
            </div>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
          </div>
        )}
      </div>

      <CustomerNav />
    </>
  );
}
