import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomerNav from '../../components/CustomerNav';
import { useAuth } from '../../components/AuthContext';
import { haversineKm, getUserLocation, reverseGeocode, forwardGeocode, RADIUS_KM } from '../../firebase/location';

const CATEGORIES = ['All', 'Bakery items', 'Meals / Rice', 'Snacks', 'Sweets & Desserts', 'Beverages', 'Breads', 'Biriyani', 'Seafood'];

const STOCK_EMOJI = {
  'Bakery items': '🥐', 'Meals / Rice': '🍛', 'Snacks': '🥨',
  'Sweets & Desserts': '🎂', 'Beverages': '☕', 'Breads': '🍞',
  'Biriyani': '🍚', 'Seafood': '🦐', default: '🍽️',
};

// Welcome popup
function WelcomePopup({ name, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '32px 24px 48px', width: '100%', maxWidth: 430, textAlign: 'center', animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Welcome, {name}!</div>
        <div style={{ fontSize: 14, color: '#6B6B68', lineHeight: 1.7, marginBottom: 24 }}>
          Ready to save food and money?<br />
          <span style={{ color: '#0F6E56', fontWeight: 700 }}>Let's find deals near you!</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {['🍞', '🍛', '🎂', '☕', '🥐'].map((e, i) => (
            <span key={i} style={{ fontSize: 26, display: 'inline-block', animation: `bounce 0.5s ${i * 0.1}s ease both` }}>{e}</span>
          ))}
        </div>
        <button onClick={onClose} style={{ background: '#EF9F27', color: 'white', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Find food near me 🚀
        </button>
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>
    </div>
  );
}

