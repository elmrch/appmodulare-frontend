import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import EmployeeForm from "./EmployeeForm";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "./EmployeeList.css";

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

  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(8); 

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
    setCurrentPage(1);
    
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
// Cálculos de paginación
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};

const handlePrevious = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};

const handleNext = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};

// Generar números de página con puntos suspensivos
const getPageNumbers = () => {
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
  }
  
  return pageNumbers;
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
    setTimeout(() => {
    const form = document.getElementById("employee-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 150);
  };

const handleNew = () => {
  setSelectedEmployee(null);
  setShowModal(true);

  setTimeout(() => {
    const form = document.getElementById("employee-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 150); 
};


  const handleSave = (isEdit) => {
    setShowModal(false);
    setSelectedEmployee(null);
    showAlert("success", isEdit ? "Empleado actualizado correctamente" : "Empleado creado correctamente");
    loadEmployees();
  };


  // Exportar a PDF
  const exportToPDF = async () => {
    const dataToExport = filteredEmployees.length > 0 ? filteredEmployees : employees;
    if (dataToExport.length === 0) {
      showAlert("warning", "No hay datos para exportar");
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
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Empleados", 30, 24);

    // Tabla
    const headers = ["ID", "EMPLEADO", "DNI", "ÁREA", "PUESTO", "HORARIO", "INGRESO"];
    const colWidths = [10, 65, 25, 40, 40, 45, 30];
    const startY = 35;
    const startX = 10;
    const rowHeight = 8;

    // Dibujar encabezados de la tabla
    doc.setFillColor(230, 230, 230); // Gris claro para el fondo del header
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    let xPos = startX;

    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], rowHeight, "FD");
      xPos += colWidths[i];
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    xPos = startX;

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

    dataToExport.forEach((row, index) => {
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

      xPos = startX;
      headers.forEach((_, i) => {
        doc.rect(xPos, yPos, colWidths[i], rowHeight, "FD");
        xPos += colWidths[i];
      });

      const rowData = [
        String(row.id),
        `${row.firstName} ${row.lastName}`,
        row.dni || "—",
        row.area?.name || "—",
        row.position || "—",
        row.schedule ? `${row.schedule.startTime} - ${row.schedule.endTime}` : "—",
        formatDateSafe(row.hireDate)
      ];

      xPos = startX;
      rowData.forEach((cell, i) => {
        doc.text(cell, xPos + 2, yPos + 5.5);
        xPos += colWidths[i];
      });

      yPos += rowHeight;
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${totalPages} - Total de empleados: ${dataToExport.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(`Reporte-Empleados_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert('success', 'PDF generado correctamente');
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
        <h1 className="h3 mb-0 text-gray-800">Gestión de Empleados</h1>
        <div className="d-flex gap-2">
          <button 
            className=" d-sm-inline-block btn btn-sm btn-success shadow-sm"
            onClick={exportToExcel}
            disabled={employees.length === 0}
          >
            <i className="bi bi-file-earmark-excel text-white-50 me-1"></i> Excel
          </button>
          <button 
            className="d-sm-inline-block btn btn-sm btn-danger shadow-sm"
            onClick={exportToPDF}
            disabled={employees.length === 0}
          >
            <i className="bi bi-file-earmark-pdf text-white-50 me-1"></i> PDF
          </button>

        </div>
      </div>

      {/* Search Card */}


    

      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando empleados...</p>
          </div>
        </div>
      )}

      {/* DataTales Example */}
      {!loading && (
        <div className="card shadow mb-4">
      <div className="card shadow mb-4">

    <div className="card-body">
  <div className="d-flex gap-2 align-items-start mb-3">
    <div className="input-group flex-grow-1">
      <span className="input-group-text">
        <i className="bi bi-search"></i>
      </span>
      <input
        type="text"
        className="form-control input-sm"
        placeholder="Buscar por nombre o DNI..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {searchTerm && (
        <button 
          className="btn btn-outline-secondary" 
          type="button"
          onClick={() => handleSearch("")}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      )}
    </div>
    
    <button 
      className="btn btn-sm btn-primary shadow-sm text-nowrap" 
      onClick={handleNew}
    >
      <i className="bi bi-plus-circle me-1"></i>
      <span className="d-none d-md-inline">Nuevo Empleado</span>
      <span className="d-inline d-md-none">Nuevo</span>
    </button>
  </div>
  
  {searchTerm && (
            <small className="text-muted d-block mt-2">
              Mostrando {filteredEmployees.length} de {employees.length} empleados
            </small>
          )}
          
        </div>
      </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table " id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>DNI</th>
                    <th className=" d-md-table-cell">Área</th>
                    <th className=" d-lg-table-cell">Puesto</th>
                    <th className=" d-lg-table-cell">Horario</th>
                    <th className=" d-xl-table-cell">Ingreso</th>
                    <th>Foto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((e) => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.firstName} {e.lastName}</td>
                        <td>{e.dni}</td>
                        <td className=" d-md-table-cell">
                          {e.area?.name || "—"}
                        </td>
                        <td className=" d-lg-table-cell">
                          {e.position || "—"}
                        </td>
                        <td className=" d-lg-table-cell">
                          {e.schedule ? `${e.schedule.startTime} - ${e.schedule.endTime}` : "—"}
                        </td>
                        <td className=" d-xl-table-cell">
                          {formatDateSafe(e.hireDate)}
                        </td>
                        <td className="text-center">
                          {e.photoUrl ? (
                            <img
                              src={e.photoUrl}
                              alt="foto"
                              className="rounded-circle"
                              style={{ width: "40px", height: "40px", objectFit: "cover" }}
                            />
                          ) : (
                            <i className="bi bi-person-circle fs-4 text-muted"></i>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-warning btn-sm me-1"
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Paginación */}
{filteredEmployees.length > 0 && totalPages > 1 && (
  <div className="d-flex justify-content-between align-items-center mt-3">
    <div className="text-muted small">
      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredEmployees.length)} de {filteredEmployees.length} registros
    </div>
    
    <nav aria-label="Navegación de páginas">
      <ul className="pagination mb-0">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Anterior"
          >
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>
        
        {getPageNumbers().map((pageNum, index) => (
          pageNum === '...' ? (
            <li key={`ellipsis-${index}`} className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          ) : (
            <li 
              key={pageNum} 
              className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
            >
              <button 
                className="page-link" 
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            </li>
          )
          
        ))}
        
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Siguiente"
          >
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
)}
            </div>
          </div>
        </div>
      )}
  {/* Formulario de creación/edición */}
      {showModal && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h6>
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
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Empleado?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar al empleado <strong>"{employeeToDelete.firstName} {employeeToDelete.lastName}"</strong>?</p>
                <p className="text-muted small">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
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
                  Eliminar
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