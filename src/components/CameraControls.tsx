import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, MapPin, Grid, Hash } from 'lucide-react';
import { sounds } from '../sound/SoundManager';
import { School } from '../types/school';
import { GridEngine } from '../engine/GridEngine';

interface CameraControlsProps {
  zoom: number;
  showGrid: boolean;
  showTroops: boolean;
  activeSchool: School;
  engine: GridEngine;
  hoveredTile: { x: number; y: number } | null;
  onZoomChange: (newZoom: number) => void;
  onJumpToHQ: () => void;
  onFitAll: () => void;
  onToggleGrid: () => void;
  onToggleTroops: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  zoom,
  showGrid,
  showTroops,
  activeSchool,
  engine,
  hoveredTile,
  onZoomChange,
  onJumpToHQ,
  onFitAll,
  onToggleGrid,
  onToggleTroops,
}) => {
  const hoveredOwner = hoveredTile ? engine.getOwner(hoveredTile.x, hoveredTile.y) : 0;
  const hoveredTroops = hoveredTile ? engine.getTroops(hoveredTile.x, hoveredTile.y) : 0;
  const hoveredLandmarkId = hoveredTile ? engine.getLandmarkId(hoveredTile.x, hoveredTile.y) : 0;
  const hoveredLandmark = hoveredLandmarkId > 0 ? engine.landmarks.find(l => l.landmarkId === hoveredLandmarkId) : null;
  const ownerSchool = hoveredOwner > 0 ? engine.schools.get(hoveredOwner) : null;

  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-col space-y-2 pointer-events-none select-none">
      {/* Tile Inspector Card (Floating above controls when tile is hovered) */}
      {hoveredTile && (
        <div className="pointer-events-auto bg-[#0D1117]/90 backdrop-blur border border-[#30363D] rounded px-3 py-2 text-xs font-mono-data text-[#E6EDF3] shadow-2xl min-w-[240px]">
          <div className="flex items-center justify-between border-b border-[#21262D] pb-1 mb-1">
            <span className="text-[#00FFA3] font-bold">TỌA ĐỘ [{hoveredTile.x}, {hoveredTile.y}]</span>
            {hoveredLandmark && (
              <span className="text-[#FADB14] text-[10px] font-tactical">★ {hoveredLandmark.shortName}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-3 text-[11px]">
            <div>
              <span className="text-[#8B949E]">Chủ quyền: </span>
              <strong style={{ color: ownerSchool ? ownerSchool.color : '#8B949E' }}>
                {ownerSchool ? ownerSchool.shortCode : 'Đất hoang'}
              </strong>
            </div>
            <div>
              <span className="text-[#8B949E]">Đồn trú: </span>
              <strong className="text-white">{hoveredTroops} lính</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Camera Action Bar */}
      <div className="pointer-events-auto bg-[#0D1117]/90 backdrop-blur border border-[#30363D] rounded-lg p-2 shadow-2xl flex items-center space-x-3 text-xs">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onZoomChange(Math.max(0.05, zoom - 0.15))}
            className="p-1 rounded bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition"
            title="Thu nhỏ camera"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="0.05"
            max="3.0"
            step="0.05"
            value={zoom}
            onChange={e => onZoomChange(Number(e.target.value))}
            className="w-20 accent-[#00FFA3] cursor-pointer"
            title="Điều chỉnh độ phóng đại"
          />

          <button
            onClick={() => onZoomChange(Math.min(5.0, zoom + 0.15))}
            className="p-1 rounded bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition"
            title="Phóng to camera"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono-data text-[10px] text-[#00FFA3] w-10 text-right">
            {(zoom * 100).toFixed(0)}%
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#30363D]" />

        {/* Action Shortcuts */}
        <button
          onClick={() => {
            sounds.playClick();
            onJumpToHQ();
          }}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[#58A6FF] hover:text-white transition font-mono-data text-[11px]"
          title={`Về đại bản doanh ${activeSchool.shortCode} (Phím cách Space)`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Về HQ [Space]</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onFitAll();
          }}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[#E6EDF3] hover:text-white transition font-mono-data text-[11px]"
          title="Xem trọn bản đồ 1.000.000 ô"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#00FFA3]" />
          <span>Toàn Cảnh</span>
        </button>

        <div className="h-4 w-[1px] bg-[#30363D]" />

        {/* Toggles */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleGrid();
          }}
          className={`p-1 rounded border transition ${
            showGrid
              ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3]'
              : 'bg-[#161B22] border-[#30363D] text-[#8B949E]'
          }`}
          title="Bật/Tắt đường lưới tọa độ"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onToggleTroops();
          }}
          className={`p-1 rounded border transition ${
            showTroops
              ? 'bg-[#58A6FF]/20 border-[#58A6FF] text-[#58A6FF]'
              : 'bg-[#161B22] border-[#30363D] text-[#8B949E]'
          }`}
          title="Bật/Tắt hiển thị số lính trên ô"
        >
          <Hash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
