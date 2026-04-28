import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SymbolProvider } from './context/SymbolContext'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

console.log("Main.jsx starting...");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SymbolProvider>
          <Toaster position="top-right" />
          <App />
        </SymbolProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
