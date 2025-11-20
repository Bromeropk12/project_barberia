import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './App.css'

// Lazy loading del componente principal
const App = React.lazy(() => import('./App'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="loading">Cargando Brookings Barber...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
)