import React, { useState, useEffect } from "react";
import { visitService } from "../../services/visitService";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const VisitList = () => {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredVisits.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredVisits.length / recordsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  useEffect(() => {
    loadVisits();
    const interval = setInterval(() => {
      loadVisits();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const res = await visitService.getAll();
      setVisits(res.data);
      setFilteredVisits(res.data);
    } catch (error) {
      console.error("Error al cargar visitas:", error);
      showAlert("danger", "Error al cargar visitas");
    } finally {
      setLoading(false);
    }
  };

  // BUSCAR
  const handleSearch = (value) => {
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredVisits(visits);
      setCurrentPage(1);
      return;
    }

    const term = value.toLowerCase();

    const filtered = visits.filter((v) => {
      const fullName = v.fullName?.toLowerCase() || "";
      const dni = v.dni?.toLowerCase() || "";
      const company = v.company?.toLowerCase() || "";
      const date = v.date?.toLowerCase() || "";

      return (
        fullName.includes(term) ||
        dni.includes(term) ||
        company.includes(term) ||
        date.includes(term)
      );
    });

    setFilteredVisits(filtered);
    setCurrentPage(1);
  };

  // ELIMINAR
  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar esta visita?")) {
      try {
        await visitService.delete(id);
        showAlert("success", "Visita eliminada correctamente");
        loadVisits();
      } catch (error) {
        showAlert("danger", "Error al eliminar visita");
      }
    }
  };

  /* ─────────────────────────────── EXPORTAR PDF ─────────────────────────────── */
  const exportToPDF = () => {
    const data = filteredVisits.length > 0 ? filteredVisits : visits;

    if (data.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    const headers = ["ID", "VISITANTE", "DNI", "EMPRESA", "MOTIVO", "FECHA", "INGRESO", "SALIDA", "ESTADO"];
    const colWidths = [10, 40, 20, 30, 40, 22, 22, 22, 18];
    const startY = 10;
    const startX = 10;
    const rowH = 8;

    // ENCABEZADO
    doc.setFillColor(102, 153, 204);
    let x = startX;

    headers.forEach((h, i) => {
      doc.rect(x, startY, colWidths[i], rowH, "F");
      x += colWidths[i];
    });

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    x = startX;
    headers.forEach((h, i) => {
      doc.rect(x, startY, colWidths[i], rowH);
      x += colWidths[i];
    });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);

    x = startX;
    headers.forEach((h, i) => {
      const tw = doc.getTextWidth(h);
      doc.text(h, x + (colWidths[i] - tw) / 2, startY + 5.5);
      x += colWidths[i];
    });

    // FILAS
    let y = startY + rowH;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);

    data.forEach((row, index) => {
      if (y > 190) {
        doc.addPage();
        y = 10;

        // Re-dibujar encabezado
        doc.setFillColor(102, 153, 204);
        x = startX;
        headers.forEach((h, i) => {
          doc.rect(x, y, colWidths[i], rowH, "F");
          x += colWidths[i];
        });

        x = startX;
        headers.forEach((h, i) => {
          doc.rect(x, y, colWidths[i], rowH);
          x += colWidths[i];
        });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        x = startX;
        headers.forEach((h, i) => {
          const tw = doc.getTextWidth(h);
          doc.text(h, x + (colWidths[i] - tw) / 2, y + 5.5);
          x += colWidths[i];
        });

        y += rowH;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
      }

      // Fondo alternado
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(240, 240, 240);
      }

      x = startX;
      headers.forEach((_, i) => {
        doc.rect(x, y, colWidths[i], rowH, "F");
        x += colWidths[i];
      });

      x = startX;
      headers.forEach((_, i) => {
        doc.rect(x, y, colWidths[i], rowH);
        x += colWidths[i];
      });

      const rowData = [
        String(row.id),
        row.fullName || "—",
        row.dni || "—",
        row.company || "—",
        row.reason || "—",
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
        row.status || "—",
      ];

      x = startX;
      rowData.forEach((cell, i) => {
        if (i === 0) {
          const textWidth = doc.getTextWidth(cell);
          doc.text(cell, x + (colWidths[i] - textWidth) / 2, y + 5.5);
        } else {
          doc.text(cell, x + 2, y + 5.5);
        }
        x += colWidths[i];
      });

      y += rowH;
    });

    // Footer
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

    doc.save(`Visitas_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  /* ─────────────────────────────── EXPORTAR EXCEL ───────────────────────────── */
  const exportToExcel = () => {
    const data = filteredVisits.length > 0 ? filteredVisits : visits;

    if (data.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }

    const excelData = data.map((v) => ({
      ID: v.id,
      Visitante: v.fullName,
      DNI: v.dni,
      Empresa: v.company,
      Motivo: v.reason,
      Fecha: v.date,
      Ingreso: v.checkIn ? new Date(v.checkIn).toLocaleTimeString() : "",
      Salida: v.checkOut ? new Date(v.checkOut).toLocaleTimeString() : "",
      Estado: v.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Visitas");
    XLSX.writeFile(wb, `Visitas_${new Date().toISOString().split("T")[0]}.xlsx`);

    showAlert("success", "Excel generado correctamente");
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-secondary">Sin estado</span>;

    if (status.toUpperCase() === "EN VISITA") {
      return (
        <span className="badge bg-success">
          <i className="bi bi-door-open-fill me-1"></i>EN VISITA
        </span>
      );
    } else if (status.toUpperCase() === "FINALIZADA") {
      return (
        <span className="badge bg-info text-dark">
          <i className="bi bi-check-circle-fill me-1"></i>FINALIZADA
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
                <i className="bi bi-people-fill me-2"></i>
                Gestión de Visitas
              </h2>
              <p className="text-muted mb-0">
                {filteredVisits.length} registros encontrados
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success d-flex align-items-center"
                onClick={exportToExcel}
                disabled={visits.length === 0}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar Excel
              </button>

              <button
                className="btn btn-danger d-flex align-items-center"
                onClick={exportToPDF}
                disabled={visits.length === 0}
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
              Cargando visitas...
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border border-secondary">
              <div className="card-header bg-secondary text-white py-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  Gestión de Visitas
                </h5>
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
                    placeholder="Buscar por nombre, DNI, empresa o fecha..."
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

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-muted">ID</th>
                        <th className="py-3 text-muted">Visitante</th>
                        <th className="py-3 text-muted text-center">DNI</th>
                        <th className="py-3 d-none d-md-table-cell text-muted">Empresa</th>
                        <th className="py-3 d-none d-lg-table-cell text-muted">Motivo</th>
                        <th className="py-3 d-none d-xl-table-cell text-muted text-center">
                          Fecha
                        </th>
                        <th className="py-3 d-none d-lg-table-cell text-muted text-center">
                          Ingreso
                        </th>
                        <th className="py-3 d-none d-lg-table-cell text-muted text-center">
                          Salida
                        </th>
                        <th className="py-3 text-muted text-center">Estado</th>
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
                              : "No hay visitas registradas"}
                          </td>
                        </tr>
                      ) : (
                        currentRecords.map((v) => (
                          <tr key={v.id}>
                            <td className="px-4">
                              <span className="badge bg-secondary">#{v.id}</span>
                            </td>
                            <td>
                              <strong className="text-dark">{v.fullName}</strong>
                            </td>
                            <td className="text-center">
                              <span className="text-muted">{v.dni}</span>
                            </td>
                            <td className="d-none d-md-table-cell">
                              {v.company || "—"}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              {v.reason || "—"}
                            </td>
                            <td className="text-center d-none d-xl-table-cell">
                              <span className="text-muted">
                                {formatDate(v.date)}
                              </span>
                            </td>
                            <td className="text-center d-none d-lg-table-cell">
                              {v.checkIn ? (
                                <span className="badge bg-info text-dark">
                                  {new Date(v.checkIn).toLocaleTimeString(
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
                              {v.checkOut ? (
                                <span className="badge bg-warning text-dark">
                                  {new Date(v.checkOut).toLocaleTimeString(
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
                            <td className="text-center">
                              {getStatusBadge(v.status)}
                            </td>
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(v.id)}
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
                {filteredVisits.length > recordsPerPage && (
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

export default VisitList;