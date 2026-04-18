// Razorpay Test Mode Integration
// Replace RAZORPAY_KEY_ID with your actual test key from razorpay.com/dashboard
// Test key format: rzp_test_XXXXXXXXXX

const RAZORPAY_KEY_ID = 'rzp_test_SesLfoPwsSVGan';
const PLATFORM_FEE_PERCENT = 10; // FoodSave Kerala takes 10% commission

export function calcPayment(discountedPrice) {
  const platformFee = Math.round(discountedPrice * PLATFORM_FEE_PERCENT / 100);
  const restaurantPayout = discountedPrice - platformFee;
  return { total: discountedPrice, platformFee, restaurantPayout };
}

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiatePayment({ listing, customer, onSuccess, onFailure }) {
  const loaded = await loadRazorpay();
  if (!loaded) {
    onFailure('Could not load payment gateway. Check your internet connection.');
    return;
  }

  const { total, platformFee, restaurantPayout } = calcPayment(listing.discountedPrice);

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: total * 100,           // Razorpay takes amount in paise
    currency: 'INR',
    name: 'FoodSave Kerala',
    description: `${listing.name} from ${listing.restaurantName}`,
    image: 'https://v0-foodsavekerala.vercel.app/logo192.png',
    prefill: {
      name: customer.name,
      email: customer.email,
      contact: customer.phone || '',
    },
    notes: {
      listingId: listing.id,
      restaurantId: listing.restaurantId,
      restaurantName: listing.restaurantName,
      platformFee: platformFee,
      restaurantPayout: restaurantPayout,
      itemName: listing.name,
    },
    theme: { color: '#0F6E56' },
    modal: { backdropclose: false },
    handler: function (response) {
      // Payment successful - Razorpay returns payment ID
      onSuccess({
        razorpayPaymentId: response.razorpay_payment_id,
        platformFee,
        restaurantPayout,
        total,
      });
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', () => onFailure('Payment failed. Please try again.'));
  rzp.open();
}
