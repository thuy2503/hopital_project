import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { CreditCard, CheckCircle2, QrCode, X, Search, Clock } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showPayment, setShowPayment] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/invoices`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setInvoices(res.data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInvoices() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/invoices`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!ignore) setInvoices(res.data);
      } catch(e) { console.error(e); }
    }
    loadInvoices();
    return () => { ignore = true; };
  }, []);

  const handlePaySuccess = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/invoices/${selectedInvoice.id}/pay`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setShowPayment(false);
      fetchInvoices();
    } catch(e) { console.error(e); alert("Lỗi hệ thống"); }
  };

  const filtered = invoices.filter(i => {
    const matchSearch = i.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getDrugsTotal = (inv) => {
    if (!inv.record || !inv.record.prescriptionItems) return 0;
    return inv.record.prescriptionItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
         <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {user.role === 'PATIENT' ? 'Viện phí của tôi' : 'Thu ngân Viện phí'}
            </h2>
            <p className="text-gray-500 font-medium">
              {user.role === 'PATIENT' ? 'Lịch sử thanh toán và hóa đơn khám bệnh' : 'Hỗ trợ đối soát và thanh toán qua VNPay/Momo'}
            </p>
         </div>
         
         <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <div className="flex bg-gray-100 p-1 rounded-2xl">
             <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
             <button onClick={() => setFilterStatus('UNPAID')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'UNPAID' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Chưa thanh toán</button>
             <button onClick={() => setFilterStatus('PAID')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'PAID' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Đã thanh toán</button>
           </div>
           
           {user.role !== 'PATIENT' && (
             <div className="flex items-center bg-gray-50 px-4 py-3 rounded-2xl w-full sm:w-auto border border-gray-100 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100">
               <Search className="text-gray-400 mr-2 shrink-0" size={20} />
               <input type="text" className="bg-transparent outline-none font-medium text-gray-700 w-full" placeholder="Tìm tên bệnh nhân..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
           )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(inv => (
          <div key={inv.id} className={`bg-white rounded-3xl p-6 shadow-sm border transition-all relative ${inv.status === 'PAID' ? 'border-gray-100 hover:border-emerald-100' : 'border-blue-50 shadow-blue-900/5 hover:shadow-lg'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {inv.status === 'PAID' ? <CheckCircle2 size={28}/> : <Clock size={28}/>}
                 </div>
                 <div>
                    <h3 className="font-extrabold text-gray-900 text-lg line-clamp-1">{inv.patient?.fullName || '---'}</h3>
                    <p className={`text-xs font-bold uppercase tracking-tighter mt-1 ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-orange-500'}`}>{inv.status}</p>
                 </div>
              </div>
            </div>
            
            <div className="my-5 space-y-3 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors" onClick={() => { setSelectedInvoice(inv); setShowDetails(true); }}>
               <p className="flex justify-between">Mã hóa đơn: <span className="font-bold text-gray-900">#INV-{inv.id}</span></p>
               <p className="flex justify-between">Thuộc Bệnh án số: <span className="font-bold text-gray-900">#{inv.recordId || '?'}</span></p>
               <p className="flex justify-between">Ngày lập: <span className="font-medium text-gray-900">{new Date(inv.createdAt).toLocaleString('vi-VN')}</span></p>
               {inv.patient?.healthInsurance && (
                 <p className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                   <span>BHYT áp dụng (Giảm 80%):</span>
                   <span>Có</span>
                 </p>
               )}
               <p className="text-blue-500 text-xs font-bold text-center mt-2 border border-blue-100 bg-blue-50/50 py-1.5 rounded-lg">Xem chi tiết</p>
               
               <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-lg font-black text-gray-900">
                 <span>Thực thu:</span>
                 <span className="text-emerald-600 text-2xl">{inv.totalAmount.toLocaleString('vi-VN')} ₫</span>
               </div>
            </div>

            {inv.status === 'UNPAID' ? (
              <button 
                onClick={() => { setSelectedInvoice(inv); setShowPayment(true); }} 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 transform hover:-translate-y-0.5"
              >
                 <QrCode size={18} /> Quét mã Thanh toán (VNPay)
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-sm font-bold text-emerald-600 bg-emerald-50/50 py-2.5 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16}/> {new Date(inv.paymentDate).toLocaleString('vi-VN')}
                </p>
                <button 
                  onClick={() => { setSelectedInvoice(inv); setShowDetails(true); }} 
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-colors"
                >
                   In hóa đơn
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-12 text-center text-gray-400 font-medium">Danh sách Hoá đơn rỗng</div>}
      </div>

      {showPayment && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-8 relative">
              <h3 className="font-black text-3xl tracking-tight">VNPay<span className="text-blue-200">QR</span></h3>
              <p className="opacity-90 font-medium tracking-wide mt-1 text-sm bg-blue-800/30 inline-block px-3 py-1 rounded-full">Test Environment</p>
              <button onClick={() => { setShowPayment(false); setSelectedInvoice(null); }} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <div className="inline-block p-4 bg-white border-2 border-dashed border-blue-200 rounded-3xl mx-auto shadow-sm">
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MockPayment" alt="QR" className="w-[200px] h-[200px] mx-auto rounded-xl pointer-events-none opacity-90" />
              </div>
              <div className="text-left bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                 <p className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Bệnh nhân:</span><strong className="text-gray-900">{selectedInvoice.patient?.fullName}</strong></p>
                 <p className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Mã GD:</span><strong className="text-gray-900 font-mono">VNP-{selectedInvoice.id}9382</strong></p>
                 <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center font-black">
                   <span className="text-gray-900">Thanh toán:</span><span className="text-blue-600 text-xl">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} đ</span>
                 </div>
              </div>
              
              <button onClick={handlePaySuccess} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2">
                 <CheckCircle2 size={22}/> Giả lập Chuyển tiền Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && selectedInvoice && (() => {
        const hasInsurance = !!(selectedInvoice.patient?.healthInsurance && selectedInvoice.patient.healthInsurance.trim() !== '');
        const rawTotal = hasInsurance ? Math.round(selectedInvoice.totalAmount / 0.2) : selectedInvoice.totalAmount;
        const insuranceAmount = hasInsurance ? Math.round(rawTotal * 0.8) : 0;
        const drugsTotal = getDrugsTotal(selectedInvoice);
        const servicesTotal = Math.max(0, rawTotal - 200000 - drugsTotal);
        return (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in duration-300">
              <button onClick={() => { setShowDetails(false); setSelectedInvoice(null); }} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors"><X size={20}/></button>
              
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Chi tiết Hóa đơn</h3>
              <p className="text-gray-500 font-medium mb-6 flex items-center justify-between">
                <span>Mã HĐ: <span className="font-bold text-gray-900">#INV-{selectedInvoice.id}</span></span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${selectedInvoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{selectedInvoice.status}</span>
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-700">Phí khám bệnh</div>
                  <div className="font-bold text-gray-900">200.000 ₫</div>
                </div>
                
                {selectedInvoice.record?.prescriptionItems?.length > 0 && (
                  <div className="py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-700 mb-2">Tiền thuốc</div>
                    <ul className="space-y-2 text-sm text-gray-600 pl-4">
                      {selectedInvoice.record.prescriptionItems.map(item => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.drug?.name} (x{item.quantity})</span>
                          <span>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-end mt-2 pt-2 text-sm font-bold text-gray-800">
                      Tổng tiền thuốc: {drugsTotal.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                )}

                {servicesTotal > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-700">Phí xét nghiệm & cận lâm sàng</div>
                    <div className="font-bold text-gray-900">{servicesTotal.toLocaleString('vi-VN')} ₫</div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Tổng chi phí ban đầu:</span>
                    <span className="font-bold text-gray-800">{rawTotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {hasInsurance && (
                    <>
                      <div className="flex justify-between items-center text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <span>Bảo hiểm y tế chi trả (80%):</span>
                        <span className="font-bold">- {insuranceAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="text-[10px] text-gray-400 text-right font-medium">Mã BHYT: {selectedInvoice.patient?.healthInsurance}</div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-xl pt-2">
                    <div className="font-black text-gray-900">THỰC THU (BỆNH NHÂN TRẢ)</div>
                    <div className="font-black text-blue-600 text-2xl">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedInvoice.status === 'UNPAID' ? (
                  <button onClick={() => { setShowDetails(false); setShowPayment(true); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2">
                     <QrCode size={18}/> Thanh toán ngay
                  </button>
                ) : (
                  <button onClick={() => window.print()} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gray-900/30 transition-all flex justify-center items-center gap-2">
                     In hóa đơn (PDF)
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
