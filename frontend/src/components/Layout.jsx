import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, LogOut, FileText, UserRound, Pill, 
  CreditCard, Search, Settings, BarChart3, BookOpen, Sparkles, 
  MessageCircle, TestTube2, Sun, Moon, Bell, X, CheckCircle2, Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Chào mừng quay trở lại!',
      message: 'Hệ thống đã cập nhật tính năng Lịch khám dạng Week View & Real-time Notifications.',
      timestamp: new Date(),
      read: false,
      type: 'SYSTEM'
    }
  ]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [toast, setToast] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    if (userId) {
      socket.emit('register', userId);
    }

    socket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setToast(newNotif);
      setTimeout(() => {
        setToast(null);
      }, 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNavItems = (role) => {
    const items = {
      dashboard: { name: t('nav.dashboard'), path: '/dashboard', icon: Home },
      records: { name: t('nav.records'), path: '/dashboard/records', icon: FileText },
      appointments: { name: t('nav.appointments'), path: '/dashboard/appointments', icon: Calendar },
      invoices: { name: t('nav.invoices'), path: '/dashboard/invoices', icon: CreditCard },
      search: { name: t('nav.search'), path: '/dashboard/search', icon: Search },
      chat: { name: t('nav.chat'), path: '/dashboard/chat', icon: MessageCircle },
      doctors: { name: t('nav.doctors'), path: '/dashboard/doctors', icon: UserRound },
      drugs: { name: t('nav.drugs'), path: '/dashboard/drugs', icon: Pill },
      patients: { name: t('nav.patients'), path: '/dashboard/patients', icon: Users },
      labtests: { name: 'Xét nghiệm', path: '/dashboard/labtests', icon: TestTube2 },
      blog: { name: t('nav.blog'), path: '/dashboard/blog', icon: BookOpen },
      subscriptions: { name: t('nav.subscriptions'), path: '/dashboard/subscriptions', icon: Sparkles },
      reports: { name: t('nav.reports'), path: '/dashboard/reports', icon: BarChart3 },
      settings: { name: t('nav.settings'), path: '/dashboard/settings', icon: Settings },
    };

    switch (role) {
      case 'PATIENT':
        return [items.records, items.appointments, items.invoices, items.search, items.chat];
      case 'DOCTOR':
        return [items.dashboard, items.patients, items.records, items.labtests, items.appointments, items.search, items.chat, items.blog, items.settings];
      case 'NURSE':
        return [items.dashboard, items.patients, items.records, items.appointments, items.search, items.chat];
      case 'PHARMACIST':
        return [items.dashboard, items.records, items.drugs, items.search, items.chat];
      case 'ACCOUNTANT':
        return [items.dashboard, items.patients, items.invoices, items.reports, items.subscriptions, items.search, items.chat];
      case 'STAFF':
        return [items.dashboard, items.doctors, items.drugs, items.invoices, items.patients, items.records, items.labtests, items.appointments, items.search, items.chat, items.subscriptions];
      case 'ADMIN':
      default:
        return [items.dashboard, items.doctors, items.drugs, items.invoices, items.patients, items.records, items.labtests, items.appointments, items.search, items.chat, items.blog, items.subscriptions, items.reports, items.settings];
    }
  };

  const navItems = getNavItems(user.role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col z-20 relative border-r border-gray-100 dark:border-slate-700">
        <div className="h-16 flex items-center justify-center border-b border-gray-100 dark:border-slate-700 px-6">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded bg-primary-500 text-white flex items-center justify-center font-black">
              +
            </div>
            medpro sg
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t('nav.management')}</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm" 
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-slate-100"
                )}
              >
                <Icon size={20} className={isActive ? "text-primary-500 dark:text-primary-400" : "text-gray-400 dark:text-slate-400"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-700 flex items-center justify-end px-8 z-10 shrink-0 gap-4">
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            title="Đổi Chế Độ Sáng/Tối"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
          </button>

          {/* Real-time Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowBellDropdown(!showBellDropdown)} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 relative"
              title="Thông báo"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showBellDropdown && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Bell size={16} className="text-primary-500" /> Thông Báo Real-time
                  </h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto my-2 divide-y divide-gray-100 dark:divide-slate-700">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-sm text-gray-400">Không có thông báo nào</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={clsx(
                          "py-3 px-2 rounded-xl transition-colors flex items-start gap-3",
                          !n.read ? "bg-primary-50/50 dark:bg-slate-700/50" : "hover:bg-gray-50 dark:hover:bg-slate-700/30"
                        )}
                      >
                        <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 mt-0.5">
                          <Info size={16} />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-gray-900 dark:text-slate-100">{n.title}</p>
                          <p className="text-gray-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.timestamp).toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleLanguage} className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600 shadow-sm text-sm font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800">
             {i18n.language === 'en' ? '🇬🇧 EN' : '🇻🇳 VI'}
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user.name || 'Bác sĩ'}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium">{t(`nav.role_${user.role?.toLowerCase()}`) || user.role || 'DOCTOR'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold border-2 border-primary-200 dark:border-primary-700">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Live Notification Toast Popup */}
        {toast && (
          <div className="fixed top-20 right-8 z-50 animate-bounce bg-white dark:bg-slate-800 border border-primary-500 rounded-2xl shadow-2xl p-4 flex items-start gap-3 max-w-sm">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">{toast.title}</h4>
              <p className="text-gray-600 dark:text-slate-300 mt-1">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50/50 dark:bg-slate-900/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
