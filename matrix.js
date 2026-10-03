(function(){
  "use strict";
  var cv = document.getElementById("matrixBg");
  if(!cv || !cv.getContext) return;
  var ctx = null;
  try{ ctx = cv.getContext("2d"); }catch(e){ ctx = null; }
  if(!ctx) return;

  try{
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      cv.style.display = "none";
      return;
    }
  }catch(e){}

  var GLYPHS = (
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+=<>{}[]"
  ).split("");

  var FS = 15;
  var GAP = 16;
  var FRAME_MS = 55;
  var BASE = "#0b0f14";
  var FONT = FS + "px ui-monospace, Consolas, 'MS Gothic', 'Yu Gothic', 'Courier New', monospace";

  var W = 0, H = 0, cols = 0, drops = [];
  var last = 0, rt = 0;

  function size(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var doc = document.documentElement;
    W = Math.max(1, window.innerWidth || doc.clientWidth || 800);
    H = Math.max(1, window.innerHeight || doc.clientHeight || 600);
    cv.width  = Math.max(1, Math.floor(W * dpr));
    cv.height = Math.max(1, Math.floor(H * dpr));
    cv.style.width  = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.max(1, Math.ceil(W / GAP));
    var next = new Array(cols);
    for(var i = 0; i < cols; i++){
      next[i] = (i < drops.length) ? drops[i] : -Math.floor(Math.random() * 40);
    }
    drops = next;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = BASE;
    ctx.fillRect(0, 0, W, H);
  }

  function step(){
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(11,15,20,0.10)";
    ctx.fillRect(0, 0, W, H);

    ctx.font = FONT;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    for(var i = 0; i < cols; i++){
      var y = drops[i] * FS;
      if(y > -FS && y < H){
        var r = Math.random();
        ctx.fillStyle = r > 0.97 ? "rgba(226,255,242,0.98)"
                     : (r > 0.70 ? "rgba(84,255,172,0.95)"
                                 : "rgba(24,226,132,0.92)");
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * GAP, y);
      }
      drops[i] += 1;
      if(y > H && Math.random() > 0.975) drops[i] = -Math.floor(Math.random() * 30);
    }
  }

  function loop(t){
    requestAnimationFrame(loop);
    if(document.hidden){ last = t; return; }
    if(t - last < FRAME_MS) return;
    last = t;
    try{ step(); }catch(e){}
  }

  window.addEventListener("resize", function(){
    clearTimeout(rt);
    rt = setTimeout(function(){ try{ size(); }catch(e){} }, 150);
  });
  window.addEventListener("orientationchange", function(){
    setTimeout(function(){ try{ size(); }catch(e){} }, 250);
  });

  try{ size(); }catch(e){ return; }
  requestAnimationFrame(loop);
})();
