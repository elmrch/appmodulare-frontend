import React, { useState, useEffect } from 'react';
import { areaService } from '../../services/areaService';

const AreaForm = ({ area, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [touched, setTouched] = useState({
    name: true,  // Cambiado a true
    description: true  // Cambiado a true
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
        onSave(true);
      } else {
        await areaService.create(formData);
        onSave(false);
      }
    } catch (error) {
      console.error('Error al guardar área:', error);
    }
  };

  // Función para determinar la clase de validación
  const getValidationClass = (fieldName, isRequired = false) => {
    if (isRequired) {
      return formData[fieldName].trim() ? 'is-valid' : 'is-invalid';
    }
    return formData[fieldName].trim() ? 'is-valid' : '';
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label fw-semibold">Nombre *</label>
          <input
            type="text"
            name="name"
            className={`form-control ${getValidationClass('name', true)}`}
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Ventas, Administración, TI"
          />
          {!formData.name.trim() && (
            <div className="invalid-feedback d-block">
              El nombre es obligatorio
            </div>
          )}
          
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label fw-semibold">Descripción</label>
          <input
            type="text"
            name="description"
            className={`form-control ${getValidationClass('description', true)}`}
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción breve del área"
          />
  
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          <i className="bi bi-x-circle me-1"></i>
          Cancelar
        </button>
        <button type="submit" className="btn btn-success">
          <i className={`bi ${area ? 'bi-check-circle' : 'bi-save'} me-1`}></i>
          {area ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default AreaForm;