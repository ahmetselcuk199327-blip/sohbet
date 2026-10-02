import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  query, where, orderBy, onSnapshot, increment, serverTimestamp, writeBatch, getDocs,
  arrayUnion, arrayRemove, FieldPath, deleteField
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

/* ===== EMOJI / REAKSIYON / CIKARTMA VERISI ===== */
const QUICK_REACTS = ["👍","❤️","😂","😮","😢","🙏"];
const EMOJI_CATS = [
  { ad:"Yüzler", e:`😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😋 😛 😜 🤪 🤨 🧐 🤓 😎 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 😶 😐 😑 😬 🙄 😯 😴 🤤 😪 😵 🤐 🥴 😷 🤒 🤕 🥱`.split(" ") },
  { ad:"El & Kalp", e:`👍 👎 👌 🤌 🤏 ✌️ 🤞 🫶 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🖐️ 🤚 🖖 👋 🤝 🙏 💪 🫰 🫱 🫲 👏 🙌 👐 🤲 💖 💗 💘 💝 💞 💕 💔 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💡 🔥 ✨ 🎉 🎊 💥 ⭐ 🌟`.split(" ") },
  { ad:"Doğa", e:`🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦅 🦉 🦋 🐝 🐞 🐢 🐍 🐙 🦀 🐬 🐳 🌸 🌷 🌻 🌺 🌼 🌹 🥀 🌵 🌴 🌳 🌍 🌈 ⛅ ☀️ 🌙 ⭐ ⛄ ❄️ 🌊 🐾`.split(" ") },
  { ad:"Yiyecek", e:`🍕 🍔 🍟 🌮 🌯 🥪 🍜 🍛 🍚 🍣 🥘 🍲 🥗 🍝 🍞 🥐 🥨 🧀 🥚 🍳 🥞 🧇 🍗 🍖 🦴 🐟 🍤 🍥 🍦 🍨 🍰 🎂 🍪 🍫 🍬 🍭 🍯 🥤 ☕ 🍵 🍺 🍻 🥂 🍷`.split(" ") },
  { ad:"Eğlence", e:`⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎳 🎯 🎮 🎲 🧩 🎸 🎹 🎺 🎧 🎤 📷 🎬 🎭 🎪 🎠 🎢 🎡 🏆 🥇 🥈 🥉 🎗️ 🎁 🎈 🎀 🪄 🎿 🛹 🛼 🚴 🏄 🏊`.split(" ") },
  { ad:"Sembol", e:`✅ ❌ ⚠️ 💯 🆗 🆒 ♻️ ⚡ 💤 🔥 💧 💎 🎯 🔒 🔓 🔑 🔨 ⚙️ 🔬 🔭 📡 🛰️ 🚀 ✈️ 🚗 🚲 🏠 🏢 🏥 🏫 🕌 ⛪ 🗽 🗺️ 📍 🏷️ 📌 ✂️ 📎 🖊️ 📝 📚 📢 🔔`.split(" ") }
];
const STICKER_PACKS = [
  { ad:"Nexus", cikartmalar:[
    { ad:"Selam", emoji:"👋", anim:true },
    { ad:"Tamam", emoji:"👌", anim:true },
    { ad:"Kalp", emoji:"❤️", anim:true },
    { ad:"Alkış", emoji:"👏", anim:true },
    { ad:"Güzel", emoji:"😍", anim:true },
    { ad:"Gül", emoji:"😂" },
    { ad:"Şaşkın", emoji:"🤯", anim:true },
    { ad:"Düşün", emoji:"🤔" },
    { ad:"Aferin", emoji:"🙌", anim:true },
    { ad:"Güç", emoji:"💪", anim:true },
    { ad:"Yıldız", emoji:"⭐" },
    { ad:"Ateş", emoji:"🔥", anim:true }
  ]},
  { ad:"Sevgi", cikartmalar:[
    { ad:"Öpücük", emoji:"😘", anim:true },
    { ad:"Sarıl", emoji:"🥰", anim:true },
    { ad:"Kalp kırık", emoji:"💔" },
    { ad:"Kalpler", emoji:"💖", anim:true },
    { ad:"Gülümse", emoji:"😊" },
    { ad:"Sihir", emoji:"🪄", anim:true },
    { ad:"Çiçek", emoji:"🌹" },
    { ad:"Ay", emoji:"🌙" }
  ]}
];
const EMOJI_SEQ = "\\p{Extended_Pictographic}(?:\\uFE0F|\\u20E3)?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\u20E3)?)*";
function emojiOnlyCount(text){
  const t = String(text == null ? "" : text).trim();
  if(!t) return 0;
  try{
    const whole = new RegExp("^(?:" + EMOJI_SEQ + ")(?:\\s*(?:" + EMOJI_SEQ + "))*$", "u");
    if(!whole.test(t)) return 0;
    const all = t.match(new RegExp(EMOJI_SEQ, "gu")) || [];
    return (all.length >= 1 && all.length <= 3) ? all.length : 0;
  }catch(e){ return 0; }
}

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
let lastMsgsFor = null;
let activeTab = "chats";
let typingSeen = 0;
let replyTo = null;
let editing = null;
let fwdMid = null;
let pendingImg = null;

/* ===== PROFIL YARDIMCILARI ===== */
function initialsOf(name){
  const s = String(name == null ? "" : name).trim();
  return esc((s[0] || "?").toLocaleUpperCase("tr"));
}
function userBy(uid){ return users.find(u=>u.uid===uid) || null; }
function adOf(uid, fallback){ const u = userBy(uid); return (u && u.ad) || fallback || uid; }
function fotoOf(uid){ const u = userBy(uid); return (u && u.foto) || ""; }
function hakkindaOf(uid){ const u = userBy(uid); return (u && u.hakkinda) || ""; }

