import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  applyModelState,
  getModelType,
  setupAnimationMixer
} from './sceneInitializer';
import {
  CombinedGameData,
  KillEvent,
  GameEvent,
  SkillEvent,
  LevelEvent,
  ItemEvent,
  FeatUpdateEvent,
  BuildingKillEvent,
  EliteMonsterKillEvent,
  ChampionKillEvent
} from '@/types/combinedGameData';

/**
 * Scene Manager
 * 
 * Manages models in the scene and updates them based on timeline events.
 * Handles adding, removing, and updating models based on game events.
 */

export interface ModelInstance {
  object: THREE.Object3D;
  modelType: string;
  instanceName: string;
  originalState: string;
  currentState: string;
  isVisible: boolean;
}

export interface SceneManagerConfig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  loader: GLTFLoader;
  controls?: OrbitControls;
  onModelsUpdated?: (models: ModelInstance[]) => void;
}

interface PlayerPositionOffset {
  [key: string]: { x: number; y: number; };
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private loader: GLTFLoader;
  private controls?: OrbitControls;
  private models: Map<string, ModelInstance> = new Map(); // key: instanceName
  private gameData: CombinedGameData | null = null;
  private onModelsUpdated?: (models: ModelInstance[]) => void;

  // Model path mappings
  private modelPaths: Map<string, string> = new Map([
    ['Blue Turret', '/models/structures/blueTurret.glb'],
    ['Red Turret', '/models/structures/redTurret.glb'],
    ['Blue Nexus', '/models/structures/blueNexus.glb'],
    ['Red Nexus', '/models/structures/redNexus.glb'],
    ['Blue Inhibitor', '/models/structures/blueInhibitor.glb'],
    ['Red Inhibitor', '/models/structures/redInhibitor.glb'],
    ['Baron', '/models/neutral objectives/baron.glb'],
    ['Rift Herald', '/models/neutral objectives/rift_herald.glb'],
    ['Void Grub', '/models/neutral objectives/voidgrub.glb'],
    ['Dragon Air', '/models/neutral objectives/dragon_air.glb'],
    ['Dragon Earth', '/models/neutral objectives/dragon_earth.glb'],
    ['Dragon Fire', '/models/neutral objectives/dragon_fire.glb'],
    ['Dragon Water', '/models/neutral objectives/dragon_water.glb'],
    ['Dragon Chemtech', '/models/neutral objectives/dragon_chemtech.glb'],
    ['Dragon Hextech', '/models/neutral objectives/dragon_hextech.glb'],
    ['Dragon Elder', '/models/neutral objectives/dragon_elder.glb'],
  ]);

