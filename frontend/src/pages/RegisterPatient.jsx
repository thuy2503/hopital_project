import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';

export default function RegisterPatient() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ 
    fullName: '', dob: '', phone: '', gender: 'Nam', username: '', password: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register-patient`, formData);
      setSuccess(t('register_patient.form.success') || 'Tạo hồ sơ thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || (i18n.language === 'vi' ? 'Trùng tên đăng nhập hoặc lỗi hệ thống!' : 'Username exists or server error!'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-gray-100">
      <div className="absolute top-8 left-8 z-20">
        <Link to="/" className="flex items-center gap-2 text-primary-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
           <Home size={18} /> {t('landing.back_home')}
        </Link>
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-200/40 blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative z-10">
        <div className="p-8">
          <div className="mb-6 text-center border-b border-gray-100 pb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('register_patient.title')}</h2>
            <p className="text-gray-500 mt-2 font-medium">{t('register_patient.desc')}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl">{success}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('register_patient.form.full_name')} <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder-gray-400 font-medium" placeholder={i18n.language === 'vi' ? "Nguyễn Văn A" : "John Doe"} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('register_patient.form.dob')} <span className="text-red-500">*</span></label>
                <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('register_patient.form.phone')} <span className="text-red-500">*</span></label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder-gray-400 font-medium" placeholder="0912 345 678" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('register_patient.form.gender')}</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all font-medium text-gray-900">
                  <option value="Nam">{i18n.language === 'vi' ? 'Nam' : 'Male'}</option>
                  <option value="Nữ">{i18n.language === 'vi' ? 'Nữ' : 'Female'}</option>
                  <option value="Khác">{i18n.language === 'vi' ? 'Khác' : 'Other'}</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('register_patient.form.username')}</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-0 focus:ring-4 focus:ring-primary-500/20 outline-none font-medium placeholder-gray-400" placeholder={i18n.language === 'vi' ? "Số điện thoại hoặc CMND" : "Phone or ID"} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('register_patient.form.password')}</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-0 focus:ring-4 focus:ring-primary-500/20 outline-none font-medium placeholder-gray-400" placeholder={i18n.language === 'vi' ? "Tạo mật khẩu an toàn" : "Secure password"} />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2 disabled:opacity-50">
              {loading ? t('register_patient.form.loading') : t('register_patient.form.submit')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 font-medium">{t('register_patient.form.have_account')} <Link to="/login" className="text-primary-600 hover:text-primary-700 underline font-bold px-1">{t('auth.login_now')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
