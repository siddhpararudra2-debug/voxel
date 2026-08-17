/** Orbital Field Manual reminder: the terrain is a sparse modular worksite, made from measured 1m voxel faces rather than decorative clutter. */
import * as THREE from "three";
import { BlockType, CHUNK_SIZE } from "./blocks";
import { buildGreedyGeometry } from "./GreedyMesher";

class ChunkData {
  readonly cells = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

  get(x: number, y: number, z: number) {
    if (x < 0 || y < 0 || z < 0 || x >= CHUNK_SIZE || y >= CHUNK_SIZE || z >= CHUNK_SIZE) return BlockType.Air;
    return this.cells[x + CHUNK_SIZE * (y + CHUNK_SIZE * z)] as BlockType;
  }

  set(x: number, y: number, z: number, block: BlockType) {
    this.cells[x + CHUNK_SIZE * (y + CHUNK_SIZE * z)] = block;
  }
}

const hash = (x: number, z: number) => ((Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1 + 1) % 1;

export class ChunkManager {
  readonly group = new THREE.Group();
  private readonly material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.38 });
  private meshes: THREE.Mesh[] = [];

  buildStarterAsteroid() {
    for (let chunkX = -1; chunkX <= 0; chunkX += 1) {
      for (let chunkZ = -1; chunkZ <= 0; chunkZ += 1) this.addTerrainChunk(chunkX, 0, chunkZ);
    }
    this.addLandingPad();
  }

  private addTerrainChunk(chunkX: number, chunkY: number, chunkZ: number) {
    const chunk = new ChunkData();
    for (let x = 0; x < CHUNK_SIZE; x += 1) {
      for (let z = 0; z < CHUNK_SIZE; z += 1) {
        const worldX = chunkX * CHUNK_SIZE + x;
        const worldZ = chunkZ * CHUNK_SIZE + z;
        const radius = Math.hypot(worldX + 2, worldZ + 2);
        const ridge = 3.4 + Math.max(0, 5.8 - radius * 0.34) + hash(worldX, worldZ) * 1.7;
        for (let y = 0; y < CHUNK_SIZE; y += 1) {
          if (y <= ridge) chunk.set(x, y, z, y === Math.floor(ridge) ? BlockType.TitaniumHull : BlockType.CargoBay);
        }
      }
    }
    const geometry = buildGreedyGeometry(chunk);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, chunkZ * CHUNK_SIZE);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.meshes.push(mesh);
  }

  private addLandingPad() {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(7, 0.45, 7), new THREE.MeshStandardMaterial({ color: 0x47555d, roughness: 0.66, metalness: 0.7 }));
    pad.position.set(4.5, 7.1, 0.5);
    pad.receiveShadow = true;
    this.group.add(pad);
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xf6a53a }));
    beacon.position.set(1.2, 7.42, -2.2);
    this.group.add(beacon);
  }

  dispose() {
    this.meshes.forEach((mesh) => mesh.geometry.dispose());
    this.material.dispose();
  }
}
