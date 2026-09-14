import React, { useState } from 'react';
import { School } from '../types/school';
import { Upload, Zap, RotateCcw, Scale, X, Award } from 'lucide-react';
import { sounds } from '../sound/SoundManager';

interface AdminHUDProps {
  schools: School[];
  selectedSchoolId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectSchool: (id: number) => void;
  onUploadLogo: (schoolId: number, base64Url: string) => void;
  onFastBoost10k: (schoolId: number) => void;
  onInstantEmblem: (schoolId: number) => void;
  onResetMap: () => void;
  onEqualizeTroops: () => void;
}

export const AdminHUD: React.FC<AdminHUDProps> = ({
  schools,
  selectedSchoolId,
  isOpen,
  onClose,
  onSelectSchool,
  onUploadLogo,
  onFastBoost10k,
  onInstantEmblem,
  onResetMap,
  onEqualizeTroops,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const currentSchool = schools.find(s => s.schoolId === selectedSchoolId) || schools[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadLogo(selectedSchoolId, reader.result);
        sounds.playEmblemUnlock();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#161B22] border-2 border-[#58A6FF] rounded-lg max-w-lg w-full p-5 text-xs text-[#E6EDF3] shadow-[0_0_25px_rgba(88,166,255,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#58A6FF] animate-ping" />
            <h2 className="font-tactical font-bold text-base text-[#58A6FF]">
              BẢNG ĐIỀU KHIỂN TRỌNG TÀI & QUẢN TRỊ (ADMIN HUD)
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 rounded bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Target School Select */}
          <div className="bg-[#0D1117] p-3 rounded border border-[#21262D]">
            <label className="text-[10px] uppercase font-mono-data text-[#8B949E] block mb-1.5">
              Chọn Trường Cần Quản Trị
            </label>
            <select
              value={selectedSchoolId}
              onChange={e => onSelectSchool(Number(e.target.value))}
              className="w-full bg-[#161B22] text-white border border-[#30363D] rounded px-3 py-1.5 font-mono-data text-xs focus:outline-none focus:border-[#58A6FF]"
            >
              {schools.map(s => (
                <option key={s.schoolId} value={s.schoolId}>
                  {s.shortCode} - {s.name} ({s.availableTroops.toLocaleString()} quân)
                </option>
              ))}
            </select>
          </div>

          {/* Logo Uploader */}
          <div className="bg-[#0D1117] p-3 rounded border border-[#21262D]">
            <label className="text-[10px] uppercase font-mono-data text-[#8B949E] block mb-1.5">
              Cập Nhật Huy Hiệu / Logo Mới (PNG hoặc SVG)
            </label>
            <div className="flex items-center space-x-3">
              <img
                src={currentSchool.logoUrl}
                alt="Current Emblem"
                className="w-10 h-10 rounded-full border border-[#30363D] bg-[#161B22] object-contain p-1"
              />
              <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 py-2 px-3 border border-dashed border-[#58A6FF] rounded bg-[#58A6FF]/10 hover:bg-[#58A6FF]/20 text-[#58A6FF] font-mono-data text-[11px] transition">
                <Upload className="w-4 h-4" />
                <span>{logoFile ? logoFile.name : 'Tải lên tệp ảnh logo trường...'}</span>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setLogoFile(e.target.files[0]);
                      handleFileUpload(e);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Quick Referee Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onFastBoost10k(selectedSchoolId);
              }}
              className="py-2.5 px-3 bg-[#00FFA3]/15 hover:bg-[#00FFA3]/25 border border-[#00FFA3] text-[#00FFA3] rounded font-tactical font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-[0_0_10px_rgba(0,255,163,0.15)]"
            >
              <Zap className="w-4 h-4" />
              <span>CẤP TỐC 10.000 QUÂN</span>
            </button>

            <button
              onClick={onEqualizeTroops}
              className="py-2.5 px-3 bg-[#58A6FF]/15 hover:bg-[#58A6FF]/25 border border-[#58A6FF] text-[#58A6FF] rounded font-tactical font-bold text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <Scale className="w-4 h-4" />
              <span>CÂN BẰNG QUÂN ĐỘI</span>
            </button>

            <button
              onClick={() => {
                onInstantEmblem(selectedSchoolId);
                onClose();
              }}
              className="col-span-2 py-2.5 px-3 bg-[#FADB14]/20 hover:bg-[#FADB14]/30 border border-[#FADB14] text-[#FADB14] rounded font-tactical font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-[0_0_12px_rgba(250,219,20,0.2)]"
            >
              <Award className="w-4 h-4" />
              <span>KÍCH HOẠT ĐẠI CỜ 50x50 TỨC THÌ (DEMO LOGO)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#21262D]">
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đặt lại toàn bộ bản đồ và trận đấu?')) {
                  onResetMap();
                  onClose();
                }
              }}
              className="w-full py-2 bg-[#FF4D4F]/15 hover:bg-[#FF4D4F]/25 border border-[#FF4D4F] text-[#FF4D4F] rounded font-tactical font-bold text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>KHỞI ĐỘNG LẠI TOÀN BỘ CHIẾN TRƯỜNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
