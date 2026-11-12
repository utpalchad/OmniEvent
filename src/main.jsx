import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import VendorPortal,{VendorEntry} from './vendor/VendorPortal.jsx';
import CustomerPortal from './customer/CustomerPortal.jsx';
import './index.css';
import './vendor.css';

function Root() {
  const route = new URLSearchParams(location.search).get('vendor');
  if (route) {
    history.replaceState({}, '', route === 'welcome' ? '/vendor' : '/vendor/' + route);
    return <VendorPortal />;
  }
  if (location.pathname.startsWith('/customer')) return <CustomerPortal />;
  if (location.pathname.startsWith('/vendor')) return <VendorPortal />;
  return <><VendorEntry /><App /></>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>);
