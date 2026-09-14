import React from 'react';
import { Landmark } from '../types/game';
import { School } from '../types/school';
import {
  Ship,
  Shield,
  BookOpen,
  ShoppingBag,
  Mountain,
  Heart,
  Home,
  GitMerge,
  Wind,
  Landmark as LandmarkIcon,
} from 'lucide-react';
import { sounds } from '../sound/SoundManager';

interface TechBuffsBarProps {
  landmarks: Landmark[];
  activeSchool: School;
  onSelectLandmark: (landmark: Landmark) => void;
  onFocusLandmark: (landmark: Landmark) => void;
}

export const TechBuffsBar: React.FC<TechBuffsBarProps> = ({
  landmarks,
  activeSchool,
  onSelectLandmark,
  onFocusLandmark,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ship': return <Ship className="w-4 h-4" />;
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'book-open': return <BookOpen className="w-4 h-4" />;
      case 'shopping-bag': return <ShoppingBag className="w-4 h-4" />;
      case 'mountain': return <Mountain className="w-4 h-4" />;
      case 'heart': return <Heart className="w-4 h-4" />;
      case 'home': return <Home className="w-4 h-4" />;
      case 'git-merge': return <GitMerge className="w-4 h-4" />;
      case 'wind': return <Wind className="w-4 h-4" />;
      case 'landmark': return <LandmarkIcon className="w-4 h-4" />;
      default: return <LandmarkIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
          <span className="w-2 h-2 rounded-sm bg-[#FADB14]" />
          <span>CÔNG TRÌNH BIỂU TƯỢNG (TECH BUFFS)</span>
        </span>
        <span className="text-[10px] font-mono-data text-[#8B949E]">
          Sở hữu: <strong className="text-[#00FFA3]">{landmarks.filter(l => l.currentOwner === activeSchool.schoolId).length}/10</strong>
        </span>
      </div>

      {/* 10 Landmark Icons Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {landmarks.map(lm => {
          const isOwnedByMe = lm.currentOwner === activeSchool.schoolId;
          const isOwnedByOther = lm.currentOwner > 0 && !isOwnedByMe;

          return (
            <div key={lm.landmarkId} className="relative group">
              <button
                onClick={() => {
                  sounds.playClick();
                  onFocusLandmark(lm);
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  onSelectLandmark(lm);
                }}
                className={`w-full aspect-square rounded flex flex-col items-center justify-center p-1 transition-all border ${
                  isOwnedByMe
                    ? 'bg-[rgba(0,255,163,0.15)] border-[#00FFA3] text-[#00FFA3] shadow-[0_0_8px_rgba(0,255,163,0.3)]'
                    : isOwnedByOther
                    ? 'bg-[#1F171A] border-[#FF4D4F]/50 text-[#FF4D4F] opacity-75'
                    : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D] hover:text-white opacity-50'
                }`}
                title={`${lm.name} - ${lm.buffDescription}`}
              >
                {getIcon(lm.iconName)}
                <span className="text-[8px] font-mono-data mt-0.5 truncate max-w-full">
                  {lm.shortName.slice(0, 5)}
                </span>
              </button>

              {/* Hover Tactical Lore Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] rounded shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 text-[10px]">
                <div className="font-tactical font-bold text-[#00FFA3] border-b border-[#21262D] pb-1 mb-1">
                  {lm.name}
                </div>
                <div className="text-[9px] text-[#8B949E] mb-1 italic">
                  {lm.lore}
                </div>
                <div className="text-[9px] font-mono-data text-[#FADB14]">
                  ⚡ {lm.buffDescription}
                </div>
                <div className="mt-1 pt-1 border-t border-[#21262D] flex justify-between text-[8px] text-[#8B949E]">
                  <span>Trạng thái:</span>
                  <strong className={isOwnedByMe ? 'text-[#00FFA3]' : isOwnedByOther ? 'text-[#FF4D4F]' : 'text-gray-400'}>
                    {isOwnedByMe ? 'ĐÃ LÀM CHỦ' : isOwnedByOther ? 'ĐỊCH ĐANG GIỮ' : 'TRUNG LẬP'}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
