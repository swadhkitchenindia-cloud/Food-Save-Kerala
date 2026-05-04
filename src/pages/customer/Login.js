import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

export default function CustomerLogin() {
  const [step, setStep] = useState('phone'); // phone | otp | name
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [timer, setTimer] = useState(30);
  const [isNewUser, setIsNewUser] = useState(false);
  const otpRefs = useRef([]);
  const { sendOTP, verifyOTPAndLogin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setErr('Enter a valid 10-digit number');
    setErr(''); setLoading(true);
    try {
      await sendOTP(phone, 'recaptcha-container');
      setStep('otp');
      setTimer(30);
    } catch (e) {
      setErr('Could not send OTP. Check the number and try again.');
    }
    setLoading(false);
  };

  const handleOTPChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6) return setErr('Enter the 6-digit OTP');
    setErr(''); setLoading(true);
    try {
      const result = await verifyOTPAndLogin(code, name, phone);
      if (result.isNewUser) {
        setIsNewUser(true);
        setStep('name');
      } else {
        nav('/customer/browse');
      }
    } catch (e) {
      setErr('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleSetName = async () => {
    if (!name.trim()) return setErr('Please enter your name');
    setLoading(true);
    try {
      nav('/customer/browse');
    } catch (e) {
      setErr('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--white)' }}>
      <div id="recaptcha-container" />

      {/* Header */}
      <div style={{ background: 'var(--green)', padding: '40px 24px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍊</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>Saver</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Great food. Less waste. Bigger savings.
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 24px' }}>

        {/* STEP 1 — Phone */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Enter your number</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              We'll send you a one-time OTP to verify
            </div>
            {err && <div className="error-msg">{err}</div>}
            <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16, background: 'var(--gray)', transition: 'border-color 0.15s' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ padding: '12px 14px', background: 'var(--border)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>+91</div>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210" maxLength={10}
                style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 14px', fontSize: 18, fontWeight: 500, outline: 'none', letterSpacing: 1, fontFamily: 'inherit' }}
                autoFocus
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading || phone.length < 10}>
              {loading ? 'Sending OTP...' : 'Send OTP →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              Restaurant partner? <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }} onClick={() => nav('/restaurant/login')}>Login here →</span>
            </div>
          </form>
        )}

        {/* STEP 2 — OTP */}
        {step === 'otp' && (
          <div>
            <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Change number</button>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Verify OTP</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Sent to +91 {phone}
            </div>
            {err && <div className="error-msg">{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="tel" maxLength={1} value={digit}
                  onChange={e => handleOTPChange(e.target.value, i)}
                  onKeyDown={e => e.key === 'Backspace' && !digit && i > 0 && otpRefs.current[i-1]?.focus()}
                  style={{
                    width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700,
                    border: `2px solid ${digit ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 12, outline: 'none', background: digit ? 'var(--green-light)' : 'var(--gray)',
                    color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
            <button className="btn-primary" onClick={handleVerifyOTP} disabled={loading || otp.join('').length < 6}>
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              {timer > 0
                ? `Resend OTP in ${timer}s`
                : <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setTimer(30); handleSendOTP({ preventDefault: () => {} }); }}>Resend OTP</span>
              }
            </div>
          </div>
        )}

        {/* STEP 3 — Name (new users only) */}
        {step === 'name' && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>What's your name?</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              So restaurants know who's picking up 👋
            </div>
            {err && <div className="error-msg">{err}</div>}
            <div className="field">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" autoFocus
                style={{ fontSize: 18, padding: '14px 16px' }}
              />
            </div>
            <button className="btn-primary" onClick={handleSetName} disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : "Let's go! 🚀"}
            </button>
          </div>
        )}
      </div>

      {/* Bottom note */}
      <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        🌱 Together we reduce food waste in Kerala
      </div>
    </div>
  );
}
