import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { MachineComponent, SavedConfiguration, VirtualSensor } from '@/types';

export async function exportConfiguration(
  components: MachineComponent[],
  sensors: VirtualSensor[],
  viewState: any,
  format: 'json' | 'gltf' | 'step' | 'csv' | 'bom' = 'json'
): Promise<string | Blob> {
  switch (format) {
    case 'json':
      return exportJSON(components, sensors, viewState);
    case 'gltf':
      return exportGLTF();
    case 'step':
      return exportSTEP(components);
    case 'csv':
      return exportCSV(components, sensors);
    case 'bom':
      return exportBOM(components);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

function exportJSON(components: MachineComponent[], sensors: VirtualSensor[], viewState: any): string {
  const config: SavedConfiguration = {
    version: 2,
    name: `ARGUS Config ${new Date().toISOString().split('T')[0]}`,
    description: `Exported from ARGUS Engineering Studio`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components,
    sensors,
    viewState,
  };
  return JSON.stringify(config, null, 2);
}

async function exportGLTF(): Promise<Blob> {
  const scene = new THREE.Scene();
  scene.name = 'ARGUS Assembly';

  return new Promise((resolve) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' });
        resolve(blob);
      },
      (error) => {
        console.error('GLTF export error:', error);
      },
      { binary: false }
    );
  });
}

function exportSTEP(components: MachineComponent[]): string {
  let step = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ARGUS Assembly'), '2;1');
FILE_NAME('argus_assembly.stp', '${new Date().toISOString()}', (''), (''), '', '', '');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));
ENDSEC;
DATA;
`;

  let entityId = 1;
  const entityMap = new Map<string, number>();

  for (const comp of components) {
    entityMap.set(comp.id, entityId++);
  }

  for (const comp of components) {
    const id = entityMap.get(comp.id)!;
    const pos = comp.position;
    
    step += `#${id}=CARTESIAN_POINT('',(${pos[0]},${pos[1]},${pos[2]}));\n`;
    step += `#${entityId}=DIRECTION('',(0,0,1));\n`;
    step += `#${entityId+1}=AXIS2_PLACEMENT_3D('',#${id},#${entityId},#${entityId+1});\n`;
    step += `#${entityId+2}=ADVANCED_BREP_SHAPE_REPRESENTATION('',(#${entityId+1}),#20);\n`;
    step += `#${entityId+3}=PRODUCT_DEFINITION_SHAPE('',$,(#${entityId+2}));\n`;
    step += `#${entityId+4}=PRODUCT('',${comp.id},$,#${entityId+3});\n`;
    
    entityId += 5;
  }

  step += 'ENDSEC;\nEND-ISO-10303-21;\n';
  return step;
}

function exportCSV(components: MachineComponent[], sensors: any[]): string {
  let csv = 'Component ID,Name,Type,Category,Position X,Position Y,Position Z,Rotation X,Rotation Y,Rotation Z,Scale X,Scale Y,Scale Z,Material,Status,Provisional\n';
  
  for (const comp of components) {
    csv += `"${comp.id}","${comp.name}","${comp.type}","${comp.category}",${comp.position.join(',')},${comp.rotation.join(',')},${comp.scale.join(',')},"${comp.material}","${comp.status}",${comp.provisional}\n`;
  }
  
  csv += '\nSensor ID,Sensor Type,Component ID,Local Position X,Local Position Y,Local Position Z,Local Rotation X,Local Rotation Y,Local Rotation Z,Visible,Locked\n';
  
  for (const sensor of sensors) {
    csv += `"${sensor.id}","${sensor.definition.type}","${sensor.componentId}",${sensor.localPosition.join(',')},${sensor.localRotation.join(',')},${sensor.visible},${sensor.locked}\n`;
  }
  
  return csv;
}

function exportBOM(components: MachineComponent[]): string {
  let bom = 'BILL OF MATERIALS - ARGUS Assembly\n';
  bom += `Generated: ${new Date().toISOString()}\n`;
  bom += `Total Components: ${components.length}\n\n`;
  
  const byCategory = components.reduce((acc, comp) => {
    (acc[comp.category] = acc[comp.category] || []).push(comp);
    return acc;
  }, {} as Record<string, typeof components>);

  for (const [category, comps] of Object.entries(byCategory)) {
    bom += `\n${category} (${comps.length}):\n`;
    bom += 'ID,Name,Type,Material,Dimensions,Provisional\n';
    for (const comp of comps) {
      const dims = Object.entries(comp.dimensions).map(([k, v]) => `${k}=${v}`).join(', ');
      bom += `${comp.id},${comp.name},${comp.type},${comp.material},${dims},${comp.provisional}\n`;
    }
  }
  
  return bom;
}

export async function importConfiguration(json: string): Promise<{
  components: MachineComponent[];
  sensors: any[];
  viewState: any;
}> {
  const config = JSON.parse(json);
  
  if (config.version > 2) {
    console.warn('Config version newer than supported, attempting import anyway');
  }
  
  const defaultAssembly = await import('@/machinery/defaultAssembly').then(m => m.createDefaultAssembly());
  const validComponents = config.components.map((comp: any) => {
    const defaults = defaultAssembly.find(d => d.id === comp.id);
    return {
      ...defaults,
      ...comp,
      position: comp.position ?? defaults?.position ?? [0, 0, 0],
      rotation: comp.rotation ?? defaults?.rotation ?? [0, 0, 0],
      scale: comp.scale ?? defaults?.scale ?? [1, 1, 1],
      localPosition: comp.localPosition ?? defaults?.localPosition ?? [0, 0, 0],
      localRotation: comp.localRotation ?? defaults?.localRotation ?? [0, 0, 0],
      localScale: comp.localScale ?? defaults?.localScale ?? [1, 1, 1],
      moveWithParent: comp.moveWithParent ?? defaults?.moveWithParent ?? false,
    };
  });
  
  return {
    components: validComponents,
    sensors: config.sensors ?? [],
    viewState: config.viewState ?? {},
  };
}