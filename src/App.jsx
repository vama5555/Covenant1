import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ppaokymwkazzwwdzjmdb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C7P3LpTUQ4A8JGKiF3fThQ_vyRvj3oD";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APPART_CATS = [
  {id:"recel",     label:"Recel",      color:"#C084FC", bg:"rgba(192,132,252,0.12)"},
  {id:"equipement",label:"Équipement", color:"#60A5FA", bg:"rgba(96,165,250,0.12)"},
  {id:"drogue",    label:"Drogue",     color:"#34D399", bg:"rgba(52,211,153,0.12)"},
];
const getCat = id => APPART_CATS.find(c=>c.id===id)||APPART_CATS[0];

const fmt   = n => Math.round(+n||0).toLocaleString("fr-FR")+"$";
const fmtKg = n => Math.round(+n||0)+" Kg";
const pv    = (v,max) => Math.min(100,Math.round((v/Math.max(1,max))*100));
const today = () => new Date().toISOString().slice(0,10);
const ago   = n => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };

const C={bg:"#2a2a2a",surface:"#333",surfaceAlt:"#3d3d3d",border:"#505050",text:"#f0f0f0",muted:"#a0a0a0",green:"#3dbf8f",red:"#e05555",amber:"#d4920a",blue:"#5aaee8"};
const card={background:C.surface,border:"1px solid "+C.border,borderRadius:12,padding:"16px 18px",boxShadow:"0 2px 10px rgba(0,0,0,0.25)"};
const S={card,inp:{width:"100%"},lbl:{fontSize:11,color:C.muted,marginBottom:3,fontWeight:500},sec:{fontSize:10,fontWeight:700,color:C.muted,margin:"0 0 14px",textTransform:"uppercase",letterSpacing:"0.12em"},row:{display:"flex",alignItems:"center",gap:8,marginBottom:8}};
const G=`*{box-sizing:border-box;}select,input{background:#3a3a3a!important;border:1px solid #585858!important;border-radius:8px!important;padding:7px 11px!important;font-size:13px!important;color:#f0f0f0!important;outline:none!important;box-shadow:inset 0 1px 4px rgba(0,0,0,0.25)!important;font-family:inherit;transition:border-color .15s;}select{-webkit-appearance:auto!important;appearance:auto!important;cursor:pointer;}select:focus,input:focus{border-color:#888!important;}select option{background:#3a3a3a!important;color:#f0f0f0!important;}input::placeholder{color:#686868!important;}button{background:#3a3a3a;border:1px solid #585858;border-radius:8px;padding:5px 12px;font-size:13px;color:#f0f0f0;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.25);transition:background .12s,transform .08s;white-space:nowrap;flex-shrink:0;}button:hover{background:#484848;}button:active{transform:scale(0.97);}div,span,p,h1,h2,h3,label{color:inherit;}`;

