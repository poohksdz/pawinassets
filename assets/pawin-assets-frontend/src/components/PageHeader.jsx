// src/components/PageHeader.jsx
import React from 'react';

export default function PageHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-pawin-orange mb-8 flex items-center gap-5">
      {/* แก้ไขส่วนไอคอนให้ดูสะอาดขึ้น */}
      {Icon && (
        <div className="hidden sm:flex bg-pawin-darkblue/5 text-pawin-darkblue p-4 rounded-2xl">
          <Icon size={32} strokeWidth={2.5} />
        </div>
      )}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-pawin-darkblue tracking-tight">
          {title}
        </h2>
        <p className="text-pawin-purple font-medium opacity-70">
          {subtitle}
        </p>
      </div>
    </div>
  );
}