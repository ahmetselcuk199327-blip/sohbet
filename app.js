import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  query, where, orderBy, onSnapshot, increment, serverTimestamp, writeBatch, getDocs,
  arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3qSOWgW9SNYxqixrrBFgNvA36SdjMIFA",
  authDomain: "topsecret-ccdd1.firebaseapp.com",
  projectId: "topsecret-ccdd1",
  storageBucket: "topsecret-ccdd1.firebasestorage.app",
  messagingSenderId: "895770918429",
  appId: "1:895770918429:web:199ad15e41ef5c173a90f4"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $ = id => document.getElementById(id);
const AV_COLORS = ["#0dbd8b","#4c9aff","#f2a93b","#e05c6e","#a06bf0","#3bc9db","#7bd88f","#f075b5"];
const colorFor = uid => AV_COLORS[[...uid].reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length];
const trLow = s => (s||"").toLocaleLowerCase("tr");
const esc = s => (s||"").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uidify = s => trLow(s.trim())
  .replace(/[ıİ]/g,"i").replace(/[şŞ]/g,"s").replace(/[çÇ]/g,"c")
  .replace(/[ğĞ]/g,"g").replace(/[üÜ]/g,"u").replace(/[öÖ]/g,"o")
  .replace(/[^a-z0-9_]/g,"").slice(0,20);
const hhmm = ms => new Date(ms).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
const dayKey = ms => new Date(ms).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});

