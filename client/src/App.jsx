import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { RoleLayout } from './components/common/RoleLayout';

// Public Pages (Named exports)
import { Home } from './pages/public/Home';
import { PoliciesCatalog } from './pages/public/PoliciesCatalog';
import { PolicyDetails } from './pages/public/PolicyDetails';
import { ComparePolicies } from './pages/public/ComparePolicies';
import { HowClaimsWork } from './pages/public/HowClaimsWork';
import { About } from './pages/public/About';
import { FAQ } from './pages/public/FAQ';
import { Contact } from './pages/public/Contact';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';

// Customer Pages (Named exports)
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { MyPolicies } from './pages/customer/MyPolicies';
import { RegisterExternalPolicy } from './pages/customer/RegisterExternalPolicy';
import { NewClaim } from './pages/customer/NewClaim';
import { CustomerClaimsList } from './pages/customer/CustomerClaimsList';
import { CustomerClaimDetails } from './pages/customer/CustomerClaimDetails';
import { CustomerSettlements } from './pages/customer/CustomerSettlements';

// Officer Pages (Named exports)
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerQueue } from './pages/officer/OfficerQueue';
import { OfficerClaimWorkspace } from './pages/officer/OfficerClaimWorkspace';
import { OfficerExternalPolicies } from './pages/officer/OfficerExternalPolicies';

// Surveyor Pages (Named exports)
import { SurveyorDashboard } from './pages/surveyor/SurveyorDashboard';
import { SurveyorInspections } from './pages/surveyor/SurveyorInspections';
import { SurveyorReportWorkspace } from './pages/surveyor/SurveyorReportWorkspace';

// Manager Pages (Default exports)
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerDecisions from './pages/manager/ManagerDecisions';
import ManagerClaimWorkspace from './pages/manager/ManagerClaimWorkspace';
import ManagerSettlements from './pages/manager/ManagerSettlements';

// Administrator Pages (Default exports)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PolicyManagement from './pages/admin/PolicyManagement';
import RuleManagement from './pages/admin/RuleManagement';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <Routes>
      {/* 11 Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/policies" element={<PoliciesCatalog />} />
      <Route path="/policies/:id" element={<PolicyDetails />} />
      <Route path="/compare" element={<ComparePolicies />} />
      <Route path="/how-it-works" element={<HowClaimsWork />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Customer Protected Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <RoleLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="policies" element={<MyPolicies />} />
        <Route path="policies/register-external" element={<RegisterExternalPolicy />} />
        <Route path="claims/new" element={<NewClaim />} />
        <Route path="claims" element={<CustomerClaimsList />} />
        <Route path="claims/:id" element={<CustomerClaimDetails />} />
        <Route path="settlements" element={<CustomerSettlements />} />
      </Route>

      {/* Insurance Officer Protected Routes */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
            <RoleLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/officer/dashboard" replace />} />
        <Route path="dashboard" element={<OfficerDashboard />} />
        <Route path="queue" element={<OfficerQueue />} />
        <Route path="claims/:id" element={<OfficerClaimWorkspace />} />
        <Route path="external-policies" element={<OfficerExternalPolicies />} />
      </Route>

      {/* Surveyor Protected Routes */}
      <Route
        path="/surveyor"
        element={
          <ProtectedRoute allowedRoles={['SURVEYOR', 'ADMIN']}>
            <RoleLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/surveyor/dashboard" replace />} />
        <Route path="dashboard" element={<SurveyorDashboard />} />
        <Route path="inspections" element={<SurveyorInspections />} />
        <Route path="inspections/:id" element={<SurveyorReportWorkspace />} />
      </Route>

      {/* Manager Protected Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <RoleLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="decisions" element={<ManagerDecisions />} />
        <Route path="claims/:id" element={<ManagerClaimWorkspace />} />
        <Route path="settlements" element={<ManagerSettlements />} />
      </Route>

      {/* Administrator Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <RoleLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="policies" element={<PolicyManagement />} />
        <Route path="rules" element={<RuleManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
