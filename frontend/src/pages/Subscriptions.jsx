import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { ShieldCheck, CheckCircle, Star, Sparkles, ArrowRight, Activity, Users, Zap, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Subscriptions = () => {
  const { t } = useTranslation();
  const [available, setAvailable] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [availRes, myRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/subscriptions/available`),
        axios.get(`${API_BASE_URL}/api/subscriptions/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAvailable(availRes.data);
      setMySubs(myRes.data);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (pkg) => {
    if (!token) {
      alert("Bạn cần đăng nhập để đăng ký gói khám.");
      navigate('/login');
      return;
    }
    if (!window.confirm(`Bạn có muốn đăng ký gói "${pkg.name}" không?`)) return;
    setEnrolling(pkg.id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/subscriptions/enroll`, {
        name: pkg.name,
        price: pkg.price,
        description: pkg.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Đăng ký thành công! Chúc mừng bạn đã tham gia chương trình chăm sóc định kỳ.");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi đăng ký gói.");
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans'] selection:bg-teal-100/50">
      {/* Navigation Overlay */}
      {!location.pathname.startsWith('/dashboard') && (
        <div className="absolute top-0 left-0 right-0 p-8 z-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
             <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-teal-600 rounded-lg transform rotate-45 group-hover:rotate-90 transition-transform duration-500"></div>
                <div className="relative text-white font-black text-2xl pb-1">+</div>
             </div>
             <span className="text-3xl font-extrabold text-teal-900 tracking-tighter uppercase transition-colors group-hover:text-teal-600">MedPro Saigon</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-teal-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
             <Home size={18} /> {t('landing.back_home')}
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className={`pt-40 pb-24 px-8 bg-teal-50 relative overflow-hidden ${location.pathname.startsWith('/dashboard') ? 'pt-10' : ''}`}>
        <div className="absolute top-0 right-0 w-[40%] h-full bg-teal-600/5 rounded-bl-[10rem] -z-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="px-5 py-2 bg-white text-teal-600 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm">
             {t('landing.nav_packages')}
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-teal-900 tracking-tight leading-[1.1] bg-gradient-to-br from-teal-900 via-teal-800 to-teal-600 bg-clip-text text-transparent">
             Bảo Vệ Sức Khỏe <span className="italic">Thường Niên</span> Cùng MedPro
          </h1>
          <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
            Đăng ký các chương trình thăm khám định kỳ để duy trì thể trạng tốt nhất và nhận tư vấn chuyên sâu từ đội ngũ bác sĩ hàng đầu.
          </p>
        </div>
      </section>

      <div className="py-20 px-8 max-w-7xl mx-auto space-y-20">
        {loading && (
          <div className="text-center py-8 text-teal-600 font-bold animate-pulse">
            Đang tải dữ liệu gói khám...
          </div>
        )}

      {mySubs.length > 0 && (
        <div className="max-w-6xl mx-auto">
           <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
             <ShieldCheck className="text-teal-600" /> Chương trình của bạn đang tham gia
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySubs.map(sub => (
                <div key={sub.id} className="bg-teal-600 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                   <div className="relative z-10 space-y-4">
                      <Zap className="text-teal-200" size={32} />
                      <h3 className="text-xl font-black leading-snug">{sub.name}</h3>
                      <div className="flex items-center gap-2">
                         <CheckCircle size={16} />
                         <span className="text-xs font-bold uppercase tracking-widest">Đang hoạt động</span>
                      </div>
                      <p className="text-teal-50 text-xs font-medium italic">Ngày bắt đầu: {new Date(sub.startDate).toLocaleDateString('vi-VN')}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {available.map(pkg => {
          const isEnrolled = mySubs.some(s => s.name === pkg.name);
          return (
            <div key={pkg.id} className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 hover:shadow-2xl transition-all flex flex-col items-start space-y-8 relative group">
               {pkg.id === 2 && (
                 <div className="absolute -top-4 left-10 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20">Phổ biến nhất</div>
               )}
               
               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  pkg.id === 1 ? 'bg-blue-50 text-blue-600 shadow-blue-600/10' : 
                  pkg.id === 2 ? 'bg-orange-50 text-orange-600 shadow-orange-500/10' : 'bg-purple-50 text-purple-600 shadow-purple-600/10'
               }`}>
                  {pkg.id === 1 ? <Activity size={32} /> : pkg.id === 2 ? <Users size={32} /> : <Star size={32} />}
               </div>
 
               <div className="space-y-3">
                 <h3 className="text-2xl font-extrabold text-teal-900 leading-tight">{pkg.name}</h3>
                 <p className="text-gray-500 text-sm font-medium leading-relaxed">{pkg.description}</p>
               </div>
 
               <div className="flex-grow pt-4">
                 <div className="text-4xl font-extrabold text-teal-600 tracking-tight">
                    {pkg.price.toLocaleString()} <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] block mt-2">VND / Năm</span>
                 </div>
               </div>
 
               <button 
                 disabled={isEnrolled || enrolling === pkg.id}
                 onClick={() => handleEnroll(pkg)}
                 className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all group/btn ${
                   isEnrolled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-teal-600 text-white hover:bg-teal-700 transform hover:-translate-y-1 shadow-2xl shadow-teal-600/20'
                 }`}
               >
                 {enrolling === pkg.id ? 'ĐANG XỬ LÝ...' : isEnrolled ? 'ĐÃ ĐĂNG KÝ' : (
                   <>
                     Đăng ký gói này <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                   </>
                 )}
               </button>
            </div>
          );
        })}
      </div>
      
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-gray-900 to-black rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-20"><Sparkles size={80} /></div>
         <h2 className="text-3xl font-black mb-4 relative z-10">Cần tư vấn thiết kế gói riêng?</h2>
         <p className="text-gray-400 font-medium mb-8 max-w-xl mx-auto relative z-10">Liên hệ bộ phận chăm sóc khách hàng MedPro Sài Gòn để nhận lộ trình y tế được cá nhân hóa dành riêng cho gia đình hoặc doanh nghiệp của bạn.</p>
         <button className="px-10 py-4 bg-teal-500 text-white rounded-2xl font-black hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 relative z-10">GỌI HOTLINE: 1900 6868</button>
      </div>
      </div>
    </div>
  );
};

export default Subscriptions;
