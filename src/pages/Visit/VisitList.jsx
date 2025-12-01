import React, { useState, useEffect } from "react";
import  {visitService}  from "../../services/visitService";
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
  };

  // ELIMINAR
  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar esta visita?")) {
      try {
        await visitService.delete(id);
        showAlert("success", "Visita eliminada");
        loadVisits();
      } catch (error) {
        showAlert("danger", "Error al eliminar visita");
      }
    }
  };

  /* ─────────────────────────────── EXPORTAR PDF ─────────────────────────────── */
  const exportToPDF = () => {
    const data = filteredVisits.length > 0 ? filteredVisits : visits;
    const doc = new jsPDF("l", "mm", "a4");

    const headers = ["ID", "Visitante", "DNI", "Empresa", "Motivo", "Fecha", "Ingreso", "Salida", "Estado"];
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
      }

      x = startX;
      const rowData = [
        String(row.id),
        row.fullName || "—",
        row.dni || "—",
        row.company || "—",
        row.reason || "—",
        row.date || "—",
        row.checkIn ? new Date(row.checkIn).toLocaleTimeString("es-PE") : "—",
        row.checkOut ? new Date(row.checkOut).toLocaleTimeString("es-PE") : "—",
        row.status || "—",
      ];

      rowData.forEach((cell, i) => {
        doc.rect(x, y, colWidths[i], rowH);
        doc.text(cell, x + 2, y + 5.5);
        x += colWidths[i];
      });

      y += rowH;
    });

    doc.save(`Visitas_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert("success", "PDF generado");
  };

  /* ─────────────────────────────── EXPORTAR EXCEL ───────────────────────────── */
  const exportToExcel = () => {
    const data = filteredVisits.length > 0 ? filteredVisits : visits;

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
      { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
      { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Visitas");
    XLSX.writeFile(wb, `Visitas_${new Date().toISOString().split("T")[0]}.xlsx`);

    showAlert("success", "Excel generado");
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES");
  };

  return (
    <div className="attendance-container">
      {alert && (
        <AlertNotification type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <div className="attendance-header">
        <div>
          <h2 className="page-title">
            <i className="bi bi-people-fill"></i>
            Gestión de Visitas
          </h2>
          <p className="page-subtitle">{filteredVisits.length} registros encontrados</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-success" onClick={exportToExcel}>
            <i className="bi bi-file-earmark-excel me-1"></i>
            Excel
          </button>
          <button className="btn btn-danger" onClick={exportToPDF}>
            <i className="bi bi-file-earmark-pdf me-1"></i>
            PDF
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="search-box">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre, DNI, empresa o fecha..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="table attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Visitante</th>
                <th>DNI</th>
                <th>Empresa</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {currentRecords.map((v) => (
                <tr key={v.id}>
                  <td>#{v.id}</td>
                  <td>{v.fullName}</td>
                  <td>{v.dni}</td>
                  <td>{v.company}</td>
                  <td>{v.reason}</td>
                  <td>{formatDate(v.date)}</td>
                  <td>{v.checkIn ? new Date(v.checkIn).toLocaleTimeString() : "—"}</td>
                  <td>{v.checkOut ? new Date(v.checkOut).toLocaleTimeString() : "—"}</td>
                  <td>{v.status}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(v.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVisits.length > recordsPerPage && (
            <div className="pagination mt-2 d-flex justify-content-between">
              <button className="btn btn-secondary" disabled={currentPage === 1} onClick={handlePrevious}>
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button className="btn btn-secondary" disabled={currentPage === totalPages} onClick={handleNext}>
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitList;
