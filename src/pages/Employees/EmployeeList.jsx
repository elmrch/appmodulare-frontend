import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import EmployeeForm from "./EmployeeForm";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

// ✅ FUNCIÓN PARA FORMATEAR FECHAS SIN PROBLEMAS DE ZONA HORARIA
const formatDateSafe = (dateString) => {
  if (!dateString) return "—";
  
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  
  try {
    const date = new Date(dateString + 'T00:00:00');
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
      'Fecha Ingreso': formatDateSafe(e.hireDate)
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Empleados");
    XLSX.writeFile(wb, `Empleados_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert("success", "Excel generado correctamente");
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
                Gestión de Empleados
              </h2>
              <p className="text-muted mb-0">{employees.length} empleados registrados</p>
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <div className="btn-group" role="group">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={exportToExcel}
                  disabled={employees.length === 0}
                  title="Exportar a Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Excel
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={exportToPDF}
                  disabled={employees.length === 0}
                  title="Exportar a PDF"
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i>
                  PDF
                </button>
              </div>

              <button className="btn btn-primary d-flex align-items-center" onClick={handleNew}>
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Empleado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="input-group">
            <span className="input-group-text bg-primary text-white">
              <i className="bi bi-search"></i>
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
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          {searchTerm && (
            <small className="text-muted mt-2 d-block">
              Mostrando {filteredEmployees.length} de {employees.length} empleados
            </small>
          )}
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
              Cargando empleados...
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border border-secondary">
              <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  <i className="bi bi-table me-2"></i>
                  Lista de Empleados
                </h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary btn-sm d-flex align-items-center" onClick={handleNew}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo Empleado
                  </button>
                </div>
              </div>
              
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-muted">ID</th>
                        <th className="py-3 text-muted">Nombre Completo</th>
                        <th className="py-3 text-muted">DNI</th>
                        <th className="py-3 d-none d-md-table-cell text-muted">Área</th>
                        <th className="py-3 d-none d-lg-table-cell text-muted">Puesto</th>
                        <th className="py-3 d-none d-lg-table-cell text-muted">Horario</th>
                        <th className="py-3 d-none d-xl-table-cell text-muted">Ingreso</th>
                        <th className="py-3 text-center text-muted">Foto</th>
                        <th className="py-3 text-end pe-4 text-muted">Acciones</th>
                      </tr>
                    </thead>
                    
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((e) => (
                          <tr key={e.id}>
                            <td className="px-4">
                              <span className="badge bg-secondary">#{e.id}</span>
                            </td>
                            <td>
                              <strong className="text-dark">{e.firstName} {e.lastName}</strong>
                            </td>
                            <td>{e.dni}</td>
                            <td className="d-none d-md-table-cell">
                              {e.area?.name || "—"}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              {e.position || "—"}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              {e.schedule ? `${e.schedule.startTime} - ${e.schedule.endTime}` : "—"}
                            </td>
                            <td className="d-none d-xl-table-cell">
                              {formatDateSafe(e.hireDate)}
                            </td>
                            <td className="text-center">
                              {e.photoUrl ? (
                                <img
                                  src={e.photoUrl}
                                  alt="foto"
                                  className="rounded-circle"
                                  style={{ width: "45px", height: "45px", objectFit: "cover" }}
                                />
                              ) : (
                                <i className="bi bi-person-circle fs-3 text-muted"></i>
                              )}
                            </td>
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button 
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEdit(e)}
                                  title="Editar"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => openDeleteModal(e)}
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
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Formulario de creación/edición */}
      {showModal && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border border-primary">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  <i className={`bi ${selectedEmployee ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                </h5>
              </div>
              <div className="card-body">
                <EmployeeForm 
                  employee={selectedEmployee} 
                  onClose={() => {
                    setShowModal(false);
                    setSelectedEmployee(null);
                  }}
                  onSave={handleSave}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Delete */}
      {showDeleteModal && employeeToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirmar Eliminación
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-2">¿Estás seguro de eliminar este empleado?</p>
                <p className="fs-5 fw-bold text-danger mb-2">
                  {employeeToDelete.firstName} {employeeToDelete.lastName}
                </p>
                <p className="text-muted small mb-0">Esta acción no se puede deshacer</p>
              </div>
              <div className="modal-footer justify-content-center gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                >
                  <i className="bi bi-trash me-1"></i>
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