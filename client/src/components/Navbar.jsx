import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'patient': return '/patient/dashboard';
      case 'doctor': return '/doctor/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-surface-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={getDashboardLink()} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 gradient-hero rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:shadow-primary-600/40 transition-shadow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">MedBook</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="text-surface-600 hover:text-primary-600 font-medium transition-colors px-3 py-2">Dashboard</Link>
                {user.role === 'patient' && (
                  <>
                    <Link to="/doctors" className="text-surface-600 hover:text-primary-600 font-medium transition-colors px-3 py-2">Find Doctors</Link>
                    <Link to="/patient/appointments" className="text-surface-600 hover:text-primary-600 font-medium transition-colors px-3 py-2">Appointments</Link>
                  </>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-surface-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-surface-800">{user.firstName} {user.lastName}</p>
                    <p className="text-surface-400 text-xs capitalize">{user.role}</p>
                  </div>
                  <button onClick={handleLogout} className="ml-2 p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fade-in">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="block px-4 py-2 rounded-lg hover:bg-surface-100" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                {user.role === 'patient' && (
                  <>
                    <Link to="/doctors" className="block px-4 py-2 rounded-lg hover:bg-surface-100" onClick={() => setMobileOpen(false)}>Find Doctors</Link>
                    <Link to="/patient/appointments" className="block px-4 py-2 rounded-lg hover:bg-surface-100" onClick={() => setMobileOpen(false)}>Appointments</Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 rounded-lg hover:bg-surface-100" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="block px-4 py-2 rounded-lg hover:bg-surface-100" onClick={() => setMobileOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
