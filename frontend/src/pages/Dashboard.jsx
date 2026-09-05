import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Users, Calendar, Activity, TrendingUp, Clock, FileText, CheckCircle2, UserRound, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Dashboard() {
  const [data, setData] = useState({
    summary: { totalPatients: 0, totalDoctors: 0, appointmentsToday: 0, pendingAppointments: 0 },
    recentActivities: [],
    monthlyData: [],
    statusData: []
  });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPatient = user.role === 'PATIENT';

  useEffect(() => {
    if (isPatient) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
        setData(res.data);
      } catch (e) {
        console.error('Lỗi tải dữ liệu thống kê', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isPatient]);

  if (isPatient) {
    return <Navigate to="/dashboard/records" replace />;
  }

  const handleExportPDF = async () => {
    const input = document.getElementById('dashboard-content');
    if (!input) return;
    
    // Create a loading state or just process
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Calculate aspect ratio
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MedPro_Bao_Cao_Thong_Ke_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Emerald (Hoàn thành), Orange (Chờ), Red (Huỷ)

  const cards = [
    { title: 'Tổng Bệnh Nhân', value: data.summary.totalPatients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Bác Sĩ Trực', value: data.summary.totalDoctors, icon: UserRound, color: 'text-teal-500', bg: 'bg-teal-50' },
    { title: 'Lịch Khám Hôm Nay', value: data.summary.appointmentsToday, icon: Calendar, color: 'text-primary-500', bg: 'bg-primary-50' },
    { title: 'Chưa Xử Lý', value: data.summary.pendingAppointments, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  if (loading) return <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Trung tâm Báo cáo & Thống kê</h2>
          <p className="text-gray-500 font-medium">Số liệu hệ thống cập nhật đến {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm hidden sm:flex">
            <Activity size={18} /> Hệ thống ổn định
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-900/20 transition-all transform hover:-translate-y-0.5">
            <Download size={18} /> Xuất PDF
          </button>
        </div>
      </div>

      <div id="dashboard-content" className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-lg hover:border-primary-100 group">
              <div className={`w-16 h-16 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line/Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary-500" /> Xu hướng Khám Bệnh (Theo tháng)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="Lượt khám" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" activeDot={{ r: 8, strokeWidth: 0, fill: '#0ea5e9' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
             <Activity className="text-orange-500" /> Trạng thái Lịch hẹn
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            {data.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={6} dataKey="value" stroke="none">
                    {data.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <PieChart className="opacity-20 mb-2" size={48} />
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="text-primary-500" /> Bác sĩ / Lịch khám cập nhật gần đây
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold rounded-l-2xl">Bệnh nhân</th>
                <th className="p-4 font-bold">Ngày giờ khám</th>
                <th className="p-4 font-bold">Lý do / Triệu chứng</th>
                <th className="p-4 font-bold rounded-r-2xl text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivities.length > 0 ? data.recentActivities.map(act => (
                <tr key={act.id} className="border-b border-gray-50 last:border-0 hover:bg-primary-50/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{act.patient?.fullName || 'Không xác định'}</p>
                    <p className="text-xs text-gray-400">Mã LH: #{act.id}</p>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">
                     {new Date(act.date).toLocaleDateString('vi-VN')} <span className="text-gray-400 font-normal">({new Date(act.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})})</span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm max-w-[200px] truncate">{act.reason || '---'}</td>
                  <td className="p-4 text-right">
                    <span className={`px-4 py-1.5 text-xs font-bold uppercase rounded-xl border ${
                      act.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      act.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {act.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-12 text-center text-gray-500 bg-gray-50/50 rounded-2xl italic">Chưa có hoạt động nào được ghi nhận</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
