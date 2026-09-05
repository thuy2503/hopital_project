import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { 
  Plus, Trash2, X, TestTube2, CheckCircle2, 
  AlertCircle, TrendingUp, Upload, Activity, FileImage, 
  Cpu, Eye, Check, RotateCcw, ZoomIn, Info 
} from 'lucide-react';

export default function LabTests() {
  const [labTests, setLabTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [patientTrends, setPatientTrends] = useState([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState('PENDING'); // PENDING, PENDING_APPROVAL, COMPLETED
  
  const [userRole, setUserRole] = useState('');

  const [formData, setFormData] = useState({ 
    patientId: '', 
    testName: '', 
    result: '', 
    notes: '', 
    status: 'PENDING',
    fileUrl: '' 
  });

  const [doctorNotes, setDoctorNotes] = useState('');
  const [doctorResultEdit, setDoctorResultEdit] = useState('');

  const fetchLabTests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/labtests?status=${activeStatusFilter}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setLabTests(data);
    } catch (e) { 
      console.error(e); 
    }
  }, [activeStatusFilter]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE_URL}/api/labtests?status=${activeStatusFilter}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!ignore) {
          setLabTests(data);
        }
      } catch (e) { 
        console.error(e); 
      }
    }
    loadData();
    return () => { ignore = true; };
  }, [activeStatusFilter]);

  useEffect(() => {
    let ignore = false;
    async function loadDependencies() {
      try {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!ignore) setUserRole(payload.role);

        const resPat = await axios.get(`${API_BASE_URL}/api/patients`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!ignore) {
          setPatients(resPat.data);
          if (resPat.data.length > 0) {
            setFormData(f => ({...f, patientId: resPat.data[0].id}));
          }
        }
      } catch (e) { 
        console.error(e); 
      }
    }
    loadDependencies();
    return () => { ignore = true; };
  }, []);

  const handleOrderTestSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        patientId: Number(formData.patientId),
        testName: formData.testName,
        notes: formData.notes
      };
      await axios.post(`${API_BASE_URL}/api/labtests`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setShowAdd(false);
      setFormData(f => ({ ...f, testName: '', notes: '', fileUrl: '', result: '' }));
      fetchLabTests();
    } catch (e) { 
      alert('Lỗi khi chỉ định cận lâm sàng: ' + (e.response?.data?.error || e.message)); 
    }
  };

  // Technician / Staff submits results
  const handleTechnicianSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        result: formData.result,
        notes: formData.notes,
        status: 'PENDING_APPROVAL',
        fileUrl: formData.fileUrl
      };
      await axios.patch(`${API_BASE_URL}/api/labtests/${editingId}`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setShowResultModal(false);
      setEditingId(null);
      fetchLabTests();
      alert("Kết quả đã được gửi lên hệ thống. Đang chờ Bác sĩ phê duyệt!");
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.error || e.message));
    }
  };

  // Doctor approves the result
  const handleDoctorApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/labtests/${selectedTest.id}/approve`, {
        doctorNotes,
        result: doctorResultEdit
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowResultModal(false);
      setSelectedTest(null);
      fetchLabTests();
      alert("Đã phê duyệt và trả kết quả cận lâm sàng cho bệnh nhân thành công!");
    } catch (e) {
      alert('Lỗi phê duyệt: ' + (e.response?.data?.error || e.message));
    }
  };

  // Revert test to PENDING
  const handleDoctorRevert = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn yêu cầu thực hiện lại xét nghiệm này? Trạng thái sẽ quay lại PENDING.")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/labtests/${selectedTest.id}`, {
        status: 'PENDING',
        notes: doctorNotes ? `[Yêu cầu thực hiện lại]: ${doctorNotes}` : 'Yêu cầu thực hiện lại do thiếu thông tin'
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowResultModal(false);
      setSelectedTest(null);
      fetchLabTests();
      alert("Đã trả lại chỉ định cận lâm sàng về phòng thực hiện.");
    } catch (e) {
      alert('Lỗi trả lại đơn: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Chắc chắn muốn xoá chỉ định xét nghiệm này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/labtests/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchLabTests();
    } catch (e) { 
      console.error(e);
      alert('Lỗi khi xoá!'); 
    }
  };

  // Mock LIS / DICOM Device integration simulator
  const handleSimulateDevice = () => {
    const isImaging = formData.testName.toLowerCase().includes('x-quang') || 
                      formData.testName.toLowerCase().includes('siêu âm') || 
                      formData.testName.toLowerCase().includes('mri') || 
                      formData.testName.toLowerCase().includes('chụp');
    
    if (isImaging) {
      // Generate simulated chest X-ray SVG image
      const mockDicomSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230c0f1d"/><circle cx="50" cy="50" r="35" stroke="%233b82f6" stroke-width="0.5" fill="none" opacity="0.3"/><path d="M50 5 L50 95 M5 50 L95 50" stroke="%231e293b" stroke-width="0.3"/><path d="M25 25 Q35 15 45 25 Q30 50 45 75 Q35 85 25 75 Q35 50 25 25" stroke="white" stroke-width="1" fill="none" opacity="0.5"/><path d="M75 25 Q65 15 55 25 Q70 50 55 75 Q65 85 75 75 Q65 50 75 25" stroke="white" stroke-width="1" fill="none" opacity="0.5"/><circle cx="50" cy="50" r="10" stroke="%23ef4444" stroke-width="0.8" fill="none" stroke-dasharray="2" opacity="0.8"/><text x="5" y="12" fill="%2360a5fa" font-size="3" font-family="monospace">SERIES: DICOM-9981</text><text x="5" y="17" fill="%2334d399" font-size="3" font-family="monospace">DEVICE: SIEMENS X-300</text><text x="5" y="93" fill="%23ef4444" font-size="3" font-family="monospace">CÓ VẾT MỜ RÌA PHỔI PHẢI</text></svg>`;
      
      setFormData(f => ({
        ...f,
        result: "[DICOM AUTO SYNC]\nKết quả chụp X-quang ngực thẳng:\n- Bóng tim không lớn.\n- Phế trường bên phải có tổn thương dạng thâm nhiễm mờ nhẹ nghi tổn thương kẽ vùng nách phổi.\n- Rốn phổi hai bên bình thường.\n- Góc sườn hoành hai bên sáng.",
        fileUrl: mockDicomSvg,
        notes: "Đồng bộ tự động hoàn tất từ máy DICOM Siemens"
      }));
    } else {
      // Simulate biochemistry Blood lab results (LIS)
      const glucose = (4.5 + Math.random() * 4).toFixed(1);
      const cholesterol = (3.5 + Math.random() * 3).toFixed(1);
      const platelets = Math.floor(150 + Math.random() * 200);
      
      setFormData(f => ({
        ...f,
        result: `[LIS AUTO SYNC]\n- Glucose (Đường huyết): ${glucose} mmol/L (Chuẩn: 3.9 - 6.4)\n- Cholesterol toàn phần: ${cholesterol} mmol/L (Chuẩn: < 5.2)\n- Tiểu cầu (Platelets): ${platelets} G/L (Chuẩn: 150 - 350)\n- Bạch cầu (WBC): 6.4 G/L (Chuẩn: 4.0 - 10.0)`,
        notes: "Kết nối thiết bị xét nghiệm LIS Roche-Hitachi"
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(f => ({ ...f, fileUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Trends calculation
  const fetchTrends = async (patientId, testName) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/labtests/patient/${patientId}/trends?testName=${encodeURIComponent(testName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientTrends(data);
      setShowTrendModal(true);
    } catch (e) {
      console.error(e);
      alert("Lỗi lấy dữ liệu biểu đồ xu hướng.");
    }
  };

  // Helper to extract numbers from clinical text
  const extractNumericVal = (str) => {
    if (!str) return null;
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  // Render SVG Chart based on historical patient data
  const renderTrendChart = () => {
    const points = patientTrends
      .map(t => ({ date: new Date(t.createdAt).toLocaleDateString('vi-VN'), val: extractNumericVal(t.result) }))
      .filter(p => p.val !== null);

    if (points.length < 2) {
      return (
        <div className="py-12 text-center text-gray-500 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Info className="mx-auto mb-2 text-gray-400" size={24} />
          Cần ít nhất 2 kết quả xét nghiệm định lượng có cùng tên của bệnh nhân này để vẽ biểu đồ so sánh xu hướng.
        </div>
      );
    }

    const values = points.map(p => p.val);
    const maxVal = Math.max(...values) * 1.2;
    const minVal = Math.min(...values) * 0.8;
    const range = maxVal - minVal || 1;

    const width = 500;
    const height = 200;
    const padding = 35;

    const getX = (idx) => padding + (idx * (width - 2 * padding)) / (points.length - 1);
    const getY = (val) => height - padding - ((val - minVal) * (height - 2 * padding)) / range;

    let pathD = "";
    points.forEach((p, idx) => {
      const x = getX(idx);
      const y = getY(p.val);
      if (idx === 0) pathD += `M ${x} ${y}`;
      else pathD += ` L ${x} ${y}`;
    });

    return (
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 text-purple-900 border border-purple-100 rounded-2xl flex justify-between items-center">
          <span className="text-xs font-bold uppercase">Xét nghiệm: {patientTrends[0]?.testName}</span>
          <span className="text-xs font-bold text-purple-700">Theo dõi tiến trình chỉ số sinh hóa</span>
        </div>
        
        <div className="overflow-x-auto bg-white p-3 rounded-2xl border border-gray-100 shadow-inner">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[450px] h-48">
            {/* Grid background lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = padding + r * (height - 2 * padding);
              const gridVal = maxVal - r * range;
              return (
                <g key={i}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={padding - 5} y={y + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="end">{gridVal.toFixed(1)}</text>
                </g>
              );
            })}

            {/* SVG Path line */}
            <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {points.map((p, idx) => {
              const x = getX(idx);
              const y = getY(p.val);
              return (
                <g key={idx} className="group">
                  <circle cx={x} cy={y} r="5" fill="#c084fc" stroke="#8b5cf6" strokeWidth="2" className="cursor-pointer transition-all hover:r-7" />
                  <text x={x} y={y - 10} fill="#1e293b" fontSize="9" fontWeight="extrabold" textAnchor="middle">{p.val}</text>
                  <text x={x} y={height - 8} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">{p.date}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Small Data Grid */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
              <tr>
                <th className="p-3">Ngày thực hiện</th>
                <th className="p-3">Chỉ số đo đạc</th>
                <th className="p-3">Nội dung chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {patientTrends.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="p-3 text-xs">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3 font-black text-purple-700">{extractNumericVal(t.result) || 'Không rõ'}</td>
                  <td className="p-3 text-xs text-gray-500 truncate max-w-xs">{t.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Cận Lâm Sàng</h2>
          <p className="text-gray-500 font-medium">Chỉ định siêu âm, X-quang, MRI & Xét nghiệm máu. Kiểm duyệt kết quả ảnh chuẩn LIS/DICOM.</p>
        </div>
        {(userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'STAFF') && (
          <button 
            onClick={() => {
              setFormData({ patientId: patients[0]?.id || '', testName: '', result: '', notes: '', status: 'PENDING', fileUrl: '' });
              setShowAdd(true);
            }} 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 transform hover:-translate-y-0.5"
          >
            <Plus size={20} /> Chỉ định Cận lâm sàng
          </button>
        )}
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex border-b border-gray-200 bg-white p-1.5 rounded-2xl shadow-sm gap-2">
        <button 
          onClick={() => setActiveStatusFilter('PENDING')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeStatusFilter === 'PENDING' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <RotateCcw size={16} /> Chờ thực hiện xét nghiệm
          {labTests.length > 0 && activeStatusFilter === 'PENDING' && (
            <span className="ml-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg text-xs font-bold">{labTests.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveStatusFilter('PENDING_APPROVAL')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeStatusFilter === 'PENDING_APPROVAL' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Activity size={16} /> Chờ Bác sĩ duyệt trả kết quả
          {labTests.length > 0 && activeStatusFilter === 'PENDING_APPROVAL' && (
            <span className="ml-1 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold animate-pulse">{labTests.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveStatusFilter('COMPLETED')} 
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeStatusFilter === 'COMPLETED' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <CheckCircle2 size={16} /> Đã trả kết quả cho bệnh nhân
        </button>
      </div>

      {/* MAIN LIST OF LAB ORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {labTests.map(test => (
          <div key={test.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group hover:shadow-lg transition-all flex flex-col h-full space-y-4">
            
            {/* Quick action delete */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {userRole !== 'PATIENT' && (
                <button onClick={() => handleDelete(test.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors font-bold"><Trash2 size={16}/></button>
              )}
            </div>
            
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-gray-50 pb-4 pr-12">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                test.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                test.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-purple-50 text-purple-600 border-purple-100'
              }`}>
                <TestTube2 size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 line-clamp-1">{test.testName}</h3>
                <p className="text-sm font-bold text-gray-700">BN: {test.patient?.fullName}</p>
              </div>
            </div>
            
            {/* Body metadata */}
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold">Bác sĩ chỉ định:</span>
                <span className="font-bold text-gray-900">{test.doctor?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold">Ngày chỉ định:</span>
                <span className="font-bold text-gray-900">{new Date(test.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              
              {/* Image attachment small indicator */}
              {test.fileUrl && (
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                  <FileImage size={14} /> Có tệp hình ảnh đính kèm ({test.fileUrl.startsWith('data:image/svg') ? 'Ảnh quét DICOM' : 'Ảnh siêu âm/chụp chiếu'})
                </div>
              )}

              {/* Status Section */}
              <div className="pt-2">
                {test.status === 'PENDING' ? (
                  <div className="space-y-3">
                    <div className="bg-purple-50/50 text-purple-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-purple-100/50">
                      <AlertCircle size={14} className="animate-spin" /> Đang chờ Kỹ thuật viên xét nghiệm thực hiện...
                    </div>
                    {userRole !== 'PATIENT' && (
                      <button 
                        onClick={() => {
                          setEditingId(test.id);
                          setFormData({
                            patientId: test.patientId,
                            testName: test.testName,
                            result: test.result || '',
                            notes: test.notes || '',
                            status: 'PENDING_APPROVAL',
                            fileUrl: test.fileUrl || ''
                          });
                          setShowResultModal(true);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/10"
                      >
                        <Cpu size={14} /> Tiến hành / Cập nhật kết quả
                      </button>
                    )}
                  </div>
                ) : test.status === 'PENDING_APPROVAL' ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-amber-200">
                      <AlertCircle size={14} /> KTV đã trả kết quả. Đang chờ Bác sĩ duyệt!
                    </div>
                    {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
                      <button 
                        onClick={() => {
                          setSelectedTest(test);
                          setDoctorNotes(test.notes || '');
                          setDoctorResultEdit(test.result || '');
                          setShowResultModal(true);
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                      >
                        <Eye size={14} /> Xem & Duyệt Kết Quả
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 p-3 rounded-xl text-xs font-medium space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <CheckCircle2 size={16} className="text-emerald-600" /> Kết quả đã phê duyệt:
                      </div>
                      <p className="whitespace-pre-wrap text-[11px] font-bold bg-white p-2.5 rounded-lg border border-emerald-100/50 max-h-24 overflow-y-auto">{test.result}</p>
                      {test.notes && <p className="text-[10px] text-gray-500 italic block mt-1">Ghi chú BS: {test.notes}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setShowResultModal(true);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                      >
                        <Eye size={13} /> Xem Chi Tiết
                      </button>
                      <button
                        onClick={() => fetchTrends(test.patientId, test.testName)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-purple-100"
                      >
                        <TrendingUp size={13} /> Biểu đồ xu hướng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}

        {labTests.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
             <TestTube2 size={56} className="mx-auto text-gray-200 mb-3" />
             <p className="text-gray-900 font-extrabold text-lg">Không tìm thấy chỉ định cận lâm sàng nào trong hàng đợi này</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ORDER NEW LAB TEST */}
      {/* ========================================================================= */}
      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-xl font-extrabold text-gray-900">Chỉ định cận lâm sàng mới</h3>
               <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full border border-gray-100 transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleOrderTestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Bệnh nhân thụ hưởng <span className="text-red-500">*</span></label>
                <select 
                  required 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none font-bold text-gray-900 bg-white" 
                  value={formData.patientId} 
                  onChange={e => setFormData({...formData, patientId: e.target.value})}
                >
                  {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} (CCCD: {p.cccd || '---'})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Loại Xét nghiệm / Thăm dò chức năng <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="VD: Xét nghiệm Sinh hóa máu, Chụp X-Quang Ngực Thẳng..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none font-bold text-gray-900" 
                  value={formData.testName} 
                  onChange={e => setFormData({...formData, testName: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Yêu cầu lâm sàng kèm theo</label>
                <textarea 
                  rows="3"
                  placeholder="VD: Nghi ngờ tổn thương phổi kẽ, hoặc kiểm tra glucose máu lúc đói..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm font-medium resize-none text-gray-800" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-gray-600 text-xs">Hủy bỏ</button>
                <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md text-xs">Phát lệnh chỉ định</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INTERACTIVE RESULT FILL & DOCTOR REVIEW MODAL */}
      {/* ========================================================================= */}
      {showResultModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
               <div>
                 <h3 className="text-lg font-black text-gray-900">Chi tiết dịch vụ cận lâm sàng</h3>
                 <p className="text-xs text-gray-500 font-semibold">Mã chỉ định: #{editingId || selectedTest?.id} | Trạng thái: {editingId ? 'KTV thực hiện' : 'Bác sĩ kiểm duyệt'}</p>
               </div>
               <button 
                 onClick={() => { 
                   setShowResultModal(false); 
                   setEditingId(null); 
                   setSelectedTest(null); 
                 }} 
                 className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full border border-gray-100"
               >
                 <X size={18} />
               </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4 text-sm">
              
              {/* Patient Profile Snapshot */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50 flex justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-600 uppercase">Bệnh nhân thụ hưởng</div>
                  <strong className="text-base font-black text-purple-900">{selectedTest?.patient?.fullName || patients.find(p => p.id === formData.patientId)?.fullName}</strong>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400">Dịch vụ chỉ định</div>
                  <strong className="text-base font-extrabold text-gray-900">{selectedTest?.testName || formData.testName}</strong>
                </div>
              </div>

              {/* -------------------- KTV FILLING MODE -------------------- */}
              {editingId && (
                <form onSubmit={handleTechnicianSubmit} className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs font-bold text-gray-600 block">Đồng bộ tự động (LIS/DICOM)</span>
                      <p className="text-[11px] text-gray-400">Mô phỏng đồng bộ kết quả trực tiếp từ thiết bị cận lâm sàng.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateDevice}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shadow-md shadow-emerald-600/15"
                    >
                      <Cpu size={14} /> Mô phỏng máy đo
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Kết quả đo đạc lâm sàng (Chỉ số / Nhận định) <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      rows="6"
                      placeholder="Glucose, Bạch cầu, hay Mô tả hình ảnh X-quang..."
                      value={formData.result}
                      onChange={e => setFormData({ ...formData, result: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none font-bold text-gray-900 focus:border-purple-500 font-mono text-xs"
                    />
                  </div>

                  {/* Attachment image preview or upload */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Đính kèm ảnh kết quả (Siêu âm, X-quang, Chụp quét)</label>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="ktv-file-upload"
                        />
                        <label htmlFor="ktv-file-upload" className="cursor-pointer space-y-1 block">
                          <Upload className="mx-auto text-gray-400" size={24} />
                          <span className="text-xs font-bold text-purple-600 block">Chọn tệp hình ảnh</span>
                          <span className="text-[10px] text-gray-400 block">JPG, PNG (Chuyển thành base64)</span>
                        </label>
                      </div>
                      
                      {formData.fileUrl ? (
                        <div className="relative border border-gray-200 rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                          <img src={formData.fileUrl} alt="Preview" className="max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, fileUrl: '' }))}
                            className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-md"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                          Chưa có ảnh chụp chiếu nào được đính kèm.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú kỹ thuật</label>
                    <input
                      type="text"
                      placeholder="Lưu ý về máy móc, mẫu thử..."
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => { setShowResultModal(false); setEditingId(null); }} 
                      className="px-5 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-gray-500 text-xs"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 text-xs shadow-md shadow-purple-600/10"
                    >
                      Gửi Bác sĩ phê duyệt
                    </button>
                  </div>
                </form>
              )}

              {/* -------------------- DOCTOR REVIEW MODE -------------------- */}
              {selectedTest && selectedTest.status === 'PENDING_APPROVAL' && (
                <div className="space-y-4">
                  
                  {/* Results preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Text values */}
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chỉ số do Kỹ thuật viên đo đạc:</label>
                        <div className="font-mono text-xs font-bold text-gray-900 bg-white p-3 rounded-xl border border-gray-200/50 whitespace-pre-wrap">
                          {selectedTest.result || 'Không có kết quả số liệu.'}
                        </div>
                      </div>

                      {/* Doctor can override or edit the result text directly before approving */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Hiệu chỉnh kết quả đo (nếu cần)</label>
                        <textarea
                          rows="3"
                          value={doctorResultEdit}
                          onChange={e => setDoctorResultEdit(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none font-mono text-xs font-bold text-gray-800 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Scan image review */}
                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Hình ảnh chụp chiếu cận lâm sàng:</span>
                      {selectedTest.fileUrl ? (
                        <div className="relative border border-gray-200 bg-black rounded-2xl overflow-hidden aspect-square flex items-center justify-center group">
                          <img src={selectedTest.fileUrl} alt="Scan DICOM" className="max-h-full object-contain" />
                          <button
                            onClick={() => setShowImageLightbox(true)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-extrabold text-xs transition-opacity gap-1"
                          >
                            <ZoomIn size={18} /> Phóng lớn ảnh chụp
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200 h-48 flex items-center justify-center">
                          Chỉ định này không kèm tệp hình ảnh.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Kết luận y khoa & Hướng dẫn điều trị của Bác sĩ chỉ định <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      rows="3"
                      placeholder="Nhập chẩn đoán cận lâm sàng, kết luận hoặc lời dặn bệnh nhân..."
                      value={doctorNotes}
                      onChange={e => setDoctorNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-900"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                      onClick={handleDoctorRevert}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                    >
                      Từ chối & Yêu cầu làm lại
                    </button>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setShowResultModal(false); setSelectedTest(null); }} 
                        className="px-5 py-2.5 rounded-xl hover:bg-gray-100 font-bold text-gray-500 text-xs"
                      >
                        Đóng
                      </button>
                      <button 
                        onClick={handleDoctorApprove}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 flex items-center gap-1"
                      >
                        <Check size={14} /> Phê Duyệt & Trả Kết Quả
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------- CLINICAL READ ONLY VIEW -------------------- */}
              {selectedTest && selectedTest.status === 'COMPLETED' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 block mb-1">Kết quả đo lường cận lâm sàng:</span>
                        <p className="font-mono text-xs font-bold text-gray-900 bg-white p-3 rounded-xl border border-gray-200/50 whitespace-pre-wrap max-h-48 overflow-y-auto">{selectedTest.result}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                        <span className="text-xs font-bold text-emerald-700 block mb-1">Kết luận chẩn đoán của Bác sĩ chỉ định:</span>
                        <p className="font-bold text-emerald-950 text-sm whitespace-pre-wrap">{selectedTest.notes || 'Bác sĩ không ghi nhận thêm ý kiến kết luận.'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-gray-400 uppercase">Tệp hình ảnh lưu trữ bệnh lịch:</span>
                      {selectedTest.fileUrl ? (
                        <div className="relative border border-gray-200 bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center group">
                          <img src={selectedTest.fileUrl} alt="DICOM Scan" className="max-h-full object-contain" />
                          <button
                            onClick={() => setShowImageLightbox(true)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity gap-1"
                          >
                            <ZoomIn size={16} /> Phóng lớn ảnh chụp
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200 h-36 flex items-center justify-center">
                          Chỉ định này không kèm tệp hình ảnh.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => { setShowResultModal(false); setSelectedTest(null); }} 
                      className="px-6 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md"
                    >
                      Đóng cửa sổ
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TREND LINE GRAPH MODAL */}
      {/* ========================================================================= */}
      {showTrendModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
               <div>
                 <h3 className="text-lg font-black text-gray-900">Biểu đồ so sánh & Tiến trình</h3>
                 <p className="text-xs text-gray-500 font-semibold">Theo dõi sự phát triển các chỉ số qua các lần thăm khám cận lâm sàng trước.</p>
               </div>
               <button onClick={() => setShowTrendModal(false)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full border border-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6">
              {renderTrendChart()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX FOR FULLSCREEN IMAGE ZOOM */}
      {/* ========================================================================= */}
      {showImageLightbox && (selectedTest?.fileUrl || formData.fileUrl) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setShowImageLightbox(false)} 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full border border-white/10 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden border border-white/10 rounded-3xl bg-black shadow-2xl">
            <img 
              src={selectedTest?.fileUrl || formData.fileUrl} 
              alt="Scan DICOM Zoomed" 
              className="max-w-full max-h-[85vh] object-contain" 
            />
          </div>
          <div className="mt-4 text-center text-gray-300 text-sm font-bold bg-white/10 px-6 py-2 rounded-2xl border border-white/5">
            Phóng lớn ảnh quét cận lâm sàng chuyên sâu (Chuẩn hiển thị DICOM chất lượng cao)
          </div>
        </div>
      )}

    </div>
  );
}
