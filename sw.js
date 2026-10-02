self.addEventListener("install", ()=> self.skipWaiting());
self.addEventListener("activate", e=> e.waitUntil(self.clients.claim()));

self.addEventListener("push", ev=>{
  let data = {};
  try{ data = ev.data ? ev.data.json() : {}; }
  catch(err){ data = { body: ev.data ? ev.data.text() : "" }; }

  ev.waitUntil((async ()=>{
    const wins = await self.clients.matchAll({ type:"window", includeUncontrolled:true });
    if(wins.length > 0) return;
    await self.registration.showNotification(data.title || "Nexus", {
      body: data.body || "",
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: data.tag || "nexus",
      renotify: false,
      data: { url: data.url || "./" }
    });
  })());
});

self.addEventListener("notificationclick", ev=>{
  ev.notification.close();
  const url = (ev.notification.data && ev.notification.data.url) || "./";
  ev.waitUntil((async ()=>{
    const wins = await self.clients.matchAll({ type:"window", includeUncontrolled:true });
    for(const c of wins){ if(c.focus) return await c.focus(); }
    if(self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
