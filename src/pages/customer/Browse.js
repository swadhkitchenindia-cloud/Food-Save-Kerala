import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomerNav from '../../components/CustomerNav';

const CATEGORIES = ['All', 'Bakery items', 'Meals / Rice', 'Snacks', 'Sweets & Desserts', 'Beverages', 'Breads', 'Biriyani', 'Seafood'];

export default function CustomerBrowse() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.pickupTimestamp - b.pickupTimestamp);
      setListings(data);
    });
  }, []);

  const filtered = listings.filter(l => {
    const matchCat = filter === 'All' || l.category === filter;
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.restaurantName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const endingSoon = listings.filter(l => l.pickupTimestamp - Date.now() < 2 * 3600 * 1000).length;

  const urgencyPill = (l) => {
    const mins = Math.round((l.pickupTimestamp - Date.now()) / 60000);
    if (mins < 60) return <span className="pill pill-red">Ends in {mins}m</span>;
    if (l.quantityLeft <= 2) return <span className="pill pill-red">Only {l.quantityLeft} left</span>;
    if (l.discount >= 50) return <span className="pill pill-amber">🔥 Hot deal</span>;
    return <span className="pill pill-amber">{l.quantityLeft} left</span>;
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Deals near you</div>
          <div className="topbar-sub">📍 Kerala</div>
        </div>
        <div style={{ fontSize: 22, cursor: 'pointer' }}>🔔</div>
      </div>
      <div className="content">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search food, bakery, cafe..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="chips">
          {CATEGORIES.map(c => (
            <div key={c} className={`chip${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>{c}</div>
          ))}
        </div>

        {endingSoon > 0 && (
          <div className="deal-banner">
            <div>
              <div className="db-title">⏰ Ending soon</div>
              <div className="db-sub">{endingSoon} deal{endingSoon > 1 ? 's' : ''} expiring in the next 2 hours</div>
            </div>
            <div style={{ fontSize: 28 }}>🏃</div>
          </div>
        )}

        <div className="section-lbl">
          {filtered.length} deal{filtered.length !== 1 ? 's' : ''} available
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">🍽️</div>
            <h3>No deals right now</h3>
            <p>Check back soon — restaurants post new deals throughout the day, especially after lunch and before closing time.</p>
          </div>
        )}

        {filtered.map(l => (
          <div className="food-card" key={l.id} onClick={() => nav(`/customer/item/${l.id}`)}>
            <div className="food-emoji-box">{l.emoji || '🍽️'}</div>
            <div className="food-info">
              <div className="food-name">{l.name}</div>
              <div className="food-shop">{l.restaurantName} · {l.restaurantLocation}</div>
              <div className="food-tags">
                <span className="pill pill-green">{l.discount}% off</span>
                {urgencyPill(l)}
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
