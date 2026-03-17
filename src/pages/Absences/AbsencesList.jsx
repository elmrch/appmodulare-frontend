import React, { useState, useEffect } from 'react';
import { absenceService } from '../../services/absenceService ';
import { employeeService } from '../../services/employeeService';

const AbsencesList = () => {
  const [filters, setFilters] = useState({
    employeeId: null,
    startDate: getFirstDayOfMonth(),
    endDate: getLastDayOfMonth()
  });

  const [employees, setEmployees] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  function getFirstDayOfMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }

  function getLastDayOfMonth() {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  }

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAbsences([]); 
    
    try {
      const response = await absenceService.getAbsences(filters);
      
      if (response.data.success) {
        setAbsences(response.data.data);
        setShowResults(true);
      } else {
        setError(response.data.message || 'Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al obtener las ausencias. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Agrupar ausencias por empleado
  const groupByEmployee = () => {
    const grouped = {};
    absences.forEach(absence => {
      if (!grouped[absence.employeeId]) {
        grouped[absence.employeeId] = {
          name: absence.employeeName,
          dni: absence.employeeDni,
          absences: []
        };
      }
      grouped[absence.employeeId].absences.push(absence);
    });
    return Object.values(grouped);
  };

  const handleExportExcel = () => {
    if (absences.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let csv = 'Empleado,DNI,Fecha,Día de la Semana\n';
    
    absences.forEach(row => {
      csv += `"${row.employeeName}",${row.employeeDni},${row.missingDate},${row.dayOfWeek}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ausencias-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-calendar-x me-2 text-danger"></i>
            Reporte de Ausencias
          </h2>

          {/* CARD DE FILTROS */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtros de Búsqueda
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerateReport}>
                <div className="row g-3">
                  {/* Empleado */}
                  <div className="col-md-12">
                    <label htmlFor="employeeId" className="form-label">
                      <i className="bi bi-person me-1"></i>
                      Empleado
                    </label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      className="form-select"
                      value={filters.employeeId || ''}
                      onChange={handleFilterChange}
                    >
                      <option value="">Todos los empleados</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha Desde */}
                  <div className="col-md-6">
                    <label htmlFor="startDate" className="form-label">
                      <i className="bi bi-calendar me-1"></i>
                      Fecha Desde
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      className="form-control"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      required
                    />
                  </div>

                  {/* Fecha Hasta */}
                  <div className="col-md-6">
                    <label htmlFor="endDate" className="form-label">
                      <i className="bi bi-calendar-check me-1"></i>
                      Fecha Hasta
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      className="form-control"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      required
                    />
                  </div>
                </div>

                <div className="alert alert-info mt-3 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Nota:</strong> Se excluyen los domingos (días laborables: Lunes a Sábado)
                </div>

                {/* Botón Generar */}
                <div className="mt-3">
                  <button 
                    type="submit" 
                    className="btn btn-danger btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Buscando ausencias...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Buscar Ausencias
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="alert alert-danger mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* RESULTADOS */}
          {showResults && (
            <>
              {/* ESTADÍSTICA */}
              <div className="row g-3 mb-4">
                <div className="col-md-12">
                  <div className="card border-danger shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-calendar-x fs-1 text-danger"></i>
                      <h3 className="mt-2 mb-0">{absences.length}</h3>
                      <p className="text-muted mb-0">
                        Total de Ausencias (días sin marcar)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RESULTADOS AGRUPADOS */}
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    Ausencias Encontradas
                  </h5>
                  <button 
                    className="btn btn-success"
                    onClick={handleExportExcel}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    Exportar Excel
                  </button>
                </div>
                <div className="card-body">
                  {absences.length === 0 ? (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      ¡Excelente! No hay ausencias en el período seleccionado.
                    </div>
                  ) : (
                    <>
                      {groupByEmployee().map(emp => (
                        <div key={emp.dni} className="mb-4">
                          <div className="d-flex align-items-center mb-3">
                            <i className="bi bi-person-circle fs-3 text-danger me-3"></i>
                            <div>
                              <h5 className="mb-0">{emp.name}</h5>
                              <small className="text-muted">DNI: {emp.dni}</small>
                              <span className="badge bg-danger ms-2">
                                {emp.absences.length} {emp.absences.length === 1 ? 'ausencia' : 'ausencias'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="list-group">
                            {emp.absences.map((absence, index) => (
                              <div key={index} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <i className="bi bi-calendar-x text-danger me-2"></i>
                                    <strong>{formatDate(absence.missingDate)}</strong>
                                  </div>
                                  <span className="badge bg-secondary">
                                    {absence.dayOfWeek}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsencesList;