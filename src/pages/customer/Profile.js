import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import CustomerNav from '../../components/CustomerNav';

export default function CustomerProfile() {
  const { profile, logout } = useAuth();
  const nav = useNavigate();
  const handleLogout = async () => { await logout(); nav('/'); };

  return (
    <>
      <div className="topbar"><div className="topbar-title">My profile</div></div>
      <div className="content">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--green)' }}>
            {profile?.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{profile?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{profile?.phone}</div>
            <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>🌱 Food rescuer</div>
          </div>
        </div>

        <div className="section-lbl">Account</div>
        <div className="pref-list">
          <div className="pref-row">Email <span>{profile?.email}</span></div>
          <div className="pref-row">Phone <span>{profile?.phone}</span></div>
          <div className="pref-row">Member since <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—'}</span></div>
        </div>

        <div className="section-lbl">Preferences</div>
        <div className="pref-list">
          <div className="pref-row">Location <span className="green-text">Kerala</span></div>
          <div className="pref-row">Deal alerts <span className="green-text">On</span></div>
          <div className="pref-row">Language <span>English</span></div>
        </div>

        <div className="section-lbl">Payment</div>
        <div className="pref-list">
          <div className="pref-row">UPI / Cards <span>Add payment method</span></div>
        </div>

        <button className="btn-outline" style={{ marginTop: 8 }} onClick={handleLogout}>Sign out</button>
      </div>
      <CustomerNav />
    </>
  );
}
