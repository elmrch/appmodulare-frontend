import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('usuario@email.com');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Obtener el username y email del localStorage
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      userService.logout();
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      navigate('/login-admin');
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/areas', icon: '🏢', label: 'Áreas' },
    { path: '/schedules', icon: '⏰', label: 'Horarios' },
    { path: '/employees', icon: '👥', label: 'Empleados' },
    { path: '/attendance', icon: '✅', label: 'Asistencias' },
    { path: '/users', icon: '👤', label: 'Usuarios' },
  ];

  return (
    <>
      {/* Botón toggle para móvil */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h2>📋 Asistencia Modulare</h2>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Usuario y botón de logout */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" title={userEmail}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name" title={username}>{username}</span>
              <span className="user-role" title={userEmail}>
                {userEmail.length > 20 ? userEmail.substring(0, 20) + '...' : userEmail}
              </span>
            </div>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth <= 992 ? 'block' : 'none'
          }}
        />
      )}
    </>
  );
};

export default Sidebar;