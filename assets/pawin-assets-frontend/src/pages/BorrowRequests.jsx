// src/pages/BorrowRequests.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit3, Trash2, Info, ShoppingCart, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function BorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { setTitle } = useOutletContext();
  useEffect(() => { setTitle("รายการคำขอยืมอุปกรณ์"); }, [setTitle]);

  // State สำหรับ Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newQty, setNewQty] = useState(0);

  // 1. 🚀 ดึงข้อมูลจาก API ตัวใหม่ (สถานะ pending_approval)
  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return navigate('/');
      const userInfo = JSON.parse(storedUser);

      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      // 🛰️ ดึงข้อมูลรายการ "รออนุมัติเบิก" (ใช้ API เดียวกับที่ Admin ดู แต่เรากรองเฉพาะของตัวเองในอนาคตได้)
      // ในเบื้องต้นถ้าจะให้ User เห็นแค่ของตัวเอง ต้องไปเพิ่ม API ฝั่งหลังบ้าน
      // แต่ตอนนี้เราจะดึงรายการที่สถานะเป็น pending_approval มาโชว์ก่อนครับ
      const { data } = await axios.get('/api/borrow/pending-borrows', config);

      setRequests(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถโหลดข้อมูลคำขอได้");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // 2. Logic การกรองข้อมูลค้นหา
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRequests(requests);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = requests.filter(item =>
        item.electotronixPN?.toLowerCase().includes(query) ||
        item.userName?.toLowerCase().includes(query)
      );
      setFilteredRequests(filtered);
    }
  }, [searchQuery, requests]);

  // 3. ฟังก์ชันแก้ไขจำนวน (ปรับให้รองรับโครงสร้าง ID ใหม่)
  const handleSaveQty = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      // ส่งไปที่ API สำหรับ update (ถ้ายังไม่มีแนะนำให้ทำเพิ่ม หรือส่งคำขอใหม่)
      // ในที่นี้สมมติว่าใช้ ID จาก tbl_borrow
      await axios.put(`/api/borrow/${selectedItem.id}/update-qty`, { qty: newQty }, config);

      toast.success('อัปเดตจำนวนเรียบร้อย');
      fetchData(); // โหลดข้อมูลใหม่
      setShowUpdateModal(false);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  // 4. ฟังก์ชันยกเลิกคำขอ (ลบออกจาก tbl_borrow)
  const handleDelete = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      // ใช้ API rejectBorrow ที่เรามีอยู่แล้วเพื่อลบรายการ pending ออก
      await axios.put(`/api/borrow/${selectedItem.id}/reject-borrow`, {}, config);

      toast.success('ยกเลิกคำขอเรียบร้อยแล้ว');
      fetchData();
      setShowCancelModal(false);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการยกเลิก');
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 mb-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 items-center transition-colors">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาจากชื่ออุปกรณ์ หรือชื่อผู้ขอ..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold text-slate-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-100 dark:border-orange-500/20">
            <Clock size={16} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">รอนุมัติเบิกอุปกรณ์</span>
          </div>
        </div>

        {/* Table Section */}
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 dark:bg-black text-white text-[10px] uppercase tracking-[0.2em] font-black">
                <tr>
                  <th className="p-6">ข้อมูลคำขอ / ผู้ยืม</th>
                  <th className="p-6">P/N & ข้อมูลอุปกรณ์</th>
                  <th className="p-6 text-center">จำนวนที่ขอ</th>
                  <th className="p-6">สถานะ</th>
                  <th className="p-6 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-20 text-center font-bold text-slate-400">กำลังโหลดข้อมูล...</td></tr>
                ) : filteredRequests.length > 0 ? filteredRequests.map((item, index) => {
                  const delayClass = `animate-fade-in-up-${(index % 3) + 1}`;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${delayClass}`}>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-black text-sm uppercase">{item.userName}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                            {new Date(item.borrow_date).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-orange-600 dark:text-orange-400 font-black tracking-tight">{item.electotronixPN}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">ID: #{item.id}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex items-center px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white font-black text-base">
                          {item.quantity}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="flex items-center gap-1.5 text-orange-500 font-black text-[10px] uppercase tracking-wider bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full w-fit">
                          <Clock size={14} /> PENDING APPROVAL
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedItem(item); setNewQty(item.quantity); setShowUpdateModal(true); }} className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => { setSelectedItem(item); setShowCancelModal(true); }} className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <ShoppingCart size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm text-slate-500">ไม่พบรายการคำขอเบิกในขณะนี้</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <p className="p-10 text-center font-bold text-slate-400">กำลังโหลดข้อมูล...</p>
          ) : filteredRequests.length > 0 ? filteredRequests.map((item, index) => {
            const delayClass = `animate-fade-in-up-${(index % 3) + 1}`;
            return (
              <div key={item.id} className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 ${delayClass} overflow-hidden`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-orange-600 dark:text-orange-400 font-black tracking-tight text-sm uppercase truncate" title={item.electotronixPN}>{item.electotronixPN}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">{item.userName}</span>
                  </div>
                  <span className="px-2 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-500 font-black text-[8px] uppercase tracking-widest rounded-full border border-orange-100 shrink-0">Pending</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Quantity</span>
                    <span className="font-black text-slate-900 dark:text-white">{item.quantity}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Req Date</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{new Date(item.borrow_date).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setSelectedItem(item); setNewQty(item.quantity); setShowUpdateModal(true); }} className="flex-1 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-blue-100 flex items-center justify-center gap-2">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => { setSelectedItem(item); setShowCancelModal(true); }} className="flex-1 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-red-100 flex items-center justify-center gap-2">
                    <Trash2 size={14} /> Cancel
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="py-16 text-center opacity-30">
              <ShoppingCart size={40} className="mx-auto mb-3" />
              <p className="font-black uppercase tracking-widest text-[10px] text-slate-500">ไม่พบรายการคำขอเบิก</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal แก้ไขจำนวน */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">แก้ไขจำนวนเบิก</h3>
            <p className="text-slate-500 text-xs mb-6 font-bold uppercase tracking-widest">ITEM: {selectedItem?.electotronixPN}</p>
            <input
              type="number"
              className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-3xl mb-8 focus:border-orange-500 outline-none font-black text-3xl text-center text-slate-900 dark:text-white"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowUpdateModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">ยกเลิก</button>
              <button onClick={handleSaveQty} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/30 active:scale-95 transition-all">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการยกเลิก */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-red-600 mb-2 uppercase tracking-tight">ยกเลิกคำขอ</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอเบิกอุปกรณ์ชิ้นนี้? <br />
              <span className="font-black text-slate-900 dark:text-white text-base">[{selectedItem?.electotronixPN}]</span>
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">ปิด</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/30 active:scale-95 transition-all">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}