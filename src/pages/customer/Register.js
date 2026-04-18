import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

export default function CustomerRegister() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerCustomer } = useAuth();
  const nav = useNavigate();
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await registerCustomer(form.email, form.password, form.name, form.phone);
      nav('/customer/browse');
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
        <p>Save money, rescue food, support local</p>
      </div>
      <form className="login-card" onSubmit={submit} style={{ width: '100%' }}>
        <h2>Create account</h2>
        <p>Start finding great food deals today</p>
        {err && <div className="error-msg">{err}</div>}
        <div className="field">
          <label>Full name</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Rahul Kumar" required />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" minLength={6} required />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
          Already have an account? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }} onClick={() => nav('/customer/login')}>Sign in</span>
        </div>
      </form>
    </div>
  );
}
