import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css' // semua style ada di folder src/styles
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
