import { useState, useMemo, useEffect, useCallback, useRef, memo } from "react";
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
const fmtKgD = n => (Math.round((+n||0)*100)/100).toFixed(2)+" Kg";
const pv    = (v,max) => Math.min(100,Math.round((v/Math.max(1,max))*100));
// Détection automatique des items à prix fixe (ex: Boîte ATM)
// Match exact sur "boite atm" (insensible à la casse et aux accents)
const _strip = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
const isATM = it => _strip(it?.nom) === "boite atm";
// Helpers de date — utilisent la date LOCALE (pas UTC) pour éviter les décalages de fuseau horaire
const _toLocalDate = d => {
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const today = () => _toLocalDate(new Date());
const ago   = n => { const d=new Date(); d.setDate(d.getDate()-n); return _toLocalDate(d); };

const blDuration = m => m<=99000?1:m<=199000?2:3;
const fmtTime = d => d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
const fmtDateTime = d => d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+fmtTime(d);
const fmtRem = ms => {
  if(ms<=0) return "Prêt à récupérer";
  const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000);
  if(h>0) return h+"h "+m+"m restantes";
  if(m>0) return m+"m "+s+"s restantes";
  return s+"s restantes";
};

const C={
  // Surfaces
  bg:        "#1f1f1f",   // fond global
  surface:   "#2a2a2a",   // cartes / cellules / inputs élevés
  surfaceAlt:"#252525",   // alternative légèrement plus foncée
  border:    "#3a3a3a",   // bordures, séparateurs
  borderSoft:"#323232",   // séparateurs internes plus discrets
  // Texte
  text:      "#ededed",   // texte principal
  muted:     "#a8a8a8",   // texte secondaire, labels
  dim:       "#6a6a6a",   // texte tertiaire, placeholders
  // Sémantique
  green:     "#7fb86b",   // OK / sain / argent propre
  red:       "#df5a44",   // danger / argent sale / coffres
  amber:     "#e3b94a",   // or — accent principal
  amberBright:"#f0c95c",  // hover de l'or
  blue:      "#7c9ed1",   // info, infos secondaires (toned down)
  // Alias historiques pour compat (mapping vers nouveaux tokens)
  accent:    "#e3b94a",
};
const card={background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"16px 18px"};
const S={card,inp:{width:"100%"},lbl:{fontSize:11,color:C.muted,marginBottom:3,fontWeight:500},sec:{fontSize:10,fontWeight:700,color:C.muted,margin:"0 0 14px",textTransform:"uppercase",letterSpacing:"0.12em"},row:{display:"flex",alignItems:"center",gap:8,marginBottom:8}};
const G=`*{box-sizing:border-box;}
@keyframes cv-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
@keyframes cv-pulse{0%,100%{opacity:0.4;}50%{opacity:1;}}
body{font-feature-settings:'tnum';font-variant-numeric:tabular-nums;}
select,input{background:#252525!important;border:1px solid #3a3a3a!important;border-radius:6px!important;padding:7px 11px!important;font-size:13px!important;color:#ededed!important;outline:none!important;box-shadow:inset 0 1px 3px rgba(0,0,0,0.3)!important;font-family:inherit;transition:border-color .15s;}
select{-webkit-appearance:auto!important;appearance:auto!important;cursor:pointer;}
select:focus,input:focus{border-color:#e3b94a!important;}
select option{background:#252525!important;color:#ededed!important;}
input::placeholder{color:#6a6a6a!important;}
button{background:#2a2a2a;border:1px solid #3a3a3a;border-radius:6px;padding:5px 12px;font-size:13px;color:#ededed;cursor:pointer;transition:background .12s,border-color .12s,transform .08s;white-space:nowrap;flex-shrink:0;font-family:inherit;}
button:hover{background:#333;border-color:#4a4a4a;}
button:active{transform:scale(0.97);}
div,span,p,h1,h2,h3,label{color:inherit;}
/* ── Responsive mobile (≤ 700px) ── */
@media (max-width:700px){
  /* Padding réduit du conteneur principal */
  [data-mobile="container"]{padding:0.8rem!important;}
  /* Header haut de page : nom de l'app + badges → empilés */
  [data-mobile="header"]{flex-direction:column!important;align-items:flex-start!important;gap:10px!important;}
  [data-mobile="header-right"]{width:100%!important;justify-content:flex-start!important;flex-wrap:wrap!important;}
  /* Grilles 4 colonnes → 2 colonnes */
  [data-mobile="grid-4"]{grid-template-columns:1fr 1fr!important;}
  /* Grilles 3 colonnes → 1 colonne */
  [data-mobile="grid-3"]{grid-template-columns:1fr!important;}
  /* Grilles 2 colonnes → 1 colonne */
  [data-mobile="grid-2"]{grid-template-columns:1fr!important;}
  /* Grilles "stack" : tout en colonne */
  [data-mobile="stack"]{grid-template-columns:1fr!important;}
  /* Filtres période → wrap propre */
  [data-mobile="period"]{flex-wrap:wrap!important;}
  [data-mobile="period"]>div:last-child{flex-wrap:wrap!important;width:100%!important;}
  /* Items list : nom doit pouvoir s'étirer, prix/poids/boutons compacts */
  [data-mobile="item-row"]{gap:6px!important;}
  [data-mobile="item-row"] [data-mobile="col-prix"]{width:55px!important;font-size:11px!important;}
  [data-mobile="item-row"] [data-mobile="col-poids"]{width:50px!important;font-size:11px!important;white-space:nowrap!important;}
  [data-mobile="item-row"] [data-mobile="col-actions"]{width:auto!important;gap:2px!important;}
  [data-mobile="item-row"] [data-mobile="col-actions"] button{padding:3px 6px!important;font-size:10px!important;}
  /* Total transaction : $ et Kg empilés */
  [data-mobile="total-row"]{flex-wrap:wrap!important;}
  [data-mobile="total-row"]>div:first-child>div:last-child{flex-direction:column!important;align-items:flex-start!important;gap:2px!important;}
  [data-mobile="total-row"]>div:first-child>div:last-child>div:nth-child(2){display:none!important;}
  /* Cartes membres tableau de bord : 2 par ligne max */
  [data-mobile="members-grid"]{grid-template-columns:1fr 1fr!important;gap:8px!important;}
  [data-mobile="members-grid"]>div{padding:10px 12px!important;}
  /* Stats cartes en haut du dashboard : 2 par ligne au lieu de 3 */
  [data-mobile="stats-grid"]{grid-template-columns:1fr 1fr!important;}
  /* Apparts vue grille : 1 colonne */
  /* Apparts vue grille : 3 colonnes desktop, 2 sur tablette, 1 sur mobile */
  [data-mobile="apparts-grid"]{grid-template-columns:1fr 1fr!important;}
  /* Bigbrother filtres : 2x2 puis wrap */
  [data-mobile="bb-filters"]{grid-template-columns:1fr 1fr!important;gap:6px!important;}
  [data-mobile="bb-filters"]>div>div{font-size:9px!important;margin-bottom:2px!important;}
  [data-mobile="bb-filters"] input,[data-mobile="bb-filters"] select{padding:5px 8px!important;font-size:12px!important;min-height:0!important;}
  /* Bigbrother header */
  [data-mobile="bb-header"]{flex-direction:column!important;align-items:flex-start!important;gap:6px!important;}
  /* Form de transaction : 4 cols → 2 cols */
  [data-mobile="tx-form-top"]{grid-template-columns:1fr 1fr!important;}
  /* Inputs partout : un peu plus compacts */
  input,select{font-size:14px!important;}
}
@media (max-width:420px){
  /* Très petits écrans : tout en 1 colonne, sauf bb-filters qui reste en 2x2 */
  [data-mobile="grid-4"],[data-mobile="grid-3"],[data-mobile="grid-2"],[data-mobile="tx-form-top"],[data-mobile="apparts-grid"]{grid-template-columns:1fr!important;}
  [data-mobile="stats-grid"]{grid-template-columns:1fr!important;}
  [data-mobile="members-grid"]{grid-template-columns:1fr!important;}
}`;

const PREVIEW=5;

// ── BIGBROTHER : helper pour logger toute action ──
// Catégories : money, tx, items, apparts, laundry, access, settings
async function logAction(userNom, category, action, message, details=null){
  try{
    await sb.from("audit_log").insert({
      user_nom: userNom||"?",
      category,
      action,
      message,
      details: details||null
    });
  }catch(e){ /* On n'interrompt jamais le flux principal sur une erreur de log */ }
}
// Helper pour formater proprement les diffs de valeurs
const diff = (a,b) => `<b>${a}</b> → <b>${b}</b>`; // Nombre d'items affichés par défaut dans les listes pliables Database

function Bar({val,max,color}){const p=pv(val,max),c=color||(p>85?C.red:p>60?C.amber:C.green);return <div style={{background:C.surfaceAlt,borderRadius:6,height:6,overflow:"hidden",border:"1px solid "+C.border}}><div style={{width:p+"%",background:c,height:"100%",borderRadius:6,transition:"width .4s"}}/></div>;}
function RoleBadge({role}){const a=role==="admin";return <span style={{fontSize:11,padding:"2px 9px",borderRadius:5,fontWeight:600,background:a?"rgba(224,85,85,0.15)":"rgba(74,158,222,0.15)",color:a?C.red:C.blue,border:"1px solid "+(a?"rgba(224,85,85,0.3)":"rgba(74,158,222,0.3)")}}>{a?"Admin":"Membre"}</span>;}
function Loader(){
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:14}}>
      <style>{`@keyframes cv-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}@keyframes cv-pulse{0%,100%{opacity:0.4;}50%{opacity:1;}}`}</style>
      <div style={{
        width:32,height:32,
        border:"3px solid "+C.surfaceAlt,
        borderTop:"3px solid "+C.text,
        borderRadius:"50%",
        animation:"cv-spin 0.8s linear infinite"
      }}/>
      <div style={{color:C.muted,fontSize:13,animation:"cv-pulse 1.4s ease-in-out infinite",fontWeight:500,letterSpacing:"0.04em"}}>Chargement...</div>
    </div>
  );
}

function Login({onLogin}){
  const [users,setUsers]=useState([]);
  const [userNom,setUserNom]=useState("");
  const [code,setCode]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [usersLoading,setUsersLoading]=useState(true);

  useEffect(()=>{
    sb.from("users").select("nom").order("nom").then(({data})=>{
      setUsers(data||[]);
      setUsersLoading(false);
    });
  },[]);

  async function go(){
    setErr("");
    if(!userNom){setErr("Sélectionne un utilisateur");return;}
    if(!code.trim()){setErr("Saisis ton code");return;}
    setLoading(true);
    const {data}=await sb.from("users").select("*").ilike("nom",userNom).eq("code",code.trim()).maybeSingle();
    if(data) onLogin(data); else setErr("Identifiants incorrects");
    setLoading(false);
  }

  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1rem",paddingTop:"3vh"}}>
    <style>{G}</style>
    <div style={{marginBottom:24,textAlign:"center"}}>
      <img src="/SClogo.png" alt="Silent Covenant" style={{width:80,height:80,margin:"0 auto 8px",display:"block",objectFit:"contain"}}/>
      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:6}}>Accès sécurisé</div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.text,margin:0}}>Compta Covenant</h1>
    </div>
    <div style={{...card,width:"100%",maxWidth:360,padding:"24px"}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Utilisateur</div>
      <select value={userNom} onChange={e=>setUserNom(e.target.value)} disabled={usersLoading} style={{width:"100%",marginBottom:14,fontSize:14,padding:"9px 11px"}}>
        <option value="">{usersLoading?"Chargement...":"— sélectionner —"}</option>
        {users.map(u=><option key={u.nom} value={u.nom}>{u.nom}</option>)}
      </select>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Code d'accès</div>
      <input type="password" placeholder="• • • • • •" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={{width:"100%",marginBottom:err?8:14,fontSize:20,letterSpacing:"0.35em",textAlign:"center"}}/>
      {err&&<div style={{fontSize:12,color:C.red,marginBottom:12,fontWeight:500,textAlign:"center"}}>{err}</div>}
      <button onClick={go} disabled={loading||usersLoading} style={{width:"100%",padding:"11px",fontWeight:700,fontSize:14,background:loading?"#585858":C.amber,color:loading?C.text:"#1a1a1a",border:"1px solid "+(loading?"#686868":C.amber),borderRadius:6,opacity:loading?0.7:1,cursor:loading?"wait":"pointer",transition:"background .2s"}}>
        {loading?<><span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"cv-spin 0.6s linear infinite",verticalAlign:"middle",marginRight:8}}/>Connexion...</>:"Connexion"}
      </button>
    </div>
  </div>;
}

// ── Gestion de la session persistante (24h) ──
const SESSION_KEY = "covenant_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures

function saveSession(user){
  try {
    const session = { user, expiresAt: Date.now() + SESSION_DURATION_MS };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch(e) { /* localStorage indisponible : ignorer */ }
}

function loadSession(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return null;
    const session = JSON.parse(raw);
    if(!session || !session.user || !session.expiresAt) return null;
    if(Date.now() > session.expiresAt){
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session.user;
  } catch(e){ return null; }
}

function clearSession(){
  try { localStorage.removeItem(SESSION_KEY); } catch(e){}
}

export default function App(){
  // Initialisation depuis la session persistante (24h)
  const [cu,setCu]=useState(()=>loadSession());

  // Wrapper qui sauvegarde la session quand on se connecte
  const handleLogin = useCallback((user)=>{
    saveSession(user);
    setCu(user);
  },[]);

  // Wrapper qui nettoie la session à la déconnexion
  const handleLogout = useCallback(()=>{
    clearSession();
    setCu(null);
  },[]);

  // Si l'utilisateur est mis à jour (changement de password par ex.) : refresh session
  const handleUpdateCu = useCallback((updated)=>{
    if(typeof updated === "function"){
      setCu(prev=>{
        const next = updated(prev);
        if(next) saveSession(next);
        else clearSession();
        return next;
      });
    } else {
      if(updated) saveSession(updated);
      else clearSession();
      setCu(updated);
    }
  },[]);

  if(!cu) return <Login onLogin={handleLogin}/>;
  return <Main cu={cu} setCu={handleUpdateCu} onLogout={handleLogout}/>;
}

// ── Détecte le séparateur CSV : si ';' présent dans la première ligne, c'est lui (Excel FR) ──
function detectSep(text){
  const firstLine=text.split(/\r?\n/)[0]||"";
  let inQ=false, hasSemi=false;
  for(const c of firstLine){
    if(c==='"')inQ=!inQ;
    else if(c===';'&&!inQ){hasSemi=true;break;}
  }
  return hasSemi?";":",";
}
function parseCSV(text,sep){
  const SEP=sep||detectSep(text);
  const rows=[]; let cur=[], val="", inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'&&text[i+1]==='"'){val+='"';i++;}
      else if(c==='"'){inQ=false;}
      else val+=c;
    }else{
      if(c==='"'){inQ=true;}
      else if(c===SEP){cur.push(val);val="";}
      else if(c==='\n'){cur.push(val);rows.push(cur);cur=[];val="";}
      else if(c==='\r'){}
      else val+=c;
    }
  }
  if(val||cur.length){cur.push(val);rows.push(cur);}
  if(rows[0]&&rows[0][0]&&rows[0][0].charCodeAt(0)===0xFEFF){
    rows[0][0]=rows[0][0].slice(1);
  }
  return {rows:rows.filter(r=>r.length&&!(r.length===1&&!r[0].trim())), sep:SEP};
}
function parseNum(s){
  if(s==null)return 0;
  const t=String(s).trim().replace(/\s/g,"").replace(",",".");
  return parseFloat(t)||0;
}
function toCSVItems(items){
  const esc=v=>{const s=String(v??"");return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const num=v=>String(v??0).replace(".",",");
  return "\uFEFFnom;prix;poids\n"+items.map(it=>esc(it.nom)+";"+num(it.prix)+";"+num(it.poids||0)).join("\n");
}
function toCSVPMs(pms,cats){
  const esc=v=>{const s=String(v??"");return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  return "\uFEFFnom;categorie\n"+pms.map(p=>{
    const c=cats.find(x=>x.id===p.categorie_id);
    return esc(p.nom)+";"+esc(c?c.nom:"");
  }).join("\n");
}
function toCSVUsers(users){
  const esc=v=>{const s=String(v??"");return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  return "\uFEFFnom;code;role\n"+users.map(u=>esc(u.nom)+";"+esc(u.code)+";"+esc(u.role||"membre")).join("\n");
}
function downloadCSV(filename,content){
  const blob=new Blob([content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Section pliable d'items avec recherche (Transactions) ──
function ItemsSection({title,pct,prixFixeCat,items,qtes,onChangeQte,accent,dest}){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const visibleItems=useMemo(()=>items.filter(it=>it.visible!==false),[items]);
  const filtered=useMemo(()=>{
    if(!q.trim())return visibleItems;
    const s=q.toLowerCase();
    return visibleItems.filter(it=>it.nom.toLowerCase().includes(s));
  },[visibleItems,q]);
  const selCount=useMemo(()=>visibleItems.reduce((n,it)=>n+((+(qtes[it.id])||0)>0?1:0),0),[visibleItems,qtes]);
  const accentColor=accent||C.text;
  const bgHeader=accent?"rgba(212,132,10,0.08)":C.surfaceAlt;
  const borderHeader=accent?"rgba(212,132,10,0.25)":C.border;

  return (
    <div style={{marginBottom:8}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",padding:"9px 12px",background:bgHeader,border:"1px solid "+borderHeader,borderRadius:8,transition:"background .15s",userSelect:"none"}}
        onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.15)"}
        onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:accent||C.muted,transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform .25s",display:"inline-block"}}>▶</span>
          <span style={{fontSize:11,fontWeight:700,color:accentColor,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            {title}{pct>0&&" · "+pct+"%"}
          </span>
          {selCount>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:4,fontWeight:600,background:"rgba(61,191,143,0.15)",color:C.green,border:"1px solid rgba(61,191,143,0.3)"}}>{selCount} sélectionné{selCount>1?"s":""}</span>}
        </div>
        <span style={{fontSize:11,color:C.muted}}>
          {open?(filtered.length+" / "+visibleItems.length+" items"):(visibleItems.length+" items")}
        </span>
      </div>
      {open&&(
        <div style={{padding:"10px 4px 6px",borderLeft:accent?"3px solid rgba(212,132,10,0.4)":"none",marginLeft:accent?2:0,paddingLeft:accent?12:4,background:accent?"rgba(212,132,10,0.03)":"transparent",borderRadius:accent?"0 0 8px 0":0}}>
          <input type="text" placeholder="🔍 Rechercher un item..." value={q} onChange={e=>setQ(e.target.value)}
            style={{width:"100%",marginBottom:10,fontSize:13,padding:"8px 11px"}}/>
          <div style={{maxHeight:380,overflowY:"auto",paddingRight:4}}>
            {filtered.length===0
              ?<div style={{textAlign:"center",padding:30,color:C.muted,fontSize:11,fontStyle:"italic"}}>Aucun item trouvé</div>
              :filtered.map(it=>{
                // Prix payé : si Boîte ATM (détection auto par nom) → prix fixe de la catégorie PM
                // Sinon : prix de revente × % de la PM
                let prixPaye = null;
                const isItATM = isATM(it);
                if(isItATM){
                  prixPaye = (prixFixeCat>0) ? Math.round(prixFixeCat) : null;
                } else if(pct>0){
                  prixPaye = Math.round(it.prix * pct / 100);
                }
                return (
                <div key={it.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 4px",borderBottom:"1px solid #404040"}}>
                  <span style={{flex:1,fontSize:13,color:C.text}}>
                    {it.nom}
                    <span style={{fontSize:11,color:C.muted,marginLeft:5}}>
                      ({prixPaye!==null ? <span style={{color:C.green,fontWeight:600}}>{fmt(prixPaye)}</span> : <span style={{fontStyle:"italic"}}>{dest==="gang"?"choisir un Gang":"choisir une PM"}</span>}
                      {it.poids>0&&" · "+fmtKgD(it.poids)})
                    </span>
                  </span>
                  <input type="number" min="0" placeholder="0" value={qtes[it.id]||""} onChange={e=>onChangeQte(it.id,e.target.value)}
                    style={{width:72,textAlign:"center"}}/>
                </div>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Carte d'un compte membre avec save sur blur / Entrée ──
function MemberCard({m,low,setMembers,onLog,dense,idx,total}){
  // Helper : formater un nombre avec des espaces tous les 3 chiffres
  const fmtNum = (n) => {
    const s = String(n||"");
    // Retire tout sauf chiffres et signe -
    const clean = s.replace(/[^\d-]/g,"");
    if(!clean) return "";
    const neg = clean.startsWith("-");
    const digits = clean.replace(/-/g,"");
    if(!digits) return neg?"-":"";
    return (neg?"-":"") + digits.replace(/\B(?=(\d{3})+(?!\d))/g," ");
  };
  // Helper : extraire la valeur numérique brute (sans espaces)
  const parseNum = (s) => {
    const clean = String(s||"").replace(/[^\d-]/g,"");
    return +clean || 0;
  };

  const [val,setVal]=useState(fmtNum(m.solde));
  const [status,setStatus]=useState(null);
  const [dirty,setDirty]=useState(false);

  useEffect(()=>{
    if(!dirty) setVal(fmtNum(m.solde));
  },[m.solde,dirty]);

  async function save(){
    const s=Math.round(parseNum(val));
    if(s===m.solde){setDirty(false);setVal(fmtNum(m.solde));return;}
    const before=m.solde;
    setStatus("saving");
    const {error}=await sb.from("membres_comptes").update({solde:s}).eq("id",m.id);
    if(error){
      setStatus("error");
      setTimeout(()=>setStatus(null),2500);
      return;
    }
    setMembers(ms=>ms.map(x=>x.id===m.id?{...x,solde:s}:x));
    setDirty(false);
    setVal(fmtNum(s));
    setStatus("saved");
    setTimeout(()=>setStatus(null),1500);
    if(onLog) onLog("money","balance_update",`a modifié le solde de <b>${m.nom}</b> : ${`<b>${fmt(before)}</b> → <b>${fmt(s)}</b>`}`);
  }

  function handleChange(e){
    // Reformate à la volée pendant la saisie
    const formatted = fmtNum(e.target.value);
    setVal(formatted);
    setDirty(true);
  }

  // Mode dense : cellule de tableau (bordures gérées par le grid parent via gap)
  if(dense){
    return (
      <div style={{
        background:low?"rgba(223,90,68,0.06)":C.surface,
        padding:"12px 14px",
        transition:"background .2s"
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:700,color:low?C.red:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>{m.nom}</span>
          {status==="saving"&&<span style={{fontSize:8,color:C.blue,fontWeight:600}}>•••</span>}
          {status==="saved"&&<span style={{fontSize:8,color:C.green,fontWeight:600}}>✓</span>}
          {status==="error"&&<span style={{fontSize:8,color:C.red,fontWeight:600}}>⚠</span>}
          {dirty&&!status&&<span style={{fontSize:8,color:C.amber,fontWeight:600}}>•</span>}
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:3}}>
          <input
            type="text"
            inputMode="numeric"
            value={val}
            onChange={handleChange}
            onBlur={save}
            onKeyDown={e=>{if(e.key==="Enter"){e.target.blur();}}}
            style={{flex:1,fontSize:18,fontWeight:700,border:"none!important",background:"transparent!important",color:low?C.red:C.text,padding:"0!important",minWidth:0,boxShadow:"none!important"}}
          />
          <span style={{fontSize:11,color:C.dim,fontWeight:500}}>$</span>
        </div>
      </div>
    );
  }

  // Mode classique (card avec border)
  return (
    <div style={{
      background:low?"rgba(223,90,68,0.06)":C.surface,
      border:"1px solid "+(low?"rgba(223,90,68,0.4)":dirty?"rgba(124,158,209,0.5)":C.border),
      borderRadius:8,
      padding:"14px 16px",
      transition:"all .25s"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:15,color:low?C.red:C.text,fontWeight:600}}>{m.nom}</div>
        {status==="saving"&&<span style={{fontSize:9,color:C.blue,fontWeight:600,textTransform:"uppercase"}}>•••</span>}
        {status==="saved"&&<span style={{fontSize:9,color:C.green,fontWeight:600,textTransform:"uppercase"}}>✓ Sauvé</span>}
        {status==="error"&&<span style={{fontSize:9,color:C.red,fontWeight:600,textTransform:"uppercase"}}>⚠ Erreur</span>}
        {dirty&&!status&&<span style={{fontSize:9,color:C.amber,fontWeight:600,textTransform:"uppercase"}}>• Modifié</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <input
          type="text"
          inputMode="numeric"
          value={val}
          onChange={handleChange}
          onBlur={save}
          onKeyDown={e=>{if(e.key==="Enter"){e.target.blur();}}}
          style={{flex:1,fontSize:20,fontWeight:700,border:"none!important",background:"transparent!important",color:low?C.red:C.text,padding:"0!important",minWidth:0,boxShadow:"none!important"}}
        />
        <span style={{fontSize:14,color:low?C.red:C.muted,fontWeight:600}}>$</span>
      </div>
      {low&&<div style={{fontSize:10,color:C.red,marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>⚠ Solde faible</div>}
    </div>
  );
}

// ── Carte d'un appart avec save sur blur / Entrée (anti-lag Realtime) ──
function AppartCard({a,updateAppart,copied,setCopied}){
  const ac=getCat(a.categorie);
  const [coffre,setCoffre]=useState(String(a.coffre));
  const [stock,setStock]=useState(String(a.stock));
  const [coffreDirty,setCoffreDirty]=useState(false);
  const [stockDirty,setStockDirty]=useState(false);
  const [coffreStatus,setCoffreStatus]=useState(null);
  const [stockStatus,setStockStatus]=useState(null);

  // Synchro auto si l'appart change ailleurs (Realtime), sauf si l'user est en train de taper
  useEffect(()=>{ if(!coffreDirty) setCoffre(String(a.coffre)); },[a.coffre,coffreDirty]);
  useEffect(()=>{ if(!stockDirty) setStock(String(a.stock));   },[a.stock,stockDirty]);

  async function saveCoffre(){
    const v=Math.round(+coffre||0);
    if(v===a.coffre){setCoffreDirty(false);return;}
    setCoffreStatus("saving");
    await updateAppart(a.id,{coffre:v});
    setCoffreDirty(false);
    setCoffreStatus("saved");
    setTimeout(()=>setCoffreStatus(null),1200);
  }
  async function saveStock(){
    const v=Math.round(+stock||0);
    if(v===a.stock){setStockDirty(false);return;}
    setStockStatus("saving");
    await updateAppart(a.id,{stock:v});
    setStockDirty(false);
    setStockStatus("saved");
    setTimeout(()=>setStockStatus(null),1200);
  }

  const lblColor=(dirty,status)=>{
    if(status==="saving")return C.blue;
    if(status==="saved")return C.green;
    if(dirty)return C.amber;
    return C.muted;
  };
  const borderColor=(dirty,status)=>{
    if(status==="saved")return "rgba(61,191,143,0.6)";
    if(dirty||status==="saving")return "rgba(212,146,10,0.6)";
    return "#585858";
  };

  return (
    <div style={{...card,borderLeft:"3px solid "+ac.color,padding:"14px 16px"}}>
      {/* Header : nom + catégorie + code, séparé par une fine ligne */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:14,paddingBottom:10,borderBottom:"1px solid "+C.border}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <span style={{fontWeight:700,fontSize:15,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{a.nom}</span>
          <span style={{flexShrink:0,fontSize:9,padding:"2px 8px",fontWeight:700,background:ac.bg,color:ac.color,border:"1px solid "+ac.color+"66",borderRadius:20}}>{ac.label}</span>
        </div>
        {a.code?(
          <button onClick={()=>{navigator.clipboard?.writeText(a.code);setCopied(a.id);setTimeout(()=>setCopied(null),1500);}}
            style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"4px 9px",background:C.surfaceAlt,border:"1px solid "+(copied===a.id?C.green:C.border),borderRadius:6,color:copied===a.id?C.green:C.muted,transition:"all .2s"}}>
            <span style={{fontFamily:"monospace",fontSize:12,color:copied===a.id?C.green:C.text,letterSpacing:"0.5px"}}>{a.code}</span>
            <span style={{fontSize:11}}>{copied===a.id?"✓":"⧉"}</span>
          </button>
        ):(
          <div style={{flexShrink:0,padding:"4px 9px",background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:6,fontSize:11,color:C.muted,fontStyle:"italic"}}>—</div>
        )}
      </div>
      {/* Bloc Stocks */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,color:lblColor(coffreDirty,coffreStatus),fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Coffre</span>
            {coffreStatus==="saving"&&<span style={{fontSize:9,color:C.blue,fontWeight:600}}>•••</span>}
            {coffreStatus==="saved"&&<span style={{fontSize:9,color:C.green,fontWeight:600}}>✓</span>}
            {coffreDirty&&!coffreStatus&&<span style={{fontSize:9,color:C.amber,fontWeight:600}}>•</span>}
          </div>
          <input type="number" value={coffre}
            onChange={e=>{setCoffre(e.target.value);setCoffreDirty(true);}}
            onBlur={saveCoffre}
            onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}
            style={{width:"100%",fontSize:15,fontWeight:600,padding:"7px 10px",border:"1px solid "+borderColor(coffreDirty,coffreStatus)+"!important"}}/>
          <Bar val={a.coffre} max={a.max_coffre}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,color:lblColor(stockDirty,stockStatus),fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Stock</span>
            {stockStatus==="saving"&&<span style={{fontSize:9,color:C.blue,fontWeight:600}}>•••</span>}
            {stockStatus==="saved"&&<span style={{fontSize:9,color:C.green,fontWeight:600}}>✓</span>}
            {stockDirty&&!stockStatus&&<span style={{fontSize:9,color:C.amber,fontWeight:600}}>•</span>}
          </div>
          <input type="number" value={stock}
            onChange={e=>{setStock(e.target.value);setStockDirty(true);}}
            onBlur={saveStock}
            onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}
            style={{width:"100%",fontSize:15,fontWeight:600,padding:"7px 10px",border:"1px solid "+borderColor(stockDirty,stockStatus)+"!important"}}/>
          <Bar val={a.stock} max={a.max_stock}/>
        </div>
      </div>
    </div>
  );
}

// Bouton + popover compact pour ajouter un item au stock Londres
function LondresStockAddInline({stockLondres,itemsPM,itemsG,onAddStockItem}){
  const [open, setOpen] = useState(false);
  const [addType, setAddType] = useState("pm");
  const [addItemId, setAddItemId] = useState("");
  const [addSeuil, setAddSeuil] = useState("5");

  const availableItems = useMemo(()=>{
    const usedKeys = new Set(stockLondres.map(s => s.item_type+":"+s.item_id));
    const list = addType==="pm" ? itemsPM : itemsG;
    return list.filter(i => !usedKeys.has(addType+":"+i.id) && i.visible !== false);
  },[stockLondres, itemsPM, itemsG, addType]);

  function handleAdd(){
    const item = availableItems.find(i => i.id === addItemId);
    if(!item) return;
    onAddStockItem(item, addType, +addSeuil||5);
    setAddItemId("");
    setAddSeuil("5");
  }

  if(!open){
    return (
      <button onClick={()=>setOpen(true)} style={{fontSize:11,padding:"5px 12px",fontWeight:700,color:C.amber,border:"1px solid "+C.border}}>
        + Item
      </button>
    );
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:6,padding:"6px 8px"}}>
      <select value={addType} onChange={e=>{setAddType(e.target.value);setAddItemId("");}} style={{fontSize:11,padding:"3px 6px"}}>
        <option value="pm">PM</option>
        <option value="gang">Gang</option>
      </select>
      <select value={addItemId} onChange={e=>setAddItemId(e.target.value)} style={{fontSize:11,padding:"3px 6px",minWidth:140}}>
        <option value="">— item —</option>
        {availableItems.map(i => <option key={i.id} value={i.id}>{i.nom}</option>)}
      </select>
      <input type="number" min="0" placeholder="Seuil" value={addSeuil} onChange={e=>setAddSeuil(e.target.value)} style={{fontSize:11,width:60,textAlign:"center",padding:"3px 6px"}} title="Seuil d'alerte"/>
      <button onClick={handleAdd} disabled={!addItemId} style={{fontSize:11,padding:"4px 10px",fontWeight:700,color:addItemId?C.green:C.dim,opacity:addItemId?1:0.5}}>OK</button>
      <button onClick={()=>setOpen(false)} style={{fontSize:11,padding:"3px 6px",color:C.muted}}>×</button>
    </div>
  );
}

// ── Formulaires d'ajout STABLES (hors de Main) pour préserver le focus malgré Realtime ──
const AddPMForm = memo(function AddPMForm({catsPM,pmGroupes,onAdd,isAdmin}){
  const [nom,setNom]=useState("");
  const [catId,setCatId]=useState("");
  const [numero,setNumero]=useState("");
  const [lieu,setLieu]=useState("");
  const [groupeId,setGroupeId]=useState("");
  const [note,setNote]=useState("");
  // On garde la dernière version de onAdd dans une ref pour qu'elle soit toujours à jour
  // sans déclencher de re-render quand le parent re-render
  const onAddRef = useRef(onAdd);
  useEffect(()=>{onAddRef.current = onAdd;});
  const canSubmit = !!(nom.trim() && catId);
  async function submit(){
    if(!canSubmit)return;
    await onAddRef.current({nom:nom.trim(), categorie_id:catId, numero:numero||null, lieu_taff:lieu||null, groupe_id:groupeId||null, note:note||null});
    setNom(""); setCatId(""); setNumero(""); setLieu(""); setGroupeId(""); setNote("");
  }
  return (
    <>
      <div style={{display:"flex",flexDirection:"column",gap:8,borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={S.lbl}>Nom <span style={{color:C.red}}>*</span></div><input style={S.inp} placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div><div style={S.lbl}>Catégorie <span style={{color:C.red}}>*</span></div><select style={S.inp} value={catId} onChange={e=>setCatId(e.target.value)}><option value="">—</option>{catsPM.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={S.lbl}>Numéro <span style={{color:C.dim,fontWeight:400}}>(optionnel)</span></div><input style={S.inp} placeholder="Numéro" value={numero} onChange={e=>setNumero(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div><div style={S.lbl}>Lieu de taff <span style={{color:C.dim,fontWeight:400}}>(optionnel)</span></div><input style={S.inp} placeholder="Lieu" value={lieu} onChange={e=>setLieu(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"end"}}>
          <div>
            <div style={S.lbl}>Groupe <span style={{color:C.dim,fontWeight:400}}>(optionnel)</span></div>
            <select style={S.inp} value={groupeId} onChange={e=>setGroupeId(e.target.value)}><option value="">— aucun groupe —</option>{(pmGroupes||[]).map(g=><option key={g.id} value={g.id}>👥 {g.nom}</option>)}</select>
          </div>
          <div>
            <div style={S.lbl}>Note <span style={{color:C.dim,fontWeight:400}}>(optionnel)</span></div>
            <input
              style={S.inp}
              placeholder="Note libre…"
              value={note}
              onChange={e=>setNote(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()}
            />
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={submit} disabled={!canSubmit} title={canSubmit?"Ajouter cette PM":"Renseigne au moins le nom et la catégorie"} style={{fontWeight:700,color:canSubmit?C.green:C.dim,padding:"7px 16px",cursor:canSubmit?"pointer":"not-allowed",opacity:canSubmit?1:0.5}}>+ Ajouter</button>
        </div>
      </div>
    </>
  );
}, (prev, next) => {
  // Ignorer onAdd dans la comparaison (toujours géré via ref)
  // Re-render seulement si les listes changent vraiment
  if(prev.isAdmin !== next.isAdmin) return false;
  if(prev.catsPM !== next.catsPM) return false;
  if(prev.pmGroupes !== next.pmGroupes) return false;
  return true; // pas de re-render
});

function AddGangForm({catsGang,onAdd}){
  const [nom,setNom]=useState("");
  const [catId,setCatId]=useState("");
  async function submit(){
    if(!nom||!catId)return;
    await onAdd(nom,catId);
    setNom(""); setCatId("");
  }
  return (
    <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
      <div style={{flex:1}}><div style={S.lbl}>Nom</div><input style={S.inp} placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
      <div><div style={S.lbl}>Catégorie</div><select value={catId} onChange={e=>setCatId(e.target.value)}><option value="">—</option>{catsGang.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
      <button onClick={submit} style={{fontWeight:700,color:C.green}}>+ Ajouter</button>
    </div>
  );
}

function AddItemForm({onAdd}){
  const [nom,setNom]=useState("");
  const [prix,setPrix]=useState("");
  const [poids,setPoids]=useState("");
  async function submit(){
    if(!nom||!prix)return;
    await onAdd(nom,prix,poids);
    setNom(""); setPrix(""); setPoids("");
  }
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4,flexWrap:"wrap"}}>
      <input style={{flex:"1 1 100%",minWidth:0}} placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <input type="number" style={{flex:"1 1 80px",minWidth:0}} placeholder="Prix" value={prix} onChange={e=>setPrix(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <input type="number" step="0.01" min="0" style={{flex:"1 1 80px",minWidth:0}} placeholder="Poids" value={poids} onChange={e=>setPoids(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <button onClick={submit} style={{fontWeight:700,color:C.green}}>+ Ajouter</button>
    </div>
  );
}

function AddCatForm({onAdd,showPrixFixe}){
  const [nom,setNom]=useState("");
  const [pct,setPct]=useState("");
  const [taux,setTaux]=useState("");
  const [prixFixe,setPrixFixe]=useState("");
  async function submit(){
    if(!nom)return;
    await onAdd(nom,pct,taux,prixFixe);
    setNom(""); setPct(""); setTaux(""); setPrixFixe("");
  }
  const gridCols = showPrixFixe ? "1fr 70px 80px 80px auto" : "1fr 80px 90px auto";
  return (
    <div style={{display:"grid",gridTemplateColumns:gridCols,gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
      <input style={S.inp} placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <input type="number" style={S.inp} placeholder="%" value={pct} onChange={e=>setPct(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <input type="number" style={S.inp} placeholder="$/liasse" value={taux} onChange={e=>setTaux(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      {showPrixFixe&&<input type="number" style={S.inp} placeholder="$ ATM" value={prixFixe} onChange={e=>setPrixFixe(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>}
      <button onClick={submit} style={{fontWeight:700,color:C.green}}>+</button>
    </div>
  );
}

// Formulaire d'édition d'une PM stable (hors de Main pour éviter perte de focus à chaque Realtime)
function EditPMForm({pm,catsPM,pmGroupes,onSave,onCancel}){
  const [nom,setNom]=useState(pm.nom||"");
  const [numero,setNumero]=useState(pm.numero||"");
  const [lieu,setLieu]=useState(pm.lieu_taff||"");
  const [catId,setCatId]=useState(pm.categorie_id||"");
  const [groupeId,setGroupeId]=useState(pm.groupe_id||"");
  const [note,setNote]=useState(pm.note||"");
  function handleSave(){
    onSave({...pm, nom, numero:numero||null, lieu_taff:lieu||null, categorie_id:catId, groupe_id:groupeId||null, note:note||null});
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10,padding:"10px 12px",background:C.surfaceAlt,borderRadius:6}}>
      <input placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <input placeholder="Numéro" value={numero} onChange={e=>setNumero(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()}/>
        <input placeholder="Lieu de taff" value={lieu} onChange={e=>setLieu(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <select value={catId} onChange={e=>setCatId(e.target.value)}>
          <option value="">— catégorie —</option>
          {catsPM.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={groupeId} onChange={e=>setGroupeId(e.target.value)}>
          <option value="">— aucun groupe —</option>
          {pmGroupes.map(g=><option key={g.id} value={g.id}>👥 {g.nom}</option>)}
        </select>
      </div>
      <input
        placeholder="Note libre (optionnel)"
        value={note}
        onChange={e=>setNote(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&handleSave()}
      />
      <div style={{display:"flex",justifyContent:"flex-end",gap:6}}>
        <button onClick={onCancel} style={{fontSize:11,color:C.muted}}>Annuler</button>
        <button onClick={handleSave} style={{fontSize:11,color:C.green,fontWeight:700}}>OK</button>
      </div>
    </div>
  );
}

// Formulaire d'ajout de groupe stable (hors de Main)
function AddGroupeForm({onAdd}){
  const [nom,setNom]=useState("");
  async function submit(){
    if(!nom.trim())return;
    await onAdd(nom.trim());
    setNom("");
  }
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:6}}>
      <input style={{flex:1}} placeholder="Nom du groupe (ex: Valtid + pote)" value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <button onClick={submit} style={{fontWeight:700,color:C.green}}>+ Créer</button>
    </div>
  );
}

// Formulaire d'édition d'un groupe stable (hors de Main)
function EditGroupeForm({groupe,onSave,onCancel}){
  const [nom,setNom]=useState(groupe.nom||"");
  function handleSave(){
    if(!nom.trim())return;
    onSave({...groupe, nom:nom.trim()});
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"8px 10px",background:C.surfaceAlt,borderRadius:6}}>
      <input style={{flex:1}} value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <button onClick={onCancel} style={{fontSize:11,color:C.muted}}>Annuler</button>
      <button onClick={handleSave} style={{fontSize:11,color:C.green,fontWeight:700}}>OK</button>
    </div>
  );
}

// Composant stable pour la barre de recherche PM (hors de Main pour éviter perte de focus)
const PMSearchInput = memo(function PMSearchInput({initialValue,onChange}){
  const [val,setVal]=useState(initialValue||"");
  const onChangeRef = useRef(onChange);
  useEffect(()=>{onChangeRef.current = onChange;});
  // Notifier le parent à chaque changement (debounce léger via useEffect)
  useEffect(()=>{
    const t = setTimeout(()=>{ onChangeRef.current(val); }, 100);
    return ()=>clearTimeout(t);
  },[val]);
  return (
    <div style={{position:"relative",flex:1}}>
      <input
        type="text"
        placeholder="🔍 Rechercher par nom, numéro, lieu ou note..."
        value={val}
        onChange={e=>setVal(e.target.value)}
        style={{width:"100%",fontSize:12,padding:"6px 10px"}}
      />
      {val&&(
        <button
          onClick={()=>setVal("")}
          title="Effacer la recherche"
          style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",fontSize:11,padding:"2px 8px",border:"none",background:"transparent",color:C.muted,cursor:"pointer"}}
        >×</button>
      )}
    </div>
  );
}, () => true); // Jamais re-render depuis le parent : le state est totalement local

// Formulaire d'édition d'une CATÉGORIE (PM ou Gang) stable hors de Main
function EditCatForm({cat,onSave,onCancel,showPrixFixe}){
  const [nom,setNom]=useState(cat.nom||"");
  const [pct,setPct]=useState(cat.pct_objets??0);
  const [taux,setTaux]=useState(cat.taux_liasse??0);
  const [prixFixe,setPrixFixe]=useState(cat.prix_fixe??0);
  function handleSave(){
    const payload = {...cat, nom, pct_objets:+pct||0, taux_liasse:+taux||0};
    if(showPrixFixe) payload.prix_fixe = +prixFixe||0;
    onSave(payload);
  }
  return (
    <>
      <input style={S.inp} value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <input type="number" style={S.inp} value={pct} onChange={e=>setPct(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <input type="number" style={S.inp} value={taux} onChange={e=>setTaux(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      {showPrixFixe&&<input type="number" style={S.inp} value={prixFixe} onChange={e=>setPrixFixe(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}} placeholder="0"/>}
      <button onClick={handleSave} style={{color:C.green,fontWeight:700}}>OK</button>
    </>
  );
}

// Formulaire d'édition d'un GANG stable hors de Main
function EditGangForm({gang,catsGang,onSave,onCancel}){
  const [nom,setNom]=useState(gang.nom||"");
  const [catId,setCatId]=useState(gang.categorie_id||"");
  function handleSave(){
    onSave({...gang, nom, categorie_id:catId});
  }
  return (
    <>
      <input style={{flex:1}} value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <select value={catId} onChange={e=>setCatId(e.target.value)}>
        <option value="">—</option>
        {catsGang.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
      <button onClick={handleSave} style={{color:C.green,fontWeight:700}}>OK</button>
    </>
  );
}

// Formulaire d'édition d'un ITEM (PM ou Gang) stable hors de Main
function EditItemForm({item,onSave,onCancel,isPM}){
  const [nom,setNom]=useState(item.nom||"");
  const [prix,setPrix]=useState(item.prix??0);
  const [poids,setPoids]=useState(item.poids||0);
  function handleSave(){
    onSave({...item, nom, prix:+prix||0, poids:+poids||0});
  }
  return (
    <>
      <input style={{flex:1,minWidth:0}} value={nom} onChange={e=>setNom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <input data-mobile="col-prix" type="number" style={{width:70}} value={prix} onChange={e=>setPrix(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <input data-mobile="col-poids" type="number" step="0.01" min="0" style={{width:65}} value={poids} onChange={e=>setPoids(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onCancel();}}/>
      <button onClick={handleSave} style={{color:C.green,fontWeight:700}}>OK</button>
    </>
  );
}

// Formulaire d'ajout d'une commande reçue (gang + multi-items + note)
const AddCmdRecueForm = memo(function AddCmdRecueForm({gangs, itemsPM, itemsG, stockLondres, onAdd}){
  const [gangId, setGangId] = useState("");
  const [note, setNote] = useState("");
  const [qtes, setQtes] = useState({}); // {stockId: qte}
  const onAddRef = useRef(onAdd);
  useEffect(()=>{onAddRef.current = onAdd;});

  // Items disponibles = ceux dans le stock Londres (avec leurs infos)
  const stockItems = stockLondres.map(s => {
    const item = s.item_type === "pm"
      ? itemsPM.find(i => i.id === s.item_id)
      : itemsG.find(i => i.id === s.item_id);
    return {...s, item};
  }).filter(s => s.item);

  const totalQte = Object.values(qtes).reduce((a,b)=>a+(+b||0), 0);
  const canSubmit = !!(gangId && totalQte > 0);

  async function submit(){
    if(!canSubmit) return;
    const gang = gangs.find(g => g.id === gangId);
    const lignes = stockItems
      .filter(s => (+qtes[s.id]||0) > 0)
      .map(s => ({
        item_id: s.item_id,
        item_type: s.item_type,
        item_nom: s.item_nom,
        qte: +qtes[s.id]||0
      }));
    await onAddRef.current({
      gang_id: gangId,
      gang_nom: gang?.nom || "?",
      lignes: lignes,
      note: note || null
    });
    setGangId(""); setNote(""); setQtes({});
  }

  return (
    <div style={{background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:8,padding:14}}>
      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Nouvelle commande reçue</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div>
          <div style={S.lbl}>Client (gang) <span style={{color:C.red}}>*</span></div>
          <select value={gangId} onChange={e=>setGangId(e.target.value)} style={{width:"100%"}}>
            <option value="">— choisir —</option>
            {gangs.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div>
          <div style={S.lbl}>Note <span style={{color:C.dim,fontWeight:400}}>(optionnel)</span></div>
          <input type="text" placeholder="Note libre..." value={note} onChange={e=>setNote(e.target.value)} style={{width:"100%"}}/>
        </div>
      </div>
      {stockItems.length>0 && (
        <>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Items à livrer</div>
          <div style={{maxHeight:240,overflowY:"auto",borderTop:"1px solid "+C.border,borderBottom:"1px solid "+C.border,marginBottom:10}}>
            {stockItems.map(s => (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 4px",borderBottom:"1px solid #404040"}}>
                <span style={{flex:1,fontSize:13,color:C.text}}>
                  {s.item_nom}
                  <span style={{fontSize:10,color:C.muted,marginLeft:6}}>({s.item_type==="pm"?"PM":"Gang"} · stock : {s.quantite})</span>
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={qtes[s.id]||""}
                  onChange={e=>setQtes(q => ({...q, [s.id]: e.target.value}))}
                  style={{width:72,textAlign:"center"}}
                />
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10}}>
        {totalQte>0 && <span style={{fontSize:11,color:C.muted}}>Total : <strong style={{color:C.text}}>{totalQte}</strong> item{totalQte>1?"s":""}</span>}
        <button onClick={submit} disabled={!canSubmit} style={{padding:"8px 18px",fontWeight:700,background:canSubmit?C.green:"#3a3a3a",color:canSubmit?"#1a1a1a":C.muted,border:"none",borderRadius:6,cursor:canSubmit?"pointer":"not-allowed",opacity:canSubmit?1:0.6}}>
          + Créer commande
        </button>
      </div>
    </div>
  );
}, (prev, next) => {
  if(prev.gangs !== next.gangs) return false;
  if(prev.itemsPM !== next.itemsPM) return false;
  if(prev.itemsG !== next.itemsG) return false;
  if(prev.stockLondres !== next.stockLondres) return false;
  return true;
});

// Formulaire d'ajout d'une commande passée (type + montant + note)
const AddCmdPasseeForm = memo(function AddCmdPasseeForm({onAdd}){
  const [type, setType] = useState("");
  const [montant, setMontant] = useState("");
  const [note, setNote] = useState("");
  const onAddRef = useRef(onAdd);
  useEffect(()=>{onAddRef.current = onAdd;});

  const canSubmit = !!(type && +montant > 0);

  async function submit(){
    if(!canSubmit) return;
    await onAddRef.current({type, montant:+montant, note:note||null});
    setType(""); setMontant(""); setNote("");
  }

  return (
    <div style={{background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:8,padding:14}}>
      <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Nouvelle commande passée</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div>
          <div style={S.lbl}>Type <span style={{color:C.red}}>*</span></div>
          <select value={type} onChange={e=>setType(e.target.value)} style={{width:"100%"}}>
            <option value="">— choisir —</option>
            <option value="drogue">💊 Drogue</option>
            <option value="arme">🔫 Arme</option>
            <option value="voiture">🚗 Voiture</option>
            <option value="autre">📦 Autre</option>
          </select>
        </div>
        <div>
          <div style={S.lbl}>Montant ($) <span style={{color:C.red}}>*</span></div>
          <input type="number" min="1" placeholder="ex: 50000" value={montant} onChange={e=>setMontant(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{width:"100%"}}/>
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={S.lbl}>Note <span style={{color:C.dim,fontWeight:400}}>(optionnel)</span></div>
        <input type="text" placeholder="Détails, fournisseur, contact..." value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{width:"100%"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={submit} disabled={!canSubmit} style={{padding:"8px 18px",fontWeight:700,background:canSubmit?C.green:"#3a3a3a",color:canSubmit?"#1a1a1a":C.muted,border:"none",borderRadius:6,cursor:canSubmit?"pointer":"not-allowed",opacity:canSubmit?1:0.6}}>
          + Créer commande
        </button>
      </div>
    </div>
  );
}, () => true);

function Main({cu,setCu,onLogout}){
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
  const [blanch,setBlanch]=useState(null);
  const [blanchHistory,setBlanchHistory]=useState([]);
  const [entrepots,setEntrepots]=useState([]);
  const [entrepotsHistory,setEntrepotsHistory]=useState([]);
  const [stockLondres,setStockLondres]=useState([]);
  const [commandesRecues,setCommandesRecues]=useState([]);
  const [commandesPassees,setCommandesPassees]=useState([]);
  const [alertThreshold,setAlertThreshold]=useState(10000);
  const [auditLogs,setAuditLogs]=useState([]);
  const [pmGroupes,setPMGroupes]=useState([]);

  const loadAll=useCallback(async()=>{
    setLoading(true);
    const cutoff=new Date(Date.now()-30*24*3600*1000).toISOString();
    sb.from("audit_log").delete().lt("created_at",cutoff).then(()=>{});

    const [a,cpm,cg,p,g,ipm,ig,bm,h,u,bl,st,al,bh,pg,en,enh,sl,cr,cp]=await Promise.all([
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
      sb.from("blanchiment").select("*").order("depot_at",{ascending:false}).limit(1),
      sb.from("app_settings").select("*").eq("key","alert_threshold").maybeSingle(),
      sb.from("audit_log").select("*").order("created_at",{ascending:false}).limit(500),
      sb.from("blanchiment_history").select("*").order("recup_at",{ascending:false}).limit(500),
      sb.from("pm_groupes").select("*").order("nom"),
      sb.from("entrepots").select("*").eq("status","active").order("depot_at",{ascending:true}),
      sb.from("entrepots_history").select("*").order("recup_at",{ascending:false}).limit(500),
      sb.from("stock_londres").select("*").order("item_nom"),
      sb.from("commandes_recues").select("*").order("created_at",{ascending:false}).limit(200),
      sb.from("commandes_passees").select("*").order("created_at",{ascending:false}).limit(200),
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
    setBlanch((bl.data&&bl.data[0])||null);
    if(st.data&&st.data.value)setAlertThreshold(+st.data.value||10000);
    setAuditLogs(al.data||[]);
    setBlanchHistory(bh.data||[]);
    setPMGroupes(pg.data||[]);
    setEntrepots(en.data||[]);
    setEntrepotsHistory(enh.data||[]);
    setStockLondres(sl.data||[]);
    setCommandesRecues(cr.data||[]);
    setCommandesPassees(cp.data||[]);
    // Sécurité session : si l'utilisateur courant n'existe plus en BDD ou a changé de code, on le déconnecte
    if(cu && u.data){
      const userInBdd = u.data.find(x=>x.id===cu.id);
      if(!userInBdd){
        // utilisateur supprimé → on déconnecte
        onLogout();
        return;
      }
      // Sync les infos importantes (rôle, code) si elles ont changé en BDD
      if(userInBdd.role!==cu.role || userInBdd.code!==cu.code || userInBdd.nom!==cu.nom){
        setCu(prev=>({...prev, role:userInBdd.role, code:userInBdd.code, nom:userInBdd.nom}));
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  // ── REALTIME : écoute des changements et rechargement ciblé silencieux ──
  useEffect(()=>{
    // Mapping table -> fonction de recharge ciblée
    const reloaders = {
      apparts:           ()=>sb.from("apparts").select("*").order("nom").then(({data})=>setApparts(data||[])),
      membres_comptes:   ()=>sb.from("membres_comptes").select("*").order("nom").then(({data})=>setMembers(data||[])),
      transactions:      ()=>sb.from("transactions").select("*").order("created_at",{ascending:false}).then(({data})=>setHistory(data||[])),
      items_pm:          ()=>sb.from("items_pm").select("*").order("nom").then(({data})=>setItemsPM(data||[])),
      items_gang:        ()=>sb.from("items_gang").select("*").order("nom").then(({data})=>setItemsG(data||[])),
      pms:               ()=>sb.from("pms").select("*").order("nom").then(({data})=>setPMs(data||[])),
      gangs:             ()=>sb.from("gangs").select("*").order("nom").then(({data})=>setGangs(data||[])),
      categories_pm:     ()=>sb.from("categories_pm").select("*").order("pct_objets").then(({data})=>setCatsPM(data||[])),
      categories_gang:   ()=>sb.from("categories_gang").select("*").order("pct_objets").then(({data})=>setCatsGang(data||[])),
      users:             ()=>sb.from("users").select("*").order("nom").then(({data})=>setUsers(data||[])),
      blanchiment:       ()=>sb.from("blanchiment").select("*").order("depot_at",{ascending:false}).limit(1).then(({data})=>setBlanch((data&&data[0])||null)),
      blanchiment_history:()=>sb.from("blanchiment_history").select("*").order("recup_at",{ascending:false}).limit(500).then(({data})=>setBlanchHistory(data||[])),
      audit_log:         ()=>sb.from("audit_log").select("*").order("created_at",{ascending:false}).limit(500).then(({data})=>setAuditLogs(data||[])),
      pm_groupes:        ()=>sb.from("pm_groupes").select("*").order("nom").then(({data})=>setPMGroupes(data||[])),
      entrepots:         ()=>sb.from("entrepots").select("*").eq("status","active").order("depot_at",{ascending:true}).then(({data})=>setEntrepots(data||[])),
      entrepots_history: ()=>sb.from("entrepots_history").select("*").order("recup_at",{ascending:false}).limit(500).then(({data})=>setEntrepotsHistory(data||[])),
      stock_londres:     ()=>sb.from("stock_londres").select("*").order("item_nom").then(({data})=>setStockLondres(data||[])),
      commandes_recues:  ()=>sb.from("commandes_recues").select("*").order("created_at",{ascending:false}).limit(200).then(({data})=>setCommandesRecues(data||[])),
      commandes_passees: ()=>sb.from("commandes_passees").select("*").order("created_at",{ascending:false}).limit(200).then(({data})=>setCommandesPassees(data||[])),
      app_settings:      async ()=>{
                            const {data}=await sb.from("app_settings").select("*").eq("key","alert_threshold").maybeSingle();
                            if(data&&data.value)setAlertThreshold(+data.value||10000);
                          },
    };

    // Petit debounce par table (50ms) pour grouper les rafales d'events sans être perceptible
    const timers = {};
    const triggerReload = (table) => {
      if(!reloaders[table])return;
      if(timers[table]) clearTimeout(timers[table]);
      timers[table] = setTimeout(()=>{
        reloaders[table]();
        timers[table] = null;
      }, 50);
    };

    // Une seule souscription qui écoute toutes les tables
    const channel = sb.channel("covenant-realtime")
      .on("postgres_changes", {event:"*", schema:"public", table:"apparts"},            p=>triggerReload("apparts"))
      .on("postgres_changes", {event:"*", schema:"public", table:"membres_comptes"},    p=>triggerReload("membres_comptes"))
      .on("postgres_changes", {event:"*", schema:"public", table:"transactions"},       p=>triggerReload("transactions"))
      .on("postgres_changes", {event:"*", schema:"public", table:"items_pm"},           p=>triggerReload("items_pm"))
      .on("postgres_changes", {event:"*", schema:"public", table:"items_gang"},         p=>triggerReload("items_gang"))
      .on("postgres_changes", {event:"*", schema:"public", table:"pms"},                p=>triggerReload("pms"))
      .on("postgres_changes", {event:"*", schema:"public", table:"gangs"},              p=>triggerReload("gangs"))
      .on("postgres_changes", {event:"*", schema:"public", table:"categories_pm"},      p=>triggerReload("categories_pm"))
      .on("postgres_changes", {event:"*", schema:"public", table:"categories_gang"},    p=>triggerReload("categories_gang"))
      .on("postgres_changes", {event:"*", schema:"public", table:"users"},              p=>triggerReload("users"))
      .on("postgres_changes", {event:"*", schema:"public", table:"blanchiment"},        p=>triggerReload("blanchiment"))
      .on("postgres_changes", {event:"*", schema:"public", table:"blanchiment_history"},p=>triggerReload("blanchiment_history"))
      .on("postgres_changes", {event:"*", schema:"public", table:"audit_log"},          p=>triggerReload("audit_log"))
      .on("postgres_changes", {event:"*", schema:"public", table:"app_settings"},       p=>triggerReload("app_settings"))
      .on("postgres_changes", {event:"*", schema:"public", table:"pm_groupes"},         p=>triggerReload("pm_groupes"))
      .on("postgres_changes", {event:"*", schema:"public", table:"entrepots"},          p=>triggerReload("entrepots"))
      .on("postgres_changes", {event:"*", schema:"public", table:"entrepots_history"},  p=>triggerReload("entrepots_history"))
      .on("postgres_changes", {event:"*", schema:"public", table:"stock_londres"},      p=>triggerReload("stock_londres"))
      .on("postgres_changes", {event:"*", schema:"public", table:"commandes_recues"},   p=>triggerReload("commandes_recues"))
      .on("postgres_changes", {event:"*", schema:"public", table:"commandes_passees"},  p=>triggerReload("commandes_passees"))
      .subscribe();

    return () => {
      // Nettoyage : annuler timers + désabonner à la déconnexion
      Object.values(timers).forEach(t=>t&&clearTimeout(t));
      sb.removeChannel(channel);
    };
  },[]);

  // Helper local : log + ajout direct dans le state pour affichage immédiat
  const log = useCallback(async (category, action, message, details=null) => {
    const entry={user_nom:cu.nom, category, action, message, details:details||null, created_at:new Date().toISOString()};
    setAuditLogs(prev=>[entry,...prev].slice(0,500));
    logAction(cu.nom, category, action, message, details);
  },[cu.nom]);

  const [dFrom,setDFrom]=useState(ago(7)); const [dTo,setDTo]=useState(today());
  const [hFrom,setHFrom]=useState(ago(7)); const [hTo,setHTo]=useState(today());
  const [expanded,setExpanded]=useState({});
  const [copied,setCopied]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);

  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    // Timer uniquement actif sur le tableau de bord ET s'il y a un blanchiment en cours
    // (sinon ça re-render Main toutes les secondes et fait perdre le focus partout)
    // Timer uniquement actif sur le tableau de bord ET s'il y a un blanchiment OU un entrepôt en cours
    // (sinon ça re-render Main toutes les secondes et fait perdre le focus partout)
    if(tab!=="dashboard") return;
    if(!blanch && (!entrepots || entrepots.length===0)) return;
    const t=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(t);
  },[blanch,tab,entrepots]);

  const [blAmount,setBlAmount]=useState("");
  const [enAmount,setEnAmount]=useState("");
  async function startBlanch(){
    const v=+blAmount||0; if(v<=0) return;
    if(blanch){alert("Un dépôt est déjà en cours.");return;}
    const dep=new Date();
    const rec=new Date(dep.getTime()+blDuration(v)*3600000);
    const {data}=await sb.from("blanchiment").insert({montant:v,depot_at:dep.toISOString(),recup_at:rec.toISOString(),user_nom:cu.nom}).select().single();
    if(data){
      setBlanch(data);setBlAmount("");
      log("laundry","start",`a démarré un blanchiment de <b>${fmt(v)}</b> (durée : ${blDuration(v)}h)`);
    }
  }
  async function collectBlanch(canceled){
    if(!blanch)return;
    const wasReady = (new Date(blanch.recup_at)).getTime() <= Date.now();
    // Si récupération (pas annulation) → on archive dans blanchiment_history
    if(!canceled){
      const dur = blDuration(blanch.montant);
      await sb.from("blanchiment_history").insert({
        montant: blanch.montant,
        depot_at: blanch.depot_at,
        recup_at: new Date().toISOString(),
        duree_h: dur,
        user_nom: cu.nom
      });
    }
    await sb.from("blanchiment").delete().eq("id",blanch.id);
    log("laundry", canceled?"cancel":(wasReady?"collect":"collect"),
      canceled
        ? `a annulé un blanchiment de <b>${fmt(blanch.montant)}</b>`
        : `a récupéré un blanchiment de <b>${fmt(blanch.montant)}</b>`);
    setBlanch(null);
    // Recharger l'historique blanchiment pour mettre à jour les stats
    if(!canceled){
      const {data}=await sb.from("blanchiment_history").select("*").order("recup_at",{ascending:false}).limit(500);
      setBlanchHistory(data||[]);
    }
  }

  // ── Gestion des Entrepôts ──
  const ENTREPOT_DURATION_H = 24; // 24h fixe
  async function startEntrepot(montantStr){
    const v = +montantStr || 0;
    if(v <= 0) return;
    if(entrepots.length >= 2){
      alert("Limite atteinte : 2 entrepôts maximum en même temps.");
      return;
    }
    const dep = new Date();
    const rec = new Date(dep.getTime() + ENTREPOT_DURATION_H*3600000);
    const {data} = await sb.from("entrepots").insert({
      montant: v,
      depot_at: dep.toISOString(),
      recup_at: rec.toISOString(),
      user_depot: cu.nom,
      status: "active"
    }).select().single();
    if(data){
      setEntrepots(prev => [...prev, data]);
      log("entrepot","start",`a démarré un entrepôt de <b>${fmt(v)}</b> (durée : 24h)`);
    }
  }
  async function recupEntrepot(ent){
    if(!ent) return;
    // Archiver dans entrepots_history
    await sb.from("entrepots_history").insert({
      montant: ent.montant,
      depot_at: ent.depot_at,
      recup_at: new Date().toISOString(),
      user_depot: ent.user_depot,
      user_recup: cu.nom
    });
    // Supprimer l'entrepôt actif
    await sb.from("entrepots").delete().eq("id", ent.id);
    setEntrepots(prev => prev.filter(x => x.id !== ent.id));
    log("entrepot","recup",`a récupéré un entrepôt de <b>${fmt(ent.montant)}</b> (déposé par ${ent.user_depot})`);
    // Recharger l'historique entrepôts pour mise à jour
    const {data} = await sb.from("entrepots_history").select("*").order("recup_at",{ascending:false}).limit(500);
    setEntrepotsHistory(data||[]);
  }
  async function delEntrepot(ent){
    if(!ent || !isAdmin) return;
    if(!window.confirm(`Supprimer l'entrepôt de ${fmt(ent.montant)} (sans archiver dans l'historique) ?`)) return;
    await sb.from("entrepots").delete().eq("id", ent.id);
    setEntrepots(prev => prev.filter(x => x.id !== ent.id));
    log("entrepot","delete",`a supprimé un entrepôt de <b>${fmt(ent.montant)}</b>`);
  }

  // ── Gestion du Stock Londres ──
  async function addStockItem(item, type, seuil=5){
    // item = {id, nom} ; type = 'pm' ou 'gang'
    const exists = stockLondres.find(s => s.item_id===item.id && s.item_type===type);
    if(exists){ alert("Cet item est déjà suivi."); return; }
    const {data} = await sb.from("stock_londres").insert({
      item_id: item.id,
      item_type: type,
      item_nom: item.nom,
      quantite: 0,
      seuil: seuil
    }).select().single();
    if(data){
      setStockLondres(prev => [...prev, data]);
      log("stock","stock_add",`a ajouté <b>${item.nom}</b> au suivi stock Londres`);
    }
  }
  async function removeStockItem(stockId){
    const item = stockLondres.find(s=>s.id===stockId);
    await sb.from("stock_londres").delete().eq("id", stockId);
    setStockLondres(prev => prev.filter(s => s.id !== stockId));
    if(item) log("stock","stock_remove",`a retiré <b>${item.item_nom}</b> du suivi stock Londres`);
  }
  async function updateStockQty(stockId, newQty){
    const before = stockLondres.find(s=>s.id===stockId);
    const qty = Math.max(0, +newQty||0);
    await sb.from("stock_londres").update({quantite:qty, updated_at:new Date().toISOString()}).eq("id", stockId);
    setStockLondres(prev => prev.map(s => s.id===stockId ? {...s, quantite:qty} : s));
    if(before && before.quantite !== qty) log("stock","stock_qty",`a ajusté le stock de <b>${before.item_nom}</b> : ${before.quantite} → ${qty}`);
  }
  async function updateStockSeuil(stockId, newSeuil){
    const seuil = Math.max(0, +newSeuil||0);
    await sb.from("stock_londres").update({seuil:seuil}).eq("id", stockId);
    setStockLondres(prev => prev.map(s => s.id===stockId ? {...s, seuil:seuil} : s));
  }

  // ── Gestion Commandes Reçues ──
  async function createCommandeRecue({gang_id, gang_nom, lignes, note}){
    const {data} = await sb.from("commandes_recues").insert({
      gang_id: gang_id||null,
      gang_nom: gang_nom||null,
      lignes: lignes||[],
      status: "en_attente",
      note: note||null,
      user_creation: cu.nom
    }).select().single();
    if(data){
      setCommandesRecues(prev => [data, ...prev]);
      const totalQte = (lignes||[]).reduce((s,l)=>s+(+l.qte||0),0);
      log("commande","cmd_recue_create",`a créé une commande reçue pour <b>${gang_nom||"?"}</b> · ${totalQte} item${totalQte>1?"s":""}`);
    }
  }
  async function livrerCommandeRecue(cmd){
    if(!cmd) return;
    // 1. Décrémenter le stock_londres (quantité par item)
    let totalKgDecrement = 0;
    for(const ligne of (cmd.lignes||[])){
      const stock = stockLondres.find(s => s.item_id===ligne.item_id && s.item_type===ligne.item_type);
      if(stock){
        const qteLivree = +ligne.qte||0;
        const newQty = Math.max(0, stock.quantite - qteLivree);
        await sb.from("stock_londres").update({quantite:newQty, updated_at:new Date().toISOString()}).eq("id", stock.id);
        setStockLondres(prev => prev.map(s => s.id===stock.id ? {...s, quantite:newQty} : s));
        // Calculer le poids total à retrancher du stock kg de Londres
        const item = ligne.item_type === "pm"
          ? itemsPM.find(i => i.id === ligne.item_id)
          : itemsG.find(i => i.id === ligne.item_id);
        const poids = item?.poids || 0;
        totalKgDecrement += qteLivree * poids;
      }
    }
    // 2. Décrémenter le stock kg de l'appart Londres si on a livré du poids
    if(totalKgDecrement > 0){
      const londres = apparts.find(a => a.nom && a.nom.toLowerCase().trim()==="londres");
      if(londres){
        const newStock = Math.max(0, (+londres.stock||0) - totalKgDecrement);
        await sb.from("apparts").update({stock:newStock}).eq("id", londres.id);
        setApparts(prev => prev.map(a => a.id===londres.id ? {...a, stock:newStock} : a));
      }
    }
    // 3. Marquer la commande comme livrée
    await sb.from("commandes_recues").update({
      status: "livree",
      livree_at: new Date().toISOString(),
      user_livraison: cu.nom
    }).eq("id", cmd.id);
    setCommandesRecues(prev => prev.map(c => c.id===cmd.id ? {...c, status:"livree", livree_at:new Date().toISOString(), user_livraison:cu.nom} : c));
    const kgInfo = totalKgDecrement>0 ? ` · -${fmtKgD(totalKgDecrement)} stock` : "";
    log("commande","cmd_recue_livree",`a livré la commande pour <b>${cmd.gang_nom||"?"}</b>${kgInfo}`);
  }
  async function delCommandeRecue(cmd){
    if(!cmd) return;
    await sb.from("commandes_recues").delete().eq("id", cmd.id);
    setCommandesRecues(prev => prev.filter(c => c.id !== cmd.id));
    log("commande","cmd_recue_delete",`a supprimé une commande reçue de <b>${cmd.gang_nom||"?"}</b>`);
  }

  // ── Gestion Commandes Passées ──
  async function createCommandePassee({type, montant, note}){
    const {data} = await sb.from("commandes_passees").insert({
      type: type,
      montant: +montant||0,
      note: note||null,
      status: "en_attente",
      user_creation: cu.nom
    }).select().single();
    if(data){
      setCommandesPassees(prev => [data, ...prev]);
      log("commande","cmd_passee_create",`a créé une commande passée · ${type} · <b>${fmt(montant)}</b>`);
    }
  }
  async function livrerCommandePassee(cmd){
    if(!cmd) return;
    await sb.from("commandes_passees").update({
      status: "livree",
      livree_at: new Date().toISOString(),
      user_livraison: cu.nom
    }).eq("id", cmd.id);
    setCommandesPassees(prev => prev.map(c => c.id===cmd.id ? {...c, status:"livree", livree_at:new Date().toISOString(), user_livraison:cu.nom} : c));
    log("commande","cmd_passee_livree",`a marqué une commande passée comme reçue · ${cmd.type} · <b>${fmt(cmd.montant)}</b>`);
  }
  async function delCommandePassee(cmd){
    if(!cmd) return;
    await sb.from("commandes_passees").delete().eq("id", cmd.id);
    setCommandesPassees(prev => prev.filter(c => c.id !== cmd.id));
    log("commande","cmd_passee_delete",`a supprimé une commande passée · ${cmd.type} · ${fmt(cmd.montant)}`);
  }

  const E0={dest:"pm",pmId:"",gangId:"",membreId:"",qtes:{},liasseQte:"",argentSale:"",date:today(),note:""};
  const [tx,setTx]=useState(E0);

  // ── Gestion PM/Groupes : un id préfixé "g:" indique un groupe, sinon c'est une PM normale ──
  // Liste fusionnée PM + Groupes pour le sélecteur Transactions
  const pmsAndGroupes = useMemo(()=>{
    // PM individuelles SOLO uniquement (celles qui n'appartiennent à aucun groupe)
    const pmList = pms.filter(p=>!p.groupe_id).map(p=>({type:"pm", id:p.id, value:p.id, label:p.nom, pm:p, categorie_id:p.categorie_id}));
    // Groupes (avec catégorie héritée = la plus haute des PM membres)
    const groupList = pmGroupes.map(g=>{
      const membres = pms.filter(p=>p.groupe_id===g.id);
      // Catégorie la plus haute = celle avec le plus haut pct_objets
      let topCatId = null, topPct = -1;
      membres.forEach(m=>{
        const c = catsPM.find(x=>x.id===m.categorie_id);
        if(c && c.pct_objets > topPct){ topPct = c.pct_objets; topCatId = c.id; }
      });
      return {type:"groupe", id:g.id, value:"g:"+g.id, label:"👥 "+g.nom+" ("+membres.length+")", groupe:g, membres, categorie_id:topCatId};
    });
    return [...pmList, ...groupList].sort((a,b)=>a.label.localeCompare(b.label,"fr"));
  },[pms,pmGroupes,catsPM]);

  // Sélection courante : peut être une PM ou un groupe
  const selPMorGroupe = pmsAndGroupes.find(x=>x.value===tx.pmId) || null;
  const selPM    = selPMorGroupe?.type==="pm" ? selPMorGroupe.pm : null;
  const selGroupe= selPMorGroupe?.type==="groupe" ? selPMorGroupe.groupe : null;
  const selGang  = gangs.find(g=>g.id===tx.gangId)||null;
  const selCatPM = selPMorGroupe ? catsPM.find(c=>c.id===selPMorGroupe.categorie_id)||null : null;
  const selCatG  = selGang? catsGang.find(c=>c.id===selGang.categorie_id)||null: null;
  const aPct     = tx.dest==="pm"?(selCatPM?selCatPM.pct_objets:0):(selCatG?selCatG.pct_objets:0);
  const aLiasse  = tx.dest==="pm"?(selCatPM?selCatPM.taux_liasse:0):(selCatG?selCatG.taux_liasse:0);
  // Prix fixe de la catégorie : utilisé pour les items marqués prix_fixe (PM uniquement, gangs n'ont pas ce système)
  const aPrixFixe = tx.dest==="pm"?(selCatPM?+selCatPM.prix_fixe||0:0):0;

  const aItems   = tx.dest==="gang"?[...itemsPM,...itemsG]:itemsPM;

  const totObj=useMemo(()=>{
    return aItems.reduce((s,it)=>{
      const qte = +(tx.qtes[it.id])||0;
      if(qte<=0) return s;
      // Boîte ATM (détection auto par nom, PM uniquement) : on utilise aPrixFixe au lieu du %
      if(isATM(it) && tx.dest==="pm" && aPrixFixe>0){
        return s + aPrixFixe * qte;
      }
      // Sinon : calcul classique avec le %
      if(!aPct) return s;
      return s + it.prix * qte * (aPct/100);
    },0);
  },[tx.qtes,aPct,aPrixFixe,aItems,tx.dest]);

  const totPoids=useMemo(()=>{
    const poidsObjets = aItems.reduce((s,it)=>s+(+(it.poids)||0)*(+(tx.qtes[it.id])||0),0);
    const poidsLiasses = (+(tx.liasseQte)||0)*0.1; // 1 liasse = 0.1 Kg
    return poidsObjets + poidsLiasses;
  },[tx.qtes,aItems,tx.liasseQte]);

  const totLia  = aLiasse*(+(tx.liasseQte)||0);
  const totArg  = tx.dest==="pm"?Math.round((+(tx.argentSale)||0)*0.4):0;
  const txTotal = Math.round(totObj)+totLia+totArg;

  function setQte(id,val){
    setTx(f=>({...f,qtes:{...f.qtes,[id]:val}}));
  }

  async function submit(){
    if(tx.dest==="pm"&&(!tx.pmId||!tx.membreId))return;
    if(tx.dest==="gang"&&!tx.gangId)return;
    if(!totObj&&!totLia&&!totArg)return;
    const types=[]; const det={};
    if(totObj>0){
      types.push("objets");
      det.lignes = aItems.filter(it=>+(tx.qtes[it.id]||0)>0).map(it=>{
        const qte = +(tx.qtes[it.id]);
        // Boîte ATM (détection auto, PM uniquement) : sous_total = prix_fixe_cat × qte
        // Sinon : sous_total = prix × qte × pct/100
        let sousTotal;
        if(isATM(it) && tx.dest==="pm" && aPrixFixe>0){
          sousTotal = aPrixFixe * qte;
        } else {
          sousTotal = it.prix * qte * (aPct/100);
        }
        return {
          nom: it.nom,
          prix: it.prix,
          qte: qte,
          sous_total: sousTotal,
          poids: (+(it.poids)||0) * qte
        };
      });
    }
    if(totLia>0){types.push("liasses");det.liasse_qte=+(tx.liasseQte);det.taux_liasse=aLiasse;det.valeur_face=70*(+(tx.liasseQte));}
    if(totArg>0&&tx.dest==="pm"){types.push("argent");det.argent_sale=+(tx.argentSale);}
    const mb=members.find(m=>m.id===tx.membreId)||null;
    // Nom enregistré : si groupe sélectionné, on prend le nom du groupe
    const pmNomFinal = tx.dest==="pm" ? (selGroupe ? selGroupe.nom : (selPM ? selPM.nom : null)) : null;
    // IDs pour rattachement persistant (résiste aux renommages)
    const pmIdFinal = tx.dest==="pm" && selPM ? selPM.id : null;
    const groupeIdFinal = tx.dest==="pm" ? (selGroupe ? selGroupe.id : (selPM && selPM.groupe_id ? selPM.groupe_id : null)) : null;
    const payload={
      dest:tx.dest, types, date:tx.date, note:tx.note, total:txTotal,
      pm_nom:pmNomFinal,
      pm_cat:tx.dest==="pm"&&selCatPM?selCatPM.nom:null,
      pm_pct:tx.dest==="pm"?aPct:null,
      pm_id:pmIdFinal,
      groupe_id:groupeIdFinal,
      gang_nom:tx.dest==="gang"&&selGang?selGang.nom:null,
      gang_cat:tx.dest==="gang"&&selCatG?selCatG.nom:null,
      gang_pct:tx.dest==="gang"?aPct:null,
      membre:mb?mb.nom:"",
      ...det
    };

    // ⚡ MODE OPTIMISTIC : on met à jour l'UI immédiatement, on envoie en arrière-plan
    const tempId = "temp-"+Date.now();
    const optimisticTx = {...payload, id: tempId, created_at: new Date().toISOString()};
    setHistory(h=>[optimisticTx, ...h]);
    if(mb) setMembers(ms=>ms.map(x=>x.id===mb.id?{...x,solde:x.solde-txTotal}:x));

    const who=tx.dest==="pm"?(pmNomFinal||"?")+" · "+(selCatPM?.nom||"?"):(selGang?.nom||"?")+" · "+(selCatG?.nom||"?");
    log("tx","create",`a enregistré une transaction ${tx.dest==="pm"?"PM":"Gang"}${selGroupe?" (groupe)":""} <b>${who}</b> · <b>${fmt(txTotal)}</b>${totPoids>0?" · "+fmtKgD(totPoids):""}${mb?" (payée par "+mb.nom+")":""}`);
    setTx(E0);

    // Envoi en arrière-plan : Realtime se chargera de remplacer le temp par le vrai ID
    sb.from("transactions").insert(payload).then(({error})=>{
      if(error){
        // En cas d'erreur, on retire le temp et on affiche une alerte
        setHistory(h=>h.filter(x=>x.id!==tempId));
        if(mb) setMembers(ms=>ms.map(x=>x.id===mb.id?{...x,solde:x.solde+txTotal}:x));
        alert("Erreur lors de l'enregistrement : "+error.message);
      }
    });
    if(mb) sb.from("membres_comptes").update({solde:mb.solde-txTotal}).eq("id",mb.id).then(()=>{});
  }

  async function deleteTx(id){
    const h=history.find(x=>x.id===id);
    if(!h)return;

    // ⚡ MODE OPTIMISTIC : on retire de l'UI immédiatement
    setHistory(hs=>hs.filter(x=>x.id!==id));
    let mb=null;
    if(h.dest==="pm"&&h.membre){
      mb=members.find(m=>m.nom===h.membre);
      if(mb) setMembers(ms=>ms.map(x=>x.id===mb.id?{...x,solde:x.solde+h.total}:x));
    }

    const who=h.dest==="pm"?(h.pm_nom||"?"):(h.gang_nom||"?");
    log("tx","delete",`a supprimé une transaction ${h.dest==="pm"?"PM":"Gang"} <b>${who}</b> · <b>${fmt(h.total)}</b> du ${h.date}`);
    setConfirmDel(null);

    // Envoi en arrière-plan
    if(mb) sb.from("membres_comptes").update({solde:mb.solde+h.total}).eq("id",mb.id).then(()=>{});
    sb.from("transactions").delete().eq("id",id).then(({error})=>{
      if(error){
        // Rollback en cas d'erreur
        setHistory(hs=>[h,...hs]);
        if(mb) setMembers(ms=>ms.map(x=>x.id===mb.id?{...x,solde:x.solde-h.total}:x));
        alert("Erreur lors de la suppression : "+error.message);
      }
    });
  }

  const [hFil,setHFil]=useState({who:""});
  const [hType,setHType]=useState("transactions"); // 'transactions' | 'blanchi' | 'entrepots'
  // Options du filtre : on inclut les groupes existants en plus des noms de transactions
  const whoOpts=useMemo(()=>{
    const seen=new Set();
    const opts=[];
    // 1. Ajouter les groupes en premier (avec préfixe 👥)
    pmGroupes.forEach(g=>{
      const k="pm:"+g.nom;
      if(!seen.has(k)){seen.add(k);opts.push({key:k,label:"PM — 👥 "+g.nom});}
    });
    // 2. Ajouter les noms de transactions (sauf si déjà dans seen)
    history.forEach(h=>{
      const n=h.dest==="pm"?(h.pm_nom||""):(h.gang_nom||"");
      const k=h.dest+":"+n;
      if(!seen.has(k)&&n){seen.add(k);opts.push({key:k,label:(h.dest==="pm"?"PM — ":"Gang — ")+n});}
    });
    return opts;
  },[history,pmGroupes]);

  // Helper : noms à matcher pour un filtre donné (résout les groupes en leurs membres)
  const norm = s => (s||"").toLowerCase().trim().replace(/\s+/g," ");
  const filtH=useMemo(()=>{
    let matchFilter = null; // null = pas de filtre
    let allOfDest = null;   // "pm" ou "gang" si on filtre tous les PM ou tous les Gangs
    if(hFil.who==="all_pm") allOfDest = "pm";
    else if(hFil.who==="all_gang") allOfDest = "gang";
    else if(hFil.who){
      const [dest,...rest] = hFil.who.split(":");
      const nom = rest.join(":");
      // Si c'est un nom de groupe : on matche par ID du groupe + noms des PM du groupe
      const groupe = dest==="pm" ? pmGroupes.find(g=>norm(g.nom)===norm(nom)) : null;
      if(groupe){
        const memberNames = pms.filter(p=>p.groupe_id===groupe.id).map(p=>norm(p.nom));
        const memberIds = pms.filter(p=>p.groupe_id===groupe.id).map(p=>p.id);
        matchFilter = {dest, groupeId:groupe.id, pmIds:new Set(memberIds), names:new Set([norm(groupe.nom), ...memberNames])};
      } else {
        // Sinon : si la PM nommée appartient à un groupe → étendre au groupe
        if(dest==="pm"){
          const pm = pms.find(p=>norm(p.nom)===norm(nom));
          if(pm && pm.groupe_id){
            const grp = pmGroupes.find(g=>g.id===pm.groupe_id);
            if(grp){
              const memberNames = pms.filter(p=>p.groupe_id===grp.id).map(p=>norm(p.nom));
              const memberIds = pms.filter(p=>p.groupe_id===grp.id).map(p=>p.id);
              matchFilter = {dest, groupeId:grp.id, pmIds:new Set(memberIds), names:new Set([norm(grp.nom), ...memberNames])};
            }
          }
        }
        if(!matchFilter) matchFilter = {dest, groupeId:null, pmIds:new Set(), names:new Set([norm(nom)])};
      }
    }
    return history.filter(h=>{
      // Filtre "Toutes les PM" / "Tous les gangs"
      if(allOfDest){
        if(h.dest!==allOfDest) return false;
        return h.date>=hFrom&&h.date<=hTo;
      }
      if(matchFilter){
        if(h.dest!==matchFilter.dest) return false;
        // Match par ID groupe (le plus fiable)
        if(matchFilter.groupeId && h.groupe_id===matchFilter.groupeId) return h.date>=hFrom&&h.date<=hTo;
        // Match par ID PM (deuxième plus fiable)
        if(h.pm_id && matchFilter.pmIds.has(h.pm_id)) return h.date>=hFrom&&h.date<=hTo;
        // Fallback : match par nom
        const n=h.dest==="pm"?norm(h.pm_nom||""):norm(h.gang_nom||"");
        if(!matchFilter.names.has(n)) return false;
      }
      return h.date>=hFrom&&h.date<=hTo;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[history,hFil,hFrom,hTo,pms,pmGroupes]);

  // Totaux sur les transactions filtrées (Historique)
  // Items en stock bas (sous le seuil) — utilisé pour l'alerte du tableau de bord
  const stockBas = useMemo(()=>{
    return stockLondres.filter(s => s.quantite < s.seuil);
  },[stockLondres]);

  const totauxH=useMemo(()=>{
    let liasseQte=0, liasseFace=0, objQte=0, objRevente=0, payePM=0, payeGang=0, sale=0;
    filtH.forEach(h=>{
      // Payé total séparé : PM ou Gang
      if(h.dest==="gang") payeGang += (+h.total||0);
      else payePM += (+h.total||0);
      // Objets : qte cumulée + valeur de revente (prix × qte)
      if(h.types?.includes("objets")&&h.lignes){
        h.lignes.forEach(l=>{
          objQte += (+l.qte||0);
          objRevente += (+l.prix||0)*(+l.qte||0);
          sale += (+l.prix||0)*(+l.qte||0);
        });
      }
      // Liasses : qte + valeur faciale
      if(h.types?.includes("liasses")){
        liasseQte += (+h.liasse_qte||0);
        const face=(+h.valeur_face||((+h.liasse_qte||0)*70));
        liasseFace += face;
        sale += face;
      }
      // Argent sale brut
      if(h.types?.includes("argent")){
        sale += (+h.argent_sale||0);
      }
    });
    return {liasseQte,liasseFace,objQte,objRevente,payePM:Math.round(payePM),payeGang:Math.round(payeGang),sale:Math.round(sale)};
  },[filtH]);

  const [apCatF,setApCatF]=useState("");
  const [apSort,setApSort]=useState({key:"",dir:-1});
  const sortedAp=useMemo(()=>{
    let a=apCatF?apparts.filter(x=>x.categorie===apCatF):[...apparts];
    if(apSort.key)a.sort((a,b)=>(a[apSort.key]-b[apSort.key])*apSort.dir);
    return a;
  },[apparts,apCatF,apSort]);

  async function updateAppart(id,fields){
    const before=apparts.find(a=>a.id===id);
    await sb.from("apparts").update(fields).eq("id",id);
    setApparts(p=>p.map(a=>a.id===id?{...a,...fields}:a));
    if(before){
      const changes=Object.entries(fields).filter(([k,v])=>before[k]!==v);
      if(changes.length>0){
        const apName=fields.nom||before.nom;
        // Cas spécifiques : modif coffre seul ou stock seul
        if(changes.length===1&&changes[0][0]==="coffre"){
          log("apparts","update_coffre",`a modifié le coffre de <b>${apName}</b> : ${diff(fmt(before.coffre),fmt(fields.coffre))}`);
        } else if(changes.length===1&&changes[0][0]==="stock"){
          log("apparts","update_stock",`a modifié le stock de <b>${apName}</b> : ${diff(fmtKg(before.stock),fmtKg(fields.stock))}`);
        } else {
          // Modif générique multi-champs
          const lst=changes.map(([k,v])=>{
            if(k==="nom")return `nom : ${diff(before[k],v)}`;
            if(k==="categorie")return `catégorie : ${diff(getCat(before[k]).label,getCat(v).label)}`;
            if(k==="max_coffre")return `max coffre : ${diff(fmt(before[k]),fmt(v))}`;
            if(k==="max_stock")return `max stock : ${diff(fmtKg(before[k]),fmtKg(v))}`;
            if(k==="code")return `code : ${diff(before[k]||"—",v||"—")}`;
            if(k==="coffre")return `coffre : ${diff(fmt(before[k]),fmt(v))}`;
            if(k==="stock")return `stock : ${diff(fmtKg(before[k]),fmtKg(v))}`;
            return `${k} : ${diff(before[k],v)}`;
          }).join(" · ");
          log("apparts","update",`a modifié l'appart <b>${apName}</b> : ${lst}`);
        }
      }
    }
  }

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

  const [nCPM,setNCPM]=useState({nom:"",pct_objets:"",taux_liasse:""}); const [eCPM,setECPM]=useState(null);
  const [nCG,setNCG]=useState({nom:"",pct_objets:"",taux_liasse:""});   const [eCG,setECG]=useState(null);
  const [nPM,setNPM]=useState({nom:"",categorie_id:""});   const [ePM,setEPM]=useState(null);
  const [pmSearch,setPMSearch]=useState("");
  const [nGa,setNGa]=useState({nom:"",categorie_id:""});   const [eGa,setEGa]=useState(null);
  const [nIPM,setNIPM]=useState({nom:"",prix:"",poids:""});  const [eIPM,setEIPM]=useState(null);
  const [nIG,setNIG]=useState({nom:"",prix:"",poids:""});    const [eIG,setEIG]=useState(null);
  const [nBM,setNBM]=useState({nom:"",solde:""});
  const [nU,setNU]=useState({nom:"",code:"",role:"membre"});

  // États "Voir tous" pour les listes pliables Database et membres
  const [showAll,setShowAll]=useState({catsPM:false,catsGang:false,pms:false,gangs:false,itemsPM:false,itemsG:false,apparts:false,members:false,groupes:false});
  const PREVIEW=5;
  // États pour gérer les groupes PM
  const [eGr,setEGr]=useState(null); // ID du groupe en édition

  const [eApId,setEApId]=useState(null);
  const [eApV,setEApV]=useState({});
  const [nAp,setNAp]=useState({nom:"",categorie:"recel",max_coffre:"",max_stock:"",code:""});

  // Filtres Bigbrother
  const [bbFilter,setBBFilter]=useState({user:"",cat:"",from:ago(30),to:today(),search:""});

  const [pwd,setPwd]=useState({cur:"",neu:"",conf:""});
  const [pwdMsg,setPwdMsg]=useState(null);
  async function changePwd(){
    setPwdMsg(null);
    if(!pwd.cur||!pwd.neu||!pwd.conf){setPwdMsg({t:"err",m:"Tous les champs sont requis"});return;}
    if(pwd.cur!==cu.code){setPwdMsg({t:"err",m:"Code actuel incorrect"});return;}
    if(pwd.neu!==pwd.conf){setPwdMsg({t:"err",m:"Les codes ne correspondent pas"});return;}
    if(pwd.neu.length<3){setPwdMsg({t:"err",m:"Code trop court (min 3 caractères)"});return;}
    const {error}=await sb.from("users").update({code:pwd.neu}).eq("id",cu.id);
    if(error){setPwdMsg({t:"err",m:"Erreur : "+error.message});return;}
    setCu({...cu,code:pwd.neu});
    setUsers(us=>us.map(u=>u.id===cu.id?{...u,code:pwd.neu}:u));
    setPwd({cur:"",neu:"",conf:""});
    setPwdMsg({t:"ok",m:"Code modifié avec succès"});
    setTimeout(()=>setPwdMsg(null),3500);
    log("access","password_change",`a changé son code d'accès`);
  }

  // Sauvegarde du seuil d'alerte
  const [thresholdInput,setThresholdInput]=useState("");
  const [thresholdMsg,setThresholdMsg]=useState(null);
  useEffect(()=>{setThresholdInput(String(alertThreshold));},[alertThreshold]);
  async function saveThreshold(){
    setThresholdMsg(null);
    const v=Math.max(0,Math.round(+thresholdInput||0));
    const old=alertThreshold;
    const {error}=await sb.from("app_settings").upsert({key:"alert_threshold",value:String(v)},{onConflict:"key"});
    if(error){setThresholdMsg({t:"err",m:"Erreur : "+error.message});return;}
    setAlertThreshold(v);
    setThresholdMsg({t:"ok",m:"Seuil sauvegardé : "+fmt(v)});
    setTimeout(()=>setThresholdMsg(null),3000);
    if(old!==v) log("settings","threshold",`a modifié le seuil d'alerte solde : ${diff(fmt(old),fmt(v))}`);
  }

  const fileRefPM=useRef(null);
  const fileRefG=useRef(null);
  const fileRefPMs=useRef(null);
  const fileRefUsers=useRef(null);
  const [importDlg,setImportDlg]=useState(null);
  const [importErr,setImportErr]=useState(null);

  function triggerImport(target){
    const r=target==="items_pm"?fileRefPM:target==="items_gang"?fileRefG:target==="users"?fileRefUsers:fileRefPMs;
    r.current?.click();
  }

  async function onFileChosen(e,target){
    const file=e.target.files?.[0]; e.target.value="";
    if(!file)return;
    const buf=await file.arrayBuffer();
    // Décodage robuste : on essaie UTF-8 d'abord. Si on détecte des caractères cassés ( ),
    // on retombe sur Windows-1252 (encodage par défaut d'Excel sur Windows/Mac en France).
    let text=new TextDecoder("utf-8",{fatal:false}).decode(buf);
    if(text.includes("\uFFFD")){
      try {
        const fallback=new TextDecoder("windows-1252").decode(buf);
        text=fallback;
      } catch(_){
        try { text=new TextDecoder("iso-8859-1").decode(buf); } catch(_){}
      }
    }
    const {rows,sep}=parseCSV(text);
    if(!rows.length){setImportErr({target,msg:"Le fichier est vide."});return;}

    if(target==="pms"){
      const first=rows[0];
      const hasHeader=first.length>=2 && /nom|name/i.test(first[0]);
      const lines=hasHeader?rows.slice(1):rows;
      const data=[];
      const skipped=[];
      lines.forEach(r=>{
        const nom=(r[0]||"").trim();
        const catName=(r[1]||"").trim();
        if(!nom){return;}
        const cat=catsPM.find(c=>c.nom.toLowerCase()===catName.toLowerCase());
        if(!cat){skipped.push({nom,catName});return;}
        data.push({nom,categorie_id:cat.id});
      });
      if(!data.length&&!skipped.length){setImportErr({target,msg:"Aucune ligne valide trouvée."});return;}
      setImportDlg({target,items:data,skipped,sep});
    } else if(target==="users"){
      // Format : nom,code,role
      const first=rows[0];
      const hasHeader=first.length>=2 && /nom|name/i.test(first[0]);
      const lines=hasHeader?rows.slice(1):rows;
      const data=[];
      const skipped=[];
      lines.forEach(r=>{
        const nom=(r[0]||"").trim();
        const code=(r[1]||"").trim();
        const role=(r[2]||"membre").trim().toLowerCase();
        if(!nom||!code){skipped.push({nom:nom||"(sans nom)",reason:"nom ou code vide"});return;}
        if(role!=="admin"&&role!=="membre"){skipped.push({nom,reason:"rôle invalide : "+role});return;}
        data.push({nom,code,role});
      });
      if(!data.length&&!skipped.length){setImportErr({target,msg:"Aucune ligne valide trouvée."});return;}
      setImportDlg({target,items:data,skipped,sep});
    } else {
      // items_pm / items_gang : nom,prix,poids — 3 colonnes
      const first=rows[0];
      const hasHeader = first.length>=2 && (/nom|name/i.test(first[0]) || isNaN(parseNum(first[1])));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      if(dataRows.length===0){setImportErr({target,msg:"Aucune ligne de données après l'en-tête."});return;}
      const missingPoids = dataRows.some(r => r.length < 3);
      if(missingPoids){
        setImportErr({target,msg:"Colonne \"poids\" manquante. Le format CSV doit contenir 3 colonnes : nom, prix, poids (en Kg). Détecté : "+(sep===";"?"séparateur ';'":"séparateur ','")+"."});
        return;
      }

      const data=dataRows
        .map(r=>({
          nom:(r[0]||"").trim(),
          prix:Math.round(parseNum(r[1])),
          poids:Math.round(parseNum(r[2])*1000)/1000,
          visible:true
        }))
        .filter(r=>r.nom&&r.prix>=0);
      if(!data.length){setImportErr({target,msg:"Aucune ligne valide trouvée."});return;}
      setImportDlg({target,items:data,skipped:[],sep});
    }
  }

  async function confirmImport(mode){
    if(!importDlg)return;
    const {target,items}=importDlg;
    const table=target==="items_pm"?"items_pm":target==="items_gang"?"items_gang":target==="users"?"users":"pms";
    if(mode==="replace"){
      if(target==="users"){
        await sb.from(table).delete().neq("id",cu.id);
      } else {
        await sb.from(table).delete().neq("id","00000000-0000-0000-0000-000000000000");
      }
    }
    const {data}=await sb.from(table).insert(items).select();
    if(target==="items_pm")setItemsPM(mode==="replace"?(data||[]):p=>[...p,...(data||[])]);
    else if(target==="items_gang")setItemsG(mode==="replace"?(data||[]):p=>[...p,...(data||[])]);
    else if(target==="users")setUsers(mode==="replace"?[cu,...(data||[])]:p=>[...p,...(data||[])]);
    else setPMs(mode==="replace"?(data||[]):p=>[...p,...(data||[])]);

    const cat = target==="users" ? "access" : target==="pms" ? "items" : "items";
    const targetLabel = target==="items_pm"?"items PM":target==="items_gang"?"items gangs":target==="users"?"accès":"petites mains";
    log(cat,"import",`a importé <b>${items.length} ${targetLabel}</b> (mode : ${mode==="replace"?"écrasement":"ajout"})`);

    setImportDlg(null);
  }

  function exportCSV(target){
    if(target==="items_pm"){downloadCSV("items_pm.csv",toCSVItems(itemsPM));return;}
    if(target==="items_gang"){downloadCSV("items_gang.csv",toCSVItems(itemsG));return;}
    if(target==="pms"){downloadCSV("petites_mains.csv",toCSVPMs(pms,catsPM));return;}
    if(target==="users"){downloadCSV("acces.csv",toCSVUsers(users));return;}
  }

  async function toggleItemVisibility(item,table,setItems){
    const newVal=!(item.visible!==false);
    await sb.from(table).update({visible:newVal}).eq("id",item.id);
    setItems(is=>is.map(x=>x.id===item.id?{...x,visible:newVal}:x));
    log("items",newVal?"unhide":"hide",`a ${newVal?"affiché":"masqué"} l'item <b>${item.nom}</b> ${newVal?"👁":"🚫"}`);
  }

  const TABS_BASE=[{id:"dashboard",label:"Tableau de bord"},{id:"transactions",label:"Transactions"},{id:"commandes",label:"Commandes"},{id:"historique",label:"Historique"},{id:"apparts",label:"Apparts"},{id:"stats",label:"Stats"},{id:"database",label:"Database"},{id:"parametres",label:"Paramètres"}];
  const TABS=isAdmin?[...TABS_BASE,{id:"bigbrother",label:"👁 Bigbrother",admin:true}]:TABS_BASE;
  const ns=id=>{
    const isBB=id==="bigbrother";
    return {padding:"10px 15px",fontSize:13,fontWeight:tab===id?600:400,color:tab===id?(isBB?C.red:C.text):(isBB?"rgba(223,90,68,0.7)":C.muted),borderBottom:tab===id?"2px solid "+(isBB?C.red:C.amber):"2px solid transparent",background:"none",border:"none",cursor:"pointer",borderRadius:0,whiteSpace:"nowrap",boxShadow:"none"};
  };

  function CatTable({cats,setCats,table,eId,setEId,nc,setNc}){
    const isPM=table==="categories_pm";
    async function save(c){
      const before=cats.find(x=>x.id===c.id);
      const updateData = {nom:c.nom,pct_objets:c.pct_objets,taux_liasse:c.taux_liasse};
      if(isPM) updateData.prix_fixe = c.prix_fixe||0;
      await sb.from(table).update(updateData).eq("id",c.id);
      setCats(cs=>cs.map(x=>x.id===c.id?c:x));setEId(null);
      if(before){
        const ch=[];
        if(before.nom!==c.nom)ch.push(`nom : ${diff(before.nom,c.nom)}`);
        if(+before.pct_objets!==+c.pct_objets)ch.push(`% objets : ${diff(before.pct_objets+"%",c.pct_objets+"%")}`);
        if(+before.taux_liasse!==+c.taux_liasse)ch.push(`$/liasse : ${diff(fmt(before.taux_liasse),fmt(c.taux_liasse))}`);
        if(isPM && (+before.prix_fixe||0) !== (+c.prix_fixe||0)) ch.push(`prix ATM : ${diff(fmt(before.prix_fixe||0),fmt(c.prix_fixe||0))}`);
        if(ch.length>0) log("settings","cat_update",`a modifié la catégorie ${isPM?"PM":"gang"} <b>${c.nom}</b> · ${ch.join(" · ")}`);
      }
    }
    async function add(nom,pct,taux,prixFixe){
      const insertData = {nom,pct_objets:+pct||0,taux_liasse:+taux||0};
      if(isPM) insertData.prix_fixe = +prixFixe||0;
      const{data}=await sb.from(table).insert(insertData).select().single();
      if(data){
        setCats(p=>[...p,data]);
        log("settings","cat_create",`a créé la catégorie ${isPM?"PM":"gang"} <b>${data.nom}</b> · ${data.pct_objets}% · ${fmt(data.taux_liasse)}/liasse${isPM&&data.prix_fixe?" · "+fmt(data.prix_fixe)+" ATM":""}`);
      }
    }
    async function del(id){
      const c=cats.find(x=>x.id===id);
      await sb.from(table).delete().eq("id",id);
      setCats(cs=>cs.filter(x=>x.id!==id));
      if(c) log("settings","cat_delete",`a supprimé la catégorie ${isPM?"PM":"gang"} <b>${c.nom}</b>`);
    }
    const allKey = isPM?"catsPM":"catsGang";
    const visible = showAll[allKey] ? cats : cats.slice(0,PREVIEW);
    const gridCols = isPM ? "1fr 70px 80px 80px auto" : "1fr 80px 90px auto";
    return <>
      <div style={{display:"grid",gridTemplateColumns:gridCols,gap:8,marginBottom:8}}>
        <span style={S.lbl}>Nom</span>
        <span style={{...S.lbl,textAlign:"right"}}>% objets</span>
        <span style={{...S.lbl,textAlign:"right"}}>$/liasse</span>
        {isPM&&<span style={{...S.lbl,textAlign:"right"}}>$ ATM</span>}
        <span/>
      </div>
      {visible.map(c=>(
        <div key={c.id} style={{display:"grid",gridTemplateColumns:gridCols,gap:8,alignItems:"center",marginBottom:8}}>
          {isAdmin&&eId===c.id
            ?<EditCatForm cat={c} onSave={save} onCancel={()=>setEId(null)} showPrixFixe={isPM}/>
            :<>
              <span style={{fontSize:14,color:C.text}}>{c.nom}</span>
              <span style={{fontSize:13,color:C.muted,textAlign:"right"}}>{c.pct_objets}%</span>
              <span style={{fontSize:13,color:C.muted,textAlign:"right"}}>{c.taux_liasse}$</span>
              {isPM&&<span style={{fontSize:13,color:c.prix_fixe?C.amber:C.dim,textAlign:"right"}}>{c.prix_fixe?fmt(c.prix_fixe):"—"}</span>}
              {isAdmin&&<div style={{display:"flex",gap:4}}><button onClick={()=>setEId(c.id)}>Mod.</button><button onClick={()=>del(c.id)} style={{color:C.red}}>×</button></div>}
            </>
          }
        </div>
      ))}
      {cats.length>PREVIEW&&(
        <button onClick={()=>setShowAll(s=>({...s,[allKey]:!s[allKey]}))} style={{width:"100%",fontSize:11,padding:"6px",marginTop:4,marginBottom:8,background:"transparent",color:C.muted,border:"1px dashed "+C.border,borderRadius:6}}>
          {showAll[allKey]?"▲ Réduire":`▼ Voir tous (${cats.length})`}
        </button>
      )}
      {isAdmin&&<AddCatForm onAdd={add} showPrixFixe={isPM}/>}
    </>;
  }

  function PMList(){
    async function save(p){
      const before=pms.find(x=>x.id===p.id);
      await sb.from("pms").update({nom:p.nom,categorie_id:p.categorie_id,numero:p.numero||null,lieu_taff:p.lieu_taff||null,groupe_id:p.groupe_id||null,note:p.note||null}).eq("id",p.id);
      setPMs(ps=>ps.map(x=>x.id===p.id?p:x));setEPM(null);
      if(before){
        const ch=[];
        if(before.nom!==p.nom)ch.push(`nom : ${diff(before.nom,p.nom)}`);
        if(before.categorie_id!==p.categorie_id){
          const oldCat=catsPM.find(c=>c.id===before.categorie_id)?.nom||"?";
          const newCat=catsPM.find(c=>c.id===p.categorie_id)?.nom||"?";
          ch.push(`catégorie : ${diff(oldCat,newCat)}`);
        }
        if((before.numero||"")!==(p.numero||"")) ch.push(`numéro : ${diff(before.numero||"—",p.numero||"—")}`);
        if((before.lieu_taff||"")!==(p.lieu_taff||"")) ch.push(`lieu : ${diff(before.lieu_taff||"—",p.lieu_taff||"—")}`);
        if((before.groupe_id||"")!==(p.groupe_id||"")){
          const oldGr=pmGroupes.find(g=>g.id===before.groupe_id)?.nom||"—";
          const newGr=pmGroupes.find(g=>g.id===p.groupe_id)?.nom||"—";
          ch.push(`groupe : ${diff(oldGr,newGr)}`);
        }
        if((before.note||"")!==(p.note||"")) ch.push(`note ${before.note?"modifiée":"ajoutée"}`);
        if(ch.length>0) log("items","pm_update",`a modifié la PM <b>${p.nom}</b> · ${ch.join(" · ")}`);
      }
    }
    async function add(payload){
      const{data}=await sb.from("pms").insert(payload).select().single();
      if(data){
        setPMs(p=>[...p,data]);
        const cat=catsPM.find(c=>c.id===data.categorie_id)?.nom||"?";
        const groupe=pmGroupes.find(g=>g.id===data.groupe_id)?.nom;
        const extras=[];
        if(data.numero) extras.push(`📞 ${data.numero}`);
        if(data.lieu_taff) extras.push(`📍 ${data.lieu_taff}`);
        if(groupe) extras.push(`👥 ${groupe}`);
        if(data.note) extras.push(`📝 note`);
        log("items","pm_create",`a créé la PM <b>${data.nom}</b> (catégorie : ${cat}${extras.length?" · "+extras.join(" · "):""})`);
      }
    }
    async function del(id){
      const p=pms.find(x=>x.id===id);
      await sb.from("pms").delete().eq("id",id);
      setPMs(ps=>ps.filter(x=>x.id!==id));
      if(p) log("items","pm_delete",`a supprimé la PM <b>${p.nom}</b>`);
    }
    // Filtrage par recherche (nom ou numéro)
    const searchLower = pmSearch.trim().toLowerCase();
    const filteredPMs = searchLower
      ? pms.filter(p=>{
          const nomMatch = (p.nom||"").toLowerCase().includes(searchLower);
          const numMatch = (p.numero||"").toLowerCase().includes(searchLower);
          const lieuMatch = (p.lieu_taff||"").toLowerCase().includes(searchLower);
          const noteMatch = (p.note||"").toLowerCase().includes(searchLower);
          return nomMatch || numMatch || lieuMatch || noteMatch;
        })
      : pms;
    const visible = showAll.pms ? filteredPMs : filteredPMs.slice(0,PREVIEW);
    return <>
      {searchLower&&filteredPMs.length===0&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic",padding:"10px 0",textAlign:"center"}}>Aucune PM trouvée pour "{pmSearch}"</div>}
      {searchLower&&filteredPMs.length>0&&<div style={{fontSize:11,color:C.dim,marginBottom:6}}>{filteredPMs.length} résultat{filteredPMs.length>1?"s":""}</div>}
      {visible.map(p=>{
        const cat=catsPM.find(c=>c.id===p.categorie_id);
        const groupe=pmGroupes.find(g=>g.id===p.groupe_id);
        if(ePM===p.id){
          return (
            <EditPMForm
              key={p.id}
              pm={p}
              catsPM={catsPM}
              pmGroupes={pmGroupes}
              onSave={save}
              onCancel={()=>setEPM(null)}
            />
          );
        }
        return (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"6px 8px",borderRadius:4}}>
            <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:14,color:C.text,fontWeight:500}}>{p.nom}</span>
              {groupe&&<span style={{fontSize:9,padding:"1px 6px",background:"rgba(227,185,74,0.12)",color:C.amber,border:"1px solid rgba(227,185,74,0.3)",borderRadius:10,fontWeight:600}}>👥 {groupe.nom}</span>}
              {p.numero&&(
                <button
                  onClick={(e)=>{e.stopPropagation();navigator.clipboard?.writeText(p.numero);setCopied("tel:"+p.id);setTimeout(()=>setCopied(null),1500);}}
                  title="Cliquer pour copier"
                  style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",background:C.surfaceAlt,border:"1px solid "+(copied==="tel:"+p.id?C.green:C.border),borderRadius:6,color:copied==="tel:"+p.id?C.green:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
                >
                  <span>📞</span>
                  <span style={{fontFamily:"monospace",color:copied==="tel:"+p.id?C.green:C.text}}>{p.numero}</span>
                  <span style={{fontSize:10,opacity:0.7}}>{copied==="tel:"+p.id?"✓":"⧉"}</span>
                </button>
              )}
              {p.lieu_taff&&<span style={{fontSize:11,color:C.dim,display:"inline-flex",alignItems:"center",gap:3}}>📍 {p.lieu_taff}</span>}
              {p.note&&(
                <button
                  onClick={(e)=>{e.stopPropagation();setEPM(p.id);}}
                  title={p.note}
                  style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",background:"rgba(227,185,74,0.10)",border:"1px solid rgba(227,185,74,0.3)",borderRadius:6,color:C.amber,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
                >
                  <span>📝</span>
                  <span style={{fontSize:10}}>note</span>
                </button>
              )}
            </div>
            <span style={{fontSize:11,color:C.muted,flexShrink:0}}>{cat?.nom||"?"}</span>
            <button onClick={()=>setEPM(p.id)} style={{fontSize:11,padding:"3px 8px"}}>Mod.</button>
            {isAdmin&&<button onClick={()=>del(p.id)} style={{fontSize:11,padding:"3px 8px",color:C.red}}>×</button>}
          </div>
        );
      })}
      {filteredPMs.length>PREVIEW&&(
        <button onClick={()=>setShowAll(s=>({...s,pms:!s.pms}))} style={{width:"100%",fontSize:11,padding:"6px",marginTop:4,background:"transparent",color:C.muted,border:"1px dashed "+C.border,borderRadius:6}}>
          {showAll.pms?"▲ Réduire":`▼ Voir ${searchLower?"tous les résultats":"tous"} (${filteredPMs.length})`}
        </button>
      )}
      {/* Ajout autorisé pour TOUS (admin et membre) — composant stable hors de Main */}
      <AddPMForm catsPM={catsPM} pmGroupes={pmGroupes} onAdd={add} isAdmin={isAdmin}/>
    </>;
  }

  function GroupeList(){
    async function saveGroupe(g){
      const before=pmGroupes.find(x=>x.id===g.id);
      await sb.from("pm_groupes").update({nom:g.nom}).eq("id",g.id);
      setPMGroupes(gs=>gs.map(x=>x.id===g.id?g:x));
      setEGr(null);
      if(before&&before.nom!==g.nom) log("items","groupe_update",`a renommé le groupe <b>${diff(before.nom,g.nom)}</b>`);
    }
    async function addGroupe(nom){
      const{data}=await sb.from("pm_groupes").insert({nom}).select().single();
      if(data){
        setPMGroupes(gs=>[...gs,data]);
        log("items","groupe_create",`a créé le groupe <b>${data.nom}</b>`);
      }
    }
    async function delGroupe(id){
      const g=pmGroupes.find(x=>x.id===id);
      if(!g)return;
      // Détacher toutes les PM du groupe avant suppression
      await sb.from("pms").update({groupe_id:null}).eq("groupe_id",id);
      setPMs(ps=>ps.map(p=>p.groupe_id===id?{...p,groupe_id:null}:p));
      await sb.from("pm_groupes").delete().eq("id",id);
      setPMGroupes(gs=>gs.filter(x=>x.id!==id));
      log("items","groupe_delete",`a supprimé le groupe <b>${g.nom}</b>`);
    }
    const visible = showAll.groupes ? pmGroupes : pmGroupes.slice(0,PREVIEW);
    return <>
      {pmGroupes.length===0&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic",padding:"6px 0"}}>Aucun groupe pour l'instant. Crée-en un ci-dessous puis assigne tes PM dans la liste "Petites mains".</div>}
      {visible.map(g=>{
        const membres=pms.filter(p=>p.groupe_id===g.id);
        if(eGr===g.id){
          return (
            <EditGroupeForm
              key={g.id}
              groupe={g}
              onSave={saveGroupe}
              onCancel={()=>setEGr(null)}
            />
          );
        }
        return (
          <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"6px 8px"}}>
            <span style={{fontSize:13}}>👥</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,color:C.text,fontWeight:500}}>{g.nom}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:1}}>
                {membres.length===0 ? "aucun membre" : membres.map(m=>m.nom).join(", ")}
              </div>
            </div>
            <button onClick={()=>setEGr(g.id)} style={{fontSize:11,padding:"3px 8px"}}>Mod.</button>
            {isAdmin&&<button onClick={()=>delGroupe(g.id)} style={{fontSize:11,padding:"3px 8px",color:C.red}}>×</button>}
          </div>
        );
      })}
      {pmGroupes.length>PREVIEW&&(
        <button onClick={()=>setShowAll(s=>({...s,groupes:!s.groupes}))} style={{width:"100%",fontSize:11,padding:"6px",marginTop:4,background:"transparent",color:C.muted,border:"1px dashed "+C.border,borderRadius:6}}>
          {showAll.groupes?"▲ Réduire":`▼ Voir tous (${pmGroupes.length})`}
        </button>
      )}
      <AddGroupeForm onAdd={addGroupe}/>
    </>;
  }

  function GangList(){
    async function save(p){
      const before=gangs.find(x=>x.id===p.id);
      await sb.from("gangs").update({nom:p.nom,categorie_id:p.categorie_id}).eq("id",p.id);
      setGangs(ps=>ps.map(x=>x.id===p.id?p:x));setEGa(null);
      if(before){
        const ch=[];
        if(before.nom!==p.nom)ch.push(`nom : ${diff(before.nom,p.nom)}`);
        if(before.categorie_id!==p.categorie_id){
          const oldCat=catsGang.find(c=>c.id===before.categorie_id)?.nom||"?";
          const newCat=catsGang.find(c=>c.id===p.categorie_id)?.nom||"?";
          ch.push(`catégorie : ${diff(oldCat,newCat)}`);
        }
        if(ch.length>0) log("items","gang_update",`a modifié le gang <b>${p.nom}</b> · ${ch.join(" · ")}`);
      }
    }
    async function add(nom,catId){
      const{data}=await sb.from("gangs").insert({nom,categorie_id:catId}).select().single();
      if(data){
        setGangs(p=>[...p,data]);
        const cat=catsGang.find(c=>c.id===data.categorie_id)?.nom||"?";
        log("items","gang_create",`a créé le gang <b>${data.nom}</b> (catégorie : ${cat})`);
      }
    }
    async function del(id){
      const p=gangs.find(x=>x.id===id);
      await sb.from("gangs").delete().eq("id",id);
      setGangs(ps=>ps.filter(x=>x.id!==id));
      if(p) log("items","gang_delete",`a supprimé le gang <b>${p.nom}</b>`);
    }
    const visible = showAll.gangs ? gangs : gangs.slice(0,PREVIEW);
    return <>
      {visible.map(p=>(
        <div key={p.id} style={S.row}>
          {isAdmin&&eGa===p.id
            ?<EditGangForm gang={p} catsGang={catsGang} onSave={save} onCancel={()=>setEGa(null)}/>
            :<><span style={{flex:1,fontSize:14,color:C.text}}>{p.nom}</span><span style={{fontSize:12,color:C.muted}}>{catsGang.find(c=>c.id===p.categorie_id)?.nom||"?"}</span>{isAdmin&&<><button onClick={()=>setEGa(p.id)}>Mod.</button><button onClick={()=>del(p.id)} style={{color:C.red}}>×</button></>}</>
          }
        </div>
      ))}
      {gangs.length>PREVIEW&&(
        <button onClick={()=>setShowAll(s=>({...s,gangs:!s.gangs}))} style={{width:"100%",fontSize:11,padding:"6px",marginTop:4,background:"transparent",color:C.muted,border:"1px dashed "+C.border,borderRadius:6}}>
          {showAll.gangs?"▲ Réduire":`▼ Voir tous (${gangs.length})`}
        </button>
      )}
      {isAdmin&&<AddGangForm catsGang={catsGang} onAdd={add}/>}
    </>;
  }

  // ── Liste d'items avec œil + poids (avec affichage partiel) ──
  function IList({items,setItems,table,eId,setEId,ni,setNi,canEdit,target,allKey}){
    const isPM=table==="items_pm";
    async function save(it){
      const before=items.find(x=>x.id===it.id);
      await sb.from(table).update({nom:it.nom,prix:it.prix,poids:+it.poids||0}).eq("id",it.id);
      setItems(is=>is.map(x=>x.id===it.id?it:x));
      setEId(null);
      if(before){
        const ch=[];
        if(before.nom!==it.nom)ch.push(`nom : ${diff(before.nom,it.nom)}`);
        if(+before.prix!==+it.prix)ch.push(`prix : ${diff(fmt(before.prix),fmt(it.prix))}`);
        if(+(before.poids||0)!==+(it.poids||0))ch.push(`poids : ${diff(fmtKgD(before.poids||0),fmtKgD(it.poids||0))}`);
        if(ch.length>0) log("items","update",`a modifié l'item ${isPM?"PM":"gang"} <b>${it.nom}</b> · ${ch.join(" · ")}`);
      }
    }
    async function add(nom,prix,poids){
      const payload={nom,prix:+prix,poids:+poids||0,visible:true};
      const{data}=await sb.from(table).insert(payload).select().single();
      if(data){
        setItems(p=>[...p,data]);
        log("items","create",`a créé l'item ${isPM?"PM":"gang"} <b>${data.nom}</b> · ${fmt(data.prix)}${data.poids>0?" · "+fmtKgD(data.poids):""}`);
      }
    }
    async function del(id){
      const it=items.find(x=>x.id===id);
      await sb.from(table).delete().eq("id",id);
      setItems(is=>is.filter(x=>x.id!==id));
      if(it) log("items","delete",`a supprimé l'item ${isPM?"PM":"gang"} <b>${it.nom}</b>`);
    }

    const visibleCount=items.filter(it=>it.visible!==false).length;
    const isAll=showAll[allKey];
    const displayed=isAll?items:items.slice(0,PREVIEW);

    return <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:11,color:C.muted}}>{visibleCount} visible{visibleCount>1?"s":""} / {items.length} total</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>exportCSV(target)} style={{fontSize:11,padding:"4px 10px"}}>↓ Export CSV</button>
          {canEdit&&<button onClick={()=>triggerImport(target)} style={{fontSize:11,padding:"4px 10px",background:C.amber,color:"#1a1a1a",border:"none",fontWeight:700}}>↑ Importer CSV</button>}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 4px 6px",fontSize:9,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:"1px solid "+C.border,marginBottom:4}}>
        <span style={{width:30}}></span>
        <span style={{flex:1}}>Nom</span>
        <span data-mobile="col-prix" style={{width:70,textAlign:"right"}}>Prix</span>
        <span data-mobile="col-poids" style={{width:65,textAlign:"right"}}>Poids</span>
        {canEdit&&<span data-mobile="col-actions" style={{width:80}}></span>}
      </div>

      {displayed.map(it=>{
        const visible=it.visible!==false;
        return (
          <div key={it.id} data-mobile="item-row" style={{...S.row,opacity:visible?1:0.45,transition:"opacity .25s",borderBottom:"1px solid #404040",paddingBottom:6,marginBottom:4}}>
            {canEdit
              ?<button onClick={()=>toggleItemVisibility(it,table,setItems)}
                title={visible?"Masquer cet item dans Transactions":"Rendre visible dans Transactions"}
                style={{width:30,padding:"3px 0",background:"transparent",border:"none",cursor:"pointer",color:visible?C.muted:C.red,fontSize:14,boxShadow:"none"}}>
                {visible?"👁":"🚫"}
              </button>
              :<span style={{width:30,textAlign:"center",fontSize:13,color:visible?C.muted:C.red}}>{visible?"👁":"🚫"}</span>
            }

            {canEdit&&eId===it.id
              ?<EditItemForm item={it} onSave={save} onCancel={()=>setEId(null)} isPM={isPM}/>
              :<>
                <span style={{flex:1,minWidth:0,fontSize:14,color:C.text,wordBreak:"break-word"}}>
                  {it.nom}
                  {!visible&&<span style={{fontSize:9,padding:"1px 6px",background:"rgba(224,85,85,0.15)",color:C.red,border:"1px solid rgba(224,85,85,0.3)",borderRadius:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginLeft:6}}>masqué</span>}
                </span>
                <span data-mobile="col-prix" style={{width:70,fontSize:13,color:C.muted,textAlign:"right",whiteSpace:"nowrap"}}>{fmt(it.prix)}</span>
                <span data-mobile="col-poids" style={{width:65,fontSize:13,color:C.blue,textAlign:"right",whiteSpace:"nowrap"}}>{fmtKgD(it.poids||0)}</span>
                {canEdit&&<div data-mobile="col-actions" style={{display:"flex",gap:4,width:80,justifyContent:"flex-end"}}>
                  <button onClick={()=>setEId(it.id)} style={{fontSize:11,padding:"3px 8px"}}>Mod.</button>
                  <button onClick={()=>del(it.id)} style={{color:C.red,fontSize:11,padding:"3px 8px"}}>×</button>
                </div>}
              </>
            }
          </div>
        );
      })}

      {/* Bouton Voir tout / Réduire */}
      {items.length>PREVIEW&&(
        <div style={{textAlign:"center",margin:"6px 0 4px"}}>
          <button onClick={()=>setShowAll(s=>({...s,[allKey]:!isAll}))} style={{fontSize:11,padding:"5px 14px",background:"transparent",border:"1px dashed "+C.border,color:C.muted}}>
            {isAll?"Réduire ↑":`Voir tout (${items.length}) ↓`}
          </button>
        </div>
      )}

      {canEdit&&<AddItemForm onAdd={add}/>}
    </>;
  }

  async function addAppart(){
    if(!nAp.nom)return;
    const payload={
      nom:nAp.nom,
      categorie:nAp.categorie||"recel",
      coffre:0,
      stock:0,
      max_coffre:+nAp.max_coffre||10000,
      max_stock:+nAp.max_stock||100,
      code:nAp.code||""
    };
    const {data}=await sb.from("apparts").insert(payload).select().single();
    if(data){
      setApparts(p=>[...p,data]);
      log("apparts","create",`a créé l'appart <b>${data.nom}</b> (${getCat(data.categorie).label} · max ${fmt(data.max_coffre)} / ${fmtKg(data.max_stock)})`);
    }
    setNAp({nom:"",categorie:"recel",max_coffre:"",max_stock:"",code:""});
  }
  async function delAppart(id){
    if(!confirm("Supprimer cet appart définitivement ?"))return;
    const ap=apparts.find(a=>a.id===id);
    await sb.from("apparts").delete().eq("id",id);
    setApparts(p=>p.filter(a=>a.id!==id));
    if(ap) log("apparts","delete",`a supprimé l'appart <b>${ap.nom}</b>`);
  }
  async function saveAppartEdit(){
    if(!eApId)return;
    const f={
      nom:eApV.nom,
      categorie:eApV.categorie,
      max_coffre:+eApV.max_coffre||0,
      max_stock:+eApV.max_stock||0,
      code:eApV.code||""
    };
    await updateAppart(eApId,f);
    setEApId(null);
  }

  if(loading) return <div style={{background:C.bg,minHeight:"100vh"}}><style>{G}</style><Loader/></div>;

  const blDep = blanch?new Date(blanch.depot_at):null;
  const blRec = blanch?new Date(blanch.recup_at):null;
  const blMs = blRec?(blRec.getTime()-now):0;
  const blTotal = blDep&&blRec?(blRec.getTime()-blDep.getTime()):1;
  const blElapsed = blDep?(now-blDep.getTime()):0;
  const blPct = Math.min(100,Math.max(0,(blElapsed/blTotal)*100));
  const blReady = blMs<=0;
  const blPreviewAmount = +blAmount||0;
  const blPreviewDur = blPreviewAmount>0?blDuration(blPreviewAmount):0;
  const blPreviewEnd = blPreviewAmount>0?new Date(Date.now()+blPreviewDur*3600000):null;

  // Affichage partiel des membres dans Database
  const membersDisplayed=showAll.members?members:members.slice(0,PREVIEW);

  return (
    <div data-mobile="container" style={{padding:"1.25rem",maxWidth:1180,margin:"0 auto",minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{G}</style>

      <input ref={fileRefPM}    type="file" accept=".csv,text/csv" onChange={e=>onFileChosen(e,"items_pm")} style={{display:"none"}}/>
      <input ref={fileRefG}     type="file" accept=".csv,text/csv" onChange={e=>onFileChosen(e,"items_gang")} style={{display:"none"}}/>
      <input ref={fileRefPMs}   type="file" accept=".csv,text/csv" onChange={e=>onFileChosen(e,"pms")} style={{display:"none"}}/>
      <input ref={fileRefUsers} type="file" accept=".csv,text/csv" onChange={e=>onFileChosen(e,"users")} style={{display:"none"}}/>

      {importErr&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}} onClick={()=>setImportErr(null)}>
          <div onClick={e=>e.stopPropagation()} style={{...card,maxWidth:480,width:"100%",border:"1px solid rgba(224,85,85,0.4)",background:"rgba(224,85,85,0.05)"}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:C.red}}>⛔ Import bloqué</div>
            <div style={{fontSize:13,color:C.text,marginBottom:14,lineHeight:1.5}}>{importErr.msg}</div>
            <div style={{background:"rgba(224,85,85,0.08)",border:"1px solid rgba(224,85,85,0.3)",borderRadius:6,padding:"10px 12px",fontSize:12,color:C.muted,marginBottom:14}}>
              <strong style={{color:C.text}}>Format attendu — 3 colonnes : nom, prix, poids (Kg)</strong>
              <div style={{marginTop:8,fontSize:11,color:C.text}}>Format Excel FR (recommandé) — séparateur <code style={{background:C.surfaceAlt,padding:"1px 4px",borderRadius:3}}>;</code> :</div>
              <div style={{marginTop:4,fontFamily:"monospace",fontSize:11,color:C.text,background:C.surfaceAlt,padding:"6px 8px",borderRadius:4}}>
                nom;prix;poids<br/>
                Bague en or;145;0,05<br/>
                Console de jeu;420;3,0
              </div>
              <div style={{marginTop:10,fontSize:11,color:C.text}}>Format anglo-saxon — séparateur <code style={{background:C.surfaceAlt,padding:"1px 4px",borderRadius:3}}>,</code> :</div>
              <div style={{marginTop:4,fontFamily:"monospace",fontSize:11,color:C.text,background:C.surfaceAlt,padding:"6px 8px",borderRadius:4}}>
                nom,prix,poids<br/>
                Bague en or,145,0.05<br/>
                Console de jeu,420,3.0
              </div>
              <div style={{marginTop:8,fontSize:11}}>💡 Astuce : exporte les items existants, ajuste les poids dans Excel, puis réimporte le fichier.</div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button onClick={()=>setImportErr(null)}>OK, j'ai compris</button>
            </div>
          </div>
        </div>
      )}

      {importDlg&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}} onClick={()=>setImportDlg(null)}>
          <div onClick={e=>e.stopPropagation()} style={{...card,maxWidth:480,width:"100%"}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>
              Importer {importDlg.target==="items_pm"?"items PM":importDlg.target==="items_gang"?"items gangs":importDlg.target==="users"?"accès":"petites mains"}
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>
              {importDlg.items.length} ligne{importDlg.items.length>1?"s":""} valide{importDlg.items.length>1?"s":""} détectée{importDlg.items.length>1?"s":""}
              {importDlg.skipped&&importDlg.skipped.length>0&&" · "+importDlg.skipped.length+" ignorée"+(importDlg.skipped.length>1?"s":"")}
            </div>
            {importDlg.items.length>0&&(
              <div style={{maxHeight:160,overflowY:"auto",background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:8,padding:8,marginBottom:10,fontSize:12}}>
                {importDlg.target==="items_pm"||importDlg.target==="items_gang"?(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1.5fr 65px 70px",gap:6,fontSize:9,color:C.muted,textTransform:"uppercase",fontWeight:600,borderBottom:"1px solid "+C.border,paddingBottom:4,marginBottom:4}}>
                      <span>Nom</span><span style={{textAlign:"right"}}>Prix</span><span style={{textAlign:"right"}}>Poids</span>
                    </div>
                    {importDlg.items.slice(0,10).map((it,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1.5fr 65px 70px",gap:6,padding:"2px 0"}}>
                      <span>{it.nom}</span>
                      <span style={{textAlign:"right",color:C.muted}}>{fmt(it.prix)}</span>
                      <span style={{textAlign:"right",color:C.blue}}>{fmtKgD(it.poids)}</span>
                    </div>)}
                  </>
                ):importDlg.target==="users"?(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 80px 70px",gap:6,fontSize:9,color:C.muted,textTransform:"uppercase",fontWeight:600,borderBottom:"1px solid "+C.border,paddingBottom:4,marginBottom:4}}>
                      <span>Nom</span><span>Code</span><span style={{textAlign:"right"}}>Rôle</span>
                    </div>
                    {importDlg.items.slice(0,10).map((it,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 80px 70px",gap:6,padding:"2px 0"}}>
                      <span>{it.nom}</span>
                      <span style={{color:C.muted,fontFamily:"monospace"}}>{"•".repeat(Math.min(it.code.length,8))}</span>
                      <span style={{textAlign:"right",color:it.role==="admin"?C.red:C.blue,fontWeight:600,fontSize:11}}>{it.role}</span>
                    </div>)}
                  </>
                ):(
                  importDlg.items.slice(0,10).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 4px"}}>
                    <span>{it.nom}</span>
                    <span style={{color:C.muted}}>{catsPM.find(c=>c.id===it.categorie_id)?.nom||""}</span>
                  </div>)
                )}
                {importDlg.items.length>10&&<div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:4}}>… et {importDlg.items.length-10} de plus</div>}
              </div>
            )}
            {importDlg.skipped&&importDlg.skipped.length>0&&(
              <div style={{background:"rgba(212,146,10,0.08)",border:"1px solid rgba(212,146,10,0.3)",borderRadius:6,padding:"8px 10px",marginBottom:12,fontSize:11,color:C.amber}}>
                ⚠ {importDlg.skipped.length} ligne{importDlg.skipped.length>1?"s":""} ignorée{importDlg.skipped.length>1?"s":""}
                {importDlg.target==="users"
                  ?<div style={{marginTop:4,color:C.text}}>{importDlg.skipped.slice(0,4).map((s,i)=><div key={i} style={{fontSize:10}}>• {s.nom} — {s.reason}</div>)}</div>
                  :<>
                    <span> — catégorie inconnue :</span>
                    <div style={{marginTop:4,color:C.text}}>
                      {[...new Set(importDlg.skipped.map(s=>s.catName))].slice(0,5).map((c,i)=><span key={i} style={{display:"inline-block",margin:"2px 4px 0 0",padding:"1px 6px",background:C.surfaceAlt,borderRadius:3,fontFamily:"monospace"}}>{c||"(vide)"}</span>)}
                    </div>
                    <div style={{marginTop:6,fontSize:10,color:C.muted}}>Crée d'abord ces catégories puis relance l'import.</div>
                  </>
                }
              </div>
            )}
            {importDlg.items.length>0&&(<>
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Mode d'import :</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                <button onClick={()=>confirmImport("append")} style={{padding:"10px 14px",textAlign:"left",background:C.surfaceAlt,border:"1px solid "+C.border}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>Ajouter à l'existant</div>
                  <div style={{fontSize:11,color:C.muted}}>Les nouvelles lignes sont ajoutées. L'existant est conservé.</div>
                </button>
                <button onClick={()=>{if(confirm("Supprimer TOUT avant import ?"+(importDlg.target==="users"?" (Ton compte sera préservé.)":"")))confirmImport("replace");}} style={{padding:"10px 14px",textAlign:"left",background:"rgba(224,85,85,0.08)",border:"1px solid rgba(224,85,85,0.3)"}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:2,color:C.red}}>Écraser tout</div>
                  <div style={{fontSize:11,color:C.muted}}>Supprime tout avant import.{importDlg.target==="users"&&" Ton compte est préservé."}</div>
                </button>
              </div>
            </>)}
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button onClick={()=>setImportDlg(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div data-mobile="header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/SClogo.png" alt="Silent Covenant" style={{width:32,height:32,objectFit:"contain",flexShrink:0}}/>
          <h2 style={{fontSize:19,fontWeight:700,margin:0}}>Compta Covenant</h2>
        </div>
        <div data-mobile="header-right" style={{display:"flex",alignItems:"center",gap:8}}><RoleBadge role={cu.role}/><span style={{fontSize:13,color:C.muted}}>{cu.nom}</span><button onClick={onLogout} style={{fontSize:12,color:C.red,padding:"4px 10px"}}>Déconnexion</button></div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid "+C.border,marginBottom:"1.5rem",overflowX:"auto",gap:2}}>
        {TABS.map(t=><button key={t.id} style={ns(t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab==="dashboard"&&(()=>{
        // Calcul de la couleur du stock selon le palier
        const stockPct = pv(totSU,totSM);
        const stockColor = stockPct>=90 ? "#c41e1e" /* rouge sang */
                        : stockPct>=80 ? C.red       /* rouge */
                        : stockPct>=70 ? C.amber     /* jaune/ambre */
                        : C.text;                     /* normal */
        return (
        <div>
          {/* KPI dashboard : style "tableau dense" — cellules collées avec souligné amber sous les titres */}
          <div data-mobile="stats-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:24,border:"1px solid "+C.border,borderRadius:8,overflow:"hidden",background:C.surface}}>
            {/* Total coffres : ROUGE (argent sale) */}
            <div style={{padding:"16px 20px",borderRight:"1px solid "+C.border}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em"}}>Total coffres</span>
                <span style={{flex:1,height:1,background:C.borderSoft}}/>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,lineHeight:1.1}}>
                <span style={{fontSize:30,fontWeight:700,color:C.red,wordBreak:"break-word"}}>{fmt(totCoffres).replace("$","")}</span>
                <span style={{fontSize:14,color:C.dim,fontWeight:500}}>$</span>
              </div>
            </div>
            {/* Total comptes : VERT (argent propre) */}
            <div style={{padding:"16px 20px",borderRight:"1px solid "+C.border}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em"}}>Total comptes</span>
                <span style={{flex:1,height:1,background:C.borderSoft}}/>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,lineHeight:1.1}}>
                <span style={{fontSize:30,fontWeight:700,color:C.green,wordBreak:"break-word"}}>{fmt(totMem).replace("$","")}</span>
                <span style={{fontSize:14,color:C.dim,fontWeight:500}}>$</span>
              </div>
            </div>
            {/* Stock apparts : underline AMBER sous le titre + chiffre + barre underline */}
            <div style={{padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em"}}>Stock apparts</span>
                <span style={{flex:1,height:1,background:C.borderSoft}}/>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:6,lineHeight:1.1,marginBottom:8}}>
                <span style={{fontSize:30,fontWeight:700,color:stockColor}}>{Math.round(totSU).toLocaleString("fr-FR")}</span>
                <span style={{fontSize:14,color:C.dim,fontWeight:500}}>/ {Math.round(totSM).toLocaleString("fr-FR")} Kg</span>
                {stockPct>=90&&<span style={{fontSize:13,color:stockColor,fontWeight:700}}>⚠</span>}
              </div>
              <div style={{height:2,background:C.borderSoft,borderRadius:1,overflow:"hidden"}}>
                <div style={{width:Math.min(100,stockPct)+"%",height:"100%",background:C.amber,transition:"width .3s"}}/>
              </div>
            </div>
          </div>

          {/* BLANCHISSERIE + ENTREPÔTS côte à côte (2 colonnes) */}
          <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

          <div style={{...card,marginBottom:0,borderLeft:"3px solid "+C.amber}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:10,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.12em"}}>Blanchisserie</span>
                <span style={{fontSize:11,padding:"2px 9px",borderRadius:5,fontWeight:600,
                  background:!blanch?"rgba(160,160,160,0.15)":blReady?"rgba(61,191,143,0.15)":"rgba(212,146,10,0.15)",
                  color:!blanch?C.muted:blReady?C.green:C.amber,
                  border:"1px solid "+(!blanch?"rgba(160,160,160,0.3)":blReady?"rgba(61,191,143,0.3)":"rgba(212,146,10,0.3)")}}>
                  {!blanch?"Vide":blReady?"Prêt":"En cours"}
                </span>
              </div>
            </div>

            {!blanch?(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"end"}}>
                  <div>
                    <div style={S.lbl}>Montant à blanchir ($)</div>
                    <input type="number" min="1" placeholder="ex: 75000" value={blAmount} onChange={e=>setBlAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startBlanch()} style={{width:"100%"}}/>
                  </div>
                  <button onClick={startBlanch} disabled={blPreviewAmount<=0} style={{padding:"10px 26px",fontWeight:700,fontSize:13,letterSpacing:"0.05em",textTransform:"uppercase",background:blPreviewAmount>0?C.amber:"#3a3a3a",color:blPreviewAmount>0?"#1a1a1a":C.muted,border:"none",borderRadius:6,transition:"background .2s"}} onMouseEnter={e=>{if(blPreviewAmount>0)e.currentTarget.style.background=C.amberBright;}} onMouseLeave={e=>{if(blPreviewAmount>0)e.currentTarget.style.background=C.amber;}}>Démarrer</button>
                </div>
                <div style={{marginTop:8,fontSize:12,color:C.muted}}>
                  {blPreviewAmount<=0?"Saisis un montant pour voir la durée estimée."
                  :<>Durée : <strong style={{color:C.text}}>{blPreviewDur}h</strong> · Récupération vers <strong style={{color:C.green}}>{fmtTime(blPreviewEnd)}</strong></>}
                </div>
              </div>
            ):(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:12}}>
                  <div>
                    <div style={S.lbl}>Montant déposé</div>
                    <div style={{fontSize:20,fontWeight:700,color:C.amber}}>{fmt(blanch.montant)}</div>
                  </div>
                  <div>
                    <div style={S.lbl}>Déposé à</div>
                    <div style={{fontSize:14,fontWeight:600}}>{fmtDateTime(blDep)}</div>
                    {blanch.user_nom&&<div style={{fontSize:11,color:C.muted}}>par {blanch.user_nom}</div>}
                  </div>
                  <div>
                    <div style={S.lbl}>Récupération</div>
                    <div style={{fontSize:14,fontWeight:600,color:C.green}}>{fmtDateTime(blRec)}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}>
                      <span>{fmtRem(blMs)}</span>
                      <span>{Math.round(blPct)}%</span>
                    </div>
                    <Bar val={blPct} max={100} color={blReady?C.green:C.amber}/>
                  </div>
                  <button onClick={collectBlanch} disabled={!blReady} style={{padding:"7px 16px",fontWeight:700,background:blReady?C.green:"#3a3a3a",color:blReady?"#1a1a1a":C.muted,border:"none",cursor:blReady?"pointer":"not-allowed",opacity:blReady?1:0.6}}>Récupérer</button>
                  {isAdmin&&<button onClick={()=>{if(confirm("Annuler le dépôt en cours ?"))collectBlanch(true);}} style={{color:C.red,fontSize:11,padding:"4px 10px"}}>Annuler</button>}
                </div>
              </div>
            )}
          </div>

          {/* ENTREPÔTS — 2 slots empilés (vu qu'on est sur 1 demi-largeur), formulaire de dépôt si <2 actifs */}
          {(()=>{
            const enAvailable = entrepots.length < 2;
            const enPreviewAmount = +enAmount||0;
            const enPreviewEnd = enPreviewAmount>0?new Date(Date.now()+24*3600000):null;
            return (
              <div style={{...card,marginBottom:0,borderLeft:"3px solid "+C.amber,padding:"14px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:10,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.12em"}}>Entrepôts</span>
                    <span style={{fontSize:11,padding:"2px 9px",borderRadius:5,fontWeight:600,
                      background:entrepots.length===0?"rgba(160,160,160,0.15)":entrepots.length>=2?"rgba(223,90,68,0.15)":"rgba(212,146,10,0.15)",
                      color:entrepots.length===0?C.muted:entrepots.length>=2?C.red:C.amber,
                      border:"1px solid "+(entrepots.length===0?"rgba(160,160,160,0.3)":entrepots.length>=2?"rgba(223,90,68,0.3)":"rgba(212,146,10,0.3)")}}>
                      {entrepots.length} / 2 actif{entrepots.length>1?"s":""}
                    </span>
                  </div>
                </div>

                {/* Liste des entrepôts actifs : 1 colonne si 1 caisse, 2 colonnes si 2 caisses */}
                {entrepots.length>0&&(
                  <div style={{display:"grid",gridTemplateColumns:entrepots.length===2?"1fr 1fr":"1fr",gap:8,marginBottom:enAvailable?14:0}}>
                    {entrepots.map((ent,idx)=>{
                      const enRec = new Date(ent.recup_at);
                      const enDep = new Date(ent.depot_at);
                      const enMs = enRec.getTime() - now;
                      const enReady = enMs <= 0;
                      const enElapsed = now - enDep.getTime();
                      const enTotal = enRec.getTime() - enDep.getTime();
                      const enPct = enTotal>0 ? Math.min(100, (enElapsed/enTotal)*100) : 0;
                      return (
                        <div key={ent.id} style={{background:C.surfaceAlt,border:"1px solid "+C.border,borderRadius:6,padding:"8px 10px"}}>
                          {/* Ligne 1 : badge + montant + bouton */}
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                            <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,fontWeight:600,
                              background:enReady?"rgba(127,184,107,0.15)":"rgba(212,146,10,0.15)",
                              color:enReady?C.green:C.amber,whiteSpace:"nowrap"}}>{enReady?"Prêt":"En cours"}</span>
                            <span style={{fontSize:16,fontWeight:700,color:C.amber,marginLeft:"auto"}}>{fmt(ent.montant).replace("$","")}<span style={{fontSize:11,color:C.dim,fontWeight:500,marginLeft:2}}>$</span></span>
                          </div>
                          {/* Ligne 2 : info dépôt compacte */}
                          <div style={{fontSize:10,color:C.muted,marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            <strong style={{color:C.text}}>{ent.user_depot}</strong> · {fmtDateTime(enDep)}
                          </div>
                          {/* Ligne 3 : barre + temps */}
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginBottom:3}}>
                            <span>{fmtRem(enMs)}</span>
                            <span>{Math.round(enPct)}%</span>
                          </div>
                          <Bar val={enPct} max={100} color={enReady?C.green:C.amber}/>
                          {/* Ligne 4 : actions */}
                          <div style={{display:"flex",justifyContent:"flex-end",gap:4,marginTop:6}}>
                            <button onClick={()=>recupEntrepot(ent)} disabled={!enReady} style={{padding:"4px 10px",fontSize:11,fontWeight:700,background:enReady?C.green:"#3a3a3a",color:enReady?"#1a1a1a":C.muted,border:"none",cursor:enReady?"pointer":"not-allowed",opacity:enReady?1:0.6}}>Récupérer</button>
                            {isAdmin&&<button onClick={()=>delEntrepot(ent)} style={{color:C.red,fontSize:11,padding:"3px 7px"}}>×</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Formulaire de dépôt (si <2 actifs) */}
                {enAvailable&&(
                  <div style={{borderTop:entrepots.length>0?"1px solid "+C.border:"none",paddingTop:entrepots.length>0?12:0}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"end"}}>
                      <div>
                        <div style={S.lbl}>Valeur de la caisse ($)</div>
                        <input type="number" min="1" placeholder="ex: 45000" value={enAmount} onChange={e=>setEnAmount(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&enPreviewAmount>0){startEntrepot(enAmount);setEnAmount("");}}} style={{width:"100%"}}/>
                      </div>
                      <button onClick={()=>{startEntrepot(enAmount);setEnAmount("");}} disabled={enPreviewAmount<=0} style={{padding:"10px 26px",fontWeight:700,fontSize:13,letterSpacing:"0.05em",textTransform:"uppercase",background:enPreviewAmount>0?C.amber:"#3a3a3a",color:enPreviewAmount>0?"#1a1a1a":C.muted,border:"none",borderRadius:6,transition:"background .2s"}} onMouseEnter={e=>{if(enPreviewAmount>0)e.currentTarget.style.background=C.amberBright;}} onMouseLeave={e=>{if(enPreviewAmount>0)e.currentTarget.style.background=C.amber;}}>Déposer</button>
                    </div>
                    {enPreviewAmount>0&&(
                      <div style={{marginTop:8,fontSize:12,color:C.muted}}>
                        Récupération vers <strong style={{color:C.green}}>{fmtTime(enPreviewEnd)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          </div>
          {/* Fin grid 2-cols Blanchisserie + Entrepôts */}

          {/* À RÉAPPROVISIONNER — n'apparaît que si au moins 1 item est sous son seuil */}
          {stockBas.length>0 && (
            <div style={{...card,marginTop:16,borderLeft:"3px solid "+C.red,padding:"14px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:"0.12em"}}>⚠ À réapprovisionner</span>
                <span style={{fontSize:11,padding:"2px 9px",borderRadius:5,fontWeight:600,background:"rgba(223,90,68,0.15)",color:C.red,border:"1px solid rgba(223,90,68,0.3)"}}>
                  {stockBas.length} item{stockBas.length>1?"s":""}
                </span>
                <span style={{fontSize:11,color:C.dim,marginLeft:"auto"}}>Stock Londres</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
                {stockBas.map(s=>(
                  <div key={s.id} style={{background:"rgba(223,90,68,0.06)",border:"1px solid rgba(223,90,68,0.25)",borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:3}}>{s.item_nom}</div>
                    <div style={{fontSize:11,color:C.muted,display:"flex",justifyContent:"space-between"}}>
                      <span>Stock : <strong style={{color:C.red}}>{s.quantite}</strong></span>
                      <span>Seuil : {s.seuil}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPTES MEMBRES — style "tableau dense" : cellules collées avec bordures fines */}
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"24px 0 10px"}}>
            <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em"}}>Comptes membres</span>
            <span style={{fontSize:10,color:C.dim}}>· {members.length}</span>
          </div>
          <div data-mobile="members-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:1,border:"1px solid "+C.border,borderRadius:8,overflow:"hidden",background:C.border}}>
            {members.map((m,i)=>{
              const low=m.solde<alertThreshold;
              return <MemberCard key={m.id} m={m} low={low} setMembers={setMembers} onLog={log} dense={true}/>;
            })}
          </div>
        </div>
        );
      })()}

      {tab==="transactions"&&(
        <div style={card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Nouvelle transaction</div>
          <div style={{display:"flex",gap:4,background:C.surfaceAlt,borderRadius:10,padding:4,border:"1px solid "+C.border,marginBottom:14}}>
            {[["pm","Petite main"],["gang","Gang"]].map(([v,l])=>(
              <button key={v} onClick={()=>setTx(f=>({...f,dest:v,pmId:"",gangId:"",membreId:"",qtes:{},argentSale:""}))} style={{flex:1,padding:"7px 12px",fontSize:13,fontWeight:tx.dest===v?600:400,background:tx.dest===v?C.surface:"transparent",color:tx.dest===v?C.text:C.muted,border:tx.dest===v?"1px solid "+C.border:"none",borderRadius:7,boxShadow:tx.dest===v?"0 1px 4px rgba(0,0,0,0.25)":"none"}}>{l}</button>
            ))}
          </div>
          <div data-mobile="tx-form-top" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {tx.dest==="pm"
              ?<div><div style={S.lbl}>PM ou Groupe</div><select style={S.inp} value={tx.pmId} onChange={e=>setTx(f=>({...f,pmId:e.target.value}))}><option value="">— choisir —</option>{pmsAndGroupes.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
              :<div><div style={S.lbl}>Gang</div><select style={S.inp} value={tx.gangId} onChange={e=>setTx(f=>({...f,gangId:e.target.value}))}><option value="">— choisir —</option>{gangs.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select></div>
            }
            {tx.dest==="pm"&&<div><div style={S.lbl}>Payé par</div><select style={S.inp} value={tx.membreId} onChange={e=>setTx(f=>({...f,membreId:e.target.value}))}><option value="">— membre —</option>{members.map(m=><option key={m.id} value={m.id}>{m.nom} ({fmt(m.solde)})</option>)}</select></div>}
            <div><div style={S.lbl}>Date</div><input type="date" style={S.inp} value={tx.date} onChange={e=>setTx(f=>({...f,date:e.target.value}))}/></div>
            <div><div style={S.lbl}>Note</div><input type="text" style={S.inp} placeholder="Optionnel" value={tx.note} onChange={e=>setTx(f=>({...f,note:e.target.value}))}/></div>
          </div>

          <div style={{marginBottom:14}}>
            {tx.dest==="pm"
              ? <ItemsSection title="Objets" pct={aPct} prixFixeCat={aPrixFixe} items={itemsPM} qtes={tx.qtes} onChangeQte={setQte} dest={tx.dest}/>
              : <>
                  <ItemsSection title="Objets classiques" pct={aPct} prixFixeCat={aPrixFixe} items={itemsPM} qtes={tx.qtes} onChangeQte={setQte} dest={tx.dest}/>
                  <ItemsSection title="Objets gang" pct={aPct} prixFixeCat={aPrixFixe} items={itemsG} qtes={tx.qtes} onChangeQte={setQte} accent={C.amber} dest={tx.dest}/>
                </>
            }
          </div>

          {/* Liasses + Argent sale en 2 colonnes */}
          <div style={{borderTop:"1px solid "+C.border,paddingTop:12,marginBottom:14}}>
            <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:tx.dest==="pm"?"1fr 1fr":"1fr",gap:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{"Liasses"+(aLiasse>0?" · "+aLiasse+"$":"")+" · 0.1 Kg/u"}</div>
                <input type="number" min="0" placeholder="0 liasses" style={{width:"100%"}} value={tx.liasseQte} onChange={e=>setTx(f=>({...f,liasseQte:e.target.value}))}/>
              </div>
              {tx.dest==="pm"&&(
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Argent sale · 40%</div>
                  <input type="number" min="0" placeholder="0$" style={{width:"100%"}} value={tx.argentSale} onChange={e=>setTx(f=>({...f,argentSale:e.target.value}))}/>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL : $ | Kg côte à côte */}
          <div data-mobile="total-row" style={{borderTop:"1px solid "+C.border,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Total à payer</div>
              <div style={{display:"flex",alignItems:"baseline",gap:14,flexWrap:"wrap"}}>
                <div style={{fontSize:26,fontWeight:700,color:C.green}}>{fmt(txTotal)}</div>
                {totPoids>0&&<>
                  <div style={{width:1,alignSelf:"stretch",background:C.border}}/>
                  <div style={{fontSize:16,fontWeight:600,color:C.blue}}>{fmtKgD(totPoids)}</div>
                </>}
              </div>
            </div>
            <button onClick={submit} style={{padding:"10px 22px",fontWeight:700,fontSize:14,background:C.amber,color:"#1a1a1a",border:"none",borderRadius:6,flexShrink:0,transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background=C.amberBright} onMouseLeave={e=>e.currentTarget.style.background=C.amber}>Enregistrer</button>
          </div>
        </div>
      )}

      {tab==="historique"&&(
        <div>
          <style>{`
            .cv-stats-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#404040;border:1px solid #505050;border-radius:10px;overflow:hidden;margin-bottom:14px;}
            .cv-stat-box{background:#2f2f2f;padding:10px 14px;display:flex;flex-direction:column;gap:3px;}
            .cv-stat-label{font-size:9px;font-weight:600;color:#a0a0a0;text-transform:uppercase;letter-spacing:0.08em;}
            .cv-stat-value{font-size:16px;font-weight:700;color:#f0f0f0;line-height:1.1;}
            .cv-stat-sub{font-size:10px;color:#888;}
            @media (max-width:1000px){.cv-stats-strip{grid-template-columns:repeat(3,1fr);}}
            @media (max-width:700px){.cv-stats-strip{grid-template-columns:1fr 1fr;}.cv-stat-value{font-size:14px;}}
            @media (max-width:420px){.cv-stats-strip{grid-template-columns:1fr;}}
          `}</style>

          {/* Filtres sur 1 seule ligne */}
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <select value={hType} onChange={e=>setHType(e.target.value)} style={{flex:"0 1 auto",minWidth:140,fontWeight:600}}>
              <option value="transactions">Transactions</option>
              <option value="blanchi">Blanchi</option>
              <option value="entrepots">Entrepôts</option>
            </select>
            {hType==="transactions"&&(
              <select value={hFil.who} onChange={e=>setHFil(f=>({...f,who:e.target.value}))} style={{flex:"0 1 auto",minWidth:200}}>
                <option value="">Toutes les PM / gangs</option>
                <option value="all_pm">— Toutes les PM —</option>
                <option value="all_gang">— Tous les gangs —</option>
                {whoOpts.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            )}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:C.muted}}>Du</span>
              <input type="date" value={hFrom} onChange={e=>setHFrom(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
              <span style={{fontSize:12,color:C.muted}}>au</span>
              <input type="date" value={hTo} onChange={e=>setHTo(e.target.value)} style={{fontSize:12,padding:"5px 9px"}}/>
            </div>
            <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>
              {hType==="transactions"&&`${filtH.length} transaction${filtH.length!==1?"s":""}`}
              {hType==="blanchi"&&(()=>{const list=blanchHistory.filter(b=>{if(!hFrom&&!hTo)return true;const d=(b.recup_at||"").slice(0,10);return (!hFrom||d>=hFrom)&&(!hTo||d<=hTo);});return `${list.length} blanchiment${list.length!==1?"s":""}`;})()}
              {hType==="entrepots"&&(()=>{const list=entrepotsHistory.filter(e=>{if(!hFrom&&!hTo)return true;const d=(e.recup_at||"").slice(0,10);return (!hFrom||d>=hFrom)&&(!hTo||d<=hTo);});return `${list.length} entrepôt${list.length!==1?"s":""}`;})()}
            </span>
          </div>

          {/* Bande de stats (uniquement pour transactions) */}
          {hType==="transactions"&&filtH.length>0&&(
            <div className="cv-stats-strip">
              <div className="cv-stat-box">
                <div className="cv-stat-label">Objets</div>
                <div className="cv-stat-value">{totauxH.objQte}</div>
              </div>
              <div className="cv-stat-box">
                <div className="cv-stat-label">Liasses</div>
                <div className="cv-stat-value">{totauxH.liasseQte}</div>
              </div>
              <div className="cv-stat-box">
                <div className="cv-stat-label">Payé aux PM</div>
                <div className="cv-stat-value" style={{color:C.green}}>{fmt(totauxH.payePM)}</div>
              </div>
              <div className="cv-stat-box">
                <div className="cv-stat-label">Payé aux gangs</div>
                <div className="cv-stat-value" style={{color:C.red}}>{fmt(totauxH.payeGang)}</div>
              </div>
              <div className="cv-stat-box">
                <div className="cv-stat-label">Sale généré</div>
                <div className="cv-stat-value" style={{color:C.red}}>{fmt(totauxH.sale)}</div>
              </div>
            </div>
          )}

          {hType==="transactions"&&filtH.length===0&&<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"3rem",opacity:.5}}>Aucune transaction</div>}
          {hType==="transactions"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtH.map(h=>{
              const exp=!!expanded[h.id];
              // Détecter le groupe associé : priorité aux IDs (fiable) puis fallback sur le nom
              const norm = s => (s||"").toLowerCase().trim().replace(/\s+/g," ");
              let groupeAssocie = null;
              if(h.dest==="pm"){
                // Priorité 1 : groupe_id stocké directement dans la transaction (fiable, résiste aux renommages)
                if(h.groupe_id){
                  groupeAssocie = pmGroupes.find(g=>g.id===h.groupe_id);
                }
                // Priorité 2 : pm_id stocké → on regarde si la PM est dans un groupe actuellement
                if(!groupeAssocie && h.pm_id){
                  const pmActuelle = pms.find(p=>p.id===h.pm_id);
                  if(pmActuelle && pmActuelle.groupe_id){
                    groupeAssocie = pmGroupes.find(g=>g.id===pmActuelle.groupe_id);
                  }
                }
                // Priorité 3 (fallback rétrocompat) : matching par nom
                if(!groupeAssocie && h.pm_nom){
                  const nomNorm = norm(h.pm_nom);
                  groupeAssocie = pmGroupes.find(g=>norm(g.nom)===nomNorm);
                  if(!groupeAssocie){
                    const pmActuelle = pms.find(p=>norm(p.nom)===nomNorm);
                    if(pmActuelle && pmActuelle.groupe_id){
                      groupeAssocie = pmGroupes.find(g=>g.id===pmActuelle.groupe_id);
                    }
                  }
                }
              }
              const tl=(h.types||[]).map(t=>t==="objets"?"Objets·"+(h.dest==="pm"?h.pm_pct:h.gang_pct)+"%":t==="liasses"?"Liasses·"+h.taux_liasse+"$":t==="argent"?"Argent·40%":"").filter(Boolean).join(" + ");
              const poidsObjetsH=(h.lignes||[]).reduce((s,l)=>s+(+l.poids||0),0);
              const poidsLiassesH = (+h.poids_liasses||0) || ((+h.liasse_qte||0)*0.1);
              const totPoidsH = poidsObjetsH + poidsLiassesH;
              // Affichage du nom : si groupe lié, on affiche le nom ACTUEL du groupe en or, sinon le nom enregistré
              const displayName = groupeAssocie ? groupeAssocie.nom : (h.dest==="pm" ? (h.pm_nom||"?") : (h.gang_nom||"?"));
              const displayCat = h.dest==="pm" ? (h.pm_cat||"?") : (h.gang_cat||"?");
              return(
                <div key={h.id} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      {groupeAssocie&&<span style={{marginRight:6}}>👥</span>}
                      <span style={{fontWeight:700,fontSize:14,color:C.text}} title={groupeAssocie?"Groupe":""}>{displayName}</span>
                      <span style={{fontWeight:700,fontSize:14,color:C.muted}}> ({displayCat})</span>
                      {h.membre&&<span style={{fontSize:12,color:C.muted,marginLeft:8}}>· payé par {h.membre}</span>}
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{tl}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:15,fontWeight:700,color:h.dest==="gang"?C.red:C.green}}>{fmt(h.total)}</div>
                        {totPoidsH>0&&<div style={{fontSize:11,color:C.blue}}>{fmtKgD(totPoidsH)}</div>}
                        <div style={{fontSize:11,color:C.muted}}>{h.date}</div>
                      </div>
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
                      {h.types?.includes("objets")&&(h.lignes||[]).map((l,i)=>{
                        // Prix unitaire payé = sous_total / qte (déjà calculé avec le %)
                        const prixUnitPaye = l.qte>0 ? Math.round((+l.sous_total||0)/(+l.qte||1)) : 0;
                        return (
                          <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span>{l.nom} × {l.qte} ({fmt(prixUnitPaye)}/u){l.poids>0&&" · "+fmtKgD(l.poids)}</span>
                            <span style={{color:h.dest==="gang"?C.red:C.green,fontWeight:600}}>{fmt(Math.round(l.sous_total))}</span>
                          </div>
                        );
                      })}
                      {h.types?.includes("liasses")&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span>Liasses × {h.liasse_qte} ({h.taux_liasse}$/u) · {fmtKgD((h.liasse_qte||0)*0.1)}</span><span style={{color:h.dest==="gang"?C.red:C.green,fontWeight:600}}>{fmt(h.taux_liasse*h.liasse_qte)}</span></div>}
                      {h.types?.includes("argent")&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span>Argent sale : {fmt(h.argent_sale)} (40%)</span><span style={{color:h.dest==="gang"?C.red:C.green,fontWeight:600}}>{fmt(Math.round(h.argent_sale*0.4))}</span></div>}
                      {h.note&&<div style={{marginTop:6,fontStyle:"italic"}}>{h.note}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Vue Blanchi : liste des blanchiments archivés */}
          {hType==="blanchi"&&(()=>{
            const list = blanchHistory.filter(b=>{
              if(!hFrom&&!hTo)return true;
              const d=(b.recup_at||"").slice(0,10);
              return (!hFrom||d>=hFrom)&&(!hTo||d<=hTo);
            });
            if(list.length===0) return <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"3rem",opacity:.5}}>Aucun blanchiment archivé</div>;
            return (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {list.map(b=>(
                  <div key={b.id} style={{...card,borderLeft:"3px solid "+C.amber,padding:"12px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontSize:18}}>🧺</span>
                        <div>
                          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Blanchiment {b.user_nom?<span style={{color:C.muted,fontWeight:400}}>· par {b.user_nom}</span>:""}</div>
                          <div style={{fontSize:11,color:C.dim,marginTop:2}}>
                            Déposé le {fmtDateTime(new Date(b.depot_at))} · Récupéré le {fmtDateTime(new Date(b.recup_at))} · Durée : {b.duree_h}h
                          </div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.amber}}>{fmt(b.montant)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Vue Entrepôts : liste des entrepôts récupérés */}
          {hType==="entrepots"&&(()=>{
            const list = entrepotsHistory.filter(e=>{
              if(!hFrom&&!hTo)return true;
              const d=(e.recup_at||"").slice(0,10);
              return (!hFrom||d>=hFrom)&&(!hTo||d<=hTo);
            });
            if(list.length===0) return <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"3rem",opacity:.5}}>Aucun entrepôt récupéré</div>;
            const totalMontant = list.reduce((s,e)=>s+(+e.montant||0),0);
            return (
              <>
                <div className="cv-stats-strip" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
                  <div className="cv-stat-box">
                    <div className="cv-stat-label">Caisses récupérées</div>
                    <div className="cv-stat-value">{list.length}</div>
                  </div>
                  <div className="cv-stat-box">
                    <div className="cv-stat-label">Montant total</div>
                    <div className="cv-stat-value" style={{color:C.amber}}>{fmt(totalMontant)}</div>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {list.map(e=>(
                    <div key={e.id} style={{...card,borderLeft:"3px solid "+C.amber,padding:"12px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontSize:18}}>📦</span>
                          <div>
                            <div style={{fontSize:14,fontWeight:600,color:C.text}}>
                              Entrepôt · déposé par <span style={{color:C.amber}}>{e.user_depot}</span> · récupéré par <span style={{color:C.green}}>{e.user_recup}</span>
                            </div>
                            <div style={{fontSize:11,color:C.dim,marginTop:2}}>
                              Déposé le {fmtDateTime(new Date(e.depot_at))} · Récupéré le {fmtDateTime(new Date(e.recup_at))}
                            </div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:15,fontWeight:700,color:C.amber}}>{fmt(e.montant)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab==="commandes"&&(
        <div>
          <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

            {/* ═══════ Commandes reçues (clients) ═══════ */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                <span>📤 Commandes reçues</span>
                <span style={{fontSize:10,color:C.dim,fontWeight:500,letterSpacing:"normal"}}>(à livrer)</span>
              </div>

              <AddCmdRecueForm gangs={gangs} itemsPM={itemsPM} itemsG={itemsG} stockLondres={stockLondres} onAdd={createCommandeRecue}/>

              <div style={{marginTop:14,fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
                En attente {commandesRecues.filter(c=>c.status==="en_attente").length>0&&<span style={{color:C.amber}}>· {commandesRecues.filter(c=>c.status==="en_attente").length}</span>}
              </div>
              {commandesRecues.filter(c=>c.status==="en_attente").length===0 ? (
                <div style={{fontSize:12,color:C.muted,fontStyle:"italic",padding:12,textAlign:"center"}}>Aucune commande en attente</div>
              ) : commandesRecues.filter(c=>c.status==="en_attente").map(cmd=>{
                const totalQte = (cmd.lignes||[]).reduce((s,l)=>s+(+l.qte||0),0);
                return (
                  <div key={cmd.id} style={{...card,marginBottom:8,borderLeft:"3px solid "+C.amber,padding:"10px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.text}}>
                        🎯 {cmd.gang_nom||"?"}
                        <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,fontWeight:600,background:"rgba(212,146,10,0.15)",color:C.amber,marginLeft:8}}>En attente</span>
                      </div>
                      <span style={{fontSize:10,color:C.dim}}>{fmtDateTime(new Date(cmd.created_at))}</span>
                    </div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:8}}>
                      {(cmd.lignes||[]).map(l=>`${l.qte}× ${l.item_nom}`).join(" · ")}
                    </div>
                    {cmd.note&&<div style={{fontSize:11,color:C.dim,fontStyle:"italic",marginBottom:8}}>📝 {cmd.note}</div>}
                    <div style={{display:"flex",justifyContent:"flex-end",gap:6}}>
                      <button onClick={()=>{if(window.confirm(`Marquer la commande ${cmd.gang_nom} comme livrée ? Le stock sera décrémenté.`))livrerCommandeRecue(cmd);}} style={{fontSize:11,padding:"5px 12px",fontWeight:700,background:C.green,color:"#1a1a1a",border:"none",borderRadius:4,cursor:"pointer"}}>✓ Livrer</button>
                      <button onClick={()=>{if(window.confirm("Supprimer cette commande ?"))delCommandeRecue(cmd);}} style={{fontSize:11,padding:"5px 10px",color:C.red}}>×</button>
                    </div>
                  </div>
                );
              })}

              <div style={{marginTop:14,fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
                Livrées (50 dernières) {commandesRecues.filter(c=>c.status==="livree").length>0&&<span style={{color:C.green}}>· {commandesRecues.filter(c=>c.status==="livree").length}</span>}
              </div>
              {commandesRecues.filter(c=>c.status==="livree").length===0 ? (
                <div style={{fontSize:12,color:C.muted,fontStyle:"italic",padding:12,textAlign:"center"}}>Aucune commande livrée</div>
              ) : commandesRecues.filter(c=>c.status==="livree").slice(0,50).map(cmd=>(
                <div key={cmd.id} style={{...card,marginBottom:6,padding:"8px 12px",opacity:0.85}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.text}}>
                        ✓ {cmd.gang_nom||"?"}
                        <span style={{fontSize:9,color:C.muted,marginLeft:8}}>par {cmd.user_livraison||"?"}</span>
                      </div>
                      <div style={{fontSize:10,color:C.dim,marginTop:2}}>
                        {(cmd.lignes||[]).map(l=>`${l.qte}×${l.item_nom}`).join(" · ")}
                      </div>
                    </div>
                    <span style={{fontSize:10,color:C.dim,whiteSpace:"nowrap"}}>{cmd.livree_at?fmtDateTime(new Date(cmd.livree_at)):""}</span>
                    {isAdmin&&<button onClick={()=>{if(window.confirm("Supprimer cette commande de l'historique ?"))delCommandeRecue(cmd);}} style={{fontSize:10,padding:"2px 6px",color:C.red}}>×</button>}
                  </div>
                </div>
              ))}
            </div>

            {/* ═══════ Commandes passées (fournisseurs) ═══════ */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                <span>📥 Commandes passées</span>
                <span style={{fontSize:10,color:C.dim,fontWeight:500,letterSpacing:"normal"}}>(que l'on attend)</span>
              </div>

              <AddCmdPasseeForm onAdd={createCommandePassee}/>

              <div style={{marginTop:14,fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
                En attente {commandesPassees.filter(c=>c.status==="en_attente").length>0&&<span style={{color:C.amber}}>· {commandesPassees.filter(c=>c.status==="en_attente").length}</span>}
              </div>
              {commandesPassees.filter(c=>c.status==="en_attente").length===0 ? (
                <div style={{fontSize:12,color:C.muted,fontStyle:"italic",padding:12,textAlign:"center"}}>Aucune commande en attente</div>
              ) : commandesPassees.filter(c=>c.status==="en_attente").map(cmd=>{
                const typeIcon = {drogue:"💊",arme:"🔫",voiture:"🚗",autre:"📦"}[cmd.type]||"📦";
                return (
                  <div key={cmd.id} style={{...card,marginBottom:8,borderLeft:"3px solid "+C.amber,padding:"10px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.text,textTransform:"capitalize"}}>
                        {typeIcon} {cmd.type}
                        <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,fontWeight:600,background:"rgba(212,146,10,0.15)",color:C.amber,marginLeft:8}}>En attente</span>
                      </div>
                      <span style={{fontSize:14,fontWeight:700,color:C.amber}}>{fmt(cmd.montant)}</span>
                    </div>
                    <div style={{fontSize:10,color:C.dim,marginBottom:8}}>
                      Par {cmd.user_creation||"?"} · {fmtDateTime(new Date(cmd.created_at))}
                    </div>
                    {cmd.note&&<div style={{fontSize:11,color:C.dim,fontStyle:"italic",marginBottom:8}}>📝 {cmd.note}</div>}
                    <div style={{display:"flex",justifyContent:"flex-end",gap:6}}>
                      <button onClick={()=>{if(window.confirm("Marquer cette commande comme reçue ?"))livrerCommandePassee(cmd);}} style={{fontSize:11,padding:"5px 12px",fontWeight:700,background:C.green,color:"#1a1a1a",border:"none",borderRadius:4,cursor:"pointer"}}>✓ Reçue</button>
                      <button onClick={()=>{if(window.confirm("Supprimer cette commande ?"))delCommandePassee(cmd);}} style={{fontSize:11,padding:"5px 10px",color:C.red}}>×</button>
                    </div>
                  </div>
                );
              })}

              <div style={{marginTop:14,fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
                Reçues (50 dernières) {commandesPassees.filter(c=>c.status==="livree").length>0&&<span style={{color:C.green}}>· {commandesPassees.filter(c=>c.status==="livree").length}</span>}
              </div>
              {commandesPassees.filter(c=>c.status==="livree").length===0 ? (
                <div style={{fontSize:12,color:C.muted,fontStyle:"italic",padding:12,textAlign:"center"}}>Aucune commande reçue</div>
              ) : commandesPassees.filter(c=>c.status==="livree").slice(0,50).map(cmd=>{
                const typeIcon = {drogue:"💊",arme:"🔫",voiture:"🚗",autre:"📦"}[cmd.type]||"📦";
                return (
                  <div key={cmd.id} style={{...card,marginBottom:6,padding:"8px 12px",opacity:0.85}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:C.text,textTransform:"capitalize"}}>
                          {typeIcon} {cmd.type}
                          <span style={{fontSize:9,color:C.muted,marginLeft:8}}>par {cmd.user_livraison||"?"}</span>
                        </div>
                        {cmd.note&&<div style={{fontSize:10,color:C.dim,marginTop:2}}>{cmd.note}</div>}
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:C.green}}>{fmt(cmd.montant)}</span>
                      {isAdmin&&<button onClick={()=>{if(window.confirm("Supprimer cette commande de l'historique ?"))delCommandePassee(cmd);}} style={{fontSize:10,padding:"2px 6px",color:C.red}}>×</button>}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

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
            </div>
          </div>
          {!isAdmin&&<div style={{fontSize:11,color:C.muted,marginBottom:10,fontStyle:"italic"}}>💡 Tu peux modifier le coffre et le stock. Pour le reste (nom, catégorie, code, ajout), va dans Database (admin).</div>}
          <div data-mobile="apparts-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {sortedAp.map(a=>(
              <AppartCard key={a.id} a={a} updateAppart={updateAppart} copied={copied} setCopied={setCopied}/>
            ))}
          </div>

          {/* ═══ STOCK COMMANDES (Londres) ═══ */}
          <div style={{...card,marginTop:24,borderLeft:"3px solid "+C.amber}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:11,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.12em"}}>📦 Stock commandes</span>
                <span style={{fontSize:11,color:C.dim}}>· Londres · {stockLondres.length} item{stockLondres.length>1?"s":""} suivi{stockLondres.length>1?"s":""}</span>
              </div>
              <LondresStockAddInline
                stockLondres={stockLondres}
                itemsPM={itemsPM}
                itemsG={itemsG}
                onAddStockItem={addStockItem}
              />
            </div>
            {stockLondres.length===0 ? (
              <div style={{fontSize:12,color:C.muted,fontStyle:"italic",padding:20,textAlign:"center"}}>
                Aucun item suivi. Utilise le bouton "+ Item" ci-dessus pour configurer ce qui doit être stocké à Londres.
              </div>
            ) : (
              <div data-mobile="stock-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
                {stockLondres.map(s=>{
                  const isLow = s.quantite < s.seuil;
                  // Trouver le poids de l'item référencé
                  const item = s.item_type === "pm"
                    ? itemsPM.find(i => i.id === s.item_id)
                    : itemsG.find(i => i.id === s.item_id);
                  const poids = item?.poids || 0;
                  const totalKg = s.quantite * poids;
                  return (
                    <div key={s.id} style={{
                      background:isLow?"rgba(223,90,68,0.06)":C.surfaceAlt,
                      border:"1px solid "+(isLow?"rgba(223,90,68,0.3)":C.border),
                      borderRadius:6,
                      padding:"10px 12px"
                    }}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontSize:13,fontWeight:600,color:isLow?C.red:C.text,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {s.item_nom}
                        </span>
                        <span style={{fontSize:9,padding:"1px 6px",borderRadius:3,fontWeight:600,background:s.item_type==="pm"?"rgba(127,158,209,0.15)":"rgba(227,185,74,0.15)",color:s.item_type==="pm"?C.blue:C.amber,marginLeft:6,whiteSpace:"nowrap"}}>
                          {s.item_type==="pm"?"PM":"Gang"}
                        </span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <input
                          type="number"
                          min="0"
                          value={s.quantite}
                          onChange={e=>updateStockQty(s.id, e.target.value)}
                          style={{flex:1,fontSize:18,fontWeight:700,textAlign:"center",padding:"4px 6px",color:isLow?C.red:C.text}}
                          title="Quantité actuelle"
                        />
                        <span style={{fontSize:11,color:C.dim}}>/</span>
                        <input
                          type="number"
                          min="0"
                          value={s.seuil}
                          onChange={e=>updateStockSeuil(s.id, e.target.value)}
                          style={{width:50,fontSize:12,textAlign:"center",padding:"4px 6px",color:C.muted}}
                          title="Seuil d'alerte"
                        />
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:10,color:C.dim}}>
                        <span>
                          {poids>0&&<>{fmtKgD(poids)}/u · <strong style={{color:C.blue}}>{fmtKgD(totalKg)}</strong></>}
                          {poids===0&&<span style={{fontStyle:"italic"}}>poids non défini</span>}
                        </span>
                        {isAdmin&&<button onClick={()=>{if(window.confirm(`Retirer ${s.item_nom} du suivi ?`))removeStockItem(s.id);}} style={{fontSize:10,padding:"2px 6px",color:C.red}}>×</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ STATS ═══ */}
      {tab==="stats"&&(
        <StatsView history={history} blanchHistory={blanchHistory} pms={pms} pmGroupes={pmGroupes} setTab={setTab} setHFil={setHFil} setHFrom={setHFrom} setHTo={setHTo}/>
      )}

      {tab==="database"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Ligne 1 : Petites mains (pleine largeur, en premier) */}
          <div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <div style={{...S.sec,margin:0,flexShrink:0}}>Petites mains</div>
              <PMSearchInput initialValue={pmSearch} onChange={setPMSearch}/>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>exportCSV("pms")} style={{fontSize:11,padding:"6px 10px",whiteSpace:"nowrap"}}>↓ Export CSV</button>
                {isAdmin&&<button onClick={()=>triggerImport("pms")} style={{fontSize:11,padding:"6px 10px",background:C.amber,color:"#1a1a1a",border:"none",fontWeight:700,whiteSpace:"nowrap"}}>↑ Importer CSV</button>}
              </div>
            </div>
            <PMList/>
          </div>
          {/* Ligne 2 : Catégories PM + Groupes PM côte à côte */}
          <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={card}><div style={S.sec}>Catégories PM</div><CatTable cats={catsPM} setCats={setCatsPM} table="categories_pm" eId={eCPM} setEId={setECPM} nc={nCPM} setNc={setNCPM}/></div>
            <div style={card}><div style={S.sec}>Groupes PM</div><GroupeList/></div>
          </div>
          {/* Ligne 3 : Catégories gangs + Gangs */}
          <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={card}><div style={S.sec}>Catégories gangs</div><CatTable cats={catsGang} setCats={setCatsGang} table="categories_gang" eId={eCG} setEId={setECG} nc={nCG} setNc={setNCG}/></div>
            <div style={card}><div style={S.sec}>Gangs{!isAdmin&&" · lecture seule"}</div><GangList/></div>
          </div>
          {/* Ligne 4 : Items PM + Items gangs */}
          <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={card}><div style={S.sec}>Items PM{!isAdmin&&" · lecture seule"}</div><IList items={itemsPM} setItems={setItemsPM} table="items_pm" eId={eIPM} setEId={setEIPM} ni={nIPM} setNi={setNIPM} canEdit={isAdmin} target="items_pm" allKey="itemsPM"/></div>
            <div style={card}><div style={S.sec}>Items gangs{!isAdmin&&" · lecture seule"}</div><IList items={itemsG} setItems={setItemsG} table="items_gang" eId={eIG} setEId={setEIG} ni={nIG} setNi={setNIG} canEdit={isAdmin} target="items_gang" allKey="itemsG"/></div>
          </div>

          {isAdmin&&(
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{...S.sec,margin:0}}>Apparts — gestion complète</div>
                <span style={{fontSize:11,color:C.muted}}>{apparts.length} appart{apparts.length>1?"s":""}</span>
              </div>
              {(showAll.apparts?apparts:apparts.slice(0,PREVIEW)).map(a=>{
                const ac=getCat(a.categorie);
                const editing=eApId===a.id;
                return (
                  <div key={a.id} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid "+C.border}}>
                    {editing?(
                      <div style={{background:"rgba(74,158,222,0.05)",borderRadius:8,padding:10,border:"1px solid rgba(74,158,222,0.2)"}}>
                        <div style={{display:"grid",gridTemplateColumns:"2fr 1.2fr",gap:10,marginBottom:8}}>
                          <div><div style={S.lbl}>Nom</div><input style={S.inp} value={eApV.nom||""} onChange={e=>setEApV(v=>({...v,nom:e.target.value}))}/></div>
                          <div><div style={S.lbl}>Catégorie</div><select style={S.inp} value={eApV.categorie||"recel"} onChange={e=>setEApV(v=>({...v,categorie:e.target.value}))}>{APPART_CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                          <div><div style={S.lbl}>Max coffre ($)</div><input type="number" style={S.inp} value={eApV.max_coffre||""} onChange={e=>setEApV(v=>({...v,max_coffre:e.target.value}))}/></div>
                          <div><div style={S.lbl}>Max stock (Kg)</div><input type="number" style={S.inp} value={eApV.max_stock||""} onChange={e=>setEApV(v=>({...v,max_stock:e.target.value}))}/></div>
                          <div><div style={S.lbl}>Code appart</div><input type="text" style={S.inp} value={eApV.code||""} onChange={e=>setEApV(v=>({...v,code:e.target.value}))} placeholder="optionnel"/></div>
                        </div>
                        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                          <button onClick={()=>setEApId(null)}>Annuler</button>
                          <button onClick={saveAppartEdit} style={{color:C.green,fontWeight:700}}>Enregistrer</button>
                        </div>
                      </div>
                    ):(
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                        <span style={{flex:"1 1 120px",fontWeight:700,fontSize:13,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nom}</span>
                        <span style={{fontSize:10,padding:"2px 8px",fontWeight:700,background:ac.bg,color:ac.color,border:"1px solid "+ac.color+"66",borderRadius:20}}>{ac.label}</span>
                        <span style={{fontSize:11,color:C.muted}}>Coffre <strong style={{color:C.text}}>{fmt(a.max_coffre)}</strong></span>
                        <span style={{fontSize:11,color:C.muted}}>Stock <strong style={{color:C.text}}>{fmtKg(a.max_stock)}</strong></span>
                        <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{a.code||"—"}</span>
                        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
                          <button onClick={()=>{setEApId(a.id);setEApV({nom:a.nom,categorie:a.categorie,max_coffre:a.max_coffre,max_stock:a.max_stock,code:a.code||""});}} style={{fontSize:11,padding:"3px 8px"}}>Modifier</button>
                          <button onClick={()=>delAppart(a.id)} style={{fontSize:11,padding:"3px 8px",color:C.red}}>×</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {apparts.length>PREVIEW&&(
                <div style={{textAlign:"center",margin:"6px 0 10px"}}>
                  <button onClick={()=>setShowAll(s=>({...s,apparts:!s.apparts}))} style={{fontSize:11,padding:"5px 14px",background:"transparent",border:"1px dashed "+C.border,color:C.muted}}>
                    {showAll.apparts?"Réduire ↑":`Voir tout (${apparts.length}) ↓`}
                  </button>
                </div>
              )}
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px dashed "+C.border}}>
                <div style={S.lbl}>Ajouter un nouvel appart</div>
                <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr auto",gap:6,alignItems:"end",marginTop:6}}>
                  <input style={S.inp} placeholder="Nom" value={nAp.nom} onChange={e=>setNAp(f=>({...f,nom:e.target.value}))}/>
                  <select style={S.inp} value={nAp.categorie} onChange={e=>setNAp(f=>({...f,categorie:e.target.value}))}>{APPART_CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
                  <input type="number" style={S.inp} placeholder="Max coffre" value={nAp.max_coffre} onChange={e=>setNAp(f=>({...f,max_coffre:e.target.value}))}/>
                  <input type="number" style={S.inp} placeholder="Max stock" value={nAp.max_stock} onChange={e=>setNAp(f=>({...f,max_stock:e.target.value}))}/>
                  <input style={S.inp} placeholder="Code" value={nAp.code} onChange={e=>setNAp(f=>({...f,code:e.target.value}))}/>
                  <button onClick={addAppart} style={{fontWeight:700,color:C.green}}>+</button>
                </div>
              </div>
            </div>
          )}

          {isAdmin&&(
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{...S.sec,margin:0}}>Membres — comptes</div>
                <span style={{fontSize:11,color:C.muted}}>{members.length} membre{members.length>1?"s":""}</span>
              </div>
              {membersDisplayed.map(m=>(
                <div key={m.id} style={S.row}>
                  <span style={{flex:1,fontSize:14}}>{m.nom}</span>
                  <span style={{fontSize:13,color:m.solde<alertThreshold?C.red:C.muted,fontWeight:m.solde<alertThreshold?600:400}}>{fmt(m.solde)}</span>
                  <button onClick={async()=>{await sb.from("membres_comptes").delete().eq("id",m.id);setMembers(ms=>ms.filter(x=>x.id!==m.id));log("money","balance_delete",`a supprimé le compte <b>${m.nom}</b> (solde ${fmt(m.solde)})`);}} style={{color:C.red}}>Suppr.</button>
                </div>
              ))}
              {members.length>PREVIEW&&(
                <div style={{textAlign:"center",margin:"6px 0 10px"}}>
                  <button onClick={()=>setShowAll(s=>({...s,members:!s.members}))} style={{fontSize:11,padding:"5px 14px",background:"transparent",border:"1px dashed "+C.border,color:C.muted}}>
                    {showAll.members?"Réduire ↑":`Voir tout (${members.length}) ↓`}
                  </button>
                </div>
              )}
              <div style={{display:"flex",gap:8,alignItems:"end",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>
                <div style={{flex:1}}><div style={S.lbl}>Nom</div><input style={S.inp} value={nBM.nom} onChange={e=>setNBM(f=>({...f,nom:e.target.value}))}/></div>
                <div><div style={S.lbl}>Solde ($)</div><input type="number" style={{width:90}} value={nBM.solde} onChange={e=>setNBM(f=>({...f,solde:e.target.value}))}/></div>
                <button onClick={async()=>{if(!nBM.nom)return;const{data}=await sb.from("membres_comptes").insert({nom:nBM.nom,solde:+nBM.solde||0}).select().single();if(data){setMembers(p=>[...p,data]);log("money","balance_create",`a créé le compte <b>${data.nom}</b> (solde initial : ${fmt(data.solde)})`);}setNBM({nom:"",solde:""});}} style={{fontWeight:700}}>+</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="parametres"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Layout 2 colonnes : Mon mot de passe + Seuil alerte */}
          <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:isAdmin?"1fr 1fr":"1fr",gap:16}}>
            <div style={card}>
              <div style={S.sec}>Mon mot de passe</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div><div style={S.lbl}>Code actuel</div><input type="password" style={S.inp} value={pwd.cur} onChange={e=>setPwd(f=>({...f,cur:e.target.value}))}/></div>
                <div><div style={S.lbl}>Nouveau code</div><input type="password" style={S.inp} value={pwd.neu} onChange={e=>setPwd(f=>({...f,neu:e.target.value}))}/></div>
                <div><div style={S.lbl}>Confirmer</div><input type="password" style={S.inp} value={pwd.conf} onChange={e=>setPwd(f=>({...f,conf:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&changePwd()}/></div>
                <button onClick={changePwd} style={{fontWeight:700,background:C.amber,color:"#1a1a1a",border:"none",padding:"8px 14px",marginTop:4}}>Modifier</button>
              </div>
              {pwdMsg&&<div style={{marginTop:10,fontSize:12,fontWeight:600,color:pwdMsg.t==="ok"?C.green:C.red}}>{pwdMsg.m}</div>}
            </div>

            {/* Paramètres généraux — seuil d'alerte */}
            {isAdmin&&(
              <div style={card}>
                <div style={S.sec}>Paramètres généraux — admin uniquement</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div>
                    <div style={S.lbl}>Seuil d'alerte solde compte ($)</div>
                    <input type="number" min="0" style={S.inp} value={thresholdInput} onChange={e=>setThresholdInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveThreshold()}/>
                    <div style={{fontSize:11,color:C.muted,marginTop:5}}>En-dessous de ce seuil, le compte membre s'affiche en rouge sur le tableau de bord.</div>
                  </div>
                  <button onClick={saveThreshold} style={{fontWeight:700,background:C.amber,color:"#1a1a1a",border:"none",padding:"8px 14px",marginTop:4}}>Sauvegarder</button>
                </div>
                {thresholdMsg&&<div style={{marginTop:10,fontSize:12,fontWeight:600,color:thresholdMsg.t==="ok"?C.green:C.red}}>{thresholdMsg.m}</div>}
              </div>
            )}
          </div>

          {/* Gestion des accès — admin only */}
          {isAdmin&&(
            <div style={{...card,border:"1px solid rgba(212,132,10,0.4)",background:"rgba(212,132,10,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{...S.sec,color:C.amber,margin:0}}>Gestion des accès — admin uniquement</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>exportCSV("users")} style={{fontSize:11,padding:"4px 10px"}}>↓ Export CSV</button>
                  <button onClick={()=>triggerImport("users")} style={{fontSize:11,padding:"4px 10px",background:C.amber,color:"#1a1a1a",border:"none",fontWeight:700}}>↑ Importer CSV</button>
                </div>
              </div>
              {users.map(u=>(
                <div key={u.id} style={S.row}>
                  <span style={{flex:1,fontSize:14}}>{u.nom}</span>
                  <RoleBadge role={u.role}/>
                  <span style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{"•".repeat(u.code.length)}</span>
                  {u.id!==cu.id&&<button onClick={async()=>{await sb.from("users").delete().eq("id",u.id);setUsers(us=>us.filter(x=>x.id!==u.id));log("access","user_delete",`a supprimé l'accès <b>${u.nom}</b> (rôle : ${u.role})`);}} style={{color:C.red}}>Suppr.</button>}
                </div>
              ))}
              <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 100px 90px auto",gap:8,alignItems:"end",borderTop:"1px solid rgba(212,132,10,0.3)",paddingTop:10,marginTop:4}}>
                <div><div style={S.lbl}>Nom</div><input style={S.inp} value={nU.nom} onChange={e=>setNU(f=>({...f,nom:e.target.value}))}/></div>
                <div><div style={S.lbl}>Code</div><input type="password" style={S.inp} value={nU.code} onChange={e=>setNU(f=>({...f,code:e.target.value}))}/></div>
                <div><div style={S.lbl}>Rôle</div><select style={S.inp} value={nU.role} onChange={e=>setNU(f=>({...f,role:e.target.value}))}><option value="membre">Membre</option><option value="admin">Admin</option></select></div>
                <button onClick={async()=>{if(!nU.nom||!nU.code)return;const{data}=await sb.from("users").insert({nom:nU.nom,code:nU.code,role:nU.role}).select().single();if(data){setUsers(p=>[...p,data]);log("access","user_create",`a créé l'accès <b>${data.nom}</b> (rôle : ${data.role})`);}setNU({nom:"",code:"",role:"membre"});}} style={{fontWeight:700,alignSelf:"end"}}>+</button>
              </div>
              <div style={{marginTop:10,fontSize:10,color:C.muted,fontStyle:"italic"}}>Format CSV import : <code style={{background:C.surfaceAlt,padding:"1px 5px",borderRadius:3,fontFamily:"monospace"}}>nom;code;role</code> (role = admin ou membre)</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BIGBROTHER (admin only) ═══ */}
      {tab==="bigbrother"&&isAdmin&&(
        <BigbrotherView logs={auditLogs} users={users} bbFilter={bbFilter} setBBFilter={setBBFilter}/>
      )}
    </div>
  );
}

// ── Composant onglet Stats ──────────────────────────────────────────
// ── Graphique en barres SVG : évolution du sale dans le temps ──
function BarChart({data, granularity, color, height=200}){
  const [hovered, setHovered] = useState(null);
  if(!data || data.length===0){
    return (
      <div style={{textAlign:"center",padding:40,color:C.muted,fontSize:12,fontStyle:"italic"}}>
        Aucune donnée pour la période sélectionnée
      </div>
    );
  }

  const PAD_LEFT = 60;
  const PAD_RIGHT = 16;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 36;
  // Width sera fluide via viewBox/preserveAspectRatio
  const W = 800;
  const H = height;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const maxVal = Math.max(...data.map(d=>d.sale), 1);
  // Arrondir le max au "joli" plus proche
  const niceMax = (() => {
    const m = maxVal * 1.1;
    const pow = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m/pow)*pow;
  })();

  const barGap = 4;
  const barW = Math.max(2, (chartW - barGap*(data.length-1)) / Math.max(1,data.length));

  // Format compacté pour les labels
  const fmtK = (n) => {
    if(n>=1_000_000) return (n/1_000_000).toFixed(n>=10_000_000?0:1)+"M";
    if(n>=1_000) return Math.round(n/1_000)+"k";
    return Math.round(n).toString();
  };

  // Lignes horizontales (4 niveaux)
  const yLines = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y: PAD_TOP + chartH * (1-p),
    val: niceMax * p
  }));

  // Décider quels labels X afficher (éviter le chevauchement)
  const maxLabels = Math.floor(chartW / 60);
  const stepLabel = Math.max(1, Math.ceil(data.length / maxLabels));

  return (
    <div style={{width:"100%",position:"relative"}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}} preserveAspectRatio="none">
        {/* Grille horizontale + labels Y */}
        {yLines.map((l,i)=>(
          <g key={i}>
            <line x1={PAD_LEFT} x2={W-PAD_RIGHT} y1={l.y} y2={l.y} stroke={C.border} strokeWidth="1" strokeDasharray={i===0?"":"3,3"} opacity={i===0?0.6:0.3}/>
            <text x={PAD_LEFT-8} y={l.y+4} textAnchor="end" fontSize="10" fill={C.muted} fontFamily="monospace">{fmtK(l.val)}</text>
          </g>
        ))}
        {/* Barres */}
        {data.map((d,i)=>{
          const x = PAD_LEFT + i*(barW+barGap);
          const h = niceMax>0 ? chartH * (d.sale/niceMax) : 0;
          const y = PAD_TOP + chartH - h;
          const isHovered = hovered===i;
          return (
            <g key={d.key}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0,h)}
                fill={color}
                opacity={hovered===null||isHovered?1:0.4}
                style={{transition:"opacity .15s"}}
                rx="2"
              />
              {/* Zone invisible plus large pour faciliter le hover */}
              <rect
                x={x-barGap/2}
                y={PAD_TOP}
                width={barW+barGap}
                height={chartH}
                fill="transparent"
                style={{cursor:"pointer"}}
                onMouseEnter={()=>setHovered(i)}
                onMouseLeave={()=>setHovered(null)}
              />
              {/* Label X (uniquement à intervalles) */}
              {i%stepLabel===0&&(
                <text x={x+barW/2} y={H-PAD_BOTTOM+16} textAnchor="middle" fontSize="10" fill={C.muted}>{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      {hovered!==null && data[hovered] && (
        <div style={{
          position:"absolute",
          top:0,
          left:`${(PAD_LEFT + hovered*(barW+barGap) + barW/2) / W * 100}%`,
          transform:"translateX(-50%)",
          background:C.bg,
          border:"1px solid "+C.border,
          borderRadius:6,
          padding:"6px 10px",
          fontSize:11,
          whiteSpace:"nowrap",
          pointerEvents:"none",
          zIndex:10,
          boxShadow:"0 4px 12px rgba(0,0,0,0.4)"
        }}>
          <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{data[hovered].label}</div>
          <div style={{color,fontWeight:700,fontSize:13}}>{fmt(Math.round(data[hovered].sale))}</div>
          <div style={{color:C.dim,fontSize:10,marginTop:2}}>{data[hovered].count} transaction{data[hovered].count>1?"s":""}</div>
        </div>
      )}
    </div>
  );
}

function StatsView({history,blanchHistory,pms,pmGroupes,setTab,setHFil,setHFrom,setHTo}){
  const [period,setPeriod]=useState("7"); // "today" | "7" | "30" | "total"

  // Calcul de la plage de dates LOCALES selon la période
  const periodRange=useMemo(()=>{
    const todayStr=today();
    if(period==="total")return {from:null,to:todayStr};
    if(period==="today")return {from:todayStr,to:todayStr};
    return {from:ago(parseInt(period,10)),to:todayStr};
  },[period]);

  // Drilldown : clic sur une PM/Gang → bascule vers Historique avec filtres pré-remplis
  function goToHistory(dest, nom){
    if(!setTab)return;
    setHFrom(periodRange.from||ago(3650));
    setHTo(periodRange.to);
    setHFil({who:dest+":"+nom});
    setTab("historique");
  }

  // Filtrer transactions sur la période (basé sur le champ `date` qui est en local)
  const txInPeriod=useMemo(()=>{
    if(!periodRange.from)return history;
    return history.filter(h=>h.date>=periodRange.from && h.date<=periodRange.to);
  },[history,periodRange]);

  // Calcul total payé aux PM (uniquement dest=pm)
  const totPaye=useMemo(()=>{
    return txInPeriod.filter(h=>h.dest==="pm").reduce((s,h)=>s+(+h.total||0),0);
  },[txInPeriod]);
  const txCount=txInPeriod.filter(h=>h.dest==="pm").length;
  const avgTx=txCount>0?Math.round(totPaye/txCount):0;

  // Calcul bénéfice : valeur brute - ce qui a été payé aux PM
  // - Objets : (prix × qte) - sous_total
  // - Liasses : valeur_face (70$ × qte) - (taux_liasse × qte)
  // - Argent sale : argent_sale - (argent_sale × 40%) = argent_sale × 60%
  const benefice=useMemo(()=>{
    let b=0;
    txInPeriod.filter(h=>h.dest==="pm").forEach(h=>{
      // Objets : valeur brute - payé à la PM
      if(h.types?.includes("objets")&&h.lignes){
        h.lignes.forEach(l=>{
          const brut=(+l.prix||0)*(+l.qte||0);
          const paye=(+l.sous_total||0);
          b+=(brut-paye);
        });
      }
      // Liasses : valeur faciale (70$) - taux payé à la PM
      if(h.types?.includes("liasses")){
        const qte=(+h.liasse_qte||0);
        const valFace=(+h.valeur_face||(70*qte));
        const payeLiasses=(+h.taux_liasse||0)*qte;
        b+=(valFace-payeLiasses);
      }
      // Argent sale : 100% reçu - 40% payé à la PM = 60% de bénéfice
      if(h.types?.includes("argent")){
        const argentSale=(+h.argent_sale||0);
        const payeArgent=Math.round(argentSale*0.4);
        b+=(argentSale-payeArgent);
      }
    });
    return Math.round(b);
  },[txInPeriod]);

  // Valeur brute totale (utilisée pour calculer le % de marge correctement)
  const totBrut=useMemo(()=>{
    let v=0;
    txInPeriod.filter(h=>h.dest==="pm").forEach(h=>{
      if(h.types?.includes("objets")&&h.lignes){
        h.lignes.forEach(l=>{ v+=(+l.prix||0)*(+l.qte||0); });
      }
      if(h.types?.includes("liasses")){
        v+=(+h.valeur_face||((+h.liasse_qte||0)*70));
      }
      if(h.types?.includes("argent")){
        v+=(+h.argent_sale||0);
      }
    });
    return Math.round(v);
  },[txInPeriod]);

  // ── Données du graphique d'évolution : sale généré par jour/semaine/mois ──
  const chartData=useMemo(()=>{
    if(txInPeriod.length===0) return {data:[], granularity:"day"};

    // Calculer le sale généré pour une transaction
    const saleOf = (h) => {
      let v=0;
      if(h.types?.includes("objets")&&h.lignes){
        h.lignes.forEach(l=>{ v+=(+l.prix||0)*(+l.qte||0); });
      }
      if(h.types?.includes("liasses")){
        v+=(+h.valeur_face||((+h.liasse_qte||0)*70));
      }
      if(h.types?.includes("argent")){
        v+=(+h.argent_sale||0);
      }
      return v;
    };

    // Déterminer la granularité selon la période
    const dates = txInPeriod.map(h=>h.date).sort();
    const minDate = new Date(dates[0]+"T00:00:00");
    const maxDate = new Date(dates[dates.length-1]+"T00:00:00");
    const daysDiff = Math.round((maxDate - minDate) / 86400000) + 1;
    const granularity = daysDiff <= 30 ? "day" : daysDiff <= 180 ? "week" : "month";

    // Bucketiser
    const buckets = new Map();
    txInPeriod.forEach(h=>{
      const d = new Date(h.date+"T00:00:00");
      let key, label;
      if(granularity==="day"){
        key = h.date;
        // Format DD/MM
        const dd=String(d.getDate()).padStart(2,"0");
        const mm=String(d.getMonth()+1).padStart(2,"0");
        label = `${dd}/${mm}`;
      } else if(granularity==="week"){
        // Lundi de la semaine
        const dayOfWeek = (d.getDay()+6)%7; // 0=Lundi, 6=Dimanche
        const monday = new Date(d);
        monday.setDate(d.getDate()-dayOfWeek);
        const yy=monday.getFullYear();
        const mm=String(monday.getMonth()+1).padStart(2,"0");
        const dd=String(monday.getDate()).padStart(2,"0");
        key = `${yy}-${mm}-${dd}`;
        label = `S. ${dd}/${mm}`;
      } else {
        const yy=d.getFullYear();
        const mm=String(d.getMonth()+1).padStart(2,"0");
        key = `${yy}-${mm}`;
        const monthLabels=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
        label = `${monthLabels[d.getMonth()]} ${String(yy).slice(2)}`;
      }
      const cur = buckets.get(key) || {key, label, sale:0, count:0};
      cur.sale += saleOf(h);
      cur.count += 1;
      buckets.set(key, cur);
    });

    // Sort by key (chronological)
    const data = Array.from(buckets.values()).sort((a,b)=>a.key.localeCompare(b.key));
    return {data, granularity};
  },[txInPeriod]);

  // Total blanchi sur la période
  const blanchInPeriod=useMemo(()=>{
    if(!periodRange.from)return blanchHistory;
    // periodRange.from est une string YYYY-MM-DD locale → on la convertit en début de journée local
    const fromTs=new Date(periodRange.from+"T00:00:00").getTime();
    const toTs=new Date(periodRange.to+"T23:59:59").getTime();
    return blanchHistory.filter(b=>{
      const t=new Date(b.recup_at).getTime();
      return t>=fromTs && t<=toTs;
    });
  },[blanchHistory,periodRange]);
  const totBlanch=blanchInPeriod.reduce((s,b)=>s+(+b.montant||0),0);
  const cycleCount=blanchInPeriod.length;
  const avgDur=cycleCount>0?Math.round(blanchInPeriod.reduce((s,b)=>s+(+b.duree_h||0),0)/cycleCount):0;

  // Répartition objets / liasses / argent sale
  const rep=useMemo(()=>{
    let o=0,l=0,a=0;
    txInPeriod.forEach(h=>{
      if(h.types?.includes("objets")&&h.lignes)o+=h.lignes.reduce((s,x)=>s+(x.sous_total||0),0);
      if(h.types?.includes("liasses"))l+=(h.taux_liasse||0)*(h.liasse_qte||0);
      if(h.types?.includes("argent"))a+=Math.round((h.argent_sale||0)*0.4);
    });
    return {objets:Math.round(o),liasses:Math.round(l),argent:Math.round(a)};
  },[txInPeriod]);
  const repTotal=rep.objets+rep.liasses+rep.argent||1;
  const repItems=[
    {label:"Objets",val:rep.objets,color:C.blue},
    {label:"Liasses",val:rep.liasses,color:C.green},
    {label:"Argent sale",val:rep.argent,color:C.red},
  ];

  // Top 5 PM
  // Helper : retourne le groupe associé à une transaction (priorité aux IDs)
  // Comparaison normalisée pour fallback nom (insensible casse / espaces multiples)
  const norm = s => (s||"").toLowerCase().trim().replace(/\s+/g," ");
  function groupeForTx(h){
    if(!pmGroupes||!pms||h.dest!=="pm") return null;
    // Priorité 1 : groupe_id direct
    if(h.groupe_id){
      const g = pmGroupes.find(x=>x.id===h.groupe_id);
      if(g) return g;
    }
    // Priorité 2 : pm_id → groupe actuel de cette PM
    if(h.pm_id){
      const pm = pms.find(p=>p.id===h.pm_id);
      if(pm && pm.groupe_id){
        const g = pmGroupes.find(x=>x.id===pm.groupe_id);
        if(g) return g;
      }
    }
    // Priorité 3 (fallback) : matching par nom
    if(h.pm_nom){
      const nomNorm = norm(h.pm_nom);
      let g = pmGroupes.find(x=>norm(x.nom)===nomNorm);
      if(g) return g;
      const pm = pms.find(p=>norm(p.nom)===nomNorm);
      if(pm && pm.groupe_id) return pmGroupes.find(x=>x.id===pm.groupe_id);
    }
    return null;
  }

  const topPM=useMemo(()=>{
    const map=new Map();
    txInPeriod.filter(h=>h.dest==="pm").forEach(h=>{
      // Si la transaction est associée à un groupe (via IDs ou nom), on regroupe sous le groupe
      const groupe = groupeForTx(h);
      const isGroupe = !!groupe;
      const key = isGroupe ? "g:"+groupe.id : "p:"+(h.pm_nom||"?");
      const displayNom = isGroupe ? groupe.nom : (h.pm_nom||"?");
      if(!map.has(key))map.set(key,{nom:displayNom, cat: isGroupe ? "Groupe" : (h.pm_cat||""), total:0, count:0, isGroupe, drillNom: isGroupe ? groupe.nom : (h.pm_nom||"?")});
      const x=map.get(key);
      x.total+=(+h.total||0);
      x.count+=1;
    });
    return [...map.values()].sort((a,b)=>b.total-a.total).slice(0,5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[txInPeriod,pms,pmGroupes]);

  // Top 5 Gangs
  const topGang=useMemo(()=>{
    const map=new Map();
    txInPeriod.filter(h=>h.dest==="gang").forEach(h=>{
      const key=h.gang_nom||"?";
      if(!map.has(key))map.set(key,{nom:key,cat:h.gang_cat||"",total:0,count:0});
      const x=map.get(key);
      x.total+=(+h.total||0);
      x.count+=1;
    });
    return [...map.values()].sort((a,b)=>b.total-a.total).slice(0,5);
  },[txInPeriod]);

  // Couleurs des rangs (or, argent, bronze, gris...)
  const rankBgs=["rgba(212,146,10,0.18)","rgba(160,160,160,0.18)","rgba(212,132,10,0.12)","rgba(120,120,120,0.15)","rgba(120,120,120,0.15)"];
  const rankColors=[C.text,C.muted,"#888","#666","#555"];

  function renderTopRow(arr,emptyLabel,dest){
    if(arr.length===0){
      return <div style={{color:C.muted,fontSize:11,fontStyle:"italic",textAlign:"center",padding:14}}>{emptyLabel}</div>;
    }
    return arr.map((r,i)=>(
      <div key={r.nom+i}
        onClick={()=>goToHistory(dest,r.drillNom||r.nom)}
        title={"Voir l'historique de "+r.nom}
        style={{display:"flex",alignItems:"center",gap:10,padding:"8px 8px",borderBottom:i<arr.length-1?"1px solid #404040":"none",cursor:"pointer",borderRadius:6,transition:"background .15s",margin:"0 -8px"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,flexShrink:0,background:rankBgs[i],color:rankColors[i]}}>{i+1}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
            {r.isGroupe&&<span style={{fontSize:11}}>👥</span>}
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nom}</span>
          </div>
          <div style={{fontSize:10,color:C.muted}}>{r.cat||"—"} · {r.count} tx</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
          <div style={{fontSize:13,fontWeight:600,color:C.green}}>{fmt(r.total)}</div>
          <span style={{fontSize:10,color:C.muted,opacity:0.5}}>›</span>
        </div>
      </div>
    ));
  }

  const periodBtn=p=>({padding:"6px 14px",fontSize:12,color:period===p?C.text:C.muted,background:period===p?C.surfaceAlt:"none",border:"1px solid "+(period===p?C.border:"transparent"),borderRadius:6,cursor:"pointer",fontWeight:period===p?500:400,whiteSpace:"nowrap"});

  return (
    <div>
      <div data-mobile="bb-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <h3 style={{fontSize:16,fontWeight:600,margin:0,color:C.text}}>Stats</h3>
        <div style={{display:"flex",gap:4,background:"#252525",padding:3,borderRadius:8,border:"1px solid "+C.border,flexWrap:"wrap"}}>
          <button onClick={()=>setPeriod("today")} style={periodBtn("today")}>Aujourd'hui</button>
          <button onClick={()=>setPeriod("3")} style={periodBtn("3")}>3 jours</button>
          <button onClick={()=>setPeriod("7")} style={periodBtn("7")}>7 jours</button>
          <button onClick={()=>setPeriod("30")} style={periodBtn("30")}>30 jours</button>
          <button onClick={()=>setPeriod("total")} style={periodBtn("total")}>Total</button>
        </div>
      </div>

      {/* ── Section 1 : Argent ── */}
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em",margin:"18px 0 10px",display:"flex",alignItems:"center",gap:10}}>
        <span>💰 Argent</span>
        <div style={{flex:1,height:1,background:C.border}}/>
      </div>

      <div data-mobile="grid-4" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
        <div style={card}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Payé aux PM</div>
          <div style={{fontSize:20,fontWeight:600,color:C.green,lineHeight:1.1,wordBreak:"break-word"}}>{fmt(totPaye)}</div>
        </div>
        <div style={card}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Argent sale généré PM</div>
          <div style={{fontSize:20,fontWeight:600,color:C.red,lineHeight:1.1,wordBreak:"break-word"}}>{fmt(totBrut)}</div>
        </div>
        <div style={card}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Bénéfice net estimé</div>
          <div style={{fontSize:20,fontWeight:600,color:C.green,lineHeight:1.1,wordBreak:"break-word"}}>{fmt(Math.round(totBrut*0.8)-totPaye)}</div>
        </div>
        <div style={card}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Total blanchi</div>
          <div style={{fontSize:20,fontWeight:600,color:C.amber,lineHeight:1.1,wordBreak:"break-word"}}>{fmt(totBlanch)}</div>
        </div>
      </div>

      <div style={{...card,marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Répartition des paiements aux PM</div>
        {repItems.map(r=>{
          const p=Math.round(r.val/repTotal*100);
          return (
            <div key={r.label} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:C.muted}}>{r.label}</span>
                <span style={{fontWeight:600,color:r.val>0?C.text:C.muted}}>
                  {r.val>0?fmt(r.val)+" · "+p+"%":"—"}
                </span>
              </div>
              <div style={{background:C.surfaceAlt,borderRadius:6,height:6,border:"1px solid "+C.border,overflow:"hidden"}}>
                <div style={{width:p+"%",height:"100%",borderRadius:6,background:r.color,transition:"width .4s"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section : Évolution dans le temps ── */}
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em",margin:"18px 0 10px",display:"flex",alignItems:"center",gap:10}}>
        <span>📊 Évolution du sale généré</span>
        <div style={{flex:1,height:1,background:C.border}}/>
        <span style={{textTransform:"none",letterSpacing:"normal",color:C.dim,fontSize:10,fontWeight:500}}>
          {chartData.granularity==="day"?"par jour":chartData.granularity==="week"?"par semaine":"par mois"}
        </span>
      </div>
      <div style={{...card,padding:"16px 18px"}}>
        <BarChart data={chartData.data} granularity={chartData.granularity} color={C.red}/>
      </div>

      {/* ── Section 2 : Top ── */}
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em",margin:"18px 0 10px",display:"flex",alignItems:"center",gap:10}}>
        <span>🏆 Meilleurs PM &amp; Gangs</span>
        <div style={{flex:1,height:1,background:C.border}}/>
      </div>

      <div data-mobile="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={card}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Top 5 PM</div>
          {renderTopRow(topPM,"Aucune PM payée sur la période","pm")}
        </div>
        <div style={card}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Top 5 Gangs</div>
          {renderTopRow(topGang,"Aucun gang payé sur la période","gang")}
        </div>
      </div>
    </div>
  );
}

// ── Composant onglet Bigbrother ──────────────────────────────────────────
function BigbrotherView({logs,users,bbFilter,setBBFilter}){
  const CAT_META={
    money:    {icon:"💰",bg:"rgba(61,191,143,0.15)", color:"#3dbf8f",label:"Argent"},
    tx:       {icon:"📋",bg:"rgba(224,85,85,0.15)",  color:"#e05555",label:"Transaction"},
    items:    {icon:"📦",bg:"rgba(96,165,250,0.15)", color:"#60A5FA",label:"Items"},
    apparts:  {icon:"🏠",bg:"rgba(192,132,252,0.15)",color:"#C084FC",label:"Apparts"},
    laundry:  {icon:"🧺",bg:"rgba(212,146,10,0.15)", color:"#d4920a",label:"Blanchiment"},
    access:   {icon:"👤",bg:"rgba(160,160,160,0.2)", color:"#a0a0a0",label:"Accès"},
    settings: {icon:"⚙️",bg:"rgba(160,160,160,0.2)", color:"#a0a0a0",label:"Paramètres"},
  };
  const fmtBBDate = d => {
    const x=new Date(d);
    return x.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+x.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  };

  const filtered=useMemo(()=>{
    const fromTs=bbFilter.from?new Date(bbFilter.from).getTime():0;
    const toTs=bbFilter.to?new Date(bbFilter.to+"T23:59:59").getTime():Date.now()+86400000;
    const q=bbFilter.search.toLowerCase().trim();
    return logs.filter(l=>{
      if(bbFilter.user&&l.user_nom!==bbFilter.user)return false;
      if(bbFilter.cat&&l.category!==bbFilter.cat)return false;
      const ts=new Date(l.created_at).getTime();
      if(ts<fromTs||ts>toTs)return false;
      if(q){
        const stripped=String(l.message||"").replace(/<[^>]*>/g,"");
        const t=(l.user_nom+" "+stripped+" "+(CAT_META[l.category]?.label||"")).toLowerCase();
        if(!t.includes(q))return false;
      }
      return true;
    });
  },[logs,bbFilter]);

  function highlight(html,q){
    if(!q)return html;
    const re=new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");
    // On évite de remplacer dans les balises HTML existantes — split simple sur les balises
    return html.replace(/(>[^<]*<|^[^<]*<|>[^<]*$)/g, m=>m.replace(re,'<mark style="background:rgba(90,174,232,0.35);color:#f0f0f0;padding:0 2px;border-radius:2px;">$1</mark>'));
  }

  function clearFilters(){
    setBBFilter({user:"",cat:"",from:ago(30),to:today(),search:""});
  }

  return (
    <div>
      <div data-mobile="bb-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <h3 style={{fontSize:16,fontWeight:600,margin:0,color:C.text}}>👁 Bigbrother</h3>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(224,85,85,0.15)",color:C.red,border:"1px solid rgba(224,85,85,0.3)",fontWeight:600,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>ADMIN ONLY</span>
        </div>
        <span style={{fontSize:10,color:C.muted}}>Journal des 30 derniers jours · auto-nettoyage</span>
      </div>

      <div style={{...card,marginBottom:12,padding:12}}>
        <div data-mobile="bb-filters" style={{display:"grid",gridTemplateColumns:"1fr 1fr 110px 110px",gap:8,marginBottom:10}}>
          <div>
            <div style={S.lbl}>Utilisateur</div>
            <select style={S.inp} value={bbFilter.user} onChange={e=>setBBFilter(f=>({...f,user:e.target.value}))}>
              <option value="">Tous</option>
              {users.map(u=><option key={u.id} value={u.nom}>{u.nom}</option>)}
            </select>
          </div>
          <div>
            <div style={S.lbl}>Catégorie</div>
            <select style={S.inp} value={bbFilter.cat} onChange={e=>setBBFilter(f=>({...f,cat:e.target.value}))}>
              <option value="">Toutes</option>
              <option value="money">💰 Argent / Comptes</option>
              <option value="tx">📋 Transactions</option>
              <option value="items">📦 Items</option>
              <option value="apparts">🏠 Apparts</option>
              <option value="laundry">🧺 Blanchiment</option>
              <option value="access">👤 Accès</option>
              <option value="settings">⚙️ Paramètres</option>
            </select>
          </div>
          <div>
            <div style={S.lbl}>Du</div>
            <input type="date" style={S.inp} value={bbFilter.from} onChange={e=>setBBFilter(f=>({...f,from:e.target.value}))}/>
          </div>
          <div>
            <div style={S.lbl}>Au</div>
            <input type="date" style={S.inp} value={bbFilter.to} onChange={e=>setBBFilter(f=>({...f,to:e.target.value}))}/>
          </div>
        </div>
        <input type="text" placeholder="🔍 Recherche libre (nom, item, montant...)" value={bbFilter.search} onChange={e=>setBBFilter(f=>({...f,search:e.target.value}))} style={{fontSize:13,padding:"7px 11px"}}/>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,fontSize:11,color:C.muted}}>
        <span>{filtered.length} action{filtered.length>1?"s":""} trouvée{filtered.length>1?"s":""}</span>
        <button onClick={clearFilters} style={{fontSize:10,padding:"3px 8px"}}>Réinitialiser filtres</button>
      </div>

      <div style={{...card,padding:0,overflow:"hidden"}}>
        {filtered.length===0
          ?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:12,fontStyle:"italic"}}>Aucune action trouvée</div>
          :filtered.map((l,i)=>{
            const cat=CAT_META[l.category]||{icon:"•",bg:"rgba(160,160,160,0.2)",color:"#a0a0a0",label:l.category};
            const msgHtml=highlight(l.message||"",bbFilter.search);
            return (
              <div key={i} style={{display:"flex",gap:10,padding:"10px 14px",borderBottom:i<filtered.length-1?"1px solid #404040":"none",alignItems:"flex-start"}}>
                <div style={{flexShrink:0,width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:cat.bg,color:cat.color}}>{cat.icon}</div>
                <div style={{flex:1,minWidth:0,wordBreak:"break-word"}}>
                  <div style={{fontSize:13,color:C.text,marginBottom:2,lineHeight:1.5}}>
                    <strong style={{color:cat.color}}>{l.user_nom}</strong>{" "}
                    <span dangerouslySetInnerHTML={{__html:msgHtml}}/>
                  </div>
                  <div style={{fontSize:10,color:"#686868",display:"flex",gap:6,alignItems:"center"}}>
                    <span>{fmtBBDate(l.created_at)}</span>
                    <span style={{opacity:0.5}}>·</span>
                    <span style={{padding:"1px 6px",background:cat.bg,color:cat.color,borderRadius:3,fontWeight:600,letterSpacing:"0.04em",fontSize:9,textTransform:"uppercase"}}>{cat.label}</span>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
