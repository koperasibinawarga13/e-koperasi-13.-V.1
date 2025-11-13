
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use an absolute URL to avoid origin confusion in iframe environments.
    // Let the browser infer the scope from the script URL.
    const swUrl = `${window.location.origin}/sw.js`;
    navigator.serviceWorker.register(swUrl).then(registration => {
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