"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const T = {
  navy:"#0D1E35",teal:"#0B8A82",tealBg:"#E3F7F6",
  amber:"#C96B15",amberBg:"#FEF3E2",red:"#B91C1C",redBg:"#FEF2F2",
  green:"#15803D",greenBg:"#F0FDF4",blue:"#1D4ED8",blueBg:"#EFF6FF",
  slate:"#475569",slateLight:"#94A3B8",border:"#E2E8F0",borderMd:"#CBD5E1",
  bg:"#F8FAFC",card:"#FFFFFF",text:"#0F172A",textMid:"#334155",textLight:"#64748B",
};
const S = {
  card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"1.25rem"},
  cardSm:{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"1rem"},
  h2:{fontSize:20,fontWeight:600,color:T.navy,margin:0},
  h3:{fontSize:15,fontWeight:600,color:T.navy,margin:0},
  label:{fontSize:12,fontWeight:600,letterSpacing:"0.06em",color:T.textLight,textTransform:"uppercase",display:"block",marginBottom:4},
  input:{width:"100%",padding:"8px 12px",border:`1px solid ${T.borderMd}`,borderRadius:6,fontSize:14,color:T.text,background:T.card,outline:"none",boxSizing:"border-box"},
  textarea:{width:"100%",padding:"8px 12px",border:`1px solid ${T.borderMd}`,borderRadius:6,fontSize:14,color:T.text,background:T.card,outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:80},
  select:{width:"100%",padding:"8px 12px",border:`1px solid ${T.borderMd}`,borderRadius:6,fontSize:14,color:T.text,background:T.card,outline:"none"},
  btnPrimary:{padding:"9px 20px",background:T.navy,color:"#fff",border:"none",borderRadius:7,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  btnSecondary:{padding:"8px 16px",background:"transparent",color:T.navy,border:`1px solid ${T.borderMd}`,borderRadius:7,fontSize:14,fontWeight:500,cursor:"pointer"},
  btnTeal:{padding:"9px 20px",background:T.teal,color:"#fff",border:"none",borderRadius:7,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  btnSm:{padding:"5px 12px",fontSize:13,fontWeight:500,cursor:"pointer",borderRadius:5,border:`1px solid ${T.borderMd}`,background:T.card,color:T.textMid},
};

const SCHEDULE = [
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

const SUPPLY_ITEMS = [
  "First Aid Supplies (kit)","Band-Aids (box)","Gauze and Bandages (packs)",
  "Alcohol / Hydrogen Peroxide","Neosporin / Antiseptic",
  "Disposable Gloves (boxes of 100)","Disposable Gowns","Surgical Masks (boxes)",
  "N-95 Respirators","Protective Eyewear","Eyewash Saline Solution",
  "Hand Sanitizer (bottles)","Sanitizing Wipes (canisters)","First Aid Tape",
  "Sterile 4x4 Gauze Pads (packs)","Normal Saline","Kling / Ace Bandages",
];
const SUPPLY_TARGETS = [2,2,5,5,3,10,10,10,20,10,5,15,10,5,10,10,10];
const HAZARDS = ["Snowstorm / Severe Weather","Fire and Evacuation","Cyber-Attack / IT Systems Failure","Infectious Disease / Pandemic","General Emergency"];

function daysUntil(d){if(!d)return null;return Math.ceil((new Date(d)-new Date())/86400000);}
function addMonths(b,m){const d=new Date(b);d.setDate(d.getDate()+Math.round(m*30.44));return d.toISOString().split("T")[0];}
function fmtDate(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function fmtDateLong(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});}

function StatusPill({days}){
  const ps=(c,bg)=>({display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:20,fontSize:12,fontWeight:600,color:c,background:bg,whiteSpace:"nowrap"});
  if(days===null)return<span style={ps("#64748B","#F1F5F9")}>Not set</span>;
  if(days<0)return<span style={ps(T.red,T.redBg)}>Overdue {Math.abs(days)}d</span>;
  if(days<=14)return<span style={ps(T.amber,T.amberBg)}>Due in {days}d</span>;
  if(days<=60)return<span style={ps("#92400E","#FEF3C7")}>Due in {days}d</span>;
  return<span style={ps(T.green,T.greenBg)}>Due in {days}d</span>;
}
function Spinner(){return<span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;}

async function callClaude(sys,usr){
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:usr}]})});
  const data=await res.json();if(data.error)throw new Error(data.error.message);
  return data.content?.find(c=>c.type==="text")?.text||"";
}

