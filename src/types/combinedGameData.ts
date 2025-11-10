/**
 * TypeScript interfaces for the combined game data JSON structure
 * This represents a complete League of Legends match replay data
 */

// Metadata about the match
export interface MatchMetadata {
  dataVersion: string;
  matchId: string;
  participants: string; // Space-separated PUUIDs
}

// Game event types
export interface GameEvent {
  type: 'PAUSE_END' | 'GAME_END' | string;
  timestamp: number;
  realTimestamp?: number;
  gameId?: number;
  winningTeam?: number;
}

// Skill level up event
export interface SkillEvent {
  type: 'SKILL_LEVEL_UP';
  timestamp: number;
  participantId: number;
  skillSlot: number;
  levelUpType: 'NORMAL' | string;
}

// Kill event types
export interface ChampionKillEvent {
  type: 'CHAMPION_KILL';
  timestamp: number;
  killerId: number;
  victimId: number;
  bounty: number;
  killStreakLength: number;
  shutdownBounty: number;
  position?: {
    x: number;
    y: number;
  };
  victimDamageDealt?: Array<{
    basic: boolean;
    magicDamage: number;
    name: string;
    participantId: number;
    physicalDamage: number;
    spellName: string;
    spellSlot: number;
    trueDamage: number;
    type: string;
  }>;
  victimDamageReceived?: Array<{
    basic: boolean;
    magicDamage: number;
    name: string;
    participantId: number;
    physicalDamage: number;
    spellName: string;
    spellSlot: number;
    trueDamage: number;
    type: string;
  }>;
  assistingParticipantIds?: number[];
}

export interface ChampionSpecialKillEvent {
  type: 'CHAMPION_SPECIAL_KILL';
  timestamp: number;
  killerId: number;
  killType: 'KILL_FIRST_BLOOD' | 'KILL_MULTI' | string;
  multiKillLength?: number;
  position?: {
    x: number;
    y: number;
  };
}

export interface EliteMonsterKillEvent {
  type: 'ELITE_MONSTER_KILL';
  timestamp: number;
  killerId: number;
  killerTeamId: number;
  monsterType: 'DRAGON' | 'RIFTHERALD' | 'BARON_NASHOR' | 'HORDE' | string;
  monsterSubType?: 'HEXTECH_DRAGON' | 'AIR_DRAGON' | 'CHEMTECH_DRAGON' | 'EARTH_DRAGON' | 'ELDER_DRAGON' | 'FIRE_DRAGON' | 'WATER_DRAGON' | string;
  position?: {
    x: number;
    y: number;
  };
  assistingParticipantIds?: number[];
  bounty?: number;
}

export interface BuildingKillEvent {
  type: 'BUILDING_KILL';
  timestamp: number;
  killerId: number;
  teamId: number;
  buildingType: 'TOWER_BUILDING' | 'INHIBITOR_BUILDING' | string;
  towerType?: 'OUTER_TURRET' | 'INNER_TURRET' | 'BASE_TURRET' | 'NEXUS_TURRET' | string;
  laneType: 'TOP_LANE' | 'MID_LANE' | 'BOT_LANE' | string;
  position?: {
    x: number;
    y: number;
  };
  bounty?: number;
  assistingParticipantIds?: number[];
}

export type KillEvent = ChampionKillEvent | ChampionSpecialKillEvent | EliteMonsterKillEvent | BuildingKillEvent;

export interface LevelEvent {
  type: 'LEVEL_UP';
  participantId: number;
  timestamp: number;
  level: number;
}

// Item events
export interface ItemPurchasedEvent {
  type: 'ITEM_PURCHASED';
  timestamp: number;
  participantId: number;
  itemId: number;
}

export interface ItemDestroyedEvent {
  type: 'ITEM_DESTROYED';
  timestamp: number;
  participantId: number;
  itemId: number;
}

export interface ItemSoldEvent {
  type: 'ITEM_SOLD';
  timestamp: number;
  participantId: number;
  itemId: number;
}

export interface ItemUndoEvent {
  type: 'ITEM_UNDO';
  timestamp: number;
  participantId: number;
  beforeId: number;
  afterId: number;
  goldGain: number;
}

export type ItemEvent = ItemPurchasedEvent | ItemDestroyedEvent | ItemSoldEvent | ItemUndoEvent;

// Feat (achievement) events
export interface FeatUpdateEvent {
  type: 'FEAT_UPDATE';
  timestamp: number;
  teamId: number;
  featType: number;
  featValue: number;
}

// Participant frame data (snapshot at a specific timestamp)
export interface Position {
  x: number;
  y: number;
}

export interface ChampionStats {
  abilityHaste: number;
  abilityPower: number;
  armor: number;
  armorPen: number;
  armorPenPercent: number;
  attackDamage: number;
  attackSpeed: number;
  bonusArmorPenPercent: number;
  bonusMagicPenPercent: number;
  ccReduction: number;
  cooldownReduction: number;
  health: number;
  healthMax: number;
  healthRegen: number;
  lifesteal: number;
  magicPen: number;
  magicPenPercent: number;
  magicResist: number;
  movementSpeed: number;
  omnivamp: number;
  physicalVamp: number;
  power: number;
  powerMax: number;
  powerRegen: number;
  spellVamp: number;
}

