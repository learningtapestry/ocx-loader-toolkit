export const googleApiKey = {
  "type": "service_account",
  "project_id": "",
  "private_key_id": "",
  "private_key": process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.GOOGLE_CLIENT_EMAIL,
  "client_id": "",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "",
  "universe_domain": "googleapis.com"
};
