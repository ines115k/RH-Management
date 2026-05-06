import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardEmploye from './pages/DashboardEmploye'
import EmployeeList from './pages/Employees/EmployeeList'
import EmployeeDetail from './pages/Employees/EmployeeDetail'
import UsersPage from './pages/UsersPage'
import AttendancePage from './pages/Attendance/AttendancePage'
import LeaveRequestPage from './pages/Leave/LeaveRequestPage'
import LeaveListPage from './pages/Leave/LeaveListPage'
import LeaveCalendar from './pages/Leave/LeaveCalendar'
import PayrollEmploye from './pages/Payroll/PayrollEmploye'
import RecruitmentEmploye from './pages/Recruitment/RecruitmentEmploye'
import { useAuth } from './context/AuthContext'

function Placeholder({ title, icon }) {
  return (
    <div style={{ padding: '32px 36px' }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{title}</h2>
      <div style={{
        background: '#13131f', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: 60, textAlign: 'center', marginTop: 20,
      }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>{icon}</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Module en cours de développement</p>
      </div>
    </div>
  )
}

// Composant pour choisir le dashboard selon le rôle
function DashboardRouter() {
  const { user } = useAuth()
  
  if (user?.role === 'admin' || user?.role === 'manager') {
    return <Dashboard />
  }
  
  return <DashboardEmploye />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protégées - Avec AppLayout (sidebar) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/users" element={<UsersPage />} />
            
            {/* Présences & Congés */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave/request" element={<LeaveRequestPage />} />
            <Route path="/leave/list" element={<LeaveListPage />} />
            <Route path="/leave/calendar" element={<LeaveCalendar />} />
            
            {/* Paie & Recrutement pour employé */}
            <Route path="/payroll/employee" element={<PayrollEmploye />} />
            <Route path="/recruitment/employee" element={<RecruitmentEmploye />} />
            
            {/* Placeholders */}
            <Route path="/payroll" element={<Placeholder title="Gestion de la Paie" icon="💳" />} />
            <Route path="/recruitment" element={<Placeholder title="Recrutement" icon="🎯" />} />
          </Route>

          {/* Redirections */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}