import React, { useState, useEffect } from "react";
import { rolesService } from "../../services/rolesService";
import UserForm from "./UserForm";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    loadUsers();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await rolesService.getAll();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      showAlert("danger", "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  // Función de búsqueda
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    
    if (value.trim() === "") {
      setFilteredUsers(users);
      return;
    }

    const searchLower = value.toLowerCase().trim();
    const filtered = users.filter(user => {
      const fullName = user.fullName?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";
      const roles = user.roles?.map(r => r.name.toLowerCase()).join(" ") || "";
      
      return fullName.includes(searchLower) || 
             username.includes(searchLower) || 
             roles.includes(searchLower);
    });

    setFilteredUsers(filtered);
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generar números de página
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
      await rolesService.delete(userToDelete.idUser);
      setShowDeleteModal(false);
      setUserToDelete(null);
      showAlert("success", "Usuario eliminado correctamente");
      loadUsers();
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "Error al eliminar usuario");
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleSave = (isEdit) => {
    setShowModal(false);
    setSelectedUser(null);
    showAlert("success", isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
    loadUsers();
  };

  // Exportar a PDF
  const exportToPDF = async () => {
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : users;
    if (dataToExport.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Encabezado del PDF
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#0d6efd");
    doc.setFontSize(16);
    doc.text("REPORTE DE USUARIOS", pageWidth / 2, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth / 2, 22, { align: "center" });

    // Tabla
    const headers = ["ID", "NOMBRE COMPLETO", "USUARIO", "ROLES", "ESTADO", "FECHA REGISTRO"];
    const colWidths = [10, 60, 40, 50, 25, 40];
    const startY = 35;
    const startX = 10;
    const rowHeight = 8;

    // Dibujar encabezados
    doc.setFillColor(230, 230, 230);
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
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
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
        String(row.idUser),
        row.fullName || "—",
        row.username || "—",
        row.roles?.map(r => r.name).join(", ") || "—",
        row.enabled ? "Activo" : "Inactivo",
        row.registrationDate ? new Date(row.registrationDate).toLocaleDateString('es-PE') : "—"
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
        `Página ${i} de ${totalPages} - Total de usuarios: ${dataToExport.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(`Reporte-Usuarios_${new Date().toISOString().split("T")[0]}.pdf`);
    showAlert('success', 'PDF generado correctamente');
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : users;
    
    const excelData = dataToExport.map(u => ({
      'ID': u.idUser,
      'Nombre Completo': u.fullName,
      'Usuario': u.username,
      'Email': u.email || '',
      'Roles': u.roles?.map(r => r.name).join(", ") || '',
      'Estado': u.enabled ? 'Activo' : 'Inactivo',
      'Fecha Registro': u.registrationDate ? new Date(u.registrationDate).toLocaleDateString('es-PE') : ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
      { wch: 20 }, { wch: 10 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, `Usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <h1 className="h3 mb-0 text-gray-800">Gestión de Usuarios</h1>
        <div className="d-flex gap-2">
          <button 
            className="d-sm-inline-block btn btn-sm btn-success shadow-sm"
            onClick={exportToExcel}
            disabled={users.length === 0}
          >
            <i className="bi bi-file-earmark-excel text-white-50 me-1"></i> Excel
          </button>
          <button 
            className="d-sm-inline-block btn btn-sm btn-danger shadow-sm"
            onClick={exportToPDF}
            disabled={users.length === 0}
          >
            <i className="bi bi-file-earmark-pdf text-white-50 me-1"></i> PDF
          </button>
        </div>
      </div>

      {/* Search Card */}
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
                placeholder="Buscar por nombre, usuario o rol..."
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
              <span className="d-none d-md-inline">Nuevo Usuario</span>
              <span className="d-inline d-md-none">Nuevo</span>
            </button>
          </div>
          
          {searchTerm && (
            <small className="text-muted d-block mt-2">
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </small>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando usuarios...</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!loading && (
        <div className="card shadow mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table" id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr className="table-secondary">
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Roles</th>
                    <th>Estado</th>
                    <th>Foto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((u) => (
                      <tr key={u.idUser}>
                        <td>{u.idUser}</td>
                        <td>{u.fullName}</td>
                        <td>{u.username}</td>
                        <td>
                          {u.roles?.map((r) => (
                            <span key={r.idRole} className="badge bg-info me-1">
                              {r.name}
                            </span>
                          )) || "—"}
                        </td>
                        <td>
                          <span className={`badge ${u.enabled ? 'bg-success' : 'bg-danger'}`}>
                            {u.enabled ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-center">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
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
                            onClick={() => handleEdit(u)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => openDeleteModal(u)}
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
              {filteredUsers.length > 0 && totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">
                    Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} registros
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
              {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h6>
          </div>
          <div className="card-body">
            <UserForm 
              user={selectedUser} 
              onClose={() => {
                setShowModal(false);
                setSelectedUser(null);
              }}
              onSave={handleSave}
            />
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {showDeleteModal && userToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Usuario?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar al usuario <strong>"{userToDelete.fullName}"</strong>?</p>
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

export default UserList;