import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { TimeZoneProvider } from './context/TimeZoneContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TimeZoneProvider>
        <App />
      </TimeZoneProvider>
    </AuthProvider>
  </StrictMode>,
);