function avatarHtml(o){
  o = o || {};
  const cls = "avatar" + (o.cls ? " " + o.cls : "");
  const inner = o.icon
    ? `<span class="gIco">${o.icon}</span>`
    : o.photo
      ? `<img class="avImg" src="${o.photo}" alt="">`
      : `<span>${initialsOf(o.ad)}</span>`;
  return `<div class="${cls}" style="background:${colorFor(o.uid || o.ad || "?")}">${inner}${o.dot ? '<span class="dot"></span>' : ""}</div>`;
}
function paintAvatar(el, o){
  if(!el) return;
  o = o || {};
  el.style.background = colorFor(o.uid || o.ad || "?");
  if(o.icon) el.innerHTML = `<span class="gIco">${o.icon}</span>`;
  else if(o.photo) el.innerHTML = `<img class="avImg" src="${o.photo}" alt="">`;
  else el.innerHTML = `<span>${initialsOf(o.ad)}</span>`;
  el.style.fontSize = o.icon ? "17px" : "";
}
function renderMeBox(){
  if(!me) return;
  const u = userBy(me.uid);
  if(u){
    if(u.ad) me.ad = u.ad;
    if(u.foto !== undefined) me.foto = u.foto;
    if(u.hakkinda !== undefined) me.hakkinda = u.hakkinda;
  }
  paintAvatar($("meAvatar"), { uid: me.uid, ad: me.ad, photo: me.foto || "" });
  $("meName").textContent = me.ad;
  $("meAlias").textContent = `@${me.uid}:nexus`;
}
function syncActiveNames(){
  if(!active) return;
  if(active.type === "dm") active.otherAd = adOf(active.other, active.otherAd);
}

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
      me = { uid, ad: nickEl.value.trim(), rol: "user", foto:"", hakkinda:"" };
      await setDoc(ref, { ad: me.ad, pinHash: hash, sonGorulme: Date.now(), cevrimici: true, kayit: Date.now(), rol: "user", foto:"", hakkinda:"" });
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
  renderMeBox();
  if(me.rol === "admin") $("adminBtn").classList.remove("hidden");
  Notif.refreshBtn();
  Notif.since = Date.now();
  Notif.start();

  setInterval(()=>{
    updateDoc(doc(db,"kullanicilar",me.uid), { sonGorulme: Date.now(), cevrimici: true }).catch(()=>{});
  }, 20000);
  window.addEventListener("beforeunload", ()=>{
    updateDoc(doc(db,"kullanicilar",me.uid), { cevrimici: false, sonGorulme: Date.now() }).catch(()=>{});
  });

  onSnapshot(collection(db,"kullanicilar"), snap=>{
    users = snap.docs.map(d=>({ uid:d.id, ...d.data() }));
    syncMeMirror();
    renderMeBox();
    syncActiveNames();
    renderSide();
    renderChatHeader();
    if(!$("emoPanel").classList.contains("hidden") && emoCat === "stk") renderEmoBody();
    if(!$("groupOverlay").classList.contains("hidden")) renderGroupPicker();
  }, e => toast("Kullanıcılar yüklenemedi: "+e.message, true));

  onSnapshot(query(collection(db,"sohbetler"), where("uyeler","array-contains", me.uid)), snap=>{
    chats = snap.docs.map(d=>({ id:d.id, ...d.data() }))
      .sort((a,b)=> (b.sonMesajZaman||0) - (a.sonMesajZaman||0));
    snap.docChanges().forEach(ch=>{
      const d = ch.doc.data();
      const ts = d.sonMesajZaman || 0;
      if(!ts || d.sonMesajYazar === me.uid) return;
      if((d.uyeler||[]).indexOf(me.uid) < 0) return;
      const tz = (d.teslimZaman||{})[me.uid] || 0;
      if(ts > tz) updateDoc(ch.doc.ref, { [`teslimZaman.${me.uid}`]: ts }).catch(()=>{});
    });
    renderSide();
    if(active){
      renderChatHeader();
      if(lastMsgsFor === active.id && lastMsgs.length) renderMsgs(lastMsgs);
      const c = chats.find(x=>x.id===active.id);
      if(c && ((c.okunmamis||{})[me.uid]||0) > 0){
        updateDoc(doc(db,"sohbetler",active.id), { [`okunmamis.${me.uid}`]: 0 }).catch(()=>{});
      }
    }
    chats.forEach(c=> Notif.chat(c));
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

  onSnapshot(query(collection(db,"aramalar"), where("arananlar","array-contains", me.uid)), snap=>{
    snap.docChanges().forEach(ch=>{
      const d = { id: ch.doc.id, ...ch.doc.data() };
      if(ch.type === "added" && d.durum === "zil" && Date.now() - (d.olusturuldu||0) < 60000
        && !(d.retler||[]).includes(me.uid)){
        if(ringCall || call){
          updateDoc(doc(db,"aramalar",d.id), { retler: arrayUnion(me.uid) }).catch(()=>{});
        }else{
          showRing(d);
        }
      }
      if(ringCall && ringCall.id === d.id &&
        (d.durum !== "zil" || (d.retler||[]).includes(me.uid))){
        ringCall = null;
        Snd.stop();
        $("ringOverlay").classList.add("hidden");
        if(d.durum === "bitti") toast("Grup araması kapatıldı");
      }
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
      const name = grp ? (c.grupAd || "Adsız grup")
        : adOf(other, (c.uyelerAd && c.uyelerAd[other]) || other);
      return { c, other, name, grp };
    }).filter(r => !term || trLow(r.name).includes(term) || trLow(r.c.sonMesaj||"").includes(term));

    html = rows.length ? rows.map(({c,other,name,grp})=>{
      const u = grp ? null : userBy(other);
      const p = u ? presenceOf(u) : { txt:"", live:false };
      const unread = (c.okunmamis && c.okunmamis[me.uid]) || 0;
      const time = c.sonMesajZaman ? hhmm(c.sonMesajZaman) : "";
      const on = active && active.id === c.id ? " on" : "";
      const avatar = grp
        ? avatarHtml({ uid: c.id, icon: "👥" })
        : avatarHtml({ uid: other, ad: name, photo: fotoOf(other), dot: p.live });
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
        ${avatarHtml({ uid: u.uid, ad: u.ad, photo: fotoOf(u.uid), dot: p.live })}
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
async function ensureDm(otherUid){
  const otherUser = userBy(otherUid);
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
  }catch(e){ toast("Sohbet açılamadı: "+e.message, true); throw e; }
  return id;
}

async function openChat(otherUid){
  let id;
  try{ id = await ensureDm(otherUid); }
  catch(e){ return; }
  const otherAd = adOf(otherUid, otherUid);
  enterChat({ id, type:"dm", other: otherUid, otherAd });
}

function openGroupChat(cid){
  const c = chats.find(x=>x.id===cid);
  if(!c) return;
  enterChat({ id: c.id, type:"grup", grupAd: c.grupAd || "Adsız grup", uyeler: c.uyeler || [] });
}

function enterChat(a){
  active = a;
  cancelCtx();
  activeTab = "chats";
  document.querySelectorAll(".sideTab").forEach(x=> x.classList.toggle("on", x.dataset.tab === "chats"));
  document.body.classList.add("inChat");
  $("phView").classList.add("hidden");
  $("chatView").classList.remove("hidden");
  $("msgSearchBar").classList.add("hidden");
  $("msgSearch").value = "";
  $("input").value = "";
  clearPendingImg();
  renderChatHeader();
  renderSide();
  updateDoc(doc(db,"sohbetler",active.id), { [`okunmamis.${me.uid}`]: 0 }).catch(()=>{});

  if(unsubMsgs) unsubMsgs();
  const ref = doc(db,"sohbetler",active.id);
  lastMsgs = [];
  lastMsgsFor = null;
  unsubMsgs = onSnapshot(query(collection(ref,"mesajlar"), orderBy("ts","asc")), snap=>{
    lastMsgs = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    lastMsgsFor = active && active.id;
    renderMsgs(lastMsgs);
    markRead(ref, snap.docs, active && active.type === "grup");
  }, e => toast("Mesajlar yüklenemedi: "+e.message, true));
}

function renderChatHeader(){
  if(!active) return;
  const grp = active.type === "grup";
  $("callBtn").classList.remove("hidden");
  $("videoBtn").classList.remove("hidden");
  if(grp){
    const c = chats.find(x=>x.id===active.id);
    if(c){ active.grupAd = c.grupAd || active.grupAd; active.uyeler = c.uyeler || active.uyeler; }
    const n = (active.uyeler||[]).length;
    $("chatName").textContent = active.grupAd;
    paintAvatar($("chatAvatar"), { uid: active.id, icon: "👥" });
    const st = $("chatStatus");
    st.className = "chatStatus";
    st.textContent = `${n} üye · grup sohbeti`;
    return;
  }
  active.otherAd = adOf(active.other, active.otherAd);
  const u = userBy(active.other);
  const p = u ? presenceOf(u) : { txt:"—", live:false };
  $("chatName").textContent = active.otherAd;
  paintAvatar($("chatAvatar"), { uid: active.other, ad: active.otherAd, photo: fotoOf(active.other) });
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
    if(m.yazan !== me.uid && !m.okundu){
      batch.update(d.ref, { okundu:true, okuyan: arrayUnion(me.uid) });
      n++;
    }
  });
  if(n) batch.commit().catch(()=>{});
}

function highlight(text, term){
  const safe = esc(text);
  if(!term) return safe;
  const i = trLow(safe).indexOf(term);
  return i<0 ? safe : safe.slice(0,i)+"<mark>"+safe.slice(i,i+term.length)+"</mark>"+safe.slice(i+term.length);
}

function msgPreview(m){
  if(!m) return "";
  const t = m.icerik && String(m.icerik).trim();
  if(t) return m.icerik;
  if(m.gorsel) return "📷 Fotoğraf";
  if(m.sticker) return m.sticker.emoji || "☆ Çıkartma";
  return "";
}

function tickHtml(m, mine){
  if(!mine || !active) return "";
  const grp = active.type === "grup";
  const c = chats.find(x=>x.id===active.id);
  const tz = (c && c.teslimZaman) || {};
  const others = grp
    ? (active.uyeler || []).filter(u => u !== me.uid)
    : (active.other ? [active.other] : []);
  if(!others.length) return '<span class="ticks">✓</span>';
  const ts = m.ts || 0;
  const delivered = others.every(u => (tz[u] || 0) >= ts);
  const read = others.every(u => (m.okuyan||[]).indexOf(u) >= 0 || m.okundu === true);
  if(read) return '<span class="ticks read">✓✓</span>';
  if(delivered) return '<span class="ticks">✓✓</span>';
  return '<span class="ticks">✓</span>';
}

function reactHtml(m){
  const r = m.reaks;
  if(!r) return "";
  const g = {};
  Object.keys(r).forEach(u=>{
    const e = r[u];
    if(!e) return;
    (g[e] = g[e] || []).push(u);
  });
  const ks = Object.keys(g);
  if(!ks.length) return "";
  return `<div class="msgReacts">` + ks.map(e=>{
    const arr = g[e];
    const on = arr.indexOf(me.uid) >= 0;
    const title = arr.map(u=>adOf(u, u)).join(", ");
    return `<button class="rct${on ? " mine" : ""}" data-rct="${esc(e)}" data-rmid="${m.id}" title="${esc(title)}">`
      + e + (arr.length > 1 ? `<i>${arr.length}</i>` : "") + `</button>`;
  }).join("") + `</div>`;
}

function renderMsgs(msgs){
  const box = $("msgs");
  const term = trLow($("msgSearch").value.trim());
  const visible = msgs.filter(m=> (m.silinen||[]).indexOf(me.uid) < 0);
  const shown = term ? visible.filter(m=>trLow(msgPreview(m)).includes(term)) : visible;
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
    const quote = m.yanit
      ? `<div class="msgQuote" data-q="${esc(m.yanit.mid)}" title="O mesaja git">
           <b>${esc(m.yanit.ad)}</b><span>${esc(m.yanit.ozet || "")}</span></div>`
      : "";
    const stk = m.sticker;
    const img = m.gorsel;
    const cap = highlight(m.icerik || "", term);
    const photo = (img && img.u)
      ? `<img class="msgPhoto" src="${esc(img.u)}" alt="Fotoğraf" data-photo="${m.id}"`
        + (img.w ? ` width="${img.w|0}"` : "") + (img.h ? ` height="${img.h|0}"` : "")
        + ` loading="lazy">`
      : "";
    const body = stk
      ? `<div class="sticker${stk.anim ? " anim" : ""}" title="${esc(stk.ad || "")}">${stk.emoji || "🙂"}</div>`
      : photo + (cap && cap.trim() ? `<span class="msgCap">${cap}</span>` : "");
    const big = !stk && !img && emojiOnlyCount(m.icerik || "") > 0;
    const ed = m.duzenlendi ? " · düzenlendi" : "";
    const meta = mine
      ? `<span class="msgMeta">${hhmm(t)}${ed} ${tickHtml(m, mine)}</span>`
      : `<span class="msgMeta">${hhmm(t)}${ed}</span>`;
    const cls = (mine ? "me" : "them")
      + (stk ? " stkMsg" : (img ? " imgMsg" : (big ? " big" : "")));
    html += `<div class="msg ${cls}" data-mid="${m.id}">${quote}${who}${body}${meta}${reactHtml(m)}`
      + `<button class="msgMore" data-more="${m.id}" title="Mesaj işlemleri">⋮</button></div>`;
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

/* --- mesaj silme menusu --- */
let menuGuard = 0;
function closeMsgMenu(){ const m = $("msgMenu"); if(m) m.classList.add("hidden"); }

function openMsgMenu(mid, x, y){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || !active) return;
  if((m.silinen||[]).indexOf(me.uid) >= 0) return;
  const mine = m.yazan === me.uid;
  const isAdmin = me.rol === "admin";
  const items = [];
  if(!m.sistem){
    items.push({ k:"reply", i:"↩", t:"Yanıtla" });
    items.push({ k:"fwd", i:"➡", t:"İlet" });
    if(mine && Date.now() - (m.ts||0) < 15*60*1000)     items.push({ k:"edit", i:"✏", t:"Düzenle" });
    if(m.gorsel && m.gorsel.u) items.push({ k:"save", i:"⬇", t:"Fotoğrafı indir" });
  }
  items.push({ k:"mine", i:"🙈", t:"Benden sil" });
  if(mine || isAdmin) items.push({ k:"all", i:"🗑", t:"Herkesten sil", d:true });

  const menu = $("msgMenu");
  menu.innerHTML = items.map(it=>
    `<button class="msgMenuItem${it.d?" danger":""}" data-mi="${it.k}"><span class="mi">${it.i}</span>${it.t}</button>`
  ).join("");
  menu.classList.remove("hidden");
  menuGuard = Date.now();

  const r = menu.getBoundingClientRect();
  const px = Math.max(8, Math.min(x, window.innerWidth - r.width - 8));
  const py = Math.max(8, Math.min(y, window.innerHeight - r.height - 8));
  menu.style.left = px + "px";
  menu.style.top = py + "px";

  menu.querySelectorAll("[data-mi]").forEach(b=>{
    b.addEventListener("click", e=>{
      e.stopPropagation();
      const k = b.dataset.mi;
      closeMsgMenu();
      if(k === "reply") setReply(mid);
      else if(k === "fwd") openForward(mid);
      else if(k === "edit") startEdit(mid);
      else if(k === "save") savePhoto(mid);
      else doDelete(mid, k);
    });
  });
}

/* --- yanitla / ilet / duzenle --- */
function setReply(mid){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m) return;
  editing = null;
  replyTo = { mid:m.id, yazan:m.yazan, ad:m.yazanAd || m.yazan, ozet:msgPreview(m).slice(0,150) };
  showCtx("reply");
  $("input").focus();
}
function startEdit(mid){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || m.yazan !== me.uid) return;
  if(Date.now() - (m.ts||0) > 15*60*1000){ toast("Düzenleme süresi doldu (15 dakika)", true); return; }
  replyTo = null;
  editing = { mid:m.id };
  const el = $("input");
  el.value = m.icerik || "";
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
  showCtx("edit");
  el.focus();
}
function showCtx(mode){
  const bar = $("ctxBar");
  if(!mode){ bar.classList.add("hidden"); replyTo = null; editing = null; return; }
  bar.classList.remove("hidden");
  bar.classList.toggle("edit", mode === "edit");
  $("ctxIcon").textContent = mode === "edit" ? "✏" : "↩";
  if(mode === "edit"){
    $("ctxAd").textContent = "Mesajı düzenle";
    $("ctxTxt").textContent = editing ? (editing.icerik || "") : "";
  }else{
    $("ctxAd").textContent = replyTo ? replyTo.ad : "";
    $("ctxTxt").textContent = replyTo ? replyTo.ozet : "";
  }
}
function cancelCtx(){ showCtx(null); }
$("ctxClose").addEventListener("click", cancelCtx);

function openForward(mid){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || !active) return;
  fwdMid = mid;
  const chatRows = chats.filter(c=>c.id !== active.id).map(c=>{
    const grp = isGrup(c);
    const other = grp ? null : c.uyeler.find(u=>u!==me.uid);
    const name = grp ? (c.grupAd || "Adsız grup")
      : adOf(other, (c.uyelerAd && c.uyelerAd[other]) || other);
    return `<div class="row" data-fwd="${esc(c.id)}">
      ${avatarHtml(grp ? { uid:c.id, icon:"👥" } : { uid:other, ad:name, photo:fotoOf(other) })}
      <div class="rowMain">
        <div class="rowLine1"><span class="rowName">${esc(name)}</span></div>
        <div class="rowLine2"><span class="rowLast">${grp ? ((c.uyeler||[]).length + " üye") : "@"+other}</span></div>
      </div></div>`;
  }).join("");
  const peopleRows = users.filter(u=>u.uid!==me.uid).map(u=>
    `<div class="row" data-fwduser="${esc(u.uid)}">
      ${avatarHtml({ uid:u.uid, ad:u.ad, photo:fotoOf(u.uid) })}
      <div class="rowMain">
        <div class="rowLine1"><span class="rowName">${esc(u.ad)}</span></div>
        <div class="rowLine2"><span class="rowLast">@${u.uid}</span></div>
      </div></div>`).join("");

  const hasAny = !!(chatRows || peopleRows);
  $("fwdBody").innerHTML =
    `<div class="fwdHint">Gönderilecek mesaj: <b>${esc(msgPreview(m).slice(0,90))}</b></div>` +
    (chatRows ? `<div class="fwdSec">Sohbetler</div>${chatRows}` : "") +
    (peopleRows ? `<div class="fwdSec">Kişiler</div>${peopleRows}` : "") +
    (hasAny ? "" : `<div class="emptyList">Hedef yok</div>`);

  $("fwdBody").querySelectorAll("[data-fwd]").forEach(r=>{
    r.addEventListener("click", ()=> doForward(r.dataset.fwd, null));
  });
  $("fwdBody").querySelectorAll("[data-fwduser]").forEach(r=>{
    r.addEventListener("click", ()=> doForward(null, r.dataset.fwduser));
  });
  $("fwdOverlay").classList.remove("hidden");
}

