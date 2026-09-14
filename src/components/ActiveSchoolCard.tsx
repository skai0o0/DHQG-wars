import React from 'react';
import { School } from '../types/school';
import { Shield, MapPin, Award, ChevronDown } from 'lucide-react';
import { sounds } from '../sound/SoundManager';

interface ActiveSchoolCardProps {
  school: School;
  schools: School[];
  onSelectSchool: (schoolId: number) => void;
  onJumpToHQ: () => void;
}

export const ActiveSchoolCard: React.FC<ActiveSchoolCardProps> = ({
  school,
  schools,
  onSelectSchool,
  onJumpToHQ,
}) => {
  const percentage = ((school.totalOwnedTiles / 1000000) * 100).toFixed(2);

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded p-3 text-xs">
      {/* Header with School Selector Dropdown */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
          <span className="w-2 h-2 rounded-sm bg-[#00FFA3]" />
          <span>BỘ CHỈ HUY TÁC CHIẾN</span>
        </span>

        <div className="relative group">
          <select
            value={school.schoolId}
            onChange={e => {
              sounds.playClick();
              onSelectSchool(Number(e.target.value));
            }}
            className="appearance-none bg-[#0D1117] hover:bg-[#21262D] text-[#E6EDF3] border border-[#30363D] hover:border-[#00FFA3] rounded px-2 py-0.5 pr-6 font-mono-data text-[10px] cursor-pointer focus:outline-none transition"
          >
            {schools.map(s => (
              <option key={s.schoolId} value={s.schoolId} className="bg-[#0D1117] text-white">
                {s.shortCode} - {s.name.split(' - ')[0]}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-[#8B949E] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Main Info Box */}
      <div className="flex items-center space-x-3 bg-[#0D1117] p-2.5 rounded border border-[#21262D]">
        {/* Emblem Circle */}
        <div
          className="relative w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center p-1 border-2 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ borderColor: school.color, backgroundColor: `${school.color}22` }}
        >
          <img
            src={school.logoUrl}
            alt={school.name}
            className="w-full h-full object-contain rounded-full"
          />
          {school.hasEmblemUnlocked && (
            <div
              title="Đại cờ Mega-Emblem 50x50 đã kích hoạt!"
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00FFA3] text-[#0D1117] flex items-center justify-center font-bold text-[9px] shadow-[0_0_6px_#00FFA3]"
            >
              ★
            </div>
          )}
        </div>

        {/* Name & Key Metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-tactical font-bold text-sm text-white truncate" title={school.name}>
              {school.name}
            </h3>
          </div>
          <p className="text-[10px] text-[#8B949E] font-mono-data mb-1">
            Mã định danh: <strong className="text-[#00FFA3]">{school.shortCode}</strong>
          </p>

          {/* Territory Dominance Bar */}
          <div className="w-full bg-[#161B22] h-1.5 rounded-full overflow-hidden border border-[#30363D]/60 mb-1">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${Math.max(2, Math.min(100, Number(percentage) * 10))}%`,
                backgroundColor: school.color,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono-data text-[#8B949E]">
            <span>Thị phần: <strong className="text-white">{percentage}%</strong></span>
            <span>{school.totalOwnedTiles.toLocaleString()} ô</span>
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-[#0D1117] border border-[#21262D] rounded p-1.5 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#00FFA3]" />
          <div>
            <div className="text-[9px] text-[#8B949E] uppercase tracking-wider font-mono-data">Quân Dự Trữ</div>
            <div className="text-sm font-bold font-mono-data text-[#00FFA3]">
              {school.availableTroops.toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={onJumpToHQ}
          className="bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] hover:border-[#00FFA3] rounded p-1.5 flex items-center space-x-2 text-left transition group"
          title={`Nhảy camera về Spawn Point (${school.spawnPoint.x}, ${school.spawnPoint.y})`}
        >
          <MapPin className="w-4 h-4 text-[#58A6FF] group-hover:scale-110 transition-transform" />
          <div className="min-w-0">
            <div className="text-[9px] text-[#8B949E] uppercase tracking-wider font-mono-data">Căn Cứ HQ</div>
            <div className="text-xs font-mono-data text-[#58A6FF] truncate">
              {school.spawnPoint.x}, {school.spawnPoint.y}
            </div>
          </div>
        </button>
      </div>

      {/* Strategic Role Indicator Banner */}
      <div className={`mt-2 px-2 py-1 rounded border flex items-center justify-between text-[10px] font-mono-data ${
        school.personality?.strategicRole === 'landmark_hunter'
          ? 'bg-[rgba(250,219,20,0.1)] border-[#FADB14]/50 text-[#FADB14]'
          : 'bg-[rgba(88,166,255,0.1)] border-[#58A6FF]/50 text-[#58A6FF]'
      }`}>
        <span className="font-bold flex items-center space-x-1">
          <span>{school.personality?.strategicRole === 'landmark_hunter' ? '🎯 SĂN CÔNG TRÌNH' : '🚩 BÀNH TRƯỚNG 50x50'}</span>
        </span>
        <span className="text-[9px] opacity-80">
          {school.personality?.strategicRole === 'landmark_hunter' ? '85% Chiếm Cứ Điểm' : '85% Khai Hoang Đại Cờ'}
        </span>
      </div>

      {/* Emblem Status Banner */}
      <div className={`mt-2 px-2 py-1 rounded border flex items-center justify-between text-[10px] font-mono-data ${
        school.hasEmblemUnlocked
          ? 'bg-[rgba(0,255,163,0.1)] border-[#00FFA3] text-[#00FFA3]'
          : 'bg-[#0D1117] border-[#21262D] text-[#8B949E]'
      }`}>
        <span className="flex items-center space-x-1">
          <Award className="w-3.5 h-3.5" />
          <span>Mega-Emblem 50x50:</span>
        </span>
        <strong className={school.hasEmblemUnlocked ? 'text-[#00FFA3]' : 'text-[#8B949E]'}>
          {school.hasEmblemUnlocked ? 'ĐÃ KÍCH HOẠT' : 'CHƯA MỞ KHÓA'}
        </strong>
      </div>
    </div>
  );
};
