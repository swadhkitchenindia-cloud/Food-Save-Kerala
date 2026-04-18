import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import RestaurantNav from '../../components/RestaurantNav';

export default function RestaurantOrders() {
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

  const markCollected = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { status: 'collected', collectedAt: Date.now() });
  };

  const pending = orders.filter(o => o.status === 'pending');
  const done = orders.filter(o => o.status === 'collected');

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Incoming orders</div>
          <div className="topbar-sub">{pending.length} pending pickup</div>
        </div>
      </div>
      <div className="content">
        {orders.length === 0 && (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No orders yet</h3>
            <p>Orders from customers will appear here once they reserve your listed items.</p>
          </div>
        )}

        {pending.length > 0 && <>
          <div className="section-lbl">Pending pickup</div>
          {pending.map(o => (
            <div className="order-card" key={o.id}>
              <div className="oc-top">
                <div className="oc-name">{o.customerName} — {o.itemName}</div>
                <span className="pill pill-amber">Pending</span>
              </div>
              <div className="oc-shop">Reserved at {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Pickup by {o.pickupBy}</div>
              <div className="oc-code">Pickup code: <b>#{o.code}</b></div>
              <div className="oc-footer">
                <span className="oc-saved">Paid ₹{o.paidPrice}</span>
                <button className="btn-primary" style={{ width: 'auto', padding: '8px 18px', fontSize: 13 }} onClick={() => markCollected(o.id)}>Mark collected ✓</button>
              </div>
            </div>
          ))}
        </>}

        {done.length > 0 && <>
          <div className="section-lbl" style={{ marginTop: 16 }}>Completed today</div>
          {done.map(o => (
            <div className="order-card" key={o.id}>
              <div className="oc-top">
                <div className="oc-name">{o.customerName} — {o.itemName}</div>
                <span className="pill pill-gray">Collected</span>
              </div>
              <div className="oc-shop">{o.collectedAt ? `Picked up ${new Date(o.collectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
              <div className="oc-footer">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Code: #{o.code}</span>
                <span className="oc-paid">Earned ₹{o.paidPrice}</span>
              </div>
            </div>
          ))}
        </>}
      </div>
      <RestaurantNav />
    </>
  );
}
