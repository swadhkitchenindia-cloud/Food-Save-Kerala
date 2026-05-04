import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomerNav from '../../components/CustomerNav';
import { useAuth } from '../../components/AuthContext';
import { requestNotificationPermission } from '../../firebase/notifications';

const CATEGORIES = ['All', 'Bakery items', 'Meals / Rice', 'Snacks', 'Sweets & Desserts', 'Beverages', 'Breads', 'Biriyani', 'Seafood'];
const RADIUS_KM = 25;

const KERALA_AREAS = [
  'Kochi', 'Ernakulam', 'MG Road', 'Vytilla', 'Edapally', 'Palarivattom',
  'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha',
  'Palakkad', 'Kannur', 'Malappuram', 'Wayanad', 'Kottayam', 'Kakkanad',
  'Fort Kochi', 'Aluva', 'Perumbavoor', 'Muvattupuzha', 'Chalakudy',
];

const COORDS = {
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
  'kottayam': [9.5916, 76.5222], 'aluva': [10.1004, 76.3570],
  'chalakudy': [10.3007, 76.3316], 'perumbavoor': [10.1071, 76.4769],
};

function getCoords(location) {
  if (!location) return null;
  const low = location.toLowerCase();
  for (const [k, v] of Object.entries(COORDS)) {
    if (low.includes(k)) return v;
  }
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Welcome popup component
function WelcomePopup({ name, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--white)', borderRadius: '24px 24px 0 0',
        padding: '32px 24px 40px', width: '100%', maxWidth: 430,
        textAlign: 'center',
        animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Welcome, {name}! 👋
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          Ready to save food and money?<br />
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>Let's rescue some delicious deals!</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {['🍞', '🍛', '🎂', '☕', '🥐'].map((e, i) => (
            <span key={i} style={{ fontSize: 24, animation: `bounce 0.5s ${i * 0.1}s ease both` }}>{e}</span>
          ))}
        </div>
        <button className="btn-primary" onClick={onClose}>Start exploring 🚀</button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}

