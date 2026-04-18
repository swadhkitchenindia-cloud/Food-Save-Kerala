import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, addDoc, collection, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../components/AuthContext';
import { initiatePayment, calcPayment } from '../../firebase/razorpay';

function genCode() {
  return 'FSK' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [code, setCode] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const { user, profile } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    getDoc(doc(db, 'listings', id)).then(snap => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  const handlePayAndReserve = () => {
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
            customerName: profile.name,
            customerEmail: profile.email,
            customerPhone: profile.phone || '',
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
            restaurantPayoutStatus: 'pending', // FoodSave holds, pays restaurant later
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
          alert('Payment received but order failed. Please contact support with payment ID: ' + razorpayPaymentId);
        }
        setPaying(false);
      },
      onFailure: (msg) => {
        if (!msg.includes('cancelled')) {
          alert(msg);
        }
        setPaying(false);
      },
    });
  };

  if (loading) return <div className="app-shell"><div className="spinner" /></div>;
  if (!listing) return (
    <div className="app-shell">
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <div className="icon">❓</div>
        <h3>Item not found</h3>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => nav('/customer/browse')}>Back to browse</button>
      </div>
    </div>
  );

  if (reserved) {
    const { platformFee, restaurantPayout } = calcPayment(listing.discountedPrice);
    return (
      <div className="app-shell">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 24, gap: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Payment done! Reserved!</h2>
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Payment ID: {paymentId}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button className="btn-primary" onClick={() => nav('/customer/orders')}>View my orders</button>
            <button className="btn-outline" onClick={() => nav('/customer/browse')}>Browse more</button>
          </div>
        </div>
      </div>
    );
  }

  const minsLeft = Math.round((listing.pickupTimestamp - Date.now()) / 60000);
  const isSoldOut = listing.status !== 'active' || listing.quantityLeft < 1;
  const { platformFee, restaurantPayout } = calcPayment(listing.discountedPrice);

  return (
    <div className="app-shell">
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => nav(-1)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{listing.name}</span>
      </div>

      <div className="detail-hero">{listing.emoji || '🍽️'}</div>

      <div className="detail-body">
        <div className="detail-name">{listing.name}</div>
        <div className="detail-shop">{listing.restaurantName} · {listing.restaurantLocation}</div>

        <div className="detail-price-row">
          <span className="dp-new">₹{listing.discountedPrice}</span>
          <span className="dp-old">₹{listing.originalPrice}</span>
          <span className="dp-badge">{listing.discount}% off</span>
        </div>

        <div className="detail-grid">
          <div className="dg-item">
            <div className="dg-lbl">Pickup by</div>
            <div className="dg-val">{listing.pickupBy}</div>
          </div>
          <div className="dg-item">
            <div className="dg-lbl">Items left</div>
            <div className="dg-val" style={{ color: listing.quantityLeft <= 2 ? 'var(--red)' : undefined }}>
              {listing.quantityLeft}
            </div>
          </div>
          <div className="dg-item">
            <div className="dg-lbl">Time left</div>
            <div className="dg-val" style={{ color: minsLeft < 60 ? 'var(--red)' : undefined }}>
              {minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft}m`}
            </div>
          </div>
          <div className="dg-item">
            <div className="dg-lbl">Category</div>
            <div className="dg-val">{listing.category}</div>
          </div>
        </div>

        {listing.description && <div className="desc-box">{listing.description}</div>}

        {/* Payment breakdown */}
        <div style={{ background: 'var(--gray)', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Payment breakdown</div>
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

        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16, lineHeight: 1.6 }}>
          🌱 You save ₹{listing.originalPrice - listing.discountedPrice} and rescue food from going to waste!
        </div>
      </div>

      <div className="reserve-bar">
        <div className="rb-price">
          <div className="rb-label">You pay</div>
          <div className="rb-val">₹{listing.discountedPrice}</div>
        </div>
        <button className="rb-btn" onClick={handlePayAndReserve} disabled={paying || isSoldOut}>
          {isSoldOut ? 'Sold out' : paying ? 'Opening payment...' : 'Pay & Reserve 🔒'}
        </button>
      </div>
    </div>
  );
}
