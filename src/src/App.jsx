import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://VOTRE_URL.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_ANON_KEY";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fmt    = n => Math.round(+n||0).toLocaleString("fr-FR")+"$";
const fmtKg  = n => Math.round(+n||0)+" Kg";
const pctVal = (v,max) => Math.min(100,Math.round((v/Math.max(1,max))*100));
const todayStr = () => new Date().toISOString().slice(0,10);
const daysAgo  = n => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };

const APPART_CATS = [
  {id:"recel",     label:"Recel",      color:"#C084FC", bg:"rgba(192,132,252,0.12)"},
  {id:"equipement",label:"Équipement", color:"#60A5FA", bg:"rgba(96,165,250,0.12)"},
  {id:"drogue",    label:"Drogue",     color:"#34D399", bg:"rgba(52,211,153,0.12)"},
];
const getCat = id => APPART_CATS.find(c=>c.id===id)||APPART_CATS[0];

const C = {
  bg:"#2a2a2a", surface:"#333333", surfaceAlt:"#3d3d3d",
  border:"#505050", text:"#f0f0f0", muted:"#a0a0a0",
  green:"#3dbf8f", red:"#e05555", amber:"#d4920a", blue:"#5aaee8",
};

const card = {
  background:C.surface,
  border:"1px solid "+C.border,
  borderRadius:12,
  padding:"16px 18px",
  boxShadow:"0 2px 10px rgba(0,0,0,0.25)",
};

const S = {
  card,
  inp: {width:"100%"},
  lbl: {fontSize:11,color:C.muted,marginBottom:3,fontWeight:500},
  sec: {fontSize:10,fontWeight:700,color:C.muted,margin:"0 0 14px",textTransform:"uppercase",letterSpacing:"0.12em"},
  row: {display:"flex",alignItems:"center",gap:8,marginBottom:8},
};

const G = `
  *{box-sizing:border-box;}
  select,input{background:#3a3a3a!important;border:1px solid #585858!important;border-radius:8px!important;padding:7px 11px!important;font-size:13px!important;color:#f0f0f0!important;outline:none!important;box-shadow:inset 0 1px 4px rgba(0,0,0,0.25)!important;font-family:inherit;transition:border-color .15s;}
  select{-webkit-appearance:auto!important;appearance:auto!important;cursor:pointer;}
  select:focus,input:focus{border-color:#888!important;box-shadow:0 0 0 3px rgba(176,176,176,0.12),inset 0 1px 4px rgba(0,0,0,0.2)!important;}
  select option{background:#3a3a3a!important;color:#f0f0f0!important;}
  input::placeholder{color:#686868!important;}
  button{background:#3a3a3a;border:1px solid #585858;border-radius:8px;padding:5px 12px;font-size:13px;color:#f0f0f0;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.25);transition:background .12s,transform .08s;white-space:nowrap;flex-shrink:0;}
  button:hover{background:#484848;}
  button:active{transform:scale(0.97);}
  div,span,p,h1,h2,h3,label{color:inherit;}
`;

function Bar({val,max,color}) {
  const p = pctVal(val,max);
  const c = color||(p>85?C.red:p>60?C.amber:C.green);
  return (
    <div style={{background:C.surfaceAlt,borderRadius:6,height:6,overflow:"hidden",border:"1px solid "+C.border}}>
      <div style={{width:p+"%",background:c,height:"100%",borderRadius:6,transition:"width .4s"}}/>
    </div>
  );
}

function RoleBadge({role}) {
  const isA = role==="admin";
  return (
    <span style={{fontSize:11,padding:"2px 9px",borderRadius:5,fontWeight:600,
      background:isA?"rgba(224,85,85,0.15)":"rgba(74,158,222,0.15)",
      color:isA?C.red:C.blue,
      border:"1px solid "+(isA?"rgba(224,85,85,0.3)":"rgba(74,158,222,0.3)")}}>
      {isA?"Admin":"Membre"}
    </span>
  );
}

function Loader() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",color:C.muted,fontSize:14}}>
      Chargement...
    </div>
  );
}

