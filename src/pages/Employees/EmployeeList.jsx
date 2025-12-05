import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import EmployeeForm from "./EmployeeForm";
import AlertNotification from "../Areas/AlertNotification";
//import "./EmployeeList.css"; // Usa los mismos estilos

import jsPDF from "jspdf";
import * as XLSX from "xlsx";

// ✅ FUNCIÓN PARA FORMATEAR FECHAS SIN PROBLEMAS DE ZONA HORARIA
const formatDateSafe = (dateString) => {
  if (!dateString) return "—";
  
  // Si la fecha viene en formato YYYY-MM-DD
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Fallback: usar Date pero con precaución
  try {
    const date = new Date(dateString + 'T00:00:00'); // Forzar medianoche local
    return date.toLocaleDateString('es-PE');
  } catch {
    return "—";
  }
};

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      showAlert("danger", "Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  };

  // Función de búsqueda
  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (value.trim() === "") {
      setFilteredEmployees(employees);
      return;
    }

    const searchLower = value.toLowerCase().trim();
    const filtered = employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const dni = emp.dni?.toLowerCase() || "";
      
      return fullName.includes(searchLower) || dni.includes(searchLower);
    });

    setFilteredEmployees(filtered);
  };

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await employeeService.delete(employeeToDelete.id);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      showAlert("success", "Empleado eliminado correctamente");
      loadEmployees();
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "Error al eliminar empleado");
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handleSave = (isEdit) => {
    setShowModal(false);
    setSelectedEmployee(null);
    showAlert("success", isEdit ? "Empleado actualizado correctamente" : "Empleado creado correctamente");
    loadEmployees();
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const dataToExport = filteredEmployees.length > 0 ? filteredEmployees : employees;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("LISTA DE EMPLEADOS", 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148, 22, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(52, 73, 94);
    doc.line(10, 25, 287, 25);
    
    let yPos = 35;
    const lineHeight = 8;
    const leftMargin = 10;
    
    dataToExport.forEach((e, index) => {
      if (yPos > 190) {
        doc.addPage();
        yPos = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(leftMargin, yPos - 6, 277, lineHeight * 5, 'F');
      }
      
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.setFont(undefined, 'bold');
      doc.text(`${e.id}. ${e.firstName} ${e.lastName}`, leftMargin + 2, yPos);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(80, 80, 80);
      
      yPos += lineHeight;
      
      doc.text(`DNI: ${e.dni}`, leftMargin + 2, yPos);
      doc.text(`Email: ${e.email}`, leftMargin + 2, yPos + lineHeight);
      
      doc.text(`Teléfono: ${e.phone || "—"}`, leftMargin + 80, yPos);
      doc.text(`Área: ${e.area ? e.area.name : "—"}`, leftMargin + 80, yPos + lineHeight);
      
      doc.text(`Puesto: ${e.position || "—"}`, leftMargin + 150, yPos);
      doc.text(`Sueldo: ${e.salary ? "S/ " + parseFloat(e.salary).toFixed(2) : "—"}`, leftMargin + 150, yPos + lineHeight);
      
      doc.text(`Horario: ${e.schedule ? `${e.schedule.startTime} - ${e.schedule.endTime}` : "—"}`, leftMargin + 220, yPos);
      // ✅ Usar formatDateSafe para el PDF
      doc.text(`Ingreso: ${formatDateSafe(e.hireDate)}`, leftMargin + 220, yPos + lineHeight);
      
      yPos += lineHeight * 2 + 5;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(leftMargin, yPos - 3, 287, yPos - 3);
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} - Total de empleados: ${dataToExport.length}`,
        148,
        200,
        { align: 'center' }
      );
    }
    
    doc.save(`Empleados_${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredEmployees.length > 0 ? filteredEmployees : employees;
    
    const excelData = dataToExport.map(e => ({
      'ID': e.id,
      'Nombre': e.firstName,
      'Apellido': e.lastName,
      'DNI': e.dni,
      'Email': e.email,
      'Teléfono': e.phone || '',
      'Área': e.area ? e.area.name : '',
      'Puesto': e.position || '',
      'Sueldo': e.salary || '',
      'Horario Inicio': e.schedule ? e.schedule.startTime : '',
      'Horario Fin': e.schedule ? e.schedule.endTime : '',
      // ✅ Guardar fecha en formato legible en Excel
      'Fecha Ingreso': formatDateSafe(e.hireDate)
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Empleados");
    XLSX.writeFile(wb, `Empleados_${new Date().toISOString().split('T')[0]}.xlsx`);
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">👨‍💼 Gestión de Empleados</h2>
        
        <div className="d-flex gap-2 flex-wrap">
          <div className="btn-group" role="group">
            <button 
              className="btn btn-success btn-sm"
              onClick={exportToExcel}
              disabled={employees.length === 0}
              title="Exportar a Excel"
            >
              📊 Excel
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={exportToPDF}
              disabled={employees.length === 0}
              title="Exportar a PDF"
            >
              📄 PDF
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleNew}>
            ➕ Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-primary text-white">
            🔍
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={() => handleSearch("")}
              title="Limpiar búsqueda"
            >
              ✖
            </button>
          )}
        </div>
        {searchTerm && (
          <small className="text-muted">
            Mostrando {filteredEmployees.length} de {employees.length} empleados
          </small>
        )}
      </div>

      {loading && <div className="alert alert-info">Cargando empleados...</div>}

      {!loading && (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Área</th>
                <th>Puesto</th>
                <th>Sueldo</th>
                <th>Horario</th>
                <th>Ingreso</th>
                <th>Foto</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center">
                    {searchTerm ? "No se encontraron empleados con ese criterio" : "No hay empleados registrados"}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.firstName} {e.lastName}</td>
                    <td>{e.dni}</td>
                    <td>{e.email}</td>
                    <td>{e.phone}</td>
                    <td>{e.area ? e.area.name : "—"}</td>
                    <td>{e.position}</td>
                    <td>
                      {e.salary
                        ? "S/ " + parseFloat(e.salary).toFixed(2)
                        : "—"}
                    </td>
                    <td>
                      {e.schedule
                        ? `${e.schedule.startTime} - ${e.schedule.endTime}`
                        : "—"}
                    </td>
                    <td>
                      {/* ✅ AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL */}
                      {formatDateSafe(e.hireDate)}
                    </td>
                    <td>
                      {e.photoUrl ? (
                        <img 
                          src={e.photoUrl} 
                          alt="foto" 
                          style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-warning btn-sm me-2 px-2 py-1"
                        onClick={() => handleEdit(e)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm px-2 py-1"
                        onClick={() => openDeleteModal(e)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EmployeeForm
          employee={selectedEmployee}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {showDeleteModal && employeeToDelete && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">⚠️ Confirmar Eliminación</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-2">¿Estás seguro de eliminar al empleado?</p>
                <p className="fs-5 fw-bold text-danger mb-2">
                  {employeeToDelete.firstName} {employeeToDelete.lastName}
                </p>
                <p className="text-muted small">Esta acción no se puede deshacer</p>
              </div>
              <div className="modal-footer justify-content-center">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;