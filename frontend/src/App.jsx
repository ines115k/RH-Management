import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EmployeeList from './pages/Employees/EmployeeList'
import EmployeeDetail from './pages/Employees/EmployeeDetail'
import UsersPage from './pages/UsersPage'
import AttendancePage from './pages/Attendance/AttendancePage'
import AttendanceEmp from './pages/Attendance/AttendanceEmp'
import AttendanceHistory from './pages/Attendance/AttendanceHistory'
import LeaveRequestPage from './pages/Leave/LeaveRequestPage'
import LeaveListPage from './pages/Leave/LeaveListPage'
import LeaveCalendar from './pages/Leave/LeaveCalendar'
import PayrollEmploye from './pages/Payroll/PayrollEmploye'
import RecruitmentEmploye from './pages/Recruitment/RecruitmentEmploye'
import PayrollPage from './pages/Payroll/PayrollPage';
import RecruitmentPage from './pages/Recruitment/RecruitmentPage';

function Placeholder({ title, icon }) {
  return (
    <div style={{ padding: '32px 36px' }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{title}</h2>
      <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 60, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>{icon}</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Module en cours de développement</p>
      </div>
    </div>
  )
}

// Conditional attendance component
function AttendanceWrapper() {
  const { isAdmin, isManager } = useAuth()
  return isAdmin || isManager ? <AttendancePage /> : <AttendanceEmp />
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/employees"     element={<EmployeeList />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/attendance"    element={<AttendanceWrapper />} />
            <Route path="/attendance/history" element={<AttendanceHistory />} />
            <Route path="/leave/request" element={<LeaveRequestPage />} />
            <Route path="/leave/list"    element={<LeaveListPage />} />
            <Route path="/leave/calendar" element={<LeaveCalendar /> } />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/payroll/employee" element={<PayrollEmploye />} />
            <Route path="/recruitment" element={<RecruitmentPage />} />
            <Route path="/recruitment/employee" element={<RecruitmentEmploye />} />
            <Route path="/users"         element={<UsersPage />} />
          </Route>
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}