export interface DamageStats {
  magicDamageDone: number;
  magicDamageDoneToChampions: number;
  magicDamageTaken: number;
  physicalDamageDone: number;
  physicalDamageDoneToChampions: number;
  physicalDamageTaken: number;
  totalDamageDone: number;
  totalDamageDoneToChampions: number;
  totalDamageTaken: number;
  trueDamageDone: number;
  trueDamageDoneToChampions: number;
  trueDamageTaken: number;
}

export interface ParticipantFrame {
  championStats: ChampionStats;
  currentGold: number;
  damageStats: DamageStats;
  goldPerSecond: number;
  jungleMinionsKilled: number;
  level: number;
  minionsKilled: number;
  participantId: number;
  position: Position;
  timeEnemySpentControlled: number;
  totalGold: number;
  xp: number;
}

export interface ParticipantFrameSnapshot {
  [participantId: string]: ParticipantFrame | number;
  timestamp: number;
}

// Participant information
export interface Participant {
  participantId: number;
  puuid: string;
}

// Match data (final game statistics)
export interface StatPerks {
  defense: number;
  flex: number;
  offense: number;
}

export interface PerkSelection {
  perk: number;
  var1: number;
  var2: number;
  var3: number;
}

export interface PerkStyle {
  description: string;
  selections: PerkSelection[];
  style: number;
}

export interface Perks {
  statPerks: StatPerks;
  styles: PerkStyle[];
}

export interface Challenges {
  [key: string]: number | boolean | string | number[];
}

export interface Missions {
  playerScore0: number;
  playerScore1: number;
  playerScore2: number;
  playerScore3: number;
  playerScore4: number;
  playerScore5: number;
  playerScore6: number;
  playerScore7: number;
  playerScore8: number;
  playerScore9: number;
  playerScore10: number;
  playerScore11: number;
}

export interface MatchParticipant {
  PlayerScore0: number;
  PlayerScore1: number;
  PlayerScore2: number;
  PlayerScore3: number;
  PlayerScore4: number;
  PlayerScore5: number;
  PlayerScore6: number;
  PlayerScore7: number;
  PlayerScore8: number;
  PlayerScore9: number;
  PlayerScore10: number;
  PlayerScore11: number;
  allInPings: number;
  assistMePings: number;
  assists: number;
  baronKills: number;
  basicPings: number;
  challenges: Challenges;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform: number;
  commandPings: number;
  consumablesPurchased: number;
  damageDealtToBuildings: number;
  damageDealtToEpicMonsters: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  dangerPings: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  eligibleForProgression: boolean;
  enemyMissingPings: number;
  enemyVisionPings: number;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  getBackPings: number;
  goldEarned: number;
  goldSpent: number;
  holdPings: number;
  individualPosition: string;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  killingSprees: number;
  kills: number;
  lane: string;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  missions: Missions;
  needVisionPings: number;
  neutralMinionsKilled: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  onMyWayPings: number;
  participantId: number;
  pentaKills: number;
  perks: Perks;
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  placement: number;
  playerAugment1: number;
  playerAugment2: number;
  playerAugment3: number;
  playerAugment4: number;
  playerAugment5: number;
  playerAugment6: number;
  playerSubteamId: number;
  profileIcon: number;
  pushPings: number;
  puuid: string;
  quadraKills: number;
  retreatPings: number;
  riotIdGameName: string;
  riotIdTagline: string;
  role: string;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  subteamPlacement: number;
  summoner1Casts: number;
  summoner1Id: number;
  summoner2Casts: number;
  summoner2Id: number;
  summonerId: string;
  summonerLevel: number;
  summonerName: string;
  teamEarlySurrendered: boolean;
  teamId: number;
  teamPosition: string;
  timeCCingOthers: number;
  timePlayed: number;
  totalAllyJungleMinionsKilled: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalEnemyJungleMinionsKilled: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;
  unrealKills: number;
  visionClearedPings: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface TeamObjective {
  first: boolean;
  kills: number;
}

export interface TeamObjectives {
  atakhan?: TeamObjective;
  baron: TeamObjective;
  champion: TeamObjective;
  dragon: TeamObjective;
  horde?: TeamObjective;
  inhibitor: TeamObjective;
  riftHerald: TeamObjective;
  tower: TeamObjective;
}

export interface TeamFeat {
  featState: number;
}

export interface TeamFeats {
  EPIC_MONSTER_KILL?: TeamFeat;
  FIRST_BLOOD?: TeamFeat;
  FIRST_TURRET?: TeamFeat;
}

export interface Team {
  bans: number[]; // Usually empty in this data
  feats: TeamFeats;
  objectives: TeamObjectives;
  teamId: number;
  win: boolean;
}

export interface MatchData {
  endOfGameResult: string;
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: MatchParticipant[];
  platformId: string;
  queueId: number;
  teams: Team[];
  tournamentCode: string;
}

// Main combined game data interface
export interface CombinedGameData {
  metadata: MatchMetadata;
  game_events: GameEvent[];
  skill_events: SkillEvent[];
  kill_events: KillEvent[];
  level_events: LevelEvent[];
  item_events: ItemEvent[];
  feat_events: FeatUpdateEvent[];
  participant_frames: ParticipantFrameSnapshot[];
  participants: Participant[];
  match_data: MatchData;
}

