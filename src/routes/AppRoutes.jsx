import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import AreaList from '../pages/Areas/AreaList';
// Importar más páginas cuando las crees

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/areas" element={<AreaList />} />
          {/* Agregar más rutas aquí */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRoutes;