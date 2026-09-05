import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { 
  Plus, Edit2, Trash2, Search, X, ClipboardCheck, 
  Package, Coins, Calendar, History, TrendingUp, 
  AlertTriangle, Check, AlertCircle, Printer 
} from 'lucide-react';

export default function Drugs() {
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, prescriptions, inventory, reports
  const [drugs, setDrugs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [reports, setReports] = useState({
    totalValue: 0,
    lowStockCount: 0,
    expiredOrSoonCount: 0,
    totalDispensedQty: 0,
    totalDrugsCount: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [prescriptionFilter, setPrescriptionFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  
  // Modals & Form States
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const [formData, setFormData] = useState({ 
    id: null, 
    name: '', 
    ingredient: '', 
    usage: '', 
    price: 0, 
    inStock: 0,
    specialty: '',
    code: '',
    registrationNo: '',
    concentration: '',
    route: '',
    expiryDate: ''
  });

  const [importFormData, setImportFormData] = useState({
    drugId: '',
    quantity: '',
    notes: '',
    expiryDate: ''
  });

  const [rejectModal, setRejectModal] = useState({
    show: false,
    recordId: null,
    reason: ''
  });

  const fetchDrugs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/drugs?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDrugs(res.data);
    } catch (e) {
      console.error("Lỗi lấy danh mục thuốc:", e);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/drugs/prescriptions?status=${prescriptionFilter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPrescriptions(res.data);
    } catch (e) {
      console.error("Lỗi lấy danh sách đơn thuốc:", e);
    }
  };

  const fetchInventoryLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/drugs/inventory-logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInventoryLogs(res.data);
    } catch (e) {
      console.error("Lỗi lấy lịch sử kho:", e);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadActiveTabData() {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        if (activeTab === 'catalog') {
          const res = await axios.get(`${API_BASE_URL}/api/drugs?search=${searchTerm}`, { headers });
          if (!ignore) setDrugs(res.data);
        } else if (activeTab === 'prescriptions') {
          const res = await axios.get(`${API_BASE_URL}/api/drugs/prescriptions?status=${prescriptionFilter}`, { headers });
          if (!ignore) setPrescriptions(res.data);
        } else if (activeTab === 'inventory') {
          const [resLog, resDrug] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/drugs/inventory-logs`, { headers }),
            axios.get(`${API_BASE_URL}/api/drugs?search=${searchTerm}`, { headers })
          ]);
          if (!ignore) {
            setInventoryLogs(resLog.data);
            setDrugs(resDrug.data);
          }
        } else if (activeTab === 'reports') {
          const res = await axios.get(`${API_BASE_URL}/api/drugs/reports/inventory`, { headers });
          if (!ignore) setReports(res.data);
        }
      } catch (e) {
        console.error("Lỗi lấy dữ liệu thuốc:", e);
      }
    }
    loadActiveTabData();
    return () => { ignore = true; };
  }, [activeTab, searchTerm, prescriptionFilter]);

  // CRUD handlers
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        price: Number(formData.price),
        inStock: Number(formData.inStock),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null
      };

      if (formData.id) {
        await axios.put(`${API_BASE_URL}/api/drugs/${formData.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/api/drugs`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchDrugs();
    } catch (e) {
      alert("Lỗi lưu thuốc: " + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá thuốc này khỏi hệ thống?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/drugs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchDrugs();
    } catch (e) {
      alert("Lỗi xoá: " + (e.response?.data?.error || e.message));
    }
  };

  // Drug Dispensing approval handlers
  const handleApprovePrescription = async (id) => {
    if (!window.confirm("Xác nhận duyệt và xuất cấp phát thuốc cho đơn này? Số lượng tồn kho sẽ tự động giảm tương ứng.")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/records/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Đã duyệt đơn thuốc và cập nhật số lượng tồn kho thành công!");
      fetchPrescriptions();
    } catch (e) {
      alert("Lỗi duyệt đơn: " + (e.response?.data?.error || e.message));
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectModal({ show: true, recordId: id, reason: '' });
  };

  const handleRejectPrescription = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason.trim()) {
      alert("Vui lòng nhập lý do từ chối đơn thuốc");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/records/${rejectModal.recordId}/reject`, {
        reason: rejectModal.reason
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert("Đã từ chối đơn thuốc và gửi trả thông tin cho bác sĩ.");
      setRejectModal({ show: false, recordId: null, reason: '' });
      fetchPrescriptions();
    } catch (e) {
      alert("Lỗi từ chối đơn: " + (e.response?.data?.error || e.message));
    }
  };

  // Inventory Stock Import handler
  const handleImportStock = async (e) => {
    e.preventDefault();
    if (!importFormData.drugId || !importFormData.quantity || Number(importFormData.quantity) <= 0) {
      alert("Thông tin nhập kho không hợp lệ");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/drugs/import`, {
        drugId: Number(importFormData.drugId),
        quantity: Number(importFormData.quantity),
        notes: importFormData.notes,
        expiryDate: importFormData.expiryDate ? new Date(importFormData.expiryDate).toISOString() : null
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert("Nhập kho bổ sung thuốc thành công!");
      setShowImportModal(false);
      setImportFormData({ drugId: '', quantity: '', notes: '', expiryDate: '' });
      fetchInventoryLogs();
    } catch (e) {
      alert("Lỗi nhập kho: " + (e.response?.data?.error || e.message));
    }
  };

  // Helper function to check if expiry date is near (under 3 months)
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: 'Chưa cập nhật', color: 'text-gray-400 border-gray-100 bg-gray-50' };
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: `Hết Hạn (${diffDays} ngày)`, color: 'text-red-700 border-red-200 bg-red-50 font-black animate-pulse' };
    } else if (diffDays <= 90) {
      return { text: `Gần Hết Hạn (${diffDays} ngày)`, color: 'text-amber-700 border-amber-200 bg-amber-50 font-bold' };
    }
    return { text: exp.toLocaleDateString('vi-VN'), color: 'text-emerald-700 border-emerald-100 bg-emerald-50' };
  };

  const handlePrintReceipt = (record) => {
    setSelectedRecord(record);
    setShowPrintModal(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Kê đơn & Nhà thuốc Lâm sàng</h2>
          <p className="text-gray-500 font-medium">Quản lý kho thuốc chuẩn Bộ Y tế, tiếp nhận chuyển đơn tự động và duyệt phát thuốc cho bệnh nhân.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { 
              setImportFormData({ drugId: '', quantity: '', notes: '', expiryDate: '' }); 
              setShowImportModal(true); 
            }} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 transform hover:-translate-y-0.5"
          >
            <History size={18} /> Nhập kho bổ sung
          </button>
          <button 
            onClick={() => { 
              setFormData({ 
                id: null, name: '', ingredient: '', usage: '', price: 0, inStock: 0, 
                specialty: '', code: '', registrationNo: '', concentration: '', route: '', expiryDate: '' 
              }); 
              setShowModal(true); 
            }} 
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> Thêm Danh mục Thuốc
          </button>
        </div>
      </div>

      {/* TABS CONTROLLER */}
      <div className="flex border-b border-gray-200 bg-white p-1.5 rounded-2xl shadow-sm gap-2">
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'catalog' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Package size={16} /> Danh mục & Kho thuốc
        </button>
        <button 
          onClick={() => setActiveTab('prescriptions')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all relative ${activeTab === 'prescriptions' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <ClipboardCheck size={16} /> Duyệt đơn thuốc
          {prescriptions.filter(p => p.prescriptionStatus === 'PENDING').length > 0 && activeTab !== 'prescriptions' && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-bounce">
              {prescriptions.filter(p => p.prescriptionStatus === 'PENDING').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('inventory')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <History size={16} /> Nhập/Xuất kho & Nhật ký
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'reports' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <TrendingUp size={16} /> Báo cáo Kho
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CATALOG & INVENTORY LIST */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
            <Search className="text-gray-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Tìm thuốc theo tên, hoạt chất chính, mã Bộ Y tế..." 
              className="w-full pl-4 pr-4 py-2 bg-transparent border-none outline-none text-gray-700 font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Mã BYT / SĐK</th>
                  <th className="p-4 font-bold">Tên biệt dược & Hoạt chất</th>
                  <th className="p-4 font-bold">Thông số / Chuyên khoa</th>
                  <th className="p-4 font-bold">Đơn giá</th>
                  <th className="p-4 font-bold">Hạn sử dụng</th>
                  <th className="p-4 font-bold">Tồn kho</th>
                  <th className="p-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drugs.map(d => {
                  const expStatus = getExpiryStatus(d.expiryDate);
                  const isLowStock = d.inStock <= 10;
                  return (
                    <tr key={d.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{d.code || '---'}</div>
                        <div className="text-xs text-gray-400">SĐK: {d.registrationNo || 'Chưa cập nhật'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-gray-900 text-[16px]">{d.name}</div>
                        <div className="text-xs text-gray-500 font-medium italic">{d.ingredient || 'Không có hoạt chất phụ'}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <div>{d.concentration || '---'} - {d.route || '---'}</div>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg">{d.specialty || 'Chung'}</span>
                      </td>
                      <td className="p-4 font-black text-emerald-600 text-base">
                        {d.price.toLocaleString('vi-VN')} đ
                        <span className="text-[11px] text-gray-400 font-normal block">/ {d.unit || 'Đơn vị'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${expStatus.color}`}>
                          {expStatus.text}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-extrabold rounded-lg border ${isLowStock ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {d.inStock} {d.unit || 'đơn vị'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => { 
                            setFormData({
                              id: d.id,
                              name: d.name,
                              ingredient: d.ingredient || '',
                              usage: d.usage || '',
                              price: d.price,
                              inStock: d.inStock,
                              specialty: d.specialty || '',
                              code: d.code || '',
                              registrationNo: d.registrationNo || '',
                              concentration: d.concentration || '',
                              route: d.route || '',
                              expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : ''
                            }); 
                            setShowModal(true); 
                          }} 
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(d.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 inline-flex"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {drugs.length === 0 && (
                  <tr><td colSpan="7" className="p-12 text-center text-gray-500 italic bg-gray-50/30 font-medium">Không tìm thấy loại thuốc nào trong hệ thống.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRESCRIPTION APPROVALS & DISPENSING */}
      {/* ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-2">
              {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                <button
                  key={status}
                  onClick={() => setPrescriptionFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${prescriptionFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {status === 'PENDING' ? 'Chờ Duyệt & Xuất' : status === 'APPROVED' ? 'Đã Phát Thuốc' : 'Bị Từ Chối'}
                </button>
              ))}
            </div>
            <div className="text-sm font-bold text-gray-500">Tìm thấy: {prescriptions.length} đơn thuốc</div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {prescriptions.map(p => {
              const totalCost = p.prescriptionItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
              return (
                <div key={p.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-gray-900">Mã Bệnh Án: #{p.id}</span>
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase ${
                          p.prescriptionStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          p.prescriptionStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.prescriptionStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Bệnh nhân: <strong className="text-gray-800 font-bold">{p.patient?.name}</strong> (CCCD: {p.patient?.cccd || '---'}) | Kê bởi: <strong className="text-gray-800 font-bold">{p.doctor?.name}</strong></p>
                    </div>
                    <div className="text-right sm:text-right">
                      <div className="text-xs text-gray-400 font-semibold">{new Date(p.createdAt).toLocaleString('vi-VN')}</div>
                      <div className="text-sm text-gray-500 font-bold">Chẩn đoán: {p.diagnosis} ({p.icd10Code})</div>
                    </div>
                  </div>

                  {/* Prescription Items Table */}
                  <div className="overflow-hidden border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3">Tên Thuốc</th>
                          <th className="p-3">Mã BYT</th>
                          <th className="p-3 text-center">Số lượng</th>
                          <th className="p-3">Liều dùng & Hướng dẫn</th>
                          <th className="p-3 text-right">Đơn giá</th>
                          <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {p.prescriptionItems?.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-900">{item.drug?.name}</td>
                            <td className="p-3 text-xs text-gray-500 font-semibold">{item.drug?.code || '---'}</td>
                            <td className="p-3 text-center font-bold text-primary-600">{item.quantity} {item.drug?.unit || 'hộp'}</td>
                            <td className="p-3 text-gray-600 italic font-medium">{item.instructions || 'Chưa có hướng dẫn uống'}</td>
                            <td className="p-3 text-right text-gray-500 font-semibold">{item.price.toLocaleString('vi-VN')} đ</td>
                            <td className="p-3 text-right text-emerald-600 font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Summary & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/60 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Tổng hóa đơn thuốc:</span>
                      <span className="text-xl font-extrabold text-emerald-600">{totalCost.toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="flex gap-2">
                      {p.prescriptionStatus === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleOpenRejectModal(p.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-rose-100"
                          >
                            Từ Chối Đơn
                          </button>
                          <button
                            onClick={() => handleApprovePrescription(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
                          >
                            <Check size={14} /> Duyệt & Xuất Kho
                          </button>
                        </>
                      ) : p.prescriptionStatus === 'APPROVED' ? (
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Printer size={14} /> In Đơn & Hóa Đơn Thuốc
                        </button>
                      ) : (
                        <div className="text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                          Đã từ chối đơn thuốc
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {prescriptions.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center text-gray-500 italic border border-gray-100 font-medium">
                Không có đơn thuốc nào ở trạng thái {prescriptionFilter === 'PENDING' ? 'Chờ Duyệt' : prescriptionFilter === 'APPROVED' ? 'Đã Phát' : 'Bị Từ Chối'}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVENTORY LOGS & STOCK ENTRY */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LOG STOCK ENTRY FORM */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 self-start">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Package className="text-emerald-600" size={20} /> Phiếu Nhập Kho
            </h3>
            <form onSubmit={handleImportStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Chọn thuốc bổ sung <span className="text-red-500">*</span></label>
                <select
                  required
                  value={importFormData.drugId}
                  onChange={e => setImportFormData({ ...importFormData, drugId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none font-bold text-gray-800 bg-white"
                >
                  <option value="">-- Chọn thuốc có sẵn --</option>
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.ingredient}) - Tồn: {d.inStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Số lượng <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Số hộp..."
                    value={importFormData.quantity}
                    onChange={e => setImportFormData({ ...importFormData, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Hạn sử dụng</label>
                  <input
                    type="date"
                    value={importFormData.expiryDate}
                    onChange={e => setImportFormData({ ...importFormData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú nhập kho</label>
                <textarea
                  rows="3"
                  placeholder="Ví dụ: Nhập theo lô SX123, Công ty Dược TW 1..."
                  value={importFormData.notes}
                  onChange={e => setImportFormData({ ...importFormData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 outline-none text-sm font-medium resize-none text-gray-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-600/10 transform active:scale-95"
              >
                Nhập kho bổ sung
              </button>
            </form>
          </div>

          {/* STOCK LOGS HISTORY */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50/40">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <History className="text-primary-600" size={20} /> Lịch Sử Nhập / Xuất Kho
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Giao dịch</th>
                    <th className="p-4">Tên thuốc</th>
                    <th className="p-4">Số lượng</th>
                    <th className="p-4">Ghi chú / Nhật ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {inventoryLogs.map(log => {
                    const isImport = log.type === 'IMPORT';
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-xs font-semibold text-gray-400">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg ${
                            isImport ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {isImport ? 'Nhập Kho' : 'Cấp Phát'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-900">{log.drug?.name}</td>
                        <td className={`p-4 font-black ${isImport ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {isImport ? `+${log.quantity}` : `-${log.quantity}`} {log.drug?.unit || 'hộp'}
                        </td>
                        <td className="p-4 text-xs text-gray-500 font-medium">{log.notes || '---'}</td>
                      </tr>
                    );
                  })}
                  {inventoryLogs.length === 0 && (
                    <tr><td colSpan="5" className="p-12 text-center text-gray-500 italic bg-gray-50/20 font-medium">Không có nhật ký giao dịch kho nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INVENTORY REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          
          {/* METRIC BOXES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600"><Coins size={24} /></div>
              <div>
                <div className="text-xs font-bold text-gray-400">Tổng giá trị tồn kho</div>
                <div className="text-lg font-black text-emerald-600">{(reports.totalValue || 0).toLocaleString('vi-VN')} đ</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary-50 text-primary-600"><Package size={24} /></div>
              <div>
                <div className="text-xs font-bold text-gray-400">Tổng chủng loại thuốc</div>
                <div className="text-lg font-black text-primary-600">{reports.totalDrugsCount || 0} loại</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={24} /></div>
              <div>
                <div className="text-xs font-bold text-gray-400">Thuốc sắp hết hàng (tồn ≤ 10)</div>
                <div className="text-lg font-black text-rose-600">{reports.lowStockCount || 0} loại</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-xl bg-amber-50 text-amber-600"><Calendar size={24} /></div>
              <div>
                <div className="text-xs font-bold text-gray-400">Thuốc sắp hết hạn (&lt; 3T)</div>
                <div className="text-lg font-black text-amber-600">{reports.expiredOrSoonCount || 0} loại</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 size={24} /></div>
              <div>
                <div className="text-xs font-bold text-gray-400">Tổng số lượng cấp phát</div>
                <div className="text-lg font-black text-blue-600">{reports.totalDispensedQty || 0} hộp</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DANGER ZONES: LOW STOCK & NEAR EXPIRY DRUGS */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <AlertCircle className="text-rose-500" size={20} /> Cảnh báo Thuốc Cần Mua Thêm (Tồn kho ≤ 10)
              </h3>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                {drugs.filter(d => d.inStock <= 10).map(d => (
                  <div key={d.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-500">Mã BYT: {d.code || '---'}</div>
                    </div>
                    <span className="bg-rose-50 text-rose-600 border border-rose-100 font-extrabold text-xs px-3 py-1.5 rounded-lg animate-pulse">
                      Tồn: {d.inStock} {d.unit || 'hộp'}
                    </span>
                  </div>
                ))}
                {drugs.filter(d => d.inStock <= 10).length === 0 && (
                  <div className="text-center text-gray-400 italic text-sm py-8 font-medium">Tuyệt vời! Không có thuốc nào sắp hết hàng.</div>
                )}
              </div>
            </div>

            {/* EXPIRY RADAR */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Calendar className="text-amber-500" size={20} /> Danh sách Thuốc Sắp Hết Hạn
              </h3>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                {drugs.filter(d => d.expiryDate).sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate)).slice(0, 10).map(d => {
                  const expStatus = getExpiryStatus(d.expiryDate);
                  return (
                    <div key={d.id} className="py-3 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-900">{d.name}</div>
                        <div className="text-xs text-gray-500">SĐK: {d.registrationNo || '---'}</div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${expStatus.color}`}>
                        {expStatus.text}
                      </span>
                    </div>
                  );
                })}
                {drugs.filter(d => d.expiryDate).length === 0 && (
                  <div className="text-center text-gray-400 italic text-sm py-8 font-medium">Không có thông tin hạn sử dụng nào được lưu.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      
      {/* MODAL 1: ADD OR EDIT DRUG */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-extrabold text-gray-900">{formData.id ? 'Cập nhật danh mục Thuốc' : 'Thêm Thuốc mới vào hệ thống'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full shadow-sm transition-colors border border-gray-100"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mã thuốc Bộ Y tế</label>
                  <input 
                    type="text" 
                    placeholder="VD: BYT-9981" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Số đăng ký (SĐK) Bộ Y tế</label>
                  <input 
                    type="text" 
                    placeholder="VD: VN-2234-21" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.registrationNo} 
                    onChange={e => setFormData({...formData, registrationNo: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tên thuốc <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="VD: Efferalgan Codein" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-gray-900" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hoạt chất chính</label>
                  <input 
                    type="text" 
                    placeholder="VD: Paracetamol 500mg + Codein 30mg" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.ingredient} 
                    onChange={e => setFormData({...formData, ingredient: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hàm lượng</label>
                  <input 
                    type="text" 
                    placeholder="VD: 500mg" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.concentration} 
                    onChange={e => setFormData({...formData, concentration: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đường dùng</label>
                  <input 
                    type="text" 
                    placeholder="VD: Uống, Tiêm..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.route} 
                    onChange={e => setFormData({...formData, route: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    placeholder="VD: Viên, Vỉ, Chai..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Giá thuốc (VND) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-black text-emerald-600 text-lg" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Số lượng tồn ban đầu <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-gray-900" 
                    value={formData.inStock} 
                    onChange={e => setFormData({...formData, inStock: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hạn sử dụng</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-semibold text-gray-800" 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Chuyên khoa phù hợp</label>
                  <input 
                    type="text" 
                    placeholder="VD: Nội tổng quát, Tim mạch..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.specialty} 
                    onChange={e => setFormData({...formData, specialty: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Liều dùng khuyến nghị</label>
                  <input 
                    type="text" 
                    placeholder="VD: Uống 2 lần/ngày sau ăn..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-gray-800" 
                    value={formData.usage} 
                    onChange={e => setFormData({...formData, usage: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm">Hủy</button>
                <button type="submit" className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm">Xác nhận Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MOCK IMPORT WAREHOUSE QUICK-MODAL (For fast triggers in other views if needed) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-extrabold text-gray-900">Phiếu nhập kho bổ sung</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full shadow-sm transition-colors border border-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleImportStock} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Chọn thuốc bổ sung <span className="text-red-500">*</span></label>
                <select
                  required
                  value={importFormData.drugId}
                  onChange={e => setImportFormData({ ...importFormData, drugId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none font-bold text-gray-800 bg-white"
                >
                  <option value="">-- Chọn thuốc có sẵn --</option>
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (Tồn: {d.inStock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Số lượng <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Số hộp..."
                    value={importFormData.quantity}
                    onChange={e => setImportFormData({ ...importFormData, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Hạn sử dụng mới</label>
                  <input
                    type="date"
                    value={importFormData.expiryDate}
                    onChange={e => setImportFormData({ ...importFormData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú nhập kho</label>
                <textarea
                  rows="3"
                  placeholder="Ghi chú xuất xứ lô..."
                  value={importFormData.notes}
                  onChange={e => setImportFormData({ ...importFormData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm font-medium resize-none text-gray-800"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl text-sm">Hủy</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg text-sm">Nhập Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECTION NOTE MODAL */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">Từ chối cấp phát đơn thuốc</h3>
              <p className="text-xs text-gray-400">Vui lòng cung cấp lý do từ chối để chuyển trả lại thông tin cho bác sĩ phòng khám.</p>
            </div>
            <form onSubmit={handleRejectPrescription} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Lý do từ chối <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows="3"
                  placeholder="Ví dụ: Đơn thuốc có tương tác nguy hại chưa được bỏ qua, hoặc kho thuốc tạm thời hết mặt hàng Efferalgan..."
                  value={rejectModal.reason}
                  onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm font-medium resize-none text-gray-800"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRejectModal({ show: false, recordId: null, reason: '' })} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl text-xs">Hủy</button>
                <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/10">Xác Nhận Từ Chối</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THERMAL PRINT AREA */}
      {/* ========================================================================= */}
      {showPrintModal && selectedRecord && (
        <div id="thermal-receipt-print" className="hidden">
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>MEDPRO SAIGON CLINIC</h2>
            <p style={{ margin: 0, fontSize: '11px' }}>Số 10 Nguyễn Trãi, Quận 1, TP. HCM</p>
            <p style={{ margin: 0, fontSize: '11px' }}>SĐT: (028) 3930 4488</p>
            <h3 style={{ margin: '15px 0 5px 0', fontSize: '14px', borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '5px 0', fontWeight: 'bold' }}>HÓA ĐƠN XUẤT THUỐC</h3>
          </div>
          
          <div style={{ fontSize: '11px', lineHeight: '1.4', marginBottom: '10px' }}>
            <div><strong>Mã Bệnh Án:</strong> #{selectedRecord.id}</div>
            <div><strong>Thời gian:</strong> {new Date().toLocaleString('vi-VN')}</div>
            <div><strong>Bệnh nhân:</strong> {selectedRecord.patient?.name}</div>
            <div><strong>CCCD:</strong> {selectedRecord.patient?.cccd || '---'}</div>
            <div><strong>Bác sĩ chỉ định:</strong> {selectedRecord.doctor?.name}</div>
            <div><strong>Chẩn đoán:</strong> {selectedRecord.diagnosis}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed black' }}>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Tên thuốc</th>
                <th style={{ textAlign: 'center', padding: '4px 0' }}>SL</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {selectedRecord.prescriptionItems?.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '6px 0' }}>
                    <strong>{item.drug?.name}</strong>
                    <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic' }}>HD: {item.instructions || 'Uống theo chỉ định'}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed black', paddingTop: '8px', fontSize: '12px', textAlign: 'right' }}>
            <strong>TỔNG TIỀN PHẢI TRẢ:</strong>
            <div style={{ fontSize: '16px', fontWeight: 'black', margin: '4px 0' }}>
              {selectedRecord.prescriptionItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', fontStyle: 'italic', borderTop: '1px dashed black', paddingTop: '10px' }}>
            <p style={{ margin: '0 0 5px 0' }}>Quý khách vui lòng kiểm tra thuốc kỹ trước khi rời quầy.</p>
            <strong>Cảm ơn quý bệnh nhân đã tin tưởng khám chữa bệnh!</strong>
          </div>
        </div>
      )}

      {/* CSS to control print style injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-print, #thermal-receipt-print * {
            visibility: visible !important;
          }
          #thermal-receipt-print {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            padding: 5mm !important;
            font-family: monospace !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />

    </div>
  );
}
