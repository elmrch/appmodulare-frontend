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
    <div className="container-fluid">
      {/* Alert */}
      {alert && (
        <AlertNotification
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Gestión de Áreas</h1>
        <button 
          className=" d-sm-inline-block btn btn-sm btn-primary shadow-sm" 
          onClick={handleNew}
        >
          <i className="bi bi-plus-circle text-white-50 me-1"></i> Nueva Área
        </button>
      </div>



      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando áreas...</p>
          </div>
        </div>
      )}

      {/* DataTales Example */}
      {!loading && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Listado de Áreas</h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table " id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th className="d-none d-md-table-cell">Descripción</th>
                    <th className="d-none d-lg-table-cell">Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {areas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay áreas registradas
                      </td>
                    </tr>
                  ) : (
                    areas.map((area) => (
                      <tr key={area.id}>
                        <td>{area.id}</td>
                        <td>{area.name}</td>
                        <td className="d-none d-md-table-cell">
                          {area.description || '-'}
                        </td>
                        <td className="d-none d-lg-table-cell">
                          {new Date(area.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td>
                          <button 
                            className="btn btn-warning btn-sm me-1"
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Formulario de creación/edición */}
      {showModal && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow mb-4">
              <div className="card-header py-3">
                <h6 className="m-0 font-weight-bold text-primary">
                  {selectedArea ? 'Editar Área' : 'Nueva Área'}
                </h6>
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
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Área?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar el área <strong>"{areaToDelete.name}"</strong>?</p>
                <p className="text-muted small">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
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
                  Eliminar
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