import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Plus, UserRound, Edit2, Trash2 } from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', specialty: '', imageUrl: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const fetchDoctors = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/doctors`);
      setDoctors(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/doctors/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/api/doctors`, formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      handleCloseModal();
      fetchDoctors();
    } catch (e) {
      alert(e.response?.data?.error || 'Có lỗi xảy ra!');
    } finally { setLoading(false); }
  };

  const handleEdit = (d) => {
    setFormData({ name: d.name, specialty: d.specialty || '', imageUrl: d.imageUrl || '', username: '', password: '' });
    setEditingId(d.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá bác sĩ này khỏi hệ thống?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/doctors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchDoctors();
    } catch (e) { console.error(e); alert('Lỗi khi xoá!'); }
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({ name: '', specialty: '', imageUrl: '', username: '', password: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Đội ngũ Bác sĩ</h2>
          <p className="text-gray-500 font-medium">Cập nhật hồ sơ bác sĩ trên trang chủ</p>
        </div>
        {isAdmin && <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-primary-600/20 transform hover:-translate-y-0.5"><Plus size={20} /> Thêm bác sĩ</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doctors.map(d => (
          <div key={d.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group relative">
            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleEdit(d)} className="text-blue-600 bg-white/90 backdrop-blur hover:bg-white p-2 rounded-xl shadow-sm transition-colors"><Edit2 size={16}/></button>
                <button onClick={() => handleDelete(d.id)} className="text-red-600 bg-white/90 backdrop-blur hover:bg-white p-2 rounded-xl shadow-sm transition-colors"><Trash2 size={16}/></button>
              </div>
            )}
            
            <div className="h-48 overflow-hidden bg-gray-50 flex items-center justify-center">
              {d.imageUrl ? (
                <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <UserRound size={48} className="mb-2" />
                  <span className="text-sm font-medium">Chưa có ảnh</span>
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{d.name}</h3>
              <p className="text-primary-600 font-medium mt-1 text-sm">{d.specialty || 'Chưa cập nhật chuyên khoa'}</p>
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <UserRound size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-900 font-bold">Chưa có dữ liệu bác sĩ</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-6">{editingId ? 'Cập nhật Thông tin' : 'Thêm Bác sĩ mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {!editingId && (
                <div className="grid grid-cols-2 gap-5 pb-4 border-b border-gray-100">
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">Tên đăng nhập *</label><input required className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu *</label><input required type="password" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                </div>
              )}
              {editingId && (
                <div className="pb-4 border-b border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Đổi mật khẩu (Tuỳ chọn)</label>
                  <input type="password" placeholder="Bỏ trống nếu không đổi mật khẩu" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}

              <div><label className="block text-sm font-bold text-gray-700 mb-2">Họ tên Bác sĩ / Học hàm *</label><input required className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" placeholder="VD: ThS. BS Nguyễn Văn A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Chuyên khoa *</label><input required className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" placeholder="VD: Khoa Tim Mạch" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Link Ảnh đại diện (URL)</label><input type="url" className="w-full px-5 py-3 rounded-2xl bg-gray-50 outline-none focus:ring-4 focus:ring-primary-500/20" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} /></div>
              
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200">Hủy</button><button type="submit" disabled={loading} className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-md">Lưu thông tin</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