async function doForward(chatId, otherUid){
  const m = lastMsgs.find(z=>z.id===fwdMid);
  if(!m) return;
  $("fwdOverlay").classList.add("hidden");
  fwdMid = null;
  let info = null;
  try{
    if(!chatId){
      chatId = await ensureDm(otherUid);
      info = { grp:false, uyeler:[me.uid, otherUid].sort() };
    }
    await postToChat(chatId, m.icerik || "", {
      iletilendi:true, sticker:m.sticker || null, gorsel:m.gorsel || null
    }, info);
    toast("Mesaj iletildi");
  }catch(e){ toast("İletilemedi: "+e.message, true); }
}
$("fwdClose").addEventListener("click", ()=>{ $("fwdOverlay").classList.add("hidden"); fwdMid = null; });

/* --- reaksiyon cubugu --- */
let reactGuard = 0;
function closeReactBar(){ const b = $("reactBar"); if(b) b.classList.add("hidden"); }
function openReactBar(mid, x, y, below){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || m.sistem) return;
  closeEmoPanel();
  const bar = $("reactBar");
  bar.dataset.mid = mid;
  bar.innerHTML = QUICK_REACTS.map(e=>`<button data-re="${e}" title="Tepki ver">${e}</button>`).join("")
    + `<span class="rbSep"></span>`
    + `<button data-rall="1" title="Daha fazla emoji">＋</button>`
    + `<button class="rbMore" data-rmenu="1" title="Mesaj işlemleri">⋯</button>`;
  bar.classList.remove("hidden");
  const r = bar.getBoundingClientRect();
  let px = Math.round(x - r.width / 2);
  let py = below ? (y + 14) : (y - r.height - 14);
  px = Math.max(8, Math.min(px, window.innerWidth - r.width - 8));
  py = Math.max(8, Math.min(py, window.innerHeight - r.height - 8));
  bar.style.left = px + "px";
  bar.style.top = py + "px";
  reactGuard = Date.now();
}
async function toggleReaction(mid, emoji){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || !active) return;
  const ref = doc(db, "sohbetler", active.id, "mesajlar", mid);
  const cur = (m.reaks || {})[me.uid];
  try{
    if(cur === emoji) await updateDoc(ref, new FieldPath("reaks", me.uid), deleteField());
    else await updateDoc(ref, new FieldPath("reaks", me.uid), emoji);
  }catch(e){ toast("Tepki eklenemedi: "+e.message, true); }
}
$("reactBar").addEventListener("click", e=>{
  const b = e.target.closest("button");
  if(!b) return;
  e.stopPropagation();
  const mid = $("reactBar").dataset.mid;
  if(b.dataset.re){ closeReactBar(); toggleReaction(mid, b.dataset.re); }
  else if(b.dataset.rall){ closeReactBar(); openEmoPanel("react", mid); }
  else if(b.dataset.rmenu){
    closeReactBar();
    const el = $("msgs").querySelector('.msg[data-mid="' + mid + '"]');
    if(el){ const r = el.getBoundingClientRect(); openMsgMenu(mid, Math.max(8, r.left), r.bottom + 6); }
  }
});

/* --- emoji / cikartma paneli --- */
let emoMode = "chat", emoCat = 0, emoTarget = null;
function closeEmoPanel(){ const p = $("emoPanel"); if(p) p.classList.add("hidden"); }
function openEmoPanel(mode, mid){
  emoMode = mode === "react" ? "react" : "chat";
  emoTarget = emoMode === "react" ? (mid || null) : null;
  if(emoMode === "react" && emoCat === "stk") emoCat = 0;
  closeReactBar();
  $("emoPanel").classList.remove("hidden");
  renderEmoTabs();
  renderEmoBody();
}
function renderEmoTabs(){
  const tabs = EMOJI_CATS.map((c,i)=>
    `<button class="emoTab${emoCat === i ? " on" : ""}" data-ecat="${i}">${esc(c.ad)}</button>`);
  if(emoMode === "chat") tabs.push(`<button class="emoTab${emoCat === "stk" ? " on" : ""}" data-ecat="stk">🖼️ Çıkartmalar</button>`);
  tabs.push(`<button class="emoClose" data-eclose="1" title="Kapat (Esc)">✕</button>`);
  $("emoTabs").innerHTML = tabs.join("");
}
function renderEmoBody(){
  if(emoCat === "stk"){ $("emoBody").innerHTML = stickerPanelHtml(); return; }
  const c = EMOJI_CATS[emoCat] || EMOJI_CATS[0];
  const hint = emoMode === "react"
    ? `<div class="emoHint">Mesaja tepki vermek için bir emoji seç</div>` : "";
  $("emoBody").innerHTML = hint + `<div class="emoGrid">` +
    c.e.map(e=>`<button data-em="${e}">${e}</button>`).join("") + `</div>`;
}
function insertAtCursor(el, text){
  if(!el) return;
  const s = el.selectionStart == null ? el.value.length : el.selectionStart;
  const en = el.selectionEnd == null ? el.value.length : el.selectionEnd;
  el.value = el.value.slice(0, s) + text + el.value.slice(en);
  try{ el.selectionStart = el.selectionEnd = s + text.length; }catch(e){}
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles:true }));
}

