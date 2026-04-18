import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import RestaurantNav from '../../components/RestaurantNav';

export default function RestaurantProfile() {
  const { profile, logout } = useAuth();
  const nav = useNavigate();
  const handleLogout = async () => { await logout(); nav('/'); };

  return (
    <>
      <div className="topbar"><div className="topbar-title">Business profile</div></div>
      <div className="content">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{profile?.businessName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{profile?.location}</div>
            <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, fontWeight: 500 }}>Verified partner ✓</div>
          </div>
        </div>

        <div className="section-lbl">Account</div>
        <div className="pref-list">
          <div className="pref-row">Email <span>{profile?.email}</span></div>
          <div className="pref-row">Location <span>{profile?.location}</span></div>
          <div className="pref-row">Role <span>Restaurant partner</span></div>
          <div className="pref-row">Member since <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—'}</span></div>
        </div>

        <div className="section-lbl">App info</div>
        <div className="pref-list">
          <div className="pref-row">Version <span>1.0.0</span></div>
          <div className="pref-row">Platform <span>FoodSave Kerala</span></div>
        </div>

        <button className="btn-outline" style={{ marginTop: 8 }} onClick={handleLogout}>Sign out</button>
      </div>
      <RestaurantNav />
    </>
  );
}
