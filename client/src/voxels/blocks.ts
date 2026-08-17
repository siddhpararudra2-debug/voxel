/** Orbital Field Manual reminder: physical 1m modules use restrained aerospace materials and Perihelion Amber only for active systems. */
export enum BlockType {
  Air = 0,
  TitaniumHull = 1,
  Glass = 2,
  MainEngineThruster = 3,
  RCSPort = 4,
  Reactor = 5,
  FuelTank = 6,
  Cockpit = 7,
  CargoBay = 8,
}

export type BlockSpec = {
  name: string;
  color: number;
  emissive?: number;
  mass: number;
};

export const BLOCKS: Record<BlockType, BlockSpec> = {
  [BlockType.Air]: { name: "Air", color: 0x000000, mass: 0 },
  [BlockType.TitaniumHull]: { name: "Titanium Hull", color: 0x66717a, mass: 26 },
  [BlockType.Glass]: { name: "Smoked Glass", color: 0x263e50, mass: 4 },
  [BlockType.MainEngineThruster]: { name: "Main Engine", color: 0xf6a53a, emissive: 0xc76c13, mass: 14 },
  [BlockType.RCSPort]: { name: "RCS Port", color: 0x8ea9b9, emissive: 0x164259, mass: 6 },
  [BlockType.Reactor]: { name: "Reactor", color: 0x4fb4c8, emissive: 0x0d5362, mass: 30 },
  [BlockType.FuelTank]: { name: "Fuel Tank", color: 0x845d3d, mass: 12 },
  [BlockType.Cockpit]: { name: "Cockpit", color: 0x33505f, mass: 8 },
  [BlockType.CargoBay]: { name: "Cargo Bay", color: 0x657d58, mass: 20 },
};

export const CHUNK_SIZE = 16;
