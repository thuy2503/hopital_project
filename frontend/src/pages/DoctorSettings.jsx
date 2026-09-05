import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Save, Calendar, Users, Clock, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DoctorSettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    maxPatients: 20,
    schedule: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/doctors/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings({
        maxPatients: res.data.maxPatients || 20,
        schedule: res.data.schedule || ''
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/doctors/settings/max-patients`, 
        { maxPatients: Number(settings.maxPatients) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.patch(`${API_BASE_URL}/api/doctors/settings/schedule`, 
        { schedule: settings.schedule },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(t('settings.success_msg') || 'Cấu hình đã được lưu thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage('Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tài khoản và mọi dữ liệu liên quan của bạn. Bạn có chắc chắn muốn tiếp tục?")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Tài khoản của bạn đã được xóa. Tạm biệt!");
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa tài khoản.");
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Đang tải...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('settings.title')}</h1>
        <p className="text-gray-500 font-medium mt-1">{t('settings.desc')}</p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3 font-bold animate-bounce">
          <CheckCircle size={20} /> {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Max Patients */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-lg font-bold text-gray-800">{t('settings.max_patients')}</label>
              <p className="text-sm text-gray-500 font-medium">{t('settings.max_patients_desc')}</p>
              <input
                type="number"
                value={settings.maxPatients}
                onChange={(e) => setSettings({...settings, maxPatients: e.target.value})}
                className="w-full md:w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-bold text-lg"
              />
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Schedule */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-lg font-bold text-gray-800">{t('settings.schedule')}</label>
              <p className="text-sm text-gray-500 font-medium">{t('settings.schedule_desc')}</p>
              <textarea
                rows="4"
                value={settings.schedule}
                onChange={(e) => setSettings({...settings, schedule: e.target.value})}
                placeholder="Nhập lịch làm việc của bạn..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 disabled:opacity-50"
          >
            <Save size={20} /> {saving ? t('settings.saving') : t('settings.save_btn')}
          </button>
        </div>
      </form>

      {/* Dangerous Zone */}
      <div className="bg-red-50 rounded-3xl p-8 border border-red-100 space-y-4">
         <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={20} /> {t('settings.danger_zone')}
         </h3>
         <p className="text-sm text-red-600 font-medium">{t('settings.delete_desc')}</p>
         <button 
           onClick={handleDeleteAccount}
           className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center gap-2"
         >
           <Trash2 size={18} /> {t('settings.delete_btn')}
         </button>
      </div>
    </div>
  );
};

export default DoctorSettings;
