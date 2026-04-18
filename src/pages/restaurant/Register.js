import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

export default function RestaurantRegister() {
  const [form, setForm] = useState({ businessName: '', location: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerRestaurant } = useAuth();
  const nav = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await registerRestaurant(form.email, form.password, form.businessName, form.location);
      nav('/restaurant/dashboard');
    } catch (e) {
      setErr(e.message?.includes('email-already-in-use') ? 'This email is already registered.' : 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <div className="login-logo-icon">🍃</div>
        <h1>Join FoodSave Kerala</h1>
        <p>Register your restaurant, bakery or cafe</p>
      </div>
      <form className="login-card" onSubmit={submit} style={{ width: '100%' }}>
        <h2>Create partner account</h2>
        <p>Start listing surplus food in minutes</p>
        {err && <div className="error-msg">{err}</div>}
        <div className="field">
          <label>Business name</label>
          <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="Abad Bakery" required />
        </div>
        <div className="field">
          <label>Location (Area, City)</label>
          <input type="text" value={form.location} onChange={set('location')} placeholder="MG Road, Kochi" required />
        </div>
        <div className="field">
          <label>Business email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="bakery@example.com" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" minLength={6} required />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
          Already registered? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }} onClick={() => nav('/restaurant/login')}>Sign in</span>
        </div>
      </form>
    </div>
  );
}
