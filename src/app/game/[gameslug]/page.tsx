"use client"
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  initializeScene, 
  modelStates, 
  getModelType, 
  applyModelState, 
  logMaterialInfo, 
  logModelStructure, 
  logModelHierarchy, 
  checkMeshNames, 
  collectSelectableObjects,
  animationData,
  playAnimation,
  pauseAnimation,
  resumeAnimation,
  stopAnimation,
  setAnimationSpeed as setAnimationSpeedGlobal,
  getAnimationProgress,
  setAnimationProgress as setAnimationProgressGlobal,
  updateAnimationMixers,
  ModelAnimationData,
  setAnimationPose,
  getAvailableAnimations,
  hasAnimation,
  demonstrateAnimationStates,
  debugAnimationData
} from './sceneInitializer';
import TimelineController, { TimelineEvent } from '@/components/timelineController';
import { CombinedGameData } from '@/types/combinedGameData';
import { SceneManager } from './sceneManager';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import EventDetails from '@/components/eventDetails';
import { getJsonFileFromS3 } from '@/app/actions/s3';
import GameChat from '@/components/gameChat';

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lockedAxesRef = useRef({ x: false, y: false, z: false });
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Camera and focal point states
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [focalPoint, setFocalPoint] = useState({ x: 0, y: 0, z: 0 });
  const [inputPosition, setInputPosition] = useState({ x: 50, y: 50, z: 50 });
  const [inputFocalPoint, setInputFocalPoint] = useState({ x: 0, y: 0, z: 0 });
  const [lockedAxes, setLockedAxes] = useState({ x: false, y: false, z: false });
  
  // Object selection and manipulation states
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [selectableObjects, setSelectableObjects] = useState<THREE.Object3D[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [objectPosition, setObjectPosition] = useState({ x: 0, y: 0, z: 0 });
  const [inputObjectPosition, setInputObjectPosition] = useState({ x: 0, y: 0, z: 0 });
  const [objectRotation, setObjectRotation] = useState({ x: 0, y: 0, z: 0 });
  const [inputObjectRotation, setInputObjectRotation] = useState({ x: 0, y: 0, z: 0 });

  // Animation states
  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [lastTime, setLastTime] = useState<number>(0);
  
  // Control panels visibility state
  const [panelsVisible, setPanelsVisible] = useState<boolean>(false);
  
  // Timeline and event details visibility state
  const [timelineVisible, setTimelineVisible] = useState<boolean>(true);
  
  // Timeline and game data states
  const [gameData, setGameData] = useState<CombinedGameData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const params = useParams();
  const gameslug = params?.gameslug as string;
  
  // Scene manager ref
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const sceneInitializedRef = useRef<boolean>(false);

  // Function to set camera position
  const setCameraPositionManually = (x: number, y: number, z: number) => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(x, y, z);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Function to handle input changes
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputPosition(prev => ({ ...prev, [axis]: numValue }));
  };

  // Function to handle focal point input changes
  const handleFocalPointChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputFocalPoint(prev => ({ ...prev, [axis]: numValue }));
  };

  // Function to set focal point manually
  const setFocalPointManually = (x: number, y: number, z: number) => {
    if (controlsRef.current) {
      controlsRef.current.target.set(x, y, z);
      controlsRef.current.update();
    }
  };

  // Function to handle axis locking
  const toggleAxisLock = (axis: 'x' | 'y' | 'z') => {
    setLockedAxes(prev => {
      const newState = { ...prev, [axis]: !prev[axis] };
      lockedAxesRef.current = newState;
      return newState;
    });
  };

  // Function to set focal point with axis locking
  const setFocalPointWithLocks = (x: number, y: number, z: number) => {
    if (controlsRef.current) {
      const currentTarget = controlsRef.current.target;
      const newX = lockedAxes.x ? currentTarget.x : x;
      const newY = lockedAxes.y ? currentTarget.y : y;
      const newZ = lockedAxes.z ? currentTarget.z : z;
      
      controlsRef.current.target.set(newX, newY, newZ);
      controlsRef.current.update();
    }
  };

  // Function to apply position
  const applyPosition = () => {
    setCameraPositionManually(inputPosition.x, inputPosition.y, inputPosition.z);
  };

  // Function to apply focal point
  const applyFocalPoint = () => {
    setFocalPointWithLocks(inputFocalPoint.x, inputFocalPoint.y, inputFocalPoint.z);
  };

  // Function to reset to default position
  const resetPosition = () => {
    const defaultPos = { x: 50, y: 50, z: 50 };
    setInputPosition(defaultPos);
    setCameraPositionManually(defaultPos.x, defaultPos.y, defaultPos.z);
  };

  // Function to reset focal point
  const resetFocalPoint = () => {
    const defaultFocal = { x: 0, y: 0, z: 0 };
    setInputFocalPoint(defaultFocal);
    setFocalPointManually(defaultFocal.x, defaultFocal.y, defaultFocal.z);
  };



  // Model parts visibility control functions
  const [modelParts, setModelParts] = useState<{ [objectId: string]: any[] }>({});
  const [expandedParts, setExpandedParts] = useState<{ [objectId: string]: { [partId: string]: boolean } }>({});
  

  // Current state for each object
  const [objectStates, setObjectStates] = useState<{ [objectId: string]: string }>({});
  
  const collectModelParts = (object: THREE.Object3D) => {
    const parts: any[] = [];
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        // Create a better display name
        let displayName = child.name || 'Unnamed';
        
        // If it's a mesh with a name, show the name
        if (child instanceof THREE.Mesh && child.name && child.name.trim() !== '') {
          displayName = child.name;
        }
        // If it's a mesh without a name, try to create a descriptive name
        else if (child instanceof THREE.Mesh && (!child.name || child.name.trim() === '')) {
          // Try to get material name for better identification
          if (child.material) {
            const material = Array.isArray(child.material) ? child.material[0] : child.material;
            if (material && material.name && material.name.trim() !== '') {
              displayName = `Mesh (${material.name})`;
            } else {
              displayName = `Mesh (${child.geometry?.type || 'Unknown'})`;
            }
          } else {
            displayName = `Mesh (${child.geometry?.type || 'Unknown'})`;
          }
        }
        // If it's a group, show the name or a default
        else if (child instanceof THREE.Group) {
          displayName = child.name || 'Group';
        }
        
        const partInfo = {
          uuid: child.uuid,
          name: displayName,
          originalName: child.name || '',
          type: child.type,
          visible: child.visible,
          isMesh: child instanceof THREE.Mesh,
          isGroup: child instanceof THREE.Group,
          hasGeometry: child instanceof THREE.Mesh && !!child.geometry,
          hasMaterial: child instanceof THREE.Mesh && !!child.material,
          childrenCount: child.children.length,
          depth: 0,
          object: child,
          // Add material info for meshes
          materialInfo: child instanceof THREE.Mesh && child.material ? {
            materialName: Array.isArray(child.material) ? 
              child.material.map(m => m.name || 'Unnamed').join(', ') : 
              (child.material.name || 'Unnamed'),
            materialType: Array.isArray(child.material) ? 
              child.material.map(m => m.type).join(', ') : 
              child.material.type
          } : null
        };
        
        // Calculate depth
        let depth = 0;
        let parent = child.parent;
        while (parent) {
          depth++;
          parent = parent.parent;
        }
        partInfo.depth = depth;
        
        parts.push(partInfo);
      }
    });
    
    return parts;
  };

  const togglePartVisibility = (objectId: string, partUuid: string) => {
    const object = selectableObjects.find(obj => obj.uuid === objectId);
    if (!object) return;
    
    object.traverse((child) => {
      if (child.uuid === partUuid) {
        child.visible = !child.visible;
        
        // Update model parts state
        setModelParts(prev => {
          const newParts = { ...prev };
          if (newParts[objectId]) {
            const partIndex = newParts[objectId].findIndex(p => p.uuid === partUuid);
            if (partIndex !== -1) {
              newParts[objectId][partIndex].visible = child.visible;
            }
          }
          return newParts;
        });
      }
    });
  };

  const toggleAllPartsVisibility = (objectId: string, visible: boolean) => {
    const object = selectableObjects.find(obj => obj.uuid === objectId);
    if (!object) return;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        child.visible = visible;
      }
    });
    
    // Update model parts state
    setModelParts(prev => {
      const newParts = { ...prev };
      if (newParts[objectId]) {
        newParts[objectId] = newParts[objectId].map(part => ({
          ...part,
          visible: visible
        }));
      }
      return newParts;
    });
  };

  const togglePartExpansion = (objectId: string, partUuid: string) => {
    setExpandedParts(prev => {
      const newExpanded = { ...prev };
      if (!newExpanded[objectId]) {
        newExpanded[objectId] = {};
      }
      newExpanded[objectId][partUuid] = !newExpanded[objectId][partUuid];
      return newExpanded;
    });
  };


  // Function to get available states for an object
  const getAvailableStates = (objectName: string): string[] => {
    const modelType = getModelType(objectName);
    const objectStates = modelStates[modelType as keyof typeof modelStates];
    return objectStates ? Object.keys(objectStates) : [];
  };

  // Function to apply default state to all models of a specific type
  const applyDefaultStatesToModelType = (modelType: string) => {
    const objects = selectableObjects.filter(obj => getModelType(obj.name || '') === modelType);
    objects.forEach(obj => {
      applyModelState(obj, obj.name || '', 'default');
    });
    console.log(`Applied default state to ${objects.length} ${modelType} objects`);
  };

  // Function to apply default states to all models
  const applyDefaultStatesToAllModels = () => {
    const modelTypes = Object.keys(modelStates);
    modelTypes.forEach(modelType => {
      applyDefaultStatesToModelType(modelType);
    });
    console.log(`Applied default states to all model types: ${modelTypes.join(', ')}`);
  };

  // Function to set object state
  const setObjectState = (objectId: string, stateName: string) => {
    const object = selectableObjects.find(obj => obj.uuid === objectId);
    if (!object) return;

    const objectName = object.name || 'Unnamed';
    applyModelState(object, objectName, stateName);

    // Update model parts state
    setModelParts(prev => {
      const newParts = { ...prev };
      if (newParts[objectId]) {
        const parts = collectModelParts(object);
        newParts[objectId] = parts;
      }
      return newParts;
    });
  };

  // Update model parts when selected object changes
  useEffect(() => {
    if (selectedObject) {
      const parts = collectModelParts(selectedObject);
      
      setModelParts(prev => ({
        ...prev,
        [selectedObject.uuid]: parts
      }));
      
      // Reset expanded state for new object
      setExpandedParts(prev => ({
        ...prev,
        [selectedObject.uuid]: {}
      }));
    }
  }, [selectedObject]);


  const handleObjectSelection = (objectId: string) => {
    const object = selectableObjects.find(obj => obj.uuid === objectId);
    selectObject(object || null);
  };

  const selectObject = (object: THREE.Object3D | null) => {
    // Remove highlight from previously selected object
    if (selectedObject) {
      selectedObject.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Handle both single material and material array
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            if (material && material.emissive) {
              material.setHex(0x00ff44);
            }
          });
        }
      });
    }

    setSelectedObject(object);
    
    if (object) {
      // Add highlight to selected object
      object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Handle both single material and material array
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            if (material && material.emissive) {
              material.emissive.setHex(0x444444);
            }
          });
        }
      });
      
      // Update position state - use world position for accuracy
      const worldPosition = new THREE.Vector3();
      object.getWorldPosition(worldPosition);
      const pos = worldPosition;
      
      // Update rotation state - convert from radians to degrees for display
      const rotation = object.rotation;
      const rotInDegrees = {
        x: THREE.MathUtils.radToDeg(rotation.x),
        y: THREE.MathUtils.radToDeg(rotation.y),
        z: THREE.MathUtils.radToDeg(rotation.z)
      };
      
      console.log('Selected object position:', pos);
      console.log('Selected object rotation:', rotInDegrees);
      setObjectPosition({ x: pos.x, y: pos.y, z: pos.z });
      setInputObjectPosition({ x: pos.x, y: pos.y, z: pos.z });
      setObjectRotation(rotInDegrees);
      setInputObjectRotation(rotInDegrees);
    }
  };

  const handleObjectPositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputObjectPosition(prev => ({ ...prev, [axis]: numValue }));
  };

  const handleObjectRotationChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputObjectRotation(prev => ({ ...prev, [axis]: numValue }));
  };

  const applyObjectPosition = () => {
    if (selectedObject) {
      selectedObject.position.set(inputObjectPosition.x, inputObjectPosition.y, inputObjectPosition.z);
      setObjectPosition(inputObjectPosition);
      
      // Update the input fields to reflect the actual applied position
      const worldPosition = new THREE.Vector3();
      selectedObject.getWorldPosition(worldPosition);
      setInputObjectPosition({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
    }
  };

  const applyObjectRotation = () => {
    if (selectedObject) {
      // Convert degrees to radians for Three.js
      const rotationInRadians = {
        x: THREE.MathUtils.degToRad(inputObjectRotation.x),
        y: THREE.MathUtils.degToRad(inputObjectRotation.y),
        z: THREE.MathUtils.degToRad(inputObjectRotation.z)
      };
      
      selectedObject.rotation.set(rotationInRadians.x, rotationInRadians.y, rotationInRadians.z);
      setObjectRotation(inputObjectRotation);
    }
  };

  const resetObjectPosition = () => {
    if (selectedObject) {
      const defaultPos = { x: 0, y: 0, z: 0 };
      selectedObject.position.set(defaultPos.x, defaultPos.y, defaultPos.z);
      setObjectPosition(defaultPos);
      setInputObjectPosition(defaultPos);
    }
  };

  const resetObjectRotation = () => {
    if (selectedObject) {
      const defaultRot = { x: 0, y: 0, z: 0 };
      selectedObject.rotation.set(0, 0, 0);
      setObjectRotation(defaultRot);
      setInputObjectRotation(defaultRot);
    }
  };

  // Animation control functions
  const getCurrentAnimationData = (): ModelAnimationData | null => {
    if (!selectedObject) return null;
    return animationData[selectedObject.uuid] || null;
  };

  const handlePlayAnimation = () => {
    if (!selectedObject || !selectedAnimation) return;
    playAnimation(selectedObject.uuid, selectedAnimation, isLooping, animationSpeed);
  };

  const handlePauseAnimation = () => {
    if (!selectedObject) return;
    const data = getCurrentAnimationData();
    if (data?.isPlaying) {
      pauseAnimation(selectedObject.uuid);
    } else {
      resumeAnimation(selectedObject.uuid);
    }
  };

  const handleStopAnimation = () => {
    if (!selectedObject) return;
    stopAnimation(selectedObject.uuid);
    setAnimationProgress(0);
  };

  const handleSpeedChange = (speed: number) => {
    setAnimationSpeed(speed);
    if (selectedObject) {
      setAnimationSpeedGlobal(selectedObject.uuid, speed);
    }
  };

  const handleProgressChange = (progress: number) => {
    setAnimationProgress(progress);
    if (selectedObject) {
      setAnimationProgressGlobal(selectedObject.uuid, progress);
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || !selectedObject || !cameraRef.current) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    // Convert screen movement to world movement
    const camera = cameraRef.current;
    const distance = camera.position.distanceTo(selectedObject.position);
    const movementScale = distance * 0.001;
    
    // Calculate movement in camera's local space
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    camera.getWorldDirection(new THREE.Vector3());
    right.crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).normalize();
    up.copy(camera.up).normalize();
    
    const movement = new THREE.Vector3();
    movement.addScaledVector(right, deltaX * movementScale);
    movement.addScaledVector(up, -deltaY * movementScale);
    
    selectedObject.position.add(movement);
    
    // Update position state using world position
    const worldPosition = new THREE.Vector3();
    selectedObject.getWorldPosition(worldPosition);
    setObjectPosition({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
    setInputObjectPosition({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
    
    // Update rotation state - convert from radians to degrees for display
    const rotation = selectedObject.rotation;
    const rotInDegrees = {
      x: THREE.MathUtils.radToDeg(rotation.x),
      y: THREE.MathUtils.radToDeg(rotation.y),
      z: THREE.MathUtils.radToDeg(rotation.z)
    };
    setObjectRotation(rotInDegrees);
    setInputObjectRotation(rotInDegrees);
    
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Update position and rotation when selected object changes
  useEffect(() => {
    if (selectedObject) {
      const worldPosition = new THREE.Vector3();
      selectedObject.getWorldPosition(worldPosition);
      setObjectPosition({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
      setInputObjectPosition({ x: worldPosition.x, y: worldPosition.y, z: worldPosition.z });
      
      // Update rotation state - convert from radians to degrees for display
      const rotation = selectedObject.rotation;
      const rotInDegrees = {
        x: THREE.MathUtils.radToDeg(rotation.x),
        y: THREE.MathUtils.radToDeg(rotation.y),
        z: THREE.MathUtils.radToDeg(rotation.z)
      };
      setObjectRotation(rotInDegrees);
      setInputObjectRotation(rotInDegrees);
      console.log('Selected object rotation:', rotInDegrees);
    }
  }, [selectedObject]);

  // Load game data
  useEffect(() => {
    // Reset scene initialization flag when gameslug changes
    sceneInitializedRef.current = false;
    
    const loadGameData = async () => {
      try {
        // Try to load from gameslug if available, otherwise use test data
        // In Next.js, files in public folder are served from root

        const gameDataPath = `match-history/matches/${gameslug}.json`;
        const data: CombinedGameData = await getJsonFileFromS3(gameDataPath);
        setGameData(data);
      } catch (error) {
        console.error('Failed to load game data:', error);
      }
    };

    loadGameData();
  }, [gameslug]);

  // Update scene manager when game data changes
  useEffect(() => {
    if (sceneManagerRef.current && gameData) {
      sceneManagerRef.current.setGameData(gameData);
    }
  }, [gameData]);

  // Initialize scene when gameData is available and scene is ready
  useEffect(() => {
    if (gameData && sceneRef.current && cameraRef.current && controlsRef.current && !sceneInitializedRef.current) {
      sceneInitializedRef.current = true;
      setIsLoading(true);
      initializeScene(
        sceneRef.current,
        cameraRef.current,
        controlsRef.current,
        setSelectableObjects,
        applyDefaultStatesToAllModels,
        gameData
      ).then(() => {
        console.log('Scene initialization complete');
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error initializing scene:', error);
        setIsLoading(false);
      });
    }
  }, [gameData]);

  // Handle event selection from timeline
  const handleEventSelect = (event: TimelineEvent) => {
    console.log('Event selected:', event);
    setSelectedEvent(event);
    
    if (!sceneManagerRef.current) return;
    
    // Process kill events (buildings, monsters) - these affect scene models
    if (event.eventType === 'kill') {
      console.log('Kill event selected:', event.data);
      sceneManagerRef.current.handleEvent('kill', event.data);
    }
    else if (event.eventType === 'game') {
      console.log('Game event selected:', event.data);
      sceneManagerRef.current.handleEvent('game', event.data);
    }
    // Can extend to other event types as needed
  };

  // Timeline playback effect
  useEffect(() => {
    if (!isPlaying || !gameData) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const gameDuration = gameData.match_data?.gameDuration 
          ? gameData.match_data.gameDuration * 1000 
          : 0;
        if (prev >= gameDuration) {
          setIsPlaying(false);
          return gameDuration;
        }
        return prev + 16; // ~60fps update
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying, gameData]);

  // Keyboard shortcut handler for Ctrl+B to toggle panels and Ctrl+ to toggle timeline
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        setPanelsVisible(prev => !prev);
      }
      if (event.ctrlKey && event.key === 'x') {
        event.preventDefault();
        setTimelineVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Prevent double initialization in StrictMode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Clear any existing content (in case of remount)
    if (mountRef.current.hasChildNodes()) {
      mountRef.current.innerHTML = '';
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor(0x87CEEB); // Sky blue background
    mountRef.current.appendChild(renderer.domElement);

    // Store references for external control
    cameraRef.current = camera;
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Add camera controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true; // Enable smooth camera movement
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    
    // Initial selectable objects list
    const initialObjects = collectSelectableObjects(scene);
    setSelectableObjects(initialObjects);

    // Add focal point dot
    const focalGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const focalMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const focalDot = new THREE.Mesh(focalGeometry, focalMaterial);
    focalDot.position.set(0, 0, 0);
    focalDot.userData.isFocalDot = true;
    focalDot.userData.selectable = false;
    scene.add(focalDot);
    console.log('Focal point dot added to scene');

    // Initialize scene manager
    const loader = new GLTFLoader();
    const sceneManager = new SceneManager({
      scene,
      camera,
      loader,
      controls
    });
    sceneManagerRef.current = sceneManager;
    
    // Note: initializeScene will be called when gameData is available

    // Animation loop

    const animate = (currentTime: number = 0) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update(); // Required for damping
      
      // Calculate delta time for animations
      const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0;
      setLastTime(currentTime);
      
      // Update animation mixers
      updateAnimationMixers(deltaTime);
      
      // Update animation progress for selected object
      if (selectedObject && animationData[selectedObject.uuid]) {
        const progress = getAnimationProgress(selectedObject.uuid);
        setAnimationProgress(progress);
      }
      
      // Update camera position state
      setCameraPosition({
        x: Math.round(camera.position.x * 100) / 100,
        y: Math.round(camera.position.y * 100) / 100,
        z: Math.round(camera.position.z * 100) / 100
      });
      
      // Update focal point state and move the dot
      const target = controls.target;
      setFocalPoint({
        x: Math.round(target.x * 100) / 100,
        y: Math.round(target.y * 100) / 100,
        z: Math.round(target.z * 100) / 100
      });
      focalDot.position.copy(target);
      const canvasAspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    const imageAspect = scene.background && scene.background instanceof THREE.Texture ? (scene.background as THREE.Texture).image?.width / (scene.background as THREE.Texture).image?.height : 1;
    const aspect = imageAspect / canvasAspect;
    if (scene.background && scene.background instanceof THREE.Texture) {
      scene.background.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
      scene.background.repeat.x = aspect > 1 ? 1 / aspect : 1;
      scene.background.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
      scene.background.repeat.y = aspect > 1 ? 1 : aspect;
    }
    renderer.render(scene, camera);
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Add mouse event listeners for object selection and manipulation
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Dispose of Three.js resources
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      // Dispose of scene objects
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      
      // Reset initialization flags
      isInitializedRef.current = false;
      sceneInitializedRef.current = false;
    };
  }, []);

  return (
    <div>
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <div 
            className="loader"
            style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid #ffffff',
              borderRadius: '50%'
            }} 
          />
          <div style={{
            marginTop: '20px',
            color: 'white',
            fontSize: '18px',
            fontFamily: 'monospace'
          }}>
            Loading Scene...
          </div>
        </div>
      )}
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'relative' }} />
      
      {/* Camera Controls Panel */}
      {panelsVisible && (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        minWidth: '250px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#4CAF50' }}>Camera Controls</div>

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Camera Position:</div>
        <div style={{ marginBottom: '5px' }}>X: {cameraPosition.x}</div>
        <div style={{ marginBottom: '5px' }}>Y: {cameraPosition.y}</div>
        <div style={{ marginBottom: '15px' }}>Z: {cameraPosition.z}</div>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Focal Point (Red Dot):</div>
        <div style={{ marginBottom: '5px' }}>X: {focalPoint.x}</div>
        <div style={{ marginBottom: '5px' }}>Y: {focalPoint.y}</div>
        <div style={{ marginBottom: '15px' }}>Z: {focalPoint.z}</div>
        
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Set Camera Position:</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ width: '20px' }}>X:</span>
          <input
            type="number"
            value={inputPosition.x}
            onChange={(e) => handlePositionChange('x', e.target.value)}
            style={{
              width: '80px',
              marginLeft: '5px',
              padding: '2px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ width: '20px' }}>Y:</span>
          <input
            type="number"
            value={inputPosition.y}
            onChange={(e) => handlePositionChange('y', e.target.value)}
            style={{
              width: '80px',
              marginLeft: '5px',
              padding: '2px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ width: '20px' }}>Z:</span>
          <input
            type="number"
            value={inputPosition.z}
            onChange={(e) => handlePositionChange('z', e.target.value)}
            style={{
              width: '80px',
              marginLeft: '5px',
              padding: '2px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
          <button
            onClick={applyPosition}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: 'rgba(0, 150, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Apply
          </button>
          <button
            onClick={resetPosition}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: 'rgba(150, 0, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Set Focal Point:</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ width: '20px' }}>X:</span>
          <input
            type="number"
            value={inputFocalPoint.x}
            onChange={(e) => handleFocalPointChange('x', e.target.value)}
            disabled={lockedAxes.x}
            style={{
              width: '80px',
              marginLeft: '5px',
              padding: '2px',
              fontSize: '12px',
              backgroundColor: lockedAxes.x ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: lockedAxes.x ? 'rgba(255, 255, 255, 0.5)' : 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          />
          <button
            onClick={() => toggleAxisLock('x')}
            style={{
              marginLeft: '5px',
              padding: '2px 6px',
              fontSize: '10px',
              backgroundColor: lockedAxes.x ? 'rgba(255, 0, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            {lockedAxes.x ? 'LOCK' : 'FREE'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ width: '20px' }}>Y:</span>
          <input
            type="number"
            value={inputFocalPoint.y}
            onChange={(e) => handleFocalPointChange('y', e.target.value)}
            disabled={lockedAxes.y}
            style={{
              width: '80px',
              marginLeft: '5px',
              padding: '2px',
              fontSize: '12px',
              backgroundColor: lockedAxes.y ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: lockedAxes.y ? 'rgba(255, 255, 255, 0.5)' : 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          />
          <button
            onClick={() => toggleAxisLock('y')}
            style={{
              marginLeft: '5px',
              padding: '2px 6px',
              fontSize: '10px',
              backgroundColor: lockedAxes.y ? 'rgba(255, 0, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            {lockedAxes.y ? 'LOCK' : 'FREE'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ width: '20px' }}>Z:</span>
          <input
            type="number"
            value={inputFocalPoint.z}
            onChange={(e) => handleFocalPointChange('z', e.target.value)}
            disabled={lockedAxes.z}
            style={{
              width: '80px',
              marginLeft: '5px',
              padding: '2px',
              fontSize: '12px',
              backgroundColor: lockedAxes.z ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: lockedAxes.z ? 'rgba(255, 255, 255, 0.5)' : 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          />
          <button
            onClick={() => toggleAxisLock('z')}
            style={{
              marginLeft: '5px',
              padding: '2px 6px',
              fontSize: '10px',
              backgroundColor: lockedAxes.z ? 'rgba(255, 0, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            {lockedAxes.z ? 'LOCK' : 'FREE'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={applyFocalPoint}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: 'rgba(0, 150, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Apply
          </button>
          <button
            onClick={resetFocalPoint}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: 'rgba(150, 0, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>
      )}

      {/* Object Controls Panel */}
      {panelsVisible && (
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1100,
        minWidth: '250px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#FF9800' }}>Object Controls</div>

        {/* Object Selection Info */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Select Object:</div>
          <select
            value={selectedObject?.uuid || ''}
            onChange={(e) => handleObjectSelection(e.target.value)}
            style={{
              width: '100%',
              padding: '5px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 1)',
              color: 'black',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px'
            }}
          >
            <option value="">-- Select an object --</option>
            {selectableObjects.map((obj) => (
              <option key={obj.uuid} value={obj.uuid}>
                {obj.name || `Object ${obj.uuid.slice(0, 8)}`}
              </option>
            ))}
          </select>
          {selectedObject && (
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '5px' }}>
              Click and drag to move the selected object
              <br />
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => logMaterialInfo(selectedObject, selectedObject.name || 'Selected Object')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(0, 100, 200, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Materials
                </button>
                <button
                  onClick={() => logModelStructure(selectedObject, selectedObject.name || 'Selected Object')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(0, 150, 100, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Structure
                </button>
                <button
                  onClick={() => logModelHierarchy(selectedObject, selectedObject.name || 'Selected Object')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(150, 0, 150, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Hierarchy
                </button>
                <button
                  onClick={() => checkMeshNames(selectedObject, selectedObject.name || 'Selected Object')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(200, 100, 0, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Mesh Names
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Model State Controls */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Global Model States:</div>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={applyDefaultStatesToAllModels}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                backgroundColor: 'rgba(0, 150, 0, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Apply Default to All Models
            </button>
          </div>
        </div>

        {/* Model State Controls - Only for objects with states */}
        {selectedObject && getAvailableStates(selectedObject.name || 'Unnamed').length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Model State:</div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {getAvailableStates(selectedObject.name || 'Unnamed').map(stateName => (
                <button
                  key={stateName}
                  onClick={() => setObjectState(selectedObject.uuid, stateName)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    backgroundColor: objectStates[selectedObject.uuid] === stateName ? 'rgba(0, 150, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  {stateName.charAt(0).toUpperCase() + stateName.slice(1)}
                </button>
              ))}
            </div>
            {objectStates[selectedObject.uuid] && (
              <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '5px' }}>
                Current state: <strong>{objectStates[selectedObject.uuid]}</strong>
              </div>
            )}
            <button
              onClick={() => {
                console.log(`\n=== Mesh and Material Names in ${selectedObject.name} ===`);
                selectedObject.traverse((child) => {
                  if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
                    const meshName = child.name || 'Unnamed';
                    let materialName = '';
                    if (child instanceof THREE.Mesh && child.material) {
                      const materials = Array.isArray(child.material) ? child.material : [child.material];
                      materialName = materials[0]?.name || '';
                    }
                    console.log(`Mesh: "${meshName}" | Material: "${materialName}" | Type: ${child.type}`);
                  }
                });
                console.log('=== End Mesh and Material Names ===\n');
              }}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                backgroundColor: 'rgba(200, 100, 0, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginTop: '5px'
              }}
            >
              Debug: Log Mesh & Material Names
            </button>
          </div>
        )}

        {/* Model Parts Visibility Control */}
        {selectedObject && modelParts[selectedObject.uuid] && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Model Parts:</div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button
                onClick={() => toggleAllPartsVisibility(selectedObject.uuid, true)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  backgroundColor: 'rgba(0, 150, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Show All
              </button>
              <button
                onClick={() => toggleAllPartsVisibility(selectedObject.uuid, false)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  backgroundColor: 'rgba(150, 0, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Hide All
              </button>
            </div>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid rgba(255, 255, 255, 0.3)', 
              borderRadius: '3px',
              padding: '5px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}>
              {modelParts[selectedObject.uuid]
                .sort((a, b) => a.depth - b.depth)
                .map((part) => (
                  <div key={part.uuid} style={{ marginBottom: '2px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      paddingLeft: `${part.depth * 15}px`,
                      fontSize: '11px'
                    }}>
                      <button
                        onClick={() => togglePartExpansion(selectedObject.uuid, part.uuid)}
                        style={{
                          marginRight: '5px',
                          padding: '1px 3px',
                          fontSize: '8px',
                          backgroundColor: 'transparent',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          minWidth: '15px'
                        }}
                      >
                        {expandedParts[selectedObject.uuid]?.[part.uuid] ? '−' : '+'}
                      </button>
                      <span style={{ 
                        marginRight: '5px',
                        color: part.visible ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: part.name.length > 20 ? '10px' : '11px'
                      }}>
                        {part.isMesh ? '📦' : '📁'} {part.materialInfo?.materialName || part.name}
                      </span>
                      <button
                        onClick={() => togglePartVisibility(selectedObject.uuid, part.uuid)}
                        style={{
                          padding: '1px 4px',
                          fontSize: '8px',
                          backgroundColor: part.visible ? 'rgba(0, 150, 0, 0.8)' : 'rgba(150, 0, 0, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        {part.visible ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    {expandedParts[selectedObject.uuid]?.[part.uuid] && (
                      <div style={{ 
                        paddingLeft: `${(part.depth + 1) * 15}px`,
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginTop: '2px'
                      }}>
                        Type: {part.type}
                        {part.originalName && part.originalName !== part.name && (
                          <span><br />Original Name: "{part.originalName}"</span>
                        )}
                        {part.hasGeometry && <span><br />Has Geometry</span>}
                        {part.hasMaterial && <span><br />Has Material</span>}
                        {part.materialInfo && (
                          <span><br />Material: {part.materialInfo.materialName} ({part.materialInfo.materialType})</span>
                        )}
                        {part.childrenCount > 0 && <span><br />Children: {part.childrenCount}</span>}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Object Controls */}
        {selectedObject && (
          <>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Object Position:</div>
            <div style={{ marginBottom: '5px' }}>X: {objectPosition.x}</div>
            <div style={{ marginBottom: '5px' }}>Y: {objectPosition.y}</div>
            <div style={{ marginBottom: '15px' }}>Z: {objectPosition.z}</div>
            
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Set Object Position:</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ width: '20px' }}>X:</span>
              <input
                type="number"
                value={inputObjectPosition.x}
                onChange={(e) => handleObjectPositionChange('x', e.target.value)}
                style={{
                  width: '80px',
                  marginLeft: '5px',
                  padding: '2px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ width: '20px' }}>Y:</span>
              <input
                type="number"
                value={inputObjectPosition.y}
                onChange={(e) => handleObjectPositionChange('y', e.target.value)}
                style={{
                  width: '80px',
                  marginLeft: '5px',
                  padding: '2px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ width: '20px' }}>Z:</span>
              <input
                type="number"
                value={inputObjectPosition.z}
                onChange={(e) => handleObjectPositionChange('z', e.target.value)}
                style={{
                  width: '80px',
                  marginLeft: '5px',
                  padding: '2px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={applyObjectPosition}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(0, 150, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
              <button
                onClick={resetObjectPosition}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(150, 0, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
            
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Object Rotation:</div>
            <div style={{ marginBottom: '5px' }}>X: {objectRotation.x.toFixed(1)}°</div>
            <div style={{ marginBottom: '5px' }}>Y: {objectRotation.y.toFixed(1)}°</div>
            <div style={{ marginBottom: '15px' }}>Z: {objectRotation.z.toFixed(1)}°</div>
            
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Set Object Rotation:</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ width: '20px' }}>X:</span>
              <input
                type="number"
                value={inputObjectRotation.x}
                onChange={(e) => handleObjectRotationChange('x', e.target.value)}
                style={{
                  width: '80px',
                  marginLeft: '5px',
                  padding: '2px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ width: '20px' }}>Y:</span>
              <input
                type="number"
                value={inputObjectRotation.y}
                onChange={(e) => handleObjectRotationChange('y', e.target.value)}
                style={{
                  width: '80px',
                  marginLeft: '5px',
                  padding: '2px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ width: '20px' }}>Z:</span>
              <input
                type="number"
                value={inputObjectRotation.z}
                onChange={(e) => handleObjectRotationChange('z', e.target.value)}
                style={{
                  width: '80px',
                  marginLeft: '5px',
                  padding: '2px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={applyObjectRotation}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(0, 150, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
              <button
                onClick={resetObjectRotation}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(150, 0, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </>
        )}

        {/* Animation States Demo */}
        <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.3)', paddingTop: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#FF9800' }}>Animation States Demo</div>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <button
              onClick={() => {
                if (sceneRef.current) {
                  demonstrateAnimationStates(sceneRef.current);
                }
              }}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'rgba(255, 152, 0, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Show Animation States Info
            </button>
            <button
              onClick={() => {
                if (sceneRef.current) {
                  debugAnimationData(sceneRef.current);
                }
              }}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'rgba(156, 39, 176, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Debug Animations
            </button>
          </div>
          
          {/* Dynamic State Buttons */}
          {selectedObject && (() => {
            const modelType = getModelType(selectedObject.name);
            const objectStates = modelStates[modelType];
            
            if (!objectStates) return null;
            
            const stateEntries = Object.entries(objectStates);
            if (stateEntries.length === 0) return null;
            
            // Color mapping for different states
            const getStateColor = (stateName: string) => {
              switch (stateName.toLowerCase()) {
                case 'default': return 'rgba(76, 175, 80, 0.8)'; // Green
                case 'destroyed': return 'rgba(244, 67, 54, 0.8)'; // Red
                case 'damaged': return 'rgba(255, 152, 0, 0.8)'; // Orange
                case 'under_attack': return 'rgba(255, 193, 7, 0.8)'; // Yellow
                case 'regenerating': return 'rgba(33, 150, 243, 0.8)'; // Blue
                case 'attacking': return 'rgba(156, 39, 176, 0.8)'; // Purple
                case 'spawning': return 'rgba(0, 150, 136, 0.8)'; // Teal
                case 'charging': return 'rgba(255, 87, 34, 0.8)'; // Deep Orange
                case 'feeding': return 'rgba(121, 85, 72, 0.8)'; // Brown
                case 'burrowing': return 'rgba(96, 125, 139, 0.8)'; // Blue Grey
                default: return 'rgba(158, 158, 158, 0.8)'; // Grey
              }
            };
            
            return (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {stateEntries.map(([stateName, stateConfig]) => (
                  <button
                    key={stateName}
                    onClick={() => applyModelState(selectedObject, selectedObject.name, stateName)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      backgroundColor: getStateColor(stateName),
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                    title={stateConfig.animation ? 
                      `${stateName} - Animation: ${stateConfig.animation.name} at ${(stateConfig.animation.progress * 100).toFixed(0)}%` : 
                      `${stateName} - No animation configured`
                    }
                  >
                    {stateName.replace('_', ' ')}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Animation Controls */}
        {selectedObject && getCurrentAnimationData() && getCurrentAnimationData()!.animations.length > 0 && (
          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.3)', paddingTop: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#9C27B0' }}>Animation Controls</div>
            
            {/* Animation Selection */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>Select Animation:</div>
              <select
                value={selectedAnimation}
                onChange={(e) => setSelectedAnimation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  color: 'black',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px'
                }}
              >
                <option value="">-- Select animation --</option>
                {getCurrentAnimationData()!.animations.map((anim) => (
                  <option key={anim.name} value={anim.name}>
                    {anim.name} ({anim.duration.toFixed(2)}s)
                  </option>
                ))}
              </select>
            </div>

            {/* Animation Controls */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handlePlayAnimation}
                disabled={!selectedAnimation}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  backgroundColor: selectedAnimation ? 'rgba(0, 150, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: selectedAnimation ? 'pointer' : 'not-allowed'
                }}
              >
                ▶ Play
              </button>
              <button
                onClick={handlePauseAnimation}
                disabled={!getCurrentAnimationData()?.currentAction}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  backgroundColor: getCurrentAnimationData()?.currentAction ? 'rgba(255, 165, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: getCurrentAnimationData()?.currentAction ? 'pointer' : 'not-allowed'
                }}
              >
                {getCurrentAnimationData()?.isPlaying ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button
                onClick={handleStopAnimation}
                disabled={!getCurrentAnimationData()?.currentAction}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  backgroundColor: getCurrentAnimationData()?.currentAction ? 'rgba(150, 0, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: getCurrentAnimationData()?.currentAction ? 'pointer' : 'not-allowed'
                }}
              >
                ⏹ Stop
              </button>
            </div>

            {/* Loop Toggle */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={isLooping}
                  onChange={(e) => setIsLooping(e.target.checked)}
                  style={{ marginRight: '5px' }}
                />
                Loop Animation
              </label>
            </div>

            {/* Speed Control */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>Speed: {animationSpeed.toFixed(1)}x</div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  outline: 'none',
                  borderRadius: '10px'
                }}
              />
            </div>

            {/* Timeline Scrubber */}
            {getCurrentAnimationData()?.currentAction && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                  Progress: {(animationProgress * 100).toFixed(1)}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={animationProgress}
                  onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                    borderRadius: '10px'
                  }}
                />
              </div>
            )}

            {/* Animation Info */}
            {getCurrentAnimationData() && (
              <div style={{ fontSize: '11px', color: '#ccc', marginTop: '10px' }}>
                <div>Available Animations: {getCurrentAnimationData()!.animations.length}</div>
                {getCurrentAnimationData()!.currentAction && (
                  <div>
                    Current: {getCurrentAnimationData()!.currentAction?.getClip().name || 'None'}
                    {getCurrentAnimationData()!.isLooping && <span> (Looping)</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Timeline Controller */}
      {timelineVisible && (
        <TimelineController
          gameData={gameData}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
          onEventSelect={handleEventSelect}
        />
      )}

      {/* Event Details Panel */}
      {timelineVisible && (
        <EventDetails event={selectedEvent} gameData={gameData} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Game Chat Component */}
      {timelineVisible && (
        <GameChat gameslug={gameslug} onEventSelect={handleEventSelect} />
      )}
    </div>
  );
}

