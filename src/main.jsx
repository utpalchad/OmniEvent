import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import VendorPortal,{VendorEntry} from './vendor/VendorPortal.jsx';
import './index.css';
import './vendor.css';
function Root(){return location.pathname.startsWith('/vendor')?<VendorPortal/>:<><VendorEntry/><App/></>}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>);