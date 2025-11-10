import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CombinedGameData } from '@/types/combinedGameData';

// Helper function to convert degrees to radians
const degreesToRadians = (degrees: number): number => {
  return THREE.MathUtils.degToRad(degrees);
};

// Enhanced model state definitions with animation support
export interface ModelStateConfig {
  // Animation configuration (optional)
  animation?: {
    name: string;
    progress: number; // 0-1, where to pose the animation
    loop?: boolean;
    speed?: number;
  };
  // Mesh visibility settings (all other properties are boolean)
  [meshName: string]: boolean | {
    name: string;
    progress: number;
    loop?: boolean;
    speed?: number;
  } | undefined;
}

export const modelStates: { [modelType: string]: { [stateName: string]: ModelStateConfig } } = {
  'Blue Turret': {
    'default': {
      'Stage1': false,
      'Stage2': false,
      'Stage3': false,
      'SRUAP_OrderTurret1_Mat': true,
    },
    'destroyed': {
      'Stage1': false,
      'Stage2': false,
      'Stage3': true,
      'SRUAP_OrderTurret1_Mat': false,
    }
  },
  'Red Turret': {
    'default': {
      'Cloth1': true,
      'Cloth2': true,
      'Stage1': false,
      'Stage2': false,
      'SRUAP_ChaosTurret1_Mat': true,
      'Rubble': false
    },
    'destroyed': {
      'Cloth1': false,
      'Cloth2': false,
      'Stage1': false,
      'Stage2': false,
      'SRUAP_ChaosTurret1_Mat': false,
      'Rubble': true
    },
    'damaged': {
      'Cloth1': true,
      'Cloth2': true,
      'Stage1': true,
      'Stage2': false,
      'SRUAP_ChaosTurret1_Mat': true,
      'Rubble': false,
      animation: {
        name: 'Damage',
        progress: 0.3,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Blue Nexus': {
    'default': {
      'destroyed': false,
      'SRUAP_OrderNexus_Mat': true,
      animation: {
        name: 'Idle1_base',
        progress: 0.1,
        loop: true,
        speed: 0.5
      }
    },
    'destroyed': {
      'destroyed': true,
      'SRUAP_OrderNexus_Mat': false,
      animation: {
        name: 'Death',
        progress: 0.54,
        loop: false,
        speed: 1.0
      }
    },
  },
  'Red Nexus': {
    'default': {
      'destroyed': false,
      'SRUAP_ChaosNexus_Mat': true,
      animation: {
        name: 'Idle',
        progress: 0.0,
        loop: true,
        speed: 0.5
      }
    },
    'destroyed': {
      'Destroyed': true,
      'SRUAP_ChaosNexus_Mat': false,
      animation: {
        name: 'Death',
        progress: 0.54,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Blue Inhibitor': {
    'default': {
      'Destroyed': false,
      'pally_inhib_texture': true,
      animation: {
        name: 'Idle_Normal1',
        progress: 0.0,
        loop: true,
        speed: 0.3
      }
    },
    'destroyed': {
      'Destroyed': true,
      'pally_inhib_texture': false,
      animation: {
        name: 'Death_Base',
        progress: 0.12,
        loop: false,
        speed: 1.0
      }
    },
  },
  'Red Inhibitor': {
    'default': {
      'Destroyed': false,
      'SRUAP_OrderInhibitor_Mat': true,
      animation: {
        name: 'Idle_Normal1',
        progress: 0.0,
        loop: true,
        speed: 0.3
      }
    },
    'destroyed': {
      'SRUAP_ChaosInhibitor_Mat': false,
      'Destroyed': true,
      animation: {
        name: 'Death_Base',
        progress: 0.12,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Baron': {
    'default': {
      'Shield': true,
      'Body': true,
      'Horn': false,
      'Eye': false,
      animation: {
        name: 'Attack2',
        progress: 0.94,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'Shield': true,
      'Body': true,
      'Horn': false,
      'Eye': false,
      animation: {
        name: 'Death',
        progress: 0.76,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Rift Herald': {
    'default': {
      'RiftHerald_Mat': true,
      animation: {
        name: 'Spawn',
        progress: 1.0,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'RiftHerald_Mat': true,
      animation: {
        name: 'Death',
        progress: 0.57,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Void Grub': {
    'default': {
      'Big_Grubby_Mat1': true,
      animation: {
        name: 'IdleVar1',
        progress: 0.0,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'Big_Grubby_Mat1': true,
      animation: {
        name: 'Death1',
        progress: 0.51,
        loop: false,
        speed: 1.0
      }
    },
  },
  'Dragon Air': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Dragon Earth': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Dragon Fire': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Dragon Water': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Dragon Chemtech': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Dragon Hextech': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Dragon Elder': {
    'default': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Run',
        progress: 0.53,
        loop: true,
        speed: 1.0
      }
    },
    'death': {
      'MAT_Dragon': true,
      'Dragon_RG_Default1': true,
      animation: {
        name: 'Death',
        progress: 1.0,
        loop: false,
        speed: 1.0
      }
    }
  },
  'Player': {
    'default': {
      animation: {
        name: 'Laugh',
        progress: 0.0,
        loop: true,
        speed: 0.5
      }
    },
    'death': {
      animation: {
        name: 'Death',
        progress: 0.88,
        loop: false,
        speed: 1.0
      }
    }
  }
};

// Function to get model type from object name
export const getModelType = (objectName: string): string => {
  // Extract model type from object name
  if (objectName.includes('Blue Turret')) {
    return 'Blue Turret';
  }
  if (objectName.includes('Red Turret')) {
    return 'Red Turret';
  }
  if (objectName.includes('Blue Nexus')) {
    return 'Blue Nexus';
  }
  if (objectName.includes('Red Nexus')) {
    return 'Red Nexus';
  }
  if (objectName.includes('Blue Inhibitor')) {
    return 'Blue Inhibitor';
  }
  if (objectName.includes('Red Inhibitor')) {
    return 'Red Inhibitor';
  }
  if (objectName.includes('Baron')) {
    return 'Baron';
  }
  if (objectName.includes('Rift Herald')) {
    return 'Rift Herald';
  }
  if (objectName.includes('Void Grub')) {
    return 'Void Grub';
  }
  if (objectName.startsWith('Player')) {
    return 'Player';
  }
  // Add more model types as needed
  return objectName; // Fallback to full name if no type match
};

// Function to apply a specific state to a model
export const applyModelState = (object: THREE.Object3D, objectName: string, stateName: string = 'default') => {
  const modelType = getModelType(objectName);
  const objectStates = modelStates[modelType as keyof typeof modelStates];
  if (!objectStates || !(stateName in objectStates)) {
    //console.warn(`No state "${stateName}" found for model type "${modelType}"`);
    return;
  }

  const stateConfig = objectStates[stateName] as ModelStateConfig;
  //console.log(`Applying state "${stateName}" to object "${objectName}" (type: "${modelType}")`);
  //console.log('State config:', stateConfig);
  
  // Apply mesh visibility settings
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
      const meshName = child.name || 'Unnamed';
      
      // Get material name for matching
      let materialName = '';
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materialName = materials[0]?.name || '';
      }
      
      // Try to match by material name first, then by mesh name
      let matchedKey = '';
      
      // Check if material name matches any state setting
      if (materialName && stateConfig[materialName] !== undefined) {
        matchedKey = materialName;
      } else if (stateConfig[meshName] !== undefined) {
        matchedKey = meshName;
      } else {
        // Try partial matching on material name
        if (materialName) {
          const matchingKey = Object.keys(stateConfig).find(key => 
            materialName.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(materialName.toLowerCase())
          );
          if (matchingKey) {
            matchedKey = matchingKey;
          }
        }
        
        // Try partial matching on mesh name if material didn't match
        if (!matchedKey) {
          const matchingKey = Object.keys(stateConfig).find(key => 
            meshName.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(meshName.toLowerCase())
          );
          if (matchingKey) {
            matchedKey = matchingKey;
          }
        }
      }
      
      if (matchedKey) {
        const value = stateConfig[matchedKey];
        // Only set visibility if the value is a boolean (not animation config)
        if (typeof value === 'boolean') {
          child.visible = value;
          //console.log(`✓ match "${meshName}" (material: "${materialName}") -> "${matchedKey}" -> ${child.visible ? 'visible' : 'hidden'}`);
        }
      } else {
        // Default behavior: show if not specified
        child.visible = true;
        //console.log(`? No match for "${meshName}" (material: "${materialName}") -> visible (default)`);
      }
    }
  });

  // Apply animation state if configured
  if (stateConfig.animation) {
    const objectId = object.uuid;
    const animationData = getAnimationData(objectId);
    
    if (animationData && animationData.mixer) {
      const animationConfig = stateConfig.animation;
      //console.log(`Applying animation state: ${animationConfig.name} at progress ${animationConfig.progress}`);
      
      // Set the animation pose at the specified progress
      setAnimationPose(objectId, animationConfig.name, animationConfig.progress);
      
      // Configure animation playback if specified
      if (animationConfig.loop !== undefined || animationConfig.speed !== undefined) {
        // Find animation by partial name match
        const foundAnimationName = findAnimationName(animationData, animationConfig.name);
        if (foundAnimationName) {
          const action = animationData.actions[foundAnimationName];
          if (action) {
            if (animationConfig.loop !== undefined) {
              action.setLoop(animationConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce, animationConfig.loop ? Infinity : 1);
            }
            if (animationConfig.speed !== undefined) {
              action.timeScale = animationConfig.speed;
            }
          }
        }
      }
    } else {
      //console.warn(`No animation data found for object ${objectName} (${objectId})`);
    }
  }
};

// Material detection and analysis functions
interface MaterialInfo {
  meshName: string;
  materialIndex: number;
  materialType: string;
  materialName: string;
  properties: {
    color: string;
    transparent: boolean;
    opacity: number;
    metalness: number | string;
    roughness: number | string;
    emissive: string;
    emissiveIntensity: number | string;
    wireframe: boolean | string;
    side: number | string;
    alphaTest: number | string;
    depthTest: boolean | string;
    depthWrite: boolean | string;
  };
  textures: {
    map: string;
    normalMap: string;
    roughnessMap: string;
    metalnessMap: string;
    emissiveMap: string;
    aoMap: string;
    alphaMap: string;
    bumpMap: string;
    displacementMap: string;
    envMap: string;
  };
}

export const detectMaterials = (object: THREE.Object3D) => {
  const materialInfo: MaterialInfo[] = [];
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material, index) => {
        const info = {
          meshName: child.name || 'Unnamed',
          materialIndex: index,
          materialType: material.type,
          materialName: material.name || 'Unnamed',
          properties: {
            color: material.color ? material.color.getHexString() : 'N/A',
            transparent: material.transparent,
            opacity: material.opacity,
            metalness: material.metalness !== undefined ? material.metalness : 'N/A',
            roughness: material.roughness !== undefined ? material.roughness : 'N/A',
            emissive: material.emissive ? material.emissive.getHexString() : 'N/A',
            emissiveIntensity: material.emissiveIntensity !== undefined ? material.emissiveIntensity : 'N/A',
            wireframe: material.wireframe !== undefined ? material.wireframe : 'N/A',
            side: material.side !== undefined ? material.side : 'N/A',
            alphaTest: material.alphaTest !== undefined ? material.alphaTest : 'N/A',
            depthTest: material.depthTest !== undefined ? material.depthTest : 'N/A',
            depthWrite: material.depthWrite !== undefined ? material.depthWrite : 'N/A',
          },
          textures: {
            map: material.map ? 'Has diffuse texture' : 'No diffuse texture',
            normalMap: material.normalMap ? 'Has normal map' : 'No normal map',
            roughnessMap: material.roughnessMap ? 'Has roughness map' : 'No roughness map',
            metalnessMap: material.metalnessMap ? 'Has metalness map' : 'No metalness map',
            emissiveMap: material.emissiveMap ? 'Has emissive map' : 'No emissive map',
            aoMap: material.aoMap ? 'Has ambient occlusion map' : 'No ambient occlusion map',
            alphaMap: material.alphaMap ? 'Has alpha map' : 'No alpha map',
            bumpMap: material.bumpMap ? 'Has bump map' : 'No bump map',
            displacementMap: material.displacementMap ? 'Has displacement map' : 'No displacement map',
            envMap: material.envMap ? 'Has environment map' : 'No environment map',
          }
        };
        
        materialInfo.push(info);
      });
    }
  });
  
  return materialInfo;
};

export const logMaterialInfo = (object: THREE.Object3D, objectName: string = 'Object') => {
  console.log(`\n=== Material Analysis for ${objectName} ===`);
  const materials = detectMaterials(object);
  
  if (materials.length === 0) {
    console.log('No materials found in this object.');
    return;
  }
  
  materials.forEach((info, index) => {
    console.log(`\nMaterial ${index + 1}:`);
    console.log(`  Mesh: ${info.meshName}`);
    console.log(`  Type: ${info.materialType}`);
    console.log(`  Name: ${info.materialName}`);
    console.log(`  Properties:`, info.properties);
    console.log(`  Textures:`, info.textures);
  });
  
  console.log(`\nTotal materials found: ${materials.length}`);
  console.log('=== End Material Analysis ===\n');
};

// Model structure and parts detection functions
interface PartInfo {
  name: string;
  type: string;
  uuid: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  visible: boolean;
  userData: Record<string, unknown>;
  isMesh: boolean;
  isGroup: boolean;
  isScene: boolean;
  isLight: boolean;
  isCamera: boolean;
  geometry: {
    type: string | undefined;
    vertices: number;
    faces: number;
  } | null;
  material: {
    hasMaterial: boolean;
    materialCount: number;
    materialTypes: string[];
  } | null;
  childrenCount: number;
  depth: number;
}

export const detectModelParts = (object: THREE.Object3D) => {
  const partsInfo: PartInfo[] = [];
  
  object.traverse((child) => {
    const info = {
      name: child.name || 'Unnamed',
      type: child.type,
      uuid: child.uuid,
      position: {
        x: child.position.x,
        y: child.position.y,
        z: child.position.z
      },
      rotation: {
        x: THREE.MathUtils.radToDeg(child.rotation.x),
        y: THREE.MathUtils.radToDeg(child.rotation.y),
        z: THREE.MathUtils.radToDeg(child.rotation.z)
      },
      scale: {
        x: child.scale.x,
        y: child.scale.y,
        z: child.scale.z
      },
      visible: child.visible,
      userData: child.userData,
      isMesh: child instanceof THREE.Mesh,
      isGroup: child instanceof THREE.Group,
      isScene: child instanceof THREE.Scene,
      isLight: child instanceof THREE.Light,
      isCamera: child instanceof THREE.Camera,
      geometry: child instanceof THREE.Mesh ? {
        type: child.geometry?.type,
        vertices: child.geometry?.attributes?.position?.count || 0,
        faces: child.geometry?.index ? child.geometry.index.count / 3 : 0
      } : null,
      material: child instanceof THREE.Mesh ? {
        hasMaterial: !!child.material,
        materialCount: Array.isArray(child.material) ? child.material.length : (child.material ? 1 : 0),
        materialTypes: child.material ? 
          (Array.isArray(child.material) ? 
            child.material.map(m => m.type) : 
            [child.material.type]) : []
      } : null,
      childrenCount: child.children.length,
      depth: 0 // Will be calculated
    };
    
    // Calculate depth in hierarchy
    let depth = 0;
    let parent = child.parent;
    while (parent) {
      depth++;
      parent = parent.parent;
    }
    info.depth = depth;
    
    partsInfo.push(info);
  });
  
  return partsInfo;
};

export const logModelStructure = (object: THREE.Object3D, objectName: string = 'Object') => {
  console.log(`\n=== Model Structure Analysis for ${objectName} ===`);
  const parts = detectModelParts(object);
  
  if (parts.length === 0) {
    console.log('No parts found in this object.');
    return;
  }
  
  // Group by type
  const typeGroups: { [key: string]: PartInfo[] } = {};
  parts.forEach(part => {
    if (!typeGroups[part.type]) {
      typeGroups[part.type] = [];
    }
    typeGroups[part.type].push(part);
  });
  
  console.log(`\nTotal parts found: ${parts.length}`);
  console.log(`Object types: ${Object.keys(typeGroups).join(', ')}`);
  
  // Log by hierarchy depth
  const maxDepth = Math.max(...parts.map(p => p.depth));
  for (let depth = 0; depth <= maxDepth; depth++) {
    const partsAtDepth = parts.filter(p => p.depth === depth);
    if (partsAtDepth.length > 0) {
      console.log(`\n--- Depth ${depth} (${partsAtDepth.length} objects) ---`);
      partsAtDepth.forEach(part => {
        const indent = '  '.repeat(depth);
        console.log(`${indent}${part.name} (${part.type})`);
        if (part.isMesh && part.geometry) {
          console.log(`${indent}  Geometry: ${part.geometry.type}, ${part.geometry.vertices} vertices, ${part.geometry.faces} faces`);
        }
        if (part.material && part.material.hasMaterial) {
          console.log(`${indent}  Materials: ${part.material.materialCount} (${part.material.materialTypes.join(', ')})`);
        }
        if (part.childrenCount > 0) {
          console.log(`${indent}  Children: ${part.childrenCount}`);
        }
      });
    }
  }
  
  // Summary by type
  console.log(`\n--- Summary by Type ---`);
  Object.entries(typeGroups).forEach(([type, typeParts]) => {
    console.log(`${type}: ${typeParts.length} objects`);
    if (type === 'Mesh') {
      const totalVertices = typeParts.reduce((sum, part) => sum + (part.geometry?.vertices || 0), 0);
      const totalFaces = typeParts.reduce((sum, part) => sum + (part.geometry?.faces || 0), 0);
      console.log(`  Total vertices: ${totalVertices}`);
      console.log(`  Total faces: ${totalFaces}`);
    }
  });
  
  console.log('=== End Model Structure Analysis ===\n');
  
  return parts;
};

interface HierarchyNode {
  name: string;
  type: string;
  uuid: string;
  depth: number;
  children: HierarchyNode[];
  hasGeometry: boolean;
  hasMaterial: boolean;
  isSelectable: boolean;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  visible: boolean;
}

export const getModelHierarchy = (object: THREE.Object3D): HierarchyNode => {
  const buildHierarchy = (obj: THREE.Object3D, depth: number = 0): HierarchyNode => {
    const node: HierarchyNode = {
      name: obj.name || 'Unnamed',
      type: obj.type,
      uuid: obj.uuid,
      depth: depth,
      children: [],
      hasGeometry: obj instanceof THREE.Mesh && !!obj.geometry,
      hasMaterial: obj instanceof THREE.Mesh && !!obj.material,
      isSelectable: obj.userData.selectable === true,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: { 
        x: THREE.MathUtils.radToDeg(obj.rotation.x), 
        y: THREE.MathUtils.radToDeg(obj.rotation.y), 
        z: THREE.MathUtils.radToDeg(obj.rotation.z) 
      },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      visible: obj.visible
    };
    
    obj.children.forEach(child => {
      node.children.push(buildHierarchy(child, depth + 1));
    });
    
    return node;
  };
  
  return buildHierarchy(object);
};

export const logModelHierarchy = (object: THREE.Object3D, objectName: string = 'Object') => {
  console.log(`\n=== Model Hierarchy for ${objectName} ===`);
  const hierarchy = getModelHierarchy(object);
  
  const printHierarchy = (node: HierarchyNode, indent: string = '') => {
    const icon = node.hasGeometry ? '📦' : node.children.length > 0 ? '📁' : '📄';
    console.log(`${indent}${icon} ${node.name} (${node.type})`);
    
    if (node.hasGeometry) {
      console.log(`${indent}  🎨 Has Geometry & Material`);
    }
    if (node.isSelectable) {
      console.log(`${indent}  ✨ Selectable`);
    }
    if (!node.visible) {
      console.log(`${indent}  👁️ Hidden`);
    }
    
    node.children.forEach((child) => {
      printHierarchy(child, indent + '  ');
    });
  };
  
  printHierarchy(hierarchy);
  console.log('=== End Model Hierarchy ===\n');
};

// Function to check mesh names in a model
interface UnnamedMeshInfo {
  uuid: string;
  type: string;
  hasGeometry: boolean;
  hasMaterial: boolean;
  geometryType: string | undefined;
  materialType: string | undefined;
}

export const checkMeshNames = (object: THREE.Object3D, objectName: string = 'Object') => {
  console.log(`\n=== Mesh Names Check for ${objectName} ===`);
  const meshNames: string[] = [];
  const unnamedMeshes: UnnamedMeshInfo[] = [];
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.name && child.name.trim() !== '') {
        meshNames.push(child.name);
      } else {
        unnamedMeshes.push({
          uuid: child.uuid,
          type: child.type,
          hasGeometry: !!child.geometry,
          hasMaterial: !!child.material,
          geometryType: child.geometry?.type,
          materialType: child.material?.type
        });
      }
    }
  });
  
  console.log(`Total meshes found: ${meshNames.length + unnamedMeshes.length}`);
  console.log(`Named meshes: ${meshNames.length}`);
  console.log(`Unnamed meshes: ${unnamedMeshes.length}`);
  
  if (meshNames.length > 0) {
    console.log('\nNamed meshes:');
    meshNames.forEach((name, index) => {
      console.log(`  ${index + 1}. "${name}"`);
    });
  }
  
  if (unnamedMeshes.length > 0) {
    console.log('\nUnnamed meshes:');
    unnamedMeshes.forEach((mesh, index) => {
      console.log(`  ${index + 1}. UUID: ${mesh.uuid.slice(0, 8)}...`);
      console.log(`     Type: ${mesh.type}`);
      console.log(`     Geometry: ${mesh.geometryType || 'None'}`);
      console.log(`     Material: ${mesh.materialType || 'None'}`);
    });
  }
  
  console.log('=== End Mesh Names Check ===\n');
  
  return {
    namedMeshes: meshNames,
    unnamedMeshes: unnamedMeshes,
    totalMeshes: meshNames.length + unnamedMeshes.length
  };
};

