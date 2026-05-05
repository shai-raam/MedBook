import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, Activity, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully!');
      navigate(user.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary-700">MedBook</span>
          </div>
          <h2 className="text-3xl font-bold text-surface-900">Create Account</h2>
          <p className="text-surface-500 mt-1">Join MedBook for smarter healthcare</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
              {['patient', 'doctor'].map((role) => (
                <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.role === role ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
                  {role === 'patient' ? '🩺 Patient' : '👨‍⚕️ Doctor'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input name="firstName" value={form.firstName} onChange={handleChange} className="input-field pl-10 text-sm" placeholder="John" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1.5">Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} className="input-field text-sm" placeholder="Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field pl-10 text-sm" placeholder="you@example.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input name="phone" value={form.phone} onChange={handleChange} className="input-field pl-10 text-sm" placeholder="9876543210" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field pl-10 text-sm" placeholder="Min 8 characters" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-surface-500">
          Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