function Bar({val,max,color}){const p=pv(val,max),c=color||(p>85?C.red:p>60?C.amber:C.green);return <div style={{background:C.surfaceAlt,borderRadius:6,height:6,overflow:"hidden",border:"1px solid "+C.border}}><div style={{width:p+"%",background:c,height:"100%",borderRadius:6,transition:"width .4s"}}/></div>;}
function RoleBadge({role}){const a=role==="admin";return <span style={{fontSize:11,padding:"2px 9px",borderRadius:5,fontWeight:600,background:a?"rgba(224,85,85,0.15)":"rgba(74,158,222,0.15)",color:a?C.red:C.blue,border:"1px solid "+(a?"rgba(224,85,85,0.3)":"rgba(74,158,222,0.3)")}}>{a?"Admin":"Membre"}</span>;}
function Loader(){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",color:C.muted,fontSize:14}}>Chargement...</div>;}

function Login({onLogin}){
  const [code,setCode]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  async function go(){
    setLoading(true); setErr("");
    const {data}=await sb.from("users").select("*").eq("code",code.trim()).single();
    if(data) onLogin(data); else setErr("Code incorrect");
    setLoading(false);
  }
  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
    <style>{G}</style>
    <div style={{marginBottom:32,textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>Accès sécurisé</div><h1 style={{fontSize:28,fontWeight:700,color:C.text,margin:0}}>Compta Covenant</h1></div>
    <div style={{...card,width:"100%",maxWidth:360,padding:"24px"}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Code d'accès</div>
      <input type="password" placeholder="• • • • • •" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={{width:"100%",marginBottom:err?8:14,fontSize:20,letterSpacing:"0.35em",textAlign:"center"}}/>
      {err&&<div style={{fontSize:12,color:C.red,marginBottom:12,fontWeight:500,textAlign:"center"}}>{err}</div>}
      <button onClick={go} disabled={loading} style={{width:"100%",padding:"11px",fontWeight:700,fontSize:14,background:"#585858",color:C.text,border:"1px solid #686868",borderRadius:8}}>{loading?"...":"Connexion"}</button>
    </div>
  </div>;
}

export default function App(){
  const [cu,setCu]=useState(null);
  if(!cu) return <Login onLogin={setCu}/>;
  return <Main cu={cu} onLogout={()=>setCu(null)}/>;
}

function Main({cu,onLogout}){
  const isAdmin=cu.role==="admin";
  const [tab,setTab]=useState("dashboard");
  const [loading,setLoading]=useState(true);

  const [apparts,setApparts]=useState([]);
  const [catsPM,setCatsPM]=useState([]);
  const [catsGang,setCatsGang]=useState([]);
  const [pms,setPMs]=useState([]);
  const [gangs,setGangs]=useState([]);
  const [itemsPM,setItemsPM]=useState([]);
  const [itemsG,setItemsG]=useState([]);
  const [members,setMembers]=useState([]);
  const [history,setHistory]=useState([]);
  const [users,setUsers]=useState([]);

  const loadAll=useCallback(async()=>{
    setLoading(true);
    const [a,cpm,cg,p,g,ipm,ig,bm,h,u]=await Promise.all([
      sb.from("apparts").select("*").order("nom"),
      sb.from("categories_pm").select("*").order("pct_objets"),
      sb.from("categories_gang").select("*").order("pct_objets"),
      sb.from("pms").select("*").order("nom"),
      sb.from("gangs").select("*").order("nom"),
      sb.from("items_pm").select("*").order("nom"),
      sb.from("items_gang").select("*").order("nom"),
      sb.from("membres_comptes").select("*").order("nom"),
      sb.from("transactions").select("*").order("created_at",{ascending:false}),
      sb.from("users").select("*").order("nom"),
    ]);
    setApparts(a.data||[]);
    setCatsPM(cpm.data||[]);
    setCatsGang(cg.data||[]);
    setPMs(p.data||[]);
    setGangs(g.data||[]);
    setItemsPM(ipm.data||[]);
    setItemsG(ig.data||[]);
    setMembers(bm.data||[]);
    setHistory(h.data||[]);
    setUsers(u.data||[]);
    setLoading(false);
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  const [dFrom,setDFrom]=useState(ago(7)); const [dTo,setDTo]=useState(today());
  const [hFrom,setHFrom]=useState(ago(7)); const [hTo,setHTo]=useState(today());
  const [expanded,setExpanded]=useState({});
  const [copied,setCopied]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);

  // ── TX ──────────────────────────────────────────────────
  const E0={dest:"pm",pmId:"",gangId:"",membreId:"",qtes:{},liasseQte:"",argentSale:"",date:today(),note:""};
  const [tx,setTx]=useState(E0);

  const selPM    = pms.find(p=>p.id===tx.pmId)||null;
  const selGang  = gangs.find(g=>g.id===tx.gangId)||null;
  const selCatPM = selPM  ? catsPM.find(c=>c.id===selPM.categorie_id)||null  : null;
  const selCatG  = selGang? catsGang.find(c=>c.id===selGang.categorie_id)||null: null;
  const aPct     = tx.dest==="pm"?(selCatPM?selCatPM.pct_objets:0):(selCatG?selCatG.pct_objets:0);
  const aLiasse  = tx.dest==="pm"?(selCatPM?selCatPM.taux_liasse:0):(selCatG?selCatG.taux_liasse:0);
  const aItems   = tx.dest==="gang"?[...itemsPM,...itemsG]:itemsPM;

  const totObj=useMemo(()=>{
    if(!aPct)return 0;
    return aItems.reduce((s,it)=>s+it.prix*(+(tx.qtes[it.id])||0)*(aPct/100),0);
  },[tx.qtes,aPct,aItems]);
  const totLia  = aLiasse*(+(tx.liasseQte)||0);
  const totArg  = tx.dest==="pm"?Math.round((+(tx.argentSale)||0)*0.4):0;
  const txTotal = Math.round(totObj)+totLia+totArg;

  async function submit(){
    if(tx.dest==="pm"&&(!tx.pmId||!tx.membreId))return;
    if(tx.dest==="gang"&&!tx.gangId)return;
    if(!totObj&&!totLia&&!totArg)return;
    const types=[]; const det={};
    if(totObj>0){types.push("objets");det.lignes=aItems.filter(it=>+(tx.qtes[it.id]||0)>0).map(it=>({nom:it.nom,prix:it.prix,qte:+(tx.qtes[it.id]),sous_total:it.prix*(+(tx.qtes[it.id]))*(aPct/100)}));}
    if(totLia>0){types.push("liasses");det.liasse_qte=+(tx.liasseQte);det.taux_liasse=aLiasse;det.valeur_face=70*(+(tx.liasseQte));}
    if(totArg>0&&tx.dest==="pm"){types.push("argent");det.argent_sale=+(tx.argentSale);}
    const mb=members.find(m=>m.id===tx.membreId)||null;
    const payload={
      dest:tx.dest, types, date:tx.date, note:tx.note, total:txTotal,
      pm_nom:tx.dest==="pm"&&selPM?selPM.nom:null,
      pm_cat:tx.dest==="pm"&&selCatPM?selCatPM.nom:null,
      pm_pct:tx.dest==="pm"?aPct:null,
      gang_nom:tx.dest==="gang"&&selGang?selGang.nom:null,
      gang_cat:tx.dest==="gang"&&selCatG?selCatG.nom:null,
      gang_pct:tx.dest==="gang"?aPct:null,
      membre:mb?mb.nom:"",
      ...det
    };
    await sb.from("transactions").insert(payload);
    if(mb) await sb.from("membres_comptes").update({solde:mb.solde-txTotal}).eq("id",mb.id);
    await loadAll();
    setTx(E0);
  }

  async function deleteTx(id){
    const h=history.find(x=>x.id===id);
    if(!h)return;
    if(h.dest==="pm"&&h.membre){
      const mb=members.find(m=>m.nom===h.membre);
      if(mb) await sb.from("membres_comptes").update({solde:mb.solde+h.total}).eq("id",mb.id);
    }
    await sb.from("transactions").delete().eq("id",id);
    await loadAll();
    setConfirmDel(null);
  }

  // ── HISTORIQUE ──────────────────────────────────────────
  const [hFil,setHFil]=useState({who:""});
  const whoOpts=useMemo(()=>{const seen=new Set();return history.reduce((acc,h)=>{const n=h.dest==="pm"?(h.pm_nom||""):(h.gang_nom||"");const k=h.dest+":"+n;if(!seen.has(k)&&n){seen.add(k);acc.push({key:k,label:(h.dest==="pm"?"PM — ":"Gang — ")+n});}return acc;},[]);},[history]);
  const filtH=useMemo(()=>history.filter(h=>{
    if(hFil.who){const n=h.dest==="pm"?(h.pm_nom||""):(h.gang_nom||"");if((h.dest+":"+n)!==hFil.who)return false;}
    return h.date>=hFrom&&h.date<=hTo;
  }),[history,hFil,hFrom,hTo]);

  // ── APPARTS ─────────────────────────────────────────────
  const [apCatF,setApCatF]=useState("");
  const [apSort,setApSort]=useState({key:"",dir:-1});
  const sortedAp=useMemo(()=>{
    let a=apCatF?apparts.filter(x=>x.categorie===apCatF):[...apparts];
    if(apSort.key)a.sort((a,b)=>(a[apSort.key]-b[apSort.key])*apSort.dir);
    return a;
  },[apparts,apCatF,apSort]);

  async function updateAppart(id,fields){
    await sb.from("apparts").update(fields).eq("id",id);
    setApparts(p=>p.map(a=>a.id===id?{...a,...fields}:a));
  }

  // ── DASHBOARD ───────────────────────────────────────────
  const dashH=useMemo(()=>history.filter(h=>h.date>=dFrom&&h.date<=dTo),[history,dFrom,dTo]);
  const totPaye=dashH.reduce((a,x)=>a+x.total,0);
  const totCoffres=apparts.reduce((a,x)=>a+x.coffre,0);
  const totMem=members.reduce((a,x)=>a+x.solde,0);
  const totSU=apparts.reduce((a,x)=>a+x.stock,0);
  const totSM=apparts.reduce((a,x)=>a+x.max_stock,0);
  const rep=useMemo(()=>{
    let o=0,l=0,ar=0;
    dashH.forEach(h=>{
      if(h.types?.includes("objets")&&h.lignes)o+=h.lignes.reduce((s,x)=>s+(x.sous_total||0),0);
      if(h.types?.includes("liasses"))l+=(h.taux_liasse||0)*(h.liasse_qte||0);
      if(h.types?.includes("argent"))ar+=Math.round((h.argent_sale||0)*0.4);
    });
    const t=o+l+ar||1;
    return [{label:"Objets",val:o,p:Math.round(o/t*100),color:C.blue},{label:"Liasses",val:l,p:Math.round(l/t*100),color:C.green},{label:"Argent sale",val:ar,p:Math.round(ar/t*100),color:C.amber}];
  },[dashH]);

  // ── SETTINGS STATE ───────────────────────────────────────
  const [nCPM,setNCPM]=useState({nom:"",pct_objets:"",taux_liasse:""}); const [eCPM,setECPM]=useState(null);
  const [nCG,setNCG]=useState({nom:"",pct_objets:"",taux_liasse:""});   const [eCG,setECG]=useState(null);
  const [nPM,setNPM]=useState({nom:"",categorie_id:""});   const [ePM,setEPM]=useState(null);
  const [nGa,setNGa]=useState({nom:"",categorie_id:""});   const [eGa,setEGa]=useState(null);
  const [nIPM,setNIPM]=useState({nom:"",prix:""});  const [eIPM,setEIPM]=useState(null);
  const [nIG,setNIG]=useState({nom:"",prix:""});    const [eIG,setEIG]=useState(null);
  const [nBM,setNBM]=useState({nom:"",solde:""});
  const [nU,setNU]=useState({nom:"",code:"",role:"membre"});
  const [eCapId,setECapId]=useState(null); const [eCapV,setECapV]=useState({});

  const TABS=[{id:"dashboard",label:"Tableau de bord"},{id:"transactions",label:"Transactions"},{id:"historique",label:"Historique"},{id:"apparts",label:"Apparts"},{id:"settings",label:"Paramètres"}];
  const ns=id=>({padding:"10px 15px",fontSize:13,fontWeight:tab===id?600:400,color:tab===id?C.text:C.muted,borderBottom:tab===id?"2px solid "+C.text:"2px solid transparent",background:"none",border:"none",cursor:"pointer",borderRadius:0,whiteSpace:"nowrap",boxShadow:"none"});

  function CatTable({cats,setCats,table,eId,setEId,nc,setNc}){
    async function save(c){await sb.from(table).update({nom:c.nom,pct_objets:c.pct_objets,taux_liasse:c.taux_liasse}).eq("id",c.id);setCats(cs=>cs.map(x=>x.id===c.id?c:x));setEId(null);}
    async function add(){if(!nc.nom)return;const{data}=await sb.from(table).insert({nom:nc.nom,pct_objets:+nc.pct_objets,taux_liasse:+nc.taux_liasse}).select().single();if(data)setCats(p=>[...p,data]);setNc({nom:"",pct_objets:"",taux_liasse:""});}
    async function del(id){await sb.from(table).delete().eq("id",id);setCats(cs=>cs.filter(x=>x.id!==id));}
    return <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,marginBottom:8}}><span style={S.lbl}>Nom</span><span style={S.lbl}>% objets</span><span style={S.lbl}>$/liasse</span><span/></div>
      {cats.map(c=>(
        <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,alignItems:"center",marginBottom:8}}>
          {isAdmin&&eId===c.id
            ?<><input style={S.inp} value={c.nom} onChange={e=>setCats(cs=>cs.map(x=>x.id===c.id?{...x,nom:e.target.value}:x))}/><input type="number" style={S.inp} value={c.pct_objets} onChange={e=>setCats(cs=>cs.map(x=>x.id===c.id?{...x,pct_objets:+e.target.value}:x))}/><input type="number" style={S.inp} value={c.taux_liasse} onChange={e=>setCats(cs=>cs.map(x=>x.id===c.id?{...x,taux_liasse:+e.target.value}:x))}/><button onClick={()=>save(c)} style={{color:C.green,fontWeight:700}}>OK</button></>
            :<><span style={{fontSize:14,color:C.text}}>{c.nom}</span><span style={{fontSize:13,color:C.muted}}>{c.pct_objets}%</span><span style={{fontSize:13,color:C.muted}}>{c.taux_liasse}$</span>{isAdmin&&<div style={{display:"flex",gap:4}}><button onClick={()=>setEId(c.id)}>Mod.</button><button onClick={()=>del(c.id)} style={{color:C.red}}>×</button></div>}</>
          }
        </div>
      ))}
      {isAdmin&&<div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
        <input style={S.inp} placeholder="Nom" value={nc.nom} onChange={e=>setNc(f=>({...f,nom:e.target.value}))}/>
        <input type="number" style={S.inp} placeholder="%" value={nc.pct_objets} onChange={e=>setNc(f=>({...f,pct_objets:e.target.value}))}/>
        <input type="number" style={S.inp} placeholder="$/liasse" value={nc.taux_liasse} onChange={e=>setNc(f=>({...f,taux_liasse:e.target.value}))}/>
        <button onClick={add} style={{fontWeight:700}}>+</button>
      </div>}
    </>;
  }

  function PList({list,setList,cats,table,eId,setEId,ni,setNi}){
    async function save(p){await sb.from(table).update({nom:p.nom,categorie_id:p.categorie_id}).eq("id",p.id);setList(ps=>ps.map(x=>x.id===p.id?p:x));setEId(null);}
    async function add(){if(!ni.nom||!ni.categorie_id)return;const{data}=await sb.from(table).insert({nom:ni.nom,categorie_id:ni.categorie_id}).select().single();if(data)setList(p=>[...p,data]);setNi({nom:"",categorie_id:""});}
    async function del(id){await sb.from(table).delete().eq("id",id);setList(ps=>ps.filter(x=>x.id!==id));}
    return <>
      {list.map(p=>(
        <div key={p.id} style={S.row}>
          {eId===p.id
            ?<><input style={{flex:1}} value={p.nom} onChange={e=>setList(ps=>ps.map(x=>x.id===p.id?{...x,nom:e.target.value}:x))}/><select value={p.categorie_id} onChange={e=>setList(ps=>ps.map(x=>x.id===p.id?{...x,categorie_id:e.target.value}:x))}>{cats.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select><button onClick={()=>save(p)} style={{color:C.green,fontWeight:700}}>OK</button></>
            :<><span style={{flex:1,fontSize:14,color:C.text}}>{p.nom}</span><span style={{fontSize:12,color:C.muted}}>{cats.find(c=>c.id===p.categorie_id)?.nom||"?"}</span><button onClick={()=>setEId(p.id)}>Mod.</button><button onClick={()=>del(p.id)} style={{color:C.red}}>×</button></>
          }
        </div>
      ))}
      <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
        <div style={{flex:1}}><div style={S.lbl}>Nom</div><input style={S.inp} placeholder="Nom" value={ni.nom} onChange={e=>setNi(f=>({...f,nom:e.target.value}))}/></div>
        <div><div style={S.lbl}>Catégorie</div><select value={ni.categorie_id||""} onChange={e=>setNi(f=>({...f,categorie_id:e.target.value}))}><option value="">—</option>{cats.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <button onClick={add} style={{fontWeight:700}}>+</button>
      </div>
    </>;
  }

  function IList({items,setItems,table,eId,setEId,ni,setNi,canEdit}){
    async function save(it){await sb.from(table).update({nom:it.nom,prix:it.prix}).eq("id",it.id);setItems(is=>is.map(x=>x.id===it.id?it:x));setEId(null);}
    async function add(){if(!ni.nom||!ni.prix)return;const{data}=await sb.from(table).insert({nom:ni.nom,prix:+ni.prix}).select().single();if(data)setItems(p=>[...p,data]);setNi({nom:"",prix:""});}
    async function del(id){await sb.from(table).delete().eq("id",id);setItems(is=>is.filter(x=>x.id!==id));}
    return <>
      {items.map(it=>(
        <div key={it.id} style={S.row}>
          {canEdit&&eId===it.id
            ?<><input style={{flex:1}} value={it.nom} onChange={e=>setItems(is=>is.map(x=>x.id===it.id?{...x,nom:e.target.value}:x))}/><input type="number" style={{width:80}} value={it.prix} onChange={e=>setItems(is=>is.map(x=>x.id===it.id?{...x,prix:+e.target.value}:x))}/><button onClick={()=>save(it)} style={{color:C.green,fontWeight:700}}>OK</button></>
            :<><span style={{flex:1,fontSize:14,color:C.text}}>{it.nom}</span><span style={{fontSize:13,color:C.muted,minWidth:60,textAlign:"right"}}>{fmt(it.prix)}</span>{canEdit&&<div style={{display:"flex",gap:4}}><button onClick={()=>setEId(it.id)}>Mod.</button><button onClick={()=>del(it.id)} style={{color:C.red}}>×</button></div>}</>
          }
        </div>
      ))}
      {canEdit&&<div style={{display:"flex",gap:8,alignItems:"center",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
        <input style={{flex:1}} placeholder="Nom" value={ni.nom} onChange={e=>setNi(f=>({...f,nom:e.target.value}))}/>
        <input type="number" style={{width:80}} placeholder="Prix $" value={ni.prix} onChange={e=>setNi(f=>({...f,prix:e.target.value}))}/>
        <button onClick={add} style={{fontWeight:700}}>+</button>
      </div>}
    </>;
  }

  if(loading) return <div style={{background:C.bg,minHeight:"100vh"}}><style>{G}</style><Loader/></div>;

  return (
    <div style={{padding:"1.25rem",maxWidth:740,margin:"0 auto",minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{G}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
        <h2 style={{fontSize:19,fontWeight:700,margin:0}}>Compta Covenant</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}><RoleBadge role={cu.role}/><span style={{fontSize:13,color:C.muted}}>{cu.nom}</span><button onClick={onLogout} style={{fontSize:12,color:C.red,padding:"4px 10px"}}>Déconnexion</button></div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid "+C.border,marginBottom:"1.5rem",overflowX:"auto",gap:2}}>
        {TABS.map(t=><button key={t.id} style={ns(t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* DASHBOARD */}
      {tab==="dashboard"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:16}}>
            {[{l:"Total coffres",v:fmt(totCoffres)},{l:"Total comptes",v:fmt(totMem)},{l:"Stock apparts",v:fmtKg(totSU)+" / "+fmtKg(totSM),s:pv(totSU,totSM)+"% occupé"}].map(c=>(
              <div key={c.l} style={card}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{c.l}</div><div style={{fontSize:20,fontWeight:700}}>{c.v}</div>{c.s&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{c.s}</div>}</div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0 14px"}}>
            <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>Sur la période</span>
            <div style={{flex:1,height:"1px",background:C.border}}/>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:12,color:C.muted}}>Du</span><input type="date" value={dFrom} onChange={e=>setDFrom(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/><span style={{fontSize:12,color:C.muted}}>au</span><input type="date" value={dTo} onChange={e=>setDTo(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={card}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Payé aux PM</div><div style={{fontSize:26,fontWeight:700,color:C.red}}>{fmt(totPaye)}</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>{dashH.length} transaction{dashH.length!==1?"s":""}</div></div>
            <div style={card}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Répartition</div>{rep.map(r=><div key={r.label} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.muted}}>{r.label}</span><span style={{fontWeight:600,color:r.val>0?C.text:C.muted}}>{r.val>0?fmt(Math.round(r.val))+" · "+r.p+"%":"—"}</span></div><Bar val={r.val} max={Math.max(1,...rep.map(x=>x.val))} color={r.color}/></div>)}</div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"18px 0 10px"}}>Comptes membres</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
            {members.map(m=>(
              <div key={m.id} style={{...card,padding:"12px 14px"}}>
                <div style={{fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>{m.nom}</div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input type="number" value={m.solde} onChange={e=>{const s=+e.target.value;setMembers(ms=>ms.map(x=>x.id===m.id?{...x,solde:s}:x));sb.from("membres_comptes").update({solde:s}).eq("id",m.id);}} style={{flex:1,fontSize:18,fontWeight:700,border:"none!important",background:"transparent!important",color:C.text,padding:"0!important",minWidth:0,boxShadow:"none!important"}}/>
                  <span style={{fontSize:13,color:C.muted,fontWeight:600}}>$</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      {tab==="transactions"&&(
        <div style={card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Nouvelle transaction</div>
          <div style={{display:"flex",gap:4,background:C.surfaceAlt,borderRadius:10,padding:4,border:"1px solid "+C.border,marginBottom:14}}>
            {[["pm","Petite main"],["gang","Gang"]].map(([v,l])=>(
              <button key={v} onClick={()=>setTx(f=>({...f,dest:v,pmId:"",gangId:"",membreId:"",qtes:{},argentSale:""}))} style={{flex:1,padding:"7px 12px",fontSize:13,fontWeight:tx.dest===v?600:400,background:tx.dest===v?C.surface:"transparent",color:tx.dest===v?C.text:C.muted,border:tx.dest===v?"1px solid "+C.border:"none",borderRadius:7,boxShadow:tx.dest===v?"0 1px 4px rgba(0,0,0,0.25)":"none"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {tx.dest==="pm"
              ?<div><div style={S.lbl}>PM</div><select style={S.inp} value={tx.pmId} onChange={e=>setTx(f=>({...f,pmId:e.target.value}))}><option value="">— choisir —</option>{pms.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}</select></div>
              :<div><div style={S.lbl}>Gang</div><select style={S.inp} value={tx.gangId} onChange={e=>setTx(f=>({...f,gangId:e.target.value}))}><option value="">— choisir —</option>{gangs.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select></div>
            }
            {tx.dest==="pm"&&<div><div style={S.lbl}>Payé par</div><select style={S.inp} value={tx.membreId} onChange={e=>setTx(f=>({...f,membreId:e.target.value}))}><option value="">— membre —</option>{members.map(m=><option key={m.id} value={m.id}>{m.nom} ({fmt(m.solde)})</option>)}</select></div>}
            <div><div style={S.lbl}>Date</div><input type="date" style={S.inp} value={tx.date} onChange={e=>setTx(f=>({...f,date:e.target.value}))}/></div>
            <div><div style={S.lbl}>Note</div><input type="text" style={S.inp} placeholder="Optionnel" value={tx.note} onChange={e=>setTx(f=>({...f,note:e.target.value}))}/></div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{"Objets"+(aPct>0?" · "+aPct+"%":"")}</div>
            {aItems.map(it=>{const isGO=itemsG.some(x=>x.id===it.id);return(
              <div key={it.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,paddingBottom:6,borderBottom:"1px solid "+C.border}}>
                <span style={{flex:1,fontSize:13}}>{it.nom}{isGO&&<span style={{fontSize:10,marginLeft:5,padding:"1px 6px",borderRadius:4,background:"rgba(212,132,10,0.12)",color:C.amber,border:"1px solid rgba(212,132,10,0.3)",fontWeight:700}}>gang</span>}<span style={{fontSize:11,color:C.muted,marginLeft:4}}>({fmt(it.prix)})</span></span>
                <input type="number" min="0" placeholder="0" style={{width:72,textAlign:"center"}} value={tx.qtes[it.id]||""} onChange={e=>setTx(f=>({...f,qtes:{...f.qtes,[it.id]:e.target.value}}))}/>
              </div>
            );})}
          </div>
          <div style={{borderTop:"1px solid "+C.border,paddingTop:12,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{"Liasses"+(aLiasse>0?" · "+aLiasse+"$ / liasse":"")}</div>
            <input type="number" min="0" placeholder="0 liasses" style={{width:140}} value={tx.liasseQte} onChange={e=>setTx(f=>({...f,liasseQte:e.target.value}))}/>
          </div>
          {tx.dest==="pm"&&(
            <div style={{borderTop:"1px solid "+C.border,paddingTop:12,marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Argent sale · 40%</div>
              <input type="number" min="0" placeholder="0$" style={{width:160}} value={tx.argentSale} onChange={e=>setTx(f=>({...f,argentSale:e.target.value}))}/>
            </div>
          )}
          <div style={{borderTop:"1px solid "+C.border,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Total à payer</div><div style={{fontSize:28,fontWeight:700,color:C.red}}>{fmt(txTotal)}</div></div>
            <button onClick={submit} style={{padding:"11px 30px",fontWeight:700,fontSize:14,background:C.text,color:C.bg,border:"none",borderRadius:9}}>Enregistrer</button>
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      {tab==="historique"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <select value={hFil.who} onChange={e=>setHFil(f=>({...f,who:e.target.value}))}>
              <option value="">Toutes les PM / gangs</option>
              {whoOpts.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:C.muted}}>Du</span><input type="date" value={hFrom} onChange={e=>setHFrom(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/><span style={{fontSize:12,color:C.muted}}>au</span><input type="date" value={hTo} onChange={e=>setHTo(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{filtH.length} transaction{filtH.length!==1?"s":""}</div>
          {filtH.length===0&&<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"3rem",opacity:.5}}>Aucune transaction</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtH.map(h=>{
              const exp=!!expanded[h.id];
              const who=h.dest==="pm"?(h.pm_nom||"?")+" ("+(h.pm_cat||"?")+")": (h.gang_nom||"?")+" ("+(h.gang_cat||"?")+")";
              const tl=(h.types||[]).map(t=>t==="objets"?"Objets·"+(h.dest==="pm"?h.pm_pct:h.gang_pct)+"%":t==="liasses"?"Liasses·"+h.taux_liasse+"$":t==="argent"?"Argent·40%":"").filter(Boolean).join(" + ");
              return(
                <div key={h.id} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div><span style={{fontWeight:700,fontSize:14}}>{who}</span>{h.membre&&<span style={{fontSize:12,color:C.muted,marginLeft:8}}>· payé par {h.membre}</span>}<div style={{fontSize:11,color:C.muted,marginTop:2}}>{tl}</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,color:C.red}}>{fmt(h.total)}</div><div style={{fontSize:11,color:C.muted}}>{h.date}</div></div>
                      <button onClick={()=>setExpanded(e=>({...e,[h.id]:!e[h.id]}))} style={{fontSize:11,padding:"4px 10px",color:C.muted}}>{exp?"Masquer":"Détail"}</button>
                      {confirmDel===h.id?(
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <span style={{fontSize:11,color:C.amber}}>Confirmer ?</span>
                          <button onClick={()=>deleteTx(h.id)} style={{fontSize:11,padding:"3px 8px",color:C.red,fontWeight:700,border:"1px solid "+C.red}}>Oui</button>
                          <button onClick={()=>setConfirmDel(null)} style={{fontSize:11,padding:"3px 8px"}}>Non</button>
                        </div>
                      ):(
                        <button onClick={()=>setConfirmDel(h.id)} style={{fontSize:11,padding:"4px 8px",color:C.red,background:"transparent",border:"1px solid transparent"}}>🗑</button>
                      )}
                    </div>
                  </div>
                  {exp&&(
                    <div style={{borderTop:"1px solid "+C.border,paddingTop:8,marginTop:8,fontSize:12,color:C.muted}}>
                      {h.types?.includes("objets")&&(h.lignes||[]).map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span>{l.nom} × {l.qte} ({fmt(l.prix)}/u)</span><span style={{color:C.green,fontWeight:600}}>{fmt(Math.round(l.sous_total))}</span></div>)}
                      {h.types?.includes("liasses")&&<div style={{marginBottom:3}}>{h.liasse_qte} liasse{h.liasse_qte>1?"s":""} · face {fmt(h.valeur_face)} → <span style={{color:C.green,fontWeight:600}}>{fmt(h.taux_liasse*h.liasse_qte)}</span></div>}
                      {h.types?.includes("argent")&&<div style={{marginBottom:3}}>Argent sale : {fmt(h.argent_sale)} → <span style={{color:C.green,fontWeight:600}}>{fmt(Math.round(h.argent_sale*0.4))}</span></div>}
                      {h.note&&<div style={{marginTop:6,fontStyle:"italic"}}>{h.note}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* APPARTS */}
      {tab==="apparts"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setApCatF("")} style={{fontSize:11,padding:"3px 10px",fontWeight:apCatF===""?700:400,background:apCatF===""?C.surfaceAlt:"transparent",border:"1px solid "+(apCatF===""?C.border:"transparent")}}>Tous</button>
              {APPART_CATS.map(c=><button key={c.id} onClick={()=>setApCatF(apCatF===c.id?"":c.id)} style={{fontSize:11,padding:"3px 10px",fontWeight:apCatF===c.id?700:400,background:apCatF===c.id?c.bg:"transparent",color:apCatF===c.id?c.color:C.muted,border:"1px solid "+(apCatF===c.id?c.color:"transparent"),borderRadius:6}}>{c.label}</button>)}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.muted}}>Trier :</span>
              {["coffre","stock"].map(k=>{const a=apSort.key===k;const ar=a?(apSort.dir===1?"↑":"↓"):"↕";return <button key={k} onClick={()=>setApSort(s=>s.key===k?{key:k,dir:s.dir*-1}:{key:k,dir:-1})} style={{fontSize:11,padding:"3px 8px",color:a?C.text:C.muted,background:a?C.surfaceAlt:"transparent",border:"1px solid "+(a?C.border:"transparent"),borderRadius:6}}>{k.charAt(0).toUpperCase()+k.slice(1)} {ar}</button>;})}
              {isAdmin&&<button onClick={async()=>{const{data}=await sb.from("apparts").insert({nom:"Nouvel appart",coffre:0,stock:0,max_coffre:10000,max_stock:100,categorie:"recel",code:""}).select().single();if(data)setApparts(p=>[...p,data]);}} style={{fontWeight:700,marginLeft:4}}>+ Ajouter</button>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {sortedAp.map(a=>{
              const ac=getCat(a.categorie);
              return(
                <div key={a.id} style={{...card,borderLeft:"3px solid "+ac.color,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <input value={a.nom} onChange={e=>updateAppart(a.id,{nom:e.target.value})}
                      style={{width:"38%",fontWeight:700,fontSize:13,border:"none!important",background:"transparent!important",color:C.text,padding:"0!important",boxShadow:"none!important",outline:"none",flexShrink:0}}/>
                    {a.code?(
                      <button onClick={()=>{navigator.clipboard?.writeText(a.code);setCopied(a.id);setTimeout(()=>setCopied(null),1500);}}
                        style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"3px 10px",background:C.surfaceAlt,border:"1px solid "+(copied===a.id?C.green:C.border),borderRadius:6,color:copied===a.id?C.green:C.muted,transition:"all .2s",minWidth:0}}>
                        <span style={{fontFamily:"monospace",fontSize:12,color:copied===a.id?C.green:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.code}</span>
                        <span style={{fontSize:11,flexShrink:0}}>{copied===a.id?"✓":"⧉"}</span>
                      </button>
                    ):(
                      <div style={{flex:1,padding:"3px 10px",background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:6,fontSize:11,color:C.muted,fontStyle:"italic"}}>pas de code</div>
                    )}
                  </div>
                  {isAdmin
                    ?<div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>{APPART_CATS.map(c=><button key={c.id} onClick={()=>updateAppart(a.id,{categorie:c.id})} style={{fontSize:10,padding:"2px 8px",fontWeight:a.categorie===c.id?700:400,background:a.categorie===c.id?c.bg:"transparent",color:a.categorie===c.id?c.color:C.muted,border:"1px solid "+(a.categorie===c.id?c.color+"66":"transparent"),borderRadius:20}}>{c.label}</button>)}</div>
                    :<div style={{marginBottom:8}}><span style={{fontSize:10,padding:"2px 8px",fontWeight:700,background:ac.bg,color:ac.color,border:"1px solid "+ac.color+"66",borderRadius:20}}>{ac.label}</span></div>
                  }
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Coffre</div><input type="number" value={a.coffre} onChange={e=>updateAppart(a.id,{coffre:+e.target.value})} style={{width:"100%",fontSize:13,marginBottom:5,padding:"5px 8px"}}/><Bar val={a.coffre} max={a.max_coffre}/></div>
                    <div><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Stock</div><input type="number" value={a.stock} onChange={e=>updateAppart(a.id,{stock:+e.target.value})} style={{width:"100%",fontSize:13,marginBottom:5,padding:"5px 8px"}}/><Bar val={a.stock} max={a.max_stock}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PARAMÈTRES */}
      {tab==="settings"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={card}><div style={S.sec}>Catégories PM</div><CatTable cats={catsPM} setCats={setCatsPM} table="categories_pm" eId={eCPM} setEId={setECPM} nc={nCPM} setNc={setNCPM}/></div>
          <div style={card}><div style={S.sec}>Petites mains</div><PList list={pms} setList={setPMs} cats={catsPM} table="pms" eId={ePM} setEId={setEPM} ni={nPM} setNi={setNPM}/></div>
          <div style={card}><div style={S.sec}>Catégories gangs</div><CatTable cats={catsGang} setCats={setCatsGang} table="categories_gang" eId={eCG} setEId={setECG} nc={nCG} setNc={setNCG}/></div>
          <div style={card}><div style={S.sec}>Gangs</div><PList list={gangs} setList={setGangs} cats={catsGang} table="gangs" eId={eGa} setEId={setEGa} ni={nGa} setNi={setNGa}/></div>
          <div style={card}><div style={S.sec}>Items PM{!isAdmin&&" · lecture seule"}</div><IList items={itemsPM} setItems={setItemsPM} table="items_pm" eId={eIPM} setEId={setEIPM} ni={nIPM} setNi={setNIPM} canEdit={isAdmin}/></div>
          <div style={card}><div style={S.sec}>Items gangs{!isAdmin&&" · lecture seule"}</div><IList items={itemsG} setItems={setItemsG} table="items_gang" eId={eIG} setEId={setEIG} ni={nIG} setNi={setNIG} canEdit={isAdmin}/></div>
          {isAdmin&&(
            <div style={card}>
              <div style={S.sec}>Apparts — capacités & codes</div>
              {apparts.map(a=>(
                <div key={a.id} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid "+C.border}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{flex:1,fontWeight:700,fontSize:13}}>{a.nom}</span>
                    {eCapId===a.id
                      ?<><button onClick={async()=>{const f={max_coffre:+eCapV.max_coffre||a.max_coffre,max_stock:+eCapV.max_stock||a.max_stock,code:eCapV.code||""};await updateAppart(a.id,f);setECapId(null);}} style={{color:C.green,fontWeight:700}}>OK</button><button onClick={()=>setECapId(null)}>✕</button></>
                      :<button onClick={()=>{setECapId(a.id);setECapV({max_coffre:a.max_coffre,max_stock:a.max_stock,code:a.code||""});}}>Modifier</button>
                    }
                  </div>
                  {eCapId===a.id
                    ?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      <div><div style={S.lbl}>Max coffre ($)</div><input type="number" style={S.inp} value={eCapV.max_coffre} onChange={e=>setECapV(v=>({...v,max_coffre:e.target.value}))}/></div>
                      <div><div style={S.lbl}>Max stock (Kg)</div><input type="number" style={S.inp} value={eCapV.max_stock} onChange={e=>setECapV(v=>({...v,max_stock:e.target.value}))}/></div>
                      <div><div style={S.lbl}>Code appart</div><input type="text" style={S.inp} value={eCapV.code} onChange={e=>setECapV(v=>({...v,code:e.target.value}))}/></div>
                    </div>
                    :<div style={{fontSize:12,color:C.muted,display:"flex",gap:16}}>
                      <span>Max coffre : <strong style={{color:C.text}}>{fmt(a.max_coffre)}</strong></span>
                      <span>Max stock : <strong style={{color:C.text}}>{fmtKg(a.max_stock)}</strong></span>
                      <span>Code : <strong style={{color:C.text,fontFamily:"monospace"}}>{a.code||"—"}</strong></span>
                    </div>
                  }
                </div>
              ))}
            </div>
          )}
          {isAdmin&&(
            <div style={card}>
              <div style={S.sec}>Membres — comptes</div>
              {members.map(m=>(
                <div key={m.id} style={S.row}>
                  <span style={{flex:1,fontSize:14}}>{m.nom}</span>
                  <span style={{fontSize:13,color:C.muted}}>{fmt(m.solde)}</span>
                  <button onClick={async()=>{await sb.from("membres_comptes").delete().eq("id",m.id);setMembers(ms=>ms.filter(x=>x.id!==m.id));}} style={{color:C.red}}>Suppr.</button>
                </div>
              ))}
              <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <div style={{flex:1}}><div style={S.lbl}>Nom</div><input style={S.inp} value={nBM.nom} onChange={e=>setNBM(f=>({...f,nom:e.target.value}))}/></div>
                <div><div style={S.lbl}>Solde ($)</div><input type="number" style={{width:90}} value={nBM.solde} onChange={e=>setNBM(f=>({...f,solde:e.target.value}))}/></div>
                <button onClick={async()=>{if(!nBM.nom)return;const{data}=await sb.from("membres_comptes").insert({nom:nBM.nom,solde:+nBM.solde||0}).select().single();if(data)setMembers(p=>[...p,data]);setNBM({nom:"",solde:""});}} style={{fontWeight:700}}>+</button>
              </div>
            </div>
          )}
          {isAdmin&&(
            <div style={{...card,border:"1px solid rgba(212,132,10,0.4)",background:"rgba(212,132,10,0.06)"}}>
              <div style={{...S.sec,color:C.amber}}>Gestion des accès — admin uniquement</div>
              {users.map(u=>(
                <div key={u.id} style={S.row}>
                  <span style={{flex:1,fontSize:14}}>{u.nom}</span>
                  <RoleBadge role={u.role}/>
                  <span style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{"•".repeat(u.code.length)}</span>
                  {u.id!==cu.id&&<button onClick={async()=>{await sb.from("users").delete().eq("id",u.id);setUsers(us=>us.filter(x=>x.id!==u.id));}} style={{color:C.red}}>Suppr.</button>}
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 90px auto",gap:8,alignItems:"end",borderTop:"1px solid rgba(212,132,10,0.3)",paddingTop:10,marginTop:4}}>
                <div><div style={S.lbl}>Nom</div><input style={S.inp} value={nU.nom} onChange={e=>setNU(f=>({...f,nom:e.target.value}))}/></div>
                <div><div style={S.lbl}>Code</div><input type="password" style={S.inp} value={nU.code} onChange={e=>setNU(f=>({...f,code:e.target.value}))}/></div>
                <div><div style={S.lbl}>Rôle</div><select style={S.inp} value={nU.role} onChange={e=>setNU(f=>({...f,role:e.target.value}))}><option value="membre">Membre</option><option value="admin">Admin</option></select></div>
                <button onClick={async()=>{if(!nU.nom||!nU.code)return;const{data}=await sb.from("users").insert({nom:nU.nom,code:nU.code,role:nU.role}).select().single();if(data)setUsers(p=>[...p,data]);setNU({nom:"",code:"",role:"membre"});}} style={{fontWeight:700,alignSelf:"end"}}>+</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