// Location picker
function LocationBar({ userLoc, onSet, onClear }) {
  const [state, setState] = useState('idle'); // idle | detecting | manual | searching
  const [query2, setQuery2] = useState('');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');

  const detect = async () => {
    setState('detecting');
    setErr('');
    try {
      const coords = await getUserLocation();
      const label = await reverseGeocode(coords.lat, coords.lng);
      onSet({ ...coords, label });
      setState('idle');
    } catch (e) {
      setErr(e.code === 1 ? 'Location permission denied. Please enter manually.' : 'Could not detect location.');
      setState('manual');
    }
  };

  const search = async (val) => {
    setQuery2(val);
    if (val.length < 3) { setResults([]); return; }
    const res = await forwardGeocode(val);
    setResults(res);
  };

  const pick = (r) => { onSet({ lat: r.lat, lng: r.lng, label: r.label }); setState('idle'); setQuery2(''); setResults([]); };

  if (userLoc) return (
    <div style={{ background: '#0F6E56', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 16 }}>📍</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{userLoc.label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Showing deals within {RADIUS_KM}km</div>
        </div>
      </div>
      <button onClick={onClear} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '5px 10px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
    </div>
  );

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #D3D1C7', padding: '14px', marginBottom: 12, boxShadow: '0 1px 3px rgba(44,44,42,0.08)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📍 Where are you?</div>
      <div style={{ fontSize: 12, color: '#6B6B68', marginBottom: 12 }}>We show deals within {RADIUS_KM}km of your location</div>
      {err && <div style={{ fontSize: 12, color: '#C94040', background: '#FCEAEA', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>{err}</div>}
      {state !== 'manual' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={detect} disabled={state === 'detecting'} style={{ flex: 1, background: '#0F6E56', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: state === 'detecting' ? 0.7 : 1 }}>
            {state === 'detecting' ? '📡 Detecting...' : '📍 Use my location'}
          </button>
          <button onClick={() => setState('manual')} style={{ flex: 1, background: '#F5F2EC', color: '#2C2C2A', border: '1.5px solid #D3D1C7', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✏️ Enter manually
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input value={query2} onChange={e => search(e.target.value)} placeholder="Type your city or area..." autoFocus
            style={{ width: '100%', border: '1.5px solid #0F6E56', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          {results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '0 0 10px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 200, overflowY: 'auto', border: '1px solid #E8E6DF' }}>
              {results.map((r, i) => (
                <div key={i} onClick={() => pick(r)} style={{ padding: '11px 14px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F5F2EC', display: 'flex', gap: 8, alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E8F5F1'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <span>📍</span><span>{r.label}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setState('idle'); setResults([]); }} style={{ marginTop: 8, background: 'none', border: 'none', fontSize: 13, color: '#6B6B68', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        </div>
      )}
    </div>
  );
}

export default function CustomerBrowse() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const { profile } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (profile?.isNewUser) setShowWelcome(true);
  }, [profile]);

  // Auto-detect location on first load
  useEffect(() => {
    const saved = sessionStorage.getItem('saver_location');
    if (saved) { setUserLoc(JSON.parse(saved)); return; }
    getUserLocation()
      .then(async coords => {
        const label = await reverseGeocode(coords.lat, coords.lng);
        const loc = { ...coords, label };
        setUserLoc(loc);
        sessionStorage.setItem('saver_location', JSON.stringify(loc));
      })
      .catch(() => {}); // Silent fail — show location bar
  }, []);

  const handleSetLoc = (loc) => {
    setUserLoc(loc);
    sessionStorage.setItem('saver_location', JSON.stringify(loc));
  };

  const handleClearLoc = () => {
    setUserLoc(null);
    sessionStorage.removeItem('saver_location');
  };

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.pickupTimestamp || 0) - (b.pickupTimestamp || 0));
      setListings(data);
    });
  }, []);

  const getDistance = useCallback((listing) => {
    if (!userLoc || !listing.lat || !listing.lng) return null;
    return haversineKm(userLoc.lat, userLoc.lng, listing.lat, listing.lng);
  }, [userLoc]);

  const filtered = listings
    .filter(l => {
      const matchCat = filter === 'All' || l.category === filter;
      const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.restaurantName?.toLowerCase().includes(search.toLowerCase());
      if (!matchCat || !matchSearch) return false;
      // Only filter by distance if listing has real coordinates
      if (userLoc && l.lat && l.lng) {
        const dist = haversineKm(userLoc.lat, userLoc.lng, l.lat, l.lng);
        return dist <= RADIUS_KM;
      }
      return true; // Show listings without coordinates (legacy)
    })
    .sort((a, b) => {
      if (userLoc) {
        const da = a.lat && a.lng ? haversineKm(userLoc.lat, userLoc.lng, a.lat, a.lng) : 999;
        const db2 = b.lat && b.lng ? haversineKm(userLoc.lat, userLoc.lng, b.lat, b.lng) : 999;
        return da - db2;
      }
      return 0;
    });

  const endingSoon = filtered.filter(l => l.pickupTimestamp && l.pickupTimestamp - Date.now() < 2 * 3600 * 1000).length;

  const urgencyPill = (l) => {
    const mins = l.pickupTimestamp ? Math.round((l.pickupTimestamp - Date.now()) / 60000) : 999;
    if (mins < 60) return <span className="pill pill-red">⏰ {mins}m left</span>;
    if (l.quantityLeft <= 2) return <span className="pill pill-red">Only {l.quantityLeft} left!</span>;
    if (l.discount >= 50) return <span className="pill pill-amber">🔥 Hot deal</span>;
    return <span className="pill pill-amber">{l.quantityLeft} left</span>;
  };

  const distPill = (l) => {
    const d = getDistance(l);
    if (d === null) return null;
    return <span className="pill pill-gray">{d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}</span>;
  };

  return (
    <>
      {showWelcome && <WelcomePopup name={profile?.name || 'Food Lover'} onClose={() => setShowWelcome(false)} />}

      <div className="topbar">
        <div>
          <div className="topbar-title">🍊 Saver</div>
          <div className="topbar-sub">Up to 60% off on local food</div>
        </div>
        <div style={{ fontSize: 22, cursor: 'pointer' }} onClick={() => nav('/map')}>🗺️</div>
      </div>

      <div className="content">
        <LocationBar userLoc={userLoc} onSet={handleSetLoc} onClear={handleClearLoc} />

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food, restaurant, bakery..." />
          {search && <span style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }} onClick={() => setSearch('')}>✕</span>}
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
              <div className="db-sub">{endingSoon} deal{endingSoon > 1 ? 's' : ''} closing in under 2 hours</div>
            </div>
            <span style={{ fontSize: 28 }}>🏃</span>
          </div>
        )}

        <div className="section-lbl">
          {filtered.length} deal{filtered.length !== 1 ? 's' : ''} {userLoc ? `within ${RADIUS_KM}km of ${userLoc.label}` : 'available now'}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🍽️</div>
            <h3>{userLoc ? 'No deals nearby' : 'No deals right now'}</h3>
            <p style={{ marginBottom: 16 }}>
              {userLoc ? `No listings within ${RADIUS_KM}km of ${userLoc.label}. Try a different location or check back later.` : 'Restaurants post deals throughout the day — check back soon!'}
            </p>
            {userLoc && (
              <button className="btn-outline" style={{ maxWidth: 280, margin: '0 auto' }}
                onClick={handleClearLoc}>
                Show all deals in India
              </button>
            )}
          </div>
        ) : (
          filtered.map(l => (
            <div className="food-card" key={l.id} onClick={() => nav(`/item/${l.id}`)}>
              <div className="food-emoji-box">
                {l.imageUrl ? <img src={l.imageUrl} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  : <span style={{ fontSize: 28 }}>{STOCK_EMOJI[l.category] || STOCK_EMOJI.default}</span>}
              </div>
              <div className="food-info">
                <div className="food-name">{l.name}</div>
                <div className="food-shop">{l.restaurantName} · {l.restaurantLocation}</div>
                <div className="food-tags">
                  <span className="pill pill-green">{l.discount}% off</span>
                  {urgencyPill(l)}
                  {distPill(l)}
                </div>
              </div>
              <div className="price-col">
                <div className="price-orig">₹{l.originalPrice}</div>
                <div className="price-new">₹{l.discountedPrice}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <CustomerNav />
    </>
  );
}
