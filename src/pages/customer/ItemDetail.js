import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, addDoc, collection, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import { initiatePayment, calcPayment } from '../../firebase/razorpay';

function genCode() {
  return 'FSK' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Login sheet that slides up when guest tries to reserve
function LoginSheet({ onClose, onSuccess }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [timer, setTimer] = useState(30);
  const { sendOTP, verifyOTPAndLogin } = useAuth();
  const otpRefs = React.useRef([]);

  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOTP = async () => {
    if (phone.length < 10) return setErr('Enter a valid 10-digit number');
    setErr(''); setLoading(true);
    try {
      await sendOTP(phone, 'recaptcha-inline');
      setStep('otp'); setTimer(30);
    } catch { setErr('Could not send OTP. Try again.'); }
    setLoading(false);
  };

  const handleOTPChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[idx] = val; setOtp(n);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return setErr('Enter the 6-digit OTP');
    setErr(''); setLoading(true);
    try {
      const result = await verifyOTPAndLogin(code, name, phone);
      if (result.isNewUser && !name) { setStep('name'); setLoading(false); return; }
      onSuccess();
    } catch { setErr('Invalid OTP. Try again.'); }
    setLoading(false);
  };

  const handleName = async () => {
    if (!name.trim()) return setErr('Please enter your name');
    setLoading(true);
    try { onSuccess(); } catch { setErr('Something went wrong.'); }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: 'var(--white)', borderRadius: '24px 24px 0 0', padding: '24px 24px 40px', width: '100%', maxWidth: 430, margin: '0 auto', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
        <div id="recaptcha-inline" />
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />

        {step === 'phone' && <>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sign in to reserve</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter your phone number to get an OTP</div>
          {err && <div className="error-msg">{err}</div>}
          <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 14, background: 'var(--gray)' }}>
            <div style={{ padding: '12px 14px', background: 'var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>+91</div>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210" autoFocus maxLength={10}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 14px', fontSize: 18, fontWeight: 500, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <button className="btn-primary" onClick={handleSendOTP} disabled={loading || phone.length < 10}>
            {loading ? 'Sending...' : 'Send OTP →'}
          </button>
        </>}

        {step === 'otp' && <>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Enter OTP</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Sent to +91 {phone}</div>
          {err && <div className="error-msg">{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {otp.map((d, i) => (
              <input key={i} ref={el => otpRefs.current[i] = el} type="tel" maxLength={1} value={d}
                onChange={e => handleOTPChange(e.target.value, i)}
                onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && otpRefs.current[i-1]?.focus()}
                style={{ width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700, border: `2px solid ${d ? 'var(--green)' : 'var(--border)'}`, borderRadius: 12, outline: 'none', background: d ? 'var(--green-light)' : 'var(--gray)', fontFamily: 'inherit' }} />
            ))}
          </div>
          <button className="btn-primary" onClick={handleVerify} disabled={loading || otp.join('').length < 6}>
            {loading ? 'Verifying...' : 'Verify →'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            {timer > 0 ? `Resend in ${timer}s` : <span style={{ color: 'var(--green)', cursor: 'pointer' }} onClick={() => { setTimer(30); handleSendOTP(); }}>Resend OTP</span>}
          </div>
        </>}

        {step === 'name' && <>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>What's your name?</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>So restaurants know who's picking up 👋</div>
          {err && <div className="error-msg">{err}</div>}
          <div className="field">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus />
          </div>
          <button className="btn-primary" onClick={handleName} disabled={loading || !name.trim()}>
            {loading ? 'Saving...' : "Let's go! 🚀"}
          </button>
        </>}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [code, setCode] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const { user, profile } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    getDoc(doc(db, 'listings', id)).then(snap => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  const doPayment = () => {
    if (!listing || listing.quantityLeft < 1) return;
    setPaying(true);
    initiatePayment({
      listing,
      customer: profile,
      onSuccess: async ({ razorpayPaymentId, platformFee, restaurantPayout, total }) => {
        try {
          const orderCode = genCode();
          await addDoc(collection(db, 'orders'), {
            listingId: id,
            restaurantId: listing.restaurantId,
            restaurantName: listing.restaurantName,
            customerId: user.uid,
            customerName: profile?.name || 'Customer',
            customerEmail: profile?.email || '',
            customerPhone: profile?.phone || '',
            itemName: listing.name,
            emoji: listing.emoji || '🍽️',
            originalPrice: listing.originalPrice,
            paidPrice: total,
            savedAmount: listing.originalPrice - total,
            discount: listing.discount,
            platformFee,
            restaurantPayout,
            pickupBy: listing.pickupBy,
            code: orderCode,
            razorpayPaymentId,
            paymentStatus: 'paid',
            restaurantPayoutStatus: 'pending',
            status: 'pending',
            createdAt: Date.now(),
          });
          await updateDoc(doc(db, 'listings', id), {
            quantityLeft: increment(-1),
            ...(listing.quantityLeft - 1 === 0 ? { status: 'sold_out' } : {}),
          });
          setPaymentId(razorpayPaymentId);
          setCode(orderCode);
          setReserved(true);
        } catch (e) {
          alert('Payment received but order failed. Contact support with ID: ' + razorpayPaymentId);
        }
        setPaying(false);
      },
      onFailure: (msg) => {
        if (!msg.includes('cancelled')) alert(msg);
        setPaying(false);
      },
    });
  };

  // If guest clicks reserve → show login sheet → on success → pay
  const handleReserveClick = () => {
    if (!user || profile?.role !== 'customer') {
      setShowLogin(true);
    } else {
      doPayment();
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setTimeout(doPayment, 500);
  };

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!listing) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <div className="icon">❓</div>
      <h3>Item not found</h3>
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => nav('/customer/browse')}>Back to browse</button>
    </div>
  );

  if (reserved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 24, gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Reserved!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Show this code at <b>{listing.restaurantName}</b> when you pick up
        </p>
        <div style={{ background: 'var(--green-light)', borderRadius: 16, padding: '20px 32px', border: '1px dashed var(--green-mid)' }}>
          <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 6, fontWeight: 500 }}>Your pickup code</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)', letterSpacing: 4 }}>#{code}</div>
        </div>
        <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '14px 16px', width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{listing.name}</span>
            <span style={{ fontWeight: 600 }}>₹{listing.discountedPrice}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pick up by</span>
            <span style={{ fontWeight: 600 }}>{listing.pickupBy} today</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--green)' }}>
            <span>You saved</span>
            <span>₹{listing.originalPrice - listing.discountedPrice}</span>
          </div>
          {paymentId && <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>Payment ID: {paymentId}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button className="btn-primary" onClick={() => nav('/customer/orders')}>View my orders</button>
          <button className="btn-outline" onClick={() => nav('/customer/browse')}>Browse more</button>
        </div>
      </div>
    );
  }

  const minsLeft = Math.round((listing.pickupTimestamp - Date.now()) / 60000);
  const isSoldOut = listing.status !== 'active' || listing.quantityLeft < 1;

  return (
    <>
      {showLogin && <LoginSheet onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />}

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => nav(-1)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{listing.name}</span>
      </div>

      <div className="detail-hero">
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : listing.emoji || '🍽️'
        }
      </div>

      <div className="detail-body" style={{ paddingBottom: 100 }}>
        <div className="detail-name">{listing.name}</div>
        <div className="detail-shop">{listing.restaurantName} · {listing.restaurantLocation}</div>

        <div className="detail-price-row">
          <span className="dp-new">₹{listing.discountedPrice}</span>
          <span className="dp-old">₹{listing.originalPrice}</span>
          <span className="dp-badge">{listing.discount}% off</span>
        </div>

        <div className="detail-grid">
          <div className="dg-item"><div className="dg-lbl">Pickup by</div><div className="dg-val">{listing.pickupBy}</div></div>
          <div className="dg-item"><div className="dg-lbl">Items left</div><div className="dg-val" style={{ color: listing.quantityLeft <= 2 ? 'var(--red)' : undefined }}>{listing.quantityLeft}</div></div>
          <div className="dg-item"><div className="dg-lbl">Time left</div><div className="dg-val" style={{ color: minsLeft < 60 ? 'var(--red)' : undefined }}>{minsLeft > 60 ? `${Math.floor(minsLeft/60)}h ${minsLeft%60}m` : `${minsLeft}m`}</div></div>
          <div className="dg-item"><div className="dg-lbl">Category</div><div className="dg-val">{listing.category}</div></div>
        </div>

        {listing.description && <div className="desc-box">{listing.description}</div>}

        {/* Restaurant info card */}
        {listing.restaurantAddress && (
          <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '13px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📍 Pickup location</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{listing.restaurantAddress}</div>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(listing.restaurantAddress)}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500, textDecoration: 'none' }}>
              Open in Google Maps →
            </a>
          </div>
        )}

        <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Payment breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Original price</span>
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{listing.originalPrice}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Discount ({listing.discount}%)</span>
            <span style={{ color: 'var(--green)' }}>- ₹{listing.originalPrice - listing.discountedPrice}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
            <span>You pay</span>
            <span style={{ color: 'var(--green)' }}>₹{listing.discountedPrice}</span>
          </div>
        </div>

        <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: 'var(--green-dark)', marginBottom: 16 }}>
          🔒 Secure payment via Razorpay · UPI, Cards, Net Banking accepted
        </div>

        {!user && (
          <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#854F0B', marginBottom: 16 }}>
            👋 You'll be asked to verify your phone number before reserving — quick & easy!
          </div>
        )}
      </div>

      <div className="reserve-bar">
        <div className="rb-price">
          <div className="rb-label">You pay</div>
          <div className="rb-val">₹{listing.discountedPrice}</div>
        </div>
        <button className="rb-btn" onClick={handleReserveClick} disabled={paying || isSoldOut}>
          {isSoldOut ? 'Sold out' : paying ? 'Opening payment...' : user ? 'Pay & Reserve 🔒' : 'Reserve now →'}
        </button>
      </div>
    </>
  );
}
