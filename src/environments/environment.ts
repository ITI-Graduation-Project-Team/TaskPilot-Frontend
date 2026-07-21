export const environment = {
  production: false,
  apiUrl: 'https://taskpilotapi.runasp.net/api',
  hubUrl: 'https://taskpilotapi.runasp.net/hubs/notifications',
  // apiUrl: 'https://127.0.0.1:9443/api',
  auth: {
    tokenKey: 'taskpilot_token',
    refreshTokenKey: 'taskpilot_refreshToken',
  },
  googleClientId: '586738650387-koc3m0suvmmc1bsndim8mqls2rpvj9td.apps.googleusercontent.com',


  // PayPal
  // TODO: replace with live PayPal client ID before production deployment
  paypalClientId: 'AS4sejisdmPGTz9maE5LcVCpZuarDUKG_Sk4okxRFTaPb7JKcEIjRXxMR5nCBgNB9r1MunhHTEldOvn7',
};
