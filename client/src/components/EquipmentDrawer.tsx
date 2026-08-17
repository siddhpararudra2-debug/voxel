/** Orbital Field Manual reminder: drawers enter from their physical edge as equipment bays, never as generic centered dialog cards. */
import { X } from "lucide-react";

type DrawerProps = { panel: string | null; onClose: () => void; onCraftCargo: () => void };
const resource = (name: string, amount: string, tone: string) => <div className="resource-line" key={name}><i className={tone} /><span>{name}</span><b>{amount}</b></div>;

export function EquipmentDrawer({ panel, onClose, onCraftCargo }: DrawerProps) {
  if (!panel) return null;
  const title = panel === "inventory" ? "LOADOUT & FABRICATION" : panel === "market" ? "GLOBAL MARKET TERMINAL" : "FACTION UPLINK";
  return <aside className="equipment-drawer" aria-label={title}>
    <div className="drawer-image" style={{ backgroundImage: "linear-gradient(90deg, rgba(7,12,18,.98) 0%, rgba(7,12,18,.88) 44%, rgba(7,12,18,.36)), url('/manus-storage/nebula-bound-orbital-dock_473d120a.png')" }} />
    <div className="drawer-head"><div><span className="eyebrow">EQUIPMENT BAY // {panel === "inventory" ? "01" : panel === "market" ? "04" : "07"}</span><h2>{title}</h2></div><button type="button" aria-label="Close equipment bay" onClick={onClose}><X size={18} /></button></div>
    {panel === "inventory" && <div className="drawer-body inventory-body"><section className="inventory-card"><img src="/manus-storage/nebula-bound-logistics-card_a28299a7.png" alt="Graphite logistics card" /><div><span>FIELD LOADOUT</span><b>ASTRA-03</b><small>SUIT / EVA CONFIGURATION</small></div></section><section className="resource-list"><h3>STORED MATERIALS</h3>{resource("Titanium lattice", "28", "titanium")}{resource("Carbon weave", "14", "carbon")}{resource("Reactor cells", "06", "reactor")}{resource("Fuel compound", "46", "fuel")}</section><section className="craft-card"><span>ASSEMBLY SCHEMATIC // CARGO BAY</span><div className="voxel-diagram"><i /><i /><i /><i /></div><p>Attach a dense cargo module to the vessel. The live center-of-mass readout will update.</p><button type="button" onClick={onCraftCargo}>FABRICATE CARGO MODULE <b>+</b></button></section></div>}
    {panel === "market" && <div className="drawer-body"><div className="terminal-status"><i /> REMOTE EXCHANGE AWAITS A SERVER UPLINK</div><p className="drawer-copy">Your local client is ready to exchange material and vessel listings once the designated multiplayer backend provides its market protocol. Current loadout remains safe in local simulation.</p><div className="market-grid"><div><span>REQUESTS</span><b>00</b><small>NO REMOTE LEDGER</small></div><div><span>LISTINGS</span><b>00</b><small>NO REMOTE LEDGER</small></div></div></div>}
    {panel === "faction" && <div className="drawer-body"><div className="faction-signal"><i /><i /><i /></div><p className="drawer-copy">Crew channels are prepared for a persistent galaxy connection. Invite, territory, and faction state will synchronize through the client event boundary when a mission server is available.</p><div className="crew-callout"><span>YOUR SIGNAL</span><b>UNAFFILIATED EXPLORER</b><small>LINK STATUS: LOCAL SIMULATION</small></div></div>}
  </aside>;
}
