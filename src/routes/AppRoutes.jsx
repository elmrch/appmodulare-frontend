import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import AreaList from '../pages/Areas/AreaList';
import ScheduleList from '../pages/Schedules/ScheduleList';
import EmployeeList from '../pages/Employees/EmployeeList';
import AttendanceList from '../pages/Attendance/AttendanceList';
import LoginRegister from '../pages/LoginAttedance/LoginRegister'
// Importar más páginas cuando las crees

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/areas" element={<AreaList />} />
           <Route path="/Schedules" element={<ScheduleList />} />
           <Route path="/Employees" element={<EmployeeList />} />
           <Route path="/loginattedance" element={<LoginRegister />} />
           <Route path="/attendance" element={<AttendanceList />} />

          {/* Agregar más rutas aquí */}
        </Routes>
      </Layout>
      
    </BrowserRouter>
  );
};

export default AppRoutes;