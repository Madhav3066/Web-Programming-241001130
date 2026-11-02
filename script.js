const KEY="attendance-pro-v2",SES="attendance-pro-session",TH="attendance-pro-theme",LATE="09:30";
const ST={present:"Present",late:"Late",leave:"On leave",absent:"Absent",none:"Not in yet"};
const $=s=>document.querySelector(s);
let S,me,tab,date,month,q="",armed=null;

const pad=n=>String(n).padStart(2,"0");
const fmt=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>fmt(new Date());
const now=()=>{const d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ini=n=>n.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const emps=()=>S.users.filter(u=>u.role==="employee");
const rec=(d,id)=>(S.records[d]||{})[id]||{};
const tmin=t=>{const[a,b]=t.split(":").map(Number);return a*60+b};
const mins=r=>r.in&&r.out?Math.max(0,tmin(r.out)-tmin(r.in)):0;
const hrs=m=>m?Math.floor(m/60)+"h "+pad(m%60)+"m":"–";
const wkend=d=>[0,6].includes(new Date(d+"T00:00").getDay());
function statusOf(r,d,e){
  if(e&&e.joined&&d<e.joined)return"none";
  if(r.status)return r.status;
  if(r.in)return r.in>LATE?"late":"present";
  return d<today()&&!wkend(d)?"absent":"none";
}
function counts(d){const c={present:0,late:0,leave:0,absent:0,none:0};emps().forEach(e=>c[statusOf(rec(d,e.id),d,e)]++);return c}

async function sha(s){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){return"p:"+s}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;$("#toasts").append(t);setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),300)},2600)}

async function init(){
  try{const th=localStorage.getItem(TH);if(th)document.documentElement.dataset.theme=th;const raw=localStorage.getItem(KEY);if(raw)S=JSON.parse(raw)}catch(e){}
  if(!S){
    const mk=async(id,name,dept,username,pw,role)=>({id,name,dept,username,pass:await sha(pw),role,joined:"2000-01-01"});
    const users=[await mk("a0","Sam Rivera","Operations","admin","admin123","admin"),
      await mk("e1","Priya Nair","Engineering","priya","priya123","employee"),await mk("e2","Marcus Webb","Design","marcus","marcus123","employee"),
      await mk("e3","Aiko Tanaka","Finance","aiko","aiko123","employee"),await mk("e4","Diego Alvarez","Support","diego","diego123","employee")];
    const records={};let d=new Date(),n=0;d.setDate(d.getDate()-1);
    while(n<30){if(d.getDay()&&d.getDay()!==6){const ds=fmt(d);records[ds]={};users.slice(1).forEach((u,j)=>{const v=(n*7+j*3)%11;
      records[ds][u.id]=v===0?{status:"absent"}:v===1?{status:"leave"}:v<4?{in:"09:4"+v,out:"17:3"+j}:{in:"08:5"+(j+2),out:"17:0"+(j+3)}});n++}d.setDate(d.getDate()-1)}
    S={users,records};save();
  }
  date=today();month=today().slice(0,7);
  let id=null;try{id=localStorage.getItem(SES)}catch(e){}
  const u=S.users.find(x=>x.id===id);
  if(u){me=u;enter()}else{$("#login").hidden=false}
  tick();setInterval(tick,1000);
}

/* ---- auth ---- */
async function doLogin(e){
  e.preventDefault();const u=$("#lu").value.trim().toLowerCase(),h=await sha($("#lp").value);
  const f=S.users.find(x=>x.username===u&&x.pass===h);
  if(!f){const c=$("#card");c.classList.remove("shake");void c.offsetWidth;c.classList.add("shake");$("#lerr").textContent="Wrong username or password. Check both and try again.";return}
  me=f;try{localStorage.setItem(SES,f.id)}catch(x){}enter();toast("Welcome back, "+f.name.split(" ")[0]);
}
function fill(u,p){$("#lu").value=u;$("#lp").value=p;$("#lerr").textContent=""}
function togglePw(){const i=$("#lp"),s=i.type==="password";i.type=s?"text":"password";$("#pwb").textContent=s?"Hide":"Show"}
function logout(){try{localStorage.removeItem(SES)}catch(e){}me=null;$("#app").hidden=true;$("#login").hidden=false;$("#lp").value="";$("#lerr").textContent=""}
function toggleTheme(){const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;r.dataset.theme=dark?"light":"dark";try{localStorage.setItem(TH,r.dataset.theme)}catch(e){}}