/* --- cikartma paketleri --- */
let myFav = null, myPacks = null;
function myUserData(){ return userBy(me.uid) || {}; }
function favKeys(){
  if(Array.isArray(myFav)) return myFav;
  const f = myUserData().favoriCik;
  return Array.isArray(f) ? f : [];
}
function myImportedPacks(){
  if(Array.isArray(myPacks)) return myPacks;
  const p = myUserData().cikartmaPak;
  return Array.isArray(p) ? p : [];
}
function syncMeMirror(){
  const u = userBy(me.uid);
  if(!u) return;
  if(Array.isArray(u.favoriCik)) myFav = u.favoriCik;
  if(Array.isArray(u.cikartmaPak)) myPacks = u.cikartmaPak;
}
function allStickerPacks(){
  const packs = [];
  STICKER_PACKS.forEach((p,i)=> packs.push({ key:"b"+i, ad:p.ad, cikartmalar:p.cikartmalar || [] }));
  myImportedPacks().forEach((p,i)=> packs.push({ key:"i"+i, ad:(p && p.ad) || "İçe Aktarılan", cikartmalar:(p && p.cikartmalar) || [] }));
  return packs;
}
function resolveSticker(key){
  const p = String(key || "").split(":");
  const kind = (p[0] || "").slice(0, 1), pi = Number((p[0] || "").slice(1)), si = Number(p[1]);
  const src = kind === "b" ? STICKER_PACKS[pi] : myImportedPacks()[pi];
  if(!src) return null;
  const s = (src.cikartmalar || [])[si];
  if(!s) return null;
  return { emoji: s.emoji || "🙂", ad: s.ad || "", anim: !!s.anim };
}
function collectFavs(){
  const out = [];
  favKeys().forEach(k=>{ const s = resolveSticker(k); if(s) out.push(Object.assign({ key:k }, s)); });
  return out;
}
function stkTile(key, s, on){
  return `<div class="stk" data-stk="${esc(key)}" title="${esc(s.ad || "")}">`
    + `<span class="sticker${s.anim ? " anim" : ""}">${s.emoji || "🙂"}</span>`
    + `<span class="fav${on ? " on" : ""}" data-fav="${esc(key)}" title="Favorilere ekle/çıkar">${on ? "★" : "☆"}</span></div>`;
}
function stickerPanelHtml(){
  const favs = favKeys();
  const f = collectFavs();
  let html = `<div class="stkGrid">`;
  if(f.length){
    html += `<div class="stkPackTitle">★ Favoriler · ${f.length}</div>`;
    f.forEach(s=>{ html += stkTile(s.key, s, true); });
  }
  allStickerPacks().forEach(p=>{
    if(!p.cikartmalar.length) return;
    html += `<div class="stkPackTitle">${esc(p.ad)} · ${p.cikartmalar.length}</div>`;
    p.cikartmalar.forEach((s, j)=>{
      const key = p.key + ":" + j;
      html += stkTile(key, s, favs.indexOf(key) >= 0);
    });
  });
  html += `<div class="stkTool">`
    + `<button data-stktool="import">📥 Paket içe aktar (JSON)</button>`
    + `<button data-stktool="help">ℹ️ Paket biçimi</button></div></div>`
    + `<input type="file" id="stkFile" accept="application/json,.json" style="display:none">`;
  return html;
}
async function toggleFav(key){
  try{
    const has = favKeys().indexOf(key) >= 0;
    await updateDoc(doc(db,"kullanicilar",me.uid),
      { favoriCik: has ? arrayRemove(key) : arrayUnion(key) });
    myFav = has ? favKeys().filter(k=>k!==key) : favKeys().concat([key]);
    renderEmoBody();
  }catch(e){ toast("Favori güncellenemedi: "+e.message, true); }
}
async function importStickerPack(file){
  if(!file) return;
  try{
    const raw = await file.text();
    const j = JSON.parse(raw);
    const ad = String(j.ad || j.name || "İçe Aktarılan").slice(0,40);
    const src = Array.isArray(j.cikartmalar) ? j.cikartmalar : (Array.isArray(j.stickers) ? j.stickers : []);
    const list = src.map(s=>({
      ad: String((s && (s.ad || s.name)) || "Çıkartma").slice(0,40),
      emoji: String((s && s.emoji) || "🙂").slice(0,8),
      anim: !!(s && (s.anim || s.animasyonlu))
    })).slice(0,60);
    if(!list.length){ toast("Pakette geçerli çıkartma yok", true); return; }
    const pack = { ad, cikartmalar:list };
    await updateDoc(doc(db,"kullanicilar",me.uid), { cikartmaPak: arrayUnion(pack) });
    myPacks = myImportedPacks().concat([pack]);
    renderEmoBody();
    toast(`"${ad}" paketi içe aktarıldı (${list.length} çıkartma)`);
  }catch(e){ toast("Paket içe aktarılamadı: "+e.message, true); }
}
$("emoPanel").addEventListener("click", async e=>{
  const tab = e.target.closest("[data-ecat]");
  if(tab){
    emoCat = tab.dataset.ecat === "stk" ? "stk" : Number(tab.dataset.ecat);
    renderEmoTabs(); renderEmoBody(); return;
  }
  if(e.target.closest("[data-eclose]")){ closeEmoPanel(); return; }
  const em = e.target.closest("[data-em]");
  if(em){
    if(emoMode === "react"){ const mid = emoTarget; closeEmoPanel(); toggleReaction(mid, em.dataset.em); return; }
    insertAtCursor($("input"), em.dataset.em);
    return;
  }
  const tool = e.target.closest("[data-stktool]");
  if(tool){
    if(tool.dataset.stktool === "import"){ const f = $("stkFile"); if(f) f.click(); }
    else toast('Paket JSON: {"ad":"Paketim","cikartmalar":[{"ad":"Selam","emoji":"👋","anim":true}]}');
    return;
  }
  const fav = e.target.closest("[data-fav]");
  if(fav){ await toggleFav(fav.dataset.fav); renderEmoBody(); return; }
  const st = e.target.closest("[data-stk]");
  if(st){
    if(!active){ toast("Önce bir sohbet aç", true); return; }
    const s = resolveSticker(st.dataset.stk);
    if(!s) return;
    closeEmoPanel();
    try{ await postToChat(active.id, s.emoji, { sticker:{ emoji:s.emoji, ad:s.ad, anim:s.anim } }); }
    catch(err){ toast("Gönderilemedi: "+err.message, true); }
    return;
  }
});
$("emoPanel").addEventListener("change", e=>{
  if(e.target && e.target.id === "stkFile"){
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    importStickerPack(f);
  }
});
$("emoBtn").addEventListener("click", e=>{
  e.stopPropagation();
  if($("emoPanel").classList.contains("hidden")) openEmoPanel("chat");
  else closeEmoPanel();
});

async function doDelete(mid, kind){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || !active) return;
  const ref = doc(db,"sohbetler",active.id,"mesajlar",mid);
  try{
    if(kind === "mine"){
      await updateDoc(ref, { silinen: arrayUnion(me.uid) });
      toast("Mesaj senden silindi");
    }else{
      await deleteDoc(ref);
      const c = chats.find(z=>z.id===active.id);
      if(c && c.sonMesaj === m.icerik && c.sonMesajZaman === (m.ts||0)){
        await updateDoc(doc(db,"sohbetler",active.id),
          { sonMesaj:"", sonMesajYazar:"", sonMesajYazarAd:"", sonMesajZaman:0 }).catch(()=>{});
      }
      toast("Mesaj herkesten silindi");
    }
  }catch(e){ toast("Silinemedi: "+e.message, true); }
}

(function bindMsgMenu(){
  const box = $("msgs");
  box.addEventListener("click", e=>{
    const q = e.target.closest(".msgQuote");
    if(!q || !q.dataset.q) return;
    e.stopPropagation();
    const t = box.querySelector('.msg[data-mid="' + q.dataset.q + '"]');
    if(!t){ toast("O mesaj artık görünmüyor"); return; }
    t.scrollIntoView({ behavior:"smooth", block:"center" });
    t.classList.add("hl");
    setTimeout(()=> t.classList.remove("hl"), 1300);
  });
  box.addEventListener("click", e=>{
    const b = e.target.closest("[data-more]");
    if(!b) return;
    e.stopPropagation();
    const r = b.getBoundingClientRect();
    openMsgMenu(b.dataset.more, r.left, r.bottom + 6);
  });
  box.addEventListener("click", e=>{
    const b = e.target.closest("[data-rct]");
    if(!b) return;
    e.stopPropagation();
    toggleReaction(b.dataset.rmid, b.dataset.rct);
  });
  box.addEventListener("click", e=>{
    const p = e.target.closest("[data-photo]");
    if(!p) return;
    e.stopPropagation();
    openPhotoView(p.dataset.photo);
  });
  box.addEventListener("contextmenu", e=>{
    const msg = e.target.closest(".msg");
    if(!msg || !msg.dataset.mid) return;
    e.preventDefault();
    const r = msg.getBoundingClientRect();
    const below = r.top - 62 < 8;
    openReactBar(msg.dataset.mid, r.left + Math.min(r.width/2, 150), below ? r.bottom : r.top, below);
  });
  let lpTimer = null, sx = 0, sy = 0;
  box.addEventListener("pointerdown", e=>{
    const msg = e.target.closest(".msg");
    if(!msg || !msg.dataset.mid || e.button === 2) return;
    sx = e.clientX; sy = e.clientY;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(()=>{
      if(navigator.vibrate) try{ navigator.vibrate(15); }catch(err){}
      const r = msg.getBoundingClientRect();
      const below = r.top - 62 < 8;
      openReactBar(msg.dataset.mid, sx, below ? r.bottom : r.top, below);
    }, 450);
  });
  const cancel = ()=> clearTimeout(lpTimer);
  box.addEventListener("pointerup", cancel);
  box.addEventListener("pointercancel", cancel);
  box.addEventListener("pointermove", e=>{
    if(Math.abs(e.clientX-sx) > 12 || Math.abs(e.clientY-sy) > 12) cancel();
  });
  box.addEventListener("scroll", cancel, { passive:true });
  document.addEventListener("click", e=>{
    if(Date.now() - menuGuard < 400) return;
    if(!e.target.closest("#msgMenu")) closeMsgMenu();
  });
  document.addEventListener("click", e=>{
    if(Date.now() - reactGuard < 900) return;
    if(!e.target.closest("#reactBar")) closeReactBar();
  });
  document.addEventListener("keydown", e=>{
    if(e.key !== "Escape") return;
    closeMsgMenu();
    closeReactBar();
    if(!$("imgView").classList.contains("hidden")) closePhotoView();
    if(!$("emoPanel").classList.contains("hidden")) closeEmoPanel();
    if(!$("ctxBar").classList.contains("hidden")) cancelCtx();
    if(pendingImg && $("chatView") && !$("chatView").classList.contains("hidden")) clearPendingImg();
    if(!$("fwdOverlay").classList.contains("hidden")){
      $("fwdOverlay").classList.add("hidden");
      fwdMid = null;
    }
  });
})();