// Function to collect selectable objects from scene
export const collectSelectableObjects = (scene: THREE.Scene) => {
  const objects: THREE.Object3D[] = [];
  scene.children.forEach((child) => {
    if (child.userData.selectable === true && !child.userData.isFocalDot) {
      objects.push(child);
    }
  });
  return objects;
};

// Animation system types and interfaces
export interface AnimationInfo {
  name: string;
  duration: number;
  tracks: number;
}

export interface ModelAnimationData {
  objectId: string;
  objectName: string;
  animations: AnimationInfo[];
  mixer: THREE.AnimationMixer | null;
  actions: { [animationName: string]: THREE.AnimationAction };
  currentAction: THREE.AnimationAction | null;
  isPlaying: boolean;
  isLooping: boolean;
  playbackSpeed: number;
}

// Global animation data storage
export const animationData: { [objectId: string]: ModelAnimationData } = {};

// GLTF loader result type
interface GLTFResult {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
}

// Function to detect animations in a GLTF model
export const detectAnimations = (gltf: GLTFResult, _objectName: string): AnimationInfo[] => {
  const animations: AnimationInfo[] = [];
  
  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((animation: THREE.AnimationClip) => {
      animations.push({
        name: animation.name || 'Unnamed Animation',
        duration: animation.duration,
        tracks: animation.tracks.length
      });
    });
  }
  
  //console.log(`Found ${animations.length} animations in ${objectName}:`, animations);
  return animations;
};

