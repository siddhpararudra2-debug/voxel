/** Orbital Field Manual reminder: vital readings are physical cockpit and visor instruments, not only screen-edge UI. */
import * as THREE from "three";
import type { GameTelemetry } from "./NebulaEngine";

export class DiegeticTelemetry {
  private readonly canvas = document.createElement("canvas");
  private readonly context: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private readonly cockpitDisplay: THREE.Mesh;
  private readonly visorDisplay: THREE.Mesh;

  constructor(ship: THREE.Group, camera: THREE.PerspectiveCamera) {
    this.canvas.width = 640;
    this.canvas.height = 240;
    this.context = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false, opacity: 0.96 });
    this.cockpitDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.64), material);
    this.cockpitDisplay.position.set(0, 1.42, -2.04);
    ship.add(this.cockpitDisplay);
    this.visorDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.14), material.clone());
    this.visorDisplay.position.set(0.23, -0.16, -0.46);
    camera.add(this.visorDisplay);
    this.draw({ mode: "SURFACE", speed: 0, altitude: 0, oxygen: 97, reactor: 42, fuel: 86, hull: 100, centerOfMass: [0, 0, 0], network: "LOCAL", drawCalls: 0 });
  }

  update(telemetry: GameTelemetry) {
    this.cockpitDisplay.visible = telemetry.mode === "FLIGHT";
    this.visorDisplay.visible = telemetry.mode === "EVA";
    this.draw(telemetry);
  }

  dispose() {
    this.cockpitDisplay.geometry.dispose();
    (this.cockpitDisplay.material as THREE.Material).dispose();
    this.visorDisplay.geometry.dispose();
    (this.visorDisplay.material as THREE.Material).dispose();
    this.texture.dispose();
  }

  private draw(telemetry: GameTelemetry) {
    const { context: ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(3, 11, 18, .86)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(246, 165, 58, .82)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 34); ctx.lineTo(0, 0); ctx.lineTo(74, 0);
    ctx.moveTo(canvas.width - 74, canvas.height); ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(canvas.width, canvas.height - 34);
    ctx.stroke();
    ctx.fillStyle = "#78d6d7";
    ctx.font = "600 22px monospace";
    ctx.fillText(telemetry.mode === "FLIGHT" ? "COCKPIT TELEMETRY" : "EVA VISOR", 28, 42);
    ctx.fillStyle = "#e7ece9";
    ctx.font = "600 57px monospace";
    ctx.fillText(`${telemetry.speed.toFixed(1)} m/s`, 28, 112);
    ctx.font = "500 24px monospace";
    ctx.fillStyle = "#f6a53a";
    ctx.fillText(`O₂ ${Math.round(telemetry.oxygen)}%  //  FUEL ${Math.round(telemetry.fuel)}%  //  CORE ${Math.round(telemetry.reactor)}%`, 28, 167);
    ctx.fillStyle = "#9ab4bf";
    ctx.font = "18px monospace";
    ctx.fillText(`ALT ${telemetry.altitude.toFixed(1)} m   COM ${telemetry.centerOfMass.map((value) => value.toFixed(2)).join(" / ")}`, 28, 208);
    this.texture.needsUpdate = true;
  }
}