export default function EmergencyPreparednessPage(){
  const [tab,setTab]=useState("dashboard");
  const [dates,setDates]=useState({});
  const [actions,setActions]=useState([]);
  const [versions,setVersions]=useState([]);
  const [latestSupply,setLatestSupply]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const [{data:dD},{data:aD},{data:vD},{data:sD}]=await Promise.all([
          supabase.from("ep_compliance_dates").select("item_id,last_completed"),
          supabase.from("ep_corrective_actions").select("*").order("sort_order"),
          supabase.from("ep_plan_versions").select("*").order("generated_at",{ascending:false}),
          supabase.from("ep_supply_snapshots").select("*").order("saved_at",{ascending:false}).limit(1),
        ]);
        if(dD){const m={};dD.forEach(r=>{m[r.item_id]=r.last_completed;});setDates(m);}
        if(aD)setActions(aD);
        if(vD)setVersions(vD);
        if(sD&&sD.length>0)setLatestSupply(sD[0]);
      }catch(e){console.error(e);}
      setLoaded(true);
    })();
  },[]);

  const markComplete=useCallback(async(id)=>{
    const t=new Date().toISOString().split("T")[0];
    setDates(p=>({...p,[id]:t}));
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

  if(!loaded)return<div style={{padding:60,textAlign:"center",color:T.textLight}}>Loading Emergency Preparedness…</div>;

  const overdueCount=SCHEDULE.filter(s=>{const last=dates[s.id];if(!last)return s.freq!=="biennial";return daysUntil(addMonths(last,s.months))<0;}).length;
  const openCount=actions.filter(a=>a.status==="open").length;

  const TABS=[
    {id:"dashboard",label:"Dashboard"},
    {id:"templates",label:"Emergency Templates"},
    {id:"inventory",label:"Supply Inventory"},
    {id:"aar",label:"After-Action Report"},
    {id:"actions",label:`Corrective Actions${openCount>0?` (${openCount})`:""}`},
    {id:"liveplan",label:"📄 Live Plan Document"},
  ];

  return(
    <div style={{fontFamily:"'IBM Plex Sans',system-ui,sans-serif",background:T.bg,minHeight:"100vh",color:T.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        *{box-sizing:border-box;}
        input:focus,textarea:focus,select:focus{border-color:${T.teal}!important;box-shadow:0 0 0 3px ${T.tealBg};}
        .ep-anim{animation:fadeIn 0.25s ease both;}
        @media print{.ep-no-print{display:none!important;}body{background:white!important;}}
      `}</style>

      <div className="ep-no-print" style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><h1 style={{fontSize:20,fontWeight:700,color:T.navy,margin:0}}>Emergency Preparedness</h1><div style={{fontSize:13,color:T.textLight,marginTop:2}}>CMS CoP 484.102 compliance tracking &amp; operational tools</div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {overdueCount>0&&<div style={{background:T.redBg,border:"1px solid #FECACA",color:T.red,fontSize:12,fontWeight:600,padding:"5px 12px",borderRadius:20}}>⚠ {overdueCount} overdue</div>}
          <div style={{fontSize:12,color:T.textLight}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
      </div>

      <div className="ep-no-print" style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"0 24px",display:"flex",position:"sticky",top:0,zIndex:50}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"12px 16px",fontSize:14,fontWeight:tab===t.id?600:400,color:tab===t.id?T.navy:T.textLight,background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${T.teal}`:"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:"24px",maxWidth:tab==="liveplan"?1000:1100,margin:"0 auto"}} className="ep-anim" key={tab}>
        {tab==="dashboard"&&<Dashboard dates={dates} actions={actions} onMark={markComplete}/>}
        {tab==="templates"&&<Templates/>}
        {tab==="inventory"&&<Inventory dates={dates} onMark={markComplete} onSaveSnapshot={saveSupplySnapshot}/>}
        {tab==="aar"&&<AfterAction/>}
        {tab==="actions"&&<CorrectiveActions actions={actions} onChange={saveActions}/>}
        {tab==="liveplan"&&<LivePlanDocument dates={dates} actions={actions} versions={versions} latestSupply={latestSupply} onSaveVersion={saveVersion}/>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// LIVE PLAN DOCUMENT TAB
// ──────────────────────────────────────────────────────────────────
function LivePlanDocument({dates,actions,versions,latestSupply,onSaveVersion}){
  const [saving,setSaving]=useState(false);
  const [savedMsg,setSavedMsg]=useState("");
  const [showSave,setShowSave]=useState(false);
  const [triggerEvent,setTriggerEvent]=useState("");
  const [generatedBy,setGeneratedBy]=useState("");

  const currentVersion=versions[0]||null;
  const nextVer=()=>{if(!currentVersion)return"2.1";const p=currentVersion.version_num.split(".");return`${p[0]}.${parseInt(p[1]||0)+1}`;};

  const itemsWithDates=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);return{...s,last,next,days};});
  const overdueItems=itemsWithDates.filter(i=>i.days!==null&&i.days<0);
  const openActions=actions.filter(a=>a.status==="open");
  const completeActions=actions.filter(a=>a.status==="complete");
  const inProgActions=actions.filter(a=>a.status==="in_progress");

  async function handleSave(){
    if(!generatedBy.trim()||!triggerEvent.trim())return;
    setSaving(true);
    const changeLines=[];
    if(triggerEvent)changeLines.push(triggerEvent);
    if(completeActions.length>0)changeLines.push(`${completeActions.length} security gap(s) resolved`);
    if(overdueItems.length>0)changeLines.push(`${overdueItems.length} compliance item(s) overdue — action required`);
    const summary=changeLines.join(". ")||"Routine update";
    const snapshot={dates,actions,supply:latestSupply||null};
    const html=buildPlanHTML({dates,actions,latestSupply,versions,versionNum:nextVer(),generatedBy,summary});
    await onSaveVersion({version_num:nextVer(),generated_by:generatedBy,trigger_event:triggerEvent,changes_summary:summary,snapshot_data:snapshot,html_content:html});
    setSaving(false);setSavedMsg(`v${nextVer()} saved`);setShowSave(false);setTriggerEvent("");
    setTimeout(()=>setSavedMsg(""),5000);
  }

  function openVersion(html){const w=window.open("","_blank");w.document.write(html);w.document.close();}

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* TOOLBAR */}
      <div className="ep-no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={S.h2}>Emergency Preparedness Plan — Live Document</h2>
          <div style={{fontSize:13,color:T.textLight,marginTop:2}}>
            Live data · {currentVersion?`Current: v${currentVersion.version_num} saved ${fmtDate(currentVersion.generated_at)}`:"No saved versions yet"} · Next version will be <strong>v{nextVer()}</strong>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {savedMsg&&<div style={{background:T.greenBg,color:T.green,padding:"6px 14px",borderRadius:7,fontSize:13,fontWeight:600}}>✓ {savedMsg}</div>}
          <button onClick={()=>window.print()} style={S.btnSecondary}>🖨 Print / PDF</button>
          <button onClick={()=>setShowSave(p=>!p)} style={S.btnPrimary}>💾 Save New Version</button>
        </div>
      </div>

      {/* HOW IT WORKS BANNER */}
      <div className="ep-no-print" style={{background:T.tealBg,border:`1px solid ${T.teal}30`,borderRadius:10,padding:"14px 18px"}}>
        <div style={{fontSize:14,fontWeight:600,color:T.teal,marginBottom:4}}>How this works</div>
        <div style={{fontSize:13,color:T.textMid}}>
          This document is generated live from your portal data. The <strong>compliance schedule, supply inventory counts, and corrective action statuses</strong> are all filled in automatically. When you complete any EP activity — a drill, supply check, corrective action — click <strong>"Save New Version"</strong> to snapshot the current state and add it to your version history. Each saved version is stored permanently and can be opened or printed at any time for surveyors or governing council meetings.
        </div>
      </div>

      {/* SAVE PANEL */}
      {showSave&&(
        <div className="ep-no-print" style={{...S.card,border:`1px solid ${T.teal}`,background:T.tealBg}}>
          <h3 style={{...S.h3,marginBottom:14}}>Save as Version {nextVer()}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12,marginBottom:12}}>
            <div><label style={S.label}>Your Name</label><input value={generatedBy} onChange={e=>setGeneratedBy(e.target.value)} style={S.input} placeholder="e.g. Okezie Ofoegbu"/></div>
            <div><label style={S.label}>What prompted this update?</label><input value={triggerEvent} onChange={e=>setTriggerEvent(e.target.value)} style={S.input} placeholder="e.g. Q2 supply inventory completed · annual drill conducted 04/15/2026"/></div>
          </div>
          <div style={{fontSize:13,background:"rgba(255,255,255,0.75)",borderRadius:8,padding:"10px 14px",marginBottom:12,color:T.textMid}}>
            <strong>Changes that will be captured:</strong><br/>
            {completeActions.length>0&&<div>• {completeActions.length} security gap(s) now marked complete</div>}
            {openActions.length>0&&<div>• {openActions.length} open corrective action(s)</div>}
            {overdueItems.length>0&&<div style={{color:T.red}}>• ⚠ {overdueItems.length} compliance item(s) overdue</div>}
            {latestSupply&&<div>• Supply inventory on file: {latestSupply.quarter} {latestSupply.year} (verified by {latestSupply.verified_by||"—"})</div>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={handleSave} disabled={saving||!generatedBy||!triggerEvent} style={{...S.btnTeal,opacity:(saving||!generatedBy||!triggerEvent)?0.6:1}}>
              {saving?<Spinner/>:"💾"} {saving?"Saving…":`Save v${nextVer()}`}
            </button>
            <button onClick={()=>setShowSave(false)} style={S.btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      {/* VERSION HISTORY */}
      {versions.length>0&&(
        <div className="ep-no-print" style={S.card}>
          <h3 style={{...S.h3,marginBottom:14}}>Version History</h3>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {versions.map((v,i)=>(
              <div key={v.id} style={{display:"grid",gridTemplateColumns:"80px 130px 1fr auto",gap:12,padding:"10px 12px",borderRadius:8,background:i===0?"#F0FDF4":"#F8FAFC",border:`1px solid ${i===0?"#A7F3D0":T.border}`,alignItems:"start"}}>
                <div>
                  <div style={{fontFamily:"IBM Plex Mono,monospace",fontSize:13,fontWeight:700,color:i===0?T.green:T.navy}}>v{v.version_num}</div>
                  {i===0&&<div style={{fontSize:10,color:T.green,fontWeight:700,textTransform:"uppercase",marginTop:2}}>Current</div>}
                </div>
                <div style={{fontSize:12,color:T.textLight}}>
                  <div>{fmtDate(v.generated_at)}</div>
                  {v.generated_by&&<div style={{marginTop:1}}>{v.generated_by}</div>}
                </div>
                <div style={{fontSize:13,color:T.textMid}}>{v.changes_summary}</div>
                <div style={{display:"flex",gap:6}}>
                  {v.html_content&&<button onClick={()=>openVersion(v.html_content)} style={S.btnSm}>Open</button>}
                  {v.html_content&&<button onClick={()=>{const b=new Blob([v.html_content],{type:"text/html"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`Vitalis_EP_Plan_v${v.version_num}.html`;a.click();}} style={S.btnSm}>Download</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE PLAN RENDER */}
      <PlanRenderer dates={dates} actions={actions} latestSupply={latestSupply} versions={versions}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// PLAN RENDERER — the actual document
// ──────────────────────────────────────────────────────────────────
function PlanRenderer({dates,actions,latestSupply,versions}){
  const currentVersion=versions[0]||null;
  const itemsWithDates=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);return{...s,last,next,days};});
  const openActions=actions.filter(a=>a.status==="open");
  const inProgActions=actions.filter(a=>a.status==="in_progress");
  const completeActions=actions.filter(a=>a.status==="complete");

  const doc={fontFamily:"'IBM Plex Sans',Georgia,serif",color:"#111",background:"#fff",fontSize:14,lineHeight:1.7};
  const h1={fontSize:20,fontWeight:700,color:"#0D1E35",borderBottom:"2px solid #0B8A82",paddingBottom:6,marginBottom:16,marginTop:32};
  const h2={fontSize:15,fontWeight:700,color:"#0D1E35",marginTop:20,marginBottom:8};
  const tbl={width:"100%",borderCollapse:"collapse",fontSize:13,marginBottom:16};
  const th={background:"#0D1E35",color:"#fff",padding:"8px 10px",textAlign:"left",fontWeight:600,fontSize:12};
  const td={padding:"8px 10px",borderBottom:"1px solid #E2E8F0",verticalAlign:"top"};
  const td2={...td,background:"#F8FAFC"};
  const badge=(s)=>{const m={open:[T.red,T.redBg],in_progress:[T.amber,T.amberBg],complete:[T.green,T.greenBg]};const[c,bg]=m[s]||["#64748B","#F1F5F9"];return<span style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,color:c,background:bg,textTransform:"uppercase"}}>{s.replace("_"," ")}</span>;};

  return(
    <div style={{...doc,padding:40,border:"1px solid #E2E8F0",borderRadius:12}}>

      {/* COVER */}
      <div style={{textAlign:"center",paddingBottom:28,borderBottom:"2px solid #0D1E35",marginBottom:28}}>
        <div style={{fontSize:12,color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Vitalis Healthcare Services, LLC</div>
        <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910 · (240) 716-6874</div>
        <div style={{fontSize:26,fontWeight:800,color:"#0D1E35",marginBottom:4}}>EMERGENCY PREPAREDNESS PLAN</div>
        <div style={{fontSize:14,color:"#475569",marginBottom:20}}>All-Hazards Emergency Management Program</div>
        <table style={{...tbl,width:"auto",margin:"0 auto",minWidth:500}}>
          <tbody>
            <tr><td style={{...td,fontWeight:600,width:180}}>Version</td><td style={td}>{currentVersion?`${currentVersion.version_num} — ${fmtDateLong(currentVersion.generated_at)}`:"2.0 — March 26, 2026"}</td></tr>
            <tr><td style={{...td2,fontWeight:600}}>Last Updated By</td><td style={td2}>{currentVersion?.generated_by||"Plan Rebuild"}</td></tr>
            <tr><td style={{...td,fontWeight:600}}>Review Cycle</td><td style={td}>Biennial or upon any material change</td></tr>
            <tr><td style={{...td2,fontWeight:600}}>Regulatory Standards</td><td style={td2}>CMS CoP 484.102 · COMAR 10.07.14.46 · OSHA 29 CFR 1910.38 · Joint Commission EM</td></tr>
            <tr><td style={{...td,fontWeight:600}}>Document Generated</td><td style={td}>{fmtDateLong(new Date().toISOString())} · <em style={{color:"#64748B"}}>Live from Vitalis EP Portal</em></td></tr>
          </tbody>
        </table>
        <div style={{marginTop:20,padding:"10px 18px",background:"#E3F7F6",borderRadius:8,border:"1px solid #0B8A82",fontSize:13,color:"#0B6B5C",display:"inline-block"}}>
          ✦ This document is auto-generated from the Vitalis Emergency Preparedness Portal. Compliance dates, supply counts, and corrective action statuses reflect live data.
        </div>
      </div>

      {/* REVISION LOG */}
      <h2 style={h1}>Document Revision Log</h2>
      <div style={{fontSize:13,color:"#475569",marginBottom:10}}>Every change — contact updates, policy revisions, post-drill findings — must be recorded below. This log is the primary evidence of plan maintenance for all regulatory reviews.</div>
      <table style={tbl}>
        <thead><tr><th style={th}>Version</th><th style={th}>Date</th><th style={th}>Summary of Changes</th><th style={th}>Updated By</th></tr></thead>
        <tbody>
          <tr><td style={td}>1.0</td><td style={td}>06/15/2023</td><td style={td}>Initial plan adoption — generic template structure</td><td style={td}>Agency Admin</td></tr>
          <tr><td style={td2}>2.0</td><td style={td2}>03/26/2026</td><td style={td2}>Full rebuild: single master document; 4 hazard playbooks; corrected HVA; security gap remediation; AI Portal established</td><td style={td2}>Plan Rebuild</td></tr>
          {versions.filter(v=>v.version_num!=="2.0"&&v.html_content).map((v,i)=>(
            <tr key={v.id} style={{background:i%2===0?"transparent":"#F8FAFC"}}>
              <td style={td}>{v.version_num}</td><td style={td}>{fmtDate(v.generated_at)}</td><td style={td}>{v.changes_summary}</td><td style={td}>{v.generated_by}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION I */}
      <h2 style={h1}>Section I — Introduction and Administration</h2>
      <h3 style={h2}>1.1 Policy Statement</h3>
      <p style={{color:"#334155"}}>Vitalis Healthcare Services, LLC is committed to protecting the safety and continuity of care for all patients, and the safety of all staff, in the event of an emergency or disaster. This plan applies to all internal and external emergencies that would suddenly and significantly affect the Agency's ability to provide services. The Agency uses an all-hazards approach: the core response framework applies to any emergency, with hazard-specific playbooks layered on top for the highest-impact events.</p>
      <h3 style={h2}>1.5 Key Contacts — Internal</h3>
      <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>Last contacts review: {dates.contacts?fmtDate(dates.contacts):<span style={{color:T.amber}}>⚠ Not yet recorded — mark complete on Dashboard</span>}</div>
      <table style={tbl}>
        <thead><tr><th style={th}>Role</th><th style={th}>Name</th><th style={th}>Primary Phone</th><th style={th}>Secondary</th></tr></thead>
        <tbody>
          {[["Administrator / CEO","Okezie Ofoegbu","(240) 716-6874","(202) 352-6018"],["Assistant Administrator","Ernestina Afriyie","(202) 779-6679","—"],["Director of Clinical Services","Ngozi Ahatanke","(301) 237-2436","—"],["Clinical Manager","Divine Ngufor Fube","(240) 423-8757","—"],["Business Office Manager","Jay Jelenke","(240) 425-7465","—"],["LPN — Field Staff","Hermella Mekonnen","(703) 485-5306","—"],["LPN — Field Staff","Genet Belgu","(410) 615-9098","—"],["Safety / Security Officer","[TO BE DESIGNATED]","—","—"]].map(([r,n,p1,p2],i)=>(
            <tr key={i}><td style={i%2?td2:td}>{r}</td><td style={i%2?td2:td}>{n}</td><td style={i%2?td2:td}>{p1}</td><td style={i%2?td2:td}>{p2}</td></tr>
          ))}
        </tbody>
      </table>

      {/* SECTION II — SECURITY */}
      <h2 style={h1}>Section II — Security Vulnerability Assessment — Corrective Actions</h2>
      <div style={{fontSize:13,color:"#475569",marginBottom:10}}>Assessment completed 03/26/2026. Status as of {fmtDateLong(new Date().toISOString())}.</div>
      <div style={{display:"flex",gap:12,marginBottom:16}}>
        {[{label:"Open Gaps",v:openActions.length,c:T.red,bg:T.redBg},{label:"In Progress",v:inProgActions.length,c:T.amber,bg:T.amberBg},{label:"Resolved",v:completeActions.length,c:T.green,bg:T.greenBg}].map(m=>(
          <div key={m.label} style={{background:m.bg,border:`1px solid ${m.c}30`,borderRadius:8,padding:"10px 16px",textAlign:"center",minWidth:90}}>
            <div style={{fontSize:22,fontWeight:800,color:m.c}}>{m.v}</div>
            <div style={{fontSize:11,color:m.c,fontWeight:600}}>{m.label}</div>
          </div>
        ))}
      </div>
      <table style={tbl}>
        <thead><tr><th style={th}>Security Finding</th><th style={th}>Status</th><th style={th}>Responsible</th><th style={th}>Target Date</th><th style={th}>Notes</th></tr></thead>
        <tbody>
          {actions.map((a,i)=>(
            <tr key={a.id} style={{background:a.status==="complete"?"#F0FDF4":a.status==="in_progress"?"#FFFBEB":i%2?"#F8FAFC":"transparent"}}>
              <td style={td}>{a.finding}</td><td style={td}>{badge(a.status)}</td><td style={td}>{a.responsible||"—"}</td><td style={td}>{a.due?fmtDate(a.due):"—"}</td><td style={td}>{a.note||"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION IV — SUPPLY */}
      <h2 style={h1}>Section IV — Emergency Medical Supply Inventory</h2>
      {latestSupply?(
        <>
          <div style={{fontSize:13,color:"#475569",marginBottom:10}}>Last verified by: <strong>{latestSupply.verified_by||"—"}</strong> · {latestSupply.quarter} {latestSupply.year} · Saved {fmtDate(latestSupply.saved_at)}</div>
          <table style={tbl}>
            <thead><tr><th style={th}>Item</th><th style={{...th,textAlign:"center"}}>Target</th><th style={{...th,textAlign:"center"}}>Count</th><th style={{...th,textAlign:"center"}}>% of Target</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {SUPPLY_ITEMS.map((item,i)=>{
                const count=parseInt(latestSupply.counts?.[item])||0;const target=SUPPLY_TARGETS[i];const pct=count>=target?100:Math.round((count/target)*100);
                const [sc,sbg]=count===0?[T.red,T.redBg]:pct<50?[T.red,T.redBg]:pct<80?[T.amber,T.amberBg]:[T.green,T.greenBg];const sl=count===0?"CRITICAL":pct<50?"LOW":pct<80?"ADEQUATE":"GOOD";
                return(<tr key={item} style={{background:i%2?"#F8FAFC":"transparent"}}><td style={td}>{item}</td><td style={{...td,textAlign:"center"}}>{target}</td><td style={{...td,textAlign:"center",fontWeight:600}}>{count}</td><td style={{...td,textAlign:"center"}}>{pct}%</td><td style={td}><span style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,color:sc,background:sbg}}>{sl}</span></td></tr>);
              })}
            </tbody>
          </table>
        </>
      ):(
        <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"14px 16px",fontSize:13,color:"#92400E"}}>
          ⚠ No supply inventory recorded yet. Complete the first quarterly inventory check in the Supply Inventory tab to populate this section.
        </div>
      )}

      {/* SECTION VII — COMPLIANCE SCHEDULE */}
      <h2 style={h1}>Section VII — Plan Maintenance and Compliance Schedule</h2>
      <h3 style={h2}>7.1 Plan Review and Update Schedule</h3>
      <div style={{fontSize:13,color:"#475569",marginBottom:10}}>Status as of {fmtDateLong(new Date().toISOString())}. All dates from the Vitalis EP Portal.</div>
      <table style={tbl}>
        <thead><tr><th style={th}>Document / Activity</th><th style={th}>Frequency</th><th style={th}>Responsible</th><th style={th}>Last Completed</th><th style={th}>Next Due</th><th style={{...th,textAlign:"center"}}>Status</th></tr></thead>
        <tbody>
          {itemsWithDates.map((item,i)=>(
            <tr key={item.id} style={{background:item.days!==null&&item.days<0?"#FEF2F2":item.days!==null&&item.days<=30?"#FFFBEB":i%2?"#F8FAFC":"transparent"}}>
              <td style={td}>{item.label}</td><td style={td}>{item.freq}</td><td style={td}>{item.responsible}</td>
              <td style={td}>{item.last?fmtDate(item.last):"—"}</td><td style={td}>{item.next?fmtDate(item.next):"—"}</td>
              <td style={{...td,textAlign:"center"}}><StatusPill days={item.days}/></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid #E2E8F0",fontSize:12,color:"#94A3B8",display:"flex",justifyContent:"space-between"}}>
        <span>Vitalis Healthcare Services, LLC · Emergency Preparedness Plan · CMS CoP 484.102</span>
        <span>Generated {fmtDateLong(new Date().toISOString())} · Vitalis EP Portal</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// buildPlanHTML — generates self-contained HTML for version storage
// ──────────────────────────────────────────────────────────────────
function buildPlanHTML({dates,actions,latestSupply,versions,versionNum,generatedBy,summary}){
  const fd=(d)=>d?new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—";
  const fdl=(d)=>d?new Date(d).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—";
  const items=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);const st=days===null?"Not set":days<0?`Overdue ${Math.abs(days)}d`:days<=30?`Due in ${days}d`:`Due in ${days}d`;return{...s,last,next,days,st};});
  const openN=actions.filter(a=>a.status==="open").length;const complN=actions.filter(a=>a.status==="complete").length;const inpN=actions.filter(a=>a.status==="in_progress").length;
  const asBadge=(s)=>`<span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;color:${s==="open"?"#B91C1C":s==="in_progress"?"#C96B15":"#15803D"};background:${s==="open"?"#FEF2F2":s==="in_progress"?"#FEF3E2":"#F0FDF4"}">${s.replace("_"," ")}</span>`;
  return`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Vitalis EP Plan v${versionNum}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;color:#111;max-width:950px;margin:0 auto;padding:40px;font-size:14px;line-height:1.6;}h1{font-size:20px;font-weight:700;color:#0D1E35;border-bottom:2px solid #0B8A82;padding-bottom:6px;margin:28px 0 12px;}h2{font-size:15px;font-weight:700;color:#0D1E35;margin:18px 0 8px;}table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;}th{background:#0D1E35;color:#fff;padding:8px 10px;text-align:left;font-size:12px;}td{padding:8px 10px;border-bottom:1px solid #E2E8F0;vertical-align:top;}tr:nth-child(even) td{background:#F8FAFC;}.cover{text-align:center;padding-bottom:28px;border-bottom:2px solid #0D1E35;margin-bottom:28px;}.teal-note{background:#E3F7F6;border:1px solid #0B8A82;border-radius:8px;padding:12px 16px;font-size:13px;color:#0B6B5C;margin:16px 0;}.warn{background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400E;margin:12px 0;}footer{margin-top:40px;padding-top:20px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;display:flex;justify-content:space-between;}@media print{.noprint{display:none!important;}}</style></head><body>
<div class="cover">
<p style="font-size:11px;color:#64748B;letter-spacing:0.1em;text-transform:uppercase;">Vitalis Healthcare Services, LLC</p>
<p style="font-size:12px;color:#64748B;">8757 Georgia Avenue, Suite 440 · Silver Spring, MD 20910 · (240) 716-6874</p>
<h1 style="border:none;font-size:24px;margin:12px 0 4px;">EMERGENCY PREPAREDNESS PLAN</h1>
<p style="color:#475569;margin-bottom:20px;">All-Hazards Emergency Management Program</p>
<table style="width:auto;margin:0 auto;min-width:500px;">
<tr><td style="font-weight:600;width:180px;">Version</td><td>${versionNum} — ${fdl(new Date().toISOString())}</td></tr>
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
<h1>Section I — Key Contacts Internal</h1>
<p style="font-size:12px;color:#64748B;">Last reviewed: ${dates.contacts?fd(dates.contacts):"Not yet recorded"}</p>
<table><thead><tr><th>Role</th><th>Name</th><th>Primary Phone</th><th>Secondary</th></tr></thead><tbody>
<tr><td>Administrator / CEO</td><td>Okezie Ofoegbu</td><td>(240) 716-6874</td><td>(202) 352-6018</td></tr>
<tr><td>Assistant Administrator</td><td>Ernestina Afriyie</td><td>(202) 779-6679</td><td>—</td></tr>
<tr><td>Director of Clinical Services</td><td>Ngozi Ahatanke</td><td>(301) 237-2436</td><td>—</td></tr>
<tr><td>Clinical Manager</td><td>Divine Ngufor Fube</td><td>(240) 423-8757</td><td>—</td></tr>
<tr><td>Business Office Manager</td><td>Jay Jelenke</td><td>(240) 425-7465</td><td>—</td></tr>
<tr><td>Safety / Security Officer</td><td>[TO BE DESIGNATED]</td><td>—</td><td>—</td></tr>
</tbody></table>
<h1>Section II — Security Vulnerability Assessment</h1>
<p>Status as of ${fdl(new Date().toISOString())} · ${openN} open · ${inpN} in progress · ${complN} resolved.</p>
<table><thead><tr><th>Finding</th><th>Status</th><th>Responsible</th><th>Target Date</th><th>Notes</th></tr></thead><tbody>
${actions.map((a,i)=>`<tr${a.status==="complete"?' style="background:#F0FDF4;"':i%2?' style="background:#F8FAFC;"':""}><td>${a.finding}</td><td>${asBadge(a.status)}</td><td>${a.responsible||"—"}</td><td>${a.due?fd(a.due):"—"}</td><td>${a.note||"—"}</td></tr>`).join("")}
</tbody></table>
<h1>Section IV — Medical Supply Inventory</h1>
${latestSupply?`<p>Last verified: <strong>${latestSupply.verified_by||"—"}</strong> · ${latestSupply.quarter} ${latestSupply.year} · ${fd(latestSupply.saved_at)}</p>
<table><thead><tr><th>Item</th><th>Target</th><th>Count</th><th>%</th><th>Status</th></tr></thead><tbody>
${SUPPLY_ITEMS.map((item,i)=>{const count=parseInt(latestSupply.counts?.[item])||0;const target=SUPPLY_TARGETS[i];const pct=count>=target?100:Math.round((count/target)*100);const sl=count===0?"CRITICAL":pct<50?"LOW":pct<80?"ADEQUATE":"GOOD";return`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${item}</td><td style="text-align:center;">${target}</td><td style="text-align:center;font-weight:600;">${count}</td><td style="text-align:center;">${pct}%</td><td>${sl}</td></tr>`;}).join("")}
</tbody></table>`
:`<div class="warn">⚠ No supply inventory recorded yet.</div>`}
<h1>Section VII — Compliance Schedule</h1>
<p>Status as of ${fdl(new Date().toISOString())}.</p>
<table><thead><tr><th>Activity</th><th>Frequency</th><th>Responsible</th><th>Last Completed</th><th>Next Due</th><th>Status</th></tr></thead><tbody>
${items.map((item,i)=>`<tr${i%2?' style="background:#F8FAFC;"':""}><td>${item.label}</td><td>${item.freq}</td><td>${item.responsible}</td><td>${item.last?fd(item.last):"—"}</td><td>${item.next?fd(item.next):"—"}</td><td>${item.st}</td></tr>`).join("")}
</tbody></table>
<footer><span>Vitalis Healthcare Services, LLC · Emergency Preparedness Plan v${versionNum} · CMS CoP 484.102</span><span>Generated ${fdl(new Date().toISOString())} · Vitalis EP Portal</span></footer>
</body></html>`;
}

// ──────────────────────────────────────────────────────────────────
// REMAINING TABS (Dashboard, Templates, Inventory, AfterAction, CorrectiveActions)
// ──────────────────────────────────────────────────────────────────
function Dashboard({dates,actions,onMark}){
  const items=SCHEDULE.map(s=>{const last=dates[s.id]||null;const next=last?addMonths(last,s.months):null;const days=daysUntil(next);return{...s,last,next,days};});
  const overdue=items.filter(i=>i.days!==null&&i.days<0).length;const soon=items.filter(i=>i.days!==null&&i.days>=0&&i.days<=30).length;const current=items.filter(i=>i.days!==null&&i.days>30).length;const notSet=items.filter(i=>i.days===null).length;const openActs=actions.filter(a=>a.status==="open").length;
  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {overdue>0&&<div style={{background:T.redBg,border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16,color:T.red}}>⚠</span><span style={{fontSize:14,color:T.red,fontWeight:500}}>{overdue} compliance item{overdue>1?"s":""} overdue. Review immediately.</span></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
      {[{label:"Overdue",value:overdue,color:T.red,bg:T.redBg},{label:"Due ≤30 days",value:soon,color:T.amber,bg:T.amberBg},{label:"Current",value:current,color:T.green,bg:T.greenBg},{label:"Date Not Set",value:notSet,color:T.slate,bg:"#F1F5F9"},{label:"Open Actions",value:openActs,color:T.blue,bg:T.blueBg}].map(m=>(
        <div key={m.label} style={{background:m.bg,border:`1px solid ${m.color}30`,borderRadius:10,padding:"14px 16px"}}>
          <div style={{fontSize:28,fontWeight:700,color:m.color,fontFamily:"IBM Plex Mono,monospace",lineHeight:1}}>{m.value}</div>
          <div style={{fontSize:12,color:m.color,marginTop:4,fontWeight:500,opacity:0.85}}>{m.label}</div>
        </div>
      ))}
    </div>
    <div style={S.card}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h2 style={S.h2}>Compliance Calendar</h2><span style={{fontSize:12,color:T.textLight}}>Click "Done" to mark complete today</span></div>
      <div style={{display:"flex",flexDirection:"column",gap:1}}>
        {[...items].sort((a,b)=>(a.days??9999)-(b.days??9999)).map((item,i)=>(
          <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr auto 160px 100px",alignItems:"center",gap:12,padding:"10px 12px",background:i%2===0?"transparent":"#F8FAFC",borderRadius:6}}>
            <div><div style={{fontSize:14,fontWeight:500,color:T.text}}>{item.label}</div><div style={{fontSize:12,color:T.textLight,marginTop:1}}>{item.responsible} · {item.freq}{item.last&&<span style={{marginLeft:6}}>· Last: {fmtDate(item.last)}</span>}</div></div>
            <div style={{fontSize:12,color:T.textLight,textAlign:"right"}}>{item.next?`Next: ${fmtDate(item.next)}`:"—"}</div>
            <div style={{textAlign:"center"}}><StatusPill days={item.days}/></div>
            <div style={{textAlign:"right"}}><button onClick={()=>onMark(item.id)} style={{...S.btnSm,fontSize:12}}>✓ Done</button></div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

function Templates(){
  const [hazard,setHazard]=useState("");const [audience,setAudience]=useState("staff");const [severity,setSeverity]=useState("active");const [context,setContext]=useState("");const [result,setResult]=useState("");const [loading,setLoading]=useState(false);
  async function generate(){if(!hazard)return;setLoading(true);setResult("");
    try{const sys=`Emergency communications specialist for Vitalis Healthcare Services, LLC (8757 Georgia Ave, Silver Spring MD). Contacts: Admin (240) 716-6874, Clinical Manager (240) 423-8757, Dir Clinical (301) 237-2436.`;const usr=`Emergency communication:\nHazard: ${hazard}\nAudience: ${audience==="staff"?"Staff":"Patients/families"}\nStatus: ${severity==="active"?"ACTIVE":severity==="watch"?"WATCH":"RECOVERY"}\nContext: ${context||"None"}\nGenerate EMAIL (with subject) and SMS (<160 chars).`;setResult(await callClaude(sys,usr));}catch(e){setResult("Error: "+e.message);}setLoading(false);}
  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{background:T.tealBg,border:`1px solid ${T.teal}30`,borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:14,color:T.teal,fontWeight:600,marginBottom:2}}>AI-Powered Communication Templates</div><div style={{fontSize:13,color:T.textMid}}>Generate customized emergency communications for any hazard scenario.</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      <div style={S.cardSm}><label style={S.label}>Hazard</label><select value={hazard} onChange={e=>setHazard(e.target.value)} style={S.select}><option value="">Select…</option>{HAZARDS.map(h=><option key={h}>{h}</option>)}</select></div>
      <div style={S.cardSm}><label style={S.label}>Audience</label><select value={audience} onChange={e=>setAudience(e.target.value)} style={S.select}><option value="staff">Staff Only</option><option value="patients">Patients / Families</option><option value="both">Both</option></select></div>
      <div style={S.cardSm}><label style={S.label}>Status</label><select value={severity} onChange={e=>setSeverity(e.target.value)} style={S.select}><option value="watch">Watch / Advance Notice</option><option value="active">Active Emergency</option><option value="recovery">Recovery / All Clear</option></select></div>
    </div>
    <div style={S.card}><label style={S.label}>Context (optional)</label><textarea value={context} onChange={e=>setContext(e.target.value)} style={S.textarea} placeholder="Specific situation details…"/><div style={{marginTop:12}}><button onClick={generate} disabled={!hazard||loading} style={{...S.btnTeal,opacity:(!hazard||loading)?0.6:1}}>{loading?<Spinner/>:"✦"} {loading?"Generating…":"Generate"}</button></div></div>
    {result&&<div style={{...S.card,borderLeft:`4px solid ${T.teal}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><h3 style={S.h3}>Generated Templates</h3><button onClick={()=>navigator.clipboard?.writeText(result)} style={S.btnSm}>Copy All</button></div><pre style={{fontSize:13,lineHeight:1.7,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:0,background:"#F8FAFC",padding:16,borderRadius:8}}>{result}</pre></div>}
  </div>);
}

function Inventory({dates,onMark,onSaveSnapshot}){
  const [quarter,setQuarter]=useState("Q1");const [year,setYear]=useState(new Date().getFullYear().toString());const [counts,setCounts]=useState(()=>Object.fromEntries(SUPPLY_ITEMS.map(i=>[i,""])));const [verifiedBy,setVerifiedBy]=useState("");const [analysis,setAnalysis]=useState("");const [loading,setLoading]=useState(false);const [saved,setSaved]=useState(false);
  async function analyze(){setLoading(true);setAnalysis("");const lines=SUPPLY_ITEMS.map((item,i)=>{const count=parseInt(counts[item])||0;const target=SUPPLY_TARGETS[i];return`${item}: count=${count}, target=${target}, pct=${Math.round((count/target)*100)}%`;}).join("\n");
    try{setAnalysis(await callClaude("Clinical operations analyst for Vitalis Healthcare.",`Analyze ${quarter} ${year} supply inventory. Flag critically low (<50%), needing ordering (50-79%), adequate (≥80%). End with overall readiness.\n\n${lines}`));}catch(e){setAnalysis("Error: "+e.message);}setLoading(false);}
  async function save(){const snap={quarter,year:parseInt(year),verified_by:verifiedBy,counts};await onSaveSnapshot(snap);onMark("med_supply");setSaved(true);setTimeout(()=>setSaved(false),3000);}
  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{background:T.tealBg,border:`1px solid ${T.teal}30`,borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:13,color:T.teal,fontWeight:600}}>✦ Supply counts saved here automatically populate Section IV of the Live Plan Document.</div></div>
    <div style={{display:"grid",gridTemplateColumns:"150px 150px 1fr auto",gap:12,alignItems:"end"}}>
      <div><label style={S.label}>Quarter</label><select value={quarter} onChange={e=>setQuarter(e.target.value)} style={S.select}>{["Q1","Q2","Q3","Q4"].map(q=><option key={q}>{q}</option>)}</select></div>
      <div><label style={S.label}>Year</label><input value={year} onChange={e=>setYear(e.target.value)} style={S.input} type="number"/></div>
      <div><label style={S.label}>Verified By</label><input value={verifiedBy} onChange={e=>setVerifiedBy(e.target.value)} style={S.input} placeholder="Name and role"/></div>
      <div style={{paddingBottom:1}}><button onClick={save} style={{...S.btnPrimary,background:saved?T.green:T.navy}}>{saved?"✓ Saved":"Save & Mark Done"}</button></div>
    </div>
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={S.h2}>Medical Supply Count — {quarter} {year}</h2><button onClick={analyze} disabled={loading} style={{...S.btnTeal,opacity:loading?0.6:1}}>{loading?<Spinner/>:"✦"} AI Analysis</button></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {SUPPLY_ITEMS.map((item,i)=>{const count=parseInt(counts[item])||0;const target=SUPPLY_TARGETS[i];const pct=count>=target?100:Math.round((count/target)*100);const color=!counts[item]?T.borderMd:count===0?T.red:pct<50?T.red:pct<80?T.amber:T.green;return(<div key={item} style={{display:"grid",gridTemplateColumns:"1fr 80px 50px",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:6,background:"#F8FAFC",border:`1px solid ${T.border}`}}><div style={{fontSize:13,color:T.textMid}}>{item}</div><input type="number" min={0} value={counts[item]} onChange={e=>setCounts(c=>({...c,[item]:e.target.value}))} style={{...S.input,textAlign:"center",padding:"5px 8px",fontSize:13}} placeholder="0"/><div style={{fontSize:11,textAlign:"right"}}><span style={{color}}>{counts[item]?`${pct}%`:""}</span><div style={{color:T.slateLight}}>/{target}</div></div></div>);}) }
      </div>
    </div>
    {analysis&&<div style={{...S.card,borderLeft:`4px solid ${T.teal}`}}><h3 style={{...S.h3,marginBottom:8}}>AI Analysis</h3><pre style={{fontSize:13,lineHeight:1.7,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:0}}>{analysis}</pre></div>}
  </div>);
}

function AfterAction(){
  const [form,setForm]=useState({date:"",type:"Tabletop Exercise",hazard:"Snowstorm / Severe Weather",ic:"",declared:"",...Object.fromEntries(Array.from({length:15},(_,i)=>[`q${i+1}`,""])),worked:"",gaps:"",notes:""});
  const [report,setReport]=useState("");const [loading,setLoading]=useState(false);const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const QS=["All staff notified within required timeframes?","Patient care staff knew what to do?","Ancillary staff knew what to do?","Patient priority list retrieved quickly?","Level I patients contacted within 2 hours?","Level II patients contacted within 4 hours?","Staff identified Agency command structure?","Staff knew communication procedures?","Communication with community partners intact?","Backup communication systems effective?","Staff knew what to do if no communications?","Transfer partner contacts readily available?","Go-Box accessible and complete?","Incident Commander clearly managed incident?","All actions documented in Incident Log?"];
  async function generate(){setLoading(true);setReport("");const yes=QS.filter((_,i)=>form[`q${i+1}`]==="yes").length;const no=QS.filter((_,i)=>form[`q${i+1}`]==="no").length;const ql=QS.map((q,i)=>`${i+1}. ${q} → ${form[`q${i+1}`]||"N/A"}`).join("\n");
    try{setReport(await callClaude("Compliance officer writing after-action reports for Vitalis Healthcare. Write regulatory-quality reports for CMS/Joint Commission review.",`After-Action Report for Vitalis Healthcare, LLC:\nDate: ${form.date} · Type: ${form.type} · Hazard: ${form.hazard}\nIC: ${form.ic||"—"}\nChecklist (${yes} YES, ${no} NO):\n${ql}\nWhat worked: ${form.worked||"—"}\nGaps: ${form.gaps||"—"}\nNotes: ${form.notes||"—"}\n\nGenerate: Executive Summary, Performance Assessment, Root Cause Analysis, 3-5 Corrective Actions with owners/timelines. Flag findings requiring regulatory reporting.`));}catch(e){setReport("Error: "+e.message);}setLoading(false);}
  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      {[{label:"Event Date",key:"date",type:"date"},{label:"Event Type",key:"type",type:"select",opts:["Tabletop Exercise","Communication Drill","Full-Scale Exercise","Actual Emergency Event","Supply Check Drill","Priority List Drill"]},{label:"Hazard Scenario",key:"hazard",type:"select",opts:HAZARDS},{label:"Incident Commander",key:"ic",type:"text",ph:"Name and role"},{label:"Emergency Declared By",key:"declared",type:"text",ph:"Name and role"}].map(f=>(
        <div key={f.key} style={S.cardSm}><label style={S.label}>{f.label}</label>{f.type==="select"?<select value={form[f.key]} onChange={e=>update(f.key,e.target.value)} style={S.select}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>:<input type={f.type} value={form[f.key]} onChange={e=>update(f.key,e.target.value)} style={S.input} placeholder={f.ph||""}/>}</div>
      ))}
    </div>
    <div style={S.card}><h3 style={{...S.h3,marginBottom:14}}>Evaluation Checklist</h3>{QS.map((q,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:12,padding:"8px 10px",background:i%2?"#F8FAFC":"transparent",borderRadius:6}}><div style={{fontSize:13,color:T.textMid}}>{i+1}. {q}</div><div style={{display:"flex",gap:6}}>{["yes","no","n/a"].map(v=>(<button key={v} onClick={()=>update(`q${i+1}`,form[`q${i+1}`]===v?"":v)} style={{padding:"4px 12px",fontSize:12,fontWeight:500,borderRadius:5,cursor:"pointer",border:`1px solid ${v==="yes"?T.green:v==="no"?T.red:T.borderMd}`,background:form[`q${i+1}`]===v?(v==="yes"?T.greenBg:v==="no"?T.redBg:T.bg):"transparent",color:form[`q${i+1}`]===v?(v==="yes"?T.green:v==="no"?T.red:T.slate):T.textLight}}>{v.toUpperCase()}</button>))}</div></div>))}</div>
    <div style={S.card}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><label style={S.label}>What Worked</label><textarea value={form.worked} onChange={e=>update("worked",e.target.value)} style={S.textarea} placeholder="What functioned as planned…"/></div><div><label style={S.label}>Gaps / What Failed</label><textarea value={form.gaps} onChange={e=>update("gaps",e.target.value)} style={S.textarea} placeholder="Failures, deviations, gaps…"/></div></div><div style={{marginTop:12}}><label style={S.label}>Additional Notes</label><textarea value={form.notes} onChange={e=>update("notes",e.target.value)} style={{...S.textarea,minHeight:60}} placeholder="Any additional observations…"/></div><div style={{marginTop:16}}><button onClick={generate} disabled={loading} style={{...S.btnTeal,opacity:loading?0.6:1}}>{loading?<Spinner/>:"✦"} Generate AI After-Action Report</button></div></div>
    {report&&<div style={{...S.card,borderLeft:`4px solid ${T.teal}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><h3 style={S.h3}>AI After-Action Report</h3><div style={{display:"flex",gap:8}}><span style={{fontSize:12,color:T.textLight}}>Review before filing</span><button onClick={()=>navigator.clipboard?.writeText(report)} style={S.btnSm}>Copy</button></div></div><pre style={{fontSize:13,lineHeight:1.7,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:0}}>{report}</pre></div>}
  </div>);
}

function CorrectiveActions({actions,onChange}){
  const [adding,setAdding]=useState(false);const [newItem,setNewItem]=useState({finding:"",responsible:"",due:"",note:""});const [aiInput,setAiInput]=useState("");const [aiResult,setAiResult]=useState("");const [aiLoading,setAiLoading]=useState(false);
  function update(id,field,val){onChange(actions.map(a=>a.id===id?{...a,[field]:val}:a));}
  function addAction(){if(!newItem.finding)return;onChange([...actions,{...newItem,id:"u"+Date.now(),status:"open",sort_order:actions.length+1}]);setNewItem({finding:"",responsible:"",due:"",note:""});setAdding(false);}
  async function getGuide(){if(!aiInput)return;setAiLoading(true);setAiResult("");try{setAiResult(await callClaude("Healthcare compliance consultant for Vitalis Healthcare Services, Silver Spring MD. Reference Joint Commission EM and CMS CoP 484.102.",`Guidance for this EP gap:\n\n${aiInput}\n\nProvide: (1) Why it matters, (2) Steps to resolve, (3) Documentation needed, (4) Timeline.`));}catch(e){setAiResult("Error: "+e.message);}setAiLoading(false);}
  const open=actions.filter(a=>a.status==="open");const done=actions.filter(a=>a.status!=="open");
  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h2 style={S.h2}>Corrective Actions</h2><div style={{fontSize:13,color:T.textLight,marginTop:2}}>{open.length} open · {done.length} completed</div></div><button onClick={()=>setAdding(a=>!a)} style={S.btnPrimary}>+ Add Action</button></div>
    {adding&&(<div style={{...S.card,border:`1px solid ${T.teal}`}}><h3 style={{...S.h3,marginBottom:14}}>New Corrective Action</h3><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12,marginBottom:12}}><div><label style={S.label}>Finding</label><input value={newItem.finding} onChange={e=>setNewItem(n=>({...n,finding:e.target.value}))} style={S.input} placeholder="Describe the gap"/></div><div><label style={S.label}>Responsible</label><input value={newItem.responsible} onChange={e=>setNewItem(n=>({...n,responsible:e.target.value}))} style={S.input} placeholder="Name / role"/></div><div><label style={S.label}>Target Date</label><input type="date" value={newItem.due} onChange={e=>setNewItem(n=>({...n,due:e.target.value}))} style={S.input}/></div></div><div style={{marginBottom:12}}><label style={S.label}>Notes</label><textarea value={newItem.note} onChange={e=>setNewItem(n=>({...n,note:e.target.value}))} style={{...S.textarea,minHeight:60}} placeholder="Additional context"/></div><div style={{display:"flex",gap:8}}><button onClick={addAction} style={S.btnPrimary}>Add</button><button onClick={()=>setAdding(false)} style={S.btnSecondary}>Cancel</button></div></div>)}
    <div style={S.card}><h3 style={{...S.h3,marginBottom:10}}>AI Compliance Guidance</h3><div style={{display:"flex",gap:10}}><textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} style={{...S.textarea,minHeight:60,flex:1}} placeholder="Describe a gap and ask Claude for specific guidance…"/><button onClick={getGuide} disabled={!aiInput||aiLoading} style={{...S.btnTeal,alignSelf:"flex-start",opacity:(!aiInput||aiLoading)?0.6:1}}>{aiLoading?<Spinner/>:"✦"} Ask</button></div>{aiResult&&<pre style={{fontSize:13,lineHeight:1.6,color:T.textMid,whiteSpace:"pre-wrap",fontFamily:"IBM Plex Mono,monospace",margin:"12px 0 0",background:"#F8FAFC",padding:14,borderRadius:8}}>{aiResult}</pre>}</div>
    {open.length>0&&<div style={S.card}><h3 style={{...S.h3,marginBottom:14,color:T.red}}>Open ({open.length})</h3><div style={{display:"flex",flexDirection:"column",gap:10}}>{open.map(a=><ActionRow key={a.id} action={a} onUpdate={update}/>)}</div></div>}
    {done.length>0&&<div style={S.card}><h3 style={{...S.h3,marginBottom:14,color:T.green}}>Completed ({done.length})</h3><div style={{display:"flex",flexDirection:"column",gap:10}}>{done.map(a=><ActionRow key={a.id} action={a} onUpdate={update} completed/>)}</div></div>}
  </div>);
}

function ActionRow({action,onUpdate,completed}){
  const [expanded,setExpanded]=useState(false);const days=daysUntil(action.due);
  return(<div style={{border:`1px solid ${completed?T.border:(days!==null&&days<0?"#FECACA":T.border)}`,borderRadius:8,overflow:"hidden",background:completed?"#F8FAFC":T.card}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:10,padding:"10px 12px",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
      <div><div style={{fontSize:14,fontWeight:500,color:completed?T.textLight:T.text,textDecoration:completed?"line-through":"none"}}>{action.finding}</div><div style={{fontSize:12,color:T.textLight,marginTop:2}}>{action.responsible&&<span>{action.responsible}</span>}{action.due&&<span style={{marginLeft:8}}>Due: {fmtDate(action.due)}</span>}</div></div>
      {action.due&&<StatusPill days={days}/>}
      <select value={action.status} onChange={e=>{e.stopPropagation();onUpdate(action.id,"status",e.target.value);}} style={{padding:"4px 8px",fontSize:12,border:`1px solid ${T.borderMd}`,borderRadius:5,cursor:"pointer",color:T.textMid}}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="complete">Complete</option></select>
      <span style={{color:T.slateLight,fontSize:12}}>{expanded?"▲":"▼"}</span>
    </div>
    {expanded&&<div style={{borderTop:`1px solid ${T.border}`,padding:"10px 12px",background:"#F8FAFC"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}><div><label style={S.label}>Responsible</label><input value={action.responsible} onChange={e=>onUpdate(action.id,"responsible",e.target.value)} style={S.input}/></div><div><label style={S.label}>Target Date</label><input type="date" value={action.due||""} onChange={e=>onUpdate(action.id,"due",e.target.value)} style={S.input}/></div></div><label style={S.label}>Notes</label><textarea value={action.note} onChange={e=>onUpdate(action.id,"note",e.target.value)} style={{...S.textarea,minHeight:60}} placeholder="Progress notes…"/></div>}
  </div>);
}