// Function to setup animation mixer for an object
export const setupAnimationMixer = (object: THREE.Object3D, gltf: GLTFResult, objectName: string): ModelAnimationData => {
  const objectId = object.uuid;
  const animations = detectAnimations(gltf, objectName);
  
  let mixer: THREE.AnimationMixer | null = null;
  const actions: { [animationName: string]: THREE.AnimationAction } = {};
  
  if (animations.length > 0) {
    mixer = new THREE.AnimationMixer(object);
    
    // Create actions for each animation
    animations.forEach(animationInfo => {
      const clip = gltf.animations.find((clip: THREE.AnimationClip) => clip.name === animationInfo.name);
      if (clip) {
        // Clone the animation clip for this specific object instance
        const clonedClip = clip.clone();
        const action = mixer!.clipAction(clonedClip);
        action.setLoop(THREE.LoopOnce, 1);
        actions[animationInfo.name] = action;
      }
    });
  }
  
  const modelAnimationData: ModelAnimationData = {
    objectId,
    objectName,
    animations,
    mixer,
    actions,
    currentAction: null,
    isPlaying: false,
    isLooping: false,
    playbackSpeed: 1.0
  };
  
  // Store globally
  animationData[objectId] = modelAnimationData;
  
  return modelAnimationData;
};

