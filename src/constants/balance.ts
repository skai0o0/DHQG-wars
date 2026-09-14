export const GAME_BALANCE = {
  GRID_WIDTH: 1000,
  GRID_HEIGHT: 1000,
  TILE_SIZE_PX: 16,
  
  INITIAL_SPAWN_TROOPS: 300,
  INITIAL_SPAWN_RADIUS: 2, // 5x5 safe zone around spawn (spawnPoint - 2 to spawnPoint + 2)
  BASE_EXPANSION_COST: 2,
  ATTACK_DIFFICULTY_MULTIPLIER: 1.25,
  FORTIFY_TROOP_INCREMENT: 25,
  
  EMBLEM_REQUIRED_BOX_SIZE: 50,
  EMBLEM_DISCOUNTED_BOX_SIZE: 40, // Khi có Landmark Nhà Điều Hành
  
  BOT_TICK_INTERVAL_MS: 500,
  REINFORCEMENT_TICK_INTERVAL_MS: 60000, // Nhận viện binh thụ động từ KTX
  PASSIVE_KTX_REINFORCEMENT: 50,
  
  // Landmark Specific Constants
  NVH_EXPANSION_COST: 1, // Giảm quân hao tổn khi khai hoang (1 thay vì 2)
  GDQP_DEFENSE_BUFF: 1.5, // Tăng 50% chỉ số phòng thủ (1.5x) cho ô biên giới
  NIGHT_MARKET_BONUS_MULTIPLIER: 1.25, // Thưởng thêm 25% quân khi nạp điểm
  HO_DA_ATTACK_PENALTY: 2.0, // Đối thủ đánh vào vùng quanh Hồ Đá chịu tổn thất x2
  DOC_TINH_COST_DISCOUNT: 0.5, // Giảm tiêu hao khi mở đường theo trục Dốc Tình
  NGA_BA_621_CHOKE_PENALTY: 2.0, // Chốt chặn ngã ba
} as const;