$("backBtn").addEventListener("click", ()=>{
  document.body.classList.remove("inChat");
  closeChat();
});
function closeChat(){
  active = null;
  clearPendingImg();
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

/* --- gonder --- */
function activeMembers(){
  if(!active) return { grp:false, uyeler:[me.uid] };
  if(active.type === "grup") return { grp:true, uyeler: active.uyeler || [] };
  return { grp:false, uyeler: active.other ? [me.uid, active.other].sort() : [me.uid] };
}

async function postToChat(chatId, icerik, opts, infoOverride){
  opts = opts || {};
  let info = infoOverride;
  if(!info && active && active.id === chatId) info = activeMembers();
  if(!info){
    const c = chats.find(x=>x.id===chatId);
    if(c) info = { grp: c.tur === "grup", uyeler: c.uyeler || [] };
  }
  if(!info) info = { grp:false, uyeler:[me.uid] };

  const ref = doc(db,"sohbetler",chatId);
  const payload = {
    icerik, yazan: me.uid, yazanAd: me.ad,
    ts: Date.now(), zaman: serverTimestamp(), okundu:false, okuyan:[me.uid]
  };
  if(opts.yanit) payload.yanit = opts.yanit;
  if(opts.iletilendi) payload.iletilendi = true;
  if(opts.sticker) payload.sticker = opts.sticker;
  if(opts.gorsel && opts.gorsel.u)
    payload.gorsel = { u: opts.gorsel.u, w: opts.gorsel.w|0, h: opts.gorsel.h|0 };
  await addDoc(collection(ref,"mesajlar"), payload);

  const preview = msgPreview({ icerik, gorsel: opts.gorsel, sticker: opts.sticker });
  const upd = {
    sonMesaj: preview, sonMesajYazar: me.uid, sonMesajYazarAd: me.ad,
    sonMesajZaman: Date.now(), [`yaziyor.${me.uid}`]: 0
  };
  info.uyeler.forEach(u=>{
    if(u !== me.uid) upd[`okunmamis.${u}`] = increment(1);
  });
  updateDoc(ref, upd).catch(()=>{});
  const to = info.uyeler.filter(u=> u !== me.uid);
  Notif.notify(me.ad, preview || "Yeni mesaj", "chat_" + chatId, to);
}

/* ===== FOTOGRAF ===== */
function clearPendingImg(){
  pendingImg = null;
  const p = $("imgPre");
  if(p) p.classList.add("hidden");
  const t = $("imgPreThumb");
  if(t) t.removeAttribute("src");
  const f = $("imgInput");
  if(f) f.value = "";
}
function setPendingImg(u, w, h, name){
  pendingImg = { u, w: w|0, h: h|0, name: name || "Fotoğraf" };
  $("imgPreThumb").src = u;
  $("imgPreName").textContent = name || "Fotoğraf";
  const kb = Math.max(1, Math.round(u.length * 0.75 / 1024));
  $("imgPreInfo").textContent = `${w||"?"}×${h||"?"} · ${kb} KB · göndermek için ➤`;
  $("imgPre").classList.remove("hidden");
}
function shrinkPhoto(file){
  const presets = [[1100,0.74],[880,0.7],[660,0.66],[460,0.6]];
  let i = 0;
  const next = ()=>{
    if(i >= presets.length) return Promise.reject(new Error("Görsel işlenemedi veya çok büyük"));
    const p = presets[i++];
    return shrinkImage(file, p[0], p[1])
      .then(u => (u.length <= 660 * 1024 ? u : next()))
      .catch(()=> next());
  };
  return next();
}
function dataUrlDims(u){
  return new Promise(res=>{
    const i = new Image();
    i.onload = ()=> res({ w:i.naturalWidth||0, h:i.naturalHeight||0 });
    i.onerror = ()=> res({ w:0, h:0 });
    i.src = u;
  });
}
function savePhoto(mid){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || !m.gorsel || !m.gorsel.u) return;
  try{
    const u = m.gorsel.u;
    const ext = u.indexOf("image/png") >= 0 ? ".png" : (u.indexOf("image/webp") >= 0 ? ".webp" : ".jpg");
    const a = document.createElement("a");
    a.href = u;
    a.download = "foto-" + String(m.id || Date.now()).slice(-10) + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Fotoğraf indiriliyor");
  }catch(e){ toast("İndirilemedi: " + e.message, true); }
}
function openPhotoView(mid){
  const m = lastMsgs.find(z=>z.id===mid);
  if(!m || !m.gorsel) return;
  $("imgViewImg").src = m.gorsel.u;
  $("imgViewImg").dataset.mid = mid;
  $("imgViewMeta").textContent =
    `${m.yazanAd || m.yazan || "?"} · ${hhmm(m.ts || Date.now())}` + (m.icerik ? ` · ${m.icerik}` : "");
  $("imgView").classList.remove("hidden");
}
function closePhotoView(){
  const ov = $("imgView");
  if(ov) ov.classList.add("hidden");
  const im = $("imgViewImg");
  if(im){ im.removeAttribute("src"); delete im.dataset.mid; }
}
$("imgViewClose").addEventListener("click", closePhotoView);
$("imgViewSave").addEventListener("click", ()=>{
  const mid = $("imgViewImg").dataset.mid;
  if(mid) savePhoto(mid);
});
$("imgView").addEventListener("click", e=>{ if(e.target === $("imgView")) closePhotoView(); });

$("imgBtn").addEventListener("click", ()=> $("imgInput").click());
$("imgPreX").addEventListener("click", clearPendingImg);
$("imgInput").addEventListener("change", async e=>{
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if(!file) return;
  if(!active){ toast("Önce bir sohbet aç", true); return; }
  if(!/^image\//.test(file.type)){ toast("Sadece görsel dosyası olabilir", true); return; }
  if(file.size > 12 * 1024 * 1024){ toast("Dosya çok büyük (en fazla 12 MB)", true); return; }
  if(editing) cancelCtx();
  closeEmoPanel();
  $("imgPreName").textContent = file.name || "Fotoğraf";
  $("imgPreInfo").textContent = "İşleniyor…";
  $("imgPre").classList.remove("hidden");
  try{
    const u = await shrinkPhoto(file);
    const d = await dataUrlDims(u);
    setPendingImg(u, d.w, d.h, file.name);
    $("input").focus();
  }catch(err){ clearPendingImg(); toast(err.message || "Görsel işlenemedi", true); }
});

async function send(){
  const text = $("input").value.trim();
  const img = pendingImg;
  if((!text && !img) || !active) return;
  $("input").value = "";
  $("input").style.height = "auto";

  if(editing){
    const mid = editing.mid;
    const m = lastMsgs.find(z=>z.id===mid);
    cancelCtx();
    if(!m || m.sistem) return;
    if(Date.now() - (m.ts||0) > 15*60*1000){ toast("Düzenleme süresi doldu (15 dakika)", true); return; }
    try{
      await updateDoc(doc(db,"sohbetler",active.id,"mesajlar",mid), {
        icerik: text, duzenlendi: Date.now()
      });
      const i = lastMsgs.findIndex(z=>z.id===mid);
      if(i >= 0) lastMsgs[i] = { ...lastMsgs[i], icerik: text, duzenlendi: Date.now() };
      const c = chats.find(x=>x.id===active.id);
      if(c && c.sonMesaj === msgPreview(m)){
        updateDoc(doc(db,"sohbetler",active.id), { sonMesaj: msgPreview(lastMsgs[i] || m) }).catch(()=>{});
      }
      renderMsgsFromCache();
      toast("Mesaj düzenlendi");
    }catch(e){ toast("Düzenlenemedi: "+e.message, true); }
    return;
  }

  const y = replyTo;
  cancelCtx();
  clearPendingImg();
  try{
    await postToChat(active.id, text, {
      yanit: y ? { mid:y.mid, yazan:y.yazan, ad:y.ad, ozet:y.ozet } : null,
      gorsel: img
    });
  }catch(e){
    if(img && img.u){
      pendingImg = img;
      setPendingImg(img.u, img.w, img.h, img.name);
    }
    $("input").value = text;
    toast("Gönderilemedi: "+e.message, true);
  }
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
    pop(){ tone(1046.5,0.055,{vol:0.055,type:"sine"}); tone(1568,0.08,{vol:0.035,type:"sine",delay:0.05}); },
    tick(){ tone(1180,0.045,{vol:0.05,type:"sine"}); }
  };
  function vibrate(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
  document.addEventListener("pointerdown", ()=>{ const c = ac(); if(c && c.state === "suspended") c.resume(); }, { passive:true });
  return api;
})();

/* ===== BILDIRIMLER ===== */
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230dbd8b'/%3E%3Ctext x='32' y='44' font-size='36' font-weight='800' text-anchor='middle' fill='%2304140f' font-family='sans-serif'%3EN%3C/text%3E%3C/svg%3E";

/* Arka plan (sekme kapali) bildirimleri icin relay ucu. Bossa sadece acik sekme bildirimleri calisir. */
const PUSH_RELAY = "";
const VAPID_PUB = "BLzCUG9gK63kzosY2ZrA8-bX69C2N-zPodDx1ij7cSDb71OwAIfb3AezMbL-kQYhRqR9ihR_zR6DXhFUbefCNm8";

function b64ToUint8(b64){
  const pad = "=".repeat((4 - b64.length % 4) % 4);
  const raw = (b64 + pad).replace(/-/g,"+").replace(/_/g,"/");
  const bin = atob(raw);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out;
}

const Notif = {
  last: {},
  since: 0,
  reg: null,
  supported(){ return typeof Notification !== "undefined"; },
  granted(){ return this.supported() && Notification.permission === "granted"; },
  refreshBtn(){
    const b = $("notifBtn");
    if(!b) return;
    b.classList.remove("notifBtnOn","notifBtnOff");
    if(this.granted()){ b.classList.add("notifBtnOn"); b.title = "Bildirimler açık"; }
    else if(this.supported() && Notification.permission === "denied"){
      b.classList.add("notifBtnOff"); b.title = "Bildirimler engellendi — adres çubuğundaki kilit simgesinden aç";
    }else{ b.title = "Bildirimleri aç"; }
  },
  async ask(){
    if(!this.supported()){ toast("Bu tarayıcı bildirim desteklemiyor", true); return; }
    if(Notification.permission === "granted"){ this.refreshBtn(); toast("Bildirimler zaten açık"); return; }
    if(Notification.permission === "denied"){
      this.refreshBtn();
      toast("Bildirim engelli — adres çubuğundaki kilit/izin simgesinden açman gerek", true);
      return;
    }
    try{
      const p = await Notification.requestPermission();
      this.refreshBtn();
      if(p === "granted"){
        this.push("Bildirimler açık", "Yeni mesaj ve aramalarda seni haberdar edeceğim");
        toast("Bildirimler açıldı");
      }else{ toast("Bildirim izni verilmedi", true); }
    }catch(e){ toast("İzin alınamadı: "+e.message, true); }
  },
  async start(){
    if(!("serviceWorker" in navigator)) return;
    try{ this.reg = await navigator.serviceWorker.register("sw.js"); }
    catch(e){ this.reg = null; }
    if(this.granted()) this.subscribe();
  },
  async subscribe(){
    if(!PUSH_RELAY || !("serviceWorker" in navigator) || !this.granted()) return false;
    try{
      if(!this.reg) this.reg = await navigator.serviceWorker.register("sw.js");
      if(!this.reg) return false;
      let sub = await this.reg.pushManager.getSubscription();
      if(!sub){
        sub = await this.reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToUint8(VAPID_PUB)
        });
      }
      await fetch(PUSH_RELAY + "/subscribe", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ uid: me.uid, ad: me.ad, sub: sub.toJSON() })
      });
      return true;
    }catch(e){ console.warn("Push aboneliği kurulamadı:", e && e.message); return false; }
  },
  async unsubscribe(){
    try{
      if(this.reg){ const s = await this.reg.pushManager.getSubscription(); if(s) await s.unsubscribe(); }
    }catch(e){}
  },
  notify(title, body, tag, to){
    if(!PUSH_RELAY || !me || !to || !to.length) return;
    try{
      fetch(PUSH_RELAY + "/notify", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          from: me.uid, to,
          payload:{ title, body: String(body||"").slice(0,180), tag: tag || "nexus", url:"./" }
        })
      }).catch(()=>{});
    }catch(e){}
  },
  push(title, body, opts){
    if(!this.granted()) return;
    opts = opts || {};
    try{
      const n = new Notification(title, { body, icon: FAVICON, badge: FAVICON, tag: opts.tag, renotify: false });
      n.onclick = ()=>{ try{ window.focus(); }catch(e){} if(opts.onClick) opts.onClick(); n.close(); };
    }catch(e){}
  },
  open(c){
    try{
      document.body.classList.remove("inChat");
      activeTab = "chats";
      document.querySelectorAll(".sideTab").forEach(x=> x.classList.toggle("on", x.dataset.tab === "chats"));
      renderSide();
      if(isGrup(c)) openGroupChat(c.id);
      else openChat(c.uyeler.find(u=>u!==me.uid));
    }catch(e){}
  },
  chat(c){
    const ts = c.sonMesajZaman || 0;
    if(!ts) return;
    if((this.last[c.id] || 0) >= ts) return;
    this.last[c.id] = ts;
    if(ts <= this.since) return;
    if(c.sonMesajYazar === me.uid) return;
    const viewing = active && active.id === c.id;
    if(viewing && !document.hidden) return;
    const title = isGrup(c) ? (c.grupAd || "Grup")
      : ((c.uyelerAd && c.uyelerAd[c.uyeler.find(u=>u!==me.uid)]) || "Yeni mesaj");
    const body = (isGrup(c) && c.sonMesajYazarAd ? c.sonMesajYazarAd + ": " : "") + (c.sonMesaj || "");
    Snd.pop();
    this.push(title, body, { tag: "chat_" + c.id, onClick: ()=> this.open(c) });
  },
  call(d){
    Snd.pop();
    const grup = d.tur === "grup";
    const body = grup
      ? (d.video ? "Görüntülü grup araması" : "Sesli grup araması")
      : "Sesli arama isteği gönderiyor";
    this.push(grup ? (d.grupAd || "Grup") : d.arayanAd, body, { tag: "call", onClick: ()=>{
      try{ window.focus(); }catch(e){}
    }});
  }
};

