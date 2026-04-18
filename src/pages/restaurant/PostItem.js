import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import RestaurantNav from '../../components/RestaurantNav';

const CATEGORIES = ['Bakery items', 'Meals / Rice', 'Snacks', 'Sweets & Desserts', 'Beverages', 'Breads', 'Biriyani', 'Seafood'];
const EMOJIS = { 'Bakery items': '🥐', 'Meals / Rice': '🍛', 'Snacks': '🥨', 'Sweets & Desserts': '🎂', 'Beverages': '☕', 'Breads': '🍞', 'Biriyani': '🍚', 'Seafood': '🦐' };

export default function RestaurantPost() {
  const [form, setForm] = useState({ name: '', description: '', category: 'Bakery items', originalPrice: '', discount: '', quantity: '', pickupBy: '20:00' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, profile } = useAuth();
  const nav = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const discountedPrice = form.originalPrice && form.discount
    ? Math.round(form.originalPrice * (1 - form.discount / 100))
    : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const [h, m] = form.pickupBy.split(':');
      const pickupTime = new Date(); pickupTime.setHours(+h, +m, 0);
      await addDoc(collection(db, 'listings'), {
        restaurantId: user.uid,
        restaurantName: profile.businessName,
        restaurantLocation: profile.location,
        name: form.name,
        description: form.description,
        category: form.category,
        emoji: EMOJIS[form.category] || '🍽️',
        originalPrice: +form.originalPrice,
        discount: +form.discount,
        discountedPrice: discountedPrice,
        quantity: +form.quantity,
        quantityLeft: +form.quantity,
        pickupBy: form.pickupBy,
        pickupTimestamp: pickupTime.getTime(),
        status: 'active',
        createdAt: Date.now(),
      });
      setSuccess(true);
      setTimeout(() => nav('/restaurant/dashboard'), 1500);
    } catch (e) {
      alert('Failed to post listing. Please try again.');
    }
    setLoading(false);
  };

  if (success) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <h3 style={{ fontSize: 18, fontWeight: 600 }}>Item listed!</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Customers can now see and reserve it.</p>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Post surplus item</div>
          <div className="topbar-sub">Customers will see this live immediately</div>
        </div>
      </div>

      <div className="content">
        <form onSubmit={submit}>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Item details</div>
            <div className="field">
              <label>Item name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Banana Cake, Veg Puffs, Biryani..." required />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={set('description')} placeholder="Brief description for customers..." />
            </div>
            <div className="field">
              <label>Category *</label>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Pricing & availability</div>
            <div className="field-row">
              <div className="field">
                <label>Original price (₹) *</label>
                <input type="number" value={form.originalPrice} onChange={set('originalPrice')} placeholder="200" min="1" required />
              </div>
              <div className="field">
                <label>Discount % *</label>
                <input type="number" value={form.discount} onChange={set('discount')} placeholder="40" min="10" max="80" required />
              </div>
            </div>
            {discountedPrice && (
              <div className="price-preview">
                <span className="pp-label">Customer pays</span>
                <span className="pp-val">₹{discountedPrice}</span>
              </div>
            )}
            <div className="field-row" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Quantity available *</label>
                <input type="number" value={form.quantity} onChange={set('quantity')} placeholder="5" min="1" required />
              </div>
              <div className="field">
                <label>Pickup by *</label>
                <input type="time" value={form.pickupBy} onChange={set('pickupBy')} required />
              </div>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Listing...' : 'List item now 🚀'}</button>
          <button type="button" className="btn-outline" style={{ marginTop: 10 }} onClick={() => nav('/restaurant/dashboard')}>← Back to dashboard</button>
        </form>
      </div>
      <RestaurantNav />
    </>
  );
}