// Function to play an animation
export const playAnimation = (objectId: string, animationName: string, loop: boolean = false, speed: number = 1.0) => {
  const data = animationData[objectId];
  if (!data || !data.mixer) {
    //console.warn(`No animation data found for object ${objectId}`);
    return;
  }
  
  // Find animation by partial name match
  const foundAnimationName = findAnimationName(data, animationName);
  if (!foundAnimationName) {
    //console.warn(`Animation "${animationName}" not found for object ${data.objectName}`);
    return;
  }
  
  const action = data.actions[foundAnimationName];
  if (!action) {
    //console.warn(`Animation action "${foundAnimationName}" not found for object ${data.objectName}`);
    return;
  }
  
  // Stop current action if playing
  if (data.currentAction) {
    data.currentAction.stop();
  }
  
  // Set up new action
  action.reset();
  action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
  action.timeScale = speed;
  action.play();
  
  data.currentAction = action;
  data.isPlaying = true;
  data.isLooping = loop;
  data.playbackSpeed = speed;
  
  //console.log(`Playing animation "${animationName}" on ${data.objectName} (loop: ${loop}, speed: ${speed})`);
};

// Function to pause animation
export const pauseAnimation = (objectId: string) => {
  const data = animationData[objectId];
  if (!data || !data.currentAction) return;
  
  data.currentAction.paused = true;
  data.isPlaying = false;
  //console.log(`Paused animation on ${data.objectName}`);
};

