/** Orbital Field Manual reminder: greedy chunk surfaces should look engineered, sparse, and physically legible at a distance. */
import * as THREE from "three";
import { BLOCKS, BlockType, CHUNK_SIZE } from "./blocks";

export type VoxelSource = {
  get(x: number, y: number, z: number): BlockType;
};

const colorFor = (block: BlockType) => new THREE.Color(BLOCKS[block].color);

export function buildGreedyGeometry(source: VoxelSource, size = CHUNK_SIZE) {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const dimensions = [size, size, size];
  const x = [0, 0, 0];
  const q = [0, 0, 0];

  const appendQuad = (
    a: number[],
    b: number[],
    c: number[],
    d: number[],
    normal: number[],
    block: BlockType,
  ) => {
    const tone = colorFor(block);
    const faces = [a, b, c, a, c, d];
    faces.forEach((point) => {
      positions.push(point[0], point[1], point[2]);
      normals.push(normal[0], normal[1], normal[2]);
      colors.push(tone.r, tone.g, tone.b);
    });
  };

  for (let axis = 0; axis < 3; axis += 1) {
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;
    q[0] = 0;
    q[1] = 0;
    q[2] = 0;
    q[axis] = 1;

    for (x[axis] = -1; x[axis] < dimensions[axis]; ) {
      const mask: BlockType[] = [];
      let cursor = 0;
      for (x[v] = 0; x[v] < dimensions[v]; x[v] += 1) {
        for (x[u] = 0; x[u] < dimensions[u]; x[u] += 1) {
          const left = x[axis] >= 0 ? source.get(x[0], x[1], x[2]) : BlockType.Air;
          const right = x[axis] < dimensions[axis] - 1 ? source.get(x[0] + q[0], x[1] + q[1], x[2] + q[2]) : BlockType.Air;
          mask[cursor] = left !== BlockType.Air && right === BlockType.Air ? left : right !== BlockType.Air && left === BlockType.Air ? -right : BlockType.Air;
          cursor += 1;
        }
      }

      x[axis] += 1;
      cursor = 0;
      for (let j = 0; j < dimensions[v]; j += 1) {
        for (let i = 0; i < dimensions[u]; ) {
          const block = mask[cursor];
          if (block === BlockType.Air) {
            i += 1;
            cursor += 1;
            continue;
          }
          let width = 1;
          while (i + width < dimensions[u] && mask[cursor + width] === block) width += 1;
          let height = 1;
          outer: while (j + height < dimensions[v]) {
            for (let k = 0; k < width; k += 1) {
              if (mask[cursor + k + height * dimensions[u]] !== block) break outer;
            }
            height += 1;
          }

          x[u] = i;
          x[v] = j;
          const du = [0, 0, 0];
          const dv = [0, 0, 0];
          du[u] = width;
          dv[v] = height;
          const a = [...x];
          const b = [x[0] + du[0], x[1] + du[1], x[2] + du[2]];
          const c = [x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2]];
          const d = [x[0] + dv[0], x[1] + dv[1], x[2] + dv[2]];
          const sign = block > 0 ? 1 : -1;
          const visibleBlock = Math.abs(block) as BlockType;
          const normal = [0, 0, 0];
          normal[axis] = sign;
          if (sign > 0) appendQuad(a, b, c, d, normal, visibleBlock);
          else appendQuad(a, d, c, b, normal, visibleBlock);

          for (let row = 0; row < height; row += 1) {
            for (let col = 0; col < width; col += 1) mask[cursor + col + row * dimensions[u]] = BlockType.Air;
          }
          i += width;
          cursor += width;
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}
