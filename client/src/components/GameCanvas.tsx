/** Orbital Field Manual reminder: React frames the experience; the canvas remains an uncluttered operational viewport. */
import { useEffect, useRef } from "react";
import { NebulaEngine, type GameTelemetry } from "@/engine/NebulaEngine";

export type GameCanvasHandle = {
  begin: () => void;
  beginDemo: () => void;
  toggleFlight: () => void;
  craftCargo: () => void;
};

type GameCanvasProps = {
  onReady: (handle: GameCanvasHandle) => void;
  onTelemetry: (telemetry: GameTelemetry) => void;
  onDemoStart: () => void;
};

export function GameCanvas({ onReady, onTelemetry, onDemoStart }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NebulaEngine | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || startedRef.current) return;
    startedRef.current = true;
    const engine = new NebulaEngine(canvasRef.current, { onTelemetry, onFlightChange: () => undefined });
    engineRef.current = engine;
    onReady({ begin: () => engine.startExperience(), beginDemo: () => engine.startDemo(), toggleFlight: () => engine.toggleFlight(), craftCargo: () => engine.craftCargoModule() });
    if (new URLSearchParams(window.location.search).has("demo")) {
      engine.startDemo();
      onDemoStart();
    }
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [onDemoStart, onReady, onTelemetry]);

  return <canvas ref={canvasRef} aria-label="Nebula Bound interactive 3D voxel space environment" className="nebula-canvas" />;
}
