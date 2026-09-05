import { Link } from 'react-router-dom';
import { Phone, Mail, ChevronDown, ArrowRight, Calendar, Package, Headphones, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';


export default function Landing() {
  const { t, i18n } = useTranslation();
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const navItems = [
    { key: 'nav_home', hasDropdown: false, path: '/' },
    { key: 'nav_hospital', hasDropdown: false, path: '/about' },
    { key: 'nav_medical_services', hasDropdown: true },
    { key: 'nav_customers_insurance', hasDropdown: true },
    { key: 'nav_doctors', hasDropdown: false, path: '/dashboard/search' },
    { key: 'nav_news', hasDropdown: false },
    { key: 'nav_recruitment_v2', hasDropdown: false },
    { key: 'nav_contact_v2', hasDropdown: false, path: '/contact' },
  ];


  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-teal-100/50">
      {/* Top Bar */}
      <div className="bg-white px-8 py-3 flex justify-end items-center gap-8 border-b border-gray-100">
        <a href="#" className="text-[13px] font-bold text-gray-500 hover:text-teal-700 transition-colors">
          {t('landing.topbar.faq')}
        </a>
        <a href="mailto:contactus@medprosaigon.com" className="text-[13px] font-bold text-gray-500 hover:text-teal-700 transition-colors">
          contactus@medprosaigon.com
        </a>
        <div className="bg-[#e91e63] text-white px-4 py-1.5 rounded-md text-[13px] font-black tracking-tight flex items-center gap-1 shadow-sm uppercase">
          {t('landing.topbar.emergency')}
        </div>
        <a href="tel:02838206001" className="flex items-center gap-2 text-[15px] font-black text-gray-800 hover:text-teal-700 transition-colors">
          <Phone size={16} className="fill-gray-800 text-gray-800" /> (028) 3820 6001
        </a>
        <Link to="/login" className="text-[13px] font-black text-gray-800 hover:text-teal-700 transition-colors uppercase tracking-wider">
          {t('landing.topbar.login')}
        </Link>
      </div>

      {/* Header */}
      <header className="px-8 py-5 bg-white flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-600 rounded-lg transform rotate-45"></div>
            <div className="relative text-white font-black text-2xl pb-1">+</div>
          </div>
          <span className="text-3xl font-black text-teal-800 tracking-tighter uppercase">{t('landing.hospital_name')}</span>
        </Link>

        <nav className="hidden xl:flex items-center gap-6">
          {navItems.map((item) => {
            const label = t(`landing.${item.key}`);
            const isActive = item.key === 'nav_home';
            return (
              <Link 
                key={item.key} 
                to={item.path || '#'} 
                className={`relative py-1 text-[13px] font-black transition-all uppercase tracking-tight ${isActive ? 'text-teal-800' : 'text-gray-600 hover:text-teal-800'}`}
              >
                {label}
                {item.hasDropdown && <ChevronDown size={12} strokeWidth={3} className="inline ml-1 text-gray-400" />}
                {isActive && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-teal-600"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/register-patient" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20 active:scale-95">
            {t('landing.book_now')} <ArrowRight size={16} strokeWidth={3} />
          </Link>
          
          <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200 shadow-inner">
            <button 
              onClick={() => toggleLanguage('vi')}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${i18n.language === 'vi' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              VN
            </button>
            <button 
              onClick={() => toggleLanguage('en')}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${i18n.language === 'en' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

       {/* Hero Section */}
       <section className="relative h-[700px] overflow-hidden">
          <img 
             src="https://images.unsplash.com/photo-1631248055158-edec7a3c072b?q=80&w=2070&auto=format&fit=crop" 
             alt="Medical Staff" 
             className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/60 via-teal-900/20 to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 pt-20">
             <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]">
                   {t('landing.hero.title').split('<br/>').map((line, i) => (
                     <span key={i}>{line}{i === 0 && <br/>}</span>
                   ))}
                </h1>
                
                <div className="flex gap-6 opacity-90 scale-100 origin-left">
                   {[2022, 2023, 2024, 2025].map(year => (
                     <div key={year} className="flex flex-col items-center">
                        <div className="w-14 h-14 relative mb-2">
                           <img src="https://cdn-icons-png.flaticon.com/512/1000/1000966.png" className="w-full h-full brightness-0 saturate-100 invert-[70%] sepia-[40%] saturate-[500%] hue-rotate-[10deg] brightness-[1.1]" alt="Award" />
                        </div>
                        <span className="text-yellow-400 font-black text-[11px] tracking-widest uppercase">{year}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
 
          {/* Hero Action Bar */}
          <div className="absolute bottom-0 left-0 right-0 px-8 md:px-20 pb-0">
             <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-white/10 backdrop-blur-3xl rounded-t-[3rem] overflow-hidden border-t border-x border-white/20">
                <Link to="/register-patient" className="bg-teal-50/90 hover:bg-white p-8 flex items-center justify-center gap-4 transition-all group">
                   <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg">
                     <Calendar size={28} />
                   </div>
                   <span className="text-xl font-black text-teal-900">{t('landing.actions.book')}</span>
                </Link>
                <Link to="/subscriptions" className="bg-white/90 hover:bg-white p-8 flex items-center justify-center gap-4 transition-all group">
                   <div className="p-3 bg-teal-100 text-teal-600 rounded-2xl">
                     <Package size={28} />
                   </div>
                   <span className="text-xl font-black text-teal-900">{t('landing.actions.packages')}</span>
                </Link>
                <Link to="/contact" className="bg-white/80 hover:bg-white p-8 flex items-center justify-center gap-4 transition-all group">
                   <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                     <Phone size={28} />
                   </div>
                   <span className="text-xl font-black text-teal-900">{t('landing.actions.contact')}</span>
                </Link>
             </div>
          </div>
       </section>
 
       {/* Checkup Packages Section */}
       <section className="py-24 bg-gray-50/50">
         <div className="max-w-7xl mx-auto px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-teal-900 tracking-tight leading-tight mb-4">
               {t('landing.packages.title')}
             </h2>
             <p className="text-gray-500 font-medium max-w-2xl mx-auto">
               {t('landing.packages.subtitle')}
             </p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {t('landing.packages.items', { returnObjects: true }).map((pkg, idx) => (
               <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group border border-gray-100/50">
                 <div className="h-48 relative overflow-hidden">
                    <img 
                     src={`https://images.unsplash.com/${idx === 0 ? 'photo-1559757175-0eb30cd8c063' : idx === 1 ? 'photo-1581056771107-24ca5f033842' : idx === 2 ? 'photo-1579684385127-1ef15d508118' : 'photo-1516549655169-df83a0774514'}?q=80&w=800&auto=format&fit=crop`} 
                     alt={pkg.title} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div className="p-6 space-y-3">
                   <span className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-[11px] font-black rounded-lg uppercase tracking-wide">
                     {pkg.hospital}
                   </span>
                   <h3 className="text-lg font-black text-teal-900 leading-tight line-clamp-2 min-h-[3rem]">
                     {pkg.title}
                   </h3>
                   <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                     {pkg.desc}
                   </p>
                   <button className="flex items-center gap-2 text-teal-600 font-black text-xs uppercase tracking-widest pt-2 group-hover:translate-x-1 transition-transform">
                     {t('landing.actions.see_more')} <ArrowRight size={14} strokeWidth={3} />
                   </button>
                 </div>
               </div>
             ))}
           </div>
 
           <div className="mt-12 flex justify-center gap-4">
              <Link to="/register-patient" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95">
                 {t('landing.actions.book')} <ArrowRight size={16} strokeWidth={3} />
              </Link>
               <Link to="/subscriptions" className="bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                  {t('landing.actions.all_packages')} <ArrowRight size={16} strokeWidth={3} />
               </Link>
           </div>
         </div>
       </section>
 
       {/* Specialties Section */}
       <section className="py-24 bg-white relative overflow-hidden">
         <div className="absolute top-20 -right-20 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl -z-10"></div>
         <div className="max-w-7xl mx-auto px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-teal-900 tracking-tight leading-tight mb-4">
               {t('landing.specialties_full.title')}
             </h2>
             <p className="text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
               {t('landing.specialties_full.subtitle')}
             </p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {t('landing.specialties_full.items', { returnObjects: true }).map((item, idx) => {
               const images = [
                 'photo-1628348068343-c6a848d2b6dd',
                 'photo-1559523161-0fc0d8b38a7a',
                 'photo-1516627145497-ae6968895b74'
               ];
               return (
                <div key={idx} className="relative h-80 rounded-[2.5rem] overflow-hidden group shadow-xl">
                   <img 
                    src={`https://images.unsplash.com/${images[idx]}?q=80&w=800&auto=format&fit=crop`} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 via-transparent to-transparent"></div>
                   <div className="absolute bottom-8 left-8 right-8">
                      <h3 className="text-2xl font-black text-white mb-2">{item.title}</h3>
                      <Link to="/register-patient" className="text-teal-300 font-bold flex items-center gap-2 text-sm uppercase tracking-widest hover:text-white transition-colors">
                         {t('landing.specialties_full.see_details')} <ArrowRight size={16} />
                      </Link>
                   </div>
                </div>
               );
             })}
           </div>
         </div>
       </section>
 
       {/* Doctors Section */}
       <section className="py-24 bg-gray-50/50">
         <div className="max-w-7xl mx-auto px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-teal-900 tracking-tight leading-tight mb-4">
               {t('landing.doctors_full.title')}
             </h2>
             <p className="text-gray-500 font-medium max-w-2xl mx-auto">
               {t('landing.doctors_full.subtitle')}
             </p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {t('landing.doctors_full.items', { returnObjects: true }).map((doc, idx) => {
                const images = [
                  'photo-1612349317150-e413f6a5b16d',
                  'photo-1537368910025-700350fe46c7',
                  'photo-1559839734-2b71ea197ec2',
                  'photo-1594824476967-48c8b964273f'
                ];
                return (
                 <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group border border-gray-100/50">
                   <div className="h-72 overflow-hidden bg-gray-100">
                      <img 
                       src={`https://images.unsplash.com/${images[idx]}?q=80&w=800&auto=format&fit=crop`} 
                       alt={doc.name} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 object-top"
                      />
                   </div>
                   <div className="p-6 text-center space-y-1">
                      <h3 className="text-lg font-black text-teal-900 leading-tight">
                         {doc.name}
                      </h3>
                      <p className="text-[13px] text-teal-600 font-bold uppercase tracking-tight">
                         {doc.title}
                      </p>
                      <div className="pt-4">
                         <button className="w-full bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            {t('landing.actions.see_more')} <ArrowRight size={14} className="inline ml-1" />
                         </button>
                      </div>
                   </div>
                 </div>
                );
              })}
           </div>
 
           <div className="mt-12 flex justify-center gap-4">
              <Link to="/register-patient" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95">
                 {t('landing.actions.book')} <ArrowRight size={16} strokeWidth={3} />
              </Link>
              <button className="bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                 {t('landing.actions.all_doctors')} <ArrowRight size={16} strokeWidth={3} />
              </button>
           </div>
         </div>
       </section>
 
       {/* Banner "Đặt lịch hẹn" Section */}
       <section className="py-20 bg-white px-8">
          <div className="max-w-7xl mx-auto bg-gradient-to-r from-teal-50 to-white rounded-[3rem] overflow-hidden relative shadow-inner border border-teal-50 flex flex-col md:flex-row items-center">
             {/* Logo Background */}
             <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 select-none pointer-events-none opacity-20">
                <span className="text-[400px] font-black leading-none text-teal-600">+</span>
             </div>
 
             <div className="relative z-10 flex-1 p-12 md:p-20 space-y-8">
                <h2 className="text-5xl md:text-6xl font-black text-teal-900 tracking-tighter leading-tight">
                   {t('landing.appointment_banner.title').split('<br/>').map((line, i) => (
                     <span key={i}>{line}{i === 0 && <br/>}</span>
                   ))}
                </h2>
                <p className="text-xl text-teal-700 font-medium max-w-md leading-relaxed">
                   {t('landing.appointment_banner.subtitle')}
                </p>
                <div className="flex gap-4">
                   <Link to="/register-patient" className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-full font-black text-base uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-teal-600/20 active:scale-95">
                      {t('landing.actions.book')} <ArrowRight size={20} strokeWidth={3} />
                   </Link>
                   <button className="bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-10 py-4 rounded-full font-black text-base uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95">
                      {t('landing.appointment_banner.cta_specialties')} <ArrowRight size={20} strokeWidth={3} />
                   </button>
                </div>
             </div>
 
             <div className="flex-1 h-full min-h-[500px] relative">
                <img 
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1200&auto=format&fit=crop" 
                  alt="Doctor Appointment" 
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-50 via-transparent to-transparent md:block hidden"></div>
             </div>
          </div>
       </section>
 
       {/* Floating Contact Button */}
       <Link to="/contact" className="fixed bottom-24 right-8 z-[60] bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-110 active:scale-95 group">
          <div className="relative">
             <MessageCircle size={28} />
             <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-500 font-black text-sm uppercase tracking-widest whitespace-nowrap">
             {t('landing.actions.contact')}
          </span>
       </Link>
 
       {/* Footer */}
       <footer className="bg-[#002b28] text-white pt-24 pb-12 px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 relative">
             <div className="space-y-8">
                <Link to="/" className="flex items-center gap-3">
                   <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-white/20 rounded-lg transform rotate-45"></div>
                      <div className="relative text-white font-black text-2xl pb-1">+</div>
                   </div>
                   <span className="text-3xl font-black tracking-tighter uppercase">medpro sg</span>
                </Link>
                <div className="space-y-4 text-[13px] leading-relaxed opacity-80">
                   <p className="font-medium">
                      {t('landing.footer.address')}
                   </p>
                   <p className="flex items-center gap-3 font-black text-teal-300">
                      <Phone size={16} fill="currentColor" /> (028) 3820 6001
                   </p>
                   <p className="flex items-center gap-3 font-black text-teal-300">
                      <Mail size={16} fill="currentColor" /> contactus@medprosaigon.com
                   </p>
                </div>
                <div className="flex gap-3">
                   {['facebook', 'youtube', 'linkedin'].map(social => (
                      <div key={social} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer border border-white/5">
                         <div className="w-5 h-5 bg-white rounded-sm opacity-20"></div>
                      </div>
                   ))}
                </div>
             </div>
 
             <div className="space-y-6 pt-4">
                <h3 className="text-lg font-black uppercase tracking-widest text-teal-400">medpro sg</h3>
                <ul className="space-y-3 text-[14px] font-bold opacity-70">
                   {[
                     { key: 'nav_about', label: 'Về chúng tôi' },
                     { key: 'nav_network', label: 'Mạng lưới MedPro' },
                     { key: 'nav_recruitment', label: 'Tuyển dụng' },
                     { key: 'nav_community', label: 'Cộng đồng' },
                     { key: 'nav_settings', label: 'Cài đặt' }
                   ].map(link => (
                      <li key={link.key} className="hover:text-teal-400 transition-colors cursor-pointer">
                         {t(`landing.${link.key}`)}
                      </li>
                   ))}
                </ul>
             </div>
 
             <div className="space-y-6 pt-4">
                <h3 className="text-lg font-black uppercase tracking-widest text-teal-400">{t('landing.footer.media_title')}</h3>
                <ul className="space-y-3 text-[14px] font-bold opacity-70">
                   {t('landing.footer.media_items', { returnObjects: true }).map(link => (
                      <li key={link} className="hover:text-teal-400 transition-colors cursor-pointer">{link}</li>
                   ))}
                </ul>
             </div>
 
             <div className="space-y-8 pt-4">
                <h3 className="text-xl font-black text-white leading-tight">
                   {t('landing.footer.slogan')}
                </h3>
                <Link to="/register-patient" className="flex items-center justify-between bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-600/20 active:scale-95">
                   {t('landing.actions.book').toUpperCase()} <ArrowRight size={20} />
                </Link>
                <div className="flex items-center gap-4">
                   <div className="w-20 h-20 bg-white p-2 rounded-2xl">
                      <div className="w-full h-full bg-black/10 rounded"></div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">{t('landing.footer.download_app')}</p>
                      <div className="flex gap-2">
                         <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/5"></div>
                         <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/5"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
 
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] opacity-30">
             <p>{t('landing.footer.all_rights')}</p>
             <div className="flex gap-8">
                <span className="cursor-pointer hover:opacity-100 transition-opacity">{t('landing.footer.privacy')}</span>
                <span className="cursor-pointer hover:opacity-100 transition-opacity">{t('landing.footer.terms')}</span>
             </div>
          </div>
       </footer>
 
       {showCookieBanner && (
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto bg-white/95 backdrop-blur-xl border border-gray-100 p-5 rounded-[2rem] shadow-2xl z-50 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-10 duration-500">
           <p className="text-[13px] text-gray-600 max-w-lg font-bold leading-snug">
             {t('landing.cookie.desc')}
           </p>
           <div className="flex gap-2 shrink-0 w-full md:w-auto">
             <button 
               onClick={() => setShowCookieBanner(false)}
               className="flex-1 md:flex-none px-6 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs transition-colors tracking-widest uppercase"
             >
               {t('landing.cookie.reject')}
             </button>
             <button 
               onClick={() => setShowCookieBanner(false)}
               className="flex-1 md:flex-none px-6 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs transition-colors shadow-lg shadow-teal-700/20 tracking-widest uppercase"
             >
               {t('landing.cookie.accept')}
             </button>
           </div>
         </div>
       )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
