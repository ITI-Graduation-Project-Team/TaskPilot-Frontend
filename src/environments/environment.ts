export const environment = {
  production: false,
  apiUrl: 'https://taskpilotapi.runasp.net/api',
  auth: {
    tokenKey: 'taskpilot_token',
    refreshTokenKey: 'taskpilot_refreshToken',
  },
  googleClientId: '586738650387-koc3m0suvmmc1bsndim8mqls2rpvj9td.apps.googleusercontent.com',
  // Stripe — only the publishable key belongs here (pk_test_... / pk_live_...)
  // Replace with your actual key from https://dashboard.stripe.com/apikeys
  stripePublishableKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',

  // PayPal
  // TODO: replace with live PayPal client ID before production deployment
  paypalClientId: 'pk_paypal_placeholder',
};