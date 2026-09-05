import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'STAFF' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      setSuccess(t('auth.register_success') || 'Đăng ký tài khoản thành công! Tự động chuyển hướng đến Đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || t('auth.register_error') || 'Trùng tên đăng nhập hoặc lỗi hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const mockData = {
        email: `social_${provider}_${Math.floor(Math.random()*1000)}@medpro.vn`,
        name: `User ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        provider: provider,
        socialId: `ID_${Math.random()}`
      };
      
      const res = await axios.post(`${API_BASE_URL}/api/auth/social`, mockData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(`Lỗi đăng ký qua ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-gray-100">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-200/40 blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-teal-100/60 blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative z-10">
        <div className="p-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('auth.register_title')}</h2>
            <p className="text-gray-500 mt-2 font-medium">MedPro EMR</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl">{error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl">{success}</div>}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.full_name')}</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder-gray-400 font-medium" placeholder={t('auth.full_name')} />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.role')}</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all font-medium text-gray-900">
                <option value="NURSE">NURSE / Điều dưỡng</option>
                <option value="PHARMACIST">PHARMACIST / Dược sĩ</option>
                <option value="ACCOUNTANT">ACCOUNTANT / Kế toán</option>
                <option value="DOCTOR">DOCTOR / Bác sĩ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.username')}</label>
              <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder-gray-400 font-medium" placeholder={t('auth.username')} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.password')}</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder-gray-400 font-medium" placeholder={t('auth.password')} />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2 disabled:opacity-50"            >
              {loading ? t('settings.saving') : t('auth.register_btn')}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest text-[10px]">Or register via</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button type="button" onClick={() => handleSocialLogin('google')} className="flex items-center justify-center p-3 rounded-xl border border-gray-200 hover:bg-red-50 transition-all group">
                <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.32-2.12 4.4-1.2 1.2-3.04 2.12-5.72 2.12-4.56 0-8.28-3.68-8.28-8.24s3.72-8.24 8.28-8.24c2.48 0 4.28.96 5.64 2.24l2.32-2.32C18.52 2.24 15.68 1 12.44 1 6.32 1 1.32 6 1.32 12.12s5 11.12 11.12 11.12c3.32 0 5.84-1.08 7.8-3.12 2.04-2.04 2.68-4.92 2.68-7.32 0-.68-.04-1.32-.12-1.92h-10.32z"/></svg>
              </button>
              <button type="button" onClick={() => handleSocialLogin('facebook')} className="flex items-center justify-center p-3 rounded-xl border border-gray-200 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
              <button type="button" onClick={() => handleSocialLogin('twitter')} className="flex items-center justify-center p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all group">
                <svg className="w-5 h-5 text-black group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>
              </button>
            </div>
            
            <div className="pt-2 text-center text-[10px] text-gray-400 font-bold uppercase flex items-center justify-center gap-1">
              <ShieldCheck size={12}/> 256-bit Encryption
            </div>
          </form>
          
          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600 font-medium cursor-pointer">{t('auth.no_account')} <Link to="/login" className="text-primary-600 hover:text-primary-700 underline font-bold px-1">{t('auth.login_btn')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
