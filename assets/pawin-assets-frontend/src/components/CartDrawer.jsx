// src/components/CartDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingCart, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

// 🌐 Dictionary สำหรับแปลภาษาเฉพาะ Cart Drawer
const translations = {
  en: {
    cartTitle: "Acquisition Cart",
    itemsCount: "items in queue",
    emptyCart: "Cart is empty",
    qty: "QTY",
    units: "Units",
    totalItems: "Total Units Requested",
    submitBtn: "Submit Request",
    processing: "Processing...",
    errLogin: "Please login before proceeding.",
    succSent: "Request submitted! Awaiting Admin approval.",
    errSent: "Failed to submit request."
  },
  th: {
    cartTitle: "ตะกร้ายืมอุปกรณ์",
    itemsCount: "รายการ",
    emptyCart: "ยังไม่มีอุปกรณ์ในตะกร้า",
    qty: "จำนวน",
    units: "ชิ้น",
    totalItems: "รวมจำนวนเบิกทั้งหมด",
    submitBtn: "ส่งคำขอเบิกอุปกรณ์",
    processing: "กำลังประมวลผล...",
    errLogin: "กรุณาล็อกอินก่อนทำรายการ",
    succSent: "ส่งคำขอสำเร็จ! รอการอนุมัติจาก Admin",
    errSent: "เกิดข้อผิดพลาดในการส่งคำขอ"
  }
};

export default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem, onCheckoutSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const totalItems = cartItems.reduce((sum, item) => sum + item.borrowQty, 0);

  // 🚀 ระบบแปลภาษา (ฟัง storage event แทน polling ทุก 300ms)
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];


  // 🚀 ฟังก์ชันช่วยโหลดรูปภาพแบบเดียวกับหน้าอื่นๆ
  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    const cleanPath = String(imgPath).trim().toLowerCase();
    const invalid = ['', 'null', '-', '/', 'undefined', 'no-image'];
    if (invalid.includes(cleanPath)) return null;

    if (imgPath.startsWith('http')) return imgPath;
    if (imgPath.startsWith('/')) return `${imgPath}`;
    return `/${imgPath}`;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) {
        toast.error(t.errLogin);
        setIsLoading(false);
        return;
      }

      const userInfo = JSON.parse(storedUser);
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      // ยิงข้อมูลไปที่ API หลังบ้าน
      const { data } = await axios.post('/api/borrow', { cartItems }, config);

      toast.success(data.message || t.succSent);

      // 🚀 เคลียร์ localStorage ของตะกร้าเมื่อสั่งเบิกสำเร็จ
      localStorage.removeItem('cartItems');

      if (onCheckoutSuccess) {
        onCheckoutSuccess();
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || t.errSent);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[250] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[300] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } border-l border-transparent dark:border-slate-800`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 dark:bg-orange-500 text-white dark:text-slate-950 rounded-xl shadow-md">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.cartTitle}</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{cartItems.length} {t.itemsCount}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-red-500 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-70">
              <ShoppingCart size={64} className="mb-4" />
              <p className="font-bold uppercase tracking-widest text-sm">{t.emptyCart}</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const validImg = getImageUrl(item.img);
              const hasImage = !!validImg && item.fileExists !== false;
              
              return (
                <div key={item.ID} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-4 group hover:border-orange-300 dark:hover:border-orange-500/50 transition-all">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0 p-1 border border-slate-200 dark:border-slate-800">
                    {hasImage ? (
                      <img src={validImg} alt={item.electotronixPN} className="w-full h-full object-contain drop-shadow-sm" onError={(e) => { e.target.style.display='none'; }}/>
                    ) : (
                      <ImageIcon size={20} className="text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-black text-sm text-slate-900 dark:text-white truncate group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{item.electotronixPN}</p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">{item.value}</p>
                    <div className="mt-2 inline-block w-fit px-2 py-1 bg-slate-100 dark:bg-orange-500/10 text-slate-600 dark:text-orange-400 border border-slate-200 dark:border-orange-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">
                      {t.qty}: {item.borrowQty} {t.units}
                    </div>
                  </div>

                  <button 
                    onClick={() => onRemoveItem(item.ID)}
                    disabled={isLoading}
                    className="self-center p-2 text-red-500 hover:text-white hover:bg-red-500 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] transition-colors">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">{t.totalItems}</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalItems} <span className="text-sm font-bold text-slate-500 dark:text-slate-500">{t.units}</span></span>
          </div>
          
          <button 
            disabled={cartItems.length === 0 || isLoading}
            onClick={handleCheckout}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all relative flex items-center justify-center gap-2 ${
              cartItems.length > 0 && !isLoading
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-orange-500 dark:text-slate-950 dark:hover:bg-orange-400 hover:-translate-y-1 active:translate-y-0 dark:shadow-orange-500/20' 
                : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t.processing}
              </>
            ) : (
              t.submitBtn
            )}
          </button>
        </div>
      </div>
    </>
  );
}