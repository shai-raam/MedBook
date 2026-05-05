import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorSearch from './pages/DoctorSearch';
import BookAppointment from './pages/BookAppointment';
import PatientAppointments from './pages/PatientAppointments';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-500 font-medium">Loading MedBook...</p>
        </div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'patient': return '/patient/dashboard';
      case 'doctor': return '/doctor/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {user && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getDefaultRoute()} /> : <Register />} />

        {/* Patient */}
        <Route path="/patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><PatientAppointments /></ProtectedRoute>} />
        <Route path="/doctors" element={<ProtectedRoute roles={['patient']}><DoctorSearch /></ProtectedRoute>} />
        <Route path="/book/:doctorId" element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>} />

        {/* Doctor */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-surface-300 mb-4">403</h1>
              <p className="text-xl text-surface-600 mb-2">Access Denied</p>
              <p className="text-surface-400">You don't have permission to access this page.</p>
            </div>
          </div>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </div>
  );
};

export default App;
