/** Orbital Field Manual reminder: each ship module carries measurable mass; flight responses remain readable, not arcade-chaotic. */
import * as CANNON from "cannon-es";
import * as THREE from "three";
import { BLOCKS, BlockType } from "@/voxels/blocks";

export type ShipInput = Pick<Record<"forward" | "back" | "left" | "right", boolean>, "forward" | "back" | "left" | "right">;
type ShipModule = { type: BlockType; position: THREE.Vector3; mesh: THREE.Mesh };

export class ShipController {
  readonly group = new THREE.Group();
  readonly body: CANNON.Body;
  modules: ShipModule[] = [];
  centerOfMass = new THREE.Vector3();
  flightMode = false;
  private thrustLevel = 0;
  private readonly engineFlames: THREE.Mesh[] = [];

  constructor(world: CANNON.World) {
    this.body = new CANNON.Body({ mass: 120, position: new CANNON.Vec3(4.5, 8.65, 0.5), linearDamping: 0.04, angularDamping: 0.33 });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(2.4, 1.1, 3.1)));
    world.addBody(this.body);
    this.group.position.copy(this.body.position as unknown as THREE.Vector3);
    this.buildStarterShip();
  }

  private addModule(type: BlockType, x: number, y: number, z: number) {
    const spec = BLOCKS[type];
    const material = new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.emissive ?? 0x000000, emissiveIntensity: spec.emissive ? 0.45 : 0, roughness: type === BlockType.Glass ? 0.2 : 0.64, metalness: type === BlockType.Glass ? 0.15 : 0.72, transparent: type === BlockType.Glass, opacity: type === BlockType.Glass ? 0.72 : 1 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.94, 0.94), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.group.add(mesh);
    this.modules.push({ type, position: mesh.position.clone(), mesh });
    if (type === BlockType.MainEngineThruster) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xf6a53a, transparent: true, opacity: 0.78 }));
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(x, y, z + 0.9);
      flame.visible = false;
      this.group.add(flame);
      this.engineFlames.push(flame);
    }
  }

  private buildStarterShip() {
    const modules: Array<[BlockType, number, number, number]> = [
      [BlockType.Cockpit, 0, 0.5, -1.1], [BlockType.Glass, 0, 1.45, -1.1], [BlockType.TitaniumHull, -0.96, 0.5, -0.1], [BlockType.TitaniumHull, 0.96, 0.5, -0.1],
      [BlockType.Reactor, 0, 0.5, 0], [BlockType.FuelTank, -0.96, 0.5, 0.9], [BlockType.FuelTank, 0.96, 0.5, 0.9], [BlockType.CargoBay, 0, 0.5, 1.15],
      [BlockType.MainEngineThruster, -0.96, 0.5, 2.05], [BlockType.MainEngineThruster, 0.96, 0.5, 2.05], [BlockType.RCSPort, -1.55, 0.5, -0.7], [BlockType.RCSPort, 1.55, 0.5, -0.7],
    ];
    modules.forEach(([type, x, y, z]) => this.addModule(type, x, y, z));
    this.recalculateMass();
  }

  recalculateMass() {
    const totalMass = this.modules.reduce((sum, module) => sum + BLOCKS[module.type].mass, 0);
    const weighted = this.modules.reduce((sum, module) => sum.addScaledVector(module.position, BLOCKS[module.type].mass), new THREE.Vector3());
    this.centerOfMass.copy(weighted.multiplyScalar(1 / Math.max(1, totalMass)));
    this.body.mass = totalMass;
    this.body.updateMassProperties();
  }

  addCargoModule() {
    const nextX = this.modules.filter((module) => module.type === BlockType.CargoBay).length % 2 === 0 ? -1.92 : 1.92;
    const nextZ = 1.15 + Math.floor(this.modules.filter((module) => module.type === BlockType.CargoBay).length / 2) * 0.96;
    this.addModule(BlockType.CargoBay, nextX, 0.5, nextZ);
    this.recalculateMass();
  }

  setFlightMode(enabled: boolean) {
    this.flightMode = enabled;
    if (!enabled) this.thrustLevel = 0;
  }

  update(input: ShipInput, delta: number) {
    const thrust = input.forward ? 140 : input.back ? -70 : 0;
    this.thrustLevel += (thrust - this.thrustLevel) * Math.min(1, delta * 4.5);
    if (this.flightMode && Math.abs(this.thrustLevel) > 1) this.body.applyLocalForce(new CANNON.Vec3(0, 0, -this.thrustLevel), new CANNON.Vec3(0, 0, 0));
    if (this.flightMode && (input.left || input.right)) this.body.torque.y += (input.left ? 1 : -1) * 28;
    this.engineFlames.forEach((flame) => {
      flame.visible = this.flightMode && Math.abs(this.thrustLevel) > 8;
      flame.scale.z = Math.max(0.15, Math.abs(this.thrustLevel) / 90);
    });
    this.group.position.copy(this.body.position as unknown as THREE.Vector3);
    this.group.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  bindCamera(camera: THREE.PerspectiveCamera) {
    const cockpit = new THREE.Vector3(0, 1.15, -1.15).applyQuaternion(this.group.quaternion).add(this.group.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
    camera.position.copy(cockpit);
    camera.lookAt(cockpit.clone().add(forward.multiplyScalar(20)));
  }

  dispose() {
    this.modules.forEach((module) => {
      module.mesh.geometry.dispose();
      (module.mesh.material as THREE.Material).dispose();
    });
  }
}