function toast(msg, err){
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast show" + (err ? " err" : "");
  clearTimeout(t._h);
  t._h = setTimeout(()=> t.className = "toast", 2800);
}
async function sha256(txt){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

/* ===== STATE ===== */
let me = null;
let users = [];
let chats = [];
let active = null;
let unsubMsgs = null;
let lastMsgs = [];
let activeTab = "chats";
let typingSeen = 0;

/* ===== LOGIN ===== */
const nickEl = $("nick"), pinEl = $("pin");
nickEl.addEventListener("input", ()=>{
  const u = uidify(nickEl.value);
  $("aliasPrev").textContent = u ? `@${u}:nexus` : "@kullanici:nexus";
});
$("loginBtn").addEventListener("click", doLogin);
pinEl.addEventListener("keydown", e => { if(e.key === "Enter") doLogin(); });

async function doLogin(){
  const uid = uidify(nickEl.value), pin = pinEl.value.trim();
  const err = $("loginErr"); err.textContent = "";
  Snd.resume();
  if(uid.length < 3){ err.textContent = "Takma ad en az 3 karakter olmalı"; return; }
  if(!/^\d{4}$/.test(pin)){ err.textContent = "PIN 4 rakamdan oluşmalı"; return; }
  const btn = $("loginBtn"); btn.disabled = true; btn.textContent = "Giriş…";
  try{
    const hash = await sha256(uid + ":" + pin);
    const ref = doc(db, "kullanicilar", uid);
    const snap = await getDoc(ref);
    if(snap.exists()){
      if(snap.data().pinHash !== hash){
        err.textContent = "PIN hatalı"; btn.disabled = false; btn.textContent = "Giriş yap"; return;
      }
      me = { uid, ad: snap.data().ad, rol: snap.data().rol || "user" };
    }else{
      me = { uid, ad: nickEl.value.trim(), rol: "user" };
      await setDoc(ref, { ad: me.ad, pinHash: hash, sonGorulme: Date.now(), cevrimici: true, kayit: Date.now(), rol: "user" });
    }
    localStorage.setItem("nexus_session", JSON.stringify({ uid: me.uid, ad: me.ad, hash, rol: me.rol }));
    startApp();
  }catch(e){
    err.textContent = "Giriş başarısız: " + e.message;
    btn.disabled = false; btn.textContent = "Giriş yap";
  }
}

function tryRestore(){
  try{
    const s = JSON.parse(localStorage.getItem("nexus_session"));
    if(s && s.uid && s.hash){ me = { uid: s.uid, ad: s.ad, rol: s.rol || "user" }; return true; }
  }catch(e){}
  return false;
}

/* ===== APP BOOT ===== */
function startApp(){
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("meAvatar").textContent = (me.ad[0]||"?").toLocaleUpperCase("tr");
  $("meAvatar").style.background = colorFor(me.uid);
  $("meName").textContent = me.ad;
  $("meAlias").textContent = `@${me.uid}:nexus`;
  if(me.rol === "admin") $("adminBtn").classList.remove("hidden");

  setInterval(()=>{
    updateDoc(doc(db,"kullanicilar",me.uid), { sonGorulme: Date.now(), cevrimici: true }).catch(()=>{});
  }, 20000);
  window.addEventListener("beforeunload", ()=>{
    updateDoc(doc(db,"kullanicilar",me.uid), { cevrimici: false, sonGorulme: Date.now() }).catch(()=>{});
  });

  onSnapshot(collection(db,"kullanicilar"), snap=>{
    users = snap.docs.map(d=>({ uid:d.id, ...d.data() }));
    renderSide();
    renderChatHeader();
    if(!$("groupOverlay").classList.contains("hidden")) renderGroupPicker();
  }, e => toast("Kullanıcılar yüklenemedi: "+e.message, true));

  onSnapshot(query(collection(db,"sohbetler"), where("uyeler","array-contains", me.uid)), snap=>{
    chats = snap.docs.map(d=>({ id:d.id, ...d.data() }))
      .sort((a,b)=> (b.sonMesajZaman||0) - (a.sonMesajZaman||0));
    renderSide();
    if(active){
      renderChatHeader();
      const c = chats.find(x=>x.id===active.id);
      if(c && ((c.okunmamis||{})[me.uid]||0) > 0){
        updateDoc(doc(db,"sohbetler",active.id), { [`okunmamis.${me.uid}`]: 0 }).catch(()=>{});
      }
    }
  }, e => toast("Sohbetler yüklenemedi: "+e.message, true));

  onSnapshot(query(collection(db,"aramalar"), where("aranan","==", me.uid)), snap=>{
    snap.docChanges().forEach(ch=>{
      const d = { id: ch.doc.id, ...ch.doc.data() };
      if(ch.type === "added" && d.durum === "zil" && Date.now() - d.olusturuldu < 60000){
        if(ringCall || call){
          updateDoc(doc(db,"aramalar",d.id), { durum:"mesgul", bitis: Date.now() }).catch(()=>{});
        }else{
          showRing(d);
        }
      }
      if(ringCall && ringCall.id === d.id && d.durum !== "zil"){
        ringCall = null;
        Snd.stop();
        $("ringOverlay").classList.add("hidden");
        if(d.durum === "bitti") toast("Arama kapatıldı");
        else if(d.durum === "ret") toast("Arama iptal edildi");
      }
      if(call && call.id === d.id) handleCallState(d);
    });
  }, ()=>{});

  onSnapshot(query(collection(db,"aramalar"), where("arayan","==", me.uid)), snap=>{
    snap.docChanges().forEach(ch=>{
      const d = { id: ch.doc.id, ...ch.doc.data() };
      if(call && call.id === d.id) handleCallState(d);
    });
  }, ()=>{});

  renderSide();
}

$("logoutBtn").addEventListener("click", ()=>{
  if(me) updateDoc(doc(db,"kullanicilar",me.uid), { cevrimici:false }).catch(()=>{});
  localStorage.removeItem("nexus_session");
  location.reload();
});

/* ===== SIDEBAR ===== */
document.querySelectorAll(".sideTab").forEach(b=>{
  b.addEventListener("click", ()=>{
    document.querySelectorAll(".sideTab").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    activeTab = b.dataset.tab;
    renderSide();
  });
});
$("newChatBtn").addEventListener("click", ()=>{
  activeTab = "people";
  document.querySelectorAll(".sideTab").forEach(x=>x.classList.toggle("on", x.dataset.tab==="people"));
  $("sideSearch").value = "";
  $("sideSearch").focus();
  renderSide();
});
$("sideSearch").addEventListener("input", renderSide);

function presenceOf(u){
  const online = u.cevrimici && Date.now() - (u.sonGorulme||0) < 45000;
  if(online) return { txt:"çevrimiçi", live:true };
  return {
    txt: "son görülme " + new Date(u.sonGorulme||Date.now()).toLocaleString("tr-TR",
      {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),
    live: false
  };
}
function previewOf(c){
  const prefix = c.sonMesajYazar === me.uid ? "Sen: "
    : (c.tur === "grup" && c.sonMesajYazarAd ? c.sonMesajYazarAd + ": " : "");
  return prefix + (c.sonMesaj || "Henüz mesaj yok");
}
function isGrup(c){ return c && c.tur === "grup"; }
function renderSide(){
  const box = $("sideList");
  const term = trLow($("sideSearch").value);
  let html = "";

  if(activeTab === "chats"){
    const rows = chats.map(c=>{
      const grp = isGrup(c);
      const other = grp ? null : c.uyeler.find(u=>u!==me.uid);
      const name = grp ? (c.grupAd || "Adsız grup") : ((c.uyelerAd && c.uyelerAd[other]) || other);
      return { c, other, name, grp };
    }).filter(r => !term || trLow(r.name).includes(term) || trLow(r.c.sonMesaj||"").includes(term));

    html = rows.length ? rows.map(({c,other,name,grp})=>{
      const u = grp ? null : (users.find(x=>x.uid===other) || {});
      const p = u ? presenceOf(u) : { txt:"", live:false };
      const unread = (c.okunmamis && c.okunmamis[me.uid]) || 0;
      const time = c.sonMesajZaman ? hhmm(c.sonMesajZaman) : "";
      const on = active && active.id === c.id ? " on" : "";
      const bg = grp ? colorFor(c.id) : colorFor(other);
      const avatar = grp
        ? `<div class="avatar" style="background:${bg}"><span class="gIco">👥</span></div>`
        : `<div class="avatar" style="background:${bg}">${esc((name[0]||"?").toLocaleUpperCase("tr"))}
            ${p.live?'<span class="dot"></span>':''}</div>`;
      const sub = grp ? `${(c.uyeler||[]).length} üye` : "";
      return `<div class="row${on}" ${grp?`data-cid="${c.id}"`:`data-chat="${other}"`}>
        ${avatar}
        <div class="rowMain">
          <div class="rowLine1"><span class="rowName">${esc(name)}</span><span class="rowTime">${time}</span></div>
          <div class="rowLine2"><span class="rowLast">${esc(previewOf(c))}</span>
            ${unread?`<span class="badge">${unread}</span>`:""}</div>
          ${grp?`<div class="rowGrp">${sub}</div>`:""}
        </div></div>`;
    }).join("") : `<div class="emptyList">${term?"Sonuç yok":"Henüz sohbetin yok.<br><b>Kişiler</b> sekmesinden birini seç ya da <b>👥</b> ile grup kur."}</div>`;
  }else{
    const rows = users.filter(u=>u.uid!==me.uid &&
      (!term || trLow(u.ad).includes(term) || trLow(u.uid).includes(term)));
    html = rows.length ? rows.map(u=>{
      const p = presenceOf(u);
      return `<div class="row" data-chat="${u.uid}">
        <div class="avatar" style="background:${colorFor(u.uid)}">${esc((u.ad[0]||"?").toLocaleUpperCase("tr"))}
          ${p.live?'<span class="dot"></span>':''}</div>
        <div class="rowMain">
          <div class="rowLine1"><span class="rowName">${esc(u.ad)}</span></div>
          <div class="rowLine2"><span class="rowLast" style="color:${p.live?'var(--acc)':'var(--muted)'}">${p.live?"● ":""}${esc(p.txt)}</span>
            <span class="rowLast" style="font-family:ui-monospace,monospace;font-size:11.5px">@${u.uid}</span></div>
        </div></div>`;
    }).join("") : `<div class="emptyList">${term?"Kişi bulunamadı":"Kayıtlı başka kişi yok.<br>Arkadaşların da Nexus'a gelsin!"}</div>`;
  }
  box.innerHTML = html;
  box.querySelectorAll(".row").forEach(r=>{
    r.addEventListener("click", ()=>{
      if(r.dataset.cid) openGroupChat(r.dataset.cid);
      else if(r.dataset.chat) openChat(r.dataset.chat);
    });
  });
}
/* ===== CHAT ===== */
async function openChat(otherUid){
  const otherUser = users.find(u=>u.uid===otherUid);
  const otherAd = otherUser ? otherUser.ad : otherUid;
  const id = [me.uid, otherUid].sort().join("~");
  const ref = doc(db,"sohbetler",id);
  try{
    const snap = await getDoc(ref);
    if(!snap.exists()){
      await setDoc(ref, {
        tur: "dm",
        uyeler: [me.uid, otherUid].sort(),
        uyelerAd: { [me.uid]: me.ad, [otherUid]: otherAd },
        sonMesaj: "", sonMesajYazar: "", sonMesajYazarAd: "", sonMesajZaman: 0,
        okunmamis: {}, yaziyor: {}
      });
    }
  }catch(e){ toast("Sohbet açılamadı: "+e.message, true); return; }
  enterChat({ id, type:"dm", other: otherUid, otherAd });
}

function openGroupChat(cid){
  const c = chats.find(x=>x.id===cid);
  if(!c) return;
  enterChat({ id: c.id, type:"grup", grupAd: c.grupAd || "Adsız grup", uyeler: c.uyeler || [] });
}

function enterChat(a){
  active = a;
  document.body.classList.add("inChat");
  $("phView").classList.add("hidden");
  $("chatView").classList.remove("hidden");
  $("msgSearchBar").classList.add("hidden");
  $("msgSearch").value = "";
  $("input").value = "";
  renderChatHeader();
  renderSide();
  updateDoc(doc(db,"sohbetler",active.id), { [`okunmamis.${me.uid}`]: 0 }).catch(()=>{});

  if(unsubMsgs) unsubMsgs();
  const ref = doc(db,"sohbetler",active.id);
  unsubMsgs = onSnapshot(query(collection(ref,"mesajlar"), orderBy("ts","asc")), snap=>{
    lastMsgs = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    renderMsgs(lastMsgs);
    markRead(ref, snap.docs, active && active.type === "grup");
  }, e => toast("Mesajlar yüklenemedi: "+e.message, true));
}

function renderChatHeader(){
  if(!active) return;
  const grp = active.type === "grup";
  $("callBtn").classList.toggle("hidden", grp);
  if(grp){
    const c = chats.find(x=>x.id===active.id);
    if(c){ active.grupAd = c.grupAd || active.grupAd; active.uyeler = c.uyeler || active.uyeler; }
    const n = (active.uyeler||[]).length;
    $("chatName").textContent = active.grupAd;
    $("chatAvatar").innerHTML = "👥";
    $("chatAvatar").style.background = colorFor(active.id);
    $("chatAvatar").style.fontSize = "17px";
    const st = $("chatStatus");
    st.className = "chatStatus";
    st.textContent = `${n} üye · grup sohbeti`;
    return;
  }
  const u = users.find(x=>x.uid===active.other);
  const p = u ? presenceOf(u) : { txt:"—", live:false };
  $("chatName").textContent = active.otherAd;
  $("chatAvatar").textContent = (active.otherAd[0]||"?").toLocaleUpperCase("tr");
  $("chatAvatar").style.background = colorFor(active.other);
  $("chatAvatar").style.fontSize = "";
  const st = $("chatStatus");
  st.className = "chatStatus" + (p.live ? " live" : "");
  st.textContent = p.txt;
}

function markRead(ref, docs, grp){
  if(grp){
    const ps = [];
    docs.forEach(d=>{
      const m = d.data();
      if(m.yazan === me.uid || m.sistem) return;
      const ok = m.okuyan || [];
      if(!ok.includes(me.uid)) ps.push(updateDoc(d.ref, { okuyan: arrayUnion(me.uid) }).catch(()=>{}));
    });
    if(ps.length) Promise.all(ps);
    return;
  }
  const batch = writeBatch(db);
  let n = 0;
  docs.forEach(d=>{
    const m = d.data();
    if(m.yazan !== me.uid && !m.okundu){ batch.update(d.ref, { okundu:true }); n++; }
  });
  if(n) batch.commit().catch(()=>{});
}

function highlight(text, term){
  const safe = esc(text);
  if(!term) return safe;
  const i = trLow(safe).indexOf(term);
  return i<0 ? safe : safe.slice(0,i)+"<mark>"+safe.slice(i,i+term.length)+"</mark>"+safe.slice(i+term.length);
}

function tickHtml(m, mine){
  if(!mine) return "";
  const grp = active && active.type === "grup";
  if(!grp) return m.okundu ? '<span class="ticks read">✓✓</span>' : '<span class="ticks">✓</span>';
  const others = (active.uyeler || []).filter(u => u !== me.uid);
  const read = m.okuyan || [];
  const n = others.filter(u => read.indexOf(u) >= 0).length;
  if(others.length && n >= others.length) return '<span class="ticks read">✓✓</span>';
  if(n > 0) return '<span class="ticks">✓✓</span>';
  return '<span class="ticks">✓</span>';
}

function renderMsgs(msgs){
  const box = $("msgs");
  const term = trLow($("msgSearch").value.trim());
  const shown = term ? msgs.filter(m=>trLow(m.icerik||"").includes(term)) : msgs;
  const grp = active && active.type === "grup";
  let html = "", lastDay = "";

  shown.forEach(m=>{
    const t = m.ts || Date.now();
    const dk = dayKey(t);
    if(dk !== lastDay){ html += `<div class="dayChip">${dk}</div>`; lastDay = dk; }
    if(m.sistem){
      html += `<div class="sysChip">${highlight(m.icerik, term)}</div>`;
      return;
    }
    const mine = m.yazan === me.uid;
    const who = (grp && !mine && m.yazanAd)
      ? `<div class="msgWho" style="color:${colorFor(m.yazan)}">${esc(m.yazanAd)}</div>` : "";
    const meta = mine
      ? `<span class="msgMeta">${hhmm(t)} ${tickHtml(m, mine)}</span>`
      : `<span class="msgMeta">${hhmm(t)}</span>`;
    html += `<div class="msg ${mine?"me":"them"}">${who}${highlight(m.icerik, term)}${meta}</div>`;
  });

  if(!shown.length){
    html += `<div class="emptyList" style="align-self:center">${term ? "Eşleşen mesaj yok" : "Henüz mesaj yok — ilk mesajı sen yaz!"}</div>`;
  }
  if(typingSeen && Date.now()-typingSeen < 6000 && !term){
    html += `<div class="typingRow"><i></i><i></i><i></i></div>`;
  }
  box.innerHTML = html;
  box.scrollTop = box.scrollHeight;
}

function renderMsgsFromCache(){ renderMsgs(lastMsgs); }

$("backBtn").addEventListener("click", ()=>{
  document.body.classList.remove("inChat");
  closeChat();
});
function closeChat(){
  active = null;
  if(unsubMsgs){ unsubMsgs(); unsubMsgs = null; }
  lastMsgs = [];
  $("chatView").classList.add("hidden");
  $("phView").classList.remove("hidden");
  renderSide();
}
function toggleMsgSearch(){
  const b = $("msgSearchBar");
  b.classList.toggle("hidden");
  if(!b.classList.contains("hidden")) $("msgSearch").focus();
  else { $("msgSearch").value = ""; renderMsgsFromCache(); }
}
$("chatTitleBtn").addEventListener("click", ()=>{
  if(active && active.type === "grup") openGroupInfo();
  else toggleMsgSearch();
});
$("msgSearchBtn").addEventListener("click", toggleMsgSearch);
$("msgSearch").addEventListener("input", renderMsgsFromCache);

/* --- yazıyor... --- */
let typingThrottle = 0;
$("input").addEventListener("input", ()=>{
  const el = $("input");
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
  if(!active) return;
  const now = Date.now();
  if(now - typingThrottle > 2500){
    typingThrottle = now;
    updateDoc(doc(db,"sohbetler",active.id), { [`yaziyor.${me.uid}`]: Date.now() }).catch(()=>{});
  }
});
setInterval(()=>{
  if(!active) return;
  const c = chats.find(x=>x.id===active.id);
  let ts = 0;
  if(c && c.yaziyor){
    if(active.type === "grup"){
      (active.uyeler||[]).forEach(u=>{ if(u !== me.uid) ts = Math.max(ts, c.yaziyor[u] || 0); });
    }else{
      ts = c.yaziyor[active.other] || 0;
    }
  }
  const should = ts && Date.now()-ts < 6000 ? ts : 0;
  if(should !== typingSeen){ typingSeen = should; renderMsgsFromCache(); }
}, 1200);

/* --- gönder --- */
async function send(){
  const text = $("input").value.trim();
  if(!text || !active) return;
  const ref = doc(db,"sohbetler",active.id);
  const grp = active.type === "grup";
  $("input").value = "";
  $("input").style.height = "auto";
  try{
    await addDoc(collection(ref,"mesajlar"), {
      icerik: text, yazan: me.uid, yazanAd: me.ad,
      ts: Date.now(), zaman: serverTimestamp(), okundu: false,
      okuyan: [me.uid]
    });
    const upd = {
      sonMesaj: text, sonMesajYazar: me.uid, sonMesajYazarAd: me.ad,
      sonMesajZaman: Date.now(), [`yaziyor.${me.uid}`]: 0
    };
    if(grp){
      (active.uyeler||[]).forEach(u=>{
        if(u !== me.uid) upd[`okunmamis.${u}`] = increment(1);
      });
    }else if(active.other){
      upd[`okunmamis.${active.other}`] = increment(1);
    }
    updateDoc(ref, upd).catch(()=>{});
  }catch(e){ toast("Gönderilemedi: "+e.message, true); }
}
$("sendBtn").addEventListener("click", send);
$("input").addEventListener("keydown", e=>{
  if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); send(); }
});
/* ===== SESLER (Web Audio) ===== */
const Snd = (()=>{
  let ctx = null, gen = 0;
  function ac(){
    const C = window.AudioContext || window.webkitAudioContext;
    if(!C) return null;
    if(!ctx){ try{ ctx = new C(); }catch(e){ return null; } }
    if(ctx.state === "suspended") ctx.resume().catch(()=>{});
    return ctx;
  }
  function tone(freq, dur, o){
    o = o || {};
    const c = ac(); if(!c) return;
    const t0 = c.currentTime + (o.delay || 0);
    const a = Math.min(o.attack == null ? 0.012 : o.attack, dur * 0.4);
    const peak = Math.max(o.vol == null ? 0.18 : o.vol, 0.0002);
    try{
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = o.type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.04);
      osc.onended = ()=>{ try{ osc.disconnect(); g.disconnect(); }catch(e){} };
    }catch(e){}
  }
  function loop(fn, delay){
    const my = ++gen;
    const step = ()=>{ if(my !== gen) return; fn(); setTimeout(step, delay); };
    step();
  }
  function stop(){ gen++; try{ if(navigator.vibrate) navigator.vibrate(0); }catch(e){} }
  const api = {
    resume(){ ac(); },
    stop,
    ringback(){
      loop(()=> tone(425, 0.85, { vol:0.13, type:"sine", attack:0.02 }), 3400);
    },
    ringtone(){
      const my = ++gen;
      const seq = [[659.25,0.32],[523.25,0.32],[659.25,0.32],[392,0.55]];
      let i = 0;
      const step = ()=>{
        if(my !== gen) return;
        const n = seq[i % seq.length];
        tone(n[0], n[1], { vol:0.17, type:"triangle", attack:0.01, release:0.2 });
        tone(n[0]*2, n[1]*0.45, { vol:0.045, type:"sine", attack:0.01, delay:0.015 });
        i++;
        const last = i % seq.length === 0;
        setTimeout(step, (n[1] + (last ? 1.35 : 0.14)) * 1000);
      };
      step();
      vibrate([350,220,350,220,350]);
    },
    connecting(){ tone(523.25,0.07,{vol:0.11,type:"sine"}); tone(659.25,0.07,{vol:0.11,type:"sine",delay:0.07}); },
    connected(){ tone(659.25,0.08,{vol:0.15,type:"triangle"}); tone(880,0.13,{vol:0.15,type:"triangle",delay:0.08}); },
    end(){ tone(659.25,0.11,{vol:0.14,type:"triangle"}); tone(440,0.24,{vol:0.14,type:"triangle",delay:0.1}); },
    fail(){ tone(311,0.15,{vol:0.13,type:"sawtooth"}); tone(207.65,0.3,{vol:0.12,type:"sawtooth",delay:0.15}); },
    tick(){ tone(1180,0.045,{vol:0.05,type:"sine"}); }
  };
  function vibrate(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
  document.addEventListener("pointerdown", ()=>{ const c = ac(); if(c && c.state === "suspended") c.resume(); }, { passive:true });
  return api;
})();

