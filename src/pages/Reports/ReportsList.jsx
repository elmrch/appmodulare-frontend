import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { employeeService } from '../../services/employeeService';
import jsPDF from 'jspdf';

const ReportsList = () => {
  // Estados
  const [filters, setFilters] = useState({
    employeeId: null,
    startDate: getFirstDayOfMonth(),
    endDate: getLastDayOfMonth(),
    status: 'all'
  });

  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    punctual: 0,
    late: 0
  });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');

  // Cargar empleados al iniciar
  useEffect(() => {
    loadEmployees();
  }, []);

  // Obtener primer día del mes actual
  function getFirstDayOfMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }

  // Obtener último día del mes actual
  function getLastDayOfMonth() {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  }

  // Cargar lista de empleados
  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  // Generar reporte
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await reportService.generateAttendanceReport(filters);
      
      if (response.data.success) {
        setReportData(response.data.data);
        setStatistics(response.data.statistics);
        setShowResults(true);
      } else {
        setError(response.data.message || 'Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      setError('Error al generar el reporte. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Exportar a Excel/CSV
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear CSV con BOM UTF-8 para que Excel lo reconozca correctamente
    const BOM = '\uFEFF';
    let csv = BOM + 'ID,Empleado,DNI,Fecha,Entrada,Salida,Horas,Estado\n';
    
    reportData.forEach(row => {
      csv += `${row.id},"${row.employeeName}",${row.employeeDni},${formatDate(row.date)},${formatTime(row.checkIn)},${formatTime(row.checkOut)},${row.totalHoursFormatted || '-'},${row.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-asistencias-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostrar mensaje de éxito
    setError('');
    const successMsg = document.createElement('div');
    successMsg.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    successMsg.style.zIndex = '9999';
    successMsg.innerHTML = '<i class="bi bi-check-circle me-2"></i>Excel exportado correctamente';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  };

  // Exportar a PDF
  const exportToPDF = () => {
    if (reportData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    /* -------------------------- ENCABEZADO TABLA -------------------------- */
    const headers = ["ID", "EMPLEADO", "DNI", "FECHA", "ENTRADA", "SALIDA", "HORAS", "ESTADO"];
    const colWidths = [12, 55, 25, 28, 35, 35, 22, 33];
    const startY = 10;
    const startX = 10;
    const rowHeight = 8;
    
    // Color de fondo del encabezado (azul claro)
    doc.setFillColor(102, 153, 204);
    let xPos = startX;
    
    // Dibujar celdas del encabezado
    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], rowHeight, "F");
      xPos += colWidths[i];
    });
    
    // Bordes del encabezado
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    xPos = startX;
    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], rowHeight);
      xPos += colWidths[i];
    });
    
    // Texto del encabezado (centrado)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    xPos = startX;
    
    headers.forEach((header, i) => {
      const textWidth = doc.getTextWidth(header);
      const textX = xPos + (colWidths[i] - textWidth) / 2;
      doc.text(header, textX, startY + 5.5);
      xPos += colWidths[i];
    });
    
    /* ------------------------------- DATOS --------------------------------- */
    let yPos = startY + rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);
    
    reportData.forEach((row, index) => {
      // Control de página
      if (yPos > 190) {
        doc.addPage();
        yPos = 10;
        
        // Re-dibujar encabezado en nueva página
        doc.setFillColor(102, 153, 204);
        xPos = startX;
        headers.forEach((header, i) => {
          doc.rect(xPos, yPos, colWidths[i], rowHeight, "F");
          xPos += colWidths[i];
        });
        
        xPos = startX;
        headers.forEach((header, i) => {
          doc.rect(xPos, yPos, colWidths[i], rowHeight);
          xPos += colWidths[i];
        });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        xPos = startX;
        headers.forEach((header, i) => {
          const textWidth = doc.getTextWidth(header);
          const textX = xPos + (colWidths[i] - textWidth) / 2;
          doc.text(header, textX, yPos + 5.5);
          xPos += colWidths[i];
        });
        
        yPos += rowHeight;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
      }
      
      // Fondo alternado (blanco/gris claro)
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(240, 240, 240);
      }
      
      xPos = startX;
      headers.forEach((_, i) => {
        doc.rect(xPos, yPos, colWidths[i], rowHeight, "F");
        xPos += colWidths[i];
      });
      
      // Bordes de las celdas
      xPos = startX;
      headers.forEach((_, i) => {
        doc.rect(xPos, yPos, colWidths[i], rowHeight);
        xPos += colWidths[i];
      });
      
      // Preparar datos de la fila
      const rowData = [
        String(row.id),
        row.employeeName,
        row.employeeDni || "—",
        formatDate(row.date),
        formatTime(row.checkIn),
        formatTime(row.checkOut),
        row.totalHoursFormatted || "—",
        row.status || "—"
      ];
      
      // Texto de las celdas (centrado para ID, izquierda para el resto)
      xPos = startX;
      rowData.forEach((cell, i) => {
        if (i === 0) {
          // ID centrado
          const textWidth = doc.getTextWidth(cell);
          doc.text(cell, xPos + (colWidths[i] - textWidth) / 2, yPos + 5.5);
        } else {
          // Resto con padding izquierdo
          doc.text(cell, xPos + 2, yPos + 5.5);
        }
        xPos += colWidths[i];
      });
      
      yPos += rowHeight;
    });
    
    /* -------------------------------- FOOTER ------------------------------- */
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Página ${i} de ${totalPages} - Total registros: ${reportData.length}`,
        pageWidth / 2,
        200,
        { align: "center" }
      );
    }
    
    /* -------------------------------- SAVE -------------------------------- */
    doc.save(`Asistencias_${new Date().toISOString().split("T")[0]}.pdf`);
    
    // Mostrar mensaje de éxito
    setError('');
    const successMsg = document.createElement('div');
    successMsg.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    successMsg.style.zIndex = '9999';
    successMsg.innerHTML = '<i class="bi bi-check-circle me-2"></i>PDF generado correctamente';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Reportes de Asistencias
          </h2>

          {/* CARD DE FILTROS */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtros de Búsqueda
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerateReport}>
                <div className="row g-3">
                  {/* Empleado */}
                  <div className="col-md-6">
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

                  {/* Estado */}
                  <div className="col-md-6">
                    <label htmlFor="status" className="form-label">
                      <i className="bi bi-clock me-1"></i>
                      Estado
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="form-select"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="all">Todos</option>
                      <option value="PUNTUAL">Solo Puntuales</option>
                      <option value="TARDE">Solo Tardanzas</option>
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

                {/* Botón Generar */}
                <div className="mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Generando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Generar Reporte
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Error */}
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
              {/* ESTADÍSTICAS */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card border-primary shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-list-check fs-1 text-primary"></i>
                      <h3 className="mt-2 mb-0">{statistics.total}</h3>
                      <p className="text-muted mb-0">Total Registros</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-success shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-check-circle fs-1 text-success"></i>
                      <h3 className="mt-2 mb-0">{statistics.punctual}</h3>
                      <p className="text-muted mb-0">Puntuales</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-danger shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-exclamation-circle fs-1 text-danger"></i>
                      <h3 className="mt-2 mb-0">{statistics.late}</h3>
                      <p className="text-muted mb-0">Tardanzas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLA DE RESULTADOS */}
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-table me-2"></i>
                    Resultados del Reporte
                  </h5>
                  <div className="btn-group">
                    <button 
                      className="btn btn-success"
                      onClick={handleExportExcel}
                    >
                      <i className="bi bi-file-earmark-excel me-2"></i>
                      Exportar Excel
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={exportToPDF}
                    >
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Exportar PDF
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {reportData.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      No se encontraron registros con los filtros seleccionados.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover table-striped">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Empleado</th>
                            <th>DNI</th>
                            <th>Fecha</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Horas</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map(row => (
                            <tr key={row.id}>
                              <td>{row.id}</td>
                              <td>
                                <i className="bi bi-person-circle me-2"></i>
                                {row.employeeName}
                              </td>
                              <td>{row.employeeDni}</td>
                              <td>{formatDate(row.date)}</td>
                              <td>
                                <i className="bi bi-box-arrow-in-right me-1 text-success"></i>
                                {formatTime(row.checkIn)}
                              </td>
                              <td>
                                <i className="bi bi-box-arrow-right me-1 text-danger"></i>
                                {formatTime(row.checkOut)}
                              </td>
                              <td>{row.totalHoursFormatted || '-'}</td>
                              <td>
                                {row.status === 'PUNTUAL' ? (
                                  <span className="badge bg-success">
                                    <i className="bi bi-check-circle me-1"></i>
                                    PUNTUAL
                                  </span>
                                ) : (
                                  <span className="badge bg-danger">
                                    <i className="bi bi-exclamation-circle me-1"></i>
                                    TARDE
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default ReportsList;