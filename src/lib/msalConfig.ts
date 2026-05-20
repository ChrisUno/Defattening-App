import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || '08cad655-0f77-4c30-8db4-b206df38d347',
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
    import.meta.env.VITE_ENTRA_API_SCOPE || 'api://08cad655-0f77-4c30-8db4-b206df38d347/access_as_user',
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
