import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, prescriptionAPI, triageAPI } from '../services/api';
import { StatusBadge } from '../components/Badges';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, Clock, Stethoscope, FileText, Search, Brain, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTriage, setShowTriage] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apptRes, prescRes] = await Promise.all([
        appointmentAPI.getAll({ limit: 5 }),
        prescriptionAPI.getMyPrescriptions(),
      ]);
      setAppointments(apptRes.data.data.appointments);
      setPrescriptions(prescRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSymptoms = async () => {
    try {
      const res = await triageAPI.getSymptoms();
      setAllSymptoms(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriage = async () => {
    if (symptoms.length === 0) return toast.error('Select at least one symptom');
    setTriageLoading(true);
    try {
      const res = await triageAPI.analyze(symptoms);
      setTriageResult(res.data.data);
    } catch (err) {
      toast.error('Triage analysis failed');
    } finally {
      setTriageLoading(false);
    }
  };

  const toggleSymptom = (name) => {
    setSymptoms((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);
  };

  const upcoming = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status));
  const todayCount = appointments.filter((a) => a.appointment_date?.split('T')[0] === new Date().toISOString().split('T')[0]).length;

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="page-container animate-fade-in">
      {/* Welcome */}
      <div className="gradient-hero rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.firstName}! 👋</h1>
          <p className="text-white/70">Here's your health overview for today</p>
          <div className="flex gap-6 mt-6">
            <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-white/70">Upcoming</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-white/70">Today</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-2xl font-bold">{prescriptions.length}</p>
              <p className="text-sm text-white/70">Prescriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/doctors" className="card flex items-center gap-4 hover:border-primary-200 group cursor-pointer">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <Search className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-800">Find Doctors</h3>
            <p className="text-sm text-surface-500">Search & book appointments</p>
          </div>
        </Link>

        <button onClick={() => { setShowTriage(!showTriage); if (!showTriage) loadSymptoms(); }}
          className="card flex items-center gap-4 hover:border-accent-200 group cursor-pointer text-left">
          <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center group-hover:bg-accent-200 transition-colors">
            <Brain className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-800">Smart Triage</h3>
            <p className="text-sm text-surface-500">AI symptom checker</p>
          </div>
        </button>

        <Link to="/patient/appointments" className="card flex items-center gap-4 hover:border-violet-200 group cursor-pointer">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
            <Calendar className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-800">My Appointments</h3>
            <p className="text-sm text-surface-500">View all bookings</p>
          </div>
        </Link>
      </div>

      {/* Smart Triage Panel */}
      {showTriage && (
        <div className="card mb-8 animate-slide-up">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-600" /> Smart Symptom Triage
          </h3>
          <p className="text-sm text-surface-500 mb-4">Select your symptoms and we'll recommend the right specialist</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {allSymptoms.map((s) => (
              <button key={s.id} onClick={() => toggleSymptom(s.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  symptoms.includes(s.name)
                    ? 'bg-accent-600 text-white shadow-md'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}>
                {s.name}
              </button>
            ))}
          </div>

          {symptoms.length > 0 && (
            <button onClick={handleTriage} disabled={triageLoading} className="btn-accent flex items-center gap-2">
              {triageLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Analyze Symptoms
            </button>
          )}

          {triageResult && (
            <div className="mt-6 p-4 bg-accent-50 rounded-xl border border-accent-100 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className={`w-5 h-5 ${triageResult.urgency === 'emergency' ? 'text-red-500' : triageResult.urgency === 'high' ? 'text-orange-500' : 'text-accent-600'}`} />
                <span className="font-semibold capitalize">Urgency: {triageResult.urgency}</span>
              </div>
              <p className="text-sm text-surface-600 mb-3">Recommended specializations:</p>
              <div className="space-y-2">
                {triageResult.specializations?.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <span className="font-medium">{s.specialization}</span>
                    <span className="text-sm text-surface-500">Score: {s.score}</span>
                  </div>
                ))}
              </div>
              {triageResult.recommendedDoctors?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-surface-700 mb-2">Recommended Doctors:</p>
                  {triageResult.recommendedDoctors.slice(0, 3).map((d, i) => (
                    <Link key={i} to={`/book/${d.id}`} className="block bg-white p-3 rounded-lg mb-2 hover:bg-primary-50 transition-colors">
                      <span className="font-medium">Dr. {d.first_name} {d.last_name}</span>
                      <span className="text-sm text-surface-500 ml-2">• {d.specialization} • ₹{d.consultation_fee}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-surface-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" /> Recent Appointments
          </h2>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="card text-center py-8">
                <Stethoscope className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No appointments yet</p>
                <Link to="/doctors" className="btn-primary mt-4 inline-block text-sm">Book Now</Link>
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Dr. {appt.doctor_first_name} {appt.doctor_last_name}</p>
                    <p className="text-sm text-surface-500">{appt.specialization}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-surface-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(appt.appointment_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{appt.start_time}</span>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div>
          <h2 className="text-lg font-bold text-surface-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-600" /> Recent Prescriptions
          </h2>
          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="card text-center py-8">
                <FileText className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No prescriptions yet</p>
              </div>
            ) : (
              prescriptions.slice(0, 5).map((p) => (
                <div key={p.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{p.diagnosis}</p>
                      <p className="text-sm text-surface-500">Dr. {p.doctor_first_name} {p.doctor_last_name} • {p.specialization}</p>
                      <p className="text-xs text-surface-400 mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    {p.follow_up_required && <span className="badge-warning">Follow-up needed</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
