// Grupo 7 · colagem, mixed media, cinema e documentário.
// Cada amostra é um trecho de 6–8 s. Onde o estilo depende de foto/filmagem, a "foto" é procedural:
// luz com direção, volume (sombra própria), profundidade (desfoque/neblina), grão — sempre cacheada em sprite.
(() => {
  // ---------------------------------------------------------------- utilitários locais
  const SC = 2; // resolução dos sprites (px de dispositivo por px lógico)
  const newC = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * SC); c.height = Math.ceil(h * SC); const x = c.getContext('2d'); x.scale(SC, SC); return x; };
  const sameC = (src) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; return c.getContext('2d'); };
  const mk = (key, w, h, fn) => cached('g7:' + key, Math.ceil(w * SC), Math.ceil(h * SC), (c) => { c.scale(SC, SC); fn(c, w, h); });
  const fontsOk = (fs) => { try { return fs.every((f) => document.fonts.check(f)); } catch (e) { return true; } };
  const tmp = new Map();
  // sprite com texto: só vai para o cache quando a fonte já carregou (senão refaz a cada 0,4 s)
  function mkT(key, w, h, fs, fn) {
    if (fontsOk(fs)) return mk(key, w, h, fn);
    const b = Math.floor(performance.now() / 400); let c = tmp.get(key);
    if (!c || c._b !== b) { const x = newC(w, h); fn(x, w, h); c = x.canvas; c._b = b; tmp.set(key, c); }
    return c;
  }
  const put = (g, s, x, y) => g.drawImage(s, x, y, s.width / SC, s.height / SC);
  const putC = (g, s, x, y, k = 1) => { const w = s.width / SC * k, h = s.height / SC * k; g.drawImage(s, x - w / 2, y - h / 2, w, h); };
  const FL = [font(900, 40, F.didone), font(700, 30, F.didone), `italic 700 20px ${F.didone}`, font(400, 20, F.serif), font(700, 20, F.serif), font(900, 20, F.serif),
    `italic 400 20px ${F.serif}`, font(400, 20, F.slab), font(400, 20, F.cond), font(400, 20, F.mono), font(600, 20, F.mono), font(700, 20, F.hand), font(400, 20, F.marker),
    font(800, 20, F.grot), font(900, 20, F.grot), font(600, 20, F.grot), font(700, 20, F.body), font(500, 20, F.body), font(800, 20, F.display)];
  try { FL.forEach((f) => document.fonts.load(f)); } catch (e) { /* sem FontFaceSet */ }

  const cl8 = (v) => Math.max(0, Math.min(255, v)) | 0;
  const C = (a, k = 1, al = 1) => `rgba(${cl8(a[0] * k)},${cl8(a[1] * k)},${cl8(a[2] * k)},${al})`;
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const seg = (u, a, b) => clamp((u - a) / (b - a));
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function blob(c, x, y, rx, ry, col, a = 1) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx); const gr = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, C(col, 1, a)); gr.addColorStop(1, C(col, 1, 0)); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  }
  // operações de sprite (só na criação do cache)
  function tint(src, col) { const x = sameC(src); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, src.width, src.height); return x.canvas; }
  function outline(src, r, col) {
    const x = sameC(src), R = r * SC;
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; x.drawImage(src, Math.cos(a) * R, Math.sin(a) * R); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .26; x.drawImage(src, Math.cos(a) * R * .55, Math.sin(a) * R * .55); }
    x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, src.width, src.height);
    x.globalCompositeOperation = 'source-over'; x.drawImage(src, 0, 0); return x.canvas;
  }
  function withShadow(src, dx, dy, blur, a, col = '#000') {
    const x = sameC(src); x.filter = `blur(${blur * SC}px)`; x.globalAlpha = a; x.drawImage(tint(src, col), dx * SC, dy * SC);
    x.filter = 'none'; x.globalAlpha = 1; x.drawImage(src, 0, 0); return x.canvas;
  }
  function blurC(src, b) { const x = sameC(src); x.filter = `blur(${b * SC}px)`; x.drawImage(src, 0, 0); x.filter = 'none'; return x.canvas; }
  function filt(src, f) { const x = sameC(src); x.filter = f; x.drawImage(src, 0, 0); x.filter = 'none'; return x.canvas; }
  function grainOn(src, a = .08, seed = 5) {
    const x = src.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a;
    const n = noiseTile(seed); for (let i = 0; i < src.width; i += 256) for (let j = 0; j < src.height; j += 256) x.drawImage(n, i, j);
    x.restore(); return src;
  }
  // luz de recorte: faixa clara na borda do lado da luz (dx>0 → borda esquerda)
  function rimLight(src, dx, col, blur = .7) {
    const e = sameC(src); e.drawImage(tint(src, col), 0, 0); e.globalCompositeOperation = 'destination-out'; e.drawImage(src, dx * SC, dx * SC * .3);
    const x = sameC(src); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.filter = `blur(${blur * SC}px)`; x.drawImage(e.canvas, 0, 0); x.filter = 'none'; return x.canvas;
  }
  function clipPoly(src, pts) { const x = sameC(src); x.save(); x.scale(SC, SC); poly(x, pts); x.clip(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(src, 0, 0); x.restore(); return x.canvas; }
  // meio-tom (pontos girados 45°) a partir da luminância; só onde a origem tem alfa
  function halftone(src, step, ink, base, gam = 1, rmul = .62, ang = .7854) {
    const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, x = sameC(src);
    if (base) x.drawImage(tint(src, base), 0, 0);
    x.fillStyle = ink; const st = step * SC, ca = Math.cos(ang), sa = Math.sin(ang), R = Math.hypot(w, h) / 2 + st;
    for (let v = -R; v <= R; v += st) for (let q = -R; q <= R; q += st) {
      const px = q * ca - v * sa + w / 2, py = q * sa + v * ca + h / 2; if (px < 0 || py < 0 || px >= w || py >= h) continue;
      const i = ((py | 0) * w + (px | 0)) * 4; if (d[i + 3] < 100) continue;
      const lum = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, r0 = Math.sqrt(Math.max(0, 1 - Math.pow(lum, gam))) * st * rmul;
      if (r0 > .45) { x.beginPath(); x.arc(px, py, r0, 0, TAU); x.fill(); }
    }
    return x.canvas;
  }
  // limiar de fotocópia (preto/papel) com ruído
  function thresh(src, thr, amp, seed, ink = [20, 19, 18], pap = [233, 230, 222]) {
    const x = sameC(src); x.drawImage(src, 0, 0); const im = x.getImageData(0, 0, src.width, src.height), a = im.data, r = rng(seed);
    for (let i = 0; i < a.length; i += 4) { const v = a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11 + (r() - .5) * amp; const c = v > thr ? pap : ink; a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = 255; }
    x.putImageData(im, 0, 0); return x.canvas;
  }
  // traço de caneta com tremor (boil) e revelação progressiva
  function doodle(g, pts, k, col, lw, f, amp = .9) {
    if (k <= 0) return; const r = rng(f * 7 + pts.length * 13);
    const P = pts.map(([x, y]) => [x + (r() - .5) * amp, y + (r() - .5) * amp]); let L = 0;
    for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; if (k < 1) g.setLineDash([L * k, L + 20]);
    g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
  }
  const ellPts = (cx, cy, rx, ry, turns = 1.15, a0 = -2.2, wob = .06, seed = 1) => { const r = rng(seed), n = 48, P = []; for (let i = 0; i <= n; i++) { const a = a0 + i / n * turns * TAU, k = 1 + (r() - .5) * wob + i / n * .06; P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return P; };
  function tornPath(c, x, y, w, h, r, j = 3.5, step = 7) {
    c.beginPath(); const nx = Math.max(2, Math.round(w / step)), ny = Math.max(2, Math.round(h / step));
    for (let i = 0; i < nx; i++) c.lineTo(x + w * i / nx, y + r() * j);
    for (let i = 0; i < ny; i++) c.lineTo(x + w - r() * j, y + h * i / ny);
    for (let i = 0; i < nx; i++) c.lineTo(x + w - w * i / nx, y + h - r() * j);
    for (let i = 0; i < ny; i++) c.lineTo(x + r() * j, y + h - h * i / ny);
    c.closePath();
  }
  // papel rasgado: miolo branco fibroso por baixo + face impressa
  function tornScrap(c, x, y, w, h, seed, face, sh = .35) {
    c.save(); if (sh) { c.shadowColor = `rgba(40,25,10,${sh})`; c.shadowBlur = 4 * SC; c.shadowOffsetX = 2 * SC; c.shadowOffsetY = 3 * SC; }
    tornPath(c, x - 2.5, y - 2.5, w + 5, h + 5, rng(seed), 5.5, 4.5); c.fillStyle = '#F7F2E7'; c.fill(); c.restore();
    c.save(); tornPath(c, x, y, w, h, rng(seed + 1), 4, 6); c.clip(); face(c); c.restore();
  }

  // texturas de tela inteira desenhadas 1:1 (degradê e escala em tela cheia custam ~1 ms cada na bancada)
  const grainTex = () => cached('g7:grain', 1200, 720, (c, w, h) => {
    const s = document.createElement('canvas'); s.width = 480; s.height = 288; const sx = s.getContext('2d'), d = sx.createImageData(480, 288), r = rng(99);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    sx.putImageData(d, 0, 0); c.drawImage(s, 0, 0, w, h);
    const im = c.getImageData(0, 0, w, h), a = im.data, r2 = rng(7);
    for (let i = 0; i < a.length; i += 4) { const v = (a[i] - 128) * 1.7 + (r2() - .5) * 110, on = v > 0; a[i] = a[i + 1] = a[i + 2] = on ? 255 : 0; a[i + 3] = Math.min(255, Math.abs(v) * 1.4); }
    c.putImageData(im, 0, 0);
  });
  function GR(g, t, a, fps = 24) { const T = grainTex(), r = rng(Math.floor(t * fps) * 13 + 5); g.save(); g.globalAlpha = a; g.drawImage(T, -Math.floor(r() * 60), -Math.floor(r() * 45), 600, 360); g.restore(); }
  const VIG = (g, a) => g.drawImage(mk('vig' + a, 480, 270, (c, w, h) => vignette(c, w, h, a)), 0, 0, 480, 270);
  const PAP = (g, tone, seed) => g.drawImage(mk('pap' + tone + seed, 480, 270, (c, w, h) => paper(c, w, h, tone, seed)), 0, 0, 480, 270);

  // ---------------------------------------------------------------- pessoas com volume
  // Sistema do busto: base do pescoço em (0,0); cabeça ~50 de altura (topo -68, queixo -18); ombros ±50.
  function hairMale(c, hair, L) {
    c.beginPath(); c.moveTo(-20.5, -40); c.bezierCurveTo(-23.5, -63, -11, -75, 2, -74); c.bezierCurveTo(16, -73, 25, -62, 20.5, -40);
    c.bezierCurveTo(19.5, -49, 17, -56, 11, -58.5); c.bezierCurveTo(4, -61, -8, -60.5, -14, -57); c.bezierCurveTo(-18, -53, -19, -47, -20.5, -40); c.closePath();
    c.fillStyle = rad(c, L * 9, -70, 1, 28, [[0, C(hair, 2.1)], [.45, C(hair, 1)], [1, C(hair, .55)]]); c.fill();
  }
  function hairFem(c, hair, L, back) {
    if (back) {
      c.fillStyle = rad(c, L * 6, -50, 4, 38, [[0, C(hair, 1.1)], [1, C(hair, .5)]]);
      c.beginPath(); c.moveTo(-19, -62); c.bezierCurveTo(-32, -46, -30, -20, -23, -11); c.quadraticCurveTo(-16, -8, -11.5, -16); c.lineTo(11.5, -16);
      c.quadraticCurveTo(16, -8, 23, -11); c.bezierCurveTo(30, -20, 32, -46, 19, -62); c.closePath(); c.fill(); return;
    }
    c.beginPath(); c.moveTo(-22.5, -26); c.bezierCurveTo(-27, -62, -12, -77, 2, -76); c.bezierCurveTo(19, -75, 28, -60, 22.5, -26);
    c.bezierCurveTo(21, -40, 19.5, -50, 14, -57); c.bezierCurveTo(7, -63, -7, -58, -13, -52); c.bezierCurveTo(-17, -46, -19.5, -37, -22.5, -26); c.closePath();
    c.fillStyle = rad(c, L * 10, -70, 1, 36, [[0, C(hair, 2.2)], [.4, C(hair, 1.05)], [1, C(hair, .5)]]); c.fill();
    c.strokeStyle = C(hair, 2.4, .35); c.lineWidth = .9; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(L * (4 + i * 3), -73 + i); c.quadraticCurveTo(L * (16 + i * 2), -62, L * (19 + i), -40 + i * 3); c.stroke(); }
  }
  function hatOn(c, col, L, kind = 'bowler') {
    const sl = Math.sign(L) || -1, g2 = lin(c, -40, 0, 40, 0, [[0, C(col, sl < 0 ? 1.55 : .6)], [1, C(col, sl < 0 ? .6 : 1.55)]]);
    c.fillStyle = g2;
    if (kind === 'wide') { c.beginPath(); c.ellipse(0, -60, 42, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-19, -61); c.bezierCurveTo(-20, -78, -11, -84, 0, -84); c.bezierCurveTo(11, -84, 20, -78, 19, -61); c.closePath(); c.fill(); c.fillStyle = C(col, .5); c.fillRect(-19.3, -67, 38.6, 5); return; }
    c.beginPath(); c.ellipse(0, -61, 29, 5.5, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-18, -62); c.bezierCurveTo(-19, -80, -10, -88, 0, -88); c.bezierCurveTo(10, -88, 19, -80, 18, -62); c.closePath(); c.fill();
    c.fillStyle = C(col, .42); c.fillRect(-18.2, -67, 36.4, 4.5); blob(c, sl * 7, -80, 6, 4, mul(col, 2.4), .5);
  }
  function head(c, o) {
    const { L = -1, skin = [214, 160, 128], hair = [40, 28, 22], iris = [58, 42, 32], fem = false, statue = false, hat = null, hatKind = 'bowler' } = o;
    const sl = Math.sign(L) || -1;
    const hp = () => { c.beginPath(); c.moveTo(0, -68); c.bezierCurveTo(13, -68, 20, -58, 20, -46); c.bezierCurveTo(20, -34, 15, -24, 7, -20); c.quadraticCurveTo(0, -17, -7, -20); c.bezierCurveTo(-15, -24, -20, -34, -20, -46); c.bezierCurveTo(-20, -58, -13, -68, 0, -68); c.closePath(); };
    if (fem && !statue) hairFem(c, hair, L, true);
    for (const sd of [-1, 1]) { const lit = sd === sl; c.fillStyle = C(skin, lit ? .98 : .55); c.beginPath(); c.ellipse(sd * 19.2, -44, 3.8, 6.8, sd * .12, 0, TAU); c.fill(); }
    hp(); c.fillStyle = rad(c, L * 7, -55, 2, 36, [[0, C(skin, 1.17)], [.5, C(skin, .98)], [1, C(skin, .58)]]); c.fill();
    c.save(); hp(); c.clip();
    c.fillStyle = lin(c, L * 12, 0, -L * 22, 0, [[0, 'rgba(25,12,6,0)'], [1, 'rgba(25,12,6,.45)']]); c.fillRect(-24, -72, 48, 58);
    for (const sd of [-1, 1]) blob(c, sd * 7.6, -46.2, 7, 4.6, mul(skin, .45), .55);
    blob(c, -L * 2.6, -40.5, 2.6, 6.8, mul(skin, .42), .5);
    blob(c, L * .9, -37.2, 2.4, 2.1, mul(skin, 1.4), .45);
    blob(c, 0, -34.3, 3.8, 1.4, mul(skin, .3), .6);
    blob(c, L * 10.5, -38, 5.5, 4.5, mul(skin, 1.3), .22);
    blob(c, 0, -21.5, 6, 2.5, mul(skin, 1.25), .18);
    if (hat) blob(c, 0, -58, 24, 8, [20, 12, 8], .55);
    c.restore();
    c.lineCap = 'round';
    c.strokeStyle = C(mix(skin, [110, 40, 38], statue ? 0 : .45), .62); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-5.6, -28.6); c.quadraticCurveTo(0, -27.3, 5.6, -28.6); c.stroke();
    blob(c, 0, -26.4, 4.4, 1.5, mul(skin, 1.3), .3); blob(c, 0, -23.9, 4.2, 1.5, mul(skin, .45), .3);
    for (const sd of [-1, 1]) {
      const ex = sd * 7.6 + L * .5, ey = -46.3, lit = sd === sl;
      if (statue) { blob(c, ex, ey + .4, 3.9, 2.5, mul(skin, 1.14), .8); c.strokeStyle = C(skin, .5, .7); c.lineWidth = 1; c.beginPath(); c.moveTo(ex - 3.8, ey - .8); c.quadraticCurveTo(ex, ey - 3.3, ex + 3.8, ey - .8); c.stroke(); }
      else {
        c.fillStyle = C([236, 230, 222], lit ? .92 : .66); c.beginPath(); c.ellipse(ex, ey, 3.4, 1.6, 0, 0, TAU); c.fill();
        c.fillStyle = C(iris); c.beginPath(); c.arc(ex + L * .4, ey, 1.55, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(ex + L * .9, ey - .5, .5, 0, TAU); c.fill();
        c.strokeStyle = C(hair, .6, .9); c.lineWidth = 1.1; c.beginPath(); c.moveTo(ex - 3.8, ey - .1); c.quadraticCurveTo(ex, ey - 2.6, ex + 3.8, ey - .1); c.stroke();
      }
      c.strokeStyle = statue ? C(skin, .62, .8) : C(hair, 1.1, .92); c.lineWidth = statue ? 1.5 : 1.9; c.beginPath(); c.moveTo(sd * 3.2, -51.2); c.quadraticCurveTo(sd * 7.6, -54.2, sd * 12, -51.8); c.stroke();
    }
    if (!statue) { if (fem) hairFem(c, hair, L, false); else hairMale(c, hair, L); }
    if (hat) hatOn(c, hat, L, hatKind);
  }
  function neck(c, skin, L) {
    const np = () => { c.beginPath(); c.moveTo(-9, -27); c.lineTo(-10, -1); c.quadraticCurveTo(0, 4, 10, -1); c.lineTo(9, -27); c.closePath(); };
    np(); c.fillStyle = lin(c, -10, 0, 10, 0, [[0, C(skin, L < 0 ? 1.02 : .55)], [1, C(skin, L < 0 ? .55 : 1.02)]]); c.fill();
    c.save(); np(); c.clip(); blob(c, 0, -19, 13, 8, [30, 15, 10], .5); c.restore();
  }
  function torso(c, o) {
    const { L = -1, cloth = [58, 66, 84], shirt = [232, 228, 220], tie = null, top = 'suit', skin = [214, 160, 128] } = o;
    const sl = Math.sign(L) || -1, lk = (sd) => (sd === sl ? 1.22 : .56);
    const tp = () => { c.beginPath(); c.moveTo(-11, -3); c.bezierCurveTo(-26, 0, -45, 3, -51, 17); c.bezierCurveTo(-57, 32, -59, 70, -61, 125); c.lineTo(61, 125); c.bezierCurveTo(59, 70, 57, 32, 51, 17); c.bezierCurveTo(45, 3, 26, 0, 11, -3); c.closePath(); };
    tp(); c.fillStyle = lin(c, -58, 0, 58, 0, [[0, C(cloth, lk(-1))], [.45, C(cloth, 1)], [1, C(cloth, lk(1))]]); c.fill();
    c.save(); tp(); c.clip();
    c.fillStyle = lin(c, 0, 0, 0, 90, [[0, 'rgba(255,255,255,.10)'], [1, 'rgba(0,0,0,.22)']]); c.fillRect(-65, -5, 130, 132);
    if (top === 'suit') {
      c.fillStyle = lin(c, 0, -3, 0, 40, [[0, C(shirt, .78)], [1, C(shirt, 1)]]); c.beginPath(); c.moveTo(-11, -4); c.lineTo(11, -4); c.lineTo(0, 46); c.closePath(); c.fill();
      if (tie) { c.fillStyle = C(tie); c.beginPath(); c.moveTo(-3.5, 2); c.lineTo(3.5, 2); c.lineTo(5.5, 38); c.lineTo(0, 46); c.lineTo(-5.5, 38); c.closePath(); c.fill(); c.fillStyle = C(tie, .7); c.beginPath(); c.moveTo(-4.5, -3); c.lineTo(4.5, -3); c.lineTo(3.2, 3); c.lineTo(-3.2, 3); c.closePath(); c.fill(); }
      for (const sd of [-1, 1]) { c.fillStyle = C(cloth, sd === sl ? 1.1 : .48); c.beginPath(); c.moveTo(sd * 11, -4); c.lineTo(sd * 21, 2); c.lineTo(sd * 14, 19); c.lineTo(sd * 19, 23); c.lineTo(sd * 1.5, 52); c.lineTo(sd * 2.5, 44); c.closePath(); c.fill(); }
    } else if (top === 'sweater') {
      c.fillStyle = C(cloth, .7); c.beginPath(); c.ellipse(0, -1.5, 15, 6.5, 0, 0, TAU); c.fill();
      c.fillStyle = lin(c, 0, -6, 0, 4, [[0, C(skin, .7)], [1, C(skin, .95)]]); c.beginPath(); c.ellipse(0, -2.8, 10.5, 4, 0, 0, TAU); c.fill();
      c.strokeStyle = C(cloth, .72, .55); c.lineWidth = 2.2; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 8, 30); c.quadraticCurveTo(sd * 20, 50, sd * 16, 80); c.stroke(); }
    } else if (top === 'shirt') {
      c.fillStyle = C(cloth, 1.15); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 10, -5); c.lineTo(sd * 22, 4); c.lineTo(sd * 6, 16); c.closePath(); c.fill(); }
      c.fillStyle = C(skin, .8); c.beginPath(); c.moveTo(-9, -4); c.lineTo(9, -4); c.lineTo(0, 14); c.closePath(); c.fill();
      c.strokeStyle = C(cloth, .55, .7); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 14); c.lineTo(0, 125); c.stroke();
    }
    for (const sd of [-1, 1]) { c.strokeStyle = C(cloth, .5, .55); c.lineWidth = 3; c.beginPath(); c.moveTo(sd * 45, 30); c.quadraticCurveTo(sd * 40, 70, sd * 42, 125); c.stroke(); }
    c.restore();
  }
  function bust(c, o) {
    const { x = 0, y = 0, s = 1, rot = 0, parts = 'all', skin = [214, 160, 128], L = -1 } = o;
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    if (parts !== 'head') { torso(c, o); neck(c, skin, L); }
    if (parts !== 'body') { c.save(); c.translate(0, o.hy ?? 3); head(c, o); c.restore(); }
    c.restore();
  }
  // figura inteira pequena (andando): pés em (x,y)
  function walker(c, x, y, h, ph, o = {}) {
    const { dir = 1, coat = [70, 64, 58], skin = [190, 170, 150], hat = true, skirt = false, L = 1 } = o;
    const s = h / 112, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 1.6;
    c.save(); c.translate(x, y - bob * s); c.scale(s * dir, s); c.lineCap = 'round';
    const lo = C(coat, .55), hi = C(coat, 1.3), ll = L * dir;
    if (!skirt) { c.strokeStyle = C(coat, .45); c.lineWidth = 8; c.beginPath(); c.moveTo(-3, -48); c.lineTo(-3 + sw * 13, -3); c.moveTo(3, -48); c.lineTo(3 - sw * 13, -3); c.stroke(); c.fillStyle = C(coat, .28); c.fillRect(-6 + sw * 13, -5, 11, 5); c.fillRect(-2 - sw * 13, -5, 11, 5); }
    else { c.fillStyle = C(coat, .3); c.fillRect(-9 + sw * 5, -5, 9, 5); c.fillRect(1 - sw * 5, -5, 9, 5); }
    c.strokeStyle = C(coat, .6); c.lineWidth = 7; c.beginPath(); c.moveTo(0, -80); c.lineTo(-sw * 12, -50); c.stroke();
    c.fillStyle = lin(c, -16, 0, 16, 0, [[0, ll < 0 ? hi : lo], [1, ll < 0 ? lo : hi]]);
    c.beginPath(); c.moveTo(-9, -86); c.quadraticCurveTo(-15, -84, -15, -76); c.lineTo(skirt ? -21 + sw * 3 : -16, skirt ? -4 : -40); c.lineTo(skirt ? 21 + sw * 3 : 16, skirt ? -4 : -40); c.lineTo(15, -76); c.quadraticCurveTo(15, -84, 9, -86); c.closePath(); c.fill();
    c.strokeStyle = C(coat, 1.05); c.lineWidth = 7; c.beginPath(); c.moveTo(2, -80); c.lineTo(2 + sw * 12, -50); c.stroke();
    c.fillStyle = rad(c, ll * 2.5, -96, 1, 9, [[0, C(skin, 1.15)], [1, C(skin, .6)]]); c.beginPath(); c.arc(0, -94, 7.5, 0, TAU); c.fill();
    if (hat) { c.fillStyle = C(coat, .32); c.beginPath(); c.ellipse(0, -99, skirt ? 13 : 11.5, 2.6, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-7, -99); c.lineTo(-6, -109); c.quadraticCurveTo(0, -111, 6, -109); c.lineTo(7, -99); c.fill(); }
    c.restore();
  }

  // ================================================================ 1. COLAGEM
  const MARBLE = [228, 222, 210];
  function curl(c, x, y, r) {
    const M = MARBLE; c.fillStyle = C(M, .45); c.beginPath(); c.arc(x + .9, y + 1.1, r, 0, TAU); c.fill();
    c.fillStyle = rad(c, x - r * .35, y - r * .4, r * .1, r * 1.1, [[0, C(M, 1.18)], [.6, C(M, .9)], [1, C(M, .6)]]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = C(M, .5, .65); c.lineWidth = .9; c.beginPath(); c.arc(x + .3, y + .2, r * .5, .5, 4.2); c.stroke();
  }
  function statueRaw() {
    const c = newC(200, 250), M = MARBLE, sh = (k, a = 1) => C(M, k, a);
    c.save(); c.translate(100, 125); c.scale(1.35, 1.35);
    c.fillStyle = lin(c, -27, 0, 27, 0, [[0, sh(1.08)], [.45, sh(.92)], [1, sh(.52)]]);
    c.fillRect(-8, 60, 16, 14); c.beginPath(); c.ellipse(0, 88, 27, 5.5, 0, 0, TAU); c.fill(); c.fillRect(-27, 77, 54, 11);
    c.fillStyle = sh(1.1); c.beginPath(); c.ellipse(0, 77, 27, 5.5, 0, 0, TAU); c.fill();
    const chest = () => { c.beginPath(); c.moveTo(-10, -3); c.bezierCurveTo(-26, 0, -44, 3, -49, 15); c.bezierCurveTo(-54, 30, -48, 52, -22, 63); c.quadraticCurveTo(0, 69, 22, 63); c.bezierCurveTo(48, 52, 54, 30, 49, 15); c.bezierCurveTo(44, 3, 26, 0, 10, -3); c.closePath(); };
    chest(); c.fillStyle = rad(c, -18, 8, 4, 72, [[0, sh(1.16)], [.6, sh(.94)], [1, sh(.58)]]); c.fill();
    c.save(); chest(); c.clip();
    for (let i = 0; i < 6; i++) { const y0 = 6 + i * 9; c.strokeStyle = sh(.6, .38); c.lineWidth = 3.2; c.beginPath(); c.moveTo(-50, y0 + 10); c.bezierCurveTo(-20, y0 + 18, 10, y0 - 6, 52, y0 - 18); c.stroke(); c.strokeStyle = sh(1.25, .5); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-50, y0 + 6); c.bezierCurveTo(-20, y0 + 14, 10, y0 - 10, 52, y0 - 22); c.stroke(); }
    c.fillStyle = lin(c, 0, 20, 0, 68, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(30,25,20,.3)']]); c.fillRect(-60, 0, 120, 70);
    c.restore();
    neck(c, M, -1);
    for (let i = 0; i < 9; i++) { const a = Math.PI + .15 + i * .36; curl(c, Math.cos(a) * 22, -47 + Math.sin(a) * 25, 6.6); }
    head(c, { L: -1, skin: M, statue: true });
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9 - row; i++) { const a = Math.PI + .28 + (i + row * .5) * (Math.PI - .56) / (8 - row); curl(c, Math.cos(a) * (19 - row * 6), -50 + Math.sin(a) * (23 - row * 6) - row, 5.4 - row * .5); }
    for (let i = 0; i < 9; i++) { const a = .22 + i * (Math.PI - .44) / 8, x = Math.cos(a) * 17.5, y = -38 + Math.sin(a) * 19; curl(c, x, y, 4.4); }
    for (const sd of [-1, 1]) { c.strokeStyle = C(M, .62); c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(sd * 1, -31.5); c.quadraticCurveTo(sd * 5, -32.5, sd * 8, -28.5); c.stroke(); }
    c.restore();
    // veios do mármore (só sobre o busto)
    c.save(); c.globalCompositeOperation = 'source-atop'; const r = rng(3); c.strokeStyle = 'rgba(90,85,80,.16)'; c.lineWidth = .7;
    for (let i = 0; i < 7; i++) { let x = 40 + r() * 120, y = 20 + r() * 200; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .3) * 18; y += (r() - .5) * 14; c.lineTo(x, y); } c.stroke(); }
    c.restore();
    return c.canvas;
  }
  const CUT = [[0, 49], [200, 38]];
  let colP = null;
  function colParts() {
    if (colP) return colP;
    const photo = grainOn(filt(statueRaw(), 'grayscale(1) sepia(.3) contrast(1.15)'), .08, 21);
    const full = outline(photo, 4.5, '#FBF8F0');
    const top = [[0, 0], [200, 0], CUT[1], CUT[0]], bot = [CUT[0], CUT[1], [200, 250], [0, 250]];
    colP = { base: withShadow(clipPoly(full, bot), 3, 5, 3, .4), lid: withShadow(clipPoly(full, top), 3, 5, 3, .4) };
    return colP;
  }
  // assa rotação num sprite maior (desenhar rotacionado em tela cheia custa caro)
  const baked = (key, w, h, rot, fn) => mk(key, w + 24, h + 24, (c) => { const x = newC(w, h); fn(x, w, h); c.translate(w / 2 + 12, h / 2 + 12); c.rotate(rot); c.drawImage(x.canvas, -w / 2, -h / 2, w, h); });
  const colSky = () => baked('col-sky', 290, 196, -.04, (c) => tornScrap(c, 12, 12, 264, 170, 5, (c) => {
    c.fillStyle = lin(c, 0, 10, 0, 185, [[0, '#46749F'], [.7, '#9FBFD2'], [1, '#C9DCE3']]); c.fillRect(0, 0, 290, 196);
    const r = rng(8); for (let i = 0; i < 10; i++) blob(c, 26 + r() * 240, 96 + r() * 80, 36 + r() * 40, 14 + r() * 12, [250, 250, 244], .9);
    blob(c, 70, 60, 50, 18, [240, 244, 246], .5);
    c.fillStyle = 'rgba(16,36,76,.2)'; for (let y = 14; y < 184; y += 4) for (let x = 14 + (y / 4 % 2) * 2; x < 278; x += 4) { c.beginPath(); c.arc(x, y, .5 + (1 - y / 196) * .9, 0, TAU); c.fill(); }
  }));
  const colRed = () => baked('col-red', 330, 74, -.08, (c) => tornScrap(c, 10, 12, 310, 50, 12, (c) => {
    c.fillStyle = '#C63A2D'; c.fillRect(0, 0, 330, 74); const r = rng(2); c.fillStyle = 'rgba(255,220,200,.12)'; for (let i = 0; i < 160; i++) c.fillRect(r() * 330, r() * 74, 2 + r() * 5, .8);
  }));
  const colNews = () => baked('col-news', 200, 120, .06, (c) => tornScrap(c, 10, 10, 180, 100, 33, (c) => {
    c.fillStyle = '#E6DFCD'; c.fillRect(0, 0, 200, 120); c.fillStyle = 'rgba(30,30,30,.75)'; c.fillRect(18, 18, 120, 9);
    const r = rng(6); c.fillStyle = 'rgba(40,40,40,.35)'; for (let col = 0; col < 3; col++) for (let y = 36; y < 108; y += 5) c.fillRect(18 + col * 56, y, 44 + (r() - .5) * 10, 2);
  }));
  const colSun = () => mk('col-sun', 120, 120, (c) => {
    c.save(); c.translate(60, 60); const r = rng(40); c.shadowColor = 'rgba(40,25,10,.35)'; c.shadowBlur = 3 * SC; c.shadowOffsetX = 2 * SC; c.shadowOffsetY = 3 * SC;
    c.fillStyle = '#F7F2E7'; c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, R = i % 2 ? 36 : 54; c.lineTo(Math.cos(a) * (R + 2), Math.sin(a) * (R + 2)); } c.closePath(); c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = '#EBA42A'; c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, R = (i % 2 ? 34 : 51) + r() * 2; c.lineTo(Math.cos(a) * R, Math.sin(a) * R); } c.closePath(); c.fill();
    c.fillStyle = '#F4C542'; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill(); c.restore();
  });
  const colSheet = () => mkT('col-sheet', 600, 300, [font(900, 110, F.didone), font(400, 16, F.slab)], (c) => tornScrap(c, 20, -20, 560, 340, 71, (c) => {
    c.fillStyle = lin(c, 0, 0, 600, 0, [[0, '#9C7F55'], [1, '#B59872']]); c.fillRect(0, -30, 600, 360);
    const r = rng(5); c.strokeStyle = 'rgba(60,40,20,.14)'; c.lineWidth = .8; for (let i = 0; i < 220; i++) { const x = r() * 600, y = r() * 300; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4 + r() * 10, y + (r() - .5) * 3); c.stroke(); }
    c.save(); c.translate(300, 150); c.rotate(-.05); c.fillStyle = '#F7F2E7'; c.beginPath(); for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, R0 = 72 + (i % 3) * 2; c.lineTo(46 + Math.cos(a) * R0, -22 + Math.sin(a) * R0); } c.fill(); c.fillStyle = '#E3A72F'; c.beginPath(); c.arc(46, -22, 68, 0, TAU); c.fill(); c.fillStyle = '#C63A2D'; c.fillRect(-150, 30, 300, 26);
    type(c, 'Nº 8', -10, -18, { f: font(900, 110, F.didone), fill: '#1B1712' }); type(c, 'VIRE A PÁGINA', 0, 44, { f: font(400, 16, F.slab), fill: '#F6EFE2', track: 4 }); c.restore();
  }, .5));
  const colTape = () => mk('col-tape', 84, 30, (c) => {
    c.beginPath(); c.moveTo(8, 7); for (let i = 0; i <= 6; i++) c.lineTo(76 + (i % 2 ? 2.5 : -1), 7 + i * 16 / 6); for (let i = 6; i >= 0; i--) c.lineTo(8 + (i % 2 ? -2.5 : 1), 7 + i * 16 / 6); c.closePath();
    c.fillStyle = 'rgba(238,230,204,.7)'; c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(9, 9, 66, 3); c.strokeStyle = 'rgba(120,100,70,.2)'; c.lineWidth = .6; c.stroke();
  });
  const RS = [['#F2EDE1', '#161616', 900, F.didone, 36], ['#D23A2C', '#F8F2E6', 400, F.slab, 30], ['#1A1A1A', '#F2E6CC', 400, F.cond, 42], ['#EFC23A', '#171717', 900, F.serif, 34], ['#F2EDE1', '#B8262B', 900, F.grot, 34], ['#2F5FA6', '#FFFFFF', 400, F.slab, 30], ['#E9E1CF', '#1C1C1C', 700, F.didone, 38]];
  function tile(ch, k) {
    const [bgc, fg, wt, fam, px] = RS[k % RS.length], ff = font(wt, px, fam);
    return mkT('col-rt' + ch + k, 52, 58, [ff], (c) => {
      const r = rng(ch.charCodeAt(0) * 13 + k * 7), q = [[8 + r() * 4, 7 + r() * 5], [44 - r() * 4, 6 + r() * 4], [45 - r() * 3, 50 - r() * 5], [7 + r() * 4, 51 - r() * 3]];
      c.save(); c.shadowColor = 'rgba(40,25,10,.42)'; c.shadowBlur = 2.5 * SC; c.shadowOffsetX = 1.5 * SC; c.shadowOffsetY = 2.5 * SC; poly(c, q); c.fillStyle = bgc; c.fill(); c.restore();
      if (bgc[1] === 'F' || bgc[1] === 'E') { c.save(); poly(c, q); c.clip(); c.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 9; y < 52; y += 4) c.fillRect(0, y, 52, 1.3); c.restore(); }
      type(c, ch, 26, 30, { f: ff, fill: fg });
    });
  }
  const colCap = () => mkT('col-cap', 214, 40, [`italic 400 16px ${F.serif}`], (c) => tornScrap(c, 8, 8, 198, 26, 90, (c) => {
    c.fillStyle = '#F4EFE4'; c.fillRect(0, 0, 214, 40); type(c, 'pensamentos à solta · nº 7', 107, 21.5, { f: `italic 400 16px ${F.serif}`, fill: '#2A2622' });
  }, .3));
  function bird(g, x, y, s, up, cb, cw, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineJoin = 'round';
    const body = () => { g.beginPath(); g.moveTo(-17, 1); g.quadraticCurveTo(-6, -10, 9, -6); g.quadraticCurveTo(14, -9, 18, -5); g.lineTo(25, -3); g.lineTo(17, -.5); g.quadraticCurveTo(8, 9, -17, 1); g.closePath(); g.moveTo(-15, 0); g.lineTo(-28, -8); g.lineTo(-25, 6); g.closePath(); };
    const wing = () => { g.beginPath(); g.moveTo(-7, -3); g.lineTo(9, -4); g.lineTo(up ? -9 : -3, up ? -25 : 17); g.closePath(); };
    g.save(); g.translate(3, 5); g.fillStyle = 'rgba(40,25,10,.25)'; body(); g.fill(); wing(); g.fill(); g.restore();
    g.strokeStyle = '#FBF8F0'; g.lineWidth = 6; body(); g.stroke(); wing(); g.stroke();
    g.fillStyle = cb; body(); g.fill(); g.fillStyle = cw; wing(); g.fill();
    g.fillStyle = '#161616'; g.beginPath(); g.arc(12, -4.5, 1.5, 0, TAU); g.fill(); g.restore();
  }
  R['colagem'] = (g, t, W, H) => {
    const f = Math.floor(t * 10), u = (f / 10) % 8;
    const J = (i, a = 1) => { const r = rng(f * 131 + i * 17 + 3); return [(r() - .5) * 1.6 * a, (r() - .5) * 1.6 * a, (r() - .5) * .02 * a]; };
    const at = (s, x, y, rot, i, a = 1, k = 1) => { const [jx, jy, jr] = J(i, a), w = s.width / SC, h = s.height / SC; g.save(); g.translate(x + jx, y + jy); g.rotate(rot + jr); g.scale(k, k); g.drawImage(s, -w / 2, -h / 2, w, h); g.restore(); };
    const atT = (s, x, y, i, a = 1) => { const [jx, jy] = J(i, a), w = s.width / SC, h = s.height / SC; g.drawImage(s, Math.round((x + jx - w / 2) * 2) / 2, Math.round((y + jy - h / 2) * 2) / 2, w, h); };
    PAP(g, '#CFC1A3', 11);
    atT(colSky(), 150, 98, 1, .5);
    atT(colNews(), 106, 238, 2, .5);
    atT(colRed(), 392, 232, 3, .5);
    if (u >= 4.8) at(colSun(), 226, 92, u * .2, 4, 1, u < 4.9 ? 1.2 : 1);
    // busto recortado: sobe em passos, a tampa da cabeça abre (dobradiça atrás)
    const P = colParts(), by = (1 - ease(seg(u, .3, .9))) * 240, nod = u >= 6.4 && u < 6.9 ? -.035 : 0;
    const [jx, jy] = J(5, .8);
    g.save(); g.translate(Math.round((165 + jx) * 2) / 2, Math.round((150 + by + jy) * 2) / 2); if (nod) g.rotate(nod); g.translate(-100, -125);
    g.drawImage(P.base, 0, 38 * SC, 200 * SC, 212 * SC, 0, 38, 200, 212);
    const ko = spr(seg(u, 1.5, 2.4)); let ang = -1.3 * ko; if (u > 2.4) ang += Math.sin(f * .9) * .04;
    if (ang < -.05) { g.save(); g.translate(100, 43.5); g.rotate(-.055); g.fillStyle = rad(g, 0, 0, 2, 34, [[0, '#120D0A'], [.8, '#2E251D'], [1, '#6B5E50']]); g.beginPath(); g.ellipse(0, 0, 33, 6.5, 0, 0, TAU); g.fill(); g.restore(); }
    g.save(); g.translate(137, 41.5 - 8 * clamp(ko)); g.rotate(ang); g.translate(-137, -41.5); g.drawImage(P.lid, 0, 0, 200 * SC, 58 * SC, 0, 0, 200, 58); g.restore();
    g.restore();
    // pássaros ilustrados saem da cabeça
    const BT = [[228, 60, '#2A9D8F', '#1F7468'], [290, 80, '#E76F51', '#B8513A'], [344, 64, '#E9C46A', '#C9A040']];
    BT.forEach(([tx, ty, cb, cw], i) => {
      const tb = 2.1 + i * .45; if (u < tb) return; const k = ease(seg(u, tb, tb + .9)), sx = 165, sy = 66 + by;
      const mx = sx - 10, my = sy - 70, x = lerp(lerp(sx, mx, k), lerp(mx, tx, k), k), y = lerp(lerp(sy, my, k), lerp(my, ty, k), k) + (k >= 1 ? Math.sin(u * 4 + i * 2) * 3 : 0);
      const flying = k < 1, up = flying ? (f + i) % 2 === 0 : ((f >> 1) + i) % 2 === 0;
      bird(g, x, y, .4 + .6 * ease(seg(u, tb, tb + .5)), up, cb, cw, flying ? -.5 + k * .5 : Math.sin(f * .7 + i) * .07);
    });
    // fitas
    if (u >= 1.0) at(colTape(), 104, 196, -.5, 6, .6, u < 1.1 ? 1.15 : 1);
    if (u >= 1.2) at(colTape(), 232, 214, .42, 7, .6, u < 1.3 ? 1.15 : 1);
    // letras recortadas de revista
    const words = ['IDEIAS', 'SOLTAS'];
    words.forEach((w, li) => [...w].forEach((ch, j) => {
      const i = li * 6 + j, tl = 3.1 + i * .12; if (u < tl) return; const r = rng(i * 19 + 7), pop = u - tl < .1;
      at(tile(ch, (i * 3 + 1) % RS.length), 298 + j * 30 + li * 8, 114 + li * 52 + (r() - .5) * 6, (r() - .5) * .22 + (pop ? .25 : 0), 10 + i, .7, pop ? 1.35 : 1);
    }));
    if (u >= 5.6) at(colCap(), 364, 204, .025, 30, .5, u < 5.7 ? 1.15 : 1);
    // folha rasgada que limpa a mesa (fim/início do loop)
    let sx = null; if (u < .5) sx = lerp(-40, -660, eio(u / .5)); else if (u >= 7.3) sx = lerp(W + 10, -40, ease((u - 7.3) / .6));
    if (sx !== null) { const [a, b] = J(40, .6); g.drawImage(colSheet(), sx + a, -10 + b, 600, 300); }
  };

  // ================================================================ 2. EXPLICATIVO COM ADESIVOS
  const NAVY = '#1D1B3A';
  let MCX = null; const measure = (f, str) => { if (!MCX) MCX = newC(1, 1); MCX.font = f; return MCX.measureText(str).width; };
  const stk = new Map();
  function sticker(key, w, h, fs, art) {
    const ok = fontsOk(fs), hit = stk.get(key);
    if (hit && (ok || hit._b === Math.floor(performance.now() / 400)) && !(ok && hit._tmp)) return hit;
    const m = 12, a = newC(w + 2 * m, h + 2 * m); a.translate(m, m); a.lineJoin = 'round'; a.lineCap = 'round'; art(a, w, h);
    const front = outline(a.canvas, 5.5, '#FFFFFF');
    const back = tint(front, '#E7E4EC'), bx = back.getContext('2d'); bx.globalCompositeOperation = 'source-atop';
    bx.fillStyle = lin(bx, 0, 0, back.width * .8, back.height, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(150,145,170,.7)']]); bx.fillRect(0, 0, back.width, back.height);
    const sh = blurC(tint(front, 'rgba(22,18,48,.5)'), 2.2);
    const s = { front, back, sh, w: w + 2 * m, h: h + 2 * m, m, _tmp: !ok, _b: Math.floor(performance.now() / 400) };
    stk.set(key, s); return s;
  }
  function heart(c, x, y, s, fill, lw = 2.5) {
    c.save(); c.translate(x, y); c.scale(s / 10, s / 10); c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-12, 0, -10, -10, -4.5, -10); c.bezierCurveTo(-2, -10, 0, -8, 0, -6);
    c.bezierCurveTo(0, -8, 2, -10, 4.5, -10); c.bezierCurveTo(10, -10, 12, 0, 0, 8); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = lw * 10 / s; c.strokeStyle = NAVY; c.stroke(); c.restore();
  }
  const ST = {
    title: () => sticker('st-title', 336, 46, [font(400, 28, F.slab)], (c) => { type(c, 'COMO FUNCIONA?', 168, 25, { f: font(400, 28, F.slab), fill: '#FF5A5F', stroke: NAVY, lw: 7, track: 1 }); type(c, 'COMO FUNCIONA?', 168, 25, { f: font(400, 28, F.slab), fill: '#FF5A5F', track: 1 }); }),
    phone: () => sticker('st-phone', 64, 92, [], (c, w, h) => {
      c.save(); c.translate(w / 2, h / 2); c.rotate(-.06); rr(c, -24, -42, 48, 84, 11); c.fillStyle = '#3A86FF'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = NAVY; c.stroke();
      rr(c, -18, -33, 36, 60, 5); c.fillStyle = lin(c, 0, -33, 0, 27, [[0, '#FFA3C7'], [1, '#FF4F8B']]); c.fill(); c.lineWidth = 2.5; c.stroke();
      heart(c, 0, -4, 13, '#FFFFFF'); c.fillStyle = NAVY; c.beginPath(); c.arc(0, 35, 3, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(-17, -32); c.lineTo(-5, -32); c.lineTo(-17, -12); c.closePath(); c.fill(); c.restore();
    }),
    bag: () => sticker('st-bag', 84, 88, [], (c, w, h) => {
      c.save(); c.translate(w / 2, h / 2 + 8); c.lineWidth = 4.5; c.strokeStyle = NAVY; c.beginPath(); c.moveTo(-15, -20); c.bezierCurveTo(-15, -46, 15, -46, 15, -20); c.stroke();
      c.beginPath(); c.moveTo(-31, -22); c.lineTo(31, -22); c.lineTo(36, 34); c.quadraticCurveTo(36, 38, 32, 38); c.lineTo(-32, 38); c.quadraticCurveTo(-36, 38, -36, 34); c.closePath(); c.fillStyle = '#FFBE0B'; c.fill(); c.lineWidth = 3.5; c.stroke();
      c.fillStyle = 'rgba(214,120,0,.45)'; c.beginPath(); c.moveTo(14, -22); c.lineTo(31, -22); c.lineTo(36, 34); c.quadraticCurveTo(36, 38, 32, 38); c.lineTo(18, 38); c.closePath(); c.fill();
      c.fillStyle = NAVY; for (const sx of [-15, 15]) { c.beginPath(); c.arc(sx, -14, 2.6, 0, TAU); c.fill(); }
      heart(c, -4, 10, 14, '#FF5A5F'); c.restore();
    }),
    box: () => sticker('st-box', 90, 86, [], (c, w, h) => {
      c.save(); c.translate(w / 2, h / 2 + 6); c.lineWidth = 3.5; c.strokeStyle = NAVY;
      for (const sd of [-1, 1]) { c.fillStyle = '#2EC4B6'; c.beginPath(); c.ellipse(sd * 12, -30, 13, 8, sd * .5, 0, TAU); c.fill(); c.stroke(); }
      rr(c, -32, -12, 64, 46, 4); c.fillStyle = '#FF5D8F'; c.fill(); c.stroke();
      rr(c, -37, -24, 74, 15, 4); c.fillStyle = '#FF86AC'; c.fill(); c.stroke();
      c.fillStyle = '#2EC4B6'; c.fillRect(-6, -23, 12, 56); c.strokeRect(-6, -23, 12, 56);
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-28, -8, 6, 36); c.restore();
    }),
    arrow: (k) => sticker('st-arrow' + k, 66, 40, [], (c) => {
      const pth = () => { c.beginPath(); c.moveTo(8, 30); c.quadraticCurveTo(28, 6, 48, 18); };
      c.strokeStyle = NAVY; c.lineWidth = 13; pth(); c.stroke(); poly(c, [[40, 6], [60, 24], [36, 30]]); c.fillStyle = NAVY; c.fill(); c.lineWidth = 5; c.stroke();
      c.strokeStyle = '#FF7A2F'; c.lineWidth = 7; pth(); c.stroke(); poly(c, [[42, 11], [54, 23], [39, 26]]); c.fillStyle = '#FF7A2F'; c.fill(); c.lineWidth = 3; c.stroke();
    }),
    badge: (n) => sticker('st-b' + n, 30, 30, [font(400, 18, F.slab)], (c) => { c.fillStyle = NAVY; c.beginPath(); c.arc(15, 15, 14, 0, TAU); c.fill(); type(c, String(n), 15, 16.5, { f: font(400, 18, F.slab), fill: '#FFFFFF' }); }),
    cap: (s) => { const f = font(400, 15, F.slab), w = Math.ceil(measure(f, s) + s.length + 30);
      return sticker('st-c' + s + w, w, 30, [f], (c) => { rr(c, 0, 0, w, 30, 15); c.fillStyle = NAVY; c.fill(); type(c, s, w / 2 + .5, 16, { f, fill: '#FFFFFF', track: 1 }); }); },
  };
  const stGrid = () => mkT('st-grid', 480, 270, [font(700, 24, F.hand)], (c, w, h) => {
    c.fillStyle = '#FBF7EE'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(86,140,210,.24)'; c.lineWidth = .8;
    for (let x = 6; x < w; x += 18) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 9; y < h; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = rad(c, 250, 100, 30, 330, [[0, 'rgba(255,255,255,.4)'], [1, 'rgba(90,70,40,.15)']]); c.fillRect(0, 0, w, h);
    // rabiscos de lápis no caderno
    c.strokeStyle = 'rgba(110,116,130,.55)'; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * 3.2 * TAU, r0 = 2 + i * .22; c.lineTo(446 + Math.cos(a) * r0, 238 + Math.sin(a) * r0); } c.stroke();
    c.beginPath(); for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU * 2, r0 = i % 2 ? 4 : 10; c.lineTo(28 + Math.cos(a * .5) * r0, 246 + Math.sin(a * .5) * r0); } c.stroke();
    c.save(); c.translate(424, 72); c.rotate(-.12); type(c, 'é fácil!', 0, 0, { f: font(700, 24, F.hand), fill: 'rgba(100,106,122,.75)' }); c.restore();
    c.beginPath(); c.moveTo(396, 86); c.quadraticCurveTo(424, 80, 452, 84); c.stroke();
  });
  // adesivo com entrada "slap", sombra que encosta e descolagem pelo canto (dobra refletida)
  function drawSticker(g, S, x, y, rot, sc, lift, peel) {
    const w = S.w, h = S.h;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    if (peel <= 0) {
      g.globalAlpha = 1 - lift * .5; g.drawImage(S.sh, -w / 2 + 1 + lift * 3, -h / 2 + 2.5 + lift * 9, w, h); g.globalAlpha = 1; g.drawImage(S.front, -w / 2, -h / 2, w, h);
    } else {
      const nx = -w / Math.hypot(w, h), ny = -h / Math.hypot(w, h), D = Math.hypot(w, h) - 2 * S.m - 4;
      const cx = w / 2 - S.m - 2, cy = h / 2 - S.m - 2, px = cx + nx * peel * D, py = cy + ny * peel * D, pd = px * nx + py * ny;
      const half = (sg) => { const tx = -ny, ty = nx, Rr = 500; g.beginPath(); g.moveTo(px + tx * Rr, py + ty * Rr); g.lineTo(px - tx * Rr, py - ty * Rr); g.lineTo(px - tx * Rr + sg * nx * Rr, py - ty * Rr + sg * ny * Rr); g.lineTo(px + tx * Rr + sg * nx * Rr, py + ty * Rr + sg * ny * Rr); g.closePath(); };
      g.save(); half(1); g.clip(); g.globalAlpha = 1 - lift * .5; g.drawImage(S.sh, -w / 2 + 1 + lift * 3, -h / 2 + 2.5 + lift * 9, w, h); g.globalAlpha = 1; g.drawImage(S.front, -w / 2, -h / 2, w, h); g.restore();
      g.save(); g.transform(1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 2 * pd * nx, 2 * pd * ny); half(-1); g.clip();
      g.globalAlpha = .6; g.drawImage(S.sh, -w / 2 - 2, -h / 2 - 3, w, h); g.globalAlpha = 1; g.drawImage(S.back, -w / 2, -h / 2, w, h); g.restore();
    }
    g.restore();
  }
  const shimC = new Map();
  R['explicativo-adesivos'] = (g, t, W, H) => {
    const u = t % 7; put(g, stGrid(), 0, 0);
    const it = [
      [ST.title(), 178, 58, -.035, 0, 1], [ST.phone(), 96, 140, -.07, .5, 1.15], [ST.badge(1), 56, 96, -.12, .75, 1.1], [ST.cap('BAIXE O APP'), 96, 218, .03, 1.0, 1],
      [ST.arrow(1), 168, 130, -.12, 1.4, 1.1], [ST.bag(), 240, 142, .06, 1.75, 1.15], [ST.badge(2), 202, 96, .1, 2.0, 1.1], [ST.cap('ESCOLHA'), 240, 218, -.035, 2.25, 1],
      [ST.arrow(2), 314, 128, .1, 2.65, 1.1], [ST.box(), 386, 140, -.05, 3.0, 1.15], [ST.badge(3), 346, 94, -.08, 3.25, 1.1], [ST.cap('RECEBA'), 386, 218, .03, 3.5, 1],
    ];
    const order = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    it.forEach(([S, x, y, r0, t0, k0], i) => {
      if (u < t0) return;
      const k = spr(seg(u, t0, t0 + .5)); let lift = 1 - clamp(ease(seg(u, t0, t0 + .22)));
      const tp = 5.45 + order.indexOf(i) * .085, pk = seg(u, tp, tp + .26), fly = seg(u, tp + .26, tp + .5);
      const wob = Math.sin(u * 2.2 + i * 1.7) * .012 * clamp((u - t0) * 2);
      let yy = y, rot = r0 + (1 - k) * .3 + wob, sc = (1.2 - .2 * k) * k0;
      if (fly > 0) { yy -= 330 * fly * fly; rot += fly * 1.1 * (i % 2 ? 1 : -1); sc *= 1 + .12 * fly; lift = clamp(fly * 3); }
      if (i === 9 && u > 4.3 && u < 5.3 && pk <= 0) { // brilho holográfico passando no adesivo da caixa
        let o = shimC.get(S); if (!o) { o = sameC(S.front); shimC.set(S, o); } const q = seg(u, 4.3, 5.3), cw = o.canvas.width, ch = o.canvas.height;
        o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, cw, ch); o.drawImage(S.front, 0, 0); o.globalCompositeOperation = 'source-atop';
        const bx = -cw * .6 + q * cw * 2.2; o.fillStyle = o.createLinearGradient(bx, 0, bx + cw * .5, ch); o.fillStyle.addColorStop(0, 'rgba(255,255,255,0)'); o.fillStyle.addColorStop(.5, 'rgba(255,255,255,.7)'); o.fillStyle.addColorStop(1, 'rgba(255,255,255,0)'); o.fillRect(0, 0, cw, ch);
        drawSticker(g, { ...S, front: o.canvas }, x, yy, rot, sc, lift, 0);
      } else drawSticker(g, S, x, yy, rot, sc, lift, .36 * ease(pk));
    });
  };

  // ================================================================ 3. LIVE ACTION + GRAFISMO
  const LA = { skin: [204, 148, 114], hair: [48, 32, 25], cloth: [70, 106, 112], top: 'sweater', fem: true, L: -1, iris: [50, 34, 26] };
  const laRoom = () => mk('la-room', 540, 300, (c, w, h) => {
    const s = newC(w, h);
    s.fillStyle = lin(s, 0, 0, w, 0, [[0, '#EADCC4'], [.3, '#C4AE92'], [.75, '#8C7663'], [1, '#5E4E42']]); s.fillRect(0, 0, w, h);
    s.fillStyle = lin(s, 0, 0, 0, h, [[0, 'rgba(0,0,0,.14)'], [.45, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.28)']]); s.fillRect(0, 0, w, h);
    s.fillStyle = '#8F7F6C'; s.fillRect(14, 14, 122, 190); s.fillStyle = lin(s, 0, 20, 0, 196, [[0, '#FFFDF6'], [1, '#F2EBD8']]); s.fillRect(22, 22, 106, 174);
    blob(s, 60, 160, 56, 34, [196, 212, 168], .55); blob(s, 110, 60, 30, 26, [214, 226, 196], .4);
    s.fillStyle = '#A39380'; s.fillRect(72, 22, 6, 174); s.fillRect(22, 106, 106, 6);
    blob(s, 175, 100, 160, 120, [255, 244, 222], .55);
    s.fillStyle = '#4E3B2E'; s.fillRect(372, 98, 168, 8); const bc = ['#8E3B32', '#2F4858', '#C49A3A', '#5E7B6B', '#A8543A', '#3D3A4F', '#B7A58A', '#6C4A5A'];
    let bx = 380; const r = rng(9); while (bx < 530) { const bw = 7 + r() * 7, bh = 30 + r() * 20; s.fillStyle = bc[(r() * bc.length) | 0]; s.fillRect(bx, 98 - bh, bw, bh); s.fillStyle = 'rgba(0,0,0,.25)'; s.fillRect(bx + bw - 2, 98 - bh, 2, bh); bx += bw + 1 + (r() < .15 ? 8 : 0); }
    { const sh = newC(190, 250); bust(sh, { ...LA, x: 95, y: 118, s: 1.25 }); s.globalAlpha = .28; s.drawImage(blurC(tint(sh.canvas, '#2A1C12'), 5), 318, 60, 200, 263); s.globalAlpha = 1; }
    s.fillStyle = '#8A5A3C'; s.beginPath(); s.moveTo(34, 300); s.lineTo(40, 238); s.lineTo(100, 238); s.lineTo(106, 300); s.fill();
    for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.4, L0 = 40 + r() * 55; s.fillStyle = C([60 + r() * 34, 96 + r() * 34, 56]); s.save(); s.translate(70, 240); s.rotate(a + Math.PI / 2); s.beginPath(); s.ellipse(0, -L0 / 2, 7 + r() * 5, L0 / 2, 0, 0, TAU); s.fill(); s.restore(); }
    c.drawImage(blurC(s.canvas, 2.6), 0, 0, w, h);
    for (let i = 0; i < 12; i++) { const x = 170 + i * 31, y = 26 + Math.sin(i / 11 * Math.PI) * 16, rb = 6 + (i % 3) * 1.6; c.fillStyle = 'rgba(255,212,150,.3)'; c.beginPath(); c.arc(x, y, rb, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,236,200,.5)'; c.lineWidth = 1; c.stroke(); }
  });
  const laBody = () => mk('la-body', 170, 200, (c, w, h) => { const x = newC(w, h); bust(x, { ...LA, x: 85, y: 40, s: 1.25, parts: 'body' }); c.drawImage(rimLight(x.canvas, 2.2, 'rgba(255,236,204,.8)'), 0, 0, w, h); });
  const laHead = () => mk('la-head', 100, 120, (c, w, h) => { const x = newC(w, h); bust(x, { ...LA, x: 50, y: 112, s: 1.25, parts: 'head' }); c.drawImage(rimLight(x.canvas, 1.6, 'rgba(255,238,210,.85)'), 0, 0, w, h); });
  const laCut = () => mk('la-cut', 190, 250, (c) => {
    const x = newC(190, 250); bust(x, { ...LA, x: 95, y: 118, s: 1.25 });
    c.drawImage(withShadow(outline(x.canvas, 5, '#FFE14D'), 5, 6, 0, .35, '#7A1D0E'), 0, 0, 190, 250);
  });
  const laTable = () => mk('la-table', 540, 120, (c) => {
    c.fillStyle = lin(c, 0, 40, 0, 120, [[0, '#8C5E3C'], [1, '#5A3A24']]); c.fillRect(0, 40, 540, 80);
    const r = rng(14); c.strokeStyle = 'rgba(40,22,10,.22)'; c.lineWidth = 1; for (let i = 0; i < 26; i++) { const y = 44 + r() * 74; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(180, y + (r() - .5) * 8, 360, y + (r() - .5) * 8, 540, y + (r() - .5) * 6); c.stroke(); }
    c.fillStyle = 'rgba(255,230,190,.25)'; c.fillRect(0, 40, 540, 2);
    // caderno + caneta
    c.fillStyle = 'rgba(0,0,0,.25)'; poly(c, [[122, 60], [214, 58], [224, 92], [114, 96]]); c.fill();
    c.fillStyle = '#EFE9DC'; poly(c, [[120, 56], [212, 54], [222, 88], [112, 92]]); c.fill(); c.strokeStyle = 'rgba(80,110,150,.35)'; c.lineWidth = .8; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(120 - i * 1.3, 56 + i * 6); c.lineTo(212 + i * 1.7, 54 + i * 6); c.stroke(); }
    c.strokeStyle = '#1D2B44'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(150, 84); c.lineTo(204, 70); c.stroke();
    { const sl = LA.cloth, sk = LA.skin; contact(c, 292, 74, 84, 10, .4);
      for (const sd of [-1, 1]) { const ex = 292 + sd * 70, ey = 40, hx = 292 + sd * 26, hy = 64;
        c.strokeStyle = lin(c, 0, ey - 12, 0, hy + 12, [[0, C(sl, sd < 0 ? 1.25 : .95)], [1, C(sl, .55)]]); c.lineWidth = 25; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke();
        c.strokeStyle = C(sl, .62); c.lineWidth = 21; c.beginPath(); c.moveTo(hx + sd * 2, hy - .5); c.lineTo(hx - sd * 1, hy); c.stroke(); }
      for (const sd of [1, -1]) { // mãos em repouso: dorso, dedos dobrados, polegar por cima
        const hx = 292 + sd * 9, hy = 66; c.save(); c.translate(hx, hy); c.rotate(sd * -.35);
        c.fillStyle = C(sk, .45, .5); c.beginPath(); c.ellipse(1, 3, 11, 6, 0, 0, TAU); c.fill();
        c.fillStyle = rad(c, -2 * sd, -3, 1, 13, [[0, C(sk, 1.15)], [1, C(sk, .72)]]); c.beginPath(); c.ellipse(0, 0, 10.5, 7, 0, 0, TAU); c.fill();
        for (let k = 0; k < 4; k++) { c.fillStyle = C(sk, k % 2 ? .92 : 1.02); c.beginPath(); c.ellipse(-sd * 8.5, -4.5 + k * 3, 3.2, 1.9, 0, 0, TAU); c.fill(); }
        c.fillStyle = C(sk, 1.1); c.beginPath(); c.ellipse(sd * 1, -6, 5.5, 2.4, sd * .3, 0, TAU); c.fill();
        c.strokeStyle = C(sk, .55, .6); c.lineWidth = .6; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-sd * 6, -6 + k * 3); c.lineTo(-sd * 11, -6 + k * 3); c.stroke(); }
        c.restore(); } }
    // caneca (em foco) com sombra de contato
    const mx = 372, my = 74; contact(c, mx + 4, my, 26, 5, .5);
    c.strokeStyle = '#D8CDBC'; c.lineWidth = 5; c.beginPath(); c.arc(mx + 16, my - 19, 8, -1.3, 1.3); c.stroke();
    c.fillStyle = lin(c, mx - 15, 0, mx + 15, 0, [[0, '#FFFBF2'], [.3, '#EFE6D6'], [1, '#948773']]);
    c.beginPath(); c.moveTo(mx - 15, my - 36); c.lineTo(mx - 14, my - 2); c.quadraticCurveTo(mx, my + 3, mx + 14, my - 2); c.lineTo(mx + 15, my - 36); c.closePath(); c.fill();
    c.fillStyle = '#F7F1E6'; c.beginPath(); c.ellipse(mx, my - 36, 15, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#3A2418'; c.beginPath(); c.ellipse(mx, my - 35.4, 12.5, 3, 0, 0, TAU); c.fill();
  });
  function star4(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2, R0 = i % 2 ? r * .28 : r; g.lineTo(x + Math.cos(a) * R0, y + Math.sin(a) * R0); } g.closePath(); g.fill(); }
  R['live-action-grafismo'] = (g, t, W, H) => {
    const u = t % 7, f = Math.floor(t * 12);
    if (u >= 3.2 && u < 5.2) { // corte: pessoa recortada com contorno sobre cor chapada
      const v = u - 3.2; bg(g, W, H, '#FF5A36');
      g.fillStyle = 'rgba(255,255,255,.14)'; for (let y = 8; y < H; y += 12) for (let x = 8 + (y / 12 % 2) * 6; x < W; x += 12) { const d = Math.hypot(x - 360, y - 135) / 260; g.beginPath(); g.arc(x, y, 3.2 * clamp(1 - d), 0, TAU); g.fill(); }
      const k1 = spr(seg(v, .1, .5)), k2 = spr(seg(v, .35, .75));
      if (v > .1) { g.save(); g.translate(36, 108); g.scale(1.3 - .3 * k1, 1.3 - .3 * k1); type(g, 'ELA', 0, 0, { f: font(400, 64, F.slab), fill: '#FFFFFF', align: 'left' }); g.restore(); }
      if (v > .35) { g.save(); g.translate(36, 176); g.scale(1.3 - .3 * k2, 1.3 - .3 * k2); type(g, 'DECIDE.', 0, 0, { f: font(400, 64, F.slab), fill: '#1D1B3A', align: 'left' }); g.restore(); }
      doodle(g, [[40, 214], [120, 208], [210, 212], [290, 206]], ease(seg(v, 1.0, 1.4)), '#FFFFFF', 4, f);
      const kc = spr(seg(v, 0, .45)); g.save(); g.translate(362, 150 + (1 - kc) * 160); g.rotate(-.04 + Math.sin(v * 3) * .01); putC(g, laCut(), 0, 0); g.restore();
      [[300, 60, 9, .2], [430, 92, 7, .5], [420, 40, 5, .8]].forEach(([x, y, r, d]) => { if (v > d) star4(g, x, y, r * (1 + Math.sin(v * 8 + d * 5) * .15), '#FFFFFF'); });
      return;
    }
    // filmagem: câmera na mão, fundo com profundidade de campo, grafismos presos à cena
    const zc = u >= 5.2 ? eio(seg(u, 5.2, 5.45)) : 0, z = 1 + .9 * zc, fx = 342, fy = 228;
    const cx = noise(t * .7, 1) * 3.2, cy = noise(t * .9, 4) * 2.4;
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2 - (fx - W / 2) * zc * .9, -H / 2 - (fy - H / 2) * zc * .75);
    const room = laRoom(); g.drawImage(room, -30 + cx * .55, -15 + cy * .55, 540, 300);
    // texto preso na parede (acompanha o fundo)
    if (u > .3) { const k = spr(seg(u, .3, .7)); g.save(); g.translate(158 + cx * .55, 78 + cy * .55); g.scale(1.15 - .15 * k, 1.15 - .15 * k); type(g, 'TERÇA, 9h', 1.5, 2, { f: font(400, 22, F.slab), fill: 'rgba(60,40,20,.25)' }); type(g, 'TERÇA, 9h', 0, 0, { f: font(400, 22, F.slab), fill: 'rgba(255,255,255,.93)' }); g.restore(); }
    const br = Math.sin(t * 1.6) * .006, nod = Math.sin(t * 1.3) * .035, hb = Math.sin(t * 2.6) * .8, px = 262 + cx, py = 150 + cy;
    g.save(); g.translate(px, py); g.scale(1, 1 + br); g.drawImage(laBody(), -85, -40, 170, 200); g.restore();
    g.save(); g.translate(px, py + hb); g.rotate(nod); g.drawImage(laHead(), -50, -112, 100, 120);
    // coroa desenhada presa à cabeça
    if (u > 1.8 && u < 5.2) doodle(g, [[-24, -96], [-27, -122], [-13, -108], [0, -128], [13, -108], [27, -122], [24, -96], [-24, -96]], ease(seg(u, 1.8, 2.4)), '#FFE14D', 3.2, f);
    g.restore();
    const tx = -30 + cx * 1.25, ty = 178 + cy * 1.25; g.drawImage(laTable(), tx, ty, 540, 120);
    // vapor desenhado na caneca real
    const mx = tx + 372, my = ty + 34; for (let i = 0; i < 3; i++) { const pts = []; for (let k = 0; k <= 8; k++) pts.push([mx - 8 + i * 8 + Math.sin(k * .9 + t * 5 + i) * 3, my - 6 - k * 3.2]); doodle(g, pts, 1, 'rgba(255,255,255,.95)', 2.4, f + i); }
    // seta + rótulo manuscrito, presos à pessoa
    if (u > .9 && u < 3.2) {
      doodle(g, [[398 + cx, 148 + cy], [382 + cx, 166 + cy], [352 + cx, 176 + cy], [326 + cx, 172 + cy]], ease(seg(u, .9, 1.3)), '#FFFFFF', 3, f);
      if (u > 1.25) doodle(g, [[336 + cx, 164 + cy], [325 + cx, 172 + cy], [335 + cx, 181 + cy]], 1, '#FFFFFF', 3, f);
      if (u > 1.2) { g.save(); g.beginPath(); g.rect(360 + cx, 100 + cy, 120 * ease(seg(u, 1.2, 1.6)), 50); g.clip(); type(g, 'ela decide!', 364 + cx, 132 + cy, { f: font(700, 28, F.hand), fill: '#FFFFFF', align: 'left', stroke: 'rgba(0,0,0,.25)', lw: 3 }); g.restore(); }
      if (u > 2.5) [[210, 60, 7], [318, 54, 5], [300, 96, 4]].forEach(([x, y, r], i) => { if (u > 2.5 + i * .12) star4(g, x + cx, y + cy + hb, r * (1 + Math.sin(t * 9 + i) * .2), '#FFE14D'); });
    }
    // corte 3: zoom na caneca, círculo e rótulo
    if (u >= 5.2) {
      doodle(g, ellPts(mx + 2, my + 20, 34, 30, 1.15, -2.4, .08, 3), ease(seg(u, 5.45, 5.85)), '#FFE14D', 3, f);
      if (u > 5.85) { g.save(); g.beginPath(); g.rect(mx - 110, my - 10, 80 * ease(seg(u, 5.85, 6.15)), 40); g.clip(); type(g, '3º café', mx - 106, my + 12, { f: font(700, 26, F.hand), fill: '#FFFFFF', align: 'left', stroke: 'rgba(0,0,0,.3)', lw: 3 }); g.restore(); }
      if (u > 6.1) doodle(g, [[mx - 50, my + 22], [mx - 40, my + 30], [mx - 34, my + 30]], ease(seg(u, 6.1, 6.3)), '#FFFFFF', 2.6, f);
    }
    g.restore();
    GR(g, t, .07); VIG(g, .28);
  };

  // ================================================================ 4. XEROX / GRUNGE
  function xFaceRaw() {
    const c = newC(480, 270); c.fillStyle = lin(c, 0, 0, 480, 0, [[0, '#161616'], [.55, '#555'], [1, '#8a8a8a']]); c.fillRect(0, 0, 480, 270);
    bust(c, { x: 300, y: 262, s: 3.1, L: 1, skin: [196, 196, 196], hair: [26, 26, 26], cloth: [44, 44, 44], shirt: [215, 215, 215], tie: [22, 22, 22], top: 'suit', iris: [20, 20, 20] });
    return c.canvas;
  }
  const bez = (p0, p1, p2, p3, k) => { const m = 1 - k; return [m * m * m * p0[0] + 3 * m * m * k * p1[0] + 3 * m * k * k * p2[0] + k * k * k * p3[0], m * m * m * p0[1] + 3 * m * m * k * p1[1] + 3 * m * k * k * p2[1] + k * k * k * p3[1]]; };
  function xEyeRaw() {
    const c = newC(480, 270), r = rng(12); c.fillStyle = rad(c, 250, 150, 20, 330, [[0, '#cdcdcd'], [1, '#666']]); c.fillRect(0, 0, 480, 270);
    c.strokeStyle = '#242424'; c.lineCap = 'round'; for (let i = 0; i < 150; i++) { const k = r(), x = 88 + k * 316, y = 56 - Math.sin(k * Math.PI) * 24 + (r() - .5) * 13; c.lineWidth = 2 + r() * 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 12 + r() * 8, y - 4 - r() * 5); c.stroke(); }
    blob(c, 245, 104, 160, 30, [60, 60, 60], .55);
    c.strokeStyle = 'rgba(38,38,38,.85)'; c.lineWidth = 6; c.beginPath(); c.moveTo(104, 134); c.bezierCurveTo(170, 74, 320, 72, 388, 126); c.stroke();
    const U = [[110, 150], [170, 90], [320, 88], [380, 142]], eye = () => { c.beginPath(); c.moveTo(110, 150); c.bezierCurveTo(170, 90, 320, 88, 380, 142); c.bezierCurveTo(320, 198, 170, 202, 110, 150); c.closePath(); };
    eye(); c.fillStyle = '#e4e4e4'; c.fill(); c.save(); eye(); c.clip();
    blob(c, 116, 150, 64, 52, [80, 80, 80], .85); blob(c, 378, 142, 64, 52, [80, 80, 80], .85);
    c.fillStyle = rad(c, 245, 142, 18, 56, [[0, '#2a2a2a'], [.55, '#727272'], [.88, '#3a3a3a'], [1, '#101010']]); c.beginPath(); c.arc(245, 142, 56, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(18,18,18,.55)'; c.lineWidth = 1.6; for (let i = 0; i < 70; i++) { const a = i / 70 * TAU + r() * .05, e = 46 + r() * 8; c.beginPath(); c.moveTo(245 + Math.cos(a) * 24, 142 + Math.sin(a) * 24); c.lineTo(245 + Math.cos(a) * e, 142 + Math.sin(a) * e); c.stroke(); }
    c.fillStyle = '#060606'; c.beginPath(); c.arc(245, 142, 23, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(266, 122, 10, 0, TAU); c.fill(); c.beginPath(); c.arc(228, 160, 4, 0, TAU); c.fill();
    c.fillStyle = lin(c, 0, 88, 0, 132, [[0, 'rgba(0,0,0,.7)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(100, 80, 290, 54); c.restore();
    c.strokeStyle = '#121212'; for (let i = 0; i < 36; i++) { const k = .04 + i / 35 * .92, [x, y] = bez(...U, k), o = (k - .5) * 30; c.lineWidth = 2.3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + o * .3, y - 14, x + o, y - 24 - Math.sin(k * Math.PI) * 6); c.stroke(); }
    c.strokeStyle = 'rgba(40,40,40,.65)'; c.lineWidth = 3; c.beginPath(); c.moveTo(118, 156); c.bezierCurveTo(180, 204, 320, 200, 374, 148); c.stroke();
    return c.canvas;
  }
  const XT = [font(400, 15, F.mono), font(600, 18, F.mono)];
  function xDocRaw() {
    const c = newC(480, 270); c.fillStyle = lin(c, 0, 0, 480, 270, [[0, '#dcdcdc'], [1, '#a9a9a9']]); c.fillRect(0, 0, 480, 270);
    c.fillStyle = '#e9e9e9'; c.save(); c.translate(240, 135); c.rotate(-.02); c.fillRect(-222, -126, 444, 256); c.restore();
    const L2 = ['RELATÓRIO 07 / 1987', '', 'O indivíduo foi visto às 23h10', 'na saída do arquivo municipal.', 'Nenhuma testemunha confirmou', 'a presença dele no local.'];
    L2.forEach((s, i) => type(c, s, 36, 38 + i * 21, { f: i ? XT[0] : XT[1], fill: '#262626', align: 'left' }));
    c.fillStyle = '#141414'; c.fillRect(36, 166, 150, 14); c.fillRect(196, 166, 70, 14); c.fillRect(36, 186, 110, 14);
    c.save(); c.translate(372, 104); c.rotate(.05); c.fillStyle = '#f2f2f2'; c.fillRect(-72, -62, 144, 124); c.drawImage(filt(xFaceRaw(), "brightness(1.5) contrast(1.2)"), 160 * SC / 2, 0, 720 * SC / 2, 540 * SC / 2, -64, -54, 128, 96); c.restore();
    c.strokeStyle = '#555'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(320, 40); c.lineTo(320, 72); c.arc(326, 72, 6, Math.PI, 0, true); c.lineTo(332, 34); c.arc(327, 34, 5, 0, Math.PI, true); c.lineTo(322, 64); c.stroke();
    return c.canvas;
  }
  const xPlate = (k) => {
    if (k === 'C') return mkT('x-C', 480, 270, XT, (c) => { const raw = xDocRaw(), b = newC(480, 270); b.drawImage(raw, 0, 0, 480, 270); c.drawImage(thresh(b.canvas, 150, 70, 31), 0, 0, 480, 270); });
    return mk('x-' + k, 480, 270, (c) => {
      const b = newC(480, 270); b.drawImage(k[0] === 'A' ? xFaceRaw() : xEyeRaw(), 0, 0, 480, 270);
      b.globalCompositeOperation = 'overlay'; b.globalAlpha = .6; b.drawImage(noiseTile(k[0] === 'A' ? 41 : 43), 0, 0, 30, 17, 0, 0, 480, 270);
      b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.fillStyle = lin(b, 0, 0, 480, 0, [[0, 'rgba(0,0,0,.5)'], [.1, 'rgba(0,0,0,0)'], [.9, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]); b.fillRect(0, 0, 480, 270);
      const th = thresh(b.canvas, k[0] === 'A' ? 112 : 128, 84, k === 'A' ? 7 : 9);
      c.drawImage(k.length > 1 ? filt(th, 'invert(1)') : th, 0, 0, 480, 270);
    });
  };
  const xSpecks = () => mk('x-specks', 480, 270, (c) => {
    const r = rng(77); c.fillStyle = '#141312'; for (let i = 0; i < 260; i++) { c.beginPath(); c.arc(r() * 480, r() * 270, r() * r() * 2.6 + .3, 0, TAU); c.fill(); }
    for (let i = 0; i < 5; i++) blob(c, r() * 480, r() * 270, 10 + r() * 18, 4 + r() * 8, [20, 19, 18], .6);
    c.strokeStyle = '#141312'; c.lineWidth = .8; for (let i = 0; i < 6; i++) { const x = r() * 480, y = r() * 270; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 8, y - 6, x + 4, y + 10, x + 14 + r() * 6, y + 4); c.stroke(); }
  });
  const xStamp = () => mkT('x-stamp', 250, 70, [font(400, 30, F.slab)], (c) => {
    c.strokeStyle = '#141312'; c.lineWidth = 4; c.strokeRect(8, 8, 234, 54); type(c, 'CONFIDENCIAL', 125, 36, { f: font(400, 30, F.slab), fill: '#141312', track: 2 });
    c.globalCompositeOperation = 'destination-out'; const r = rng(5); for (let i = 0; i < 260; i++) { c.beginPath(); c.arc(r() * 250, r() * 70, r() * 1.8, 0, TAU); c.fill(); }
  });
  const XS = [[0, 'A', 1], [1.08, 'Bn', 1.3], [1.2, 'A', 1], [1.72, 'An', 1.15], [1.84, 'A', 1], [2.2, 'B', 1], [4.2, 'K', 'NÃO'], [4.3, 'An', 1.4], [4.42, 'C', 1.2], [4.52, 'B', 1.6],
    [4.6, 'W'], [4.66, 'A', 1.8], [4.78, 'Bn', 1], [4.88, 'K', 'OLHE'], [5.0, 'An', 1], [5.08, 'W'], [5.14, 'C', 1]];
  function typed(g, s, x, y, n, f, fill) {
    g.font = f; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = fill; let xx = x;
    for (let i = 0; i < Math.min(n, s.length); i++) { const r = rng(i * 31 + s.length), ch = s[i]; g.globalAlpha = .75 + r() * .25; g.fillText(ch, xx + (r() - .5) * .8, y + (r() - .5) * 1.4); g.fillText(ch, xx + .5, y + (r() - .5) * 1.4); xx += g.measureText(ch).width; }
    g.globalAlpha = 1;
  }
  R['xerox-grunge'] = (g, t, W, H) => {
    const fq = Math.floor(t * 12), u = (fq / 12) % 8, r = rng(fq * 7 + 1);
    let st = XS[0]; for (const s of XS) if (u >= s[0]) st = s;
    const jx = (r() - .5) * 3, jy = (r() - .5) * 3 + (r() < .08 ? 7 : 0), INK = '#141312', PAP = '#E9E6DE';
    const plate = (k, z) => { const s = xPlate(k), push = 1 + .025 * (u - st[0]); g.save(); g.translate(W / 2 + jx, H / 2 + jy); g.scale(z * push, z * push); g.drawImage(s, -W / 2, -H / 2, W, H); g.restore(); };
    if (u >= 7.4) { // lâmpada da copiadora varrendo: revela a próxima cópia
      plate('C', 1); const bx = lerp(-60, W + 60, (u - 7.4) / .6);
      g.save(); g.beginPath(); g.rect(0, 0, bx, H); g.clip(); plate('A', 1); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lin(g, bx - 50, 0, bx + 12, 0, [[0, 'rgba(255,255,255,0)'], [.8, 'rgba(230,255,235,.75)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(bx - 50, 0, 62, H); g.restore();
    } else if (st[1] === 'K' || st[1] === 'W') {
      bg(g, W, H, st[1] === 'K' ? INK : PAP);
      if (st[2]) typed(g, st[2], 150 + jx, 135 + jy, 9, font(600, 64, F.mono), PAP);
    } else plate(st[1], st[2]);
    // sobreposições: fita + datilografia, marcador, carimbo
    if (u < 2.2 && st[1] === 'A') { g.save(); g.translate(26 + jx, 34 + jy); g.rotate(-.03); g.fillStyle = 'rgba(214,210,198,.92)'; g.fillRect(0, -16, 196, 32); typed(g, 'ARQUIVO Nº 07', 12, 1, Math.floor(seg(u, .2, 1.2) * 13), XT[1], INK); g.restore(); }
    if (st[1] === 'B' && u < 4.2) {
      g.save(); g.beginPath(); g.rect(0, 0, 120 + Math.floor(seg(u, 2.45, 3.25) * 8) * 40, H); g.clip(); type(g, 'NÃO OLHE', 244 + jx, 236 + jy, { f: font(400, 44, F.marker), fill: INK }); g.restore();
      doodle(g, ellPts(245 + jx, 142 + jy, 84, 66, 1.2, -2, .12, 5), Math.floor(seg(u, 3.4, 3.9) * 6) / 6, INK, 4.5, fq, 2.5);
    }
    if (st[1] === 'C' && u >= 5.14 && u < 7.4) {
      g.save(); g.translate(150 + jx, 232 + jy); g.rotate(-.02); g.fillStyle = 'rgba(214,210,198,.92)'; g.fillRect(0, -16, 238, 32); typed(g, 'ninguém viu nada.', 12, 1, Math.floor(seg(u, 5.4, 6.5) * 17), XT[1], INK); g.restore();
      if (u >= 6.7) { const k = u < 6.76 ? 1.5 : u < 6.84 ? 1.08 : 1; g.save(); g.translate(336 + jx, 172 + jy); g.rotate(-.13); g.scale(k, k); putC(g, xStamp(), 0, 0); g.restore(); }
    }
    // poeira de toner, riscos, borda da tampa, flicker
    const sp = xSpecks(), ox = r() * 480; g.globalAlpha = .9; g.drawImage(sp, -ox, 0, 480, 270); g.drawImage(sp, 480 - ox, 0, 480, 270); g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const x = r() * W; g.fillStyle = r() < .5 ? 'rgba(20,19,18,.7)' : 'rgba(240,238,230,.6)'; g.fillRect(x, 0, .8 + r() * 1.4, H); }
    if (r() < .35) { const x = r() < .5 ? -30 + r() * 20 : W - 20 - r() * 20; g.fillStyle = INK; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= H; y += 18) g.lineTo(x + 30 + (r() - .5) * 8, y); g.lineTo(x, H); g.fill(); }
    if (r() < .3) { g.fillStyle = `rgba(20,19,18,${.08 + r() * .12})`; g.fillRect(0, 0, W, H); }
  };

  // ================================================================ 5. KEN BURNS + PARALLAX 2.5D
  const G1 = (v, a = 1) => `rgba(${cl8(v)},${cl8(v * .97)},${cl8(v * .92)},${a})`;
  const KW = 560, KH = 315;
  function kbFinish(c, w, h, draw, blurPx = 0, tone = 'sepia(.8) contrast(1.06) brightness(1.02)') {
    const x = newC(w, h); draw(x, w, h); let src = x.canvas; if (blurPx) src = blurC(src, blurPx); c.drawImage(filt(src, tone), 0, 0, w, h);
  }
  function kbBuilding(c) {
    c.translate(0, 24); const x0 = 110, x1 = 450, yb = 222, mx = (x0 + x1) / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x0 - 12, yb - 4, x1 - x0 + 20, 8);
    c.fillStyle = lin(c, x0, 0, x1, 0, [[0, G1(146)], [1, G1(200)]]); c.fillRect(x0, 96, x1 - x0, yb - 96);
    c.fillStyle = G1(96, .3); for (let y = 170; y < yb; y += 7) c.fillRect(x0, y, x1 - x0, .8); for (let y = 104; y < 160; y += 9) c.fillRect(x0, y, x1 - x0, .5);
    { const r = rng(17); for (let i = 0; i < 9; i++) { const wx = x0 + 16 + i * 37.5; c.fillStyle = lin(c, 0, 152, 0, 200, [[0, G1(70, .22 + r() * .1)], [1, G1(70, 0)]]); c.fillRect(wx + 2, 156, 16, 40); } }
    c.fillStyle = lin(c, 0, yb - 40, 0, yb, [[0, G1(40, 0)], [1, G1(40, .3)]]); c.fillRect(x0, yb - 40, x1 - x0, 40);
    for (let i = 0; i < 9; i++) { const ax = x0 + 12 + i * 37.5; c.fillStyle = G1(44); c.beginPath(); c.moveTo(ax, yb); c.lineTo(ax, 184); c.arc(ax + 13, 184, 13, Math.PI, 0); c.lineTo(ax + 26, yb); c.fill(); c.fillStyle = G1(96, .55); c.fillRect(ax + 19, 184, 7, yb - 184); }
    c.fillStyle = G1(214); c.fillRect(x0 - 4, 162, x1 - x0 + 8, 5); c.fillStyle = G1(84); c.fillRect(x0 - 4, 167, x1 - x0 + 8, 3);
    for (let i = 0; i < 9; i++) {
      const wx = x0 + 16 + i * 37.5; c.fillStyle = G1(38); c.fillRect(wx, 118, 20, 34); c.beginPath(); c.arc(wx + 10, 118, 10, Math.PI, 0); c.fill();
      c.fillStyle = G1(128, .5); c.fillRect(wx + 9, 110, 2, 42); c.fillRect(wx, 132, 20, 2);
      c.fillStyle = G1(214); poly(c, [[wx - 4, 106], [wx + 10, 98], [wx + 24, 106]]); c.fill(); c.fillStyle = G1(96); c.fillRect(wx - 4, 106, 28, 2);
      c.fillStyle = G1(210); c.fillRect(wx - 3, 152, 26, 3); c.fillStyle = G1(70); c.fillRect(wx - 3, 155, 26, 2);
      if (i < 8) { const cx2 = wx + 28.5; c.fillStyle = lin(c, cx2 - 3.5, 0, cx2 + 3.5, 0, [[0, G1(112)], [.65, G1(226)], [1, G1(158)]]); c.fillRect(cx2 - 3.5, 100, 7, 60); c.fillStyle = G1(60, .5); c.fillRect(cx2 - 5.5, 100, 2, 60); }
    }
    c.fillStyle = G1(222); c.fillRect(x0 - 8, 88, x1 - x0 + 16, 9); c.fillStyle = G1(76); c.fillRect(x0 - 8, 97, x1 - x0 + 16, 4);
    for (let i = 0; i < 40; i++) { c.fillStyle = G1(i % 2 ? 190 : 120); c.fillRect(x0 - 4 + i * 8.6, 78, 4, 10); } c.fillStyle = G1(206); c.fillRect(x0 - 6, 75, x1 - x0 + 12, 4);
    c.fillStyle = G1(212); poly(c, [[mx - 74, 88], [mx, 60], [mx + 74, 88]]); c.fill(); c.fillStyle = G1(128); poly(c, [[mx - 62, 86], [mx, 64], [mx + 62, 86]]); c.fill();
    c.fillStyle = lin(c, mx - 36, 0, mx + 36, 0, [[0, G1(104)], [.68, G1(222)], [1, G1(150)]]); c.fillRect(mx - 32, 36, 64, 26);
    for (let i = 0; i < 6; i++) { c.fillStyle = G1(46); c.fillRect(mx - 27 + i * 10, 42, 5, 14); }
    c.beginPath(); c.ellipse(mx, 37, 36, 32, 0, Math.PI, 0); c.fillStyle = rad(c, mx + 14, 16, 4, 44, [[0, G1(236)], [.6, G1(160)], [1, G1(92)]]); c.fill();
    c.strokeStyle = G1(80, .5); c.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(mx + i * 10.5, 37); c.quadraticCurveTo(mx + i * 8, 14, mx, 5); c.stroke(); }
    c.fillStyle = G1(196); c.fillRect(mx - 5, -4, 10, 10); c.beginPath(); c.arc(mx, -4, 5, Math.PI, 0); c.fill(); c.fillRect(mx - .8, -18, 1.6, 12);
    for (const tx of [x0 + 18, x1 - 18]) { c.fillStyle = lin(c, tx - 16, 0, tx + 16, 0, [[0, G1(120)], [.7, G1(218)], [1, G1(150)]]); c.fillRect(tx - 16, 60, 32, 30); c.beginPath(); c.ellipse(tx, 61, 17, 18, 0, Math.PI, 0); c.fill(); c.fillStyle = G1(44); c.fillRect(tx - 5, 66, 10, 18); }
  }
  function gent(c, x, y, h, o = {}) {
    const { coat = [58, 54, 50], L = 1, skin = [196, 172, 150] } = o, s = h / 238, sl = Math.sign(L);
    c.save(); c.translate(x, y - 150 * s); c.scale(s, s);
    c.fillStyle = C(coat, .55); c.beginPath(); c.moveTo(-17, 90); c.lineTo(-15, 146); c.lineTo(-4, 146); c.lineTo(-1, 96); c.lineTo(3, 96); c.lineTo(6, 146); c.lineTo(17, 146); c.lineTo(17, 90); c.closePath(); c.fill();
    c.fillStyle = C(coat, .3); rr(c, -19, 144, 17, 6, 3); c.fill(); rr(c, 4, 144, 18, 6, 3); c.fill();
    contact(c, 2, 150, 34, 5, .5);
    c.strokeStyle = C(coat, .38); c.lineWidth = 2.2; c.beginPath(); c.moveTo(47, 84); c.lineTo(58, 150); c.stroke();
    const cp = () => { c.beginPath(); c.moveTo(-11, -3); c.bezierCurveTo(-26, 0, -45, 3, -50, 17); c.bezierCurveTo(-52, 40, -46, 70, -40, 104); c.lineTo(40, 104); c.bezierCurveTo(46, 70, 52, 40, 50, 17); c.bezierCurveTo(45, 3, 26, 0, 11, -3); c.closePath(); };
    cp(); c.fillStyle = lin(c, -50, 0, 50, 0, [[0, C(coat, sl < 0 ? 1.3 : .55)], [.5, C(coat, 1)], [1, C(coat, sl < 0 ? .55 : 1.35)]]); c.fill();
    c.fillStyle = C([220, 214, 204], .95); c.beginPath(); c.moveTo(-10, -4); c.lineTo(10, -4); c.lineTo(0, 34); c.closePath(); c.fill(); c.fillStyle = C(coat, .35); c.beginPath(); c.moveTo(-3, 2); c.lineTo(3, 2); c.lineTo(4, 30); c.lineTo(0, 36); c.lineTo(-4, 30); c.closePath(); c.fill();
    for (const sd of [-1, 1]) { c.fillStyle = C(coat, sd === sl ? 1.15 : .45); c.beginPath(); c.moveTo(sd * 10, -4); c.lineTo(sd * 20, 2); c.lineTo(sd * 13, 18); c.lineTo(sd * 17, 22); c.lineTo(sd * 1, 50); c.closePath(); c.fill(); }
    c.fillStyle = C(coat, .8); c.beginPath(); c.moveTo(-50, 17); c.quadraticCurveTo(-58, 50, -52, 86); c.lineTo(-40, 86); c.quadraticCurveTo(-42, 50, -38, 24); c.closePath(); c.fill();
    c.fillStyle = C(coat, 1.2); c.beginPath(); c.moveTo(50, 17); c.quadraticCurveTo(56, 50, 50, 82); c.lineTo(40, 84); c.quadraticCurveTo(42, 50, 38, 24); c.closePath(); c.fill();
    c.fillStyle = C(skin, .9); c.beginPath(); c.arc(-46, 90, 5.5, 0, TAU); c.fill(); c.beginPath(); c.arc(46, 86, 5.5, 0, TAU); c.fill();
    neck(c, skin, L); c.translate(0, 3); head(c, { L, skin, hair: [40, 36, 32], hat: [44, 42, 40], hatKind: 'bowler' });
    c.fillStyle = C([46, 40, 36]); c.beginPath(); c.moveTo(0, -32.5); c.bezierCurveTo(-5, -34, -10, -31, -12, -28); c.quadraticCurveTo(-6, -30, 0, -29.5); c.quadraticCurveTo(6, -30, 12, -28); c.bezierCurveTo(10, -31, 5, -34, 0, -32.5); c.fill();
    c.restore();
  }
  const kbA = (i) => mk('kbA' + i, KW, KH, (c, w, h) => kbFinish(c, w, h, (x) => {
    const r = rng(3 + i);
    if (i === 0) {
      x.fillStyle = lin(x, 0, 0, 0, 200, [[0, G1(196)], [1, G1(232)]]); x.fillRect(0, 0, w, h);
      for (let k = 0; k < 7; k++) blob(x, r() * w, 30 + r() * 60, 60 + r() * 60, 14 + r() * 10, [242, 238, 230], .7);
      for (let k = 0; k < 26; k++) { const bw = 14 + r() * 30, bh = 20 + r() * 34, bx = k * 22 - 10; x.fillStyle = G1(172 + r() * 20); x.fillRect(bx, 238 - bh, bw, bh); }
      x.fillStyle = G1(180); x.fillRect(470, 174, 12, 64); x.beginPath(); x.moveTo(466, 174); x.lineTo(476, 152); x.lineTo(486, 174); x.fill();
      x.fillStyle = lin(x, 0, 170, 0, 245, [[0, G1(236, 0)], [1, G1(236, .8)]]); x.fillRect(0, 170, w, 75);
    } else if (i === 1) kbBuilding(x);
    else if (i === 2) {
      x.translate(0, 24); x.fillStyle = lin(x, 0, 214, 0, KH, [[0, G1(150)], [1, G1(92)]]); x.fillRect(0, 214, w, KH - 214);
      x.strokeStyle = G1(70, .35); x.lineWidth = 1; for (let k = 0; k < 16; k++) { x.beginPath(); x.moveTo(0, 220 + k * k * .45); x.lineTo(w, 220 + k * k * .45); x.stroke(); }
      x.strokeStyle = G1(210, .8); x.lineWidth = 1.6; x.beginPath(); x.moveTo(240, 216); x.quadraticCurveTo(200, 260, 60, KH); x.moveTo(262, 216); x.quadraticCurveTo(250, 262, 150, KH); x.stroke();
      [[160, 236, 30, 1], [178, 238, 31, 1], [300, 232, 26, -1], [330, 240, 32, -1], [226, 246, 38, 1]].forEach(([px, py, ph, d], k) => walker(x, px, py, ph, k * 1.3, { dir: d, coat: [70 + k * 8, 64 + k * 8, 58 + k * 6], skirt: k === 2, L: 1 }));
      x.fillStyle = G1(52); x.fillRect(288, 150, 3, 88); x.fillRect(282, 146, 15, 6); blob(x, 290, 145, 8, 6, [240, 236, 226], .6);
      for (const [gx, gy, gh, gd] of [[200, 244, 40, 1], [360, 236, 34, -1]]) for (let k = 0; k < 6; k++) { x.globalAlpha = .12; walker(x, gx + k * 3 * gd, gy, gh, 1 + k * .5, { dir: gd, coat: [90, 84, 78], L: 1 }); } x.globalAlpha = 1;
      for (const [px0, ph0, lean] of [[74, 168, -.08], [488, 150, .1]]) { // palmeiras
        x.save(); x.translate(px0, 244); x.strokeStyle = G1(70); x.lineCap = 'round'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(lean * 200, -ph0 * .5, lean * 160, -ph0); x.stroke();
        x.strokeStyle = G1(110, .5); x.lineWidth = 1; for (let k = 8; k < ph0; k += 7) { const q = k / ph0, tx0 = lean * 200 * 2 * q * (1 - q) + lean * 160 * q * q; x.beginPath(); x.moveTo(tx0 - 3, -k); x.lineTo(tx0 + 3, -k); x.stroke(); }
        x.translate(lean * 160, -ph0); x.strokeStyle = G1(58); for (let k = 0; k < 10; k++) { const a = -Math.PI + k / 9 * Math.PI + (r() - .5) * .2, L0 = 40 + r() * 14; x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, 0); const ex = Math.cos(a) * L0, ey = Math.sin(a) * L0 * .5 + 16; x.quadraticCurveTo(Math.cos(a) * L0 * .5, Math.sin(a) * L0 * .6 - 8, ex, ey); x.stroke(); x.lineWidth = .9; for (let j = 2; j < 10; j++) { const q = j / 10, bx = lerp(0, ex, q), by = lerp(0, ey, q) - Math.sin(q * Math.PI) * 6; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + 1.2) * 7, by + 7); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a - 1.2) * 7, by + 7); x.stroke(); } }
        x.restore(); }
    } else {
      gent(x, 432, 306, 214);
      x.fillStyle = lin(x, 26, 0, 46, 0, [[0, G1(40)], [.6, G1(110)], [1, G1(34)]]); x.fillRect(30, 70, 12, KH - 70); x.fillRect(24, 290, 24, 30);
      x.fillStyle = G1(40); poly(x, [[18, 70], [54, 70], [46, 30], [26, 30]]); x.fill(); x.fillStyle = G1(226, .9); poly(x, [[24, 66], [48, 66], [43, 36], [29, 36]]); x.fill(); x.fillStyle = G1(40); x.fillRect(20, 24, 32, 7);
    }
  }, [.5, .45, .45, .9][i]));
  const kbB = (i) => mk('kbB' + i, KW, KH, (c, w, h) => kbFinish(c, w, h, (x) => {
    const r = rng(20 + i);
    if (i === 0) {
      x.fillStyle = lin(x, 0, 0, 0, 190, [[0, G1(150)], [1, G1(226)]]); x.fillRect(0, 0, w, h);
      for (let k = 0; k < 4; k++) { const cx = 60 + k * 140 + r() * 40, cy = 60 + r() * 30; for (let j = 0; j < 7; j++) { const ox = (r() - .5) * 90, oy = (r() - .5) * 26, rr0 = 18 + r() * 20; x.fillStyle = rad(x, cx + ox - 6, cy + oy - 10, 2, rr0 * 1.2, [[0, G1(250)], [.7, G1(214)], [1, G1(170, 0)]]); x.beginPath(); x.arc(cx + ox, cy + oy, rr0, 0, TAU); x.fill(); } }
      x.fillStyle = G1(196); x.beginPath(); x.moveTo(0, 170); for (let k = 0; k <= 28; k++) x.lineTo(k * 20, 150 - Math.abs(noise(k * .35, 4)) * 50); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    } else if (i === 1) {
      x.fillStyle = G1(128); x.beginPath(); x.moveTo(0, 210); for (let k = 0; k <= 28; k++) x.lineTo(k * 20, 170 - Math.abs(noise(k * .5 + 3, 1)) * 60 + (k > 10 && k < 20 ? 30 : 0)); x.lineTo(w, h); x.lineTo(0, h); x.fill();
      for (let k = 0; k < 900; k++) { const px = r() * w, py = 150 + r() * 165; x.fillStyle = G1(80 + r() * 50, .5); x.beginPath(); x.arc(px, py, 1 + r() * 2.2, 0, TAU); x.fill(); }
      x.fillStyle = G1(206, .7); x.beginPath(); x.moveTo(170, h); x.quadraticCurveTo(250, 250, 300, 238); x.quadraticCurveTo(340, 250, 380, h); x.fill();
    } else if (i === 2) {
      const yd = 176; x.fillStyle = lin(x, 0, yd, 0, 300, [[0, G1(178)], [1, G1(120)]]);
      for (let k = 0; k < 9; k++) { const pxl = 100 + k * 44; x.fillRect(pxl, yd + 8, 12, 150); }
      x.fillStyle = G1(172); x.fillRect(80, yd, 420, 10); x.fillStyle = G1(96); x.fillRect(80, yd + 10, 420, 3);
      x.fillStyle = G1(60); for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(112 + k * 44, yd + 60); x.lineTo(112 + k * 44, yd + 34); x.arc(134 + k * 44, yd + 34, 22, Math.PI, 0); x.lineTo(156 + k * 44, yd + 60); x.fill(); }
      x.fillStyle = G1(40); rr(x, 210, yd - 20, 54, 18, 5); x.fill(); x.fillRect(250, yd - 32, 20, 30); x.fillRect(220, yd - 32, 6, 14); x.fillStyle = G1(150); x.fillRect(254, yd - 28, 5, 6);
      for (let k = 0; k < 4; k++) { x.fillStyle = G1(58 + k * 8); x.fillRect(276 + k * 38, yd - 22, 34, 20); x.fillStyle = G1(150, .6); for (let j = 0; j < 3; j++) x.fillRect(280 + k * 38 + j * 10, yd - 18, 6, 6); }
      x.fillStyle = G1(28); for (let k = 0; k < 10; k++) { x.beginPath(); x.arc(216 + k * 22, yd - 1, 3, 0, TAU); x.fill(); }
      for (let k = 0; k < 14; k++) { const q = k / 13; blob(x, 223 + q * 150 + r() * 10, yd - 40 - q * 50 - r() * 10, 14 + q * 26, 10 + q * 16, [240, 238, 232], .85 - q * .4); }
    } else {
      x.fillStyle = G1(30); for (let k = 0; k < 22; k++) { const a = -1.2 + k * .06; x.save(); x.translate(-10, 330); x.rotate(a); x.beginPath(); x.ellipse(0, -80 - r() * 30, 9, 70, 0, 0, TAU); x.fill(); x.restore(); }
      x.strokeStyle = G1(26); x.lineWidth = 7; x.beginPath(); x.moveTo(KW + 10, 10); x.quadraticCurveTo(470, 30, 420, 18); x.stroke();
      for (let k = 0; k < 26; k++) { x.fillStyle = G1(24 + r() * 20); x.beginPath(); x.ellipse(430 + r() * 140, r() * 60, 12, 6, r() * 3, 0, TAU); x.fill(); }
    }
  }, [.6, .45, .45, 2.2][i], 'sepia(.7) contrast(1.05) saturate(.85)'));
  // cópia antiga: densidade irregular, riscos finos, poeira e vinheta, tudo num sprite 1:1
  const kbPrint = () => mk('kb-print', 480, 270, (c, w, h) => {
    vignette(c, w, h, .55); const r = rng(61);
    for (let i = 0; i < 14; i++) blob(c, r() * w, r() * h, 40 + r() * 90, 30 + r() * 60, r() < .5 ? [60, 40, 20] : [255, 240, 210], .07 + r() * .06);
    c.strokeStyle = 'rgba(255,248,230,.35)'; c.lineWidth = .6; for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20 + r() * 40, y + (r() - .5) * 30, x + 30 + r() * 70, y + (r() - .5) * 60); c.stroke(); }
    for (let i = 0; i < 70; i++) { c.fillStyle = r() < .7 ? 'rgba(30,20,10,.35)' : 'rgba(255,250,235,.4)'; c.beginPath(); c.arc(r() * w, r() * h, .4 + r() * 1.1, 0, TAU); c.fill(); }
  });
  const KCR = { A: [[[0, 0, 560, 315]], [[76, 0, 400, 252]], [[0, 170, 560, 145], [10, 40, 130, 130], [430, 50, 130, 120]], [[350, 70, 160, 245], [10, 20, 60, 295]]],
    B: [[[0, 0, 560, 315]], [[0, 90, 560, 225]], [[80, 90, 430, 225]], [[0, 130, 230, 185], [380, 0, 180, 90]]] };
  const kbCap = (a, b) => mkT('kbc' + a, 260, 60, [`italic 400 19px ${F.serif}`, font(600, 14, F.grot)], (c) => {
    c.fillStyle = 'rgba(245,236,214,.9)'; c.fillRect(250, 8, 2, 44);
    type(c, a, 240, 20, { f: `italic 400 19px ${F.serif}`, fill: '#F5ECD6', align: 'right', stroke: 'rgba(20,14,8,.35)', lw: 3 });
    type(c, b, 240, 42, { f: font(600, 14, F.grot), fill: 'rgba(245,236,214,.85)', align: 'right', track: 2.5 });
  });
  function kbShot(g, L, crops, s, px, py, alpha = 1) {
    const D = [.3, .6, .85, 1.3]; g.save(); g.globalAlpha = alpha;
    for (let i = 0; i < 4; i++) {
      const d = D[i], k = 1 + (s - 1) * d * 1.2, S = L(i); g.save(); g.translate(W0 / 2 + px * d, H0 / 2 + py * d); g.scale(k, k);
      for (const [sx, sy, sw, sh] of crops[i]) g.drawImage(S, sx * SC, sy * SC, sw * SC, sh * SC, sx - KW / 2, sy - KH / 2, sw, sh);
      g.restore();
    }
    g.restore();
  }
  const W0 = 480, H0 = 270;
  R['ken-burns-parallax'] = (g, t, W, H) => {
    const u = t % 8, ta = (u + .6) % 8, tb = u - 3.7;
    const camA = (q) => [1.02 + .11 * q, 14 - 30 * q, 4 - 8 * q], camB = (q) => [1.03 + .1 * q, -22 + 40 * q, -4 + 6 * q];
    const drawA = (al) => { const [s, x, y] = camA(clamp(ta / 4.9)); kbShot(g, kbA, KCR.A, s, x, y, al); };
    const drawB = (al) => { const [s, x, y] = camB(clamp(tb / 4.3)); kbShot(g, kbB, KCR.B, s, x, y, al); };
    if (u < 3.7) drawA(1);
    else if (u < 4.3) { drawA(1); drawB(eio(seg(u, 3.7, 4.3))); }
    else if (u < 7.4) drawB(1);
    else { drawB(1); drawA(eio(seg(u, 7.4, 8))); }
    GR(g, t, .09); g.drawImage(kbPrint(), 0, 0, 480, 270);
    const cap = (a, b, lt, t0, t1) => { if (lt < t0 || lt > t1) return; const kin = ease(seg(lt, t0, t0 + .6)), kout = seg(lt, t1 - .4, t1); g.save(); g.beginPath(); g.rect(466 - 262 * kin, 196, 262 * kin * (1 - kout) + 2, 70); g.clip(); put(g, kbCap(a, b), 206, 196); g.restore(); };
    if (u < 4.3 || u >= 7.4) cap('Rio de Janeiro, 1908', 'AVENIDA CENTRAL', ta, .9, 3.9);
    if (u >= 3.7) cap('Serra do Mar, 1911', 'ESTRADA DE FERRO', tb, .9, 3.8);
  };

  // ================================================================ 6. ARQUIVO COM GRÃO
  const SP = (v, a = 1) => `rgba(${cl8(v * 1.02)},${cl8(v * .9)},${cl8(v * .72)},${a})`;
  const arBg = () => mk('ar-bg', 380, 290, (c, w, h) => {
    const x = newC(w, h), r = rng(31);
    x.fillStyle = lin(x, 0, 0, 0, 150, [[0, SP(236)], [1, SP(224)]]); x.fillRect(0, 0, w, h);
    const VP = [196, 150];
    x.fillStyle = SP(120); poly(x, [[0, 10], [120, 78], [120, 196], [0, 236]]); x.fill();
    x.fillStyle = SP(162); poly(x, [[380, 20], [262, 82], [262, 196], [380, 236]]); x.fill();
    for (let k = 0; k < 5; k++) for (let j = 0; j < 4; j++) {
      const q = k / 5, xl = lerp(10, 110, q), yt = lerp(34, 94, q) + j * lerp(46, 26, q); x.fillStyle = SP(58); x.fillRect(xl, yt, lerp(14, 6, q), lerp(26, 13, q));
      const xr = lerp(368, 272, q), yr = lerp(42, 96, q) + j * lerp(44, 25, q); x.fillStyle = SP(88); x.fillRect(xr - lerp(14, 6, q), yr, lerp(14, 6, q), lerp(26, 13, q));
    }
    x.fillStyle = SP(190); x.fillRect(120, 110, 142, 86); for (let k = 0; k < 7; k++) { x.fillStyle = SP(96); x.fillRect(128 + k * 19.5, 124, 9, 16); x.fillRect(128 + k * 19.5, 154, 9, 16); }
    x.fillStyle = lin(x, 176, 0, 206, 0, [[0, SP(150)], [.6, SP(212)], [1, SP(130)]]); x.fillRect(176, 40, 30, 72); poly(x, [[172, 40], [191, 12], [210, 40]]); x.fill();
    x.fillStyle = SP(240); x.beginPath(); x.arc(191, 60, 9, 0, TAU); x.fill(); x.strokeStyle = SP(40); x.lineWidth = 1.4; x.beginPath(); x.moveTo(191, 60); x.lineTo(191, 54); x.moveTo(191, 60); x.lineTo(196, 62); x.stroke();
    x.fillStyle = lin(x, 0, 196, 0, h, [[0, SP(170)], [1, SP(110)]]); poly(x, [[0, 236], [120, 196], [262, 196], [380, 236], [380, h], [0, h]]); x.fill();
    x.strokeStyle = SP(80, .6); x.lineWidth = 1.2; for (const o of [-14, 14]) { x.beginPath(); x.moveTo(VP[0] + o * .2, 196); x.lineTo(VP[0] + o * 9, h); x.stroke(); }
    x.strokeStyle = SP(60, .8); x.lineWidth = .8; x.beginPath(); x.moveTo(0, 30); x.quadraticCurveTo(190, 60, 380, 34); x.moveTo(0, 44); x.quadraticCurveTo(190, 74, 380, 48); x.stroke();
    for (const lx of [60, 330]) { x.fillStyle = SP(44); x.fillRect(lx, 120, 3, 124); x.fillRect(lx - 5, 116, 13, 5); }
    for (let k = 0; k < 400; k++) { x.fillStyle = SP(80 + r() * 60, .25); x.fillRect(r() * w, 196 + r() * 94, 2, 1); }
    c.drawImage(blurC(x.canvas, .6), 0, 0, w, h);
  });
  const arTram = () => mk('ar-tram', 160, 90, (c) => {
    c.fillStyle = lin(c, 0, 20, 0, 80, [[0, SP(150)], [1, SP(70)]]); rr(c, 8, 26, 144, 50, 6); c.fill();
    c.fillStyle = SP(200); c.fillRect(4, 22, 152, 7); c.fillStyle = SP(50); for (let k = 0; k < 7; k++) c.fillRect(16 + k * 19, 34, 13, 18);
    c.fillStyle = SP(120); for (let k = 0; k < 7; k++) if (k % 2) { c.beginPath(); c.arc(22 + k * 19, 44, 3.5, 0, TAU); c.fill(); c.fillRect(18 + k * 19, 47, 8, 6); }
    c.fillStyle = SP(215); c.fillRect(60, 56, 40, 10); c.fillStyle = SP(40); c.font = font(700, 9, F.grot); c.textAlign = 'center'; c.fillText('12', 80, 64);
    c.fillStyle = SP(28); for (const wx of [30, 130]) { c.beginPath(); c.arc(wx, 78, 7, 0, TAU); c.fill(); }
    c.strokeStyle = SP(40); c.lineWidth = 1.6; c.beginPath(); c.moveTo(80, 22); c.lineTo(114, 0); c.stroke();
  });
  const arPasser = () => mk('ar-pass', 200, 300, (c, w, h) => { const x = newC(w, h); walker(x, 100, 330, 330, .6, { coat: [40, 36, 32], skin: [150, 130, 110], L: 1 }); c.drawImage(blurC(x.canvas, 4), 0, 0, w, h); });
  const arTitle = () => mkT('ar-title', 360, 270, [font(700, 34, F.didone), `italic 400 20px ${F.serif}`], (c) => {
    c.fillStyle = '#0E0C0A'; c.fillRect(0, 0, 360, 270); c.strokeStyle = '#E8DEC8'; c.lineWidth = 2; c.strokeRect(22, 22, 316, 226); c.lineWidth = .8; c.strokeRect(29, 29, 302, 212);
    for (const [x, y, sx, sy] of [[29, 29, 1, 1], [331, 29, -1, 1], [29, 241, 1, -1], [331, 241, -1, -1]]) { c.beginPath(); c.moveTo(x + sx * 4, y + sy * 26); c.lineTo(x + sx * 4, y + sy * 4); c.lineTo(x + sx * 26, y + sy * 4); c.stroke(); c.beginPath(); c.arc(x + sx * 12, y + sy * 12, 3, 0, TAU); c.stroke(); }
    type(c, 'CINEJORNAL', 180, 110, { f: font(700, 34, F.didone), fill: '#EFE6D2', track: 5 });
    c.fillStyle = '#E8DEC8'; c.fillRect(110, 136, 58, 1); c.fillRect(192, 136, 58, 1); poly(c, [[180, 131], [185, 136], [180, 141], [175, 136]]); c.fill();
    type(c, 'Rio de Janeiro · 1922', 180, 166, { f: `italic 400 20px ${F.serif}`, fill: '#D9CFB8' });
  });
  const WK = [[40, 234, 46, 30, 1, 0], [300, 222, 36, -22, 0, 0], [380, 252, 62, -36, 0, 1], [120, 214, 28, 16, 1, 0], [200, 244, 54, 30, 0, 1], [250, 228, 40, -18, 1, 0]];
  R['arquivo-grao'] = (g, t, W, H) => {
    const u = t % 8, f24 = Math.floor(t * 24), r = rng(f24 * 3 + 5), tf = Math.floor(t * 18) / 18;
    const wx = noise(t * 3.1, 2) * 1.3 + (r() - .5) * .6, wy = noise(t * 2.3, 5) * 1.6 + (r() < .04 ? 3 : 0), fl = .92 + r() * .1;
    bg(g, W, H, '#17120D');
    g.save(); g.translate(wx, wy); g.beginPath(); g.rect(60, 0, 360, 270); g.clip();
    if (u < 1) { // pontas de rolo com contagem
      const n = u < .5 ? 3 : 2, lu = u % .5; g.fillStyle = '#A29C8E'; g.fillRect(60, 0, 360, 270);
      g.fillStyle = '#77726A'; g.beginPath(); g.moveTo(240, 135); g.arc(240, 135, 240, -Math.PI / 2, -Math.PI / 2 + lu / .5 * TAU); g.closePath(); g.fill();
      g.strokeStyle = '#EDE7DA'; g.lineWidth = 3; g.beginPath(); g.arc(240, 135, 100, 0, TAU); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(240, 135, 86, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(60, 135); g.lineTo(420, 135); g.moveTo(240, 0); g.lineTo(240, 270); g.stroke();
      type(g, String(n), 240, 142, { f: font(800, 120, F.grot), fill: '#141210' });
    } else if (u < 2.4) put(g, arTitle(), 60, 0);
    else { // cinejornal: praça, bonde, pedestres (câmera acelerada, 18 qps)
      g.drawImage(arBg(), 50, -10, 380, 290);
      const lt = tf - 2.4 + Math.floor(t / 8) * 0;
      const tramX = lerp(460, -150, seg(u, 2.5, 6.4)); if (u < 6.4) g.drawImage(arTram(), tramX, 150 + Math.sin(tf * 20) * .4, 160, 90);
      WK.forEach(([x0, y, h, v, hat, sk], i) => { let x = x0 + v * (u - 2.4) * 1.3; x = 50 + ((x - 50) % 380 + 380) % 380; walker(g, x, y, h, tf * 9 + i * 1.7, { dir: v > 0 ? 1 : -1, coat: [60 + i * 14, 54 + i * 12, 48 + i * 10], skin: [200, 180, 160], hat: !!hat, skirt: !!sk, L: 1 }); });
      if (u > 4.5 && u < 5.3) g.drawImage(arPasser(), lerp(-120, 460, seg(u, 4.5, 5.3)), -20, 200, 300);
      g.fillStyle = `rgba(245,230,200,${(1 - fl) * 1.2 + .02})`; g.fillRect(60, 0, 360, 270);
      if (u > 6.1) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, 430, 60, 10, 340, [[0, `rgba(255,140,40,${.9 * seg(u, 6.1, 6.9)})`], [1, 'rgba(255,80,20,0)']]); g.fillRect(60, 0, 360, 270); g.restore(); }
      if (u > 6.8) { // queimado de fim de rolo
        const k = seg(u, 6.8, 8), R0 = 6 + k * k * 300, cx = 300, cy = 110;
        g.fillStyle = 'rgba(50,24,6,.9)'; wobbleCircle(g, cx, cy, R0 + 14, t, 8, 2); g.fill(); g.fillStyle = '#FF8A1E'; wobbleCircle(g, cx, cy, R0 + 5, t, 7, 3); g.fill(); g.fillStyle = '#FFF1C8'; wobbleCircle(g, cx, cy, R0, t, 6, 4); g.fill();
      }
    }
    GR(g, t, .15);
    for (let i = 0; i < 6; i++) { g.fillStyle = r() < .6 ? 'rgba(20,14,8,.7)' : 'rgba(255,248,230,.6)'; g.beginPath(); g.arc(60 + r() * 360, r() * 270, .6 + r() * 1.6, 0, TAU); g.fill(); }
    if (r() < .3) { g.strokeStyle = 'rgba(20,14,8,.6)'; g.lineWidth = .8; const x = 60 + r() * 360, y = r() * 270; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 10, y - 8, x + 4, y + 12, x + 18, y + 6); g.stroke(); }
    const scx = 60 + 360 * (.3 + noise(Math.floor(t * 2) * .7, 1) * .3); g.fillStyle = 'rgba(255,250,235,.4)'; g.fillRect(scx + noise(t * 8, 3), 0, 1, 270);
    if (r() < .5) { g.fillStyle = 'rgba(255,250,235,.3)'; g.fillRect(60 + r() * 360, 0, .8, 270); }
    g.restore();
    // bordas de película com perfurações
    g.save(); g.translate(0, wy); const off = (t * 0) % 22; g.fillStyle = '#E4D8BE';
    for (let y = -22 + off; y < H + 22; y += 22) { rr(g, 20, y, 22, 13, 3); g.fill(); rr(g, 438, y, 22, 13, 3); g.fill(); }
    g.restore();
    g.save(); g.translate(50, 135); g.rotate(-Math.PI / 2); type(g, 'SAFETY FILM  ▸ 14', 0, 0, { f: font(500, 14, F.mono), fill: 'rgba(214,176,108,.55)', track: 2 }); g.restore();
    VIG(g, .35);
  };

  // ================================================================ 7. EXPLICATIVO ESTILO VOX
  const VF = { k: font(700, 14, F.body), h: font(900, 29, F.serif), s: `italic 400 16px ${F.serif}`, q: `italic 400 21px ${F.serif}`, n: font(700, 17, F.body), n2: font(500, 14, F.body), big: font(900, 46, F.grot), ax: font(500, 14, F.body) };
  const vxClip = () => mkT('vx-clip', 390, 230, [VF.k, VF.h, VF.s], (c) => tornScrap(c, 12, 12, 364, 204, 51, (c) => {
    c.fillStyle = '#F1ECE1'; c.fillRect(0, 0, 390, 230);
    type(c, 'ECONOMIA · 12 DE MAIO', 32, 36, { f: VF.k, fill: '#8A8378', align: 'left', track: 2 });
    type(c, 'Café dispara e vira', 32, 72, { f: VF.h, fill: '#161514', align: 'left' }); type(c, 'artigo de luxo', 32, 106, { f: VF.h, fill: '#161514', align: 'left' });
    type(c, 'O preço da saca subiu 340% em cinco anos.', 32, 140, { f: VF.s, fill: '#2A2826', align: 'left' });
    const r = rng(4); c.fillStyle = 'rgba(40,38,34,.32)'; for (let col = 0; col < 3; col++) for (let y = 160; y < 206; y += 6.5) c.fillRect(32 + col * 112, y, 98 - (r() < .15 ? 30 : 0), 2.2);
  }, .3));
  const vxPortrait = () => mk('vx-port', 200, 240, (c, w, h) => {
    const x = newC(w, h); bust(x, { x: 100, y: 142, s: 1.55, L: -1, skin: [200, 160, 130], hair: [60, 50, 40], cloth: [150, 140, 120], top: 'shirt', hat: [170, 150, 110], hatKind: 'wide' });
    const ht = halftone(filt(x.canvas, 'brightness(1.3) contrast(1.15)'), 3.2, '#191816', '#EDE8DD', 1.1, .64); c.drawImage(withShadow(outline(ht, 3.5, '#F7F4EC'), 3, 5, 3, .35), 0, 0, w, h);
  });
  const vxName = () => mkT('vx-name', 230, 70, [VF.n, VF.n2], (c) => tornScrap(c, 8, 8, 212, 52, 61, (c) => {
    c.fillStyle = '#F4F0E6'; c.fillRect(0, 0, 230, 70); type(c, 'SEBASTIÃO LIMA', 22, 30, { f: VF.n, fill: '#161514', align: 'left', track: 1 }); type(c, 'produtor de café, Minas Gerais', 22, 49, { f: VF.n2, fill: '#5A554D', align: 'left' });
  }, .3));
  const vxQuote = () => mkT('vx-quote', 230, 96, [VF.q], (c) => tornScrap(c, 10, 10, 210, 76, 64, (c) => {
    c.fillStyle = '#EAE4D6'; c.fillRect(0, 0, 230, 96); type(c, '“A colheita caiu', 26, 38, { f: VF.q, fill: '#1A1917', align: 'left' }); type(c, 'pela metade.”', 26, 64, { f: VF.q, fill: '#1A1917', align: 'left' });
  }, .3));
  const VD = [.22, .2, .27, .31, .45, .62, .88, 1];
  const vxChart = () => mkT('vx-chart', 380, 220, [VF.n, VF.ax], (c) => tornScrap(c, 10, 10, 360, 200, 70, (c) => {
    c.fillStyle = '#F4F0E6'; c.fillRect(0, 0, 380, 220); type(c, 'Preço da saca de café (R$)', 30, 36, { f: VF.n, fill: '#161514', align: 'left' });
    c.strokeStyle = 'rgba(40,38,34,.18)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(30, 70 + k * 32); c.lineTo(350, 70 + k * 32); c.stroke(); }
    c.strokeStyle = '#2A2826'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(30, 166); c.lineTo(350, 166); c.stroke();
    ['2021', '2022', '2023', '2024', '2025', '2026'].forEach((s, i) => type(c, s, 40 + i * 60, 186, { f: VF.ax, fill: '#5A554D' }));
  }, .3));
  const vxBg = () => mk('vx-bg', 560, 320, (c, w, h) => { paper(c, w, h, '#E6DFD1', 17); c.fillStyle = rad(c, w / 2, h / 2, 60, 360, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(50,40,25,.22)']]); c.fillRect(0, 0, w, h); });
  function hilite(g, x, y, w, h, k, seed) {
    if (k <= 0) return; const r = rng(seed); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(255,222,40,.92)';
    const ww = w * k; g.beginPath(); g.moveTo(x, y + r() * 2); for (let i = 1; i <= 8; i++) g.lineTo(x + ww * i / 8, y + (r() - .5) * 2.4); for (let i = 8; i >= 0; i--) g.lineTo(x + ww * i / 8, y + h + (r() - .5) * 2.4); g.closePath(); g.fill(); g.restore();
  }
  R['estilo-vox'] = (g, t, W, H) => {
    const u = t % 8, f = Math.floor(t * 12);
    const cam = (s, x, y) => { g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2 + x, -H / 2 + y); };
    const layer = (d, fn, cx, cy) => { g.save(); g.translate(cx * (d - 1), cy * (d - 1)); fn(); g.restore(); };
    g.save();
    if (u < 2.7) { // plano 1: recorte de jornal, marca-texto e sublinhado
      const q = u / 2.7, cx = 20 - 40 * q, cy = 4 - 6 * q; cam(1.1 + .06 * q, cx, cy, -.01);
      layer(.5, () => g.drawImage(vxBg(), -40, -25, 560, 320), cx, cy);
      g.save(); g.translate(240, 136); g.rotate(-.025); put(g, vxClip(), -195, -115);
      g.font = VF.h; const hw = g.measureText('artigo de luxo').width; hilite(g, -166, -24, hw + 8, 30, ease(seg(u, .5, 1.1)), 3);
      g.font = VF.s; const sw = g.measureText('O preço da saca subiu 340% em cinco anos.').width;
      doodle(g, [[-164, 38], [-164 + sw * .3, 37], [-164 + sw * .7, 39.5], [-162 + sw, 37.5]], ease(seg(u, 1.4, 1.9)), '#E3342F', 3, f, .8);
      g.restore();
    } else if (u < 5.3) { // plano 2: retrato em meio-tom, nome e citação
      const v = u - 2.7, q = v / 2.6, cx = -10 + 18 * q, cy = 0; cam(1.02 + .07 * q, cx, cy);
      layer(.5, () => g.drawImage(vxBg(), -40, -25, 560, 320), cx, cy);
      layer(.9, () => { if (v > .9) { const k = ease(seg(v, .9, 1.25)); g.save(); g.translate(352 + (1 - k) * 30, 84); g.rotate(.03); put(g, vxQuote(), -115, -48); g.font = VF.q; hilite(g, -90, 5, g.measureText('pela metade.”').width + 6, 24, ease(seg(v, 1.5, 2.0)), 7); g.restore(); } }, cx, cy);
      layer(1, () => put(g, vxPortrait(), 44, 30), cx, cy);
      layer(1.2, () => { if (v > .45) { const k = ease(seg(v, .45, .8)); g.save(); g.translate(338 + (1 - k) * 160, 196); g.rotate(-.02); put(g, vxName(), -115, -35); g.restore(); } }, cx, cy);
    } else { // plano 3: gráfico que sobe, número com marca-texto
      const v = u - 5.3, q = v / 2.7, cx = 8 - 14 * q, cy = 6 - 10 * q; cam(1.03 + .06 * q, cx, cy, .008);
      layer(.5, () => g.drawImage(vxBg(), -40, -25, 560, 320), cx, cy);
      g.save(); g.translate(240, 132); g.rotate(.015); put(g, vxChart(), -190, -110);
      const k = ease(seg(v, .25, 1.6)), n = VD.length - 1, pts = VD.map((d, i) => [-150 + i * (300 / n), 56 - d * 96]);
      g.strokeStyle = '#E3342F'; g.lineWidth = 3.5; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); const e = k * n;
      for (let i = 0; i <= Math.floor(e); i++) (i ? g.lineTo(...pts[i]) : g.moveTo(...pts[i]));
      if (e < n) { const i = Math.floor(e), fr = e - i; g.lineTo(lerp(pts[i][0], pts[i + 1][0], fr), lerp(pts[i][1], pts[i + 1][1], fr)); } g.stroke();
      if (k >= 1) { const p = 1 + Math.sin(v * 6) * .15; g.fillStyle = '#E3342F'; g.beginPath(); g.arc(pts[n][0], pts[n][1], 5 * p, 0, TAU); g.fill(); }
      if (v > 1.6) { const s = spr(seg(v, 1.6, 2.0)); g.save(); g.translate(-72, -26); g.scale(1.25 - .25 * s, 1.25 - .25 * s); g.font = VF.big; const bw = g.measureText('+340%').width; hilite(g, -bw / 2 - 6, -20, bw + 12, 40, ease(seg(v, 1.75, 2.1)), 11); type(g, '+340%', 0, 2, { f: VF.big, fill: '#161514' }); g.restore(); }
      g.restore();
    }
    g.restore();
    GR(g, t, .06);
  };

  // ================================================================ 8. QUADRO DE INVESTIGAÇÃO
  const QF = { cap: font(700, 17, F.hand), pi: font(400, 21, F.marker), p2: font(400, 19, F.marker), hd: font(900, 17, F.didone) };
  const qBoard = () => mk('q-board', 520, 310, (c, w, h) => {
    const x = newC(w, h), r = rng(8); x.fillStyle = '#8B6443'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const v = r(); x.fillStyle = v < .5 ? `rgba(60,35,18,${.2 + r() * .35})` : `rgba(200,160,110,${.12 + r() * .25})`; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 1.5); }
    for (let i = 0; i < 16; i++) blob(x, r() * w, r() * h, 20 + r() * 40, 14 + r() * 30, [70, 44, 24], .25);
    x.save(); x.translate(300, 140); x.rotate(.08); x.fillStyle = '#D9D2BE'; x.fillRect(-60, -44, 120, 88); x.strokeStyle = 'rgba(90,80,60,.5)'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(-60, -30 + i * 14); x.bezierCurveTo(-20, -40 + i * 16, 20, -20 + i * 10, 60, -34 + i * 15); x.stroke(); } x.restore();
    x.save(); x.translate(40, 250); x.rotate(-.1); x.fillStyle = '#E8E2D2'; x.fillRect(-40, -30, 90, 60); x.restore();
    x.save(); x.translate(480, 40); x.rotate(.12); x.fillStyle = '#E3DCCB'; x.fillRect(-30, -40, 70, 80); x.restore();
    c.drawImage(blurC(x.canvas, .6), 0, 0, w, h);
  });
  function qPhoto(c, kind, w, h) {
    if (kind === 'car') { c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#1A1D22'], [1, '#2E3033']]); c.fillRect(0, 0, w, h); c.fillStyle = '#3B3E42'; c.fillRect(6, 18, 34, 34); c.fillStyle = '#E8D9A0'; c.fillRect(14, 26, 8, 8); blob(c, 18, 30, 16, 14, [240, 220, 150], .35); c.fillStyle = '#0E0F11'; c.fillRect(0, 50, w, h - 50); blob(c, 52, 12, 8, 8, [255, 230, 170], .6); c.fillStyle = '#6C6A64'; c.fillRect(51, 10, 2, 44); return; }
    c.fillStyle = rad(c, w * .45, h * .4, 4, w, [[0, '#9EA2A4'], [1, '#55595C']]); c.fillRect(0, 0, w, h);
    bust(c, kind === 'rui' ? { x: w / 2, y: h * .98, s: .62, L: .4, skin: [190, 160, 140], hair: [40, 34, 30], cloth: [60, 62, 66], top: 'suit', shirt: [210, 206, 200], tie: [40, 40, 44] } : { x: w / 2, y: h * .98, s: .62, L: -.5, skin: [200, 168, 146], hair: [34, 26, 22], cloth: [120, 90, 84], top: 'sweater', fem: true });
  }
  const qPolaroid = (kind, cap) => mkT('q-p' + kind, 92, 108, [QF.cap], (c) => {
    const x = newC(92, 108); x.save(); x.translate(46, 54); x.fillStyle = '#F3F0E8'; x.fillRect(-38, -46, 76, 90);
    const ph = newC(64, 60); qPhoto(ph, kind, 64, 60); x.drawImage(filt(ph.canvas, 'grayscale(.85) contrast(1.1) sepia(.15)'), -32, -40, 64, 60);
    x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(-32, -40, 64, 60); type(x, cap, 0, 33, { f: QF.cap, fill: '#2B2A33' }); x.restore();
    c.drawImage(withShadow(x.canvas, 2, 5, 3, .55), 0, 0, 92, 108);
  });
  const qClip = () => mkT('q-clip', 132, 96, [QF.hd], (c) => { const x = newC(132, 96); tornScrap(x, 10, 10, 112, 76, 88, (x) => { x.fillStyle = '#E9E1CB'; x.fillRect(0, 0, 132, 96); type(x, 'SUMIÇO', 66, 30, { f: QF.hd, fill: '#161514' }); type(x, 'NO PORTO', 66, 48, { f: QF.hd, fill: '#161514' }); const r = rng(2); x.fillStyle = 'rgba(40,38,34,.4)'; for (let y = 60; y < 84; y += 5) x.fillRect(18, y, 96 - r() * 20, 2); }, 0); c.drawImage(withShadow(x.canvas, 2, 5, 3, .55), 0, 0, 132, 96); });
  const qNote = (s, col, ff, key) => mkT('q-n' + key, 98, 92, [ff], (c) => { const x = newC(98, 92); x.fillStyle = col; x.beginPath(); x.moveTo(10, 10); x.lineTo(88, 10); x.lineTo(88, 76); x.quadraticCurveTo(60, 84, 10, 82); x.closePath(); x.fill(); x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(10, 10, 78, 12); s.split('\n').forEach((ln, i, a) => type(x, ln, 49, 50 + (i - (a.length - 1) / 2) * 22, { f: ff, fill: '#23222B' })); c.drawImage(withShadow(x.canvas, 2, 5, 3, .5), 0, 0, 98, 92); });
  const QI = [ // [sprite, x, y, rot]
    [() => qPolaroid('rui', 'RUI?'), 84, 84, -.06], [() => qClip(), 222, 70, .04], [() => qNote('QUEM?', '#F4DA64', QF.pi, 1), 352, 76, .07],
    [() => qPolaroid('lia', 'LIA, a irmã'), 394, 180, -.05], [() => qNote('18/03\n23h', '#F3A9BA', QF.p2, 2), 250, 196, .05], [() => qPolaroid('car', 'armazém 9'), 112, 204, .07]];
  const QL = [[0, 1, 1.0, 1.8], [1, 2, 2.0, 2.8], [2, 3, 3.0, 3.8], [3, 4, 4.0, 4.6], [4, 5, 4.75, 5.35]];
  const qBlur = new Map();
  R['quadro-investigacao'] = (g, t, W, H) => {
    const u = t % 8, f = Math.floor(t * 12), pin = (i) => [QI[i][1], QI[i][2] - 40];
    let cx = QI[0][1], cy = QI[0][2], s = 1.7;
    for (const [a, b, t0, t1] of QL) if (u >= t0) { const k = eio(seg(u, t0 - .1, t1 + .1)); cx = lerp(QI[a][1], QI[b][1], k); cy = lerp(QI[a][2], QI[b][2], k); }
    const kb = eio(seg(u, 5.55, 6.5)); cx = lerp(cx, 240, kb); cy = lerp(cy, 135, kb); s = lerp(s, 1.06, kb);
    const kp = eio(seg(u, 6.9, 7.5)); cx = lerp(cx, 394, kp); cy = lerp(cy, 174, kp); s = lerp(s, 2.05, kp);
    const hx = noise(t * .8, 3) * 3.4, hy = noise(t * .6, 8) * 2.8;
    cx = clamp(cx, -12 + 240 / s, 492 - 240 / s); cy = clamp(cy, -12 + 135 / s, 282 - 135 / s);
    g.save(); g.translate(W / 2 + hx, H / 2 + hy); g.scale(s, s); g.translate(-cx, -cy);
    g.drawImage(qBoard(), -20, -20, 520, 310);
    const R0 = 55 + Math.max(0, 1.7 - s) * 420;
    QI.forEach(([sp, x, y, rot]) => {
      const S = sp(); let B = qBlur.get(S); if (!B) { B = blurC(S, 2.2); qBlur.set(S, B); }
      const fk = clamp(1 - (Math.hypot(x - cx, y - cy) - R0) / 70), w = S.width / SC, h = S.height / SC;
      g.save(); g.translate(x, y); g.rotate(rot); if (fk < 1) g.drawImage(B, -w / 2, -h / 2, w, h); if (fk > 0) { g.globalAlpha = fk; g.drawImage(S, -w / 2, -h / 2, w, h); } g.restore();
    });
    // fio vermelho: estica de alfinete a alfinete, com sombra na cortiça
    for (const [a, b, t0, t1] of QL) {
      const k = eio(seg(u, t0, t1)); if (k <= 0) continue; const A = pin(a), B = pin(b), M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 10 * (1 - k * .6)];
      const Q1 = [lerp(A[0], M[0], k), lerp(A[1], M[1], k)], Q2 = [lerp(Q1[0], lerp(M[0], B[0], k), k), lerp(Q1[1], lerp(M[1], B[1], k), k)];
      const th = (dx, dy, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(A[0] + dx, A[1] + dy); g.quadraticCurveTo(Q1[0] + dx, Q1[1] + dy, Q2[0] + dx, Q2[1] + dy); g.stroke(); };
      th(2, 5, 'rgba(20,8,4,.38)', 2.4); th(0, 0, '#A3121C', 2.3); th(-.4, -.5, 'rgba(255,120,110,.55)', .8);
    }
    QI.forEach((_, i) => { const [x, y] = pin(i); contact(g, x + 2, y + 4, 5, 3, .5); g.fillStyle = rad(g, x - 1.3, y - 1.5, .5, 5, [[0, '#FF7B7B'], [.5, '#D31F2A'], [1, '#6E0A10']]); g.beginPath(); g.arc(x, y, 4.2, 0, TAU); g.fill(); });
    if (u > 7.05) doodle(g, ellPts(394, 174, 44, 48, 1.15, -2.2, .1, 9), ease(seg(u, 7.05, 7.5)), '#C3121F', 3, f, .8);
    // luminária: poço de luz quente, resto no escuro
    g.fillStyle = rad(g, 250, 40, 30, 330, [[0, 'rgba(255,214,150,.06)'], [.45, 'rgba(12,7,4,.35)'], [1, 'rgba(8,5,3,.88)']]); g.fillRect(-40, -40, 560, 350);
    g.restore();
    VIG(g, .45);
    const off = u > 7.84 ? seg(u, 7.84, 7.96) : u < .3 ? [1, .15, .75, 0, .3][Math.floor(u / .06)] || 0 : 0;
    if (off > 0) { g.fillStyle = `rgba(4,3,2,${off})`; g.fillRect(0, 0, W, H); }
  };

  // ================================================================ 9. TRAILER ÉPICO
  const TW = 520, TH = 220, LB = 34;
  const trA = () => mk('tr-A', TW, TH, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#0F2A33'], [.45, '#3B5A5C'], [.72, '#D98A48'], [.82, '#F5C27A'], [1, '#6E3A1E']]); c.fillRect(0, 0, w, h);
    const sx = 330, sy = 130; blob(c, sx, sy, 200, 90, [255, 190, 110], .55); blob(c, sx, sy, 60, 40, [255, 230, 180], .9);
    c.fillStyle = '#FFF6DE'; c.beginPath(); c.arc(sx, sy, 15, 0, TAU); c.fill();
    const ridge = (y0, amp, col, seed, fr) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, y0 - Math.abs(noise(x * fr, seed)) * amp); c.lineTo(w, h); c.closePath(); c.fill(); };
    ridge(150, 26, 'rgba(120,120,110,.55)', 3, .012); ridge(162, 22, 'rgba(70,82,80,.75)', 7, .018); ridge(176, 18, 'rgba(34,48,50,.92)', 11, .025);
    c.fillStyle = '#0A1215'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, 196); c.bezierCurveTo(120, 190, 220, 170, 300, 156); c.bezierCurveTo(330, 152, 360, 158, 420, 178); c.lineTo(w, 190); c.lineTo(w, h); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,170,90,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(150, 184); c.bezierCurveTo(220, 170, 260, 162, 300, 156); c.bezierCurveTo(330, 152, 360, 158, 400, 172); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = -2.6 + i * .32; c.fillStyle = 'rgba(255,190,120,.05)'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * 400, sy + Math.sin(a) * 400); c.lineTo(sx + Math.cos(a + .08) * 400, sy + Math.sin(a + .08) * 400); c.fill(); } c.restore();
  });
  const trB = () => mk('tr-B', TW, TH, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#06141B'], [.6, '#1D4048'], [.85, '#3E5A58'], [1, '#B8612A']]); c.fillRect(0, 0, w, h);
    blob(c, 140, 214, 260, 60, [230, 110, 40], .55);
    c.fillStyle = '#081116'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, 150); c.bezierCurveTo(60, 140, 120, 130, 170, 120); c.lineTo(330, 118); c.bezierCurveTo(380, 130, 440, 160, w, 170); c.lineTo(w, h); c.fill();
    const tw = (x, y, tw0, th0, roof) => { c.fillStyle = '#0B171C'; c.fillRect(x - tw0 / 2, y - th0, tw0, th0); if (roof) { c.beginPath(); c.moveTo(x - tw0 / 2 - 3, y - th0); c.lineTo(x, y - th0 - roof); c.lineTo(x + tw0 / 2 + 3, y - th0); c.fill(); c.strokeStyle = '#0B171C'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - th0 - roof); c.lineTo(x, y - th0 - roof - 10); c.stroke(); c.fillStyle = '#0B171C'; c.fillRect(x, y - th0 - roof - 10, 7, 4); } else for (let i = 0; i < tw0 / 6; i++) c.fillRect(x - tw0 / 2 + i * 6, y - th0 - 4, 3.5, 4); };
    c.fillStyle = '#0B171C'; c.fillRect(180, 92, 150, 30); tw(190, 122, 22, 58, 22); tw(236, 122, 30, 82, 30); tw(284, 122, 20, 52, 0); tw(322, 122, 18, 44, 18);
    c.strokeStyle = 'rgba(120,190,200,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(225, 40); c.lineTo(236, 10); c.lineTo(247, 40); c.stroke();
    const r = rng(6); for (let i = 0; i < 16; i++) { const x = 184 + r() * 146, y = 60 + r() * 56; c.fillStyle = '#FFB35A'; c.fillRect(x, y, 2.5, 4); blob(c, x + 1, y + 2, 6, 6, [255, 150, 60], .35); }
  });
  const trFog = () => mk('tr-fog', 600, 80, (c) => { const r = rng(4); for (let i = 0; i < 16; i++) blob(c, r() * 600, 40 + (r() - .5) * 20, 60 + r() * 60, 12 + r() * 10, [150, 190, 196], .22); });
  const trTitle = () => mkT('tr-title', 480, 110, [font(700, 38, F.serif)], (c) => {
    const x = newC(480, 110); type(x, 'O ÚLTIMO REINO', 240, 55, { f: font(700, 38, F.serif), fill: lin(x, 0, 36, 0, 74, [[0, '#FFF3D6'], [.45, '#E8C48A'], [.55, '#A8743E'], [1, '#F2D7A0']]), track: 4.5 });
    const gl = blurC(tint(x.canvas, 'rgba(255,150,60,.9)'), 7); c.globalAlpha = .7; c.drawImage(gl, 0, 0, 480, 110); c.globalAlpha = 1; c.drawImage(x.canvas, 0, 0, 480, 110);
  });
  const trEmber = () => mk('tr-emb', 16, 16, (c) => blob(c, 8, 8, 8, 8, [255, 160, 70], 1));
  const TS = [[0, 'card', 'NESTE INVERNO'], [.95, 'A', 0], [2.15, 'card', 'UM REINO DIVIDIDO'], [2.85, 'B', 0], [3.95, 'card', 'VAI CAIR'],
    [4.45, 'A', 1], [4.66, 'W'], [4.7, 'B', 1], [4.88, 'W'], [4.91, 'A', 2], [5.03, 'W'], [5.05, 'B', 2], [5.13, 'K'], [5.24, 'T']];
  function warrior(g, x, y, s, t, rim) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round';
    const w1 = Math.sin(t * 3.1) * 3, w2 = Math.sin(t * 2.3 + 1) * 4;
    const shape = () => { g.beginPath(); g.moveTo(-5, 0); g.lineTo(-3.5, -24); g.lineTo(3.5, -24); g.lineTo(6, 0); g.lineTo(2, 0); g.lineTo(0, -15); g.lineTo(-1.5, 0); g.closePath();
      g.moveTo(-7.5, -24); g.lineTo(-8.5, -44); g.quadraticCurveTo(0, -49, 8.5, -44); g.lineTo(7.5, -24); g.closePath(); g.moveTo(3.8, -52); g.arc(0, -52, 3.8, 0, TAU);
      g.moveTo(-7, -46); g.bezierCurveTo(-16, -38 + w1, -24, -20 + w2, -31 + w2, -3 + w1); g.lineTo(-18 + w1, -1); g.bezierCurveTo(-12, -14, -8, -26, -5, -30); g.closePath();
      g.moveTo(9, -64); g.lineTo(10.4, -64); g.lineTo(10.8, 2); g.lineTo(9.4, 2); g.closePath(); };
    shape(); g.strokeStyle = rim; g.lineWidth = 2.4; g.stroke(); g.fillStyle = '#05080A'; g.fill(); g.restore();
  }
  R['trailer-epico'] = (g, t, W, H) => {
    const u = t % 8; let st = TS[0]; for (const s of TS) if (u >= s[0]) st = s;
    const lt = u - st[0]; bg(g, W, H, '#000');
    g.save(); g.beginPath(); g.rect(0, LB, W, H - 2 * LB); g.clip();
    const embers = (n, sp, a) => { g.save(); g.globalCompositeOperation = 'lighter'; const r = rng(3), E = trEmber(); for (let i = 0; i < n; i++) { const x = (r() * W * 1.2 - u * sp * (20 + r() * 30)) % (W * 1.2), xx = x < 0 ? x + W * 1.2 : x, y = LB + ((r() * 200 - u * (10 + r() * 16)) % 200 + 200) % 200; g.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(u * 3 + i))); const sz = 3 + r() * 5; g.drawImage(E, xx - sz / 2, y - sz / 2, sz, sz); } g.restore(); };
    if (st[1] === 'card') {
      const k = 1 + lt * .03; g.save(); g.translate(240, 136); g.scale(k, k); type(g, st[2], 0, 0, { f: font(400, 30, F.serif), fill: '#D9D1C1', track: 8 }); g.restore();
    } else if (st[1] === 'A') {
      const z = [1.02 + lt * .05, 1.9, 2.8][st[2]], fx = [260, 300, 300][st[2]], fy = [135, 140, 128][st[2]];
      g.save(); g.translate(240, 135); g.scale(z, z); g.translate(-fx, -fy); g.drawImage(trA(), -20, LB - 9, TW, TH); warrior(g, 300, LB - 9 + 157, .95, t, 'rgba(255,170,90,.95)'); g.restore(); embers(26, 1.4, .8);
    } else if (st[1] === 'B') {
      const z = [1.03 + lt * .04, 1.7, 2.4][st[2]], fx = [250, 236, 236][st[2]], fy = [130, 110, 104][st[2]];
      g.save(); g.translate(240, 135); g.scale(z, z); g.translate(-fx, -fy); g.drawImage(trB(), -20, LB - 9, TW, TH);
      const F2 = trFog(); g.drawImage(F2, -80 + (u * 14) % 60, 150, 600, 80); g.drawImage(F2, -40 - (u * 9) % 60, 176, 600, 80); g.restore(); embers(22, -.3, .9);
    } else if (st[1] === 'W') bg(g, W, H, '#F4F0E8');
    else if (st[1] === 'T') {
      const k = ease(seg(lt, 0, .3)), s2 = 1 + lt * .014;
      g.save(); g.globalCompositeOperation = 'lighter'; const fw = 30 + k * 520, fy = 132, fxx = 240 + Math.sin(lt * .7) * 20;
      g.fillStyle = lin(g, fxx - fw / 2, 0, fxx + fw / 2, 0, [[0, 'rgba(60,160,255,0)'], [.5, 'rgba(150,215,255,.85)'], [1, 'rgba(60,160,255,0)']]); g.fillRect(fxx - fw / 2, fy - 1, fw, 2.2);
      blob(g, fxx, fy, 70 * k + 6, 12 * k + 3, [120, 200, 255], .5); g.restore();
      if (lt > .22) { const ov = 1 - seg(lt, .22, .6); g.save(); g.translate(240, 132); g.scale(s2, s2); putC(g, trTitle(), 0, 0); if (ov > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = ov * .8; putC(g, trTitle(), 0, 0); } g.restore(); embers(34, -.2, .9); }
      if (lt > 1.05) { const k2 = ease(seg(lt, 1.05, 1.6)); type(g, 'EM BREVE', 240, 184, { f: font(600, 14, F.grot), fill: `rgba(220,210,190,${k2})`, track: lerp(16, 8, k2) }); }
      if (lt > 1.75) { const k3 = ease(seg(lt, 1.75, 2.1)); g.fillStyle = `rgba(214,170,110,${.7 * k3})`; g.fillRect(240 - 60 * k3, 199, 120 * k3, 1); type(g, 'SÓ NOS CINEMAS', 240, 214, { f: font(400, 14, F.serif), fill: `rgba(200,190,170,${k3})`, track: 5 }); }
    }
    g.restore();
    GR(g, t, .05);
  };

  // ================================================================ 10. JORNAL GIRANDO
  const NF = { m: font(900, 40, F.didone), d: font(700, 9, F.serif), hd: font(900, 44, F.didone), sub: `italic 400 14px ${F.serif}`, ex: font(400, 13, F.slab) };
  function moonPhoto(c, w, h) {
    c.fillStyle = '#0B0B0B'; c.fillRect(0, 0, w, h); c.fillStyle = lin(c, 0, h * .6, 0, h, [[0, '#8E8E8E'], [1, '#C8C8C8']]); c.beginPath(); c.moveTo(0, h * .66); c.quadraticCurveTo(w * .5, h * .58, w, h * .7); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    const r = rng(3); for (let i = 0; i < 12; i++) blob(c, r() * w, h * .72 + r() * h * .26, 6 + r() * 8, 2 + r() * 2, [60, 60, 60], .6);
    c.fillStyle = '#E8E8E8'; c.save(); c.translate(w * .42, h * .74); rr(c, -9, -40, 18, 26, 6); c.fill(); c.beginPath(); c.arc(0, -46, 8, 0, TAU); c.fill(); c.fillStyle = '#3A3A3A'; c.beginPath(); c.ellipse(1, -46, 5.5, 4.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#CFCFCF'; c.fillRect(-13, -38, 6, 20); c.fillRect(-8, -14, 7, 16); c.fillRect(2, -14, 7, 16); c.restore();
    c.fillStyle = '#DADADA'; c.fillRect(w * .66, h * .3, 1.6, h * .45); c.fillStyle = '#BDBDBD'; c.fillRect(w * .66 + 1.6, h * .3, 30, 18); c.fillStyle = '#7C7C7C'; for (let i = 0; i < 3; i++) c.fillRect(w * .66 + 2, h * .3 + 3 + i * 5, 28, 2);
  }
  function seaPhoto(c, w, h) {
    c.fillStyle = lin(c, 0, 0, 0, h * .55, [[0, '#9A9A9A'], [1, '#D6D6D6']]); c.fillRect(0, 0, w, h); c.fillStyle = lin(c, 0, h * .55, 0, h, [[0, '#6A6A6A'], [1, '#3A3A3A']]); c.fillRect(0, h * .55, w, h * .45);
    c.strokeStyle = 'rgba(220,220,220,.5)'; c.lineWidth = 1; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(0, h * .6 + i * 4); for (let x = 0; x <= w; x += 10) c.lineTo(x, h * .6 + i * 4 + Math.sin(x * .2 + i) * 1.2); c.stroke(); }
    [[.3, .22], [.5, .15], [.7, .24]].forEach(([px, py]) => { c.fillStyle = '#F2F2F2'; c.beginPath(); c.arc(w * px, h * py + 12, 17, Math.PI, 0); c.fill(); c.strokeStyle = '#888'; c.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(w * px + k * 7, h * py + 12); c.lineTo(w * .5, h * .56); c.stroke(); } c.fillStyle = '#9A9A9A'; c.fillRect(w * px - 17, h * py + 10, 34, 3); });
    c.fillStyle = '#2A2A2A'; c.beginPath(); c.moveTo(w * .44, h * .66); c.lineTo(w * .56, h * .66); c.lineTo(w * .52, h * .52); c.lineTo(w * .48, h * .52); c.closePath(); c.fill(); blob(c, w * .5, h * .67, 30, 5, [230, 230, 230], .7);
  }
  function newsSprite(key, date, head1, sub, photo) {
    const ok = fontsOk([NF.m, NF.d, NF.hd, NF.sub, NF.ex]), sp = mkT(key, 380, 260, [NF.m, NF.d, NF.hd, NF.sub, NF.ex], (c) => {
      const x = newC(380, 260); x.save(); x.translate(10, 10); const w = 360, h = 240;
      x.fillStyle = '#E8DDC2'; x.fillRect(0, 0, w, h); paper(x, w, h, '#E8DDC3', 23); x.fillStyle = rad(x, w / 2, h / 2, 60, 240, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(110,70,20,.28)']]); x.fillRect(0, 0, w, h);
      type(x, 'O MATUTINO', w / 2, 30, { f: NF.m, fill: '#151412' });
      x.fillStyle = '#151412'; x.fillRect(12, 52, w - 24, 1.6); x.fillRect(12, 64, w - 24, .8);
      type(x, 'RIO DE JANEIRO', 14, 58.5, { f: NF.d, fill: '#151412', align: 'left' }); type(x, date, w / 2, 58.5, { f: NF.d, fill: '#151412' }); type(x, 'EDIÇÃO EXTRA', w - 14, 58.5, { f: NF.d, fill: '#9C1F1A', align: 'right' });
      x.font = NF.hd; const hw = x.measureText(head1).width, sx = Math.min(.76, (w - 24) / hw);
      x.save(); x.translate(w / 2, 92); x.scale(sx, 1); type(x, head1, 0, 0, { f: NF.hd, fill: '#121110' }); x.restore();
      type(x, sub, w / 2, 122, { f: NF.sub, fill: '#2A2622' }); x.fillRect(12, 134, w - 24, .8);
      const ph = newC(150, 96); photo(ph, 150, 96); x.drawImage(halftone(ph.canvas, 2.4, '#141312', '#E6DCC4', 1, .64), 14, 142, 150, 96);
      const r = rng(key.length * 7); x.fillStyle = 'rgba(30,28,24,.55)';
      for (let col = 0; col < 3; col++) { const cx0 = 176 + col * 60; x.fillRect(cx0, 144, 50, 3); for (let yy = 152; yy < 234; yy += 4.2) { let xx = cx0; while (xx < cx0 + 50) { const ww = 3 + r() * 9; x.fillRect(xx, yy, Math.min(ww, cx0 + 50 - xx), 1.8); xx += ww + 1.6; } } }
      x.restore(); c.drawImage(x.canvas, 0, 0, 380, 260);
    });
    sp._tmp = !ok; return sp;
  }
  // versão pousada: jornal + sombra projetada, com a rotação final já aplicada
  const nLanded = (i) => { const S = NP[i](); if (S._tmp) return null; return mk('nl' + i, 440, 320, (c) => { const x = newC(440, 320); x.translate(220 + (i ? 10 : -6), 160 + (i ? 6 : 0)); x.rotate(i ? .05 : -.03); x.drawImage(S, -190, -130, 380, 260); c.drawImage(withShadow(x.canvas, 7, 11, 6, .7), 0, 0, 440, 320); }); };
  const NP = [() => newsSprite('n1', '21 DE JULHO DE 1969', 'HOMEM PISA NA LUA', 'Armstrong dá o primeiro passo; o mundo assiste', moonPhoto),
    () => newsSprite('n2', '25 DE JULHO DE 1969', 'HERÓIS VOLTAM À TERRA', 'Cápsula cai no Pacífico e a tripulação está a salvo', seaPhoto)];
  const nShadow = new Map(); // i -> sombra do sprite atual
  R['manchete-jornal'] = (g, t, W, H) => {
    const u = t % 8;
    g.drawImage(mk('n-bg', 480, 270, (c, w, h) => { c.fillStyle = rad(c, 240, 130, 20, 320, [[0, '#4A4239'], [.6, '#211D19'], [1, '#0B0A09']]); c.fillRect(0, 0, w, h); const r = rng(4); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let i = 0; i < 30; i++) { const y = r() * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(160, y + (r() - .5) * 10, 320, y + (r() - .5) * 10, 480, y + (r() - .5) * 8); c.stroke(); } }), 0, 0, 480, 270);
    const stateOf = (i, v) => { // [escala, rotação, dx, dy, pousado]
      const t0 = i ? 3.6 : 0, d = 1.25, k = seg(v, t0, t0 + d), e = ease(k), out = seg(v, 7.25, 8);
      if (v < t0) return null;
      let s = lerp(.04, 1, e), rot = (1 - e) * (i ? 4.5 : -5.5) * Math.PI + (i ? .05 : -.03), dx = i ? 10 : -6, dy = i ? 6 : 0;
      if (k >= 1) s += Math.sin((v - t0 - d) * 18) * Math.exp(-(v - t0 - d) * 8) * .03;
      if (out > 0) { const eo = Math.pow(out, 2); s *= 1 - eo * .96; rot += eo * 5 * Math.PI; }
      return [s, rot, dx, dy, k >= 1 && out <= 0];
    };
    const land = (i) => { const t0 = i ? 3.6 : 0; return u - t0 - 1.25; };
    const camS = 1 + .13 * eio(seg(u, 1.3, 3.6)) + .15 * eio(seg(u, 4.9, 7.2)), shake = [land(0), land(1)].some((l) => l > 0 && l < .15) ? Math.sin(u * 90) * 1.6 : 0;
    g.save(); g.translate(240, 135 + shake); g.scale(camS, camS); g.translate(0, 60 * (camS - 1));
    const L0 = nLanded(0), L1 = nLanded(1), st0 = stateOf(0, u), st1 = stateOf(1, u);
    for (let i = 0; i < 2; i++) {
      const st = i ? st1 : st0; if (!st) continue; const Lk = i ? L1 : L0;
      if (st[4] && Lk && st[0] > .995 && st[0] < 1.005) { g.drawImage(Lk, -220, -160, 440, 320); continue; }
      const S = NP[i](); let SH = nShadow.get(i); if (!SH || SH._src !== S) { SH = blurC(tint(S, 'rgba(0,0,0,.7)'), 6); SH._src = S; nShadow.set(i, SH); }
      const draw = (v, a, shd) => { const q = stateOf(i, v); if (!q) return; const [s, rot, dx, dy] = q; g.save(); g.translate(dx, dy); g.rotate(rot); g.scale(s, s); if (shd) { g.globalAlpha = a * .8; g.drawImage(SH, -190 + 8 + (1 - s) * 30, -130 + 12 + (1 - s) * 40, 380, 260); } g.globalAlpha = a; g.drawImage(S, -190, -130, 380, 260); g.restore(); };
      if (!st[4]) for (let j = 2; j >= 1; j--) draw(u - j * .03, .2 * (1 - j / 3), false);
      draw(u, 1, true);
    }
    g.restore();
    GR(g, t, .14); VIG(g, .55);
  };
})();
