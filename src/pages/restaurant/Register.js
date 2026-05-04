import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const BUSINESS_TYPES = ['Restaurant', 'Bakery', 'Cafe', 'Hotel', 'Sweet Shop', 'Cloud Kitchen', 'Food Stall', 'Other'];

export default function RestaurantRegister() {
  const [step, setStep] = useState(1); // 1=basic, 2=business, 3=submitted
  const [form, setForm] = useState({
    businessName: '', businessType: 'Restaurant',
    location: '', address: '', phone: '',
    email: '', password: '',
    fssaiNumber: '', fssaiExpiry: '',
    ownerName: '', ownerPhone: '',
    description: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerRestaurant } = useAuth();
  const nav = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validateFSSAI = (num) => /^\d{14}$/.test(num.replace(/\s/g, ''));

  const submitStep1 = (e) => {
    e.preventDefault();
    if (!form.businessName || !form.location || !form.address || !form.phone || !form.email || !form.password) {
      return setErr('Please fill all fields');
    }
    if (form.password.length < 6) return setErr('Password must be at least 6 characters');
    setErr('');
    setStep(2);
  };

  const submitStep2 = async (e) => {
    e.preventDefault();
    if (!form.fssaiNumber) return setErr('FSSAI license number is mandatory');
    if (!validateFSSAI(form.fssaiNumber)) return setErr('FSSAI number must be 14 digits');
    if (!form.ownerName || !form.ownerPhone) return setErr('Owner details are required');
    setErr(''); setLoading(true);
    try {
      const cred = await registerRestaurant(
        form.email, form.password,
        form.businessName, form.location,
        form.address, form.phone
      );
      // Save additional business details
      await updateDoc(doc(db, 'users', cred.user.uid), {
        businessType: form.businessType,
        fssaiNumber: form.fssaiNumber,
        fssaiExpiry: form.fssaiExpiry,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        description: form.description,
        verificationStatus: 'pending', // Team reviews before activation
        canList: false, // Can't list until verified
      });
      setStep(3);
    } catch (e) {
      setErr(e.message?.includes('email-already-in-use') ? 'This email is already registered.' : 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  // Step 3 — success / pending verification
  if (step === 3) return (
    <div className="login-page" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Application submitted!</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, maxWidth: 300 }}>
        Thank you, <b>{form.businessName}</b>! Our team will review your FSSAI license and contact you within <b>2-3 business days</b> to complete onboarding.
      </p>
      <div style={{ background: 'var(--green-light)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left', width: '100%' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 10 }}>What happens next:</div>
        {['Our team reviews your FSSAI license', 'We may visit your shop for onboarding', 'You\'ll receive a call on ' + form.ownerPhone, 'Once approved, you can start listing!'].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--green-dark)' }}>
            <span style={{ fontWeight: 700, minWidth: 18 }}>{i + 1}.</span><span>{s}</span>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => nav('/restaurant/login')}>Go to login</button>
    </div>
  );

  return (
    <div className="login-page" style={{ paddingTop: 20 }}>
      <div className="login-logo">
        <div className="login-logo-icon">🍊</div>
        <h1>Partner Registration</h1>
        <p>Step {step} of 2 — {step === 1 ? 'Basic details' : 'License & verification'}</p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 4 }}>
        <div style={{ width: `${step * 50}%`, height: '100%', background: 'var(--green)', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>

      {/* STEP 1 — Basic details */}
      {step === 1 && (
        <form className="login-card" onSubmit={submitStep1} style={{ width: '100%' }}>
          <h2>Business details</h2>
          <p style={{ marginBottom: 16 }}>Tell us about your establishment</p>
          {err && <div className="error-msg">{err}</div>}
          <div className="field">
            <label>Business name *</label>
            <input value={form.businessName} onChange={set('businessName')} placeholder="Abad Bakery" required />
          </div>
          <div className="field">
            <label>Business type *</label>
            <select value={form.businessType} onChange={set('businessType')}>
              {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Area / Locality *</label>
            <input value={form.location} onChange={set('location')} placeholder="MG Road, Kochi" required />
          </div>
          <div className="field">
            <label>Full address *</label>
            <textarea value={form.address} onChange={set('address')} placeholder="Shop no, Street, Area, City, PIN" style={{ height: 70 }} required />
          </div>
          <div className="field">
            <label>Business phone *</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required />
          </div>
          <div className="field">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="bakery@example.com" required />
          </div>
          <div className="field">
            <label>Password *</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" minLength={6} required />
          </div>
          <button className="btn-primary" type="submit">Next: License details →</button>
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already registered? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }} onClick={() => nav('/restaurant/login')}>Sign in</span>
          </div>
        </form>
      )}

      {/* STEP 2 — FSSAI + owner */}
      {step === 2 && (
        <form className="login-card" onSubmit={submitStep2} style={{ width: '100%' }}>
          <h2>License & verification</h2>
          <p style={{ marginBottom: 16 }}>Required to list food on Saver</p>
          {err && <div className="error-msg">{err}</div>}

          <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '10px 13px', marginBottom: 16, fontSize: 13, color: '#854F0B' }}>
            ⚠️ FSSAI license is mandatory. Our team will verify before activation.
          </div>

          <div className="field">
            <label>FSSAI license number * (14 digits)</label>
            <input value={form.fssaiNumber} onChange={set('fssaiNumber')} placeholder="10014052000123" maxLength={14} required />
          </div>
          <div className="field">
            <label>FSSAI expiry date *</label>
            <input type="date" value={form.fssaiExpiry} onChange={set('fssaiExpiry')} required />
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 16px' }} />
          <div className="field">
            <label>Owner / Manager name *</label>
            <input value={form.ownerName} onChange={set('ownerName')} placeholder="Your full name" required />
          </div>
          <div className="field">
            <label>Owner phone * (we'll call this number)</label>
            <input type="tel" value={form.ownerPhone} onChange={set('ownerPhone')} placeholder="+91 98765 43210" required />
          </div>
          <div className="field">
            <label>Brief description of your business (optional)</label>
            <textarea value={form.description} onChange={set('description')} placeholder="e.g. We are a 20-year old bakery specializing in Kerala traditional sweets..." style={{ height: 70 }} />
          </div>

          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.6 }}>
            By submitting, you confirm that all information is accurate and your FSSAI license is valid.
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit for verification ✓'}</button>
          <button type="button" className="btn-outline" style={{ marginTop: 8 }} onClick={() => setStep(1)}>← Back</button>
        </form>
      )}
    </div>
  );
}
