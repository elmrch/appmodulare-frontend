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

  // BUSCAR POR nombre, dni o fecha
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

  // ELIMINAR
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

  // EXPORTAR A PDF
  const exportToPDF = () => {
    const data = filteredAttendance.length > 0 ? filteredAttendance : attendance;

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(20);
    doc.text("REPORTE DE ASISTENCIAS", 148, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      148,
      22,
      { align: "center" }
    );

    doc.line(10, 25, 287, 25);

    let y = 35;
    const lh = 8;
    const left = 10;

    data.forEach((a, index) => {
      if (y > 190) {
        doc.addPage();
        y = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(left, y - 6, 277, lh * 5, "F");
      }

      doc.setFontSize(12);
      doc.text(`${a.id}. ${a.firstName} ${a.lastName}`, left + 2, y);

      doc.setFontSize(9);
      y += lh;

      doc.text(`DNI: ${a.dni}`, left + 2, y);
      doc.text(`Fecha: ${a.date}`, left + 2, y + lh);

      doc.text(
        `Entrada: ${
          a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "—"
        }`,
        left + 80,
        y
      );
      doc.text(
        `Salida: ${
          a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "—"
        }`,
        left + 80,
        y + lh
      );

      doc.text(`Horas: ${a.totalHours || "—"}`, left + 150, y);
      doc.text(`Estado: ${a.status}`, left + 150, y + lh);

      y += lh * 2 + 5;

      doc.setLineWidth(0.1);
      doc.line(left, y - 3, 287, y - 3);
    });

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pages} - Total registros: ${data.length}`,
        148,
        200,
        { align: "center" }
      );
    }

    doc.save(`Asistencias_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  // EXPORTAR A EXCEL
  const exportToExcel = () => {
    const data = filteredAttendance.length > 0 ? filteredAttendance : attendance;

    const excelData = data.map((a) => ({
      ID: a.id,
      Empleado: `${a.firstName} ${a.lastName}`,
      DNI: a.dni,
      Fecha: a.date,
      Entrada: a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "",
      Salida: a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "",
      Horas: a.totalHours || "",
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

  return (
    <div className="container mt-4">
      {alert && (
        <AlertNotification
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">📅 Gestión de Asistencias</h2>

        <div className="d-flex gap-2">
          <button
            className="btn btn-success btn-sm"
            onClick={exportToExcel}
            disabled={attendance.length === 0}
          >
            📊 Excel
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={exportToPDF}
            disabled={attendance.length === 0}
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-primary text-white">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, DNI o fecha..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          {searchTerm && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => handleSearch("")}
            >
              ✖
            </button>
          )}
        </div>
      </div>

      {/* LOADING */}
      {loading && <div className="alert alert-info">Cargando asistencias...</div>}

      {/* TABLE */}
      {!loading && (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
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
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    {searchTerm
                      ? "No se encontraron coincidencias"
                      : "No hay registros"}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.firstName} {a.lastName}</td>
                    <td>{a.dni}</td>
                    <td>{a.date}</td>
                    <td>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "—"}</td>
                    <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "—"}</td>
                    <td>{a.totalHours ?? "—"}</td>
                    <td>{a.status}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(a.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;
