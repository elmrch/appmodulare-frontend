import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import AreaList from '../pages/Areas/AreaList';
import ScheduleList from '../pages/Schedules/ScheduleList';
import EmployeeList from '../pages/Employees/EmployeeList';
import AttendanceList from '../pages/Attendance/AttendanceList';
import LoginRegister from '../pages/LoginAttedance/LoginRegister';
import LoginAdmin from '../pages/Auth/LoginAdmin';
import PrivateRoute from './PrivateRoute';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login para marcar asistencia */}
        <Route path="/" element={<LoginRegister />} />

        {/* Login para administración */}
        <Route path="/login-admin" element={<LoginAdmin />} />

        {/* Rutas protegidas */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/areas" element={<AreaList />} />
          <Route path="/schedules" element={<ScheduleList />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/attendance" element={<AttendanceList />} />
        </Route>

        {/* Si ponen algo extraño → login asistencia */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
