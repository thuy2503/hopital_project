import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Clock, Send, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('idle'); // idle, sending, success

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-teal-100/50">
      {/* Header / Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 p-8 z-10 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
           <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-teal-600 rounded-lg transform rotate-45 group-hover:rotate-90 transition-transform duration-500"></div>
              <div className="relative text-white font-black text-2xl pb-1">+</div>
           </div>
           <span className="text-3xl font-black text-teal-800 tracking-tighter uppercase transition-colors group-hover:text-teal-600">MedPro Saigon</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-teal-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
           <Home size={18} /> {t('landing.back_home')}
        </Link>
      </div>

      <div className="pt-32 pb-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Left Side: Info & Aesthetic */}
          <div className="space-y-12">
            <div className="space-y-6">
              <span className="px-5 py-2 bg-teal-50 text-teal-600 rounded-full text-xs font-black uppercase tracking-[0.2em]">{t('landing.actions.contact')}</span>
              <h1 className="text-5xl md:text-7xl font-black text-teal-900 tracking-tighter leading-[0.9]">
                {t('landing.contact_page.title')}
              </h1>
              <p className="text-xl text-gray-500 font-medium max-w-lg leading-relaxed">
                {t('landing.contact_page.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4 border border-gray-100 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-black text-teal-900 uppercase text-xs tracking-widest mb-2">{t('landing.contact_page.info.address_label')}</h3>
                  <p className="text-sm text-gray-600 font-bold leading-relaxed">
                    {t('landing.footer.address')}
                  </p>
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4 border border-gray-100 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-black text-teal-900 uppercase text-xs tracking-widest mb-2">Hotline</h3>
                  <p className="text-sm text-teal-600 font-black text-lg">(028) 3820 6001</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{t('landing.contact_page.info.hotline')}</p>
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4 border border-gray-100 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-black text-teal-900 uppercase text-xs tracking-widest mb-2">Email</h3>
                  <p className="text-sm text-gray-600 font-bold">contactus@medprosaigon.com</p>
                  <p className="text-sm text-gray-600 font-bold">support@medprosaigon.com</p>
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4 border border-gray-100 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-black text-teal-900 uppercase text-xs tracking-widest mb-2">{t('landing.contact_page.info.working_hours')}</h3>
                  <p className="text-sm text-gray-600 font-bold">{t('landing.contact_page.info.hours_detail')}</p>
                  <p className="text-[11px] text-red-500 font-bold uppercase tracking-tighter mt-1">Cấp cứu: 24/7</p>
                </div>
              </div>
            </div>

            {/* Aesthetic Badge */}
            <div className="inline-flex items-center gap-4 p-4 bg-teal-900 text-white rounded-3xl shadow-2xl">
               <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71f1536783?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Support" />
               </div>
               <div className="pr-6">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Hỗ trợ trực tuyến</p>
                  <p className="text-sm font-black">Bs. Trực ban: Đang online</p>
               </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-gray-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-[5rem] group-hover:w-40 group-hover:h-40 transition-all duration-700 -z-10"></div>
            
            {status === 'success' ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                  <Send size={48} />
                </div>
                <h2 className="text-3xl font-black text-teal-900 tracking-tight">{t('landing.contact_page.form.success')}</h2>
                <button 
                  onClick={() => setStatus('idle')}
                  className="bg-teal-600 text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-teal-700 transition-all"
                >
                  Gửi lời nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('landing.contact_page.form.name')}</label>
                    <input required type="text" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-600 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('landing.contact_page.form.email')}</label>
                    <input required type="email" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-600 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('landing.contact_page.form.phone')}</label>
                    <input required type="tel" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-600 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('landing.contact_page.form.subject')}</label>
                    <select className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-600 transition-all appearance-none cursor-pointer">
                      <option>Tư vấn dịch vụ</option>
                      <option>Hỗ trợ đặt lịch</option>
                      <option>Phản hồi & Khiếu nại</option>
                      <option>Hợp tác doanh nghiệp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('landing.contact_page.form.message')}</label>
                  <textarea required rows={5} className="w-full bg-gray-50 border-none rounded-[2rem] px-6 py-5 text-sm font-bold focus:ring-2 focus:ring-teal-600 transition-all resize-none"></textarea>
                </div>

                <button 
                  disabled={status === 'sending'}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-[2rem] font-black text-base uppercase tracking-widest transition-all shadow-2xl shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  {status === 'sending' ? t('landing.contact_page.form.sending') : t('landing.contact_page.form.submit')}
                  <ArrowRight size={20} strokeWidth={3} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Map Section Placeholder */}
      <section className="h-[500px] w-full bg-gray-100 relative grayscale hover:grayscale-0 transition-all duration-1000">
         <div className="absolute inset-0 bg-teal-900/10 flex items-center justify-center">
            <div className="text-center space-y-4">
               <MapPin size={48} className="text-teal-600 mx-auto" />
               <p className="text-sm font-black uppercase tracking-[0.3em] text-teal-900 opacity-60">MedPro Saigon Headquarters Map</p>
               <div className="w-20 h-1 bg-teal-600 mx-auto rounded-full"></div>
            </div>
         </div>
         {/* In a real scenario, you'd embed a Google Map here */}
      </section>

      {/* Footer Minimal */}
      <footer className="py-12 px-8 border-t border-gray-100 bg-white text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
           {t('landing.footer.all_rights')}
         </p>
      </footer>
    </div>
  );
};

export default Contact;
