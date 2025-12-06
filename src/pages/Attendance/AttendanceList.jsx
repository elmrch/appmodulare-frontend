import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

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
      setCurrentPage(1);
      return;
    }

    const term = value.toLowerCase();

    const filtered = attendance.filter((a) => {
      const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const dni = a.dni?.toLowerCase() || "";
      const date = a.date?.toLowerCase() || "";

      return fullName.includes(term) || dni.includes(term) || date.includes(term);
    });

    setFilteredAttendance(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este registro de asistencia?")) {
      try {
        await attendanceService.delete(id);
        showAlert("success", "Asistencia eliminada correctamente");
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
        row.checkIn
          ? new Date(row.checkIn).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
          : "—",
        row.checkOut
          ? new Date(row.checkOut).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
          : "—",
        row.totalHoursFormatted || "—",
        row.status || "—",
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
    XLSX.writeFile(
      wb,
      `Asistencias_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    showAlert("success", "Excel generado correctamente");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString + "T00:00:00");
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  const getStatusBadge = (status) => {
    if (!status)
      return <span className="badge bg-secondary">Sin estado</span>;

    if (status.toUpperCase() === "PUNTUAL") {
      return (
        <span className="badge bg-success">
          <i className="bi bi-check-circle-fill me-1"></i>PUNTUAL
        </span>
      );
    } else if (status.toUpperCase() === "TARDE") {
      return (
        <span className="badge bg-danger">
          <i className="bi bi-exclamation-triangle-fill me-1"></i>TARDE
        </span>
      );
    } else if (status.toUpperCase() === "FUERA_DE_UBICACION") {
      return (
        <span className="badge bg-warning text-dark">
          <i className="bi bi-geo-alt-fill me-1"></i>FUERA DE UBICACIÓN
        </span>
      );
    }

    return <span className="badge bg-secondary">{status}</span>;
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
                <i className="bi bi-calendar-check me-2"></i>
                Gestión de Asistencias
              </h2>
              <p className="text-muted mb-0">
                {filteredAttendance.length} registros encontrados
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success d-flex align-items-center"
                onClick={exportToExcel}
                disabled={attendance.length === 0}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar Excel
              </button>

              <button
                className="btn btn-danger d-flex align-items-center"
                onClick={exportToPDF}
                disabled={attendance.length === 0}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div
              className="alert alert-info d-flex align-items-center"
              role="alert"
            >
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
              >
                <span className="visually-hidden">Cargando...</span>
              </div>
              Cargando asistencias...
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border border-secondary">
              <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  Gestión de Asistencias
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <div className="position-relative" style={{ minWidth: "300px" }}>
                    <i
                      className="bi bi-search position-absolute"
                      style={{
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6c757d",
                      }}
                    ></i>
                    <input
                      type="text"
                      className="form-control form-control-sm ps-5"
                      placeholder="Buscar por nombre, DNI o fecha..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{ paddingRight: searchTerm ? "35px" : "10px" }}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-link position-absolute p-0"
                        style={{
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6c757d",
                        }}
                        onClick={() => handleSearch("")}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-muted">ID</th>
                        <th className="py-3 text-muted">Empleado</th>
                        <th className="py-3 text-muted text-center">DNI</th>
                        <th className="py-3 text-muted text-center">Fecha</th>
                        <th className="py-3 d-none d-lg-table-cell text-muted text-center">
                          Entrada
                        </th>
                        <th className="py-3 d-none d-lg-table-cell text-muted text-center">
                          Salida
                        </th>
                        <th className="py-3 d-none d-xl-table-cell text-muted text-center">
                          Horas
                        </th>
                        <th className="py-3 text-muted text-center">Estado</th>
                        <th className="py-3 d-none d-md-table-cell text-muted text-center">
                          📍 Ubicación
                        </th>
                        <th className="py-3 text-end pe-4 text-muted">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center py-5 text-muted"
                          >
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            {searchTerm
                              ? "No se encontraron coincidencias"
                              : "No hay registros de asistencia"}
                          </td>
                        </tr>
                      ) : (
                        currentRecords.map((a) => (
                          <tr key={a.id}>
                            <td className="px-4">
                              <span className="badge bg-secondary">#{a.id}</span>
                            </td>
                            <td>
                              <strong className="text-dark">
                                {a.firstName} {a.lastName}
                              </strong>
                            </td>
                            <td className="text-center">
                              <span className="text-muted">{a.dni}</span>
                            </td>
                            <td className="text-center">
                              <span className="text-muted">
                                {formatDate(a.date)}
                              </span>
                            </td>
                            <td className="text-center d-none d-lg-table-cell">
                              {a.checkIn ? (
                                <span className="badge bg-info text-dark">
                                  {new Date(a.checkIn).toLocaleTimeString(
                                    "es-ES",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-center d-none d-lg-table-cell">
                              {a.checkOut ? (
                                <span className="badge bg-warning text-dark">
                                  {new Date(a.checkOut).toLocaleTimeString(
                                    "es-ES",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-center d-none d-xl-table-cell">
                              <span className="badge bg-primary">
                                {a.totalHoursFormatted || "—"}
                              </span>
                            </td>
                            <td className="text-center">
                              {getStatusBadge(a.status)}
                            </td>
                            <td className="d-none d-md-table-cell">
                              <div className="d-flex flex-column align-items-center gap-1">
                                {a.checkInLatitude && a.checkInLongitude ? (
                                  <>
                                    <span
                                      className={`badge ${
                                        a.locationValid
                                          ? "bg-success"
                                          : "bg-danger"
                                      }`}
                                    >
                                      <i
                                        className={`bi ${
                                          a.locationValid
                                            ? "bi-geo-alt-fill"
                                            : "bi-exclamation-triangle-fill"
                                        } me-1`}
                                      ></i>
                                      {a.locationValid ? "Válida" : "Fuera"}
                                    </span>
                                    <small className="text-muted">
                                      <i className="bi bi-pin-map me-1"></i>
                                      {a.distanceFromOffice
                                        ? `${Math.round(a.distanceFromOffice)}m`
                                        : "N/A"}
                                    </small>
                                    <a
                                      href={`https://www.google.com/maps?q=${a.checkInLatitude},${a.checkInLongitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-primary"
                                      title="Ver en Google Maps"
                                    >
                                      <i className="bi bi-map"></i>
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
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(a.id)}
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

                {/* Paginación */}
                {filteredAttendance.length > recordsPerPage && (
                  <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left me-1"></i>
                      Anterior
                    </button>

                    <span className="fw-semibold">
                      Página {currentPage} de {totalPages}
                    </span>

                    <button
                      className="btn btn-secondary btn-sm"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;