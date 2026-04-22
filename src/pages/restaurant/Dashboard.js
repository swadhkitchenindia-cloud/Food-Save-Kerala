import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import RestaurantNav from '../../components/RestaurantNav';

export default function RestaurantDashboard() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'listings'), where('restaurantId', '==', user.uid));
    const unsub = onSnapshot(q, snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));
    const unsub = onSnapshot(q, snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [user]);

  const removeListing = async (id) => {
    if (window.confirm('Remove this listing?')) await deleteDoc(doc(db, 'listings', id));
  };

  const todayRevenue = orders
    .filter(o => o.createdAt > Date.now() - 86400000 && o.status === 'collected')
    .reduce((s, o) => s + (o.paidPrice || 0), 0);

  const activeListing = listings.filter(l => l.status === 'active');
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const statusPill = (l) => {
    if (l.status !== 'active') return <span className="pill pill-gray">Sold out</span>;
    if (l.quantity <= 2) return <span className="pill pill-amber">{l.quantity} left</span>;
    return <span className="pill pill-green">Live</span>;
  };

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">{greeting} 👋</div>
          <div className="topbar-sub">{profile?.businessName}, {profile?.location}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
          {profile?.businessName?.charAt(0) || 'R'}
        </div>
      </div>

      <div className="content">
        {profile?.verificationStatus === 'pending' && (
          <div style={{ background: 'var(--amber-light)', borderRadius: 12, padding: '13px 14px', marginBottom: 14, border: '1px solid #EF9F27' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#854F0B', marginBottom: 3 }}>⏳ Verification in progress</div>
            <div style={{ fontSize: 13, color: '#854F0B', lineHeight: 1.6 }}>
              Our team is reviewing your FSSAI license. You'll receive a call on <b>{profile?.ownerPhone}</b> within 2-3 business days. You can set up your profile in the meantime.
            </div>
          </div>
        )}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-val">₹{todayRevenue.toLocaleString()}</div>
            <div className="stat-lbl">Revenue today</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{activeListing.length}</div>
            <div className="stat-lbl">Active listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{orders.length}</div>
            <div className="stat-lbl">Total orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{pendingOrders}</div>
            <div className="stat-lbl">Pending pickup</div>
          </div>
        </div>

        {pendingOrders > 0 && (
          <div className="alert-info" onClick={() => nav('/restaurant/orders')} style={{ cursor: 'pointer' }}>
            🔔 You have {pendingOrders} order{pendingOrders > 1 ? 's' : ''} awaiting pickup → View orders
          </div>
        )}

        <div className="section-lbl">Active listings</div>

        {listings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🍽️</div>
            <h3>No listings yet</h3>
            <p>Post your first surplus item and start earning from food that would otherwise go to waste.</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => nav('/restaurant/post')}>Post first item</button>
          </div>
        ) : (
          <>
            {listings.map(l => (
              <div className="listing-card" key={l.id}>
                <div className="lc-top">
                  <div className="lc-name">{l.name}</div>
                  {statusPill(l)}
                </div>
                <div className="lc-meta">
                  <span>{l.quantity} items</span>
                  <span>•</span>
                  <span>Pickup by {l.pickupBy}</span>
                  <span>•</span>
                  <span>{l.category}</span>
                </div>
                <div className="lc-footer">
                  <div className="lc-price">₹{l.originalPrice} → <b>₹{Math.round(l.originalPrice * (1 - l.discount / 100))}</b> ({l.discount}% off)</div>
                  <div className="lc-actions">
                    <button className="btn-sm-danger" onClick={() => removeListing(l.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            <button className="btn-primary" onClick={() => nav('/restaurant/post')}>+ Add new surplus item</button>
          </>
        )}
      </div>
      <RestaurantNav />
    </>
  );
}
