import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GridEngine } from './engine/GridEngine';
import { LandmarkManager } from './engine/LandmarkManager';
import { EmblemDetector } from './engine/EmblemDetector';
import { FrontierTracker } from './bot/FrontierTracker';
import { BotController } from './bot/BotController';
import { ViewportRenderer } from './engine/ViewportRenderer';
import { TopStatusBar } from './components/TopStatusBar';
import { CommandSidebar } from './components/CommandSidebar';
import { CameraControls } from './components/CameraControls';
import { LandmarkInfoModal } from './components/LandmarkInfoModal';
import { AdminHUD } from './components/AdminHUD';
import { School } from './types/school';
import { Landmark, ActionMode, TickerMessage } from './types/game';
import { GRID_CONFIG, SCHOOL_COLORS } from './constants/grid';
import { sounds } from './sound/SoundManager';

export const App: React.FC = () => {
  // Canvas DOM container
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Engine singletons
  const engineRef = useRef<GridEngine | null>(null);
  const landmarkManagerRef = useRef<LandmarkManager | null>(null);
  const emblemDetectorRef = useRef<EmblemDetector | null>(null);
  const trackerRef = useRef<FrontierTracker | null>(null);
  const botControllerRef = useRef<BotController | null>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);

  // App UI State
  const [schools, setSchools] = useState<School[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(1);
  const [activeMode, setActiveMode] = useState<ActionMode>('expand');
  const [zoomLevel, setZoomLevel] = useState<number>(0.8);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTroops, setShowTroops] = useState<boolean>(true);
  const [showCrtScanlines, setShowCrtScanlines] = useState<boolean>(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Camera viewport bounds for Minimap
  const [cameraBounds, setCameraBounds] = useState({
    left: 0,
    top: 0,
    right: 16000,
    bottom: 16000,
    zoom: 0.8,
  });

  // Bot & Simulation State
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [botSpeed, setBotSpeed] = useState<number>(1);

  // Modals & Messages
  const [selectedLandmarkForModal, setSelectedLandmarkForModal] = useState<Landmark | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([
    {
      id: 'init-msg',
      text: 'Hệ thống chỉ huy EVA khởi động thành công. Sa bàn 1000x1000 sẵn sàng!',
      type: 'info',
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString('vi-VN'),
    },
  ]);

  const addTickerMessage = useCallback((text: string, type: TickerMessage['type'], schoolId?: number) => {
    const newMsg: TickerMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString('vi-VN'),
      schoolId,
    };
    setTickerMessages(prev => [...prev.slice(-40), newMsg]);
  }, []);

  // Update schools & landmarks React state from engine
  const syncStateFromEngine = useCallback(() => {
    if (!engineRef.current) return;
    const currentSchools = Array.from(engineRef.current.schools.values());
    setSchools([...currentSchools]);
    setLandmarks([...engineRef.current.landmarks]);
  }, []);

  // Initialize Engines & Renderer
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // 1. Initialize core logic
    const engine = new GridEngine();
    const lmManager = new LandmarkManager(engine);
    const embDetector = new EmblemDetector(engine);
    const tracker = new FrontierTracker(engine);
    const botCtrl = new BotController(engine, tracker);

    engineRef.current = engine;
    landmarkManagerRef.current = lmManager;
    emblemDetectorRef.current = embDetector;
    trackerRef.current = tracker;
    botControllerRef.current = botCtrl;

    syncStateFromEngine();

    // 2. Initialize Pixi Viewport Renderer
    const renderer = new ViewportRenderer({
      container: canvasContainerRef.current,
      engine,
      landmarkManager: lmManager,
      emblemDetector: embDetector,
      onTileClick: (tx, ty, isRightClick) => {
        handleTileInteraction(tx, ty, isRightClick);
      },
      onHoverTile: (tx, ty) => {
        setHoveredTile({ x: tx, y: ty });
      },
      onCameraChange: (left, top, right, bottom, zoom) => {
        setCameraBounds({ left, top, right, bottom, zoom });
        setZoomLevel(zoom);
      },
    });

    rendererRef.current = renderer;
    renderer.init();

    // Bot action events listener
    botCtrl.setOnActionEvent(evt => {
      if (evt.type === 'attack' && evt.combatResult) {
        const sc = SCHOOL_COLORS[evt.combatResult.formerOwner];
        renderer.addCombatParticles(evt.x, evt.y, sc?.int || 0xFF4D4F);
        if (evt.combatResult.success) {
          renderer.addExpansionRipple(evt.x, evt.y, SCHOOL_COLORS[evt.schoolId]?.int || 0x00FFA3);
        }
        sounds.playAttack();
      } else if (evt.type === 'expand') {
        renderer.addExpansionRipple(evt.x, evt.y, SCHOOL_COLORS[evt.schoolId]?.int || 0x00FFA3);
      }
    });

    // 3. Periodic Rule & Landmark Verification Loop (Every 2 seconds)
    const ruleInterval = setInterval(() => {
      if (!engineRef.current || !landmarkManagerRef.current || !emblemDetectorRef.current) return;

      // Check Landmark captures
      const lmEvents = landmarkManagerRef.current.checkLandmarks();
      lmEvents.forEach(evt => {
        const school = engineRef.current?.schools.get(evt.newOwner);
        if (school) {
          sounds.playLandmarkCapture();
          rendererRef.current?.addShockwave(
            evt.landmark.x + evt.landmark.width / 2,
            evt.landmark.y + evt.landmark.height / 2,
            SCHOOL_COLORS[evt.newOwner]?.int || 0x00FFA3
          );
          addTickerMessage(
            `${school.shortCode} đã kiểm soát trọn vẹn ${evt.landmark.name}! Kích hoạt: ${evt.landmark.buffDescription}`,
            'capture',
            evt.newOwner
          );
        }
      });

      // Check Mega-Emblems
      const embEvents = emblemDetectorRef.current.checkEmblems();
      embEvents.forEach(evt => {
        const school = engineRef.current?.schools.get(evt.schoolId);
        if (school) {
          sounds.playEmblemUnlock();
          const cx = (evt.box.x + evt.box.size / 2) * GRID_CONFIG.TILE_SIZE;
          const cy = (evt.box.y + evt.box.size / 2) * GRID_CONFIG.TILE_SIZE;
          rendererRef.current?.addOrbitalBeam(cx, cy, SCHOOL_COLORS[evt.schoolId]?.int || 0x00FFA3);
          rendererRef.current?.addShockwave(
            evt.box.x + evt.box.size / 2,
            evt.box.y + evt.box.size / 2,
            SCHOOL_COLORS[evt.schoolId]?.int || 0x00FFA3
          );
          addTickerMessage(
            `CHIẾN TÍCH: ${school.shortCode} đã hoàn thành đại cờ Mega-Emblem ${evt.box.size}x${evt.box.size} ô!`,
            'emblem',
            evt.schoolId
          );
        }
      });

      syncStateFromEngine();
    }, 2000);

    return () => {
      clearInterval(ruleInterval);
      botCtrl.destroy();
      renderer.destroy();
    };
  }, []);

  // Update selected school in renderer and bot controller
  useEffect(() => {
    rendererRef.current?.setSelectedSchool(selectedSchoolId);
    botControllerRef.current?.setUserSchoolId(selectedSchoolId);
  }, [selectedSchoolId]);

  // Handle Tile Click / Drag Action
  const handleTileInteraction = (tx: number, ty: number, isRightClick: boolean) => {
    const engine = engineRef.current;
    const renderer = rendererRef.current;
    if (!engine || !renderer) return;

    const currentOwner = engine.getOwner(tx, ty);

    if (isRightClick) {
      // Right click: Always fortify if ally tile
      if (currentOwner === selectedSchoolId) {
        const success = engine.fortifyTile(tx, ty, selectedSchoolId);
        if (success) {
          sounds.playFortify();
          syncStateFromEngine();
        }
      }
      return;
    }

    // Left click: Based on current activeMode
    if (activeMode === 'expand') {
      if (currentOwner === 0) {
        const success = engine.expandToTile(tx, ty, selectedSchoolId);
        if (success) {
          sounds.playExpand();
          renderer.addExpansionRipple(tx, ty, SCHOOL_COLORS[selectedSchoolId]?.int || 0x00FFA3);
          syncStateFromEngine();
        }
      } else if (currentOwner !== selectedSchoolId) {
        // Auto attack enemy if clicked in expand mode
        executeAttack(tx, ty);
      } else {
        // Ally tile: fortify
        const success = engine.fortifyTile(tx, ty, selectedSchoolId);
        if (success) {
          sounds.playFortify();
          syncStateFromEngine();
        }
      }
    } else if (activeMode === 'attack') {
      if (currentOwner > 0 && currentOwner !== selectedSchoolId) {
        executeAttack(tx, ty);
      }
    } else if (activeMode === 'fortify') {
      if (currentOwner === selectedSchoolId) {
        const success = engine.fortifyTile(tx, ty, selectedSchoolId);
        if (success) {
          sounds.playFortify();
          syncStateFromEngine();
        }
      }
    }
  };

  const executeAttack = (tx: number, ty: number) => {
    const engine = engineRef.current;
    const renderer = rendererRef.current;
    if (!engine || !renderer) return;

    const defenderId = engine.getOwner(tx, ty);
    const combat = engine.attackTile(tx, ty, selectedSchoolId);

    if (combat) {
      const defSchool = engine.schools.get(defenderId);
      const attSchool = engine.schools.get(selectedSchoolId);

      renderer.addCombatParticles(tx, ty, SCHOOL_COLORS[defenderId]?.int || 0xFF4D4F);

      if (combat.success) {
        sounds.playAttack();
        renderer.addExpansionRipple(tx, ty, SCHOOL_COLORS[selectedSchoolId]?.int || 0x00FFA3);
        addTickerMessage(
          `${attSchool?.shortCode} công phá thành công cứ điểm của ${defSchool?.shortCode} tại [${tx}, ${ty}]!`,
          'combat',
          selectedSchoolId
        );
      } else {
        sounds.playAlert();
        addTickerMessage(
          `${attSchool?.shortCode} tấn công bất thành tại [${tx}, ${ty}] (Thương vong: -${combat.attackerCasualties})!`,
          'combat',
          selectedSchoolId
        );
      }
      syncStateFromEngine();
    }
  };

  // HQ Jump
  const jumpToHQ = useCallback(() => {
    const school = engineRef.current?.schools.get(selectedSchoolId);
    if (school && rendererRef.current) {
      rendererRef.current.centerOnTile(school.spawnPoint.x, school.spawnPoint.y, 0.85);
    }
  }, [selectedSchoolId]);

  // Global Space hotkey for jump to HQ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        jumpToHQ();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jumpToHQ]);

  // Camera Controls
  const handleZoomChange = (newZoom: number) => {
    rendererRef.current?.viewport?.setZoom(newZoom);
    setZoomLevel(newZoom);
  };

  const handleFitAll = () => {
    rendererRef.current?.centerOnTile(500, 500, 0.06);
  };

  const handleToggleGrid = () => {
    setShowGrid(prev => {
      const next = !prev;
      rendererRef.current?.setToggles(next, showTroops);
      return next;
    });
  };

  const handleToggleTroops = () => {
    setShowTroops(prev => {
      const next = !prev;
      rendererRef.current?.setToggles(showGrid, next);
      return next;
    });
  };

  // Referee & Admin actions
  const handleInjectPoints = (schoolId: number, rawPoints: number) => {
    if (!engineRef.current) return;
    const added = engineRef.current.injectTroops(schoolId, rawPoints);
    const school = engineRef.current.schools.get(schoolId);
    if (school) {
      addTickerMessage(
        `VIỆN BINH: ${school.shortCode} vừa được tiếp tế +${added.toLocaleString()} quân từ hoạt động sinh viên!`,
        'reinforcement',
        schoolId
      );
      syncStateFromEngine();
    }
  };

  const handleUploadLogo = (schoolId: number, base64Url: string) => {
    const school = engineRef.current?.schools.get(schoolId);
    if (school) {
      school.logoUrl = base64Url;
      rendererRef.current?.updateSchoolEmblemTexture(schoolId, base64Url);
      syncStateFromEngine();
      addTickerMessage(`Bộ chỉ huy: Huy hiệu quân đoàn ${school.shortCode} đã được cập nhật mới!`, 'info', schoolId);
    }
  };

  const handleFastBoost10k = (schoolId: number) => {
    if (!engineRef.current) return;
    const school = engineRef.current.schools.get(schoolId);
    if (school) {
      school.availableTroops += 10000;
      sounds.playReinforcement();
      addTickerMessage(`TRỌNG TÀI: Cấp tốc viện binh +10.000 quân cho ${school.shortCode}!`, 'reinforcement', schoolId);
      syncStateFromEngine();
    }
  };

  const handleInstantEmblem = (schoolId: number) => {
    if (!engineRef.current) return;
    const school = engineRef.current.schools.get(schoolId);
    if (!school) return;

    // Create 50x50 territory block around spawn point
    const half = 25;
    const boxX = Math.max(0, Math.min(1000 - 50, school.spawnPoint.x - half));
    const boxY = Math.max(0, Math.min(1000 - 50, school.spawnPoint.y - half));

    for (let y = boxY; y < boxY + 50; y++) {
      for (let x = boxX; x < boxX + 50; x++) {
        const idx = y * 1000 + x;
        const prevOwner = engineRef.current.ownerMap[idx];
        if (prevOwner !== schoolId) {
          if (prevOwner > 0) {
            const prevSchool = engineRef.current.schools.get(prevOwner);
            if (prevSchool) prevSchool.totalOwnedTiles--;
          }
          engineRef.current.ownerMap[idx] = schoolId;
          engineRef.current.troopMap[idx] = 20;
          school.totalOwnedTiles++;
          engineRef.current.dirtyTiles.add(idx);
        }
      }
    }

    school.hasEmblemUnlocked = true;
    school.emblemBox = { x: boxX, y: boxY, size: 50 };

    sounds.playEmblemUnlock();
    const cx = (boxX + 25) * GRID_CONFIG.TILE_SIZE;
    const cy = (boxY + 25) * GRID_CONFIG.TILE_SIZE;
    rendererRef.current?.addOrbitalBeam(cx, cy, SCHOOL_COLORS[schoolId]?.int || 0x00FFA3);
    rendererRef.current?.addShockwave(boxX + 25, boxY + 25, SCHOOL_COLORS[schoolId]?.int || 0x00FFA3);
    rendererRef.current?.centerOnTile(boxX + 25, boxY + 25, 0.7);

    addTickerMessage(`TRỌNG TÀI: Kích hoạt tức thì Đại cờ 50x50 cho ${school.shortCode}!`, 'emblem', schoolId);
    syncStateFromEngine();
  };

  const handleResetMap = () => {
    if (!engineRef.current) return;
    engineRef.current.resetMap();
    trackerRef.current?.initFrontiers();
    syncStateFromEngine();
    sounds.playAlert();
    addTickerMessage('TOÀN BỘ CHIẾN TRƯỜNG ĐÃ ĐƯỢC RESET VỀ TRẠNG THÁI KHỞI ĐẦU!', 'info');
    jumpToHQ();
  };

  const handleEqualizeTroops = () => {
    if (!engineRef.current) return;
    engineRef.current.equalizeTroops(2000);
    syncStateFromEngine();
    sounds.playFortify();
    addTickerMessage('TRỌNG TÀI: Quân số toàn bộ 10 trường đã được cân bằng về 2.000 quân/trường!', 'info');
  };

  const handleToggleAutoPlay = () => {
    const next = !isAutoPlay;
    setIsAutoPlay(next);
    botControllerRef.current?.setAutoPlay(next);
    addTickerMessage(
      next ? 'HỆ THỐNG BOT AI: Đã kích hoạt chế độ tự động bành trướng!' : 'HỆ THỐNG BOT AI: Đã tạm dừng mô phỏng!',
      'info'
    );
  };

  const handleChangeBotSpeed = (s: number) => {
    setBotSpeed(s);
    botControllerRef.current?.setSpeed(s);
  };

  const activeSchool = schools.find(s => s.schoolId === selectedSchoolId) || schools[0] || {
    schoolId: 1,
    name: 'Bách Khoa',
    shortCode: 'BK',
    color: '#0033A0',
    logoUrl: '',
    availableTroops: 1500,
    totalOwnedTiles: 0,
    spawnPoint: { x: 120, y: 120 },
    hasEmblemUnlocked: false,
    personality: { aggression: 0.85, expansionFocus: 0.6, landmarkPriority: 0.5 },
    activeBuffs: [],
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0D1117] text-[#E6EDF3] select-none relative">
      {/* Retro CRT Scanlines Overlay */}
      {showCrtScanlines && (
        <div className="fixed inset-0 crt-scanlines pointer-events-none z-50" />
      )}

      {/* 1. Top Status Bar */}
      {engineRef.current && (
        <TopStatusBar
          engine={engineRef.current}
          onResetMap={handleResetMap}
          onEqualize={handleEqualizeTroops}
          showCrtScanlines={showCrtScanlines}
          onToggleCrtScanlines={() => setShowCrtScanlines(prev => !prev)}
        />
      )}

      {/* 2. Main Workspace: Canvas + Sidebar */}
      <div className="flex flex-1 w-full h-[calc(100vh-40px)] overflow-hidden relative">
        {/* Left Battlefield Canvas */}
        <div className="flex-1 h-full relative overflow-hidden bg-[#0D1117]">
          {/* Pixi Canvas Mount Point */}
          <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

          {/* Floating Camera Controls & Inspector */}
          {engineRef.current && (
            <CameraControls
              zoom={zoomLevel}
              showGrid={showGrid}
              showTroops={showTroops}
              activeSchool={activeSchool}
              engine={engineRef.current}
              hoveredTile={hoveredTile}
              onZoomChange={handleZoomChange}
              onJumpToHQ={jumpToHQ}
              onFitAll={handleFitAll}
              onToggleGrid={handleToggleGrid}
              onToggleTroops={handleToggleTroops}
            />
          )}
        </div>

        {/* Right C&C EVA Command Sidebar */}
        {engineRef.current && (
          <CommandSidebar
            engine={engineRef.current}
            schools={schools}
            activeSchool={activeSchool}
            landmarks={landmarks}
            activeMode={activeMode}
            cameraLeft={cameraBounds.left}
            cameraTop={cameraBounds.top}
            cameraRight={cameraBounds.right}
            cameraBottom={cameraBounds.bottom}
            messages={tickerMessages}
            isAutoPlay={isAutoPlay}
            speed={botSpeed}
            onNavigateMinimap={(tx, ty) => {
              rendererRef.current?.centerOnTile(tx, ty);
            }}
            onSelectSchool={id => {
              setSelectedSchoolId(id);
              const target = schools.find(s => s.schoolId === id);
              if (target && rendererRef.current) {
                rendererRef.current.centerOnTile(target.spawnPoint.x, target.spawnPoint.y);
              }
            }}
            onChangeMode={mode => {
              setActiveMode(mode);
              rendererRef.current?.setActionMode(mode);
            }}
            onJumpToHQ={jumpToHQ}
            onSelectLandmark={lm => setSelectedLandmarkForModal(lm)}
            onFocusLandmark={lm => {
              rendererRef.current?.centerOnTile(lm.x + lm.width / 2, lm.y + lm.height / 2, 0.9);
            }}
            onInjectPoints={handleInjectPoints}
            onToggleAutoPlay={handleToggleAutoPlay}
            onChangeSpeed={handleChangeBotSpeed}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}
      </div>

      {/* Landmark Info Modal */}
      {selectedLandmarkForModal && (
        <LandmarkInfoModal
          landmark={selectedLandmarkForModal}
          ownerSchool={schools.find(s => s.schoolId === selectedLandmarkForModal.currentOwner)}
          onClose={() => setSelectedLandmarkForModal(null)}
          onJumpToLandmark={(x, y) => {
            rendererRef.current?.centerOnTile(x, y, 0.9);
          }}
        />
      )}

      {/* Admin HUD Modal */}
      <AdminHUD
        schools={schools}
        selectedSchoolId={selectedSchoolId}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSelectSchool={id => setSelectedSchoolId(id)}
        onUploadLogo={handleUploadLogo}
        onFastBoost10k={handleFastBoost10k}
        onInstantEmblem={handleInstantEmblem}
        onResetMap={handleResetMap}
        onEqualizeTroops={handleEqualizeTroops}
      />
    </div>
  );
};
