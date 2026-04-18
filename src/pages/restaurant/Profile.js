import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import RestaurantNav from '../../components/RestaurantNav';

export default function RestaurantProfile() {
  const { profile, logout, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ businessName: profile?.businessName || '', location: profile?.location || '', address: profile?.address || '', phone: profile?.phone || '' });
  const [imagePreview, setImagePreview] = useState(profile?.imageUrl || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const nav = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Image must be under 2MB');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...form,
        imageUrl: imagePreview,
      });
      setEditing(false);
    } catch (e) {
      alert('Could not save. Try again.');
    }
    setSaving(false);
  };

  const handleLogout = async () => { await logout(); nav('/'); };

  return (
    <>
      <div className="topbar"><div className="topbar-title">Business profile</div></div>
      <div className="content">

        {/* Shop image + name */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16, padding: 20 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 90, height: 90, borderRadius: 20, background: 'var(--green-light)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '2px solid var(--border)' }}>
              {imagePreview
                ? <img src={imagePreview} alt="shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🏪'
              }
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: 'var(--green)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
              📷
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{profile?.businessName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{profile?.location}</div>
            <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, fontWeight: 500 }}>✓ Verified partner</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Tap 📷 to update your shop photo · Shown to customers on your listings
          </div>
        </div>

        {!editing ? (
          <>
            <div className="section-lbl">Business details</div>
            <div className="pref-list">
              <div className="pref-row">Business name <span>{profile?.businessName}</span></div>
              <div className="pref-row">Area <span>{profile?.location}</span></div>
              <div className="pref-row">Full address <span style={{ maxWidth: 160, textAlign: 'right', fontSize: 11 }}>{profile?.address || 'Not set'}</span></div>
              <div className="pref-row">Phone <span>{profile?.phone || 'Not set'}</span></div>
              <div className="pref-row">Email <span style={{ fontSize: 11 }}>{profile?.email}</span></div>
            </div>
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit details</button>
          </>
        ) : (
          <>
            <div className="section-lbl">Edit business details</div>
            <div className="field"><label>Business name</label><input value={form.businessName} onChange={set('businessName')} /></div>
            <div className="field"><label>Area (shown on listings)</label><input value={form.location} onChange={set('location')} placeholder="e.g. MG Road, Kochi" /></div>
            <div className="field"><label>Full address (for customer navigation)</label><textarea value={form.address} onChange={set('address')} placeholder="Shop no, Street, Area, City, PIN" style={{ height: 80 }} /></div>
            <div className="field"><label>Phone number</label><input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            <button className="btn-outline" style={{ marginTop: 8 }} onClick={() => setEditing(false)}>Cancel</button>
          </>
        )}

        <div className="section-lbl" style={{ marginTop: 16 }}>Account</div>
        <div className="pref-list">
          <div className="pref-row">Member since <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—'}</span></div>
          <div className="pref-row">Plan <span style={{ color: 'var(--green)' }}>Free partner</span></div>
        </div>

        <button className="btn-outline" style={{ marginTop: 8 }} onClick={handleLogout}>Sign out</button>
      </div>
      <RestaurantNav />
    </>
  );
}
