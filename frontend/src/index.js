import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import API_BASE_URL from './config/api';

// Ensure axios always hits the deployed API in production.
// If any code still uses absolute localhost URLs, rewrite them to the configured API base.
axios.defaults.baseURL = API_BASE_URL;
axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    const replacements = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'https://localhost:5000',
      'https://127.0.0.1:5000',
    ];
    for (const host of replacements) {
      if (config.url.startsWith(host)) {
        config.url = config.url.replace(host, API_BASE_URL);
        break;
      }
    }
  }
  return config;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
