import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { swManager } from "./lib/serviceWorker";
import { initializeDatabase } from "./lib/db";
import { getCachedBranding } from "./utils/branding";

// Initialize database with version management
initializeDatabase().catch(console.error);

// Apply cached branding immediately if available
const cachedBranding = getCachedBranding();
if (cachedBranding && cachedBranding.primary_color) {
  document.documentElement.style.setProperty('--primary', cachedBranding.primary_color);
}

// Register service worker for offline support (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    swManager.register().catch(console.error);
  });
}

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('Connection restored, triggering sync...');
  swManager.requestSync().catch(console.error);
});

window.addEventListener('offline', () => {
  console.log('Connection lost, changes will be queued');
});

createRoot(document.getElementById("root")!).render(<App />);
