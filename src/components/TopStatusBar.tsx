import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Globe, Clock, Activity, RotateCcw, Scale, Tv } from 'lucide-react';
import { sounds } from '../sound/SoundManager';
import { GridEngine } from '../engine/GridEngine';

interface TopStatusBarProps {
  engine: GridEngine;
  onResetMap: () => void;
  onEqualize: () => void;
  showCrtScanlines: boolean;
  onToggleCrtScanlines: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  engine,
  onResetMap,
  onEqualize,
  showCrtScanlines,
  onToggleCrtScanlines,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fps, setFps] = useState(60);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [claimedPercentage, setClaimedPercentage] = useState('0.0');
  const [totalTroops, setTotalTroops] = useState(0);

  // Match timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // FPS calculation
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (currentTime: number) => {
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;

        // Periodic stats update
        let claimed = 0;
        let troops = 0;
        engine.schools.forEach(s => {
          claimed += s.totalOwnedTiles;
          troops += s.availableTroops;
        });
        const pct = ((claimed / 1000000) * 100).toFixed(2);
        setClaimedPercentage(pct);
        setTotalTroops(troops);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  return (
    <header className="h-10 bg-[#0D1117]/90 backdrop-blur-md border-b border-[#30363D] flex items-center justify-between px-4 text-xs select-none z-30 relative shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      {/* Left branding & match info */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse shadow-[0_0_10px_#00FFA3]" />
          <span className="font-tactical font-bold text-sm tracking-wider text-[#00FFA3] drop-shadow-[0_0_8px_rgba(0,255,163,0.3)]">
            ĐẠI CHIẾN LÀNG ĐẠI HỌC
          </span>
          <span className="text-[#8B949E] text-[10px] font-mono-data px-1.5 py-0.5 bg-[#161B22]/80 border border-[#30363D] rounded tactical-chamfer">
            C&C SCI-FI RTS • 1.000.000 TILES
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[#E6EDF3] font-mono-data bg-[#161B22]/80 px-2 py-0.5 rounded border border-[#21262D]">
          <Clock className="w-3.5 h-3.5 text-[#00FFA3]" />
          <span>Thời gian: <strong className="text-white">{formatTime(elapsedSeconds)}</strong></span>
        </div>

        <div className="flex items-center space-x-1.5 text-[#E6EDF3] font-mono-data bg-[#161B22]/80 px-2 py-0.5 rounded border border-[#21262D]">
          <Globe className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span>Đất đã mở: <strong className="text-[#00FFA3]">{claimedPercentage}%</strong> ({(Number(claimedPercentage) * 10000).toLocaleString()} ô)</span>
        </div>

        <div className="hidden lg:flex items-center space-x-1.5 text-[#E6EDF3] font-mono-data bg-[#161B22]/80 px-2 py-0.5 rounded border border-[#21262D]">
          <Shield className="w-3.5 h-3.5 text-[#FADB14]" />
          <span>Tổng quân dự trữ: <strong className="text-white">{totalTroops.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Right controls: CRT Toggle, FPS, Audio, Map actions */}
      <div className="flex items-center space-x-2.5">
        {/* CRT Scanline Toggle */}
        <button
          onClick={onToggleCrtScanlines}
          title={showCrtScanlines ? 'Tắt hiệu ứng CRT Scanlines retro' : 'Bật hiệu ứng CRT Scanlines cổ điển C&C'}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition font-mono-data text-[11px] ${
            showCrtScanlines
              ? 'bg-[#00FFA3]/15 text-[#00FFA3] border-[#00FFA3] shadow-[0_0_8px_rgba(0,255,163,0.3)]'
              : 'bg-[#161B22] text-[#8B949E] hover:text-white border-[#30363D]'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT {showCrtScanlines ? 'ON' : 'OFF'}</span>
        </button>

        <div className="flex items-center space-x-1.5 font-mono-data text-[11px] bg-[#161B22]/80 px-2 py-0.5 rounded border border-[#21262D]">
          <Activity className={`w-3.5 h-3.5 ${fps >= 55 ? 'text-[#00FFA3]' : fps >= 30 ? 'text-[#FADB14]' : 'text-[#FF4D4F]'}`} />
          <span>FPS: <strong className={fps >= 55 ? 'text-[#00FFA3]' : 'text-[#FADB14]'}>{fps}</strong></span>
        </div>

        <button
          onClick={onEqualize}
          title="Cân bằng quân số toàn bộ 10 trường (2.000 quân/trường)"
          className="flex items-center space-x-1 px-2 py-0.5 bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] rounded transition font-mono-data text-[11px]"
        >
          <Scale className="w-3 h-3 text-[#58A6FF]" />
          <span className="hidden sm:inline">Cân Bằng Quân</span>
        </button>

        <button
          onClick={onResetMap}
          title="Thiết lập lại toàn bộ chiến trường về điểm ban đầu"
          className="flex items-center space-x-1 px-2 py-0.5 bg-[#161B22] hover:bg-[#3D1A24] text-[#FF4D4F] border border-[#30363D] hover:border-[#FF4D4F] rounded transition font-mono-data text-[11px]"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset Map</span>
        </button>

        <button
          onClick={toggleAudio}
          title={isMuted ? 'Bật âm thanh quân sự' : 'Tắt âm thanh'}
          className={`p-1.5 rounded border transition ${
            isMuted
              ? 'bg-[#161B22] text-[#8B949E] border-[#30363D]'
              : 'bg-[#161B22] text-[#00FFA3] border-[#00FFA3] shadow-[0_0_6px_rgba(0,255,163,0.3)]'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
