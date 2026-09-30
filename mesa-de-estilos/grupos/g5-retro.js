// Grupo 5 — Retrô e época: synthwave, pixel-art, vhs-analogico, rubber-hose, mid-century, bauhaus, y2k-frutiger,
// psicodelico, construtivismo, gravura. Tudo dentro da IIFE: nenhuma variável global nova.
(() => {
  // ---------------- utilitários do grupo ----------------
  const S2 = 2; // sprites em 2× para não borrar em tela retina
  const sprite = (key, w, h, fn) => cached('g5:' + key, Math.ceil(w * S2), Math.ceil(h * S2), (c) => { c.scale(S2, S2); fn(c, w, h); });
  const offs = new Map();
  const off = (key, w, h) => { let c = offs.get(key); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; offs.set(key, c); } return c; };
  const seg = (T, a, b) => clamp((T - a) / (b - a));
  const bell = (T, a, b) => Math.sin(Math.PI * seg(T, a, b));
  const hash = (i, s = 0) => rng(i * 7919 + s * 104729 + 17)();
  // chave de fonte: sprite de texto é refeito quando a webfont termina de carregar
  const fk = (fam) => { try { return document.fonts.check('16px ' + fam) ? 'ok' : 'fb'; } catch (e) { return 'ok'; } };
  const paths = new Map();
  // Path2D com borda de papel recortado (cacheado)
  const rough = (key, pts, amp = 1.5, step = 7) => {
    let p = paths.get(key); if (p) return p;
    const r = rng([...key].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7)); p = new Path2D(); let first = true;
    pts.forEach(([x0, y0], i) => {
      const [x1, y1] = pts[(i + 1) % pts.length]; const L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(1, Math.round(L / step));
      const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let k = 0; k < n; k++) { const u = k / n, j = k === 0 ? 0 : (r() - .5) * 2 * amp; const x = x0 + (x1 - x0) * u + nx * j, y = y0 + (y1 - y0) * u + ny * j; if (first) { p.moveTo(x, y); first = false; } else p.lineTo(x, y); }
    });
    p.closePath(); paths.set(key, p); return p;
  };
  const scanSprite = (step, a) => sprite('scan' + step + a, 480, 270, (c) => { c.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < 270; y += step) c.fillRect(0, y, 480, step / 2); });
  // versões baratas (sprite 1:1) de vinheta, papel e grão — degradê de tela cheia custa ~0,9 ms, sprite ~0,12 ms
  const vig = (g, W, H, a) => g.drawImage(sprite('vig' + a, 480, 270, (c) => vignette(c, 480, 270, a)), 0, 0, W, H);
  const paperS = (g, tone, seed, W = 480, H = 270) => g.drawImage(sprite('pap' + tone + seed, 480, 270, (c) => paper(c, 480, 270, tone, seed)), 0, 0, W, H);
  const grainTile = (seed) => cached('g5:grain' + seed, 512, 512, (c) => { const d = c.createImageData(512, 512), r = rng(seed * 97 + 5); for (let i = 0; i < d.data.length; i += 4) { const v = r(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > .5 ? 255 : 0; d.data[i + 3] = Math.abs(v - .5) * 510; } c.putImageData(d, 0, 0); });
  const grain = (g, W, H, t, a, seed = 1) => { const tile = grainTile(seed), r = rng(Math.floor(t * 24) * 13 + seed); g.save(); g.globalAlpha = a; const ox = -Math.floor(r() * 256), oy = -Math.floor(r() * 256); for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) g.drawImage(tile, x, y, 256, 256); g.restore(); };

  // =====================================================================================
  // SYNTHWAVE — sol listrado, grade magenta, montanhas de arame, cromado + script neon
  // =====================================================================================
  const swMtn = () => sprite('sw-mtn', 480, 72, (c, w, h) => {
    const ranges = [
      [[-12, 62], [16, 40], [40, 48], [74, 14], [100, 38], [126, 26], [152, 50], [180, 42], [208, 64], [226, 72]],
      [[252, 72], [272, 62], [300, 42], [324, 52], [352, 12], [380, 36], [406, 22], [434, 46], [460, 30], [494, 52]],
    ];
    c.lineJoin = 'round';
    ranges.forEach((pts) => {
      const path = new Path2D(); path.moveTo(pts[0][0], h); pts.forEach(([x, y]) => path.lineTo(x, y)); path.lineTo(pts[pts.length - 1][0], h); path.closePath();
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#321066'], [1, '#12042C']]); c.fill(path);
      c.save(); c.clip(path); c.strokeStyle = 'rgba(90,230,255,.32)'; c.lineWidth = .7;
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(mx + (mx - 240) * .1, h); c.lineTo(x1, y1); c.stroke(); }
      for (let k = 1; k < 4; k++) { c.beginPath(); pts.forEach(([x, y], i) => { const yy = y + (h - y) * k / 4; i ? c.lineTo(x, yy) : c.moveTo(x, yy); }); c.stroke(); }
      c.restore();
      c.shadowColor = '#FF3BD4'; c.shadowBlur = 10; c.strokeStyle = '#FF7BE6'; c.lineWidth = 1.6;
      c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.shadowBlur = 0;
    });
  });
  const swChrome = () => sprite('sw-chrome' + fk(F.slab), 420, 96, (c, w, h) => {
    c.translate(w / 2, h / 2); c.transform(1, 0, -.22, 1, 0, 0);
    c.font = font(400, 52, F.slab); c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '1px';
    const s = 'HORIZONTE';
    for (let i = 7; i >= 1; i--) { c.fillStyle = i === 1 ? '#FF4FD8' : '#2A0848'; c.fillText(s, 0, i); }
    c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#0E0224'; c.strokeText(s, 0, 0);
    c.fillStyle = lin(c, 0, -21, 0, 21, [[0, '#FFFFFF'], [.2, '#BDEBFF'], [.47, '#3A67D2'], [.5, '#170B3B'], [.55, '#6A2A78'], [.74, '#FF9A5C'], [1, '#FFF1CC']]);
    c.fillText(s, 0, 0);
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.9)'; c.strokeText(s, 0, 0);
  });
  const swNeon = () => sprite('sw-neon' + fk(F.script), 300, 110, (c, w, h) => {
    c.translate(w / 2, h / 2 + 2); c.rotate(-.12);
    c.font = font(400, 50, F.script); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.shadowColor = '#FF1FCF'; c.shadowBlur = 30; c.fillStyle = '#FF63DD'; c.fillText('Noturno', 0, 0);
    c.shadowBlur = 12; c.fillText('Noturno', 0, 0);
    c.shadowBlur = 0; c.fillStyle = '#FFE4FA'; c.fillText('Noturno', 0, 0);
    c.lineWidth = 1.2; c.strokeStyle = '#FF7BE6'; c.strokeText('Noturno', 0, 0);
  });
  const swGlint = () => sprite('sw-glint', 44, 44, (c) => {
    c.translate(22, 22); c.fillStyle = rad(c, 0, 0, 0, 14, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(255,200,255,0)']]); c.fillRect(-22, -22, 44, 44);
    c.fillStyle = '#FFF'; c.beginPath(); [[0, -21], [1.6, -1.6], [21, 0], [1.6, 1.6], [0, 21], [-1.6, 1.6], [-21, 0], [-1.6, -1.6]].forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  });
  const swPalm = (g, x, y, hgt, lean, t, ph, flip) => {
    g.save(); g.translate(x, y); g.scale(flip, 1);
    const P = (u) => [lean * u * u, -hgt * u];
    g.beginPath();
    for (let i = 0; i <= 10; i++) { const u = i / 10, [px, py] = P(u), w = lerp(8, 3.5, u); i ? g.lineTo(px - w, py) : g.moveTo(px - w, py); }
    for (let i = 10; i >= 0; i--) { const u = i / 10, [px, py] = P(u), w = lerp(8, 3.5, u); g.lineTo(px + w, py); }
    g.closePath(); g.fillStyle = '#0A0214'; g.fill();
    const [cx, cy] = P(1), sway = Math.sin(t * 1.4 + ph) * .07;
    const leaves = [[-3.3, 62, 1.0], [-2.85, 76, .8], [-2.35, 70, .5], [-1.9, 52, .25], [-1.25, 54, .3], [-.75, 78, .6], [-.3, 72, .9], [.1, 56, 1.1]];
    g.strokeStyle = '#0A0214'; g.lineCap = 'round';
    const lf = new Path2D(), sp = new Path2D();
    leaves.forEach(([a, len, droop], k) => {
      const aa = a + sway * (1 + k * .12), N = 13, pts = [];
      for (let i = 0; i <= N; i++) { const u = i / N; pts.push([cx + Math.cos(aa) * len * u, cy + Math.sin(aa) * len * u + droop * len * u * u * .55]); }
      pts.forEach(([px, py], i) => i ? sp.lineTo(px, py) : sp.moveTo(px, py));
      for (let i = 1; i < N; i++) {
        const [px, py] = pts[i], [qx, qy] = pts[i + 1], ta = Math.atan2(qy - py, qx - px), u = i / N, L = 5 + 13 * Math.sin(Math.PI * Math.min(1, u * 1.05));
        [-1, 1].forEach((sd) => { const la = ta + sd * .75; lf.moveTo(px, py); lf.lineTo(px + Math.cos(la) * L, py + Math.sin(la) * L + L * .45); });
      }
    });
    g.lineWidth = 3; g.stroke(sp); g.lineWidth = 2.4; g.stroke(lf);
    g.strokeStyle = 'rgba(255,90,220,.35)'; g.lineWidth = .8; g.stroke(sp);
    g.restore();
  };
  const swSky = () => sprite('sw-sky', 480, 158, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#07021A'], [.42, '#240948'], [.8, '#7C1566'], [1, '#FF5470']]); c.fillRect(0, 0, w, h);
    c.fillStyle = rad(c, 240, 134, 30, 220, [[0, 'rgba(255,110,150,.6)'], [.4, 'rgba(255,50,150,.2)'], [1, 'rgba(255,40,140,0)']]); c.fillRect(0, 0, w, h);
  });
  const swFloor = () => sprite('sw-floor', 480, 270, (c, w, h) => {
    const HZ = 158; c.drawImage(swMtn(), 0, HZ - 72, 480, 72);
    c.fillStyle = lin(c, 0, HZ, 0, h, [[0, '#2B0846'], [.3, '#140330'], [1, '#06010F']]); c.fillRect(0, HZ, w, h - HZ);
    c.save(); c.translate(240, HZ); c.scale(1.4, .55); c.fillStyle = rad(c, 0, 0, 0, 110, [[0, 'rgba(255,120,170,.55)'], [1, 'rgba(255,60,160,0)']]); c.fillRect(-110, 0, 220, 220); c.restore();
  });
  R['synthwave'] = (g, t, W, H) => {
    const D = 8, T = t % D, HZ = 158, SX = 240, SY = 134, SR = 72;
    // 1) céu do poente (sprite) + estrelas piscando
    g.drawImage(swSky(), 0, 0, 480, 158);
    const sr = rng(907); g.fillStyle = '#FFE6FF';
    for (let i = 0; i < 54; i++) { const x = sr() * W, y = sr() * 96, s = sr(), ph = sr() * TAU; g.globalAlpha = (.3 + .7 * (.5 + .5 * Math.sin(T / D * TAU * (2 + (i % 3)) + ph))) * (1 - y / 120); const z = s > .86 ? 2 : 1; g.fillRect(x, y, z, z); }
    g.globalAlpha = 1;
    // 2) sol com faixas que descem
    const ph = (T / D * 3) % 1;
    g.save(); g.beginPath(); g.arc(SX, SY, SR, 0, TAU); g.clip();
    g.beginPath(); let y0 = SY - SR - 1;
    for (let k = -1; k < 8; k++) { const u = (k + ph) / 7; if (u < 0 || u > 1.05) continue; const y = SY - SR * .12 + u * SR * 1.1, th = 1.2 + u * 7.5; g.rect(SX - SR - 1, y0, SR * 2 + 2, Math.max(0, y - y0)); y0 = y + th; }
    g.rect(SX - SR - 1, y0, SR * 2 + 2, SY + SR + 1 - y0); g.clip();
    g.fillStyle = lin(g, 0, SY - SR, 0, SY + SR * .5, [[0, '#FFF47E'], [.45, '#FFA43C'], [1, '#FF2D86']]); g.fillRect(SX - SR, SY - SR, SR * 2, SR * 2);
    g.restore();
    // 3) montanhas de arame + chão (sprite)
    g.drawImage(swFloor(), 0, 0, 480, 270);
    // 4) grade em perspectiva correndo
    const FL = H - HZ, gp = (T / D * 12) % 1;
    const vg = lin(g, 0, HZ, 0, H, [[0, 'rgba(255,70,210,0)'], [.25, 'rgba(255,70,210,.6)'], [1, 'rgba(255,110,230,1)']]);
    for (let pass = 0; pass < 2; pass++) {
      g.lineWidth = pass ? 1.3 : 4.5; g.strokeStyle = pass ? vg : 'rgba(255,50,200,.16)';
      g.beginPath(); for (let i = -18; i <= 18; i++) { g.moveTo(SX + i * 1.2, HZ); g.lineTo(SX + i * 58, H + 4); } g.stroke();
      for (let n = 1; n < 26; n++) {
        const d = (n + 1 - gp) * .55, y = HZ + FL / d; if (y > H + 3) continue; const a = clamp((y - HZ) / 34);
        g.strokeStyle = pass ? `rgba(255,${90 + a * 60 | 0},225,${a})` : `rgba(255,50,200,${.18 * a})`;
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
    }
    g.fillStyle = lin(g, 0, 0, W, 0, [[0, 'rgba(255,170,240,0)'], [.5, 'rgba(255,215,250,1)'], [1, 'rgba(255,170,240,0)']]); g.fillRect(0, HZ - 1, W, 2);
    g.fillStyle = 'rgba(255,120,220,.25)'; g.fillRect(0, HZ - 4, W, 8);
    // 5) palmeiras em primeiro plano
    swPalm(g, 26, 292, 205, 34, t, 0, 1); swPalm(g, 458, 296, 178, 30, t, 1.7, -1);
    // 6) títulos: cromado voa do horizonte, script neon acende, sobretítulo datilografado; fim: colapso de tubo
    const ent = seg(T, .5, 1.35), o1 = seg(T, 7.25, 7.7), o2 = seg(T, 7.7, 7.95);
    if (T >= .5 && o2 < 1) {
      g.save();
      if (o1 > 0) { const sy = Math.max(.012, 1 - eio(o1)), sx = Math.max(.01, 1 + .1 * o1 - o2); g.translate(240, 104); g.scale(sx, sy); g.translate(-240, -104); }
      const ch = swChrome(), sc = .06 + .94 * spr(ent), cy = lerp(HZ - 6, 98, ease(ent));
      g.save(); g.translate(240, cy); g.scale(sc, sc); g.drawImage(ch, -210, -48, 420, 96);
      const sw = seg(T, 1.35, 1.95);
      if (sw > 0 && sw < 1) {
        const oc = off('sw-shine', ch.width, ch.height), o = oc.getContext('2d');
        o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, oc.width, oc.height); o.drawImage(ch, 0, 0); o.globalCompositeOperation = 'source-atop';
        const bx = lerp(-120, oc.width + 120, sw); o.fillStyle = lin(o, bx - 70, 0, bx + 10, 190, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); o.fillRect(0, 0, oc.width, oc.height);
        g.drawImage(oc, -210, -48, 420, 96);
      }
      g.restore();
      // neon: tubo apagado, pisca e acende
      let on = 0;
      if (T >= 1.7 && T < 2.4) on = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1][Math.floor((T - 1.7) / .07)] ?? 1; else if (T >= 2.4) on = .93 + .07 * Math.sin(T * 47);
      if (T > 1.35) { g.globalAlpha = Math.max(.14, on); g.drawImage(swNeon(), 330 - 150, 142 - 55, 300, 110); g.globalAlpha = 1; }
      // sobretítulo datilografado
      const tw = seg(T, 2.5, 3.1);
      if (tw > 0) {
        const s = 'FITA 01  ·  LADO A'; g.font = font(500, 14, F.mono); if ('letterSpacing' in g) g.letterSpacing = '3px'; const w = g.measureText(s).width; if ('letterSpacing' in g) g.letterSpacing = '0px';
        const n = Math.floor(tw * s.length + .001); g.save(); g.beginPath(); g.rect(240 - w / 2, 30, w * n / s.length, 24); g.clip();
        type(g, s, 240 - w / 2, 43, { f: font(500, 14, F.mono), fill: '#7CF3FF', align: 'left', track: 3 }); g.restore();
        if (tw < 1 || Math.floor(T * 3) % 2) { g.fillStyle = '#7CF3FF'; g.fillRect(240 - w / 2 + w * n / s.length + 2, 36, 7, 14); }
      }
      // reflexos de estrela no cromado
      [[3.8, 70, 78], [5.5, 404, 112]].forEach(([a, x, y]) => { const k = bell(T, a, a + .55); if (k > 0) { g.save(); g.translate(x, y); g.rotate(T * 1.5); g.scale(k, k); g.drawImage(swGlint(), -22, -22, 44, 44); g.restore(); } });
      g.restore();
      if (o1 > 0) { const w = 400 * (1 - o2), a = 1 - o2 * .6; g.fillStyle = `rgba(255,120,230,${.35 * a})`; g.fillRect(240 - w / 2, 98, w, 12); g.fillStyle = `rgba(255,240,255,${a})`; g.fillRect(240 - w / 2, 103, w, 2); }
    }
    g.drawImage(scanSprite(3, .2), 0, 0, W, H);
    vig(g, W, H, .5);
  };

  // =====================================================================================
  // PIXEL ART — tela 96×54 ampliada 5×, paleta fechada, sprites de 3–4 quadros, câmera em passos inteiros
  // =====================================================================================
  const PW = 96, PH = 54;
  const PAL = { o: '#1A1030', w: '#FFF6E8', r: '#E8383D', R: '#A0203A', s: '#FFC9A0', S: '#E0906A', b: '#3A6FE0', B: '#23409A', n: '#6B3A1E', h: '#6B3A1E',
    y: '#FFD84A', Y: '#FFF3A8', c: '#C98A00', k: '#5E3A00', v: '#A45BDB', V: '#5E2A8A', t: '#C07A40', T: '#8A4A26', d: '#5E2E1A', l: '#CFE8F8', q: '#3A1E0A' };
  const pxs = (key, rows) => cached('g5:px:' + key, rows[0].length, rows.length, (c) => { rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const col = PAL[row[x]]; if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); } } }); });
  const HT = ['....ooooo...', '...orrrrro..', '..orrrrwrro.', '..oRRRRRRRRo', '..ohsssosso.', '..ohssssssso', '..ooSssssoo.', '...ooSSSo...'];
  const HERO = {
    a: [...HT, '..orrbbbrrso', '.osrbbybbbo.', '..oobbbbbo..', '..obbo.obbo.', '.obo....obo.', 'onno....onno', 'oooo....oooo'],
    b: [...HT, '..orrbbbrro.', '..osbbybbso.', '..oobbbbboo.', '...obbbbo...', '...obo.obo..', '...onnonnno.', '...oooooooo.'],
    c: [...HT, '..orrbbbrro.', '.orrbbybbrso', '..oobbbbboo.', '..obbo.obbo.', '..obo..obo..', '.onno.onno..', '.oooo.oooo..'],
    j: [...HT, '..orrbbbrrso', '.osrbbybbbo.', '..oobbbbbo..', '..obbbbbbo..', '.onnoo.onno.', '.ooooo.oooo.', '............'],
    s: [...HT, '..orrbbbrro.', '..osbbybbso.', '..oobbbbboo.', '...obbbbo...', '...obo.obo..', '..onno.onno.', '..oooo.oooo.'],
  };
  const BUG = {
    a: ['...oooo...', '..ovvwvo..', '.ovvvvvwo.', '.oovvvvoo.', 'ovwwvvwwvo', 'ovwovvowvo', 'oVVVVVVVVo', '.oVVVVVVo.', '..oo..oo..'],
    b: ['...oooo...', '..ovvwvo..', '.ovvvvvwo.', '.oovvvvoo.', 'ovwwvvwwvo', 'ovwovvowvo', 'oVVVVVVVVo', '.oVVVVVVo.', '.oo....oo.'],
    f: ['..oooooo..', '.ovwovowvo', 'oVVVVVVVVo', 'oooooooooo'],
  };
  const COIN = [
    ['.kkkk.', 'kyYYck', 'kYyyck', 'kYyyck', 'kYyyck', 'kYyyck', 'kyyyck', '.kkkk.'],
    ['.kk.', 'kYck', 'kYck', 'kYck', 'kYck', 'kYck', 'kYck', '.kk.'],
    ['kk', 'kc', 'kc', 'kc', 'kc', 'kc', 'kc', 'kk'],
  ];
  const BLK = {
    q: ['qqqqqqqqqq', 'qYYYYYYYyq', 'qYyyooyycq', 'qYyoyyoycq', 'qYyyyyoycq', 'qYyyyoyycq', 'qYyyyyyycq', 'qYyyyoyycq', 'qycccccccq', 'qqqqqqqqqq'],
    u: ['qqqqqqqqqq', 'qtttttttTq', 'qtdttttdTq', 'qtttttttTq', 'qtttttttTq', 'qtttttttTq', 'qtttttttTq', 'qtdttttdTq', 'qTTTTTTTTq', 'qqqqqqqqqq'],
  };
  const CLOUD = ['......wwww......', '...wwwwwwwww....', '..wwwwwwwwwwww..', '.wwwwwwwwwwwwww.', 'wwwwwwwwwwwwwwww', '.llllllllllllll.'];
  const pxSky = () => cached('g5:px:sky', PW, PH, (c) => {
    const bands = [[0, '#2B5FB8'], [11, '#3F8FE0'], [22, '#6CC3F2'], [33, '#A9E4F7']];
    for (let y = 0; y < PH; y++) {
      let bi = 0; bands.forEach((b, i) => { if (y >= b[0]) bi = i; }); c.fillStyle = bands[bi][1]; c.fillRect(0, y, PW, 1);
      const nx = bands[bi + 1]; if (nx && y >= nx[0] - 2) { c.fillStyle = nx[1]; for (let x = (y % 2); x < PW; x += 2) c.fillRect(x, y, 1, 1); }
    }
  });
  const pxMtn = () => cached('g5:px:mtn', 128, 22, (c) => {
    const hf = (x) => Math.round(9 + 5 * Math.sin(x / 128 * TAU * 2 + .5) + 4 * Math.sin(x / 128 * TAU * 5 + 1.3) + 2 * Math.sin(x / 128 * TAU * 9));
    for (let x = 0; x < 128; x++) { const hg = hf(x), lit = hf((x + 1) % 128) > hg || hf((x + 127) % 128) < hg, top = 22 - hg;
      for (let y = top; y < 22; y++) { c.fillStyle = y === top ? (hg > 15 ? '#F2FAFF' : '#A9C6F0') : (hg > 16 && y < top + 2) ? '#DDEBFA' : lit ? '#7C9FD6' : '#5A7FC0'; c.fillRect(x, y, 1, 1); } }
  });
  const pxHill = () => cached('g5:px:hill', 96, 16, (c) => {
    for (let x = 0; x < 96; x++) { const hg = Math.round(5 + 8 * Math.abs(Math.sin(x / 96 * Math.PI * 3))), top = 16 - hg;
      for (let y = top; y < 16; y++) { let col = '#2E9E5B'; if (y === top) col = '#8BE07A'; else if (y === top + 1) col = '#4FC36E'; else if ((x + y) % 2 === 0 && y > top + 5) col = '#1F7A45'; c.fillStyle = col; c.fillRect(x, y, 1, 1); } }
  });
  const pxGround = () => cached('g5:px:gnd', 16, 8, (c) => {
    for (let x = 0; x < 16; x++) for (let y = 0; y < 8; y++) {
      let col;
      if (y === 0) col = (x % 4 === 1) ? '#B8F08A' : '#7CE05A';
      else if (y === 1) col = (x % 5 === 2) ? '#7CE05A' : '#3FAA3A';
      else { const row = y < 5 ? 0 : 1, bx = (x + row * 4) % 8; col = (y === 4 || y === 7) ? '#8A4A26' : bx === 0 ? '#8A4A26' : (bx === 1 && (y === 2 || y === 5)) ? '#E0A060' : '#C07A40'; }
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
    }
  });
  const GL = { A: '010101111101101', B: '110101110101110', D: '110101101101110', E: '111100110100111', F: '111100110100100', I: '111010010010111', M: '101111111101101', N: '110101101101101',
    O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', V: '101101101101010',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
    x: '000101010101000', '-': '000000111000000', '+': '000010111010000' };
  const ptxt = (c, s, x, y, col, sc = 1, sh = '#1A1030') => {
    [[sh, sc], [col, 0]].forEach(([cc, o]) => { if (!cc) return; c.fillStyle = cc; [...s].forEach((ch, i) => { const gl = GL[ch]; if (!gl) return; for (let k = 0; k < 15; k++) if (gl[k] === '1') c.fillRect(x + i * 4 * sc + (k % 3) * sc + o, y + Math.floor(k / 3) * sc + o, sc, sc); }); });
  };
  R['pixel-art'] = (g, t, W, H) => {
    const D = 8, T = t % D;
    const cv = off('px-lo', PW, PH), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const camX = Math.floor(14 * Math.max(0, T - 1));
    // fundo: céu em faixas pontilhadas, nuvens, montanhas e morros em parallax (sempre em pixel inteiro)
    c.drawImage(pxSky(), 0, 0);
    const cl = pxs('cloud', CLOUD);
    [[6, 7], [52, 12], [98, 5]].forEach(([x0, y]) => { const x = ((Math.floor(x0 - camX * .15 - T * 1.2) % 144) + 144) % 144 - 24; c.drawImage(cl, x, y); });
    const m = pxMtn(), mo = -(Math.floor(camX * .3) % 128); c.drawImage(m, mo, 24); c.drawImage(m, mo + 128, 24);
    const hl = pxHill(), ho = -(Math.floor(camX * .6) % 96); c.drawImage(hl, ho, 32); c.drawImage(hl, ho + 96, 32);
    const gd = pxGround(), go = -(camX % 16); for (let x = go; x < PW; x += 16) c.drawImage(gd, x, 46);
    // bloco "?" e moeda
    const bxs = 43 - camX, hit = T >= 2.6, bump = T >= 2.6 && T < 2.78 ? (T < 2.69 ? 2 : 1) : 0;
    c.drawImage(pxs(hit ? 'blku' : 'blkq', hit ? BLK.u : BLK.q), bxs, 15 - bump);
    if (T >= 2.6 && T < 3.05) { const p = seg(T, 2.6, 3.05), fr = COIN[[0, 1, 2, 1][Math.floor(T * 16) % 4]]; const cy = 15 - Math.round(11 * Math.sin(p * Math.PI * .85)); c.drawImage(pxs('coin' + fr[0].length, fr), bxs + 5 - (fr[0].length >> 1), cy - 8); }
    const pop = (tt, x, s) => { if (T >= tt && T < tt + .6) { const yy = Math.round(12 - seg(T, tt, tt + .6) * 5); ptxt(c, s, x, yy, '#FFF6E8'); } };
    const spark = (tt, x, y) => { if (T >= tt && T < tt + .22) { const k = Math.floor((T - tt) / .11); c.fillStyle = k ? '#FFD84A' : '#FFF6E8'; c.fillRect(x, y - 2 - k, 1, 5 + 2 * k); c.fillRect(x - 2 - k, y, 5 + 2 * k, 1); } };
    spark(3.05, bxs + 5, 8); pop(3.05, bxs - 2, '+100');
    // moedas soltas
    const coins = [[85, 5.4], [93, 6.0], [101, 6.6]];
    coins.forEach(([wx, tc]) => { if (T < tc) { const fr = COIN[[0, 1, 2, 1][Math.floor(T * 8 + wx) % 4]]; c.drawImage(pxs('coin' + fr[0].length, fr), wx - camX + 3 - (fr[0].length >> 1), 35); } else spark(tc, wx - camX + 3, 39); });
    // inimigo (besouro) — pisão em 4,4 s
    const ST = 4.4, exw = 87 - 5 * (Math.min(T, ST) - .75 > 0 ? Math.min(T, ST) - .75 : 0), exs = Math.floor(exw) - camX;
    if (T < ST) { const f = Math.floor(T * 5) % 2; c.drawImage(pxs('bug' + f, f ? BUG.b : BUG.a), exs, 37); }
    else if (T < 4.95) c.drawImage(pxs('bugf', BUG.f), exs, 42);
    pop(ST + .05, exs - 2, '+200');
    // herói: corre (4 quadros), pula, sombra de contato no chão
    let lift = 0;
    if (T > 2.25 && T < 2.95) { const p = (T - 2.25) / .7; lift = 6.4 * 4 * p * (1 - p); }
    else if (T > 3.95 && T < 4.4) { const p = (T - 3.95) / .45; lift = lerp(0, 7.5, p) + 8 * 4 * p * (1 - p); }
    else if (T >= 4.4 && T < 4.95) { const p = (T - 4.4) / .55; lift = lerp(7.5, 0, p) + 9 * 4 * p * (1 - p); }
    const air = lift > .5, hk = T < 1 ? 's' : air ? 'j' : 'abcb'[Math.floor(T * 10) % 4];
    c.fillStyle = '#2E8A36'; const shw = air ? 6 : 10; c.fillRect(26 - (shw >> 1), 46, shw, 1);
    c.drawImage(pxs('hero' + hk, HERO[hk]), 20, 46 - 15 - Math.round(lift));
    // HUD
    const got = coins.filter(([, tc]) => T >= tc).length, score = (T >= 3.05 ? 100 : 0) + (T >= ST ? 200 : 0) + 50 * got, nco = (T >= 3.05 ? 1 : 0) + got;
    // íris e cartão de fase
    const ir = T < 1.2 ? 80 * ease(seg(T, .75, 1.2)) : 80 * Math.pow(1 - seg(T, 7.15, 7.72), 1.6);
    if (ir < 80) { c.fillStyle = '#000'; for (let y = 0; y < PH; y++) { const dy = y + .5 - 38, d2 = ir * ir - dy * dy; if (d2 <= 0) { c.fillRect(0, y, PW, 1); continue; } const dx = Math.sqrt(d2), x0 = Math.round(26 - dx), x1 = Math.round(26 + dx); c.fillRect(0, y, Math.max(0, x0), 1); c.fillRect(x1, y, PW - x1, 1); } }
    if (T < .75 || T >= 7.72) { c.fillStyle = '#000'; c.fillRect(0, 0, PW, PH); ptxt(c, 'FASE 1-1', 17, 16, '#FFF6E8', 2, null); c.drawImage(pxs('heros', HERO.s), 34, 32); ptxt(c, 'x3', 50, 38, '#FFF6E8', 1, null); }
    ptxt(c, 'PONTOS', 43, 1, '#CFE8F8'); ptxt(c, String(T < .75 ? 0 : score).padStart(6, '0'), 69, 1, '#FFF6E8');
    c.drawImage(pxs('coin4', COIN[1]), 2, 0); ptxt(c, 'x' + String(nco).padStart(2, '0'), 8, 1, '#FFF6E8');
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, PW, PH, 0, 0, W, H); g.restore();
  };

  // =====================================================================================
  // VHS / VÍDEO ANALÓGICO — fita de aniversário: tela azul, PLAY, tracking, velas apagando, REW
  // =====================================================================================
  const vhsRoom = (c, sT, t) => {
    const lit = 1 - seg(sT, 4.3, 4.55), z = 1 + .3 * eio(seg(sT, .8, 3.6));
    const hx = noise(t * .8, 1) * 5, hy = noise(t * .9, 4) * 4, hr = noise(t * .6, 9) * .012;
    c.save(); c.translate(240, 160); c.rotate(hr); c.scale(z, z); c.translate(-240 + hx, -160 + hy);
    // parede iluminada pelas velas
    c.fillStyle = rad(c, 240, 150, 10, 340, [[0, '#F2AE66'], [.35, '#A85E34'], [.75, '#4A2618'], [1, '#1E0F0A']]); c.fillRect(-80, -80, 640, 440);
    c.fillStyle = 'rgba(255,215,170,.06)'; for (let x = -80; x < 560; x += 26) c.fillRect(x, -80, 11, 440);
    // janela noturna com cortina
    c.fillStyle = lin(c, 0, 34, 0, 128, [[0, '#0B1633'], [1, '#27477A']]); c.fillRect(30, 34, 88, 94);
    c.fillStyle = '#C79B70'; c.fillRect(24, 28, 100, 6); c.fillRect(24, 128, 100, 6); c.fillRect(24, 28, 6, 106); c.fillRect(118, 28, 6, 106); c.fillRect(71, 34, 5, 94); c.fillRect(30, 78, 88, 5);
    c.fillStyle = 'rgba(255,190,110,.5)'; c.beginPath(); c.arc(96, 104, 4, 0, TAU); c.fill();
    c.fillStyle = '#7A1E22'; c.beginPath(); c.moveTo(4, 20); c.quadraticCurveTo(40, 80, 18, 150); c.lineTo(-10, 150); c.lineTo(-10, 20); c.fill();
    // varal de bandeirinhas PARABÉNS
    const gy = (x) => 26 + 30 * (1 - Math.pow((x - 240) / 250, 2));
    c.strokeStyle = '#2A1A10'; c.lineWidth = 1.5; c.beginPath(); for (let x = -10; x <= 490; x += 10) x === -10 ? c.moveTo(x, gy(x)) : c.lineTo(x, gy(x)); c.stroke();
    const cols = ['#E8413C', '#F2C33A', '#2FA8A0', '#E86FA0'];
    [...'PARABÉNS'].forEach((ch, i) => {
      const x = 78 + i * 46, y = gy(x), sw = Math.sin(t * 1.6 + i) * .06;
      c.save(); c.translate(x, y); c.rotate(sw); c.fillStyle = cols[i % 4]; c.beginPath(); c.moveTo(-21, 0); c.lineTo(21, 0); c.lineTo(0, 48); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(5, 0); c.lineTo(21, 0); c.lineTo(0, 48); c.closePath(); c.fill();
      txt(c, ch, 0, 16, font(400, 22, F.slab), '#FFF4E6'); c.restore();
    });
    // balões flutuando
    [[392, 78, '#E23B3B', 0], [440, 104, '#2AA8B0', 1.3], [356, 112, '#F4C13A', 2.1], [150, 86, '#2AA8B0', .7]].forEach(([x, y, col, ph]) => {
      const by = y + Math.sin(t * 1.3 + ph) * 4, bx = x + Math.sin(t * .9 + ph) * 3;
      c.strokeStyle = 'rgba(255,240,220,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by + 28); c.quadraticCurveTo(bx + 8, by + 70, bx - 4, by + 130); c.stroke();
      c.fillStyle = rad(c, bx - 8, by - 10, 2, 32, [[0, '#FFFFFF'], [.18, col], [1, '#3A1010']]); c.beginPath(); c.ellipse(bx, by, 22, 27, 0, 0, TAU); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(bx - 4, by + 29); c.lineTo(bx + 4, by + 29); c.lineTo(bx, by + 25); c.fill();
    });
    // mesa com toalha
    c.fillStyle = rad(c, 240, 214, 20, 300, [[0, '#F4E6CF'], [.5, '#B8967A'], [1, '#4A3326']]); c.fillRect(-80, 204, 640, 200);
    c.fillStyle = 'rgba(60,30,20,.25)'; c.fillRect(-80, 204, 640, 3);
    // prato + bolo
    contact(c, 240, 218, 110, 20, .5);
    c.fillStyle = '#E9E2D8'; c.beginPath(); c.ellipse(240, 212, 94, 18, 0, 0, TAU); c.fill(); c.fillStyle = '#C9BFB2'; c.beginPath(); c.ellipse(240, 214, 80, 12, 0, 0, TAU); c.fill();
    c.fillStyle = lin(c, 170, 0, 310, 0, [[0, '#9C3F5C'], [.45, '#F7A7BE'], [.6, '#F3A0B7'], [1, '#8E3653']]);
    c.beginPath(); c.moveTo(170, 150); c.lineTo(170, 204); c.ellipse(240, 204, 70, 13, 0, Math.PI, 0, true); c.lineTo(310, 150); c.closePath(); c.fill();
    c.fillStyle = rad(c, 240, 146, 10, 90, [[0, '#FFF0F4'], [1, '#F2B4C6']]); c.beginPath(); c.ellipse(240, 150, 70, 15, 0, 0, TAU); c.fill();
    c.fillStyle = '#FFF4F7'; c.beginPath(); c.moveTo(170, 150);
    for (let i = 0; i <= 14; i++) { const a = Math.PI - i / 14 * Math.PI, x = 240 + Math.cos(a) * 70, y = 150 + Math.sin(a) * 15, dr = (i % 2 ? 9 : 16) + (i % 3) * 3; c.lineTo(x, y + dr); }
    c.lineTo(310, 150); c.ellipse(240, 150, 70, 15, 0, 0, Math.PI, true); c.fill();
    c.fillStyle = '#E8413C'; for (let i = 0; i < 9; i++) { const a = Math.PI * .1 + i / 8 * Math.PI * .8; c.beginPath(); c.arc(240 + Math.cos(a) * 58, 150 + Math.sin(a) * 11, 3.2, 0, TAU); c.fill(); }
    // velas
    const cand = [[212, 148], [240, 143], [268, 148]];
    cand.forEach(([x, y]) => { c.fillStyle = '#F4F0FF'; c.fillRect(x - 3.5, y - 28, 7, 28); c.fillStyle = '#4C7BE0'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 3.5, y - 24 + k * 7); c.lineTo(x + 3.5, y - 28 + k * 7); c.lineTo(x + 3.5, y - 25 + k * 7); c.lineTo(x - 3.5, y - 21 + k * 7); c.fill(); } c.fillStyle = '#222'; c.fillRect(x - .6, y - 32, 1.2, 4); });
    if (lit > 0) {
      const lean = seg(sT, 4.0, 4.3);
      cand.forEach(([x, y], i) => {
        const f = 1 + noise(t * 9 + i * 3, i) * .18, sk = -lean * .9 + noise(t * 6, i * 2) * .08;
        c.save(); c.translate(x, y - 32); c.transform(1, 0, sk, 1, 0, 0); c.scale(f * (1 - lean * .4), f * lit);
        c.fillStyle = '#FF9A2E'; c.beginPath(); c.moveTo(0, -17); c.quadraticCurveTo(6, -5, 0, 1); c.quadraticCurveTo(-6, -5, 0, -17); c.fill();
        c.fillStyle = '#FFF4C8'; c.beginPath(); c.moveTo(0, -11); c.quadraticCurveTo(3, -3, 0, 0); c.quadraticCurveTo(-3, -3, 0, -11); c.fill(); c.restore();
      });
    }
    c.restore();
    // luz das velas (aditiva) e sala escurecendo quando apagam
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rad(c, 240, 112, 0, 170, [[0, `rgba(255,170,80,${.4 * lit * (1 + noise(t * 7) * .15)})`], [1, 'rgba(255,120,40,0)']]); c.fillRect(0, 0, 480, 270);
    c.globalCompositeOperation = 'source-over';
    if (lit < 1) { c.fillStyle = `rgba(8,4,18,${(1 - lit) * .45})`; c.fillRect(0, 0, 480, 270); }
    // fumaça das velas apagadas
    if (sT > 4.3) {
      const k = sT - 4.3; c.lineCap = 'round';
      cand.forEach(([x, y], i) => { c.strokeStyle = `rgba(220,215,230,${clamp(.55 - k * .3)})`; c.lineWidth = 2.5; c.beginPath(); for (let j = 0; j <= 12; j++) { const u = j / 12, yy = y - 32 - u * (20 + k * 60), xx = x + Math.sin(u * 5 + t * 2 + i) * (3 + u * 10) - u * k * 10; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); });
    }
  };
  R['vhs-analogico'] = (g, t, W, H, seed) => {
    const D = 8, T = t % D, P0 = .45, RW = 6.4, fr = Math.floor(t * 30);
    const mode = T < .25 ? 'blue' : T < P0 ? 'snow' : T < RW ? 'play' : 'rew';
    const sT = mode === 'rew' ? lerp(RW - P0, 0, (T - RW) / (D - RW)) : Math.max(0, T - P0);
    const rr = rng(fr * 13 + seed);
    if (mode === 'blue') { bg(g, W, H, '#1C33C4'); }
    else if (mode === 'snow') {
      const tile = noiseTile(5); g.save(); g.globalAlpha = 1; const ox = -Math.floor(rr() * 256), oy = -Math.floor(rr() * 256); for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) g.drawImage(tile, x, y); g.restore();
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, (T * 900) % H, W, 40);
    } else {
      // cena em baixa resolução (suave como fita) → canais R e ciano deslocados (aberração cromática) → composição 480×270
      const Sc = off('vhs-s', 240, 135), s = Sc.getContext('2d'); s.setTransform(.5, 0, 0, .5, 0, 0); vhsRoom(s, sT, t);
      const Rc = off('vhs-r', 240, 135), r = Rc.getContext('2d'), Cc = off('vhs-c', 240, 135), cc = Cc.getContext('2d');
      [[r, '#F00'], [cc, '#0FF']].forEach(([x, col]) => { x.globalCompositeOperation = 'source-over'; x.drawImage(Sc, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, 240, 135); x.globalCompositeOperation = 'source-over'; });
      const Mc = off('vhs-m', 480, 270), m = Mc.getContext('2d'), Kc = off('vhs-k', 480, 270), k = Kc.getContext('2d');
      const jx = (rr() - .5) * 1.4 + (mode === 'rew' ? (rr() - .5) * 5 : 0), jy = mode === 'rew' ? Math.sin(T * 40) * 2 : 0;
      m.globalCompositeOperation = 'source-over'; m.drawImage(Cc, jx - 2, jy, 484, 270);
      m.globalCompositeOperation = 'lighter'; m.drawImage(Rc, jx + 2, jy, 484, 270); m.globalAlpha = .25; m.drawImage(Rc, jx + 6, jy, 484, 270); m.globalAlpha = 1;
      m.globalCompositeOperation = 'screen'; m.fillStyle = 'rgb(34,26,48)'; m.fillRect(0, 0, 480, 270); m.globalCompositeOperation = 'source-over';
      k.globalCompositeOperation = 'copy'; k.drawImage(Mc, 0, 0); k.globalCompositeOperation = 'source-over';
      // faixas de tracking: tiras do instantâneo redesenhadas com deslocamento + riscos brancos
      const band = (y0, h, amp, key) => { const br = rng(fr * 7 + key); for (let y = Math.max(0, Math.floor(y0)); y < Math.min(270, y0 + h); y += 2) { const kk = Math.sin((y - y0) / h * Math.PI); m.drawImage(Kc, 0, y, 480, 2, (br() - .3) * amp * kk, y, 480, 2); } m.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < h * .8; i++) m.fillRect(br() * 480, y0 + br() * h, 4 + br() * 30, 1); };
      if (mode === 'play') {
        if (T < 1.35) band(lerp(270, -60, seg(T, P0, 1.35)), 56, 30, 1);
        band(206 + noise(t * .7, 2) * 24, 9, 6, 2);
        if (T > 3.2 && T < 3.45) band(118, 14, 18, 3);
      } else for (let q = 0; q < 3; q++) band(((T - RW) * 420 + q * 110) % 330 - 30, 22, 42, 4 + q);
      // ruído de troca de cabeça no rodapé
      const hr = rng(fr * 3 + 9); for (let y = 262; y < 270; y += 2) m.drawImage(Kc, 0, y, 480, 2, 6 + hr() * 12, y, 480, 2);
      m.fillStyle = 'rgba(10,10,20,.35)'; m.fillRect(0, 262, 480, 8);
      g.drawImage(Mc, 0, 0, W, H);
      grain(g, W, H, t, .14, 4);
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 18; i++) g.fillRect(rr() * W, rr() * H, 2 + rr() * 14, 1);
    }
    // OSD do videocassete
    const osd = (s, x, y, px, align = 'left') => { g.font = font(400, px, F.term); g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(s, x + 2, y + 2); g.fillStyle = 'rgba(255,70,70,.55)'; g.fillText(s, x + 1.5, y); g.fillStyle = 'rgba(70,255,255,.55)'; g.fillText(s, x - 1.5, y); g.fillStyle = '#F4F4EE'; g.fillText(s, x, y); return g.measureText(s).width; };
    const tri = (x, y, s, dir) => { g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.moveTo(x + 2, y - s + 2); g.lineTo(x + 2 + dir * s * 1.1, y + 2); g.lineTo(x + 2, y + s + 2); g.fill(); g.fillStyle = '#F4F4EE'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + dir * s * 1.1, y); g.lineTo(x, y + s); g.fill(); };
    if (mode === 'rew') { if (Math.floor(T * 3) % 2 === 0) { tri(44, 30, 9, -1); tri(60, 30, 9, -1); } osd('REW', 70, 40, 34); }
    else { const w = osd('PLAY', 28, 40, 34); if (mode !== 'play' || Math.floor(T * 1.5) % 2 === 0 || T > 1.4) tri(28 + w + 10, 30, 9, 1); }
    const secs = Math.floor(17 + sT); osd('SP', 350, 38, 22); osd(`0:00:${String(secs).padStart(2, '0')}`, 454, 40, 30, 'right');
    if (mode === 'play' || mode === 'rew') { const mm = String(42 + Math.floor((7 + sT) / 60)).padStart(2, '0'), ss = String(Math.floor(7 + sT) % 60).padStart(2, '0'); osd(`19:${mm}:${ss}`, 454, 222, 26, 'right'); osd('12 OUT 1994', 454, 248, 26, 'right'); }
    g.drawImage(scanSprite(2, .16), 0, 0, W, H);
    vig(g, W, H, .62);
  };

  // =====================================================================================
  // RUBBER HOSE (Fleischer anos 30) — gato de borracha dançando no compasso, vitrola, íris, grão de filme
  // =====================================================================================
  const RH = { ink: '#16120E', dk: '#4A443B', md: '#8E8574', lt: '#CFC5AE', pp: '#EDE4CF' };
  const rhBack = () => sprite('rh-back', 488, 278, (c, w, h) => {
    const GY = 230;
    c.fillStyle = lin(c, 0, 0, 0, GY, [[0, '#BDB298'], [.7, '#E2D8C0'], [1, '#EAE1CB']]); c.fillRect(0, 0, w, GY);
    const r = rng(41);
    const cloud = (x, y, s) => { c.beginPath(); [[0, 0, 16], [18, -8, 20], [38, 0, 15], [20, 6, 16]].forEach(([dx, dy, rr]) => { c.moveTo(x + (dx + rr) * s, y + dy * s); c.arc(x + dx * s, y + dy * s, rr * s, 0, TAU); }); c.fill(); };
    c.fillStyle = '#E4DAC2'; cloud(96, 52, 1.2); cloud(340, 40, 1); cloud(420, 70, .7); c.fillStyle = '#EFE7D4'; cloud(100, 46, 1.05); cloud(344, 35, .88); cloud(423, 66, .6);
    c.fillStyle = '#B7AB90'; c.beginPath(); c.moveTo(0, 196); c.bezierCurveTo(90, 150, 170, 170, 250, 186); c.bezierCurveTo(330, 160, 420, 150, 488, 180); c.lineTo(488, GY); c.lineTo(0, GY); c.fill();
    c.fillStyle = '#A2967C'; c.beginPath(); c.moveTo(0, 214); c.bezierCurveTo(120, 190, 220, 200, 300, 214); c.bezierCurveTo(380, 200, 440, 198, 488, 208); c.lineTo(488, GY); c.lineTo(0, GY); c.fill();
    // aguada: manchas de pincel
    for (let i = 0; i < 140; i++) { c.fillStyle = `rgba(${r() > .5 ? '60,50,35' : '255,250,235'},${.03 + r() * .04})`; c.beginPath(); c.ellipse(r() * w, r() * GY, 6 + r() * 26, 3 + r() * 10, r() * 3, 0, TAU); c.fill(); }
    c.fillStyle = lin(c, 0, GY, 0, h, [[0, '#B9AD92'], [1, '#8A7E67']]); c.fillRect(0, GY, w, h - GY);
    c.strokeStyle = RH.ink; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, GY); c.lineTo(w, GY); c.stroke();
    c.strokeStyle = 'rgba(40,30,20,.35)'; c.lineWidth = 1.2; for (let i = 0; i < 22; i++) { const x = r() * w, y = GY + 8 + r() * 36; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10 + r() * 14, y); c.stroke(); }
  });
  const rhGlove = (g, x, y, a, s) => {
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, 1);
    g.fillStyle = RH.pp; g.strokeStyle = RH.ink; g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 12, 8, 5, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.moveTo(-9, -6); g.arc(-7, -9, 4.5, 0, TAU); g.moveTo(-1, -11); g.arc(-1, -12, 4.5, 0, TAU); g.moveTo(9, -10); g.arc(6, -10, 4.5, 0, TAU); g.moveTo(15, 0); g.arc(11, 1, 4, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.stroke();
    g.beginPath(); g.arc(-7, -9, 4.5, Math.PI * .9, Math.PI * 2.2); g.arc(-1, -12, 4.5, Math.PI * 1.05, Math.PI * 2.1); g.arc(6, -10, 4.5, Math.PI * 1.1, Math.PI * 2.3); g.stroke();
    g.beginPath(); g.arc(11, 1, 4, -1.4, 1.6); g.stroke();
    g.lineWidth = 1.4; g.beginPath(); for (let k = -1; k <= 1; k++) { g.moveTo(k * 4, -4); g.lineTo(k * 4, 3); } g.stroke();
    g.restore();
  };
  const rhNote = (g, x, y, a, s, dbl) => {
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = RH.ink; g.strokeStyle = RH.ink; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(0, 0, 6, 4.5, -.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(5, -1); g.lineTo(5, -24); g.stroke();
    if (dbl) { g.beginPath(); g.ellipse(16, 4, 6, 4.5, -.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(21, 3); g.lineTo(21, -20); g.stroke(); g.lineWidth = 4.5; g.beginPath(); g.moveTo(5, -23); g.lineTo(21, -19); g.stroke(); }
    else { g.beginPath(); g.moveTo(5, -24); g.quadraticCurveTo(14, -18, 12, -8); g.stroke(); }
    g.restore();
  };
  R['rubber-hose'] = (g, t, W, H, seed) => {
    const D = 6, T = t % D, GY = 226, fr = Math.floor(t * 24), rr = rng(fr * 31 + 7);
    const beat = T / .5, bp = beat % 1, imp = Math.exp(-bp * 9), hop = Math.sin(Math.PI * bp);
    const jp = seg(T, 3, 4), jump = jp > 0 && jp < 1 ? 30 * 4 * jp * (1 - jp) : 0, inJ = jp > 0 && jp < 1;
    g.save(); g.translate((rr() - .5) * 1.4, (rr() - .5) * 1.4);
    g.drawImage(rhBack(), -4, -4, 488, 278);
    // árvore que dança no mesmo compasso
    const sway = Math.sin(Math.PI * beat) * 16;
    g.strokeStyle = RH.ink; g.lineWidth = 3; g.fillStyle = RH.dk;
    g.beginPath(); g.moveTo(58, GY); g.bezierCurveTo(62, GY - 50, 70 + sway * .3, GY - 80, 72 + sway, GY - 116); g.lineTo(88 + sway, GY - 114); g.bezierCurveTo(84 + sway * .3, GY - 80, 80, GY - 50, 84, GY); g.closePath(); g.fill(); g.stroke();
    const cs = 1 + imp * .08;
    g.save(); g.translate(80 + sway, GY - 140); g.scale(1 / cs, cs);
    g.fillStyle = RH.md; g.beginPath(); [[-30, 6, 26], [0, -14, 32], [30, 4, 26], [0, 18, 26]].forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }); g.fill();
    g.lineWidth = 3; g.beginPath(); g.arc(-30, 6, 26, 1.4, 4.4); g.arc(0, -14, 32, 3.4, 6.2); g.arc(30, 4, 26, -1.2, 1.9); g.arc(0, 18, 26, .3, 2.8); g.stroke();
    g.fillStyle = 'rgba(255,250,235,.35)'; g.beginPath(); g.ellipse(-8, -24, 14, 8, -.4, 0, TAU); g.fill();
    g.restore();
    // vitrola: corneta pulsa na batida, notas saem dela
    const hs = 1 + imp * .1;
    contact(g, 400, GY + 2, 44, 6, .35);
    g.fillStyle = RH.dk; g.strokeStyle = RH.ink; g.lineWidth = 2.5; g.fillRect(370, GY - 40, 60, 40); g.strokeRect(370, GY - 40, 60, 40);
    g.fillStyle = RH.md; g.fillRect(374, GY - 36, 52, 6); g.fillStyle = RH.ink; g.beginPath(); g.ellipse(400, GY - 44, 26, 5, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(404, GY - 44); g.quadraticCurveTo(410, GY - 70, 396, GY - 84); g.lineWidth = 5; g.stroke();
    g.save(); g.translate(396, GY - 84); g.rotate(-.6); g.scale(hs, hs);
    g.fillStyle = RH.lt; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.lineTo(26, -50); g.lineTo(-26, -50); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = RH.ink; g.beginPath(); g.ellipse(0, -50, 27, 9, 0, 0, TAU); g.fill(); g.fillStyle = RH.dk; g.beginPath(); g.ellipse(0, -50, 20, 5, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,250,235,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-14, -38); g.lineTo(-4, -8); g.stroke();
    g.restore();
    for (let k = 2; k < 11; k++) { const t0 = k * .5, a = T - t0; if (a < 0 || a > 1.5) continue; const sc = spr(a * 2.2) * (1 - seg(a, 1.2, 1.5)); rhNote(g, 358 - a * 34 + Math.sin(a * 6 + k) * 8, GY - 138 - a * 60, Math.sin(a * 5 + k) * .3, sc, k % 2); }
    // gato de borracha
    const lean = .13 * Math.sin(Math.PI * beat), lift = hop * 14 + jump, cx = 240;
    const hipX = cx + lean * 40, hipY = GY - 50 - lift, sy = 1 - .15 * imp + .06 * hop + (inJ ? .12 * Math.sin(Math.PI * jp) : 0), sx = 1 / sy;
    const kickL = (Math.floor(beat) % 2 === 0) ? -18 * hop : 0, kickR = (Math.floor(beat) % 2 === 1) ? 18 * hop : 0;
    const fy = inJ ? GY - jump * .92 : GY;
    const feet = [[cx - 26 + kickL, fy - (kickL ? 12 * hop : 0) - (inJ ? 14 : 0)], [cx + 26 + kickR, fy - (kickR ? 12 * hop : 0) - (inJ ? 14 : 0)]];
    contact(g, hipX, GY + 3, 50 * (1 - clamp(lift / 90) * .5), 7, .45 * (1 - clamp(lift / 90) * .5));
    // pernas de mangueira
    g.strokeStyle = RH.ink; g.lineCap = 'round'; g.lineWidth = 8;
    feet.forEach(([fx, fyy], i) => { const s = i ? 1 : -1, hx = hipX + s * 11, hy = hipY + 2; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + fx) / 2 + s * 20, (hy + fyy) / 2 - 4, fx, fyy - 6); g.stroke(); });
    feet.forEach(([fx, fyy], i) => { const s = i ? 1 : -1; g.fillStyle = RH.ink; g.beginPath(); g.ellipse(fx + s * 8, fyy - 5, 17, 9, s * .12, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,250,235,.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(fx + s * 10, fyy - 8, 9, 3.5, s * .12, Math.PI * 1.1, Math.PI * 1.8); g.stroke(); });
    g.save(); g.translate(hipX, hipY); g.rotate(lean); g.scale(sx, sy);
    // rabo
    g.strokeStyle = RH.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(-18, -10); g.bezierCurveTo(-50, -4, -44, -40, -64 + Math.sin(Math.PI * beat) * 10, -50); g.stroke();
    // tronco + calção com botões
    g.fillStyle = RH.ink; g.beginPath(); g.ellipse(0, -28, 25, 34, 0, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.ellipse(0, -28, 25, 34, 0, 0, TAU); g.clip(); g.fillStyle = RH.md; g.fillRect(-30, -16, 60, 30); g.fillStyle = RH.ink; g.fillRect(-2, -2, 4, 14); g.restore();
    g.fillStyle = RH.pp; [[-10, -10], [10, -10]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 4, 5, 0, 0, TAU); g.fill(); });
    // braços de mangueira + luvas
    const a = Math.sin(Math.PI * beat);
    const hands = inJ ? [[-50, -100], [50, -100]] : [[-54 + 6 * a, -36 - 42 * a], [54 + 6 * a, -36 + 42 * a]];
    g.strokeStyle = RH.ink; g.lineWidth = 7;
    hands.forEach(([hx, hy], i) => { const s = i ? 1 : -1, shx = s * 19, shy = -46; g.beginPath(); g.moveTo(shx, shy); g.quadraticCurveTo((shx + hx) / 2 + s * 16, (shy + hy) / 2 + 12, hx, hy + 8); g.stroke(); });
    hands.forEach(([hx, hy], i) => rhGlove(g, hx, hy, (i ? .3 : -.3) + (inJ ? 0 : a * (i ? -.3 : .3)), i ? 1 : -1));
    // cabeça: orelhas, máscara, olhos de torta, focinho, sorriso, bigodes
    const hr2 = .12 * Math.sin(Math.PI * (beat - .25));
    g.save(); g.translate(0, -90); g.rotate(hr2);
    g.fillStyle = RH.ink; g.beginPath(); g.moveTo(-28, -8); g.lineTo(-22, -46); g.lineTo(-4, -26); g.closePath(); g.moveTo(28, -8); g.lineTo(22, -46); g.lineTo(4, -26); g.closePath(); g.fill();
    g.beginPath(); g.arc(0, -2, 31, 0, TAU); g.fill();
    g.fillStyle = RH.pp; g.beginPath(); g.ellipse(0, 8, 24, 17, 0, 0, TAU); g.moveTo(1, -8); g.ellipse(-9, -8, 10, 13, 0, 0, TAU); g.moveTo(19, -8); g.ellipse(9, -8, 10, 13, 0, 0, TAU); g.fill();
    const look = Math.sin(Math.PI * beat * .5) * 2;
    [[-8, -8], [8, -8]].forEach(([x, y]) => { g.fillStyle = RH.ink; g.beginPath(); g.ellipse(x + look, y + 1, 5, 9, 0, 0, TAU); g.fill(); g.fillStyle = RH.pp; g.beginPath(); g.moveTo(x + look, y + 1); g.arc(x + look, y + 1, 6, -1.45, -.55); g.closePath(); g.fill(); });
    g.fillStyle = RH.ink; g.beginPath(); g.ellipse(0, 6, 7, 5, 0, 0, TAU); g.fill(); g.fillStyle = RH.pp; g.beginPath(); g.arc(-2, 4.5, 1.6, 0, TAU); g.fill();
    g.fillStyle = RH.ink; g.beginPath(); g.moveTo(-16, 11); g.quadraticCurveTo(0, 38 + imp * 3, 16, 11); g.quadraticCurveTo(0, 20, -16, 11); g.fill();
    g.fillStyle = RH.md; g.beginPath(); g.ellipse(0, 24 + imp, 6, 3.5, 0, 0, TAU); g.fill();
    g.strokeStyle = RH.ink; g.lineWidth = 1.6; [-1, 1].forEach((s) => { for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(s * 14, 9 + k * 3); g.lineTo(s * 40, 5 + k * 7); g.stroke(); } });
    g.restore(); g.restore();
    // película: tremor de luz, riscos, poeira, grão, vinheta, íris
    g.fillStyle = `rgba(255,244,220,${rr() * .07})`; g.fillRect(-4, -4, W + 8, H + 8); g.fillStyle = `rgba(20,14,8,${rr() * .06})`; g.fillRect(-4, -4, W + 8, H + 8);
    if (rr() > .35) { g.strokeStyle = 'rgba(255,250,235,.35)'; g.lineWidth = .8; const x = rr() * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rr() - .5) * 6, H); g.stroke(); }
    g.fillStyle = 'rgba(20,14,8,.6)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(rr() * W, rr() * H, .6 + rr() * 1.6, 0, TAU); g.fill(); }
    if (rr() > .6) { g.strokeStyle = 'rgba(20,14,8,.45)'; g.lineWidth = .8; const x = rr() * W, y = rr() * H; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 8, y - 6, x + 4, y + 10, x + 14, y + 8); g.stroke(); }
    g.restore();
    grain(g, W, H, t, .12, 3); vig(g, W, H, .8);
    const iOpen = ease(seg(T, 0, .55)), iClose = eio(seg(T, 5.25, 6));
    const ir = 22 + (320 - 22) * (T < 1 ? iOpen : 1 - iClose);
    if (ir < 318) { const ix = hipX, iy = hipY - 90 * sy; g.fillStyle = '#0D0A07'; g.beginPath(); g.rect(-10, -10, W + 20, H + 20); g.arc(ix, iy, ir, 0, TAU, true); g.fill('evenodd'); }
  };

  // =====================================================================================
  // MID-CENTURY / SAUL BASS — painéis de papel recortado, silhueta angulosa em animação limitada (8 qps)
  // =====================================================================================
  const MC = { cr: '#EFE2C4', mu: '#DDA137', or: '#D0582B', te: '#2E7E78', bk: '#1C1815', rd: '#A8322A' };
  const MC_POSE = [
    { bob: 0, lf: [[-14, -26], [-30, -4]], lb: [[10, -24], [26, -12]], af: [[-18, -70], [-30, -80]], ab: [[14, -66], [22, -52]], tail: 4 },
    { bob: -5, lf: [[-6, -24], [-8, 0]], lb: [[4, -22], [16, -8]], af: [[-12, -64], [-16, -54]], ab: [[8, -64], [10, -52]], tail: 10 },
    { bob: 0, lf: [[10, -24], [26, -12]], lb: [[-14, -26], [-30, -4]], af: [[14, -66], [22, -52]], ab: [[-18, -70], [-30, -80]], tail: 4 },
    { bob: -5, lf: [[4, -22], [16, -8]], lb: [[-6, -24], [-8, 0]], af: [[8, -64], [10, -52]], ab: [[-12, -64], [-16, -54]], tail: 10 },
  ];
  const mcMan = (g, x, y, pose, col, det) => {
    const P = MC_POSE[pose]; g.save(); g.translate(x, y + P.bob); g.fillStyle = col; g.strokeStyle = col; g.lineJoin = 'miter'; g.lineCap = 'butt';
    g.lineWidth = 7.5; [P.lf, P.lb].forEach(([k, f]) => { g.beginPath(); g.moveTo(0, -46); g.lineTo(k[0], k[1]); g.lineTo(f[0], f[1]); g.stroke(); poly(g, [[f[0] + 3, f[1] - 3], [f[0] - 9, f[1] + 1], [f[0] + 3, f[1] + 4]]); g.fill(); });
    poly(g, [[-16, -86], [6, -88], [9, -48], [-7, -45]]); g.fill();
    if (det) { poly(g, [[-8, -60], [10, -60], [18 + P.tail, -30], [0, -34]]); g.fill(); } // sobretudo do detetive
    else { poly(g, [[6, -54], [16 + P.tail, -44], [6, -40]]); g.fill(); }
    g.lineWidth = 5.5; [[P.ab, 2], [P.af, -8]].forEach(([[e, h], sx]) => { g.beginPath(); g.moveTo(sx, -82); g.lineTo(e[0], e[1]); g.lineTo(h[0], h[1]); g.stroke(); });
    if (det) { const [hx, hy] = P.af[1]; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - 7, hy - 5); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(hx - 12, hy - 9, 6.5, 0, TAU); g.stroke(); }
    else { const [bx, by] = P.ab[1]; g.fillRect(bx - 8, by, 17, 12); g.lineWidth = 2; g.strokeRect(bx - 3, by - 4, 7, 5); }
    g.beginPath(); g.ellipse(-11, -95, 7, 8.5, -.2, 0, TAU); g.fill();
    g.fillRect(-24, -104.5, 26, 3.5); poly(g, [[-18, -103], [-16, -114], [-4, -115], [-2, -103]]); g.fill();
    g.restore();
  };
  const mcStar = (g, x, y, r, rot, col) => { g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = col; g.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, l = i % 2 ? r * .55 : r; g.lineWidth = i % 2 ? 2 : 3; g.beginPath(); g.moveTo(Math.cos(a) * r * .18, Math.sin(a) * r * .18); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke(); } g.fillStyle = col; g.beginPath(); g.arc(0, 0, r * .16, 0, TAU); g.fill(); g.restore(); };
  R['mid-century'] = (g, t, W, H) => {
    const D = 7, T = t % D, q = (x) => Math.floor(x * 8) / 8, Tq = q(T), FY = 170;
    paperS(g, MC.cr, 5);
    // painéis de papel recortado (borda irregular), sangrando para fora do quadro
    const pMu = rough('mc-mu2', [[-8, -8], [166, -8], [160, 166], [-8, 166]]), pBk = rough('mc-bk2', [[164, -8], [300, -8], [296, 166], [157, 166]]), pTe = rough('mc-te2', [[298, -8], [488, -8], [488, 166], [294, 166]]);
    const pOr = rough('mc-or2', [[-8, 164], [488, 161], [488, 183], [-8, 186]], 1.2, 9);
    g.fillStyle = MC.mu; g.fill(pMu); g.fillStyle = MC.bk; g.fill(pBk); g.fillStyle = MC.te; g.fill(pTe); g.fillStyle = MC.or; g.fill(pOr);
    // estrelas atômicas em passos (animação limitada)
    const st = Math.floor(T * 4); mcStar(g, 70, 52, 20 * (st % 3 === 0 ? 1.15 : 1), st * .39, MC.bk); mcStar(g, 116, 118, 9, st * .6, MC.cr); mcStar(g, 446, 122, 13 * (st % 3 === 1 ? 1.2 : 1), -st * .39, MC.cr);
    // carimbo no painel verde
    if (T >= 2.8 && T < 6.35) { const fresh = T < 2.925; g.save(); g.translate(400, 46); g.rotate(-.12); g.scale(fresh ? 1.3 : 1, fresh ? 1.3 : 1); g.strokeStyle = MC.cr; g.lineWidth = 2.5; g.stroke(rough('mc-stamp', [[-54, -18], [54, -18], [54, 18], [-54, 18]], 1, 6)); txt(g, 'EM CARTAZ', 0, 1, font(400, 26, F.cond), MC.cr); g.restore(); }
    // fugitivo com maleta e detetive com lupa, correndo da direita p/ esquerda; sobre o painel preto a silhueta vira creme
    const notBk = new Path2D(); notBk.rect(-10, -10, W + 20, H + 20); notBk.addPath(pBk);
    const runner = (t0, det) => {
      const mp = (Tq - t0) / 5.95; if (mp <= 0 || mp >= 1) return;
      const x = lerp(520, -60, mp), pose = (Math.floor(T * 8) + (det ? 2 : 0)) % 4;
      g.fillStyle = '#A8421F'; g.beginPath(); g.ellipse(x - 2, FY + 3, 24, 3.5, 0, 0, TAU); g.fill();
      g.save(); g.clip(notBk, 'evenodd'); mcMan(g, x, FY, pose, MC.bk, det); g.restore();
      g.save(); g.clip(pBk); mcMan(g, x, FY, pose, MC.cr, det); g.restore();
    };
    const mp0 = (Tq - .05) / 5.95;
    if (mp0 > 0 && mp0 < 1) { const x = lerp(520, -60, mp0); g.save(); g.setLineDash([3, 6]); g.strokeStyle = MC.bk; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 30, 176); g.lineTo(Math.min(W + 10, x + 460), 176); g.stroke(); g.restore(); }
    runner(.05, false); runner(.95, true);
    // créditos: cortes secos no tempo do jazz
    type(g, 'UMA COMÉDIA DE ERROS', 24, 206, { f: font(700, 14, F.body), fill: MC.bk, align: 'left', track: 3 });
    const words = [['O', 1.3], ['HOMEM', 1.55], ['DE', 1.8], ['MIL', 2.05], ['NOMES', 2.3]];
    const F40 = font(400, 44, F.cond); g.font = F40; let x = 22;
    words.forEach(([wd, a], wi) => {
      const endT = 6.85 - (4 - wi) * .1; g.font = F40; const w = g.measureText(wd).width;
      if (T >= a && T < endT) { const fresh = T < a + .125; let cx = x; [...wd].forEach((ch, ci) => { const j = hash(wi * 10 + ci, 3); g.font = F40; const cw = g.measureText(ch).width; g.save(); g.translate(cx, 252 + (j - .5) * 3 - (fresh ? 4 : 0)); g.rotate((j - .5) * .06); if (fresh) g.scale(1.12, 1.12); txt(g, ch, 0, 0, F40, wi === 2 ? MC.rd : MC.bk, 'left', 'alphabetic'); g.restore(); cx += cw; }); }
      x += w + 11;
    });
    g.fillStyle = MC.bk; if (T >= 2.55 && T < 6.45) g.fillRect(24, 262, Math.min(1, (Tq - 2.55) * 4) * 150, 3);
    // textura de impressão por cima
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .5; paperS(g, '#F6EEDD', 9); g.restore();
    grain(g, W, H, t, .07, 2);
  };

  // =====================================================================================
  // BAUHAUS — círculo rola, quadrado cai girando 90°, triângulo desliza; "bauhaus" montado com primitivas
  // =====================================================================================
  const BH = { cr: '#EEE7D6', rd: '#D63A2F', bl: '#1D4F9E', ye: '#F1BE2B', bk: '#151515' };
  const bhLetters = (() => { // cada letra: lista de peças {k:'bar'|'arc', ...}; x-height 32, traço 8, base y=0
    const X = 32, sw = 8, r = 12;
    return [
      ['b', 32, [{ k: 'bar', x: 0, y0: -52, y1: 0 }, { k: 'arc', cx: 16, cy: -16, r, a0: -Math.PI / 2, a1: Math.PI * 1.5 }]],
      ['a', 32, [{ k: 'arc', cx: 16, cy: -16, r, a0: Math.PI / 2, a1: Math.PI * 2.5 }, { k: 'bar', x: 24, y0: -X, y1: 0 }]],
      ['u', 32, [{ k: 'bar', x: 0, y0: -X, y1: -16 }, { k: 'arc', cx: 16, cy: -16, r, a0: Math.PI, a1: 0, ccw: true }, { k: 'bar', x: 24, y0: -X, y1: 0 }]],
      ['h', 32, [{ k: 'bar', x: 0, y0: -52, y1: 0 }, { k: 'arc', cx: 16, cy: -16, r, a0: Math.PI, a1: Math.PI * 2 }, { k: 'bar', x: 24, y0: -16, y1: 0 }]],
      ['a', 32, [{ k: 'arc', cx: 16, cy: -16, r, a0: Math.PI / 2, a1: Math.PI * 2.5 }, { k: 'bar', x: 24, y0: -X, y1: 0 }]],
      ['u', 32, [{ k: 'bar', x: 0, y0: -X, y1: -16 }, { k: 'arc', cx: 16, cy: -16, r, a0: Math.PI, a1: 0, ccw: true }, { k: 'bar', x: 24, y0: -X, y1: 0 }]],
      ['s', 22, [{ k: 'arc', cx: 11, cy: -24, r: 7, a0: -Math.PI * .15, a1: Math.PI / 2, ccw: true }, { k: 'arc', cx: 11, cy: -8, r: 7, a0: -Math.PI / 2, a1: Math.PI * 1.1 }]],
    ].map(([ch, w, parts]) => ({ ch, w, parts, sw }));
  })();
  const bhWord = (g, x0, base, T, a, gap, col) => {
    let x = x0;
    bhLetters.forEach((L, li) => {
      L.parts.forEach((p, pi) => {
        const k0 = a + li * gap + pi * .07; let k = spr(seg(T, k0, k0 + .5));
        const ko = seg(T, 6.05 + (6 - li) * .06, 6.35 + (6 - li) * .06); k = k * (1 - eio(ko));
        if (k <= 0.001) return;
        g.fillStyle = col; g.strokeStyle = col; g.lineWidth = L.sw; g.lineCap = 'butt';
        if (p.k === 'bar') { const h = (p.y1 - p.y0) * clamp(k, 0, 1.2); g.fillRect(x + p.x, base + p.y1 - h, 8, h); }
        else { const span = (p.ccw ? -1 : 1) * ((p.ccw ? p.a0 - p.a1 : p.a1 - p.a0) * clamp(k)); g.beginPath(); g.arc(x + p.cx, base + p.cy, p.r, p.a0, p.a0 + span, !!p.ccw); g.stroke(); }
      });
      x += L.w + 7;
    });
  };
  R['bauhaus'] = (g, t, W, H) => {
    const D = 7, T = t % D, BAR = 176;
    paperS(g, BH.cr, 11);
    g.drawImage(sprite('bh-grid', 480, 270, (c) => { c.strokeStyle = 'rgba(20,20,20,.07)'; c.lineWidth = 1; c.beginPath(); for (let x = 40; x < 480; x += 40) { c.moveTo(x, 0); c.lineTo(x, 270); } for (let y = 45; y < 270; y += 45) { c.moveTo(0, y); c.lineTo(480, y); } c.stroke(); }), 0, 0, W, H);
    // estrutura fixa: barra, mastro e texto vertical
    g.fillStyle = BH.bk; g.fillRect(28, BAR, 424, 10); g.fillRect(410, 20, 8, BAR - 20);
    g.save(); g.translate(432, 20); g.rotate(Math.PI / 2); type(g, 'forma · cor · função', 0, 0, { f: font(600, 14, F.grot), fill: BH.bk, align: 'left', base: 'middle', track: 0 }); g.restore();
    // círculo azul rola sobre a barra (a fatia creme mostra a rotação)
    const R0 = 64, cin = seg(T, 0, .95), cout = seg(T, 6.3, 6.95);
    const cx = lerp(34, 122, spr(cin)) + Math.sin(seg(T, 3.6, 5.9) * TAU) * 22 - 88 * eio(cout);
    const cy = BAR - R0, rot = (cx - 122) / R0;
    g.save(); g.translate(cx, cy); g.rotate(rot); g.fillStyle = BH.bl; g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.fill();
    g.fillStyle = BH.cr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0, -Math.PI / 2, 0); g.closePath(); g.fill();
    g.fillStyle = BH.bk; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.restore();
    // quadrado vermelho cai girando exatamente 90° e assenta; depois gira de novo na batida
    const S = 78, SX = 246, sq = seg(T, .75, 1.3), sqo = seg(T, 6.1, 6.55);
    const sy = lerp(-120, BAR - S / 2, sq * sq) - eio(sqo) * 320 - (sq >= 1 ? Math.max(0, Math.sin(seg(T, 1.3, 1.6) * Math.PI)) * 8 : 0);
    const srot = -Math.PI / 2 * (1 - sq) + Math.PI / 2 * (spr(seg(T, 4.0, 4.6)) + spr(seg(T, 5.0, 5.6))) + eio(sqo) * Math.PI / 2;
    g.save(); g.translate(SX, sy); g.rotate(srot); g.fillStyle = BH.rd; g.fillRect(-S / 2, -S / 2, S, S);
    g.fillStyle = BH.bk; g.beginPath(); g.moveTo(-S / 2, -S / 2); g.arc(-S / 2, -S / 2, S * .42, 0, Math.PI / 2); g.closePath(); g.fill(); g.restore();
    // triângulo amarelo invertido cai e se equilibra na ponta (balança como pião)
    const ti = seg(T, 1.45, 1.9), to = eio(seg(T, 5.95, 6.4)), TX = 346;
    if (ti > 0 && to < 1) {
      const ty = lerp(-110, BAR, ti * ti) - to * 0, wob = ti < 1 ? 0 : Math.sin((T - 1.9) * 5.2) * .09 * Math.exp(-(T - 1.9) * .35) + Math.sin(T * 2.1) * .025;
      g.save(); g.translate(TX, ty - to * 330); g.rotate(wob + to * .9); g.fillStyle = BH.ye; g.beginPath(); g.moveTo(0, 0); g.lineTo(-52, -92); g.lineTo(52, -92); g.closePath(); g.fill();
      g.fillStyle = BH.bk; g.fillRect(-52, -92, 104, 4); g.restore();
    }
    // palavra "bauhaus" construída com barras e arcos (alfabeto universal de Bayer)
    bhWord(g, 34, 250, T, 2.0, .15, BH.bk);
    // bloco de texto
    g.fillStyle = BH.rd; g.fillRect(320, 206, 118, 4); type(g, 'exposição', 320, 228, { f: font(800, 17, F.grot), fill: BH.bk, align: 'left' }); type(g, 'weimar · 1923', 320, 248, { f: font(400, 14, F.grot), fill: BH.bk, align: 'left', track: 1 });
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .35; paperS(g, '#F4EFE4', 12); g.restore();
  };

  // =====================================================================================
  // Y2K / FRUTIGER AERO — céu, colina tipo Bliss, orbe de gel, janela de vidro, bolhas, lens flare
  // =====================================================================================
  const y2kBack = () => sprite('y2k-bg', 480, 270, (c, w, h) => {
    c.fillStyle = lin(c, 0, 0, 0, 200, [[0, '#0B5FC2'], [.5, '#3DA3EE'], [1, '#C4ECFF']]); c.fillRect(0, 0, w, h);
    c.fillStyle = rad(c, 64, 34, 0, 190, [[0, 'rgba(255,255,255,.95)'], [.12, 'rgba(255,255,245,.75)'], [.4, 'rgba(210,245,255,.22)'], [1, 'rgba(210,245,255,0)']]); c.fillRect(0, 0, w, h);
    const cloud = (x, y, s) => { [[0, 0, 22], [24, -10, 28], [52, 0, 22], [26, 8, 22], [-18, 8, 14], [70, 8, 14]].forEach(([dx, dy, r]) => { c.fillStyle = rad(c, x + dx * s, y + dy * s - r * s * .4, 0, r * s * 1.3, [[0, 'rgba(255,255,255,.98)'], [.7, 'rgba(240,250,255,.9)'], [1, 'rgba(200,230,250,0)']]); c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); }); };
    cloud(250, 50, .9); cloud(380, 96, .7); cloud(120, 110, .55);
    c.fillStyle = lin(c, 0, 150, 0, 220, [[0, '#6FC7A0'], [1, '#2E8F6A']]); c.beginPath(); c.moveTo(0, 176); c.quadraticCurveTo(140, 150, 300, 172); c.quadraticCurveTo(420, 186, 480, 170); c.lineTo(480, 270); c.lineTo(0, 270); c.fill();
    c.fillStyle = lin(c, 0, 168, 0, 270, [[0, '#A6EC5E'], [.3, '#58C23A'], [1, '#1D7A26']]); c.beginPath(); c.moveTo(0, 214); c.quadraticCurveTo(170, 158, 330, 188); c.quadraticCurveTo(420, 204, 480, 236); c.lineTo(480, 270); c.lineTo(0, 270); c.fill();
    c.strokeStyle = 'rgba(235,255,200,.7)'; c.lineWidth = 3; c.filter = 'blur(2px)'; c.beginPath(); c.moveTo(20, 208); c.quadraticCurveTo(170, 160, 330, 190); c.stroke(); c.filter = 'none';
    const r = rng(8); for (let i = 0; i < 500; i++) { const x = r() * w, y = 190 + r() * 80; c.fillStyle = r() > .5 ? 'rgba(20,90,30,.18)' : 'rgba(210,255,160,.18)'; c.fillRect(x, y, 1, 2 + r() * 2); }
  });
  const y2kBlur = () => sprite('y2k-blur', 480, 270, (c, w, h) => { c.filter = 'blur(7px)'; c.drawImage(y2kBack(), 0, 0, w, h); c.filter = 'none'; });
  const y2kBubble = () => sprite('y2k-bub', 64, 64, (c) => {
    c.translate(32, 32); const R0 = 30;
    c.fillStyle = rad(c, 0, 0, 0, R0, [[0, 'rgba(255,255,255,.05)'], [.72, 'rgba(255,255,255,.08)'], [.88, 'rgba(160,240,255,.35)'], [.95, 'rgba(255,190,245,.5)'], [1, 'rgba(255,255,255,.85)']]); c.beginPath(); c.arc(0, 0, R0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(-11, -13, 9, 5, -.7, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(13, 14, 3, 0, TAU); c.fill();
  });
  const y2kOrb = () => sprite('y2k-orb', 140, 140, (c) => {
    c.translate(70, 66); const r = 50;
    c.shadowColor = 'rgba(0,60,120,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
    c.fillStyle = rad(c, 0, r * .3, 4, r * 1.15, [[0, '#8AF3FF'], [.5, '#1AB4EA'], [1, '#0A55A8']]); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); noShadow(c);
    c.fillStyle = rad(c, 0, r * .62, 0, r * .6, [[0, 'rgba(190,255,255,.8)'], [1, 'rgba(190,255,255,0)']]); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,50,110,.55)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r - .7, 0, TAU); c.stroke();
    c.fillStyle = lin(c, 0, -r, 0, -r * .05, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,.08)']]); c.beginPath(); c.ellipse(0, -r * .47, r * .74, r * .44, 0, 0, TAU); c.fill();
  });
  const y2kGlass = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
  R['y2k-frutiger'] = (g, t, W, H) => {
    const D = 8, T = t % D;
    g.drawImage(y2kBack(), 0, 0, W, H);
    // lens flare: fantasmas ao longo do eixo sol→centro
    const fl = .75 + .25 * Math.sin(T / D * TAU * 2);
    g.save(); g.globalCompositeOperation = 'screen';
    [[.5, 10, 'rgba(180,255,220,.35)'], [.85, 22, 'rgba(120,200,255,.22)'], [1.3, 6, 'rgba(255,255,255,.5)'], [1.75, 34, 'rgba(150,255,190,.14)']].forEach(([k, r, col]) => { const x = 64 + (240 - 64) * k + Math.sin(T * .8) * 6 * k, y = 34 + (135 - 34) * k; g.globalAlpha = fl; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    g.globalAlpha = .6 * fl; g.fillStyle = lin(g, 0, 0, 260, 0, [[0, 'rgba(255,255,255,0)'], [.25, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 33, 260, 2);
    g.restore();
    // bolhas atrás
    const bub = y2kBubble(), br = rng(55), bubs = [];
    for (let i = 0; i < 13; i++) { const x0 = br() * W, r = 6 + br() * 18, n = 1 + Math.floor(br() * 2), ph = br(); bubs.push([x0, r, n, ph, i % 3 === 0]); }
    const drawBub = (front) => bubs.forEach(([x0, r, n, ph, f]) => { if (f !== front) return; const span = H + 80, y = H + 40 - ((T / D * n + ph) % 1) * span, x = x0 + Math.sin(T * 1.3 + ph * 9) * 8; g.drawImage(bub, x - r, y - r, r * 2, r * 2); });
    drawBub(false);
    // orbe de gel flutuando, sombra de contato na colina
    const oin = spr(seg(T, .3, 1.0)), oout = eio(seg(T, 7.35, 7.9)), osc = oin * (1 - oout), fy = Math.sin(T / D * TAU * 4) * 4, ox = 150, oy = 124 + fy;
    if (osc > .01) {
      contact(g, ox, 192, 44 * osc, 7 * osc, .35 * (1 - fy / 12));
      g.save(); g.translate(ox, oy); g.scale(osc, osc); g.drawImage(y2kOrb(), -70, -66, 140, 140);
      const done = T >= 5.0;
      if (!done) { const rot = T * 5; for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; g.fillStyle = `rgba(255,255,255,${.25 + .75 * ((i / 8))})`; g.beginPath(); g.arc(Math.cos(a) * 20, Math.sin(a) * 20 + 4, 4.2, 0, TAU); g.fill(); } }
      else { const k = spr(seg(T, 5.0, 5.5)); g.save(); g.scale(k, k); g.strokeStyle = '#FFFFFF'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(0,70,140,.5)'; g.shadowBlur = 6; g.beginPath(); g.moveTo(-18, 4); g.lineTo(-5, 17); g.lineTo(20, -12); g.stroke(); noShadow(g); g.restore(); }
      g.restore();
    }
    // janela de vidro (Aero): surge com mola, depois minimiza para dentro do orbe
    const win = spr(seg(T, .95, 1.6)), wmin = eio(seg(T, 6.7, 7.4)), ws = win * (1 - wmin);
    if (ws > .02) {
      const X = 236, Y = 56, WW = 216, HH = 144, pcx = lerp(X + WW / 2, ox, wmin), pcy = lerp(Y + HH / 2, oy, wmin);
      g.save(); g.translate(pcx, pcy); g.scale(ws, ws); g.translate(-(X + WW / 2), -(Y + HH / 2));
      g.save(); shadow(g, 22, 0, 10, 'rgba(0,40,90,.35)'); g.fillStyle = 'rgba(255,255,255,.2)'; y2kGlass(g, X, Y, WW, HH, 10); g.fill(); noShadow(g); g.restore();
      g.save(); y2kGlass(g, X, Y, WW, HH, 10); g.clip();
      // vidro mostra o fundo desfocado, desfazendo a escala da janela
      g.drawImage(y2kBlur(), (0 - pcx) / ws + (X + WW / 2), (0 - pcy) / ws + (Y + HH / 2), W / ws, H / ws);
      g.fillStyle = 'rgba(235,248,255,.38)'; g.fillRect(X, Y, WW, HH);
      g.fillStyle = lin(g, 0, Y, 0, Y + 28, [[0, 'rgba(255,255,255,.75)'], [.5, 'rgba(210,240,255,.45)'], [1, 'rgba(160,215,255,.35)']]); g.fillRect(X, Y, WW, 28);
      g.fillStyle = 'rgba(255,255,255,.72)'; y2kGlass(g, X + 8, Y + 34, WW - 16, HH - 42, 6); g.fill();
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.2; y2kGlass(g, X + .5, Y + .5, WW - 1, HH - 1, 10); g.stroke();
      g.strokeStyle = 'rgba(20,80,140,.45)'; g.lineWidth = 1; y2kGlass(g, X - .5, Y - .5, WW + 1, HH + 1, 10.5); g.stroke();
      type(g, 'Assistente do Sistema', X + 12, Y + 15, { f: font(600, 14, F.body), fill: '#0B3563', align: 'left' });
      g.fillStyle = lin(g, 0, Y + 6, 0, Y + 22, [[0, '#FFB3A0'], [.5, '#E0402A'], [1, '#A8200F']]); y2kGlass(g, X + WW - 36, Y + 6, 28, 17, 4); g.fill(); g.strokeStyle = 'rgba(120,20,10,.6)'; g.stroke();
      g.strokeStyle = '#FFF'; g.lineWidth = 2; g.beginPath(); g.moveTo(X + WW - 26, Y + 10.5); g.lineTo(X + WW - 18, Y + 18.5); g.moveTo(X + WW - 18, Y + 10.5); g.lineTo(X + WW - 26, Y + 18.5); g.stroke();
      type(g, 'Bem-vindo', X + 20, Y + 62, { f: font(700, 28, F.body), fill: '#0A3D78', align: 'left' });
      const done = T >= 5.0;
      type(g, done ? 'Tudo pronto! Pode começar.' : 'Preparando tudo para você…', X + 20, Y + 90, { f: font(500, 14, F.body), fill: done ? '#1F7A26' : '#245A8C', align: 'left' });
      // barra de progresso estilo XP (blocos verdes com brilho)
      const bx = X + 20, by = Y + 106, bw = WW - 40, bh = 18, pr = eio(seg(T, 1.8, 5.0));
      g.fillStyle = '#FFFFFF'; y2kGlass(g, bx, by, bw, bh, 5); g.fill(); g.strokeStyle = 'rgba(40,90,140,.5)'; g.lineWidth = 1; g.stroke();
      g.save(); y2kGlass(g, bx + 2, by + 2, bw - 4, bh - 4, 4); g.clip();
      const nb = Math.floor((bw - 4) * pr / 9);
      for (let i = 0; i < nb; i++) { g.fillStyle = lin(g, 0, by + 2, 0, by + bh - 2, [[0, '#D8FFC0'], [.45, '#5FD13A'], [1, '#1F8F1A']]); g.fillRect(bx + 3 + i * 9, by + 3, 7, bh - 6); }
      const shx = bx + ((T * 90) % (bw + 60)) - 30; g.fillStyle = lin(g, shx - 20, 0, shx + 20, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(bx, by, Math.min(bw, 3 + nb * 9), bh);
      g.restore();
      g.restore();
    }
    drawBub(true);
  };

  // =====================================================================================
  // PSICODÉLICO — raios vibrando (laranja × azul), anéis pulsando, flor que vira estrela e ameba, letra derretida
  // =====================================================================================
  const psShape = (k, a, T) => {
    if (k === 0) return .62 + .38 * Math.pow(Math.abs(Math.cos(4 * a)), .7);
    if (k === 1) return .5 + .5 * Math.pow(Math.abs(Math.cos(2.5 * (a + Math.PI / 2))), 3);
    return .86 + .09 * Math.sin(3 * a + T * 2) + .05 * Math.sin(5 * a - T * 3);
  };
  const psTitle = () => sprite('ps-title' + fk(F.slab), 470, 90, (c, w, h) => {
    c.font = font(400, 44, F.slab); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; if ('letterSpacing' in c) c.letterSpacing = '1px';
    c.lineWidth = 13; c.strokeStyle = '#2B0A57'; c.strokeText('VERÃO DO AMOR', w / 2, h / 2 + 2);
    c.lineWidth = 6; c.strokeStyle = '#B6FF00'; c.strokeText('VERÃO DO AMOR', w / 2, h / 2 + 2);
    c.fillStyle = '#FF2D8A'; c.fillText('VERÃO DO AMOR', w / 2, h / 2 + 2);
  });
  R['psicodelico'] = (g, t, W, H) => {
    const D = 8, T = t % D, CX = 240, CY = 158;
    // raios em espiral girando (volta exata de 2 raios por loop)
    const NR = 20, rot = T / D * (TAU / NR) * 2;
    bg(g, W, H, '#2233FF'); g.fillStyle = '#FF6A00';
    for (let i = 0; i < NR; i += 2) {
      g.beginPath(); const a0 = rot + i / NR * TAU, a1 = rot + (i + 1) / NR * TAU;
      for (let k = 0; k <= 10; k++) { const r = k / 10 * 360, tw = r * .0032 + Math.sin(r * .02 - T * TAU / D * 2) * .05; g.lineTo(CX + Math.cos(a0 + tw) * r, CY + Math.sin(a0 + tw) * r); }
      for (let k = 10; k >= 0; k--) { const r = k / 10 * 360, tw = r * .0032 + Math.sin(r * .02 - T * TAU / D * 2) * .05; g.lineTo(CX + Math.cos(a1 + tw) * r, CY + Math.sin(a1 + tw) * r); }
      g.closePath(); g.fill();
    }
    // disco de anéis concêntricos ondulados, expandindo
    const DR = 104, step = 13, ph = (T / D * 4 % 1) * step;
    const ring = (R0, amp) => { g.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, r = R0 + amp * Math.sin(6 * a + T * TAU / D * 2 + R0 * .05); i ? g.lineTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r) : g.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r); } g.closePath(); };
    ring(DR + 10, 3); g.fillStyle = '#2B0A57'; g.fill();
    g.save(); ring(DR, 3); g.clip();
    for (let i = 10; i >= 0; i--) { const R0 = i * step + ph; ring(R0, 3 + R0 * .03); g.fillStyle = (i % 2) ? '#FF2A3A' : '#1FD17A'; g.fill(); }
    g.restore();
    // forma central em metamorfose com contornos em eco
    const seq = [0, 1, 2, 0], seg4 = T / D * 3, si = Math.min(2, Math.floor(seg4)), sp = eio(seg((seg4 - si), .55, 1));
    const bloom = spr(seg(T, .2, 1.1));
    const echo = [[1.32, '#2B0A57'], [1.16, '#FFE600'], [1.0, '#FF1F8E'], [.76, '#00E5FF'], [.52, '#FFE600'], [.28, '#2B0A57']];
    const crot = T / D * TAU / 4;
    echo.forEach(([s, col], ei) => {
      g.beginPath();
      for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, aa = a - crot * (ei % 2 ? 1 : -1) * .5; const r = lerp(psShape(seq[si], aa, T), psShape(seq[si + 1], aa, T), sp) * 64 * s * bloom * (1 + .04 * Math.sin(T * 4 + ei)); i ? g.lineTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r) : g.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r); }
      g.closePath(); g.fillStyle = col; g.fill();
    });
    // título derretido: fatias verticais com onda; entra subindo como líquido, sai escorrendo
    const ts = psTitle(), sw = ts.width, sh = ts.height, SL = 94, tw = 470, th = 90, x0 = CX - tw / 2, y0 = 40 - th / 2;
    for (let i = 0; i < SL; i++) {
      const u = i / SL, drip = .5 + .5 * Math.sin(u * 37 + 1.3) * Math.sin(u * 11 + .4), pin = ease(clamp((T - 1.3 - u * .45) / .6)), pout = clamp((T - 7.0 - u * .35 - (1 - drip) * .08) / .6);
      if (pin <= 0 || pout >= 1) continue;
      const amp = 3 + 22 * (1 - pin), dy = Math.sin(u * 9 + T * TAU / D * 3) * amp + (1 - pin) * 150 + pout * pout * (230 + 40 * drip);
      const hh = th * (1 + .1 * Math.sin(u * 6 - T * TAU / D * 2) + pout * pout * (.35 + .4 * drip));
      g.drawImage(ts, u * sw, 0, sw / SL + 1, sh, x0 + u * tw, y0 + dy - (hh - th) * .2, tw / SL + .6, hh);
    }
    // rótulos nos cantos
    const lb = T > 2.4 && T < 7.3;
    if (lb) { const k = ease(seg(T, 2.4, 2.8)); g.save(); g.beginPath(); g.rect(0, 236, W * k, 34); g.clip(); type(g, 'SÃO FRANCISCO', 20, 254, { f: font(700, 16, F.body), fill: '#FFF3C4', align: 'left', stroke: '#2B0A57', lw: 5, track: 2 }); type(g, '1967', 460, 254, { f: font(700, 16, F.body), fill: '#FFF3C4', align: 'right', stroke: '#2B0A57', lw: 5, track: 2 }); g.restore(); }
    grain(g, W, H, t, .06, 6);
  };

  // =====================================================================================
  // CONSTRUTIVISMO — rosto em retícula gritando, megafone vermelho com "LIVROS!", faixa a 45°, slam + tremor
  // =====================================================================================
  const CN = { pp: '#E8DCC2', rd: '#C8261E', bk: '#151313' };
  const cnPaper = () => sprite('cn-paper', 500, 290, (c, w, h) => {
    paper(c, w, h, CN.pp, 21);
    const r = rng(33); for (let i = 0; i < 9; i++) { c.fillStyle = rad(c, r() * w, r() * h, 0, 30 + r() * 70, [[0, 'rgba(140,100,50,.12)'], [1, 'rgba(140,100,50,0)']]); c.fillRect(0, 0, w, h); }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(w * .52, 0, 1.5, h); c.fillStyle = 'rgba(90,60,30,.12)'; c.fillRect(w * .52 + 1.5, 0, 1.5, h);
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(0, h * .5, w, 1.5); c.fillStyle = 'rgba(90,60,30,.1)'; c.fillRect(0, h * .5 + 1.5, w, 1.5);
  });
  const cnFace = () => sprite('cn-face2', 190, 204, (c, w, h) => {
    const head = new Path2D();
    head.moveTo(88, 14); head.bezierCurveTo(122, 8, 146, 24, 152, 48); head.bezierCurveTo(155, 58, 154, 66, 158, 74); head.lineTo(156, 82); head.lineTo(177, 106); head.lineTo(162, 112);
    head.lineTo(167, 120); head.lineTo(160, 124); head.lineTo(146, 128); head.lineTo(159, 142); head.lineTo(155, 148); head.bezierCurveTo(157, 158, 151, 166, 140, 168);
    head.bezierCurveTo(126, 170, 112, 164, 104, 156); head.lineTo(112, 204); head.lineTo(48, 204); head.bezierCurveTo(54, 176, 50, 156, 42, 138); head.bezierCurveTo(22, 104, 30, 30, 88, 14); head.closePath();
    const hair = new Path2D(); hair.moveTo(84, 9); hair.bezierCurveTo(124, 1, 153, 22, 157, 54); hair.bezierCurveTo(141, 45, 123, 47, 113, 59); hair.bezierCurveTo(101, 77, 107, 112, 105, 148); hair.lineTo(38, 152); hair.bezierCurveTo(16, 104, 26, 24, 84, 9); hair.closePath();
    const mouth = new Path2D(); mouth.moveTo(161, 124); mouth.lineTo(146, 128); mouth.lineTo(157, 141); mouth.lineTo(163, 132); mouth.closePath();
    const inP = (p, x, y) => c.isPointInPath(p, x * S2, y * S2);
    const E = (x, y, cx, cy, sx, sy) => Math.exp(-((x - cx) ** 2 / sx + (y - cy) ** 2 / sy));
    const dk = (x, y) => {
      if (!inP(head, x, y)) return -1;
      if (inP(mouth, x, y)) return 1;
      if (inP(hair, x, y)) return .92 - .45 * E(x, y, 112, 26, 260, 90);
      let d = .06 + .3 * clamp((124 - x) / 26);
      d += .7 * E(x, y, 145, 90, 50, 22) + .75 * E(x, y, 147, 79, 60, 4) + .7 * E(x, y, 163, 110, 10, 6) + .3 * E(x, y, 128, 136, 160, 90) + .35 * E(x, y, 158, 122, 12, 4) + .3 * E(x, y, 154, 146, 20, 6);
      if (y > 160) d += .6 * clamp((y - 158) / 8) * (1 - clamp((y - 176) / 40) * .4);
      return clamp(d);
    };
    c.fillStyle = CN.pp; c.fill(head); c.fillStyle = CN.bk;
    const S = 4, ca = Math.SQRT1_2;
    for (let i = -60; i < 80; i++) for (let j = -10; j < 90; j++) {
      const u = i * S, v = j * S, x = (u - v) * ca + 95, y = (u + v) * ca - 60;
      if (x < 0 || y < 0 || x > w || y > h) continue;
      const d = dk(x, y); if (d < 0) continue;
      const r = S * .66 * Math.sqrt(d); if (r < .3) continue;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  });
  R['construtivismo'] = (g, t, W, H) => {
    const D = 7, T = t % D, L0 = 1.95;
    const hits = [.45, .95, 3.1]; for (let i = 0; i < 7; i++) hits.push(L0 + i * .12);
    let shk = 0; hits.forEach((h, i) => { if (T >= h) shk += (i < 2 ? 6 : 3) * Math.exp(-(T - h) * 16); });
    const sr = rng(Math.floor(t * 30) * 5 + 3), sx = (sr() - .5) * 2 * shk, sy = (sr() - .5) * 2 * shk;
    const wipe = seg(T, 6.25, 6.95);
    const MX = 162, MY = 207, ang = -.42, spread = .2;
    const scene = (full) => {
      g.drawImage(cnPaper(), -10, -10, 500, 290);
      g.fillStyle = CN.rd; g.beginPath(); g.arc(124, 150, 100, 0, TAU); g.fill();
      g.fillStyle = CN.bk; g.fillRect(14, 16, 8, 8); type(g, 'ED. POPULAR  ·  1924', 30, 21, { f: font(400, 16, F.cond), fill: CN.bk, align: 'left', track: 2 });
      g.fillRect(14, 30, 150, 2);
      g.save(); g.translate(300, 30); g.rotate(Math.PI / 4); g.fillRect(-40, -1.5, 330, 3); g.fillRect(-40, 10, 250, 1.5); g.restore();
      if (!full) return;
      // faixa vermelha a 45° com o sobretítulo em duas linhas
      const bIn = spr(seg(T, .3, .6));
      g.save(); g.translate(410 + (1 - bIn) * 240, 222 + (1 - bIn) * 240); g.rotate(-Math.PI / 4); g.fillStyle = CN.rd; g.fillRect(-150, -26, 330, 52);
      g.fillStyle = CN.bk; g.fillRect(-150, -26, 330, 3); g.fillRect(-150, 23, 330, 3);
      g.restore();
      // megafone preto saindo da boca, com LIVROS! crescendo
      const Lm = 318 * ease(seg(T, 1.45, 1.8));
      if (Lm > 1) {
        g.fillStyle = CN.bk; g.beginPath(); g.moveTo(MX, MY); g.lineTo(MX + Math.cos(ang - spread) * Lm, MY + Math.sin(ang - spread) * Lm); g.lineTo(MX + Math.cos(ang + spread) * Lm, MY + Math.sin(ang + spread) * Lm); g.closePath(); g.fill();
        if (T > 3.6) { g.strokeStyle = CN.bk; g.lineWidth = 2.2; for (let k = 0; k < 3; k++) { const p = ((T - 3.6) * .8 + k / 3) % 1, rr2 = 330 + p * 90; g.globalAlpha = 1 - p; g.beginPath(); g.arc(MX, MY, rr2, ang - spread * .8, ang + spread * .8); g.stroke(); } g.globalAlpha = 1; }
        g.save(); g.translate(MX, MY); g.rotate(ang);
        let d = 70; const tn = Math.tan(spread);
        [...'LIVROS!'].forEach((ch, i) => {
          const size = .74 * 2 * tn * (d + 10), f = font(400, size, F.slab); g.font = f; const cw = g.measureText(ch).width, cxx = d + cw / 2; d += cw + 3;
          const a = L0 + i * .12; if (T < a) return; const k = T < a + .12 ? lerp(2.2, 1, ease((T - a) / .12)) : 1;
          g.save(); g.translate(cxx, 1); g.scale(k, k); txt(g, ch, 0, 0, f, CN.pp); g.restore();
        });
        g.restore();
      }
      if (T > 3.1) { const k = spr(seg(T, 3.1, 3.35)), ox = (1 - k) * 160; type(g, 'PARA TODOS OS', 468 + ox, 230, { f: font(400, 25, F.cond), fill: CN.bk, align: 'right', track: 2 }); type(g, 'RAMOS DO SABER', 468 + ox, 254, { f: font(400, 25, F.cond), fill: CN.bk, align: 'right', track: 2 }); }
      // rosto em retícula (fotomontagem) entra de lado, por cima da ponta do megafone
      const fIn = spr(seg(T, .8, 1.1));
      g.drawImage(cnFace(), -190 * (1 - fIn), 76, 190, 204);
    };
    g.save(); g.translate(sx, sy);
    if (wipe <= 0) scene(true);
    else {
      // cunha vermelha varre na diagonal: atrás dela, o quadro volta ao início
      const e = eio(wipe), dist = lerp(-420, 520, e), nx = Math.SQRT1_2, ny = -Math.SQRT1_2, cx0 = 240 + nx * dist, cy0 = 135 + ny * dist;
      scene(false);
      g.save(); g.beginPath(); g.moveTo(cx0 - ny * 900, cy0 + nx * 900); g.lineTo(cx0 + ny * 900, cy0 - nx * 900); g.lineTo(cx0 + ny * 900 + nx * 1400, cy0 - nx * 900 + ny * 1400); g.lineTo(cx0 - ny * 900 + nx * 1400, cy0 + nx * 900 + ny * 1400); g.closePath(); g.clip(); scene(true); g.restore();
      g.fillStyle = CN.rd; g.beginPath(); g.moveTo(cx0 - ny * 900, cy0 + nx * 900); g.lineTo(cx0 + ny * 900, cy0 - nx * 900); g.lineTo(cx0 + ny * 900 - nx * 110, cy0 - nx * 900 - ny * 110); g.lineTo(cx0 - ny * 900 - nx * 110, cy0 + nx * 900 - ny * 110); g.closePath(); g.fill();
    }
    g.restore();
    grain(g, W, H, t, .08, 9);
  };

  // =====================================================================================
  // GRAVURA / XILOGRAVURA DE CORDEL — sol nascendo em cortes de goiva, mandacarus, asa-branca, folheto novo por cima
  // =====================================================================================
  const GV = { pp: '#EEE4CC', ink: '#1A1714', rd: '#B5432A' };
  const gvCarve = (c, w, h, seed, n) => { // tinta irregular: lascas de papel sobre o preto
    const r = rng(seed); c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = GV.pp;
    for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h; c.globalAlpha = .25 + r() * .5; c.fillRect(x, y, 1 + r() * 5, .6 + r() * .8); }
    c.restore();
  };
  const gvFrame = () => sprite('gv-frame' + fk(F.slab) + fk(F.serif), 480, 270, (c, w, h) => {
    c.fillStyle = GV.ink; c.fillRect(12, 12, w - 24, 5); c.fillRect(12, h - 17, w - 24, 5); c.fillRect(12, 12, 5, h - 24); c.fillRect(w - 17, 12, 5, h - 24);
    c.fillRect(21, 21, w - 42, 1.5); c.fillRect(21, h - 22.5, w - 42, 1.5); c.fillRect(21, 21, 1.5, h - 42); c.fillRect(w - 22.5, 21, 1.5, h - 42);
    c.fillStyle = GV.ink; c.fillRect(28, 28, w - 56, 36);
    c.font = font(400, 25, F.slab); c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '4px'; c.fillStyle = GV.pp; c.fillText('O SOL DO SERTÃO', w / 2, 47);
    if ('letterSpacing' in c) c.letterSpacing = '2px'; c.fillStyle = GV.ink; c.font = font(700, 14, F.serif); c.fillText('LITERATURA DE CORDEL  ·  Nº 12  ·  JUAZEIRO', w / 2, h - 34);
    gvCarve(c, w, h, 5, 700);
    c.fillStyle = GV.ink; c.fillRect(28, 70, w - 56, 1.5); c.fillRect(28, 222, w - 56, 1.5);
  });
  const gvSky = () => sprite('gv-sky2', 480, 270, (c) => {
    paper(c, 480, 270, GV.pp, 17);
    const r = rng(12); c.fillStyle = GV.ink;
    for (let y = 76; y < 200; y += 4.2) { const k = (y - 76) / 124, th = .35 + 1.7 * k * k; let x = 30; while (x < 450) { const L = 12 + r() * 60; if (r() > .12 + (1 - k) * .45) c.fillRect(x, y, Math.min(L, 450 - x), th); x += L + 2 + r() * 6; } }
  });
  const gvHills = () => sprite('gv-hills', 480, 270, (c, w) => {
    const far = new Path2D(); far.moveTo(28, 186); far.bezierCurveTo(90, 160, 150, 166, 210, 178); far.bezierCurveTo(260, 186, 320, 150, 452, 172); far.lineTo(452, 222); far.lineTo(28, 222); far.closePath();
    c.save(); c.clip(far); c.fillStyle = GV.pp; c.fillRect(0, 0, w, 270); c.fillStyle = GV.ink; for (let y = 150; y < 222; y += 3.2) c.fillRect(0, y, w, .9 + (y - 150) / 72 * 1.4); c.restore();
    c.strokeStyle = GV.ink; c.lineWidth = 2; c.stroke(far);
    const near = new Path2D(); near.moveTo(28, 204); near.bezierCurveTo(120, 188, 200, 196, 260, 206); near.bezierCurveTo(330, 216, 400, 190, 452, 198); near.lineTo(452, 222); near.lineTo(28, 222); near.closePath();
    c.fillStyle = GV.ink; c.fill(near);
    c.save(); c.clip(near); c.strokeStyle = GV.pp; c.lineCap = 'round';
    for (let k = 1; k < 6; k++) { c.lineWidth = 1.6 - k * .15; c.beginPath(); for (let x = 30; x <= 450; x += 6) { const yb = x < 260 ? lerp(204, 206, (x - 28) / 232) - Math.sin((x - 28) / 232 * Math.PI) * 12 : 206 - Math.sin((x - 260) / 192 * Math.PI) * 14; const y = yb + k * 3.4 + Math.sin(x * .3 + k) * .6; (x === 30) ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    const r = rng(44); for (let i = 0; i < 60; i++) { const x = 30 + r() * 420, y = 210 + r() * 12; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 4); c.moveTo(x, y); c.lineTo(x + 2, y - 4); c.stroke(); }
    c.restore();
    // mandacarus
    const cactus = (x, base, hgt, arms) => {
      const col = (cx, y0, y1, wd) => { c.fillStyle = GV.ink; c.beginPath(); c.moveTo(cx - wd, y1); c.lineTo(cx - wd, y0 + wd); c.arc(cx, y0 + wd, wd, Math.PI, 0); c.lineTo(cx + wd, y1); c.closePath(); c.fill(); c.strokeStyle = GV.pp; c.lineWidth = 1; for (let k = -1; k <= 1; k += 2) { c.beginPath(); c.moveTo(cx + k * wd * .4, y0 + wd * 1.4); c.lineTo(cx + k * wd * .4, y1 - 3); c.stroke(); } };
      col(x, base - hgt, base, 9);
      arms.forEach(([dir, ay, ah, ax]) => { c.strokeStyle = GV.ink; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, ay); c.lineTo(x + dir * ax, ay); c.stroke(); col(x + dir * ax, ay - ah, ay + 4, 6.5); });
    };
    cactus(92, 214, 116, [[-1, 170, 44, 26], [1, 150, 38, 24]]); cactus(392, 210, 78, [[1, 176, 30, 20], [-1, 186, 22, 18]]);
    gvCarve(c, 480, 270, 9, 900);
  });
  const gvBird = (g, x, y, f, s) => { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = GV.ink; g.beginPath(); if (f) { g.moveTo(-16, -8); g.quadraticCurveTo(-8, -6, -2, 1); g.lineTo(0, -1); g.lineTo(2, 1); g.quadraticCurveTo(8, -6, 16, -8); g.quadraticCurveTo(8, 0, 0, 4); g.quadraticCurveTo(-8, 0, -16, -8); } else { g.moveTo(-16, 6); g.quadraticCurveTo(-8, -2, -2, 0); g.lineTo(0, -2); g.lineTo(2, 0); g.quadraticCurveTo(8, -2, 16, 6); g.quadraticCurveTo(8, 3, 0, 4); g.quadraticCurveTo(-8, 3, -16, 6); } g.fill(); g.restore(); };
  const gvSheet = (g, s, t) => {
    g.drawImage(gvSky(), 0, 0, 480, 270);
    // sol nasce atrás dos morros e os raios vão sendo "cortados" um a um
    const rise = eio(seg(s, .2, 2.0)), sx = 296, sy = lerp(214, 136, rise), rot = s * .06;
    g.save(); g.beginPath(); g.rect(28, 72, 424, 150); g.clip();
    g.fillStyle = GV.pp; g.beginPath(); g.arc(sx, sy, 86, 0, TAU); g.fill();
    const nr = 18; g.fillStyle = GV.ink;
    for (let i = 0; i < nr; i++) { const k = seg(s, .7 + i * .08, 1.0 + i * .08); if (k <= 0) continue; const a = rot + i / nr * TAU, L = (i % 2 ? 26 : 42) * ease(k); g.beginPath(); g.moveTo(sx + Math.cos(a - .1) * 44, sy + Math.sin(a - .1) * 44); g.lineTo(sx + Math.cos(a) * (44 + L), sy + Math.sin(a) * (44 + L)); g.lineTo(sx + Math.cos(a + .1) * 44, sy + Math.sin(a + .1) * 44); g.closePath(); g.fill(); }
    g.fillStyle = GV.ink; g.beginPath(); g.arc(sx, sy, 39, 0, TAU); g.fill(); g.fillStyle = GV.rd; g.beginPath(); g.arc(sx, sy, 35.5, 0, TAU); g.fill();
    g.strokeStyle = GV.pp; g.lineWidth = 1.3; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(sx, sy, 12 + k * 8, -2.6 + k * .3, -1 - k * .2); g.stroke(); }
    // asas-brancas atravessando (2 quadros de batida)
    [[2.3, 108, 1.5], [2.8, 92, 1.2], [3.3, 118, 1.05]].forEach(([a, y, sc], i) => { const p = seg(s, a, a + 4.2); if (p <= 0 || p >= 1) return; gvBird(g, lerp(470, 20, p), y + Math.sin(p * 9 + i) * 4, Math.floor(t * 4 + i) % 2, sc); });
    g.drawImage(gvHills(), 0, 0, 480, 270);
    // flor do mandacaru (única cor extra) abre no alto
    const fl = spr(seg(s, 3.0, 3.6)); if (fl > 0.01) { g.save(); g.translate(92, 100); g.scale(fl, fl); g.fillStyle = GV.rd; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.ellipse(Math.cos(a) * 6, Math.sin(a) * 6 - 2, 5, 2.6, a, 0, TAU); g.fill(); } g.fillStyle = GV.ink; g.beginPath(); g.arc(0, -2, 2.6, 0, TAU); g.fill(); g.restore(); }
    g.restore();
    g.drawImage(gvFrame(), 0, 0, 480, 270);
  };
  R['gravura'] = (g, t, W, H) => {
    const D = 8, T = t % D, tr = seg(T, 7.1, 8);
    gvSheet(g, T, t);
    if (tr > 0) {
      // um novo folheto desliza por cima (mesma gravura, no começo): o loop fecha sem quadro vazio
      const x0 = W * (1 - eio(tr));
      g.fillStyle = lin(g, x0 - 26, 0, x0, 0, [[0, 'rgba(40,25,10,0)'], [1, 'rgba(40,25,10,.4)']]); g.fillRect(x0 - 26, 0, 26, H);
      g.save(); g.beginPath(); g.rect(x0, 0, W - x0 + 1, H); g.clip(); g.translate(x0, 0); gvSheet(g, 0, t); g.restore();
    }
    grain(g, W, H, t, .05, 8);
  };
})();