$("notifBtn").addEventListener("click", async ()=>{
  await Notif.ask();
  if(Notif.granted()) Notif.subscribe();
});

/* ===== SESLİ ARAMA (WebRTC) ===== */
let call = null;
let ringCall = null;
let candUnsub = null;
let candQueue = [];
let timerInt = null;
const RTC_CFG = { iceServers: [
  { urls: ["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun2.l.google.com:19302","stun:stun.cloudflare.com:3478"] }
] };

function paintGroupAvatar(el, uid){
  paintAvatar(el, { uid: uid, icon: "👥" });
  el.style.fontSize = "";
  const g = el.querySelector(".gIco");
  if(g) g.style.fontSize = "52px";
}

function showRing(d){
  ringCall = d;
  if(d.tur === "grup"){
    paintGroupAvatar($("ringAvatar"), d.grupId);
    $("ringAvatar").classList.add("ringing");
    $("ringName").textContent = d.grupAd || "Grup";
    $("ringAlias").textContent = `${(d.members||[]).length} üye · grup`;
    $("ringLabel").textContent = d.video ? "Gelen görüntülü grup araması" : "Gelen sesli grup araması";
    setTimeout(()=>{
      if(ringCall && ringCall.id === d.id){
        ringCall = null;
        Snd.stop();
        $("ringOverlay").classList.add("hidden");
        toast("Arama süresi doldu");
      }
    }, 50000);
  }else{
    $("ringAvatar").style.fontSize = "";
    paintAvatar($("ringAvatar"), { uid: d.arayan, ad: d.arayanAd, photo: fotoOf(d.arayan) });
    $("ringAvatar").classList.add("ringing");
    $("ringName").textContent = d.arayanAd;
    $("ringAlias").textContent = `@${d.arayan}:nexus`;
    $("ringLabel").textContent = "Gelen sesli arama";
  }
  $("ringOverlay").classList.remove("hidden");
  Snd.ringtone();
  Notif.call(d);
}

$("ringReject").addEventListener("click", async ()=>{
  if(!ringCall) return;
  const id = ringCall.id; const grup = ringCall.tur === "grup"; ringCall = null;
  Snd.stop();
  $("ringOverlay").classList.add("hidden");
  if(grup){
    await updateDoc(doc(db,"aramalar",id), { retler: arrayUnion(me.uid) }).catch(()=>{});
  }else{
    await updateDoc(doc(db,"aramalar",id), { durum:"ret", bitis: Date.now() }).catch(()=>{});
  }
  Snd.end();
  toast("Arama reddedildi");
});

$("ringAccept").addEventListener("click", async ()=>{
  if(!ringCall) return;
  const d = ringCall; ringCall = null;
  Snd.stop();
  $("ringOverlay").classList.add("hidden");
  try{
    const local = await navigator.mediaDevices.getUserMedia({ audio:true, video: !!d.video });
    if(d.tur === "grup"){
      const members = Array.from(new Set([d.arayan, ...(d.members||[])]));
      call = { id:d.id, tur:"grup", role:"uye", local, muted:false, camOff:false,
               video: !!d.video, members, retler:[], katilan:[me.uid],
               grupId:d.grupId, grupAd:d.grupAd, peers:{}, peerStreams:{}, connectedAt:0 };
      await updateDoc(doc(db,"aramalar",d.id), { katilan: arrayUnion(me.uid) });
      showGroupCallOverlay("Bağlanıyor…");
      Snd.connecting();
      armConnectTimeout(45000);
    }else{
      call = { id:d.id, role:"callee", local, muted:false, step:"wait-offer", connectedAt:0, peer: d.arayan };
      await updateDoc(doc(db,"aramalar",d.id), { durum:"kabul", kabulZaman: Date.now() });
      showCallOverlay(d.arayanAd, d.arayan, "Bağlanıyor…");
      Snd.connecting();
      listenCandidates(d.id);
    }
  }catch(e){
    toast("Mikrofon izni verilmedi", true);
    Snd.fail();
    if(d.tur === "grup") updateDoc(doc(db,"aramalar",d.id), { retler: arrayUnion(me.uid) }).catch(()=>{});
    else updateDoc(doc(db,"aramalar",d.id), { durum:"bitti" }).catch(()=>{});
  }
});

async function startCall(withVideo){
  if(!active) return;
  if(call){ toast("Zaten bir görüşme açık"); return; }
  if(ringCall){ toast("Gelen bir arama var"); return; }
  try{
    const local = await navigator.mediaDevices.getUserMedia({ audio:true, video: !!withVideo });
    if(active.type === "grup"){
      const members = Array.from(new Set([me.uid, ...(active.uyeler||[])]));
      const others = members.filter(u=>u!==me.uid);
      const id = "g_" + active.id + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
      call = { id, tur:"grup", role:"caller", local, muted:false, camOff:false,
               video: !!withVideo, members, retler:[], katilan:[me.uid],
               grupId: active.id, grupAd: active.grupAd || "Grup",
               peers:{}, peerStreams:{}, connectedAt:0 };
      await setDoc(doc(db,"aramalar",id), {
        tur:"grup", grupId: active.id, grupAd: active.grupAd || "Grup",
        arayan: me.uid, arayanAd: me.ad,
        members, arananlar: others, video: !!withVideo,
        katilan: [me.uid], retler: [],
        durum: "zil", olusturuldu: Date.now()
      });
      showGroupCallOverlay("Aranıyor…");
      Snd.ringback();
      Notif.notify(me.ad, (withVideo ? "Görüntülü" : "Sesli") + " grup araması", "call_" + id, others);
      armConnectTimeout(60000);
      return;
    }
    const id = `${me.uid}_${active.other}_${Date.now()}`;
    call = { id, role:"caller", local, muted:false, step:"wait-accept", connectedAt:0, other: active.other };
    await setDoc(doc(db,"aramalar",id), {
      arayan: me.uid, arayanAd: me.ad,
      aranan: active.other, arananAd: active.otherAd,
      durum: "zil", olusturuldu: Date.now()
    });
    showCallOverlay(active.otherAd, active.other, "Aranıyor…");
    Snd.ringback();
    Notif.notify(me.ad, "Sesli arama isteği gönderiyor", "call_" + id, [active.other]);
    listenCandidates(id);
    setTimeout(()=>{ if(call && call.id===id && call.step==="wait-accept") endCall("cevapsiz"); }, 45000);
  }catch(e){ toast("Mikrofon izni verilmedi", true); Snd.fail(); }
}

$("callBtn").addEventListener("click", ()=> startCall(false));
$("videoBtn").addEventListener("click", ()=> startCall(true));

function showCallOverlay(name, uid, status){
  paintAvatar($("callAvatar"), { uid, ad: name, photo: fotoOf(uid) });
  $("callAvatar").classList.add("ringing");
  $("callAvatar").style.fontSize = "";
  $("callName").textContent = name;
  $("callAlias").textContent = `@${uid}:nexus`;
  $("callStatus").textContent = status;
  $("callTimer").textContent = "";
  $("camBtn").classList.add("hidden");
  $("callOverlay").classList.remove("stage");
  $("callOverlay").classList.remove("hidden");
}

function showGroupCallOverlay(status){
  const ov = $("callOverlay");
  paintGroupAvatar($("callAvatar"), call.grupId);
  $("callAvatar").classList.add("ringing");
  $("callName").textContent = call.grupAd;
  $("callAlias").textContent = `${groupRoster(call).length} üye · ${call.video ? "görüntülü" : "sesli"} grup araması`;
  $("callStatus").textContent = status;
  $("callTimer").textContent = "";
  $("camBtn").classList.toggle("hidden", !call.video);
  ov.classList.add("stage");
  ov.classList.remove("hidden");
  renderCallStage();
}

function renderCallStage(){
  if(!call || call.tur !== "grup") return;
  const st = $("callStage");
  const joined = (call.katilan||[]).filter(u=> call.members.includes(u));
  st.innerHTML = groupRoster(call).map(u=>{
    const isMe = u === me.uid;
    const on = joined.includes(u);
    const hasStream = isMe || !!call.peerStreams[u];
    const vid = call.video && on && hasStream;
    const av = avatarHtml({ uid:u, ad: adOf(u,u), photo: vid ? "" : fotoOf(u), cls:"tAv" });
    const media = vid
      ? `<video data-uv="${u}" playsinline muted></video>`
      : av;
    const label = isMe ? "Sen"
      : !on ? adOf(u,u) + " · bekliyor"
      : !hasStream ? adOf(u,u) + " · bağlanıyor"
      : adOf(u,u);
    return `<div class="cTile ${call.video?"vid":"av"}${isMe?" me":""}${on?"":" wait"}" data-tile="${u}">` +
      media +
      `<span class="tName">${esc(label)}</span>` +
      (isMe && call.muted ? `<span class="tMic muted">🎙</span>` : "") +
      `</div>`;
  }).join("");
  attachStageMedia();
}

