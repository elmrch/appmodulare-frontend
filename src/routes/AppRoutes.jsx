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
import ReportsList from '../pages/Reports/ReportsList';
import AbsencesList from '../pages/Absences/AbsencesList';
import VisitList from '../pages/Visit/VisitList';
import VisitLogin from '../pages/VisitLogin/VisitLogin';
import SecurityIncidentList from '../pages/Bitacora/SecurityIncidentList';
import UserList from '../pages/UserRoles/UserList ';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/loginregister" replace />} />

      
        <Route path="/loginregister" element={<LoginRegister />} />

        <Route path="/login-admin" element={<LoginAdmin />} />
           <Route path="/Visit-Login" element={<VisitLogin/>} />

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
          <Route path="/reports" element={<ReportsList />} />
          <Route path="/absences" element={<AbsencesList />} />
          <Route path="/visitas" element={<VisitList />} />
          <Route path="/bitácora" element={<SecurityIncidentList />} />
                    <Route path="/usersroles" element={<UserList />} />

        </Route>

       
        <Route path="*" element={<Navigate to="/loginregister" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;