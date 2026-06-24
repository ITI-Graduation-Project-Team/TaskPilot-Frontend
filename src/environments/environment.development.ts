export const environment = {
  production: false,

  // Backend Core API
  apiUrl: 'https://taskpilotapi.runasp.net/api',

  // Authentication Settings
  auth: {
    tokenKey: 'taskPilotJwtToken',
    refreshTokenKey: 'taskPilotRefreshToken',
  },

  // Third-Party Integrations
  cloudinary: {
    cloudName: 'your_cloud_name',
    uploadPreset: 'taskPilot_dev_preset',
  },

  // Payment Gateways (Only Publishable/Client Keys!)
  stripe: {
    publishableKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',
  },
  paypal: {
    clientId: 'sb_xxxxxxxxxxxxxxxxxxxxxxxx',
  },

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