// Location picker component
function LocationPicker({ userLocation, onLocationSet }) {
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) { setShowManual(true); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.village || '';
          const city = data.address?.city || data.address?.town || data.address?.county || 'Kerala';
          const label = suburb ? `${suburb}, ${city}` : city;
          onLocationSet({ lat, lng, label, auto: true });
        } catch {
          onLocationSet({ lat, lng, label: 'Current location', auto: true });
        }
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        if (err.code === 1) alert('Location permission denied. Please enter your area manually.');
        setShowManual(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleManualInput = (val) => {
    setManualInput(val);
    if (val.length > 1) {
      setSuggestions(KERALA_AREAS.filter(a => a.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectArea = (area) => {
    const coords = getCoords(area);
    if (coords) onLocationSet({ lat: coords[0], lng: coords[1], label: area, auto: false });
    setManualInput('');
    setSuggestions([]);
    setShowManual(false);
  };

  if (userLocation) return null;

  return (
    <div style={{ background: 'var(--green)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>📍 Where are you?</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
        We'll show deals within {RADIUS_KM}km of your location
      </div>
      {!showManual ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={detectLocation} disabled={detecting} style={{ flex: 1, background: 'white', color: 'var(--green)', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {detecting ? 'Detecting...' : '📍 Use my location'}
          </button>
          <button onClick={() => setShowManual(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✏️ Enter manually
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            value={manualInput} onChange={e => handleManualInput(e.target.value)}
            placeholder="Type your area e.g. Vytilla, Kochi..."
            autoFocus
            style={{ width: '100%', borderRadius: 8, border: 'none', padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '0 0 10px 10px', overflow: 'hidden', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {suggestions.map(s => (
                <div key={s} onClick={() => selectArea(s)} style={{ padding: '11px 14px', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerBrowse() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const { profile } = useAuth();
  const nav = useNavigate();

  // Show welcome popup for new users
  useEffect(() => {
    if (profile?.isNewUser) {
      setShowWelcome(true);
    }
  }, [profile]);

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.pickupTimestamp - b.pickupTimestamp);
      setListings(data);
    });
  }, []);

  const getDistance = useCallback((listing) => {
    if (!userLocation) return null;
    const coords = getCoords(listing.restaurantLocation);
    if (!coords) return null;
    return haversineKm(userLocation.lat, userLocation.lng, coords[0], coords[1]);
  }, [userLocation]);

  const filtered = listings.filter(l => {
    const matchCat = filter === 'All' || l.category === filter;
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.restaurantName?.toLowerCase().includes(search.toLowerCase());
    // Location filter: if user has set location, filter by 25km radius
    if (userLocation) {
      const dist = getDistance(l);
      if (dist !== null && dist > RADIUS_KM) return false;
    }
    return matchCat && matchSearch;
  }).sort((a, b) => {
    // Sort by distance if location is set
    if (userLocation) {
      const da = getDistance(a) ?? 999;
      const db2 = getDistance(b) ?? 999;
      return da - db2;
    }
    return 0;
  });

  const endingSoon = filtered.filter(l => l.pickupTimestamp - Date.now() < 2 * 3600 * 1000).length;

  const urgencyPill = (l) => {
    const mins = Math.round((l.pickupTimestamp - Date.now()) / 60000);
    if (mins < 60) return <span className="pill pill-red">Ends in {mins}m</span>;
    if (l.quantityLeft <= 2) return <span className="pill pill-red">Only {l.quantityLeft} left</span>;
    if (l.discount >= 50) return <span className="pill pill-amber">🔥 Hot deal</span>;
    return <span className="pill pill-amber">{l.quantityLeft} left</span>;
  };

  const distancePill = (l) => {
    if (!userLocation) return null;
    const dist = getDistance(l);
    if (dist === null) return null;
    return <span className="pill pill-gray">{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</span>;
  };

  // Category stock images
  const STOCK_IMAGES = {
    'Bakery items': '🥐', 'Meals / Rice': '🍛', 'Snacks': '🥨',
    'Sweets & Desserts': '🎂', 'Beverages': '☕', 'Breads': '🍞',
    'Biriyani': '🍚', 'Seafood': '🦐', 'default': '🍽️',
  };

  return (
    <>
      {showWelcome && <WelcomePopup name={profile?.name || 'Food Lover'} onClose={() => setShowWelcome(false)} />}

      <div className="topbar">
        <div>
          <div className="topbar-title">Deals near you</div>
          <div className="topbar-sub" style={{ cursor: userLocation ? 'pointer' : 'default' }} onClick={() => setUserLocation(null)}>
            {userLocation ? `📍 ${userLocation.label} · ${RADIUS_KM}km radius` : '📍 Set your location'}
          </div>
        </div>
        <div style={{ fontSize: 22, cursor: 'pointer' }}>🔔</div>
      </div>

      <div className="content">
        <LocationPicker userLocation={userLocation} onLocationSet={setUserLocation} />

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search food, bakery, cafe..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <span style={{ cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</span>}
        </div>

        <div className="chips">
          {CATEGORIES.map(c => (
            <div key={c} className={`chip${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>{c}</div>
          ))}
        </div>

        {endingSoon > 0 && (
          <div className="deal-banner">
            <div>
              <div className="db-title">⏰ Ending soon!</div>
              <div className="db-sub">{endingSoon} deal{endingSoon > 1 ? 's' : ''} expiring in the next 2 hours</div>
            </div>
            <div style={{ fontSize: 28 }}>🏃</div>
          </div>
        )}

        <div className="section-lbl">
          {filtered.length} deal{filtered.length !== 1 ? 's' : ''} {userLocation ? `within ${RADIUS_KM}km` : 'available'}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">🍽️</div>
            <h3>{userLocation ? 'No deals nearby' : 'No deals right now'}</h3>
            <p>{userLocation
              ? `No listings within ${RADIUS_KM}km of ${userLocation.label}. Try a different location or check back later.`
              : 'Check back soon — restaurants post new deals throughout the day!'
            }</p>
            {userLocation && <button className="btn-outline" style={{ marginTop: 12 }} onClick={() => setUserLocation(null)}>Show all Kerala deals</button>}
          </div>
        )}

        {filtered.map(l => (
          <div className="food-card" key={l.id} onClick={() => nav(`/customer/item/${l.id}`)}>
            <div className="food-emoji-box" style={{ background: l.imageUrl ? 'transparent' : 'var(--gray)', overflow: 'hidden' }}>
              {l.imageUrl
                ? <img src={l.imageUrl} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                : <span style={{ fontSize: 28 }}>{STOCK_IMAGES[l.category] || STOCK_IMAGES.default}</span>
              }
            </div>
            <div className="food-info">
              <div className="food-name">{l.name}</div>
              <div className="food-shop">{l.restaurantName} · {l.restaurantLocation}</div>
              <div className="food-tags">
                <span className="pill pill-green">{l.discount}% off</span>
                {urgencyPill(l)}
                {distancePill(l)}
              </div>
            </div>
            <div className="price-col">
              <div className="price-orig">₹{l.originalPrice}</div>
              <div className="price-new">₹{l.discountedPrice}</div>
            </div>
          </div>
        ))}
      </div>
      <CustomerNav />
    </>
  );
}
