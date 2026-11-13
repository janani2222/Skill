import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Styling imports
import './styles/global.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/profile.css';
import './styles/phase2.css';
import './styles/phase2-fixes.css';
import './styles/phase2-notices.css';
import './styles/phase3.css';
import './styles/profile-reference.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

