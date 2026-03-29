/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Registration from './pages/Registration';
import Login from './pages/Login';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PatientIntake from './pages/PatientIntake';
import DoctorAssignment from './pages/DoctorAssignment';
import PatientDirectory from './pages/PatientDirectory';
import PatientProfile from './pages/PatientProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import MedicalRecords from './pages/MedicalRecords';
import AdminDashboard from './pages/AdminDashboard';
import LabResults from './pages/LabResults';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import { useAuth } from './lib/auth';

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const { user, hydrate } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      hydrate();
    }
  }, [user, hydrate]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const RequireRole = ({ role, children }: { role: Array<'admin' | 'doctor' | 'receptionist'>; children: React.ReactElement }) => {
  const { user } = useAuth();
  if (!user || !role.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RequireRole role={['receptionist', 'admin']}>
                <ReceptionistDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/intake"
          element={
            <RequireAuth>
              <RequireRole role={['receptionist', 'admin']}>
                <PatientIntake />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/assignment"
          element={
            <RequireAuth>
              <RequireRole role={['receptionist', 'admin']}>
                <DoctorAssignment />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/patients"
          element={
            <RequireAuth>
              <RequireRole role={['receptionist', 'admin']}>
                <PatientDirectory />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/patient/:id"
          element={
            <RequireAuth>
              <RequireRole role={['receptionist', 'doctor', 'admin']}>
                <PatientProfile />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor"
          element={
            <RequireAuth>
              <RequireRole role={['doctor', 'admin']}>
                <DoctorDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/records"
          element={
            <RequireAuth>
              <RequireRole role={['doctor', 'admin']}>
                <MedicalRecords />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole role={['admin']}>
                <AdminDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireRole role={['admin', 'receptionist']}>
                <UserManagement />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <RequireAuth>
              <RequireRole role={['admin']}>
                <AuditLogs />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/lab"
          element={
            <RequireAuth>
              <RequireRole role={['doctor', 'admin']}>
                <LabResults />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <RequireRole role={['receptionist', 'doctor', 'admin']}>
                <Settings />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