// Function to resume animation
export const resumeAnimation = (objectId: string) => {
  const data = animationData[objectId];
  if (!data || !data.currentAction) return;
  
  data.currentAction.paused = false;
  data.isPlaying = true;
  //console.log(`Resumed animation on ${data.objectName}`);
};

// Function to stop animation
export const stopAnimation = (objectId: string) => {
  const data = animationData[objectId];
  if (!data || !data.currentAction) return;
  
  data.currentAction.stop();
  data.currentAction = null;
  data.isPlaying = false;
  //console.log(`Stopped animation on ${data.objectName}`);
};

// Function to set animation speed
export const setAnimationSpeed = (objectId: string, speed: number) => {
  const data = animationData[objectId];
  if (!data || !data.currentAction) return;
  
  data.currentAction.timeScale = speed;
  data.playbackSpeed = speed;
  //console.log(`Set animation speed to ${speed} for ${data.objectName}`);
};

// Function to get animation progress (0-1)
export const getAnimationProgress = (objectId: string): number => {
  const data = animationData[objectId];
  if (!data || !data.currentAction) return 0;
  
  return data.currentAction.time / data.currentAction.getClip().duration;
};

// Function to set animation progress (0-1)
export const setAnimationProgress = (objectId: string, progress: number) => {
  const data = animationData[objectId];
  if (!data || !data.currentAction) return;
  
  const duration = data.currentAction.getClip().duration;
  data.currentAction.time = progress * duration;
  //console.log(`Set animation progress to ${progress} for ${data.objectName}`);
};

// Helper function to get animation data for an object
export const getAnimationData = (objectId: string): ModelAnimationData | null => {
  return animationData[objectId] || null;
};