  private playerPositionsOffsets: PlayerPositionOffset = {
    'Dragon Air': { x: -10015.49, y: 4700.37 },
    'Dragon Earth': { x: -10015.49, y: 4700.37 },
    'Dragon Fire': { x: -10015.49, y: 4700.37 },
    'Dragon Water': { x: -10015.49, y: 4700.37 },
    'Dragon Chemtech': { x: -10015.49, y: 4700.37 },
    'Dragon Hextech': { x: -10015.49, y: 4700.37 },
    'Dragon Elder': { x: -10015.49, y: 4700.37 },
    'Void Grub 1': { x: -4873.74, y: 10247.17 },
    'Void Grub 2': { x: -4873.74, y: 10247.17 },
    'Void Grub 3': { x: -4873.74, y: 10247.17 },
    'Baron': { x: -4639.3, y: 9867.24 },
    'Rift Herald': { x: -4639.3, y: 9867.24 },
    'Atakhan': { x: 0, y: 0 },
    'Blue Turret Bot Nexus': { x: -2049.19, y: 2095.83 },
    'Blue Turret Top Nexus': { x: -2553.43, y: 1637.13 },
    'Blue Turret Top Tier 3': { x: -1481.22, y: 4121.45 },
    'Blue Turret Top Tier 2': { x: -1014.46, y: 6498.47 },
    'Blue Turret Top Tier 1': { x: -1457.75, y: 10267.71 },
    'Blue Turret Mid Tier 3': { x: -4016.27, y: 3640.8 },
    'Blue Turret Mid Tier 2': { x: -4655.58, y: 4945.88 },
    'Blue Turret Mid Tier 1': { x: -6226.83, y: 6096.09 },
    'Blue Turret Bot Tier 3': { x: -4667.33, y: 938.87 },
    'Blue Turret Bot Tier 2': { x: -7383.85, y: 1037.52 },
    'Blue Turret Bot Tier 1': { x: -10791.97, y: 1226.2 },
    'Red Turret Top Nexus': { x: -12082.37, y: 12959.04 },
    'Red Turret Bot Nexus': { x: -13304.75, y: 12336.01 },
    'Red Turret Top Tier 3': { x: -9916.36, y: 13552.19 },
    'Red Turret Top Tier 2': { x: -7329.19, y: 13486.02 },
    'Red Turret Top Tier 1': { x: -3868.95, y: 13574.46 },
    'Red Turret Mid Tier 3': { x: -10699.42, y: 10999.1 },
    'Red Turret Mid Tier 2': { x: -10003.18, y: 9544.36 },
    'Red Turret Mid Tier 1': { x: -8338.11, y: 8458.25 },
    'Red Turret Bot Tier 3': { x: -13245.83, y: 10228.38 },
    'Red Turret Bot Tier 2': { x: -13707.06, y: 7993.07 },
    'Red Turret Bot Tier 1': { x: -13266.31, y: 4258.9 },
    'Blue Inhibitor Top': { x: -1573.25, y: 3492.29 },
    'Blue Inhibitor Mid': { x: -3509.63, y: 2829.52 },
    'Blue Inhibitor Bot': { x: -3840.02, y: 998.93 },
    'Red Inhibitor Top': { x: -10808.82, y: 13259.93 },
    'Red Inhibitor Mid': { x: -12023.69, y: 11479.06 },
    'Red Inhibitor Bot': { x: -13039.19, y: 10804.18 },
    'Blue Nexus': { x: -1111.32 , y: 1161.03 },
    'Red Nexus': { x: -13641.05, y: 12784.18 },
  };

  constructor(config: SceneManagerConfig) {
    this.scene = config.scene;
    this.camera = config.camera;
    this.loader = config.loader;
    this.controls = config.controls;
    this.onModelsUpdated = config.onModelsUpdated;
  }

  /**
   * Set the game data for event processing
   */
  setGameData(gameData: CombinedGameData | null) {
    this.gameData = gameData;
  }

