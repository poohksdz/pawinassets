// 🚀 ดึง hook useRef เข้ามาด้วย
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PackagePlus, UploadCloud, X, ImageIcon, Save, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

// ... (translations object remains same, assuming it's above CreateBarcodeItem)

// Custom Combobox Component แบบสวยงาม (True Black / Orange Theme)
function CustomCombobox({ options, value, onChange, placeholder, name }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // ปิด dropdown เมื่อคลิกที่อื่น
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(value.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative flex items-center">
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={(e) => {
                        onChange(e);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    required={name === 'category'} // category บังคับกรอก
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 shadow-sm"
                    placeholder={placeholder}
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-orange-500 transition-colors"
                >
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            onChange({ target: { name, value: opt, type: 'text' } });
                                            setIsOpen(false);
                                        }}
                                        className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-500 hover:text-white rounded-lg cursor-pointer transition-colors"
                                    >
                                        {opt}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center italic">
                                    พิมพ์เพื่อสร้างหมวดหมู่ใหม่ "{value}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ... the rest of CreateBarcodeItem ...

const translations = {
    en: {
        pageTitle: "CREATE BARCODE ITEM",
        pageDesc: "Generate individual stock items with unique continuous barcodes",
        partNum: "Description Name *",
        category: "Category *",
        subcategory: "Subcategory",
        quantity: "Quantity *",
        price: "Value (฿)",
        description: "Description",
        manufacture: "Manufacture",
        position: "Position",
        footprint: "Footprint",
        isLongtermLabel: "Permanent / Long-term Asset",
        isLongtermDesc: "Does not require periodic return check-ins.",
        browseFile: "Browse Image",
        maxSize: "JPG, PNG (MAX 5MB)",
        deployBtn: "Generate Barcode & Save",
        cancel: "Cancel",
        successMsg: "Barcode Generated Successfully!"
    },
    th: {
        pageTitle: "สร้างรายการสินค้าบาร์โค้ด",
        pageDesc: "เพิ่มรายการสินค้าเข้าคลังพร้อมระบบสร้างบาร์โค้ดอัตโนมัติ (สามารถใช้ P/N ซ้ำได้)",
        partNum: "ชื่อรายการสินค้า *",
        category: "หมวดหมู่ *",
        subcategory: "หมวดหมู่ย่อย",
        quantity: "จำนวน *",
        price: "มูลค่า/ชิ้น (บาท)",
        description: "รายละเอียด",
        manufacture: "ผู้ผลิต",
        position: "ตำแหน่งอ้างอิง",
        footprint: "ฟุตพริ้นต์",
        isLongtermLabel: "อุปกรณ์ประจำตำแหน่ง (ระยะยาว)",
        isLongtermDesc: "อุปกรณ์ที่ใช้ระบบยืนยันสถานะแทนการคืนตามรอบ",
        browseFile: "เลือกไฟล์รูปภาพ",
        maxSize: "JPG, PNG (ขนาดไม่เกิน 5MB)",
        deployBtn: "บันทึกและสร้างบาร์โค้ด",
        cancel: "ยกเลิก",
        successMsg: "สร้างบาร์โค้ดสำเร็จ!"
    }
};

export default function CreateBarcodeItem() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
    const t = translations[lang];

    const { setTitle } = useOutletContext();
    useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

    // ค่าเริ่มต้นสำหรับฟอร์ม (Quantity บังคับเป็น 1 ก็ได้ หรือใส่ได้เผื่ออยากรับเข้าหลายชิ้น แต่ระบบตอนนี้สร้าง 1 บาร์โค้ดต่อ request ยกเว้นเราทำลูป ซึ่งตอนนี้ Backend ทำ 1 request : 1 barcode)
    const [formData, setFormData] = useState({
        electotronixPN: '',
        category: '',
        subcategory: '',
        quantity: 1,
        value: '',
        description: '',
        manufacture: '',
        position: '',
        footprint: '',
        is_longterm: false
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // 🚀 เก็บข้อมูลหมวดหมู่ที่ดึงมาจาก Database
    const [dbOptions, setDbOptions] = useState({ categories: [], subcategories: [] });

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
                const { data } = await axios.get('/api/assets/categories', config);
                setDbOptions(data);
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        const checkLang = setInterval(() => {
            const currentLang = localStorage.getItem('lang') || 'en';
            if (currentLang !== lang) setLang(currentLang);
        }, 300);
        return () => clearInterval(checkLang);
    }, [lang]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.electotronixPN || !formData.category || formData.quantity == null) {
            toast.error('กรุณากรอกข้อมูลที่มีดอกจัน (*) ให้ครบถ้วน');
            return;
        }

        try {
            setLoading(true);
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            let imageUrlPath = '';

            // 1. ถ่ายโอนรูปภาพ (ถ้ามี)
            if (imageFile) {
                const imgData = new FormData();
                imgData.append('image', imageFile);
                const { data } = await axios.post('/api/upload', imgData, {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
                imageUrlPath = data.image;
            }

            // 2. เรียก API บันทึกและรับ barcode กลับมา
            const payload = { ...formData, img: imageUrlPath };
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            const response = await axios.post('/api/assets/barcode', payload, config);
            const generatedBarcode = response.data.barcode;

            // 3. แจ้งเตือนความสำเร็จและแสดงบาร์โค้ด
            Swal.fire({
                title: t.successMsg,
                html: `
          <div class="flex flex-col items-center justify-center mt-4">
            <p class="text-sm text-slate-500 mb-2">Item Name: <strong>${formData.electotronixPN}</strong></p>
            <div class="bg-slate-100 border border-slate-300 rounded-xl px-6 py-4 mt-2">
              <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Generated ID (Electotronix PN)</p>
              <h2 class="text-3xl font-black text-orange-500 tracking-widest">${generatedBarcode}</h2>
            </div>
          </div>
        `,
                icon: 'success',
                confirmButtonColor: '#f97316',
                confirmButtonText: 'รับทราบ (OK)'
            }).then(() => {
                // Reset form for the next item
                setFormData(prev => ({
                    ...prev,
                    electotronixPN: '',
                    quantity: 1, // Reset to 1 explicitly
                    description: '',
                    is_longterm: false
                }));
                setImageFile(null);
                setImagePreview(null);
            });

        } catch (error) {
            toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden mt-6">
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-transparent border-b border-orange-200/50 dark:border-orange-500/20">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <PackagePlus className="text-orange-500" size={28} />
                            {t.pageTitle}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">{t.pageDesc}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                            {/* Image Upload Area */}
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.browseFile}</label>
                                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-orange-500 dark:hover:border-orange-500 transition-all group overflow-hidden bg-slate-50 dark:bg-slate-950/50" style={{ minHeight: '240px' }}>
                                    <input type="file" onChange={handleImageChange} accept="image/jpeg, image/png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {imagePreview ? (
                                        <div className="absolute inset-0 w-full h-full">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white font-bold text-xs uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center mb-3 shadow-sm border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform duration-300">
                                                <UploadCloud size={24} className="text-orange-500" />
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm font-bold">{t.browseFile}</p>
                                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{t.maxSize}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="md:col-span-8 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.partNum}</label>
                                        <input type="text" name="electotronixPN" value={formData.electotronixPN} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600" placeholder="e.g. RES-01-100K" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.category}</label>
                                        <CustomCombobox
                                            name="category"
                                            value={formData.category}
                                            options={dbOptions.categories}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Resistor"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.subcategory}</label>
                                        <CustomCombobox
                                            name="subcategory"
                                            value={formData.subcategory}
                                            options={dbOptions.subcategories}
                                            onChange={handleInputChange}
                                            placeholder="e.g. SMD 0603"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.quantity}</label>
                                            <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.price}</label>
                                            <input type="number" name="value" min="0" value={formData.value} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-orange-600 dark:text-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-widest">{t.description}</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-600" placeholder="Additional details..." />
                                </div>

                                {/* Additional optional fields hidden in a subtle way or just small grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">{t.manufacture}</label>
                                        <input type="text" name="manufacture" value={formData.manufacture} onChange={handleInputChange} className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 px-1 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">{t.position}</label>
                                        <input type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 px-1 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">{t.footprint}</label>
                                        <input type="text" name="footprint" value={formData.footprint} onChange={handleInputChange} className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 px-1 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors" />
                                    </div>
                                </div>

                                {/* Switch for Longterm */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between mt-4">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{t.isLongtermLabel}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t.isLongtermDesc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input type="checkbox" name="is_longterm" checked={formData.is_longterm} onChange={handleInputChange} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                                    </label>
                                </div>

                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => navigate('/admin/dashboard')} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                {t.cancel}
                            </button>
                            <button disabled={loading} type="submit" className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all flex items-center gap-2 ${loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/25 active:scale-95'}`}>
                                <Save size={16} />
                                {loading ? 'Processing...' : t.deployBtn}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    );
}
