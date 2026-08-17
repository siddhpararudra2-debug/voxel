/** Orbital Field Manual reminder: the Three.js world is an operational space—clear geometry, deep contrast, and sparse active amber. */
import * as CANNON from "cannon-es";
import * as THREE from "three";
import { PlayerController, type MovementInput } from "@/physics/PlayerController";
import { ShipController } from "@/physics/ShipController";
import { networkClient, type NetworkStatus } from "@/network/NetworkClient";
import { atmosphereFragment, atmosphereVertex } from "@/shaders/spaceShaders";
import { ChunkManager } from "@/voxels/ChunkManager";

export type FlightMode = "SURFACE" | "EVA" | "FLIGHT";
export type GameTelemetry = { mode: FlightMode; speed: number; altitude: number; oxygen: number; reactor: number; fuel: number; hull: number; centerOfMass: [number, number, number]; network: NetworkStatus; drawCalls: number };
type EngineEvents = { onTelemetry: (telemetry: GameTelemetry) => void; onFlightChange: (mode: FlightMode) => void };

const emptyInput = (): MovementInput => ({ forward: false, back: false, left: false, right: false, ascend: false, descend: false, jump: false });

export class NebulaEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(70, 1, 0.08, 1800);
  private readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  private readonly chunks = new ChunkManager();
  private readonly player = new PlayerController(this.world);
  private readonly ship = new ShipController(this.world);
  private readonly clock = new THREE.Clock();
  private readonly input = emptyInput();
  private readonly events: EngineEvents;
  private active = false;
  private demo = false;
  private yaw = 0;
  private pitch = -0.12;
  private networkStatus: NetworkStatus = "LOCAL";
  private lastTelemetry = 0;
  private keyDown = (event: KeyboardEvent) => this.handleKey(event.code, true);
  private keyUp = (event: KeyboardEvent) => this.handleKey(event.code, false);
  private mouseMove = (event: MouseEvent) => this.handleMouse(event);

  constructor(private readonly canvas: HTMLCanvasElement, events: EngineEvents) {
    this.events = events;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.rotation.order = "YXZ";
    this.configureScene();
    this.canvas.addEventListener("click", this.requestPointerLock);
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    document.addEventListener("mousemove", this.mouseMove);
    window.addEventListener("resize", this.resize);
    networkClient.connect();
    networkClient.onStatus((status) => { this.networkStatus = status; });
    this.renderer.setAnimationLoop(this.animate);
  }

  private configureScene() {
    this.scene.background = new THREE.Color(0x040a14);
    this.scene.fog = new THREE.FogExp2(0x060d19, 0.008);
    const ambient = new THREE.HemisphereLight(0x6f99bd, 0x10131a, 1.65);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffd5a5, 3.8);
    key.position.set(-32, 52, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const warmSun = new THREE.PointLight(0xf6a53a, 8, 80, 2);
    warmSun.position.set(-14, 20, -18);
    this.scene.add(warmSun);
    this.addStarfield();
    this.addGasGiant();
    this.chunks.buildStarterAsteroid();
    this.scene.add(this.chunks.group, this.ship.group);
  }

  private addStarfield() {
    const stars = new THREE.BufferGeometry();
    const coordinates: number[] = [];
    for (let index = 0; index < 900; index += 1) {
      const radius = 180 + ((index * 47) % 420);
      const theta = index * 2.39996;
      const phi = Math.acos(1 - 2 * ((index * 113) % 997) / 997);
      coordinates.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
    }
    stars.setAttribute("position", new THREE.Float32BufferAttribute(coordinates, 3));
    this.scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xc5dcff, size: 0.58, sizeAttenuation: true, transparent: true, opacity: 0.86 })));
  }

  private addGasGiant() {
    const planet = new THREE.Mesh(new THREE.SphereGeometry(43, 48, 32), new THREE.MeshStandardMaterial({ color: 0x497089, roughness: 0.95, metalness: 0.05 }));
    planet.position.set(-78, 42, -178);
    this.scene.add(planet);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(45, 48, 32), new THREE.ShaderMaterial({ vertexShader: atmosphereVertex, fragmentShader: atmosphereFragment, transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
    atmosphere.position.copy(planet.position);
    this.scene.add(atmosphere);
  }

  startExperience() {
    this.active = true;
    this.canvas.requestPointerLock?.();
  }

  startDemo() {
    this.active = true;
    this.demo = true;
    this.ship.setFlightMode(true);
    this.events.onFlightChange("FLIGHT");
  }

  toggleFlight() {
    const allowed = this.ship.flightMode || this.player.body.position.distanceTo(this.ship.body.position) < 9;
    if (!allowed) return;
    this.ship.setFlightMode(!this.ship.flightMode);
    this.events.onFlightChange(this.ship.flightMode ? "FLIGHT" : this.player.zeroG ? "EVA" : "SURFACE");
  }

  craftCargoModule() { this.ship.addCargoModule(); }

  private requestPointerLock = () => { if (this.active && document.pointerLockElement !== this.canvas) this.canvas.requestPointerLock?.(); };
  private resize = () => { this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight, false); };

  private handleKey(code: string, pressed: boolean) {
    const mapping: Record<string, keyof MovementInput> = { KeyW: "forward", KeyS: "back", KeyA: "left", KeyD: "right", Space: "ascend", ShiftLeft: "descend", ShiftRight: "descend" };
    if (mapping[code]) this.input[mapping[code]] = pressed;
    if (code === "Space") this.input.jump = pressed;
    if (code === "KeyF" && pressed && !this.demo) this.toggleFlight();
  }

  private handleMouse(event: MouseEvent) {
    if (document.pointerLockElement !== this.canvas || this.ship.flightMode || this.demo) return;
    this.yaw -= event.movementX * 0.002;
    this.pitch = THREE.MathUtils.clamp(this.pitch - event.movementY * 0.002, -1.38, 1.38);
  }

  private animate = () => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (this.active) this.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private update(delta: number) {
    if (this.demo) {
      const time = performance.now() / 1000;
      this.input.forward = true;
      this.input.left = Math.sin(time * 0.55) > 0.65;
      this.input.right = Math.sin(time * 0.55) < -0.65;
    }
    this.world.gravity.set(0, this.player.zeroG || this.ship.flightMode ? 0 : -9.82, 0);
    if (!this.ship.flightMode) {
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.player.update(this.input, this.camera, delta);
    }
    this.ship.update(this.input, delta);
    this.world.step(1 / 60, delta, 3);
    if (this.demo) this.setDemoCamera(delta);
    else if (this.ship.flightMode) this.ship.bindCamera(this.camera);
    else this.player.syncCamera(this.camera);
    const mode: FlightMode = this.ship.flightMode ? "FLIGHT" : this.player.zeroG ? "EVA" : "SURFACE";
    if (performance.now() - this.lastTelemetry > 120) {
      const velocity = this.ship.flightMode ? this.ship.body.velocity : this.player.body.velocity;
      const position = this.ship.flightMode ? this.ship.body.position : this.player.body.position;
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
      const fuel = Math.max(18, 86 - speed * 1.8);
      const reactor = Math.min(96, 42 + speed * 4.5);
      this.events.onTelemetry({ mode, speed, altitude: Math.max(0, position.y - 7), oxygen: mode === "EVA" ? 88 : 97, reactor, fuel, hull: 100, centerOfMass: [this.ship.centerOfMass.x, this.ship.centerOfMass.y, this.ship.centerOfMass.z], network: this.networkStatus, drawCalls: this.renderer.info.render.calls });
      networkClient.emitPlayerState({ position: [position.x, position.y, position.z], rotation: this.yaw });
      this.lastTelemetry = performance.now();
    }
  }

  private setDemoCamera(delta: number) {
    const time = performance.now() / 1000;
    const desired = new THREE.Vector3(20 + Math.sin(time * 0.12) * 3, 18.5, 25 + Math.cos(time * 0.12) * 2);
    this.camera.position.lerp(desired, Math.min(1, delta * 1.4));
    this.camera.lookAt(new THREE.Vector3(0, 7.8, 0));
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.canvas.removeEventListener("click", this.requestPointerLock);
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    document.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("resize", this.resize);
    this.chunks.dispose();
    this.ship.dispose();
    this.renderer.dispose();
  }
}
