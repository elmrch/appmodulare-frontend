import React, { useState, useEffect } from 'react';
import { areaService } from '../../services/areaService';
import AreaForm from './AreaForm';
import './AreaList.css';
import { Schedule } from '../../services/Schedule';

const ScheduleList = () => {
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    setLoading(true);
    try {
      const response = await areaService.getAll();
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      alert('Error al cargar áreas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta área?')) {
      try {
        await areaService.delete(id);
        alert('Área eliminada correctamente');
        loadAreas();
      } catch (error) {
        console.error('Error al eliminar área:', error);
        alert('Error al eliminar área');
      }
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

  const handleSave = () => {
    setShowModal(false);
    setSelectedArea(null);
    loadAreas();
  };

  return (
    <div className="area-list">
      <div className="page-header">
        <h1>🏢 Gestión de Áreas</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          ➕ Nueva Área
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="table-container">
          <table className="table">
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
                  <td colSpan="5" style={{textAlign: 'center'}}>
                    No hay áreas registradas
                  </td>
                </tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.id}>
                    <td>{area.id}</td>
                    <td>{area.name}</td>
                    <td>{area.description}</td>
                    <td>{new Date(area.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-edit" 
                        onClick={() => handleEdit(area)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-delete" 
                        onClick={() => handleDelete(area.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AreaForm 
          area={selectedArea} 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ScheduleList;