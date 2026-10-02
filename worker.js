/* ============================================================
   Nexus — Web Push relay (Cloudflare Worker)

   Tek dosya. Cloudflare dashboard > Workers & Pages > Create >
   Worker > Edit code ile yapistirilir. KV binding adi: SUBS
   ============================================================ */

const VAPID_PRIV_B64 = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg6oy3NmItmm7DBUIPVcFkS8kSiOI5x6qh6gWCY9NV_LehRANCAAS8wlBvYCut5M6LGNmawPPm1-vQtjfsz6HQ8dYo-3Eg2-9TsACH29wHszGy_pEGIUakfYoUf80eg14RVG3nwjZv";
const VAPID_PUB_B64  = "BLzCUG9gK63kzosY2ZrA8-bX69C2N-zPodDx1ij7cSDb71OwAIfb3AezMbL-kQYhRqR9ihR_zR6DXhFUbefCNm8";
const VAPID_SUBJECT  = "mailto:ahmetselcuk199327@gmail.com";

const enc = new TextEncoder();

function b64urlFromBytes(bytes){
  let s = "";
  for(const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function b64urlFromString(str){ return b64urlFromBytes(enc.encode(str)); }
function bytesFromB64url(s){
  const pad = "=".repeat((4 - s.length % 4) % 4);
  const bin = atob(s.replace(/-/g,"+").replace(/_/g,"/") + pad);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out;
}
function concat(...parts){
  let n = 0;
  for(const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for(const p of parts){ out.set(p, o); o += p.length; }
  return out;
}

/* RFC 5869 (WebCrypto HKDF her seferinde Extract de yaptigi icin elle) */
async function hmac(key, data){
  const k = await crypto.subtle.importKey("raw", key, { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}
async function hkdfExtract(salt, ikm){ return hmac(salt, ikm); }
async function hkdfExpand(prk, info, len){
  const out = new Uint8Array(len);
  let prev = new Uint8Array(0), off = 0, i = 1;
  while(off < len){
    const t = await hmac(prk, concat(prev, info, Uint8Array.of(i)));
    const n = Math.min(t.length, len - off);
    out.set(t.subarray(0, n), off);
    off += n; prev = t; i++;
  }
  return out;
}

/* RFC 8291 §3.4 */
async function deriveKeys({ ecdhSecret, authSecret, uaPublic, asPublic, salt }){
  const prkKey  = await hkdfExtract(authSecret, ecdhSecret);
  const keyInfo = concat(enc.encode("WebPush: info"), [0], uaPublic, asPublic);
  const ikm     = await hkdfExpand(prkKey, keyInfo, 32);
  const prk     = await hkdfExtract(salt, ikm);
  const cek     = await hkdfExpand(prk, concat(enc.encode("Content-Encoding: aes128gcm"), [0]), 16);
  const nonce   = await hkdfExpand(prk, concat(enc.encode("Content-Encoding: nonce"), [0]), 12);
  return { cek, nonce };
}

/* RFC 8291 — tek kayitli aes128gcm */
async function encryptPayload(sub, payloadObj, recordSize = 4096){
  const uaPublic   = bytesFromB64url(sub.keys.p256dh);
  const authSecret = bytesFromB64url(sub.keys.auth);

  const asKey = await crypto.subtle.generateKey(
    { name:"ECDH", namedCurve:"P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKey.publicKey));

  const uaKey = await crypto.subtle.importKey(
    "raw", uaPublic, { name:"ECDH", namedCurve:"P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name:"ECDH", public: uaKey }, asKey.privateKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const { cek, nonce } = await deriveKeys({
    ecdhSecret, authSecret, uaPublic, asPublic, salt
  });

  const plain = concat(
    enc.encode(typeof payloadObj === "string" ? payloadObj : JSON.stringify(payloadObj)),
    [0x02]
  );
  const cekKey = await crypto.subtle.importKey("raw", cek, { name:"AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name:"AES-GCM", iv: nonce }, cekKey, plain));

  const rs = recordSize;
  const header = concat(
    salt,
    Uint8Array.of((rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255),
    Uint8Array.of(asPublic.length),
    asPublic
  );
  return concat(header, ct);
}

/* RFC 8292 — VAPID JWT. Private anahtar Worker secret'indan da okunabilir:
   Settings > Variables and Secrets > Secret adi: VAPID_PRIV */
async function vapidAuth(endpoint, env){
  const privB64 = (env && env.VAPID_PRIV) || VAPID_PRIV_B64;
  const key = await crypto.subtle.importKey(
    "pkcs8", bytesFromB64url(privB64), { name:"ECDSA", namedCurve:"P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlFromString(JSON.stringify({ typ:"JWT", alg:"ES256" }));
  const body = b64urlFromString(JSON.stringify({
    aud: new URL(endpoint).origin, exp: now + 3600, sub: VAPID_SUBJECT
  }));
  const input = head + "." + body;
  const sig = new Uint8Array(await crypto.subtle.sign(
    { name:"ECDSA", hash:"SHA-256" }, key, enc.encode(input)));
  return "vapid t=" + input + "." + b64urlFromBytes(sig) + ", k=" + VAPID_PUB_B64;
}

async function sendPush(sub, payload, env, ttl = 120){
  const body = await encryptPayload(sub, payload);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": await vapidAuth(sub.endpoint, env),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": String(ttl),
      "Urgency": "high"
    },
    body
  });
  return res.status;
}

/* ---------------- HTTP ---------------- */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
function json(obj, status = 200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);

    if(request.method === "OPTIONS"){
      return new Response(null, { status: 204, headers: CORS });
    }

    if(request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")){
      return json({ ok: true, service: "nexus-push", kv: !!env.SUBS });
    }

    if(request.method === "POST" && url.pathname === "/subscribe"){
      let d;
      try{ d = await request.json(); }catch(e){ return json({ error: "gecersiz json" }, 400); }
      if(!d || !d.uid || !d.sub || !d.sub.endpoint) return json({ error: "uid ve sub gerekli" }, 400);
      await env.SUBS.put("u:" + d.uid, JSON.stringify(d.sub));
      return json({ ok: true, uid: d.uid });
    }

    if(request.method === "POST" && url.pathname === "/notify"){
      let d;
      try{ d = await request.json(); }catch(e){ return json({ error: "gecersiz json" }, 400); }
      const payload = d && d.payload;
      if(!payload || !payload.title) return json({ error: "payload.title gerekli" }, 400);

      const to = [...new Set((d.to || []))].filter(u => u && u !== d.from).slice(0, 50);
      const results = await Promise.all(to.map(async uid => {
        const raw = await env.SUBS.get("u:" + uid);
        if(!raw) return { uid, status: "yok" };
        let sub;
        try{ sub = JSON.parse(raw); }catch(e){ await env.SUBS.delete("u:" + uid); return { uid, status: "bozuk" }; }
        try{
          const status = await sendPush(sub, payload, env);
          if(status === 404 || status === 410 || status === 413){
            await env.SUBS.delete("u:" + uid);
            return { uid, status, silindi: true };
          }
          return { uid, status };
        }catch(e){
          return { uid, hata: String((e && e.message) || e) };
        }
      }));
      return json({ ok: true, gonderilen: results.length, results });
    }

    return json({ error: "bulunamadi" }, 404);
  }
};