  /**
   * Add a model to the scene
   */
  async addModel(
    modelType: string,
    instanceName: string,
    position: { x: number; y: number; z: number },
    rotation?: { x: number; y: number; z: number },
    scale?: { x: number; y: number; z: number },
    initialState: string = 'default'
  ): Promise<THREE.Object3D | null> {
    const modelPath = this.modelPaths.get(modelType);
    if (!modelPath) {
      console.warn(`Model path not found for type: ${modelType}`);
      return null;
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          const clone = SkeletonUtils.clone(gltf.scene);
          clone.name = instanceName;
          clone.userData.selectable = true;

          // Set position
          clone.position.set(position.x, position.y, position.z);

          // Set rotation
          if (rotation) {
            clone.rotation.set(
              THREE.MathUtils.degToRad(rotation.x),
              THREE.MathUtils.degToRad(rotation.y),
              THREE.MathUtils.degToRad(rotation.z)
            );
          }

          // Set scale
          if (scale) {
            clone.scale.set(scale.x, scale.y, scale.z);
          }

          // Make meshes non-selectable
          clone.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.userData.selectable = false;
            }
          });

          // Setup animation mixer
          setupAnimationMixer(clone, gltf, instanceName);

          // Apply initial state
          applyModelState(clone, instanceName, initialState);

          // Add to scene
          this.scene.add(clone);

          // Hide monsters at the start
          const isMonster = ['Baron', 'Rift Herald', 'Void Grub', 'Dragon Air', 'Dragon Earth', 
                            'Dragon Fire', 'Dragon Water', 'Dragon Chemtech', 'Dragon Hextech', 
                            'Dragon Elder', 'Atakhan'].some(name => modelType.includes(name) || instanceName.includes(name));
          const initialVisibility = !isMonster;

          if (isMonster) {
            clone.visible = false;
          }

          // Store model instance
          const instance: ModelInstance = {
            object: clone,
            modelType,
            instanceName,
            originalState: initialState,
            currentState: initialState,
            isVisible: initialVisibility
          };

          this.models.set(instanceName, instance);
          this.notifyModelsUpdated();

          console.log(`Added model: ${instanceName} (${modelType})`);
          resolve(clone);
        },
        undefined,
        (error) => {
          console.error(`Error loading model ${modelType}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Remove a model from the scene
   */
  removeModel(instanceName: string): boolean {
    const instance = this.models.get(instanceName);
    if (!instance) {
      console.warn(`Model not found: ${instanceName}`);
      return false;
    }

    // Remove from scene
    this.scene.remove(instance.object);

    // Dispose of resources
    instance.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });

    // Remove from map
    this.models.delete(instanceName);
    this.notifyModelsUpdated();

    console.log(`Removed model: ${instanceName}`);
    return true;
  }

  /**
   * Update a model's state
   */
  updateModelState(instanceName: string, newState: string): boolean {
    let instance = this.models.get(instanceName);
    
    // If not found in Map, try to find it in the scene and register it
    if (!instance) {
      const sceneObject = this.scene.getObjectByName(instanceName);
      if (sceneObject) {
        // Register the model found in the scene
        const modelType = getModelType(instanceName);
        instance = {
          object: sceneObject,
          modelType,
          instanceName,
          originalState: 'default',
          currentState: 'default',
          isVisible: sceneObject.visible
        };
        this.models.set(instanceName, instance);
        console.log(`Registered model from scene: ${instanceName} (${modelType})`);
      } else {
        console.warn(`Model not found: ${instanceName}`);
        return false;
      }
    }

    applyModelState(instance.object, instanceName, newState);
    instance.currentState = newState;
    this.notifyModelsUpdated();

    console.log(`Updated model ${instanceName} to state: ${newState}`);
    return true;
  }

  /**
   * Set model visibility
   */
  setModelVisibility(instanceName: string, visible: boolean): boolean {
    let instance = this.models.get(instanceName);
    
    // If not found in Map, try to find it in the scene and register it
    if (!instance) {
      const sceneObject = this.scene.getObjectByName(instanceName);
      if (sceneObject) {
        // Register the model found in the scene
        const modelType = getModelType(instanceName);
        instance = {
          object: sceneObject,
          modelType,
          instanceName,
          originalState: 'default',
          currentState: 'default',
          isVisible: sceneObject.visible
        };
        this.models.set(instanceName, instance);
        console.log(`Registered model from scene: ${instanceName} (${modelType})`);
      } else {
        console.warn(`Model not found: ${instanceName}`);
        return false;
      }
    }

    instance.object.visible = visible;
    instance.isVisible = visible;
    this.notifyModelsUpdated();

    return true;
  }

  /**
   * Get a model instance by name
   */
  getModel(instanceName: string): ModelInstance | undefined {
    let instance = this.models.get(instanceName);
    
    // If not found in Map, try to find it in the scene and register it
    if (!instance) {
      const sceneObject = this.scene.getObjectByName(instanceName);
      if (sceneObject) {
        // Register the model found in the scene
        const modelType = getModelType(instanceName);
        instance = {
          object: sceneObject,
          modelType,
          instanceName,
          originalState: 'default',
          currentState: 'default',
          isVisible: sceneObject.visible
        };
        this.models.set(instanceName, instance);
        console.log(`Registered model from scene: ${instanceName} (${modelType})`);
      }
    }
    
    return instance;
  }

  /**
   * Get all models
   */
  getAllModels(): ModelInstance[] {
    return Array.from(this.models.values());
  }

  /**
   * Find models by type
   */
  findModelsByType(modelType: string): ModelInstance[] {
    return Array.from(this.models.values()).filter(
      (instance) => instance.modelType === modelType
    );
  }

  /**
   * Process events up to a given timestamp and update the scene accordingly
   */
  processEventsUpToTimestamp(timestamp: number): void {
    if (!this.gameData) {
      return;
    }

    // Process all events up to the given timestamp
    type EventUnion = GameEvent | KillEvent | SkillEvent | LevelEvent | ItemEvent | FeatUpdateEvent;
    const allEvents: Array<{ timestamp: number; event: EventUnion; type: string }> = [];

    // Collect all events
    this.gameData.game_events?.forEach((event) => {
      allEvents.push({ timestamp: event.timestamp, event, type: 'game' });
    });

    this.gameData.kill_events?.forEach((event) => {
      allEvents.push({ timestamp: event.timestamp, event, type: 'kill' });
    });

    this.gameData.skill_events?.forEach((event) => {
      allEvents.push({ timestamp: event.timestamp, event, type: 'skill' });
    });

    this.gameData.level_events?.forEach((event) => {
      allEvents.push({ timestamp: event.timestamp, event, type: 'level' });
    });

    this.gameData.item_events?.forEach((event) => {
      allEvents.push({ timestamp: event.timestamp, event, type: 'item' });
    });

    this.gameData.feat_events?.forEach((event) => {
      allEvents.push({ timestamp: event.timestamp, event, type: 'feat' });
    });

    // Sort by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Process events up to timestamp
    for (const { timestamp: eventTimestamp, event, type } of allEvents) {
      if (eventTimestamp <= timestamp) {
        this.handleEvent(type, event);
      }
    }
  }

  /**
   * Handle a specific event
   */
  handleEvent(eventType: string, event: GameEvent | KillEvent | SkillEvent | LevelEvent | ItemEvent | FeatUpdateEvent): void {
    switch (eventType) {
      case 'kill':
        this.handleKillEvent(event as KillEvent);
        break;
      case 'game':
        this.handleGameEvent(event as GameEvent);
        break;
      case 'skill':
        this.handleSkillEvent(event as SkillEvent);
        break;
      case 'level':
        this.handleLevelEvent(event as LevelEvent);
        break;
      case 'item':
        this.handleItemEvent(event as ItemEvent);
        break;
      case 'feat':
        this.handleFeatEvent(event as FeatUpdateEvent);
        break;
      default:
        console.warn(`Unknown event type: ${eventType}`);
    }
  }

  /**
   * Handle kill events (champions, monsters, buildings)
   */
  private handleKillEvent(event: KillEvent): void {
    this.setBuildingStates(event.timestamp);
    this.hideModels(['Baron', 'Rift Herald', 'Void Grub 1', 'Void Grub 2', 'Void Grub 3', 'Dragon Air', 'Dragon Earth', 
      'Dragon Fire', 'Dragon Water', 'Dragon Chemtech', 'Dragon Hextech', 'Dragon Elder', 'Atakhan', 
      'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10']);
    switch (event.type) {
      case 'BUILDING_KILL':
        this.handleBuildingKill(event as BuildingKillEvent);
        if (event.buildingType === 'TOWER_BUILDING') {
            // Find the appropriate turret
            const modelName = this.getTurretName(event.teamId, event.towerType, event.laneType, event.position) || '';
            this.setCameraPositionModel(modelName);
            console.log('Updating player offset for model:', modelName);
            this.updatePlayerOffset(modelName, event.killerId);
          } else if (event.buildingType === 'INHIBITOR_BUILDING') {
            // Find the appropriate inhibitor
            const modelName = this.getInhibitorName(event.teamId, event.laneType) || '';
            this.setCameraPositionModel(modelName);
          }
        break;
      case 'ELITE_MONSTER_KILL':
        this.handleMonsterKill(event as EliteMonsterKillEvent);
        break;
      case 'CHAMPION_KILL':
        this.handleChampionKill(event as ChampionKillEvent);
        break;
      case 'CHAMPION_SPECIAL_KILL':
        // Champion kills don't affect scene models directly
        break;
      default:
        // Handle any other kill event types
        const unhandledEvent = event as KillEvent;
        console.warn(`Unhandled kill event type: ${unhandledEvent.type}`);
    }
  }

  /**
   * Handle building kill events
   */
  private handleBuildingKill(event: BuildingKillEvent): void {
    const { buildingType, towerType, laneType, teamId } = event;
    if (buildingType === 'TOWER_BUILDING') {
      // Find the appropriate turret
      const turretName = this.getTurretName(teamId, towerType, laneType, event.position);
      if (turretName) {
        this.updateModelState(turretName, 'destroyed');
      }
    } else if (buildingType === 'INHIBITOR_BUILDING') {
      // Find the appropriate inhibitor
      const inhibitorName = this.getInhibitorName(teamId, laneType);
      if (inhibitorName) {
        this.updateModelState(inhibitorName, 'destroyed');
      }
    }
  }

  /**
   * Handle monster kill events
   */
  private handleMonsterKill(event: EliteMonsterKillEvent): void {
    const { monsterType, monsterSubType } = event;

    let modelType: string | null = null;

    if (monsterType === 'BARON_NASHOR') {
      modelType = 'Baron';
    } else if (monsterType === 'RIFTHERALD') {
      modelType = 'Rift Herald';
    } else if (monsterType === 'HORDE') {
      modelType = 'Void Grub';
    } else if (monsterType === 'DRAGON') {
      if (monsterSubType === 'AIR_DRAGON') {
        modelType = 'Dragon Air';
      } else if (monsterSubType === 'EARTH_DRAGON') {
        modelType = 'Dragon Earth';
      } else if (monsterSubType === 'FIRE_DRAGON') {
        modelType = 'Dragon Fire';
      } else if (monsterSubType === 'WATER_DRAGON') {
        modelType = 'Dragon Water';
      } else if (monsterSubType === 'CHEMTECH_DRAGON') {
        modelType = 'Dragon Chemtech';
      } else if (monsterSubType === 'HEXTECH_DRAGON') {
        modelType = 'Dragon Hextech';
      } else if (monsterSubType === 'ELDER_DRAGON') {
        modelType = 'Dragon Elder';
      }
    }

    if (modelType) {
      // Find all instances of this monster type and update them
      const instances = this.findModelsByType(modelType);
      console.log(`Found ${instances.length} instances of ${modelType}`);
      instances.forEach((instance) => {
        this.setCameraPositionModel(instance.instanceName);
        this.updatePlayerOffset(instance.instanceName, event.killerId);
        this.updateModelState(instance.instanceName, 'death');
      });
    }
  }
  private handleChampionKill(event: ChampionKillEvent): void {
    console.log('Champion kill event:', event);
    const victimId = event.victimId;
    const killerId = event.killerId;
    console.log('Victim ID:', victimId);
    console.log('Killer ID:', killerId);
    this.updateModelState(`Player ${victimId}`, 'death');
    if (event.position) {
      this.updateModelPosition(`Player ${victimId}`, -1*event.position.x, event.position.y-100);
      this.updateModelState(`Player ${killerId}`, 'default');
      this.updateModelPosition(`Player ${killerId}`, -1*event.position.x, event.position.y+100);
    }
    this.setCameraPositionModel(`Player ${killerId}`);
  }
  /**
   * Handle game events
   */
  private handleGameEvent(event: GameEvent): void {
    console.log('Game event:', event);
    this.setBuildingStates(event.timestamp);
    this.hideModels(['Baron', 'Rift Herald', 'Void Grub 1', 'Void Grub 2', 'Void Grub 3', 'Dragon Air', 'Dragon Earth', 
      'Dragon Fire', 'Dragon Water', 'Dragon Chemtech', 'Dragon Hextech', 
      'Dragon Elder', 'Atakhan']);
    if (event.type === 'GAME_END') {
      // Could reset all models to default state or show end game state
      if (event.winningTeam === 100) {
        this.updateModelState('Red Nexus', 'destroyed');
        this.setCameraPositionModel('Red Nexus');
      } else {
        this.updateModelState('Blue Nexus', 'destroyed');
        this.setCameraPositionModel('Blue Nexus');
      }
      console.log('Game ended');
    }
  }

  /**
   * Handle skill events
   */
  private handleSkillEvent(_event: SkillEvent): void {
    // Skill events don't directly affect scene models
    // Could be used for visual effects or champion animations
  }

  /**
   * Handle level events
   */
  private handleLevelEvent(_event: LevelEvent): void {
    // Level events don't directly affect scene models
    // Could be used for visual effects or champion animations
  }

  /**
   * Handle item events
   */
  private handleItemEvent(_event: ItemEvent): void {
    // Item events don't directly affect scene models
  }

  /**
   * Handle feat events
   */
  private handleFeatEvent(_event: FeatUpdateEvent): void {
    // Feat events don't directly affect scene models
    // Could be used for visual indicators
  }

  /**
   * Get turret name based on team, tower type, and lane
   */
  private getTurretName(
    teamId: number,
    towerType: string | undefined,
    laneType: string,
    position: { x: number; y: number } | undefined
  ): string | null {
    const teamPrefix = teamId === 100 ? 'Blue' : 'Red';
    const lanePrefix = this.getLanePrefix(laneType);

    if (towerType === 'NEXUS_TURRET') {
        if (position && position.x > position.y) {
            console.log('Bot Nexus');
            return `${teamPrefix} Turret Bot Nexus`;
          } else if (position && position.x < position.y) {
            console.log('Top Nexus');
            return `${teamPrefix} Turret Top Nexus`;
          }
    } else if (towerType === 'BASE_TURRET') {
      // Base turrets (inhibitor turrets): "Blue Turret Top Inhibitor"
      return `${teamPrefix} Turret ${lanePrefix} Tier 3`;
    } else if (towerType === 'INNER_TURRET') {
      // Inner turrets (Tier 2): "Blue Turret Top Tier 2"
      return `${teamPrefix} Turret ${lanePrefix} Tier 2`;
    } else if (towerType === 'OUTER_TURRET') {
      // Outer turrets (Tier 1): "Blue Turret Top Tier 1"
      return `${teamPrefix} Turret ${lanePrefix} Tier 1`;
    }

    return null;
  }

  /**
   * Get inhibitor name based on team and lane
   */
  private getInhibitorName(teamId: number, laneType: string): string | null {
    const teamPrefix = teamId === 100 ? 'Blue' : 'Red';
    const lanePrefix = this.getLanePrefix(laneType);
    // Format: "Blue Inhibitor Top", "Blue Inhibitor Mid", "Blue Inhibitor Bot"
    return `${teamPrefix} Inhibitor ${lanePrefix}`;
  }

  /**
   * Get lane prefix from lane type
   */
  private getLanePrefix(laneType: string): string {
    if (laneType === 'TOP_LANE') return 'Top';
    if (laneType === 'MID_LANE') return 'Mid';
    if (laneType === 'BOT_LANE') return 'Bot';
    return '';
  }

  /**
   * Reset all models to their default states
   */
  resetAllModels(): void {
    this.models.forEach((instance) => {
      this.updateModelState(instance.instanceName, instance.originalState);
    });
  }
  
  /**
   * Clear all models from the scene
   */
  clearAllModels(): void {
    const instanceNames = Array.from(this.models.keys());
    instanceNames.forEach((name) => {
      this.removeModel(name);
    });
  }

  hideModels(instanceNames: string[]): void {
    instanceNames.forEach((name) => {
      this.setModelVisibility(name, false);
    });
  }

  showModels(instanceNames: string[]): void {
    instanceNames.forEach((name) => {
      this.setModelVisibility(name, true);
    });
  }

  setCameraPositionModel(modelName: string): void {
    const model = this.getModel(modelName);
    if (model) {
      if (this.controls) {
        // Set the focal point (target) instead of camera position
        this.controls.target.set(model.object.position.x, model.object.position.y, model.object.position.z);
        this.controls.update();
        this.camera.position.set(model.object.position.x, model.object.position.y+1347, model.object.position.z-1000);
      } else {
        // Fallback to setting camera position if controls are not available
        this.camera.position.set(model.object.position.x, model.object.position.y, this.camera.position.z);
      }
    }
  }

  playerDeath(playerId: number, x: number, y: number): void {
    this.updateModelState(`Player ${playerId}`, 'death');
    this.updateModelPosition(`Player ${playerId}`, x, y);
  }

  playerPose(playerId: number, x: number, y: number): void {
    this.updateModelState(`Player ${playerId}`, 'default');
    this.updateModelPosition(`Player ${playerId}`, x, y);
  }

  updatePlayerOffset(modelName: string, playerId: number): void {
    console.log('Updating player offset for model:', modelName);
    const { x, y } = this.playerPositionsOffsets[modelName];
    this.updateModelPosition(`Player ${playerId}`, x, y);
    this.updateModelState(`Player ${playerId}`, 'default');
  }

  updateModelPosition(instanceName: string, x: number, y: number): void {
    const model = this.getModel(instanceName);
    if (model) {
      model.object.position.set(x, this.getModelHeight(x, y), y);
    }
  }

  getModelHeight(x: number, y: number): number {
    if ((x > -4996.09 && y < 4756.26) || (x < -9731.42 && y > 10050.02)) {
      return 99;
    } else {
      return 46;
    }
  }

  setBuildingStates(timestamp: number): void {
    // First, reset all building models to default state
    const allBuildings = Array.from(this.models.values()).filter(
      (instance) =>
        instance.modelType === 'Blue Turret' ||
        instance.modelType === 'Red Turret' ||
        instance.modelType === 'Blue Inhibitor' ||
        instance.modelType === 'Red Inhibitor' ||
        instance.modelType === 'Blue Nexus' ||
        instance.modelType === 'Red Nexus'
    );
    
    allBuildings.forEach((instance) => {
      this.updateModelState(instance.instanceName, 'default');
    });

    // Then, set buildings destroyed before the timestamp to destroyed state
    const buildingEvents = this.gameData?.kill_events?.filter((event) => event.timestamp <= timestamp && event.type === 'BUILDING_KILL' && event.buildingType === 'TOWER_BUILDING');
    if (buildingEvents) {
      buildingEvents.forEach((event) => {
        this.handleBuildingKill(event as BuildingKillEvent);
      });
    }
    const inhibitorEvents = this.gameData?.kill_events?.filter((event) => event.timestamp <= timestamp && event.type === 'BUILDING_KILL' && event.buildingType === 'INHIBITOR_BUILDING');
    if (inhibitorEvents) {
      inhibitorEvents.forEach((event) => {
        this.handleBuildingKill(event as BuildingKillEvent);
      });
    }
  }
  
  /**
   * Notify listeners that models have been updated
   */
  private notifyModelsUpdated(): void {
    if (this.onModelsUpdated) {
      this.onModelsUpdated(this.getAllModels());
    }
  }
}

