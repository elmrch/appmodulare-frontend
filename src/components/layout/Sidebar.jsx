import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('usuario@email.com');
  const [userRole, setUserRole] = useState(''); // Inicialmente vacío
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role') || 'user'; // Obtener rol, por defecto 'user'
    
    if (storedUsername) setUsername(storedUsername);
    if (storedEmail) setUserEmail(storedEmail);
    setUserRole(storedRole); // ← NUEVO: guardar rol en estado
  }, []);

  const handleLogout = () => {
    userService.logout();
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role'); // ← NUEVO: limpiar rol
    navigate('/login-admin');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // ========== DEFINIR TODOS LOS MÓDULOS CON SUS ROLES ==========
  const allMenuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', color: '#0d6efd', roles: ['admin'] },
    { path: '/areas', icon: '🏢', label: 'Áreas', color: '#6610f2', roles: ['admin'] },
    { path: '/schedules', icon: '⏰', label: 'Horarios', color: '#6f42c1', roles: ['admin'] },
    { path: '/employees', icon: '👥', label: 'Empleados', color: '#d63384', roles: ['admin'] },
    { path: '/attendance', icon: '✅', label: 'Asistencias', color: '#198754', roles: ['admin', 'user'] },
    { path: '/reports', icon: '📑', label: 'Reportes', color: '#fd7e14', roles: ['admin'] },
    { path: '/absences', icon: '🚫', label: 'Ausencias', color: '#ff4d4d', roles: ['admin'] },
    { path: '/visitas', icon: '🪪', label: 'Visitas', color: '#20c997', roles: ['admin', 'user'] },
        { path: '/users', icon: '👤', label: 'Usuarios', color: '#0dcaf0',roles:['admin','user'] },

    { path: '/bitácora', icon: '📝', label: 'Bitácora', color: '#20c997', roles: ['admin', 'user'] },
    { path: '/usersroles', icon: '👤', label: 'Lista usuarios', color: '#0dcaf0', roles: ['admin'] },
  ];

  // ========== FILTRAR MÓDULOS SEGÚN EL ROL ==========
  const menuItems = allMenuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );


  return (
    <>
      {/* Botón toggle para móvil */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            <div className="sidebar-logo">📋</div>
            <div>
              <h5 className="mb-0 fw-bold">Modulare</h5>
              <small className="text-white-50">Sistema de Asistencias</small>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
              style={{
                '--item-color': item.color
              }}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
              {location.pathname === item.path && (
                <span className="active-indicator"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Usuario y botón de logout */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{username}</div>
              <div className="user-email">
                {userEmail.length > 20 ? userEmail.substring(0, 20) + '...' : userEmail}
              </div>
            </div>
          </div>
          <button 
            className="logout-btn" 
            onClick={() => setShowLogoutModal(true)}
            title="Cerrar sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal de confirmación de logout */}
      {showLogoutModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowLogoutModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Cerrar Sesión
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)}></button>
              </div>
              <div className="modal-body text-center py-4">
                <i className="bi bi-question-circle text-warning" style={{fontSize: '3rem'}}></i>
                <p className="mt-3 mb-2">¿Estás seguro de cerrar sesión?</p>
                <p className="text-muted small">Tendrás que volver a iniciar sesión</p>
              </div>
              <div className="modal-footer justify-content-center">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-warning" onClick={handleLogout}>
                  Sí, Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;