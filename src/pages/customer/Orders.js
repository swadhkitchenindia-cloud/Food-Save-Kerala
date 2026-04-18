import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import CustomerNav from '../../components/CustomerNav';

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('customerId', '==', user.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
    });
  }, [user]);

  const totalSaved = orders.reduce((s, o) => s + (o.savedAmount || 0), 0);
  const mealsRescued = orders.length;
  const pending = orders.filter(o => o.status === 'pending');
  const done = orders.filter(o => o.status === 'collected');

  return (
    <>
      <div className="topbar"><div className="topbar-title">My orders</div></div>
      <div className="content">
        {orders.length > 0 && (
          <div className="savings-banner">
            <div className="sb-item"><div className="sb-val">₹{totalSaved.toLocaleString()}</div><div className="sb-lbl">Total saved</div></div>
            <div className="sb-item"><div className="sb-val">{mealsRescued}</div><div className="sb-lbl">Meals rescued</div></div>
            <div className="sb-item"><div className="sb-val">{(mealsRescued * 0.4).toFixed(1)} kg</div><div className="sb-lbl">Food saved</div></div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="empty-state">
            <div className="icon">🛍️</div>
            <h3>No orders yet</h3>
            <p>Browse deals nearby and reserve your first surplus food item at a big discount!</p>
          </div>
        )}

        {pending.length > 0 && <>
          <div className="section-lbl">Waiting for pickup</div>
          {pending.map(o => (
            <div className="order-card" key={o.id}>
              <div className="oc-top">
                <div className="oc-name">{o.itemName}</div>
                <span className="pill pill-amber">Pick up by {o.pickupBy}</span>
              </div>
              <div className="oc-shop">{o.restaurantName} · Today</div>
              <div className="oc-code">Show at counter: <b>#{o.code}</b></div>
              <div className="oc-footer">
                <span className="oc-saved">Saved ₹{o.savedAmount}</span>
                <span className="oc-paid">Paid ₹{o.paidPrice}</span>
              </div>
            </div>
          ))}
        </>}

        {done.length > 0 && <>
          <div className="section-lbl" style={{ marginTop: 16 }}>Past orders</div>
          {done.map(o => (
            <div className="order-card" key={o.id}>
              <div className="oc-top">
                <div className="oc-name">{o.itemName}</div>
                <span className="pill pill-gray">Collected</span>
              </div>
              <div className="oc-shop">{o.restaurantName} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
              <div className="oc-footer">
                <span className="oc-saved">Saved ₹{o.savedAmount}</span>
                <span className="oc-paid">Paid ₹{o.paidPrice}</span>
              </div>
            </div>
          ))}
        </>}
      </div>
      <CustomerNav />
    </>
  );
}
