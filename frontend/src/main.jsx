import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SymbolProvider } from './context/SymbolContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SymbolProvider>
        <App />
      </SymbolProvider>
    </BrowserRouter>
  </StrictMode>,
)
