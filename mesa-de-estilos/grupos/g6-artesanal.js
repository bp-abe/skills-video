// Grupo 6 — Artesanal: stop-motion-objetos, massinha, recorte-papel, rotoscopia, pintura-animada, silhueta, tinta-aquarela.
// Material primeiro: tudo que é caro (sombra com blur, textura, pinceladas de base) vira sprite cacheado; o quadro só compõe.
(() => {
  // ---------- utilitários locais ----------
  const SC = 2; // escala dos sprites (monitor de até ~420 px em DPR 2)
  const sprite = (key, w, h, fn, sc = SC) => cached('g6:' + key, Math.ceil(w * sc), Math.ceil(h * sc), (c) => { c.scale(sc, sc); fn(c, w, h); });
  // desenha só a sombra de um caminho (o objeto fica fora da tela); blur e deslocamento em px lógicos
  function shadowOnly(c, build, dx, dy, blur, col) {
    const s = c.getTransform().a; c.save(); c.shadowColor = col; c.shadowBlur = blur * s; c.shadowOffsetX = (dx + 4000) * s; c.shadowOffsetY = dy * s;
    c.translate(-4000, 0); c.fillStyle = '#000'; build(c); c.restore();
  }
  // ladrilha uma textura cacheada por cima de uma área (ex.: ruído em overlay)
  function tile(c, img, w, h, a, op = 'overlay', sz = 256) { c.save(); c.globalAlpha = a; c.globalCompositeOperation = op; for (let x = 0; x < w; x += sz) for (let y = 0; y < h; y += sz) c.drawImage(img, x, y, sz, sz); c.restore(); }
  // contorno irregular fechado: raio(a) -> caminho
  function blobPath(c, x, y, rf, n = 48) { c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = rf(a, i); i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
  const step = (f, f0, f1) => clamp((f - f0) / (f1 - f0)); // progresso em quadros inteiros (12 qps)
  try { [font(400, 25, F.marker), font(700, 20, F.hand), font(400, 62, F.slab), font(700, 14, F.body), `italic 700 26px ${F.serif}`, `italic 400 19px ${F.serif}`, font(600, 14, F.mono), `italic 700 22px ${F.didone}`].forEach((s) => document.fonts.load(s)); } catch (e) { /* sem FontFaceSet: fica o fallback */ }

  // =====================================================================
  // 1. STOP MOTION DE OBJETOS — ovo frito de botão, top shot numa mesa de madeira, 12 qps
  // =====================================================================
  const PX = 196, PY = 142, PR = 80, PANG = Math.PI + Math.PI / 6.2;
  const smWood = () => sprite('sm-wood', 480, 270, (c, w, h) => {
    const r = rng(11);
    [[0, 94, '#B6834D'], [94, 186, '#C29159'], [186, 270, '#AB7843']].forEach(([y0, y1, col], i) => {
      c.fillStyle = lin(c, 0, y0, 0, y1, [[0, col], [1, i === 1 ? '#B4834E' : '#9E6D3B']]); c.fillRect(0, y0, w, y1 - y0);
      for (let k = 0; k < 30; k++) {
        const yy = y0 + 3 + r() * (y1 - y0 - 6), amp = .8 + r() * 3.2, fr = .003 + r() * .009, ph = r() * 9;
        c.strokeStyle = r() > .4 ? `rgba(92,52,20,${.1 + r() * .16})` : `rgba(255,226,182,${.07 + r() * .08})`;
        c.lineWidth = .5 + r() * 1.5; c.beginPath();
        for (let x = -12; x <= w + 12; x += 10) { const yv = yy + Math.sin(x * fr + ph) * amp + noise(x * .025, k + i * 7) * 1.2; x < 0 ? c.moveTo(x, yv) : c.lineTo(x, yv); }
        c.stroke();
      }
      const kx = 60 + r() * 360, ky = (y0 + y1) / 2 + (r() - .5) * 30; // nó da madeira
      for (let q = 0; q < 5; q++) { c.strokeStyle = `rgba(80,42,14,${.28 - q * .045})`; c.lineWidth = 1.1; c.beginPath(); c.ellipse(kx, ky, 4 + q * 5, 1.6 + q * 2.1, 0, 0, TAU); c.stroke(); }
      if (y1 < h) { c.fillStyle = 'rgba(40,22,8,.62)'; c.fillRect(0, y1 - 1.4, w, 2.2); c.fillStyle = 'rgba(255,228,186,.28)'; c.fillRect(0, y1 + .9, w, 1); }
    });
    tile(c, noiseTile(21), w, h, .16);
  });
  const smLight = () => sprite('sm-light', 480, 270, (c, w, h) => {
    c.fillStyle = rad(c, 150, 44, 0, 470, [[0, 'rgba(255,238,204,.34)'], [.3, 'rgba(255,238,204,.06)'], [.62, 'rgba(30,14,0,.12)'], [1, 'rgba(18,8,0,.58)']]); c.fillRect(0, 0, w, h);
  }, 1);
  const smPan = () => sprite('sm-pan', 480, 270, (c) => {
    const handle = (c) => { c.save(); c.translate(PX, PY); c.rotate(PANG); c.roundRect(PR - 10, -9, 124, 18, 9); c.restore(); };
    shadowOnly(c, (c) => { c.beginPath(); c.arc(PX, PY, PR, 0, TAU); handle(c); c.fill(); }, 10, 12, 16, 'rgba(28,12,0,.62)');
    shadowOnly(c, (c) => { c.beginPath(); c.arc(PX, PY, PR, 0, TAU); c.fill(); }, 2, 3, 3, 'rgba(20,8,0,.5)');
    c.save(); c.translate(PX, PY); c.rotate(PANG);
    c.fillStyle = lin(c, 0, -9, 0, 9, [[0, '#65676d'], [.3, '#34353a'], [1, '#131315']]); c.beginPath(); c.roundRect(PR - 10, -9, 124, 18, 9); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(PR, -6.5); c.lineTo(PR + 106, -6.5); c.stroke();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(PR + 100, 0, 4.2, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(PR + 100, 0, 4.6, 0, TAU); c.stroke();
    c.restore();
    c.fillStyle = lin(c, PX - PR, PY - PR, PX + PR, PY + PR, [[0, '#6a6b71'], [.45, '#2c2d31'], [1, '#101012']]); c.beginPath(); c.arc(PX, PY, PR, 0, TAU); c.fill();
    c.lineCap = 'round'; c.strokeStyle = 'rgba(255,246,230,.5)'; c.lineWidth = 2.2; c.beginPath(); c.arc(PX, PY, PR - 3.2, Math.PI * .98, Math.PI * 1.55); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1.2; c.beginPath(); c.arc(PX, PY, PR - 3.2, -.1, Math.PI * .45); c.stroke();
    c.fillStyle = lin(c, PX - PR, PY - PR, PX + PR, PY + PR, [[0, '#0c0c0e'], [.55, '#222326'], [1, '#43444a']]); c.beginPath(); c.arc(PX, PY, PR - 7, 0, TAU); c.fill();
    c.fillStyle = rad(c, PX - 16, PY - 20, 4, PR - 10, [[0, '#3c3d42'], [1, '#1a1a1d']]); c.beginPath(); c.arc(PX, PY, PR - 14, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1; for (let rr = 7; rr < PR - 15; rr += 4.5) { c.beginPath(); c.arc(PX, PY, rr, 0, TAU); c.stroke(); }
    c.fillStyle = rad(c, PX - 30, PY - 34, 0, 34, [[0, 'rgba(255,240,212,.22)'], [1, 'rgba(255,240,212,0)']]); c.fillRect(PX - 70, PY - 70, 80, 80);
  });
  const smNapkin = () => sprite('sm-napkin', 130, 130, (c) => {
    const r = rng(5), jag = Array.from({ length: 61 }, () => (r() - .5) * 1.8);
    const rf = (a, i) => 45 + noise(a * 1.4, 3) * 7 + Math.sin(a * 5 + 1) * 2 + jag[i % 60];
    shadowOnly(c, (c) => { blobPath(c, 65, 65, rf, 60); c.fill(); }, 3, 4, 5, 'rgba(0,0,0,.75)');
    blobPath(c, 65, 65, rf, 60); c.fillStyle = lin(c, 20, 20, 110, 110, [[0, '#FFFDF8'], [.6, '#F1ECE2'], [1, '#D9D1C3']]); c.fill();
    c.save(); blobPath(c, 65, 65, rf, 60); c.clip();
    const pts = []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + (r() - .5) * .8; pts.push([65 + Math.cos(a) * 60, 65 + Math.sin(a) * 60, a]); }
    pts.forEach(([ex, ey, a], i) => { // facetas e vincos do papel amassado (vincos tortos, que não nascem todos do centro)
      const d0 = 8 + r() * 26, a0 = a + (r() - .5) * 1.6, mx = 65 + Math.cos(a0) * d0, my = 65 + Math.sin(a0) * d0;
      const [nx, ny] = pts[(i + 1) % 7];
      c.fillStyle = i % 2 ? 'rgba(120,104,80,.13)' : 'rgba(255,255,255,.35)'; poly(c, [[mx, my], [ex, ey], [nx, ny]]); c.fill();
      c.lineCap = 'round'; c.strokeStyle = 'rgba(110,96,74,.45)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(mx, my); c.lineTo((mx + ex) / 2 + (r() - .5) * 8, (my + ey) / 2 + (r() - .5) * 8); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = .8; c.beginPath(); c.moveTo(mx - .9, my - .9); c.lineTo(ex - .9, ey - .9); c.stroke();
    });
    c.fillStyle = rad(c, 50, 48, 2, 50, [[0, 'rgba(255,255,255,.4)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, 130, 130);
    tile(c, noiseTile(31), 130, 130, .12);
    c.restore();
    blobPath(c, 65, 65, rf, 60); c.strokeStyle = 'rgba(150,138,116,.55)'; c.lineWidth = .8; c.stroke();
  });
  const smButton = () => sprite('sm-btn', 60, 60, (c) => {
    const x = 30, y = 30;
    c.fillStyle = rad(c, x - 8, y - 9, 1, 24, [[0, '#FFE07A'], [.5, '#F6B021'], [1, '#C4760A']]); c.beginPath(); c.arc(x, y, 21, 0, TAU); c.fill();
    c.strokeStyle = lin(c, x - 20, y - 20, x + 20, y + 20, [[0, 'rgba(255,248,210,.95)'], [.5, 'rgba(255,200,80,.2)'], [1, 'rgba(120,60,0,.55)']]); c.lineWidth = 3.4; c.beginPath(); c.arc(x, y, 17.6, 0, TAU); c.stroke();
    c.fillStyle = lin(c, x - 14, y - 14, x + 14, y + 14, [[0, '#D98A0E'], [1, '#FFD155']]); c.beginPath(); c.arc(x, y, 15.4, 0, TAU); c.fill();
    [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]].forEach(([hx, hy]) => {
      c.fillStyle = '#4A2803'; c.beginPath(); c.arc(x + hx, y + hy, 2.5, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,226,150,.9)'; c.lineWidth = .9; c.beginPath(); c.arc(x + hx, y + hy, 2.5, -.2, 1.8); c.stroke();
    });
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(x - 10, y - 11, 4.2, 1.8, -.75, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(100,50,0,.5)'; c.lineWidth = .7; c.beginPath(); c.arc(x, y, 20.8, 0, TAU); c.stroke();
  });
  const smButtonShadow = () => sprite('sm-btnsh', 80, 80, (c) => shadowOnly(c, (c) => { c.beginPath(); c.arc(40, 40, 20, 0, TAU); c.fill(); }, 0, 0, 5, 'rgba(0,0,0,.75)'), 1);
  const smBead = () => sprite('sm-bead', 18, 18, (c) => {
    shadowOnly(c, (c) => { c.beginPath(); c.arc(9, 9, 4, 0, TAU); c.fill(); }, 1.6, 2, 1.5, 'rgba(0,0,0,.7)');
    c.fillStyle = 'rgba(255,238,200,.35)'; c.beginPath(); c.ellipse(11.2, 11.6, 2.2, 1.4, .6, 0, TAU); c.fill(); // cáustica
    c.fillStyle = rad(c, 7.6, 7.4, .3, 5, [[0, 'rgba(235,248,255,.95)'], [.5, 'rgba(160,205,235,.55)'], [1, 'rgba(60,100,140,.75)']]); c.beginPath(); c.arc(9, 9, 4.2, 0, TAU); c.fill();
    c.fillStyle = 'rgba(20,40,60,.55)'; c.beginPath(); c.arc(9.2, 9.2, 1.2, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(7.4, 7.2, 1.1, 0, TAU); c.fill();
  });
  const smPepper = () => sprite('sm-pep', 8, 8, (c) => { c.fillStyle = '#1b130c'; c.beginPath(); c.arc(4, 4, 1.9, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(3.3, 3.3, .6, 0, TAU); c.fill(); });
  const FROT = -.42;
  const smFork = () => sprite('sm-fork', 160, 44, (c) => {
    const body = (c) => { c.beginPath(); c.roundRect(6, 17, 80, 10, 5); c.moveTo(82, 18); c.lineTo(104, 19.5); c.lineTo(104, 24.5); c.lineTo(82, 26); c.closePath(); c.roundRect(102, 13, 12, 18, 5); for (let i = 0; i < 4; i++) c.roundRect(110, 12.6 + i * 5, 42, 3, 1.5); };
    const wx = 5, wy = 6, ox = wx * Math.cos(-FROT) - wy * Math.sin(-FROT), oy = wx * Math.sin(-FROT) + wy * Math.cos(-FROT);
    shadowOnly(c, (c) => { body(c); c.fill(); }, ox, oy, 4, 'rgba(25,10,0,.6)');
    body(c); c.fillStyle = lin(c, 0, 13, 0, 31, [[0, '#7d828a'], [.32, '#F2F5F8'], [.55, '#A2A8B0'], [1, '#4B5057']]); c.fill();
    c.strokeStyle = 'rgba(30,34,40,.55)'; c.lineWidth = .6; body(c); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, 19.6); c.lineTo(80, 19.6); c.stroke();
  });
  const CW = 156, CH2 = 70;
  const smCard = () => sprite('sm-card', 180, 100, (c) => {
    const r = rng(9);
    shadowOnly(c, (c) => { c.beginPath(); c.rect(12, 16, CW, CH2); c.fill(); }, 2.5, 3.5, 4, 'rgba(30,14,0,.55)');
    c.fillStyle = lin(c, 12, 16, 12 + CW, 16 + CH2, [[0, '#FFFBF1'], [1, '#EDE3CF']]); c.fillRect(12, 16, CW, CH2);
    c.strokeStyle = 'rgba(200,80,70,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(12, 36); c.lineTo(12 + CW, 36); c.stroke(); // pauta de ficha
    c.strokeStyle = 'rgba(80,120,190,.18)'; for (let y = 52; y < 16 + CH2; y += 14) { c.beginPath(); c.moveTo(12, y); c.lineTo(12 + CW, y); c.stroke(); }
    c.save(); c.beginPath(); c.rect(12, 16, CW, CH2); c.clip(); tile(c, noiseTile(41), 180, 100, .1); c.restore();
    c.save(); c.translate(90, 17); c.rotate(.05); // fita crepe
    c.beginPath(); c.moveTo(-26, -8); for (let x = -26; x <= 26; x += 4) c.lineTo(x, -8 + (r() - .5) * 1.4); for (let y = -8; y <= 8; y += 2.6) c.lineTo(26 + (r() - .5) * 2.6, y); for (let x = 26; x >= -26; x -= 4) c.lineTo(x, 8 + (r() - .5) * 1.4); for (let y = 8; y >= -8; y -= 2.6) c.lineTo(-26 + (r() - .5) * 2.6, y); c.closePath();
    c.fillStyle = 'rgba(232,214,166,.86)'; c.fill(); c.strokeStyle = 'rgba(150,120,60,.25)'; c.lineWidth = .6; c.stroke();
    c.restore();
  });

  R['stop-motion-objetos'] = (g, t, W, H, seed) => {
    const tt = t % 8, f = Math.floor(tt * 12), r = rng(f * 7 + seed);
    const j = (a = .4) => (r() - .5) * 2 * a;
    g.drawImage(smWood(), 0, 0, W, H);
    // garfo (cenário fixo, canto superior direito)
    g.save(); g.translate(402, 104); g.rotate(FROT); g.scale(1.15, 1.15); g.drawImage(smFork(), -80, -22, 160, 44); g.restore();
    g.drawImage(smPan(), 0, 0, W, H);
    // clara = guardanapo amassado (entra pelo alto em passos; sai no fim)
    const kIn = step(f, 1, 8), kOut = step(f, 93, 96);
    const nx = PX + 2 + lerp(0, 40, kOut), ny = lerp(-80, PY - 2, ease(kIn)) - ease(kOut) * 240;
    const nrot = (1 - ease(kIn)) * .6 - kOut * .4 + j(.012);
    if (f >= 1) {
      g.save(); g.translate(nx + j(), ny + j()); g.rotate(nrot); g.drawImage(smNapkin(), -65, -65, 130, 130);
      // pimenta (grãos que caem de dois em dois quadros)
      const pr = rng(404), nP = Math.floor(clamp((f - 48) / 10) * 14);
      for (let i = 0; i < 14; i++) { const a = pr() * TAU, d = 24 + pr() * 14; if (i < nP) g.drawImage(smPepper(), Math.cos(a) * d - 4, Math.sin(a) * d - 4, 8, 8); }
      g.restore();
    }
    // gema = botão (cai em direção à mesa: escala e sombra convergem)
    const dropK = [1.7, 1.52, 1.3, 1.1, .97, 1.03, 1][clamp(f - 12, 0, 6)];
    const leave = step(f, 90, 95), hgt = f < 12 ? 1 : f < 90 ? dropK - 1 : .7 * leave;
    if (f >= 12 && f < 96) {
      const bx = nx + 4 + j(.35) - leave * 30, by = ny - 4 + j(.35) - ease(leave) * 150, s = 1 + hgt;
      const spin = f < 62 ? 0 : Math.floor(clamp((f - 62) / 12) * 4) * (TAU / 16);
      g.save(); g.globalAlpha = clamp(.95 - hgt * .9, .25, .95); const ss = 1 + hgt * .6; g.drawImage(smButtonShadow(), bx + 3 + hgt * 34 - 40 * ss, by + 4 + hgt * 40 - 40 * ss, 80 * ss, 80 * ss); g.restore();
      g.save(); g.translate(bx, by); g.scale(s, s); g.rotate(spin + j(.015)); g.drawImage(smButton(), -30, -30, 60, 60); g.restore();
    }
    // chiado = miçangas de vidro que aparecem e somem (substituição)
    if (f >= 20 && f < 88) {
      const br = rng(77);
      for (let i = 0; i < 9; i++) {
        const a = -2.6 + i * .62 + br() * .3, d = 52 + br() * 10, on = f >= 20 + i * 2 && ((f + i * 5) % 7) < 5;
        if (on) { const rr = rng(f * 31 + i); g.drawImage(smBead(), PX + Math.cos(a) * d + (rr() - .5) * 2 - 9, PY + Math.sin(a) * d * .96 + (rr() - .5) * 2 - 9, 18, 18); }
      }
    }
    // ficha com fita crepe e letra de mão
    const cIn = step(f, 24, 29), cOut = step(f, 87, 91);
    if (f >= 24 && f < 92) {
      const cx = lerp(560, 376, ease(cIn)) + ease(cOut) * 190, cy = 204, cr = -.07 + (1 - ease(cIn)) * .18 + j(.006);
      g.save(); g.translate(cx, cy); g.rotate(cr); g.drawImage(smCard(), -90, -50, 180, 100);
      const tw = step(f, 30, 36), sw = step(f, 37, 44);
      g.save(); g.beginPath(); g.rect(-80, -30, 160 * tw, 32); g.clip(); type(g, 'OVO FRITO', -68, -11, { f: font(400, 25, F.marker), fill: '#2B2622', align: 'left' }); g.restore();
      g.save(); g.beginPath(); g.rect(-80, 2, 160 * sw, 30); g.clip(); type(g, '(é um botão)', -68, 18, { f: font(700, 25, F.hand), fill: '#2F4E8C', align: 'left' }); g.restore();
      g.restore();
    }
    // luz de mesa + variação de exposição a cada quadro
    g.drawImage(smLight(), 0, 0, W, H);
    const e = (rng(f * 3 + 1)() - .5) * .07;
    g.fillStyle = e > 0 ? `rgba(255,244,222,${e})` : `rgba(0,0,0,${-e})`; g.fillRect(0, 0, W, H);
    filmGrain(g, W, H, Math.floor(tt * 12) / 12, .1, 6);
  };

  // =====================================================================
  // 2. MASSINHA — personagem de massa num cenário em miniatura, animado "em dois" (12 poses/s)
  // =====================================================================
  const fontsOk = (spec) => { try { return document.fonts.check(spec) ? 1 : 0; } catch (e) { return 0; } };
  const groundY = (x) => 190 - Math.sin(x / 480 * Math.PI) * 9 + noise(x * .02, 4) * 1.5;
  // digital: arcos concêntricos claros/escuros (lê como marca de dedo mesmo pequena)
  const msPrint = () => sprite('ms-print', 40, 40, (c) => {
    c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const rr = 3 + i * 2.4;
      c.strokeStyle = 'rgba(60,15,0,.5)'; c.lineWidth = .9; c.beginPath(); c.ellipse(20, 20, rr * 1.15, rr, .5, .3 + i * .15, 2.9 + i * .1); c.stroke();
      c.strokeStyle = 'rgba(255,235,215,.55)'; c.lineWidth = .8; c.beginPath(); c.ellipse(20.7, 19.3, rr * 1.15, rr, .5, .3 + i * .15, 2.9 + i * .1); c.stroke();
    }
  });
  const msBack = () => sprite('ms-back', 480, 270, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, 200, [[0, '#5AA3D6'], [.7, '#A9D8EE'], [1, '#D6EEF3']]); c.fillRect(0, 0, w, h);
    c.fillStyle = rad(c, 110, 50, 0, 300, [[0, 'rgba(255,240,205,.5)'], [1, 'rgba(255,240,205,0)']]); c.fillRect(0, 0, w, h);
    tile(c, noiseTile(51), w, h, .06);
    c.filter = 'blur(1.6px)'; // profundidade de campo: fundo da maquete fora de foco
    const puff = (x, y, s) => { [[-18, 4, 13], [0, -4, 17], [19, 3, 12], [8, 7, 12], [-8, 8, 11]].forEach(([dx, dy, r]) => { c.fillStyle = rad(c, x + dx * s - 4, y + dy * s - 6, 1, r * s * 1.2, [[0, '#FFFFFF'], [.7, '#EEF3F6'], [1, '#C9D6DE']]); c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); }); };
    puff(262, 56, 1); puff(360, 86, .7);
    [[-40, 205, 150, '#88C465'], [250, 212, 190, '#76B656'], [470, 206, 120, '#8CC96C']].forEach(([x, y, r, col]) => { c.fillStyle = rad(c, x - r * .3, y - r * .5, 4, r * 1.1, [[0, col], [1, '#4F8E3A']]); c.beginPath(); c.ellipse(x, y + 20, r, 60, 0, 0, TAU); c.fill(); });
    c.filter = 'none';
  }, 1);
  const msGround = () => sprite('ms-ground', 480, 270, (c, w, h) => {
    const r = rng(8);
    const edge = (c) => { c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, groundY(x)); c.lineTo(w, h); c.closePath(); };
    shadowOnly(c, (c) => { edge(c); c.fill(); }, 0, -3, 6, 'rgba(20,50,10,.35)');
    edge(c); c.fillStyle = lin(c, 0, 180, 0, 270, [[0, '#7CC255'], [.35, '#5EA23F'], [1, '#34702A']]); c.fill();
    c.save(); edge(c); c.clip();
    for (let i = 0; i < 46; i++) { // marcas de polegar e espátula
      const x = r() * w, y = 196 + r() * 74, a = r() * Math.PI, l = 5 + r() * 10;
      c.lineCap = 'round'; c.lineWidth = 2 + r() * 2;
      c.strokeStyle = 'rgba(25,60,15,.22)'; c.beginPath(); c.arc(x, y, l, a, a + 1.4); c.stroke();
      c.strokeStyle = 'rgba(210,255,170,.2)'; c.lineWidth *= .6; c.beginPath(); c.arc(x - 1, y - 1.2, l, a, a + 1.4); c.stroke();
    }
    for (let i = 0; i < 4; i++) { c.globalAlpha = .32; c.drawImage(msPrint(), 30 + r() * 420, 205 + r() * 50, 30, 30); }
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(225,255,190,.45)'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= w; x += 8) x ? c.lineTo(x, groundY(x) + 2) : c.moveTo(x, groundY(x) + 2); c.stroke();
    tile(c, noiseTile(52), w, h, .14);
    c.restore();
    for (let i = 0; i < 16; i++) { // tufos de grama (rolinhos de massa)
      const x = 10 + r() * 460; if (x > 120 && x < 230) continue; const y = groundY(x) + 4 + r() * 5;
      for (let k = -1; k <= 1; k++) { const tx = x + k * 3.5, th = 7 + r() * 5, lean = k * 2.5 + (r() - .5) * 2; c.fillStyle = k ? '#3F8A2E' : '#4E9C38'; c.beginPath(); c.moveTo(tx - 2.2, y); c.quadraticCurveTo(tx + lean * .3, y - th * .6, tx + lean, y - th); c.quadraticCurveTo(tx + lean * .3 + 1.5, y - th * .5, tx + 2.2, y); c.fill(); }
    }
  });
  const msSun = () => sprite('ms-sun', 90, 90, (c) => {
    for (let i = 0; i < 10; i++) { c.save(); c.translate(45, 45); c.rotate(i / 10 * TAU); c.fillStyle = lin(c, 26, -4, 26, 4, [[0, '#FFE27A'], [1, '#F2A71B']]); c.beginPath(); c.moveTo(27, -5); c.quadraticCurveTo(40, -1, 41, 0); c.quadraticCurveTo(40, 1, 27, 5); c.fill(); c.restore(); }
    c.fillStyle = rad(c, 38, 36, 2, 26, [[0, '#FFF1A8'], [.55, '#FFCB2E'], [1, '#E99A12']]); c.beginPath(); c.arc(45, 45, 23, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(45, 45, 23, 0, TAU); c.clip(); c.globalAlpha = .6; c.drawImage(msPrint(), 40, 38, 26, 26); c.restore();
  });
  const msFlower = (col) => sprite('ms-fl' + col, 40, 64, (c) => {
    c.lineCap = 'round'; c.strokeStyle = '#2F7A26'; c.lineWidth = 4; c.beginPath(); c.moveTo(20, 64); c.quadraticCurveTo(16, 42, 20, 22); c.stroke();
    c.strokeStyle = 'rgba(200,255,160,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(19, 60); c.quadraticCurveTo(15, 42, 19, 24); c.stroke();
    c.fillStyle = '#3E8E2F'; c.beginPath(); c.ellipse(26, 46, 7, 3.4, -.5, 0, TAU); c.fill();
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2, x = 20 + Math.cos(a) * 8, y = 20 + Math.sin(a) * 8; c.fillStyle = rad(c, x - 2, y - 2.5, .5, 7, [[0, '#fff'], [.25, col], [1, '#7a1026']]); c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
    c.fillStyle = rad(c, 18.5, 18.5, .5, 6, [[0, '#FFF3B0'], [1, '#E8A10E']]); c.beginPath(); c.arc(20, 20, 4.6, 0, TAU); c.fill();
  });
  // letras de massa: extrusão + chanfro claro + digital; sprite só depois da fonte carregar
  const MS_LET = [['O', '#F4C22E', 296], ['L', '#3C8BDB', 346], ['Á', '#E8476A', 393], ['!', '#8C58D2', 436]];
  const msLetter = (ch, col) => { const spec = font(400, 62, F.slab); const ok = fontsOk(spec);
    return sprite(`ms-L${ch}${ok}`, 70, 90, (c) => {
      c.font = spec; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; c.lineWidth = 4.5; // contorno redondo: letra de massa é gorda e sem quina
      const blob = (x, y, fill) => { c.fillStyle = fill; c.strokeStyle = fill; c.strokeText(ch, x, y); c.fillText(ch, x, y); };
      for (let i = 6; i >= 1; i--) { blob(35 + i * .7, 82 + i * .6, i > 3 ? 'rgba(0,0,0,.55)' : col); blob(35 + i * .7, 82 + i * .6, `rgba(0,0,0,${.12 + i * .05})`); }
      blob(35, 82, col);
      c.save(); c.globalCompositeOperation = 'source-atop';
      c.fillStyle = lin(c, 0, 30, 0, 86, [[0, 'rgba(255,255,255,.34)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.18)']]); c.fillRect(0, 0, 70, 90);
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.strokeText(ch, 34, 80.5);
      c.globalAlpha = .45; c.drawImage(msPrint(), 20, 48, 30, 30);
      c.globalAlpha = .13; c.drawImage(noiseTile(53), 0, 0, 128, 128); // grão fosco da massa, só dentro da letra
      c.restore();
    }); };
  const MOUTH = { M: 0, O: 1, L: 2, A: 3, E: 4 };
  function msMouth(g, k, x, y) {
    const dark = '#4A1206', lip = 'rgba(255,190,160,.55)';
    g.lineCap = 'round';
    if (k === 'M') { g.strokeStyle = dark; g.lineWidth = 3.2; g.beginPath(); g.moveTo(x - 13, y - 2); g.quadraticCurveTo(x, y + 9, x + 13, y - 2); g.stroke(); g.strokeStyle = lip; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 10, y + 4); g.quadraticCurveTo(x, y + 11, x + 10, y + 4); g.stroke(); return; }
    const sh = { O: [7, 9], L: [11, 7], A: [15, 11], E: [16, 5] }[k];
    g.save(); g.beginPath();
    if (k === 'A') { g.moveTo(x - sh[0], y - 3); g.quadraticCurveTo(x, y - 6, x + sh[0], y - 3); g.quadraticCurveTo(x + sh[0], y + sh[1] + 4, x, y + sh[1] + 5); g.quadraticCurveTo(x - sh[0], y + sh[1] + 4, x - sh[0], y - 3); }
    else g.ellipse(x, y + 2, sh[0], sh[1], 0, 0, TAU);
    g.fillStyle = dark; g.fill(); g.clip();
    g.fillStyle = '#E86A7A'; g.beginPath(); g.ellipse(x + 1, y + sh[1] + 4, sh[0] * .75, sh[1] * .6, 0, 0, TAU); g.fill();
    if (k === 'A' || k === 'E') { g.fillStyle = '#FFF8EE'; g.fillRect(x - sh[0], y - 7, sh[0] * 2, k === 'A' ? 6.5 : 4.5); }
    g.restore();
    g.strokeStyle = lip; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x, y + 2, sh[0] + 1.2, sh[1] + 1.4, 0, .15 * Math.PI, .85 * Math.PI); g.stroke();
  }

  R['massinha'] = (g, t, W, H, seed) => {
    const tt = t % 8, f = Math.floor(tt * 12), fr = rng(f * 13 + seed);
    g.drawImage(msBack(), 0, 0, W, H);
    g.save(); g.translate(86, 62); g.rotate(Math.floor(tt * 6) * .045 + (fr() - .5) * .02); g.drawImage(msSun(), -45, -45, 90, 90); g.restore();
    g.drawImage(msGround(), 0, 0, W, H);
    // flores (a da esquerda dá um "boing" em 4,3 s)
    const pop = f >= 52 ? spr((f - 52) / 10) : 1, fl = f >= 52 && f < 64 ? 1 + (1 - pop) * .5 : 1;
    [[52, groundY(52) + 12, '#E23B4E', fl], [458, groundY(458) + 14, '#F08A24', 1]].forEach(([x, y, col, s], i) => {
      contact(g, x, y, 10, 2.5, .35);
      g.save(); g.translate(x, y); g.rotate((i ? -1 : 1) * (.05 + Math.sin(Math.floor(tt * 6) * 1.7 + i) * .025)); g.scale(1 / Math.sqrt(s), s); g.drawImage(msFlower(col), -20, -64, 40, 64); g.restore();
    });
    // letras O-L-Á-! nascem com a fala e são achatadas pelo pulo no fim
    MS_LET.forEach(([ch, col, x], i) => {
      const born = [16, 20, 23, 27][i], flat = 84 + i * 2; if (f < born) return;
      let sy, sx;
      if (f < flat) { sy = [.25, 1.28, .86, 1.07, 1][clamp(f - born, 0, 4)]; sx = 1 / Math.sqrt(sy); }
      else { const k = f - flat; if (k > 7) return; sy = [.72, .4, .2, .13, .1, .1, .08, .05][k]; sx = [1.2, 1.5, 1.75, 1.85, 1.9, 1.9, 1.9, 1.9][k]; }
      const br = rng(Math.floor(f / 2) * 17 + i), wob = (br() - .5) * .05, by = groundY(x) + 26;
      contact(g, x + 3, by, 24 * sx, 4, .42);
      g.save(); g.translate(x + (br() - .5) * .8, by); g.rotate(f < flat ? wob + (i === 3 && f > 56 && f < 70 ? Math.sin((f - 56) * .9) * .25 * (1 - (f - 56) / 14) : 0) : 0); g.scale(sx, sy); g.drawImage(msLetter(ch, col), -35, -86, 70, 90); g.restore();
    });
    // personagem
    const baseX = 172, footY = groundY(172) + 30;
    let jy = 0, sq = 1;
    if (f >= 74 && f < 78) sq = [.92, .84, .8, .82][f - 74];
    else if (f >= 78 && f < 84) { const k = (f - 78) / 5; jy = -Math.sin(k * Math.PI) * 46; sq = [1.18, 1.12, 1.04, 1.02, 1.08, 1.14][f - 78]; }
    else if (f >= 84 && f < 92) sq = [.74, .88, 1.1, .96, 1.03, .99, 1.01, 1][f - 84];
    const laugh = f >= 60 && f < 72, breathe = 1 + Math.sin(Math.floor(tt * 12) / 12 * TAU * .5) * .012;
    const syB = sq * breathe * (laugh ? 1 + ((f % 2) ? .03 : -.02) : 1), sxB = 1 / Math.sqrt(syB);
    const RB = 44, cy = footY - 8 + jy - RB * syB;
    const bseed = Math.floor(f / 1) * 3.1; // boil da forma a cada pose
    const rf = (a) => RB * (1 + noise(a * 2 + bseed, 5) * .016 + Math.sin(a * 2 - .4) * .025);
    contact(g, baseX + 4, footY + 2, 52 * (1 - jy / -120), 8, .5 * (1 + jy / 120));
    g.save(); g.translate(baseX, cy); g.scale(sxB, syB);
    // pés
    [[-20, 1], [20, -1]].forEach(([dx]) => { g.fillStyle = rad(g, dx - 4, RB + 1, 1, 14, [[0, '#F58A55'], [1, '#A23A18']]); g.beginPath(); g.ellipse(dx, RB + 3, 13, 7, 0, 0, TAU); g.fill(); });
    // corpo
    blobPath(g, 0, 0, rf, 40);
    g.fillStyle = rad(g, -16, -22, 3, 62, [[0, '#FFB48C'], [.4, '#F2723F'], [.82, '#C9471F'], [1, '#8E2A12']]); g.fill();
    g.save(); blobPath(g, 0, 0, rf, 40); g.clip();
    g.fillStyle = rad(g, 0, RB + 10, 4, 40, [[0, 'rgba(60,10,0,.35)'], [1, 'rgba(60,10,0,0)']]); g.fillRect(-RB, 0, RB * 2, RB + 4); // oclusão perto do chão
    g.globalAlpha = .55; g.drawImage(msPrint(), 10, -8, 34, 34); g.drawImage(msPrint(), -36, 6, 26, 26); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(110,25,0,.3)'; g.lineWidth = 1.6; g.beginPath(); g.arc(-8, 30, 12, -.2, 1.2); g.stroke();
    g.strokeStyle = 'rgba(255,215,190,.3)'; g.lineWidth = 1.2; g.beginPath(); g.arc(-9, 29, 12, -.2, 1.2); g.stroke();
    g.fillStyle = rad(g, -18, -26, 1, 22, [[0, 'rgba(255,236,220,.45)'], [1, 'rgba(255,236,220,0)']]); g.fillRect(-RB, -RB, RB, RB);
    g.save(); g.globalAlpha = .16; g.globalCompositeOperation = 'overlay'; g.drawImage(noiseTile(54), -RB, -RB, 128, 128); g.restore();
    g.restore();
    // braços (rolinhos de massa); o direito acena na fala
    const arm = (side, a) => {
      g.save(); g.translate(side * 39, 14); g.scale(side, 1); g.rotate(a); g.lineCap = 'round';
      g.strokeStyle = '#8E2E12'; g.lineWidth = 10.5; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(12, 3, 21, 0); g.stroke();
      g.strokeStyle = '#EA6634'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, -.8); g.quadraticCurveTo(12, 2.2, 20.5, -.8); g.stroke();
      g.strokeStyle = 'rgba(255,212,184,.55)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(3, -2.6); g.quadraticCurveTo(12, 0, 19, -3); g.stroke();
      g.fillStyle = rad(g, 21, -3, 1, 8, [[0, '#FF9A66'], [1, '#B8421A']]); g.beginPath(); g.arc(23, 0, 6, 0, TAU); g.fill();
      g.restore();
    };
    const waveA = f >= 15 && f < 37 ? -1.05 + Math.sin((f - 15) * .9) * .38 : laugh ? .55 + (f % 2) * .18 : f >= 78 && f < 84 ? -.6 : 1.05;
    arm(-1, laugh ? .55 + ((f + 1) % 2) * .18 : f >= 78 && f < 84 ? -.6 : 1.05); arm(1, waveA);
    // olhos (bolinhas brancas com pupila e brilho) + pálpebra de massa
    const lookR = (f >= 4 && f < 10) || (f >= 38 && f < 56) ? 3.4 : 0, lookU = f >= 78 && f < 84 ? -2 : 0;
    const blink = [9, 10, 46, 47, 92].includes(f) ? 1 : laugh ? .55 : 0;
    [[-15, -20, 12], [15, -22, 12.5]].forEach(([ex, ey, er]) => {
      g.fillStyle = 'rgba(90,20,0,.45)'; g.beginPath(); g.arc(ex + 1.5, ey + 2.5, er + 1, 0, TAU); g.fill();
      g.fillStyle = rad(g, ex - 4, ey - 5, 1, er * 1.3, [[0, '#FFFFFF'], [.7, '#F1EEE8'], [1, '#C9C2B6']]); g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill();
      g.fillStyle = '#16100C'; g.beginPath(); g.arc(ex + lookR + 1, ey + 1.5 + lookU, er * .45, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + lookR - 1.5, ey - 1.5 + lookU, 1.8, 0, TAU); g.fill();
      if (blink) { g.save(); g.beginPath(); g.arc(ex, ey, er + .5, 0, TAU); g.clip(); g.fillStyle = lin(g, 0, ey - er, 0, ey + er, [[0, '#F7824E'], [1, '#D2542A']]); g.fillRect(ex - er - 1, ey - er - 1, er * 2 + 2, (er * 2 + 2) * blink); g.strokeStyle = '#7A240C'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ex - er, ey - er + (er * 2 + 2) * blink); g.lineTo(ex + er, ey - er + (er * 2 + 2) * blink); g.stroke(); g.restore(); }
    });
    // sobrancelhas de massa: sobem na fala, arqueiam no riso
    const brow = f >= 15 && f < 34 ? -4 : laugh ? -2 : f >= 78 && f < 84 ? -5 : 0;
    [[-15, -20, 1], [15, -22, -1]].forEach(([ex, ey, s]) => {
      g.save(); g.translate(ex, ey - 17 + brow); g.rotate(s * (laugh ? .28 : brow ? -.12 : .08)); g.lineCap = 'round';
      g.strokeStyle = '#6A2410'; g.lineWidth = 4.6; g.beginPath(); g.moveTo(-7, 1); g.quadraticCurveTo(0, -2.5, 7, 1); g.stroke();
      g.strokeStyle = 'rgba(255,190,150,.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, -.6); g.quadraticCurveTo(0, -3.4, 5, -.6); g.stroke();
      g.restore();
    });
    // boca por substituição (O-L-Á, riso, sorriso)
    let m = 'M';
    if (f >= 16 && f < 20) m = 'O'; else if (f >= 20 && f < 23) m = 'L'; else if (f >= 23 && f < 29) m = 'A'; else if (laugh) m = (f % 4 < 2) ? 'A' : 'E'; else if (f >= 78 && f < 84) m = 'O';
    msMouth(g, m, 0, 12);
    g.restore();
    vignette(g, W, H, .22);
  };

  // =====================================================================
  // 3. RECORTE DE PAPEL — diorama de camadas com sombra entre elas, luz lateral quente, pop-ups
  // =====================================================================
  const fiberTile = () => sprite('pc-fiber', 128, 128, (c) => {
    const r = rng(19); c.lineCap = 'round';
    for (let i = 0; i < 900; i++) { c.fillStyle = r() > .5 ? 'rgba(255,255,255,.5)' : 'rgba(60,40,20,.35)'; c.fillRect(r() * 128, r() * 128, .8 + r(), .8); }
    for (let i = 0; i < 60; i++) { const x = r() * 128, y = r() * 128, a = r() * TAU, l = 3 + r() * 8; c.strokeStyle = r() > .5 ? 'rgba(255,255,255,.6)' : 'rgba(70,50,30,.35)'; c.lineWidth = .5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 1) * l * .5, y + Math.sin(a + 1) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  }, 1);
  // camada de papel: sombra projetada (luz vem da esquerda), cor fosca, fibra, borda de corte clara
  function paperPiece(c, build, col, { sh = [6, 4, 8, 'rgba(70,30,10,.42)'], w = 520, h = 300, lightX = true } = {}) {
    shadowOnly(c, (c) => { build(c); c.fill(); }, sh[0], sh[1], sh[2], sh[3]);
    build(c); c.fillStyle = col; c.fill();
    c.save(); build(c); c.clip();
    if (lightX) { c.fillStyle = lin(c, 0, 0, w, 0, [[0, 'rgba(255,236,200,.18)'], [.6, 'rgba(255,236,200,0)'], [1, 'rgba(40,10,0,.12)']]); c.fillRect(-50, -50, w + 100, h + 100); }
    c.globalAlpha = .55; for (let x = -50; x < w + 50; x += 128) for (let y = -20; y < h + 20; y += 128) c.drawImage(fiberTile(), x, y, 128, 128); c.globalAlpha = 1;
    build(c); c.strokeStyle = 'rgba(255,246,228,.55)'; c.lineWidth = 2.2; c.stroke(); // espessura do papel pegando luz
    c.restore();
  }
  const cutEdge = (c, fy, x0, x1, bottom, seed) => { const r = rng(seed); c.beginPath(); c.moveTo(x0, bottom); for (let x = x0; x <= x1; x += 3) c.lineTo(x, fy(x) + (r() - .5) * .9); c.lineTo(x1, bottom); c.closePath(); };
  const bump = (x, cx, w) => Math.pow(Math.max(0, 1 - Math.abs(x - cx) / w), 1.25);
  const fyFar = (x) => 150 - 50 * bump(x, 90, 120) - 66 * bump(x, 258, 130) - 38 * bump(x, 440, 100);
  const fyMid = (x) => 174 - 12 * Math.sin(x * .012 + 1) - 6 * Math.sin(x * .031);
  const fyFront = (x) => 206 - 12 * Math.sin(x * .0095 + 2.4) - 4 * Math.sin(x * .04);
  const fyFg = (x) => 254 - 5 * Math.sin(x * .02) - 10 * Math.abs(Math.sin(x * .045 + .5));
  const pcSky = () => sprite('pc-sky', 480, 270, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#F6E9D2'], [.6, '#F2D3AC'], [1, '#EDBF92']]); c.fillRect(0, 0, w, h);
    c.fillStyle = rad(c, -40, 90, 10, 420, [[0, 'rgba(255,244,220,.55)'], [1, 'rgba(255,244,220,0)']]); c.fillRect(0, 0, w, h);
    c.globalAlpha = .6; for (let x = 0; x < w; x += 128) for (let y = 0; y < h; y += 128) c.drawImage(fiberTile(), x, y, 128, 128);
    c.globalAlpha = 1; c.fillStyle = rad(c, 240, 135, 120, 330, [[0, 'rgba(60,25,5,0)'], [1, 'rgba(60,25,5,.22)']]); c.fillRect(0, 0, w, h);
  }, 1);
  const endDrop = (x) => Math.pow(Math.max(0, (x - 496) / 24, (-16 - x) / 24), 2) * 90;
  const pcLayer = (key, fy, col, seed, sh, y0) => sprite('pc-' + key, 560, 300 - y0, (c) => { c.translate(40, -y0); paperPiece(c, (c) => cutEdge(c, (x) => fy(x) + endDrop(x), -40, 520, 300, seed), col, { sh }); });
  const pcTree = (col, s) => sprite('pc-tree' + col + s, 50, 80, (c) => {
    c.translate(25, 78); c.scale(s, s);
    paperPiece(c, (c) => { c.beginPath(); c.rect(-2.5, -12, 5, 12); }, '#6B4A33', { sh: [2, 1, 2, 'rgba(60,25,5,.4)'], w: 40, h: 80, lightX: false });
    [[-12, 16, 22], [-24, 13, 20], [-36, 10, 18]].forEach(([y, hw, hh], i) => paperPiece(c, (c) => { c.beginPath(); c.moveTo(-hw, y); c.lineTo(0, y - hh); c.lineTo(hw, y); c.quadraticCurveTo(0, y - 3, -hw, y); c.closePath(); }, i % 2 ? col : shade(col, 14), { sh: [2.5, 1.5, 3, 'rgba(20,40,30,.45)'], w: 40, h: 80 }));
  });
  const shade = (hex, d) => { const n = parseInt(hex.slice(1), 16), cl = (v) => clamp(v + d, 0, 255) | 0; return `rgb(${cl(n >> 16)},${cl((n >> 8) & 255)},${cl(n & 255)})`; };
  const pcHouse = () => sprite('pc-house', 80, 80, (c) => {
    const sh = [2.5, 1.5, 3, 'rgba(60,20,5,.45)'], o = { sh, w: 80, h: 80 };
    paperPiece(c, (c) => { c.beginPath(); c.rect(50, 14, 8, 20); }, '#8E3B2A', o); // chaminé
    paperPiece(c, (c) => { c.beginPath(); c.rect(16, 36, 46, 40); }, '#F4E4C4', o);
    paperPiece(c, (c) => { c.beginPath(); c.moveTo(10, 40); c.lineTo(39, 14); c.lineTo(68, 40); c.closePath(); }, '#C9553B', o);
    paperPiece(c, (c) => { c.beginPath(); c.roundRect(24, 52, 12, 24, [6, 6, 0, 0]); }, '#2E5F5C', o);
    paperPiece(c, (c) => { c.beginPath(); c.rect(43, 50, 12, 12); }, '#F3B845', o);
    c.strokeStyle = 'rgba(80,40,10,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(49, 50); c.lineTo(49, 62); c.moveTo(43, 56); c.lineTo(55, 56); c.stroke();
  });
  const pcSun = () => sprite('pc-sun', 100, 100, (c) => {
    paperPiece(c, (c) => { blobPath(c, 50, 50, (a) => 38 + (Math.floor(a / TAU * 14 * 2) % 2 ? -5 : 0), 56); }, '#F5C36B', { sh: [3, 2, 4, 'rgba(120,50,10,.3)'], w: 100, h: 100 });
    paperPiece(c, (c) => { c.beginPath(); c.arc(50, 50, 26, 0, TAU); }, '#EE8A3A', { sh: [3, 2, 4, 'rgba(120,40,10,.4)'], w: 100, h: 100 });
  });
  const pcCloud = () => sprite('pc-cloud', 90, 44, (c) => {
    paperPiece(c, (c) => { c.beginPath(); c.moveTo(8, 34); c.arc(24, 30, 12, Math.PI, Math.PI * 1.5); c.arc(44, 20, 16, Math.PI * 1.05, Math.PI * 1.9); c.arc(66, 28, 11, Math.PI * 1.3, 0); c.lineTo(78, 34); c.closePath(); }, '#FFF9EE', { sh: [4, 3, 4, 'rgba(110,60,20,.3)'], w: 90, h: 44 });
  });
  const pcPuff = () => sprite('pc-puff', 20, 20, (c) => paperPiece(c, (c) => { c.beginPath(); c.arc(9, 9, 6, 0, TAU); }, '#FBF3E4', { sh: [2, 1.5, 2, 'rgba(90,50,20,.3)'], w: 20, h: 20 }));
  const pcBanner = () => sprite('pc-banner', 230, 90, (c) => {
    const b = (c) => { c.beginPath(); c.moveTo(12, 16); c.lineTo(206, 16); c.lineTo(194, 45); c.lineTo(206, 74); c.lineTo(12, 74); c.lineTo(24, 45); c.closePath(); };
    paperPiece(c, b, '#FFF4E0', { sh: [5, 4, 6, 'rgba(90,40,10,.4)'], w: 230, h: 90 });
    c.strokeStyle = 'rgba(200,85,61,.55)'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(30, 22); c.lineTo(196, 22); c.moveTo(30, 68); c.lineTo(196, 68); c.stroke(); c.setLineDash([]);
  });
  const TREES = [[58, '#2F6F66', 1.15, 0], [92, '#4E8C6A', .95, 2], [122, '#2F6F66', .8, 4], [388, '#4E8C6A', 1, 6], [424, '#2F6F66', 1.2, 8], [456, '#4E8C6A', .85, 10]];

  R['recorte-papel'] = (g, t, W, H) => {
    const tt = t % 8, fq = Math.floor(tt * 12), tq = fq / 12; // passos de papel: 12 poses/s
    const cam = (d) => Math.sin(tq / 8 * TAU) * 9 * d;
    const outK = (a, b) => eio(clamp((tq - a) / (b - a)));
    g.drawImage(pcSky(), 0, 0, W, H);
    // sol nasce detrás das montanhas
    const sunY = lerp(190, 96, ease(clamp((tq - 2.2) / .9))) + outK(7.5, 8) * 100;
    g.save(); g.translate(352 + cam(.1), sunY); g.rotate(tq * .12); g.drawImage(pcSun(), -50, -50, 100, 100); g.restore();
    g.drawImage(pcLayer('far', fyFar, '#D49A88', 3, [6, 4, 9, 'rgba(90,40,20,.36)'], 70), -40 + cam(.25), 70, 560, 230);
    // nuvens entram deslizando e seguem à deriva
    [[150, 64, 0], [420, 108, .6]].forEach(([x, y, d], i) => { const k = spr(clamp((tq - 3 - i * .3) / .9)); const cx = lerp(i ? 560 : -90, x, k) + Math.sin(tq * .8 + i) * 4 - outK(7.55, 8) * 150 * (i ? -1 : 1) * 3; if (tq > 3 + i * .3) g.drawImage(pcCloud(), cx - 45 + cam(.35), y - 22, 90 * (i ? .8 : 1), 44 * (i ? .8 : 1)); });
    g.drawImage(pcLayer('mid', fyMid, '#8DB08A', 5, [6, 4, 9, 'rgba(40,50,20,.42)'], 145), -40 + cam(.5), 145, 560, 155);
    // pinheiros: pop-up que se dobra para cima a partir da base
    TREES.forEach(([x, col, s, i]) => {
      const k0 = 1.1 + i * .09, k = spr(clamp((tq - k0) / .6)) * (1 - outK(7.4, 7.75)); if (k <= .12) return;
      const bx = x + cam(.5), by = fyMid(x) + 8;
      g.save(); g.translate(bx, by); g.rotate(Math.sin(tq * 2.2 + i) * .02); g.scale(1, k); g.drawImage(pcTree(col, s), -25, -78, 50, 80);
      if (k < .95) { g.fillStyle = `rgba(40,20,10,${(1 - k) * .35})`; g.fillRect(-25, -78, 50, 80); } g.restore();
    });
    // morro da frente entra pela direita; casa dobra para cima
    const fIn = spr(clamp((tq - .2) / .8)), fOut = outK(7.6, 8);
    const fx = lerp(520, 0, fIn) - fOut * 520;
    const hk = spr(clamp((tq - 1.9) / .6)) * (1 - outK(7.4, 7.7));
    if (hk > .12) {
      const hx = 262 + fx + cam(.8), hy = fyFront(262) + 7;
      g.save(); g.translate(hx, hy); g.scale(1.3, 1.3 * hk); g.drawImage(pcHouse(), -39, -76, 80, 80); if (hk < .95) { g.fillStyle = `rgba(40,20,10,${(1 - hk) * .35})`; g.fillRect(-39, -76, 80, 80); } g.restore();
      // fumaça: bolinhas de papel que sobem uma a uma
      if (tq > 2.6 && tq < 7.2) for (let i = 0; i < 4; i++) { const ph = ((tq - 2.6) * .55 + i / 4) % 1; const px = hx + 18 + Math.sin(ph * 5 + i) * 3 + ph * 10, py = hy - 82 - ph * 44, s = .6 + ph * .7; g.drawImage(pcPuff(), px - 10 * s, py - 10 * s, 20 * s, 20 * s); }
    }
    g.drawImage(pcLayer('front', fyFront, '#3F7C73', 7, [6, 3, 9, 'rgba(10,30,30,.5)'], 180), -40 + fx + cam(.8), 180, 560, 120);
    const gIn = spr(clamp((tq - .6) / .8)), gOut = outK(7.65, 8);
    g.drawImage(pcLayer('fg', fyFg, '#1E4744', 9, [4, -3, 8, 'rgba(0,20,20,.45)'], 225), -40 - lerp(520, 0, gIn) + gOut * 520 + cam(1.2), 225, 560, 75);
    // título: faixa de papel pendurada que se desdobra a partir da borda de cima
    const bk = ease(clamp((tq - 3.4) / .5)) * (1 - outK(7.2, 7.5));
    if (bk > .02) {
      const sw = Math.sin(tq * 1.6) * .012;
      g.strokeStyle = 'rgba(90,60,40,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(52, 0); g.lineTo(52, 30); g.moveTo(170, 0); g.lineTo(170, 30); g.stroke();
      g.save(); g.translate(111, 18); g.rotate(sw); g.scale(1, bk); g.translate(-111, -18);
      g.drawImage(pcBanner(), 0, 2, 230, 90);
      type(g, 'CAPÍTULO 1', 111, 36, { f: font(700, 14, F.body), fill: '#C8553D', track: 3 });
      type(g, 'Era uma vez', 111, 58, { f: `italic 700 26px ${F.serif}`, fill: '#4A2E2A' });
      if (bk < .95) { g.fillStyle = `rgba(60,30,10,${(1 - bk) * .4})`; g.fillRect(12, 18, 196, 60); }
      g.restore();
    }
  };

  // =====================================================================
  // 4. ROTOSCOPIA — breakdown "filmagem | traço": a mesma corrida real, redesenhada quadro a quadro
  // =====================================================================
  // ciclo de corrida com ângulos de articulação (coxa, joelho, braço) — movimento humano, não boneco
  function rsPose(ph, x0, y0) {
    const bob = Math.cos(ph * 2) * 3.5, hip = [x0, y0 + bob], lean = .17;
    const neck = [hip[0] + Math.sin(lean) * 52, hip[1] - Math.cos(lean) * 52];
    const head = [neck[0] + Math.sin(lean + .12) * 15, neck[1] - Math.cos(lean + .12) * 15];
    const sh = [hip[0] + Math.sin(lean) * 45, hip[1] - Math.cos(lean) * 45];
    const leg = (p) => { const th = .52 * Math.sin(p) + .1, kn = .2 + 1.55 * Math.pow(Math.max(0, Math.cos(p + .15)), 2);
      const k = [hip[0] + Math.sin(th) * 42, hip[1] + Math.cos(th) * 42], sa = th - kn, a = [k[0] + Math.sin(sa) * 41, k[1] + Math.cos(sa) * 41];
      return [hip, k, a, [a[0] + Math.cos(sa) * 13, a[1] - Math.sin(sa) * 13]]; };
    const arm = (p) => { const ua = -.75 * Math.sin(p) + .05, fa = ua + 1.55 + .25 * Math.cos(p), e = [sh[0] + Math.sin(ua) * 28, sh[1] + Math.cos(ua) * 28];
      return [sh, e, [e[0] + Math.sin(fa) * 25, e[1] + Math.cos(fa) * 25]]; };
    return { hip, neck, head, legN: leg(ph), legF: leg(ph + Math.PI), armN: arm(ph), armF: arm(ph + Math.PI) };
  }
  // partes em ordem de profundidade: [pontos, larguras, cores]
  function rsParts(P, pal) {
    const L = (l, dim) => [[l[0], l[1], 14, dim ? pal.shortsD : pal.shorts], [l[1], l[2], 10, dim ? pal.skinD : pal.skin], [l[2], l[3], 7, dim ? pal.shoeD : pal.shoe]];
    const A = (a, dim) => [[a[0], a[1], 9, dim ? pal.shirtD : pal.shirt], [a[1], a[2], 7.5, dim ? pal.skinD : pal.skin]];
    return [A(P.armF, 1), L(P.legF, 1), [[P.hip, P.neck, 21, pal.shirt], [P.neck, P.head, 8, pal.skin]], L(P.legN, 0), A(P.armN, 0)];
  }
  const RS_PAL = { skin: '#E8B38D', skinD: '#C98E6B', shirt: '#D6453A', shirtD: '#A8322B', shorts: '#2B3C5C', shortsD: '#1F2B44', shoe: '#F5F1E8', shoeD: '#D8D2C6' };
  const RS_VID = { skin: '#B7825F', skinD: '#7E5540', shirt: '#9E3A33', shirtD: '#6E2622', shorts: '#27303F', shortsD: '#171C26', shoe: '#C9C4BA', shoeD: '#8E8A82' };
  const seg = (g, a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  // fundo da "filmagem": parque ao entardecer, fora de foco, periódico em 480 px para o travelling
  const rsFootBg = () => sprite('rs-foot', 960, 270, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, 200, [[0, '#5E86A8'], [.5, '#E0A874'], [1, '#FFD39A']]); c.fillRect(0, 0, w, h);
    c.filter = 'blur(3px)';
    const r = rng(23);
    for (let rep = -1; rep < 3; rep++) {
      const ox = rep * 480, rr = rng(24);
      RS_TREES.forEach(([tx, s]) => { const x = ox + tx; c.fillStyle = `rgba(${34 + rr() * 20},${48 + rr() * 18},${44 + rr() * 12},.9)`; c.beginPath(); c.ellipse(x, 172 - s * .4, s * .85, s * .9, 0, 0, TAU); c.fill(); c.fillRect(x - 3, 172 - s * .4, 6, 60); });
      for (let i = 0; i < 12; i++) { const x = ox + rr() * 480, y = 70 + rr() * 90, s = 4 + rr() * 9; c.fillStyle = `rgba(255,${200 + rr() * 40},${140 + rr() * 50},${.25 + rr() * .3})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
      for (let i = 0; i < 2; i++) { const x = ox + 120 + i * 240; c.fillStyle = '#2A2B2E'; c.fillRect(x, 84, 4, 140); c.fillStyle = 'rgba(255,220,160,.9)'; c.beginPath(); c.arc(x + 2, 82, 7, 0, TAU); c.fill(); }
    }
    c.filter = 'none';
    c.fillStyle = lin(c, 0, 210, 0, 270, [[0, '#7A736B'], [.3, '#5C5650'], [1, '#2E2B28']]); c.fillRect(0, 210, w, h - 210);
    c.fillStyle = 'rgba(255,230,190,.25)'; c.fillRect(0, 210, w, 2);
    c.fillStyle = rad(c, 60, 150, 10, 360, [[0, 'rgba(255,200,130,.35)'], [1, 'rgba(255,200,130,0)']]); c.fillRect(0, 0, w, h);
  }, 1);
  const RS_TREES = (() => { const r = rng(23); return Array.from({ length: 8 }, () => [r() * 480, 30 + r() * 38]); })();
  const rsTmp = { c: null };
  function rsFootFigure(P, P0) { // figura "filmada": meia resolução (suavidade de vídeo) + rastro de movimento
    if (!rsTmp.c) { rsTmp.c = document.createElement('canvas'); rsTmp.c.width = 240; rsTmp.c.height = 135; }
    const c = rsTmp.c.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 240, 135); c.setTransform(.5, 0, 0, .5, 0, 0); c.lineCap = 'round';
    const draw = (Q, a) => { c.globalAlpha = a; rsParts(Q, RS_VID).forEach((grp) => { grp.forEach(([p, q, w, col]) => { c.strokeStyle = col; c.lineWidth = w; seg(c, p, q); }); grp.forEach(([p, q, w]) => { c.strokeStyle = 'rgba(255,214,160,.35)'; c.lineWidth = w * .4; seg(c, [p[0] - w * .22, p[1] - w * .22], [q[0] - w * .22, q[1] - w * .22]); }); });
      c.fillStyle = RS_VID.skin; c.beginPath(); c.arc(Q.head[0], Q.head[1], 12, 0, TAU); c.fill(); c.fillStyle = '#2C211C'; c.beginPath(); c.arc(Q.head[0] - 2, Q.head[1] - 2, 12, Math.PI * .7, Math.PI * 1.85); c.fill(); };
    draw(P0, .3); draw(P, 1); c.globalAlpha = 1;
    return rsTmp.c;
  }

  R['rotoscopia'] = (g, t, W, H, seed) => {
    const tt = t % 8, f = Math.floor(tt * 12), br = rng(f * 11 + seed), jj = (a) => (br() - .5) * 2 * a;
    const tq = f / 12, ph = tq / 8 * 12 * TAU; // 12 passadas por loop, desenhadas "em uns" a 12 qps
    const P = rsPose(ph, 204, 132), scroll = (tq / 8 * 960) % 480;
    const sx = 204 + Math.sin(tt / 8 * TAU) * 14 + Math.sin(tt / 8 * TAU * 2) * 4; // o corte passa sempre pelo tronco do corredor
    // --- lado FILMAGEM ---
    g.save(); g.beginPath(); g.rect(0, 0, sx, H); g.clip();
    g.drawImage(rsFootBg(), -scroll, 0, 960, 270);
    contact(g, 212, 222, 46, 6, .5);
    g.drawImage(rsFootFigure(P, rsPose(ph - .35, 204, 132)), 0, 0, W, H);
    g.fillStyle = 'rgba(255,170,90,.08)'; g.fillRect(0, 0, W, H);
    filmGrain(g, W, H, t, .22, 8);
    g.restore();
    // --- lado TRAÇO ---
    g.save(); g.beginPath(); g.rect(sx, 0, W - sx, H); g.clip();
    paper(g, W, H, '#F3ECDD', 7);
    const stage = tq < 1.6 || tq >= 7 ? 0 : tq < 4.8 ? 1 : 2; // esboço -> tinta + cor chapada -> + sombra
    g.lineCap = 'round'; g.lineJoin = 'round';
    const pencil = (a = .75) => `rgba(52,50,58,${a})`;
    for (let pass = 0; pass < 2; pass++) { // chão e postes em lápis, com boil
      g.strokeStyle = pencil(pass ? .35 : .7); g.lineWidth = pass ? .8 : 1.3;
      g.beginPath(); g.moveTo(0, 222 + jj(.8)); g.lineTo(W, 221 + jj(.8)); g.stroke();
      for (let k = -1; k < 3; k++) { const x = 120 + k * 240 - scroll + jj(.7); g.beginPath(); g.moveTo(x, 221); g.lineTo(x + jj(.6), 88); g.stroke(); g.beginPath(); g.arc(x + 2, 82 + jj(.5), 7 + jj(.6), 0, TAU); g.stroke(); }
      for (let k = 0; k < 6; k++) { const x = ((k * 83 - scroll * 1.0) % 480 + 480) % 480; g.beginPath(); g.moveTo(x + jj(1), 234 + (k % 2) * 12); g.lineTo(x + 26 + jj(1), 234 + (k % 2) * 12 + jj(.5)); g.stroke(); }
    }
    g.strokeStyle = pencil(.28); g.lineWidth = 1; // as mesmas árvores da filmagem, decalcadas a lápis
    for (let rep = -1; rep < 2; rep++) RS_TREES.forEach(([tx, s2], i) => { const x = tx + rep * 480 - scroll; if (x < sx - 60 || x > W + 60) return; const bj = jj(1); blobPath(g, x, 172 - s2 * .4, (a) => s2 * (.86 + .07 * Math.sin(a * 7 + i * 2) + Math.abs(Math.sin(a * 3.5 + i)) * .05) + bj, 40); g.stroke(); g.beginPath(); g.moveTo(x - 2, 172 - s2 * .4 + s2 * .9); g.lineTo(x - 2 + jj(.5), 221); g.moveTo(x + 3, 172 - s2 * .4 + s2 * .9); g.lineTo(x + 3 + jj(.5), 221); g.stroke(); });
    g.fillStyle = 'rgba(52,50,58,.16)'; g.beginPath(); g.ellipse(212, 223, 44, 5, 0, 0, TAU); g.fill();
    const parts = rsParts(P, RS_PAL), ox = jj(1.6), oy = jj(1.6);
    if (stage === 0) {
      parts.forEach((grp) => grp.forEach(([p, q, w]) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
        for (let pass = 0; pass < 2; pass++) { g.strokeStyle = pencil(pass ? .35 : .8); g.lineWidth = pass ? .8 : 1.2;
          g.beginPath(); g.moveTo(p[0] + nx + jj(1), p[1] + ny + jj(1)); g.lineTo(q[0] + nx + jj(1), q[1] + ny + jj(1)); g.moveTo(p[0] - nx + jj(1), p[1] - ny + jj(1)); g.lineTo(q[0] - nx + jj(1), q[1] - ny + jj(1)); g.stroke(); }
        g.strokeStyle = pencil(.3); g.lineWidth = .8; g.beginPath(); g.arc(p[0] + jj(1), p[1] + jj(1), w * .55, 0, TAU); g.stroke(); }));
      for (let pass = 0; pass < 2; pass++) { g.strokeStyle = pencil(pass ? .4 : .85); g.lineWidth = pass ? .8 : 1.3; wobbleCircle(g, P.head[0], P.head[1], 12.5, t + pass, 1.2, pass); g.stroke(); }
      g.strokeStyle = pencil(.3); g.lineWidth = .8; g.beginPath(); g.moveTo(P.head[0] - 12, P.head[1]); g.lineTo(P.head[0] + 12, P.head[1] + 2); g.moveTo(P.head[0] + 2, P.head[1] - 12); g.quadraticCurveTo(P.head[0] + 8, P.head[1], P.head[0] + 3, P.head[1] + 12); g.stroke();
    } else {
      parts.forEach((grp) => {
        g.strokeStyle = '#1C1A1C'; grp.forEach(([p, q, w]) => { g.lineWidth = w + 3.4 + jj(.5); seg(g, [p[0] + jj(.5), p[1] + jj(.5)], [q[0] + jj(.5), q[1] + jj(.5)]); });
        grp.forEach(([p, q, w, col]) => { g.strokeStyle = col; g.lineWidth = w; seg(g, [p[0] + ox, p[1] + oy], [q[0] + ox, q[1] + oy]); });
        if (stage === 2) grp.forEach(([p, q, w, col]) => { g.strokeStyle = 'rgba(40,20,40,.28)'; g.lineWidth = w * .45; seg(g, [p[0] + ox + w * .22, p[1] + oy + w * .2], [q[0] + ox + w * .22, q[1] + oy + w * .2]); });
      });
      g.fillStyle = '#1C1A1C'; g.beginPath(); g.arc(P.head[0], P.head[1], 13.8, 0, TAU); g.fill();
      g.fillStyle = RS_PAL.skin; g.beginPath(); g.arc(P.head[0] + ox, P.head[1] + oy, 12, 0, TAU); g.fill();
      g.fillStyle = '#3A2A22'; g.beginPath(); g.arc(P.head[0] - 2 + ox * .5, P.head[1] - 2 + oy * .5, 12.4, Math.PI * .7, Math.PI * 1.85); g.fill();
      g.strokeStyle = '#1C1A1C'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(P.head[0] + 6, P.head[1] + 5); g.lineTo(P.head[0] + 10, P.head[1] + 4); g.stroke();
      if (stage === 2) { g.fillStyle = 'rgba(40,20,40,.25)'; g.beginPath(); g.arc(P.head[0] + ox, P.head[1] + oy, 12, -.4, Math.PI * .9); g.fill(); }
    }
    type(g, `quadro ${String(142 + f).padStart(4, '0')}`, 462, 250, { f: font(700, 26, F.hand), fill: pencil(.85), align: 'right' });
    g.restore();
    // linha de corte + rótulos do breakdown
    g.fillStyle = '#FFFFFF'; g.fillRect(sx - 1, 0, 2, H);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx + 1, 0, 1, H);
    const lab = (s, x, al, dark) => { g.font = font(600, 14, F.mono); if ('letterSpacing' in g) g.letterSpacing = '2px'; const tw = g.measureText(s).width + 14; if ('letterSpacing' in g) g.letterSpacing = '0px';
      const bx = al === 'right' ? x - tw : x; g.fillStyle = dark ? 'rgba(12,14,18,.62)' : 'rgba(255,255,255,.7)'; g.beginPath(); g.roundRect(bx, 14, tw, 22, 3); g.fill();
      type(g, s, bx + 7, 25.5, { f: font(600, 14, F.mono), fill: dark ? '#F4EFE6' : '#2A2830', align: 'left', track: 2 }); };
    if (sx > 110) lab('FILMAGEM', sx - 8, 'right', 1);
    if (sx < 400) lab('TRAÇO', sx + 8, 'left', 0);
  };

  // =====================================================================
  // 5. PINTURA ANIMADA — óleo sobre vidro: mar ao entardecer que se repinta em noite e volta
  // =====================================================================
  const HZ = 150, SUNX = 330;
  const mixStops = (st, k) => { k = clamp(k); for (let i = 1; i < st.length; i++) if (k <= st[i][0]) { const [k0, a] = st[i - 1], [k1, b] = st[i], u = (k - k0) / (k1 - k0 || 1); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; } return st[st.length - 1][1].slice(); };
  const PT = [
    { sky: [[0, [44, 60, 112]], [.42, [146, 78, 122]], [.74, [232, 122, 92]], [1, [252, 196, 122]]], sea: [[0, [214, 122, 92]], [.28, [104, 72, 112]], [1, [24, 28, 58]]], orb: [SUNX, 116, 25], orbC: [255, 244, 196], glow: [255, 214, 140], glowR: 70, refl: [255, 200, 118] },
    { sky: [[0, [9, 16, 44]], [.6, [26, 48, 108]], [1, [62, 92, 152]]], sea: [[0, [46, 66, 118]], [.3, [20, 34, 76]], [1, [5, 9, 28]]], orb: [SUNX, 84, 17], orbC: [240, 240, 218], glow: [170, 190, 230], glowR: 55, refl: [206, 216, 236] },
  ];
  function ptField(x, y, s) {
    const P = PT[s], [ox, oy, orr] = P.orb, d = Math.hypot(x - ox, y - oy);
    if (y < HZ) {
      if (d < orr) return P.orbC.slice();
      const c = mixStops(P.sky, y / HZ), w = Math.exp(-(d - orr) / P.glowR) * .85;
      return [c[0] + (P.glow[0] - c[0]) * w, c[1] + (P.glow[1] - c[1]) * w, c[2] + (P.glow[2] - c[2]) * w];
    }
    const k = (y - HZ) / (270 - HZ), c = mixStops(P.sea, k), w = Math.exp(-Math.abs(x - ox) / (10 + k * 60)) * (1 - k * .7) * .9;
    return [c[0] + (P.refl[0] - c[0]) * w, c[1] + (P.refl[1] - c[1]) * w, c[2] + (P.refl[2] - c[2]) * w];
  }
  function ptFlow(x, y, s) {
    if (y >= HZ) return Math.sin(x * .03 + y * .11) * .14;
    const [ox, oy] = PT[s].orb, dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy) || 1, w = Math.exp(-d / 120);
    const vx = -dy / d * w + (1 - w), vy = dx / d * w + noise(x * .015, y * .02 + s) * .25 * (1 - w);
    return Math.atan2(vy, vx);
  }
  // pintura inteira em pinceladas (cacheada); a variante v só muda o tremor das pinceladas -> "boil" de óleo sobre vidro
  const ptPaint = (s, v) => sprite(`pt-${s}-${v}`, 480, 270, (c, w, h) => {
    const P = PT[s];
    c.fillStyle = lin(c, 0, 0, 0, HZ, P.sky.map(([k, a]) => [k, `rgb(${a.map(Math.round)})`])); c.fillRect(0, 0, w, HZ + 2);
    c.fillStyle = lin(c, 0, HZ, 0, h, P.sea.map(([k, a]) => [k, `rgb(${a.map(Math.round)})`])); c.fillRect(0, HZ, w, h - HZ);
    const r = rng(101 + s * 7), rj = rng(300 + v * 13 + s);
    c.lineCap = 'round';
    for (let y = -4; y < h + 4; y += 5.5) for (let x = -6; x < w + 6; x += 7) {
      const px = x + r() * 7, py = y + r() * 5.5, sea = py >= HZ;
      const a = ptFlow(px, py, s) + (rj() - .5) * .35, len = sea ? 11 + r() * 12 : 8 + r() * 11, wd = sea ? 2 + r() * 2 : 2.6 + r() * 3.4;
      const col = ptField(px + (rj() - .5) * 3, py + (rj() - .5) * 3, s), jv = (r() - .5) * 34;
      const ca = Math.cos(a), sa = Math.sin(a), bend = (r() - .5) * 4, jx = (rj() - .5) * 2, jy = (rj() - .5) * 2;
      const x0 = px - ca * len / 2 + jx, y0 = py - sa * len / 2 + jy, x1 = px + ca * len / 2 + jx, y1 = py + sa * len / 2 + jy;
      c.strokeStyle = `rgb(${clamp(col[0] + jv, 0, 255) | 0},${clamp(col[1] + jv * .9, 0, 255) | 0},${clamp(col[2] + jv * .7, 0, 255) | 0})`; c.lineWidth = wd;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(px - sa * bend + jx, py + ca * bend + jy, x1, y1); c.stroke();
      if (r() < .35) { c.strokeStyle = 'rgba(255,248,230,.28)'; c.lineWidth = wd * .3; c.beginPath(); c.moveTo(x0 + sa * wd * .3, y0 - ca * wd * .3); c.lineTo(x1 + sa * wd * .3, y1 - ca * wd * .3); c.stroke(); } // crista de tinta
    }
    if (s === 1) { const rs = rng(55); for (let i = 0; i < 26; i++) { const x = rs() * w, y = rs() * 110; if (Math.hypot(x - SUNX, y - 84) < 40) continue; c.fillStyle = `rgba(250,244,210,${.5 + rs() * .5})`; c.beginPath(); c.ellipse(x, y, 1.6 + rs() * 1.4, 1.2, rs() * 3, 0, TAU); c.fill(); } }
    tile(c, noiseTile(61), w, h, .1);
  }, 1.5);
  // máscaras de transição feitas de pinceladas: redemoinho que abre do astro / varrida de pincel da esquerda
  function ptSwirlMask(g, k) {
    const R0 = k * 560; g.beginPath();
    for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, rr = Math.max(0, R0 * (1 + noise(a * 3 + k * 6, 2) * .22) + Math.sin(a * 9 + k * 14) * 10); i ? g.lineTo(SUNX + Math.cos(a + k * 2.4) * rr, 100 + Math.sin(a + k * 2.4) * rr) : g.moveTo(SUNX + Math.cos(a + k * 2.4) * rr, 100 + Math.sin(a + k * 2.4) * rr); }
    g.closePath();
    const r = rng(9); for (let i = 0; i < 28; i++) { const a = r() * TAU + k * 3, rr = R0 * (1.05 + r() * .25); g.moveTo(SUNX + Math.cos(a) * rr + 14, 100 + Math.sin(a) * rr); g.ellipse(SUNX + Math.cos(a) * rr, 100 + Math.sin(a) * rr, 14 + r() * 10, 4 + r() * 3, a + Math.PI / 2, 0, TAU); }
  }
  function ptSweepMask(g, k) {
    const r = rng(12); g.beginPath();
    for (let y = -6; y < 276; y += 9) { const X = k * 620 - 60 + (r() - .5) * 70 + Math.sin(y * .05) * 20; g.moveTo(-10, y); g.lineTo(X, y + (r() - .5) * 3); g.quadraticCurveTo(X + 12, y + 5.5, X, y + 11); g.lineTo(-10, y + 11); g.closePath(); }
  }
  function ptLive(g, t, s, f) { // o que se mexe por cima: reflexo tremulando, barco, gaivotas
    const r = rng(f * 5 + s * 999), P = PT[s];
    g.lineCap = 'round';
    for (let i = 0; i < 34; i++) { const k = r(), y = HZ + 4 + k * 100, spread = 8 + k * 60, x = SUNX + (r() - .5) * 2 * spread, l = 6 + r() * 12;
      g.strokeStyle = `rgba(${P.refl.join(',')},${(.35 + r() * .5) * (1 - k * .6)})`; g.lineWidth = 1.6 + r() * 2; g.beginPath(); g.moveTo(x - l / 2, y); g.lineTo(x + l / 2, y + (r() - .5)); g.stroke(); }
    const u = t / 8 * TAU, bx = 176 + Math.sin(u) * 6, by = 168 + Math.sin(u * 10) * 1.6, rot = Math.sin(u * 10 + 1) * .05;
    g.save(); g.translate(bx, by); g.rotate(rot);
    g.strokeStyle = s ? 'rgba(10,14,30,.55)' : 'rgba(60,20,30,.5)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-34 + i * 8, 8 + i * 2); g.lineTo(-6 + i * 12 + r() * 3, 8 + i * 2); g.stroke(); } // reflexo do casco
    g.strokeStyle = s ? '#0B1024' : '#2A1422'; g.lineWidth = 6; g.beginPath(); g.moveTo(-30, -2); g.quadraticCurveTo(-4, 8, 28, -4); g.stroke();
    g.lineWidth = 3.5; g.beginPath(); g.moveTo(-26, -5); g.quadraticCurveTo(0, 2, 26, -7); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(-2, -4); g.lineTo(0, -52); g.stroke();
    const sail = s ? [[120, 132, 170], [90, 100, 140]] : [[246, 178, 112], [214, 120, 86]];
    for (let i = 0; i < 6; i++) { const u = i / 5; g.strokeStyle = `rgb(${sail[i % 2].join(',')})`; g.lineWidth = 4.5; g.beginPath(); g.moveTo(2, -48 + u * 40); g.lineTo(2 + (4 + u * 22) + (r() - .5) * 2, -46 + u * 40 + (r() - .5)); g.stroke(); }
    g.fillStyle = s ? '#0B1024' : '#2A1422'; g.beginPath(); g.ellipse(-14, -10, 3.2, 4.5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(-14, -16, 2.6, 0, TAU); g.fill(); // o velho
    if (s) { g.fillStyle = rad(g, 22, -12, 0, 16, [[0, 'rgba(255,200,110,.85)'], [.25, 'rgba(255,170,80,.35)'], [1, 'rgba(255,160,70,0)']]); g.fillRect(6, -28, 32, 32); g.fillStyle = '#FFE2A0'; g.beginPath(); g.arc(22, -12, 2, 0, TAU); g.fill(); }
    g.restore();
    if (!s && t < 3.9) for (let i = 0; i < 2; i++) { const x = 40 + t * 30 + i * 46, y = 58 + i * 16 + Math.sin(t * 1.4 + i) * 3, fl = Math.sin(t * 5 + i * 2) * 3;
      g.strokeStyle = 'rgba(50,30,50,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 8, y - 2 - fl); g.quadraticCurveTo(x - 3, y - 4, x, y); g.quadraticCurveTo(x + 3, y - 4, x + 8, y - 2 - fl); g.stroke(); }
  }

  R['pintura-animada'] = (g, t, W, H) => {
    const tt = t % 8, f = Math.floor(tt * 8), v = f % 3; // repinta a 8 qps: cada quadro é outra pintura
    const kN = eio(clamp((tt - 3.6) / 1.4)), kD = eio(clamp((tt - 6.8) / 1.1));
    g.drawImage(ptPaint(0, v), 0, 0, W, H);
    if (kN > 0 && kD < 1) { g.save(); if (kN < 1) { ptSwirlMask(g, kN); g.clip(); } g.drawImage(ptPaint(1, v), 0, 0, W, H); g.restore(); }
    if (kD > 0 && kD < 1) { g.save(); ptSweepMask(g, kD); g.clip(); g.drawImage(ptPaint(0, v), 0, 0, W, H); g.restore(); }
    const liveS = (kN > .5 && kD < .5) ? 1 : 0;
    ptLive(g, f / 8, liveS, f);
    g.fillStyle = rad(g, 240, 135, 110, 330, [[0, 'rgba(10,6,20,0)'], [1, 'rgba(10,6,20,.42)']]); g.fillRect(0, 0, W, H);
  };

  // =====================================================================
  // 6. SILHUETA — teatro de sombras à Lotte Reiniger: moça e pássaro articulados, renda recortada, luz atrás do papel
  // =====================================================================
  const INK = '#120909', GND = 226, PERCH = [386, 101];
  const shStage = (g) => rad(g, 236, 150, 10, 330, [[0, '#FFE6A6'], [.3, '#F6AE5E'], [.62, '#D2566A'], [1, '#3B1C58']]);
  const shBack = () => sprite('sh-back', 480, 270, (c, w, h) => {
    c.fillStyle = shStage(c); c.fillRect(0, 0, w, h);
    c.globalAlpha = .5; for (let x = 0; x < w; x += 128) for (let y = 0; y < h; y += 128) c.drawImage(fiberTile(), x, y, 128, 128); // papel vegetal contra a luz
    c.globalAlpha = 1; tile(c, noiseTile(71), w, h, .08);
    c.fillStyle = rad(c, 240, 135, 150, 320, [[0, 'rgba(20,0,20,0)'], [1, 'rgba(20,0,20,.35)']]); c.fillRect(0, 0, w, h);
  }, 1);
  const shSet = () => sprite('sh-set', 480, 270, (c, w, h) => {
    const r = rng(33); c.fillStyle = INK; c.strokeStyle = INK; c.lineCap = 'round';
    // renda do alto: festão com furos (evenodd)
    c.beginPath(); c.rect(0, 0, w, 9); for (let x = 0; x < w; x += 20) { c.moveTo(x, 8); c.arc(x + 10, 8, 10, Math.PI, 0, true); }
    for (let x = 0; x < w; x += 20) { c.moveTo(x + 12.6, 11); c.arc(x + 10, 11, 2.6, 0, TAU); c.moveTo(x + 1.2, 4.5); c.arc(x, 4.5, 1.2, 0, TAU); }
    c.fill('evenodd');
    // chão ondulado com grama fina e gavinhas
    c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 6) c.lineTo(x, GND + Math.sin(x * .03) * 3 + Math.sin(x * .11) * 1.2); c.lineTo(w, h); c.closePath(); c.fill();
    for (let i = 0; i < 70; i++) { const x = r() * w, y = GND + Math.sin(x * .03) * 3 + 1, hh = 5 + r() * 11, lean = (r() - .5) * 8; c.beginPath(); c.moveTo(x - 1.4, y); c.quadraticCurveTo(x + lean * .3, y - hh * .6, x + lean, y - hh); c.quadraticCurveTo(x + lean * .3 + .6, y - hh * .5, x + 1.4, y); c.fill(); }
    const curl = (x, y, s, dir) => { c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * 3.2 * Math.PI, rr = s * (1 - i / 46); const px = x + dir * (Math.cos(a) * rr - s), py = y - i * s * .05 - Math.sin(a) * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.lineWidth = 1.6; c.stroke(); };
    [[26, GND - 2, 9, 1], [58, GND - 1, 7, -1], [300, GND, 6, 1], [470, GND - 1, 8, -1]].forEach(([x, y, s, d]) => { c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 2); c.quadraticCurveTo(x + d * 4, y - s * 2, x, y - s * 3); c.stroke(); curl(x, y - s * 3, s, d); });
    // flores rendadas à esquerda
    [[40, 176, 7], [70, 192, 5.5], [18, 198, 5]].forEach(([x, y, s]) => { c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, GND); c.quadraticCurveTo(x - 6, (y + GND) / 2, x, y); c.stroke();
      c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.moveTo(x + Math.cos(a) * s * 1.9 + s, y + Math.sin(a) * s * 1.9); c.arc(x + Math.cos(a) * s * 1.9, y + Math.sin(a) * s * 1.9, s, 0, TAU); } c.moveTo(x + s * 1.2, y); c.arc(x, y, s * 1.2, 0, TAU);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.moveTo(x + Math.cos(a) * s * 2 + s * .4, y + Math.sin(a) * s * 2); c.arc(x + Math.cos(a) * s * 2, y + Math.sin(a) * s * 2, s * .4, 0, TAU); } c.fill('evenodd'); });
    // árvore de galhos em espiral, folhas em gota com furo
    const trunk = [[446, GND + 2], [452, 170], [432, 120], [440, 70]];
    for (let i = 0; i < 30; i++) { const u0 = i / 30, u1 = (i + 1) / 30, P = (u) => { const m = 1 - u; return [m * m * m * trunk[0][0] + 3 * m * m * u * trunk[1][0] + 3 * m * u * u * trunk[2][0] + u * u * u * trunk[3][0], m * m * m * trunk[0][1] + 3 * m * m * u * trunk[1][1] + 3 * m * u * u * trunk[2][1] + u * u * u * trunk[3][1]]; };
      const a = P(u0), b = P(u1); c.lineWidth = 16 - u0 * 12; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    const branch = (pts, w0) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]); c.lineWidth = w0; c.stroke(); };
    branch([[436, 124], [410, 118], [396, 104], [PERCH[0] - 16, PERCH[1] + 3]], 4); branch([[PERCH[0] - 16, PERCH[1] + 3], [PERCH[0] - 26, PERCH[1] + 4], [PERCH[0] - 34, PERCH[1] - 4], [PERCH[0] - 30, PERCH[1] - 10]], 2.4);
    branch([[440, 90], [460, 78], [470, 90], [476, 104]], 3.2); branch([[438, 150], [420, 150], [408, 160], [404, 172]], 3);
    curl(PERCH[0] - 30, PERCH[1] - 10, 5, -1); curl(476, 104, 5, 1); curl(404, 172, 5, -1);
    const leaf = (x, y, a, s) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .6, -s * .45, s * 1.5, 0); c.quadraticCurveTo(s * .6, s * .45, 0, 0); c.moveTo(s * .95, 0); c.ellipse(s * .75, 0, s * .22, s * .1, 0, 0, TAU); c.fill('evenodd'); c.restore(); };
    for (let i = 0; i < 7; i++) { const u = (i + .5) / 7, bx = lerp(434, 400, u), by = lerp(121, 105, u); leaf(bx, by, i % 2 ? -1.1 - r() * .4 : -2 + r() * .4, 11 + r() * 3); leaf(bx, by + 1, i % 2 ? .9 : 2.2, 9); }
    [[446, 72, -1.2], [458, 80, -.6], [470, 94, .1], [452, 90, 2.4], [438, 76, -2.3], [428, 150, 1.9], [414, 154, 2.6], [420, 158, .9], [406, 166, 1.8]].forEach(([x, y, a]) => leaf(x, y, a, 11));
  });
  const pin = (g, x, y, r = 2.2) => { g.strokeStyle = 'rgba(255,196,130,.6)'; g.lineWidth = .7; g.beginPath(); g.arc(x, y, r, .3, TAU - .6); g.stroke(); }; // junta de marionete (arame)
  function shGirl(g, x, ph, walking, armK, look) {
    const bob = walking ? -Math.abs(Math.sin(ph)) * 2 : 0, sway = walking ? Math.sin(ph) * 3 : 0;
    const S = 1.28; g.save(); g.translate(x, GND + 1 + bob); g.scale(S, S); g.fillStyle = INK;
    // sapatinhos alternando sob a barra
    [0, Math.PI].forEach((o) => { const s = walking ? Math.sin(ph + o) : (o ? -.3 : .3), fx = s * 9, lift = walking ? Math.max(0, Math.cos(ph + o)) * 3 : 0; g.beginPath(); g.moveTo(fx - 5, -1 - lift); g.lineTo(fx + 6, -1.5 - lift); g.quadraticCurveTo(fx + 1, -6 - lift, fx - 5, -5 - lift); g.fill(); });
    // saia de sino com barra recortada e furos de renda
    g.beginPath(); g.moveTo(-6, -64); g.bezierCurveTo(-14, -40, -26 + sway, -20, -30 + sway, -6);
    for (let k = 0; k < 8; k++) { const x0 = -30 + sway + k * 7.5; g.arc(x0 + 3.75, -6, 3.75, Math.PI, 0, true); }
    g.bezierCurveTo(26 + sway * .6, -20, 13, -40, 6, -64); g.closePath();
    for (let k = 0; k < 7; k++) { const hx = -21 + sway * .8 + k * 7; g.moveTo(hx + 1.9, -13); g.arc(hx, -13, 1.9, 0, TAU); }
    for (let k = 0; k < 4; k++) { const hx = -13 + sway * .5 + k * 8.7; g.moveTo(hx, -27); g.quadraticCurveTo(hx + 2.4, -23, hx, -21); g.quadraticCurveTo(hx - 2.4, -23, hx, -27); }
    g.fill('evenodd');
    // corpete, laço nas costas, pescoço
    g.beginPath(); g.moveTo(-7, -63); g.lineTo(7, -63); g.lineTo(8, -80); g.quadraticCurveTo(3, -86, -6, -84); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(-12, -66, 6, 3, -.5 + sway * .03, 0, TAU); g.ellipse(-11, -60, 5, 2.6, .6, 0, TAU); g.fill();
    g.fillRect(-1.5, -91, 4.5, 8);
    // cabeça de perfil com olho recortado
    g.save(); g.translate(1, -100); g.rotate(-look * .25);
    g.beginPath(); g.moveTo(3, 8); g.lineTo(-4, 8); g.arc(-1, -1, 9.5, 1.9, -1.05); g.lineTo(8.6, -8.4); g.lineTo(9.8, -4.4); g.lineTo(13, -.6); g.lineTo(10, .6); g.lineTo(10.6, 2.6); g.lineTo(9.6, 3.6); g.lineTo(10.2, 5); g.lineTo(8, 7.8); g.closePath();
    g.moveTo(7.6, -3.6); g.quadraticCurveTo(5.8, -5.4, 4, -3.6); g.quadraticCurveTo(5.8, -2.6, 7.6, -3.6); g.fill('evenodd');
    g.beginPath(); g.arc(-8.5, -6, 6.2, 0, TAU); g.fill(); // coque
    const fl = Math.sin(ph * 1.5) * .15; g.lineCap = 'round'; g.strokeStyle = INK; // fitas do cabelo ao vento
    [[0, 1], [.4, .8]].forEach(([o, s]) => { g.save(); g.translate(-12, -2); g.rotate(-.35 + o + fl); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-3 * s, 9, -2 * s + fl * 8, 18 * s); g.lineWidth = 2; g.stroke(); g.restore(); });
    g.restore();
    // braço articulado: ombro e cotovelo
    const ua = lerp(.12, 1.45, armK), fa = lerp(.3, 2.05, armK), sh = [0, -80];
    const el = [sh[0] + Math.sin(ua) * 15, sh[1] + Math.cos(ua) * 15], hd = [el[0] + Math.sin(fa) * 14, el[1] + Math.cos(fa) * 14];
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 4.6; seg(g, sh, el); g.lineWidth = 3.4; seg(g, el, hd);
    g.beginPath(); g.ellipse(hd[0] + Math.sin(fa) * 2, hd[1] + Math.cos(fa) * 2, 3.2, 2, fa, 0, TAU); g.fill();
    pin(g, sh[0], sh[1]); pin(g, el[0], el[1], 1.8);
    g.restore();
    return [x + (hd[0] + Math.sin(fa) * 3) * S, GND + 1 + bob + (hd[1] + Math.cos(fa) * 3) * S];
  }
  function shBird(g, x, y, dir, flap, perched, t) {
    g.save(); g.translate(x, y); g.scale(dir * 1.3, 1.3); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    const tail = perched ? Math.sin(t * 7) * .12 : .2;
    [[0, 16], [.22, 14], [-.2, 13]].forEach(([o, l]) => { g.save(); g.translate(-7, -1); g.rotate(Math.PI - .35 + o + tail); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * .5, -1.6, l, 0); g.stroke(); g.lineWidth = 1.3; g.beginPath(); g.moveTo(l + 3.5, 0); g.ellipse(l + 1, 0, 3.2, 1.6, 0, 0, TAU); g.moveTo(l + 1.8, 0); g.arc(l + 1, 0, .8, 0, TAU); g.fill('evenodd'); g.restore(); });
    g.beginPath(); g.ellipse(0, 0, 9, 5.4, -.15, 0, TAU); g.fill();
    const nod = perched ? Math.sin(Math.floor(t * 4) * 1.7) * .15 : 0;
    g.save(); g.translate(7, -4); g.rotate(nod); g.beginPath(); g.arc(0, 0, 4.2, 0, TAU); g.moveTo(3.4, -1.6); g.lineTo(9, 0); g.lineTo(3.4, 1.4); g.closePath(); g.moveTo(2.1, -1); g.arc(1.3, -1, .8, 0, TAU); g.fill('evenodd'); g.restore();
    if (perched) { g.lineWidth = 1.1; g.beginPath(); g.moveTo(-1, 4); g.lineTo(-1, 8); g.moveTo(2, 4); g.lineTo(2.6, 8); g.stroke(); }
    const w1 = perched ? .15 : Math.sin(flap) * .9 - .2, w2 = perched ? .1 : Math.sin(flap - .8) * .7;
    g.save(); g.translate(-1, -3); g.rotate(-w1 - .2);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-4, -6, -12, -7); g.lineTo(-11, -2); g.quadraticCurveTo(-5, 0, 0, 2); g.fill();
    g.translate(-11.5, -4.5); g.rotate(-w2); g.beginPath(); g.moveTo(0, -2.5); g.quadraticCurveTo(-7, -5, -14, -3); g.lineTo(-10, -1); g.lineTo(-13, 1); g.lineTo(-8, 1.2); g.quadraticCurveTo(-4, 2.4, 0, 2.5); g.closePath();
    for (let k = 0; k < 3; k++) { g.moveTo(-3 - k * 3.4 + .9, 0); g.arc(-3 - k * 3.4, 0, .9, 0, TAU); } g.fill('evenodd');
    pin(g, 0, 0, 1.6); g.restore(); pin(g, -1, -3, 1.6);
    g.restore();
  }

  R['silhueta'] = (g, t, W, H) => {
    const tt = t % 8, tq = Math.floor(tt * 12) / 12; // marionete de papel: 12 poses/s
    g.drawImage(shBack(), 0, 0, W, H);
    const fl = (rng(Math.floor(tt * 12) + 5)() - .5) * .05; g.fillStyle = fl > 0 ? `rgba(255,236,190,${fl})` : `rgba(40,0,30,${-fl})`; g.fillRect(0, 0, W, H); // chama da lamparina
    // moça: entra (0–1,6 s), estende a mão, sai pela direita (5,8–8 s)
    const walkIn = clamp(tq / 1.6), walkOut = clamp((tq - 5.8) / 2.2);
    const gx = tq < 5.8 ? lerp(-50, 196, walkIn) : lerp(196, 540, walkOut), walking = tq < 1.6 || tq >= 5.8;
    const armK = eio(clamp((tq - 1.6) / .5)) * (1 - eio(clamp((tq - 5) / .5)));
    const look = eio(clamp((tq - 2) / .6)) * (1 - eio(clamp((tq - 5.3) / .5))) * .6 + (tq > 5 && tq < 5.9 ? .5 : 0);
    const hand = shGirl(g, gx, gx / 32 * Math.PI, walking, armK, look);
    g.drawImage(shSet(), 0, 0, W, H);
    // pássaro: galho -> mão (2,2–3,0 s) -> galho (5,0–5,8 s)
    const perchT = [PERCH[0], PERCH[1] - 6], handT = [hand[0] + 2, hand[1] - 6];
    let bx, by, dir = -1, perched = true, flap = tq * 34;
    const fly = (a, b, k, lift) => { const e = eio(k), m = 1 - e; return [m * m * a[0] + 2 * m * e * ((a[0] + b[0]) / 2) + e * e * b[0], m * m * a[1] + 2 * m * e * (Math.min(a[1], b[1]) - lift) + e * e * b[1]]; };
    if (tq < 2.2) [bx, by] = perchT;
    else if (tq < 3) { [bx, by] = fly(perchT, handT, (tq - 2.2) / .8, 50); perched = false; }
    else if (tq < 5) [bx, by] = handT;
    else if (tq < 5.8) { [bx, by] = fly(handT, perchT, (tq - 5) / .8, 60); perched = false; dir = 1; }
    else { [bx, by] = perchT; }
    shBird(g, bx, by, dir, flap, perched, tq);
    // letreiro recortado no chão: a luz passa pelas letras
    const cut = clamp((tq - 2.6) / .8), gone = clamp((tq - 7.2) / .35);
    if (cut > 0 && gone < 1) { g.save(); g.beginPath(); g.rect(160, 230, 170 * cut * (1 - gone), 40); g.clip(); type(g, 'Era uma vez…', 245, 250, { f: `italic 700 22px ${F.didone}`, fill: shStage(g), track: 1 }); g.restore(); }
  };

  // =====================================================================
  // 7. NANQUIM E AQUARELA — rolo de pintura: o pincel traça a crista, a aguada escorre, um só acento vermelho
  // =====================================================================
  const AQ_RIDGE = [[228, 206], [262, 150], [292, 100], [312, 112], [334, 96], [356, 76], [380, 104], [404, 118], [428, 142], [452, 166], [474, 204]];
  const AQ_FAR = [[120, 204], [150, 160], [178, 132], [202, 142], [222, 120], [246, 146], [270, 170], [290, 204]];
  const catmull = (pts, u) => { const n = pts.length - 1, x = clamp(u) * n, i = Math.min(n - 1, Math.floor(x)), k = x - i, p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const c = (a, b, cc, d) => .5 * (2 * b + (-a + cc) * k + (2 * a - 5 * b + 4 * cc - d) * k * k + (-a + 3 * b - 3 * cc + d) * k * k * k); return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]; };
  // pincel seco: 4 fios de tinta com falhas onde o pelo abre
  function aqBrush(g, pts, k, wMax, col, seed) {
    const N = 70, n = Math.floor(N * clamp(k)); if (n < 1) return;
    g.lineCap = 'round'; g.strokeStyle = col;
    const P = []; for (let i = 0; i <= n; i++) { const u = i / N, [x, y] = catmull(pts, u), [x2, y2] = catmull(pts, Math.min(1, u + .01)), l = Math.hypot(x2 - x, y2 - y) || 1;
      P.push([x, y, -(y2 - y) / l, (x2 - x) / l, wMax * (.3 + .7 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1 + .06)), .5)) * (.8 + noise(u * 9, seed) * .28), u]); }
    [[0, .62], [-.36, .3], [.36, .3], [.2, .22]].forEach(([off, fw], s) => { // miolo cheio + fios do pincel seco (com falhas)
      for (let i = 1; i < P.length; i++) { const [x0, y0, nx0, ny0, w0] = P[i - 1], [x1, y1, nx1, ny1, w1, u] = P[i];
        if (s && noise(u * 26 + s * 7, seed + s) > .38 + s * .05) continue;
        g.lineWidth = (w0 + w1) / 2 * fw; g.beginPath(); g.moveTo(x0 + nx0 * w0 * off, y0 + ny0 * w0 * off); g.lineTo(x1 + nx1 * w1 * off, y1 + ny1 * w1 * off); g.stroke(); } });
  }
  const aqRidgeDone = () => sprite('aq-ridge', 480, 270, (c) => aqBrush(c, AQ_RIDGE, 1, 10, 'rgba(24,22,26,.9)', 3));
  // aguada: corpo da montanha com borda escura (pigmento que acumula) e granulação
  const aqWash = (key, pts, dark, pale, seed) => sprite('aq-' + key, 480, 270, (c) => {
    const body = (c, dy = 0) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1] + dy); for (let i = 1; i <= 40; i++) { const [x, y] = catmull(pts, i / 40); c.lineTo(x, y + dy); } c.lineTo(pts[pts.length - 1][0], 250); c.lineTo(pts[0][0], 250); c.closePath(); };
    c.filter = 'blur(2.5px)'; body(c, 2); c.fillStyle = lin(c, 0, 70, 0, 225, [[0, dark], [.55, pale], [1, 'rgba(60,58,62,0)']]); c.fill();
    const r = rng(seed); for (let i = 0; i < 9; i++) { const [x, y] = catmull(pts, .1 + r() * .8); c.fillStyle = dark; c.globalAlpha = .25; c.beginPath(); c.ellipse(x + (r() - .5) * 20, y + 14 + r() * 26, 10 + r() * 16, 5 + r() * 9, (r() - .5), 0, TAU); c.fill(); }
    c.globalAlpha = 1; c.filter = 'blur(.7px)'; c.strokeStyle = dark; c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = catmull(pts, i / 40); i ? c.lineTo(x, y + 2.5) : c.moveTo(x, y + 2.5); } c.stroke();
    c.filter = 'none'; c.save(); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = .22; for (let x = 0; x < 480; x += 256) for (let y = 0; y < 270; y += 256) c.drawImage(noiseTile(81, 1), x, y); c.restore();
  }, 1);
  // máscaras suaves: frente de tinta que desce / flor de tinta que abre
  const aqFront = () => sprite('aq-front', 480, 600, (c) => { c.filter = 'blur(7px)'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(-20, -20); c.lineTo(500, -20); for (let x = 500; x >= -20; x -= 10) c.lineTo(x, 400 + noise(x * .045, 7) * 16 + Math.sin(x * .21) * 5); c.closePath(); c.fill(); }, .5);
  const aqBloom = () => sprite('aq-bloom', 256, 256, (c) => { c.filter = 'blur(8px)'; c.fillStyle = '#000'; blobPath(c, 128, 128, (a) => 96 + noise(a * 3, 5) * 18 + Math.sin(a * 7) * 5, 64); c.fill(); }, .5);
  const aqSun = () => sprite('aq-sun', 60, 60, (c) => {
    c.filter = 'blur(1.4px)'; c.fillStyle = 'rgba(214,62,42,.8)'; blobPath(c, 30, 30, (a) => 19 + noise(a * 2, 2) * 1.5, 48); c.fill();
    c.filter = 'blur(.6px)'; c.strokeStyle = 'rgba(160,28,18,.55)'; c.lineWidth = 1.4; blobPath(c, 30, 30, (a) => 18.6 + noise(a * 2, 2) * 1.5, 48); c.stroke();
    c.filter = 'none'; c.save(); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = .2; c.drawImage(noiseTile(82, 1), 0, 0); c.restore();
  });
  const aqSeal = () => sprite('aq-seal', 30, 30, (c) => {
    const r = rng(4); c.fillStyle = 'rgba(186,36,28,.94)'; c.beginPath(); c.moveTo(3, 3); for (let i = 0; i <= 12; i++) c.lineTo(3 + i * 2, 3 + (r() - .5) * .9); for (let i = 0; i <= 12; i++) c.lineTo(27 + (r() - .5) * .9, 3 + i * 2); for (let i = 12; i >= 0; i--) c.lineTo(3 + i * 2, 27 + (r() - .5) * .9); for (let i = 12; i >= 0; i--) c.lineTo(3 + (r() - .5) * .9, 3 + i * 2); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.lineCap = 'round'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(8, 11); c.lineTo(8, 21); c.lineTo(22, 21); c.lineTo(22, 11); c.moveTo(15, 7); c.lineTo(15, 21); c.stroke(); // pictograma de montanha
    c.globalAlpha = .35; c.drawImage(noiseTile(83, 1), 0, 0, 60, 60); c.globalCompositeOperation = 'source-over';
  }, 3);
  const aqMist = () => sprite('aq-mist', 260, 60, (c) => { c.filter = 'blur(10px)'; c.fillStyle = 'rgba(247,242,232,.85)'; c.beginPath(); c.ellipse(130, 30, 105, 12, 0, 0, TAU); c.fill(); }, 1);
  const aqScr = { c: null };
  function aqReveal(g, img, mask, mx, my, mw, mh) { // aguada visível só sob a máscara suave (tela de rascunho reaproveitada)
    const d = Math.max(1, g.getTransform().a); let c = aqScr.c; if (!c) c = aqScr.c = document.createElement('canvas');
    if (c.width !== Math.round(480 * d)) { c.width = Math.round(480 * d); c.height = Math.round(270 * d); }
    const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 480, 270);
    x.drawImage(mask, mx, my, mw, mh); x.globalCompositeOperation = 'source-in'; x.drawImage(img, 0, 0, 480, 270); x.globalCompositeOperation = 'source-over';
    g.drawImage(c, 0, 0, 480, 270);
  }
  function aqScene(g, s, t) { // s = tempo local da pintura (pode ser negativo: ainda não começou)
    // montanha distante: flor de tinta clara que abre
    const kF = ease(clamp((s - 1.1) / 1.4));
    if (kF > 0) { const img = aqWash('far', AQ_FAR, 'rgba(92,92,98,.55)', 'rgba(120,120,126,.25)', 2); if (kF < 1) { const sz = 60 + kF * 380; aqReveal(g, img, aqBloom(), 200 - sz / 2, 150 - sz / 2, sz, sz); } else g.drawImage(img, 0, 0, 480, 270); }
    // sol vermelho (único acento): a mancha se abre no papel molhado
    const kS = clamp((s - 4.1) / .9);
    if (kS > 0) { const sc = .25 + .75 * ease(kS); g.drawImage(aqSun(), 214 - 30 * sc, 64 - 30 * sc, 60 * sc, 60 * sc); }
    // montanha principal: o pincel traça a crista e a aguada escorre dela
    const kR = clamp((s + .5) / 1.3), kW = eio(clamp((s - .25) / 2));
    if (kW > 0) { const img = aqWash('main', AQ_RIDGE, 'rgba(34,32,38,.9)', 'rgba(90,88,96,.45)', 5); if (kW < 1) aqReveal(g, img, aqFront(), 0, lerp(40, 250, kW) - 400, 480, 600); else g.drawImage(img, 0, 0, 480, 270); }
    if (kR >= 1) g.drawImage(aqRidgeDone(), 0, 0, 480, 270); else if (kR > 0) aqBrush(g, AQ_RIDGE, kR, 10, 'rgba(24,22,26,.9)', 3);
    // névoa que passa na base
    if (s > 2) g.drawImage(aqMist(), 250 + Math.sin(t * .5) * 30, 176, 260, 60);
    // linhas d'água e o barqueiro, traço a traço
    [[[34, 214], [92, 213], [150, 215]], [[168, 222], [230, 221], [276, 223]], [[60, 232], [110, 231]]].forEach((p, i) => aqBrush(g, p, clamp((s - 2.6 - i * .25) / .45), 3, 'rgba(40,38,44,.7)', 10 + i));
    const kb = (s - 3.3) / .8;
    if (kb > 0) { const bob = Math.sin(t * 1.6) * 1.2; g.save(); g.translate(118, 206 + bob); g.rotate(Math.sin(t * 1.6 + .6) * .03); g.scale(1.45, 1.45);
      aqBrush(g, [[-22, 0], [0, 4.5], [22, -1]], clamp(kb * 2), 4.5, 'rgba(26,24,28,.92)', 21);
      if (kb > .45) { g.fillStyle = 'rgba(26,24,28,.9)'; g.beginPath(); g.moveTo(-12, -11); g.quadraticCurveTo(-4, -18, 4, -11.5); g.quadraticCurveTo(-4, -13, -12, -11); g.fill(); g.beginPath(); g.ellipse(-4, -6, 3.4, 5.2, .15, 0, TAU); g.fill(); }
      if (kb > .7) aqBrush(g, [[-3, -8], [16, -34], [30, -50]], clamp((kb - .7) * 3.3), 1.6, 'rgba(26,24,28,.8)', 22);
      g.restore(); }
    // título + selo
    const kT = clamp((s - 5) / .6);
    if (kT > 0) { g.save(); g.beginPath(); g.rect(276, 222, 164 * kT, 30); g.clip(); type(g, 'Montanha e água', 436, 238, { f: `italic 400 19px ${F.serif}`, fill: 'rgba(38,36,40,.88)', align: 'right' }); g.restore(); }
    const kP = s - 5.5; if (kP > 0) { const sc = 1 + (1 - spr(kP / .5)) * .35; g.drawImage(aqSeal(), 455 - 12 * sc, 238 - 12 * sc, 24 * sc, 24 * sc); }
  }

  R['tinta-aquarela'] = (g, t, W, H) => {
    const tt = t % 8, pan = eio(clamp((tt - 6.1) / 1.5)) * 480, s = tt + 1.6; // rolo de pintura: o papel corre e a próxima pintura já começa
    g.save(); g.translate(-pan, 0);
    if (pan < 480) { paper(g, W, H, '#F2EBDC', 12); aqScene(g, s, t); }
    if (pan > 0) { g.translate(480, 0); paper(g, W, H, '#F2EBDC', 12); aqScene(g, s - 8, t); }
    g.restore();
  };
})();
