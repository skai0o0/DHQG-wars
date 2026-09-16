import React from 'react';
import { GridEngine } from '../engine/GridEngine';
import { School } from '../types/school';
import { Landmark, ActionMode, TickerMessage } from '../types/game';
import { Minimap } from './Minimap';
import { ActiveSchoolCard } from './ActiveSchoolCard';
import { TechBuffsBar } from './TechBuffsBar';
import { EvaActionStrip } from './EvaActionStrip';
import { IngestionHub } from './IngestionHub';
import { BattleTicker } from './BattleTicker';
import { BotControls } from './BotControls';
import { Settings } from 'lucide-react';
import { sounds } from '../sound/SoundManager';

interface CommandSidebarProps {
  engine: GridEngine;
  schools: School[];
  activeSchool: School;
  landmarks: Landmark[];
  activeMode: ActionMode;
  cameraLeft: number;
  cameraTop: number;
  cameraRight: number;
  cameraBottom: number;
  messages: TickerMessage[];
  isAutoPlay: boolean;
  speed: number;
  onNavigateMinimap: (x: number, y: number) => void;
  onSelectSchool: (id: number) => void;
  onChangeMode: (mode: ActionMode) => void;
  onJumpToHQ: () => void;
  onSelectLandmark: (lm: Landmark) => void;
  onFocusLandmark: (lm: Landmark) => void;
  onInjectPoints: (schoolId: number, points: number) => void;
  onToggleAutoPlay: () => void;
  onChangeSpeed: (s: number) => void;
  onOpenAdmin: () => void;
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
  engine,
  schools,
  activeSchool,
  landmarks,
  activeMode,
  cameraLeft,
  cameraTop,
  cameraRight,
  cameraBottom,
  messages,
  isAutoPlay,
  speed,
  onNavigateMinimap,
  onSelectSchool,
  onChangeMode,
  onJumpToHQ,
  onSelectLandmark,
  onFocusLandmark,
  onInjectPoints,
  onToggleAutoPlay,
  onChangeSpeed,
  onOpenAdmin,
}) => {
  return (
    <aside className="w-[320px] h-full bg-[#0D1117]/90 backdrop-blur-md border-l border-[#30363D] flex flex-col z-20 select-none shadow-[0_0_30px_rgba(0,0,0,0.8)] relative">
      {/* Top Sidebar Tactical Header */}
      <div className="h-10 border-b border-[#30363D] px-3 flex items-center justify-between bg-[#161B22]/80 backdrop-blur">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-xs bg-[#00FFA3] animate-pulse shadow-[0_0_6px_#00FFA3]" />
          <span className="font-tactical font-bold text-xs tracking-wider text-[#00FFA3] drop-shadow-[0_0_6px_rgba(0,255,163,0.3)]">
            EVA COMMAND SIDEBAR
          </span>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenAdmin();
          }}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#21262D] border border-[#30363D] hover:border-[#58A6FF] text-[#8B949E] hover:text-[#58A6FF] font-mono-data text-[10px] transition"
          title="Mở bảng điều khiển Trọng Tài & Quản Trị"
        >
          <Settings className="w-3 h-3" />
          <span>Admin</span>
        </button>
      </div>

      {/* Pinned Radar Minimap Header (Always Visible at top of EVA Sidebar) */}
      <div className="p-2 border-b border-[#30363D] bg-[#090D13]/90 flex justify-center shrink-0">
        <Minimap
          engine={engine}
          cameraLeft={cameraLeft}
          cameraTop={cameraTop}
          cameraRight={cameraRight}
          cameraBottom={cameraBottom}
          onNavigate={onNavigateMinimap}
        />
      </div>

      {/* Scrollable Command Strip Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* B. Active School Card */}
        <ActiveSchoolCard
          school={activeSchool}
          schools={schools}
          onSelectSchool={onSelectSchool}
          onJumpToHQ={onJumpToHQ}
        />

        {/* C. Capturable Tech Buffs (10 Landmarks) */}
        <TechBuffsBar
          landmarks={landmarks}
          activeSchool={activeSchool}
          onSelectLandmark={onSelectLandmark}
          onFocusLandmark={onFocusLandmark}
        />

        {/* D. EVA Action Strip */}
        <EvaActionStrip
          activeMode={activeMode}
          onChangeMode={onChangeMode}
        />

        {/* E. External Ingestion Hub */}
        <IngestionHub
          schools={schools}
          selectedSchoolId={activeSchool.schoolId}
          onInjectPoints={onInjectPoints}
        />

        {/* F. Leaderboard & Live Battle Ticker */}
        <BattleTicker
          schools={schools}
          messages={messages}
        />

        {/* G. Bot & Simulation Controls */}
        <BotControls
          isAutoPlay={isAutoPlay}
          speed={speed}
          onToggleAutoPlay={onToggleAutoPlay}
          onChangeSpeed={onChangeSpeed}
        />
      </div>

      {/* Footer Branding Bar */}
      <div className="p-2 border-t border-[#30363D] bg-[#0D1117] text-[9px] font-mono-data text-[#8B949E] text-center">
        ĐHQG-HCM COMMAND SYSTEM • PROTOCOL 1000x1000
      </div>
    </aside>
  );
};
