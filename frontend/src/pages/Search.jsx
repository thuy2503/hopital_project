import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Search as SearchIcon, Users, Pill, Activity, Filter, Edit, Trash2, X, Star, Calendar, ChevronDown, Clock } from 'lucide-react';
import DataTable from '../components/DataTable';
import { useTranslation } from 'react-i18next';

const SearchPage = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('doctors');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', ingredient: '', unit: '', price: 0, inStock: 0, description: '' });
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  
  // Booking State
  const [bookingItem, setBookingItem] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingReason, setBookingReason] = useState('');

  // Assign Service State
  const [assignServiceItem, setAssignServiceItem] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Advanced Filters
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterWorkDay, setFilterWorkDay] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canManage = ['ADMIN', 'STAFF', 'DOCTOR'].includes(user.role);

  const fetchSearchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch patients for doctors/staff to assign services
      if (canManage && patients.length === 0) {
         const pRes = await axios.get(`${API_BASE_URL}/api/patients`, { headers: { Authorization: `Bearer ${token}` } });
         setPatients(pRes.data);
      }

      let endpoint = '';
      if (activeTab === 'doctors') {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.append('search', searchQuery);
        if (filterSpecialty) queryParams.append('specialization', filterSpecialty);
        if (filterMinPrice) queryParams.append('minPrice', filterMinPrice);
        if (filterMaxPrice) queryParams.append('maxPrice', filterMaxPrice);
        if (filterWorkDay) queryParams.append('workDay', filterWorkDay);
        endpoint = `/api/search/doctors?${queryParams.toString()}`;
      }
      else if (activeTab === 'medicines') endpoint = `/api/search/medicines?search=${searchQuery}`;
      else if (activeTab === 'services') endpoint = `/api/services`;

      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      setData(res.data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, filterSpecialty, filterMinPrice, filterMaxPrice, filterWorkDay, canManage, patients.length]);

  useEffect(() => {
    fetchSearchData();
  }, [fetchSearchData]);

  const doctorColumns = [
    { 
      key: 'name', 
      label: t('search.table.dr_name'),
      render: (val, row) => (
        <div>
          <p className="font-extrabold text-gray-900">{val.includes('BS.') || val.includes('ThS.') || val.includes('TS.') ? val : `BS. ${val}`}</p>
          <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">{row.specialty || 'Đa khoa'}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">Mã BS: #{row.id.toString().padStart(3, '0')}</p>
        </div>
      )
    },
    { 
      key: 'schedule', 
      label: t('search.table.schedule'),
      render: (val) => val ? <span className="font-medium text-gray-700">{val}</span> : <span className="text-gray-400 font-medium italic">Chưa cập nhật</span>
    },
    { 
      key: 'status', 
      label: i18n.language === 'vi' ? 'Trạng thái' : 'Status',
      render: (_, row) => row.isAcceptingPatients ? (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs">Nhận khám</span>
      ) : (
        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold text-xs">Tạm ngưng</span>
      )
    },
    {
      key: 'rating',
      label: t('search.table.rating'),
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 font-bold text-orange-500">
            <Star size={16} fill="currentColor" />
            {row.averageRating > 0 ? `${row.averageRating.toFixed(1)}/5` : 'Chưa có'}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">({row.totalReviews} lượt)</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: i18n.language === 'vi' ? 'Hành động' : 'Action',
      render: (_, row) => (
        <button onClick={() => setBookingItem(row)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 shadow-md transition-all transform hover:-translate-y-0.5">
          Đặt lịch ngay
        </button>
      )
    }
  ];

  const handleDelete = async (id) => {
    if (!window.confirm(i18n.language === 'vi' ? "Bạn có chắc chắn muốn xóa mục này?" : "Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem('token');
      const endpoint = activeTab === 'medicines' ? `/api/drugs/${id}` : `/api/services/${id}`;
      await axios.delete(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSearchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleEditOpen = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name || '',
      ingredient: item.ingredient || '',
      unit: item.unit || '',
      price: item.price || 0,
      inStock: item.inStock || 0,
      description: item.description || ''
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const endpoint = activeTab === 'medicines' ? `/api/drugs/${editingItem.id}` : `/api/services/${editingItem.id}`;
      await axios.patch(`${API_BASE_URL}${endpoint}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingItem(null);
      fetchSearchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleReviewSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        rating: reviewData.rating,
        comment: reviewData.comment,
        doctorId: activeTab === 'doctors' ? reviewItem.id : null,
        serviceId: activeTab === 'services' ? reviewItem.id : null
      };
      await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(i18n.language === 'vi' ? "Cảm ơn bạn đã gửi đánh giá!" : "Thank you for your feedback!");
      setReviewItem(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (error) {
      console.error(error);
      alert(i18n.language === 'vi' ? "Bạn cần đăng ký tài khoản Bệnh nhân để thực hiện đánh giá." : "You need a Patient account to submit reviews.");
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Vui lòng đăng nhập để đặt lịch");
      
      const payload = {
        doctorId: bookingItem.id,
        date: new Date(bookingDate).toISOString(),
        reason: bookingReason
      };
      await axios.post(`${API_BASE_URL}/api/appointments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(i18n.language === 'vi' ? "Đặt lịch thành công!" : "Appointment booked successfully!");
      setBookingItem(null);
      setBookingDate('');
      setBookingReason('');
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.error || error.message || "Bạn cần đăng nhập với tài khoản Bệnh nhân"));
    }
  };

  const medicineColumns = [
    { 
      key: 'name', 
      label: t('drugs.table_name'),
      render: (val) => <span className="font-extrabold text-gray-900">{val}</span>
    },
    { 
      key: 'ingredient', 
      label: t('drugs.table_ingredients'),
      render: (val) => <span className="text-sm text-gray-500 font-medium">{val || '---'}</span>
    },
    { 
      key: 'unit', 
      label: i18n.language === 'vi' ? 'Đơn vị tính' : 'Unit',
      render: (val) => <span className="text-xs font-bold uppercase text-gray-400">{val || 'Viên'}</span>
    },
    { 
      key: 'price', 
      label: t('drugs.table_price'), 
      render: (val) => <span className="font-bold text-teal-600">{Number(val).toLocaleString('vi-VN')} ₫</span> 
    },
    { 
      key: 'inStock', 
      label: i18n.language === 'vi' ? 'Tình trạng' : 'Status',
      render: (val) => val > 0 
        ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs">Còn hàng ({val})</span>
        : <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold text-xs">Hết hàng</span>
    },
    ...(canManage ? [{
      key: 'actions',
      label: t('drugs.table_actions'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEditOpen(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
        </div>
      )
    }] : [])
  ];

  const handleAssignService = async (e) => {
    e.preventDefault();
    try {
      if (!selectedPatientId) return alert("Vui lòng chọn bệnh nhân!");
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/lab-tests`, {
        patientId: Number(selectedPatientId),
        testName: assignServiceItem.name,
        notes: ''
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Chỉ định dịch vụ thành công!");
      setAssignServiceItem(null);
      setSelectedPatientId('');
    } catch (e) {
      alert("Lỗi khi chỉ định dịch vụ: " + (e.response?.data?.error || e.message));
    }
  };

  const serviceColumns = [
    { 
      key: 'name', 
      label: i18n.language === 'vi' ? 'Tên dịch vụ' : 'Service Name',
      render: (val) => <span className="font-extrabold text-gray-900">{val}</span>
    },
    { 
      key: 'description', 
      label: i18n.language === 'vi' ? 'Mô tả' : 'Description',
      render: (val) => <span title={val} className="text-sm text-gray-500 font-medium line-clamp-2 w-64">{val || '---'}</span>
    },
    { 
      key: 'duration', 
      label: i18n.language === 'vi' ? 'Thời gian' : 'Duration',
      render: (val) => <span className="font-bold text-gray-700 flex items-center gap-1"><Clock size={14}/> {val || 30} phút</span>
    },
    { 
      key: 'price', 
      label: i18n.language === 'vi' ? 'Đơn giá' : 'Price', 
      render: (val) => <span className="font-bold text-teal-600 text-lg">{Number(val).toLocaleString('vi-VN')} ₫</span> 
    },
    ...(canManage ? [{
      key: 'actions',
      label: i18n.language === 'vi' ? 'Thao tác' : 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {user.role === 'DOCTOR' && (
            <button title="Chỉ định dịch vụ này" onClick={() => setAssignServiceItem(row)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-colors">
              Chỉ định
            </button>
          )}
          <button onClick={() => handleEditOpen(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
        </div>
      )
    }] : [])
  ];

  const tabs = [
    { id: 'doctors', label: t('search.tabs.doctors'), icon: <Users size={18} /> },
    { id: 'medicines', label: t('search.tabs.drugs'), icon: <Pill size={18} /> },
    { id: 'services', label: i18n.language === 'vi' ? 'Dịch vụ' : 'Services', icon: <Activity size={18} /> },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('search.title')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('search.desc')}</p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <SearchIcon size={20} />
          </div>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setData([]); setShowFilters(false); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {activeTab === 'doctors' && (
          <button onClick={() => setShowFilters(!showFilters)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 rounded-xl font-bold hover:bg-teal-100 transition-colors">
             <Filter size={18} /> Bộ lọc nâng cao <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {showFilters && activeTab === 'doctors' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Chuyên khoa</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-teal-500 font-medium" value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
              <option value="">Tất cả chuyên khoa</option>
              <option value="Nội">Nội tổng quát</option>
              <option value="Ngoại">Ngoại khoa</option>
              <option value="Nhi">Nhi khoa</option>
              <option value="Sản">Sản phụ khoa</option>
              <option value="Da liễu">Da liễu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ngày làm việc</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-teal-500 font-medium" value={filterWorkDay} onChange={e => setFilterWorkDay(e.target.value)}>
              <option value="">Bất kỳ ngày nào</option>
              <option value="Thứ 2">Thứ 2</option>
              <option value="Thứ 3">Thứ 3</option>
              <option value="Thứ 4">Thứ 4</option>
              <option value="Thứ 5">Thứ 5</option>
              <option value="Thứ 6">Thứ 6</option>
              <option value="Thứ 7">Thứ 7</option>
              <option value="Chủ nhật">Chủ nhật</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá từ (VND)</label>
            <input type="number" step="50000" placeholder="VD: 100000" className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-teal-500 font-medium" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá đến (VND)</label>
            <input type="number" step="50000" placeholder="VD: 500000" className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-teal-500 font-medium" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-500 font-bold animate-pulse">{i18n.language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}</p>
          </div>
        ) : (
          <DataTable 
            columns={activeTab === 'doctors' ? doctorColumns : activeTab === 'medicines' ? medicineColumns : serviceColumns}
            data={data}
            fileName={`DS_${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          />
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-xl font-extrabold text-gray-900">{i18n.language === 'vi' ? 'Chỉnh sửa' : 'Edit'} {activeTab === 'medicines' ? (i18n.language === 'vi' ? 'Thuốc' : 'Drug') : (i18n.language === 'vi' ? 'Dịch vụ' : 'Service')}</h3>
               <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{i18n.language === 'vi' ? 'Tên' : 'Name'} {activeTab === 'medicines' ? (i18n.language === 'vi' ? 'Thuốc' : 'Drug') : (i18n.language === 'vi' ? 'Dịch vụ' : 'Service')}</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
               </div>
               {activeTab === 'medicines' ? (
                 <>
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{i18n.language === 'vi' ? 'Thành phần' : 'Ingredient'}</label>
                      <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" value={editFormData.ingredient} onChange={e => setEditFormData({...editFormData, ingredient: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{i18n.language === 'vi' ? 'Đơn vị' : 'Unit'}</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" value={editFormData.unit} onChange={e => setEditFormData({...editFormData, unit: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{i18n.language === 'vi' ? 'Số lượng tồn' : 'In Stock'}</label>
                        <input type="number" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" value={editFormData.inStock} onChange={e => setEditFormData({...editFormData, inStock: Number(e.target.value)})} />
                      </div>
                   </div>
                 </>
               ) : (
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{i18n.language === 'vi' ? 'Mô tả' : 'Description'}</label>
                    <textarea className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium h-24 resize-none" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})}></textarea>
                 </div>
               )}
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{i18n.language === 'vi' ? 'Đơn giá (VND)' : 'Price (VND)'}</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-teal-600" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})} />
               </div>
               <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all">{t('common.confirm')}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {reviewItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-orange-50 border-b border-orange-100 flex justify-between items-center text-orange-800">
               <h3 className="text-xl font-black">{i18n.language === 'vi' ? 'Gửi Đánh Giá Chất Lượng' : 'Submit Feedback'}</h3>
               <button onClick={() => setReviewItem(null)} className="text-orange-400 hover:text-red-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleReviewSave} className="p-8 space-y-6">
               <div className="text-center space-y-4">
                  <p className="text-sm font-bold text-gray-500">{i18n.language === 'vi' ? 'Bạn đánh giá thế nào về' : 'How do you rate'} <span className="text-gray-900 font-black">"{reviewItem.name}"</span>?</p>
                  <div className="flex justify-center gap-2">
                     {[1,2,3,4,5].map(s => (
                       <button 
                         key={s} 
                         type="button" 
                         onClick={() => setReviewData({...reviewData, rating: s})}
                         className={`p-2 transition-transform hover:scale-125 ${s <= reviewData.rating ? 'text-orange-400' : 'text-gray-200'}`}
                       >
                         <Star size={32} fill={s <= reviewData.rating ? 'currentColor' : 'none'} />
                       </button>
                     ))}
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">{i18n.language === 'vi' ? 'Ý kiến đóng góp' : 'Your comments'}</label>
                  <textarea 
                    className="w-full px-5 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium h-32 resize-none" 
                    placeholder={i18n.language === 'vi' ? 'Hãy chia sẻ trải nghiệm của bạn tại phòng khám...' : 'Please share your experience...'}
                    value={reviewData.comment}
                    onChange={e => setReviewData({...reviewData, comment: e.target.value})}
                  ></textarea>
               </div>

               <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all transform hover:-translate-y-1">
                 {i18n.language === 'vi' ? 'GỬI PHẢN HỒI NGAY' : 'SEND FEEDBACK NOW'}
               </button>
            </form>
          </div>
        </div>
      )}

      {bookingItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-teal-50 border-b border-teal-100 flex justify-between items-center text-teal-900">
               <h3 className="text-xl font-black flex items-center gap-2"><Calendar size={20}/> Đặt lịch khám nhanh</h3>
               <button onClick={() => setBookingItem(null)} className="text-teal-500 hover:text-red-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleBookAppointment} className="p-6 space-y-6">
               <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 flex items-center justify-center rounded-xl font-black text-xl">
                    {bookingItem.name.charAt(bookingItem.name.indexOf('BS.') > -1 ? 4 : 0) || 'D'}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 line-clamp-1">{bookingItem.name}</p>
                    <p className="text-sm font-medium text-teal-600">{bookingItem.specialty || 'Đa khoa'} • {bookingItem.consultationFee?.toLocaleString() || 200000} ₫</p>
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày khám mong muốn <span className="text-red-500">*</span></label>
                  <input required type="datetime-local" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-gray-900" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                  {bookingItem.schedule && <p className="text-xs text-gray-500 font-medium mt-2">Lịch BS: {bookingItem.schedule}</p>}
               </div>

               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Lý do khám / Triệu chứng <span className="text-red-500">*</span></label>
                  <textarea required className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-gray-900 h-24 resize-none" placeholder="Hãy mô tả sơ qua về triệu chứng của bạn..." value={bookingReason} onChange={e => setBookingReason(e.target.value)}></textarea>
               </div>

               <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all transform hover:-translate-y-1">
                 XÁC NHẬN ĐẶT LỊCH
               </button>
            </form>
          </div>
        </div>
      )}

      {assignServiceItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-blue-900">
               <h3 className="text-xl font-black flex items-center gap-2"><Activity size={20}/> Chỉ định Dịch vụ</h3>
               <button onClick={() => setAssignServiceItem(null)} className="text-blue-500 hover:text-red-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleAssignService} className="p-6 space-y-6">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="font-extrabold text-gray-900 text-lg">{assignServiceItem.name}</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">{assignServiceItem.description}</p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                    <span className="text-blue-600 font-bold text-sm flex items-center gap-1"><Clock size={14}/> {assignServiceItem.duration} phút</span>
                    <span className="text-teal-600 font-bold text-sm">{Number(assignServiceItem.price).toLocaleString('vi-VN')} ₫</span>
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn bệnh nhân <span className="text-red-500">*</span></label>
                  <select required className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                     <option value="" disabled>-- Vui lòng chọn bệnh nhân --</option>
                     {patients.map(p => (
                       <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>
                     ))}
                  </select>
               </div>

               <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform hover:-translate-y-1">
                 XÁC NHẬN CHỈ ĐỊNH
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