const NAV={admin:[["dashboard","Dashboard"],["attendance","Attendance"],["report","Monthly report"],["team","Team"]],employee:[["mine","My attendance"]]};
function enter(){
  $("#login").hidden=true;$("#app").hidden=false;
  $("#mav").textContent=ini(me.name);$("#mn").textContent=me.name;$("#mr").textContent=me.role==="admin"?"Manager":me.dept;
  $("#navs").innerHTML=NAV[me.role==="admin"?"admin":"employee"].map(([k,l])=>`<button data-k="${k}" onclick="go('${k}')">${l}</button>`).join("");
  go(NAV[me.role==="admin"?"admin":"employee"][0][0]);
}
function go(k){tab=k;
  document.querySelectorAll("#navs button").forEach(b=>b.dataset.k===k?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));
  $("#title").textContent=NAV[me.role==="admin"?"admin":"employee"].find(x=>x[0]===k)[1];show(true)}
function show(anim){
  const v=$("#view");v.innerHTML=VIEW[tab]();
  if(anim){v.classList.remove("enter");void v.offsetWidth;v.classList.add("enter")}
  document.querySelectorAll("[data-count]").forEach(el=>{const to=+el.dataset.count,t0=performance.now();if(!anim){el.textContent=to;return}
    const f=n=>{const p=Math.min(1,(n-t0)/700);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    document.querySelectorAll("[data-d]").forEach(c=>c.setAttribute("stroke-dasharray",c.dataset.d));
    document.querySelectorAll("[data-h]").forEach(b=>b.style.height=b.dataset.h);
    document.querySelectorAll("[data-w]").forEach(b=>b.style.width=b.dataset.w)}));
}

/* ---- data actions ---- */
function setRec(d,id,p){S.records[d]=S.records[d]||{};S.records[d][id]=Object.assign({},S.records[d][id],p);save();show(false)}
const checkIn=(id,m)=>{setRec(today(),id,{in:now(),out:null,status:null});toast(m||"Checked in at "+now())};
const checkOut=(id,m)=>{setRec(today(),id,{out:now()});toast(m||"Checked out at "+now())};
const mark=(id,s)=>{setRec(date,id,{status:s,in:null,out:null});toast("Marked "+ST[s].toLowerCase())};
const reset=id=>{if(S.records[date])delete S.records[date][id];save();show(false)};
const editT=(id,f,v)=>setRec(date,id,{[f]:v||null,status:null});
async function addEmp(){
  const g=i=>$("#"+i).value.trim(),n=g("tn"),d=g("td")||"General",u=g("tu").toLowerCase(),p=$("#tp").value;
  if(!n||!u||p.length<6)return toast("Enter a name, a username and a password of 6+ characters.");
  if(S.users.some(x=>x.username===u))return toast("That username is already taken.");
  S.users.push({id:"u"+Date.now(),name:n,dept:d,username:u,pass:await sha(p),role:"employee",joined:today()});save();toast(n+" added");show(false);
}
function delEmp(id){
  if(armed!==id){armed=id;show(false);setTimeout(()=>{if(armed===id){armed=null;show(false)}},3000);return}
  S.users=S.users.filter(u=>u.id!==id);Object.values(S.records).forEach(x=>delete x[id]);armed=null;save();toast("Employee removed");show(false);
}
function copyCsv(){
  const [y,m]=month.split("-").map(Number),rows=[["Name","Department","Present","Late","Leave","Absent","Hours"]];
  emps().forEach(e=>{const s=sum(e,y,m);rows.push([e.name,e.dept,s.present,s.late,s.leave,s.absent,Math.round(s.m/60)])});
  const t=rows.map(r=>r.join(",")).join("\n");
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Report copied as CSV"),()=>toast("Copy isn't available in this browser."));
}
function sum(e,y,m){
  const c={present:0,late:0,leave:0,absent:0,m:0},dim=new Date(y,m,0).getDate();
  for(let i=1;i<=dim;i++){const d=y+"-"+pad(m)+"-"+pad(i);if(d>today()||wkend(d))continue;const r=rec(d,e.id),s=statusOf(r,d,e);if(c[s]!==undefined)c[s]++;c.m+=mins(r)}
  c.pct=c.present+c.late+c.absent?Math.round((c.present+c.late)/(c.present+c.late+c.absent)*100):0;return c;
}

/* ---- views ---- */
const VIEW={
dashboard(){
  const c=counts(today()),n=emps().length||1,C=326.7;let cum=0;
  const segs=Object.keys(c).map(k=>{const l=c[k]/n*C,s=`<circle class="seg c-${k}" r="52" cx="70" cy="70" stroke-dasharray="0 ${C}" data-d="${l} ${C-l}" stroke-dashoffset="${-cum}"/>`;cum+=l;return s}).join("");
  const days=[];let d=new Date();while(days.length<7){if(d.getDay()&&d.getDay()!==6)days.unshift(fmt(d));d.setDate(d.getDate()-1)}
  const bars=days.map(x=>{const k=counts(x),p=Math.round((k.present+k.late)/n*100);return`<div class="col"><span class="mono">${p}%</span><div class="bar"><i style="height:0" data-h="${p}%"></i></div>${new Date(x+"T00:00").toLocaleDateString(undefined,{weekday:"short"})}</div>`}).join("");
  const here=emps().map(e=>({e,r:rec(today(),e.id)})).filter(x=>x.r.in).sort((a,b)=>a.r.in.localeCompare(b.r.in));
  const hr=new Date().getHours();
  return`<p class="sub" style="margin:-8px 0 16px;color:var(--mute)">${hr<12?"Good morning":hr<18?"Good afternoon":"Good evening"}, ${esc(me.name.split(" ")[0])}. Here is how today looks.</p>
  <div class="stats">
    <div class="stat"><b data-count="${emps().length}">0</b><span>Team members</span></div>
    <div class="stat ok"><b data-count="${c.present+c.late}">0</b><span>In office</span></div>
    <div class="stat late"><b data-count="${c.late}">0</b><span>Arrived late</span></div>
    <div class="stat leave"><b data-count="${c.leave}">0</b><span>On leave</span></div>
    <div class="stat abs"><b data-count="${c.absent}">0</b><span>Absent</span></div></div>
  <div class="grid">
    <div class="panel pad"><h3>Today's status</h3><div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="Status breakdown"><g transform="rotate(-90 70 70)">${segs}</g><text class="dc" x="70" y="78" text-anchor="middle">${Math.round((c.present+c.late)/n*100)}%</text></svg>
      <div class="leg">${Object.keys(c).map(k=>`<div><i class="c-${k}" style="background:currentColor;color:var(--${{present:"ok",late:"late",leave:"leave",absent:"abs",none:"line"}[k]})"></i>${ST[k]} <b class="mono">${c[k]}</b></div>`).join("")}</div></div></div>
    <div class="panel pad"><h3>Last 7 working days</h3><div class="bars">${bars}</div></div></div>
  <div class="panel pad"><h3>Who's in</h3>${here.length?here.map(({e,r})=>`<div class="who"><div class="av s">${ini(e.name)}</div><div>${esc(e.name)}<br><small style="color:var(--mute)">${esc(e.dept)}</small></div><span class="pill s-${statusOf(r,today(),e)}">${ST[statusOf(r,today(),e)]}</span><span class="time">${r.in}</span></div>`).join(""):`<div class="empty">Nobody has checked in yet today.</div>`}</div>`;
},
attendance(){
  return`<div class="tools"><label for="dt">Date</label><input type="date" id="dt" value="${date}" onchange="date=this.value||today();show(false)">
    ${date!==today()?`<button class="btn" onclick="date=today();show(false)">Back to today</button>`:""}
    <input type="search" placeholder="Search name or department" aria-label="Search" value="${esc(q)}" oninput="q=this.value;$('#tb').innerHTML=attRows()"></div>
  <div class="panel"><table><thead><tr><th>Employee</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th><th>Actions</th></tr></thead><tbody id="tb">${attRows()}</tbody></table></div>
  <p class="note">Arrivals after ${LATE} count as late. Past weekdays with no entry count as absent.</p>`;
},
report(){
  const[y,m]=month.split("-").map(Number);
  const rows=emps().map(e=>{const s=sum(e,y,m);return`<tr><td><div class="emp"><div class="av s">${ini(e.name)}</div><div>${esc(e.name)}<small>${esc(e.dept)}</small></div></div></td>
    <td>${s.present}</td><td>${s.late}</td><td>${s.leave}</td><td>${s.absent}</td><td class="time">${Math.round(s.m/60)}h</td>
    <td><div class="meter"><i style="width:0" data-w="${s.pct}%"></i></div><small class="time">${s.pct}%</small></td></tr>`}).join("");
  return`<div class="tools"><label for="mo">Month</label><input type="month" id="mo" value="${month}" onchange="month=this.value||today().slice(0,7);show(false)"><button class="btn" onclick="copyCsv()">Copy as CSV</button></div>
  <div class="panel"><table><thead><tr><th>Employee</th><th>Present</th><th>Late</th><th>Leave</th><th>Absent</th><th>Hours</th><th>Attendance</th></tr></thead><tbody>${rows||`<tr><td colspan="7" class="empty">Add employees to see a report.</td></tr>`}</tbody></table></div>
  <p class="note">Attendance = days attended ÷ (days attended + days absent). Leave days and days before someone joined are excluded.</p>`;
},
team(){
  const rows=emps().map(e=>`<tr><td><div class="emp"><div class="av s">${ini(e.name)}</div>${esc(e.name)}</div></td><td>${esc(e.dept)}</td><td class="time">${esc(e.username)}</td>
    <td><button class="btn danger" onclick="delEmp('${e.id}')">${armed===e.id?"Click again to remove":"Remove"}</button></td></tr>`).join("");
  return`<div class="panel pad" style="margin-bottom:14px"><h3>Add an employee</h3><div class="form4">
    <input id="tn" placeholder="Full name" aria-label="Full name"><input id="td" placeholder="Department" aria-label="Department">
    <input id="tu" placeholder="Username" aria-label="Username" autocomplete="off"><input id="tp" type="password" placeholder="Password (6+ characters)" aria-label="Password" autocomplete="new-password"></div>
    <button class="btn primary" onclick="addEmp()">Add employee</button></div>
  <div class="panel"><table style="min-width:520px"><thead><tr><th>Name</th><th>Department</th><th>Username</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="4" class="empty">No employees yet. Fill in the form above to add the first one.</td></tr>`}</tbody></table></div>`;
},
mine(){
  const t=today(),r=rec(t,me.id),s=statusOf(r,t,me),locked=r.status==="leave"||r.status==="absent";
  const lbl=locked?"Marked "+ST[s].toLowerCase()+" by your manager":!r.in?"Check in":!r.out?"Check out":"Done for today";
  const act=!r.in?`checkIn('${me.id}')`:`checkOut('${me.id}')`;
  const[y,m]=month.split("-").map(Number),dim=new Date(y,m,0).getDate(),first=new Date(y,m-1,1).getDay(),sm=sum(me,y,m);
  let cells="";for(let i=0;i<first;i++)cells+="<span class='wk' style='visibility:hidden'></span>";
  for(let i=1;i<=dim;i++){const d=y+"-"+pad(m)+"-"+pad(i),cl=wkend(d)?"wk":d>t?"fut":"s-"+statusOf(rec(d,me.id),d,me);cells+=`<span class="${cl}" title="${d}">${i}</span>`}
  return`<div class="panel mine"><span class="pill s-${s}">${ST[s]}</span><div class="big" id="big">${r.in&&!r.out?elapsed(r):r.in?hrs(mins(r)):"--:--"}</div>
    <small style="color:var(--mute)">${r.in?(r.out?"Worked today":"Time on the clock"):"You haven't checked in yet"}</small>
    <button class="go ${r.in&&!r.out?"out":""}" ${locked||r.out?"disabled":""} onclick="${act}">${lbl}</button>
    <small style="color:var(--mute)">${r.in?"In "+r.in:""}${r.out?" · Out "+r.out:""}</small></div>
  <div class="stats"><div class="stat ok"><b>${sm.present+sm.late}</b><span>Days attended</span></div><div class="stat late"><b>${sm.late}</b><span>Late arrivals</span></div>
    <div class="stat leave"><b>${sm.leave}</b><span>Leave days</span></div><div class="stat"><b>${Math.round(sm.m/60)}h</b><span>Hours this month</span></div></div>
  <div class="panel pad"><h3>${new Date(y,m-1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h3>
    <div class="cal">${"SMTWTFS".split("").map(x=>`<b>${x}</b>`).join("")}${cells}</div></div>`;
}};
function attRows(){
  const t=q.toLowerCase(),rs=emps().filter(e=>!t||(e.name+" "+e.dept).toLowerCase().includes(t));
  return rs.map(e=>{const r=rec(date,e.id),s=statusOf(r,date,e),canIn=date===today();
    return`<tr><td><div class="emp"><div class="av s">${ini(e.name)}</div><div>${esc(e.name)}<small>${esc(e.dept)}</small></div></div></td>
    <td><span class="pill s-${s}">${ST[s]}</span></td>
    <td><input type="time" value="${r.in||""}" aria-label="Check-in for ${esc(e.name)}" onchange="editT('${e.id}','in',this.value)"></td>
    <td><input type="time" value="${r.out||""}" aria-label="Check-out for ${esc(e.name)}" onchange="editT('${e.id}','out',this.value)"></td>
    <td class="time">${hrs(mins(r))}</td>
    <td><div class="acts">${canIn?`<button class="btn primary" ${r.in&&!r.status?"disabled":""} onclick="checkIn('${e.id}','${esc(e.name)} checked in')">In</button><button class="btn" ${!r.in||r.out?"disabled":""} onclick="checkOut('${e.id}','${esc(e.name)} checked out')">Out</button>`:""}
    <button class="btn" onclick="mark('${e.id}','leave')">Leave</button><button class="btn" onclick="mark('${e.id}','absent')">Absent</button>${r.in||r.out||r.status?`<button class="btn" onclick="reset('${e.id}')">Reset</button>`:""}</div></td></tr>`}).join("")
    ||`<tr><td colspan="6" class="empty">No employees match "${esc(q)}".</td></tr>`;
}
function elapsed(r){const m=Math.max(0,tmin(now())-tmin(r.in));return pad(Math.floor(m/60))+":"+pad(m%60)}

function tick(){
  const d=new Date(),dl=d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  $("#clock").textContent=dl+" · "+now()+":"+pad(d.getSeconds());
  if(!$("#login").hidden){$("#lt").textContent=now();$("#ld").textContent=dl;
    const p=Math.min(1,Math.max(0,(d.getHours()*60+d.getMinutes()-480)/600));$("#rp").setAttribute("stroke-dasharray",(p*816.8)+" 817")}
  const b=$("#big");if(b&&me&&me.role==="employee"){const r=rec(today(),me.id);if(r.in&&!r.out)b.textContent=elapsed(r)}
}
init();
