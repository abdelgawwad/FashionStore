// ============================================
// STRIPE PAYMENT CONFIGURATION
// ============================================

// Replace with your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
// Your backend URL (where you create Payment Intents)
const BACKEND_URL = 'http://localhost:3000'; // Change this to your backend URL

let stripe;
let elements;
let paymentElement;

// Amount in cents ($29.99 = 2999 cents)
const AMOUNT = 2999;
const CURRENCY = 'usd';

// ============================================
// INITIALIZE STRIPE
// ============================================

async function initializeStripe() {
    // Load Stripe
    stripe = await Stripe(STRIPE_PUBLISHABLE_KEY);

    // Fetch client secret from backend
    const clientSecret = await fetchClientSecret();
    
    if (!clientSecret) {
        showMessage('Failed to initialize payment. Please refresh and try again.', 'error');
        return;
    }

    // Create Elements instance
    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#667eea',
            colorBackground: '#ffffff',
            colorText: '#333333',
            colorDanger: '#fa755a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
            borderRadius: '6px',
        },
        rules: {
            '.Label': {
                fontWeight: '500',
            },
        },
    };

    elements = stripe.elements({
        appearance,
        clientSecret,
    });

    // Create and mount Payment Element
    paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
}

// ============================================
// FETCH CLIENT SECRET FROM BACKEND
// ============================================

async function fetchClientSecret() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: AMOUNT,
                currency: CURRENCY,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        return data.clientSecret;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// ============================================
// HANDLE FORM SUBMISSION
// ============================================

document.getElementById('payment-form').addEventListener('submit', handleSubmit);

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!stripe || !elements) {
        return;
    }

    // Get email
    const email = document.getElementById('email').value;
    
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    // Disable button and show spinner
    setLoading(true);

    try {
        // Confirm payment with Stripe
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Redirect on successful payment
                return_url: `${window.location.origin}/success.html`,
                receipt_email: email,
            },
        });

        if (error) {
            // Show error message
            showMessage(error.message, 'error');
            setLoading(false);
        }
        // If no error, Stripe will redirect automatically
    } catch (err) {
        console.error('Payment error:', err);
        showMessage('An unexpected error occurred. Please try again.', 'error');
        setLoading(false);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setLoading(isLoading) {
    if (isLoading) {
        document.getElementById('submit-button').disabled = true;
        document.getElementById('spinner').classList.remove('hidden');
        document.getElementById('button-text').classList.add('hidden');
    } else {
        document.getElementById('submit-button').disabled = false;
        document.getElementById('spinner').classList.add('hidden');
        document.getElementById('button-text').classList.remove('hidden');
    }
}

function showMessage(messageText, type = 'error') {
    const messageElement = document.getElementById('payment-message');
    messageElement.textContent = messageText;
    messageElement.classList.remove('hidden', 'error', 'success');
    messageElement.classList.add(type);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStripe();
});