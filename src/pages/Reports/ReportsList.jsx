import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { employeeService } from '../../services/employeeService';
import AlertNotification from '../Areas/AlertNotification';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// ✅ FUNCIÓN PARA FORMATEAR FECHAS SIN PROBLEMAS DE ZONA HORARIA
const formatDateSafe = (dateString) => {
  if (!dateString) return '—';
  
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PE');
  } catch {
    return '—';
  }
};

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

  // Cargar empleados al iniciar
  useEffect(() => {
    loadEmployees();
  }, []);

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

  // Exportar a Excel
  const exportToExcel = () => {
    if (reportData.length === 0) {
      showAlert('warning', 'No hay datos para exportar');
      return;
    }

    const excelData = reportData.map(row => ({
      'ID': row.id,
      'Empleado': row.employeeName,
      'DNI': row.employeeDni || '',
      'Fecha': formatDateSafe(row.date),
      'Entrada': formatTime(row.checkIn),
      'Salida': formatTime(row.checkOut),
      'Horas Trabajadas': row.totalHoursFormatted || '',
      'Estado': row.status || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Reporte de Asistencias");
    XLSX.writeFile(wb, `Reporte_Asistencias_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert('success', 'Excel generado correctamente');
  };

  // Exportar a PDF
  const exportToPDF = async () => {
    if (reportData.length === 0) {
      showAlert('warning', 'No hay datos para exportar');
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Cargar el logo
    const logo = "/src/assets/img/favicon_1.png";
    const imgData = await fetch(logo)
      .then(res => res.blob())
      .then(blob => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }));

    // Encabezado del PDF
    doc.addImage(imgData, 'PNG', 10, 8, 15, 15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#ff1d4d"); // Color corporativo
    doc.setFontSize(16);
    doc.text("MODULARE AREQUIPA SAC", 30, 18);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Asistencias", 30, 24);

    // Tabla
    const headers = ["ID", "EMPLEADO", "DNI", "FECHA", "ENTRADA", "SALIDA", "HORAS", "ESTADO"];
    const colWidths = [10, 70, 25, 25, 25, 25, 25, 25];
    const startY = 35;
    const leftMargin = 10;
    const rowHeight = 8;

    // Dibujar encabezados de la tabla
    doc.setFillColor("#ff1d4d"); // Color corporativo para el fondo del header
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    let xPos = leftMargin;

    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], rowHeight, "FD");
      xPos += colWidths[i];
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255); // Texto blanco
    xPos = leftMargin;

    headers.forEach((header, i) => {
      const textWidth = doc.getTextWidth(header);
      const textX = xPos + (colWidths[i] - textWidth) / 2;
      doc.text(header, textX, startY + 5.5);
      xPos += colWidths[i];
    });

    // Dibujar filas de datos
    let yPos = startY + rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);

    reportData.forEach((row, index) => {
      if (yPos > pageHeight - 20) { // Salto de página
        doc.addPage();
        yPos = 20; // Reiniciar Y en la nueva página
      }

      // Alternar color de filas
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(240, 240, 240);
      }

      xPos = leftMargin;
      headers.forEach((_, i) => {
        doc.rect(xPos, yPos, colWidths[i], rowHeight, "FD");
        xPos += colWidths[i];
      });

      const rowData = [
        String(row.id),
        row.employeeName,
        row.employeeDni || "—",
        formatDateSafe(row.date),
        formatTime(row.checkIn),
        formatTime(row.checkOut),
        row.totalHoursFormatted || "—",
        row.status || "—"
      ];

      xPos = leftMargin;
      rowData.forEach((cell, i) => {
        doc.text(cell, xPos + 2, yPos + 5.5);
        xPos += colWidths[i];
      });

      yPos += rowHeight;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} - Total de registros: ${reportData.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`Reporte-Asistencias_${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert('success', 'PDF generado correctamente');
  };

  // Obtener badge para estado
  const getStatusBadge = (status) => {
    if (status === 'PUNTUAL') {
      return <span className="badge bg-success">PUNTUAL</span>;
    } else if (status === 'TARDE') {
      return <span className="badge bg-danger">TARDE</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
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
        <h1 className="h3 mb-0 text-gray-800">Reportes de Asistencias</h1>
        <div className="d-flex gap-2">
          {showResults && reportData.length > 0 && (
            <>
              <button 
                className="d-none d-sm-inline-block btn btn-sm btn-success shadow-sm"
                onClick={exportToExcel}
              >
                <i className="bi bi-file-earmark-excel text-white-50 me-1"></i> Excel
              </button>
              <button 
                className="d-none d-sm-inline-block btn btn-sm btn-danger shadow-sm"
                onClick={exportToPDF}
              >
                <i className="bi bi-file-earmark-pdf text-white-50 me-1"></i> PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Card - Filtros */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Filtros de Búsqueda</h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleGenerateReport}>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Empleado</label>
                <select
                  name="employeeId"
                  className="form-control"
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

              <div className="col-md-3 mb-3">
                <label className="form-label">Estado</label>
                <select
                  name="status"
                  className="form-control"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="all">Todos</option>
                  <option value="PUNTUAL">Solo Puntuales</option>
                  <option value="TARDE">Solo Tardanzas</option>
                </select>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">Fecha Desde</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-control"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">Fecha Hasta</label>
                <input
                  type="date"
                  name="endDate"
                  className="form-control"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  required
                />
              </div>
            </div>

            <div className="text-center">
              <button 
                type="submit" 
                className="btn btn-primary shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search text-white-50 me-1"></i>
                    Generar Reporte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Generando reporte...</p>
          </div>
        </div>
      )}

      {/* RESULTADOS */}
      {showResults && (
        <>
          {/* Estadísticas */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Registros
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {statistics.total}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-list-check fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-left-success shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Puntuales
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {statistics.punctual}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-check-circle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-left-danger shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                        Tardanzas
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {statistics.late}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-exclamation-circle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Resultados del Reporte</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table" id="dataTable" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Empleado</th>
                      <th className="d-none d-md-table-cell">DNI</th>
                      <th className="d-none d-lg-table-cell">Fecha</th>
                      <th className="d-none d-lg-table-cell">Entrada</th>
                      <th className="d-none d-xl-table-cell">Salida</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                          No se encontraron registros con los filtros seleccionados
                        </td>
                      </tr>
                    ) : (
                      reportData.map(row => (
                        <tr key={row.id}>
                          <td>{row.id}</td>
                          <td>
                            <strong>{row.employeeName}</strong>
                          </td>
                          <td className="d-none d-md-table-cell">
                            {row.employeeDni || "—"}
                          </td>
                          <td className="d-none d-lg-table-cell">
                            {formatDateSafe(row.date)}
                          </td>
                          <td className="d-none d-lg-table-cell">
                            {formatTime(row.checkIn)}
                          </td>
                          <td className="d-none d-xl-table-cell">
                            {formatTime(row.checkOut)}
                          </td>
                          <td>
                            {getStatusBadge(row.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsList;