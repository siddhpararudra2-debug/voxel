/** Orbital Field Manual reminder: information belongs on the viewport perimeter, protecting a large central field of view for piloting. */
import type { FlightMode, GameTelemetry } from "@/engine/NebulaEngine";
import type { NetworkStatus } from "@/network/NetworkClient";

type HudProps = { telemetry: GameTelemetry; panel: string | null; onPanel: (panel: string | null) => void; onFlight: () => void };
const meter = (label: string, value: number, tone = "amber") => <div className="meter" key={label}><div className="meter-head"><span>{label}</span><b>{Math.round(value)}<em>%</em></b></div><div className="meter-track"><i className={tone} style={{ width: `${value}%` }} /></div></div>;
const modeLabel: Record<FlightMode, string> = { SURFACE: "SURFACE WALK", EVA: "EVA THRUSTER", FLIGHT: "FLIGHT BOUND" };

export function HUD({ telemetry, panel, onPanel, onFlight }: HudProps) {
  const networkText: Record<NetworkStatus, string> = { LOCAL: "LOCAL", CONNECTING: "LINKING", SYNCED: "SYNCED", OFFLINE: "OFFLINE" };
  return <>
    <header className="hud-topbar">
      <div className="hud-brand"><img src="/manus-storage/nebula-bound-nav-mark_4342ae0a.png" alt="" /><span>NB</span><i /></div>
      <div className="hud-objective"><span>SECTOR / 07</span><b>ARGYRE ORBITAL</b><small>ATLAS NODE 01</small></div>
      <button className="network-readout" type="button" onClick={() => onPanel(panel === "faction" ? null : "faction")}><i className={telemetry.network === "OFFLINE" ? "warning" : ""} /> LINK // {networkText[telemetry.network]}</button>
    </header>

    <aside className="hud-left">
      <div className="mode-stamp"><small>OPERATIONAL MODE</small><b>{modeLabel[telemetry.mode]}</b><span><i /> SUIT LINK ACTIVE</span></div>
      <div className="compass"><span>W</span><span>NW</span><b>327°</b><span>NE</span><span>E</span></div>
      <div className="altitude-read"><small>ALTITUDE</small><b>{telemetry.altitude.toFixed(1)}<em>m</em></b><span>ORIGIN PLATFORM</span></div>
    </aside>

    <aside className="hud-flight-panel" style={{ backgroundImage: "linear-gradient(90deg, rgba(6,12,20,.93), rgba(6,12,20,.72)), url('/manus-storage/nebula-bound-cockpit-surface_9cbaa44f.png')" }}>
      <div className="flight-header"><span>VESSEL TELEMETRY</span><b>{telemetry.mode === "FLIGHT" ? "CONTROL LOCKED" : "STANDBY"}</b></div>
      <div className="speed-read"><small>VECTOR VELOCITY</small><b>{telemetry.speed.toFixed(1)}<em>m/s</em></b><span>DRAW CALLS {telemetry.drawCalls}</span></div>
      {meter("O₂ RESERVE", telemetry.oxygen, "cyan")}{meter("FUEL MATRIX", telemetry.fuel)}{meter("REACTOR LOAD", telemetry.reactor, telemetry.reactor > 80 ? "oxide" : "amber")}
      <div className="mass-read"><span>CALCULATED CoM</span><b>{telemetry.centerOfMass.map((value) => value.toFixed(2)).join(" / ")} m</b></div>
    </aside>

    <div className="reticle" aria-hidden="true"><i /><b /><i /></div>
    <nav className="action-rail" aria-label="Game equipment controls"><button type="button" onClick={() => onPanel(panel === "inventory" ? null : "inventory")}><kbd>E</kbd><span>LOADOUT</span></button><button type="button" onClick={() => onPanel(panel === "market" ? null : "market")}><kbd>M</kbd><span>MARKET</span></button><button type="button" onClick={() => onPanel(panel === "faction" ? null : "faction")}><kbd>G</kbd><span>CREW</span></button><button type="button" onClick={onFlight}><kbd>F</kbd><span>COCKPIT</span></button></nav>
    <footer className="hud-bottom"><span><i /> O₂ 97.0</span><span>GRAVITY {telemetry.mode === "SURFACE" ? "1.00 G" : "0.00 G"}</span><span>HULL {telemetry.hull.toFixed(0)}%</span><b>TYPE: <strong>HABITABLE ASTEROID</strong></b></footer>
  </>;
}