// Helper function to find animation name by partial match (case-insensitive)
// First tries exact match, then partial match
export const findAnimationName = (data: ModelAnimationData, searchName: string): string | null => {
  const searchLower = searchName.toLowerCase();
  
  // First try exact match (case-insensitive)
  const exactMatch = data.animations.find(anim => anim.name.toLowerCase() === searchLower);
  if (exactMatch) {
    return exactMatch.name;
  }
  
  // Then try partial match (contains the search term)
  const partialMatch = data.animations.find(anim => 
    anim.name.toLowerCase().includes(searchLower) || 
    searchLower.includes(anim.name.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch.name;
  }
  
  return null;
};

// Function to set an animation pose at a specific progress point
export const setAnimationPose = (objectId: string, animationName: string, progress: number) => {
  const data = animationData[objectId];
  if (!data || !data.mixer) {
    //console.warn(`No animation data found for object ${objectId}`);
    return;
  }
  
  // Find animation by partial name match
  const foundAnimationName = findAnimationName(data, animationName);
  if (!foundAnimationName) {
    //console.warn(`Animation "${animationName}" not found for object ${data.objectName}`);
    console.log(`Available animations:`, Object.keys(data.actions));
    return;
  }
  
  const action = data.actions[foundAnimationName];
  if (!action) {
    //console.warn(`Animation action "${foundAnimationName}" not found for object ${data.objectName}`);
    return;
  }
  
  // Stop current action if playing
  if (data.currentAction && data.currentAction !== action) {
    data.currentAction.stop();
  }
  
  // Set up the action for posing
  action.reset();
  action.setLoop(THREE.LoopOnce, 1);
  action.timeScale = 1.0;
  
  // Set the animation to the specific progress point
  const duration = action.getClip().duration;
  action.time = progress * duration;
  
  // Enable the action without playing it (just pose it)
  action.enabled = true;
  action.weight = 1.0;
  
  // Play the action briefly to apply the pose, then stop it
  action.play();
  action.paused = true; // Pause immediately to hold the pose
  
  data.currentAction = action;
  data.isPlaying = false; // We're posing, not playing
  
  //console.log(`Set animation pose "${animationName}" to progress ${progress} (${(progress * 100).toFixed(1)}%) for ${data.objectName}`);
};

// Function to get available animation names for an object
export const getAvailableAnimations = (objectId: string): string[] => {
  const data = animationData[objectId];
  if (!data) return [];
  
  return data.animations.map(anim => anim.name);
};

// Function to check if an object has a specific animation (supports partial matching)
export const hasAnimation = (objectId: string, animationName: string): boolean => {
  const data = animationData[objectId];
  if (!data) return false;
  
  return findAnimationName(data, animationName) !== null;
};

// Function to debug animation data for all objects
export const debugAnimationData = (scene: THREE.Scene) => {
  console.log('=== Animation Data Debug ===');
  
  const objects = collectSelectableObjects(scene);
  
  objects.forEach(object => {
    const objectId = object.uuid;
    const data = animationData[objectId];
    
    console.log(`\nObject: ${object.name} (${objectId})`);
    
    if (data) {
      console.log(`  Animations: ${data.animations.length}`);
      data.animations.forEach(anim => {
        console.log(`    - ${anim.name} (${anim.duration.toFixed(2)}s, ${anim.tracks} tracks)`);
      });
      
      console.log(`  Actions: ${Object.keys(data.actions).length}`);
      Object.keys(data.actions).forEach(actionName => {
        console.log(`    - ${actionName}`);
      });
      
      if (data.currentAction) {
        console.log(`  Current Action: ${data.currentAction.getClip().name}`);
        console.log(`  Is Playing: ${data.isPlaying}`);
        console.log(`  Progress: ${(getAnimationProgress(objectId) * 100).toFixed(1)}%`);
      }
    } else {
      console.log('  No animation data found');
    }
  });
};

// Demonstration function showing how to use the enhanced model states
export const demonstrateAnimationStates = (scene: THREE.Scene) => {
  //console.log('=== Animation States Demonstration ===');
  
  // First debug the actual animation data
  debugAnimationData(scene);
  
  // Get all selectable objects
  const objects = collectSelectableObjects(scene);
  
  objects.forEach(object => {
    const modelType = getModelType(object.name);
    const objectStates = modelStates[modelType];
    
    if (objectStates) {
      //console.log(`\nModel: ${object.name} (Type: ${modelType})`);
      //console.log('Available states:', Object.keys(objectStates));
      
      // Show animation configuration for each state
      Object.entries(objectStates).forEach(([_stateName, stateConfig]) => {
        if (stateConfig.animation) {
          //console.log(`  ${_stateName}: ${stateConfig.animation.name} at ${(stateConfig.animation.progress * 100).toFixed(0)}% progress`);
        } else {
          //console.log(`  ${_stateName}: No animation configured`);
        }
      });
    }
  });
  /*
  console.log('\n=== Usage Examples ===');
  console.log('// Apply a state with animation pose:');
  console.log('applyModelState(object, "Blue Turret Bot Nexus", "damaged");');
  console.log('// This will set mesh visibility AND pose the "Damage" animation at 50% progress');
  console.log('');
  console.log('// Apply a looping animation state:');
  console.log('applyModelState(object, "Blue Nexus", "under_attack");');
  console.log('// This will pose the "UnderAttack" animation at 20% progress and set it to loop');
  console.log('');
  console.log('// Apply a static pose:');
  console.log('applyModelState(object, "Baron", "spawning");');
  console.log('// This will pose the "Spawn" animation at 80% progress (near completion)');
  */
};

// Function to update all animation mixers (call this in the animation loop)
export const updateAnimationMixers = (deltaTime: number) => {
  Object.values(animationData).forEach(data => {
    if (data.mixer) {
      data.mixer.update(deltaTime);
    }
  });
};

// Model configuration interface
interface ModelConfig {
  path?: string;
  url?: string;
  name: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  instances?: Array<{
    name: string;
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
  }>;
}

// Model configurations
const modelConfigs: ModelConfig[] = [
  {
    path: '/models/structures/blueNexus.glb',
    name: 'Blue Nexus',
    position: { x: -1504, y: 97, z: 1593 },
    rotation: { x: 0, y: 45, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/structures/blueTurret.glb',
    name: 'Blue Turret',
    instances: [
      { name: 'Blue Turret Bot Nexus', position: { x: -2138, y: 97, z: 1708 }, rotation: { x: 0, y: -51, z: 0 } },
      { name: 'Blue Turret Top Nexus', position: { x: -1692, y: 97, z: 2196 }, rotation: { x: 0, y: -25, z: 0 } },
      { name: 'Blue Turret Top Tier 3', position: { x: -1117.42, y: 97, z: 4198.99 }, rotation: { x: 0, y: 0, z: 0 } },
      { name: 'Blue Turret Top Tier 2', position: { x: -1462.09, y: 46, z: 6621.91 }, rotation: { x: 0, y: 0, z: 0 } },
      { name: 'Blue Turret Top Tier 1', position: { x: -935.32, y: 46, z: 10361.62 }, rotation: { x: 0, y: 0, z: 0 } },
      { name: 'Blue Turret Mid Tier 3', position: { x: -3614.02, y: 97, z: 3636.62 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Blue Turret Mid Tier 2', position: { x: -4996.09, y: 46, z: 4756.26 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Blue Turret Mid Tier 1', position: { x: -5794.45, y: 46, z: 6329.94 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Blue Turret Bot Tier 3', position: { x: -4241.69, y: 97, z: 1178.12 }, rotation: { x: 0, y: -90, z: 0 } },
      { name: 'Blue Turret Bot Tier 2', position: { x: -6875.86, y: 46, z: 1414.89 }, rotation: { x: 0, y: -90, z: 0 } },
      { name: 'Blue Turret Bot Tier 1', position: { x: -10461.19, y: 46, z: 952.23 }, rotation: { x: 0, y: -90, z: 0 } }
    ],
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/structures/blueInhibitor.glb',
    name: 'Blue Inhibitor',
    instances: [
      { name: 'Blue Inhibitor Top', position: { x: -1121.24, y: 99, z: 3507.74 }, rotation: { x: 0, y: 90, z: 0 } },
      { name: 'Blue Inhibitor Mid', position: { x: -3145.19, y: 99, z: 3145.16 }, rotation: { x: 0, y: 45, z: 0 } },
      { name: 'Blue Inhibitor Bot', position: { x: -3419.45, y: 99, z: 1171.82 }, rotation: { x: 0, y: 0, z: 0 } }
    ],
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/structures/redNexus.glb',
    name: 'Red Nexus',
    position: { x: -13195.54, y: 97, z: 13171.67 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/structures/redTurret.glb',
    name: 'Red Turret',
    instances: [
      { name: 'Red Turret Top Nexus', position: { x: -12564.02, y: 97, z: 13031.35 }, rotation: { x: 0, y: -11, z: 0 } },
      { name: 'Red Turret Bot Nexus', position: { x: -13009.34, y: 97, z: 12557.67 }, rotation: { x: 0, y: 11, z: 0 } },
      { name: 'Red Turret Top Tier 3', position: { x: -10433.69, y: 97, z: 13590.76 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Red Turret Top Tier 2', position: { x: -7888.34, y: 46, z: 13336.03 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Red Turret Top Tier 1', position: { x: -4274.11, y: 46, z: 13809.37 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Red Turret Bot Tier 3', position: { x: -13579.13, y: 97, z: 10509.02 }, rotation: { x: 0, y: 45, z: 0 } },
      { name: 'Red Turret Bot Tier 2', position: { x: -13281.14, y: 46, z: 8162.93 }, rotation: { x: 0, y: 45, z: 0 } },
      { name: 'Red Turret Bot Tier 1', position: { x: -13818.14, y: 46, z: 4439.92 }, rotation: { x: 0, y: 45, z: 0 } },
      { name: 'Red Turret Mid Tier 3', position: { x: -11086.15, y: 97, z: 11142.61 }, rotation: { x: 0, y: 0, z: 0 } },
      { name: 'Red Turret Mid Tier 2', position: { x: -9731.42, y: 46, z: 10050.02 }, rotation: { x: 0, y: 0, z: 0 } },
      { name: 'Red Turret Mid Tier 1', position: { x: -8908.26, y: 46, z: 8452.63 }, rotation: { x: 0, y: 0, z: 0 } }
    ],
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/structures/redInhibitor.glb',
    name: 'Red Inhibitor',
    instances: [
      { name: 'Red Inhibitor Top', position: { x: -11211.09, y: 97, z: 13597.38 }, rotation: { x: 0, y: -90, z: 0 } },
      { name: 'Red Inhibitor Mid', position: { x: -11552.56, y: 97, z: 11597.78 }, rotation: { x: 0, y: -45, z: 0 } },
      { name: 'Red Inhibitor Bot', position: { x: -13548.15, y: 97, z: 11248.27 }, rotation: { x: 0, y: 0, z: 0 } }
    ],
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/baron.glb',
    name: 'Baron',
    position: { x: -4906.65, y: 10, z: 10361.79 },
    rotation: { x: 0, y: 145, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/rift_herald.glb',
    name: 'Rift Herald',
    position: { x: -4816.65, y: -70, z: 10162.79 },
    rotation: { x: 0, y: 145, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/voidgrub.glb',
    name: 'Void Grub',
    instances: [
      { name: 'Void Grub 1', position: { x: -4745.65, y: -75, z: 10143.79 }, rotation: { x: 0, y: -37, z: 0 } },
      { name: 'Void Grub 2', position: { x: -4843.62, y: -75, z: 10602.19 }, rotation: { x: 0, y: -160, z: 0 } },
      { name: 'Void Grub 3', position: { x: -5163.17, y: -75, z: 10331.88 }, rotation: { x: 0, y: 75, z: 0 } }
    ],
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_air.glb',
    name: 'Dragon Air',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_earth.glb',
    name: 'Dragon Earth',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_fire.glb',
    name: 'Dragon Fire',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_water.glb',
    name: 'Dragon Water',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_chemtech.glb',
    name: 'Dragon Chemtech',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_hextech.glb',
    name: 'Dragon Hextech',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/dragon_elder.glb',
    name: 'Dragon Elder',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '/models/neutral objectives/atakhan.glb',
    name: 'Atakhan',
    position: { x: -9766.85, y: -75, z: 4342.72 },
    rotation: { x: 0, y: -37, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
];

// Helper function to check if a model name is a monster
const isMonster = (modelName: string): boolean => {
  const monsterNames = [
    'Baron',
    'Rift Herald',
    'Void Grub',
    'Dragon Air',
    'Dragon Earth',
    'Dragon Fire',
    'Dragon Water',
    'Dragon Chemtech',
    'Dragon Hextech',
    'Dragon Elder',
    'Atakhan'
  ];
  
  return monsterNames.some(name => modelName.includes(name));
};

// Helper function to check if a model name is a player
const isPlayer = (modelName: string): boolean => {
  return modelName.startsWith('Player');
};

// Helper function to recursively set visibility on an object and all its children
const setObjectVisibility = (object: THREE.Object3D, visible: boolean): void => {
  object.visible = visible;
  object.traverse((child) => {
    child.visible = visible;
  });
};

// Generic model loading function
const loadModel = (
  config: ModelConfig,
  scene: THREE.Scene,
  loader: GLTFLoader,
  setSelectableObjects: (objects: THREE.Object3D[]) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    loader.load(
      config.url || config.path || '',
      (gltf) => {
      console.log(`Model loaded successfully: ${config.name}`, gltf);
      
      if (config.instances) {
        // Handle multiple instances
        config.instances.forEach((instance) => {
          const clone = SkeletonUtils.clone(gltf.scene);
          clone.name = instance.name;
          clone.userData.selectable = true;
          
          // Set position and rotation
          clone.position.set(instance.position.x, instance.position.y, instance.position.z);
          if (instance.rotation) {
            clone.rotation.set(
              degreesToRadians(instance.rotation.x),
              degreesToRadians(instance.rotation.y),
              degreesToRadians(instance.rotation.z)
            );
          }
          
          // Set scale
          if (config.scale) {
            clone.scale.set(config.scale.x, config.scale.y, config.scale.z);
          }
          
          // Make meshes non-selectable
          clone.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.userData.selectable = false;
            }
          });
          
          scene.add(clone);
          
          // Setup animation mixer for this specific clone
          setupAnimationMixer(clone, gltf, instance.name);
          
          // Apply default state
          applyModelState(clone, instance.name);
          
          // Hide monsters at the start (after applying state to ensure it persists)
          if (isMonster(instance.name)) {
            setObjectVisibility(clone, false);
            console.log(`Hiding monster: ${instance.name}`);
          }
          
          // Hide players at the start (after applying state to ensure it persists)
          if (isPlayer(instance.name)) {
            setObjectVisibility(clone, false);
            console.log(`Hiding player: ${instance.name}`);
          }
        });
      } else {
        // Handle single instance
        const model = gltf.scene;
        model.name = config.name;
        model.userData.selectable = true;
        
        // Set position, rotation, and scale
        if (config.position) {
          model.position.set(config.position.x, config.position.y, config.position.z);
        }
        if (config.rotation) {
          model.rotation.set(
            degreesToRadians(config.rotation.x),
            degreesToRadians(config.rotation.y),
            degreesToRadians(config.rotation.z)
          );
        }
        if (config.scale) {
          model.scale.set(config.scale.x, config.scale.y, config.scale.z);
        }
        
        // Make meshes non-selectable
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.selectable = false;
          }
        });
        
        scene.add(model);
        
        // Setup animation mixer
        setupAnimationMixer(model, gltf, config.name);
        
        // Apply default state
        applyModelState(model, config.name);
        
        // Hide monsters at the start (after applying state to ensure it persists)
        if (isMonster(config.name)) {
          setObjectVisibility(model, false);
          console.log(`Hiding monster: ${config.name}`);
        }
        
        // Hide players at the start (after applying state to ensure it persists)
        if (isPlayer(config.name)) {
          setObjectVisibility(model, false);
          console.log(`Hiding player: ${config.name}`);
        }
      }
      
      // Update selectable objects list
      const objects = collectSelectableObjects(scene);
      setSelectableObjects(objects);
      resolve();
    },
    (progress) => {
      console.log(`Loading progress for ${config.name}:`, (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error(`Error loading model ${config.name}:`, error);
      reject(error);
    }
  );
  });
};

// Main scene initialization function
export const initializeScene = async (
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  setSelectableObjects: (objects: THREE.Object3D[]) => void,
  applyDefaultStatesToAllModels: () => void,
  gameData: CombinedGameData | null
): Promise<void> => {
  const loader = new GLTFLoader();
  const awsS3Url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_ASSETS}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`;
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  
  // Create skybox using BoxGeometry
  const texture = cubeTextureLoader.load([
    '/models/skybox/default(pos-x).png',
    '/models/skybox/default(neg-x).png',
    '/models/skybox/default(pos-y).png',
    '/models/skybox/default(neg-y).png',
    '/models/skybox/default(pos-z).png',
    '/models/skybox/default(neg-z).png',
  ]);
  scene.background = texture;
  //console.log('Skybox loaded successfully:', texture);

  // Collect all loading promises
  const loadingPromises: Promise<void>[] = [];

  // Load all models using the consolidated approach
  modelConfigs.forEach((config) => {
    loadingPromises.push(loadModel(config, scene, loader, setSelectableObjects));
  });
  
  // Load player models
  if (gameData) {
    gameData.match_data.participants.forEach((participant) => {
      loadingPromises.push(loadModel({
        url: `${awsS3Url}/models/champions/${participant.championName.toLowerCase()}.glb`,
        name: `Player ${participant.participantId}`,
        rotation: { x: 0, y: 180, z: 0 },
      }, scene, loader, setSelectableObjects));
    });
  }
  
  // Special handling for Summoners Rift (needs additional analysis)
  const summonersRiftPromise = new Promise<void>((resolve, reject) => {
    loader.load(`${awsS3Url}/models/map/SummonersRift.glb`, 
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        gltf.scene.scale.set(1, 1, 1);
          
        // Make the model selectable and add name
        gltf.scene.name = 'Summoners Rift';
        gltf.scene.userData.selectable = true;
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.selectable = false; // Don't select individual meshes
          }
        });
            
        scene.add(gltf.scene);
            
        // Setup animation mixer for Summoners Rift
        setupAnimationMixer(gltf.scene, gltf, 'Summoners Rift');
            
        // Analyze the main Summoners Rift model structure
        logModelStructure(gltf.scene, 'Summoners Rift');
        logModelHierarchy(gltf.scene, 'Summoners Rift');
        checkMeshNames(gltf.scene, 'Summoners Rift');
          
        // Update selectable objects list
        const objects = collectSelectableObjects(scene);
        setSelectableObjects(objects);
          
        // Center the model and adjust camera position
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model bounds:', { center, size });
        
        gltf.scene.position.sub(center).add(new THREE.Vector3(-8658.84, -5200, 15975.61));
        
        //console.log('Camera positioned at:', camera.position);
        resolve();
      },
      (_progress) => {
        //console.log('Loading progress:', (_progress.loaded / _progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        reject(error);
      }
    );
  });
  loadingPromises.push(summonersRiftPromise);

  // Set initial camera position (much further back for large models)
  camera.position.set(-6997.76, 15664.39, 5385.27);
  controls.target.set(-6997.76, 0, 5386.84);
  controls.update();
  console.log('Scene children count:', scene.children.length);

  // Wait for all models to load
  await Promise.all(loadingPromises);
  console.log('All models loaded successfully');

  // Apply default states to all models after all are loaded
  applyDefaultStatesToAllModels();
  
  // Ensure monsters remain hidden after applying default states
  let hiddenMonsterCount = 0;
  scene.children.forEach((child) => {
    if (child.name && isMonster(child.name)) {
      setObjectVisibility(child, false);
      hiddenMonsterCount++;
      console.log(`Ensuring monster remains hidden: ${child.name}`);
    }
  });
  if (hiddenMonsterCount > 0) {
    console.log(`Total monsters hidden: ${hiddenMonsterCount}`);
  }
  
  // Ensure players remain hidden after applying default states
  let hiddenPlayerCount = 0;
  scene.children.forEach((child) => {
    if (child.name && isPlayer(child.name)) {
      setObjectVisibility(child, false);
      hiddenPlayerCount++;
      console.log(`Ensuring player remains hidden: ${child.name}`);
    }
  });
  if (hiddenPlayerCount > 0) {
    console.log(`Total players hidden: ${hiddenPlayerCount}`);
  }
};
