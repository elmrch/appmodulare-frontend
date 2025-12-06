import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "./Attendance.css";

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8; 

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAttendance.length / recordsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll();
      setAttendance(res.data);
      setFilteredAttendance(res.data);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      showAlert("danger", "Error al cargar asistencias");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredAttendance(attendance);
      return;
    }

    const term = value.toLowerCase();

    const filtered = attendance.filter((a) => {
      const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const dni = a.dni?.toLowerCase() || "";
      const date = a.date?.toLowerCase() || "";

      return (
        fullName.includes(term) ||
        dni.includes(term) ||
        date.includes(term)
      );
    });

    setFilteredAttendance(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este registro de asistencia?")) {
      try {
        await attendanceService.delete(id);
        showAlert("success", "Asistencia eliminada");
        loadAttendance();
      } catch (error) {
        console.error("Error:", error);
        showAlert("danger", "Error al eliminar asistencia");
      }
    }
  };

  const exportToPDF = () => {
    const data = filteredAttendance.length > 0 ? filteredAttendance : attendance;
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
    
    data.forEach((row, index) => {
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
        `${row.firstName} ${row.lastName}`,
        row.dni || "—",
        row.date || "—",
        row.checkIn ? new Date(row.checkIn).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }) : "—",
        row.checkOut ? new Date(row.checkOut).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }) : "—",
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
        `Página ${i} de ${totalPages} - Total registros: ${data.length}`,
        pageWidth / 2,
        200,
        { align: "center" }
      );
    }
    
    doc.save(`Asistencias_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  const exportToExcel = () => {
    const data = filteredAttendance.length > 0 ? filteredAttendance : attendance;

    const excelData = data.map((a) => ({
      ID: a.id,
      Empleado: `${a.firstName} ${a.lastName}`,
      DNI: a.dni,
      Fecha: a.date,
      Entrada: a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "",
      Salida: a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "",
      Horas: a.totalHoursFormatted || "",
      Estado: a.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
    XLSX.writeFile(wb, `Asistencias_${new Date().toISOString().split("T")[0]}.xlsx`);

    showAlert("success", "Excel generado correctamente");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString + "T00:00:00");
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-secondary">Sin estado</span>;
    
    if (status.toUpperCase() === "PUNTUAL") {
      return <span className="badge bg-success"><i className="bi bi-check-circle-fill me-1"></i>PUNTUAL</span>;
    } else if (status.toUpperCase() === "TARDE") {
      return <span className="badge bg-danger"><i className="bi bi-exclamation-triangle-fill me-1"></i>TARDE</span>;
    } else if (status.toUpperCase() === "FUERA_DE_UBICACION") {
      return <span className="badge bg-warning text-dark"><i className="bi bi-geo-alt-fill me-1"></i>FUERA DE UBICACIÓN</span>;
    }
    
    return <span className="badge bg-secondary">{status}</span>;
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

      <div className="attendance-header">
        <div className="header-left">
          <h2 className="page-title">
            <i className="bi bi-calendar-check"></i>
            Gestión de Asistencias
          </h2>
          <p className="page-subtitle">
            {filteredAttendance.length} registros encontrados
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-success btn-export"
            onClick={exportToExcel}
            disabled={attendance.length === 0}
          >
            <i className="bi bi-file-earmark-excel me-1"></i>
            Exportar Excel
          </button>

          <button
            className="btn btn-danger btn-export"
            onClick={exportToPDF}
            disabled={attendance.length === 0}
          >
            <i className="bi bi-file-earmark-pdf me-1"></i>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="search-box">
        <i className="bi bi-search search-icon"></i>
        <input
          type="text"
          className="form-control search-input"
          placeholder="Buscar por nombre, DNI o fecha..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        {searchTerm && (
          <button
            className="btn btn-clear"
            onClick={() => handleSearch("")}
          >
            <i className="bi bi-x-circle"></i>
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando asistencias...</p>
        </div>
      )}

      {!loading && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="table attendance-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }} className="text-center">ID</th>
                  <th style={{ width: '16%' }}>Empleado</th>
                  <th style={{ width: '10%' }} className="text-center">DNI</th>
                  <th style={{ width: '12%' }} className="text-center">Fecha</th>
                  <th style={{ width: '9%' }} className="text-center">Entrada</th>
                  <th style={{ width: '9%' }} className="text-center">Salida</th>
                  <th style={{ width: '8%' }} className="text-center">Horas</th>
                  <th style={{ width: '10%' }} className="text-center">Estado</th>
                  <th style={{ width: '14%' }} className="text-center">📍 Ubicación</th>
                  <th style={{ width: '7%' }} className="text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center empty-state">
                      <i className="bi bi-inbox display-4 text-muted"></i>
                      <p className="mt-2">
                        {searchTerm
                          ? "No se encontraron coincidencias"
                          : "No hay registros de asistencia"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((a) => (
                    <tr key={a.id} className="attendance-row">
                      <td className="fw-bold text-primary text-center">#{a.id}</td>
                      <td>
                        <span className="fw-semibold">{a.firstName} {a.lastName}</span>
                      </td>
                      <td className="text-center">
                        <span className="text-muted">{a.dni}</span>
                      </td>
                      <td className="text-center">
                        <span className="text-muted">{formatDate(a.date)}</span>
                      </td>
                      <td className="text-center">
                        {a.checkIn ? (
                          <span className="time-badge time-in">
                            {new Date(a.checkIn).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        {a.checkOut ? (
                          <span className="time-badge time-out">
                            {new Date(a.checkOut).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-info text-dark">
                          {a.totalHoursFormatted || "—"}
                        </span>
                      </td>
                      <td className="text-center">
                        {getStatusBadge(a.status)}
                      </td>
                      <td>
                        <div className="location-info">
                          {a.checkInLatitude && a.checkInLongitude ? (
                            <>
                              <div className="mb-1">
                                <span className={`badge ${a.locationValid ? 'bg-success' : 'bg-danger'}`}>
                                  <i className={`bi ${a.locationValid ? 'bi-geo-alt-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i>
                                  {a.locationValid ? 'Válida' : 'Fuera'}
                                </span>
                              </div>
                              <small className="text-muted d-block">
                                <i className="bi bi-pin-map me-1"></i>
                                {a.distanceFromOffice ? `${Math.round(a.distanceFromOffice)}m` : 'N/A'}
                              </small>
                              <a 
                                href={`https://www.google.com/maps?q=${a.checkInLatitude},${a.checkInLongitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary mt-1"
                                title="Ver en Google Maps"
                              >
                                <i className="bi bi-map"></i> Mapa
                              </a>
                            </>
                          ) : (
                            <span className="badge bg-secondary">
                              <i className="bi bi-question-circle me-1"></i>
                              Sin GPS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-danger btn-sm btn-delete"
                          onClick={() => handleDelete(a.id)}
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

            {filteredAttendance.length > recordsPerPage && (
              <div className="pagination-container d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
                <button
                  className="btn btn-secondary"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left me-1"></i>
                  Anterior
                </button>
                
                <span className="fw-semibold">Página {currentPage} de {totalPages}</span>
                
                <button
                  className="btn btn-secondary"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;