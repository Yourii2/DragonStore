import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalSwalPolyfills } from './utils/swal';

// تفعيل رسائل SweetAlert2 كبديل شامل لرسائل المتصفح التقليدية
setupGlobalSwalPolyfills();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
