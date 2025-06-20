import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <button onClick={() => handleNavigation('/admin')} className="nav-link">Admin Dashboard</button>
        <button onClick={() => handleNavigation('/admin/stats')} className="nav-link">Statictics</button>
        <button onClick={() => handleNavigation('/admin/sources')} className="nav-link">Sources</button>
        <button onClick={() => handleNavigation('/links')} className="nav-link">Admin Panel</button>
      </div>
    </nav>
  );
};

export default Navbar;