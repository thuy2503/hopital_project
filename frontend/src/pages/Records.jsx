import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { FileText, Plus, ClipboardList, Edit2, Trash2, X, Search, CheckCircle2, Download, AlertTriangle, CheckSquare, Clock, Filter, History } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLocation } from 'react-router-dom';

const COMMON_ICD10 = [
  { code: 'I10', diagnosis: 'Tăng huyết áp vô căn (vô căn)' },
  { code: 'E11', diagnosis: 'Đái tháo đường không phụ thuộc insulin' },
  { code: 'J00', diagnosis: 'Viêm mũi họng cấp (Cảm lạnh thông thường)' },
  { code: 'J20.9', diagnosis: 'Viêm phế quản cấp không xác định' },
  { code: 'K29.9', diagnosis: 'Viêm dạ dày không xác định' },
  { code: 'A09', diagnosis: 'Tiêu chảy và viêm dạ dày ruột do nhiễm khuẩn' },
  { code: 'M54.5', diagnosis: 'Đau lưng dưới' },
  { code: 'N39.0', diagnosis: 'Nhiễm trùng đường tiết niệu, vị trí không xác định' },
  { code: 'R05', diagnosis: 'Ho' },
  { code: 'R50.9', diagnosis: 'Sốt không xác định' },
];

