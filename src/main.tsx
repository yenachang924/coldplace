import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root not found');

document.body.style.margin = '0';

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
