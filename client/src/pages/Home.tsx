/** Orbital Field Manual reminder: the central horizon belongs to the game; the React frame stays at the instrument perimeter. */
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessScreen } from "@/components/AccessScreen";
import { EquipmentDrawer } from "@/components/EquipmentDrawer";
import { GameCanvas, type GameCanvasHandle } from "@/components/GameCanvas";
import { HUD } from "@/components/HUD";
import type { GameTelemetry } from "@/engine/NebulaEngine";

const initialTelemetry: GameTelemetry = { mode: "SURFACE", speed: 0, altitude: 0, oxygen: 97, reactor: 42, fuel: 86, hull: 100, centerOfMass: [0, 0, 0], network: "LOCAL", drawCalls: 0 };

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<GameTelemetry>(initialTelemetry);
  const engine = useRef<GameCanvasHandle | null>(null);
  const setReady = useCallback((handle: GameCanvasHandle) => { engine.current = handle; }, []);
  const beginDemo = useCallback(() => setEntered(true), []);
  const enterWorld = () => { engine.current?.begin(); setEntered(true); };

  useEffect(() => {
    const onPanelKey = (event: KeyboardEvent) => {
      if (!entered || event.repeat || (event.target instanceof HTMLInputElement)) return;
      if (event.code === "KeyE") setPanel((current) => current === "inventory" ? null : "inventory");
      if (event.code === "KeyM") setPanel((current) => current === "market" ? null : "market");
      if (event.code === "KeyG") setPanel((current) => current === "faction" ? null : "faction");
      if (event.code === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onPanelKey);
    return () => window.removeEventListener("keydown", onPanelKey);
  }, [entered]);

  return <main className="game-shell"><GameCanvas onReady={setReady} onTelemetry={setTelemetry} onDemoStart={beginDemo} />
    {!entered && <AccessScreen onEnter={enterWorld} network={telemetry.network} />}
    {entered && <><HUD telemetry={telemetry} panel={panel} onPanel={setPanel} onFlight={() => engine.current?.toggleFlight()} /><EquipmentDrawer panel={panel} onClose={() => setPanel(null)} onCraftCargo={() => engine.current?.craftCargo()} /></>}
  </main>;
}
