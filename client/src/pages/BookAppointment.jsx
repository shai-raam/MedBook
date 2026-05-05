import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI, paymentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, Clock, Star, IndianRupee, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1); // 1: Select date/slot, 2: Details, 3: Payment

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    try {
      const res = await doctorAPI.getById(doctorId);
      setDoctor(res.data.data);
    } catch (err) {
      toast.error('Doctor not found');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (selectedDate) => {
    try {
      const res = await doctorAPI.getSlots(doctorId, selectedDate);
      setSlots(res.data.data.slots);
      setRecommended(res.data.data.recommendedSlot);
    } catch (err) {
      toast.error('Failed to load slots');
    }
  };

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    setSelectedSlot(null);
    if (d) fetchSlots(d);
  };

  const handleBook = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');
    setBooking(true);
    try {
      const res = await appointmentAPI.create({
        doctorId,
        appointmentDate: date,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        symptoms: symptoms || null,
      });

      const appointmentId = res.data.data.appointment.id;

      // Initiate payment
      try {
        const orderRes = await paymentAPI.createOrder({ appointmentId });
        const { orderId, amount, currency, keyId } = orderRes.data.data;

        const options = {
          key: keyId,
          amount,
          currency,
          name: 'MedBook Hospital',
          description: `Appointment with Dr. ${doctor.first_name} ${doctor.last_name}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              await paymentAPI.verify(response);
              toast.success('Payment successful! Appointment confirmed.');
              navigate('/patient/appointments');
            } catch (err) {
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          prefill: { name: '', email: '', contact: '' },
          theme: { color: '#4f46e5' },
        };

        if (window.Razorpay && !keyId.includes('xxxxxxxxxxxxx')) {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            toast.error(response.error.description || 'Payment failed');
          });
          rzp.open();
        } else {
          toast.success('Appointment booked! (Payment skipped in demo mode)');
          navigate('/patient/appointments');
        }
      } catch (payErr) {
        console.error('Payment Error:', payErr);
        toast.success('Appointment booked successfully! (Payment gateway not configured)');
        navigate('/patient/appointments');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const availableSlots = slots.filter((s) => s.is_available);

  if (loading) return <LoadingSpinner text="Loading doctor details..." />;
  if (!doctor) return null;

  return (
    <div className="page-container animate-fade-in max-w-4xl">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-500'
            }`}>{s}</div>
            <span className={`text-sm font-medium hidden sm:block ${step >= s ? 'text-primary-600' : 'text-surface-400'}`}>
              {s === 1 ? 'Select Slot' : s === 2 ? 'Details' : 'Payment'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-surface-200'}`} />}
          </div>
        ))}
      </div>

      {/* Doctor Card */}
      <div className="card mb-6 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {doctor.first_name[0]}{doctor.last_name[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Dr. {doctor.first_name} {doctor.last_name}</h2>
          <p className="text-primary-600 font-medium">{doctor.specialization}</p>
          <p className="text-sm text-surface-500">{doctor.qualification}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-surface-600">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" />{doctor.rating || 'New'}</span>
            <span>{doctor.experience_years} yrs exp</span>
            <span className="flex items-center gap-1 font-bold"><IndianRupee className="w-3.5 h-3.5" />{doctor.consultation_fee}</span>
          </div>
        </div>
      </div>

      {/* Step 1: Date & Slot Selection */}
      {step === 1 && (
        <div className="animate-slide-up">
          <div className="card mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" />Select Date</h3>
            <input type="date" value={date} onChange={handleDateChange} min={today} className="input-field max-w-xs" />
          </div>

          {date && (
            <div className="card">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Clock className="w-5 h-5 text-primary-600" />Available Slots</h3>
              {recommended && (
                <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-xl flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent-600" />
                  <span className="text-sm font-medium text-accent-700">Recommended: {recommended.start_time} - {recommended.end_time}</span>
                </div>
              )}
              {slots.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-surface-500">No slots available for this date</p>
                  <p className="text-sm text-surface-400">Try another date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((slot, i) => (
                    <button key={i} disabled={!slot.is_available}
                      onClick={() => { setSelectedSlot(slot); }}
                      className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
                        !slot.is_available ? 'bg-surface-100 text-surface-300 cursor-not-allowed line-through' :
                        selectedSlot?.start_time === slot.start_time ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' :
                        recommended?.start_time === slot.start_time ? 'bg-accent-100 text-accent-700 border-2 border-accent-300 hover:bg-accent-200' :
                        'bg-surface-50 text-surface-700 hover:bg-primary-50 hover:text-primary-600 border border-surface-200'
                      }`}>
                      {slot.start_time}
                    </button>
                  ))}
                </div>
              )}
              {selectedSlot && (
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                    Continue <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="card animate-slide-up">
          <h3 className="font-bold text-lg mb-4">Appointment Details</h3>
          <div className="bg-surface-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-surface-400">Date:</span><p className="font-semibold">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              <div><span className="text-surface-400">Time:</span><p className="font-semibold">{selectedSlot.start_time} - {selectedSlot.end_time}</p></div>
              <div><span className="text-surface-400">Doctor:</span><p className="font-semibold">Dr. {doctor.first_name} {doctor.last_name}</p></div>
              <div><span className="text-surface-400">Fee:</span><p className="font-semibold">₹{doctor.consultation_fee}</p></div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Symptoms / Reason for visit (optional)</label>
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="input-field h-24 resize-none" placeholder="Describe your symptoms..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button onClick={() => setStep(3)} className="btn-primary">Proceed to Payment</button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="card animate-slide-up text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IndianRupee className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Payment Summary</h3>
          <p className="text-3xl font-bold text-primary-600 mb-1">₹{doctor.consultation_fee}</p>
          <p className="text-surface-500 text-sm mb-6">Consultation fee for Dr. {doctor.first_name} {doctor.last_name}</p>
          <div className="bg-surface-50 rounded-xl p-4 mb-6 max-w-sm mx-auto text-sm text-left">
            <div className="flex justify-between mb-2"><span className="text-surface-500">Date</span><span className="font-medium">{new Date(date).toLocaleDateString()}</span></div>
            <div className="flex justify-between mb-2"><span className="text-surface-500">Time</span><span className="font-medium">{selectedSlot.start_time}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><span className="font-semibold">Total</span><span className="font-bold text-primary-600">₹{doctor.consultation_fee}</span></div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <button onClick={handleBook} disabled={booking} className="btn-primary flex items-center gap-2">
              {booking ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Pay & Confirm</span><CheckCircle className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
