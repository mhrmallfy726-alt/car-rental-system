import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter }from 'react-router-dom'
import { AuthProvider }from './store/auth'
import App from './App.jsx'
import './index.css'
import './styles/dashboard-responsive.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <AuthProvider>
    <App />
    </AuthProvider>
    </BrowserRouter>

  </React.StrictMode>,
)
