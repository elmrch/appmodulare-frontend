import React, { useState, useEffect } from 'react';
import { areaService } from '../../services/areaService';
import AreaForm from './AreaForm';
import AlertNotification from './AlertNotification';
import './AreaList.css';

const AreaList = () => {
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadAreas();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadAreas = async () => {
    setLoading(true);
    try {
      const response = await areaService.getAll();
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      showAlert('danger', 'Error al cargar áreas');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (area) => {
    setAreaToDelete(area);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await areaService.delete(areaToDelete.id);
      setShowDeleteModal(false);
      setAreaToDelete(null);
      showAlert('success', 'Área eliminada correctamente');
      loadAreas();
    } catch (error) {
      console.error('Error al eliminar área:', error);
      showAlert('danger', 'Error al eliminar área');
    }
  };

  const handleEdit = (area) => {
    setSelectedArea(area);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedArea(null);
    setShowModal(true);
  };

  const handleSave = (isEdit) => {
    setShowModal(false);
    setSelectedArea(null);
    showAlert('success', isEdit ? 'Área actualizada correctamente' : 'Área creada correctamente');
    loadAreas();
  };

return (
  <div className="attendance-container">
    {alert && (
      <AlertNotification
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(null)}
      />
    )}

    {/* Header */}
    <div className="attendance-header">
      <div>
        <h2 className="page-title">
          <i className="bi bi-building-fill"></i>
          Gestión de Áreas
        </h2>
        <p className="page-subtitle">{areas.length} áreas registradas</p>
      </div>
      
      <div className="header-actions">
        <button className="btn btn-primary" onClick={handleNew}>
          <i className="bi bi-plus-circle me-1"></i>
          Nueva Área
        </button>
      </div>
    </div>

    {/* Loading */}
    {loading && <div className="alert alert-info">Cargando áreas...</div>}

    {/* Tabla */}
    {!loading && (
      <div className="table-card">
        <div className="table-responsive">
          <table className="table attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No hay áreas registradas
                  </td>
                </tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.id}>
                    <td>#{area.id}</td>
                    <td><strong>{area.name}</strong></td>
                    <td>{area.description}</td>
                    <td>{new Date(area.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(area)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => openDeleteModal(area)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Modal Form */}
    {showModal && (
      <AreaForm 
        area={selectedArea} 
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    )}

    {/* Modal Delete */}
    {showDeleteModal && areaToDelete && (
      <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowDeleteModal(false)}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Confirmar Eliminación
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body text-center py-4">
              <p className="mb-2">¿Estás seguro de eliminar esta área?</p>
              <p className="fs-5 fw-bold text-danger mb-2">{areaToDelete.name}</p>
              <p className="text-muted small">Esta acción no se puede deshacer</p>
            </div>
            <div className="modal-footer justify-content-center">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default AreaList;