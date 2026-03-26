"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── DESIGN TOKENS ─────────────────────────────────────────────────
const T = {
  navy:"#0D1E35",teal:"#0B8A82",tealBg:"#E3F7F6",tealDark:"#0A6B65",
  amber:"#C96B15",amberBg:"#FEF3E2",red:"#B91C1C",redBg:"#FEF2F2",
  green:"#15803D",greenBg:"#F0FDF4",blue:"#1D4ED8",blueBg:"#EFF6FF",
  slate:"#475569",slateLight:"#94A3B8",border:"#E2E8F0",borderMd:"#CBD5E1",
  bg:"#F8FAFC",card:"#FFFFFF",text:"#0F172A",textMid:"#334155",textLight:"#64748B",
};
const S = {
  card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"1.25rem"},
  cardSm:{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"1rem"},
  h2:{fontSize:20,fontWeight:700,color:T.navy,margin:0},
  h3:{fontSize:15,fontWeight:600,color:T.navy,margin:0},
  label:{fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:T.textLight,textTransform:"uppercase",display:"block",marginBottom:4},
  input:{width:"100%",padding:"8px 12px",border:`1px solid ${T.borderMd}`,borderRadius:6,fontSize:14,color:T.text,background:T.card,outline:"none",boxSizing:"border-box"},
  textarea:{width:"100%",padding:"8px 12px",border:`1px solid ${T.borderMd}`,borderRadius:6,fontSize:14,color:T.text,background:T.card,outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:80},
  select:{width:"100%",padding:"8px 12px",border:`1px solid ${T.borderMd}`,borderRadius:6,fontSize:14,color:T.text,background:T.card,outline:"none"},
  btnPrimary:{padding:"8px 18px",background:T.navy,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  btnTeal:{padding:"8px 18px",background:T.teal,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  btnSecondary:{padding:"7px 14px",background:"transparent",color:T.navy,border:`1px solid ${T.borderMd}`,borderRadius:7,fontSize:13,fontWeight:500,cursor:"pointer"},
  btnSm:{padding:"4px 10px",fontSize:12,fontWeight:500,cursor:"pointer",borderRadius:5,border:`1px solid ${T.borderMd}`,background:T.card,color:T.textMid},
  btnDanger:{padding:"4px 10px",fontSize:12,fontWeight:500,cursor:"pointer",borderRadius:5,border:`1px solid #FECACA`,background:T.redBg,color:T.red},
};

// ── HELPERS ───────────────────────────────────────────────────────
function daysUntil(d){if(!d)return null;return Math.ceil((new Date(d)-new Date())/86400000);}
function addMonths(b,m){const d=new Date(b);d.setDate(d.getDate()+Math.round(m*30.44));return d.toISOString().split("T")[0];}
function fmtDate(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function fmtDateLong(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});}
function todayStr(){return new Date().toISOString().split("T")[0];}

function Pill({label,color,bg}){return<span style={{padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,color,background:bg,whiteSpace:"nowrap"}}>{label}</span>;}
function StatusPill({days}){
  if(days===null)return<Pill label="Not set" color="#64748B" bg="#F1F5F9"/>;
  if(days<0)return<Pill label={`Overdue ${Math.abs(days)}d`} color={T.red} bg={T.redBg}/>;
  if(days<=14)return<Pill label={`Due in ${days}d`} color={T.amber} bg={T.amberBg}/>;
  if(days<=60)return<Pill label={`Due in ${days}d`} color="#92400E" bg="#FEF3C7"/>;
  return<Pill label={`Due in ${days}d`} color={T.green} bg={T.greenBg}/>;
}
function Spinner(){return<span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;}
function SaveBadge({msg}){return msg?<span style={{background:T.greenBg,color:T.green,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:700}}>✓ {msg}</span>:null;}

async function callClaude(sys,usr){
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:usr}]})});
  const data=await res.json();if(data.error)throw new Error(data.error.message);
  return data.content?.find(c=>c.type==="text")?.text||"";
}

// ── SCHEDULE ──────────────────────────────────────────────────────
const SCHEDULE=[
  {id:"ep_plan",label:"Master Emergency Preparedness Plan",freq:"biennial",months:24,responsible:"Administrator"},
  {id:"contacts",label:"Key Contacts Table",freq:"annual",months:12,responsible:"Administrator"},
  {id:"med_supply",label:"Medical Supply Inventory",freq:"quarterly",months:3,responsible:"Clinical Manager"},
  {id:"equip_inv",label:"Equipment Inventory",freq:"quarterly",months:3,responsible:"Office Manager"},
  {id:"go_box",label:"Emergency Go-Box Check",freq:"quarterly",months:3,responsible:"Administrator"},
  {id:"priority_list",label:"Patient Priority List",freq:"weekly",months:0.23,responsible:"Clinical Manager"},
  {id:"hva",label:"Hazard Vulnerability Analysis",freq:"biennial",months:24,responsible:"Administrator"},
  {id:"security",label:"Security Vulnerability Assessment",freq:"annual",months:12,responsible:"Administrator"},
  {id:"emp_forms",label:"Employee Emergency Prep Forms",freq:"annual",months:12,responsible:"HR Director"},
  {id:"patient_forms",label:"Individual Patient Prep Forms",freq:"annual",months:12,responsible:"Dir. Clinical Svcs"},
  {id:"transfers",label:"Transfer Agreements",freq:"annual",months:12,responsible:"Administrator"},
  {id:"drill",label:"Emergency Drill / Tabletop Exercise",freq:"annual",months:12,responsible:"Administrator"},
  {id:"ics_training",label:"NIMS / ICS Training — All Staff",freq:"biennial",months:24,responsible:"Staff Dev. Coord."},
  {id:"fire_ext",label:"Fire Extinguisher Inspection",freq:"annual",months:12,responsible:"Maintenance Director"},
  {id:"cyber",label:"Cyber Preparedness Checklist",freq:"annual",months:12,responsible:"Admin / IT"},
];

const SUPPLY_ITEMS=["First Aid Supplies (kit)","Band-Aids (box)","Gauze and Bandages (packs)","Alcohol / Hydrogen Peroxide","Neosporin / Antiseptic","Disposable Gloves (boxes of 100)","Disposable Gowns","Surgical Masks (boxes)","N-95 Respirators","Protective Eyewear","Eyewash Saline Solution","Hand Sanitizer (bottles)","Sanitizing Wipes (canisters)","First Aid Tape","Sterile 4x4 Gauze Pads (packs)","Normal Saline","Kling / Ace Bandages"];
const SUPPLY_TARGETS=[2,2,5,5,3,10,10,10,20,10,5,15,10,5,10,10,10];
const HAZARDS=["Snowstorm / Severe Weather","Fire and Evacuation","Cyber-Attack / IT Systems Failure","Infectious Disease / Pandemic","General Emergency"];

// ── MAIN PAGE ─────────────────────────────────────────────────────
export default function EPPage(){
  const [tab,setTab]=useState("dashboard");
  const [dates,setDates]=useState({});
  const [actions,setActions]=useState([]);
  const [versions,setVersions]=useState([]);
  const [latestSupply,setLatestSupply]=useState(null);
  // full data tables
  const [contacts,setContacts]=useState([]);
  const [hvaScores,setHvaScores]=useState([]);
  const [icsRoles,setIcsRoles]=useState([]);
  const [equipInv,setEquipInv]=useState([]);
  const [goBox,setGoBox]=useState([]);
  const [drills,setDrills]=useState([]);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const [
          {data:dD},{data:aD},{data:vD},{data:sD},
          {data:cD},{data:hD},{data:iD},{data:eD},{data:gD},{data:drD}
        ]=await Promise.all([
          supabase.from("ep_compliance_dates").select("item_id,last_completed"),
          supabase.from("ep_corrective_actions").select("*").order("sort_order"),
          supabase.from("ep_plan_versions").select("*").order("generated_at",{ascending:false}),
          supabase.from("ep_supply_snapshots").select("*").order("saved_at",{ascending:false}).limit(1),
          supabase.from("ep_contacts").select("*").order("sort_order"),
          supabase.from("ep_hva_scores").select("*").order("sort_order"),
          supabase.from("ep_ics_roles").select("*").order("sort_order"),
          supabase.from("ep_equipment_inventory").select("*").order("sort_order"),
          supabase.from("ep_gobox_items").select("*").order("sort_order"),
          supabase.from("ep_drill_records").select("*").order("sort_order"),
        ]);
        if(dD){const m={};dD.forEach(r=>{m[r.item_id]=r.last_completed;});setDates(m);}
        if(aD)setActions(aD);
        if(vD)setVersions(vD);
        if(sD&&sD.length>0)setLatestSupply(sD[0]);
        if(cD)setContacts(cD);
        if(hD)setHvaScores(hD);
        if(iD)setIcsRoles(iD);
        if(eD)setEquipInv(eD);
        if(gD)setGoBox(gD);
        if(drD)setDrills(drD);
      }catch(e){console.error(e);}
      setLoaded(true);
    })();
  },[]);

  const markComplete=useCallback(async(id)=>{
    const t=todayStr();setDates(p=>({...p,[id]:t}));
    await supabase.from("ep_compliance_dates").upsert({item_id:id,last_completed:t,updated_at:new Date().toISOString()},{onConflict:"item_id"});
  },[]);

  const saveActions=useCallback(async(updated)=>{
    setActions(updated);
    for(const a of updated){await supabase.from("ep_corrective_actions").upsert({...a,updated_at:new Date().toISOString()},{onConflict:"id"});}
  },[]);

  const saveSupplySnapshot=useCallback(async(snap)=>{
    const{data}=await supabase.from("ep_supply_snapshots").insert(snap).select().single();
    if(data)setLatestSupply(data);return data;
  },[]);

  const saveVersion=useCallback(async(vd)=>{
    const{data}=await supabase.from("ep_plan_versions").insert(vd).select().single();
    if(data)setVersions(p=>[data,...p]);return data;
  },[]);

  if(!loaded)return<div style={{padding:60,textAlign:"center",color:T.textLight,fontFamily:"system-ui"}}>Loading Emergency Preparedness…</div>;

  const overdueCount=SCHEDULE.filter(s=>{const last=dates[s.id];if(!last)return s.freq!=="biennial";return daysUntil(addMonths(last,s.months))<0;}).length;
  const openCount=actions.filter(a=>a.status==="open").length;

  const TABS=[
    {id:"dashboard",label:"Dashboard"},
    {id:"contacts",label:"Key Contacts"},
    {id:"hva",label:"HVA Scoring"},
    {id:"ics",label:"ICS Roles"},
    {id:"inventory",label:"Supply Inventory"},
    {id:"equipment",label:"Equipment"},
    {id:"gobox",label:"Go-Box"},
    {id:"drills",label:"Drills"},
    {id:"security",label:`Security Gaps${openCount>0?` (${openCount})`:""}`},
    {id:"templates",label:"Templates"},
    {id:"aar",label:"After-Action"},
    {id:"liveplan",label:"📄 Live Plan"},
  ];

  const sharedProps={dates,actions,versions,latestSupply,contacts,hvaScores,icsRoles,equipInv,goBox,drills,
    setContacts,setHvaScores,setIcsRoles,setEquipInv,setGoBox,setDrills,
    markComplete,saveActions,saveSupplySnapshot,saveVersion};

  return(
    <div style={{fontFamily:"'IBM Plex Sans',system-ui,sans-serif",background:T.bg,minHeight:"100vh",color:T.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        *{box-sizing:border-box;}
        input:focus,textarea:focus,select:focus{border-color:${T.teal}!important;box-shadow:0 0 0 3px ${T.tealBg};}
        .ep-anim{animation:fadeIn 0.2s ease both;}
        @media print{.ep-no-print{display:none!important;}body{background:white!important;}}
      `}</style>

      <div className="ep-no-print" style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontSize:18,fontWeight:700,color:T.navy,margin:0}}>Emergency Preparedness</h1>
          <div style={{fontSize:12,color:T.textLight,marginTop:1}}>CMS CoP 484.102 · All sections editable · Live Plan Document auto-updates</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {overdueCount>0&&<div style={{background:T.redBg,border:"1px solid #FECACA",color:T.red,fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20}}>⚠ {overdueCount} overdue</div>}
          <div style={{fontSize:12,color:T.textLight}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
      </div>

      {/* TAB NAV — scrollable */}
      <div className="ep-no-print" style={{background:T.card,borderBottom:`1px solid ${T.border}`,overflowX:"auto",whiteSpace:"nowrap",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"inline-flex",padding:"0 16px"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"11px 14px",fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?T.teal:T.textLight,background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${T.teal}`:"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 24px",maxWidth:tab==="liveplan"?1000:1140,margin:"0 auto"}} className="ep-anim" key={tab}>
        {tab==="dashboard"&&<Dashboard {...sharedProps}/>}
        {tab==="contacts"&&<ContactsEditor contacts={contacts} setContacts={setContacts} markComplete={markComplete} dates={dates}/>}
        {tab==="hva"&&<HVAEditor hvaScores={hvaScores} setHvaScores={setHvaScores} markComplete={markComplete} dates={dates}/>}
        {tab==="ics"&&<ICSEditor icsRoles={icsRoles} setIcsRoles={setIcsRoles}/>}
        {tab==="inventory"&&<Inventory dates={dates} onMark={markComplete} onSaveSnapshot={saveSupplySnapshot}/>}
        {tab==="equipment"&&<EquipmentEditor equipInv={equipInv} setEquipInv={setEquipInv} markComplete={markComplete} dates={dates}/>}
        {tab==="gobox"&&<GoBoxEditor goBox={goBox} setGoBox={setGoBox} markComplete={markComplete} dates={dates}/>}
        {tab==="drills"&&<DrillsEditor drills={drills} setDrills={setDrills} markComplete={markComplete} dates={dates}/>}
        {tab==="security"&&<CorrectiveActions actions={actions} onChange={saveActions}/>}
        {tab==="templates"&&<Templates/>}
        {tab==="aar"&&<AfterAction/>}
        {tab==="liveplan"&&<LivePlanDocument {...sharedProps}/>}
      </div>
    </div>
  );
}

