"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ─────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  navy: "#0D1E35", navyMid: "#162944", navyLight: "#1E3A5F",
  teal: "#0B8A82", tealLight: "#0DADA2", tealBg: "#E3F7F6",
  amber: "#C96B15", amberBg: "#FEF3E2",
  red: "#B91C1C", redBg: "#FEF2F2",
  green: "#15803D", greenBg: "#F0FDF4",
  blue: "#1D4ED8", blueBg: "#EFF6FF",
  slate: "#475569", slateLight: "#94A3B8",
  border: "#E2E8F0", borderMd: "#CBD5E1",
  bg: "#F8FAFC", card: "#FFFFFF",
  text: "#0F172A", textMid: "#334155", textLight: "#64748B",
};

const S = {
  card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "1.25rem" },
  cardSm: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "1rem" },
  h2: { fontSize: 20, fontWeight: 600, color: T.navy, margin: 0 },
  h3: { fontSize: 15, fontWeight: 600, color: T.navy, margin: 0 },
  label: { fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: T.textLight, textTransform: "uppercase", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "8px 12px", border: `1px solid ${T.borderMd}`, borderRadius: 6, fontSize: 14, color: T.text, background: T.card, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "8px 12px", border: `1px solid ${T.borderMd}`, borderRadius: 6, fontSize: 14, color: T.text, background: T.card, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 80 },
  select: { width: "100%", padding: "8px 12px", border: `1px solid ${T.borderMd}`, borderRadius: 6, fontSize: 14, color: T.text, background: T.card, outline: "none" },
  btnPrimary: { padding: "9px 20px", background: T.navy, color: "#fff", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  btnSecondary: { padding: "8px 16px", background: "transparent", color: T.navy, border: `1px solid ${T.borderMd}`, borderRadius: 7, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  btnTeal: { padding: "9px 20px", background: T.teal, color: "#fff", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  btnSm: { padding: "5px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 5, border: `1px solid ${T.borderMd}`, background: T.card, color: T.textMid },
};

// ─── COMPLIANCE SCHEDULE ─────────────────────────────────────────
const SCHEDULE = [
  { id:"ep_plan",       label:"Master Emergency Preparedness Plan", freq:"biennial",  months:24,   responsible:"Administrator" },
  { id:"contacts",      label:"Key Contacts Table",                  freq:"annual",    months:12,   responsible:"Administrator" },
  { id:"med_supply",    label:"Medical Supply Inventory",            freq:"quarterly", months:3,    responsible:"Clinical Manager" },
  { id:"equip_inv",     label:"Equipment Inventory",                 freq:"quarterly", months:3,    responsible:"Office Manager" },
  { id:"go_box",        label:"Emergency Go-Box Check",              freq:"quarterly", months:3,    responsible:"Administrator" },
  { id:"priority_list", label:"Patient Priority List",               freq:"weekly",    months:0.23, responsible:"Clinical Manager" },
  { id:"hva",           label:"Hazard Vulnerability Analysis",       freq:"biennial",  months:24,   responsible:"Administrator" },
  { id:"security",      label:"Security Vulnerability Assessment",   freq:"annual",    months:12,   responsible:"Administrator" },
  { id:"emp_forms",     label:"Employee Emergency Prep Forms",       freq:"annual",    months:12,   responsible:"HR Director" },
  { id:"patient_forms", label:"Individual Patient Prep Forms",       freq:"annual",    months:12,   responsible:"Dir. Clinical Svcs" },
  { id:"transfers",     label:"Transfer Agreements",                 freq:"annual",    months:12,   responsible:"Administrator" },
  { id:"drill",         label:"Emergency Drill / Tabletop Exercise", freq:"annual",    months:12,   responsible:"Administrator" },
  { id:"ics_training",  label:"NIMS / ICS Training — All Staff",     freq:"biennial",  months:24,   responsible:"Staff Dev. Coord." },
  { id:"fire_ext",      label:"Fire Extinguisher Inspection",        freq:"annual",    months:12,   responsible:"Maintenance Director" },
  { id:"cyber",         label:"Cyber Preparedness Checklist",        freq:"annual",    months:12,   responsible:"Admin / IT" },
];

const SUPPLY_ITEMS = [
  "First Aid Supplies (kit)","Band-Aids (box)","Gauze and Bandages (packs)",
  "Alcohol / Hydrogen Peroxide","Neosporin / Antiseptic",
  "Disposable Gloves (boxes of 100)","Disposable Gowns",
  "Surgical Masks (boxes)","N-95 Respirators","Protective Eyewear",
  "Eyewash Saline Solution","Hand Sanitizer (bottles)",
  "Sanitizing Wipes (canisters)","First Aid Tape",
  "Sterile 4x4 Gauze Pads (packs)","Normal Saline","Kling / Ace Bandages",
];
const SUPPLY_TARGETS = [2,2,5,5,3,10,10,10,20,10,5,15,10,5,10,10,10];

const HAZARDS = [
  "Snowstorm / Severe Weather","Fire and Evacuation",
  "Cyber-Attack / IT Systems Failure","Infectious Disease / Pandemic","General Emergency",
];

// ─── HELPERS ─────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}
function addMonths(base, months) {
  const d = new Date(base);
  d.setDate(d.getDate() + Math.round(months * 30.44));
  return d.toISOString().split("T")[0];
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function StatusPill({ days }) {
  const ps = (c, bg) => ({ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:20, fontSize:12, fontWeight:600, color:c, background:bg, whiteSpace:"nowrap" });
  if (days === null) return <span style={ps("#64748B","#F1F5F9")}>Not set</span>;
  if (days < 0)      return <span style={ps(T.red, T.redBg)}>Overdue {Math.abs(days)}d</span>;
  if (days <= 14)    return <span style={ps(T.amber, T.amberBg)}>Due in {days}d</span>;
  if (days <= 60)    return <span style={ps("#92400E","#FEF3C7")}>Due in {days}d</span>;
  return                    <span style={ps(T.green, T.greenBg)}>Due in {days}d</span>;
}

function Spinner() {
  return <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />;
}

async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role:"user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.find(c => c.type === "text")?.text || "";
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function EmergencyPreparednessPage() {
  const [tab, setTab]         = useState("dashboard");
  const [dates, setDates]     = useState({});
  const [actions, setActions] = useState([]);
  const [loaded, setLoaded]   = useState(false);

  // ── Load from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const [{ data: datesData }, { data: actionsData }] = await Promise.all([
          supabase.from("ep_compliance_dates").select("item_id, last_completed"),
          supabase.from("ep_corrective_actions").select("*").order("sort_order"),
        ]);
        if (datesData) {
          const map = {};
          datesData.forEach(r => { map[r.item_id] = r.last_completed; });
          setDates(map);
        }
        if (actionsData) setActions(actionsData);
      } catch (e) {
        console.error("EP load error:", e);
      }
      setLoaded(true);
    })();
  }, []);

  const markComplete = useCallback(async (id) => {
    const today = new Date().toISOString().split("T")[0];
    setDates(prev => ({ ...prev, [id]: today }));
    await supabase.from("ep_compliance_dates").upsert(
      { item_id: id, last_completed: today, updated_at: new Date().toISOString() },
      { onConflict: "item_id" }
    );
  }, []);

  const saveActions = useCallback(async (updated) => {
    setActions(updated);
    for (const a of updated) {
      await supabase.from("ep_corrective_actions").upsert(
        { ...a, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    }
  }, []);

  if (!loaded) return (
    <div style={{ padding:60, textAlign:"center", color:T.textLight, fontFamily:"sans-serif" }}>
      Loading Emergency Preparedness…
    </div>
  );

  const overdueCount = SCHEDULE.filter(s => {
    const last = dates[s.id];
    if (!last) return s.freq !== "biennial";
    return daysUntil(addMonths(last, s.months)) < 0;
  }).length;

  const openCount = actions.filter(a => a.status === "open").length;

  const TABS = [
    { id:"dashboard", label:"Dashboard" },
    { id:"templates", label:"Emergency Templates" },
    { id:"inventory", label:"Supply Inventory" },
    { id:"aar",       label:"After-Action Report" },
    { id:"actions",   label:`Corrective Actions${openCount > 0 ? ` (${openCount})` : ""}` },
  ];

  return (
    <div style={{ fontFamily:"'IBM Plex Sans', system-ui, sans-serif", background:T.bg, minHeight:"100vh", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; }
        input:focus, textarea:focus, select:focus { border-color:${T.teal} !important; box-shadow:0 0 0 3px ${T.tealBg}; }
        .ep-anim { animation:fadeIn 0.25s ease both; }
      `}</style>

      {/* MODULE HEADER */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Emergency Preparedness</h1>
          <div style={{ fontSize:13, color:T.textLight, marginTop:2 }}>CMS CoP 484.102 compliance tracking &amp; operational tools</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {overdueCount > 0 && (
            <div style={{ background:T.redBg, border:`1px solid #FECACA`, color:T.red, fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:20 }}>
              ⚠ {overdueCount} item{overdueCount > 1 ? "s" : ""} overdue
            </div>
          )}
          <div style={{ fontSize:12, color:T.textLight }}>
            {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" })}
          </div>
        </div>
      </div>

      {/* TAB NAV */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"0 24px", display:"flex", gap:0, position:"sticky", top:0, zIndex:50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"12px 16px", fontSize:14, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? T.navy : T.textLight,
            background:"transparent", border:"none",
            borderBottom: tab === t.id ? `2px solid ${T.teal}` : "2px solid transparent",
            cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding:"24px", maxWidth:1100, margin:"0 auto" }} className="ep-anim" key={tab}>
        {tab === "dashboard" && <Dashboard dates={dates} actions={actions} onMark={markComplete} />}
        {tab === "templates" && <Templates />}
        {tab === "inventory" && <Inventory dates={dates} onMark={markComplete} />}
        {tab === "aar"       && <AfterAction />}
        {tab === "actions"   && <CorrectiveActions actions={actions} onChange={saveActions} />}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────
function Dashboard({ dates, actions, onMark }) {
  const items = SCHEDULE.map(s => {
    const last = dates[s.id] || null;
    const next = last ? addMonths(last, s.months) : null;
    const days = daysUntil(next);
    return { ...s, last, next, days };
  });

  const overdue  = items.filter(i => i.days !== null && i.days < 0).length;
  const soon     = items.filter(i => i.days !== null && i.days >= 0 && i.days <= 30).length;
  const current  = items.filter(i => i.days !== null && i.days > 30).length;
  const notSet   = items.filter(i => i.days === null).length;
  const openActs = actions.filter(a => a.status === "open").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {overdue > 0 && (
        <div style={{ background:T.redBg, border:`1px solid #FECACA`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16, color:T.red }}>⚠</span>
          <span style={{ fontSize:14, color:T.red, fontWeight:500 }}>
            {overdue} compliance item{overdue > 1 ? "s" : ""} are overdue. Review and update immediately.
          </span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))", gap:12 }}>
        {[
          { label:"Overdue",      value:overdue,  color:T.red,   bg:T.redBg },
          { label:"Due ≤30 days", value:soon,     color:T.amber, bg:T.amberBg },
          { label:"Current",      value:current,  color:T.green, bg:T.greenBg },
          { label:"Date Not Set", value:notSet,   color:T.slate, bg:"#F1F5F9" },
          { label:"Open Actions", value:openActs, color:T.blue,  bg:T.blueBg },
        ].map(m => (
          <div key={m.label} style={{ background:m.bg, border:`1px solid ${m.color}30`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:28, fontWeight:700, color:m.color, fontFamily:"IBM Plex Mono, monospace", lineHeight:1 }}>{m.value}</div>
            <div style={{ fontSize:12, color:m.color, marginTop:4, fontWeight:500, opacity:0.85 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h2 style={S.h2}>Compliance Calendar</h2>
          <span style={{ fontSize:12, color:T.textLight }}>Click "Done" to mark a review complete today</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
          {[...items].sort((a,b) => (a.days??9999) - (b.days??9999)).map((item, i) => (
            <div key={item.id} style={{
              display:"grid", gridTemplateColumns:"1fr auto 160px 100px",
              alignItems:"center", gap:12, padding:"10px 12px",
              background: i % 2 === 0 ? "transparent" : "#F8FAFC", borderRadius:6,
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:T.text }}>{item.label}</div>
                <div style={{ fontSize:12, color:T.textLight, marginTop:1 }}>
                  {item.responsible} · {item.freq}
                  {item.last && <span style={{ marginLeft:6 }}>· Last: {fmtDate(item.last)}</span>}
                </div>
              </div>
              <div style={{ fontSize:12, color:T.textLight, textAlign:"right" }}>
                {item.next ? `Next: ${fmtDate(item.next)}` : "—"}
              </div>
              <div style={{ textAlign:"center" }}>
                <StatusPill days={item.days} />
              </div>
              <div style={{ textAlign:"right" }}>
                <button onClick={() => onMark(item.id)} style={{ ...S.btnSm, fontSize:12 }}>✓ Done</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EMERGENCY TEMPLATES ─────────────────────────────────────────
function Templates() {
  const [hazard,   setHazard]   = useState("");
  const [audience, setAudience] = useState("staff");
  const [severity, setSeverity] = useState("active");
  const [context,  setContext]  = useState("");
  const [result,   setResult]   = useState("");
  const [loading,  setLoading]  = useState(false);

  async function generate() {
    if (!hazard) return;
    setLoading(true); setResult("");
    try {
      const sys = `You are an emergency communications specialist for Vitalis Healthcare Services, LLC, a home health agency in Silver Spring, MD (8757 Georgia Avenue, Suite 440). Agency contacts: Administrator (240) 716-6874, Clinical Manager (240) 423-8757, Director of Clinical Services (301) 237-2436. Write clear, professional, calm, action-oriented emergency communications for a healthcare setting.`;
      const usr = `Generate an emergency communication for:
Hazard type: ${hazard}
Audience: ${audience === "staff" ? "Agency staff (nurses, aides, clinical managers)" : audience === "patients" ? "Patients and/or their family members" : "Both staff and patients/families"}
Emergency status: ${severity === "active" ? "ACTIVE — emergency is happening now" : severity === "watch" ? "WATCH — emergency may be coming in 24-48 hours, prepare now" : "RECOVERY — emergency has passed, resuming operations"}
Additional context: ${context || "No additional context provided."}

Generate both an EMAIL version (with subject line) and a TEXT/SMS version (under 160 characters). Format clearly with headers. Include relevant agency phone numbers.`;
      setResult(await callClaude(sys, usr));
    } catch(e) { setResult("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ background:T.tealBg, border:`1px solid ${T.teal}30`, borderRadius:10, padding:"12px 16px" }}>
        <div style={{ fontSize:14, color:T.teal, fontWeight:600, marginBottom:2 }}>AI-Powered Communication Templates</div>
        <div style={{ fontSize:13, color:T.textMid }}>Generate customized emergency communications for any hazard scenario. Claude drafts staff emails, patient notifications, and SMS messages tailored to Vitalis's protocols and contacts.</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
        <div style={S.cardSm}>
          <label style={S.label}>Hazard Type</label>
          <select value={hazard} onChange={e=>setHazard(e.target.value)} style={S.select}>
            <option value="">Select hazard…</option>
            {HAZARDS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div style={S.cardSm}>
          <label style={S.label}>Audience</label>
          <select value={audience} onChange={e=>setAudience(e.target.value)} style={S.select}>
            <option value="staff">Staff Only</option>
            <option value="patients">Patients / Families Only</option>
            <option value="both">Staff + Patients / Families</option>
          </select>
        </div>
        <div style={S.cardSm}>
          <label style={S.label}>Emergency Status</label>
          <select value={severity} onChange={e=>setSeverity(e.target.value)} style={S.select}>
            <option value="watch">Watch / Warning (Advance Notice)</option>
            <option value="active">Active Emergency</option>
            <option value="recovery">Recovery (All Clear)</option>
          </select>
        </div>
      </div>

      <div style={S.card}>
        <label style={S.label}>Additional Context (optional)</label>
        <textarea value={context} onChange={e=>setContext(e.target.value)} style={S.textarea}
          placeholder="e.g. NWS has issued a Winter Storm WARNING for Montgomery County. Expected 6-10 inches of snow starting tonight. All morning visits suspended until further notice…" />
        <div style={{ marginTop:12 }}>
          <button onClick={generate} disabled={!hazard || loading} style={{ ...S.btnTeal, opacity:(!hazard||loading)?0.6:1 }}>
            {loading ? <Spinner /> : "✦"} {loading ? "Generating…" : "Generate Communications"}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ ...S.card, borderLeft:`4px solid ${T.teal}` }} className="ep-anim">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={S.h3}>Generated Communication Templates</h3>
            <button onClick={() => navigator.clipboard?.writeText(result)} style={S.btnSm}>Copy All</button>
          </div>
          <pre style={{ fontSize:13, lineHeight:1.7, color:T.textMid, whiteSpace:"pre-wrap", fontFamily:"IBM Plex Mono, monospace", margin:0, background:"#F8FAFC", padding:16, borderRadius:8 }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── SUPPLY INVENTORY ────────────────────────────────────────────
function Inventory({ dates, onMark }) {
  const [quarter,    setQuarter]    = useState("Q1");
  const [year,       setYear]       = useState(new Date().getFullYear().toString());
  const [counts,     setCounts]     = useState(() => Object.fromEntries(SUPPLY_ITEMS.map(i => [i, ""])));
  const [verifiedBy, setVerifiedBy] = useState("");
  const [analysis,   setAnalysis]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [saved,      setSaved]      = useState(false);

  async function analyzeInventory() {
    setLoading(true); setAnalysis("");
    const lines = SUPPLY_ITEMS.map((item, i) => {
      const count = parseInt(counts[item]) || 0;
      const target = SUPPLY_TARGETS[i];
      return `${item}: count=${count}, target=${target}, pct=${target > 0 ? Math.round((count/target)*100) : 100}%`;
    }).join("\n");
    try {
      const sys = `You are a clinical operations analyst for Vitalis Healthcare Services, a home health agency. Analyze medical supply inventory data and provide clear, actionable emergency preparedness assessments. Be direct and specific.`;
      const usr = `Analyze this quarterly supply inventory for ${quarter} ${year}. Identify: (1) items critically low (<50% of target), (2) items needing ordering (50-79%), (3) adequate items (≥80%), (4) any immediate action required. End with an overall readiness assessment and priority order list.\n\n${lines}`;
      setAnalysis(await callClaude(sys, usr));
    } catch(e) { setAnalysis("Error: " + e.message); }
    setLoading(false);
  }

  function saveInventory() {
    onMark("med_supply");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"150px 150px 1fr auto", gap:12, alignItems:"end" }}>
        <div>
          <label style={S.label}>Quarter</label>
          <select value={quarter} onChange={e=>setQuarter(e.target.value)} style={S.select}>
            {["Q1","Q2","Q3","Q4"].map(q=><option key={q}>{q}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Year</label>
          <input value={year} onChange={e=>setYear(e.target.value)} style={S.input} type="number" min={2020} max={2030} />
        </div>
        <div>
          <label style={S.label}>Verified By</label>
          <input value={verifiedBy} onChange={e=>setVerifiedBy(e.target.value)} style={S.input} placeholder="Name and role" />
        </div>
        <div style={{ paddingBottom:1 }}>
          <button onClick={saveInventory} style={{ ...S.btnPrimary, background: saved ? T.green : T.navy }}>
            {saved ? "✓ Saved" : "Save & Mark Done"}
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={S.h2}>Medical Supply Count — {quarter} {year}</h2>
          <button onClick={analyzeInventory} disabled={loading} style={{ ...S.btnTeal, opacity:loading?0.6:1 }}>
            {loading ? <Spinner /> : "✦"} {loading ? "Analyzing…" : "AI Analysis"}
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {SUPPLY_ITEMS.map((item, i) => {
            const count = parseInt(counts[item]) || 0;
            const target = SUPPLY_TARGETS[i];
            const pct = count >= target ? 100 : Math.round((count/target)*100);
            const color = !counts[item] ? T.borderMd : count === 0 ? T.red : pct < 50 ? T.red : pct < 80 ? T.amber : T.green;
            return (
              <div key={item} style={{ display:"grid", gridTemplateColumns:"1fr 80px 50px", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:6, background:"#F8FAFC", border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:13, color:T.textMid }}>{item}</div>
                <input type="number" min={0} value={counts[item]}
                  onChange={e => setCounts(c => ({...c, [item]:e.target.value}))}
                  style={{ ...S.input, textAlign:"center", padding:"5px 8px", fontSize:13 }}
                  placeholder="0" />
                <div style={{ fontSize:11, textAlign:"right" }}>
                  <span style={{ color }}>{counts[item] ? `${pct}%` : ""}</span>
                  <div style={{ color:T.slateLight }}>/{target}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {analysis && (
        <div style={{ ...S.card, borderLeft:`4px solid ${T.teal}` }} className="ep-anim">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={S.h3}>AI Inventory Analysis</h3>
            <span style={{ fontSize:12, color:T.textLight }}>AI-generated — verify with clinical judgment</span>
          </div>
          <pre style={{ fontSize:13, lineHeight:1.7, color:T.textMid, whiteSpace:"pre-wrap", fontFamily:"IBM Plex Mono, monospace", margin:0 }}>{analysis}</pre>
        </div>
      )}
    </div>
  );
}

// ─── AFTER-ACTION REPORT ─────────────────────────────────────────
function AfterAction() {
  const [form, setForm] = useState({
    date:"", type:"Tabletop Exercise", hazard:"Snowstorm / Severe Weather",
    ic:"", declared:"",
    ...Object.fromEntries(Array.from({length:15},(_,i) => [`q${i+1}`, ""])),
    worked:"", gaps:"", notes:"",
  });
  const [report,  setReport]  = useState("");
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setForm(f => ({...f, [k]:v}));

  const QUESTIONS = [
    "All staff notified within required timeframes?",
    "Patient care staff knew what to do?",
    "Ancillary staff knew what to do?",
    "Patient priority list retrieved quickly?",
    "Level I patients contacted within 2 hours?",
    "Level II patients contacted within 4 hours?",
    "Staff identified Agency command structure?",
    "Staff knew communication procedures?",
    "Communication with community partners intact?",
    "Backup communication systems effective?",
    "Staff knew what to do if no communications?",
    "Transfer partner contacts readily available?",
    "Go-Box accessible and complete?",
    "Incident Commander clearly managed incident?",
    "All actions documented in Incident Log?",
  ];

  async function generateReport() {
    setLoading(true); setReport("");
    const yes = QUESTIONS.filter((_,i) => form[`q${i+1}`]==="yes").length;
    const no  = QUESTIONS.filter((_,i) => form[`q${i+1}`]==="no").length;
    const qLines = QUESTIONS.map((q,i) => `${i+1}. ${q} → ${form[`q${i+1}`]||"not answered"}`).join("\n");
    try {
      const sys = `You are a compliance officer writing after-action reports for Vitalis Healthcare Services, a home health agency. Write professional, specific, regulatory-quality reports suitable for CMS and Joint Commission review. Be concrete, not vague.`;
      const usr = `Generate a formal After-Action Report for Vitalis Healthcare Services, LLC (8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910).

Event Date: ${form.date || "Not specified"}
Event Type: ${form.type}
Hazard Scenario: ${form.hazard}
Incident Commander: ${form.ic || "Not specified"}
Declared By: ${form.declared || "Not specified"}

EVALUATION CHECKLIST (${yes} YES, ${no} NO):
${qLines}

WHAT WORKED WELL: ${form.worked || "Not provided"}
GAPS / WHAT DID NOT WORK: ${form.gaps || "Not provided"}
ADDITIONAL NOTES: ${form.notes || "None"}

Generate a complete After-Action Report with: Executive Summary, Performance Assessment, Root Cause Analysis for any gaps, and 3-5 specific Corrective Actions with responsible parties and timeframes. Flag any findings requiring regulatory reporting.`;
      setReport(await callClaude(sys, usr));
    } catch(e) { setReport("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, flexWrap:"wrap" }}>
        {[
          { label:"Event Date",          key:"date",     type:"date" },
          { label:"Event Type",          key:"type",     type:"select", opts:["Tabletop Exercise","Communication Drill","Full-Scale Exercise","Actual Emergency Event","Supply Check Drill","Priority List Drill"] },
          { label:"Hazard Scenario",     key:"hazard",   type:"select", opts:HAZARDS },
          { label:"Incident Commander",  key:"ic",       type:"text",   ph:"Name and role" },
          { label:"Emergency Declared By", key:"declared", type:"text", ph:"Name and role" },
        ].map(f => (
          <div key={f.key} style={S.cardSm}>
            <label style={S.label}>{f.label}</label>
            {f.type === "select" ? (
              <select value={form[f.key]} onChange={e=>update(f.key,e.target.value)} style={S.select}>
                {f.opts.map(o=><option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type} value={form[f.key]} onChange={e=>update(f.key,e.target.value)} style={S.input} placeholder={f.ph||""} />
            )}
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={{ ...S.h3, marginBottom:14 }}>Evaluation Checklist</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {QUESTIONS.map((q, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12, padding:"8px 10px", background:i%2===0?"#F8FAFC":"transparent", borderRadius:6 }}>
              <div style={{ fontSize:13, color:T.textMid }}>{i+1}. {q}</div>
              <div style={{ display:"flex", gap:6 }}>
                {["yes","no","n/a"].map(v => (
                  <button key={v} onClick={() => update(`q${i+1}`, form[`q${i+1}`]===v ? "" : v)} style={{
                    padding:"4px 12px", fontSize:12, fontWeight:500, borderRadius:5, cursor:"pointer",
                    border:`1px solid ${v==="yes"?T.green:v==="no"?T.red:T.borderMd}`,
                    background: form[`q${i+1}`]===v ? (v==="yes"?T.greenBg:v==="no"?T.redBg:T.bg) : "transparent",
                    color: form[`q${i+1}`]===v ? (v==="yes"?T.green:v==="no"?T.red:T.slate) : T.textLight,
                  }}>{v.toUpperCase()}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label style={S.label}>What Worked Well</label>
            <textarea value={form.worked} onChange={e=>update("worked",e.target.value)} style={S.textarea} placeholder="Describe what functioned as planned…" />
          </div>
          <div>
            <label style={S.label}>Gaps / What Did Not Work</label>
            <textarea value={form.gaps} onChange={e=>update("gaps",e.target.value)} style={S.textarea} placeholder="Describe failures, deviations, or gaps…" />
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          <label style={S.label}>Additional Notes</label>
          <textarea value={form.notes} onChange={e=>update("notes",e.target.value)} style={{ ...S.textarea, minHeight:60 }} placeholder="Any additional observations…" />
        </div>
        <div style={{ marginTop:16 }}>
          <button onClick={generateReport} disabled={loading} style={{ ...S.btnTeal, opacity:loading?0.6:1 }}>
            {loading ? <Spinner /> : "✦"} {loading ? "Generating Report…" : "Generate AI After-Action Report"}
          </button>
        </div>
      </div>

      {report && (
        <div style={{ ...S.card, borderLeft:`4px solid ${T.teal}` }} className="ep-anim">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={S.h3}>AI-Generated After-Action Report</h3>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:12, color:T.textLight }}>Review and edit before filing</span>
              <button onClick={() => navigator.clipboard?.writeText(report)} style={S.btnSm}>Copy</button>
            </div>
          </div>
          <pre style={{ fontSize:13, lineHeight:1.7, color:T.textMid, whiteSpace:"pre-wrap", fontFamily:"IBM Plex Mono, monospace", margin:0 }}>{report}</pre>
        </div>
      )}
    </div>
  );
}

// ─── CORRECTIVE ACTIONS ──────────────────────────────────────────
function CorrectiveActions({ actions, onChange }) {
  const [adding,    setAdding]    = useState(false);
  const [newItem,   setNewItem]   = useState({ finding:"", responsible:"", due:"", note:"" });
  const [aiInput,   setAiInput]   = useState("");
  const [aiResult,  setAiResult]  = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  function update(id, field, val) {
    onChange(actions.map(a => a.id === id ? {...a, [field]:val} : a));
  }

  function addAction() {
    if (!newItem.finding) return;
    onChange([...actions, { ...newItem, id:"u"+Date.now(), status:"open", sort_order:actions.length+1 }]);
    setNewItem({ finding:"", responsible:"", due:"", note:"" });
    setAdding(false);
  }

  async function getAiGuidance() {
    if (!aiInput) return;
    setAiLoading(true); setAiResult("");
    try {
      const sys = `You are a healthcare compliance consultant advising Vitalis Healthcare Services, a home health agency in Silver Spring, MD. Provide specific, actionable guidance for corrective actions. Be direct and practical. Reference Joint Commission EM standards and CMS CoP 484.102 where relevant.`;
      const usr = `I need guidance on how to resolve this emergency preparedness compliance gap:\n\n${aiInput}\n\nProvide: (1) Why this matters for compliance, (2) Specific steps to resolve it, (3) What documentation is needed, (4) A suggested target timeline.`;
      setAiResult(await callClaude(sys, usr));
    } catch(e) { setAiResult("Error: " + e.message); }
    setAiLoading(false);
  }

  const open = actions.filter(a => a.status === "open");
  const done = actions.filter(a => a.status !== "open");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h2 style={S.h2}>Corrective Actions</h2>
          <div style={{ fontSize:13, color:T.textLight, marginTop:2 }}>{open.length} open · {done.length} completed</div>
        </div>
        <button onClick={() => setAdding(a=>!a)} style={S.btnPrimary}>+ Add Action</button>
      </div>

      {adding && (
        <div style={{ ...S.card, border:`1px solid ${T.teal}` }} className="ep-anim">
          <h3 style={{ ...S.h3, marginBottom:14 }}>New Corrective Action</h3>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={S.label}>Finding / Action Required</label>
              <input value={newItem.finding} onChange={e=>setNewItem(n=>({...n,finding:e.target.value}))} style={S.input} placeholder="Describe the gap or required action" />
            </div>
            <div>
              <label style={S.label}>Responsible</label>
              <input value={newItem.responsible} onChange={e=>setNewItem(n=>({...n,responsible:e.target.value}))} style={S.input} placeholder="Name / role" />
            </div>
            <div>
              <label style={S.label}>Target Date</label>
              <input type="date" value={newItem.due} onChange={e=>setNewItem(n=>({...n,due:e.target.value}))} style={S.input} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={S.label}>Notes</label>
            <textarea value={newItem.note} onChange={e=>setNewItem(n=>({...n,note:e.target.value}))} style={{ ...S.textarea, minHeight:60 }} placeholder="Any additional notes or context" />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addAction} style={S.btnPrimary}>Add Action</button>
            <button onClick={() => setAdding(false)} style={S.btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={{ ...S.h3, marginBottom:10 }}>AI Compliance Guidance</h3>
        <div style={{ display:"flex", gap:10 }}>
          <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)}
            style={{ ...S.textarea, minHeight:60, flex:1 }}
            placeholder="Describe a compliance gap or finding and ask Claude for specific guidance on how to resolve it…" />
          <button onClick={getAiGuidance} disabled={!aiInput||aiLoading}
            style={{ ...S.btnTeal, alignSelf:"flex-start", opacity:(!aiInput||aiLoading)?0.6:1 }}>
            {aiLoading ? <Spinner /> : "✦"} {aiLoading ? "…" : "Ask"}
          </button>
        </div>
        {aiResult && (
          <pre style={{ fontSize:13, lineHeight:1.6, color:T.textMid, whiteSpace:"pre-wrap", fontFamily:"IBM Plex Mono, monospace", margin:"12px 0 0", background:"#F8FAFC", padding:14, borderRadius:8 }}>
            {aiResult}
          </pre>
        )}
      </div>

      {open.length > 0 && (
        <div style={S.card}>
          <h3 style={{ ...S.h3, marginBottom:14, color:T.red }}>Open Actions ({open.length})</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {open.map(a => <ActionRow key={a.id} action={a} onUpdate={update} />)}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div style={S.card}>
          <h3 style={{ ...S.h3, marginBottom:14, color:T.green }}>Completed Actions ({done.length})</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {done.map(a => <ActionRow key={a.id} action={a} onUpdate={update} completed />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRow({ action, onUpdate, completed }) {
  const [expanded, setExpanded] = useState(false);
  const days = daysUntil(action.due);
  return (
    <div style={{ border:`1px solid ${completed ? T.border : (days!==null&&days<0 ? "#FECACA" : T.border)}`, borderRadius:8, overflow:"hidden", background: completed ? "#F8FAFC" : T.card }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:10, padding:"10px 12px", alignItems:"center", cursor:"pointer" }} onClick={()=>setExpanded(e=>!e)}>
        <div>
          <div style={{ fontSize:14, fontWeight:500, color:completed?T.textLight:T.text, textDecoration:completed?"line-through":"none" }}>{action.finding}</div>
          <div style={{ fontSize:12, color:T.textLight, marginTop:2 }}>
            {action.responsible && <span>{action.responsible}</span>}
            {action.due && <span style={{ marginLeft:8 }}>Due: {fmtDate(action.due)}</span>}
          </div>
        </div>
        {action.due && <StatusPill days={days} />}
        <select value={action.status} onChange={e=>{e.stopPropagation();onUpdate(action.id,"status",e.target.value);}}
          style={{ padding:"4px 8px", fontSize:12, border:`1px solid ${T.borderMd}`, borderRadius:5, cursor:"pointer", color:T.textMid }}>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
        <span style={{ color:T.slateLight, fontSize:12 }}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div style={{ borderTop:`1px solid ${T.border}`, padding:"10px 12px", background:"#F8FAFC" }} className="ep-anim">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:10 }}>
            <div>
              <label style={S.label}>Responsible</label>
              <input value={action.responsible} onChange={e=>onUpdate(action.id,"responsible",e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Target Date</label>
              <input type="date" value={action.due||""} onChange={e=>onUpdate(action.id,"due",e.target.value)} style={S.input} />
            </div>
          </div>
          <label style={S.label}>Notes / Progress</label>
          <textarea value={action.note} onChange={e=>onUpdate(action.id,"note",e.target.value)}
            style={{ ...S.textarea, minHeight:60 }} placeholder="Progress notes, obstacles, updates…" />
        </div>
      )}
    </div>
  );
}
