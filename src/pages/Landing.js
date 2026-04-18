import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '28px', background: 'linear-gradient(160deg, #f0faf5 0%, #ffffff 60%)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
        <div style={{ width: 70, height: 70, background: 'var(--green)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 6px 16px rgba(15,110,86,0.3)' }}>🍃</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>FoodSave Kerala</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.6 }}>Great food at up to 60% off. Zero waste. Supporting local Kerala businesses.</p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>I am a...</p>

        <div onClick={() => nav('/customer/login')} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'var(--shadow-md)', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-mid)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <div style={{ fontSize: 32 }}>🛍️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Customer</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Browse & reserve surplus food deals nearby</div>
          </div>
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</div>
        </div>

        <div onClick={() => nav('/restaurant/login')} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'var(--shadow-md)', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-mid)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <div style={{ fontSize: 32 }}>🏪</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Restaurant / Bakery / Cafe</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>List surplus food and reduce waste</div>
          </div>
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>🌱 Together we reduce food waste in Kerala</p>
    </div>
  );
}
