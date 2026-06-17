import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// When the service worker updates and takes control, reload so users always
// get the latest JS/CSS without having to clear browser data manually.
// Skip the reload during OAuth callbacks — the ?code= param in the URL must
// survive long enough for Supabase to exchange it. A reload here would drop
// the code and leave the user stuck on the login screen.
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const isOAuthCallback =
      window.location.search.includes('code=') ||
      window.location.hash.includes('access_token=')
    if (!refreshing && !isOAuthCallback) {
      refreshing = true
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
