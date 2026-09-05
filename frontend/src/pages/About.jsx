import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Target, Eye, Award, TrendingUp, Users, Clock, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans'] selection:bg-teal-100/50">
      {/* Header Overlay */}
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 bg-teal-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-teal-600/5 rounded-bl-[10rem] -z-10"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-5">
            <span className="px-6 py-2.5 bg-white text-teal-600 rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-sm inline-block">
              {t('landing.nav_about')}
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-teal-900 tracking-tight leading-[1.1] bg-gradient-to-br from-teal-900 via-teal-800 to-teal-600 bg-clip-text text-transparent">
              {t('landing.about_page.title')}
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-lg leading-relaxed italic">
              "{t('landing.about_page.subtitle')}"
            </p>
          </div>
          <div className="relative">
            <div className="rounded-[4rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 aspect-video">
              <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="MedPro Hospital" />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-[2.5rem] shadow-xl space-y-2 max-w-[200px] border border-gray-100">
               <p className="text-4xl font-black text-teal-600">25+</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('landing.about_page.stats.years')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: t('landing.about_page.stats.doctors'), icon: <Users className="text-teal-600" /> },
            { label: t('landing.about_page.stats.patients'), icon: <TrendingUp className="text-teal-600" /> },
            { label: t('landing.about_page.stats.awards'), icon: <Award className="text-teal-600" /> },
            { label: "24/7 Support", icon: <Clock className="text-teal-600" /> }
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">{stat.icon}</div>
              <p className="font-black text-teal-900 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-teal-900 text-white px-8 rounded-t-[5rem] overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-teal-600/10 blur-[10rem] rounded-full"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 relative z-10">
          <div className="space-y-6 p-12 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10">
            <Target size={48} className="text-teal-400" />
            <h2 className="text-3xl font-black">{t('landing.about_page.mission.title')}</h2>
            <p className="text-teal-100/70 font-medium leading-relaxed">
              {t('landing.about_page.mission.desc')}
            </p>
          </div>
          <div className="space-y-6 p-12 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10">
            <Eye size={48} className="text-teal-400" />
            <h2 className="text-3xl font-black">{t('landing.about_page.vision.title')}</h2>
            <p className="text-teal-100/70 font-medium leading-relaxed">
              {t('landing.about_page.vision.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-32 px-8 max-w-5xl mx-auto text-center space-y-16">
        <div className="space-y-4">
          <h2 className="text-5xl font-extrabold text-teal-900 tracking-tight leading-tight">{t('landing.about_page.values.title')}</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-teal-600 to-teal-400 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {t('landing.about_page.values.items', { returnObjects: true }).map((val, i) => (
            <div key={i} className="group">
              <div className="w-20 h-20 bg-teal-50 rounded-full mx-auto flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                <Shield size={32} />
              </div>
              <p className="font-black text-teal-900 uppercase tracking-widest text-sm">{val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="py-12 px-8 border-t border-gray-100 bg-teal-50/50 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
           {t('landing.footer.all_rights')}
         </p>
      </footer>
    </div>
  );
};

export default About;
