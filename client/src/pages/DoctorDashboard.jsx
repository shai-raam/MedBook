import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, availabilityAPI, prescriptionAPI } from '../services/api';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, Clock, Users, CheckCircle, XCircle, Play, FileText, Plus, Trash2, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [showAvail, setShowAvail] = useState(false);
  const [showPrescription, setShowPrescription] = useState(null);
  const [newAvail, setNewAvail] = useState({ dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', slotDuration: 15 });
  const [prescForm, setPrescForm] = useState({ diagnosis: '', medications: '', advice: '', followUpRequired: false, followUpDays: 7 });

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const params = tab === 'today' ? { date: today } : { limit: 50 };
      const [apptRes, availRes] = await Promise.all([
        appointmentAPI.getAll(params),
        availabilityAPI.get(),
      ]);
      setAppointments(apptRes.data.data.appointments);
      setAvailability(availRes.data.data);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) { toast.error('Update failed'); }
  };

  const addAvailability = async () => {
    try {
      await availabilityAPI.set(newAvail);
      toast.success('Availability added');
      fetchData();
    } catch (err) { toast.error('Failed to add'); }
  };

  const removeAvailability = async (id) => {
    try {
      await availabilityAPI.delete(id);
      toast.success('Removed');
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  const submitPrescription = async () => {
    if (!prescForm.diagnosis) return toast.error('Diagnosis required');
    try {
      const meds = prescForm.medications ? prescForm.medications.split('\n').map((m) => {
        const parts = m.split(',').map((p) => p.trim());
        return { name: parts[0] || '', dosage: parts[1] || '', frequency: parts[2] || '', duration: parts[3] || '' };
      }) : [];
      await prescriptionAPI.create({
        appointmentId: showPrescription.id,
        diagnosis: prescForm.diagnosis,
        medications: meds,
        advice: prescForm.advice,
        followUpRequired: prescForm.followUpRequired,
        followUpDays: prescForm.followUpRequired ? prescForm.followUpDays : null,
      });
      toast.success('Prescription created');
      setShowPrescription(null);
      setPrescForm({ diagnosis: '', medications: '', advice: '', followUpRequired: false, followUpDays: 7 });
      updateStatus(showPrescription.id, 'completed');
    } catch (err) { toast.error('Failed to create prescription'); }
  };

  const todayAppointments = appointments.filter((a) => a.appointment_date?.split('T')[0] === new Date().toISOString().split('T')[0]);
  const pendingCount = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="gradient-hero rounded-2xl p-8 text-white mb-8">
        <h1 className="text-2xl font-bold mb-1">Dr. {user?.firstName} {user?.lastName}</h1>
        <p className="text-white/70">Doctor Dashboard</p>
        <div className="flex gap-6 mt-6">
          <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
            <p className="text-2xl font-bold">{todayAppointments.length}</p>
            <p className="text-sm text-white/70">Today</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-sm text-white/70">Pending</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-sm text-white/70">Completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['today', 'all'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
            {t === 'today' ? "Today's Queue" : 'All Appointments'}
          </button>
        ))}
        <button onClick={() => setShowAvail(!showAvail)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${showAvail ? 'bg-accent-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
          <Clock className="w-4 h-4 inline mr-1" />Availability
        </button>
      </div>

      {/* Availability Panel */}
      {showAvail && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-bold text-lg mb-4">Manage Availability</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={newAvail.dayOfWeek} onChange={(e) => setNewAvail({ ...newAvail, dayOfWeek: e.target.value })} className="input-field w-auto">
              {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
            <input type="time" value={newAvail.startTime} onChange={(e) => setNewAvail({ ...newAvail, startTime: e.target.value })} className="input-field w-auto" />
            <input type="time" value={newAvail.endTime} onChange={(e) => setNewAvail({ ...newAvail, endTime: e.target.value })} className="input-field w-auto" />
            <input type="number" value={newAvail.slotDuration} onChange={(e) => setNewAvail({ ...newAvail, slotDuration: parseInt(e.target.value) })} className="input-field w-20" placeholder="Min" />
            <button onClick={addAvailability} className="btn-accent"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2">
            {availability.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-surface-50 rounded-lg px-4 py-2">
                <span className="font-medium capitalize">{a.day_of_week}</span>
                <span className="text-sm text-surface-600">{a.start_time} - {a.end_time} ({a.slot_duration}min)</span>
                <button onClick={() => removeAvailability(a.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center py-16"><ClipboardList className="w-16 h-16 text-surface-200 mx-auto mb-4" /><p className="text-surface-500">No appointments</p></div>
        ) : appointments.map((appt) => (
          <div key={appt.id} className="card">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-accent-100 rounded-xl flex items-center justify-center text-accent-700 font-bold">
                  {appt.patient_first_name?.[0]}{appt.patient_last_name?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{appt.patient_first_name} {appt.patient_last_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-surface-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(appt.appointment_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{appt.start_time}</span>
                    <span>Queue: #{appt.queue_position}</span>
                  </div>
                  {appt.symptoms && <p className="text-xs text-surface-400 mt-1">Symptoms: {appt.symptoms}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={appt.status} />
                <UrgencyBadge urgency={appt.urgency} />
                {appt.status === 'confirmed' && (
                  <button onClick={() => updateStatus(appt.id, 'in_progress')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Start"><Play className="w-4 h-4" /></button>
                )}
                {appt.status === 'in_progress' && (
                  <button onClick={() => setShowPrescription(appt)} className="p-2 bg-accent-50 text-accent-600 rounded-lg hover:bg-accent-100" title="Complete & Prescribe"><FileText className="w-4 h-4" /></button>
                )}
                {appt.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(appt.id, 'confirmed')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Confirm"><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => updateStatus(appt.id, 'no_show')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="No Show"><XCircle className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prescription Modal */}
      {showPrescription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create Prescription</h3>
            <p className="text-sm text-surface-500 mb-4">Patient: {showPrescription.patient_first_name} {showPrescription.patient_last_name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Diagnosis *</label>
                <input value={prescForm.diagnosis} onChange={(e) => setPrescForm({ ...prescForm, diagnosis: e.target.value })} className="input-field" placeholder="e.g., Hypertension, Diabetes" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Medications (one per line: name, dosage, frequency, duration)</label>
                <textarea value={prescForm.medications} onChange={(e) => setPrescForm({ ...prescForm, medications: e.target.value })} className="input-field h-24 resize-none" placeholder="Metformin, 500mg, Twice daily, 30 days" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Advice</label>
                <textarea value={prescForm.advice} onChange={(e) => setPrescForm({ ...prescForm, advice: e.target.value })} className="input-field h-16 resize-none" placeholder="Dietary advice, lifestyle changes..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="followUp" checked={prescForm.followUpRequired} onChange={(e) => setPrescForm({ ...prescForm, followUpRequired: e.target.checked })} className="w-4 h-4 text-primary-600" />
                <label htmlFor="followUp" className="text-sm font-medium">Follow-up required</label>
                {prescForm.followUpRequired && (
                  <input type="number" value={prescForm.followUpDays} onChange={(e) => setPrescForm({ ...prescForm, followUpDays: parseInt(e.target.value) })} className="input-field w-20 text-sm" placeholder="Days" />
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPrescription(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitPrescription} className="btn-primary flex-1">Save & Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
