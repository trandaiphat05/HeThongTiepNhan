import React, { useState } from 'react';
import { 
  ShieldAlert, BookOpen, Users, Database, CheckCircle2, 
  AlertTriangle, X 
} from 'lucide-react';
import ExceptionQueueTab from './components/ExceptionQueueTab';
import RAGManagementTab from './components/RAGManagementTab';
import AccountManagementTab from './components/AccountManagementTab';

/**
 * Màn hình Trung Tâm Quản Trị Hệ Thống (Root Admin)
 * Đóng vai trò Container điều hướng 3 phân hệ nghiệp vụ chính:
 * 1. Giám sát hệ thống & Hàng đợi điều phối
 * 2. Quản lý kho văn bản quy phạm pháp luật
 * 3. Quản lý tài khoản cán bộ & hòm thư công vụ
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('exceptions'); // 'exceptions' | 'rag' | 'accounts'
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const navTabs = [
    {
      id: 'exceptions',
      label: 'Giám Sát Hệ Thống & Hàng Đợi Điều Phối',
      subtext: 'Chỉ số KPI tiếp nhận, phân bổ Sở/Ngành & hồ sơ ngoại lệ',
      icon: ShieldAlert,
      badgeColor: 'text-rose-600',
    },
    {
      id: 'rag',
      label: 'Kho Văn Bản Quy Phạm Pháp Luật',
      subtext: 'Danh mục điều khoản & nạp văn bản quy định mới',
      icon: BookOpen,
      badgeColor: 'text-gov-blue',
    },
    {
      id: 'accounts',
      label: 'Tài Khoản & Phân Quyền Cán Bộ',
      subtext: 'Quản trị người dùng & kết nối hòm thư công vụ',
      icon: Users,
      badgeColor: 'text-gov-blue',
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 pb-8 space-y-4">
      
      {/* 1. Tiêu đề Phân hệ Quản trị (Liền mạch chuẩn hành chính, không khung viền thừa) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gov-blue">
              Ủy Ban Nhân Dân Tỉnh Đồng Nai
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Phân Hệ Quản Trị Hệ Thống</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Bảng Điều Hành & Giám Sát Tiếp Nhận Đơn Thư Toàn Tỉnh
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống: Sẵn sàng
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-200">
            <Database className="w-3.5 h-3.5 text-gov-blue" />
            CSDL: Trực tuyến
          </span>
        </div>
      </div>

      {/* 2. Toast thông báo */}
      {toast && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium shadow-xs ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Navigation 3 Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-xs">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2.5 transition-colors text-left flex-1 min-w-[200px] ${
                isActive
                  ? 'border-b-gov-blue text-gov-blue bg-blue-50/50'
                  : 'border-b-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? tab.badgeColor : 'text-slate-400'}`} />
              <div className="flex flex-col">
                <span>{tab.label}</span>
                <span className="text-[11px] font-normal text-slate-400">{tab.subtext}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content */}
      <div>
        {activeTab === 'exceptions' && <ExceptionQueueTab onToast={showToast} />}
        {activeTab === 'rag' && <RAGManagementTab onToast={showToast} />}
        {activeTab === 'accounts' && <AccountManagementTab onToast={showToast} />}
      </div>

    </div>
  );
}
