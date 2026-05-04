import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, var(--green-dark) 0%, var(--green) 60%, var(--green-light) 100%)', padding: '56px 28px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ fontSize: 64, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>🍊</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: 8 }}>Saver</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
          Great food up to 60% off.<br />Zero waste. Support local Kerala.
        </p>
        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 28 }}>
          {[['60%', 'Max savings'], ['🌱', 'Zero waste'], ['Kerala', 'Local only']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role selection */}
      <div style={{ flex: 1, padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 4 }}>I am a...</p>

        {/* Customer */}
        <div onClick={() => nav('/customer/browse')}
          style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius)', padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'none'; }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🛍️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Customer</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Browse & grab surplus food deals nearby</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 20, fontWeight: 700 }}>›</div>
        </div>

        {/* Restaurant */}
        <div onClick={() => nav('/restaurant/login')}
          style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius)', padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'none'; }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🏪</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Restaurant / Bakery / Cafe</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>List surplus food & earn more revenue</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 20, fontWeight: 700 }}>›</div>
        </div>

        {/* How it works */}
        <div style={{ background: 'var(--green-bg)', borderRadius: 'var(--radius)', padding: '16px 18px', marginTop: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>How Saver works</div>
          {[
            ['🏪', 'Restaurants list surplus food with discounts'],
            ['📍', 'You browse deals within 25km of your location'],
            ['💳', 'Pay & reserve — pick up before closing time'],
            ['🌱', 'Less waste, more savings, happy Kerala!'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--green-dark)', alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
          🌱 Together we reduce food waste in Kerala
        </p>
      </div>
    </div>
  );
}
