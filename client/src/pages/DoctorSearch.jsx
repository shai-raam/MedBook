import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Star, Clock, IndianRupee, Briefcase, Filter } from 'lucide-react';

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const spec = searchParams.get('specialization');
    if (spec) setSelectedSpec(spec);
    fetchSpecializations();
    fetchDoctors(spec || '');
  }, []);

  const fetchSpecializations = async () => {
    try {
      const res = await doctorAPI.getSpecializations();
      setSpecializations(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchDoctors = async (spec = selectedSpec) => {
    setLoading(true);
    try {
      const res = await doctorAPI.getAll({ specialization: spec || undefined, search: search || undefined });
      setDoctors(res.data.data.doctors);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Find a Doctor</h1>
        <p className="text-surface-500 mt-1">Search by name, specialization, or department</p>
      </div>

      {/* Search & Filters */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11" placeholder="Search doctors..." />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <select value={selectedSpec} onChange={(e) => { setSelectedSpec(e.target.value); fetchDoctors(e.target.value); }}
              className="input-field pl-10 pr-8 appearance-none min-w-[200px]">
              <option value="">All Specializations</option>
              {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {/* Results */}
      {loading ? <LoadingSpinner text="Finding doctors..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Search className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500 text-lg">No doctors found</p>
              <p className="text-surface-400 text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            doctors.map((doc) => (
              <div key={doc.id} className="card hover:shadow-lg hover:border-primary-200 transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {doc.first_name[0]}{doc.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-surface-800 group-hover:text-primary-600 transition-colors">Dr. {doc.first_name} {doc.last_name}</h3>
                    <p className="text-sm text-primary-600 font-medium">{doc.specialization}</p>
                    {doc.department && <p className="text-xs text-surface-400">{doc.department}</p>}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Briefcase className="w-4 h-4 text-surface-400" />
                    <span>{doc.experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Clock className="w-4 h-4 text-surface-400" />
                    <span>{doc.avg_consultation_time} min consultation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span>{doc.rating > 0 ? `${doc.rating} rating` : 'New doctor'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                  <div className="flex items-center gap-1 text-lg font-bold text-surface-800">
                    <IndianRupee className="w-4 h-4" />
                    {doc.consultation_fee}
                  </div>
                  <Link to={`/book/${doc.id}`} className="btn-primary text-sm py-2 px-4">Book Now</Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
