import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPanel from './components/AdminPanel.jsx'
import AdminStats from './components/AdminStats.jsx'
import AdminSources from './components/AdminSources.jsx'
import AdminLinks from './components/AdminLinks.jsx'
import Login from './components/Login.jsx'

const Root = () => {
  const [token, setToken] = useState(null);
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/admin' element={<AdminPanel />} />
        <Route path='/links' element={<AdminLinks />} />
        <Route path='/admin/stats' element={<AdminStats />} />
        <Route path='/admin/sources' element={<AdminSources />} />
        <Route path='login' element={<Login setToken={setToken} />} />
      </Routes>
    </BrowserRouter>
  )
}
createRoot(document.getElementById('root')).render(
  <Root />
)
