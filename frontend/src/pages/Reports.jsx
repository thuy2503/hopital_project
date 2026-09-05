import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { BarChart3, TrendingUp, Pill, Users, Calendar, Download, Activity } from 'lucide-react';
import DataTable from '../components/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const Reports = () => {
  const { t, i18n } = useTranslation();
  const [revenueReport, setRevenueReport] = useState(null);
  const [drugUsage, setDrugUsage] = useState([]);
  const [patientStats, setPatientStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = `${API_BASE_URL}/api/reports`;

      const [revRes, drugRes, patRes] = await Promise.all([
        axios.get(`${baseUrl}/revenue?month=${month}&year=${year}`, { headers }),
        axios.get(`${baseUrl}/drugs?month=${month}&year=${year}`, { headers }),
        axios.get(`${baseUrl}/patients?period=monthly`, { headers })
      ]);

      setRevenueReport(revRes.data);
      setDrugUsage(drugRes.data);
      setPatientStats(patRes.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const drugColumns = [
    { key: 'name', label: t('drugs.table_name') || 'Tên thuốc' },
    { key: 'totalQuantity', label: t('drugs.table_stock') || 'Số lượng dùng' },
    { key: 'totalAmount', label: t('drugs.table_price') || 'Doanh thu thuốc', render: (val) => `${val.toLocaleString()} VND` },
  ];

  if (loading) return <div className="p-20 text-center font-bold animate-pulse">{t('reports.loading')}</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('reports.title')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('reports.desc')}</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <select 
             className="px-4 py-2 bg-transparent font-bold text-gray-700 outline-none"
             value={month}
             onChange={(e) => setMonth(e.target.value)}
           >
             {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i18n.language === 'vi' ? 'Tháng' : 'Month'} {i+1}</option>)}
           </select>
           <select 
             className="px-4 py-2 bg-transparent font-bold text-gray-700 outline-none"
             value={year}
             onChange={(e) => setYear(e.target.value)}
           >
             {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{i18n.language === 'vi' ? 'Năm' : 'Year'} {y}</option>)}
           </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
             <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('reports.revenue')}</p>
            <h3 className="text-2xl font-black text-gray-900">{(revenueReport?.totalRevenue || 0).toLocaleString()} VND</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('reports.new_patients')}</p>
            <h3 className="text-2xl font-black text-gray-900">{patientStats?.newPatientsThisMonth || 0} {i18n.language === 'vi' ? 'BN' : 'PR'}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('reports.treating')}</p>
            <h3 className="text-2xl font-black text-gray-900">{patientStats?.activePatientsThisMonth || 0} {i18n.language === 'vi' ? 'BN' : 'PR'}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Drug Usage Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Pill className="text-teal-600" /> {t('reports.drug_consumption')}
            </h2>
          </div>
          <DataTable 
            columns={drugColumns} 
            data={drugUsage} 
            fileName={`Report_Drugs_M${month}_Y${year}`}
          />
        </div>

        {/* Revenue Chart Placeholder / Basic visual */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> {t('reports.revenue_share')}
           </h2>
           <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drugUsage.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="totalAmount" fill="#0d9488" radius={[8, 8, 0, 0]} name={i18n.language === 'vi' ? 'Doanh thu' : 'Revenue'} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-center text-sm font-medium text-gray-400">{t('reports.top_drugs_desc')}</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