function attachStageMedia(){
  if(!call || call.tur !== "grup") return;
  const st = $("callStage");
  const self = st.querySelector('video[data-uv="'+me.uid+'"]');
  if(self){
    if(self.srcObject !== call.local) self.srcObject = call.local;
    self.muted = true;
    self.style.opacity = call.camOff ? ".18" : "1";
    self.play().catch(()=>{});
  }
  Object.keys(call.peerStreams||{}).forEach(uid=>{
    const v = st.querySelector('video[data-uv="'+uid+'"]');
    if(v && v.srcObject !== call.peerStreams[uid]){
      v.srcObject = call.peerStreams[uid];
      v.muted = true;
      v.play().catch(()=>{});
    }
  });
}

function updateGroupCallStatus(){
  if(!call || call.tur !== "grup") return;
  const roster = groupRoster(call);
  const joined = (call.katilan||[]).filter(u=> roster.includes(u));
  const conn = Object.keys(call.peers||{}).filter(u=> call.peers[u].connected).length;
  const need = Math.max(1, joined.filter(u=>u!==me.uid).length);
  const total = roster.length;
  $("callStatus").textContent = call.connectedAt
    ? "Görüşme sürüyor · " + joined.length + "/" + total + " üye"
    : "Bağlanıyor… · " + conn + "/" + need + " bağlantı";
}

/* ===== GRUP ARAMA: MESH + ESLESME (PAIR) SINYALIZASYONU ===== */
function ensureGroupAudio(uid, stream){
  const box = $("callAudios");
  let a = box.querySelector('audio[data-ua="'+uid+'"]');
  if(!a){
    a = document.createElement("audio");
    a.autoplay = true;
    a.setAttribute("playsinline","");
    a.setAttribute("data-ua", uid);
    box.appendChild(a);
  }
  if(a.srcObject !== stream){
    a.srcObject = stream;
    a.muted = false;
    a.play().catch(()=>{});
  }
}
function clearGroupAudio(uid){
  const a = $("callAudios").querySelector('audio[data-ua="'+uid+'"]');
  if(a){ try{ a.srcObject = null; }catch(e){} a.remove(); }
}
function clearAllGroupAudio(){ $("callAudios").innerHTML = ""; }

function groupRoster(c){ return (c && c.members || []).filter(u=> (c.retler||[]).indexOf(u) < 0); }
function groupPairKey(a,b){ return [a,b].sort().join("~"); }
function groupPairRef(uid){
  return doc(db,"aramalar",call.id,"esler",groupPairKey(me.uid, uid));
}

function groupSyncPeers(){
  if(!call || call.tur !== "grup") return;
  const roster = groupRoster(call);
  const joined = (call.katilan||[]).filter(u=> roster.includes(u));
  const others = joined.filter(u=> u !== me.uid);
  Object.keys(call.peers).forEach(uid=>{
    if(others.indexOf(uid) < 0) closeGroupPeer(uid);
  });
  others.forEach(uid=>{ if(!call.peers[uid]) groupStartPeer(uid); });
  renderCallStage();
  updateGroupCallStatus();
  groupMaybeConnected();
}

function groupStartPeer(uid){
  const pc = new RTCPeerConnection(RTC_CFG);
  call.local.getTracks().forEach(t=>{ try{ pc.addTrack(t, call.local); }catch(e){} });
  const peer = { uid, pc, init: me.uid < uid, queue: [], unsubs: [],
                 connected:false, sentOffer:false, answered:false, gotAnswer:false };
  call.peers[uid] = peer;
  pc.onicecandidate = e=>{
    if(e.candidate && call && call.peers[uid]){
      addDoc(collection(groupPairRef(uid), "adaylar"), {
        kim: me.uid, k: e.candidate.toJSON(), at: Date.now()
      }).catch(()=>{});
    }
  };
  pc.ontrack = e=>{
    if(!call || !call.peers[uid]) return;
    const s = e.streams[0];
    call.peerStreams[uid] = s;
    ensureGroupAudio(uid, s);
    if(call.video) renderCallStage();
    updateGroupCallStatus();
  };
  pc.onconnectionstatechange = ()=>{
    if(!call || !call.peers[uid]) return;
    const st = pc.connectionState;
    if(st === "connected"){ peer.connected = true; groupMaybeConnected(); }
    else if(st === "failed"){ closeGroupPeer(uid); return; }
    updateGroupCallStatus();
  };
  groupListenPair(peer);
  if(peer.init) groupMaybeOffer(peer);
}

function closeGroupPeer(uid){
  const p = call && call.peers[uid];
  if(p){
    (p.unsubs||[]).forEach(fn=>{ try{ fn(); }catch(e){} });
    try{ p.pc.close(); }catch(e){}
    delete call.peers[uid];
  }
  if(call) delete call.peerStreams[uid];
  clearGroupAudio(uid);
}

function groupListenPair(peer){
  const uid = peer.uid;
  const pRef = groupPairRef(uid);
  peer.unsubs.push(onSnapshot(pRef, snap=>{
    if(!call || !call.peers[uid]) return;
    const d = snap.data();
    if(!d) return;
    if(peer.init){
      if(d.cevap && !peer.gotAnswer){
        peer.gotAnswer = true;
        peer.pc.setRemoteDescription(new RTCSessionDescription(d.cevap))
          .then(()=> groupFlush(peer)).catch(()=>{});
      }
    }else if(d.teklif && !peer.answered){
      peer.answered = true;
      groupAnswer(peer, d.teklif);
    }
  }, ()=>{}));
  peer.unsubs.push(onSnapshot(collection(pRef, "adaylar"), snap=>{
    snap.docChanges().forEach(ch=>{
      if(ch.type !== "added") return;
      const c = ch.doc.data();
      if(!call || !call.peers[uid] || c.kim === me.uid) return;
      if(peer.pc.remoteDescription) peer.pc.addIceCandidate(new RTCIceCandidate(c.k)).catch(()=>{});
      else peer.queue.push(c.k);
    });
  }, ()=>{}));
}

function groupFlush(peer){
  const q = peer.queue || [];
  peer.queue = [];
  q.forEach(k=>{ try{ peer.pc.addIceCandidate(new RTCIceCandidate(k)).catch(()=>{}); }catch(e){} });
}

async function groupMaybeOffer(peer){
  if(!call || !call.peers[peer.uid] || !peer.init || peer.sentOffer) return;
  peer.sentOffer = true;
  try{
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    await setDoc(groupPairRef(peer.uid), {
      a: me.uid < peer.uid ? me.uid : peer.uid,
      b: me.uid < peer.uid ? peer.uid : me.uid,
      teklifci: me.uid, teklif: peer.pc.localDescription.toJSON(), at: Date.now()
    }, { merge:true });
  }catch(e){ peer.sentOffer = false; }
}

async function groupAnswer(peer, offerSdp){
  try{
    await peer.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    groupFlush(peer);
    const ans = await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(ans);
    await setDoc(groupPairRef(peer.uid), {
      cevap: peer.pc.localDescription.toJSON(), cevapci: me.uid, at: Date.now()
    }, { merge:true });
  }catch(e){ peer.answered = false; }
}

function groupMaybeConnected(){
  if(!call || call.tur !== "grup" || call.connectedAt) return;
  const others = (call.katilan||[]).filter(u=> groupRoster(call).indexOf(u) >= 0 && u !== me.uid);
  if(!others.length) return;
  if(!others.every(u=> call.peers[u] && call.peers[u].connected)) return;
  call.connectedAt = Date.now();
  Snd.stop(); Snd.connected();
  $("callAvatar").classList.remove("ringing");
  startTimer();
  updateGroupCallStatus();
}

function handleCallState(d){
  if(!call || call.id !== d.id) return;
  if(call.tur === "grup"){
    if(d.durum === "bitti"){ endCall(call.connectedAt ? "karsi-kapatti" : "baglanamadi"); return; }
    if(d.durum === "ret"){ endCall("ret"); return; }
    const k = d.katilan || [];
    const r = d.retler || [];
    const changed = k.join(",") !== (call.katilan||[]).join(",")
      || r.join(",") !== (call.retler||[]).join(",");
    call.katilan = k;
    call.retler = r;
    if(changed) groupSyncPeers();
    else updateGroupCallStatus();
    return;
  }
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

function armConnectTimeout(ms){
  const id = call && call.id;
  setTimeout(()=>{
    if(call && call.id === id && !call.connectedAt) endCall("baglanamadi");
  }, ms || 30000);
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
  if(call.tur === "grup") renderCallStage();
});

$("camBtn").addEventListener("click", ()=>{
  if(!call || call.tur !== "grup" || !call.local) return;
  const t = call.local.getVideoTracks()[0];
  if(!t) return;
  call.camOff = !call.camOff;
  t.enabled = !call.camOff;
  $("camBtn").classList.toggle("off", call.camOff);
  $("camBtn").title = call.camOff ? "Kamerayı aç" : "Kamerayı kapat";
  attachStageMedia();
});

$("endBtn").addEventListener("click", ()=> endCall("ben-bitirdim"));

function fmtDur(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0");
}

function writeCallLog(c, why){
  const peer = c.peer || c.other;
  if(!peer) return;
  const chatId = [me.uid, peer].sort().join("~");
  const sure = c.connectedAt ? fmtDur(Date.now() - c.connectedAt) : "";
  const text = why === "cevapsiz" ? "📞 Cevapsız arama"
    : why === "ret" ? "📞 Arama reddedildi"
    : why === "mesgul" ? "📞 Karşı taraf meşgul"
    : why === "baglanamadi" ? "📞 Bağlanılamadı"
    : sure ? "📞 Sesli arama · " + sure
    : why === "ben-bitirdim" ? "📞 Bağlanmadan bitirildi"
    : "📞 Arama";
  addDoc(collection(doc(db,"sohbetler",chatId),"mesajlar"), {
    icerik: text, sistem: true, yazan: me.uid, yazanAd: me.ad,
    ts: Date.now(), zaman: serverTimestamp()
  }).catch(()=>{});
}

