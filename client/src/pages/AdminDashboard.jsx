import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Calendar, IndianRupee, TrendingUp, Shield, AlertTriangle, BarChart3, CheckCircle, UserX, UserCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes, emergencyRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getUsers({ limit: 50 }),
        adminAPI.getEmergency(),
      ]);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data.users);
      setEmergencies(emergencyRes.data.data);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const searchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ search: userSearch || undefined, role: userRole || undefined });
      setUsers(res.data.data.users);
    } catch (err) { console.error(err); }
  };

  const toggleUser = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('User status updated');
      searchUsers();
    } catch (err) { toast.error('Failed'); }
  };

  const approveEmergency = async (id) => {
    try {
      await adminAPI.approveEmergency(id);
      toast.success('Emergency approved');
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading admin panel..." />;

  const userCounts = {};
  analytics?.users?.forEach((u) => { userCounts[u.role] = parseInt(u.count); });
  const apptCounts = {};
  analytics?.appointments?.forEach((a) => { apptCounts[a.status] = parseInt(a.count); });

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-surface-500">System overview and management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: userCounts.patient || 0, icon: Users, color: 'primary', bg: 'bg-primary-50' },
          { label: 'Total Doctors', value: userCounts.doctor || 0, icon: TrendingUp, color: 'accent', bg: 'bg-accent-50' },
          { label: 'Today Appointments', value: analytics?.todayAppointments || 0, icon: Calendar, color: 'violet', bg: 'bg-violet-50' },
          { label: 'Total Revenue', value: `₹${Math.round(analytics?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'amber', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-surface-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'emergency', label: 'Emergency', icon: AlertTriangle },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
            <t.icon className="w-4 h-4" />{t.label}
            {t.key === 'emergency' && emergencies.length > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{emergencies.length}</span>}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Appointment Status Breakdown</h3>
            <div className="space-y-3">
              {analytics?.appointments?.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <StatusBadge status={a.status} />
                  <span className="font-bold text-lg">{a.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-accent-50 rounded-xl">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-accent-700">₹{Math.round(analytics?.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary-50 rounded-xl">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-lg font-bold text-primary-700">₹{Math.round(analytics?.monthlyRevenue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="card md:col-span-2">
            <h3 className="font-bold text-lg mb-4">Doctor Workload (Today)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-surface-200">
                  <th className="text-left py-2 text-surface-500">Doctor</th>
                  <th className="text-left py-2 text-surface-500">Specialization</th>
                  <th className="text-center py-2 text-surface-500">Booked</th>
                  <th className="text-center py-2 text-surface-500">Completed</th>
                  <th className="text-center py-2 text-surface-500">Utilization</th>
                </tr></thead>
                <tbody>
                  {analytics?.doctorWorkload?.map((d, i) => (
                    <tr key={i} className="border-b border-surface-100">
                      <td className="py-3 font-medium">Dr. {d.first_name} {d.last_name}</td>
                      <td className="py-3 text-surface-600">{d.specialization}</td>
                      <td className="py-3 text-center">{d.booked_count || 0}</td>
                      <td className="py-3 text-center">{d.completed_count || 0}</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${d.utilization_percent || 0}%` }} />
                          </div>
                          <span className="text-xs font-medium">{d.utilization_percent || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="card mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchUsers()} className="input-field pl-10" placeholder="Search users..." />
              </div>
              <select value={userRole} onChange={(e) => { setUserRole(e.target.value); }} className="input-field w-auto">
                <option value="">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="admin">Admins</option>
              </select>
              <button onClick={searchUsers} className="btn-primary">Search</button>
            </div>
          </div>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${u.role === 'doctor' ? 'bg-accent-500' : u.role === 'admin' ? 'bg-primary-600' : 'bg-violet-500'}`}>
                    {u.first_name[0]}{u.last_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{u.first_name} {u.last_name}</p>
                    <p className="text-sm text-surface-500">{u.email} • <span className="capitalize">{u.role}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => toggleUser(u.id)} className={`p-2 rounded-lg transition-all ${u.is_active ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                    {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Tab */}
      {tab === 'emergency' && (
        <div className="space-y-4">
          {emergencies.length === 0 ? (
            <div className="text-center py-16"><CheckCircle className="w-16 h-16 text-accent-300 mx-auto mb-4" /><p className="text-surface-500">No pending emergency bookings</p></div>
          ) : emergencies.map((e) => (
            <div key={e.id} className="card border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-700">Emergency Booking</h3>
                  </div>
                  <p className="text-sm">Patient: {e.patient_name} {e.patient_last}</p>
                  <p className="text-sm text-surface-500">Doctor: {e.doctor_name} • {e.specialization}</p>
                  <p className="text-xs text-surface-400 mt-1">{new Date(e.appointment_date).toLocaleDateString()} at {e.start_time}</p>
                </div>
                <button onClick={() => approveEmergency(e.id)} className="btn-accent text-sm">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