/* ===== SESLİ ARAMA (WebRTC) ===== */
let call = null;
let ringCall = null;
let candUnsub = null;
let candQueue = [];
let timerInt = null;
const RTC_CFG = { iceServers: [
  { urls: ["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun2.l.google.com:19302","stun:stun.cloudflare.com:3478"] }
] };

function showRing(d){
  ringCall = d;
  $("ringAvatar").textContent = (d.arayanAd[0]||"?").toLocaleUpperCase("tr");
  $("ringAvatar").style.background = colorFor(d.arayan);
  $("ringName").textContent = d.arayanAd;
  $("ringAlias").textContent = `@${d.arayan}:nexus`;
  $("ringOverlay").classList.remove("hidden");
  Snd.ringtone();
}

$("ringReject").addEventListener("click", async ()=>{
  if(!ringCall) return;
  const id = ringCall.id; ringCall = null;
  Snd.stop();
  $("ringOverlay").classList.add("hidden");
  await updateDoc(doc(db,"aramalar",id), { durum:"ret", bitis: Date.now() }).catch(()=>{});
  Snd.end();
  toast("Arama reddedildi");
});

$("ringAccept").addEventListener("click", async ()=>{
  if(!ringCall) return;
  const d = ringCall; ringCall = null;
  Snd.stop();
  $("ringOverlay").classList.add("hidden");
  try{
    const local = await navigator.mediaDevices.getUserMedia({ audio:true });
    call = { id:d.id, role:"callee", local, muted:false, step:"wait-offer", connectedAt:0 };
    await updateDoc(doc(db,"aramalar",d.id), { durum:"kabul", kabulZaman: Date.now() });
    showCallOverlay(d.arayanAd, d.arayan, "Bağlanıyor…");
    Snd.connecting();
    listenCandidates(d.id);
  }catch(e){
    toast("Mikrofon izni verilmedi", true);
    Snd.fail();
    updateDoc(doc(db,"aramalar",d.id), { durum:"bitti" }).catch(()=>{});
  }
});

