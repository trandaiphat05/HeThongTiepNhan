import React from 'react';
import { Landmark, Shield, Mail, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-5 h-5 text-gov-gold" />
              <span className="font-bold text-white uppercase text-base">
                Ủy Ban Nhân Dân Tỉnh Đồng Nai
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              Cổng tiếp nhận, xử lý và theo dõi tiến độ giải quyết phản ánh, kiến nghị của tổ chức, cá nhân trên địa bàn tỉnh Đồng Nai.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <Shield className="w-4 h-4 text-emerald-400" />
              Bảo mật SSL 256-bit theo Tiêu chuẩn An toàn Thông tin Cấp độ 3
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-3 pb-1 border-b border-slate-700">
              Thông Tin Liên Hệ & Trực Ban
            </h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gov-gold shrink-0 mt-0.5" />
                <span>Số 02 Nguyễn Ái Quốc, Phường Quang Vinh, TP. Biên Hòa, Tỉnh Đồng Nai</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gov-gold shrink-0" />
                <span>tiepnhandonthu@dongnai.gov.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gov-gold shrink-0" />
                <span>https://dongnai.gov.vn</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-3 pb-1 border-b border-slate-700">
              Đơn Vị Quản Trị & Vận Hành
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-2">
              Chủ quản: Văn phòng Ủy ban nhân dân tỉnh Đồng Nai
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              Kỹ thuật: Trung tâm Công nghệ Thông tin và Truyền thông tỉnh Đồng Nai
            </p>
            <div className="text-xs text-slate-400">
              Phiên bản: <strong className="text-slate-200">2.1.0-Release</strong>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Bản quyền thuộc Ủy ban nhân dân tỉnh Đồng Nai. Giữ toàn quyền.</span>
          <span>Hệ thống phục vụ 24/7 • Giải quyết đơn thư minh bạch, đúng thẩm quyền pháp luật.</span>
        </div>
      </div>
    </footer>
  );
}

