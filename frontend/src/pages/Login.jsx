import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Globe, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'PATIENT') {
        navigate('/dashboard/records');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.login_error') || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      // Simulate OAuth callback data
      const mockData = {
        email: `social_${provider}_${Math.floor(Math.random()*1000)}@medpro.vn`,
        name: `User ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        provider: provider,
        socialId: `ID_${Math.random()}`
      };
      
      const res = await axios.post(`${API_BASE_URL}/api/auth/social`, mockData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'PATIENT') {
        navigate('/dashboard/records');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(`Lỗi đăng nhập qua ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-gray-100">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-200/40 blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-teal-100/60 blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative z-10">
        <div className="p-10">
          <div className="mb-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-black text-4xl mx-auto mb-6 shadow-xl shadow-primary-500/30 transform transition hover:scale-105">
              +
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">MedPro EMR</h2>
            <p className="text-gray-500 mt-2 font-medium">{t('landing.hospital_name')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50/80 backdrop-blur-sm text-red-600 text-sm font-medium border border-red-100 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.username')}</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-900 font-medium"
                placeholder={t('auth.username')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.password')}</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-900 font-medium"
                placeholder={t('auth.password')}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/40 disabled:opacity-70 transform hover:-translate-y-0.5"
            >
              {loading ? t('settings.saving') : t('auth.login_btn')}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest">Or social login</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button type="button" onClick={() => handleSocialLogin('google')} className="flex items-center justify-center p-3 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-100 transition-all group">
                <svg className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.32-2.12 4.4-1.2 1.2-3.04 2.12-5.72 2.12-4.56 0-8.28-3.68-8.28-8.24s3.72-8.24 8.28-8.24c2.48 0 4.28.96 5.64 2.24l2.32-2.32C18.52 2.24 15.68 1 12.44 1 6.32 1 1.32 6 1.32 12.12s5 11.12 11.12 11.12c3.32 0 5.84-1.08 7.8-3.12 2.04-2.04 2.68-4.92 2.68-7.32 0-.68-.04-1.32-.12-1.92h-10.32z"/></svg>
              </button>
              <button type="button" onClick={() => handleSocialLogin('facebook')} className="flex items-center justify-center p-3 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-100 transition-all group">
                <svg className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
              <button type="button" onClick={() => handleSocialLogin('twitter')} className="flex items-center justify-center p-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group">
                <svg className="w-6 h-6 text-black group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>
              </button>
            </div>
            
            <div className="pt-2 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-center gap-1"><ShieldCheck size={12}/> Bảo mật SSL 256-bit & Cloudflare Protected</p>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600 font-medium relative z-20 whitespace-normal break-words">
              <Link to="/register-patient" className="text-teal-600 hover:text-teal-700 underline font-extrabold px-1 mb-2 inline-block">Đăng ký Người Đến Khám</Link><br/>
              {t('auth.no_account')} <Link to="/register" className="text-primary-600 hover:text-primary-700 underline font-bold px-1">{t('auth.register_here')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
