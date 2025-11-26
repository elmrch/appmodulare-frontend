import React, { useState, useEffect } from 'react';
import { areaService } from '../../services/areaService';
import './AreaForm.css';

const AreaForm = ({ area, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name,
        description: area.description || ''
      });
    }
  }, [area]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (area) {
        await areaService.update(area.id, formData);
        onSave(true); // true = es edición
      } else {
        await areaService.create(formData);
        onSave(false); // false = es creación
      }
    } catch (error) {
      console.error('Error al guardar área:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{area ? '✏️ Editar Área' : '➕ Nueva Área'}</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Ventas, Administración, TI"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Descripción del área..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {area ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreaForm;