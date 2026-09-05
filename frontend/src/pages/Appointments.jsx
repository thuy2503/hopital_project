import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { 
  Calendar as CalendarIcon, Plus, Clock, CheckCircle2, Edit2, Trash2, 
  Smartphone, Printer, Layers, UserCheck, HeartHandshake, Search,
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, List
} from 'lucide-react';
import clsx from 'clsx';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    patientId: '', 
    doctorId: '', 
    date: '', 
    reason: '',
    type: 'OFFLINE',
    timeSlot: '08:00 - 08:30'
  });
  const [loading, setLoading] = useState(false);

  // View modes: 'list', 'week', 'month'
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Reception Desk & Warning states
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, reception
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [receptionSearch, setReceptionSearch] = useState('');

  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;

  const TIME_SLOTS = [
    "08:00 - 08:30",
    "08:30 - 09:00",
    "09:00 - 09:30",
    "09:30 - 10:00",
    "10:00 - 10:30",
    "10:30 - 11:00",
    "11:00 - 11:30",
    "13:30 - 14:00",
    "14:00 - 14:30",
    "14:30 - 15:00",
    "15:00 - 15:30",
    "15:30 - 16:00",
    "16:00 - 16:30",
    "16:30 - 17:00"
  ];

  const fetchAppts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const url = userRole === 'PATIENT' 
        ? `${API_BASE_URL}/api/appointments/my-appointments` 
        : `${API_BASE_URL}/api/appointments`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setAppointments(data);
    } catch (e) { console.error(e); }
  }, [userRole]);

  const fetchPatients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/patients`, { headers: { Authorization: `Bearer ${token}` } });
      setPatients(data);
      if(data.length > 0 && !editingId) setFormData(f => ({...f, patientId: data[0].id}));
    } catch (e) { console.error(e); }
  }, [editingId]);

  const fetchDoctors = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/appointments/doctors`);
      setDoctors(data);
      if(data.length > 0 && !editingId) setFormData(f => ({...f, doctorId: data[0].id}));
    } catch (e) { console.error(e); }
  }, [editingId]);

  useEffect(() => { fetchAppts(); fetchPatients(); fetchDoctors(); }, [fetchAppts, fetchPatients, fetchDoctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let dateValue = formData.date;
      if (dateValue.includes('T')) {
        dateValue = dateValue.split('T')[0];
      }
      const payload = { 
        ...formData, 
        date: dateValue + 'T12:00:00.000Z'
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/appointments/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        alert('Cập nhật lịch hẹn thành công!');
      } else {
        await axios.post(`${API_BASE_URL}/api/appointments`, payload, { headers: { Authorization: `Bearer ${token}` } });
        alert('Đặt lịch hẹn mới thành công!');
      }
      handleCloseModal();
      fetchAppts();
    } catch (e) { alert(e.response?.data?.error || 'Lỗi xử lý lịch hẹn!'); } 
    finally { setLoading(false); }
  };

  const handleEdit = (a) => {
    const d = new Date(a.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setFormData({ 
      patientId: a.patientId, 
      doctorId: a.doctorId || '', 
      date: d.toISOString().slice(0,10), 
      reason: a.reason || '',
      type: a.type || 'OFFLINE',
      timeSlot: a.timeSlot || '08:00 - 08:30'
    });
    setEditingId(a.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn huỷ lịch khám này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/appointments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAppts();
    } catch(e){ console.error(e); alert('Lỗi khi xoá!'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/appointments/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchAppts();
    } catch (e) { console.error(e); alert('Lỗi cập nhật trạng thái'); }
  };

  const handleSendReminder = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/appointments/${id}/sms-remind`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Đã gửi tin nhắn SMS/Zalo nhắc lịch hẹn cho bệnh nhân thành công!');
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi gửi tin nhắn nhắc lịch!');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.patch(`${API_BASE_URL}/api/appointments/${id}/checkin`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedTicket(data);
      setShowPrintModal(true);
      fetchAppts();
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi check-in bệnh nhân!');
    }
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({ 
      patientId: patients[0]?.id || '', 
      doctorId: doctors[0]?.id || '', 
      date: new Date().toISOString().slice(0, 10), 
      reason: '',
      type: 'OFFLINE',
      timeSlot: '08:00 - 08:30'
    });
  };

  // Helper functions for Calendar Views
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(date.setDate(diff));
  };

  const getWeekDays = (start) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(start);
      nextDay.setDate(start.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekStart = getStartOfWeek(currentDate);
  const weekDays = getWeekDays(weekStart);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  const handleSlotClick = (dateObj, slot) => {
    const dateStr = dateObj.toISOString().slice(0, 10);
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      date: dateStr,
      reason: '',
      type: 'OFFLINE',
      timeSlot: slot
    });
    setShowAdd(true);
  };

  // Month View Days Generation
  const getMonthDays = (d) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon = 0
    
    // Prev month padding
    for (let i = 0; i < startingDay; i++) {
      const prev = new Date(year, month, 1 - (startingDay - i));
      days.push({ date: prev, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    return days;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Quản lý Tiếp đón & Lịch hẹn</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Lịch khám thông minh dạng Week/Month View, check-in & điều phối hàng đợi</p>
        </div>
        <button 
          onClick={() => {
            setFormData({
              patientId: patients[0]?.id || '',
              doctorId: doctors[0]?.id || '',
              date: new Date().toISOString().slice(0, 10),
              reason: '',
              type: 'OFFLINE',
              timeSlot: '08:00 - 08:30'
            });
            setShowAdd(true);
          }} 
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-primary-600/20"
        >
          <Plus size={20} /> Đặt lịch hẹn
        </button>
      </div>

      {/* Tabs & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {userRole !== 'PATIENT' ? (
          <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl max-w-sm border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('appointments')} 
              className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                activeTab === 'appointments' ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-900"
              )}
            >
              📅 Lịch hẹn khám
            </button>
            <button 
              onClick={() => setActiveTab('reception')} 
              className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                activeTab === 'reception' ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-900"
              )}
            >
              🛎️ Quầy tiếp đón
            </button>
          </div>
        ) : <div />}

        {activeTab === 'appointments' && (
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
              <button 
                onClick={() => setViewMode('week')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all",
                  viewMode === 'week' ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm" : "text-gray-500 dark:text-slate-400"
                )}
              >
                <LayoutGrid size={14} /> Tuần (Week)
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all",
                  viewMode === 'month' ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm" : "text-gray-500 dark:text-slate-400"
                )}
              >
                <CalendarDays size={14} /> Tháng (Month)
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all",
                  viewMode === 'list' ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-sm" : "text-gray-500 dark:text-slate-400"
                )}
              >
                <List size={14} /> Danh sách (List)
              </button>
            </div>

            {/* Date Navigation Controls */}
            {viewMode !== 'list' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <button onClick={prevPeriod} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-slate-100">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 px-2 min-w-[120px] text-center">
                  {viewMode === 'week' ? (
                    `Tuần: ${weekDays[0].toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}`
                  ) : (
                    currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                  )}
                </span>
                <button onClick={nextPeriod} className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-slate-100">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: APPOINTMENTS VIEW */}
      {activeTab === 'appointments' && (
        <>
          {/* WEEK VIEW CALENDAR */}
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header Days Row */}
                <div className="grid grid-cols-8 gap-2 border-b border-gray-200 dark:border-slate-700 pb-4 text-center font-bold">
                  <div className="text-xs text-gray-400 dark:text-slate-500 self-center">Khung Giờ</div>
                  {weekDays.map((day, idx) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div 
                        key={idx} 
                        className={clsx(
                          "p-2 rounded-2xl transition-all",
                          isToday ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" : "bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300"
                        )}
                      >
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][idx]}
                        </p>
                        <p className="text-sm font-extrabold">{day.getDate()}/{day.getMonth() + 1}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Rows for Time Slots */}
                <div className="divide-y divide-gray-100 dark:divide-slate-700/50 my-2">
                  {TIME_SLOTS.map((slot, slotIdx) => (
                    <div key={slotIdx} className="grid grid-cols-8 gap-2 py-2 items-center">
                      <div className="text-xs font-bold text-gray-400 dark:text-slate-500 text-center py-2 bg-gray-50/50 dark:bg-slate-700/30 rounded-xl">
                        {slot}
                      </div>

                      {weekDays.map((dayObj, dayIdx) => {
                        const cellAppts = appointments.filter(a => 
                          isSameDay(a.date, dayObj) && (a.timeSlot === slot || !a.timeSlot)
                        );

                        return (
                          <div 
                            key={dayIdx} 
                            onClick={() => handleSlotClick(dayObj, slot)}
                            className="min-h-[54px] rounded-2xl border border-dashed border-gray-200 dark:border-slate-700/60 p-1 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-all flex flex-col gap-1 justify-center bg-gray-50/20 dark:bg-slate-800/40 hover:bg-primary-50/20"
                          >
                            {cellAppts.map(appt => (
                              <div 
                                key={appt.id}
                                onClick={(e) => { e.stopPropagation(); handleEdit(appt); }}
                                className={clsx(
                                  "p-2 rounded-xl text-xs font-semibold shadow-xs transition-transform hover:scale-[1.02]",
                                  appt.status === 'COMPLETED' ? "bg-emerald-500 text-white" :
                                  appt.status === 'CONFIRMED' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                                )}
                              >
                                <p className="font-bold line-clamp-1">
                                  {userRole === 'PATIENT' ? `BS. ${appt.doctor?.name}` : appt.patient?.fullName}
                                </p>
                                <p className="text-[10px] opacity-90">{appt.type === 'ONLINE' ? '🎥 Online' : '🏥 Offline'}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MONTH VIEW CALENDAR */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-gray-400 dark:text-slate-400 pb-3 border-b border-gray-100 dark:border-slate-700">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => <div key={i}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2 mt-3">
                {getMonthDays(currentDate).map((dayItem, index) => {
                  const dayAppts = appointments.filter(a => isSameDay(a.date, dayItem.date));
                  const isToday = isSameDay(dayItem.date, new Date());

                  return (
                    <div 
                      key={index} 
                      onClick={() => handleSlotClick(dayItem.date, '08:00 - 08:30')}
                      className={clsx(
                        "min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between",
                        dayItem.isCurrentMonth ? "bg-gray-50/50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-700" : "opacity-30 bg-transparent border-transparent",
                        isToday && "ring-2 ring-primary-500 bg-primary-50/20"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className={clsx(
                          "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center",
                          isToday ? "bg-primary-500 text-white" : "text-gray-700 dark:text-slate-300"
                        )}>
                          {dayItem.date.getDate()}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                            {dayAppts.length} ca
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayAppts.slice(0, 2).map(a => (
                          <div key={a.id} className="text-[10px] bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-1 truncate text-gray-800 dark:text-slate-200 font-medium">
                            {a.timeSlot?.slice(0, 5)} - {userRole === 'PATIENT' ? a.doctor?.name : a.patient?.fullName}
                          </div>
                        ))}
                        {dayAppts.length > 2 && (
                          <p className="text-[9px] text-gray-400 dark:text-slate-400 text-center font-bold">+{dayAppts.length - 2} ca nữa</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map(appt => (
                <div key={appt.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all group relative flex flex-col justify-between">
                  <div>
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(appt)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(appt.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4 mt-2">
                      <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        appt.type === 'ONLINE' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500' : 'bg-orange-50 dark:bg-orange-950/50 text-orange-500'
                      )}>
                        <CalendarIcon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-slate-100 line-clamp-1 pr-12">
                          {userRole === 'PATIENT' ? `Khám với ${appt.doctor?.name || 'Đang cập nhật'}` : (appt.patient?.fullName || 'Bệnh nhân chờ...')}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                          {new Date(appt.date).toLocaleDateString('vi-VN')} {appt.timeSlot && `• ${appt.timeSlot}`}
                        </p>
                      </div>
                    </div>

                    {/* Info Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md",
                        appt.type === 'ONLINE' ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                      )}>
                        {appt.type === 'ONLINE' ? 'ONLINE (TƯ VẤN)' : 'OFFLINE (TẠI QUẦY)'}
                      </span>
                      {appt.queueNumber && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          STT: #{appt.queueNumber} ({appt.roomNumber})
                        </span>
                      )}
                    </div>

                    <div className="mb-4 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase mb-1">Lý do khám / Triệu chứng</p>
                      <p className="text-sm text-gray-700 dark:text-slate-200 font-medium line-clamp-2">{appt.reason || 'Không có ghi chú'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-slate-700 pt-4 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className={clsx(
                        "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl",
                        appt.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 
                        appt.status === 'CONFIRMED' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                      )}>
                        {appt.status === 'COMPLETED' ? 'Đã khám' : appt.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đang chờ'}
                      </span>
                      
                      <div className="flex gap-2">
                        {appt.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => handleSendReminder(appt.id)}
                            className="text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-all"
                            title="Gửi nhắc hẹn SMS/Zalo"
                          >
                            <Smartphone size={16}/>
                          </button>
                        )}

                        {userRole !== 'PATIENT' && appt.status === 'PENDING' && appt.type === 'OFFLINE' && (
                          <button 
                            onClick={() => handleCheckIn(appt.id)}
                            className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl font-bold shadow-md transition-all animate-pulse"
                          >
                            <UserCheck size={14}/> Check-in
                          </button>
                        )}

                        {appt.queueNumber && (
                          <button 
                            onClick={() => {
                              setSelectedTicket(appt);
                              setShowPrintModal(true);
                            }}
                            className="text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-all"
                            title="In phiếu khám bệnh"
                          >
                            <Printer size={16}/>
                          </button>
                        )}

                        {userRole !== 'PATIENT' && appt.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')} 
                            className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <CheckCircle2 size={14} /> Hoàn tất
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {appointments.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                   <Clock size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                   <p className="text-gray-900 dark:text-slate-100 font-bold">Chưa có lịch hẹn nào</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: RECEPTION & TRIAGE DASHBOARD */}
      {activeTab === 'reception' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2"><Layers className="text-primary-500"/> Tình trạng phân luồng các phòng khám</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { name: 'Phòng 101 - Khoa Tim mạch', count: appointments.filter(a => a.roomNumber?.includes('101') && a.status !== 'COMPLETED').length },
                { name: 'Phòng 102 - Khoa Tai Mũi Họng', count: appointments.filter(a => a.roomNumber?.includes('102') && a.status !== 'COMPLETED').length },
                { name: 'Phòng 103 - Khoa Da liễu', count: appointments.filter(a => a.roomNumber?.includes('103') && a.status !== 'COMPLETED').length },
                { name: 'Phòng 104 - Khoa Nhi', count: appointments.filter(a => a.roomNumber?.includes('104') && a.status !== 'COMPLETED').length },
                { name: 'Phòng 100 - Khoa Đa khoa', count: appointments.filter(a => a.roomNumber?.includes('100') && a.status !== 'COMPLETED').length },
              ].map((clinic, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl flex flex-col justify-between">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-1">{clinic.name}</p>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{clinic.count}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">đang chờ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 lg:col-span-2 space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-extrabold text-gray-900 dark:text-slate-100">Đăng ký khám tại quầy (Check-in nhanh)</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Tìm kiếm nhanh bệnh nhân theo SĐT, Họ tên hoặc CCCD để đăng ký vào phòng khám</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={18}/>
                <input 
                  type="text" 
                  value={receptionSearch}
                  onChange={e => setReceptionSearch(e.target.value)}
                  placeholder="Nhập tên bệnh nhân, số điện thoại hoặc CCCD..." 
                  className="w-full pl-12 pr-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 outline-none focus:ring-4 focus:ring-primary-500/20 font-medium text-gray-900 dark:text-slate-100"
                />
              </div>

              {receptionSearch.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden max-h-72 overflow-y-auto">
                  {patients.filter(p => 
                    p.fullName.toLowerCase().includes(receptionSearch.toLowerCase()) || 
                    p.phone?.includes(receptionSearch) || 
                    p.cccd?.includes(receptionSearch)
                  ).map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-slate-100">{p.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">SĐT: {p.phone || 'N/A'} • CCCD: {p.cccd || 'N/A'}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setFormData({
                            patientId: p.id,
                            doctorId: doctors[0]?.id || '',
                            date: new Date().toISOString().slice(0, 10),
                            reason: 'Đăng ký khám trực tiếp tại quầy',
                            type: 'OFFLINE',
                            timeSlot: '08:00 - 08:30'
                          });
                          setShowAdd(true);
                          setReceptionSearch('');
                        }}
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow"
                      >
                        <Plus size={14}/> Đăng ký khám
                      </button>
                    </div>
                  ))}
                  {patients.filter(p => 
                    p.fullName.toLowerCase().includes(receptionSearch.toLowerCase()) || 
                    p.phone?.includes(receptionSearch) || 
                    p.cccd?.includes(receptionSearch)
                  ).length === 0 && (
                    <p className="text-center py-4 text-xs italic text-gray-400">Không tìm thấy bệnh nhân nào.</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                <h4 className="text-xs font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-3">Lượt khám tiếp đón hôm nay</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {appointments.filter(a => {
                    const todayStr = new Date().toDateString();
                    return new Date(a.date).toDateString() === todayStr;
                  }).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                          a.queueNumber ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                        )}>
                          {a.queueNumber ? `#${a.queueNumber}` : 'P'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-slate-100">{a.patient?.fullName}</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400">BS: {a.doctor?.name} • {a.roomNumber || 'Chưa check-in'} • Giờ: {a.timeSlot}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {!a.queueNumber ? (
                          <button 
                            onClick={() => handleCheckIn(a.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-sm"
                          >
                            Check-in & In phiếu
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setSelectedTicket(a); setShowPrintModal(true); }}
                              className="text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 p-1.5 rounded"
                              title="In lại phiếu"
                            >
                              <Printer size={14}/>
                            </button>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded">Đã phân buồng</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {appointments.filter(a => {
                    const todayStr = new Date().toDateString();
                    return new Date(a.date).toDateString() === todayStr;
                  }).length === 0 && (
                    <p className="text-center py-6 text-xs italic text-gray-400">Không có lượt đăng ký nào hôm nay.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl shadow-primary-700/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6"><HeartHandshake size={24}/></div>
                <h3 className="text-xl font-extrabold tracking-tight">Quy trình Tiếp Đón</h3>
                <div className="space-y-3 text-sm font-medium text-white/80">
                  <p>1. **Tìm kiếm & Check-in**: Tra cứu nhanh thông tin và kích hoạt trạng thái "CONFIRMED".</p>
                  <p>2. **In Phiếu Khám**: In và cấp mã STT số phòng khám tự động cho người bệnh.</p>
                  <p>3. **Điều phối luồng**: Theo dõi bảng hiển thị hàng đợi để chuyển bệnh nhân sang phòng khám đang trống.</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white/60">
                <span>Quầy tiếp đón MedPro SG</span>
                <span>Hệ thống phân luồng v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add & Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 mb-6">{editingId ? 'Cập nhật Lịch hẹn' : 'Đặt lịch hẹn mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {userRole !== 'PATIENT' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Bệnh nhân *</label>
                  <select required className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} - SĐT: {p.phone || 'N/A'}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Bệnh nhân *</label>
                  <input disabled type="text" className="w-full px-5 py-3 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 font-bold outline-none" value={patients[0]?.fullName || ''} />
                </div>
              )}
              {userRole !== 'DOCTOR' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Bác sĩ & Chuyên khoa *</label>
                  <select required className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialty || 'Đa khoa'}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Hình thức khám *</label>
                  <select required className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="OFFLINE">Offline (Tại quầy)</option>
                    <option value="ONLINE">Online (Tư vấn)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Khung giờ khám *</label>
                  <select required className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})}>
                    {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Ngày khám *</label>
                <input required type="date" className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">Lý do khám / Triệu chứng</label>
                <textarea className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none h-20 focus:ring-4 focus:ring-primary-500/20 resize-none text-sm" placeholder="VD: Đau ngực, sốt cao..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-slate-700 font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-800 dark:text-slate-200">Hủy</button>
                <button type="submit" disabled={loading} className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-md shadow-primary-600/10 transition-colors">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Ticket Print Modal */}
      {showPrintModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100">Phiếu Khám Bệnh</h3>
              <button onClick={() => { setShowPrintModal(false); setSelectedTicket(null); }} className="text-gray-400 hover:text-gray-900 dark:hover:text-slate-100">✕</button>
            </div>
            
            <div id="thermal-ticket" className="p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 bg-amber-50/20 dark:bg-slate-900/40 font-mono text-xs text-gray-800 dark:text-slate-200 space-y-4">
              <div className="text-center border-b border-dashed border-gray-300 dark:border-slate-600 pb-3">
                <h4 className="font-black text-lg text-primary-600 dark:text-primary-400 uppercase">MEDPRO SAIGON</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">123 Nguyễn Thị Minh Khai, Q.1, TP.HCM</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">SĐT: 1900-6060</p>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-slate-400">Số thứ tự khám</p>
                <p className="text-4xl font-black text-gray-900 dark:text-slate-100 font-sans my-1">
                  {String(selectedTicket.queueNumber).padStart(3, '0')}
                </p>
                <p className="text-[11px] font-bold bg-gray-100 dark:bg-slate-700 py-1 rounded">
                  {selectedTicket.roomNumber || 'Phòng chờ điều phối'}
                </p>
              </div>
              
              <div className="space-y-1 border-t border-dashed border-gray-300 dark:border-slate-600 pt-3">
                <p><span className="font-bold text-gray-600 dark:text-slate-400">Bệnh nhân:</span> {selectedTicket.patient?.fullName}</p>
                <p><span className="font-bold text-gray-600 dark:text-slate-400">Mã bệnh nhân:</span> BN-{selectedTicket.patientId}</p>
                <p><span className="font-bold text-gray-600 dark:text-slate-400">SĐT:</span> {selectedTicket.patient?.phone || '---'}</p>
                <p><span className="font-bold text-gray-600 dark:text-slate-400">Bác sĩ khám:</span> BS. {selectedTicket.doctor?.name}</p>
                <p><span className="font-bold text-gray-600 dark:text-slate-400">Chuyên khoa:</span> {selectedTicket.doctor?.specialty || 'Đa khoa'}</p>
                <p><span className="font-bold text-gray-600 dark:text-slate-400">Khung giờ:</span> {selectedTicket.timeSlot || '---'}</p>
                <p><span className="font-bold text-gray-600 dark:text-slate-400">Giờ tiếp nhận:</span> {selectedTicket.checkInTime ? new Date(selectedTicket.checkInTime).toLocaleTimeString('vi-VN') : new Date().toLocaleTimeString('vi-VN')}</p>
              </div>
              
              <div className="border-t border-dashed border-gray-300 dark:border-slate-600 pt-3 text-center space-y-2">
                <p className="text-[9px] italic text-gray-400 dark:text-slate-400">Vui lòng ngồi chờ tại phòng khám được chỉ định.</p>
                <div className="mx-auto w-24 h-6 bg-slate-800 text-white flex items-center justify-center text-[8px] tracking-widest font-sans rounded">
                  *EMR-A{selectedTicket.id}*
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  const printContent = document.getElementById('thermal-ticket').innerHTML;
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>In Phiếu Khám Bệnh</title>
                        <style>
                          body { font-family: monospace; padding: 20px; width: 80mm; margin: 0 auto; color: #000; }
                          .text-center { text-align: center; }
                          .font-black { font-weight: 900; }
                          .text-lg { font-size: 16px; }
                          .text-4xl { font-size: 36px; margin: 10px 0; }
                          .border-b { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                          .border-t { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
                          p { margin: 4px 0; font-size: 12px; }
                        </style>
                      </head>
                      <body>
                        ${printContent}
                        <script>window.print(); window.close();</script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2"
              >
                <Printer size={18}/> In Phiếu Khám
              </button>
              <button 
                onClick={() => { setShowPrintModal(false); setSelectedTicket(null); }}
                className="flex-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold py-3 rounded-2xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
