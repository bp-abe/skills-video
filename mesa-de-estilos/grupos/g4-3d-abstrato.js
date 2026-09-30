// Grupo 4 — 3D e abstrato: 3d-realista, low-poly, 3d-fofo, simulacao-satisfatoria, morphing, liquido,
// particulas-generativo, loop-geometrico, visualizador-audio.
(() => {
const seg = (x, a, b) => clamp((x - a) / (b - a));
const sst = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const md = (x, m) => ((x % m) + m) % m;
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, k) => { const A = hx(a), B = hx(b); return `rgb(${A[0] + (B[0] - A[0]) * k | 0},${A[1] + (B[1] - A[1]) * k | 0},${A[2] + (B[2] - A[2]) * k | 0})`; };
const rgba = (h, a) => { const A = hx(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
// revela uma linha de texto subindo por trás de uma máscara (k: 0→1 entra; o: 0→1 sai por cima)
function maskLine(g, s, x, y, h, k, o, opt) {
  if (k <= 0 || o >= 1) return; g.save(); g.beginPath(); g.rect(-10, y - h * .62, 520, h * 1.24); g.clip();
  type(g, s, x, y + (1 - ease(k)) * h * 1.1 - eio(o) * h * 1.2, opt); g.restore();
}
// ======================= 3D realista: caixa de som em vista explodida =======================
{
  const RY = 15, CX = 318, FY = 228, PIV = 150;
  const PARTS = [
    { h: 16, r: 56, lift: 0, lab: 'ALUMÍNIO ESCOVADO' },
    { h: 84, r: 56, lift: 14, lab: 'TECIDO ACÚSTICO' },
    { h: 12, r: 53, lift: 34, lab: 'ANEL DE LUZ' },
    { h: 12, r: 56, lift: 56, lab: 'TOPO EM VIDRO' },
  ];
  const side = (g, x, yT, yB, r) => { g.beginPath(); g.moveTo(x - r, yT); g.lineTo(x - r, yB); g.ellipse(x, yB, r, RY, 0, Math.PI, 0, true); g.lineTo(x + r, yT); g.ellipse(x, yT, r, RY, 0, 0, Math.PI, false); g.closePath(); };
  const brush = (r, h) => cached(`g4-brush${r}_${h}`, (2 * r + 2) * 2, (h + RY + 2) * 2, (c) => { c.scale(2, 2); const q = rng(5); c.lineWidth = .5;
    for (let i = 0; i < h * 3; i++) { const v = q(); c.strokeStyle = v > .5 ? `rgba(255,255,255,${(v - .5) * .3})` : `rgba(0,0,0,${(.5 - v) * .28})`; c.beginPath(); c.ellipse(r + 1, 1 + i / 3, r, RY, 0, 0, Math.PI); c.stroke(); } });
  const rings = () => cached('g4-rings', 256, 256, (c) => { const q = rng(8); c.lineWidth = 1; for (let k = 2; k < 128; k += 1.5) { const v = q(); c.strokeStyle = v > .5 ? `rgba(255,255,255,${(v - .5) * .22})` : `rgba(0,0,0,${(.5 - v) * .2})`; c.beginPath(); c.arc(128, 128, k, 0, TAU); c.stroke(); } });
  const bgC = () => cached('g4-3dr-bg', 960, 540, (c) => { c.scale(2, 2);
    c.fillStyle = rad(c, CX - 20, 112, 10, 340, [[0, '#3b3f46'], [.4, '#1b1d21'], [1, '#07080a']]); c.fillRect(0, 0, 480, 270);
    c.save(); c.translate(CX, FY + 8); c.scale(1, .2); c.fillStyle = rad(c, 0, 0, 0, 250, [[0, 'rgba(150,158,170,.3)'], [1, 'rgba(150,158,170,0)']]); c.fillRect(-250, -250, 500, 500); c.restore();
    vignette(c, 480, 270, .45); });
  const glowS = () => cached('g4-glow', 256, 128, (c) => { c.fillStyle = rad(c, 128, 128, 0, 128, [[0, 'rgba(150,215,255,.9)'], [.35, 'rgba(110,190,255,.35)'], [1, 'rgba(90,170,255,0)']]); c.save(); c.translate(0, 0); c.scale(1, .5); c.fillRect(0, 0, 256, 256); c.restore(); });

  function part(g, k, x, yB, S, lite) {
    const P = PARTS[k], r = P.r, yT = yB - P.h, hl = S.hl;
    side(g, x, yT, yB, r);
    if (k === 0) g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#2b2e33'], [.05, '#9aa1aa'], [.12, '#3a3e44'], [hl - .16, '#8e959e'], [hl - .04, '#e9edf1'], [hl, '#ffffff'], [hl + .05, '#c4cad1'], [.74, '#6d737b'], [.9, '#2e3136'], [.97, '#80868e'], [1, '#34373c']]);
    if (k === 1) g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#55595f'], [.09, '#9a9ea5'], [hl - .12, '#d6d9dd'], [hl + .04, '#ebedf0'], [.8, '#aeb2b8'], [.95, '#6c7077'], [1, '#4d5157']]);
    if (k === 2) g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#1e2429'], [.12, '#5d6974'], [hl, '#bcc8d2'], [.86, '#55606a'], [1, '#1b2025']]);
    if (k === 3) g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#030304'], [.07, '#555b63'], [.13, '#0b0c0e'], [hl - .03, '#24282c'], [hl, '#a3abb4'], [hl + .03, '#17191c'], [.9, '#08090a'], [.97, '#3c4147'], [1, '#050506']]);
    g.fill();
    if (k === 2 && S.on > 0) { g.globalAlpha = S.on; g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#2a6d93'], [.12, '#8fd6ff'], [hl, '#ffffff'], [.86, '#7cc8f2'], [1, '#27658a']]); g.fill(); g.globalAlpha = 1; }
    if (!lite) {
      if (k === 0) { g.save(); side(g, x, yT, yB, r); g.clip(); g.drawImage(brush(r, P.h), x - r - 1, yT - 1, 2 * r + 2, P.h + RY + 2); g.restore(); }
      if (k === 1) { // trama do tecido: pontos seguindo a curvatura, girando com a câmera
        g.fillStyle = 'rgba(38,42,48,.34)'; const st = Math.PI / 30;
        for (let j = 0, y = yT + 5; y < yB - 1; y += 4.2, j++) { const o = md(S.th + (j & 1) * st / 2, st);
          for (let a = -Math.PI / 2 + o; a < Math.PI / 2; a += st) { const c = Math.cos(a); if (c < .08) continue; g.fillRect(x + r * Math.sin(a) - c, y + RY * c - .8, 2 * c * 1.1, 1.6); } }
        g.fillStyle = lin(g, 0, yT, 0, yT + 16, [[0, 'rgba(0,0,0,.28)'], [1, 'rgba(0,0,0,0)']]); side(g, x, yT, yT + 14, r); g.fill();
        if (S.on > 0) { g.globalAlpha = S.on * (1 - S.gap2); g.fillStyle = lin(g, 0, yT, 0, yT + 30, [[0, 'rgba(160,220,255,.5)'], [1, 'rgba(160,220,255,0)']]); side(g, x, yT, yT + 28, r); g.fill(); g.globalAlpha = 1; }
      }
      // chanfro que pega luz
      g.strokeStyle = k === 3 ? 'rgba(255,255,255,.55)' : k === 2 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, yT, r - .5, RY - .3, 0, .08, Math.PI - .08); g.stroke();
    }
    // tampa superior de cada peça
    g.save(); g.beginPath(); g.ellipse(x, yT, r, RY, 0, 0, TAU); g.clip();
    if (k === 0) { g.translate(x, yT); g.scale(1, RY / r);
      const cg = g.createConicGradient ? g.createConicGradient(-.7 + S.th * .15, 0, 0) : null;
      if (cg) { [[0, '#eef1f4'], [.1, '#80878f'], [.25, '#aab1b9'], [.4, '#6c727a'], [.5, '#e6eaee'], [.6, '#7a8189'], [.75, '#a6adb5'], [.9, '#6e747c'], [1, '#eef1f4']].forEach(([s, c]) => cg.addColorStop(s, c)); g.fillStyle = cg; } else g.fillStyle = '#9aa1aa';
      g.fillRect(-r, -r, 2 * r, 2 * r); if (!lite) g.drawImage(rings(), -r, -r, 2 * r, 2 * r);
    } else if (k === 1) { g.fillStyle = '#26292d'; g.fillRect(x - r, yT - RY, 2 * r, 2 * RY);
      g.fillStyle = rad(g, x - 8, yT - 3, 2, r * .8, [[0, '#6b7077'], [.25, '#34373c'], [.7, '#1a1c1f'], [1, '#2c2f33']]); g.beginPath(); g.ellipse(x, yT, r * .78, RY * .78, 0, 0, TAU); g.fill();
      g.fillStyle = '#4a4e54'; g.beginPath(); g.ellipse(x, yT, r * .2, RY * .2, 0, 0, TAU); g.fill();
    } else if (k === 2) { g.fillStyle = S.on > .01 ? mixc('#8a98a5', '#e8f7ff', S.on) : '#8a98a5'; g.fillRect(x - r, yT - RY, 2 * r, 2 * RY);
      g.fillStyle = rad(g, x, yT, 0, r, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(x - r, yT - RY, 2 * r, 2 * RY);
    } else { g.fillStyle = lin(g, x - r, yT - RY, x + r, yT + RY, [[0, '#2c3035'], [.5, '#08090b'], [1, '#1b1e22']]); g.fillRect(x - r, yT - RY, 2 * r, 2 * RY);
      const bx = x - r * .15 + Math.sin(S.th) * r * .3; // reflexo do softbox deslizando
      g.fillStyle = lin(g, bx - 14, 0, bx + 26, 0, [[0, 'rgba(255,255,255,0)'], [.45, 'rgba(255,255,255,.16)'], [.55, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]);
      g.beginPath(); g.moveTo(bx - 12, yT - RY); g.lineTo(bx + 4, yT - RY); g.lineTo(bx + 22, yT + RY); g.lineTo(bx + 6, yT + RY); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, yT, r * .9, RY * .9, 0, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
      if (S.on > 0 && !lite) { const b = .75 + .25 * Math.sin(S.p * 5); g.globalAlpha = S.on;
        g.fillStyle = rad(g, x, yT, 0, r * .42, [[0, `rgba(235,248,255,${.95 * b})`], [.35, `rgba(140,210,255,${.7 * b})`], [1, 'rgba(90,160,255,0)']]); g.save(); g.translate(x, yT); g.scale(1, RY / r); g.translate(-x, -yT); g.beginPath(); g.arc(x, yT, r * .42, 0, TAU); g.fill(); g.restore(); g.globalAlpha = 1; }
    }
    g.restore();
  }

  R['3d-realista'] = (g, t, W, H) => {
    const p = t % 8, th = p / 8 * TAU;
    const z = 1 + .07 * sst(.6, 2.1, p) - .07 * sst(5.0, 7.6, p);
    const pin = p < 3 ? p + 8 : p, on = sst(5.5, 5.9, pin) * (1 - sst(8.3, 8.65, pin));
    const gap = (k) => { const L = PARTS[k].lift; if (!L) return { v: 0, f: 0 }; const e = eio(seg(p, .7 + (3 - k) * .14, 1.7 + (3 - k) * .14));
      const c0 = 4.7 + k * .16, x = seg(p, c0, c0 + .36); let v = L * e * (1 - x * x); const s = p - (c0 + .36);
      let f = 0; if (s > 0 && s < .6) { v += 2 * Math.abs(Math.sin(s * 20)) * Math.exp(-s * 11); f = Math.exp(-s * 9); } return { v, f }; };
    const G = [0, 1, 2, 3].map(gap); let acc = 0; const yb = PARTS.map((P, k) => { const y = FY - acc - G[k].v; acc += P.h; return y; });
    const S = { hl: .5 + .07 * Math.sin(th), th, on, p, gap2: clamp(G[2].v / 10) };
    // fundo: estúdio escuro com poça de luz
    g.drawImage(bgC(), 0, 0, W, H);
    g.save(); g.translate(CX, PIV); g.scale(z, z); g.translate(-CX, -PIV);
    // reflexo no piso
    g.save(); g.translate(0, 2 * FY + 2); g.scale(1, -1); g.globalAlpha = .16; for (let k = 0; k < 4; k++) part(g, k, CX, yb[k], S, true); g.restore();
    g.fillStyle = lin(g, 0, FY + 6, 0, FY + 60, [[0, 'rgba(10,11,13,0)'], [1, 'rgba(10,11,13,.92)']]); g.fillRect(0, FY + 6, W, 90);
    contact(g, CX, FY + 3, 80, 20, .55); contact(g, CX, FY + 1, 58, 15, .75);
    if (on > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = on * .55; g.drawImage(glowS(), CX - 130, yb[2] - 6 - 50, 260, 100); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    for (let k = 0; k < 4; k++) { part(g, k, CX, yb[k], S, false);
      if (G[k].f > 0) { g.strokeStyle = `rgba(200,236,255,${G[k].f * .9})`; g.lineWidth = 1.6; g.beginPath(); g.ellipse(CX, yb[k], PARTS[k].r, RY, 0, .05, Math.PI - .05); g.stroke(); } }
    // oclusão nas juntas quando encostadas
    for (let k = 1; k < 4; k++) { const a = .5 * (1 - clamp(G[k].v / 6)); if (a > .01) { g.strokeStyle = `rgba(0,0,0,${a})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(CX, yb[k] + .6, PARTS[k].r - .5, RY, 0, .05, Math.PI - .05); g.stroke(); } }
    g.restore();
    // rótulos técnicos da vista explodida
    const scr = (x, y) => [CX + (x - CX) * z, PIV + (y - PIV) * z];
    for (let k = 3; k >= 0; k--) { const a0 = 1.75 + (3 - k) * .42, h0 = 4.3 + (3 - k) * .05;
      const q1 = ease(seg(p, a0, a0 + .3)) * (1 - eio(seg(p, h0, h0 + .22))), q2 = ease(seg(p, a0 + .15, a0 + .5)) * (1 - eio(seg(p, h0 - .05, h0 + .15)));
      if (q1 <= 0) continue; const P = PARTS[k]; const [ax, ay] = scr(CX - P.r * .72, yb[k] - P.h / 2 + RY * .5);
      const ly = Math.min(ay, 206), ex = CX - 56 * z - 22, tx = ex - 8;
      g.strokeStyle = 'rgba(210,225,240,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax, ay); const mx = lerp(ax, ex, q1); g.lineTo(mx, lerp(ay, ly, q1)); if (q1 > .5) g.lineTo(lerp(mx, ex - 2, 0), ly); g.stroke();
      g.fillStyle = '#e8f6ff'; g.beginPath(); g.arc(ax, ay, 2.2, 0, TAU); g.fill();
      if (q2 > 0) { g.font = font(500, 14, F.mono); const w = g.measureText(P.lab).width + 34; g.save(); g.beginPath(); g.rect(tx - w * q2, ly - 12, w * q2 + 2, 24); g.clip();
        type(g, P.lab, tx, ly, { f: font(500, 14, F.mono), fill: '#e6eaf0', align: 'right', track: .5 }); type(g, '0' + (4 - k), tx - w + 4, ly, { f: font(600, 14, F.mono), fill: '#7fd0ff', align: 'left' }); g.restore(); }
    }
    // assinatura final
    const ti = (d) => seg(pin, 5.55 + d, 6.1 + d), to = seg(pin, 8.42 - 0, 8.72);
    maskLine(g, 'APRESENTANDO', 36, 100, 16, ti(0), to, { f: font(600, 14, F.mono), fill: '#8fd6ff', align: 'left', track: 3 });
    maskLine(g, 'Aura One', 34, 136, 40, ti(.1), to, { f: font(800, 40, F.grot), fill: '#f3f5f8', align: 'left', track: -.5 });
    maskLine(g, 'Som em 360 graus', 36, 170, 18, ti(.2), to, { f: font(500, 16, F.body), fill: '#9aa3ad', align: 'left' });
  };
}
// ======================= Low poly: ilha flutuante que se monta triângulo a triângulo =======================
{
  let M = null;
  const LD = (() => { const v = [-.55, .78, .42], n = Math.hypot(...v); return v.map((x) => x / n); })();
  const nrm = (a, b, c) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; const l = Math.hypot(...n) || 1; return n.map((x) => x / l); };
  const shade = (rgb, n, amb = .5) => { const d = Math.max(0, n[0] * LD[0] + n[1] * LD[1] + n[2] * LD[2]); const k = amb + .62 * d; return `rgb(${Math.min(255, rgb[0] * k) | 0},${Math.min(255, rgb[1] * k) | 0},${Math.min(255, rgb[2] * k) | 0})`; };
  const hcol = (h) => { const S = [[0, [58, 122, 78]], [.1, [82, 150, 84]], [.28, [138, 190, 98]], [.42, [160, 150, 128]], [.6, [178, 170, 158]], [.72, [245, 243, 238]], [2, [250, 250, 248]]];
    for (let i = 0; i < S.length - 1; i++) if (h <= S[i + 1][0]) { const k = (h - S[i][0]) / (S[i + 1][0] - S[i][0]); return S[i][1].map((v, j) => v + (S[i + 1][1][j] - v) * k); } return S[S.length - 1][1]; };
  function annulus(A, B, V, out) { const ang = (i) => md(V[i][3], TAU); const a = A.slice().sort((p, q) => ang(p) - ang(q)), b = B.slice().sort((p, q) => ang(p) - ang(q));
    const a0 = ang(a[0]); let s = b.findIndex((i) => ang(i) >= a0); if (s < 0) s = 0; const bb = b.slice(s).concat(b.slice(0, s));
    const ua = a.map(ang), ub = bb.map((i) => { const v = ang(i); return v < a0 ? v + TAU : v; }); a.push(a[0]); ua.push(ua[0] + TAU); bb.push(bb[0]); ub.push(ub[0] + TAU);
    let i = 0, j = 0; const nA = a.length - 1, nB = bb.length - 1;
    while (i < nA || j < nB) { if (i < nA && (j >= nB || ua[i + 1] <= ub[j + 1])) { out.push([a[i], a[i + 1], bb[j]]); i++; } else { out.push([a[i], bb[j + 1], bb[j]]); j++; } } }
  function build() {
    const q = rng(21), V = [], rings = [], N = 5, T = [];
    const hg = (x, z) => { const d = Math.hypot(x, z); const m = .95 * Math.exp(-((x + .1) ** 2 + (z + .25) ** 2) / .1) + .36 * Math.exp(-((x - .45) ** 2 + (z + .1) ** 2) / .05) + .16 * Math.exp(-((x + .45) ** 2 + (z - .35) ** 2) / .07); return m * (1 - Math.pow(Math.min(1, d), 3) * .8) + .04; };
    V.push([0, hg(0, 0), 0, 0]); rings.push([0]);
    for (let i = 1; i <= N; i++) { const m = 6 * i, off = q() * TAU, ring = [];
      for (let j = 0; j < m; j++) { const a = off + (j + (q() - .5) * .55) / m * TAU, rr = i / N * (1 + (q() - .5) * (i === N ? .1 : .12)); const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        const y = i === N ? .025 + q() * .02 : hg(x, z) + (q() - .5) * .05; ring.push(V.length); V.push([x, y, z, a]); } rings.push(ring); }
    const top = []; for (let j = 0; j < 6; j++) top.push([0, rings[1][j], rings[1][(j + 1) % 6]]); for (let i = 1; i < N; i++) annulus(rings[i], rings[i + 1], V, top);
    top.forEach((f) => { const [a, b, c] = f.map((i) => V[i]); let n = nrm(a, b, c); if (n[1] < 0) { f.reverse(); n = n.map((x) => -x); }
      const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[2] + b[2] + c[2]) / 3, cy = (a[1] + b[1] + c[1]) / 3; T.push({ f, n, c: shade(hcol(cy), n), rho: Math.hypot(cx, cz), kind: 0 }); });
    // borda de terra e rocha por baixo
    const E = rings[N], lip = E.map((i) => { V.push([V[i][0] * .97, -.09, V[i][2] * .97, V[i][3]]); return V.length - 1; });
    const mkRing = (n, rr, y, jit) => { const o = q() * TAU, r2 = []; for (let j = 0; j < n; j++) { const a = o + j / n * TAU; V.push([Math.cos(a) * rr * (1 + (q() - .5) * jit), y + (q() - .5) * .1, Math.sin(a) * rr * (1 + (q() - .5) * jit), a]); r2.push(V.length - 1); } return r2; };
    const mid = mkRing(14, .7, -.36, .3), low = mkRing(7, .36, -.68, .35); V.push([.06, -1.02, .02, 0]); const tip = V.length - 1;
    const und = []; const sortA = (A) => A.slice().sort((p, q2) => md(V[p][3], TAU) - md(V[q2][3], TAU));
    const Es = sortA(E), Ls = Es.map((i) => lip[E.indexOf(i)]);
    for (let j = 0; j < Es.length; j++) { const j2 = (j + 1) % Es.length; und.push([Es[j], Es[j2], Ls[j2], 1]); und.push([Es[j], Ls[j2], Ls[j], 1]); }
    const t2 = []; annulus(lip, mid, V, t2); annulus(mid, low, V, t2); for (let j = 0; j < 6; j++) t2.push([low[j], low[(j + 1) % 6], tip]); t2.forEach((f) => und.push([f[0], f[1], f[2], 2]));
    und.forEach((u) => { const f = u.slice(0, 3); const [a, b, c] = f.map((i) => V[i]); let n = nrm(a, b, c); const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3;
      if (n[0] * cx + n[2] * cz - n[1] * .4 < 0) { f.reverse(); n = n.map((x) => -x); }
      const base = u[3] === 1 ? [150, 104, 70] : [176, 138, 104].map((v, i) => v + ([94, 74, 64][i] - v) * clamp(-cy * 1.1)); const d = Math.max(0, -.6 * n[0] + .25 * n[1] + .76 * n[2]), kk = .58 + .5 * d;
      T.push({ f, n, c: `rgb(${Math.min(255, base[0] * kk) | 0},${Math.min(255, base[1] * kk) | 0},${Math.min(255, base[2] * kk) | 0})`, rho: 1, kind: 1 }); });
    // árvores e casa
    const cand = []; for (let i = 2; i <= 4; i++) rings[i].forEach((k) => { const v = V[k]; if (v[1] < .3 && v[1] > .05 && Math.hypot(v[0] + .1, v[2] + .25) > .35) cand.push(k); });
    const trees = []; cand.sort(() => q() - .5).forEach((k) => { const v = V[k]; if (trees.length < 9 && trees.every((u) => Math.hypot(V[u.k][0] - v[0], V[u.k][2] - v[2]) > .2)) trees.push({ k, s: .8 + q() * .5, d: q() }); });
    let house = cand.find((k) => V[k][2] > .2 && trees.every((u) => Math.hypot(V[u.k][0] - V[k][0], V[u.k][2] - V[k][2]) > .15)) ?? cand[0];
    M = { V, T, trees, house };
  }
  const cloud = (g, x, y, s) => { const P = [[-26, 4, 16], [0, -6, 21], [24, 3, 15]]; P.forEach(([dx, dy, r]) => { for (let i = 0; i < 6; i++) { const a0 = i / 6 * TAU + .3, a1 = a0 + TAU / 6; const mid = Math.sin((a0 + a1) / 2);
      g.fillStyle = mid < -.3 ? '#ffffff' : mid < .4 ? '#f1f4fa' : '#d6deec'; g.beginPath(); g.moveTo(x + dx * s, y + dy * s); g.lineTo(x + (dx + Math.cos(a0) * r) * s, y + (dy + Math.sin(a0) * r * .8) * s); g.lineTo(x + (dx + Math.cos(a1) * r) * s, y + (dy + Math.sin(a1) * r * .8) * s); g.fill(); } }); };
  const sky = () => cached('g4-lp-sky', 960, 540, (c) => { c.scale(2, 2); const q = rng(4); const top = [74, 98, 168], bot = [246, 196, 170];
    const cols = 9, rows = 6, P = []; for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) P.push([x / cols * 480 + (x % cols ? (q() - .5) * 40 : 0), y / rows * 270 + (y % rows ? (q() - .5) * 30 : 0)]);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const a = P[y * (cols + 1) + x], b = P[y * (cols + 1) + x + 1], cc = P[(y + 1) * (cols + 1) + x], d = P[(y + 1) * (cols + 1) + x + 1];
      [[a, b, cc], [b, d, cc]].forEach((tr) => { const cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3 / 270, j = (q() - .5) * .07; const k = clamp(cy * 1.05 + j);
        c.fillStyle = `rgb(${top.map((v, i) => v + (bot[i] - v) * k | 0).join(',')})`; poly(c, tr); c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = .8; c.stroke(); }); }
    // sol facetado (mesma direção da luz)
    for (let i = 0; i < 10; i++) { const a0 = i / 10 * TAU, a1 = a0 + TAU / 10; c.fillStyle = i % 2 ? '#fff1c9' : '#ffe6ad'; c.beginPath(); c.moveTo(78, 62); c.lineTo(78 + Math.cos(a0) * 24, 62 + Math.sin(a0) * 24); c.lineTo(78 + Math.cos(a1) * 24, 62 + Math.sin(a1) * 24); c.fill(); }
    c.globalAlpha = .18; c.fillStyle = '#fff4d6'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.lineTo(78 + Math.cos(a) * 40, 62 + Math.sin(a) * 40); } c.fill(); c.globalAlpha = 1; });

  R['low-poly'] = (g, t, W, H) => {
    if (!M) build(); const { V, T, trees, house } = M; const p = t % 8;
    g.drawImage(sky(), 0, 0, W, H);
    // nuvens de fundo
    const par = Math.sin(p / 8 * TAU); cloud(g, 60 - par * 14, 48, .8); cloud(g, 400 - par * 10, 92, .6);
    const yaw = .6 + .38 * Math.sin(p / 8 * TAU), ph = .5, cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), cp = Math.cos(ph), sp = Math.sin(ph), S = 128, OX = 240, OY = 150 + Math.sin(p / 4 * TAU) * 3;
    const pr = (x, y, z) => { const xr = x * cy0 - z * sy0, zr = x * sy0 + z * cy0; return [OX + xr * S, OY - y * S * cp + zr * S * sp, y * sp + zr * cp]; };
    const vis = (n) => { const zr = n[0] * sy0 + n[2] * cy0; return n[1] * sp + zr * cp > 0; };
    const P = V.map((v) => pr(v[0], v[1], v[2])); const items = [];
    for (const tr of T) { let k = 1, mode = 0;
      if (tr.kind === 0 && tr.rho >= .32) { const u = (tr.rho - .32) / .68, A = .9 + u * 1.1, D = 7.25 + (1 - u) * .55;
        if (p >= D) { k = p - D; mode = 2; } else if (p + 8 - D < .55) { k = p + 8 - D; mode = 2; } else if (p < A) { k = seg(p, A - .6, A); mode = 1; } }
      if (mode === 0) { if (!vis(tr.n)) continue; const a = P[tr.f[0]], b = P[tr.f[1]], c = P[tr.f[2]]; items.push({ d: (a[2] + b[2] + c[2]) / 3, pts: [a, b, c], c: tr.c }); continue; }
      if (mode === 1 && k <= 0) continue; if (mode === 2 && k > .55) continue;
      const vs = tr.f.map((i) => V[i]), cx = (vs[0][0] + vs[1][0] + vs[2][0]) / 3, cyy = (vs[0][1] + vs[1][1] + vs[2][1]) / 3, cz = (vs[0][2] + vs[1][2] + vs[2][2]) / 3;
      let dy, rot, sc; if (mode === 1) { const e = spr(k); dy = (1 - e) * .9; rot = (1 - ease(k)) * 1.1; sc = .35 + .65 * ease(k * 1.4); } else { dy = -3.6 * k * k - .2 * k; rot = k * 1.6; sc = 1 - k; }
      const cr = Math.cos(rot), sr = Math.sin(rot); const pts = vs.map((v) => { const lx = (v[0] - cx) * sc, ly = (v[1] - cyy) * sc, lz = (v[2] - cz) * sc; return pr(cx + lx, cyy + ly * cr - lz * sr + dy, cz + ly * sr + lz * cr); });
      items.push({ d: (pts[0][2] + pts[1][2] + pts[2][2]) / 3 + (mode === 1 ? 2 : 0), pts, c: tr.c }); }
    // árvores: cones facetados que brotam com mola
    const tg = (k) => spr(seg(p, 2.0 + k * .1, 2.6 + k * .1)) * (1 - eio(seg(p, 6.85 + k * .03, 7.15 + k * .03)));
    trees.forEach((tr, i) => { const s = tg(i) * tr.s; if (s <= .01) return; const v = V[tr.k], sw = Math.sin(p * 2.4 + i) * .012 * s;
      const apex = [v[0] + sw, v[1] + .26 * s, v[2]], ring = []; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + i; ring.push([v[0] + Math.cos(a) * .075 * s, v[1] + .035 * s, v[2] + Math.sin(a) * .075 * s]); }
      const bp = pr(v[0], v[1], v[2]); items.push({ d: bp[2] - .001, sh: [bp[0], bp[1], .09 * s * S] });
      for (let j = 0; j < 5; j++) { const a = ring[j], b = ring[(j + 1) % 5]; const n = nrm(a, b, apex); const nn = n[0] * a[0] + n[2] * a[2] - (n[0] * v[0] + n[2] * v[2]) < 0 ? n.map((x) => -x) : n; if (!vis(nn)) continue;
        const pts = [pr(...a), pr(...b), pr(...apex)]; items.push({ d: (pts[0][2] + pts[1][2] + pts[2][2]) / 3 + .002, pts, c: shade([52, 128, 76], nn, .48) }); } });
    // casinha
    const hs = spr(seg(p, 3.0, 3.6)) * (1 - eio(seg(p, 6.8, 7.1))); if (hs > .01) { const v = V[house], bx = .075 * hs, bz = .06 * hs, bh = .07 * hs, rh = .06 * hs, X = v[0], Y = v[1] - .01, Z = v[2];
      const c8 = [[X - bx, Y, Z - bz], [X + bx, Y, Z - bz], [X + bx, Y, Z + bz], [X - bx, Y, Z + bz]].map((q) => [q, [q[0], q[1] + bh, q[2]]]);
      const faces = []; for (let j = 0; j < 4; j++) { const a = c8[j], b = c8[(j + 1) % 4]; faces.push([[a[0], b[0], b[1]], '#f4efe6', .55]); faces.push([[a[0], b[1], a[1]], '#f4efe6', .55]); }
      const r1 = [X - bx, Y + bh + rh, Z], r2 = [X + bx, Y + bh + rh, Z]; const u = c8.map((q) => q[1]);
      faces.push([[u[0], u[1], r2], '#d8544a', .5], [[u[0], r2, r1], '#d8544a', .5], [[u[3], r1, r2], '#d8544a', .5], [[u[3], r2, u[2]], '#d8544a', .5], [[u[0], r1, u[3]], '#f4efe6', .55], [[u[1], u[2], r2], '#f4efe6', .55]);
      const cen = [X, Y + bh * .6, Z]; faces.forEach(([f, col, am]) => { let n = nrm(...f); const fc = [(f[0][0] + f[1][0] + f[2][0]) / 3, (f[0][1] + f[1][1] + f[2][1]) / 3, (f[0][2] + f[1][2] + f[2][2]) / 3];
        if ((fc[0] - cen[0]) * n[0] + (fc[1] - cen[1]) * n[1] + (fc[2] - cen[2]) * n[2] < 0) n = n.map((x) => -x); if (!vis(n)) return; const pts = f.map((q) => pr(...q)); items.push({ d: (pts[0][2] + pts[1][2] + pts[2][2]) / 3 + .004, pts, c: shade(hx(col), n, am) }); });
      const bp = pr(X, Y, Z); items.push({ d: bp[2] - .001, sh: [bp[0], bp[1], .13 * hs * S] }); }
    items.sort((a, b) => a.d - b.d); g.lineJoin = 'round'; g.lineWidth = .7;
    for (const it of items) { if (it.sh) { g.fillStyle = 'rgba(20,50,30,.28)'; g.beginPath(); g.ellipse(it.sh[0], it.sh[1], it.sh[2], it.sh[2] * sp * .9, 0, 0, TAU); g.fill(); continue; }
      const [a, b, c] = it.pts; g.fillStyle = it.c; g.strokeStyle = it.c; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fill(); g.stroke(); }
    // nuvem de primeiro plano, mais rápida (paralaxe)
    cloud(g, 70 - par * 46, 226, 1.25);
  };
}
// ======================= 3D fofo: mascote de brinquedo pulando no pedestal =======================
{
  const bgF = () => cached('g4-fofo-bg', 960, 540, (c) => { c.scale(2, 2);
    c.fillStyle = lin(c, 0, 0, 0, 270, [[0, '#C9B9F7'], [.55, '#DCD0FF'], [.72, '#D6C9FC'], [1, '#C3B1F2']]); c.fillRect(0, 0, 480, 270);
    c.fillStyle = rad(c, 220, 96, 10, 280, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, 480, 270);
    // pedestal (fixo): lateral, tampo com borda arredondada
    const x = 240, yT = 206, yB = 240, rx = 94, ry = 20;
    c.save(); c.translate(x, yB + 6); c.scale(1, .22); c.fillStyle = rad(c, 0, 0, 0, 140, [[0, 'rgba(96,64,150,.42)'], [1, 'rgba(96,64,150,0)']]); c.beginPath(); c.arc(0, 0, 140, 0, TAU); c.fill(); c.restore();
    c.beginPath(); c.moveTo(x - rx, yT); c.lineTo(x - rx, yB); c.ellipse(x, yB, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yT); c.closePath();
    c.fillStyle = lin(c, x - rx, 0, x + rx, 0, [[0, '#E99A86'], [.3, '#FFC3AD'], [.55, '#FFCDB9'], [1, '#E0907C']]); c.fill();
    c.fillStyle = lin(c, 0, yT, 0, yB + ry, [[0, 'rgba(255,255,255,0)'], [.8, 'rgba(120,60,90,.1)'], [1, 'rgba(120,60,90,.18)']]); c.fill();
    c.fillStyle = '#FFD6C6'; c.beginPath(); c.ellipse(x, yT, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = rad(c, x - 20, yT - 6, 4, rx, [[0, '#FFEDE4'], [.7, '#FFDCCD'], [1, '#FFCBB7']]); c.beginPath(); c.ellipse(x, yT - 1.5, rx - 5, ry - 3, 0, 0, TAU); c.fill();
  });
  // forma inflada com luz suave (sem reflexo duro) e luz rebatida de baixo
  function puff(g, path, x, y, r, base, lite, dark, bounce) {
    path(); g.fillStyle = rad(g, x - r * .38, y - r * .45, r * .05, r * 1.25, [[0, lite], [.5, base], [.92, dark], [1, dark]]); g.fill();
    if (bounce) { g.save(); path(); g.clip(); g.fillStyle = rad(g, x + r * .1, y + r * 1.25, r * .2, r * 1.05, [[0, bounce], [1, 'rgba(255,255,255,0)']]); g.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2); g.restore(); }
    g.fillStyle = rad(g, x - r * .34, y - r * .5, 0, r * .42, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(x - r * .34, y - r * .5, r * .42, 0, TAU); g.fill();
  }
  const heartP = (g, s) => () => { g.beginPath(); g.moveTo(0, s * .95); g.bezierCurveTo(-s * 1.25, s * .15, -s * 1.1, -s * .9, 0, -s * .38); g.bezierCurveTo(s * 1.1, -s * .9, s * 1.25, s * .15, 0, s * .95); g.closePath(); };

  R['3d-fofo'] = (g, t, W, H) => {
    const p = t % 6; g.drawImage(bgF(), 0, 0, W, H);
    const land = p - .42, jolt = land > 0 && land < 1 ? Math.exp(-land * 7) * Math.sin(land * 26) : 0;
    // objetos flutuantes ao redor (sombra suave na parede)
    const obj = [[104, 92, 3, 0], [380, 64, 2, 1], [394, 158, 6, 2]];
    obj.forEach(([ox, oy, per, k]) => { const by = oy + Math.sin(p / per * TAU + k) * 6, s = 1 + jolt * .07, r = [30, 17, 24][k];
      g.fillStyle = rad(g, ox + 10, by + 18, 0, r * 1.3, [[0, 'rgba(90,60,160,.2)'], [1, 'rgba(90,60,160,0)']]); g.fillRect(ox + 10 - r * 1.4, by + 18 - r * 1.4, r * 2.8, r * 2.8);
      g.save(); g.translate(ox, by); g.scale(s, s);
      if (k === 0) { const tl = Math.sin(p / 3 * TAU) * .12; g.rotate(tl); const path = () => { g.beginPath(); g.ellipse(0, 0, 31, 25, 0, 0, TAU); g.ellipse(0, -3, 11, 8.5, 0, 0, TAU, true); };
        puff(g, path, 0, 0, 31, '#FF9CC0', '#FFE3EE', '#E0729A'); g.strokeStyle = 'rgba(190,70,120,.35)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, -3, 11, 8.5, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        g.lineCap = 'round'; g.lineWidth = 3; [['#FFF3B0', -20, -8, .6], ['#9EE6CF', 16, -12, -.5], ['#FFFFFF', 22, 6, .9], ['#A9C8FF', -14, 12, -.3], ['#FFF3B0', 4, 15, .2], ['#FFFFFF', -24, 4, -1.1], ['#9EE6CF', -4, -17, 1.2]].forEach(([c2, a, b, r2]) => { g.strokeStyle = c2; g.beginPath(); g.moveTo(a - Math.cos(r2) * 2.6, b - Math.sin(r2) * 2.6); g.lineTo(a + Math.cos(r2) * 2.6, b + Math.sin(r2) * 2.6); g.stroke(); }); }
      if (k === 1) puff(g, () => { g.beginPath(); g.arc(0, 0, 17, 0, TAU); }, 0, 0, 17, '#8EE3C8', '#E4FFF6', '#5FC2A6');
      if (k === 2) { g.rotate(Math.sin(p / 6 * TAU) * .25); const path = () => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? 11 : 22; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); };
        g.lineJoin = 'round'; g.lineWidth = 9; path(); g.strokeStyle = rad(g, -8, -10, 2, 30, [[0, '#E6F2FF'], [.5, '#9CCBFF'], [1, '#6FA6EE']]); g.stroke(); puff(g, path, 0, 0, 22, '#9CCBFF', '#EEF6FF', '#77AEF2'); }
      g.restore(); });
    // salto: queda (0–.42), impacto com squash, respiração, antecipação e impulso (5.1–6)
    let h = 0, sy = 1; if (p < .42) { const u = p / .42; h = 92 * (1 - u * u); sy = 1 + .14 * u; }
    else if (p > 5.58) { const u = (p - 5.58) / .42; h = 92 * (1 - (1 - u) * (1 - u)); sy = 1 + .16 * (1 - u) * sst(0, .12, u) - (1 - sst(0, .12, u)) * .22; }
    else { sy = 1 - .3 * Math.exp(-land * 5) * Math.cos(land * 13) + .015 * Math.sin(p * 4) - .22 * eio(seg(p, 5.1, 5.58)); }
    const sx = 1 / Math.sqrt(sy), X = 240, Y = 210 - h, hk = h / 92, SC = 1.3;
    g.save(); g.translate(X, 208); g.scale(1, .24); g.fillStyle = rad(g, 0, 0, 0, 66 * (1 + .4 * hk), [[0, `rgba(110,60,120,${.4 * (1 - .6 * hk)})`], [1, 'rgba(110,60,120,0)']]); g.beginPath(); g.arc(0, 0, 70 * (1 + .4 * hk), 0, TAU); g.fill(); g.restore();
    g.save(); g.translate(X, Y); g.scale(sx * SC, sy * SC); g.rotate(Math.sin(p * 1.6) * .03 * (1 - hk));
    const body = () => { g.beginPath(); g.moveTo(-40, -36); g.bezierCurveTo(-40, -86, 40, -86, 40, -36); g.bezierCurveTo(40, -6, 30, 0, 0, 0); g.bezierCurveTo(-30, 0, -40, -6, -40, -36); g.closePath(); };
    // pés e braços (atrás do corpo)
    [-15, 15].forEach((fx) => puff(g, () => { g.beginPath(); g.ellipse(fx, -2, 13, 7, 0, 0, TAU); }, fx, -2, 13, '#F5B347', '#FFE6A8', '#DB9331'));
    const wave = seg(p, 1.55, 2.75), env = sst(0, .16, wave) * (1 - sst(.84, 1, wave)), arm = (sgn, a) => { g.save(); g.translate(sgn * 33, -36); g.rotate(sgn > 0 ? -a : a - 0);
      puff(g, () => { g.beginPath(); g.roundRect(-7, -2, 14, 29, 7); }, 0, 9, 15, '#FFD76E', '#FFF1C4', '#E7A63F'); g.restore(); };
    arm(-1, .35); const ra = lerp(.35, 2.5 + Math.sin(wave * TAU * 3) * .38, env); if (env <= 0) arm(1, ra);
    puff(g, body, 0, -42, 44, '#FFD86B', '#FFF6D6', '#EBA23E', 'rgba(255,160,140,.55)'); if (env > 0) arm(1, ra);
    // rosto
    const blink = (p > 1.45 && p < 1.58) || (p > 4.3 && p < 4.42), happy = p > 2.75 && p < 3.9, air = p < .42 || p > 5.58;
    g.fillStyle = 'rgba(255,120,140,.45)'; [-24, 24].forEach((cx) => { g.beginPath(); g.ellipse(cx, -30, 7, 4.5, 0, 0, TAU); g.fill(); });
    g.fillStyle = '#2D2258'; g.strokeStyle = '#2D2258'; g.lineCap = 'round'; g.lineWidth = 3;
    [-13, 13].forEach((ex) => { if (happy) { g.beginPath(); g.arc(ex, -40, 5.5, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); return; }
      g.beginPath(); g.ellipse(ex, -42, 5.2, blink ? .9 : 7.2, 0, 0, TAU); g.fill(); if (!blink) { g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 1.6, -45, 1.9, 0, TAU); g.fill(); g.fillStyle = '#2D2258'; } });
    if (air || (land > 0 && land < .3)) { g.beginPath(); g.ellipse(0, -27, 4.5, 5.5, 0, 0, TAU); g.fill(); } else { g.lineWidth = 2.6; g.beginPath(); g.arc(0, -31, 6.5, .2 * Math.PI, .8 * Math.PI); g.stroke(); }
    g.restore();
    // coração que infla e estoura
    const hs = spr(seg(p, 2.6, 3.2)) * (1 - ease(seg(p, 4.05, 4.25))); if (hs > .01) { const hy = Y - 132 - 26 * ease(seg(p, 2.6, 4.2)), hxp = X + 58 + Math.sin(p * 3) * 4;
      g.save(); g.translate(hxp, hy); g.scale(hs * (1 + .06 * Math.sin(p * 12)), hs); puff(g, heartP(g, 24), 0, 0, 26, '#FF6F9C', '#FFD3E1', '#E0467A'); g.restore(); }
    const bu = seg(p, 4.2, 4.6); if (bu > 0 && bu < 1) { const hy = Y - 158; g.fillStyle = `rgba(255,111,156,${1 - bu})`; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.arc(X + 58 + Math.cos(a) * 30 * ease(bu), hy + Math.sin(a) * 26 * ease(bu), 3.5 * (1 - bu) + 1, 0, TAU); g.fill(); } }
  };
}
// ======================= Simulação satisfatória: bloco de areia cinética fatiado em loop =======================
{
  const DX = 30, DY = -19, YT = 82, YB = 198, X1 = 300, WS = 20, HB = YB - YT;
  const LAY = [['#F4A3BE', 0, .34], ['#C7B3F2', .34, .67], ['#9CDDC8', .67, 1]];
  const shadeC = (h, k) => { const A = hx(h); return `rgb(${Math.min(255, A[0] * k) | 0},${Math.min(255, A[1] * k) | 0},${Math.min(255, A[2] * k) | 0})`; };
  const layerGrad = (g, ax, ay, bx, by, k) => { const gr = g.createLinearGradient(ax, ay, bx, by); LAY.forEach(([c, a, b]) => { gr.addColorStop(a, shadeC(c, k)); gr.addColorStop(Math.max(a, b - .001), shadeC(c, k * .97)); }); return gr; };
  const sand = () => cached('g4-sand', WS * 3 * 2, HB * 2, (c, w, h) => { const q = rng(9); for (let i = 0; i < 2200; i++) { const v = q(); c.fillStyle = v > .5 ? `rgba(255,255,255,${.1 + q() * .25})` : `rgba(70,30,60,${.06 + q() * .14})`; c.fillRect(q() * w, q() * h, 1 + q() * 1.4, 1 + q() * 1.2); } });
  const bgK = () => cached('g4-sand-bg', 960, 540, (c) => { c.scale(2, 2);
    c.fillStyle = lin(c, 0, 0, 0, 200, [[0, '#DCCFF3'], [1, '#EFE6FA']]); c.fillRect(0, 0, 480, 270);
    c.fillStyle = rad(c, 330, 40, 10, 320, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, 480, 270);
    // mesa: tampo e quina direita (onde a fatia cai)
    const ex = (k) => [X1 + DX * k, YB + DY * k];
    const f0 = ex(-2.1), b0 = ex(1.3);
    c.fillStyle = lin(c, 0, b0[1], 0, f0[1], [[0, '#F0D7CB'], [1, '#F7E3D9']]); poly(c, [[-10, b0[1]], b0, f0, [-10, f0[1]]]); c.fill();
    c.fillStyle = lin(c, 0, f0[1] + 20, 0, f0[1] + 50, [[0, 'rgba(110,70,120,.22)'], [1, 'rgba(110,70,120,0)']]); c.fillRect(-10, f0[1] + 20, f0[0] + 10, 40);
    c.fillStyle = lin(c, 0, f0[1], 0, f0[1] + 20, [[0, '#E8C3B4'], [1, '#D9AE9F']]); poly(c, [[-10, f0[1]], f0, [f0[0], f0[1] + 20], [-10, f0[1] + 20]]); c.fill();
    c.fillStyle = lin(c, f0[0], 0, b0[0], 0, [[0, '#D5A797'], [1, '#E0B6A7']]); poly(c, [f0, b0, [b0[0], b0[1] + 20], [f0[0], f0[1] + 20]]); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, f0[1]); c.lineTo(f0[0], f0[1]); c.lineTo(b0[0], b0[1]); c.stroke();
  });
  // caixa extrudada: frente com estratos e grão; faces laterais visíveis conforme a rotação
  function box(g, px, py, x0, x1, th, tex, cutL, cutR) {
    const c = Math.cos(th), s = Math.sin(th), P = (x, y) => [px + x * c - y * s, py + x * s + y * c];
    const TL = P(x0, -HB), TR = P(x1, -HB), BR = P(x1, 0), BL = P(x0, 0);
    const E = [[TL, TR, 0, -1, 'top'], [TR, BR, 1, 0, 'R'], [BR, BL, 0, 1, 'bot'], [BL, TL, -1, 0, 'L']];
    for (const [A, B, nx, ny, k] of E) { const n0 = nx * c - ny * s, n1 = nx * s + ny * c; if (n0 * DX + n1 * DY <= 0) continue;
      const q = [A, B, [B[0] + DX, B[1] + DY], [A[0] + DX, A[1] + DY]]; poly(g, q);
      if (k === 'top') g.fillStyle = lin(g, A[0], A[1], A[0] + DX, A[1] + DY, [[0, '#FFE0EA'], [1, '#FCCFDD']]);
      else if (k === 'bot') g.fillStyle = shadeC(LAY[2][0], .8);
      else { const fresh = (k === 'L' && cutL) || (k === 'R' && cutR); g.fillStyle = k === 'L' ? layerGrad(g, B[0], B[1], A[0], A[1], fresh ? 1.04 : .92) : layerGrad(g, A[0], A[1], B[0], B[1], fresh ? .98 : .86); }
      g.fill(); if ((k === 'R' && cutR) || (k === 'L' && cutL)) { g.fillStyle = lin(g, q[0][0], q[0][1], q[3][0], q[3][1] + 40, [[0, 'rgba(255,255,255,.28)'], [.5, 'rgba(255,255,255,.06)'], [1, 'rgba(255,255,255,0)']]); poly(g, q); g.fill(); } }
    g.save(); g.translate(px, py); g.rotate(th); g.beginPath(); g.rect(x0, -HB, x1 - x0, HB); g.fillStyle = layerGrad(g, 0, -HB, 0, 0, 1); g.fill();
    g.clip(); const T = sand(); for (let x = x0 - md(tex - x0, WS * 3); x < x1; x += WS * 3) g.drawImage(T, x, -HB, WS * 3, HB);
    g.fillStyle = lin(g, 0, -HB, 0, 0, [[0, 'rgba(255,255,255,.18)'], [.3, 'rgba(255,255,255,0)'], [.85, 'rgba(0,0,0,0)'], [1, 'rgba(90,40,70,.12)']]); g.fillRect(x0, -HB, x1 - x0, HB); g.restore();
  }

  R['simulacao-satisfatoria'] = (g, t, W, H) => {
    const T = t % 6, c = T % 2, n = Math.floor(T / 2), e = eio(seg(c, 0, .42)), xb = X1 - WS;
    g.drawImage(bgK(), 0, 0, W, H);
    const xr = X1 - WS * (1 - e), tex = -WS * (n + e);
    // sombra de contato do bloco na mesa
    g.fillStyle = 'rgba(120,70,80,.16)'; poly(g, [[-10, YB], [xr, YB], [xr + DX, YB + DY], [xr + DX + 8, YB + DY + 2], [xr + 6, YB + 4], [-10, YB + 5]]); g.fill();
    const cut = c >= .84, bladeY = c < .44 ? -20 : c < .6 ? lerp(-20, YT, Math.pow(seg(c, .44, .6), 2)) : c < .84 ? lerp(YT, YB, sst(0, 1, seg(c, .6, .84))) : c < .9 ? YB : lerp(YB, -20, eio(seg(c, .9, 1.2)));
    if (!cut) box(g, 0, YB, -20, xr, 0, tex, false, true);
    else { box(g, 0, YB, -20, xb, 0, tex, false, true); }
    // corte: fresta na frente e no topo
    if (c > .6 && c < 1.05) { const d = clamp((bladeY - YT) / HB); g.strokeStyle = 'rgba(90,40,70,.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(xb, YT); g.lineTo(xb + DX, YT + DY); g.moveTo(xb, YT); g.lineTo(xb, YT + HB * d); g.stroke(); }
    // fatia tombando pela quina da mesa e caindo
    if (cut) { const k = seg(c, .98, 1.5), th = Math.min(1.75 * k * k, 1.62) + Math.max(0, c - 1.5) * 3.2, fall = c > 1.46 ? 900 * (c - 1.46) ** 2 : 0;
      if (YB + fall < 330) box(g, X1, YB + fall, -WS, 0, th, tex + WS * 0, true, true); }
    // lâmina de aço (só a parte acima da areia aparece)
    if (bladeY > -19.5) { g.save(); g.beginPath(); g.moveTo(xb - 6, -40); g.lineTo(xb + DX + 6, -40); g.lineTo(xb + DX + 6, YT + DY); g.lineTo(xb, YT); g.lineTo(xb - 6, YT); g.closePath(); g.clip();
      const top = bladeY - 118, q = [[xb, top], [xb + DX, top + DY], [xb + DX, bladeY + DY], [xb, bladeY]];
      g.fillStyle = lin(g, xb, top, xb + DX, bladeY, [[0, '#8E97A3'], [.35, '#EEF2F6'], [.5, '#FFFFFF'], [.62, '#B9C2CC'], [1, '#7D8793']]); poly(g, q); g.fill();
      g.fillStyle = '#5F6874'; poly(g, [[xb - 1.6, top], [xb, top], [xb, bladeY], [xb - 1.6, bladeY - 1]]); g.fill();
      g.fillStyle = lin(g, 0, top, 0, top + 24, [[0, '#9EDFCB'], [1, '#79C7B0']]); poly(g, [[xb - 3, top - 22], [xb + DX + 3, top + DY - 22], [xb + DX + 3, top + DY + 2], [xb - 3, top + 2]]); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; poly(g, [[xb - 3, top - 22], [xb + DX + 3, top + DY - 22], [xb + DX + 3, top + DY - 17], [xb - 3, top - 17]]); g.fill();
      g.restore(); }
    // farelos de areia que se soltam no corte
    const cr = seg(c, .66, 1.4); if (cr > 0 && cr < 1) { const q = rng(n * 7 + 3); for (let i = 0; i < 9; i++) { const v = q(), tt = cr * .74 - q() * .15; if (tt < 0) continue; const x = xb + (q() - .3) * 8 + tt * (q() - .5) * 30, y = YT + v * HB * .9 + 420 * tt * tt;
      if (y > YB + 2) continue; g.fillStyle = LAY[Math.min(2, v * 3 | 0)][0]; g.beginPath(); g.arc(x, y, 1.3 + q(), 0, TAU); g.fill(); } }
  };
}
// ======================= Morphing: lâmpada → balão → coração → seta, sem corte =======================
{
  const NM = 220; let SH = null;
  const rr = (x, y, x0, y0, x1, y1, r) => { const cx = clamp(x, x0 + r, x1 - r), cy = clamp(y, y0 + r, y1 - r); return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= x0 && x <= x1 && y >= y0 && y <= y1; };
  const inTri = (x, y, a, b, c) => { const s = (p, q, r2) => (p[0] - r2[0]) * (q[1] - r2[1]) - (q[0] - r2[0]) * (p[1] - r2[1]); const d1 = s([x, y], a, b), d2 = s([x, y], b, c), d3 = s([x, y], c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  const SHAPES = [
    (x, y) => x * x + (y + .2) ** 2 <= .68 * .68 || rr(x, y, -.33, .2, .33, .74, .06) || rr(x, y, -.25, .7, .25, .9, .1),
    (x, y) => { const X = x * 1.22, Y = -y * 1.22 + .14; return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0; },
    (x, y) => rr(x, y, -.95, -.62, .95, .42, .34) || inTri(x, y, [-.52, .3], [-.12, .3], [-.62, .86]),
    (x, y) => inTri(x, y, [0, -.92], [-.8, .1], [.8, .1]) || rr(x, y, -.25, 0, .25, .9, .04),
  ];
  const hsl = (h) => { let [r, g2, b] = hx(h).map((v) => v / 255); const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), l = (mx + mn) / 2, d = mx - mn; let hh = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g2 - b) / d) % 6 : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4; } return [hh * 60, s * 100, l * 100]; };
  const hmix = (a, b, k) => { const A = hsl(a), B = hsl(b); let dh = B[0] - A[0]; if (dh > 180) dh -= 360; if (dh < -180) dh += 360; return `hsl(${A[0] + dh * k},${lerp(A[1], B[1], k)}%,${lerp(A[2], B[2], k)}%)`; };
  const COL = ['#FFC21A', '#FF4D6D', '#3D7BFF', '#18C29C'], WORD = ['ideia', 'conexão', 'conversa', 'crescimento'];
  const init = () => { SH = SHAPES.map((f) => { const r = new Float32Array(NM); for (let i = 0; i < NM; i++) { const a = -Math.PI / 2 + i / NM * TAU, c = Math.cos(a), s = Math.sin(a); let last = 0; for (let d = 0; d < 1.5; d += .004) if (f(c * d, s * d)) last = d; r[i] = last; } return r; }); };
  const path = (g, A, B, k, x, y, S, rot, sx, sy) => { g.beginPath(); for (let i = 0; i < NM; i++) { const a = -Math.PI / 2 + i / NM * TAU, r = lerp(A[i], B[i], k) * S, px = Math.cos(a) * r * sx, py = Math.sin(a) * r * sy, cr = Math.cos(rot), sr = Math.sin(rot);
    const X = x + px * cr - py * sr, Y = y + px * sr + py * cr; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); };

  R['morphing'] = (g, t, W, H) => {
    if (!SH) init(); const p = t % 8, i = Math.floor(p / 2), c = p - i * 2, j = (i + 1) % 4, BG = '#15171F';
    g.fillStyle = BG; g.fillRect(0, 0, W, H); g.fillStyle = rad(g, 240, 118, 10, 260, [[0, '#262A36'], [1, 'rgba(21,23,31,0)']]); g.fillRect(0, 0, W, H);
    const k = seg(c, 1.1, 1.95), m = eio(k), CX = 240, CY = 116, S = 64;
    // anel-guia com marcas: um ponto percorre o anel e marca a forma da vez
    const RG = 94; g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; g.beginPath(); g.arc(CX, CY, RG, 0, TAU); g.stroke();
    for (let q = 0; q < 4; q++) { const a = -Math.PI / 2 + q / 4 * TAU; g.fillStyle = q === i && k === 0 ? COL[q] : 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(CX + Math.cos(a) * RG, CY + Math.sin(a) * RG, q === i && k === 0 ? 4 : 2.5, 0, TAU); g.fill(); }
    const pa = -Math.PI / 2 + (i + m) / 4 * TAU; g.fillStyle = mixc(COL[i], COL[j], m); g.beginPath(); g.arc(CX + Math.cos(pa) * RG, CY + Math.sin(pa) * RG, 3.2, 0, TAU); g.fill();
    // dinâmica da metamorfose: antecipação, giro de uma volta, salto e assentamento com mola
    const ant = k === 0 ? sst(.8, 1.1, c) : 0, u0 = seg(c, 0, .6), wob = k === 0 ? Math.sin(u0 * TAU) * (1 - u0) : 0, rot = -.32 * Math.sin(Math.PI * m) + ant * .1 - .08 * wob, swr = TAU * m, hop = Math.sin(Math.PI * m) * 16, set = 0;
    const scl = (1 - .2 * Math.sin(Math.PI * k)) * (1 + .07 * wob + set), sy = 1 - ant * .08 + (k > 0 ? .06 * Math.sin(Math.PI * k * 2) : 0), sx = 1 + ant * .06;
    const beat = i === 1 && k === 0 ? 1 + .07 * Math.max(0, Math.sin(c * 9)) ** 6 : 1, bob = i === 3 && k === 0 ? -4 * Math.sin(c * Math.PI) : 0, col = mixc(COL[i], COL[j], m), y = CY - hop + bob;
    // sombra no chão
    g.save(); g.translate(CX, 214); g.scale(1, .16); g.fillStyle = rad(g, 0, 0, 0, 70, [[0, `rgba(0,0,0,${.45 - hop * .012})`], [1, 'rgba(0,0,0,0)']]); g.beginPath(); g.arc(0, 0, 70 * (1 - hop * .01), 0, TAU); g.fill(); g.restore();
    // swoosh: arcos afinando atrás do giro
    if (k > .08 && k < .92) { const sp = Math.sin(Math.PI * k), R0 = S * 1.18; for (let h = 0; h < 2; h++) { const a0 = swr + h * Math.PI - Math.PI / 2; for (let q = 0; q < 8; q++) { const u0 = q / 8, u1 = (q + 1) / 8; g.strokeStyle = col; g.lineWidth = 7 * (1 - u0) * sp; g.lineCap = 'round';
      g.beginPath(); g.arc(CX, y, R0, a0 - u1 * 1.5 * sp, a0 - u0 * 1.5 * sp); g.stroke(); } } }
    // eco (rastro de movimento) e forma principal
    g.fillStyle = col; path(g, SH[i], SH[j], m, CX, y, S * scl * beat, rot, sx, sy); g.fill();
    // detalhes em espaço negativo, só na pausa (entram com mola, saem antes do giro)
    const dk = k === 0 ? spr(seg(c, .05, .45)) * (1 - ease(seg(c, .85, 1.08))) : 0;
    if (dk > .01) { g.save(); g.translate(CX, y); g.scale(dk * scl * beat, dk * scl * beat); g.strokeStyle = BG; g.fillStyle = BG; g.lineCap = 'round'; g.lineJoin = 'round';
      if (i === 0) { g.lineWidth = 4.5; g.beginPath(); g.moveTo(-15, 30); g.lineTo(15, 30); g.moveTo(-13, 40); g.lineTo(13, 40); g.stroke(); g.lineWidth = 3.5; g.beginPath(); g.moveTo(-9, 12); g.lineTo(-9, -4); g.lineTo(-3, -12); g.lineTo(3, -4); g.lineTo(9, -12); g.lineTo(9, 12); g.stroke();
        g.strokeStyle = COL[0]; g.lineWidth = 4; for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + (q - 2) * .5, L = 8 + 3 * Math.sin(c * 8 + q); g.beginPath(); g.moveTo(Math.cos(a) * 58, -13 + Math.sin(a) * 58); g.lineTo(Math.cos(a) * (58 + L), -13 + Math.sin(a) * (58 + L)); g.stroke(); } }
      if (i === 2) for (let q = 0; q < 3; q++) { const b = Math.max(0, Math.sin(c * 7 - q * .9)) * 5; g.beginPath(); g.arc(-22 + q * 22, -8 - b, 6, 0, TAU); g.fill(); }
      if (i === 1) { g.globalAlpha = .45; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-26, -22, 9, 5, -.7, 0, TAU); g.fill(); g.globalAlpha = 1; }
      if (i === 3) { g.strokeStyle = COL[3]; g.lineWidth = 4; [[-30, 70, 16], [30, 70, 16], [0, 76, 10]].forEach(([x0, y0, L], q) => { const o = md(c * 30 + q * 7, 20); g.globalAlpha = 1 - o / 20; g.beginPath(); g.moveTo(x0, y0 + o); g.lineTo(x0, y0 + o + L); g.stroke(); }); g.globalAlpha = 1; }
      g.restore(); }
    // rótulo: número + palavra (troca por máscara durante o giro)
    const out = seg(k, 0, .4), inn = k > 0 ? seg(k, .55, 1) : 1, wi = k > .5 ? j : i;
    maskLine(g, `0${wi + 1} / 04`, 240, 230, 16, inn, k > .5 ? 0 : out, { f: font(500, 14, F.mono), fill: 'rgba(255,255,255,.5)', track: 2 });
    maskLine(g, WORD[wi], 240, 252, 26, k > .5 ? inn : 1, k > .5 ? 0 : out, { f: font(800, 24, F.display), fill: '#F4F1EA' });
  };
}
// ======================= Líquido: gota que cai, respinga e inunda a tela com o próximo sabor =======================
{
  const BW = 192, BH = 108, SC = 480 / BW, D = 2.4;
  const FL = [{ n: 'MORANGO', c: '#FF3B6B', ink: '#FFFFFF' }, { n: 'MANGA', c: '#FFB21A', ink: '#4A1E00' }, { n: 'MIRTILO', c: '#4A36FF', ink: '#FFFFFF' }];
  const XS = [.5, .36, .42];
  let cv = null, cx = null, img = null, Fb = null, Lx = null;
  const setup = () => { cv = document.createElement('canvas'); cv.width = BW; cv.height = BH; cx = cv.getContext('2d'); img = cx.createImageData(BW, BH); Fb = new Float32Array(BW * BH); Lx = new Float32Array(BW); };
  function liquid(tau, x0, col) { // campo de metaballs + nível que sobe; devolve false se ainda não há líquido
    const balls = [];
    if (tau < .62) { const u = tau / .62; balls.push([x0, -7, 9 - u * 1.5]); balls.push([x0, -3 + 13 * eio(u), 5.5 + 3 * u]); if (u > .7) balls.push([x0, 3 + 8 * u, 3.5]); }
    else { const f = tau - .62; balls.push([x0, -8 - 3 * Math.exp(-f * 6) * Math.cos(f * 18), 7.5]);
      if (tau < .96) { const y = 12 + .5 * 900 * f * f; balls.push([x0, y, 7.5]); balls.push([x0, y - 8, 5]); balls.push([x0, y - 14, 3]); } }
    const imp = tau - .95, lvl = BH + 10 - (BH + 32) * eio(seg(tau, 1.08, 1.64)); let pool = tau > .9;
    if (imp > 0) { const q = rng(7 + Math.round(x0)); for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (q() - .5) * 2.2, v = 85 + q() * 70, x = x0 + Math.cos(a) * v * imp * 1.15, y = BH - 2 + Math.sin(a) * v * imp + 210 * imp * imp;
      const r = (2.2 + q() * 2.6) * (1 - clamp(imp / 1.1)); if (r > .4 && y < BH + 4) balls.push([x, y, r]); } }
    if (!balls.length && !pool) return false;
    for (let x = 0; x < BW; x++) { const bump = imp > 0 ? 22 * Math.exp(-(((x - x0) / (7 + imp * 30)) ** 2)) * Math.exp(-imp * 2.5) * Math.min(1, imp * 8) : 0;
      Lx[x] = lvl + 3.2 * Math.sin(x * .09 + tau * 9) * Math.min(1, imp * 3 + .2) + 2.2 * Math.sin(x * .047 - tau * 6) - bump; }
    let lmin = 1e9; for (let x = 0; x < BW; x++) lmin = Math.min(lmin, Lx[x]);
    let bmax = -1e9; for (const b of balls) bmax = Math.max(bmax, b[1] + b[2] * 5);
    const d = img.data; d.fill(0);
    for (let y = 0; y < BH; y++) { const rowPool = pool && y > lmin - 30, rowBall = y < bmax; if (!rowPool && !rowBall) { for (let x = 0; x < BW; x++) Fb[y * BW + x] = 0; continue; }
      for (let x = 0; x < BW; x++) { let f = 0; if (rowBall) for (let i = 0; i < balls.length; i++) { const b = balls[i], dx = x - b[0], dy = y - b[1]; f += b[2] * b[2] / (dx * dx + dy * dy + .6); }
        if (rowPool) { const e = (y - Lx[x]) / 3.2; f += e > -6 ? Math.exp(Math.min(e, 6)) : 0; } Fb[y * BW + x] = f; } }
    const [r0, g0, b0] = hx(col);
    const h = (v) => clamp((v - .9) / 5);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const i = y * BW + x, f = Fb[i]; if (f < .8) continue; const a = clamp((f - .85) / .3);
      const gx = h(Fb[x < BW - 1 ? i + 1 : i]) - h(Fb[x > 0 ? i - 1 : i]), gy = h(Fb[y < BH - 1 ? i + BW : i]) - h(Fb[y > 0 ? i - BW : i]);
      const eb = a * (1 - clamp((f - 1.2) / 2.2)), dt = (gx * .55 + gy * .83) * eb, lit = clamp(dt * 7), dk = clamp(-dt * 5), sp = lit * lit * (3 - 2 * lit) * .75;
      const o = i * 4; d[o] = Math.min(255, r0 * (1 - dk * .16) + sp * 210); d[o + 1] = Math.min(255, g0 * (1 - dk * .16) + sp * 210); d[o + 2] = Math.min(255, b0 * (1 - dk * .16) + sp * 210); d[o + 3] = a * 255; }
    cx.putImageData(img, 0, 0); return true;
  }
  function title(g, m, since, W) { const F0 = FL[m]; const pop = (k) => spr(seg(since, .02 + k * .035, .4 + k * .035));
    type(g, 'SABOR', 240, 104, { f: font(600, 14, F.mono), fill: F0.ink, track: 5 }); g.globalAlpha = 1;
    g.font = font(800, 54, F.display); if ('letterSpacing' in g) g.letterSpacing = '0px'; const L = [...F0.n], ws = L.map((c) => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); let x = 240 - tot / 2;
    L.forEach((ch, k) => { const s = pop(k); if (s > .01) { g.save(); g.translate(x + ws[k] / 2, 164); g.scale(s, s); type(g, ch, 0, 0, { f: font(800, 54, F.display), fill: F0.ink, base: 'alphabetic' }); g.restore(); } x += ws[k]; }); }

  R['liquido'] = (g, t, W, H) => {
    if (!cv) setup(); const T = t % (D * 3), k = Math.floor(T / D), tau = T - k * D, nk = (k + 1) % 3, covered = tau >= 1.62;
    const cur = covered ? nk : k; g.fillStyle = FL[cur].c; g.fillRect(0, 0, W, H);
    // bolhas subindo no líquido parado
    for (let i = 0; i < 7; i++) { const ph = md(T / (D * 3) * 2 + i / 7, 1), bx = 40 + i * 66 + Math.sin(T / (D * 3) * TAU * 5 + i) * 6, by = 290 - ph * 330, br = 3 + (i % 3) * 2;
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(bx - br * .35, by - br * .35, br * .3, 0, TAU); g.fill(); }
    const since = md(T - ((cur - 1 + 3) % 3) * D - 1.62, D * 3); title(g, cur, since, W);
    if (!covered && liquid(tau, BW * XS[k], FL[nk].c)) { g.imageSmoothingEnabled = true; g.drawImage(cv, 0, 0, BW, BH, 0, 0, W, H); }
    g.fillStyle = rad(g, 150, 60, 10, 380, [[0, 'rgba(255,255,255,.16)'], [1, 'rgba(0,0,0,.12)']]); g.fillRect(0, 0, W, H);
  };
}
// ======================= Partículas generativas: fluxo que vira palavra e explode =======================
{
  const N = 2400, WORD = 'FUTURO', FW = 560; let P = null, PK = '', GL = null, BUF = null, BASE = null, BX = null, IMG = null, U32 = null, B2 = null, B3 = null;
  const COLS = ['#3FE3FF', '#5B8CFF', '#A45CFF', '#FF4FD8'];
  function init() { const ok = document.fonts && document.fonts.check ? document.fonts.check('800 100px Syne') : true; const key = ok ? 'y' : 'n'; if (P && PK === key) return; PK = key;
    const c = document.createElement('canvas'); c.width = 480; c.height = 270; const x = c.getContext('2d'); let fs = 104; x.font = font(800, fs, F.display); const w = x.measureText(WORD).width; if (w > 410) fs *= 410 / w;
    x.font = font(800, fs, F.display); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(WORD, 240, 128);
    const d = x.getImageData(0, 0, 480, 270).data, pts = []; for (let y = 0; y < 270; y += 2) for (let xx = 0; xx < 480; xx += 2) if (d[(y * 480 + xx) * 4 + 3] > 140) pts.push([xx + .5, y + .5]);
    const q = rng(33); const tg = []; for (let i = 0; i < N; i++) { const p = pts[Math.floor(q() * pts.length)]; tg.push([p[0] + (q() - .5) * 1.6, p[1] + (q() - .5) * 1.6]); } tg.sort((a, b) => a[1] - b[1]);
    const y0 = []; for (let i = 0; i < N; i++) y0.push(10 + q() * 250); y0.sort((a, b) => a - b);
    P = []; for (let i = 0; i < N; i++) { const [tx, ty] = tg[i]; const a = Math.atan2(ty - 128, tx - 240) + (q() - .5) * .6;
      P.push({ x0: q() * FW, y0: y0[i], sp: q() < .25 ? 2 : 1, a1: 20 + q() * 10, p1: y0[i] * .021 + q() * .5, p2: y0[i] * .037 + q() * .5, tx, ty, st: clamp(tx / 480 * .75 + q() * .25), bx: Math.cos(a), by: Math.sin(a), bm: 60 + q() * 170, c: Math.min(3, Math.floor((y0[i] - 10) / 250 * 4 + (q() - .5) * .6 + 0)) | 0, j: q() * TAU }); }
    P.forEach((p) => { p.c = clamp(p.c, 0, 3); });
    GL = document.createElement('canvas'); GL.width = 960; GL.height = 540; const gg = GL.getContext('2d'); gg.scale(2, 2); gg.font = font(800, fs, F.display); gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.shadowColor = 'rgba(90,170,255,1)'; gg.shadowBlur = 26; gg.fillStyle = 'rgba(120,190,255,.55)'; gg.fillText(WORD, 240, 128); gg.shadowBlur = 50; gg.fillText(WORD, 240, 128); }
  const flow = (p, t) => { const x = md(p.x0 + t * p.sp * FW / 8, FW) - 40, ph = t / 8 * TAU; return [x, p.y0 + p.a1 * Math.sin(x * .011 + p.p1 + ph) + p.a1 * .45 * Math.sin(x * .029 + p.p2 - 2 * ph)]; };
  function pos(p, t) { const f = flow(p, t);
    if (t < 1.9 || t >= 7.8) return f;
    if (t < 5.7) { const w = eio(seg(t, 1.9 + p.st * .9, 3.1 + p.st * .9)); const jx = Math.cos(t * 3 + p.j) * .7 * w, jy = Math.sin(t * 2.6 + p.j) * .7 * w; return [lerp(f[0], p.tx, w) + jx, lerp(f[1], p.ty, w) + jy]; }
    const e = ease(seg(t, 5.7, 6.5)), w2 = eio(seg(t, 5.9 + p.st * .5, 7.0 + p.st * .7)); const bx = p.tx + p.bx * p.bm * e, by = p.ty + p.by * p.bm * e * .7; return [lerp(bx, f[0], w2), lerp(by, f[1], w2)]; }

  R['particulas-generativo'] = (g, t, W, H) => {
    init(); const p = t % 8;
    // partículas rasterizadas à mão num buffer 480×270 (soma aditiva), depois ampliado + bloom barato
    if (!BUF) { BUF = document.createElement('canvas'); BUF.width = 480; BUF.height = 270; BX = BUF.getContext('2d'); IMG = BX.createImageData(480, 270); U32 = new Uint32Array(IMG.data.buffer);
      B2 = document.createElement('canvas'); B2.width = 240; B2.height = 135; B3 = document.createElement('canvas'); B3.width = 120; B3.height = 68; }
    if (!BASE) { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const x = c.getContext('2d'); x.fillStyle = '#04050B'; x.fillRect(0, 0, 480, 270); x.fillStyle = rad(x, 240, 135, 10, 300, [[0, '#0E1230'], [1, 'rgba(4,5,11,0)']]); x.fillRect(0, 0, 480, 270);
      BASE = new Uint32Array(x.getImageData(0, 0, 480, 270).data.buffer.slice(0)); }
    U32.set(BASE); const D8 = IMG.data, dt = .16, sweep = p > 4.0 && p < 5.4 ? lerp(-40, 520, seg(p, 4.1, 5.3)) : -999, CC = COLS.map(hx);
    for (let i = 0; i < N; i++) { const q = P[i], a = pos(q, p), b = pos(q, p - dt < 0 ? p - dt + 8 : p - dt); if (Math.abs(a[0] - b[0]) > 120) continue;
      const white = Math.abs(q.tx - sweep) < 16, col = white ? [255, 255, 255] : CC[q.c], len = Math.hypot(a[0] - b[0], a[1] - b[1]), n = Math.min(14, 1 + len / 1.4 | 0);
      for (let k = 0; k < n; k++) { const u = k / n, x = a[0] + (b[0] - a[0]) * u | 0, y = a[1] + (b[1] - a[1]) * u | 0; if (x < 0 || y < 0 || x >= 480 || y >= 270) continue;
        const o = (y * 480 + x) * 4, it = (white ? .9 : .55) * (1 - u * .85); D8[o] += col[0] * it; D8[o + 1] += col[1] * it; D8[o + 2] += col[2] * it; D8[o + 3] = 255; } }
    BX.putImageData(IMG, 0, 0); const b2 = B2.getContext('2d'), b3 = B3.getContext('2d'); b2.drawImage(BUF, 0, 0, 240, 135); b3.drawImage(B2, 0, 0, 120, 68);
    BX.globalCompositeOperation = 'lighter'; BX.globalAlpha = .75; BX.drawImage(B3, 0, 0, 480, 270);
    const form = sst(3.0, 4.2, p) * (1 - sst(5.68, 5.8, p)); if (form > 0) { BX.globalAlpha = form * .55; BX.drawImage(GL, 0, 0, 480, 270); }
    const fl = seg(p, 5.7, 6.2); if (fl > 0 && fl < 1) { BX.globalAlpha = 1; BX.fillStyle = rad(BX, 240, 128, 0, 60 + 260 * ease(fl), [[0, `rgba(170,200,255,${.5 * (1 - fl)})`], [1, 'rgba(120,80,255,0)']]); BX.fillRect(0, 0, 480, 270); }
    BX.globalAlpha = 1; BX.globalCompositeOperation = 'source-over'; g.drawImage(BUF, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    type(g, 'INSTALAÇÃO GENERATIVA', 18, 24, { f: font(500, 14, F.mono), fill: 'rgba(190,210,255,.7)', align: 'left', track: 2 });
    type(g, `${(N / 1000).toFixed(1).replace('.', ' ')}00 PARTÍCULAS`, 462, 250, { f: font(500, 14, F.mono), fill: 'rgba(190,210,255,.55)', align: 'right', track: 1 });
  };
}
// ======================= Loop geométrico: Truchet que gira em onda, com lente invertida =======================
{
  const C = 40, COLS = 13, ROWS = 8, BW = C * .36; let O = null;
  const sine = (x) => (1 - Math.cos(Math.PI * clamp(x))) / 2;
  R['loop-geometrico'] = (g, t, W, H) => {
    if (!O) { const q = rng(12); O = []; for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) O.push(q() < .5 ? 0 : 1); }
    const p = t % 6, INK = '#111216', PAPER = '#F2ECDF', ACC = '#FF5B2E';
    const lx = 240 + 92 * Math.sin(p / 6 * TAU), ly = 135 + 34 * Math.sin(2 * p / 6 * TAU), lr = 74 + 8 * Math.sin(p / 3 * TAU);
    const tiles = []; for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const x = i * C, y = j * C - 5, d = Math.hypot(x - 240, y - 135) / C;
      const f1 = sine((p - .1 - d * .3) / .55), f2 = sine((p - 3.1 - d * .3) / .55), a = (O[j * COLS + i] + f1 + f2) * Math.PI / 2, mid = Math.sin(Math.PI * f1) + Math.sin(Math.PI * f2);
      tiles.push([x, y, a, mid]); }
    const draw = (fg, flip, accent) => { g.lineCap = 'butt'; g.lineWidth = BW; const plain = new Path2D(), hot = [new Path2D(), new Path2D(), new Path2D()];
      for (const [x, y, a0, mid] of tiles) { const a = a0 + (flip ? Math.PI / 2 : 0), ca = Math.cos(a), sa = Math.sin(a), h = C / 2;
        const lvl = accent ? (mid > .8 ? 2 : mid > .45 ? 1 : mid > .15 ? 0 : -1) : -1, P = lvl < 0 ? plain : hot[lvl];
        const c1x = x + (-h) * ca - (-h) * sa, c1y = y + (-h) * sa + (-h) * ca, c2x = x + h * ca - h * sa, c2y = y + h * sa + h * ca;
        P.moveTo(c1x + Math.cos(a) * h, c1y + Math.sin(a) * h); P.arc(c1x, c1y, h, a, a + Math.PI / 2);
        P.moveTo(c2x + Math.cos(a + Math.PI) * h, c2y + Math.sin(a + Math.PI) * h); P.arc(c2x, c2y, h, a + Math.PI, a + Math.PI * 1.5); }
      g.strokeStyle = fg; g.stroke(plain); [.3, .6, 1].forEach((k, l) => { g.strokeStyle = mixc(fg === INK ? '#111216' : '#F2ECDF', ACC, k); g.stroke(hot[l]); }); };
    g.fillStyle = INK; g.fillRect(0, 0, W, H); draw(PAPER, false, true);
    g.save(); g.beginPath(); g.arc(lx, ly, lr, 0, TAU); g.clip(); g.fillStyle = PAPER; g.fillRect(lx - lr, ly - lr, lr * 2, lr * 2); draw(INK, true, false); g.restore();
    g.strokeStyle = ACC; g.lineWidth = 3; g.beginPath(); g.arc(lx, ly, lr, 0, TAU); g.stroke();
  };
}
// ======================= Visualizador de áudio: podcast com espectro circular e legenda sincronizada =======================
{
  const LINES = [[['Toda', .25, 2], ['boa', .9, 2], ['história', 1.5, 4], ['começa', 2.7, 3]], [['com', 4.25, 1], ['uma', 4.6, 2], ['só', 5.25, 1], ['voz.', 5.8, 2]]];
  const SYL = .19, CY = 108, NB = 30;
  const voice = (t) => { let v = 0; LINES.forEach((L) => L.forEach(([, s, n]) => { for (let k = 0; k < n; k++) { const u = (t - s - k * SYL) / SYL; if (u > 0 && u < 1) v = Math.max(v, Math.sin(Math.PI * u) ** 1.5 * (.75 + .25 * Math.sin(k * 2.1 + s))); } })); return v; };
  const coverC = () => cached('g4-cover', 200, 200, (c) => { c.scale(2, 2); c.beginPath(); c.arc(50, 50, 48, 0, TAU); c.clip();
    c.fillStyle = lin(c, 0, 0, 100, 100, [[0, '#FF3FD0'], [1, '#5A2BFF']]); c.fillRect(0, 0, 100, 100);
    const sil = (dx, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(50 + dx, 40, 16, 19, 0, 0, TAU); c.fill(); c.fillRect(44 + dx, 52, 12, 14); c.beginPath(); c.ellipse(50 + dx, 92, 36, 30, 0, 0, TAU); c.fill(); };
    sil(-2.5, '#5FF3FF'); sil(0, '#150C33'); c.fillStyle = rad(c, 30, 20, 0, 70, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, 100, 100); });

  R['visualizador-audio'] = (g, t, W, H) => {
    const p = t % 8, bt = p % .5, kick = Math.exp(-bt * 9), hat = Math.exp(-md(p - .25, .5) * 22), sn = Math.floor(p / .5) % 2 ? Math.exp(-bt * 12) : 0, vo = voice(p);
    g.fillStyle = '#07061A'; g.fillRect(0, 0, W, H);
    g.fillStyle = rad(g, 240, CY, 20, 240, [[0, `rgba(160,40,200,${.28 + .22 * kick})`], [1, 'rgba(7,6,26,0)']]); g.fillRect(0, 0, W, H);
    // ondas horizontais (plano médio)
    const amp = 4 + 16 * vo + 7 * kick; g.lineWidth = 2; for (let l = 0; l < 3; l++) { g.strokeStyle = l === 0 ? 'rgba(80,235,255,.75)' : `rgba(${l === 1 ? '255,80,220' : '120,110,255'},.4)`; g.beginPath();
      for (let x = 8; x <= 472; x += 4) { const dc = Math.abs(x - 240); if (dc < 96) { if (x < 240 && x + 4 >= 144) { g.moveTo(336, CY); x = 336; } continue; } const env = Math.sin(clamp((dc - 96) / 136) * Math.PI);
        const y = CY + env * amp * (Math.sin(x * .07 - p * 13 + l * 1.7) * .7 + Math.sin(x * .19 + p * 7 + l) * .3); x <= 8 || x === 336 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    // espectro circular espelhado
    const s = 1 + .05 * kick, R0 = 54 * s, cg = g.createConicGradient ? g.createConicGradient(-Math.PI / 2, 240, CY) : null;
    if (cg) { cg.addColorStop(0, '#3FF0FF'); cg.addColorStop(.5, '#FF3FD0'); cg.addColorStop(1, '#3FF0FF'); }
    const bars = new Path2D(); for (let i = 0; i < NB; i++) { const b = i / NB, v = clamp(kick * Math.exp(-b * 5) * .95 + vo * (.7 * Math.exp(-(((b - .32) / .17) ** 2)) + .35 * Math.exp(-(((b - .62) / .18) ** 2))) * (.75 + .25 * noise(i * .7 + p * 9, 3)) + (hat + sn * .6) * sst(.6, 1, b) * .5 + .05 + .03 * noise(i + p * 5, 1));
      const L = 3 + Math.pow(clamp(v * 1.25), .8) * 56; [1, -1].forEach((sg) => { const a = -Math.PI / 2 + sg * (i + .5) / NB * Math.PI, c = Math.cos(a), si = Math.sin(a); bars.moveTo(240 + c * R0, CY + si * R0); bars.lineTo(240 + c * (R0 + L), CY + si * (R0 + L)); }); }
    g.lineCap = 'round'; g.strokeStyle = cg || '#3FF0FF'; g.globalAlpha = .2 + .15 * kick; g.lineWidth = 10; g.stroke(bars); g.globalAlpha = 1; g.lineWidth = 4; g.stroke(bars);
    // capa (foto do convidado) pulsando no bumbo + anel de progresso
    g.save(); g.translate(240, CY); g.scale(s, s); g.fillStyle = `rgba(255,63,208,${.35 + .4 * kick})`; g.beginPath(); g.arc(0, 0, 49, 0, TAU); g.fill(); g.drawImage(coverC(), -48, -48, 96, 96);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 47, 0, TAU); g.stroke(); g.strokeStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, 47, -Math.PI / 2, -Math.PI / 2 + TAU * (p / 8)); g.stroke(); g.restore();
    // legenda palavra a palavra
    const li = p < 4 ? 0 : 1, L = LINES[li], lt = p - li * 4, lin_ = seg(lt, 0, .22), lout = seg(lt, 3.78, 4); g.font = font(800, 24, F.grot); if ('letterSpacing' in g) g.letterSpacing = '0px';
    const ws = L.map(([w]) => g.measureText(w).width), gap = 9, tot = ws.reduce((a, b) => a + b, 0) + gap * (L.length - 1); let x = 240 - tot / 2; const yy = 226;
    g.save(); g.beginPath(); g.rect(0, yy - 20, W, 40); g.clip(); const oy = (1 - ease(lin_)) * 30 - eio(lout) * 30;
    L.forEach(([w, st, n], k) => { const dur = n * SYL, on = p >= st && p < st + dur + .12, past = p >= st + dur + .12, pop = on ? 1 + .1 * (1 - spr(seg(p, st, st + .3))) : 1;
      g.save(); g.translate(x + ws[k] / 2, yy + oy); g.scale(pop, pop); if (on) { g.fillStyle = 'rgba(63,240,255,.16)'; g.beginPath(); g.roundRect(-ws[k] / 2 - 5, -16, ws[k] + 10, 32, 6); g.fill(); }
      type(g, w, 0, 0, { f: font(800, 24, F.grot), fill: on ? '#3FF0FF' : past ? '#FFFFFF' : 'rgba(255,255,255,.32)' }); g.restore(); x += ws[k] + gap; }); g.restore();
    // sobretítulo
    g.fillStyle = '#FF3B5C'; g.beginPath(); g.arc(22, 24, 4, 0, TAU); g.fill(); type(g, 'PODCAST · EP. 42', 34, 24, { f: font(600, 14, F.mono), fill: 'rgba(230,225,255,.85)', align: 'left', track: 2 });
  };
}
})();
