import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './lib/msalConfig'
import App from './App.tsx'
import './index.css'

await msalInstance.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App basename={import.meta.env.VITE_BASE_PATH} />
    </MsalProvider>
  </StrictMode>,
)