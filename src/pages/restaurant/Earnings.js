import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import RestaurantNav from '../../components/RestaurantNav';

export default function RestaurantEarnings() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
    });
  }, [user]);

  const paid = orders.filter(o => o.paymentStatus === 'paid');
  const totalCollected = paid.reduce((s, o) => s + (o.paidPrice || 0), 0);
  const totalPlatformFee = paid.reduce((s, o) => s + (o.platformFee || 0), 0);
  const totalPayout = paid.reduce((s, o) => s + (o.restaurantPayout || 0), 0);
  const pendingPayout = paid.filter(o => o.restaurantPayoutStatus === 'pending').reduce((s, o) => s + (o.restaurantPayout || 0), 0);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Earnings & Payouts</div>
      </div>
      <div className="content">
        {/* Summary */}
        <div style={{ background: 'var(--green)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>Total earned (after platform fee)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>₹{totalPayout.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>From {paid.length} paid orders</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">₹{totalCollected.toLocaleString()}</div>
            <div className="stat-lbl">Customer payments</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">₹{totalPlatformFee.toLocaleString()}</div>
            <div className="stat-lbl">Platform fee (10%)</div>
          </div>
        </div>

        {pendingPayout > 0 && (
          <div style={{ background: 'var(--amber-light)', borderRadius: 12, padding: '13px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#854F0B' }}>Payout pending</div>
              <div style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>Saver will transfer within 2 business days</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#854F0B' }}>₹{pendingPayout.toLocaleString()}</div>
          </div>
        )}

        <div className="section-lbl">How payouts work</div>
        <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '14px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          1. Customer pays Saver via Razorpay{'\n'}
          2. Saver deducts 10% platform fee{'\n'}
          3. Remaining 90% is transferred to your bank account within 2 business days{'\n'}
          4. Add your bank account in Profile → Payout account
        </div>

        <div className="section-lbl">Recent orders</div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💰</div>
            <h3>No earnings yet</h3>
            <p>Start posting surplus items to earn!</p>
          </div>
        ) : (
          orders.slice(0, 20).map(o => (
            <div className="order-card" key={o.id}>
              <div className="oc-top">
                <div className="oc-name">{o.itemName}</div>
                <span className={`pill ${o.restaurantPayoutStatus === 'paid' ? 'pill-green' : 'pill-amber'}`}>
                  {o.restaurantPayoutStatus === 'paid' ? 'Paid out' : 'Pending'}
                </span>
              </div>
              <div className="oc-shop">{o.customerName} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
              <div className="oc-footer">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Customer paid ₹{o.paidPrice} · Fee ₹{o.platformFee || 0}
                </div>
                <span className="oc-paid" style={{ color: 'var(--green)' }}>You get ₹{o.restaurantPayout || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <RestaurantNav />
    </>
  );
}
