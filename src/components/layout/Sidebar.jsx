import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/areas', icon: '🏢', label: 'Áreas' },
    { path: '/schedules', icon: '⏰', label: 'Horarios' },
    { path: '/employees', icon: '👥', label: 'Empleados' },
    { path: '/attendance', icon: '✅', label: 'Asistencias' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>📋 Sistema Asistencia</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;