export default function Records() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [systemServices, setSystemServices] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAllDrugs, setShowAllDrugs] = useState(false);
  
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [printingRecord, setPrintingRecord] = useState(null);
  
  const [formData, setFormData] = useState({ patientId: '', symptoms: '', diagnosis: '', icd10Code: '', prescription: '', notes: '', bloodPressure: '', heartRate: '', temperature: '', weight: '' });
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [drugSearch, setDrugSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  // Filters
  const [filterDateStr, setFilterDateStr] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);

  // Interactions Warning Modal
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState([]);

  // EMR digital signature & file upload states
  const [doctorSignature, setDoctorSignature] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // PACS Viewer states
  const [showPACSViewer, setShowPACSViewer] = useState(false);
  const [pacsFile, setPacsFile] = useState(null);
  const [pacsZoom, setPacsZoom] = useState(1);
  const [pacsRotation, setPacsRotation] = useState(0);
  const [pacsBrightness, setPacsBrightness] = useState(100);
  const [pacsContrast, setPacsContrast] = useState(100);
  const [activePacsTool, setActivePacsTool] = useState('none');
  const [measurements, setMeasurements] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a'; // ink color
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    if (e.cancelable) e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setDoctorSignature(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDoctorSignature(null);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: file.type || (file.name.endsWith('.dcm') ? 'application/dicom' : 'application/octet-stream'),
          url: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };
  const handleViewportMouseDown = (e) => {
    if (activePacsTool !== 'ruler') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentLine({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleViewportMouseMove = (e) => {
    if (!currentLine || activePacsTool !== 'ruler') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentLine(prev => ({ ...prev, x2: x, y2: y }));
  };

  const handleViewportMouseUp = () => {
    if (!currentLine || activePacsTool !== 'ruler') return;
    const dx = currentLine.x2 - currentLine.x1;
    const dy = currentLine.y2 - currentLine.y1;
    const distance_px = Math.sqrt(dx*dx + dy*dy);
    const length_mm = (distance_px * 0.25).toFixed(1);
    
    setMeasurements(prev => [...prev, { ...currentLine, length: length_mm }]);
    setCurrentLine(null);
  };
  
  const location = useLocation();

  const fetchRecords = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/records?`;
      if (filterDateStr) url += `startDate=${filterDateStr}&`;
      if (filterDateEnd) url += `endDate=${filterDateEnd}&`;
      if (filterStatus) url += `status=${filterStatus}&`;
      
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setRecords(data);
    } catch (e) { console.error(e); }
  }, [filterDateStr, filterDateEnd, filterStatus]);

  const fetchDependencies = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
      const userObj = JSON.parse(localStorage.getItem('user') || 'null');
      setCurrentUser(userObj);

      const [resPat, resDrug, resSrv] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/patients`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/drugs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/services`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPatients(resPat.data);
      setDrugs(resDrug.data);
      setSystemServices(resSrv.data);
      
      if (location.state?.createForPatientId) {
        setFormData(f => ({...f, patientId: location.state.createForPatientId}));
        setShowAdd(true);
        // Clear state so it doesn't reopen on refresh
        window.history.replaceState({}, document.title);
      } else if (resPat.data.length > 0 && !editingId) {
        setFormData(f => ({...f, patientId: resPat.data[0].id}));
      }
    } catch (e) { console.error(e); }
  }, [editingId, location.state]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { fetchDependencies(); }, [fetchDependencies]);

  const handleSubmit = async (e, ignoreInteractions = false) => {
    if(e) e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        ...formData, 
        items: selectedDrugs, 
        services: selectedServices, 
        ignoreInteractions,
        doctorSignature,
        attachments: uploadedFiles 
      };
      if (editingId) {
        await axios.patch(`${API_BASE_URL}/api/records/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/api/records`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      handleCloseModal();
      setShowWarningModal(false);
      fetchRecords();
    } catch (e) { 
      const errRes = e.response?.data;
      if (errRes?.interactions) {
        setInteractionWarnings(errRes.interactions);
        setShowWarningModal(true);
      } else {
        alert('Lỗi: ' + (errRes?.error || e.message)); 
      }
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Xác nhận duyệt toa thuốc và xuất kho?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/records/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Đã duyệt toa thuốc và trừ tồn kho thành công!");
      fetchRecords();
    } catch(e) {
      alert("Lỗi: " + (e.response?.data?.error || e.message));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Nhập lý do từ chối/trả lại cho bác sĩ (Tùy chọn):");
    if (reason === null) return; // User cancelled

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/records/${id}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Đã từ chối/trả lại bệnh án!");
      fetchRecords();
    } catch(e) {
      alert("Lỗi: " + (e.response?.data?.error || e.message));
    }
  };

  const handleEdit = (r) => {
    setFormData({ patientId: r.patientId, symptoms: r.symptoms || '', diagnosis: r.diagnosis, icd10Code: r.icd10Code || '', prescription: r.prescription || '', notes: r.notes || '', bloodPressure: r.bloodPressure || '', heartRate: r.heartRate || '', temperature: r.temperature || '', weight: r.weight || '' });
    const existingDrugs = r.prescriptionItems?.map(item => ({
      drugId: item.drugId,
      name: item.drug.name,
      quantity: item.quantity,
      price: item.price,
      instructions: item.instructions || ''
    })) || [];
    setSelectedDrugs(existingDrugs);
    setEditingId(r.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cảnh báo: Xoá bệnh án sẽ xoá luôn Hoá đơn liên quan. Chắc chắn tiếp tục?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/records/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchRecords();
    } catch(e) { console.error(e); alert('Lỗi hệ thống khi xoá!'); }
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({ patientId: patients[0]?.id || '', symptoms: '', diagnosis: '', icd10Code: '', prescription: '', notes: '', bloodPressure: '', heartRate: '', temperature: '', weight: '' });
    setSelectedDrugs([]);
    setSelectedServices([]);
    setDrugSearch('');
    setServiceSearch('');
    setDoctorSignature(null);
    setUploadedFiles([]);
  };

  const exportPDF = async (record) => {
    try {
      setPrintingRecord(record);
      // Wait for React to render the global print container in DOM
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      const elem = document.getElementById("receipt-print-global");
      if (!elem) {
        throw new Error("Không tìm thấy phần tử in!");
      }
      
      const canvas = await html2canvas(elem, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Don_Thuoc_MedPro_${record.id}.pdf`);
    } catch (e) { 
      alert("Lỗi xuất PDF!"); 
      console.error(e); 
    } finally {
      setPrintingRecord(null);
    }
  };

  const exportXML = (record) => {
    try {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<GIAM_DINH_BHYT>\n`;
      
      // XML 1: Tổng hợp thông tin bệnh nhân và chi phí
      xml += `  <XML1_TONG_HOP>\n`;
      xml += `    <MA_LK>${record.id}</MA_LK>\n`;
      xml += `    <CCCD>${record.patient?.cccd || ''}</CCCD>\n`;
      xml += `    <HO_TEN>${record.patient?.fullName || ''}</HO_TEN>\n`;
      xml += `    <NGAY_SINH>${record.patient?.dob ? record.patient.dob.split('T')[0] : ''}</NGAY_SINH>\n`;
      xml += `    <GIOI_TINH>${record.patient?.gender || ''}</GIOI_TINH>\n`;
      xml += `    <MA_THE_BHYT>${record.patient?.healthInsurance || ''}</MA_THE_BHYT>\n`;
      xml += `    <MA_BENH>${record.icd10Code || ''}</MA_BENH>\n`;
      xml += `    <TEN_BENH>${record.diagnosis || ''}</TEN_BENH>\n`;
      xml += `    <TRIEU_CHUNG>${record.symptoms || ''}</TRIEU_CHUNG>\n`;
      xml += `    <HUYET_AP>${record.bloodPressure || ''}</HUYET_AP>\n`;
      xml += `    <NHIP_TIM>${record.heartRate || ''}</NHIP_TIM>\n`;
      xml += `    <NHIET_DO>${record.temperature || ''}</NHIET_DO>\n`;
      xml += `    <CAN_NANG>${record.weight || ''}</CAN_NANG>\n`;
      xml += `    <NGAY_VAO>${record.createdAt ? record.createdAt.split('T')[0] : ''}</NGAY_VAO>\n`;
      xml += `    <TEN_BAC_SI>${record.doctor?.name || ''}</TEN_BAC_SI>\n`;
      xml += `    <KHOA_KHAM>${record.doctor?.specialty || ''}</KHOA_KHAM>\n`;
      xml += `    <TONG_CHI_PHI>${record.invoice?.totalAmount || 0}</TONG_CHI_PHI>\n`;
      xml += `  </XML1_TONG_HOP>\n`;

      // XML 2: Chi tiết thuốc kê đơn
      if (record.prescriptionItems && record.prescriptionItems.length > 0) {
        xml += `  <XML2_CHI_TIET_THUOC>\n`;
        record.prescriptionItems.forEach((item, idx) => {
          xml += `    <THUOC_ITEM>\n`;
          xml += `      <STT>${idx + 1}</STT>\n`;
          xml += `      <MA_THUOC>${item.drug.id}</MA_THUOC>\n`;
          xml += `      <TEN_THUOC>${item.drug.name}</TEN_THUOC>\n`;
          xml += `      <HOAT_CHAT>${item.drug.ingredient || ''}</HOAT_CHAT>\n`;
          xml += `      <DON_VI_TINH>${item.drug.unit || 'Viên'}</DON_VI_TINH>\n`;
          xml += `      <SO_LUONG>${item.quantity}</SO_LUONG>\n`;
          xml += `      <DON_GIA>${item.price}</DON_GIA>\n`;
          xml += `      <LIEU_DUNG>${item.instructions || ''}</LIEU_DUNG>\n`;
          xml += `    </THUOC_ITEM>\n`;
        });
        xml += `  </XML2_CHI_TIET_THUOC>\n`;
      }

      // XML 3: Chi tiết dịch vụ cận lâm sàng
      if (record.labTests && record.labTests.length > 0) {
        xml += `  <XML3_CHI_TIET_DICH_VU>\n`;
        record.labTests.forEach((srv, idx) => {
          xml += `    <DICH_VU_ITEM>\n`;
          xml += `      <STT>${idx + 1}</STT>\n`;
          xml += `      <TEN_DICH_VU>${srv.testName}</TEN_DICH_VU>\n`;
          xml += `      <TRANG_THAI>${srv.status}</TRANG_THAI>\n`;
          xml += `      <KET_QUA>${srv.result || ''}</KET_QUA>\n`;
          xml += `    </DICH_VU_ITEM>\n`;
        });
        xml += `  </XML3_CHI_TIET_DICH_VU>\n`;
      }

      xml += `</GIAM_DINH_BHYT>`;

      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `XML_BHYT_BA_${record.id}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Lỗi xuất XML: " + e.message);
    }
  };

  const addDrugToPrescription = (drug) => {
    if (selectedDrugs.find(d => d.drugId === drug.id)) return;
    if (drug.inStock <= 0) { alert('Thuốc này đã hết hàng trong kho!'); return; }
    setSelectedDrugs([...selectedDrugs, { drugId: drug.id, name: drug.name, quantity: 1, price: drug.price, instructions: drug.usage || '' }]);
    setDrugSearch('');
    setShowDrugDropdown(false);
  };

  const updateSelectedDrug = (drugId, field, value) => {
    setSelectedDrugs(selectedDrugs.map(d => d.drugId === drugId ? { ...d, [field]: value } : d));
  };
  const removeSelectedDrug = (drugId) => {
    setSelectedDrugs(selectedDrugs.filter(d => d.drugId !== drugId));
  };

  const addServiceToRecord = (srv) => {
    if (selectedServices.find(s => s.id === srv.id)) return;
    setSelectedServices([...selectedServices, { id: srv.id, name: srv.name, price: srv.price }]);
    setServiceSearch('');
    setShowServiceDropdown(false);
  };
  const removeSelectedService = (id) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };
  const filteredServices = systemServices.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));

  const filteredDrugs = drugs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(drugSearch.toLowerCase()) || 
                          (d.ingredient && d.ingredient.toLowerCase().includes(drugSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (showAllDrugs) return true;

    if (currentUser?.role === 'DOCTOR' && currentUser?.specialty) {
      return !d.specialty || d.specialty.toLowerCase() === currentUser.specialty.toLowerCase();
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hồ sơ Bệnh án</h2>
          <p className="text-gray-500 font-medium">Lịch sử khám, chẩn đoán và Đơn thuốc điện tử</p>
        </div>
        {['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(userRole) && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 transform hover:-translate-y-0.5"><Plus size={20} /> Viết bệnh án mới</button>
        )}
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-500 font-bold"><Filter size={18}/> Bộ lọc:</div>
        <input type="date" className="px-3 py-2 border rounded-xl" value={filterDateStr} onChange={e => setFilterDateStr(e.target.value)} />
        <span className="text-gray-400">-</span>
        <input type="date" className="px-3 py-2 border rounded-xl" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
        
        <select className="px-3 py-2 border rounded-xl font-medium" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái Đơn thuốc</option>
          <option value="PENDING">Đang chờ duyệt</option>
          <option value="APPROVED">Đã duyệt (Hoàn tất)</option>
          <option value="REJECTED">Đã từ chối/Trả lại</option>
        </select>
        {(filterDateStr || filterDateEnd || filterStatus) && (
           <button onClick={() => { setFilterDateStr(''); setFilterDateEnd(''); setFilterStatus(''); }} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-sm font-bold">Xoá lọc</button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {records.map(record => (
          <div key={record.id} onClick={() => {setSelectedRecord(record); setShowDetailModal(true);}} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group hover:shadow-md hover:border-primary-200 transition-all cursor-pointer flex flex-col h-full">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {record.histories && record.histories.length > 0 && (
                 <button title="Lịch sử chỉnh sửa" onClick={(e) => { e.stopPropagation(); setSelectedHistory(record.histories); setShowHistoryModal(true); }} className="text-purple-600 hover:bg-purple-50 p-2 rounded-xl transition-colors font-bold"><History size={16}/></button>
              )}
              <button title="Xuất Toa thuốc" onClick={(e) => { e.stopPropagation(); exportPDF(record); }} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors font-bold"><Download size={16}/></button>
            </div>
            
            <div className="flex items-center gap-4 border-b border-gray-50 pb-5 pr-16">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100"><FileText size={28} /></div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg line-clamp-1">{record.patient?.fullName}</h3>
                <p className="text-sm font-medium text-gray-400 mt-1">{new Date(record.createdAt).toLocaleDateString('vi-VN')} / BS: {record.doctor?.name || '---'}</p>
                <div className="mt-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    record.prescriptionStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                    record.prescriptionStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {record.prescriptionStatus === 'APPROVED' ? 'Đã hoàn tất' : 
                     record.prescriptionStatus === 'REJECTED' ? 'Từ chối/Trả lại' : 
                     'Chờ duyệt'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex-1">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Chẩn đoán sơ bộ</p>
               <p className="text-gray-900 font-bold line-clamp-2">{record.diagnosis || '---'}</p>
            </div>

          </div>
        ))}

        {records.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200">
             <ClipboardList size={56} className="mx-auto text-gray-200 mb-4" />
             <p className="text-gray-900 font-extrabold text-xl">Chưa có Bệnh án nào</p>
             <p className="text-gray-500 font-medium mt-1">Hồ sơ lưu trữ điện tử sẽ xuất hiện tại đây</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
               <h3 className="text-2xl font-extrabold text-gray-900">{editingId ? 'Cập nhật Bệnh án' : 'Bộ tạo Bệnh án & Kê đơn'}</h3>
               <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full shadow-sm transition-colors border border-gray-100"><X size={20} /></button>
            </div>
            
            <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bệnh nhân <span className="text-red-500">*</span></label>
                  <select required disabled={!!editingId} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-gray-900 disabled:opacity-70" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn nhanh Mã bệnh (ICD-10)</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-gray-900 bg-gray-50/50" 
                    value={COMMON_ICD10.some(item => item.code === formData.icd10Code) ? formData.icd10Code : ''} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val) {
                        const matched = COMMON_ICD10.find(item => item.code === val);
                        setFormData({...formData, icd10Code: matched.code, diagnosis: matched.diagnosis});
                      }
                    }}
                  >
                    <option value="">-- Chọn danh mục bệnh thông dụng --</option>
                    {COMMON_ICD10.map(item => (
                      <option key={item.code} value={item.code}>{item.code} - {item.diagnosis}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mã ICD-10 chi tiết</label>
                  <input type="text" placeholder="VD: J20.9" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-gray-900 uppercase" value={formData.icd10Code} onChange={e => setFormData({...formData, icd10Code: e.target.value.toUpperCase()})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chẩn đoán khoa học <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="VD: Viêm phế quản cấp" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-gray-900" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Triệu chứng lâm sàng</label>
                <textarea placeholder="VD: Sốt cao, ho nhiều, đau họng..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none h-20 transition-all resize-none text-gray-700 font-medium" value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})}></textarea>
              </div>

              {/* KHU VỰC NHẬP LIỆU ĐẶC BIỆT: SINH HIỆU */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
                <h4 className="font-extrabold text-gray-800 mb-4 text-sm flex items-center gap-2">Sinh hiệu & Chỉ số (Tùy chọn)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Huyết áp (mmHg)</label>
                    <input type="text" placeholder="VD: 120/80" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-gray-900" value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nhịp tim (bpm)</label>
                    <input type="number" placeholder="VD: 80" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-gray-900" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nhiệt độ (°C)</label>
                    <input type="number" step="0.1" placeholder="VD: 37.0" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-gray-900" value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Cân nặng (kg)</label>
                    <input type="number" step="0.1" placeholder="VD: 60.5" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-gray-900" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* KHU VỰC CHỈ ĐỊNH XÉT NGHIỆM / DỊCH VỤ */}
              <div className="bg-purple-50/30 p-5 rounded-3xl border border-purple-100">
                <h4 className="font-extrabold text-purple-900 mb-3 flex items-center gap-2">Chỉ định Xét nghiệm / Cận lâm sàng</h4>
                
                {!editingId && (
                  <div className="relative mb-4">
                    <div className="flex items-center bg-white border border-purple-200 rounded-xl px-4 py-1 focus-within:ring-4 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all shadow-sm">
                      <Search className="text-purple-400" size={20} />
                      <input type="text" placeholder="Tìm kiếm dịch vụ xét nghiệm (Siêu âm, X-Quang, Máu...)" className="w-full bg-transparent border-none outline-none py-2 px-3 text-gray-900 font-medium" value={serviceSearch} onChange={e => {setServiceSearch(e.target.value); setShowServiceDropdown(true);}} onFocus={() => setShowServiceDropdown(true)} />
                    </div>
                    {showServiceDropdown && serviceSearch && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredServices.length > 0 ? filteredServices.map(s => (
                          <div key={s.id} onClick={() => addServiceToRecord(s)} className="cursor-pointer hover:bg-purple-50 p-3 border-b border-gray-50 flex justify-between items-center transition-colors">
                              <div><p className="font-bold text-gray-900">{s.name}</p></div>
                              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-lg">{s.price.toLocaleString('vi-VN')} đ</span>
                          </div>
                        )) : <div className="p-4 text-center text-sm text-gray-500 italic">Không tìm thấy dịch vụ</div>}
                      </div>
                    )}
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="space-y-2">
                    {selectedServices.map((item, idx) => (
                      <div key={item.id} className="flex gap-3 bg-white p-3 rounded-2xl border border-purple-100 shadow-sm items-center relative pr-10">
                        <div className="flex-1 font-bold text-gray-900">{idx+1}. {item.name}</div>
                        <div className="text-sm font-bold text-purple-600">{item.price.toLocaleString('vi-VN')} đ</div>
                        {!editingId && <button type="button" onClick={() => removeSelectedService(item.id)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-1"><X size={18}/></button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* KHU VỰC KÊ ĐƠN THUỐC ĐỘNG */}
              <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100">
                <h4 className="font-extrabold text-blue-900 mb-3 flex items-center gap-2">Phân phối Thuốc tự động</h4>
                
                {!editingId && (
                  <div className="relative mb-4">
                    {currentUser?.role === 'DOCTOR' && currentUser?.specialty && (
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 mb-2 px-1">
                        <span className="text-xs font-bold text-blue-800">
                          Khoa/Chuyên khoa của bạn: <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-extrabold">{currentUser.specialty}</span>
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={showAllDrugs} 
                            onChange={e => setShowAllDrugs(e.target.checked)} 
                          />
                          Hiện tất cả thuốc
                        </label>
                      </div>
                    )}
                    <div className="flex items-center bg-white border border-blue-200 rounded-xl px-4 py-1 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
                      <Search className="text-blue-400" size={20} />
                      <input 
                        type="text" 
                        placeholder={currentUser?.specialty ? `Tìm thuốc khoa ${currentUser.specialty}...` : "Tìm kiếm kho thuốc để kê đơn..."} 
                        className="w-full bg-transparent border-none outline-none py-2 px-3 text-gray-900 font-medium" 
                        value={drugSearch} 
                        onChange={e => {setDrugSearch(e.target.value); setShowDrugDropdown(true);}} 
                        onFocus={() => setShowDrugDropdown(true)} 
                        onBlur={() => setTimeout(() => setShowDrugDropdown(false), 250)}
                      />
                    </div>
                    {showDrugDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredDrugs.length > 0 ? filteredDrugs.map(d => (
                          <div key={d.id} onMouseDown={() => addDrugToPrescription(d)} className="cursor-pointer hover:bg-blue-50 p-3 border-b border-gray-50 flex justify-between items-center transition-colors">
                              <div>
                                <p className="font-bold text-gray-900">
                                  {d.name} 
                                  {d.specialty && <span className="ml-2 text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">{d.specialty}</span>}
                                </p>
                                <p className="text-xs text-gray-500">{d.ingredient}</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${d.inStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>Tồn: {d.inStock}</span>
                          </div>
                        )) : <div className="p-4 text-center text-sm text-gray-500 italic">Không tìm thấy thuốc khớp</div>}
                      </div>
                    )}
                  </div>
                )}

                {selectedDrugs.length > 0 && (
                  <div className="space-y-3">
                    {selectedDrugs.map((item, idx) => (
                      <div key={item.drugId} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-blue-100 shadow-sm items-center relative pr-10">
                        <div className="flex-1 font-bold text-gray-900">{idx+1}. {item.name}</div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-gray-400">SL:</label>
                          <input type="number" min="1" disabled={!!editingId} className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 focus:border-blue-500 outline-none font-black text-center text-blue-600 disabled:opacity-50" value={item.quantity} onChange={e => updateSelectedDrug(item.drugId, 'quantity', e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <input type="text" disabled={!!editingId} placeholder="Liều lượng (Sáng 1 - Tối 1)" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 focus:border-blue-500 outline-none text-sm font-medium disabled:opacity-50" value={item.instructions} onChange={e => updateSelectedDrug(item.drugId, 'instructions', e.target.value)} />
                        </div>
                        {!editingId && <button type="button" onClick={() => removeSelectedDrug(item.drugId)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-1"><X size={18}/></button>}
                      </div>
                    ))}
                    {editingId && <p className="text-xs text-orange-500 italic mt-2">Lưu ý: Không thể sửa đổi danh sách thuốc sau khi đã kê đơn (Chỉ có thể sửa chẩn đoán/ghi chú).</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú thêm & Lời dặn Bác sĩ</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none h-20 transition-all resize-none text-gray-700 font-medium" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>

              {/* KHU VỰC EMR: CHỮ KÝ SỐ VÀ ĐÍNH KÈM TỆP TIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Đính kèm hình ảnh/DICOM */}
                <div className="bg-emerald-50/20 p-5 rounded-3xl border border-emerald-100/70">
                  <h4 className="font-extrabold text-emerald-950 mb-3 flex items-center gap-2">Tệp đính kèm (X-quang / Siêu âm / DICOM)</h4>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 hover:border-emerald-500 rounded-2xl p-4 bg-white cursor-pointer transition-all hover:bg-emerald-50/30">
                    <span className="text-sm font-bold text-emerald-700">Chọn hoặc Kéo thả tệp tin vào đây</span>
                    <span className="text-[10px] text-gray-400 mt-1">Chấp nhận định dạng: PNG, JPG, JPEG, DCM (DICOM)</span>
                    <input type="file" multiple accept=".png,.jpg,.jpeg,.dcm" onChange={handleFileUpload} className="hidden" />
                  </label>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-emerald-100 p-2 rounded-xl text-xs font-bold text-gray-700 shadow-sm">
                          <span className="truncate max-w-[80%]">{file.name}</span>
                          <button type="button" onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded-lg">Xóa</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bảng ký điện tử */}
                <div className="bg-blue-50/20 p-5 rounded-3xl border border-blue-100/70">
                  <h4 className="font-extrabold text-blue-950 mb-3 flex items-center gap-2">Chữ ký điện tử Bác sĩ xác nhận</h4>
                  
                  <div className="relative bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-inner">
                    <canvas 
                      ref={canvasRef}
                      width={400}
                      height={120}
                      className="w-full h-[120px] block cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    
                    {doctorSignature ? (
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Đã vẽ chữ ký</span>
                        <button type="button" onClick={clearSignature} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold transition-all">Xóa ký</button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-gray-400 font-bold italic">Dùng chuột hoặc ngón tay để ký vào đây</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-xl hover:bg-gray-100 font-bold text-gray-600 transition-colors">Hủy</button>
                <button type="submit" className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black shadow-lg shadow-gray-900/20 transition-all transform hover:-translate-y-0.5">Xác nhận Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
               <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                     <FileText className="text-teal-600" /> Chi tiết Bệnh án #{selectedRecord.id}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">Bệnh nhân: <span className="font-bold text-gray-900">{selectedRecord.patient?.fullName}</span> • Bác sĩ: <span className="font-bold text-gray-900">{selectedRecord.doctor?.name || '---'}</span> • Ngày khám: {new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}</p>
               </div>
               <button onClick={() => {setShowDetailModal(false); setSelectedRecord(null);}} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full shadow-sm transition-colors border border-gray-100"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Symptoms, Vitals, Diagnosis */}
                  <div className="space-y-6">
                     <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">Triệu chứng lâm sàng</p>
                        <p className="text-gray-900 font-medium whitespace-pre-wrap">{selectedRecord.symptoms || 'Không có ghi nhận'}</p>
                     </div>

                     <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">Chỉ số sinh tồn</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                           <div className="bg-red-50 p-3 rounded-xl text-center border border-red-100"><p className="text-[10px] font-bold text-red-400 uppercase">Huyết áp</p><p className="font-bold text-red-700">{selectedRecord.bloodPressure || '---'} <span className="text-xs font-normal">mmHg</span></p></div>
                           <div className="bg-pink-50 p-3 rounded-xl text-center border border-pink-100"><p className="text-[10px] font-bold text-pink-400 uppercase">Nhịp tim</p><p className="font-bold text-pink-700">{selectedRecord.heartRate || '---'} <span className="text-xs font-normal">bpm</span></p></div>
                           <div className="bg-orange-50 p-3 rounded-xl text-center border border-orange-100"><p className="text-[10px] font-bold text-orange-400 uppercase">Nhiệt độ</p><p className="font-bold text-orange-700">{selectedRecord.temperature || '---'} <span className="text-xs font-normal">°C</span></p></div>
                           <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100"><p className="text-[10px] font-bold text-blue-400 uppercase">Cân nặng</p><p className="font-bold text-blue-700">{selectedRecord.weight || '---'} <span className="text-xs font-normal">kg</span></p></div>
                        </div>
                     </div>

                     <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">Chẩn đoán</p>
                        <p className="text-gray-900 font-bold">{selectedRecord.icd10Code && <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md mr-2 text-sm">{selectedRecord.icd10Code}</span>}{selectedRecord.diagnosis}</p>
                     </div>
                  </div>

                  {/* Right Column: Lab tests, Prescription, Notes */}
                  <div className="space-y-6">
                     <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">Chỉ định Xét nghiệm / Cận lâm sàng</p>
                        {selectedRecord.labTests && selectedRecord.labTests.length > 0 ? (
                           <div className="space-y-3">
                           {selectedRecord.labTests.map(test => (
                              <div key={test.id} className="bg-gray-50 p-3 rounded-xl flex items-start justify-between border border-gray-100">
                                 <div className="flex-1 mr-4">
                                 <p className="font-bold text-sm text-gray-900">{test.testName}</p>
                                 <p className="text-sm text-gray-600 mt-1">{test.result || <span className="italic text-gray-400">Chưa có kết quả</span>}</p>
                                 </div>
                                 <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${test.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                 {test.status === 'COMPLETED' ? 'ĐÃ CÓ KQ' : 'ĐANG CHỜ'}
                                 </span>
                              </div>
                           ))}
                           </div>
                        ) : <p className="text-gray-500 italic text-sm">Không có chỉ định cận lâm sàng.</p>}
                     </div>

                     <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">Toa thuốc Điện tử</p>
                        {selectedRecord.prescriptionItems && selectedRecord.prescriptionItems.length > 0 ? (
                           <div className="bg-primary-50/30 rounded-2xl border border-primary-50 overflow-hidden">
                              <table className="w-full text-left text-sm">
                              <thead className="bg-primary-50/50 text-primary-600"><tr><th className="p-3 font-bold">Thuốc</th><th className="p-3 font-bold text-center">SL</th><th className="p-3 font-bold">Dặn dò</th></tr></thead>
                              <tbody className="divide-y divide-primary-50/50">
                                 {selectedRecord.prescriptionItems.map(item => (
                                    <tr key={item.id}>
                                    <td className="p-3 font-bold text-gray-900">{item.drug?.name}</td>
                                    <td className="p-3 text-center font-black text-primary-600">{item.quantity}</td>
                                    <td className="p-3 text-gray-600 text-xs font-medium">{item.instructions || '---'}</td>
                                    </tr>
                                 ))}
                              </tbody>
                              </table>
                           </div>
                        ) : <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-50 text-orange-600 font-medium text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Không kê đơn thuốc.</div>}
                        
                        {selectedRecord.notes && (
                           <div className="mt-4 pt-3 border-t border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ghi chú thêm & Khuyên dặn</p>
                              <p className="text-gray-700 font-medium text-sm whitespace-pre-wrap">{selectedRecord.notes}</p>
                           </div>
                        )}
                     </div>

                     {/* Đính kèm bệnh án EMR */}
                     {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">Tệp phim/Ảnh đính kèm</p>
                           <div className="grid grid-cols-2 gap-2">
                              {selectedRecord.attachments.map(att => (
                                 <button 
                                    key={att.id} 
                                    onClick={() => {
                                       setPacsFile(att);
                                       setPacsZoom(1);
                                       setPacsRotation(0);
                                       setPacsBrightness(100);
                                       setPacsContrast(100);
                                       setMeasurements([]);
                                       setShowPACSViewer(true);
                                    }} 
                                    className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all text-left group"
                                 >
                                    <FileText className="text-emerald-600 shrink-0" size={16}/>
                                    <div className="truncate flex-1">
                                       <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">{att.name}</p>
                                       <p className="text-[10px] text-slate-400 uppercase">{att.name.endsWith('.dcm') ? 'DICOM' : 'Image'}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Chữ ký số xác nhận */}
                     {selectedRecord.doctorSignature && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-50 pb-2 w-full">Chữ ký điện tử Bác sĩ</p>
                           <div className="bg-blue-50/20 p-3 rounded-xl border border-blue-50 relative max-w-[200px] w-full">
                              <img src={selectedRecord.doctorSignature} alt="Doctor Signature" className="max-h-20 max-w-full mx-auto" />
                           </div>
                           <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                              <CheckCircle2 size={12}/> Đã ký điện tử bởi BS. {selectedRecord.doctor?.name}
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-white flex flex-wrap gap-3 items-center justify-between shrink-0">
               <div>
                  <span className={`text-sm font-bold px-3 py-2 rounded-xl ${
                    selectedRecord.prescriptionStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                    selectedRecord.prescriptionStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    Trạng thái: {selectedRecord.prescriptionStatus === 'APPROVED' ? 'Đã hoàn tất' : 
                     selectedRecord.prescriptionStatus === 'REJECTED' ? 'Đã từ chối/Trả lại' : 
                     'Đang chờ duyệt'}
                  </span>
               </div>
               
               <div className="flex gap-2">
                  <button onClick={() => exportPDF(selectedRecord)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"><Download size={18}/> Xuất PDF</button>
                  <button onClick={() => exportXML(selectedRecord)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"><Download size={18}/> Xuất XML (BHYT)</button>
                  
                  {['ADMIN', 'STAFF', 'DOCTOR', 'NURSE'].includes(userRole) && (
                     <>
                        <button onClick={() => {setShowDetailModal(false); handleEdit(selectedRecord);}} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"><Edit2 size={18}/> Sửa</button>
                        <button onClick={() => {setShowDetailModal(false); handleDelete(selectedRecord.id);}} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"><Trash2 size={18}/> Xóa</button>
                     </>
                  )}
                  
                  {selectedRecord.prescriptionStatus === 'PENDING' && (userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'PHARMACIST') && (
                     <>
                        <button onClick={() => {setShowDetailModal(false); handleReject(selectedRecord.id);}} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors"><X size={18}/> Từ chối</button>
                        <button onClick={() => {setShowDetailModal(false); handleApprove(selectedRecord.id);}} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-transform transform hover:-translate-y-0.5"><CheckSquare size={18}/> Duyệt (Hoàn tất)</button>
                     </>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
         <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><Clock className="text-purple-600"/> Lịch sử chỉnh sửa</h3>
                  <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-900"><X/></button>
               </div>
               <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {selectedHistory.length > 0 ? selectedHistory.map((h, i) => (
                     <div key={i} className="border-l-4 border-purple-200 pl-4 py-2">
                        <p className="text-sm font-bold text-gray-900 mb-1">{new Date(h.createdAt).toLocaleString('vi-VN')}</p>
                        <p className="text-xs text-gray-500 mb-2">Người sửa ID: {h.changedById}</p>
                        <div className="bg-gray-50 p-3 rounded-xl text-sm space-y-1">
                           <p><span className="font-bold text-gray-600">Chẩn đoán cũ:</span> {h.previousDiagnosis || 'Không có'}</p>
                           <p><span className="font-bold text-gray-600">Ghi chú cũ:</span> {h.previousNotes || 'Không có'}</p>
                        </div>
                     </div>
                  )) : <p className="text-gray-500 italic text-center py-4">Chưa có lịch sử chỉnh sửa nào.</p>}
               </div>
            </div>
         </div>
      )}

      {/* Warning Interaction Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Cảnh báo Tương tác Thuốc!</h3>
            <div className="text-left bg-red-50 text-red-800 p-4 rounded-2xl mb-6 text-sm font-medium space-y-2">
              {interactionWarnings.map((warn, idx) => <p key={idx}>• {warn}</p>)}
            </div>
            <p className="text-sm text-gray-500 mb-6 font-medium">Bạn có chắc chắn muốn bỏ qua cảnh báo và tiếp tục kê đơn này?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowWarningModal(false)} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors">Sửa đơn thuốc</button>
              <button onClick={() => handleSubmit(null, true)} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all">Bỏ qua & Lưu</button>
            </div>
          </div>
        </div>
      )}
      {/* PACS Workstation Viewer Modal */}
      {showPACSViewer && pacsFile && (
         <div className="fixed inset-0 bg-[#080a0d] z-[70] flex flex-col font-sans select-none">
            {/* PACS Header */}
            <div className="bg-[#11161d] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center text-white shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                     <h3 className="text-sm font-bold text-gray-200">PACS Workstation Viewer v1.0</h3>
                     <p className="text-xs text-gray-400">Tệp tin: {pacsFile.name} • {pacsFile.name.endsWith('.dcm') ? 'Chuẩn DICOM y tế' : 'Hình ảnh X-Quang/Siêu âm'}</p>
                  </div>
               </div>
               
               <div className="flex gap-2">
                  <button 
                     onClick={() => setActivePacsTool(activePacsTool === 'ruler' ? 'none' : 'ruler')} 
                     className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        activePacsTool === 'ruler' ? 'bg-blue-600 text-white' : 'bg-[#1e293b] hover:bg-[#334155] text-gray-300'
                     }`}
                  >
                     📏 Thước đo (Ruler)
                  </button>
                  <button 
                     onClick={() => setMeasurements([])} 
                     className="px-4 py-2 text-xs font-bold bg-[#1e293b] hover:bg-[#334155] text-gray-300 rounded-lg transition-all"
                  >
                     Xóa đo đạc
                  </button>
                  <button 
                     onClick={() => {
                        setPacsZoom(1);
                        setPacsRotation(0);
                        setPacsBrightness(100);
                        setPacsContrast(100);
                     }}
                     className="px-4 py-2 text-xs font-bold bg-[#1e293b] hover:bg-[#334155] text-gray-300 rounded-lg transition-all"
                  >
                     Reset bộ lọc
                  </button>
                  <button 
                     onClick={() => {
                        setShowPACSViewer(false);
                        setPacsFile(null);
                     }} 
                     className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                  >
                     Đóng Viewer
                  </button>
               </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
               {/* Left Sidebar: DICOM Headers */}
               <div className="w-72 bg-[#11161d] border-r border-[#1e293b] p-4 text-xs font-mono text-gray-400 space-y-4 overflow-y-auto shrink-0">
                  <h4 className="text-gray-200 font-extrabold uppercase border-b border-[#1e293b] pb-2 text-[10px] tracking-wider">DICOM Meta-Headers</h4>
                  
                  <div className="space-y-3">
                     <div>
                        <p className="text-gray-500">Patient ID</p>
                        <p className="text-blue-400 font-bold">EMR-{selectedRecord?.patientId || '101'}</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Patient Name</p>
                        <p className="text-gray-200 font-bold">{selectedRecord?.patient?.fullName || 'N/A'}</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Study Date/Time</p>
                        <p className="text-gray-200">{selectedRecord?.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '---'}</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Modality</p>
                        <p className="text-emerald-400 font-extrabold">{pacsFile.name.endsWith('.dcm') ? 'CR (Computed Radiography)' : 'US (Ultrasound)'}</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Institution</p>
                        <p className="text-gray-300">MedPro Clinic Station</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Manufacturer</p>
                        <p className="text-gray-300">Siemens Healthcare</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Window Center / Width</p>
                        <p className="text-yellow-500">WC: 40 / WW: 400</p>
                     </div>
                     <div>
                        <p className="text-gray-500">Pixel Spacing</p>
                        <p className="text-gray-300">0.25mm \ 0.25mm</p>
                     </div>
                  </div>

                  <h4 className="text-gray-200 font-extrabold uppercase border-b border-[#1e293b] pt-4 pb-2 text-[10px] tracking-wider">Image Adjustments</h4>
                  <div className="space-y-4 pt-1">
                     <div>
                        <div className="flex justify-between mb-1"><span>Zoom</span><span>{Math.round(pacsZoom * 100)}%</span></div>
                        <input type="range" min="0.5" max="3" step="0.1" value={pacsZoom} onChange={e => setPacsZoom(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                     </div>
                     <div>
                        <div className="flex justify-between mb-1"><span>Xoay hình</span><span>{pacsRotation}°</span></div>
                        <button onClick={() => setPacsRotation(prev => (prev + 90) % 360)} className="w-full bg-[#1e293b] hover:bg-[#334155] text-white py-1.5 rounded text-center">Xoay 90°</button>
                     </div>
                     <div>
                        <div className="flex justify-between mb-1"><span>Độ sáng (Brightness)</span><span>{pacsBrightness}%</span></div>
                        <input type="range" min="50" max="200" value={pacsBrightness} onChange={e => setPacsBrightness(parseInt(e.target.value))} className="w-full accent-blue-500" />
                     </div>
                     <div>
                        <div className="flex justify-between mb-1"><span>Độ tương phản (Contrast)</span><span>{pacsContrast}%</span></div>
                        <input type="range" min="50" max="200" value={pacsContrast} onChange={e => setPacsContrast(parseInt(e.target.value))} className="w-full accent-blue-500" />
                     </div>
                  </div>
               </div>

               {/* Viewport Area */}
               <div className="flex-1 bg-[#090d12] flex items-center justify-center p-6 relative overflow-hidden">
                  <div 
                     className="relative max-w-full max-h-full cursor-crosshair overflow-hidden border border-[#1e293b]"
                     style={{
                        width: '600px',
                        height: '450px',
                        backgroundColor: '#000000',
                     }}
                     onMouseDown={handleViewportMouseDown}
                     onMouseMove={handleViewportMouseMove}
                     onMouseUp={handleViewportMouseUp}
                  >
                     {pacsFile.name.endsWith('.dcm') ? (
                        <canvas 
                           ref={(canvas) => {
                              if (canvas) {
                                 // Draw the simulated medical canvas image
                                 const ctx = canvas.getContext('2d');
                                 canvas.width = 600;
                                 canvas.height = 450;
                                 
                                 // Gradient background
                                 ctx.fillStyle = '#05070a';
                                 ctx.fillRect(0, 0, 600, 450);
                                 
                                 // Draw grids
                                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                                 ctx.lineWidth = 0.5;
                                 for (let x = 0; x < 600; x += 30) {
                                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 450); ctx.stroke();
                                 }
                                 for (let y = 0; y < 450; y += 30) {
                                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke();
                                 }

                                 // Draw chest cage mock x-ray
                                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                                 ctx.lineWidth = 2;
                                 
                                 // Spine
                                 ctx.beginPath();
                                 ctx.moveTo(300, 50);
                                 ctx.lineTo(300, 400);
                                 ctx.stroke();
                                 
                                 // Ribs (Left & Right curves)
                                 for (let i = 0; i < 8; i++) {
                                    const y = 100 + i * 35;
                                    const rx = 40 + i * 15;
                                    // Left Rib
                                    ctx.beginPath();
                                    ctx.arc(300 - rx, y, rx, Math.PI * 1.5, Math.PI * 2);
                                    ctx.stroke();
                                    // Right Rib
                                    ctx.beginPath();
                                    ctx.arc(300 + rx, y, rx, Math.PI, Math.PI * 1.5);
                                    ctx.stroke();
                                 }
                                 
                                 // Heart shadow
                                 ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                                 ctx.beginPath();
                                 ctx.arc(280, 240, 50, 0, Math.PI * 2);
                                 ctx.fill();

                                 // Lung fields (darker)
                                 ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                                 ctx.beginPath();
                                 ctx.ellipse(200, 220, 60, 130, 0, 0, Math.PI * 2);
                                 ctx.ellipse(400, 220, 60, 130, 0, 0, Math.PI * 2);
                                 ctx.fill();
                              }
                           }}
                           className="w-full h-full block"
                           style={{
                              transform: `scale(${pacsZoom}) rotate(${pacsRotation}deg)`,
                              filter: `brightness(${pacsBrightness}%) contrast(${pacsContrast}%)`,
                              transition: 'transform 0.1s ease-out',
                           }}
                        />
                     ) : (
                        <img 
                           src={pacsFile.url} 
                           alt="PACS View" 
                           className="w-full h-full object-contain block pointer-events-none"
                           style={{
                              transform: `scale(${pacsZoom}) rotate(${pacsRotation}deg)`,
                              filter: `brightness(${pacsBrightness}%) contrast(${pacsContrast}%)`,
                              transition: 'transform 0.1s ease-out',
                           }}
                        />
                     )}

                     {/* SVG Measurement Overlay */}
                     <svg className="absolute inset-0 pointer-events-none w-full h-full">
                        {measurements.map((m, idx) => (
                           <g key={idx}>
                              <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#3b82f6" strokeWidth="2" strokeDasharray="3" />
                              <circle cx={m.x1} cy={m.y1} r="4" fill="#3b82f6" />
                              <circle cx={m.x2} cy={m.y2} r="4" fill="#3b82f6" />
                              <text x={(m.x1 + m.x2)/2 + 8} y={(m.y1 + m.y2)/2 - 8} fill="#3b82f6" className="text-[10px] font-bold">
                                 {m.length} mm
                              </text>
                           </g>
                        ))}
                        {currentLine && (
                           <g>
                              <line x1={currentLine.x1} y1={currentLine.y1} x2={currentLine.x2} y2={currentLine.y2} stroke="#22c55e" strokeWidth="2" strokeDasharray="3" />
                              <circle cx={currentLine.x1} cy={currentLine.y1} r="4" fill="#22c55e" />
                  <circle cx={currentLine.x2} cy={currentLine.y2} r="4" fill="#22c55e" />
                           </g>
                        )}
                     </svg>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* BẢN PDF ẨN GLOBAL */}
      {printingRecord && (
         <div id="receipt-print-global" className="fixed left-0 top-0 bg-white p-10 w-[700px] text-gray-900 border" style={{ fontFamily: 'sans-serif', zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
            <div className="text-center border-b-2 border-gray-200 pb-5 mb-5 flex justify-between items-center">
               <div className="text-left">
                  <h1 className="text-2xl font-black text-blue-800 tracking-tighter uppercase">PHÒNG KHÁM MEDPRO</h1>
                  <p className="text-gray-600 text-sm mt-1">123 Phố Y Tế, Đống Đa, Hà Nội</p>
               </div>
               <div className="text-right">
                  <h2 className="text-3xl font-black text-gray-900">ĐƠN THUỐC</h2>
                  <p className="text-gray-500 text-sm">Mã BA: #{printingRecord.id}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[15px] mb-6">
               <p>Họ tên Bệnh nhân: <strong className="uppercase">{printingRecord.patient?.fullName}</strong></p>
               <p className="text-right">Ngày khám: <strong>{new Date(printingRecord.createdAt).toLocaleDateString('vi-VN')}</strong></p>
               <p>Mã Bệnh nhân: {printingRecord.patientId}</p>
               <p className="text-right">Phòng: Khám Nội</p>
            </div>
            {(printingRecord.bloodPressure || printingRecord.heartRate || printingRecord.temperature || printingRecord.weight) && (
               <div className="grid grid-cols-4 gap-4 text-[14px] mb-6 pb-4 border-b border-gray-100">
                  <p>Huyết áp: <strong>{printingRecord.bloodPressure || '...'} mmHg</strong></p>
                  <p>Nhịp tim: <strong>{printingRecord.heartRate || '...'} bpm</strong></p>
                  <p>Nhiệt độ: <strong>{printingRecord.temperature || '...'} °C</strong></p>
                  <p>Cân nặng: <strong>{printingRecord.weight || '...'} kg</strong></p>
               </div>
            )}
            <div className="mb-6">
               {printingRecord.symptoms && <p className="mb-2">Triệu chứng lâm sàng: <span className="font-bold text-gray-900">{printingRecord.symptoms}</span></p>}
               <h3 className="font-bold underline mb-2 text-lg">Chẩn đoán bệnh:</h3>
               <p className="font-bold text-gray-900">{printingRecord.icd10Code && `[${printingRecord.icd10Code}] `}{printingRecord.diagnosis}</p>
            </div>
            <div className="min-h-[250px]">
               <h3 className="font-bold underline mb-3 text-lg">Chỉ định của bác sĩ:</h3>
               {printingRecord.prescriptionItems && printingRecord.prescriptionItems.length > 0 ? (
                  <table className="w-full text-left border-collapse border border-gray-300 text-[15px]">
                     <thead><tr className="bg-gray-100"><th className="border p-2">STT</th><th className="border p-2">Tên Thuốc</th><th className="border p-2 text-center">SL</th><th className="border p-2">Cách dùng</th></tr></thead>
                     <tbody>
                        {printingRecord.prescriptionItems.map((item, i) => (
                           <tr key={i}><td className="border p-2 text-center">{i+1}</td><td className="border p-2 font-bold">{item.drug?.name}</td><td className="border p-2 text-center font-bold">{item.quantity}</td><td className="border p-2">{item.instructions}</td></tr>
                        ))}
                     </tbody>
                  </table>
               ) : <p className="italic">Không kê thuốc.</p>}
            </div>
            <div className="flex justify-end mt-12 text-center">
               <div>
                  <p className="mb-1 text-gray-600 text-sm">Bác sĩ chuyên khoa</p>
                  {printingRecord.doctorSignature && (
                     <img src={printingRecord.doctorSignature} alt="Doctor Signature" className="max-h-16 max-w-full mx-auto my-2" />
                  )}
                  <p className="font-bold text-lg mt-4">{printingRecord.doctor?.name}</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
