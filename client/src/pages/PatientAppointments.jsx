import { useState, useEffect } from 'react';
import { appointmentAPI } from '../services/api';
import { StatusBadge } from '../components/Badges';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, Clock, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchAppointments(); }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getAll({ status: filter || undefined, limit: 50 });
      setAppointments(res.data.data.appointments);
    } catch (err) { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentAPI.cancel(id, { reason: 'Cancelled by patient' });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <p className="text-surface-500">Manage your bookings</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto min-w-[180px]">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : appointments.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-surface-200 mx-auto mb-4" />
          <p className="text-xl text-surface-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                  {appt.doctor_first_name?.[0]}{appt.doctor_last_name?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold">Dr. {appt.doctor_first_name} {appt.doctor_last_name}</h3>
                  <p className="text-sm text-primary-600">{appt.specialization}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-surface-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(appt.appointment_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{appt.start_time} - {appt.end_time}</span>
                  </div>
                  {appt.symptoms && <p className="text-xs text-surface-400 mt-1">Symptoms: {appt.symptoms}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={appt.status} />
                {['pending', 'confirmed'].includes(appt.status) && (
                  <button onClick={() => handleCancel(appt.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Cancel">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
