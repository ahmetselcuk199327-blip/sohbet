/* Web Push cekirdegi — Cloudflare Worker ve Node (v19+) icin.
   RFC 8291 (aes128gcm) + RFC 8292 (VAPID). */

export const VAPID_PRIV_B64 = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg6oy3NmItmm7DBUIPVcFkS8kSiOI5x6qh6gWCY9NV_LehRANCAAS8wlBvYCut5M6LGNmawPPm1-vQtjfsz6HQ8dYo-3Eg2-9TsACH29wHszGy_pEGIUakfYoUf80eg14RVG3nwjZv";
export const VAPID_PUB_B64  = "BLzCUG9gK63kzosY2ZrA8-bX69C2N-zPodDx1ij7cSDb71OwAIfb3AezMbL-kQYhRqR9ihR_zR6DXhFUbefCNm8";
export const VAPID_SUBJECT  = "mailto:ahmetselcuk199327@gmail.com";

const enc = new TextEncoder();

export function b64urlFromBytes(bytes){
  let s = "";
  for(const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export function b64urlFromString(str){ return b64urlFromBytes(enc.encode(str)); }
export function bytesFromB64url(s){
  const pad = "=".repeat((4 - s.length % 4) % 4);
  const bin = atob(s.replace(/-/g,"+").replace(/_/g,"/") + pad);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(key, data){
  const k = await crypto.subtle.importKey("raw", key, { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}
/* RFC 5869 — WebCrypto HKDF her seferinde Extract da yaptigi icin elle uygulaniyor */
export async function hkdfExtract(salt, ikm){ return hmac(salt, ikm); }
export async function hkdfExpand(prk, info, len){
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

/* RFC 8291 / 3.4 — CEK ve NONCE uretimi */
export async function deriveKeys({ ecdhSecret, authSecret, uaPublic, asPublic, salt }){
  const prkKey  = await hkdfExtract(authSecret, ecdhSecret);
  const keyInfo = concat(enc.encode("WebPush: info"), [0], uaPublic, asPublic);
  const ikm     = await hkdfExpand(prkKey, keyInfo, 32);
  const prk     = await hkdfExtract(salt, ikm);
  const cek     = await hkdfExpand(prk, concat(enc.encode("Content-Encoding: aes128gcm"), [0]), 16);
  const nonce   = await hkdfExpand(prk, concat(enc.encode("Content-Encoding: nonce"), [0]), 12);
  return { cek, nonce };
}

export function concat(...parts){
  let n = 0;
  for(const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for(const p of parts){ out.set(p, o); o += p.length; }
  return out;
}

/* RFC 8291 — tek kayitli aes128gcm govdesi (sabit girdilerle de test edilebilir) */
export async function encryptWithKeys({ uaPublic, authSecret, asPublic, ecdhSecret, salt, payload, recordSize = 4096 }){
  const { cek, nonce } = await deriveKeys({ ecdhSecret, authSecret, uaPublic, asPublic, salt });

  const plain = concat(
    enc.encode(typeof payload === "string" ? payload : JSON.stringify(payload)),
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

export async function encryptPayload(sub, payloadObj, recordSize = 4096){
  const uaPublic = bytesFromB64url(sub.keys.p256dh);
  const authSecret = bytesFromB64url(sub.keys.auth);

  const asKey = await crypto.subtle.generateKey(
    { name:"ECDH", namedCurve:"P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKey.publicKey));

  const uaKey = await crypto.subtle.importKey(
    "raw", uaPublic, { name:"ECDH", namedCurve:"P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name:"ECDH", public: uaKey }, asKey.privateKey, 256));

  return encryptWithKeys({
    uaPublic, authSecret, asPublic, ecdhSecret,
    salt: crypto.getRandomValues(new Uint8Array(16)),
    payload: payloadObj, recordSize
  });
}

/* RFC 8292 — VAPID JWT (ES256) */
export async function vapidAuth(endpoint, privB64 = VAPID_PRIV_B64, pubB64 = VAPID_PUB_B64, subject = VAPID_SUBJECT){
  const key = await crypto.subtle.importKey(
    "pkcs8", bytesFromB64url(privB64), { name:"ECDSA", namedCurve:"P-256" }, false, ["sign"]);
  const aud = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlFromString(JSON.stringify({ typ:"JWT", alg:"ES256" }));
  const body = b64urlFromString(JSON.stringify({ aud, exp: now + 3600, sub: subject }));
  const input = head + "." + body;
  const sig = new Uint8Array(await crypto.subtle.sign(
    { name:"ECDSA", hash:"SHA-256" }, key, enc.encode(input)));
  return "vapid t=" + input + "." + b64urlFromBytes(sig) + ", k=" + pubB64;
}

/* Push servisine gonderim */
export async function sendPush(sub, payload, { ttl = 120, recordSize = 4096 } = {}){
  const body = await encryptPayload(sub, payload, recordSize);
  const auth = await vapidAuth(sub.endpoint);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": auth,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": String(ttl),
      "Urgency": "high"
    },
    body
  });
  return res.status;
}
