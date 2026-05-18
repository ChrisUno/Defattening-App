import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || '1c4bfcb9-62fd-4a7d-aa85-5a7e74871c1b',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID || 'eedd1340-df1a-4db2-8a03-b4cfb1fa3e9d'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  },
  cache: {
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    import.meta.env.VITE_ENTRA_API_SCOPE || 'api://34d4bbb3-6a41-4437-8717-9c07086c8e0a/access_as_user',
  ],
};

let _instance: PublicClientApplication | null = null;

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!_instance) {
    _instance = new PublicClientApplication(msalConfig);
    await _instance.initialize();
  }
  return _instance;
}