function LoginScreen({onLogin}) {
  const [code,setCode] = useState("");
  const [err,setErr]   = useState("");
  const [loading,setLoading] = useState(false);

  async function tryLogin() {
    setLoading(true); setErr("");
    const {data} = await sb.from("users").select("*").eq("code",code.trim()).single();
    if(data) onLogin(data);
    else setErr("Code incorrect");
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <style>{G}</style>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>Accès sécurisé</div>
        <h1 style={{fontSize:28,fontWeight:700,color:C.text,margin:0}}>Compta Covenant</h1>
      </div>
      <div style={{...card,width:"100%",maxWidth:360,padding:"24px"}}>
        <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Code d'accès</div>
        <input
          type="password"
          placeholder="• • • • • •"
          value={code}
          onChange={e=>setCode(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&tryLogin()}
          style={{width:"100%",marginBottom:err?8:14,fontSize:20,letterSpacing:"0.35em",textAlign:"center"}}
        />
        {err && <div style={{fontSize:12,color:C.red,marginBottom:12,fontWeight:500,textAlign:"center"}}>{err}</div>}
        <button
          onClick={tryLogin}
          disabled={loading}
          style={{width:"100%",padding:"11px",fontWeight:700,fontSize:14,background:"#585858",color:C.text,border:"1px solid #686868",borderRadius:8}}
        >
          {loading?"...":"Connexion"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [cu,setCu] = useState(null);
  if(!cu) return <LoginScreen onLogin={setCu}/>;
  return <Main cu={cu} onLogout={()=>setCu(null)}/>;
}

function Main({cu,onLogout}) {
  const isAdmin = cu.role==="admin";
  const [tab,setTab] = useState("dashboard");

  const [apparts,setApparts]       = useState([]);
  const [catsPM,setCatsPM]         = useState([]);
  const [catsGang,setCatsGang]     = useState([]);
  const [pms,setPMs]               = useState([]);
  const [gangs,setGangs]           = useState([]);
  const [itemsPM,setItemsPM]       = useState([]);
  const [itemsGang,setItemsGang]   = useState([]);
  const [bankMembers,setBankMembers] = useState([]);
  const [history,setHistory]       = useState([]);
  const [users,setUsers]           = useState([]);
  const [loading,setLoading]       = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [a,cpm,cg,p,g,ipm,ig,bm,h,u] = await Promise.all([
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
    setItemsGang(ig.data||[]);
    setBankMembers(bm.data||[]);
    setHistory(h.data||[]);
    setUsers(u.data||[]);
    setLoading(false);
  },[]);

  useEffect(()=>{ loadAll(); },[loadAll]);

  // ── date filters ──
  const [dashFrom,setDashFrom] = useState(daysAgo(7));
  const [dashTo,setDashTo]     = useState(todayStr());
  const [histFrom,setHistFrom] = useState(daysAgo(7));
  const [histTo,setHistTo]     = useState(todayStr());

  // ── tx form ──
  const emptyTx = {dest:"pm",pmId:"",gangId:"",membreId:"",qtesItems:{},liasseQte:"",argentSale:"",date:todayStr(),note:""};
  const [txF,setTxF] = useState(emptyTx);
  const selPM      = pms.find(p=>p.id===txF.pmId);
  const selGang    = gangs.find(g=>g.id===txF.gangId);
  const selCatPM   = selPM   ? catsPM.find(c=>c.id===selPM.categorie_id)   : null;
  const selCatGang = selGang ? catsGang.find(c=>c.id===selGang.categorie_id) : null;
  const aPct     = txF.dest==="pm" ? (selCatPM?.pct_objets||0)   : (selCatGang?.pct_objets||0);
  const aLiasse  = txF.dest==="pm" ? (selCatPM?.taux_liasse||0)  : (selCatGang?.taux_liasse||0);
  const activeItems = txF.dest==="gang" ? [...itemsPM,...itemsGang] : itemsPM;

  const totObj = useMemo(()=>{
    if(!aPct) return 0;
    return activeItems.reduce((s,it)=>{ const q=+txF.qtesItems[it.id]||0; return s+it.prix*q*(aPct/100); },0);
  },[txF.qtesItems,aPct,activeItems]);

  const totLia  = aLiasse*(+txF.liasseQte||0);
  const totArg  = txF.dest==="pm" ? Math.round((+txF.argentSale||0)*0.4) : 0;
  const txTotal = Math.round(totObj)+totLia+totArg;

  async function submitTx() {
    if(txF.dest==="pm"  && (!txF.pmId||!txF.membreId)) return;
    if(txF.dest==="gang" && !txF.gangId) return;
    if(!totObj&&!totLia&&!totArg) return;

    const types=[]; const payload={dest:txF.dest,date:txF.date,note:txF.note,total:txTotal};

    if(txF.dest==="pm") {
      payload.pm_nom  = selPM.nom;
      payload.pm_cat  = selCatPM?.nom;
      payload.pm_pct  = aPct;
      payload.membre  = bankMembers.find(m=>m.id===txF.membreId)?.nom||"";
    } else {
      payload.gang_nom = selGang.nom;
      payload.gang_cat = selCatGang?.nom;
      payload.gang_pct = aPct;
    }

    if(totObj>0) {
      types.push("objets");
      payload.lignes = activeItems
        .filter(it=>(+txF.qtesItems[it.id]||0)>0)
        .map(it=>({nom:it.nom,prix:it.prix,qte:+txF.qtesItems[it.id],sous_total:it.prix*(+txF.qtesItems[it.id])*(aPct/100)}));
    }
    if(totLia>0) {
      types.push("liasses");
      payload.liasse_qte  = +txF.liasseQte;
      payload.taux_liasse = aLiasse;
      payload.valeur_face = 70*(+txF.liasseQte);
    }
    if(totArg>0 && txF.dest==="pm") {
      types.push("argent");
      payload.argent_sale = +txF.argentSale;
    }
    payload.types = types;

    await sb.from("transactions").insert(payload);
    if(txF.dest==="pm" && txF.membreId) {
      const mb = bankMembers.find(m=>m.id===txF.membreId);
      await sb.from("membres_comptes").update({solde:mb.solde-txTotal}).eq("id",txF.membreId);
    }
    await loadAll();
    setTxF(emptyTx);
  }

  // ── CRUD helpers ──
  async function updateAppart(id,fields) {
    await sb.from("apparts").update(fields).eq("id",id);
    setApparts(p=>p.map(a=>a.id===id?{...a,...fields}:a));
  }
  async function deleteAppart(id) {
    await sb.from("apparts").delete().eq("id",id);
    setApparts(p=>p.filter(a=>a.id!==id));
  }
  async function addAppart() {
    const {data} = await sb.from("apparts").insert({nom:"Nouvel appart",coffre:0,stock:0,max_coffre:10000,max_stock:100,categorie:"recel"}).select().single();
    if(data) setApparts(p=>[...p,data]);
  }

  async function upsertCatPM(c) {
    if(c.id) { await sb.from("categories_pm").update({nom:c.nom,pct_objets:c.pct_objets,taux_liasse:c.taux_liasse}).eq("id",c.id); setCatsPM(p=>p.map(x=>x.id===c.id?c:x)); }
    else { const{data}=await sb.from("categories_pm").insert({nom:c.nom,pct_objets:c.pct_objets,taux_liasse:c.taux_liasse}).select().single(); if(data) setCatsPM(p=>[...p,data]); }
  }
  async function deleteCatPM(id) { await sb.from("categories_pm").delete().eq("id",id); setCatsPM(p=>p.filter(x=>x.id!==id)); }

  async function upsertCatGang(c) {
    if(c.id) { await sb.from("categories_gang").update({nom:c.nom,pct_objets:c.pct_objets,taux_liasse:c.taux_liasse}).eq("id",c.id); setCatsGang(p=>p.map(x=>x.id===c.id?c:x)); }
    else { const{data}=await sb.from("categories_gang").insert({nom:c.nom,pct_objets:c.pct_objets,taux_liasse:c.taux_liasse}).select().single(); if(data) setCatsGang(p=>[...p,data]); }
  }
  async function deleteCatGang(id) { await sb.from("categories_gang").delete().eq("id",id); setCatsGang(p=>p.filter(x=>x.id!==id)); }

  async function upsertPM(p) {
    if(p.id) { await sb.from("pms").update({nom:p.nom,categorie_id:p.categorie_id}).eq("id",p.id); setPMs(ps=>ps.map(x=>x.id===p.id?p:x)); }
    else { const{data}=await sb.from("pms").insert({nom:p.nom,categorie_id:p.categorie_id}).select().single(); if(data) setPMs(ps=>[...ps,data]); }
  }
  async function deletePM(id) { await sb.from("pms").delete().eq("id",id); setPMs(p=>p.filter(x=>x.id!==id)); }

  async function upsertGang(g) {
    if(g.id) { await sb.from("gangs").update({nom:g.nom,categorie_id:g.categorie_id}).eq("id",g.id); setGangs(gs=>gs.map(x=>x.id===g.id?g:x)); }
    else { const{data}=await sb.from("gangs").insert({nom:g.nom,categorie_id:g.categorie_id}).select().single(); if(data) setGangs(gs=>[...gs,data]); }
  }
  async function deleteGang(id) { await sb.from("gangs").delete().eq("id",id); setGangs(g=>g.filter(x=>x.id!==id)); }

  async function upsertItemPM(it) {
    if(it.id) { await sb.from("items_pm").update({nom:it.nom,prix:it.prix}).eq("id",it.id); setItemsPM(p=>p.map(x=>x.id===it.id?it:x)); }
    else { const{data}=await sb.from("items_pm").insert({nom:it.nom,prix:it.prix}).select().single(); if(data) setItemsPM(p=>[...p,data]); }
  }
  async function deleteItemPM(id) { await sb.from("items_pm").delete().eq("id",id); setItemsPM(p=>p.filter(x=>x.id!==id)); }

  async function upsertItemGang(it) {
    if(it.id) { await sb.from("items_gang").update({nom:it.nom,prix:it.prix}).eq("id",it.id); setItemsGang(p=>p.map(x=>x.id===it.id?it:x)); }
    else { const{data}=await sb.from("items_gang").insert({nom:it.nom,prix:it.prix}).select().single(); if(data) setItemsGang(p=>[...p,data]); }
  }
  async function deleteItemGang(id) { await sb.from("items_gang").delete().eq("id",id); setItemsGang(p=>p.filter(x=>x.id!==id)); }

  async function upsertBM(m) {
    if(m.id) { await sb.from("membres_comptes").update({nom:m.nom,solde:m.solde}).eq("id",m.id); setBankMembers(p=>p.map(x=>x.id===m.id?m:x)); }
    else { const{data}=await sb.from("membres_comptes").insert({nom:m.nom,solde:m.solde}).select().single(); if(data) setBankMembers(p=>[...p,data]); }
  }
  async function deleteBM(id) { await sb.from("membres_comptes").delete().eq("id",id); setBankMembers(p=>p.filter(x=>x.id!==id)); }

  async function upsertUser(u) {
    if(u.id) { await sb.from("users").update({nom:u.nom,code:u.code,role:u.role}).eq("id",u.id); setUsers(p=>p.map(x=>x.id===u.id?u:x)); }
    else { const{data}=await sb.from("users").insert({nom:u.nom,code:u.code,role:u.role}).select().single(); if(data) setUsers(p=>[...p,data]); }
  }
  async function deleteUser(id) { await sb.from("users").delete().eq("id",id); setUsers(p=>p.filter(x=>x.id!==id)); }

  // ── apparts sort/filter ──
  const [apCatF,setApCatF] = useState("");
  const [apSort,setApSort] = useState({key:"",dir:-1});
  const toggleSort = k => setApSort(s=>s.key===k?{key:k,dir:s.dir*-1}:{key:k,dir:-1});
  const sortedAp = useMemo(()=>{
    let arr = apCatF ? apparts.filter(a=>a.categorie===apCatF) : [...apparts];
    if(apSort.key) arr.sort((a,b)=>(a[apSort.key]-b[apSort.key])*apSort.dir);
    return arr;
  },[apparts,apCatF,apSort]);

  // ── historique ──
  const [hFil,setHFil] = useState({who:""});
  const whoOptions = useMemo(()=>{
    const seen=new Set();
    return history.reduce((acc,h)=>{
      const n = h.dest==="pm" ? h.pm_nom : h.gang_nom;
      if(!seen.has(n)){ seen.add(n); acc.push(n); }
      return acc;
    },[]);
  },[history]);
  const filtH = useMemo(()=>history.filter(h=>{
    const n = h.dest==="pm" ? h.pm_nom : h.gang_nom;
    if(hFil.who && n!==hFil.who) return false;
    if(h.date<histFrom || h.date>histTo) return false;
    return true;
  }),[history,hFil,histFrom,histTo]);

  // ── dashboard stats ──
  const dashH        = useMemo(()=>history.filter(h=>h.date>=dashFrom&&h.date<=dashTo),[history,dashFrom,dashTo]);
  const totalPaye    = dashH.reduce((a,x)=>a+x.total,0);
  const totalCoffres = apparts.reduce((a,x)=>a+x.coffre,0);
  const totalBankM   = bankMembers.reduce((a,x)=>a+x.solde,0);
  const totalStockU  = apparts.reduce((a,x)=>a+x.stock,0);
  const totalStockM  = apparts.reduce((a,x)=>a+x.max_stock,0);
  const repartition  = useMemo(()=>{
    let obj=0,lia=0,arg=0;
    dashH.forEach(h=>{
      if(h.types?.includes("objets")&&h.lignes) obj+=(h.lignes).reduce((s,l)=>s+l.sous_total,0);
      if(h.types?.includes("liasses")) lia+=h.taux_liasse*h.liasse_qte;
      if(h.types?.includes("argent"))  arg+=Math.round(h.argent_sale*0.4);
    });
    const tot=obj+lia+arg||1;
    return [
      {label:"Objets",    val:obj, p:Math.round(obj/tot*100), color:C.blue},
      {label:"Liasses",   val:lia, p:Math.round(lia/tot*100), color:C.green},
      {label:"Argent sale",val:arg,p:Math.round(arg/tot*100), color:C.amber},
    ];
  },[dashH]);

  // ── settings state ──
  const [newCatPM,setNewCatPM]   = useState({nom:"",pct_objets:"",taux_liasse:""});
  const [newCatGang,setNewCatGang] = useState({nom:"",pct_objets:"",taux_liasse:""});
  const [editCatPMId,setEditCatPMId]   = useState(null);
  const [editCatGangId,setEditCatGangId] = useState(null);
  const [newPM,setNewPM]     = useState({nom:"",categorie_id:""});
  const [newGang,setNewGang] = useState({nom:"",categorie_id:""});
  const [editPMId,setEditPMId]   = useState(null);
  const [editGangId,setEditGangId] = useState(null);
  const [newIPM,setNewIPM]   = useState({nom:"",prix:""});
  const [newIG,setNewIG]     = useState({nom:"",prix:""});
  const [editIPMId,setEditIPMId] = useState(null);
  const [editIGId,setEditIGId]   = useState(null);
  const [newBM,setNewBM]     = useState({nom:"",solde:""});
  const [newUser,setNewUser] = useState({nom:"",code:"",role:"membre"});
  const [editCapId,setEditCapId]     = useState(null);
  const [editCapVals,setEditCapVals] = useState({});
  const [expanded,setExpanded] = useState({});

  const TABS = [
    {id:"dashboard",    label:"Tableau de bord"},
    {id:"transactions", label:"Transactions"},
    {id:"historique",   label:"Historique"},
    {id:"apparts",      label:"Apparts"},
    {id:"settings",     label:"Paramètres"},
  ];
  const navS = id => ({
    padding:"10px 15px",fontSize:13,fontWeight:tab===id?600:400,
    color:tab===id?C.text:C.muted,
    borderBottom:tab===id?"2px solid "+C.text:"2px solid transparent",
    background:"none",border:"none",cursor:"pointer",borderRadius:0,
    whiteSpace:"nowrap",boxShadow:"none",
  });

  if(loading) return <div style={{background:C.bg,minHeight:"100vh"}}><style>{G}</style><Loader/></div>;

  return (
    <div style={{padding:"1.25rem",maxWidth:740,margin:"0 auto",minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{G}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
        <h2 style={{fontSize:19,fontWeight:700,margin:0,color:C.text}}>Compta Covenant</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <RoleBadge role={cu.role}/>
          <span style={{fontSize:13,color:C.muted}}>{cu.nom}</span>
          <button onClick={onLogout} style={{fontSize:12,color:C.red,padding:"4px 10px"}}>Déconnexion</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",borderBottom:"1px solid "+C.border,marginBottom:"1.5rem",overflowX:"auto",gap:2}}>
        {TABS.map(t=>(
          <button key={t.id} style={navS(t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==="dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:16}}>
            <div style={card}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Total coffres</div>
              <div style={{fontSize:20,fontWeight:700,color:C.text}}>{fmt(totalCoffres)}</div>
            </div>
            <div style={card}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Total comptes</div>
              <div style={{fontSize:20,fontWeight:700,color:C.text}}>{fmt(totalBankM)}</div>
            </div>
            <div style={card}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Stock apparts</div>
              <div style={{fontSize:20,fontWeight:700,color:C.text}}>{fmtKg(totalStockU)} / {fmtKg(totalStockM)}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{pctVal(totalStockU,totalStockM)}% occupé</div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0 14px"}}>
            <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>Sur la période</span>
            <div style={{flex:1,height:"1px",background:C.border}}/>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:12,color:C.muted,fontWeight:500}}>Du</span>
              <input type="date" value={dashFrom} onChange={e=>setDashFrom(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
              <span style={{fontSize:12,color:C.muted,fontWeight:500}}>au</span>
              <input type="date" value={dashTo} onChange={e=>setDashTo(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={card}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Payé aux PM</div>
              <div style={{fontSize:26,fontWeight:700,color:C.red}}>{fmt(totalPaye)}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{dashH.length} transaction{dashH.length!==1?"s":""}</div>
            </div>
            <div style={card}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Répartition</div>
              {repartition.map(r=>(
                <div key={r.label} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:C.muted}}>{r.label}</span>
                    <span style={{fontWeight:600,color:r.val>0?C.text:C.muted}}>{r.val>0?fmt(Math.round(r.val))+" · "+r.p+"%":"—"}</span>
                  </div>
                  <Bar val={r.val} max={Math.max(1,...repartition.map(x=>x.val))} color={r.color}/>
                </div>
              ))}
            </div>
          </div>

          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"18px 0 10px"}}>Comptes membres</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
            {bankMembers.map(m=>(
              <div key={m.id} style={{...card,padding:"12px 14px"}}>
                <div style={{fontSize:12,color:C.muted,marginBottom:6,fontWeight:500}}>{m.nom}</div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input
                    type="number"
                    value={m.solde}
                    onChange={e=>upsertBM({...m,solde:+e.target.value})}
                    style={{flex:1,fontSize:18,fontWeight:700,border:"none!important",background:"transparent!important",color:C.text,padding:"0!important",minWidth:0,boxShadow:"none!important"}}
                  />
                  <span style={{fontSize:13,color:C.muted,fontWeight:600}}>$</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab==="transactions" && (
        <div style={card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Nouvelle transaction</div>

          {/* Toggle PM / Gang */}
          <div style={{display:"flex",gap:4,background:C.surfaceAlt,borderRadius:10,padding:4,border:"1px solid "+C.border,marginBottom:14}}>
            {[["pm","Petite main"],["gang","Gang"]].map(([v,l])=>(
              <button key={v}
                onClick={()=>setTxF(f=>({...f,dest:v,pmId:"",gangId:"",membreId:"",qtesItems:{},argentSale:""}))}
                style={{flex:1,padding:"7px 12px",fontSize:13,fontWeight:txF.dest===v?600:400,
                  background:txF.dest===v?C.surface:"transparent",
                  color:txF.dest===v?C.text:C.muted,
                  border:txF.dest===v?"1px solid "+C.border:"none",
                  borderRadius:7,boxShadow:txF.dest===v?"0 1px 4px rgba(0,0,0,0.25)":"none"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {txF.dest==="pm" ? (
              <div>
                <div style={S.lbl}>PM</div>
                <select style={S.inp} value={txF.pmId} onChange={e=>setTxF(f=>({...f,pmId:e.target.value}))}>
                  <option value="">— choisir —</option>
                  {pms.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <div style={S.lbl}>Gang</div>
                <select style={S.inp} value={txF.gangId} onChange={e=>setTxF(f=>({...f,gangId:e.target.value}))}>
                  <option value="">— choisir —</option>
                  {gangs.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
                </select>
              </div>
            )}
            {txF.dest==="pm" && (
              <div>
                <div style={S.lbl}>Payé par</div>
                <select style={S.inp} value={txF.membreId} onChange={e=>setTxF(f=>({...f,membreId:e.target.value}))}>
                  <option value="">— membre —</option>
                  {bankMembers.map(m=><option key={m.id} value={m.id}>{m.nom} ({fmt(m.solde)})</option>)}
                </select>
              </div>
            )}
            <div>
              <div style={S.lbl}>Date</div>
              <input type="date" style={S.inp} value={txF.date} onChange={e=>setTxF(f=>({...f,date:e.target.value}))}/>
            </div>
            <div>
              <div style={S.lbl}>Note</div>
              <input type="text" style={S.inp} placeholder="Optionnel" value={txF.note} onChange={e=>setTxF(f=>({...f,note:e.target.value}))}/>
            </div>
          </div>

          {/* Objets */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
              Objets {aPct>0 && <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>· {aPct}%</span>}
            </div>
            {activeItems.map(it=>{
              const isGO = itemsGang.some(x=>x.id===it.id);
              return (
                <div key={it.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,paddingBottom:6,borderBottom:"1px solid "+C.border}}>
                  <span style={{flex:1,fontSize:13,color:C.text}}>
                    {it.nom}
                    {isGO && <span style={{fontSize:10,marginLeft:5,padding:"1px 6px",borderRadius:4,background:"rgba(212,132,10,0.12)",color:C.amber,border:"1px solid rgba(212,132,10,0.3)",fontWeight:700}}>gang</span>}
                    <span style={{fontSize:11,color:C.muted,marginLeft:4}}>({fmt(it.prix)})</span>
                  </span>
                  <input type="number" min="0" placeholder="0" style={{width:72,textAlign:"center"}}
                    value={txF.qtesItems[it.id]||""}
                    onChange={e=>setTxF(f=>({...f,qtesItems:{...f.qtesItems,[it.id]:e.target.value}}))}/>
                </div>
              );
            })}
          </div>

          {/* Liasses */}
          <div style={{borderTop:"1px solid "+C.border,paddingTop:12,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
              Liasses {aLiasse>0 && <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>· {aLiasse}$ / liasse</span>}
            </div>
            <input type="number" min="0" placeholder="0 liasses" style={{width:140}}
              value={txF.liasseQte} onChange={e=>setTxF(f=>({...f,liasseQte:e.target.value}))}/>
          </div>

          {/* Argent sale — PM uniquement */}
          {txF.dest==="pm" && (
            <div style={{borderTop:"1px solid "+C.border,paddingTop:12,marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
                Argent sale <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>· 40%</span>
              </div>
              <input type="number" min="0" placeholder="0$" style={{width:160}}
                value={txF.argentSale} onChange={e=>setTxF(f=>({...f,argentSale:e.target.value}))}/>
            </div>
          )}

          <div style={{borderTop:"1px solid "+C.border,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Total à payer</div>
              <div style={{fontSize:28,fontWeight:700,color:C.red}}>{fmt(txTotal)}</div>
            </div>
            <button onClick={submitTx} style={{padding:"11px 30px",fontWeight:700,fontSize:14,background:C.text,color:C.bg,border:"none",borderRadius:9}}>
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {tab==="historique" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <select value={hFil.who} onChange={e=>setHFil(f=>({...f,who:e.target.value}))}>
              <option value="">Toutes les PM / gangs</option>
              {whoOptions.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:C.muted,fontWeight:500}}>Du</span>
            <input type="date" value={histFrom} onChange={e=>setHistFrom(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
            <span style={{fontSize:12,color:C.muted,fontWeight:500}}>au</span>
            <input type="date" value={histTo} onChange={e=>setHistTo(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12,fontWeight:500}}>{filtH.length} transaction{filtH.length!==1?"s":""}</div>
          {filtH.length===0 && (
            <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"3rem",opacity:.5}}>Aucune transaction sur cette période</div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtH.map(h=>{
              const exp = !!expanded[h.id];
              const who = h.dest==="pm" ? h.pm_nom+" ("+h.pm_cat+")" : h.gang_nom+" ("+h.gang_cat+")";
              const tl  = (h.types||[]).map(t=>{
                if(t==="objets")  return "Objets·"+(h.dest==="pm"?h.pm_pct:h.gang_pct)+"%";
                if(t==="liasses") return "Liasses·"+h.taux_liasse+"$";
                if(t==="argent")  return "Argent·40%";
                return "";
              }).filter(Boolean).join(" + ");
              return (
                <div key={h.id} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <span style={{fontWeight:700,fontSize:14}}>{who}</span>
                      {h.membre && <span style={{fontSize:12,color:C.muted,marginLeft:8}}>· payé par {h.membre}</span>}
                      <div style={{fontSize:11,color:C.muted,marginTop:2,fontWeight:500}}>{tl}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.red}}>{fmt(h.total)}</div>
                        <div style={{fontSize:11,color:C.muted}}>{h.date}</div>
                      </div>
                      <button onClick={()=>setExpanded(e=>({...e,[h.id]:!e[h.id]}))} style={{fontSize:11,padding:"4px 10px",color:C.muted}}>
                        {exp?"Masquer":"Détail"}
                      </button>
                    </div>
                  </div>
                  {exp && (
                    <div style={{borderTop:"1px solid "+C.border,paddingTop:8,marginTop:8,fontSize:12,color:C.muted}}>
                      {h.types?.includes("objets") && (h.lignes||[]).map((l,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span>{l.nom} × {l.qte} ({fmt(l.prix)}/u)</span>
                          <span style={{color:C.green,fontWeight:600}}>{fmt(Math.round(l.sous_total))}</span>
                        </div>
                      ))}
                      {h.types?.includes("liasses") && (
                        <div style={{marginBottom:3}}>
                          {h.liasse_qte} liasse{h.liasse_qte>1?"s":""} · face {fmt(h.valeur_face)} → <span style={{color:C.green,fontWeight:600}}>{fmt(h.taux_liasse*h.liasse_qte)}</span>
                        </div>
                      )}
                      {h.types?.includes("argent") && (
                        <div style={{marginBottom:3}}>
                          Argent sale : {fmt(h.argent_sale)} → <span style={{color:C.green,fontWeight:600}}>{fmt(Math.round(h.argent_sale*0.4))}</span>
                        </div>
                      )}
                      {h.note && <div style={{marginTop:6,fontStyle:"italic"}}>{h.note}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── APPARTS ── */}
      {tab==="apparts" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setApCatF("")} style={{fontSize:11,padding:"3px 10px",fontWeight:apCatF===""?700:400,background:apCatF===""?C.surfaceAlt:"transparent",border:"1px solid "+(apCatF===""?C.border:"transparent")}}>Tous</button>
              {APPART_CATS.map(c=>(
                <button key={c.id} onClick={()=>setApCatF(apCatF===c.id?"":c.id)}
                  style={{fontSize:11,padding:"3px 10px",fontWeight:apCatF===c.id?700:400,background:apCatF===c.id?c.bg:"transparent",color:apCatF===c.id?c.color:C.muted,border:"1px solid "+(apCatF===c.id?c.color:"transparent"),borderRadius:6}}>
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.muted}}>Trier :</span>
              {["coffre","stock"].map(k=>{
                const active = apSort.key===k;
                const arrow  = active ? (apSort.dir===1?"↑":"↓") : "↕";
                return (
                  <button key={k} onClick={()=>toggleSort(k)}
                    style={{fontSize:11,padding:"3px 8px",color:active?C.text:C.muted,background:active?C.surfaceAlt:"transparent",border:"1px solid "+(active?C.border:"transparent"),borderRadius:6}}>
                    {k.charAt(0).toUpperCase()+k.slice(1)} {arrow}
                  </button>
                );
              })}
              {isAdmin && <button onClick={addAppart} style={{fontWeight:700,marginLeft:4}}>+ Ajouter</button>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {sortedAp.map(a=>{
              const ac = getCat(a.categorie);
              return (
                <div key={a.id} style={{...card,borderLeft:"3px solid "+ac.color,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <input value={a.nom} onChange={e=>updateAppart(a.id,{nom:e.target.value})}
                      style={{flex:1,fontWeight:700,fontSize:13,border:"none!important",background:"transparent!important",color:C.text,padding:"0!important",boxShadow:"none!important",outline:"none"}}/>
                    {isAdmin && <button onClick={()=>deleteAppart(a.id)} style={{fontSize:11,color:C.red,padding:"2px 7px"}}>×</button>}
                  </div>
                  {isAdmin ? (
                    <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
                      {APPART_CATS.map(c=>(
                        <button key={c.id} onClick={()=>updateAppart(a.id,{categorie:c.id})}
                          style={{fontSize:10,padding:"2px 8px",fontWeight:a.categorie===c.id?700:400,background:a.categorie===c.id?c.bg:"transparent",color:a.categorie===c.id?c.color:C.muted,border:"1px solid "+(a.categorie===c.id?c.color+"66":"transparent"),borderRadius:20}}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginBottom:8}}>
                      <span style={{fontSize:10,padding:"2px 8px",fontWeight:700,background:ac.bg,color:ac.color,border:"1px solid "+ac.color+"66",borderRadius:20}}>{ac.label}</span>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Coffre</div>
                      <input type="number" value={a.coffre} onChange={e=>updateAppart(a.id,{coffre:+e.target.value})} style={{width:"100%",fontSize:13,marginBottom:5,padding:"5px 8px"}}/>
                      <Bar val={a.coffre} max={a.max_coffre}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Stock</div>
                      <input type="number" value={a.stock} onChange={e=>updateAppart(a.id,{stock:+e.target.value})} style={{width:"100%",fontSize:13,marginBottom:5,padding:"5px 8px"}}/>
                      <Bar val={a.stock} max={a.max_stock}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PARAMÈTRES ── */}
      {tab==="settings" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Catégories PM */}
          <div style={card}>
            <div style={S.sec}>Catégories PM</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,marginBottom:8}}>
              <span style={S.lbl}>Nom</span><span style={S.lbl}>% objets</span><span style={S.lbl}>$/liasse</span><span/>
            </div>
            {catsPM.map(c=>(
              <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,alignItems:"center",marginBottom:8}}>
                {isAdmin && editCatPMId===c.id ? (
                  <>
                    <input style={S.inp} value={c.nom} onChange={e=>setCatsPM(p=>p.map(x=>x.id===c.id?{...x,nom:e.target.value}:x))}/>
                    <input type="number" style={S.inp} value={c.pct_objets} onChange={e=>setCatsPM(p=>p.map(x=>x.id===c.id?{...x,pct_objets:+e.target.value}:x))}/>
                    <input type="number" style={S.inp} value={c.taux_liasse} onChange={e=>setCatsPM(p=>p.map(x=>x.id===c.id?{...x,taux_liasse:+e.target.value}:x))}/>
                    <button onClick={()=>{upsertCatPM(c);setEditCatPMId(null);}} style={{color:C.green,fontWeight:700}}>OK</button>
                  </>
                ) : (
                  <>
                    <span style={{fontSize:14,color:C.text}}>{c.nom}</span>
                    <span style={{fontSize:13,color:C.muted}}>{c.pct_objets}%</span>
                    <span style={{fontSize:13,color:C.muted}}>{c.taux_liasse}$</span>
                    {isAdmin && (
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditCatPMId(c.id)}>Mod.</button>
                        <button onClick={()=>deleteCatPM(c.id)} style={{color:C.red}}>×</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {isAdmin && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <input style={S.inp} placeholder="Nom" value={newCatPM.nom} onChange={e=>setNewCatPM(f=>({...f,nom:e.target.value}))}/>
                <input type="number" style={S.inp} placeholder="%" value={newCatPM.pct_objets} onChange={e=>setNewCatPM(f=>({...f,pct_objets:e.target.value}))}/>
                <input type="number" style={S.inp} placeholder="$/liasse" value={newCatPM.taux_liasse} onChange={e=>setNewCatPM(f=>({...f,taux_liasse:e.target.value}))}/>
                <button onClick={()=>{if(!newCatPM.nom)return;upsertCatPM({nom:newCatPM.nom,pct_objets:+newCatPM.pct_objets,taux_liasse:+newCatPM.taux_liasse});setNewCatPM({nom:"",pct_objets:"",taux_liasse:""});}} style={{fontWeight:700}}>Ajouter</button>
              </div>
            )}
          </div>

          {/* PM */}
          <div style={card}>
            <div style={S.sec}>Petites mains</div>
            {pms.map(p=>(
              <div key={p.id} style={S.row}>
                {isAdmin && editPMId===p.id ? (
                  <>
                    <input style={{flex:1}} value={p.nom} onChange={e=>setPMs(ps=>ps.map(x=>x.id===p.id?{...x,nom:e.target.value}:x))}/>
                    <select value={p.categorie_id} onChange={e=>setPMs(ps=>ps.map(x=>x.id===p.id?{...x,categorie_id:e.target.value}:x))}>
                      {catsPM.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                    <button onClick={()=>{upsertPM(p);setEditPMId(null);}} style={{color:C.green,fontWeight:700}}>OK</button>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:14,color:C.text}}>{p.nom}</span>
                    <span style={{fontSize:12,color:C.muted}}>{catsPM.find(c=>c.id===p.categorie_id)?.nom||"?"}</span>
                    {isAdmin && (
                      <>
                        <button onClick={()=>setEditPMId(p.id)}>Mod.</button>
                        <button onClick={()=>deletePM(p.id)} style={{color:C.red}}>×</button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
              <div style={{flex:1}}>
                <div style={S.lbl}>Nom</div>
                <input style={S.inp} placeholder="Nom" value={newPM.nom} onChange={e=>setNewPM(f=>({...f,nom:e.target.value}))}/>
              </div>
              <div>
                <div style={S.lbl}>Catégorie</div>
                <select value={newPM.categorie_id} onChange={e=>setNewPM(f=>({...f,categorie_id:e.target.value}))}>
                  <option value="">—</option>
                  {catsPM.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <button onClick={()=>{if(!newPM.nom||!newPM.categorie_id)return;upsertPM({nom:newPM.nom,categorie_id:newPM.categorie_id});setNewPM({nom:"",categorie_id:""}); }} style={{fontWeight:700}}>Ajouter</button>
            </div>
          </div>

          {/* Catégories Gang */}
          <div style={card}>
            <div style={S.sec}>Catégories gangs</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,marginBottom:8}}>
              <span style={S.lbl}>Nom</span><span style={S.lbl}>% objets</span><span style={S.lbl}>$/liasse</span><span/>
            </div>
            {catsGang.map(c=>(
              <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,alignItems:"center",marginBottom:8}}>
                {isAdmin && editCatGangId===c.id ? (
                  <>
                    <input style={S.inp} value={c.nom} onChange={e=>setCatsGang(p=>p.map(x=>x.id===c.id?{...x,nom:e.target.value}:x))}/>
                    <input type="number" style={S.inp} value={c.pct_objets} onChange={e=>setCatsGang(p=>p.map(x=>x.id===c.id?{...x,pct_objets:+e.target.value}:x))}/>
                    <input type="number" style={S.inp} value={c.taux_liasse} onChange={e=>setCatsGang(p=>p.map(x=>x.id===c.id?{...x,taux_liasse:+e.target.value}:x))}/>
                    <button onClick={()=>{upsertCatGang(c);setEditCatGangId(null);}} style={{color:C.green,fontWeight:700}}>OK</button>
                  </>
                ) : (
                  <>
                    <span style={{fontSize:14,color:C.text}}>{c.nom}</span>
                    <span style={{fontSize:13,color:C.muted}}>{c.pct_objets}%</span>
                    <span style={{fontSize:13,color:C.muted}}>{c.taux_liasse}$</span>
                    {isAdmin && (
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditCatGangId(c.id)}>Mod.</button>
                        <button onClick={()=>deleteCatGang(c.id)} style={{color:C.red}}>×</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {isAdmin && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px auto",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <input style={S.inp} placeholder="Nom" value={newCatGang.nom} onChange={e=>setNewCatGang(f=>({...f,nom:e.target.value}))}/>
                <input type="number" style={S.inp} placeholder="%" value={newCatGang.pct_objets} onChange={e=>setNewCatGang(f=>({...f,pct_objets:e.target.value}))}/>
                <input type="number" style={S.inp} placeholder="$/liasse" value={newCatGang.taux_liasse} onChange={e=>setNewCatGang(f=>({...f,taux_liasse:e.target.value}))}/>
                <button onClick={()=>{if(!newCatGang.nom)return;upsertCatGang({nom:newCatGang.nom,pct_objets:+newCatGang.pct_objets,taux_liasse:+newCatGang.taux_liasse});setNewCatGang({nom:"",pct_objets:"",taux_liasse:""});}} style={{fontWeight:700}}>Ajouter</button>
              </div>
            )}
          </div>

          {/* Gangs */}
          <div style={card}>
            <div style={S.sec}>Gangs</div>
            {gangs.map(g=>(
              <div key={g.id} style={S.row}>
                {isAdmin && editGangId===g.id ? (
                  <>
                    <input style={{flex:1}} value={g.nom} onChange={e=>setGangs(gs=>gs.map(x=>x.id===g.id?{...x,nom:e.target.value}:x))}/>
                    <select value={g.categorie_id} onChange={e=>setGangs(gs=>gs.map(x=>x.id===g.id?{...x,categorie_id:e.target.value}:x))}>
                      {catsGang.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                    <button onClick={()=>{upsertGang(g);setEditGangId(null);}} style={{color:C.green,fontWeight:700}}>OK</button>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:14,color:C.text}}>{g.nom}</span>
                    <span style={{fontSize:12,color:C.muted}}>{catsGang.find(c=>c.id===g.categorie_id)?.nom||"?"}</span>
                    {isAdmin && (
                      <>
                        <button onClick={()=>setEditGangId(g.id)}>Mod.</button>
                        <button onClick={()=>deleteGang(g.id)} style={{color:C.red}}>×</button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
              <div style={{flex:1}}>
                <div style={S.lbl}>Nom</div>
                <input style={S.inp} placeholder="Nom" value={newGang.nom} onChange={e=>setNewGang(f=>({...f,nom:e.target.value}))}/>
              </div>
              <div>
                <div style={S.lbl}>Catégorie</div>
                <select value={newGang.categorie_id} onChange={e=>setNewGang(f=>({...f,categorie_id:e.target.value}))}>
                  <option value="">—</option>
                  {catsGang.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <button onClick={()=>{if(!newGang.nom||!newGang.categorie_id)return;upsertGang({nom:newGang.nom,categorie_id:newGang.categorie_id});setNewGang({nom:"",categorie_id:""});}} style={{fontWeight:700}}>Ajouter</button>
            </div>
          </div>

          {/* Items PM */}
          <div style={card}>
            <div style={S.sec}>Items PM{!isAdmin&&" · lecture seule"}</div>
            {itemsPM.map(it=>(
              <div key={it.id} style={S.row}>
                {isAdmin && editIPMId===it.id ? (
                  <>
                    <input style={{flex:1}} value={it.nom} onChange={e=>setItemsPM(p=>p.map(x=>x.id===it.id?{...x,nom:e.target.value}:x))}/>
                    <input type="number" style={{width:80}} value={it.prix} onChange={e=>setItemsPM(p=>p.map(x=>x.id===it.id?{...x,prix:+e.target.value}:x))}/>
                    <span style={S.lbl}>$</span>
                    <button onClick={()=>{upsertItemPM(it);setEditIPMId(null);}} style={{color:C.green,fontWeight:700}}>OK</button>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:14,color:C.text}}>{it.nom}</span>
                    <span style={{fontSize:13,color:C.muted,minWidth:60,textAlign:"right"}}>{fmt(it.prix)}</span>
                    {isAdmin && (
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditIPMId(it.id)}>Mod.</button>
                        <button onClick={()=>deleteItemPM(it.id)} style={{color:C.red}}>×</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {isAdmin && (
              <div style={{display:"flex",gap:8,alignItems:"center",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <input style={{flex:1}} placeholder="Nom" value={newIPM.nom} onChange={e=>setNewIPM(f=>({...f,nom:e.target.value}))}/>
                <input type="number" style={{width:80}} placeholder="Prix $" value={newIPM.prix} onChange={e=>setNewIPM(f=>({...f,prix:e.target.value}))}/>
                <button onClick={()=>{if(!newIPM.nom||!newIPM.prix)return;upsertItemPM({nom:newIPM.nom,prix:+newIPM.prix});setNewIPM({nom:"",prix:""});}} style={{fontWeight:700}}>Ajouter</button>
              </div>
            )}
          </div>

          {/* Items Gang */}
          <div style={card}>
            <div style={S.sec}>Items gangs{!isAdmin&&" · lecture seule"}</div>
            {itemsGang.map(it=>(
              <div key={it.id} style={S.row}>
                {isAdmin && editIGId===it.id ? (
                  <>
                    <input style={{flex:1}} value={it.nom} onChange={e=>setItemsGang(p=>p.map(x=>x.id===it.id?{...x,nom:e.target.value}:x))}/>
                    <input type="number" style={{width:80}} value={it.prix} onChange={e=>setItemsGang(p=>p.map(x=>x.id===it.id?{...x,prix:+e.target.value}:x))}/>
                    <span style={S.lbl}>$</span>
                    <button onClick={()=>{upsertItemGang(it);setEditIGId(null);}} style={{color:C.green,fontWeight:700}}>OK</button>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:14,color:C.text}}>{it.nom}</span>
                    <span style={{fontSize:13,color:C.muted,minWidth:60,textAlign:"right"}}>{fmt(it.prix)}</span>
                    {isAdmin && (
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditIGId(it.id)}>Mod.</button>
                        <button onClick={()=>deleteItemGang(it.id)} style={{color:C.red}}>×</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {isAdmin && (
              <div style={{display:"flex",gap:8,alignItems:"center",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <input style={{flex:1}} placeholder="Nom" value={newIG.nom} onChange={e=>setNewIG(f=>({...f,nom:e.target.value}))}/>
                <input type="number" style={{width:80}} placeholder="Prix $" value={newIG.prix} onChange={e=>setNewIG(f=>({...f,prix:e.target.value}))}/>
                <button onClick={()=>{if(!newIG.nom||!newIG.prix)return;upsertItemGang({nom:newIG.nom,prix:+newIG.prix});setNewIG({nom:"",prix:""});}} style={{fontWeight:700}}>Ajouter</button>
              </div>
            )}
          </div>

          {/* Capacités apparts */}
          {isAdmin && (
            <div style={card}>
              <div style={S.sec}>Apparts — capacités max</div>
              {apparts.map(a=>(
                <div key={a.id} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid "+C.border}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{flex:1,fontWeight:700,fontSize:13,color:C.text}}>{a.nom}</span>
                    {editCapId===a.id ? (
                      <>
                        <button onClick={()=>{updateAppart(a.id,{max_coffre:+editCapVals.max_coffre,max_stock:+editCapVals.max_stock});setEditCapId(null);}} style={{color:C.green,fontWeight:700}}>Sauvegarder</button>
                        <button onClick={()=>setEditCapId(null)}>Annuler</button>
                      </>
                    ) : (
                      <button onClick={()=>{setEditCapId(a.id);setEditCapVals({max_coffre:a.max_coffre,max_stock:a.max_stock});}}>Modifier</button>
                    )}
                  </div>
                  {editCapId===a.id ? (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><div style={S.lbl}>Max coffre ($)</div><input type="number" style={S.inp} value={editCapVals.max_coffre} onChange={e=>setEditCapVals(v=>({...v,max_coffre:e.target.value}))}/></div>
                      <div><div style={S.lbl}>Max stock (Kg)</div><input type="number" style={S.inp} value={editCapVals.max_stock} onChange={e=>setEditCapVals(v=>({...v,max_stock:e.target.value}))}/></div>
                    </div>
                  ) : (
                    <div style={{fontSize:12,color:C.muted,display:"flex",gap:16,fontWeight:500}}>
                      <span>Max coffre : <strong style={{color:C.text}}>{fmt(a.max_coffre)}</strong></span>
                      <span>Max stock : <strong style={{color:C.text}}>{fmtKg(a.max_stock)}</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Membres comptes */}
          {isAdmin && (
            <div style={card}>
              <div style={S.sec}>Membres — comptes</div>
              {bankMembers.map(m=>(
                <div key={m.id} style={S.row}>
                  <span style={{flex:1,fontSize:14,color:C.text}}>{m.nom}</span>
                  <span style={{fontSize:13,color:C.muted}}>{fmt(m.solde)}</span>
                  <button onClick={()=>deleteBM(m.id)} style={{color:C.red}}>Suppr.</button>
                </div>
              ))}
              <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <div style={{flex:1}}><div style={S.lbl}>Nom</div><input style={S.inp} value={newBM.nom} onChange={e=>setNewBM(f=>({...f,nom:e.target.value}))}/></div>
                <div><div style={S.lbl}>Solde ($)</div><input type="number" style={{width:90}} value={newBM.solde} onChange={e=>setNewBM(f=>({...f,solde:e.target.value}))}/></div>
                <button onClick={()=>{if(!newBM.nom)return;upsertBM({nom:newBM.nom,solde:+newBM.solde||0});setNewBM({nom:"",solde:""});}} style={{fontWeight:700}}>Ajouter</button>
              </div>
            </div>
          )}

          {/* Accès */}
          {isAdmin && (
            <div style={{...card,border:"1px solid rgba(212,132,10,0.4)",background:"rgba(212,132,10,0.06)"}}>
              <div style={{...S.sec,color:C.amber}}>Gestion des accès — admin uniquement</div>
              {users.map(u=>(
                <div key={u.id} style={S.row}>
                  <span style={{flex:1,fontSize:14,color:C.text}}>{u.nom}</span>
                  <RoleBadge role={u.role}/>
                  <span style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{"•".repeat(u.code.length)}</span>
                  {u.id!==cu.id && <button onClick={()=>deleteUser(u.id)} style={{color:C.red}}>Suppr.</button>}
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 90px auto",gap:8,alignItems:"end",borderTop:"1px solid rgba(212,132,10,0.3)",paddingTop:10,marginTop:4}}>
                <div><div style={S.lbl}>Nom</div><input style={S.inp} value={newUser.nom} onChange={e=>setNewUser(f=>({...f,nom:e.target.value}))}/></div>
                <div><div style={S.lbl}>Code</div><input type="password" style={S.inp} value={newUser.code} onChange={e=>setNewUser(f=>({...f,code:e.target.value}))}/></div>
                <div>
                  <div style={S.lbl}>Rôle</div>
                  <select style={S.inp} value={newUser.role} onChange={e=>setNewUser(f=>({...f,role:e.target.value}))}>
                    <option value="membre">Membre</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button onClick={()=>{if(!newUser.nom||!newUser.code)return;upsertUser({nom:newUser.nom,code:newUser.code,role:newUser.role});setNewUser({nom:"",code:"",role:"membre"});}} style={{fontWeight:700,alignSelf:"end"}}>Ajouter</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}