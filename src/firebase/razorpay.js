const RAZORPAY_KEY_ID = 'rzp_test_SesLfoPwsSVGan';
const PLATFORM_FEE_PERCENT = 10;

export function calcPayment(discountedPrice) {
  const platformFee = Math.round(discountedPrice * PLATFORM_FEE_PERCENT / 100);
  const restaurantPayout = discountedPrice - platformFee;
  return { total: discountedPrice, platformFee, restaurantPayout };
}

export function loadRazorpay() {
  return new Promise((resolve) => {
    // If already loaded
    if (window.Razorpay) return resolve(true);

    // Remove any existing failed script
    const existing = document.getElementById('razorpay-script');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    script.onerror = () => {
      console.error('Razorpay script failed to load');
      resolve(false);
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!window.Razorpay) resolve(false);
    }, 10000);

    document.body.appendChild(script);
  });
}

export async function initiatePayment({ listing, customer, onSuccess, onFailure }) {
  try {
    const loaded = await loadRazorpay();

    if (!loaded) {
      onFailure('Payment gateway could not load. Please check your internet connection and try again.');
      return;
    }

    const { total, platformFee, restaurantPayout } = calcPayment(listing.discountedPrice);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: total * 100,
      currency: 'INR',
      name: 'Saver',
      description: `${listing.name} from ${listing.restaurantName}`,
      prefill: {
        name: customer?.name || '',
        email: customer?.email || '',
        contact: customer?.phone || '',
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
      modal: {
        backdropclose: false,
        ondismiss: function () {
          onFailure('Payment was cancelled.');
        },
      },
      handler: function (response) {
        if (response.razorpay_payment_id) {
          onSuccess({
            razorpayPaymentId: response.razorpay_payment_id,
            platformFee,
            restaurantPayout,
            total,
          });
        } else {
          onFailure('Payment failed. Please try again.');
        }
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response) {
      onFailure('Payment failed: ' + (response.error?.description || 'Please try again.'));
    });

    rzp.open();

  } catch (err) {
    console.error('Razorpay error:', err);
    onFailure('Something went wrong. Please try again.');
  }
}