// ── SECTION HEADER COMPONENT ──────────────────────────────────────
function SectionHeader({title,subtitle,docRef,lastUpdated}){
  return(
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
        <h2 style={S.h2}>{title}</h2>
        {docRef&&<span style={{fontSize:12,color:T.textLight,fontFamily:"IBM Plex Mono,monospace"}}>{docRef}</span>}
      </div>
      {subtitle&&<div style={{fontSize:13,color:T.textLight,marginTop:3}}>{subtitle}</div>}
      {lastUpdated&&<div style={{fontSize:12,color:T.teal,marginTop:4}}>Last updated in portal: {fmtDate(lastUpdated)}</div>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({dates,actions,markComplete}){
  const items=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);return{...s,last,next,days};});
  const overdue=items.filter(i=>i.days!==null&&i.days<0).length;
  const soon=items.filter(i=>i.days!==null&&i.days>=0&&i.days<=30).length;
  const current=items.filter(i=>i.days!==null&&i.days>30).length;
  const notSet=items.filter(i=>i.days===null).length;
  const openActs=actions.filter(a=>a.status==="open").length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {overdue>0&&<div style={{background:T.redBg,border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16,color:T.red}}>⚠</span><span style={{fontSize:14,color:T.red,fontWeight:600}}>{overdue} compliance item{overdue>1?"s":""} overdue — review immediately.</span></div>}
      <div style={{background:T.tealBg,border:`1px solid ${T.teal}30`,borderRadius:10,padding:"12px 16px",fontSize:13,color:T.tealDark}}>
        <strong>All sections of this EP tool update the Live Plan Document automatically.</strong> Edit any tab, then go to 📄 Live Plan to save a new version for surveyors or governing council.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
        {[{label:"Overdue",v:overdue,c:T.red,bg:T.redBg},{label:"Due ≤30d",v:soon,c:T.amber,bg:T.amberBg},{label:"Current",v:current,c:T.green,bg:T.greenBg},{label:"Not Set",v:notSet,c:T.slate,bg:"#F1F5F9"},{label:"Open Gaps",v:openActs,c:T.blue,bg:T.blueBg}].map(m=>(
          <div key={m.label} style={{background:m.bg,border:`1px solid ${m.c}30`,borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:26,fontWeight:800,color:m.c,fontFamily:"IBM Plex Mono,monospace",lineHeight:1}}>{m.v}</div><div style={{fontSize:11,color:m.c,marginTop:4,fontWeight:600}}>{m.label}</div></div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><h2 style={S.h2}>Compliance Calendar</h2><span style={{fontSize:12,color:T.textLight}}>Click Done to mark complete today</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          {[...items].sort((a,b)=>(a.days??9999)-(b.days??9999)).map((item,i)=>(
            <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr auto 150px 90px",alignItems:"center",gap:10,padding:"9px 10px",background:i%2===0?"transparent":"#F8FAFC",borderRadius:6}}>
              <div><div style={{fontSize:13,fontWeight:500,color:T.text}}>{item.label}</div><div style={{fontSize:11,color:T.textLight}}>{item.responsible} · {item.freq}{item.last&&<span style={{marginLeft:6}}>· Last: {fmtDate(item.last)}</span>}</div></div>
              <div style={{fontSize:11,color:T.textLight}}>{item.next?`Next: ${fmtDate(item.next)}`:"—"}</div>
              <div style={{textAlign:"center"}}><StatusPill days={item.days}/></div>
              <div style={{textAlign:"right"}}><button onClick={()=>markComplete(item.id)} style={{...S.btnSm,fontSize:11}}>✓ Done</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CONTACTS EDITOR ───────────────────────────────────────────────
function ContactsEditor({contacts,setContacts,markComplete,dates}){
  const [saved,setSaved]=useState("");
  const internal=contacts.filter(c=>c.contact_type==="internal");
  const external=contacts.filter(c=>c.contact_type==="external");

  async function updateContact(id,field,val){
    const updated=contacts.map(c=>c.id===id?{...c,[field]:val}:c);
    setContacts(updated);
    await supabase.from("ep_contacts").update({[field]:val,updated_at:new Date().toISOString()}).eq("id",id);
  }

  async function save(){
    await markComplete("contacts");
    setSaved("Contacts saved & marked complete");setTimeout(()=>setSaved(""),4000);
  }

  function ContactTable({rows,type}){
    return(
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.navy}}>
            <th style={{color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700}}>{type==="internal"?"Role":"Organization"}</th>
            <th style={{color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700}}>{type==="internal"?"Name":"Contact / Role"}</th>
            <th style={{color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700}}>Primary Phone</th>
            <th style={{color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700}}>{type==="internal"?"Secondary Phone":"Use During Emergency"}</th>
          </tr></thead>
          <tbody>
            {rows.map((c,i)=>(
              <tr key={c.id} style={{background:i%2?"#F8FAFC":"transparent"}}>
                <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`}}>
                  <input value={c.role_title} onChange={e=>updateContact(c.id,"role_title",e.target.value)} style={{...S.input,padding:"4px 8px",fontSize:12,border:"1px solid transparent",background:"transparent"}} onFocus={e=>e.target.style.border=`1px solid ${T.borderMd}`} onBlur={e=>e.target.style.border="1px solid transparent"}/>
                </td>
                <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`}}>
                  <input value={c.name} onChange={e=>updateContact(c.id,"name",e.target.value)} style={{...S.input,padding:"4px 8px",fontSize:12,border:"1px solid transparent",background:"transparent"}} placeholder={type==="external"?"Contact name…":"Name…"} onFocus={e=>e.target.style.border=`1px solid ${T.borderMd}`} onBlur={e=>e.target.style.border="1px solid transparent"}/>
                </td>
                <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`}}>
                  <input value={c.primary_phone} onChange={e=>updateContact(c.id,"primary_phone",e.target.value)} style={{...S.input,padding:"4px 8px",fontSize:12,fontFamily:"IBM Plex Mono,monospace",border:"1px solid transparent",background:"transparent"}} placeholder="Phone…" onFocus={e=>e.target.style.border=`1px solid ${T.borderMd}`} onBlur={e=>e.target.style.border="1px solid transparent"}/>
                </td>
                <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`}}>
                  <input value={type==="internal"?c.secondary_phone:c.use_during_emergency} onChange={e=>updateContact(c.id,type==="internal"?"secondary_phone":"use_during_emergency",e.target.value)} style={{...S.input,padding:"4px 8px",fontSize:12,border:"1px solid transparent",background:"transparent"}} placeholder={type==="internal"?"Secondary phone…":"Use during emergency…"} onFocus={e=>e.target.style.border=`1px solid ${T.borderMd}`} onBlur={e=>e.target.style.border="1px solid transparent"}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionHeader title="Key Contacts" docRef="Section 1.5" subtitle="Click any cell to edit. Changes save instantly to the database and appear in the Live Plan Document." lastUpdated={dates.contacts}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:T.textLight}}>Edit any cell directly — saves automatically</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><SaveBadge msg={saved}/><button onClick={save} style={S.btnPrimary}>✓ Mark Annual Review Complete</button></div>
      </div>
      <div style={S.card}>
        <h3 style={{...S.h3,marginBottom:14,color:T.navy}}>Internal Contacts</h3>
        <div style={{background:T.amberBg,border:`1px solid ${T.amber}30`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.amber,marginBottom:14}}>
          ⚠ Safety/Security Officer, Maintenance Director, and Staff Dev. Coordinator are unfilled. These must be designated to meet Joint Commission EM standards.
        </div>
        <ContactTable rows={internal} type="internal"/>
      </div>
      <div style={S.card}>
        <h3 style={{...S.h3,marginBottom:14}}>External Contacts</h3>
        <ContactTable rows={external} type="external"/>
      </div>
    </div>
  );
}

// ── HVA EDITOR ────────────────────────────────────────────────────
function HVAEditor({hvaScores,setHvaScores,markComplete,dates}){
  const [activeType,setActiveType]=useState("agency");
  const [saved,setSaved]=useState("");

  const rows=hvaScores.filter(h=>h.hva_type===activeType);
  const categories=[...new Set(rows.map(r=>r.category))];

  async function updateScore(id,field,val){
    const numVal=parseInt(val);
    const updated=hvaScores.map(h=>h.id===id?{...h,[field]:numVal}:h);
    setHvaScores(updated);
    await supabase.from("ep_hva_scores").update({[field]:numVal,updated_at:new Date().toISOString()}).eq("id",id);
  }

  async function save(){
    await markComplete("hva");
    setSaved("HVA saved & marked complete");setTimeout(()=>setSaved(""),4000);
  }

  function scoreColor(v){return v===3?"#B91C1C":v===2?"#C96B15":"#15803D";}
  function total(row){return row.human_impact+row.property_impact+row.service_ability+row.preparedness;}

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="Hazard Vulnerability Analysis" docRef="Sections 2.1 & 2.2" subtitle="Click any score to edit (1=Low, 2=Moderate, 3=High). Total auto-calculates. Higher total = higher priority." lastUpdated={dates.hva}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:0,border:`1px solid ${T.borderMd}`,borderRadius:8,overflow:"hidden"}}>
          {["agency","community"].map(t=>(
            <button key={t} onClick={()=>setActiveType(t)} style={{padding:"8px 18px",fontSize:13,fontWeight:activeType===t?700:400,background:activeType===t?T.navy:"transparent",color:activeType===t?"#fff":T.textMid,border:"none",cursor:"pointer"}}>
              {t==="agency"?"Agency-Based (§2.1)":"Community-Based (§2.2)"}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><SaveBadge msg={saved}/><button onClick={save} style={S.btnPrimary}>✓ Mark HVA Review Complete</button></div>
      </div>

      <div style={{background:"#F0FDF4",border:"1px solid #A7F3D0",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#064E3B"}}>
        <strong>Scoring guide:</strong> Human Impact: Low=1 Mod=2 High=3 · Property Impact: Low=1 Mod=2 High=3 · Service Ability: High=1 Mod=2 Low=3 · Preparedness: High=1 Mod=2 Low=3 · <strong>Total = sum (higher = higher priority)</strong>
      </div>

      {categories.map(cat=>(
        <div key={cat} style={S.card}>
          <h3 style={{...S.h3,marginBottom:12,textTransform:"uppercase",fontSize:11,letterSpacing:"0.08em",color:T.textLight}}>{cat}</h3>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#F8FAFC"}}>
                <th style={{padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:T.textLight,borderBottom:`2px solid ${T.border}`}}>Hazard</th>
                {["Human Impact","Property Impact","Service Ability","Preparedness"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:T.textLight,borderBottom:`2px solid ${T.border}`,width:80}}>{h}</th>
                ))}
                <th style={{padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.border}`,width:60}}>TOTAL</th>
              </tr></thead>
              <tbody>
                {rows.filter(r=>r.category===cat).map((row,i)=>{
                  const tot=total(row);
                  const totColor=tot>=10?T.red:tot>=8?T.amber:T.green;
                  return(
                    <tr key={row.id} style={{background:i%2?"#F8FAFC":"transparent"}}>
                      <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:13}}>{row.hazard_name}</td>
                      {["human_impact","property_impact","service_ability","preparedness"].map(f=>(
                        <td key={f} style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"center"}}>
                          <select value={row[f]} onChange={e=>updateScore(row.id,f,e.target.value)}
                            style={{width:50,padding:"3px 4px",border:`1px solid ${T.borderMd}`,borderRadius:4,fontSize:13,textAlign:"center",color:scoreColor(row[f]),fontWeight:700,background:"transparent",cursor:"pointer"}}>
                            <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
                          </select>
                        </td>
                      ))}
                      <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"center"}}>
                        <span style={{fontFamily:"IBM Plex Mono,monospace",fontWeight:800,fontSize:15,color:totColor}}>{tot}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ICS ROLES EDITOR ──────────────────────────────────────────────
function ICSEditor({icsRoles,setIcsRoles}){
  const [saved,setSaved]=useState("");

  async function update(id,field,val){
    const updated=icsRoles.map(r=>r.id===id?{...r,[field]:val}:r);
    setIcsRoles(updated);
    await supabase.from("ep_ics_roles").update({[field]:val,updated_at:new Date().toISOString()}).eq("id",id);
    setSaved("Saved");setTimeout(()=>setSaved(""),2000);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="ICS Roles & Succession" docRef="Section 3.1" subtitle="Edit any field directly. Changes save instantly."/>
      <div style={{display:"flex",justifyContent:"flex-end"}}><SaveBadge msg={saved}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {icsRoles.map((role,i)=>(
          <div key={role.id} style={{...S.card,borderLeft:i===0?`4px solid ${T.teal}`:`4px solid ${T.border}`}}>
            <div style={{display:"grid",gridTemplateColumns:"180px 1fr 1fr",gap:12,marginBottom:10}}>
              <div><label style={S.label}>ICS Position</label><input value={role.ics_position} onChange={e=>update(role.id,"ics_position",e.target.value)} style={{...S.input,fontWeight:700}}/></div>
              <div><label style={S.label}>Primary Person</label><input value={role.primary_person} onChange={e=>update(role.id,"primary_person",e.target.value)} style={S.input} placeholder="Name / title…"/></div>
              <div><label style={S.label}>Backup Person</label><input value={role.backup_person} onChange={e=>update(role.id,"backup_person",e.target.value)} style={S.input} placeholder="Name / title…"/></div>
            </div>
            <div><label style={S.label}>Key Responsibilities</label><textarea value={role.key_responsibilities} onChange={e=>update(role.id,"key_responsibilities",e.target.value)} style={{...S.textarea,minHeight:50}}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SUPPLY INVENTORY ──────────────────────────────────────────────
function Inventory({dates,onMark,onSaveSnapshot}){
  const [quarter,setQuarter]=useState("Q1");
  const [year,setYear]=useState(new Date().getFullYear().toString());
  const [counts,setCounts]=useState(()=>Object.fromEntries(SUPPLY_ITEMS.map(i=>[i,""])));
  const [verifiedBy,setVerifiedBy]=useState("");
  const [analysis,setAnalysis]=useState("");
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState(false);

  async function analyze(){
    setLoading(true);setAnalysis("");
    const lines=SUPPLY_ITEMS.map((item,i)=>{const c=parseInt(counts[item])||0;const t=SUPPLY_TARGETS[i];return`${item}: count=${c}, target=${t}, pct=${Math.round((c/t)*100)}%`;}).join("\n");
    try{setAnalysis(await callClaude("Clinical ops analyst for Vitalis Healthcare Services. Analyze EP supply inventory concisely.",`${quarter} ${year} inventory. Flag: (1) critically low <50%, (2) needs ordering 50-79%, (3) adequate ≥80%. Priority order list at end.\n\n${lines}`));}catch(e){setAnalysis("Error: "+e.message);}
    setLoading(false);
  }

  async function saveInv(){
    await onSaveSnapshot({quarter,year:parseInt(year),verified_by:verifiedBy,counts});
    onMark("med_supply");setSaved(true);setTimeout(()=>setSaved(false),3000);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="Medical Supply Inventory" docRef="Section 4.1" subtitle="Enter quarterly counts. Save & Mark Done updates the compliance calendar and the Live Plan Document (Section IV)." lastUpdated={dates.med_supply}/>
      <div style={{background:T.tealBg,border:`1px solid ${T.teal}30`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.tealDark}}>✦ Counts saved here automatically appear in Section IV of the Live Plan Document.</div>
      <div style={{display:"grid",gridTemplateColumns:"120px 120px 1fr auto",gap:10,alignItems:"end"}}>
        <div><label style={S.label}>Quarter</label><select value={quarter} onChange={e=>setQuarter(e.target.value)} style={S.select}>{["Q1","Q2","Q3","Q4"].map(q=><option key={q}>{q}</option>)}</select></div>
        <div><label style={S.label}>Year</label><input value={year} onChange={e=>setYear(e.target.value)} style={S.input} type="number"/></div>
        <div><label style={S.label}>Verified By</label><input value={verifiedBy} onChange={e=>setVerifiedBy(e.target.value)} style={S.input} placeholder="Name and role"/></div>
        <div style={{paddingBottom:1}}><button onClick={saveInv} style={{...S.btnPrimary,background:saved?T.green:T.navy}}>{saved?"✓ Saved":"Save & Mark Done"}</button></div>
      </div>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={S.h2}>Supply Count — {quarter} {year}</h2><button onClick={analyze} disabled={loading} style={{...S.btnTeal,opacity:loading?0.6:1}}>{loading?<Spinner/>:"✦"} AI Analysis</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {SUPPLY_ITEMS.map((item,i)=>{
            const c=parseInt(counts[item])||0;const t=SUPPLY_TARGETS[i];const pct=c>=t?100:Math.round((c/t)*100);
            const col=!counts[item]?T.borderMd:c===0?T.red:pct<50?T.red:pct<80?T.amber:T.green;
            return(<div key={item} style={{display:"grid",gridTemplateColumns:"1fr 80px 50px",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:6,background:"#F8FAFC",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:13,color:T.textMid}}>{item}</div>
              <input type="number" min={0} value={counts[item]} onChange={e=>setCounts(c=>({...c,[item]:e.target.value}))} style={{...S.input,textAlign:"center",padding:"4px 6px",fontSize:13}} placeholder="0"/>
              <div style={{fontSize:11,textAlign:"right"}}><span style={{color:col,fontWeight:600}}>{counts[item]?`${pct}%`:""}</span><div style={{color:T.slateLight}}>/{t}</div></div>
            </div>);
          })}
        </div>
      </div>
      {analysis&&<div style={{...S.card,borderLeft:`4px solid ${T.teal}`}}><h3 style={{...S.h3,marginBottom:8}}>AI Analysis</h3><pre style={{fontSize:13,lineHeight:1.6,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:0}}>{analysis}</pre></div>}
    </div>
  );
}

// ── EQUIPMENT EDITOR ──────────────────────────────────────────────
function EquipmentEditor({equipInv,setEquipInv,markComplete,dates}){
  const [saved,setSaved]=useState("");
  const [verifiedBy,setVerifiedBy]=useState("");

  async function update(id,field,val){
    const updated=equipInv.map(e=>e.id===id?{...e,[field]:val}:e);
    setEquipInv(updated);
    await supabase.from("ep_equipment_inventory").update({[field]:val,updated_at:new Date().toISOString()}).eq("id",id);
  }

  async function save(){
    const today=todayStr();
    for(const item of equipInv){
      await supabase.from("ep_equipment_inventory").update({verified_by:verifiedBy,last_verified:today,updated_at:new Date().toISOString()}).eq("id",item.id);
    }
    await markComplete("equip_inv");setSaved("Equipment saved & marked complete");setTimeout(()=>setSaved(""),4000);
  }

  const currentQ=["Q1","Q2","Q3","Q4"][Math.floor(new Date().getMonth()/3)];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="Equipment & Supplies Inventory" docRef="Section 4.2" subtitle="Update quarterly counts for each item. All data feeds the Live Plan Document." lastUpdated={dates.equip_inv}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div><label style={S.label}>Verified By</label><input value={verifiedBy} onChange={e=>setVerifiedBy(e.target.value)} style={{...S.input,width:220}} placeholder="Name and role"/></div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><SaveBadge msg={saved}/><button onClick={save} style={S.btnPrimary}>✓ Save & Mark Quarterly Check Done</button></div>
      </div>
      <div style={S.card}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:T.navy}}>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700}}>Item</th>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700}}>Location</th>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700}}>Target</th>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700}}>Q1</th>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700}}>Q2</th>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700}}>Q3</th>
              <th style={{color:"#fff",padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700}}>Q4</th>
            </tr></thead>
            <tbody>
              {equipInv.map((item,i)=>(
                <tr key={item.id} style={{background:i%2?"#F8FAFC":"transparent"}}>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}>{item.item_name}</td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}>
                    <input value={item.location||""} onChange={e=>update(item.id,"location",e.target.value)} style={{...S.input,padding:"3px 6px",fontSize:12,width:120,border:`1px solid ${T.borderMd}`}}/>
                  </td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"center",fontWeight:600}}>{item.target_qty}</td>
                  {["q1_count","q2_count","q3_count","q4_count"].map((f,qi)=>(
                    <td key={f} style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"center",background:currentQ===`Q${qi+1}`?"#FFF9C4":"transparent"}}>
                      <input type="number" min={0} value={item[f]||""} onChange={e=>update(item.id,f,e.target.value)}
                        style={{...S.input,padding:"3px 6px",fontSize:12,textAlign:"center",width:55,border:`1px solid ${T.borderMd}`}} placeholder="—"/>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── GO-BOX EDITOR ─────────────────────────────────────────────────
function GoBoxEditor({goBox,setGoBox,markComplete,dates}){
  const [verifiedBy,setVerifiedBy]=useState("");
  const [saved,setSaved]=useState("");

  async function toggle(id,checked){
    const updated=goBox.map(g=>g.id===id?{...g,checked}:g);
    setGoBox(updated);
    await supabase.from("ep_gobox_items").update({checked,updated_at:new Date().toISOString()}).eq("id",id);
  }

  async function updateNote(id,notes){
    const updated=goBox.map(g=>g.id===id?{...g,notes}:g);
    setGoBox(updated);
    await supabase.from("ep_gobox_items").update({notes,updated_at:new Date().toISOString()}).eq("id",id);
  }

  async function save(){
    const today=todayStr();
    await supabase.from("ep_gobox_items").update({verified_by:verifiedBy,last_verified:today,updated_at:new Date().toISOString()}).neq("id","00000000-0000-0000-0000-000000000000");
    await markComplete("go_box");setSaved("Go-Box check saved & marked complete");setTimeout(()=>setSaved(""),4000);
  }

  const checkedCount=goBox.filter(g=>g.checked).length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="Emergency Go-Box Check" docRef="Section 4.3" subtitle="Check off each item quarterly. Go-Box is maintained in the Administrator's office." lastUpdated={dates.go_box}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:checkedCount===goBox.length?T.greenBg:T.amberBg,padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:700,color:checkedCount===goBox.length?T.green:T.amber}}>
            {checkedCount}/{goBox.length} items checked
          </div>
          <div><label style={S.label}>Verified By</label><input value={verifiedBy} onChange={e=>setVerifiedBy(e.target.value)} style={{...S.input,width:200}} placeholder="Name and role"/></div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><SaveBadge msg={saved}/><button onClick={save} style={S.btnPrimary}>✓ Save Quarterly Check</button></div>
      </div>
      <div style={S.card}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {goBox.map((item,i)=>(
            <div key={item.id} style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center",padding:"10px 12px",background:item.checked?"#F0FDF4":i%2?"#F8FAFC":"transparent",borderRadius:8,border:`1px solid ${item.checked?"#A7F3D0":T.border}`}}>
              <input type="checkbox" checked={item.checked||false} onChange={e=>toggle(item.id,e.target.checked)} style={{width:18,height:18,cursor:"pointer",accentColor:T.teal}}/>
              <div style={{fontSize:13,color:item.checked?T.green:T.text,textDecoration:item.checked?"line-through":"none",fontWeight:item.checked?400:500}}>{item.item_name}</div>
              <input value={item.notes||""} onChange={e=>updateNote(item.id,e.target.value)} style={{...S.input,width:200,padding:"4px 8px",fontSize:12}} placeholder="Notes…"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DRILLS EDITOR ─────────────────────────────────────────────────
function DrillsEditor({drills,setDrills,markComplete,dates}){
  const [saved,setSaved]=useState("");

  async function update(id,field,val){
    const updated=drills.map(d=>d.id===id?{...d,[field]:val}:d);
    setDrills(updated);
    await supabase.from("ep_drill_records").update({[field]:val,updated_at:new Date().toISOString()}).eq("id",id);
  }

  async function markDrillDone(id){
    const today=todayStr();
    const drill=drills.find(d=>d.id===id);
    if(!drill)return;
    let nextDue=null;
    if(drill.frequency==="Annual")nextDue=addMonths(today,12);
    else if(drill.frequency==="Quarterly")nextDue=addMonths(today,3);
    else if(drill.frequency==="Semi-annual")nextDue=addMonths(today,6);
    const updated=drills.map(d=>d.id===id?{...d,last_conducted:today,next_due:nextDue}:d);
    setDrills(updated);
    await supabase.from("ep_drill_records").update({last_conducted:today,next_due:nextDue,updated_at:new Date().toISOString()}).eq("id",id);
    await markComplete("drill");
    setSaved("Drill recorded");setTimeout(()=>setSaved(""),3000);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="Annual Drill & Exercise Program" docRef="Section 7.2" subtitle="Record drill dates and outcomes. Each drill marked Done updates the compliance calendar." lastUpdated={dates.drill}/>
      <div style={{display:"flex",justifyContent:"flex-end"}}><SaveBadge msg={saved}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {drills.map((drill,i)=>{
          const daysNext=daysUntil(drill.next_due);
          return(
            <div key={drill.id} style={S.card}>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:12,alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{drill.drill_type}</div>
                  <div style={{fontSize:12,color:T.textLight,marginTop:2}}>{drill.description} · <strong>{drill.frequency}</strong></div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:T.textLight,marginBottom:3}}>Last Conducted</div>
                  <input type="date" value={drill.last_conducted||""} onChange={e=>update(drill.id,"last_conducted",e.target.value)} style={{...S.input,padding:"4px 8px",fontSize:12,width:140}}/>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:T.textLight,marginBottom:3}}>Next Due</div>
                  <div><StatusPill days={daysNext}/></div>
                  <div style={{fontSize:11,color:T.textLight,marginTop:2}}>{drill.next_due?fmtDate(drill.next_due):"—"}</div>
                </div>
                <button onClick={()=>markDrillDone(drill.id)} style={{...S.btnTeal,alignSelf:"center"}}>✓ Conducted Today</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CORRECTIVE ACTIONS (SECURITY GAPS) ───────────────────────────
function CorrectiveActions({actions,onChange}){
  const [adding,setAdding]=useState(false);
  const [newItem,setNewItem]=useState({finding:"",responsible:"",due:"",note:""});
  const [aiInput,setAiInput]=useState("");const [aiResult,setAiResult]=useState("");const [aiLoading,setAiLoading]=useState(false);

  function update(id,field,val){onChange(actions.map(a=>a.id===id?{...a,[field]:val}:a));}
  function addAction(){if(!newItem.finding)return;onChange([...actions,{...newItem,id:"u"+Date.now(),status:"open",sort_order:actions.length+1}]);setNewItem({finding:"",responsible:"",due:"",note:""});setAdding(false);}
  async function getGuide(){if(!aiInput)return;setAiLoading(true);setAiResult("");
    try{setAiResult(await callClaude("Healthcare compliance consultant for Vitalis Healthcare Services, Silver Spring MD. Reference Joint Commission EM and CMS CoP 484.102.",`Guidance for this EP compliance gap:\n\n${aiInput}\n\nProvide: (1) Why it matters, (2) Steps to resolve, (3) Documentation needed, (4) Timeline.`));}catch(e){setAiResult("Error: "+e.message);}setAiLoading(false);}
  const open=actions.filter(a=>a.status==="open");const done=actions.filter(a=>a.status!=="open");

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title="Security Vulnerability Assessment — Gaps" docRef="Section 2.3" subtitle="Track and resolve all security gaps identified in the assessment."/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:T.textLight}}>{open.length} open · {done.length} completed</div>
        <button onClick={()=>setAdding(a=>!a)} style={S.btnPrimary}>+ Add Gap</button>
      </div>
      {adding&&(<div style={{...S.card,border:`1px solid ${T.teal}`}} className="ep-anim">
        <h3 style={{...S.h3,marginBottom:12}}>New Security Gap</h3>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div><label style={S.label}>Finding</label><input value={newItem.finding} onChange={e=>setNewItem(n=>({...n,finding:e.target.value}))} style={S.input} placeholder="Describe the gap"/></div>
          <div><label style={S.label}>Responsible</label><input value={newItem.responsible} onChange={e=>setNewItem(n=>({...n,responsible:e.target.value}))} style={S.input} placeholder="Name / role"/></div>
          <div><label style={S.label}>Target Date</label><input type="date" value={newItem.due} onChange={e=>setNewItem(n=>({...n,due:e.target.value}))} style={S.input}/></div>
        </div>
        <div style={{marginBottom:10}}><label style={S.label}>Notes</label><textarea value={newItem.note} onChange={e=>setNewItem(n=>({...n,note:e.target.value}))} style={{...S.textarea,minHeight:50}}/></div>
        <div style={{display:"flex",gap:8}}><button onClick={addAction} style={S.btnPrimary}>Add</button><button onClick={()=>setAdding(false)} style={S.btnSecondary}>Cancel</button></div>
      </div>)}
      <div style={S.card}>
        <h3 style={{...S.h3,marginBottom:10}}>AI Compliance Guidance</h3>
        <div style={{display:"flex",gap:10}}>
          <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} style={{...S.textarea,minHeight:50,flex:1}} placeholder="Describe a gap and get specific resolution guidance…"/>
          <button onClick={getGuide} disabled={!aiInput||aiLoading} style={{...S.btnTeal,alignSelf:"flex-start",opacity:(!aiInput||aiLoading)?0.6:1}}>{aiLoading?<Spinner/>:"✦"} Ask</button>
        </div>
        {aiResult&&<pre style={{fontSize:13,lineHeight:1.6,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:"10px 0 0",background:"#F8FAFC",padding:12,borderRadius:8}}>{aiResult}</pre>}
      </div>
      {open.length>0&&<div style={S.card}><h3 style={{...S.h3,marginBottom:12,color:T.red}}>Open Gaps ({open.length})</h3><div style={{display:"flex",flexDirection:"column",gap:8}}>{open.map(a=><ActionRow key={a.id} action={a} onUpdate={update}/>)}</div></div>}
      {done.length>0&&<div style={S.card}><h3 style={{...S.h3,marginBottom:12,color:T.green}}>Resolved ({done.length})</h3><div style={{display:"flex",flexDirection:"column",gap:8}}>{done.map(a=><ActionRow key={a.id} action={a} onUpdate={update} completed/>)}</div></div>}
    </div>
  );
}

function ActionRow({action,onUpdate,completed}){
  const [expanded,setExpanded]=useState(false);const days=daysUntil(action.due);
  return(<div style={{border:`1px solid ${completed?T.border:(days!==null&&days<0?"#FECACA":T.border)}`,borderRadius:8,overflow:"hidden",background:completed?"#F8FAFC":T.card}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:10,padding:"9px 12px",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
      <div><div style={{fontSize:13,fontWeight:500,color:completed?T.textLight:T.text,textDecoration:completed?"line-through":"none"}}>{action.finding}</div><div style={{fontSize:11,color:T.textLight,marginTop:2}}>{action.responsible&&<span>{action.responsible}</span>}{action.due&&<span style={{marginLeft:8}}>Due: {fmtDate(action.due)}</span>}</div></div>
      {action.due&&<StatusPill days={days}/>}
      <select value={action.status} onChange={e=>{e.stopPropagation();onUpdate(action.id,"status",e.target.value);}} style={{padding:"3px 7px",fontSize:12,border:`1px solid ${T.borderMd}`,borderRadius:5,cursor:"pointer",color:T.textMid}}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="complete">Complete</option></select>
      <span style={{color:T.slateLight,fontSize:11}}>{expanded?"▲":"▼"}</span>
    </div>
    {expanded&&<div style={{borderTop:`1px solid ${T.border}`,padding:"9px 12px",background:"#F8FAFC"}} className="ep-anim"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}><div><label style={S.label}>Responsible</label><input value={action.responsible} onChange={e=>onUpdate(action.id,"responsible",e.target.value)} style={S.input}/></div><div><label style={S.label}>Target Date</label><input type="date" value={action.due||""} onChange={e=>onUpdate(action.id,"due",e.target.value)} style={S.input}/></div></div><label style={S.label}>Notes / Progress</label><textarea value={action.note} onChange={e=>onUpdate(action.id,"note",e.target.value)} style={{...S.textarea,minHeight:50}}/></div>}
  </div>);
}

// ── TEMPLATES ─────────────────────────────────────────────────────
function Templates(){
  const [hazard,setHazard]=useState("");const [audience,setAudience]=useState("staff");const [severity,setSeverity]=useState("active");const [context,setContext]=useState("");const [result,setResult]=useState("");const [loading,setLoading]=useState(false);
  async function generate(){if(!hazard)return;setLoading(true);setResult("");
    try{setResult(await callClaude("Emergency comms specialist for Vitalis Healthcare Services LLC, 8757 Georgia Ave, Silver Spring MD. Contacts: Admin (240) 716-6874, Clinical Mgr (240) 423-8757, Dir Clinical Svcs (301) 237-2436.",`Emergency communication:\nHazard: ${hazard}\nAudience: ${audience}\nStatus: ${severity}\nContext: ${context||"None"}\nGenerate EMAIL (with subject) and SMS (<160 chars).`));}catch(e){setResult("Error: "+e.message);}setLoading(false);}
  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <SectionHeader title="Emergency Communication Templates" subtitle="AI-generated communications for any hazard scenario."/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
      <div style={S.cardSm}><label style={S.label}>Hazard</label><select value={hazard} onChange={e=>setHazard(e.target.value)} style={S.select}><option value="">Select…</option>{HAZARDS.map(h=><option key={h}>{h}</option>)}</select></div>
      <div style={S.cardSm}><label style={S.label}>Audience</label><select value={audience} onChange={e=>setAudience(e.target.value)} style={S.select}><option value="staff">Staff Only</option><option value="patients">Patients / Families</option><option value="both">Both</option></select></div>
      <div style={S.cardSm}><label style={S.label}>Status</label><select value={severity} onChange={e=>setSeverity(e.target.value)} style={S.select}><option value="watch">Watch / Advance Notice</option><option value="active">Active Emergency</option><option value="recovery">Recovery / All Clear</option></select></div>
    </div>
    <div style={S.card}><label style={S.label}>Context</label><textarea value={context} onChange={e=>setContext(e.target.value)} style={S.textarea} placeholder="Situation-specific details…"/><div style={{marginTop:10}}><button onClick={generate} disabled={!hazard||loading} style={{...S.btnTeal,opacity:(!hazard||loading)?0.6:1}}>{loading?<Spinner/>:"✦"} Generate</button></div></div>
    {result&&<div style={{...S.card,borderLeft:`4px solid ${T.teal}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h3 style={S.h3}>Generated Templates</h3><button onClick={()=>navigator.clipboard?.writeText(result)} style={S.btnSm}>Copy All</button></div><pre style={{fontSize:13,lineHeight:1.7,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:0,background:"#F8FAFC",padding:14,borderRadius:8}}>{result}</pre></div>}
  </div>);
}

// ── AFTER-ACTION ──────────────────────────────────────────────────
function AfterAction(){
  const [form,setForm]=useState({date:"",type:"Tabletop Exercise",hazard:"Snowstorm / Severe Weather",ic:"",declared:"",...Object.fromEntries(Array.from({length:15},(_,i)=>[`q${i+1}`,""])),worked:"",gaps:"",notes:""});
  const [report,setReport]=useState("");const [loading,setLoading]=useState(false);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const QS=["All staff notified within required timeframes?","Patient care staff knew what to do?","Ancillary staff knew what to do?","Patient priority list retrieved quickly?","Level I patients contacted within 2 hours?","Level II patients contacted within 4 hours?","Staff identified Agency command structure?","Staff knew communication procedures?","Communication with community partners intact?","Backup communication systems effective?","Staff knew what to do if no communications?","Transfer partner contacts readily available?","Go-Box accessible and complete?","Incident Commander clearly managed incident?","All actions documented in Incident Log?"];
  async function gen(){setLoading(true);setReport("");const yes=QS.filter((_,i)=>form[`q${i+1}`]==="yes").length;const no=QS.filter((_,i)=>form[`q${i+1}`]==="no").length;
    try{setReport(await callClaude("Compliance officer writing after-action reports for Vitalis Healthcare Services. Regulatory-quality for CMS/Joint Commission.",`AAR for Vitalis Healthcare, LLC:\nDate: ${form.date||"—"} · ${form.type} · ${form.hazard}\nIC: ${form.ic||"—"}\nChecklist (${yes} YES, ${no} NO):\n${QS.map((q,i)=>`${i+1}. ${q} → ${form[`q${i+1}`]||"N/A"}`).join("\n")}\nWhat worked: ${form.worked||"—"}\nGaps: ${form.gaps||"—"}\n\nGenerate: Executive Summary, Performance Assessment, Root Cause Analysis, 3-5 Corrective Actions with owners/timelines.`));}catch(e){setReport("Error: "+e.message);}setLoading(false);}
  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <SectionHeader title="After-Action Report" docRef="Appendix C / Section 7.3" subtitle="Required within 10 business days of every drill or emergency event."/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
      {[{l:"Event Date",k:"date",t:"date"},{l:"Event Type",k:"type",t:"select",o:["Tabletop Exercise","Communication Drill","Full-Scale Exercise","Actual Emergency Event","Supply Check Drill","Priority List Drill"]},{l:"Hazard Scenario",k:"hazard",t:"select",o:HAZARDS},{l:"Incident Commander",k:"ic",t:"text",p:"Name and role"},{l:"Emergency Declared By",k:"declared",t:"text",p:"Name and role"}].map(f=>(
        <div key={f.k} style={S.cardSm}><label style={S.label}>{f.l}</label>{f.t==="select"?<select value={form[f.k]} onChange={e=>update(f.k,e.target.value)} style={S.select}>{f.o.map(o=><option key={o}>{o}</option>)}</select>:<input type={f.t} value={form[f.k]} onChange={e=>update(f.k,e.target.value)} style={S.input} placeholder={f.p||""}/>}</div>
      ))}
    </div>
    <div style={S.card}><h3 style={{...S.h3,marginBottom:12}}>Evaluation Checklist — Appendix J</h3>{QS.map((q,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:10,padding:"7px 10px",background:i%2?"#F8FAFC":"transparent",borderRadius:6}}><div style={{fontSize:13,color:T.textMid}}>{i+1}. {q}</div><div style={{display:"flex",gap:5}}>{["yes","no","n/a"].map(v=>(<button key={v} onClick={()=>update(`q${i+1}`,form[`q${i+1}`]===v?"":v)} style={{padding:"3px 10px",fontSize:11,fontWeight:600,borderRadius:5,cursor:"pointer",border:`1px solid ${v==="yes"?T.green:v==="no"?T.red:T.borderMd}`,background:form[`q${i+1}`]===v?(v==="yes"?T.greenBg:v==="no"?T.redBg:T.bg):"transparent",color:form[`q${i+1}`]===v?(v==="yes"?T.green:v==="no"?T.red:T.slate):T.textLight}}>{v.toUpperCase()}</button>))}</div></div>))}</div>
    <div style={S.card}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={S.label}>What Worked Well</label><textarea value={form.worked} onChange={e=>update("worked",e.target.value)} style={S.textarea}/></div><div><label style={S.label}>Gaps / What Failed</label><textarea value={form.gaps} onChange={e=>update("gaps",e.target.value)} style={S.textarea}/></div></div><div style={{marginTop:10}}><label style={S.label}>Additional Notes</label><textarea value={form.notes} onChange={e=>update("notes",e.target.value)} style={{...S.textarea,minHeight:50}}/></div><div style={{marginTop:12}}><button onClick={gen} disabled={loading} style={{...S.btnTeal,opacity:loading?0.6:1}}>{loading?<Spinner/>:"✦"} Generate AI After-Action Report</button></div></div>
    {report&&<div style={{...S.card,borderLeft:`4px solid ${T.teal}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h3 style={S.h3}>AI After-Action Report</h3><button onClick={()=>navigator.clipboard?.writeText(report)} style={S.btnSm}>Copy</button></div><pre style={{fontSize:13,lineHeight:1.7,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:0}}>{report}</pre></div>}
  </div>);
}

// ── LIVE PLAN DOCUMENT ────────────────────────────────────────────
function LivePlanDocument({dates,actions,versions,latestSupply,contacts,hvaScores,icsRoles,equipInv,goBox,drills,saveVersion}){
  const [saving,setSaving]=useState(false);const [savedMsg,setSavedMsg]=useState("");const [showSave,setShowSave]=useState(false);const [triggerEvent,setTriggerEvent]=useState("");const [generatedBy,setGeneratedBy]=useState("");
  const currentVersion=versions[0]||null;
  const nextVer=()=>{if(!currentVersion)return"2.1";const p=currentVersion.version_num.split(".");return`${p[0]}.${parseInt(p[1]||0)+1}`;};
  const internal=contacts.filter(c=>c.contact_type==="internal");
  const external=contacts.filter(c=>c.contact_type==="external");
  const agencyHVA=hvaScores.filter(h=>h.hva_type==="agency");
  const communityHVA=hvaScores.filter(h=>h.hva_type==="community");
  const openActions=actions.filter(a=>a.status==="open");
  const completeActions=actions.filter(a=>a.status==="complete");
  const inProgActions=actions.filter(a=>a.status==="in_progress");
  const itemsWithDates=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);return{...s,last,next,days};});

  async function handleSave(){
    if(!generatedBy.trim()||!triggerEvent.trim())return;
    setSaving(true);
    const summary=triggerEvent;
    const snapshot={dates,actions,contacts,hvaScores,icsRoles,equipInv,goBox,drills,supply:latestSupply};
    const html=buildFullPlanHTML({dates,actions,contacts,hvaScores,icsRoles,equipInv,goBox,drills,latestSupply,versions,versionNum:nextVer(),generatedBy,summary});
    await saveVersion({version_num:nextVer(),generated_by:generatedBy,trigger_event:triggerEvent,changes_summary:summary,snapshot_data:snapshot,html_content:html});
    setSaving(false);setSavedMsg(`v${nextVer()} saved`);setShowSave(false);setTriggerEvent("");
    setTimeout(()=>setSavedMsg(""),5000);
  }

  // TABLE helpers for the live render
  const th={background:T.navy,color:"#fff",padding:"7px 10px",textAlign:"left",fontSize:11,fontWeight:700};
  const td={padding:"7px 10px",borderBottom:`1px solid ${T.border}`,verticalAlign:"top",fontSize:13};
  const td2={...td,background:"#F8FAFC"};
  const tbl={width:"100%",borderCollapse:"collapse",fontSize:13,marginBottom:12};
  const h1={fontSize:18,fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.teal}`,paddingBottom:6,marginBottom:14,marginTop:28};
  const h2={fontSize:14,fontWeight:700,color:T.navy,marginTop:16,marginBottom:8};
  function hvaTotal(r){return r.human_impact+r.property_impact+r.service_ability+r.preparedness;}
  function HVATable({rows}){
    const cats=[...new Set(rows.map(r=>r.category))];
    return(<>
      {cats.map(cat=>(
        <div key={cat} style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:T.textLight,marginBottom:6,letterSpacing:"0.05em"}}>{cat}</div>
          <table style={tbl}><thead><tr>
            <th style={th}>Hazard</th><th style={{...th,textAlign:"center"}}>Human</th><th style={{...th,textAlign:"center"}}>Property</th><th style={{...th,textAlign:"center"}}>Service</th><th style={{...th,textAlign:"center"}}>Prepared.</th><th style={{...th,textAlign:"center",background:"#0A2E5C"}}>Total</th>
          </tr></thead><tbody>
            {rows.filter(r=>r.category===cat).map((r,i)=>{const tot=hvaTotal(r);const tc=tot>=10?T.red:tot>=8?T.amber:T.green;return(
              <tr key={r.id} style={{background:i%2?"#F8FAFC":"transparent"}}>
                <td style={td}>{r.hazard_name}</td>
                {[r.human_impact,r.property_impact,r.service_ability,r.preparedness].map((v,j)=><td key={j} style={{...td,textAlign:"center",fontWeight:700,color:v===3?T.red:v===2?T.amber:T.green}}>{v}</td>)}
                <td style={{...td,textAlign:"center"}}><span style={{fontFamily:"IBM Plex Mono,monospace",fontWeight:800,fontSize:14,color:tc}}>{tot}</span></td>
              </tr>
            );})}
          </tbody></table>
        </div>
      ))}
    </>);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* TOOLBAR */}
      <div className="ep-no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div><h2 style={S.h2}>Emergency Preparedness Plan — Live Document</h2><div style={{fontSize:12,color:T.textLight,marginTop:2}}>Every section populated from portal data · {currentVersion?`v${currentVersion.version_num} saved ${fmtDate(currentVersion.generated_at)}`:"No versions saved yet"} · Next: <strong>v{nextVer()}</strong></div></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><SaveBadge msg={savedMsg}/><button onClick={()=>window.print()} style={S.btnSecondary}>🖨 Print / PDF</button><button onClick={()=>setShowSave(p=>!p)} style={S.btnPrimary}>💾 Save New Version</button></div>
      </div>

      {/* SAVE PANEL */}
      {showSave&&<div className="ep-no-print" style={{...S.card,border:`1px solid ${T.teal}`,background:T.tealBg}}>
        <h3 style={{...S.h3,marginBottom:12}}>Save as Version {nextVer()}</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,marginBottom:10}}>
          <div><label style={S.label}>Your Name</label><input value={generatedBy} onChange={e=>setGeneratedBy(e.target.value)} style={S.input} placeholder="e.g. Okezie Ofoegbu"/></div>
          <div><label style={S.label}>What prompted this update?</label><input value={triggerEvent} onChange={e=>setTriggerEvent(e.target.value)} style={S.input} placeholder="e.g. Q2 supply check completed; security gap c1 resolved"/></div>
        </div>
        <div style={{display:"flex",gap:8}}><button onClick={handleSave} disabled={saving||!generatedBy||!triggerEvent} style={{...S.btnTeal,opacity:(saving||!generatedBy||!triggerEvent)?0.6:1}}>{saving?<Spinner/>:"💾"} Save v{nextVer()}</button><button onClick={()=>setShowSave(false)} style={S.btnSecondary}>Cancel</button></div>
      </div>}

      {/* VERSION HISTORY */}
      {versions.length>0&&<div className="ep-no-print" style={S.card}>
        <h3 style={{...S.h3,marginBottom:12}}>Version History</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {versions.map((v,i)=>(
            <div key={v.id} style={{display:"grid",gridTemplateColumns:"70px 120px 1fr auto",gap:10,padding:"9px 12px",borderRadius:8,background:i===0?"#F0FDF4":"#F8FAFC",border:`1px solid ${i===0?"#A7F3D0":T.border}`,alignItems:"center"}}>
              <div style={{fontFamily:"IBM Plex Mono,monospace",fontSize:12,fontWeight:700,color:i===0?T.green:T.navy}}>v{v.version_num}{i===0&&<div style={{fontSize:10,color:T.green}}>CURRENT</div>}</div>
              <div style={{fontSize:11,color:T.textLight}}><div>{fmtDate(v.generated_at)}</div><div>{v.generated_by}</div></div>
              <div style={{fontSize:12,color:T.textMid}}>{v.changes_summary}</div>
              <div style={{display:"flex",gap:6}}>
                {v.html_content&&<button onClick={()=>{const w=window.open("","_blank");w.document.write(v.html_content);w.document.close();}} style={S.btnSm}>Open</button>}
                {v.html_content&&<button onClick={()=>{const b=new Blob([v.html_content],{type:"text/html"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`Vitalis_EP_Plan_v${v.version_num}.html`;a.click();}} style={S.btnSm}>Download</button>}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* LIVE DOCUMENT RENDER */}
      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:40,fontFamily:"'IBM Plex Sans',Georgia,serif",lineHeight:1.7}}>

        {/* COVER */}
        <div style={{textAlign:"center",paddingBottom:24,borderBottom:"2px solid #0D1E35",marginBottom:24}}>
          <div style={{fontSize:12,color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase"}}>Vitalis Healthcare Services, LLC</div>
          <div style={{fontSize:12,color:"#64748B",marginBottom:16}}>8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910 · (240) 716-6874</div>
          <div style={{fontSize:24,fontWeight:800,color:T.navy,marginBottom:4}}>EMERGENCY PREPAREDNESS PLAN</div>
          <div style={{fontSize:13,color:"#475569",marginBottom:16}}>All-Hazards Emergency Management Program</div>
          <table style={{...tbl,width:"auto",margin:"0 auto",minWidth:480}}>
            <tbody>
              <tr><td style={{...td,fontWeight:600,width:160}}>Version</td><td style={td}>{currentVersion?`${currentVersion.version_num} — ${fmtDateLong(currentVersion.generated_at)}`:"2.0 — March 26, 2026"}</td></tr>
              <tr><td style={{...td2,fontWeight:600}}>Last Updated By</td><td style={td2}>{currentVersion?.generated_by||"Plan Rebuild"}</td></tr>
              <tr><td style={{...td,fontWeight:600}}>Regulatory Standards</td><td style={td}>CMS CoP 484.102 · COMAR 10.07.14.46 · OSHA 29 CFR 1910.38 · Joint Commission EM</td></tr>
              <tr><td style={{...td2,fontWeight:600}}>Generated</td><td style={td2}>{fmtDateLong(new Date().toISOString())} · <em>Live from Vitalis EP Portal</em></td></tr>
            </tbody>
          </table>
          <div style={{marginTop:14,padding:"10px 16px",background:"#E3F7F6",borderRadius:8,border:"1px solid #0B8A82",fontSize:12,color:"#0B6B5C",display:"inline-block"}}>✦ Auto-generated from portal. All sections reflect live data.</div>
        </div>

        {/* REVISION LOG */}
        <h2 style={h1}>Document Revision Log</h2>
        <table style={tbl}><thead><tr><th style={th}>Version</th><th style={th}>Date</th><th style={th}>Summary of Changes</th><th style={th}>Updated By</th></tr></thead>
          <tbody>
            <tr><td style={td}>1.0</td><td style={td}>06/15/2023</td><td style={td}>Initial plan adoption — generic template structure</td><td style={td}>Agency Admin</td></tr>
            <tr><td style={td2}>2.0</td><td style={td2}>03/26/2026</td><td style={td2}>Full rebuild: 4 hazard playbooks; corrected HVA; security gap remediation; AI Portal established</td><td style={td2}>Plan Rebuild</td></tr>
            {versions.filter(v=>v.version_num!=="2.0"&&v.html_content).map((v,i)=>(
              <tr key={v.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={td}>{v.version_num}</td><td style={td}>{fmtDate(v.generated_at)}</td><td style={td}>{v.changes_summary}</td><td style={td}>{v.generated_by}</td></tr>
            ))}
          </tbody>
        </table>

        {/* SECTION 1.3 — TOP HAZARDS */}
        <h2 style={h1}>Section I — Introduction and Administration</h2>
        <h3 style={h2}>1.3 Scope and Top Hazards</h3>
        <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Based on the Agency's Hazard Vulnerability Analysis (Section II). Top three hazards by HVA score:</div>
        {(() => {
          const top3=[...hvaScores].sort((a,b)=>(b.human_impact+b.property_impact+b.service_ability+b.preparedness)-(a.human_impact+a.property_impact+a.service_ability+a.preparedness)).slice(0,3);
          return(<table style={tbl}><thead><tr><th style={th}>Rank</th><th style={th}>Hazard</th><th style={{...th,textAlign:"center"}}>HVA Score</th><th style={th}>Source</th></tr></thead>
            <tbody>{top3.map((h,i)=><tr key={h.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={{...td,fontWeight:700,fontSize:16}}>{i+1}</td><td style={td}>{h.hazard_name}</td><td style={{...td,textAlign:"center",fontWeight:700,fontSize:15,color:T.red}}>{hvaTotal(h)}</td><td style={td}>{h.hva_type==="agency"?"Agency-Based":"Community-Based"}</td></tr>)}
            </tbody></table>);
        })()}

        {/* SECTION 1.5 — INTERNAL CONTACTS */}
        <h3 style={h2}>1.5 Key Contacts — Internal</h3>
        <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Last contacts review: {dates.contacts?fmtDate(dates.contacts):<span style={{color:T.amber}}>⚠ Not yet recorded</span>}</div>
        <table style={tbl}><thead><tr><th style={th}>Role</th><th style={th}>Name</th><th style={th}>Primary Phone</th><th style={th}>Secondary Phone</th></tr></thead>
          <tbody>{internal.map((c,i)=><tr key={c.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={td}>{c.role_title}</td><td style={td}>{c.name||<span style={{color:T.amber}}>⚠ TO BE DESIGNATED</span>}</td><td style={{...td,fontFamily:"IBM Plex Mono,monospace"}}>{c.primary_phone||"—"}</td><td style={{...td,fontFamily:"IBM Plex Mono,monospace"}}>{c.secondary_phone||"—"}</td></tr>)}</tbody>
        </table>

        {/* SECTION 1.5 — EXTERNAL CONTACTS */}
        <h3 style={h2}>Key Contacts — External</h3>
        <table style={tbl}><thead><tr><th style={th}>Organization</th><th style={th}>Contact / Role</th><th style={th}>Phone</th><th style={th}>Use During Emergency</th></tr></thead>
          <tbody>{external.map((c,i)=><tr key={c.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={td}>{c.role_title}</td><td style={td}>{c.name||"—"}</td><td style={{...td,fontFamily:"IBM Plex Mono,monospace"}}>{c.primary_phone||"—"}</td><td style={td}>{c.use_during_emergency||"—"}</td></tr>)}</tbody>
        </table>

        {/* SECTION 2.1 — AGENCY HVA */}
        <h2 style={h1}>Section II — Hazard and Security Vulnerability Assessment</h2>
        <h3 style={h2}>2.1 Hazard Vulnerability Analysis — Agency-Based</h3>
        <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Last reviewed: {dates.hva?fmtDate(dates.hva):<span style={{color:T.amber}}>⚠ Not yet recorded</span>}</div>
        <HVATable rows={agencyHVA}/>

        {/* SECTION 2.2 — COMMUNITY HVA */}
        <h3 style={h2}>2.2 Hazard Vulnerability Analysis — Community-Based</h3>
        <HVATable rows={communityHVA}/>

        {/* SECTION 2.3 — SECURITY GAPS */}
        <h3 style={h2}>2.3 Security Vulnerability Assessment — Gaps and Corrective Actions</h3>
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          {[{l:"Open",v:openActions.length,c:T.red,bg:T.redBg},{l:"In Progress",v:inProgActions.length,c:T.amber,bg:T.amberBg},{l:"Resolved",v:completeActions.length,c:T.green,bg:T.greenBg}].map(m=>(
            <div key={m.l} style={{background:m.bg,borderRadius:8,padding:"8px 14px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:m.c}}>{m.v}</div><div style={{fontSize:11,color:m.c,fontWeight:700}}>{m.l}</div></div>
          ))}
        </div>
        <table style={tbl}><thead><tr><th style={th}>Security Finding</th><th style={th}>Status</th><th style={th}>Responsible</th><th style={th}>Target Date</th><th style={th}>Notes</th></tr></thead>
          <tbody>{actions.map((a,i)=>{const sc=a.status==="open"?[T.red,T.redBg]:a.status==="in_progress"?[T.amber,T.amberBg]:[T.green,T.greenBg];return(
            <tr key={a.id} style={{background:a.status==="complete"?"#F0FDF4":i%2?"#F8FAFC":"transparent"}}>
              <td style={td}>{a.finding}</td><td style={td}><span style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,color:sc[0],background:sc[1],textTransform:"uppercase"}}>{a.status.replace("_"," ")}</span></td>
              <td style={td}>{a.responsible||"—"}</td><td style={td}>{a.due?fmtDate(a.due):"—"}</td><td style={td}>{a.note||"—"}</td>
            </tr>);})}
          </tbody>
        </table>

        {/* SECTION 3.1 — ICS */}
        <h2 style={h1}>Section III — Emergency Preparedness Team</h2>
        <h3 style={h2}>3.1 Incident Command System (ICS) Structure</h3>
        <table style={tbl}><thead><tr><th style={th}>ICS Position</th><th style={th}>Primary Person</th><th style={th}>Backup Person</th><th style={th}>Key Responsibilities</th></tr></thead>
          <tbody>{icsRoles.map((r,i)=><tr key={r.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={{...td,fontWeight:700}}>{r.ics_position}</td><td style={td}>{r.primary_person||"—"}</td><td style={td}>{r.backup_person||"—"}</td><td style={{...td,fontSize:12}}>{r.key_responsibilities||"—"}</td></tr>)}</tbody>
        </table>

        {/* SECTION 4.1 — SUPPLY INVENTORY */}
        <h2 style={h1}>Section IV — Advance Planning and Preparedness</h2>
        <h3 style={h2}>4.1 Medical Supply Inventory</h3>
        {latestSupply?(
          <>
            <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Last verified: <strong>{latestSupply.verified_by||"—"}</strong> · {latestSupply.quarter} {latestSupply.year} · {fmtDate(latestSupply.saved_at)}</div>
            <table style={tbl}><thead><tr><th style={th}>Item</th><th style={{...th,textAlign:"center"}}>Target</th><th style={{...th,textAlign:"center"}}>Count</th><th style={{...th,textAlign:"center"}}>%</th><th style={th}>Status</th></tr></thead>
              <tbody>{SUPPLY_ITEMS.map((item,i)=>{const c=parseInt(latestSupply.counts?.[item])||0;const t=SUPPLY_TARGETS[i];const pct=c>=t?100:Math.round((c/t)*100);const sl=c===0?"CRITICAL":pct<50?"LOW":pct<80?"ADEQUATE":"GOOD";const[sc,sbg]=c===0?[T.red,T.redBg]:pct<50?[T.red,T.redBg]:pct<80?[T.amber,T.amberBg]:[T.green,T.greenBg];return(
                <tr key={item} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={td}>{item}</td><td style={{...td,textAlign:"center"}}>{t}</td><td style={{...td,textAlign:"center",fontWeight:700}}>{c}</td><td style={{...td,textAlign:"center"}}>{pct}%</td><td style={td}><span style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,color:sc,background:sbg}}>{sl}</span></td></tr>
              );})}
              </tbody>
            </table>
          </>
        ):<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"12px 14px",fontSize:13,color:"#92400E"}}>⚠ No supply inventory recorded yet. Complete the first quarterly check in the Supply Inventory tab.</div>}

        {/* SECTION 4.2 — EQUIPMENT */}
        <h3 style={h2}>4.2 Emergency Equipment and Supplies Inventory</h3>
        <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Last verified: {dates.equip_inv?fmtDate(dates.equip_inv):<span style={{color:T.amber}}>⚠ Not yet recorded</span>}</div>
        <table style={tbl}><thead><tr><th style={th}>Item</th><th style={th}>Location</th><th style={{...th,textAlign:"center"}}>Target</th><th style={{...th,textAlign:"center"}}>Q1</th><th style={{...th,textAlign:"center"}}>Q2</th><th style={{...th,textAlign:"center"}}>Q3</th><th style={{...th,textAlign:"center"}}>Q4</th></tr></thead>
          <tbody>{equipInv.map((e,i)=><tr key={e.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={td}>{e.item_name}</td><td style={td}>{e.location||"—"}</td><td style={{...td,textAlign:"center",fontWeight:600}}>{e.target_qty}</td><td style={{...td,textAlign:"center"}}>{e.q1_count||"—"}</td><td style={{...td,textAlign:"center"}}>{e.q2_count||"—"}</td><td style={{...td,textAlign:"center"}}>{e.q3_count||"—"}</td><td style={{...td,textAlign:"center"}}>{e.q4_count||"—"}</td></tr>)}</tbody>
        </table>

        {/* SECTION 4.3 — GO-BOX */}
        <h3 style={h2}>4.3 Emergency Go-Box</h3>
        <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Last verified: {dates.go_box?fmtDate(dates.go_box):<span style={{color:T.amber}}>⚠ Not yet recorded</span>} · {goBox.filter(g=>g.checked).length}/{goBox.length} items checked</div>
        <table style={tbl}><thead><tr><th style={th}>Go-Box Item</th><th style={{...th,textAlign:"center"}}>Status</th><th style={th}>Notes</th></tr></thead>
          <tbody>{goBox.map((g,i)=><tr key={g.id} style={{background:g.checked?"#F0FDF4":i%2?"#F8FAFC":"transparent"}}><td style={td}>{g.item_name}</td><td style={{...td,textAlign:"center"}}>{g.checked?<span style={{color:T.green,fontWeight:700}}>✓ Checked</span>:<span style={{color:T.amber}}>○ Pending</span>}</td><td style={td}>{g.notes||"—"}</td></tr>)}</tbody>
        </table>

        {/* SECTION 7.1 — COMPLIANCE SCHEDULE */}
        <h2 style={h1}>Section VII — Plan Maintenance and Compliance Schedule</h2>
        <h3 style={h2}>7.1 Plan Review and Update Schedule</h3>
        <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Status as of {fmtDateLong(new Date().toISOString())}.</div>
        <table style={tbl}><thead><tr><th style={th}>Document / Activity</th><th style={th}>Frequency</th><th style={th}>Responsible</th><th style={th}>Last Completed</th><th style={th}>Next Due</th><th style={{...th,textAlign:"center"}}>Status</th></tr></thead>
          <tbody>{itemsWithDates.map((item,i)=>(
            <tr key={item.id} style={{background:item.days!==null&&item.days<0?"#FEF2F2":item.days!==null&&item.days<=30?"#FFFBEB":i%2?"#F8FAFC":"transparent"}}>
              <td style={td}>{item.label}</td><td style={td}>{item.freq}</td><td style={td}>{item.responsible}</td><td style={td}>{item.last?fmtDate(item.last):"—"}</td><td style={td}>{item.next?fmtDate(item.next):"—"}</td>
              <td style={{...td,textAlign:"center"}}><StatusPill days={item.days}/></td>
            </tr>))}
          </tbody>
        </table>

        {/* SECTION 7.2 — DRILLS */}
        <h3 style={h2}>7.2 Annual Drill and Exercise Program</h3>
        <table style={tbl}><thead><tr><th style={th}>Drill Type</th><th style={th}>Frequency</th><th style={th}>Last Conducted</th><th style={th}>Next Due</th><th style={{...th,textAlign:"center"}}>Status</th></tr></thead>
          <tbody>{drills.map((d,i)=><tr key={d.id} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={{...td,fontWeight:600}}>{d.drill_type}</td><td style={td}>{d.frequency}</td><td style={td}>{d.last_conducted?fmtDate(d.last_conducted):"—"}</td><td style={td}>{d.next_due?fmtDate(d.next_due):"—"}</td><td style={{...td,textAlign:"center"}}><StatusPill days={daysUntil(d.next_due)}/></td></tr>)}</tbody>
        </table>

        {/* FOOTER */}
        <div style={{marginTop:32,paddingTop:16,borderTop:"1px solid #E2E8F0",fontSize:11,color:"#94A3B8",display:"flex",justifyContent:"space-between"}}>
          <span>Vitalis Healthcare Services, LLC · Emergency Preparedness Plan · CMS CoP 484.102</span>
          <span>Generated {fmtDateLong(new Date().toISOString())} · Vitalis EP Portal</span>
        </div>
      </div>
    </div>
  );
}

// ── BUILD FULL PLAN HTML (for saved versions) ─────────────────────
function buildFullPlanHTML({dates,actions,contacts,hvaScores,icsRoles,equipInv,goBox,drills,latestSupply,versions,versionNum,generatedBy,summary}){
  const fd=(d)=>d?new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—";
  const fdl=(d)=>d?new Date(d).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—";
  const internal=contacts.filter(c=>c.contact_type==="internal");
  const external=contacts.filter(c=>c.contact_type==="external");
  const agencyHVA=hvaScores.filter(h=>h.hva_type==="agency");
  const communityHVA=hvaScores.filter(h=>h.hva_type==="community");
  const openN=actions.filter(a=>a.status==="open").length;
  const complN=actions.filter(a=>a.status==="complete").length;
  const inpN=actions.filter(a=>a.status==="in_progress").length;
  const items=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);const st=days===null?"Not set":days<0?`Overdue ${Math.abs(days)}d`:days<=30?`Due in ${days}d`:`Due in ${days}d`;return{...s,last,next,days,st};});
  function hvaRow(r){const tot=r.human_impact+r.property_impact+r.service_ability+r.preparedness;return`<tr><td>${r.hazard_name}</td><td style="text-align:center;">${r.human_impact}</td><td style="text-align:center;">${r.property_impact}</td><td style="text-align:center;">${r.service_ability}</td><td style="text-align:center;">${r.preparedness}</td><td style="text-align:center;font-weight:800;">${tot}</td></tr>`;}
  function hvaSection(rows){const cats=[...new Set(rows.map(r=>r.category))];return cats.map(cat=>`<p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748B;">${cat}</p><table><thead><tr><th>Hazard</th><th>Human</th><th>Property</th><th>Service</th><th>Prepared.</th><th>Total</th></tr></thead><tbody>${rows.filter(r=>r.category===cat).map(hvaRow).join("")}</tbody></table>`).join("");}
  const top3=[...hvaScores].sort((a,b)=>(b.human_impact+b.property_impact+b.service_ability+b.preparedness)-(a.human_impact+a.property_impact+a.service_ability+a.preparedness)).slice(0,3);

  return`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Vitalis EP Plan v${versionNum}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;color:#111;max-width:950px;margin:0 auto;padding:40px;font-size:13px;line-height:1.6;}
h1{font-size:18px;font-weight:700;color:#0D1E35;border-bottom:2px solid #0B8A82;padding-bottom:5px;margin:24px 0 10px;}
h2{font-size:14px;font-weight:700;color:#0D1E35;margin:16px 0 6px;}
table{width:100%;border-collapse:collapse;margin-bottom:12px;}
th{background:#0D1E35;color:#fff;padding:7px 10px;text-align:left;font-size:11px;}
td{padding:7px 10px;border-bottom:1px solid #E2E8F0;vertical-align:top;}
tr:nth-child(even) td{background:#F8FAFC;}
.cover{text-align:center;padding-bottom:20px;border-bottom:2px solid #0D1E35;margin-bottom:20px;}
.teal-note{background:#E3F7F6;border:1px solid #0B8A82;border-radius:6px;padding:10px 14px;font-size:12px;color:#0B6B5C;margin:10px 0;}
.warn{background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400E;margin:8px 0;}
footer{margin-top:32px;padding-top:14px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;display:flex;justify-content:space-between;}
@media print{@page{margin:1.5cm;}}</style></head><body>
<div class="cover">
<p style="font-size:11px;color:#64748B;letter-spacing:0.1em;text-transform:uppercase;">Vitalis Healthcare Services, LLC</p>
<p style="font-size:12px;color:#64748B;">8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910 · (240) 716-6874</p>
<h1 style="border:none;font-size:22px;margin:10px 0 4px;">EMERGENCY PREPAREDNESS PLAN</h1>
<p style="color:#475569;margin-bottom:14px;">All-Hazards Emergency Management Program</p>
<table style="width:auto;margin:0 auto;min-width:460px;">
<tr><td style="font-weight:600;width:160px;">Version</td><td>${versionNum} — ${fdl(new Date().toISOString())}</td></tr>
<tr><td style="font-weight:600;background:#F8FAFC;">Updated By</td><td style="background:#F8FAFC;">${generatedBy}</td></tr>
<tr><td style="font-weight:600;">Changes</td><td>${summary}</td></tr>
<tr><td style="font-weight:600;background:#F8FAFC;">Standards</td><td style="background:#F8FAFC;">CMS CoP 484.102 · COMAR 10.07.14.46 · OSHA 29 CFR 1910.38 · Joint Commission EM</td></tr>
</table>
<div class="teal-note">✦ Auto-generated from the Vitalis Emergency Preparedness Portal on ${fdl(new Date().toISOString())}.</div>
</div>

<h1>Document Revision Log</h1>
<table><thead><tr><th>Version</th><th>Date</th><th>Summary of Changes</th><th>Updated By</th></tr></thead><tbody>
<tr><td>1.0</td><td>06/15/2023</td><td>Initial plan adoption</td><td>Agency Admin</td></tr>
<tr><td>2.0</td><td>03/26/2026</td><td>Full rebuild; 4 hazard playbooks; security gap remediation; AI Portal established</td><td>Plan Rebuild</td></tr>
${versions.filter(v=>v.version_num!=="2.0"&&v.html_content).map(v=>`<tr><td>${v.version_num}</td><td>${fd(v.generated_at)}</td><td>${v.changes_summary}</td><td>${v.generated_by}</td></tr>`).join("")}
<tr style="background:#F0FDF4;font-weight:600;"><td>${versionNum}</td><td>${fd(new Date().toISOString())}</td><td>${summary}</td><td>${generatedBy}</td></tr>
</tbody></table>

<h1>Section I — Introduction and Administration</h1>
<h2>1.3 Top Hazards (from HVA)</h2>
<table><thead><tr><th>Rank</th><th>Hazard</th><th>HVA Score</th><th>Source</th></tr></thead><tbody>
${top3.map((h,i)=>`<tr><td style="font-weight:800;font-size:15px;">${i+1}</td><td>${h.hazard_name}</td><td style="font-weight:800;">${h.human_impact+h.property_impact+h.service_ability+h.preparedness}</td><td>${h.hva_type==="agency"?"Agency-Based":"Community-Based"}</td></tr>`).join("")}
</tbody></table>

<h2>1.5 Key Contacts — Internal</h2>
<p style="font-size:11px;color:#64748B;">Last reviewed: ${dates.contacts?fd(dates.contacts):"Not yet recorded"}</p>
<table><thead><tr><th>Role</th><th>Name</th><th>Primary Phone</th><th>Secondary Phone</th></tr></thead><tbody>
${internal.map((c,i)=>`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${c.role_title}</td><td>${c.name||"⚠ TO BE DESIGNATED"}</td><td>${c.primary_phone||"—"}</td><td>${c.secondary_phone||"—"}</td></tr>`).join("")}
</tbody></table>

<h2>Key Contacts — External</h2>
<table><thead><tr><th>Organization</th><th>Contact / Role</th><th>Phone</th><th>Use During Emergency</th></tr></thead><tbody>
${external.map((c,i)=>`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${c.role_title}</td><td>${c.name||"—"}</td><td>${c.primary_phone||"—"}</td><td>${c.use_during_emergency||"—"}</td></tr>`).join("")}
</tbody></table>

<h1>Section II — Hazard and Security Vulnerability Assessment</h1>
<h2>2.1 Hazard Vulnerability Analysis — Agency-Based</h2>
${hvaSection(agencyHVA)}
<h2>2.2 Hazard Vulnerability Analysis — Community-Based</h2>
${hvaSection(communityHVA)}
<h2>2.3 Security Vulnerability Assessment — Corrective Actions</h2>
<p>${openN} open · ${inpN} in progress · ${complN} resolved · Status as of ${fdl(new Date().toISOString())}</p>
<table><thead><tr><th>Finding</th><th>Status</th><th>Responsible</th><th>Target Date</th><th>Notes</th></tr></thead><tbody>
${actions.map((a,i)=>`<tr${a.status==="complete"?' style="background:#F0FDF4;"':i%2?' style="background:#F8FAFC;"':""}><td>${a.finding}</td><td>${a.status.replace("_"," ").toUpperCase()}</td><td>${a.responsible||"—"}</td><td>${a.due?fd(a.due):"—"}</td><td>${a.note||"—"}</td></tr>`).join("")}
</tbody></table>

<h1>Section III — Emergency Preparedness Team</h1>
<h2>3.1 ICS Structure</h2>
<table><thead><tr><th>ICS Position</th><th>Primary Person</th><th>Backup</th><th>Key Responsibilities</th></tr></thead><tbody>
${icsRoles.map((r,i)=>`<tr${i%2?' style="background:#F8FAFC;"':""}><td style="font-weight:700;">${r.ics_position}</td><td>${r.primary_person||"—"}</td><td>${r.backup_person||"—"}</td><td>${r.key_responsibilities||"—"}</td></tr>`).join("")}
</tbody></table>

<h1>Section IV — Advance Planning and Preparedness</h1>
<h2>4.1 Medical Supply Inventory</h2>
${latestSupply?`<p>Verified by: <strong>${latestSupply.verified_by||"—"}</strong> · ${latestSupply.quarter} ${latestSupply.year} · ${fd(latestSupply.saved_at)}</p>
<table><thead><tr><th>Item</th><th>Target</th><th>Count</th><th>%</th><th>Status</th></tr></thead><tbody>
${SUPPLY_ITEMS.map((item,i)=>{const c=parseInt(latestSupply.counts?.[item])||0;const t=SUPPLY_TARGETS[i];const pct=c>=t?100:Math.round((c/t)*100);const sl=c===0?"CRITICAL":pct<50?"LOW":pct<80?"ADEQUATE":"GOOD";return`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${item}</td><td style="text-align:center;">${t}</td><td style="text-align:center;font-weight:700;">${c}</td><td style="text-align:center;">${pct}%</td><td>${sl}</td></tr>`;}).join("")}
</tbody></table>`:`<div class="warn">⚠ No supply inventory recorded yet.</div>`}

<h2>4.2 Equipment Inventory</h2>
<table><thead><tr><th>Item</th><th>Location</th><th>Target</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>
${equipInv.map((e,i)=>`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${e.item_name}</td><td>${e.location||"—"}</td><td style="text-align:center;">${e.target_qty}</td><td style="text-align:center;">${e.q1_count||"—"}</td><td style="text-align:center;">${e.q2_count||"—"}</td><td style="text-align:center;">${e.q3_count||"—"}</td><td style="text-align:center;">${e.q4_count||"—"}</td></tr>`).join("")}
</tbody></table>

<h2>4.3 Emergency Go-Box (${goBox.filter(g=>g.checked).length}/${goBox.length} items checked)</h2>
<table><thead><tr><th>Item</th><th>Status</th><th>Notes</th></tr></thead><tbody>
${goBox.map((g,i)=>`<tr${g.checked?' style="background:#F0FDF4;"':i%2?' style="background:#F8FAFC;"':""}><td>${g.item_name}</td><td>${g.checked?"✓ Checked":"○ Pending"}</td><td>${g.notes||"—"}</td></tr>`).join("")}
</tbody></table>

<h1>Section VII — Plan Maintenance and Compliance Schedule</h1>
<h2>7.1 Review Schedule</h2>
<table><thead><tr><th>Activity</th><th>Frequency</th><th>Responsible</th><th>Last Completed</th><th>Next Due</th><th>Status</th></tr></thead><tbody>
${items.map((item,i)=>`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${item.label}</td><td>${item.freq}</td><td>${item.responsible}</td><td>${item.last?fd(item.last):"—"}</td><td>${item.next?fd(item.next):"—"}</td><td>${item.st}</td></tr>`).join("")}
</tbody></table>

<h2>7.2 Annual Drill and Exercise Program</h2>
<table><thead><tr><th>Drill Type</th><th>Frequency</th><th>Last Conducted</th><th>Next Due</th><th>Status</th></tr></thead><tbody>
${drills.map((d,i)=>{const days=daysUntil(d.next_due);const st=days===null?"Not set":days<0?"OVERDUE":days<=30?"Due soon":"Current";return`<tr${i%2?' style="background:#F8FAFC;"':""}><td style="font-weight:600;">${d.drill_type}</td><td>${d.frequency}</td><td>${d.last_conducted?fd(d.last_conducted):"—"}</td><td>${d.next_due?fd(d.next_due):"—"}</td><td>${st}</td></tr>`;}).join("")}
</tbody></table>

<footer><span>Vitalis Healthcare Services, LLC · Emergency Preparedness Plan v${versionNum} · CMS CoP 484.102</span><span>Generated ${fdl(new Date().toISOString())} · Vitalis EP Portal</span></footer>
</body></html>`;
}
