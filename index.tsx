
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker
// FIX: This check ensures the code only runs in a browser environment,
// preventing "window is not defined" errors during the server-side build process.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIX: Changed path from absolute '/sw.js' to relative './sw.js'
    // to resolve against the current page's origin, not a potentially
    // different base URL, fixing the cross-origin registration error.
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('Service Worker registered successfully:', registration.scope);
    }).catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);