$("callBtn").addEventListener("click", async ()=>{
  if(!active || active.type === "grup"){ toast("Grup araması henüz kullanılamıyor", true); return; }
  if(call){ toast("Zaten bir görüşme açık"); return; }
  try{
    const local = await navigator.mediaDevices.getUserMedia({ audio:true });
    const id = `${me.uid}_${active.other}_${Date.now()}`;
    call = { id, role:"caller", local, muted:false, step:"wait-accept", connectedAt:0, other: active.other };
    await setDoc(doc(db,"aramalar",id), {
      arayan: me.uid, arayanAd: me.ad,
      aranan: active.other, arananAd: active.otherAd,
      durum: "zil", olusturuldu: Date.now()
    });
    showCallOverlay(active.otherAd, active.other, "Zil çalıyor…");
    Snd.ringback();
    listenCandidates(id);
    setTimeout(()=>{ if(call && call.id===id && call.step==="wait-accept") endCall("cevapsiz"); }, 45000);
  }catch(e){ toast("Mikrofon izni verilmedi", true); Snd.fail(); }
});

function showCallOverlay(name, uid, status){
  $("callAvatar").textContent = (name[0]||"?").toLocaleUpperCase("tr");
  $("callAvatar").style.background = colorFor(uid);
  $("callAvatar").classList.add("ringing");
  $("callName").textContent = name;
  $("callAlias").textContent = `@${uid}:nexus`;
  $("callStatus").textContent = status;
  $("callTimer").textContent = "";
  $("callOverlay").classList.remove("hidden");
}

function handleCallState(d){
  if(!call || call.id !== d.id) return;
  if(call.role === "caller"){
    if(d.durum === "kabul" && call.step === "wait-accept"){
      call.step = "offer";
      Snd.stop(); Snd.connecting();
      callerOffer(d);
    }else if(d.durum === "cevap" && d.answer && call.step === "offer" && !call.gotAnswer){
      call.gotAnswer = true;
      call.pc.setRemoteDescription(new RTCSessionDescription(d.answer))
        .then(()=> flushQueue()).catch(()=>{});
    }else if(d.durum === "ret"){ endCall("ret"); }
    else if(d.durum === "mesgul"){ endCall("mesgul"); }
    else if(d.durum === "bitti"){ endCall(d.sonuc || "karsi-kapatti"); }
  }else{
    if(d.durum === "teklif" && d.offer && call.step === "wait-offer"){
      call.step = "answer";
      calleeAnswer(d);
    }else if(d.durum === "bitti" || d.durum === "ret"){ endCall("karsi-kapatti"); }
  }
}

function newPeer(){
  const pc = new RTCPeerConnection(RTC_CFG);
  call.local.getTracks().forEach(t=> pc.addTrack(t, call.local));
  pc.onicecandidate = e=>{
    if(e.candidate && call){
      addDoc(collection(db,"aramalar",call.id,"adaylar"), {
        kim: call.role, k: e.candidate.toJSON(), at: Date.now()
      }).catch(()=>{});
    }
  };
  pc.ontrack = e=>{
    const a = $("remoteAudio");
    a.srcObject = e.streams[0];
    a.muted = false;
    a.play().catch(()=>{});
  };
  pc.onconnectionstatechange = ()=>{
    if(!call) return;
    if(pc.connectionState === "connected" && !call.connectedAt){
      call.connectedAt = Date.now();
      Snd.stop(); Snd.connected();
      $("callAvatar").classList.remove("ringing");
      $("callStatus").textContent = "Görüşme sürüyor";
      startTimer();
    }else if(["failed"].includes(pc.connectionState)){
      endCall("baglanti-koptu");
    }
  };
  call.pc = pc;
  return pc;
}

async function callerOffer(d){
  try{
    const pc = newPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(doc(db,"aramalar",d.id), { durum:"teklif", offer: pc.localDescription.toJSON() });
    $("callStatus").textContent = "Bağlanıyor…";
    armConnectTimeout();
  }catch(e){ toast("Arama başlatılamadı: "+e.message, true); endCall("hata"); }
}

async function calleeAnswer(d){
  try{
    const pc = call.pc || newPeer();
    await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
    flushQueue();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await updateDoc(doc(db,"aramalar",d.id), { durum:"cevap", answer: pc.localDescription.toJSON() });
    $("callStatus").textContent = "Bağlanıyor…";
    armConnectTimeout();
  }catch(e){ toast("Arama bağlanamadı: "+e.message, true); endCall("hata"); }
}

function listenCandidates(id){
  candQueue = [];
  if(candUnsub) candUnsub();
  candUnsub = onSnapshot(collection(db,"aramalar",id,"adaylar"), snap=>{
    snap.docChanges().forEach(ch=>{
      if(ch.type !== "added") return;
      const c = ch.doc.data();
      if(!call || c.kim === call.role) return;
      if(call.pc && call.pc.remoteDescription){
        call.pc.addIceCandidate(new RTCIceCandidate(c.k)).catch(()=>{});
      }else{
        candQueue.push(c.k);
      }
    });
  }, ()=>{});
}

function flushQueue(){
  if(!call || !call.pc) return;
  candQueue.forEach(k=> call.pc.addIceCandidate(new RTCIceCandidate(k)).catch(()=>{}));
  candQueue = [];
}

function armConnectTimeout(){
  const id = call && call.id;
  setTimeout(()=>{
    if(call && call.id === id && !call.connectedAt) endCall("baglanamadi");
  }, 30000);
}

function startTimer(){
  clearInterval(timerInt);
  timerInt = setInterval(()=>{
    if(!call || !call.connectedAt){ clearInterval(timerInt); return; }
    const s = Math.floor((Date.now() - call.connectedAt)/1000);
    $("callTimer").textContent =
      String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0");
  }, 1000);
}

$("muteBtn").addEventListener("click", ()=>{
  if(!call || !call.local) return;
  call.muted = !call.muted;
  call.local.getAudioTracks().forEach(t=> t.enabled = !call.muted);
  $("muteBtn").classList.toggle("off", call.muted);
});

$("endBtn").addEventListener("click", ()=> endCall("ben-bitirdim"));

function endCall(why){
  if(!call) return;
  const c = call;
  call = null;
  clearInterval(timerInt);
  Snd.stop();
  if(why === "cevapsiz" || why === "baglanamadi" || why === "baglanti-koptu" || why === "hata") Snd.fail();
  else Snd.end();
  if(candUnsub){ candUnsub(); candUnsub = null; }
  candQueue = [];
  try{ if(c.pc) c.pc.close(); }catch(e){}
  try{ if(c.local) c.local.getTracks().forEach(t=>t.stop()); }catch(e){}
  $("remoteAudio").srcObject = null;
  $("callOverlay").classList.add("hidden");
  $("muteBtn").classList.remove("off");

  const ref = doc(db,"aramalar",c.id);
  getDoc(ref).then(snap=>{
    if(!snap.exists()) return;
    const d = snap.data();
    if(["ret","bitti","mesgul"].includes(d.durum)){
      if(d.durum === "mesgul") toast("Meşgul — karşı taraf başka bir görüşmede");
      return;
    }
    const sonuc = why === "ret" ? "ret"
      : why === "cevapsiz" ? "cevapsiz"
      : why === "mesgul" ? "mesgul"
      : why === "ben-bitirdim" ? (c.role==="caller"?"giden":"gelen")
      : "hata";
    updateDoc(ref, { durum:"bitti", sonuc, bitis: Date.now() }).catch(()=>{});
    if(why === "cevapsiz") toast("Cevap verilmedi");
    else if(why === "ret") toast("Arama reddedildi");
    else if(why === "ben-bitirdim") toast("Görüşme sonlandırıldı");
    else if(why === "baglanti-koptu") toast("Bağlantı koptu");
    else if(why === "baglanamadi") toast("Bağlanılamadı, tekrar dene");
    else if(why === "karsi-kapatti") toast("Görüşme kapatıldı");
  }).catch(()=>{});
}

/* ===== GRUPLAR ===== */
let gSelected = new Set();

$("newGroupBtn").addEventListener("click", openGroupCreate);
$("groupClose").addEventListener("click", ()=> $("groupOverlay").classList.add("hidden"));
$("groupName").addEventListener("input", validateGroup);
$("groupSearch").addEventListener("input", renderGroupPicker);
$("groupCreate").addEventListener("click", createGroup);
$("ginfoClose").addEventListener("click", ()=> $("ginfoOverlay").classList.add("hidden"));

function openGroupCreate(){
  gSelected = new Set();
  $("groupName").value = "";
  $("groupSearch").value = "";
  $("groupOverlay").classList.remove("hidden");
  renderGroupPicker();
  validateGroup();
  setTimeout(()=> $("groupName").focus(), 80);
}

function validateGroup(){
  const ok = $("groupName").value.trim().length >= 2 && gSelected.size >= 1;
  $("groupCreate").disabled = !ok;
}

function renderGroupPicker(){
  const term = trLow(($("groupSearch").value || "").trim());
  const rows = users.filter(u => u.uid !== me.uid &&
    (!term || trLow(u.ad).includes(term) || trLow(u.uid).includes(term)));
  const box = $("groupMembers");
  box.innerHTML = rows.length ? rows.map(u=>{
    const p = presenceOf(u);
    const on = gSelected.has(u.uid) ? " picked" : "";
    return `<div class="row${on}" data-gu="${u.uid}">
      <div class="avatar" style="background:${colorFor(u.uid)}">${esc((u.ad[0]||"?").toLocaleUpperCase("tr"))}
        ${p.live?'<span class="dot"></span>':''}</div>
      <div class="rowMain">
        <div class="rowLine1"><span class="rowName">${esc(u.ad)}</span></div>
        <div class="rowLine2"><span class="rowLast">@${u.uid} · ${esc(p.live?"çevrimiçi":"çevrimdışı")}</span></div>
      </div>
      <div class="gCheck">✓</div>
    </div>`;
  }).join("") : `<div class="emptyList">Kullanıcı bulunamadı</div>`;

  box.querySelectorAll("[data-gu]").forEach(r=>{
    r.addEventListener("click", ()=>{
      const uid = r.dataset.gu;
      if(gSelected.has(uid)) gSelected.delete(uid); else gSelected.add(uid);
      r.classList.toggle("picked", gSelected.has(uid));
      $("gSelCount").textContent = gSelected.size;
      validateGroup();
    });
  });
  $("gSelCount").textContent = gSelected.size;
}

async function createGroup(){
  const name = $("groupName").value.trim();
  if(name.length < 2){ toast("Grup adı en az 2 karakter olmalı", true); return; }
  if(!gSelected.size){ toast("En az 1 üye seçmelisin", true); return; }
  const btn = $("groupCreate");
  btn.disabled = true; btn.textContent = "Oluşturuluyor…";
  try{
    const id = "grup_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const uyeler = [me.uid, ...[...gSelected]];
    const uyelerAd = { [me.uid]: me.ad };
    uyeler.forEach(u=>{ const x = users.find(k=>k.uid===u); uyelerAd[u] = x ? x.ad : u; });

    await setDoc(doc(db,"sohbetler",id), {
      tur: "grup", grupAd: name, kurucu: me.uid, yonetici: [me.uid],
      uyeler, uyelerAd, olusturuldu: Date.now(),
      sonMesaj: "", sonMesajYazar: "", sonMesajYazarAd: "", sonMesajZaman: 0,
      okunmamis: {}, yaziyor: {}
    });
    await addDoc(collection(doc(db,"sohbetler",id),"mesajlar"), {
      icerik: `${me.ad} grubu oluşturdu · ${uyeler.length} üye`,
      sistem: true, yazan: me.uid, yazanAd: me.ad, ts: Date.now(), zaman: serverTimestamp()
    });

    $("groupOverlay").classList.add("hidden");
    btn.textContent = "Grubu oluştur";
    toast("Grup oluşturuldu: " + name);
    activeTab = "chats";
    document.querySelectorAll(".sideTab").forEach(x=> x.classList.toggle("on", x.dataset.tab === "chats"));
    enterChat({ id, type:"grup", grupAd: name, uyeler });
    renderSide();
  }catch(e){
    toast("Grup oluşturulamadı: "+e.message, true);
    btn.disabled = false; btn.textContent = "Grubu oluştur";
  }
}

function openGroupInfo(){
  if(!active || active.type !== "grup") return;
  const c = chats.find(x=>x.id===active.id) || {};
  if(c.uyeler){ active.uyeler = c.uyeler; active.grupAd = c.grupAd || active.grupAd; }
  const uyeler = active.uyeler || [];
  const kurucu = c.kurucu || "";
  const yonetici = c.yonetici || [];

  const rows = uyeler.map(u=>{
    const ad = (c.uyelerAd && c.uyelerAd[u]) || (users.find(x=>x.uid===u)||{}).ad || u;
    const role = u === kurucu ? "kurucu" : (yonetici.includes(u) ? "yönetici" : "üye");
    const p = presenceOf(users.find(x=>x.uid===u) || {});
    return `<div class="giRow">
      <div class="avatar sm" style="background:${colorFor(u)}">${esc((ad[0]||"?").toLocaleUpperCase("tr"))}
        ${p.live?'<span class="dot"></span>':''}</div>
      <div class="rowMain">
        <div class="rowName">${esc(ad)}${u===me.uid?' <span class="gMe">(sen)</span>':""}</div>
        <div class="rowLast">@${u}</div>
      </div>
      <span class="gRole r-${role === "üye" ? "uye" : role}">${role}</span>
    </div>`;
  }).join("");

  const tarih = c.olusturuldu ? new Date(c.olusturuldu).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}) : "";
  $("ginfoBody").innerHTML = `
    <div class="giHead">
      <div class="giAvatar" style="background:${colorFor(active.id)}">👥</div>
      <div class="giName">${esc(active.grupAd)}</div>
      <div class="giSub">${uyeler.length} üye${tarih?" · "+tarih:""}</div>
    </div>
    ${rows}
    <button class="giLeave" id="gLeave">Gruptan ayrıl</button>`;
  $("ginfoOverlay").classList.remove("hidden");
  $("gLeave").addEventListener("click", leaveGroup);
}

async function leaveGroup(){
  if(!active || active.type !== "grup") return;
  const id = active.id, ad = active.grupAd;
  if(!confirm(`"${ad}" grubundan ayrılmak istediğine emin misin?`)) return;
  try{
    await updateDoc(doc(db,"sohbetler",id), {
      uyeler: arrayRemove(me.uid),
      sonMesaj: `${me.ad} gruptan ayrıldı`,
      sonMesajYazar: me.uid, sonMesajYazarAd: me.ad, sonMesajZaman: Date.now()
    });
    await addDoc(collection(doc(db,"sohbetler",id),"mesajlar"), {
      icerik: `${me.ad} gruptan ayrıldı`,
      sistem: true, yazan: me.uid, yazanAd: me.ad, ts: Date.now(), zaman: serverTimestamp()
    }).catch(()=>{});
    $("ginfoOverlay").classList.add("hidden");
    document.body.classList.remove("inChat");
    closeChat();
    toast("Gruptan ayrıldın");
  }catch(e){ toast("Ayrılamadın: "+e.message, true); }
}

/* ===== ADMIN PANEL ===== */
let adminTab = "users";
let allChatsCache = [];
let unsubAdminChats = null;

$("adminBtn").addEventListener("click", ()=>{
  if(!me || me.rol !== "admin") return;
  $("adminOverlay").classList.remove("hidden");
  renderAdmin();
});
$("adminClose").addEventListener("click", closeAdmin);
document.querySelectorAll("[data-atab]").forEach(b=>{
  b.addEventListener("click", ()=>{
    document.querySelectorAll("[data-atab]").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    adminTab = b.dataset.atab;
    renderAdmin();
  });
});

function closeAdmin(){
  $("adminOverlay").classList.add("hidden");
  if(unsubAdminChats){ unsubAdminChats(); unsubAdminChats = null; }
}

function renderAdmin(){
  const body = $("adminBody");
  if(adminTab === "users"){
    if(unsubAdminChats){ unsubAdminChats(); unsubAdminChats = null; }
    body.innerHTML = users.length ? users.map(u=>{
      const online = u.cevrimici && Date.now()-(u.sonGorulme||0) < 45000;
      const rol = u.rol === "admin" ? "admin" : "user";
      const isMe = u.uid === me.uid;
      return `<div class="aRow">
        <div class="avatar" style="background:${colorFor(u.uid)}">${esc((u.ad[0]||"?").toLocaleUpperCase("tr"))}
          ${online?'<span class="dot"></span>':''}</div>
        <div class="aRowMain">
          <div class="aRowName">${esc(u.ad)} <span class="aTag ${rol}">${rol}</span></div>
          <div class="aRowSub">@${u.uid}:nexus · ${online?"çevrimiçi":"çevrimdışı"}</div>
        </div>
        <button class="aDel" data-deluser="${u.uid}" ${isMe?"disabled":""}>Sil</button>
      </div>`;
    }).join("") : `<div class="aEmpty">Kayıtlı kullanıcı yok</div>`;

    body.querySelectorAll("[data-deluser]").forEach(b=>{
      b.addEventListener("click", async ()=>{
        const uid = b.dataset.deluser;
        if(uid === me.uid) return;
        if(!confirm(`@${uid}:nexus kullanıcısı silinsin mi? Tüm sohbetleri de silinir.`)) return;
        b.disabled = true;
        try{
          const snap = await getDocs(query(collection(db,"sohbetler"), where("uyeler","array-contains", uid)));
          const batch = writeBatch(db);
          snap.docs.forEach(d=> batch.delete(d.ref));
          await batch.commit();
          await deleteDoc(doc(db,"kullanicilar", uid));
          toast("Kullanıcı silindi: @" + uid);
        }catch(e){ toast("Silinemedi: "+e.message, true); b.disabled = false; }
      });
    });
  }else{
    body.innerHTML = `<div class="aEmpty">Sohbetler yükleniyor…</div>`;
    if(unsubAdminChats) unsubAdminChats();
    unsubAdminChats = onSnapshot(collection(db,"sohbetler"), async snap=>{
      const chatDocs = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      allChatsCache = chatDocs;
      if(!chatDocs.length){
        body.innerHTML = `<div class="aEmpty">Henüz sohbet yok</div>`;
        return;
      }
      let html = "";
      for(const c of chatDocs){
        const names = isGrup(c)
          ? `👥 ${c.grupAd || "Grup"} (${(c.uyeler||[]).length} üye)`
          : c.uyeler.map(u=>`@${u}`).join(" ↔ ");
        html += `<div class="aChatHead">${esc(names)}</div>`;
        try{
          const msnap = await getDocs(query(collection(db,"sohbetler",c.id,"mesajlar"), orderBy("ts","asc")));
          if(!msnap.docs.length){
            html += `<div class="aMsg"><span class="aMsgTxt" style="color:var(--muted)">Mesaj yok</span></div>`;
          }
          msnap.docs.forEach(md=>{
            const m = md.data();
            html += `<div class="aMsg">
              <div class="aMsgTxt">
                <div class="aMsgWho">${esc(m.yazanAd||m.yazan)}</div>
                ${esc(m.icerik)}
              </div>
              <span class="aMsgTime">${m.ts?hhmm(m.ts):""}</span>
              <button class="aMsgDel" data-delmsg="${c.id}|${md.id}" title="Mesajı sil">🗑</button>
            </div>`;
          });
        }catch(e){
          html += `<div class="aMsg"><span class="aMsgTxt" style="color:var(--red)">Yüklenemedi</span></div>`;
        }
      }
      body.innerHTML = html;
      body.querySelectorAll("[data-delmsg]").forEach(b=>{
        b.addEventListener("click", async ()=>{
          const [cid, mid] = b.dataset.delmsg.split("|");
          if(!confirm("Bu mesaj kalıcı olarak silinsin mi?")) return;
          try{
            await deleteDoc(doc(db,"sohbetler",cid,"mesajlar",mid));
            toast("Mesaj silindi");
          }catch(e){ toast("Silinemedi: "+e.message, true); }
        });
      });
    }, ()=>{ body.innerHTML = `<div class="aEmpty">Yüklenemedi</div>`; });
  }
}

/* ===== SESSION RESTORE ===== */
if(tryRestore()) startApp();