function writeGroupCallLog(c, why){
  const sure = c.connectedAt ? fmtDur(Date.now() - c.connectedAt) : "";
  const kind = c.video ? "Görüntülü" : "Sesli";
  const text = why === "baglanamadi" ? "📞 Bağlanılamadı"
    : why === "ret" ? "📞 Grup araması reddedildi"
    : why === "baglanti-koptu" ? "📞 Bağlantı koptu"
    : why === "hata" ? "📞 Arama başlatılamadı"
    : sure ? "📞 " + kind + " grup araması · " + sure
    : why === "ben-bitirdim" ? "📞 Grup araması bağlanmadan bitirildi"
    : "📞 Grup araması";
  addDoc(collection(doc(db,"sohbetler",c.grupId),"mesajlar"), {
    icerik: text, sistem: true, yazan: me.uid, yazanAd: me.ad,
    ts: Date.now(), zaman: serverTimestamp()
  }).catch(()=>{});
}

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
  if(c.tur === "grup"){
    Object.keys(c.peers||{}).forEach(uid=>{
      const p = c.peers[uid];
      (p.unsubs||[]).forEach(fn=>{ try{ fn(); }catch(e){} });
      try{ p.pc.close(); }catch(e){}
    });
    c.peers = {};
    clearAllGroupAudio();
    $("callStage").innerHTML = "";
    $("callOverlay").classList.remove("stage");
  }else{
    try{ if(c.pc) c.pc.close(); }catch(e){}
    $("remoteAudio").srcObject = null;
  }
  try{ if(c.local) c.local.getTracks().forEach(t=>t.stop()); }catch(e){}
  $("callOverlay").classList.add("hidden");
  $("muteBtn").classList.remove("off");
  $("camBtn").classList.remove("off");
  $("camBtn").classList.add("hidden");

  const ref = doc(db,"aramalar",c.id);
  if(c.role === "caller"){
    if(c.tur === "grup") writeGroupCallLog(c, why);
    else writeCallLog(c, why);
  }

  if(c.tur === "grup"){
    getDoc(ref).then(snap=>{
      if(!snap.exists()) return;
      const d = snap.data();
      if(d.durum === "bitti") return;
      if(c.role === "caller"){
        updateDoc(ref, { durum:"bitti", sonuc:"bitti", bitis: Date.now() }).catch(()=>{});
      }else{
        const patch = { katilan: arrayRemove(me.uid) };
        const remaining = (d.katilan||[]).filter(u=> u !== me.uid);
        if(remaining.length <= 1){ patch.durum = "bitti"; patch.bitis = Date.now(); }
        updateDoc(ref, patch).catch(()=>{});
      }
    }).catch(()=>{});
    if(why === "ben-bitirdim") toast("Görüşme sonlandırıldı");
    else if(why === "baglanamadi") toast("Kimse aramaya katılmadı");
    else if(why === "baglanti-koptu") toast("Bağlantı koptu");
    else if(why === "ret") toast("Arama reddedildi");
    else if(why === "karsi-kapatti") toast("Görüşme kapatıldı");
    return;
  }

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
      ${avatarHtml({ uid: u.uid, ad: u.ad, photo: fotoOf(u.uid), dot: p.live })}
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
    const ad = adOf(u, (c.uyelerAd && c.uyelerAd[u]) || u);
    const role = u === kurucu ? "kurucu" : (yonetici.includes(u) ? "yönetici" : "üye");
    const p = presenceOf(userBy(u) || {});
    return `<div class="giRow">
      ${avatarHtml({ uid: u, ad, photo: fotoOf(u), dot: p.live, cls: "sm" })}
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
        ${avatarHtml({ uid: u.uid, ad: u.ad, photo: fotoOf(u.uid), dot: online })}
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

/* ===== PROFIL ===== */
function shrinkImage(file, max, quality){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    const fail = e => { try{ URL.revokeObjectURL(url); }catch(x){} reject(e instanceof Error ? e : new Error("görsel açılamadı")); };
    img.onload = ()=>{
      try{
        const iw = img.width || 1, ih = img.height || 1;
        const scale = Math.min(1, max / Math.max(iw, ih));
        const w = Math.max(1, Math.round(iw * scale));
        const h = Math.max(1, Math.round(ih * scale));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const cx = cv.getContext("2d");
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = "high";
        cx.drawImage(img, 0, 0, w, h);
        try{ URL.revokeObjectURL(url); }catch(x){}
        let out = "";
        try{ out = cv.toDataURL("image/jpeg", quality); }catch(x){ out = ""; }
        if(!out || out.length < 40) throw new Error("Görsel işlenemedi");
        if(out.length > 900 * 1024){
          try{ const alt = cv.toDataURL("image/webp", 0.82); if(alt.length && alt.length < out.length) out = alt; }catch(x){}
        }
        if(out.length > 960 * 1024) throw new Error("Görsel çok büyük, daha küçük bir görsel dene");
        resolve(out);
      }catch(e){ reject(e); }
    };
    img.onerror = ()=> fail(new Error("Görsel açılamadı"));
    img.src = url;
  });
}

function openProfile(){
  if(!me) return;
  const u = userBy(me.uid) || {};
  renderMeBox();
  paintAvatar($("profAvatar"), { uid: me.uid, ad: me.ad, photo: me.foto || "" });
  $("profName").textContent = me.ad;
  $("profAlias").textContent = `@${me.uid}:nexus`;
  $("profMetaUid").textContent = `@${me.uid}:nexus`;
  $("profMetaRole").textContent = me.rol === "admin" ? "Yönetici" : "Kullanıcı";
  $("profNameInput").value = me.ad;
  $("profBio").value = u.hakkinda || me.hakkinda || "";
  $("profHint").textContent = me.foto
    ? "Fotoğrafın kaydediliyor · 📷 değiştir, alttaki butonla kaldır"
    : "Henüz profil fotoğrafın yok · 📷 ile bir görsel seç";
  $("profileOverlay").classList.remove("hidden");
  setTimeout(()=> $("profNameInput").focus(), 60);
}
function closeProfile(){ $("profileOverlay").classList.add("hidden"); }

async function applyPhoto(file){
  if(!file || !me) return;
  if(!/^image\//.test(file.type)){ toast("Sadece görsel dosyası olabilir", true); return; }
  if(file.size > 8 * 1024 * 1024){ toast("Dosya çok büyük (en fazla 8 MB)", true); return; }
  const btn = $("profPhotoBtn");
  btn.disabled = true;
  $("profHint").textContent = "Fotoğraf işleniyor…";
  try{
    const dataUrl = await shrinkImage(file, 480, 0.86);
    await updateDoc(doc(db,"kullanicilar",me.uid), { foto: dataUrl });
    me.foto = dataUrl;
    paintAvatar($("profAvatar"), { uid: me.uid, ad: me.ad, photo: dataUrl });
    $("profHint").textContent = "Fotoğrafın kaydedildi 📷";
    renderMeBox(); renderSide(); renderChatHeader();
    toast("Profil fotoğrafın güncellendi");
  }catch(e){
    $("profHint").textContent = "Fotoğraf yüklenemedi";
    toast("Yüklenemedi: " + (e && e.message ? e.message : e), true);
  }finally{ btn.disabled = false; }
}

async function clearPhoto(){
  if(!me || !me.foto) return;
  const btn = $("profPhotoClear");
  btn.disabled = true;
  try{
    await updateDoc(doc(db,"kullanicilar",me.uid), { foto: "" });
    me.foto = "";
    paintAvatar($("profAvatar"), { uid: me.uid, ad: me.ad });
    $("profHint").textContent = "Henüz profil fotoğrafın yok · 📷 ile bir görsel seç";
    renderMeBox(); renderSide(); renderChatHeader();
    toast("Profil fotoğrafı kaldırıldı");
  }catch(e){ toast("Kaldırılamadı: "+e.message, true); }
  finally{ btn.disabled = false; }
}

async function saveProfile(){
  if(!me) return;
  const ad = $("profNameInput").value.trim().replace(/\s+/g," ");
  const hakkinda = $("profBio").value.trim().slice(0,70);
  if(ad.length < 2){ toast("Ad en az 2 karakter olmalı", true); return; }
  if(ad.length > 24){ toast("Ad en fazla 24 karakter olmalı", true); return; }
  const btn = $("profSave");
  const eskiAd = me.ad;
  btn.disabled = true; btn.textContent = "Kaydediliyor…";
  try{
    await updateDoc(doc(db,"kullanicilar",me.uid), { ad, hakkinda });
    me.ad = ad; me.hakkinda = hakkinda;
    const u = userBy(me.uid);
    if(u){ u.ad = ad; u.hakkinda = hakkinda; }
    renderMeBox();
    if(ad !== eskiAd){
      chats.forEach(c=>{ if(c.uyelerAd) c.uyelerAd[me.uid] = ad; });
      const jobs = chats.filter(c => (c.uyeler||[]).indexOf(me.uid) >= 0)
        .map(c => updateDoc(doc(db,"sohbetler",c.id), { [`uyelerAd.${me.uid}`]: ad }).catch(()=>{}));
      lastMsgs.forEach(m=>{ if(m.yazan === me.uid && !m.sistem) m.yazanAd = ad; });
      await Promise.all(jobs);
    }
    renderSide(); renderChatHeader();
    $("profName").textContent = ad;
    if(!$("ginfoOverlay").classList.contains("hidden")) openGroupInfo();
    if(!$("adminOverlay").classList.contains("hidden")) renderAdmin();
    renderMsgsFromCache();
    toast("Profilin güncellendi");
    closeProfile();
  }catch(e){
    toast("Kaydedilemedi: "+e.message, true);
  }finally{
    btn.disabled = false; btn.textContent = "Kaydet";
  }
}

$("meBox").addEventListener("click", openProfile);
$("profileClose").addEventListener("click", closeProfile);
$("profPhotoBtn").addEventListener("click", ()=> $("photoInput").click());
$("profPhotoPick").addEventListener("click", ()=> $("photoInput").click());
$("photoInput").addEventListener("change", e=>{
  const f = e.target.files && e.target.files[0];
  e.target.value = "";
  if(f) applyPhoto(f);
});
$("profPhotoClear").addEventListener("click", clearPhoto);
$("profSave").addEventListener("click", saveProfile);
$("profNameInput").addEventListener("keydown", e=>{ if(e.key === "Enter") saveProfile(); });
$("profBio").addEventListener("keydown", e=>{ if(e.key === "Enter") saveProfile(); });
$("profileOverlay").addEventListener("click", e=>{ if(e.target === $("profileOverlay")) closeProfile(); });
document.addEventListener("keydown", e=>{
  if(e.key === "Escape" && !$("profileOverlay").classList.contains("hidden")) closeProfile();
});

/* ===== SESSION RESTORE ===== */
if(tryRestore()) startApp();
