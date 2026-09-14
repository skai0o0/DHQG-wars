import { Texture } from 'pixi.js';

/**
 * Procedural 2.5D Isometric Vector Sprites for the 10 Iconic VNU Landmarks.
 * Rendered with isometric projection, cast shadows, and depth overhangs.
 */
export const LANDMARK_ISOMETRIC_SVGS: Record<number, string> = {
  // 1. Nhà Văn Hóa Sinh Viên (Con Thuyền Lục Giác)
  1: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E6EDF3"/>
        <stop offset="50%" stop-color="#8B949E"/>
        <stop offset="100%" stop-color="#30363D"/>
      </linearGradient>
      <linearGradient id="glassRoof" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00FFA3" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#007A3D" stop-opacity="0.9"/>
      </linearGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.6 0"/>
        <feOffset dx="0" dy="12"/>
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal"/>
      </filter>
    </defs>
    <!-- Ground Cast Shadow -->
    <ellipse cx="140" cy="180" rx="100" ry="42" fill="#000000" opacity="0.45"/>
    <!-- Base Terraces / Steps -->
    <polygon points="140,195 235,145 140,95 45,145" fill="#21262D" stroke="#30363D" stroke-width="2"/>
    <polygon points="45,145 140,195 140,205 45,155" fill="#161B22"/>
    <polygon points="140,195 235,145 235,155 140,205" fill="#0D1117"/>
    <!-- Middle Tier Ship Prow Deck -->
    <polygon points="140,165 215,125 140,85 65,125" fill="url(#hullGrad)" stroke="#58A6FF" stroke-width="1.5"/>
    <polygon points="65,125 140,165 140,175 65,135" fill="#30363D"/>
    <polygon points="140,165 215,125 215,135 140,175" fill="#21262D"/>
    <!-- Upper Hexagonal Ship Pavilion -->
    <polygon points="140,135 190,105 170,60 110,60 90,105" fill="url(#glassRoof)" stroke="#00FFA3" stroke-width="2"/>
    <!-- Roof Antenna & Beacon -->
    <line x1="140" y1="60" x2="140" y2="25" stroke="#FADB14" stroke-width="3"/>
    <circle cx="140" cy="22" r="5" fill="#00FFA3"/>
    <circle cx="140" cy="22" r="9" fill="none" stroke="#00FFA3" stroke-width="1.5" stroke-dasharray="3,2"/>
    <!-- Stylized Windows / Louvers -->
    <line x1="115" y1="85" x2="165" y2="85" stroke="#FFFFFF" stroke-width="1.5" opacity="0.7"/>
    <line x1="125" y1="100" x2="155" y2="100" stroke="#FFFFFF" stroke-width="1.5" opacity="0.7"/>
    <!-- Label -->
    <rect x="90" y="200" width="100" height="18" rx="4" fill="#0D1117" stroke="#00FFA3" stroke-width="1"/>
    <text x="140" y="213" fill="#00FFA3" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="10" text-anchor="middle" letter-spacing="1">NVH SINH VIÊN</text>
  </svg>`,

  // 2. Khu Quân Sự (GDQP-AN) - Watchtower & Military Barracks
  2: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="camoRoof" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4D7C0F"/>
        <stop offset="50%" stop-color="#1E3A18"/>
        <stop offset="100%" stop-color="#0F240C"/>
      </linearGradient>
    </defs>
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="90" ry="38" fill="#000000" opacity="0.45"/>
    <!-- Sandbags & Wall Perimeter -->
    <polygon points="140,195 220,150 140,105 60,150" fill="#2E3A20" stroke="#4D7C0F" stroke-width="2"/>
    <!-- Main Command Bunker -->
    <polygon points="110,160 170,125 140,105 80,140" fill="url(#camoRoof)" stroke="#A3E635" stroke-width="1.5"/>
    <polygon points="80,140 110,160 110,175 80,155" fill="#1B2813"/>
    <polygon points="110,160 170,125 170,140 110,175" fill="#141E0F"/>
    <!-- High Watchtower (Left) -->
    <polygon points="70,125 95,110 80,95 55,110" fill="#365314" stroke="#84CC16" stroke-width="1"/>
    <line x1="55" y1="110" x2="55" y2="45" stroke="#65A30D" stroke-width="3"/>
    <line x1="95" y1="110" x2="95" y2="45" stroke="#65A30D" stroke-width="3"/>
    <line x1="75" y1="95" x2="75" y2="40" stroke="#4D7C0F" stroke-width="3"/>
    <!-- Guard Cabin & Spotlight -->
    <polygon points="75,45 100,30 80,20 55,35" fill="#1E293B" stroke="#FADB14" stroke-width="1.5"/>
    <polygon points="55,35 75,45 75,55 55,45" fill="#0F172A"/>
    <polygon points="75,45 100,30 100,40 75,55" fill="#020617"/>
    <!-- Searchlight Cone -->
    <polygon points="75,50 160,160 190,145" fill="#FADB14" opacity="0.25"/>
    <!-- Radar Dish on Right -->
    <circle cx="170" cy="65" r="14" fill="none" stroke="#00FFA3" stroke-width="3"/>
    <line x1="170" y1="65" x2="170" y2="110" stroke="#8B949E" stroke-width="3"/>
    <line x1="170" y1="65" x2="185" y2="55" stroke="#00FFA3" stroke-width="2"/>
    <!-- Flagpole -->
    <line x1="130" y1="100" x2="130" y2="35" stroke="#E6EDF3" stroke-width="2"/>
    <polygon points="130,35 150,42 130,50" fill="#EF4444"/>
    <!-- Label -->
    <rect x="90" y="200" width="100" height="18" rx="4" fill="#0D1117" stroke="#84CC16" stroke-width="1"/>
    <text x="140" y="213" fill="#A3E635" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="10" text-anchor="middle" letter-spacing="1">KHU GDQP-AN</text>
  </svg>`,

  // 3. Thư Viện Trung Tâm ĐHQG - Modern Stepped Dome Library
  3: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="libSteps" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="60%" stop-color="#0284C7"/>
        <stop offset="100%" stop-color="#0369A1"/>
      </linearGradient>
    </defs>
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="95" ry="40" fill="#000000" opacity="0.45"/>
    <!-- Plaza Base -->
    <polygon points="140,195 230,145 140,95 50,145" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
    <!-- Tier 1 Book Wing -->
    <polygon points="140,165 210,125 140,85 70,125" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
    <polygon points="70,125 140,165 140,175 70,135" fill="#020617"/>
    <polygon points="140,165 210,125 210,135 140,175" fill="#000000"/>
    <!-- Tier 2 Stepped Dome -->
    <polygon points="140,135 190,105 140,75 90,105" fill="url(#libSteps)" stroke="#BAE6FD" stroke-width="1.5"/>
    <polygon points="90,105 140,135 140,145 90,115" fill="#0369A1"/>
    <polygon points="140,135 190,105 190,115 140,145" fill="#075985"/>
    <!-- Tier 3 Open Book Roof Apex -->
    <polygon points="140,100 170,80 140,60 110,80" fill="#F8FAFC" stroke="#0284C7" stroke-width="2"/>
    <line x1="140" y1="60" x2="140" y2="100" stroke="#0284C7" stroke-width="2"/>
    <!-- Glowing Knowledge Orb -->
    <circle cx="140" cy="40" r="10" fill="#38BDF8" opacity="0.8"/>
    <circle cx="140" cy="40" r="5" fill="#FFFFFF"/>
    <!-- Label -->
    <rect x="80" y="200" width="120" height="18" rx="4" fill="#0D1117" stroke="#38BDF8" stroke-width="1"/>
    <text x="140" y="213" fill="#38BDF8" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="9" text-anchor="middle" letter-spacing="1">THƯ VIỆN TRUNG TÂM</text>
  </svg>`,

  // 4. Chợ Đêm Làng Đại Học - Cyberpunk Neon Night Market
  4: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="neonAwning1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F43F5E"/>
        <stop offset="50%" stop-color="#FB7185"/>
        <stop offset="100%" stop-color="#E11D48"/>
      </linearGradient>
      <linearGradient id="neonAwning2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="92" ry="40" fill="#000000" opacity="0.45"/>
    <polygon points="140,195 225,145 140,95 55,145" fill="#18181B" stroke="#F43F5E" stroke-width="1.5"/>
    <!-- Stall 1 (Left Food Cart) -->
    <polygon points="85,155 125,130 105,115 65,140" fill="url(#neonAwning1)" stroke="#FDA4AF" stroke-width="1.5"/>
    <polygon points="65,140 85,155 85,168 65,153" fill="#881337"/>
    <polygon points="85,155 125,130 125,143 85,168" fill="#4C0519"/>
    <!-- Stall 2 (Right Night Market Stall) -->
    <polygon points="155,155 195,130 175,115 135,140" fill="url(#neonAwning2)" stroke="#FDE68A" stroke-width="1.5"/>
    <polygon points="135,140 155,155 155,168 135,153" fill="#78350F"/>
    <polygon points="155,155 195,130 195,143 155,168" fill="#451A03"/>
    <!-- Center Giant Neon Lantern / Billboard -->
    <polygon points="140,115 170,95 140,75 110,95" fill="#06B6D4" stroke="#67E8F9" stroke-width="2"/>
    <polygon points="110,95 140,115 140,130 110,110" fill="#0891B2"/>
    <polygon points="140,115 170,95 170,110 140,130" fill="#0E7490"/>
    <!-- Glowing Neon Strings / Garlands -->
    <path d="M75,120 Q105,100 140,85 Q175,100 205,120" fill="none" stroke="#F43F5E" stroke-width="2"/>
    <circle cx="95" cy="112" r="3.5" fill="#FDE047"/>
    <circle cx="120" cy="98" r="3.5" fill="#00FFA3"/>
    <circle cx="160" cy="98" r="3.5" fill="#F43F5E"/>
    <circle cx="185" cy="112" r="3.5" fill="#38BDF8"/>
    <!-- Steam / Sizzle Smoke Wisps -->
    <path d="M85,125 Q80,105 88,90 Q95,75 90,65" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.5"/>
    <!-- Label -->
    <rect x="85" y="200" width="110" height="18" rx="4" fill="#0D1117" stroke="#F43F5E" stroke-width="1"/>
    <text x="140" y="213" fill="#FB7185" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="9" text-anchor="middle" letter-spacing="1">CHỢ ĐÊM LÀNG ĐH</text>
  </svg>`,

  // 5. Cụm Hồ Đá & Hồ Thủy Xạ - Shimmering Deep Quarry Lake
  5: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0284C7"/>
        <stop offset="40%" stop-color="#0369A1"/>
        <stop offset="100%" stop-color="#082F49"/>
      </linearGradient>
      <linearGradient id="cliffRock" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#64748B"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>
    </defs>
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="98" ry="42" fill="#000000" opacity="0.45"/>
    <!-- Surrounding Rocky Crags -->
    <polygon points="140,198 235,145 220,110 140,85 60,110 45,145" fill="url(#cliffRock)" stroke="#475569" stroke-width="2"/>
    <!-- Lower Quarry Pit Drop -->
    <polygon points="140,185 215,140 140,102 65,140" fill="#0F172A"/>
    <!-- Deep Water Body -->
    <polygon points="140,175 205,138 140,110 75,138" fill="url(#waterGrad)" stroke="#38BDF8" stroke-width="1.5"/>
    <!-- Water Caustics / Ripple lines -->
    <path d="M105,130 Q120,122 140,125 Q160,128 175,122" fill="none" stroke="#BAE6FD" stroke-width="1.5" opacity="0.7"/>
    <path d="M95,145 Q120,138 140,142 Q165,145 185,138" fill="none" stroke="#BAE6FD" stroke-width="1.5" opacity="0.5"/>
    <path d="M120,158 Q135,152 155,155" fill="none" stroke="#38BDF8" stroke-width="1.2" opacity="0.8"/>
    <!-- Warning Signpost on Cliff -->
    <line x1="68" y1="120" x2="68" y2="85" stroke="#E2E8F0" stroke-width="2"/>
    <polygon points="68,85 85,93 68,101" fill="#EF4444"/>
    <circle cx="68" cy="82" r="3" fill="#FADB14"/>
    <!-- Label -->
    <rect x="90" y="200" width="100" height="18" rx="4" fill="#0D1117" stroke="#38BDF8" stroke-width="1"/>
    <text x="140" y="213" fill="#38BDF8" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="10" text-anchor="middle" letter-spacing="1">CỤM HỒ ĐÁ</text>
  </svg>`,

  // 6. Dốc Tình (Dốc Nghĩa Tình) - Romantic Winding Hillside Road
  6: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="90" ry="38" fill="#000000" opacity="0.45"/>
    <polygon points="140,195 220,150 140,105 60,150" fill="#1E293B" stroke="#EC4899" stroke-width="1.5"/>
    <!-- Hill Slope Terrain -->
    <polygon points="140,175 200,135 140,95 80,135" fill="#334155"/>
    <!-- Winding Asphalt Path -->
    <path d="M75,145 Q110,150 140,135 Q170,120 160,105 Q150,90 120,95" fill="none" stroke="#F472B6" stroke-width="8" stroke-linecap="round"/>
    <path d="M75,145 Q110,150 140,135 Q170,120 160,105 Q150,90 120,95" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="4,4"/>
    <!-- Streetlights with Warm Glow -->
    <line x1="165" y1="110" x2="165" y2="70" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="165" cy="68" r="6" fill="#FDE047"/>
    <circle cx="165" cy="68" r="12" fill="#FDE047" opacity="0.3"/>
    <line x1="95" y1="135" x2="95" y2="95" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="95" cy="93" r="5" fill="#FDE047"/>
    <!-- Pine Trees on Slope -->
    <polygon points="185,120 195,100 175,100" fill="#15803D"/>
    <polygon points="185,105 192,88 178,88" fill="#22C55E"/>
    <!-- Label -->
    <rect x="90" y="200" width="100" height="18" rx="4" fill="#0D1117" stroke="#EC4899" stroke-width="1"/>
    <text x="140" y="213" fill="#F472B6" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="10" text-anchor="middle" letter-spacing="1">DỐC TÌNH VNU</text>
  </svg>`,

  // 7. Ký Túc Xá Khu A & B - Twin Modern High-rise Dorm Towers
  7: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>
    </defs>
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="95" ry="40" fill="#000000" opacity="0.45"/>
    <polygon points="140,195 230,145 140,95 50,145" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
    <!-- Tower A (Left, 16 Stories) -->
    <polygon points="90,140 125,120 100,105 65,125" fill="#334155" stroke="#10B981" stroke-width="1.5"/>
    <polygon points="65,125 90,140 90,55 65,40" fill="#1E293B" stroke="#10B981" stroke-width="1"/>
    <polygon points="90,140 125,120 125,35 90,55" fill="#0F172A" stroke="#10B981" stroke-width="1"/>
    <polygon points="90,55 125,35 100,20 65,40" fill="#64748B" stroke="#10B981" stroke-width="1.5"/>
    <!-- Tower B (Right, 16 Stories) -->
    <polygon points="150,150 185,130 160,115 125,135" fill="#334155" stroke="#10B981" stroke-width="1.5"/>
    <polygon points="125,135 150,150 150,65 125,50" fill="#1E293B" stroke="#10B981" stroke-width="1"/>
    <polygon points="150,150 185,130 185,45 150,65" fill="#0F172A" stroke="#10B981" stroke-width="1"/>
    <polygon points="150,65 185,45 160,30 125,50" fill="#64748B" stroke="#10B981" stroke-width="1.5"/>
    <!-- Skybridge connecting Towers -->
    <polygon points="90,85 125,70 125,82 90,97" fill="#10B981" opacity="0.85"/>
    <!-- Lit Windows Rows -->
    <circle cx="75" cy="65" r="2" fill="#FDE047"/>
    <circle cx="82" cy="70" r="2" fill="#FDE047"/>
    <circle cx="75" cy="85" r="2" fill="#FDE047"/>
    <circle cx="105" cy="65" r="2" fill="#67E8F9"/>
    <circle cx="115" cy="60" r="2" fill="#67E8F9"/>
    <circle cx="140" cy="75" r="2" fill="#FDE047"/>
    <circle cx="165" cy="65" r="2" fill="#FDE047"/>
    <!-- Label -->
    <rect x="90" y="200" width="100" height="18" rx="4" fill="#0D1117" stroke="#10B981" stroke-width="1"/>
    <text x="140" y="213" fill="#10B981" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="10" text-anchor="middle" letter-spacing="1">KTX KHU A & B</text>
  </svg>`,

  // 8. Ngã Ba 621 - Strategic Gateway & Checkpoint Arches
  8: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="90" ry="38" fill="#000000" opacity="0.45"/>
    <polygon points="140,195 220,150 140,105 60,150" fill="#27272A" stroke="#EAB308" stroke-width="1.5"/>
    <!-- Intersection Asphalt Crossing -->
    <polygon points="140,175 195,140 140,115 85,140" fill="#18181B"/>
    <!-- Highway Concrete Gateway Arch -->
    <polygon points="100,150 115,140 115,70 100,80" fill="#EAB308"/>
    <polygon points="165,115 180,105 180,35 165,45" fill="#CA8A04"/>
    <!-- Overhead Gantry Truss -->
    <polygon points="100,80 180,35 180,48 100,93" fill="#FACC15" stroke="#FFFFFF" stroke-width="1"/>
    <!-- Traffic lights / Toll Barcode -->
    <circle cx="120" cy="75" r="3.5" fill="#22C55E"/>
    <circle cx="140" cy="65" r="3.5" fill="#FDE047"/>
    <circle cx="160" cy="55" r="3.5" fill="#EF4444"/>
    <!-- Security Barrier -->
    <line x1="110" y1="135" x2="160" y2="105" stroke="#EF4444" stroke-width="4" stroke-dasharray="6,4"/>
    <!-- Label -->
    <rect x="90" y="200" width="100" height="18" rx="4" fill="#0D1117" stroke="#EAB308" stroke-width="1"/>
    <text x="140" y="213" fill="#FACC15" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="10" text-anchor="middle" letter-spacing="1">NGÃ BA 621</text>
  </svg>`,

  // 9. Cánh Đồng Cỏ Lau - Pampas Grass Hill & Wooden Deck
  9: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="90" ry="38" fill="#000000" opacity="0.45"/>
    <polygon points="140,195 220,150 140,105 60,150" fill="#14532D" stroke="#86EFAC" stroke-width="1.5"/>
    <!-- Rolling Green Hill -->
    <polygon points="140,175 205,135 140,95 75,135" fill="#166534"/>
    <!-- Wooden Observation Deck -->
    <polygon points="140,135 175,115 140,95 105,115" fill="#78350F" stroke="#FDE68A" stroke-width="1.5"/>
    <polygon points="105,115 140,135 140,145 105,125" fill="#451A03"/>
    <polygon points="140,135 175,115 175,125 140,145" fill="#290E02"/>
    <!-- Silvery Pampas Grass Plumes -->
    <path d="M75,135 Q80,110 88,95" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M85,140 Q90,115 100,100" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M175,130 Q182,105 190,90" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M190,140 Q198,115 205,102" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Wind swirls -->
    <path d="M110,85 Q135,75 160,82" fill="none" stroke="#BBF7D0" stroke-width="1.5" opacity="0.6"/>
    <!-- Label -->
    <rect x="85" y="200" width="110" height="18" rx="4" fill="#0D1117" stroke="#86EFAC" stroke-width="1"/>
    <text x="140" y="213" fill="#86EFAC" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="9" text-anchor="middle" letter-spacing="1">CÁNH ĐỒNG CỎ LAU</text>
  </svg>`,

  // 10. Tòa Nhà Điều Hành ĐHQG - Glass Skyscraper & Central Headquarters Spire
  10: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="240" viewBox="0 0 280 240">
    <defs>
      <linearGradient id="towerGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0284C7"/>
        <stop offset="50%" stop-color="#38BDF8"/>
        <stop offset="100%" stop-color="#0369A1"/>
      </linearGradient>
    </defs>
    <!-- Ground Shadow -->
    <ellipse cx="140" cy="180" rx="98" ry="40" fill="#000000" opacity="0.45"/>
    <!-- Podium Plaza -->
    <polygon points="140,195 230,145 140,95 50,145" fill="#0F172A" stroke="#00FFA3" stroke-width="1.5"/>
    <polygon points="50,145 140,195 140,205 50,155" fill="#020617"/>
    <polygon points="140,195 230,145 230,155 140,205" fill="#000000"/>
    <!-- Main Skyscraper Core (Towering High) -->
    <polygon points="110,145 170,110 170,30 110,65" fill="url(#towerGlass)" stroke="#BAE6FD" stroke-width="1.5"/>
    <polygon points="70,120 110,145 110,65 70,40" fill="#0369A1" stroke="#38BDF8" stroke-width="1.5"/>
    <polygon points="110,65 170,30 130,10 70,40" fill="#E0F2FE" stroke="#BAE6FD" stroke-width="2"/>
    <!-- Central Communications Spire -->
    <line x1="120" y1="25" x2="120" y2="2" stroke="#FADB14" stroke-width="3"/>
    <circle cx="120" cy="2" r="5" fill="#00FFA3"/>
    <circle cx="120" cy="2" r="9" fill="none" stroke="#00FFA3" stroke-width="1.5" stroke-dasharray="3,2"/>
    <!-- Glowing Status Rings on Tower -->
    <line x1="85" y1="65" x2="150" y2="45" stroke="#00FFA3" stroke-width="2" opacity="0.8"/>
    <line x1="90" y1="95" x2="155" y2="75" stroke="#00FFA3" stroke-width="2" opacity="0.8"/>
    <!-- Label -->
    <rect x="80" y="200" width="120" height="18" rx="4" fill="#0D1117" stroke="#00FFA3" stroke-width="1"/>
    <text x="140" y="213" fill="#00FFA3" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="9" text-anchor="middle" letter-spacing="1">TÒA ĐIỀU HÀNH ĐHQG</text>
  </svg>`
};

/**
 * Cache and rasterize all landmark SVGs to Pixi Textures
 */
export async function rasterizeLandmarkTextures(): Promise<Map<number, Texture>> {
  const map = new Map<number, Texture>();

  for (const [idStr, svgString] of Object.entries(LANDMARK_ISOMETRIC_SVGS)) {
    const id = Number(idStr);
    try {
      const tex = await new Promise<Texture>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 280;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(Texture.from(canvas));
          } else {
            resolve(Texture.from(img));
          }
        };
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
      });
      map.set(id, tex);
    } catch (e) {
      console.warn(`Failed to rasterize landmark ${id}:`, e);
    }
  }

  return map;
}
