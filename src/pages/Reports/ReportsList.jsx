import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { employeeService } from '../../services/employeeService';
import AlertNotification from '../Areas/AlertNotification';
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
  const [alert, setAlert] = useState(null);

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

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  // Cargar lista de empleados
  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error cargando empleados:', error);
      showAlert('danger', 'Error al cargar empleados');
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
    setAlert(null);
    
    try {
      const response = await reportService.generateAttendanceReport(filters);
      
      if (response.data.success) {
        setReportData(response.data.data);
        setStatistics(response.data.statistics);
        setShowResults(true);
        showAlert('success', 'Reporte generado correctamente');
      } else {
        showAlert('danger', response.data.message || 'Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      showAlert('danger', 'Error al generar el reporte. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '—';
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
      showAlert('warning', 'No hay datos para exportar');
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
    
    showAlert('success', 'Excel exportado correctamente');
  };

  // Exportar a PDF
  const exportToPDF = () => {
    if (reportData.length === 0) {
      showAlert('warning', 'No hay datos para exportar');
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const headers = ["ID", "EMPLEADO", "DNI", "FECHA", "ENTRADA", "SALIDA", "HORAS", "ESTADO"];
    const colWidths = [12, 55, 25, 28, 35, 35, 22, 33];
    const startY = 10;
    const startX = 10;
    const rowHeight = 8;
    
    doc.setFillColor(102, 153, 204);
    let xPos = startX;
    
    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], rowHeight, "F");
      xPos += colWidths[i];
    });
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    xPos = startX;
    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], rowHeight);
      xPos += colWidths[i];
    });
    
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
    
    let yPos = startY + rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);
    
    reportData.forEach((row, index) => {
      if (yPos > 190) {
        doc.addPage();
        yPos = 10;
        
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
      
      xPos = startX;
      headers.forEach((_, i) => {
        doc.rect(xPos, yPos, colWidths[i], rowHeight);
        xPos += colWidths[i];
      });
      
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
      
      xPos = startX;
      rowData.forEach((cell, i) => {
        if (i === 0) {
          const textWidth = doc.getTextWidth(cell);
          doc.text(cell, xPos + (colWidths[i] - textWidth) / 2, yPos + 5.5);
        } else {
          doc.text(cell, xPos + 2, yPos + 5.5);
        }
        xPos += colWidths[i];
      });
      
      yPos += rowHeight;
    });
    
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
    
    doc.save(`Reporte-Asistencias_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert('success', 'PDF generado correctamente');
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
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                Reportes de Asistencias
              </h2>
              <p className="text-muted mb-0">Genera reportes personalizados de asistencias</p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD DE FILTROS */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border border-primary">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0 d-flex align-items-center fw-bold">
                <i className="bi bi-funnel me-2"></i>
                Filtros de Búsqueda
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerateReport}>
                <div className="row g-3">
                  {/* Empleado */}
                  <div className="col-md-6">
                    <label htmlFor="employeeId" className="form-label fw-semibold">
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
                    <label htmlFor="status" className="form-label fw-semibold">
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
                    <label htmlFor="startDate" className="form-label fw-semibold">
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
                    <label htmlFor="endDate" className="form-label fw-semibold">
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
                    className="btn btn-primary btn-lg d-flex align-items-center"
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
              Generando reporte...
            </div>
          </div>
        </div>
      )}

      {/* RESULTADOS */}
      {showResults && (
        <>
          {/* ESTADÍSTICAS */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-primary shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-list-check fs-1 text-primary"></i>
                  <h3 className="mt-2 mb-0 fw-bold">{statistics.total}</h3>
                  <p className="text-muted mb-0">Total Registros</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-success shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-check-circle fs-1 text-success"></i>
                  <h3 className="mt-2 mb-0 fw-bold">{statistics.punctual}</h3>
                  <p className="text-muted mb-0">Puntuales</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-danger shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-exclamation-circle fs-1 text-danger"></i>
                  <h3 className="mt-2 mb-0 fw-bold">{statistics.late}</h3>
                  <p className="text-muted mb-0">Tardanzas</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA DE RESULTADOS */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border border-secondary">
                <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center fw-bold">
                    <i className="bi bi-table me-2"></i>
                    Resultados del Reporte
                  </h5>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-success btn-sm d-flex align-items-center"
                      onClick={handleExportExcel}
                    >
                      <i className="bi bi-file-earmark-excel me-2"></i>
                      Exportar Excel
                    </button>
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center"
                      onClick={exportToPDF}
                    >
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Exportar PDF
                    </button>
                  </div>
                </div>
                
                <div className="card-body p-0">
                  <div className="table-responsive">
                    {reportData.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-inbox fs-1 d-block mb-2 text-muted"></i>
                        <p className="text-muted mb-0">No se encontraron registros con los filtros seleccionados</p>
                      </div>
                    ) : (
                      <table className="table table-hover table-bordered align-middle mb-0">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-muted">ID</th>
                            <th className="py-3 text-muted">Empleado</th>
                            <th className="py-3 text-muted text-center">DNI</th>
                            <th className="py-3 d-none d-md-table-cell text-muted text-center">Fecha</th>
                            <th className="py-3 d-none d-lg-table-cell text-muted text-center">Entrada</th>
                            <th className="py-3 d-none d-lg-table-cell text-muted text-center">Salida</th>
                            <th className="py-3 d-none d-xl-table-cell text-muted text-center">Horas</th>
                            <th className="py-3 text-muted text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map(row => (
                            <tr key={row.id}>
                              <td className="px-4">
                                <span className="badge bg-secondary">#{row.id}</span>
                              </td>
                              <td>
                                <strong className="text-dark">{row.employeeName}</strong>
                              </td>
                              <td className="text-center">
                                <span className="text-muted">{row.employeeDni}</span>
                              </td>
                              <td className="text-center d-none d-md-table-cell">
                                <span className="text-muted">{formatDate(row.date)}</span>
                              </td>
                              <td className="text-center d-none d-lg-table-cell">
                                <span className="badge bg-info text-dark">
                                  <i className="bi bi-box-arrow-in-right me-1"></i>
                                  {formatTime(row.checkIn)}
                                </span>
                              </td>
                              <td className="text-center d-none d-lg-table-cell">
                                <span className="badge bg-warning text-dark">
                                  <i className="bi bi-box-arrow-right me-1"></i>
                                  {formatTime(row.checkOut)}
                                </span>
                              </td>
                              <td className="text-center d-none d-xl-table-cell">
                                <span className="badge bg-primary">
                                  {row.totalHoursFormatted || '—'}
                                </span>
                              </td>
                              <td className="text-center">
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsList;