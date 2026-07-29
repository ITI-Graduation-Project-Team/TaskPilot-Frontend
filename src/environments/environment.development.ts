export const environment = {
  production: false,

  // Backend Core API
   //apiUrl: 'https://127.0.0.1:9443/api',
  apiUrl: 'https://taskpilotapi.runasp.net/api',
  hubUrl: 'https://taskpilotapi.runasp.net/hubs/notifications',


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



  // PayPal
  paypalClientId: 'AS4sejisdmPGTz9maE5LcVCpZuarDUKG_Sk4okxRFTaPb7JKcEIjRXxMR5nCBgNB9r1MunhHTEldOvn7',

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
