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
    <div className="container-fluid px-4 py-4">
      {/* Alert */}
      {alert && (
        <div className="row mb-3">
          <div className="col-12">
            <AlertNotification
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h2 className="mb-2 fw-bold">
                <i className="bi bi-building-fill me-2"></i>
                Gestión de Áreas
              </h2>
              <p className="text-muted mb-0">{areas.length} áreas registradas</p>
            </div>
            
            <div>
              <button className="btn btn-primary d-flex align-items-center" onClick={handleNew}>
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Área
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info d-flex align-items-center" role="alert">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              Cargando áreas...
            </div>
          </div>
        </div>
      )}

     {!loading && (
  <div className="row">
    <div className="col-12">
      <div className="card shadow-sm border border-secondary ">
  <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 d-flex align-items-center fw-bold">
            <i className=""></i>
            Gestión de Áreas
          </h5>
                      <div>
              <button className="btn btn-primary d-flex align-items-center" onClick={handleNew}>
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Área
              </button>
            </div>
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
<thead>
  <tr>
    <th className="px-4 py-3 text-muted">ID</th>
    <th className="py-3 text-muted">Nombre</th>
    <th className="py-3 d-none d-md-table-cell text-muted">Descripción</th>
    <th className="py-3 d-none d-lg-table-cell text-muted">Fecha Creación</th>
    <th className="py-3 text-end pe-4 text-muted">Acciones</th>
  </tr>
</thead>
              
              <tbody>
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No hay áreas registradas
                    </td>
                  </tr>
                ) : (
                  areas.map((area) => (
                    <tr key={area.id}>
                      <td className="px-4">
                        <span className="badge bg-secondary">#{area.id}</span>
                      </td>
                      <td>
                        <strong className="text-dark">{area.name}</strong>
                      </td>
                      <td className="d-none d-md-table-cell ">
                        {area.description || '-'}
                      </td>
                      <td className="d-none d-lg-table-cell ">
                        {new Date(area.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            className="btn btn-warning btn-sm"
                            onClick={() => handleEdit(area)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => openDeleteModal(area)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
{/* Formulario de creación/edición */}
      {showModal && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border border-primary">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  <i className={`bi ${selectedArea ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {selectedArea ? 'Editar Área' : 'Nueva Área'}
                </h5>
              </div>
              <div className="card-body">
                <AreaForm 
                  area={selectedArea} 
                  onClose={() => {
                    setShowModal(false);
                    setSelectedArea(null);
                  }}
                  onSave={handleSave}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info d-flex align-items-center" role="alert">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              Cargando áreas...
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && areaToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirmar Eliminación
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-2">¿Estás seguro de eliminar esta área?</p>
                <p className="fs-5 fw-bold text-danger mb-2">{areaToDelete.name}</p>
                <p className="text-muted small mb-0">Esta acción no se puede deshacer</p>
              </div>
              <div className="modal-footer justify-content-center gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                >
                  <i className="bi bi-trash me-1"></i>
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