import React from 'react';
import { Landmark } from '../types/game';
import { School } from '../types/school';
import { X, Sparkles, Compass } from 'lucide-react';
import { sounds } from '../sound/SoundManager';
import { LANDMARK_ASSET_URLS } from '../assets/landmarkSprites';

interface LandmarkInfoModalProps {
  landmark: Landmark | null;
  ownerSchool?: School;
  onClose: () => void;
  onJumpToLandmark: (x: number, y: number) => void;
}

export const LandmarkInfoModal: React.FC<LandmarkInfoModalProps> = ({
  landmark,
  ownerSchool,
  onClose,
  onJumpToLandmark,
}) => {
  if (!landmark) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#161B22] border-2 border-[#00FFA3] rounded-lg max-w-md w-full p-5 text-xs text-[#E6EDF3] shadow-[0_0_20px_rgba(0,255,163,0.2)] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#FADB14] animate-ping" />
            <h2 className="font-tactical font-bold text-base text-[#00FFA3]">
              {landmark.name}
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
        <div className="space-y-3">
          {/* 2.5D Isometric Asset Preview */}
          {LANDMARK_ASSET_URLS[landmark.landmarkId] && (
            <div className="w-full flex flex-col items-center justify-center p-3 bg-[#0D1117] rounded border border-[#30363D] shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-radial from-[rgba(0,255,163,0.08)] to-transparent pointer-events-none" />
              <img
                src={LANDMARK_ASSET_URLS[landmark.landmarkId]}
                alt={landmark.name}
                className="h-36 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] transform transition duration-300 group-hover:scale-105"
              />
              <span className="text-[9px] font-mono-data text-[#8B949E] mt-1 tracking-wider uppercase">
                2.5D ISOMETRIC ARCHITECTURE • COMFYUI FLUX
              </span>
            </div>
          )}

          {/* Lore Section */}
          <div className="bg-[#0D1117] p-3 rounded border border-[#21262D]">
            <span className="text-[10px] uppercase font-mono-data text-[#8B949E] block mb-1">Ý Nghĩa Sinh Viên</span>
            <p className="text-[#E6EDF3] leading-relaxed italic">
              "{landmark.lore}"
            </p>
          </div>

          {/* Buff Effect */}
          <div className="bg-[rgba(250,219,20,0.08)] p-3 rounded border border-[#FADB14]/40">
            <div className="flex items-center space-x-1.5 text-[#FADB14] font-tactical font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>BÙA LỢI CHIẾN LƯỢC TOÀN BẢN ĐỒ</span>
            </div>
            <p className="text-white font-mono-data text-[11px] leading-relaxed">
              {landmark.buffDescription}
            </p>
          </div>

          {/* Grid coordinates & Ownership status */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data">
            <div className="bg-[#0D1117] p-2 rounded border border-[#21262D]">
              <span className="text-[#8B949E] block text-[9px]">TỌA ĐỘ TRUNG TÂM</span>
              <span className="text-white font-bold">
                X: {landmark.x + landmark.width / 2}, Y: {landmark.y + landmark.height / 2}
              </span>
              <span className="text-[#8B949E] block text-[9px] mt-0.5">
                Kích thước: {landmark.width}x{landmark.height} ô
              </span>
            </div>

            <div className="bg-[#0D1117] p-2 rounded border border-[#21262D]">
              <span className="text-[#8B949E] block text-[9px]">PHE ĐANG KIỂM SOÁT</span>
              {ownerSchool ? (
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ownerSchool.color }} />
                  <strong style={{ color: ownerSchool.color }}>{ownerSchool.shortCode}</strong>
                  <span className="text-[10px] text-[#00FFA3]">
                    {landmark.isContiguousToSpawn ? '(ĐÃ KẾT NỐI)' : '(MẤT KẾT NỐI)'}
                  </span>
                </div>
              ) : (
                <span className="text-[#8B949E] font-bold">Vùng Đất Trung Lập</span>
              )}
            </div>
          </div>

          {/* Jump to landmark button */}
          <button
            onClick={() => {
              sounds.playClick();
              onJumpToLandmark(landmark.x + landmark.width / 2, landmark.y + landmark.height / 2);
              onClose();
            }}
            className="w-full py-2 bg-[#00FFA3]/15 hover:bg-[#00FFA3]/25 border border-[#00FFA3] text-[#00FFA3] hover:text-white font-tactical font-bold text-xs rounded flex items-center justify-center space-x-2 transition"
          >
            <Compass className="w-4 h-4" />
            <span>ĐIỀU HƯỚNG CAMERA ĐẾN ĐỊA DANH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
