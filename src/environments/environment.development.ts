export const environment = {
  production: false,

  // Backend Core API
  apiUrl: 'https://taskpilotapi.runasp.net/api',

  // Authentication Settings
  auth: {
    tokenKey: 'taskPilotJwtToken',
    refreshTokenKey: 'taskPilotRefreshToken',
  },
  googleClientId: '586738650387-koc3m0suvmmc1bsndim8mqls2rpvj9td.apps.googleusercontent.com',

  // Third-Party Integrations
  cloudinary: {
    cloudName: 'your_cloud_name',
    uploadPreset: 'taskPilot_dev_preset',
  },

  // Payment Gateways (Only Publishable/Client Keys!)
  // Replace with your actual key from https://dashboard.stripe.com/apikeys
  stripePublishableKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',

  // PayPal
  paypalClientId: 'pk_paypal_placeholder',

  // AI & RAG Microservices
  aiServices: {
    ragEndpoint: 'https://localhost:7209/api/v1/ai/rag',
    cvExtractorEndpoint: 'https://localhost:7209/api/v1/ai/extract-cv',
  },

  // Feature Flags (To turn features on/off easily)
  features: {
    enableProjectGenerator: true,
    enableFawryPayment: false,
  }
};