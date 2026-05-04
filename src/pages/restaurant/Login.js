import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

export default function RestaurantLogin() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await login(email, pass);
      nav('/restaurant/dashboard');
    } catch (e) {
      setErr('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <div className="login-logo-icon">🍊</div>
        <h1>Saver</h1>
        <p>Partner login for restaurants, bakeries & cafes</p>
      </div>
      <form className="login-card" onSubmit={submit} style={{ width: '100%' }}>
        <h2>Welcome back</h2>
        <p>Sign in to manage your surplus listings</p>
        {err && <div className="error-msg">{err}</div>}
        <div className="field">
          <label>Business email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="bakery@example.com" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
          New partner? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }} onClick={() => nav('/restaurant/register')}>Register your business</span>
        </div>
      </form>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Are you a customer? <span style={{ color: 'var(--green)', cursor: 'pointer' }} onClick={() => nav('/customer/login')}>Customer app →</span>
      </div>
    </div>
  );
}
