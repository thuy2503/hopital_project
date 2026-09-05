import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, UserCircle2, Edit2, Trash2, Eye, ClipboardList, X, Activity, ShieldCheck, Clock } from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', dob: '', gender: 'Nam', idCard: '', healthInsurance: '', phone: '', emergencyContact: '', address: '', history: '', email: '', bloodType: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/patients`, { headers: { Authorization: `Bearer ${token}` } });
      setPatients(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/patients/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/api/patients`, formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      handleCloseModal();
      fetchPatients();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra!');
    } finally { setLoading(false); }
  };

  const handleEdit = (p) => {
    setFormData({ fullName: p.fullName, dob: new Date(p.dob).toISOString().split('T')[0], gender: p.gender, idCard: p.idCard || '', healthInsurance: p.healthInsurance || '', phone: p.phone, emergencyContact: p.emergencyContact || '', address: p.address || '', history: p.history || '', email: p.email || '', bloodType: p.bloodType || '' });
    setEditingId(p.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá hồ sơ này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchPatients();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xoá! Bạn phải xoá Bệnh án và Lịch hẹn trước!');
    }
  };

  const handleViewProfile = async (p) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/patients/${p.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedProfile(data);
      setShowProfile(true);
    } catch(e) {
      console.error(e);
      alert('Không thể tải hồ sơ chi tiết');
    }
  };

  const handleCreateRecord = (p) => {
    navigate('/dashboard/records', { state: { createForPatientId: p.id } });
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({ fullName: '', dob: '', gender: 'Nam', idCard: '', healthInsurance: '', phone: '', emergencyContact: '', address: '', history: '', email: '', bloodType: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Bệnh nhân</h2>
          <p className="text-gray-500 font-medium">Danh sách hồ sơ bệnh nhân của phòng khám</p>
        </div>
        {userRole !== 'DOCTOR' && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-primary-600/20 transform hover:-translate-y-0.5"><Plus size={20} /> Thêm bệnh nhân</button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="font-bold p-5">Bệnh nhân (Name/ID)</th>
                <th className="font-bold p-5">Ngày sinh</th>
                <th className="font-bold p-5">Giới tính</th>
                <th className="font-bold p-5">Liên hệ</th>
                <th className="font-bold p-5 text-right w-32">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-primary-50/50 transition-colors cursor-pointer group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">{p.fullName.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-primary-600">{p.fullName}</p>
                        <p className="text-xs text-gray-500">#{p.id.toString().padStart(4, '0')} {p.idCard ? `• CCCD: ${p.idCard}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-gray-600 font-medium">{new Date(p.dob).toLocaleDateString('vi-VN')}</td>
                  <td className="p-5"><span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">{p.gender}</span></td>
                  <td className="p-5 text-gray-600 font-medium">
                     <p>{p.phone}</p>
                     {p.emergencyContact && <p className="text-xs text-orange-500 mt-1">NT: {p.emergencyContact}</p>}
                  </td>
                  <td className="p-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end gap-2">
                       {userRole === 'DOCTOR' ? (
                         <>
                           <button title="Xem hồ sơ" onClick={(e) => { e.stopPropagation(); handleViewProfile(p); }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-xl transition-colors"><Eye size={16}/></button>
                           <button title="Tạo bệnh án mới" onClick={(e) => { e.stopPropagation(); handleCreateRecord(p); }} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-xl transition-colors"><ClipboardList size={16}/></button>
                         </>
                       ) : (
                         <>
                           <button title="Chỉnh sửa thông tin" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-xl transition-colors"><Edit2 size={16}/></button>
                           <button title="Xóa hồ sơ" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-colors"><Trash2 size={16}/></button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-gray-500">
                    <UserCircle2 size={32} className="mx-auto text-gray-300 mb-2" />
                    Chưa có hồ sơ bệnh nhân
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-6">{editingId ? 'Cập nhật Bệnh nhân' : 'Thêm Bệnh nhân mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên *</label><input required className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Ngày sinh *</label><input required type="date" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Giới tính</label><select className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>Nam</option><option>Nữ</option><option>Khác</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div><label className="block text-sm font-bold text-gray-700 mb-2">Số CCCD</label><input className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.idCard} onChange={e => setFormData({...formData, idCard: e.target.value})} /></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-2">Mã BHYT</label><input className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.healthInsurance} onChange={e => setFormData({...formData, healthInsurance: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại *</label><input required type="tel" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Người thân liên hệ</label><input placeholder="Tên - SĐT" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ</label><input className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Email</label><input type="email" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nhóm máu</label>
                  <select className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})}>
                    <option value="">Chưa xác định</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Tiền sử dị ứng / Bệnh lý</label><textarea placeholder="Nhập tiền sử bệnh lý, dị ứng thuốc..." className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20 min-h-[80px]" value={formData.history} onChange={e => setFormData({...formData, history: e.target.value})} /></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200">Hủy</button><button type="submit" disabled={loading} className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-md">Lưu thông tin</button></div>
            </form>
          </div>
        </div>
      )}

      {showProfile && selectedProfile && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-black text-xl">{selectedProfile.fullName.charAt(0)}</div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900">{selectedProfile.fullName}</h3>
                    <p className="text-gray-500 font-medium">#{selectedProfile.id.toString().padStart(4, '0')} • {new Date(selectedProfile.dob).toLocaleDateString('vi-VN')} ({new Date().getFullYear() - new Date(selectedProfile.dob).getFullYear()} tuổi) • {selectedProfile.gender}</p>
                  </div>
               </div>
               <button onClick={() => setShowProfile(false)} className="bg-white p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
               {/* Thông tin cá nhân & Liên hệ */}
               <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                 <div>
                   <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Số CCCD</span>
                   <span className="font-bold text-gray-900">{selectedProfile.idCard || 'Chưa cập nhật'}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Số điện thoại</span>
                   <span className="font-bold text-gray-900">{selectedProfile.phone || 'Chưa cập nhật'}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</span>
                   <span className="font-bold text-gray-950 break-all">{selectedProfile.email || 'Chưa cập nhật'}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Địa chỉ</span>
                   <span className="font-bold text-gray-900">{selectedProfile.address || 'Chưa cập nhật'}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Nhóm máu</span>
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 uppercase">{selectedProfile.bloodType || 'Chưa xác định'}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Liên hệ khẩn cấp</span>
                   <span className="font-bold text-orange-600">{selectedProfile.emergencyContact || 'Chưa cập nhật'}</span>
                 </div>
               </div>

               {/* Thông tin cảnh báo / Bảo hiểm */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                     <h4 className="font-bold text-red-800 flex items-center gap-2 mb-2"><Activity size={18}/> Tiền sử bệnh / Dị ứng</h4>
                     <p className="text-red-900 font-medium whitespace-pre-wrap">{selectedProfile.history || 'Không ghi nhận tiền sử dị ứng hoặc bệnh lý nguy hiểm.'}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                     <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-2"><ShieldCheck size={18}/> Thông tin Bảo hiểm Y tế</h4>
                     <p className="text-emerald-900 font-medium">{selectedProfile.healthInsurance ? `Mã số: ${selectedProfile.healthInsurance}` : 'Bệnh nhân chưa cập nhật thông tin BHYT.'}</p>
                  </div>
               </div>

               {/* Lịch sử khám cũ */}
               <div>
                 <h4 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2"><Clock size={20} className="text-blue-500"/> Lịch sử khám cũ</h4>
                 {selectedProfile.records?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedProfile.records.map(record => (
                         <div key={record.id} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-bold text-gray-900 text-lg">{record.icd10Code && `[${record.icd10Code}] `}{record.diagnosis}</p>
                               <p className="text-sm text-gray-500">{new Date(record.createdAt).toLocaleString('vi-VN')} • BS. {record.doctor?.name}</p>
                             </div>
                             <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">BA: #{record.id}</span>
                           </div>
                           {record.prescriptionItems?.length > 0 && (
                             <div className="mt-3 bg-white p-3 rounded-xl border border-gray-100">
                               <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Thuốc đã kê:</p>
                               <ul className="text-sm text-gray-700 space-y-1">
                                 {record.prescriptionItems.map(pi => (
                                   <li key={pi.id} className="flex justify-between">
                                     <span>- {pi.drug?.name}</span>
                                     <span className="font-bold">x{pi.quantity}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}
                         </div>
                      ))}
                    </div>
                 ) : <p className="text-gray-500 italic">Bệnh nhân chưa có lịch sử khám.</p>}
               </div>

               {/* Lịch sử Xét nghiệm */}
               <div>
                 <h4 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2"><FileText size={20} className="text-purple-500"/> Kết quả Xét nghiệm</h4>
                 {selectedProfile.labTests?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedProfile.labTests.map(test => (
                         <div key={test.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                           <p className="font-bold text-gray-900">{test.testName}</p>
                           <p className="text-xs text-gray-500 mb-3">{new Date(test.createdAt).toLocaleDateString('vi-VN')} • BS. {test.doctor?.name}</p>
                           <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                             <p className="text-sm font-medium text-purple-900">{test.result || 'Chưa có kết quả'}</p>
                           </div>
                         </div>
                      ))}
                    </div>
                 ) : <p className="text-gray-500 italic">Bệnh nhân chưa có dữ liệu xét nghiệm.</p>}
               </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0 gap-3">
               <button onClick={() => setShowProfile(false)} className="px-6 py-3 rounded-xl font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors">Đóng</button>
               <button onClick={() => { setShowProfile(false); handleCreateRecord(selectedProfile); }} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all">
                 <ClipboardList size={20}/> Tạo Bệnh án mới
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
