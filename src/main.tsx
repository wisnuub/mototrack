import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// When the service worker updates and takes control, reload so users always
// get the latest JS/CSS without having to clear browser data manually.
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
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
