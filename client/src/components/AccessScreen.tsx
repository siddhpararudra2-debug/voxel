/** Orbital Field Manual reminder: the access screen is a mission handoff—quiet, asymmetric, and built from instrument cues. */
import type { NetworkStatus } from "@/network/NetworkClient";

type AccessScreenProps = { onEnter: () => void; network: NetworkStatus; authToken: string; onAuthTokenChange: (token: string) => void };
export function AccessScreen({ onEnter, network, authToken, onAuthTokenChange }: AccessScreenProps) {
  return (
    <section className="access-screen" aria-label="Nebula Bound access terminal">
      <div className="access-plate" />
      <div className="access-grain" />
      <div className="access-content">
        <div className="wordmark-lockup"><img src="/manus-storage/nebula-bound-nav-mark_4342ae0a.png" alt="Nebula Bound navigation mark" /><div><p className="eyebrow">PERSISTENT GALAXY // CLIENT 01</p><h1>NEBULA<br />BOUND</h1></div></div>
        <div className="access-statement"><span className="rule" />
          <p>BUILD A VESSEL THAT CARRIES<br />THE WEIGHT OF YOUR DECISIONS.</p>
          <small>VOXEL FLIGHT SANDBOX / WEBGL 2.0 / FLIGHT SYSTEMS NOMINAL</small>
        </div>
        <div className="access-actions">
          <div className="access-command-stack"><label className="token-field"><span>CREW TOKEN <small>(OPTIONAL)</small></span><input aria-label="Supabase access token" autoComplete="off" spellCheck="false" type="password" value={authToken} onChange={(event) => onAuthTokenChange(event.target.value)} placeholder="LOCAL MOCK IF EMPTY" /></label><button className="launch-button" type="button" onClick={onEnter}><span className="launch-index">01</span><span>{authToken ? "AUTHENTICATE & ENTER" : "ENTER LOCAL SIMULATION"}</span><b>↗</b></button></div>
          <p className="access-note">A valid Supabase JWT activates the server handshake.<br />Empty token runs the IndexedDB-backed local mock.<br />WASD moves · Space / Shift controls EVA · F enters cockpit.<br />Cockpit: Q/R rolls · ↑/↓ pitches.</p>
        </div>
      </div>
      <div className="access-footer"><span>NB // FIELD CLIENT</span><span className={`network-pill ${network.toLowerCase()}`}><i /> {network === "LOCAL" ? "LOCAL SIMULATION" : `NETWORK ${network}`}</span><span>SECTOR 07—ARGYRE</span></div>
    </section>
  );
}
