// Grupo 1 — Ilustração 2D: vetor-chapado, quadro-a-quadro, animacao-de-linha, isometrico,
// ilustracao-texturizada, whiteboard, quadrinho-hq, blueprint.
(() => {
  // ---------- utilitários locais ----------
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ein = (x) => { x = clamp(x); return x * x * x; };
  const circ = (g, x, y, r) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); };
  const ell = (g, x, y, rx, ry, a = 0) => { g.moveTo(x + rx * Math.cos(a), y + rx * Math.sin(a)); g.ellipse(x, y, rx, ry, a, 0, TAU); };
  const path = (g, pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); };
  const fillP = (g, pts, c) => { path(g, pts); g.fillStyle = c; g.fill(); };
  const mkPath = (pts) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, L, len: L[L.length - 1] }; };
  // desenha o trecho [a,b] (frações do comprimento) de um caminho; devolve o ponto final
  function trace(g, P, a, b) {
    const { pts, L, len } = P, A = len * clamp(a), B = len * clamp(b); if (B - A < .01) return null;
    const at = (d, j) => { const k = (d - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]); return [lerp(pts[j - 1][0], pts[j][0], k), lerp(pts[j - 1][1], pts[j][1], k)]; };
    let i = 1; while (i < pts.length - 1 && L[i] < A) i++;
    const s = at(A, i); g.beginPath(); g.moveTo(s[0], s[1]); let e = s;
    for (; i < pts.length; i++) { if (L[i] >= B) { e = at(B, i); g.lineTo(e[0], e[1]); break; } g.lineTo(pts[i][0], pts[i][1]); e = pts[i]; }
    return e;
  }
  const pointAt = (P, f) => { const d = P.len * clamp(f); let j = 1; while (j < P.pts.length - 1 && P.L[j] < d) j++; const k = (d - P.L[j - 1]) / Math.max(1e-6, P.L[j] - P.L[j - 1]); return [lerp(P.pts[j - 1][0], P.pts[j][0], k), lerp(P.pts[j - 1][1], P.pts[j][1], k)]; };
  function resample(pts, n) { const P = mkPath(pts), out = []; for (let k = 0; k < n; k++) out.push(pointAt(P, k / (n - 1))); return out; }
  const bez = (o, p0, p1, p2, p3, n = 14) => { for (let i = 1; i <= n; i++) { const s = i / n, u = 1 - s; o.push([u * u * u * p0[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s * s * s * p3[0], u * u * u * p0[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s * s * s * p3[1]]); } return o; };
  const arcP = (o, cx, cy, r, a0, a1, n = 24) => { for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
  const dotTile = (col, step, r, key) => cached(key, step * 2, step * 2, (c) => { c.fillStyle = col; c.beginPath(); c.arc(step * .5, step * .5, r * 2, 0, TAU); c.arc(step * 1.5, step * 1.5, r * 2, 0, TAU); c.fill(); });
  const dotPat = (g, col, step, r) => { const pt = g.createPattern(dotTile(col, step, r, `g1dot${col}${step}${r}`), 'repeat'); pt.setTransform(new DOMMatrix().scale(.5)); return pt; };

  // =====================================================================
  // 1. VETOR CHAPADO — explainer flat: gráfico que cresce em cascata com "pop"
  // =====================================================================
  R['vetor-chapado'] = (g, t, W, H) => {
    const D = 7, p = t % D;
    const INK = '#241C66', CORAL = '#FF6B6B', CORAL2 = '#E04E62', SUN = '#FFC83D', SUN2 = '#F2A12E', MINT = '#2EE6B6', MINT2 = '#13C497', SKIN = '#FFB59C', SKIN2 = '#F29079', SCR = '#F7F5FF';
    const pop = (t0, d = .55) => { const k = seg(p, t0, t0 + d); return k <= 0 ? 0 : spr(k); };
    const out = (t0, d = .26) => 1 - ein(seg(p, t0, t0 + d));
    const burst = (x, y, k, r0, col) => { if (k <= 0 || k >= 1) return; g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 3 * (1 - k) + .8; g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU - .4, ra = r0 + 22 * ease(k), rb = r0 + 6 + 16 * ease(Math.min(1, k * 1.7)); if (rb - ra < .3) continue; g.moveTo(x + Math.cos(a) * ra, y + Math.sin(a) * ra); g.lineTo(x + Math.cos(a) * rb, y + Math.sin(a) * rb); } g.stroke(); };
    const scaleAt = (x, y, s) => { g.translate(x, y); g.scale(s, s); g.translate(-x, -y); };

    // fundo: o único degradê (luz do alto à esquerda) + arcos de parede
    g.fillStyle = rad(g, 150, 20, 10, 470, [[0, '#8878F5'], [1, '#4A35C4']]); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.arc(309, 236, 196, Math.PI, TAU); g.fill();
    g.beginPath(); g.arc(309, 236, 156, Math.PI, TAU); g.fill();
    // janela redonda com céu (plano médio)
    const wx = 70, wy = 80, wr = 34;
    g.fillStyle = '#A396FA'; g.beginPath(); circ(g, wx, wy, wr + 8); g.fill();
    g.fillStyle = '#6E5CDD'; g.beginPath(); g.arc(wx, wy, wr + 8, .25 * Math.PI, 1.25 * Math.PI); g.fill();
    g.save(); g.beginPath(); circ(g, wx, wy, wr); g.clip();
    g.fillStyle = '#9FE9FF'; g.fillRect(wx - wr, wy - wr, 2 * wr, 2 * wr);
    g.fillStyle = '#FFE08A'; g.beginPath(); circ(g, wx + 11, wy - 9, 11); g.fill();
    const cloud = (x, y, s) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x - 20 * s, y - 5 * s, 40 * s, 12 * s, 6 * s); circ(g, x - 5 * s, y - 5 * s, 9 * s); circ(g, x + 8 * s, y - 3 * s, 6 * s); g.fill(); };
    const u = p / D; cloud(wx - 62 + u * 132, wy + 6, 1); cloud(wx - 62 + ((u + .5) % 1) * 132, wy + 21, .7);
    g.fillStyle = 'rgba(255,255,255,.4)'; path(g, [[wx - wr, wy + 2], [wx + 2, wy - wr], [wx + 13, wy - wr], [wx - wr, wy + 13]]); g.fill();
    g.restore();
    // chão
    g.fillStyle = '#3A28A8'; g.fillRect(0, 222, W, 48); g.fillStyle = '#4533BB'; g.fillRect(0, 222, W, 4);

    // tela (sujeito): pé, sombra de contato, moldura
    const bx = 196, by = 46, bw = 226, bh = 140;
    g.fillStyle = 'rgba(22,12,80,.45)'; g.beginPath(); ell(g, 309, 224, 46, 6); g.fill();
    g.fillStyle = INK; g.fillRect(303, by + bh, 12, 222 - by - bh); g.beginPath(); g.roundRect(281, 215, 56, 9, 4.5); g.fill();
    g.beginPath(); g.roundRect(bx - 8, by - 8, bw + 16, bh + 16, 16); g.fill();
    g.fillStyle = SCR; g.beginPath(); g.roundRect(bx, by, bw, bh, 9); g.fill();
    g.save(); g.beginPath(); g.roundRect(bx, by, bw, bh, 9); g.clip();
    g.fillStyle = '#ECE8FF'; g.fillRect(bx, by, bw, 36);
    type(g, 'Vendas por mês', bx + 16, by + 19, { f: font(700, 15, F.grot), fill: INK, align: 'left' });
    const base = by + bh - 26;
    g.fillStyle = '#DCD6FF'; g.fillRect(bx + 18, base, bw - 36, 2);
    const bars = [[26, CORAL, CORAL2], [40, SUN, SUN2], [54, MINT, MINT2], [70, CORAL, CORAL2]], tops = [];
    bars.forEach(([h, c, c2], i) => {
      const t0 = .7 + i * .18, k = seg(p, t0, t0 + .6), s = (k <= 0 ? 0 : spr(k)) * out(6.0 + (3 - i) * .07);
      const x = bx + 32 + i * 44, w = 30, hh = h * s; tops.push([x + w / 2, base - h]);
      if (hh > .5) { g.fillStyle = c2; g.beginPath(); g.roundRect(x, base - hh, w, hh, [8, 8, 0, 0]); g.fill(); g.fillStyle = c; g.beginPath(); g.roundRect(x, base - hh, w - 10, hh, [8, 0, 0, 0]); g.fill(); }
      burst(x + w / 2, base - h - 6, seg(p, t0 + .12, t0 + .6), 5, c2);
    });
    ['Jan', 'Fev', 'Mar', 'Abr'].forEach((m, i) => { const k = seg(p, .75 + i * .18, 1.0 + i * .18) * out(6.0 + (3 - i) * .07); if (k > 0) type(g, m, bx + 42 + i * 44, base + 11 + (1 - ease(k)) * 6, { f: font(600, 14, F.grot), fill: `rgba(36,28,102,${.55 * ease(k)})` }); });
    // linha de meta (tracejada) que a última barra ultrapassa
    const mk = ease(seg(p, 4.2, 4.7)) * out(5.95);
    if (mk > 0) { const my = base - 46, ms = spr(seg(p, 4.15, 4.6)); g.save(); scaleAt(bx + 36, my - 10, ms); type(g, 'meta', bx + 20, my - 10, { f: font(800, 14, F.grot), fill: CORAL2, align: 'left' }); g.restore(); g.strokeStyle = CORAL2; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(bx + 20, my); g.lineTo(bx + 20 + (bw - 40) * mk, my); g.stroke(); g.setLineDash([]); }
    const tf = ease(seg(p, 1.75, 2.3)) * (1 - ein(seg(p, 5.9, 6.12)));
    if (tf > 0) {
      const pts = tops.map(([x, y], i) => [x, y - 12 - i * 2]); pts[3] = [pts[3][0] + 18, pts[3][1] + 2];
      const P = mkPath(pts); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
      const e = trace(g, P, 0, tf); if (e) g.stroke();
      pts.slice(0, 3).forEach(([x, y], i) => { if (P.L[i] <= P.len * tf) { g.fillStyle = '#fff'; g.beginPath(); circ(g, x, y, 4.5); g.fill(); g.lineWidth = 2.5; g.stroke(); } });
      if (tf > .97) { const [x1, y1] = pts[3], [x0, y0] = pts[2], a = Math.atan2(y1 - y0, x1 - x0); g.save(); g.translate(x1, y1); g.rotate(a); g.fillStyle = INK; path(g, [[4, 0], [-8, -7], [-8, 7]]); g.fill(); g.restore(); }
    }
    g.restore();
    // selo "+48%" (detalhe que fura a moldura)
    const ck = pop(2.3, .6) * out(5.85);
    if (ck > 0) {
      const cx = 376, cy = 52 + Math.sin(p * 2.6) * 2;
      g.save(); scaleAt(cx + 24, cy + 22, ck);
      g.fillStyle = CORAL2; path(g, [[cx + 10, cy + 10], [cx + 26, cy + 22], [cx + 24, cy + 10]]); g.fill();
      g.fillStyle = CORAL; g.beginPath(); g.roundRect(cx - 40, cy - 16, 80, 32, 16); g.fill();
      type(g, '+48%', cx, cy + 1, { f: font(800, 19, F.grot), fill: '#fff' });
      g.restore();
    }
    burst(376, 52, seg(p, 2.38, 2.9), 34, '#fff');

    // personagem (olhos-ponto, membros alongados)
    const hk = seg(p, 3.22, 3.7), lift = Math.sin(Math.PI * hk) * 15;
    const sq = 1 - .07 * Math.sin(Math.PI * seg(p, 3.04, 3.22)) - .09 * Math.sin(Math.PI * seg(p, 3.7, 3.92));
    const cx = 118, fy = 222 - lift;
    g.fillStyle = 'rgba(22,12,80,.45)'; g.beginPath(); ell(g, cx, 224, 30 - lift * .7, 5); g.fill();
    g.save(); g.translate(cx, fy); g.scale(2 - sq, sq);
    const tuck = lift * .35;
    g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(-8, -56); g.lineTo(-9, -7 - tuck); g.moveTo(8, -56); g.lineTo(10, -7 - tuck); g.stroke();
    g.fillStyle = CORAL; g.beginPath(); g.roundRect(-19, -10 - tuck, 15, 9, 4.5); g.roundRect(5, -10 - tuck, 18, 9, 4.5); g.fill();
    g.strokeStyle = SKIN2; g.lineWidth = 8; g.beginPath(); g.moveTo(-15, -100); g.quadraticCurveTo(-27, -82, -24, -64); g.stroke();
    g.fillStyle = SUN; g.beginPath(); g.roundRect(-22, -116, 44, 66, [18, 18, 8, 8]); g.fill();
    g.save(); g.clip(); g.fillStyle = SUN2; g.fillRect(9, -120, 20, 80); g.restore();
    const bob = Math.sin(p * 2.2) * 1.2;
    g.fillStyle = SKIN; g.fillRect(-4, -124, 8, 10);
    g.save(); g.translate(0, bob);
    g.fillStyle = SKIN; g.beginPath(); circ(g, 2, -138, 17); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(2, -140, 18, Math.PI, TAU); g.quadraticCurveTo(14, -148, 2, -146); g.quadraticCurveTo(-8, -140, -12, -126); g.quadraticCurveTo(-18, -132, -16, -140); g.fill();
    g.fillStyle = SKIN2; g.beginPath(); circ(g, -6, -134, 4); g.fill();
    g.fillStyle = INK; const blink = (p % 2.6) > 2.46;
    if (blink) { g.fillRect(7, -135, 5, 1.8); g.fillRect(14, -135, 5, 1.8); } else { g.beginPath(); circ(g, 9.5, -134, 2.3); circ(g, 16.5, -134, 2.3); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(13, -128, 4, .15 * Math.PI, .85 * Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,107,107,.6)'; g.beginPath(); circ(g, 20, -129, 3); g.fill();
    g.restore();
    const ak = eio(seg(p, .95, 1.35)) * (1 - eio(seg(p, 6.1, 6.5)));
    const hx = lerp(24, 72, ak), hy = lerp(-64, -128, ak) + Math.sin(p * 3) * ak * 1.5, ex = lerp(30, 44, ak), ey = lerp(-82, -106, ak);
    g.strokeStyle = SKIN; g.lineWidth = 8; g.beginPath(); g.moveTo(16, -102); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
    g.fillStyle = SUN; g.beginPath(); circ(g, 15, -103, 8); g.fill();
    g.fillStyle = SKIN; g.beginPath(); circ(g, hx, hy, 5.5); g.fill();
    g.restore();
    // balão com coração
    const bk = pop(2.75) * out(5.8);
    if (bk > 0) {
      const x = 164, y = 56; g.save(); scaleAt(x - 18, y + 20, bk);
      g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x - 22, y - 16, 44, 32, 12); g.moveTo(x - 14, y + 12); g.lineTo(x - 24, y + 24); g.lineTo(x - 4, y + 15); g.fill();
      const hs = 8 * (1 + .12 * Math.max(0, Math.sin(p * 9)));
      g.fillStyle = CORAL; g.beginPath(); g.moveTo(x, y + hs); g.bezierCurveTo(x - hs * 1.6, y - hs * .1, x - hs * .9, y - hs * 1.3, x, y - hs * .45); g.bezierCurveTo(x + hs * .9, y - hs * 1.3, x + hs * 1.6, y - hs * .1, x, y + hs); g.fill();
      g.restore();
    }
    burst(164, 56, seg(p, 2.82, 3.3), 26, '#fff');
    // primeiro plano: planta balançando
    const px = 452, py = 244;
    g.fillStyle = 'rgba(22,12,80,.5)'; g.beginPath(); ell(g, px, 259, 28, 5); g.fill();
    [[-1.0, 40], [-.45, 52], [.1, 48], [.65, 38]].forEach(([a, len], i) => {
      g.save(); g.translate(px, py - 30); g.rotate(a + Math.sin(p * TAU / D * 2 + i) * .06);
      g.fillStyle = MINT2; g.beginPath(); ell(g, 0, -len / 2, 11, len / 2); g.fill();
      g.fillStyle = MINT; g.beginPath(); g.ellipse(0, -len / 2, 11, len / 2, 0, Math.PI / 2, Math.PI * 1.5); g.fill();
      g.restore();
    });
    fillP(g, [[px - 21, py - 30], [px + 21, py - 30], [px + 16, py + 14], [px - 16, py + 14]], CORAL);
    fillP(g, [[px + 6, py - 30], [px + 21, py - 30], [px + 16, py + 14], [px + 4, py + 14]], CORAL2);
    g.fillStyle = CORAL; g.beginPath(); g.roundRect(px - 25, py - 38, 50, 11, 5); g.fill();
  };

  // =====================================================================
  // 2. QUADRO A QUADRO — bolota pula no caixote e volta (em twos, boil, smear, impacto)
  // =====================================================================
  R['quadro-a-quadro'] = (g, t, W, H) => {
    const D = 6, p = t % D, f = Math.floor(p * 12) % 72, q = f / 12, fr = Math.floor(t * 12);
    const LN = '#2A1810', BODY = '#FF6A3D', SHADE = '#CF4529', HI = '#FFA585', BELLY = '#FFD3AE', CREAM = '#FFF4E2';
    const GY = 224, CY = 180, AX = 140, BX = 338;
    const r = rng(fr * 7 + 11), J = (a = 1.4) => (r() - .5) * a;
    const bgc = cached('g1-cel-bg', 960, 540, (c) => {
      c.scale(2, 2);
      c.fillStyle = lin(c, 0, 0, 0, 210, [[0, '#FFC994'], [1, '#FFF0DA']]); c.fillRect(0, 0, 480, 270);
      c.fillStyle = 'rgba(255,248,232,.55)'; c.beginPath(); c.arc(92, 64, 38, 0, TAU); c.fill(); c.fillStyle = '#FFF7EA'; c.beginPath(); c.arc(92, 64, 25, 0, TAU); c.fill();
      const cl = (x, y, s) => { c.fillStyle = '#FFF4E6'; c.beginPath(); c.roundRect(x - 34 * s, y - 6 * s, 68 * s, 14 * s, 7 * s); c.moveTo(x, y); c.arc(x - 10 * s, y - 6 * s, 13 * s, 0, TAU); c.moveTo(x, y); c.arc(x + 12 * s, y - 4 * s, 9 * s, 0, TAU); c.fill(); c.fillStyle = '#F8D9BD'; c.fillRect(x - 30 * s, y + 4 * s, 60 * s, 4 * s); };
      cl(210, 58, 1); cl(400, 86, .75);
      c.fillStyle = '#F2B78E'; c.beginPath(); c.moveTo(0, 196); c.bezierCurveTo(70, 150, 150, 156, 220, 186); c.bezierCurveTo(290, 150, 390, 128, 480, 168); c.lineTo(480, 270); c.lineTo(0, 270); c.fill();
      c.fillStyle = '#E8A27B'; c.beginPath(); c.moveTo(0, 212); c.bezierCurveTo(120, 180, 230, 196, 300, 206); c.bezierCurveTo(370, 190, 430, 186, 480, 196); c.lineTo(480, 270); c.lineTo(0, 270); c.fill();
      c.fillStyle = '#A9C96C'; c.beginPath(); c.moveTo(0, 216); c.bezierCurveTo(160, 210, 320, 222, 480, 214); c.lineTo(480, 270); c.lineTo(0, 270); c.fill();
      c.fillStyle = '#95B85A'; c.fillRect(0, 244, 480, 26);
      c.fillStyle = 'rgba(80,60,20,.25)'; c.beginPath(); c.ellipse(339, 225, 48, 5, 0, 0, TAU); c.fill();
      // caixote (cel de cenário): face, topo, sombra em recorte, tábuas
      c.fillStyle = '#D38D4E'; c.fillRect(300, 184, 78, 40); c.fillStyle = '#EDB277'; c.fillRect(300, 180, 78, 6);
      c.fillStyle = '#A8683A'; c.fillRect(362, 186, 16, 38); c.fillRect(300, 216, 78, 8);
      c.strokeStyle = LN; c.lineWidth = 2.6; c.lineJoin = 'round'; c.strokeRect(300, 180, 78, 44);
      c.lineWidth = 2; c.beginPath(); c.moveTo(300, 186); c.lineTo(378, 186); c.moveTo(300, 200); c.lineTo(378, 200); c.moveTo(304, 222); c.lineTo(374, 188); c.stroke();
    });
    const shake = f === 20 || f === 21 || f === 56 || f === 57;
    if (shake) { const sr = rng(fr * 3 + 1); g.save(); g.translate(240, 135); g.scale(1.03, 1.03); g.translate(-240 + (sr() - .5) * 7, -135 + (sr() - .5) * 7); }
    g.drawImage(bgc, 0, 0, W, H);

    // ---------- pose por desenho (12/s) ----------
    let x = AX, y = GY, sx = 1, sy = 1, rot = 0, look = 1, eyes = 'open', mouth = 'smile', arms = 'down', ant = 0, smear = null, land = null, lift = null;
    const arc = (k, x0, y0, x1, y1, hh) => [lerp(x0, x1, k), lerp(y0, y1, k) - hh * 4 * k * (1 - k)];
    const breathe = () => { sy = 1 + .035 * Math.sin(q * 7); sx = 2 - sy; };
    const settle = (k) => { const s = Math.exp(-5 * k) * Math.cos(13 * k); sy = 1 - .36 * s; sx = 1 + .32 * s; ant = 12 * Math.exp(-4 * k) * Math.sin(16 * k + 1.2); };
    if (f < 7) { breathe(); if (f >= 4 && f <= 5) eyes = 'shut'; }
    else if (f < 12) { const k = eio((f - 7) / 4); sy = 1 - .3 * k; sx = 1 + .26 * k; rot = -.1 * k; eyes = 'squint'; arms = 'back'; ant = 7 * k; }
    else if (f < 19) { const k = (f - 12) / 7; [x, y] = arc(k, AX, GY, BX, CY, 104); const v = Math.abs(1 - 2 * k); sy = 1 + .5 * v * v * v; sx = 1 / Math.sqrt(sy); rot = TAU * eio(seg(k, .2, .8)); arms = 'up'; ant = -9 * (1 - 2 * k); smear = [k, AX, GY, BX, CY, 104]; if (f < 15) lift = [AX, GY, (f - 12) / 3]; }
    else if (f < 28) { x = BX; y = CY; settle((f - 19) / 9); land = [BX, CY, (f - 19) / 8]; eyes = f < 21 ? 'shut' : 'open'; }
    else if (f < 38) { x = BX; y = CY; breathe(); sy += .05 * Math.sin((f - 28) / 10 * TAU * 2); arms = 'cheer'; mouth = 'open'; eyes = 'happy'; }
    else if (f < 42) { x = BX; y = CY; look = 1 - 2 * (f - 38) / 3; breathe(); sy -= .04; }
    else if (f < 48) { x = BX; y = CY; look = -1; const k = eio((f - 42) / 5); sy = 1 - .28 * k; sx = 1 + .24 * k; rot = .1 * k; eyes = 'squint'; arms = 'back'; ant = 7 * k; }
    else if (f < 55) { look = -1; const k = (f - 48) / 7; [x, y] = arc(k, BX, CY, AX, GY, 62); const v = Math.abs(1 - 2 * k); sy = 1 + .45 * v * v * v; sx = 1 / Math.sqrt(sy); arms = 'up'; ant = -9 * (1 - 2 * k); smear = [k, BX, CY, AX, GY, 62]; if (f < 51) lift = [BX, CY, (f - 48) / 3]; }
    else if (f < 64) { look = -1; settle((f - 55) / 9); land = [AX, GY, (f - 55) / 8]; eyes = f < 57 ? 'shut' : 'open'; }
    else if (f < 67) { look = -1 + 2 * (f - 64) / 2; breathe(); sy -= .04; }
    else breathe();
    look = clamp(look, -1, 1);
    const impact = f === 19 || f === 55;

    const bp = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, s = Math.sin(a); bp.push([Math.cos(a) * 28 * (s > 0 ? 1 + .1 * s : 1) + J(), -40 + s * 31 + J()]); }
    const bodyPath = () => path(g, bp);
    const drawChar = (sil) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (sil) { bodyPath(); g.fillStyle = CREAM; g.fill(); g.beginPath(); ell(g, -12, -4, 9, 5); ell(g, 12, -4, 9, 5); g.fill(); return; }
      // pés
      g.fillStyle = BODY; g.strokeStyle = LN; g.lineWidth = 2.6; g.beginPath(); ell(g, -12 + look * 2 + J(.6), -4, 9, 5); g.fill(); g.stroke(); g.beginPath(); ell(g, 12 + look * 2 + J(.6), -4, 9, 5); g.fill(); g.stroke();
      // antena (follow-through)
      const tx = look * 7 + ant * .8, ty = -94 + Math.abs(ant) * .5;
      g.strokeStyle = LN; g.lineWidth = 3; g.beginPath(); g.moveTo(look * 4, -70); g.quadraticCurveTo(look * 5 + ant * .2 + J(), -84, tx, ty); g.stroke();
      g.fillStyle = '#FFD23F'; g.lineWidth = 2.4; g.beginPath(); circ(g, tx, ty, 5); g.fill(); g.stroke();
      // corpo com sombra em recorte
      bodyPath(); g.fillStyle = BODY; g.fill();
      g.save(); bodyPath(); g.clip();
      g.fillStyle = BELLY; g.beginPath(); ell(g, look * 5, -26, 17, 12); g.fill();
      g.fillStyle = SHADE; g.beginPath(); g.rect(-60, -110, 120, 120); ell(g, -6, -45, 26, 29); g.fill('evenodd');
      g.fillStyle = HI; g.beginPath(); ell(g, -13, -58, 7, 4.5, -.6); g.fill();
      g.restore();
      g.strokeStyle = LN; g.lineWidth = 3; bodyPath(); g.stroke();
      // braços (macarrão)
      const A = { down: [[-25, -30], [-33, -12], [25, -30], [33, -12]], back: [[-25, -32], [-42, -22], [25, -32], [42, -22]], up: [[-22, -50], [-34, -80], [22, -50], [34, -80]], cheer: [[-22, -50], [-38, -82], [22, -50], [38, -86 + Math.sin(q * 22) * 7]] }[arms];
      g.lineWidth = 3.6; g.strokeStyle = LN;
      for (let i = 0; i < 2; i++) { const [s0, s1] = [A[i * 2], A[i * 2 + 1]], hx = s1[0] + look * 2 + J(), hy = s1[1] + J(); g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo((s0[0] + hx) / 2 + (i ? 6 : -6), (s0[1] + hy) / 2, hx, hy); g.stroke(); g.fillStyle = BODY; g.lineWidth = 2.4; g.beginPath(); circ(g, hx, hy, 4.5); g.fill(); g.stroke(); g.lineWidth = 3.6; }
      // olhos e boca
      g.lineWidth = 2.4;
      for (const sgn of [-1, 1]) {
        const ex = sgn * 9.5 + look * 6 + J(.5), ey = -50 + J(.5);
        if (eyes === 'open') { g.fillStyle = '#fff'; g.beginPath(); ell(g, ex, ey, 7, 9.5); g.fill(); g.stroke(); g.fillStyle = LN; g.beginPath(); circ(g, ex + look * 2.4, ey + 1, 3.6); g.fill(); g.fillStyle = '#fff'; g.beginPath(); circ(g, ex + look * 2.4 - 1.2, ey - .6, 1.1); g.fill(); }
        else if (eyes === 'shut') { g.beginPath(); g.arc(ex, ey - 2, 6, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
        else if (eyes === 'happy') { g.beginPath(); g.arc(ex, ey + 3, 6, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
        else { g.beginPath(); g.moveTo(ex - 6 * sgn, ey - 5); g.lineTo(ex + 3 * sgn, ey); g.lineTo(ex - 6 * sgn, ey + 4); g.stroke(); }
      }
      const mx = look * 7;
      if (mouth === 'open') { g.fillStyle = '#7A1E14'; g.beginPath(); g.arc(mx, -36, 8.5, 0, Math.PI); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#FF8C8C'; g.beginPath(); g.arc(mx, -30, 4, Math.PI, TAU); g.fill(); }
      else { g.beginPath(); g.arc(mx, -38, 6, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
    };
    const place = (sil) => { g.save(); g.translate(x, y); g.translate(0, -40); g.rotate(rot); g.translate(0, 40); g.scale(sx, sy); drawChar(sil); g.restore(); };

    if (impact) { // quadro de impacto: negativo chapado, um desenho só
      const ix = f === 19 ? BX : AX, iy = f === 19 ? CY : GY;
      bg(g, W, H, '#1D120C'); g.fillStyle = '#FFE2A8'; g.beginPath();
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + .1; g.moveTo(ix, iy); g.lineTo(ix + Math.cos(a - .05) * 600, iy + Math.sin(a - .05) * 600); g.lineTo(ix + Math.cos(a + .05) * 600, iy + Math.sin(a + .05) * 600); } g.fill();
      place(true); return;
    }
    // sombra do personagem no chão/caixote
    const onCrate = x > 296 && x < 382 && y <= CY + 1, gy = onCrate ? CY : GY, hgt = Math.max(0, gy - y);
    if (!(x > 296 && x < 382 && y > CY + 1)) { g.fillStyle = 'rgba(80,50,20,.28)'; g.beginPath(); ell(g, x, gy + 1, Math.max(8, 30 * (1 - hgt / 180)), 4.5); g.fill(); }
    // smear (desenho esticado entre posições) + linhas de velocidade
    if (smear && smear[0] > .01 && (smear[0] <= .3 || smear[0] >= .7)) {
      const [k, x0, y0, x1, y1, hh] = smear, P = (kk) => { const [a, b] = arc(clamp(kk), x0, y0, x1, y1, hh); return [a, b - 40]; };
      const c0 = P(k), c1 = P(k - .09), c2 = P(k - .18), dx = c0[0] - c2[0], dy = c0[1] - c2[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      g.fillStyle = BODY; g.strokeStyle = LN; g.lineWidth = 2.6; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(c0[0] + nx * 24, c0[1] + ny * 24); g.quadraticCurveTo(c1[0] + nx * 13, c1[1] + ny * 13, c2[0] + J(2), c2[1] + J(2)); g.quadraticCurveTo(c1[0] - nx * 13, c1[1] - ny * 13, c0[0] - nx * 24, c0[1] - ny * 24); g.closePath(); g.fill(); g.stroke();
      g.lineWidth = 2.2; g.beginPath(); for (const o of [-16, 0, 16]) { const sx0 = c2[0] - dx / L * (8 + J(6)) + nx * o, sy0 = c2[1] - dy / L * 8 + ny * o; g.moveTo(sx0, sy0); g.lineTo(sx0 - dx / L * (26 + J(10)), sy0 - dy / L * 26); } g.stroke();
    }
    place(false);
    // poeira de pouso / decolagem (chapada, com contorno e boil)
    const puff = (px, py, rr) => { g.beginPath(); for (let a = 0; a < 9; a++) { const an = a / 9 * TAU, rd = rr * (1 + J(.3)); a ? g.lineTo(px + Math.cos(an) * rd, py + Math.sin(an) * rd) : g.moveTo(px + Math.cos(an) * rd, py + Math.sin(an) * rd); } g.closePath(); g.fillStyle = CREAM; g.fill(); g.strokeStyle = LN; g.lineWidth = 2; g.stroke(); };
    if (land && land[2] < 1) { const [lx, ly, k] = land; for (let i = 0; i < 6; i++) { const s = i < 3 ? -1 : 1, j = i % 3; puff(lx + s * (20 + (26 + j * 16) * ease(k)), ly - 4 - (3 + j * 7) * ease(k), (6 + j * 2.4) * Math.pow(1 - k, .6) + 1.5); }
      if (k < .25) { g.strokeStyle = LN; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; g.moveTo(lx + Math.cos(a) * 40, ly - 30 + Math.sin(a) * 34); g.lineTo(lx + Math.cos(a) * 54, ly - 30 + Math.sin(a) * 46); } g.stroke(); } }
    if (lift) { const [lx, ly, k] = lift; for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1; puff(lx + s * (16 + (i % 2) * 14 + 20 * ease(k)), ly - 3 - (i % 2) * 5, (6 - (i % 2)) * (1 - k * .7)); } }
    // estrelas da comemoração
    const star = (sx0, sy0, s, a0) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = a0 + i / 8 * TAU, rr = i % 2 ? s * .4 : s; g.lineTo(sx0 + Math.cos(a) * rr + J(.8), sy0 + Math.sin(a) * rr + J(.8)); } g.closePath(); g.fillStyle = '#FFD23F'; g.fill(); g.strokeStyle = LN; g.lineWidth = 2.2; g.stroke(); };
    [[BX - 54, CY - 98, 29], [BX + 52, CY - 106, 31], [BX + 2, CY - 136, 33]].forEach(([sx0, sy0, f0]) => { if (f >= f0 && f < 40) { const s = 11 * (f >= 37 ? (40 - f) / 3 : Math.min(1.2, spr((f - f0) / 3))); star(sx0, sy0, s, f * .35); } });
    // primeiro plano: tufos de grama (fervendo)
    // primeiro plano: moitas chapadas com luz em recorte (fervendo)
    const bush = (cs) => {
      const pts = []; cs.forEach(([bx0, by0, br0]) => { for (let a = 0; a < 16; a++) { const an = a / 16 * TAU; pts.push([bx0 + Math.cos(an) * (br0 + J(1.2)), by0 + Math.sin(an) * (br0 + J(1.2))]); } });
      g.fillStyle = '#5E9438'; g.strokeStyle = LN; g.lineWidth = 2.4;
      cs.forEach(([bx0, by0, br0], i) => { g.beginPath(); for (let a = 0; a < 16; a++) { const [X, Y] = pts[i * 16 + a]; a ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.stroke(); });
      cs.forEach(([bx0, by0, br0], i) => { g.beginPath(); for (let a = 0; a < 16; a++) { const [X, Y] = pts[i * 16 + a]; a ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.fill(); });
      g.fillStyle = '#86BD55'; cs.forEach(([bx0, by0, br0]) => { g.beginPath(); ell(g, bx0 - br0 * .3, by0 - br0 * .35, br0 * .5, br0 * .32, -.4); g.fill(); });
    };
    const sw = Math.sin(q * 2.4) * 1.5;
    bush([[8, 262, 22], [36, 256 + sw, 17], [60, 268, 13]]); bush([[474, 256, 24], [444, 264 - sw, 18], [420, 272, 12]]);
    if (shake) g.restore();
    filmGrain(g, W, H, t, .07);
  };

  // =====================================================================
  // 3. ANIMAÇÃO DE LINHA — um traço só: lâmpada que vira broto
  // =====================================================================
  let LS = null;
  const lineShapes = () => {
    if (LS) return LS;
    const B = 200, N = 200;
    const bulb = [[184, B], [222, B], [222, 193], [226, 190.5], [222, 188], [222, 184], [226, 181.5], [222, 179], [222, 173]];
    bez(bulb, [222, 173], [222, 168], [221, 166], [221.8, 161.6], 4);
    arcP(bulb, 240, 126, 40, Math.PI * .65, Math.PI * 2.35, 70);
    bez(bulb, [258.2, 161.6], [259, 166], [258, 168], [258, 173], 4);
    bulb.push([258, 179], [254, 181.5], [258, 184], [258, 188], [254, 190.5], [258, 193], [258, B], [296, B]);
    const pl = [[184, B], [221, B], [216, 165], [211, 165], [211, 158], [238, 158]];
    bez(pl, [238, 158], [238, 150], [239, 142], [239, 134]);
    bez(pl, [239, 134], [228, 137], [210, 130], [203, 113]);
    bez(pl, [203, 113], [220, 110], [234, 118], [239, 128]);
    bez(pl, [239, 128], [240, 122], [240, 116], [240, 110]);
    bez(pl, [240, 110], [250, 110], [266, 102], [275, 85]);
    bez(pl, [275, 85], [258, 86], [245, 96], [240, 106]);
    bez(pl, [240, 106], [240, 100], [241, 94], [241, 88]);
    bez(pl, [241, 88], [235, 82], [237, 75], [243, 72]);
    bez(pl, [243, 72], [247, 79], [244, 85], [241, 90]);
    bez(pl, [241, 90], [240, 110], [239, 130], [240, 158]);
    pl.push([269, 158], [269, 165], [264, 165], [259, B], [296, B]);
    const fil = [[234, 172], [234, 150], [236, 143], [240, 150], [244, 143], [246, 150], [246, 172]];
    LS = { bulb: resample(bulb, N), plant: resample(pl, N), fil: mkPath(fil) };
    return LS;
  };
  R['animacao-de-linha'] = (g, t, W, H) => {
    const D = 7, p = t % D, { bulb, plant, fil } = lineShapes(), INK = '#F3EAD7', ACC = '#F4B642', Z = 1.3;
    g.fillStyle = rad(g, 240, 120, 20, 330, [[0, '#1B2D42'], [1, '#0B1521']]); g.fillRect(0, 0, W, H);
    type(g, 'LINHA CONTÍNUA', 24, 30, { f: font(500, 14, F.mono), fill: 'rgba(243,234,215,.42)', align: 'left', track: 3 });
    g.lineCap = 'round'; g.lineJoin = 'round';
    const inst = (tau) => {
      const h = eio(seg(tau, 0, 1.4)), e = eio(seg(tau, 6.2, 7.6)); if (h <= 0 || e >= 1) return;
      const m = seg(tau, 3.6, 4.4), sw = Math.sin(tau * 2.3) * .06 * seg(tau, 4.3, 4.9);
      const n = bulb.length, pts = [[-80, 200]];
      for (let i = 0; i < n; i++) {
        const k = eio(clamp(m * 1.6 - i / n * .6)); let x = lerp(bulb[i][0], plant[i][0], k), y = lerp(bulb[i][1], plant[i][1], k);
        if (sw && y < 157) { const a = sw * (157 - y) / 80, dx = x - 240, dy = y - 157; x = 240 + dx * Math.cos(a) - dy * Math.sin(a); y = 157 + dx * Math.sin(a) + dy * Math.cos(a); }
        pts.push([x, y]);
      }
      pts.push([560, 200]);
      g.save(); g.translate(240, 210); g.scale(Z, Z); g.translate(-240, -200);
      g.strokeStyle = INK; g.lineWidth = 2.8 / Z;
      const end = trace(g, mkPath(pts), e, h); if (end) g.stroke();
      if (h < 1 && end) { g.fillStyle = ACC; g.beginPath(); circ(g, end[0], end[1], 3.8 / Z); g.fill(); }
      // acentos: filamento e raios (lâmpada), sol (broto)
      g.strokeStyle = ACC; g.lineWidth = 2.3 / Z;
      const fa = seg(tau, 1.2, 1.6) * (1 - seg(tau, 3.44, 3.62)); if (fa > 0 && trace(g, fil, 0, fa)) g.stroke();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * .52, k = ease(seg(tau, 1.45 + i * .07, 1.8 + i * .07)) * (1 - ein(seg(tau, 3.42, 3.62))); if (k <= 0) continue;
        const r0 = 51, r1 = r0 + 12 * k * (1 + .28 * Math.sin(tau * 4.5 + i)); g.beginPath(); g.moveTo(240 + Math.cos(a) * r0, 126 + Math.sin(a) * r0); g.lineTo(240 + Math.cos(a) * r1, 126 + Math.sin(a) * r1); g.stroke();
      }
      const sa = ease(seg(tau, 4.6, 5.1)) * (1 - ein(seg(tau, 6.1, 6.4)));
      if (sa > 0) { g.beginPath(); g.arc(314, 84 + Math.sin(tau * 2) * 1.5, 10, -Math.PI / 2, -Math.PI / 2 + TAU * sa); g.stroke(); }
      g.restore();
      const cap = (s, a, b) => {
        const kin = ease(seg(tau, a, a + .45)), kout = ein(seg(tau, b - .3, b)); if (kin <= 0 || kout >= 1) return;
        const fnt = font('italic 400', 22, F.serif); g.font = fnt; const w = g.measureText(s).width, x0 = 240 - w / 2 - 4;
        g.save(); g.beginPath(); g.rect(x0 + (w + 8) * kout, 222, (w + 8) * (kin - kout), 36); g.clip(); type(g, s, 240, 244, { f: fnt, fill: INK }); g.restore();
      };
      cap('uma ideia', 1.3, 3.72); cap('que cresce', 4.5, 6.25);
    };
    inst(p + D); inst(p);
  };

  // =====================================================================
  // 4. ISOMÉTRICO — bairro-maquete que sobe em cascata numa ilha flutuante
  // =====================================================================
  R['isometrico'] = (g, t, W, H) => {
    const D = 7, p = t % D, s = 21.5, kx = .866 * s, ky = .5 * s;
    g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#EEF1FF'], [1, '#C8D1F6']]); g.fillRect(0, 0, W, H);
    g.fillStyle = rad(g, 250, 120, 10, 260, [[0, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, W, H);
    const bob = Math.sin(p / D * TAU * 2) * 2.2, zm = 1 + .07 * eio(seg(p, 0, 6.3)) * (1 - eio(seg(p, 6.3, 7)));
    g.save(); g.translate(240, 140); g.scale(zm, zm); g.translate(-240, -140);
    contact(g, 240, 256, 136 - bob * 3, 11, .22);
    g.translate(0, bob);
    const ox = 240 - kx, oy = 146 - 7 * ky;
    const P = (x, y, z = 0) => [ox + (x - y) * kx, oy + (x + y) * ky - z * s];
    // laje
    const T = 1.1;
    fillP(g, [P(0, 6), P(8, 6), P(8, 6, -T), P(0, 6, -T)], '#9C84D8'); fillP(g, [P(8, 0), P(8, 6), P(8, 6, -T), P(8, 0, -T)], '#7560BD');
    fillP(g, [P(0, 6), P(8, 6), P(8, 6, -.2), P(0, 6, -.2)], '#6CC79A'); fillP(g, [P(8, 0), P(8, 6), P(8, 6, -.2), P(8, 0, -.2)], '#56AF86');
    fillP(g, [P(0, 0), P(8, 0), P(8, 6), P(0, 6)], '#A8E8C5');
    // anel viário, calçada, grade
    fillP(g, [P(1.4, 1.4), P(6.6, 1.4), P(6.6, 4.6), P(1.4, 4.6)], '#EEF1FA');
    g.fillStyle = '#6A7396'; g.beginPath(); [[.6, .6], [7.4, .6], [7.4, 5.4], [.6, 5.4]].forEach(([a, b], i) => { const [X, Y] = P(a, b); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath();
    [[1.4, 1.4], [1.4, 4.6], [6.6, 4.6], [6.6, 1.4]].forEach(([a, b], i) => { const [X, Y] = P(a, b); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill('evenodd');
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 8; i++) { g.moveTo(...P(i, 0)); g.lineTo(...P(i, 6)); } for (let j = 1; j < 6; j++) { g.moveTo(...P(0, j)); g.lineTo(...P(8, j)); } g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.3; g.setLineDash([5, 5]); path(g, [P(1, 1), P(7, 1), P(7, 5), P(1, 5)]); g.stroke(); g.setLineDash([]);
    // itens com profundidade
    const PAL = { coral: ['#FFC1B0', '#F58A77', '#CC625C'], blue: ['#B7D0FF', '#7B9CF4', '#5572CF'], yel: ['#FFEAA8', '#F8C85E', '#D59C3E'], mint: ['#C3F3DF', '#77D5B2', '#4AAA8A'], lil: ['#DCCEFF', '#A48CF2', '#7C66CC'] };
    const box = (x, y, w, d, h, [top, lf, rt]) => {
      fillP(g, [P(x, y + d), P(x + w, y + d), P(x + w, y + d, h), P(x, y + d, h)], lf);
      fillP(g, [P(x + w, y), P(x + w, y + d), P(x + w, y + d, h), P(x + w, y, h)], rt);
      fillP(g, [P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)], top);
    };
    const BL = [[1.7, 1.7, 1.3, 1.2, 2.0, 'coral'], [3.3, 1.7, 1.2, 1.2, 3.6, 'blue'], [4.8, 1.7, 1.5, 1.3, 1.4, 'yel'], [1.7, 3.2, 1.2, 1.1, 1.1, 'mint'], [3.1, 3.2, 1.6, 1.1, 2.4, 'lil'], [5.0, 3.3, 1.3, 1.0, 1.8, 'coral']];
    const items = [];
    BL.forEach(([x, y, w, d, h, c], i) => {
      const t0 = .35 + i * .26, k = seg(p, t0, t0 + .7), hh = h * (k <= 0 ? 0 : spr(k)) * (1 - ein(seg(p, 6.05 + (5 - i) * .06, 6.4 + (5 - i) * .06)));
      if (hh < .02) return;
      // sombra projetada no chão (luz do alto à esquerda)
      const L = hh * .55; g.fillStyle = 'rgba(50,40,120,.16)'; path(g, [P(x + w, y), P(x + w + L, y + .1), P(x + w + L, y + d + .1), P(x + w, y + d)]); g.fill();
      items.push([x + w / 2 + y + d / 2, () => {
        box(x, y, w, d, hh, PAL[c]);
        // janelas nas duas faces (algumas acendem)
        const rows = Math.floor((hh - .3) / .5);
        for (let rw = 0; rw < rows; rw++) {
          const z = .35 + rw * .5;
          for (let cI = 0; cI < Math.floor(w / .4); cI++) { const u0 = x + .15 + cI * .4, on = p > 3.1 + ((i * 7 + rw * 3 + cI * 5) % 9) * .18 && p < 6; fillP(g, [P(u0, y + d, z), P(u0 + .2, y + d, z), P(u0 + .2, y + d, z + .26), P(u0, y + d, z + .26)], on ? '#FFF2B8' : 'rgba(40,30,110,.22)'); }
          for (let cI = 0; cI < Math.floor(d / .4); cI++) { const v0 = y + .15 + cI * .4, on = p > 3.3 + ((i * 5 + rw * 7 + cI * 3) % 9) * .18 && p < 6; fillP(g, [P(x + w, v0, z), P(x + w, v0 + .2, z), P(x + w, v0 + .2, z + .26), P(x + w, v0, z + .26)], on ? '#FFE48A' : 'rgba(30,20,90,.28)'); }
        }
        if (i === 1 && hh > 3) { const [ax, ay] = P(x + w / 2, y + d / 2, hh); g.strokeStyle = '#5572CF'; g.lineWidth = 2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax, ay - 16); g.stroke(); g.fillStyle = Math.floor(p * 2) % 2 ? '#FF5A5F' : '#FFB3B5'; g.beginPath(); circ(g, ax, ay - 17, 2.6); g.fill(); }
        if (i === 2 && hh > 1.2) for (let sI = 0; sI < 2; sI++) fillP(g, [P(x + .2 + sI * .65, y + .25, hh + .02), P(x + .75 + sI * .65, y + .25, hh + .02), P(x + .75 + sI * .65, y + d - .25, hh + .02), P(x + .2 + sI * .65, y + d - .25, hh + .02)], '#3E4E9C');
      }]);
    });
    // árvores
    [[.3, 2.2], [.3, 3.9], [2.2, 5.7], [4.0, 5.7], [5.8, 5.7], [7.7, 2.6], [7.7, 4.3]].forEach(([x, y], i) => {
      const k = seg(p, 2.0 + i * .09, 2.5 + i * .09), sc = (k <= 0 ? 0 : spr(k)) * (1 - ein(seg(p, 6.0, 6.25))); if (sc < .02) return;
      items.push([x + y, () => { const [X, Y] = P(x, y); g.fillStyle = 'rgba(50,40,120,.18)'; g.beginPath(); ell(g, X + 3, Y + 1, 8 * sc, 3.5 * sc); g.fill(); g.fillStyle = '#8A6A55'; g.fillRect(X - 1.5, Y - 9 * sc, 3, 9 * sc); g.fillStyle = '#3FAE7E'; g.beginPath(); circ(g, X, Y - 15 * sc, 9 * sc); g.fill(); g.fillStyle = '#6FD6A2'; g.beginPath(); circ(g, X - 2.5 * sc, Y - 17.5 * sc, 6 * sc); g.fill(); }]);
    });
    // turbina eólica (loop vivo)
    const tk = seg(p, 1.9, 2.5), th = 3.1 * (tk <= 0 ? 0 : spr(tk)) * (1 - ein(seg(p, 6.15, 6.5)));
    if (th > .05) items.push([8.1, () => { const [X, Y] = P(7.6, .5), [, Yt] = P(7.6, .5, th); g.strokeStyle = '#F4F6FF'; g.lineWidth = 3; g.beginPath(); g.moveTo(X, Y); g.lineTo(X, Yt); g.stroke(); g.fillStyle = 'rgba(50,40,120,.2)'; g.beginPath(); ell(g, X + 2, Y + 1, 5, 2); g.fill(); if (th > 2.5) { g.fillStyle = '#FFFFFF'; for (let b = 0; b < 3; b++) { const a = p * 3 + b * TAU / 3; g.save(); g.translate(X, Yt); g.rotate(a); g.beginPath(); g.ellipse(0, -11, 2.6, 11, 0, 0, TAU); g.fill(); g.restore(); } g.fillStyle = '#C9CFEA'; g.beginPath(); circ(g, X, Yt, 2.8); g.fill(); } }]);
    // carros no anel
    const ring = (u) => { u = ((u % 20) + 20) % 20; if (u < 6) return [1 + u, 1, 0]; if (u < 10) return [7, 1 + u - 6, 1]; if (u < 16) return [7 - (u - 10), 5, 0]; return [1, 5 - (u - 16), 1]; };
    const ca = (seg(p, 2.6, 3.0) > 0 ? spr(seg(p, 2.6, 3.0)) : 0) * (1 - ein(seg(p, 6.1, 6.3)));
    if (ca > .02) [[0, 'coral'], [10, 'yel']].forEach(([off, c]) => {
      const [x, y, dir] = ring(p / D * 20 * 1 + off), w = (dir ? .3 : .55) * ca, d = (dir ? .55 : .3) * ca;
      items.push([x + y + .2, () => { g.fillStyle = 'rgba(40,30,90,.25)'; path(g, [P(x - w / 2 + .08, y - d / 2 + .08), P(x + w / 2 + .12, y - d / 2 + .08), P(x + w / 2 + .12, y + d / 2 + .12), P(x - w / 2 + .08, y + d / 2 + .12)]); g.fill(); box(x - w / 2, y - d / 2, w, d, .3 * ca, PAL[c]); box(x - w / 4, y - d / 4, w / 2, d / 2, .48 * ca, ['#F4F7FF', '#C7D0F0', '#A9B3DD']); }]);
    });
    items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());
    // sinal do centro de dados: ondas que saem da antena (loop vivo)
    const fk = seg(p, 3.9, 4.1) * (1 - seg(p, 5.8, 5.9));
    if (fk > 0) { const [ax, ay] = P(3.9, 2.3, 3.6); for (let i = 0; i < 3; i++) { const k = ((p - 3.9) / 1.2 + i / 3) % 1; if (p - 3.9 < i * .4) continue; g.strokeStyle = '#FF7A59'; g.lineWidth = 2.6 * (1 - k); g.beginPath(); g.arc(ax, ay - 16, 6 + k * 26, -Math.PI * .8, -Math.PI * .2); g.stroke(); } }
    // etiqueta com linha-guia (à esquerda da torre, longe da borda)
    const lk = seg(p, 3.3, 3.8), ls = (lk <= 0 ? 0 : spr(lk)) * (1 - ein(seg(p, 5.85, 6.1)));
    if (ls > .02) {
      const [ax, ay] = P(3.3, 2.9, 3.3), lx = ax - 104, ly = ay - 18;
      g.strokeStyle = '#2B2A6E'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, lx + 64, ls), lerp(ay, ly, ls)); g.stroke();
      g.fillStyle = '#2B2A6E'; g.beginPath(); circ(g, ax, ay, 3); g.fill();
      g.save(); g.translate(lx + 64, ly); g.scale(ls, ls); g.translate(-lx - 64, -ly);
      g.fillStyle = '#2B2A6E'; g.beginPath(); g.roundRect(lx - 66, ly - 13, 132, 26, 13); g.fill();
      g.fillStyle = '#FFD23F'; g.beginPath(); circ(g, lx - 52, ly, 4); g.fill();
      type(g, 'Centro de dados', lx + 6, ly + 1, { f: font(600, 14, F.grot), fill: '#fff' });
      g.restore();
    }
    g.restore();
  };

  // =====================================================================
  // 5. ILUSTRAÇÃO TEXTURIZADA — cartaz em risografia: três tintas passam, a figura respira
  // =====================================================================
  const risoGrain = (i) => cached('g1-riso-grain' + i, 960, 540, (c, w, h) => {
    const d = c.createImageData(w, h), r = rng(71 + i * 13);
    for (let k = 0; k < d.data.length; k += 4) { const v = r(); if (v > .62) { d.data[k] = 242; d.data[k + 1] = 236; d.data[k + 2] = 223; d.data[k + 3] = Math.min(255, (v - .62) * 560); } else if (v < .012) { d.data[k] = 40; d.data[k + 1] = 20; d.data[k + 2] = 60; d.data[k + 3] = 50; } }
    c.putImageData(d, 0, 0);
  });
  R['ilustracao-texturizada'] = (g, t, W, H) => {
    const D = 8, p = t % D, PAPER = '#F2ECDF', PINK = '#FF48B0', BLUE = '#0078BF', YEL = '#FFE800';
    const rough = (pts, amp, sd, fq) => { const r = rng(sd), b = rng(fq * 17 + sd); g.beginPath(); pts.forEach(([x, y], i) => { const X = x + (r() - .5) * amp + (b() - .5) * .5, Y = y + (r() - .5) * amp + (b() - .5) * .5; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
    const ringPts = (cx, cy, rx, ry, n) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
    const sheet = (tau, dx) => {
      g.save(); g.translate(dx, 0); g.beginPath(); g.rect(0, 0, W, H); g.clip();
      paper(g, W, H, PAPER);
      const fq = Math.floor(tau * 12), tq = fq / 12, rj = rng(fq * 31 + 5);
      const br = .5 - .5 * Math.cos(tq * TAU / 4);
      const plate = (col, k, ox, oy, fn) => { if (k <= 0) return; g.save(); g.beginPath(); g.rect(-4, -4, W + 8, (H + 8) * k); g.clip(); g.translate(ox + (rj() - .5) * .9, oy + (rj() - .5) * .9); g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.strokeStyle = col; fn(); g.restore(); };
      const fx = 322, shY = 114 - br * 2.5, sw = 26 + br * 1.2;
      const torso = () => { g.beginPath(); g.moveTo(fx - sw, shY + 8); g.quadraticCurveTo(fx - sw, shY - 3, fx - sw + 11, shY - 3); g.lineTo(fx + sw - 11, shY - 3); g.quadraticCurveTo(fx + sw, shY - 3, fx + sw, shY + 8); g.lineTo(fx + 19, 170); g.lineTo(fx - 19, 170); g.closePath(); };
      const legs = () => { g.beginPath(); g.moveTo(fx - 64, 188); g.bezierCurveTo(fx - 66, 168, fx - 30, 160, fx, 170); g.bezierCurveTo(fx + 30, 160, fx + 66, 168, fx + 64, 188); g.bezierCurveTo(fx + 40, 197, fx - 40, 197, fx - 64, 188); g.closePath(); };
      const leaf = (ox0, oy0, a, len, wd, half) => { g.save(); g.translate(ox0, oy0); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wd, -len * .45, 0, -len); if (half) g.lineTo(0, 0); else g.quadraticCurveTo(-wd, -len * .45, 0, 0); g.fill(); g.restore(); };
      const leaves = (half) => { const sw2 = Math.sin(tq * 1.7) * .05; [[480, 276, -.95, 96, 30], [486, 262, -.55, 84, 26], [470, 280, -1.35, 70, 22], [-6, 276, .9, 70, 22], [-4, 262, .5, 56, 18]].forEach(([a0, b0, a, l, wd], i) => leaf(a0, b0, a + sw2 * (i % 2 ? 1 : -1), l, wd, half)); };
      // amarelo: sol, metade das folhas
      plate(YEL, seg(tau, -1.0, -.55), 0, 0, () => { rough(ringPts(fx, 118, 80, 80, 90), 2.2, 3, fq); g.fill(); leaves(true); });
      // rosa: figura, anéis de respiração, flores, sombra do título
      plate(PINK, seg(tau, -.55, .05), 2.2, -1.2, () => {
        legs(); g.fill(); torso(); g.fill();
        g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx - sw + 5, shY + 5); g.quadraticCurveTo(fx - sw - 12, shY + 40, fx - 48, 173); g.moveTo(fx + sw - 5, shY + 5); g.quadraticCurveTo(fx + sw + 12, shY + 40, fx + 48, 173); g.stroke();
        g.fillRect(fx - 5, shY - 16, 10, 16); rough(ringPts(fx, shY - 28, 16, 17, 30), 1.2, 9, fq); g.fill();
        for (let i = 0; i < 2; i++) { const k = ((tq - 1.8) / 2.4 + i * .5); if (tq < 1.8 + i * 1.2) continue; const kk = k % 1; g.lineWidth = 3.2 * (1 - kk); g.beginPath(); g.arc(fx, 124, 88 + kk * 60, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
        type(g, 'Respire.', 36, 180, { f: font('italic 900', 46, F.serif), fill: PINK, align: 'left', base: 'alphabetic' });
        [[400, 238], [414, 226], [446, 214], [30, 236]].forEach(([a, b], i) => { rough(ringPts(a, b, 6, 6, 10), 1.5, 30 + i, fq); g.fill(); });
      });
      // azul: cabelo, sombras pontilhadas, folhas, título e textos
      plate(BLUE, seg(tau, .05, .65), -1.4, 1.6, () => {
        g.beginPath(); g.arc(fx, shY - 29, 17, Math.PI * .9, Math.PI * 2.1); g.closePath(); g.fill(); g.beginPath(); circ(g, fx, shY - 48, 7); g.fill();
        g.fillStyle = dotPat(g, BLUE, 4.5, .85);
        g.save(); torso(); g.clip(); g.fillRect(fx + 4, 90, 40, 90); g.restore();
        g.save(); legs(); g.clip(); g.fillRect(fx - 70, 181, 140, 20); g.restore();
        g.beginPath(); ell(g, fx, 196, 84, 7); g.fill();
        g.fillStyle = BLUE; leaves(false);
        type(g, 'Respire.', 34, 178, { f: font('italic 900', 46, F.serif), fill: BLUE, align: 'left', base: 'alphabetic' });
        type(g, 'Nº 12 · OUTONO', 37, 128, { f: font(500, 14, F.mono), fill: BLUE, align: 'left', track: 2 });
        type(g, 'um minuto para você', 37, 206, { f: font(600, 15, F.body), fill: BLUE, align: 'left' });
        // pássaros cruzando o sol
        const bk = seg(tq, 2.4, 6.4); if (bk > 0 && bk < 1) for (let i = 0; i < 2; i++) { const bx0 = lerp(200, 470, bk) + i * 22, by0 = 64 + i * 12 + Math.sin(tq * 3 + i) * 3, fl = Math.floor(tq * 6 + i) % 2 ? 5 : -3; g.lineWidth = 2.4; g.beginPath(); g.moveTo(bx0 - 8, by0 - fl); g.quadraticCurveTo(bx0 - 3, by0 - 2, bx0, by0 + 1); g.quadraticCurveTo(bx0 + 3, by0 - 2, bx0 + 8, by0 - fl); g.stroke(); }
      });
      g.drawImage(risoGrain(((fq % 3) + 3) % 3), 0, 0, W, H);
      g.restore();
    };
    const sl = eio(seg(p, 6.85, 7.5));
    if (sl <= 0) sheet(p, 0);
    else { const nx = W * (1 - sl); if (nx > .5) sheet(p, -sl * 40); g.fillStyle = lin(g, nx - 16, 0, nx, 0, [[0, 'rgba(40,20,40,0)'], [1, 'rgba(40,20,40,.3)']]); g.fillRect(nx - 16, 0, 16, H); sheet(p - D, nx); }
  };

  // =====================================================================
  // 6. WHITEBOARD — a mão desenha "ideia" e depois "meta"; a câmera desliza no quadro
  // =====================================================================
  const handSprite = () => cached('g1-wb-hand', 440, 440, (c) => {
    const tmp = document.createElement('canvas'); tmp.width = 440; tmp.height = 440; const h = tmp.getContext('2d'); h.scale(2, 2);
    const ux = .56, uy = .83, vx = -.83, vy = .56, A = (s, o) => [14 + ux * s + vx * o, 14 + uy * s + vy * o];
    const q = (pts, fill) => { h.beginPath(); pts.forEach((pp, i) => { const [x, y] = A(...pp); i ? h.lineTo(x, y) : h.moveTo(x, y); }); h.closePath(); h.fillStyle = fill; h.fill(); };
    const cap = (a, b, w, fill) => { const [x0, y0] = A(...a), [x1, y1] = A(...b); h.lineCap = 'round'; h.strokeStyle = '#B97E5C'; h.lineWidth = w + 2; h.beginPath(); h.moveTo(x0, y0); h.lineTo(x1, y1); h.stroke(); h.strokeStyle = fill; h.lineWidth = w; h.stroke(); };
    const SK = '#F3C6A2', SK2 = '#DDA27E';
    q([[118, -34], [118, 36], [260, 44], [260, -40]], '#3B5A96'); q([[112, -35], [112, 37], [128, 37], [128, -35]], '#2C4476');
    q([[58, -8], [64, 20], [100, 30], [124, 26], [126, -38], [98, -50], [70, -36]], SK);
    q([[64, 20], [100, 30], [124, 26], [124, 18], [98, 22], [66, 12]], SK2);
    cap([46, -22], [80, -30], 15, SK); cap([54, -32], [86, -40], 14, SK);
    q([[0, 0], [10, -4.5], [10, 4.5]], '#1A1A1A'); q([[9, -6], [18, -6.5], [18, 6.5], [9, 6]], '#3A3A3A'); q([[18, -6.5], [120, -6.5], [120, 6.5], [18, 6.5]], '#222');
    q([[26, -6.5], [40, -6.5], [40, 6.5], [26, 6.5]], '#D9DDE3');
    cap([30, 12], [60, 18], 14, SK); cap([26, -9], [66, -16], 13, SK);
    h.strokeStyle = 'rgba(150,90,60,.5)'; h.lineWidth = 1.2; h.beginPath(); const [k1x, k1y] = A(88, -44), [k2x, k2y] = A(104, -48); h.moveTo(k1x, k1y); h.quadraticCurveTo((k1x + k2x) / 2, (k1y + k2y) / 2 - 3, k2x, k2y); h.stroke();
    c.save(); c.shadowColor = 'rgba(30,30,40,.22)'; c.shadowBlur = 16; c.shadowOffsetX = 10; c.shadowOffsetY = 12; c.drawImage(tmp, 0, 0); c.restore();
  });
  let WB = null;
  const wbStrokes = () => {
    if (WB) return WB;
    const S = [];
    const head = [[66, 214]]; bez(head, [66, 214], [62, 176], [44, 130], [70, 96]); bez(head, [70, 96], [92, 62], [150, 58], [162, 96]); head.push([164, 108], [172, 118], [182, 130], [168, 136], [171, 145], [165, 150], [169, 157]); bez(head, [169, 157], [168, 170], [158, 176], [147, 178]); head.push([141, 186], [141, 214]);
    const gear = []; for (let i = 0; i <= 32; i++) { const a = i / 32 * TAU - Math.PI / 2, tooth = i % 4 === 1 || i % 4 === 2; gear.push([106 + Math.cos(a) * (tooth ? 22 : 16), 128 + Math.sin(a) * (tooth ? 22 : 16)]); }
    const arw = [[192, 128]]; bez(arw, [192, 128], [210, 110], [238, 110], [258, 124]);
    const und = [[266, 162]]; bez(und, [266, 162], [310, 168], [370, 152], [424, 158]);
    const stairs = [[522, 214], [522, 190], [566, 190], [566, 166], [610, 166], [610, 142], [654, 142], [654, 118], [698, 118], [698, 214]];
    const flag = [[684, 70], [716, 80], [684, 90]], scrib = [[688, 76], [704, 79], [688, 82], [708, 80], [688, 86]];
    const P = (pts, t0, t1, c = '#1B1B1B', w = 3.4) => S.push({ P: mkPath(pts), t0, t1, c, w });
    const T = (s, x, y, f, px, t0, t1, c = '#1B1B1B') => S.push({ s, x, y, f, px, t0, t1, c });
    P(head, .45, 1.45); P(gear, 1.5, 2.0); P(arcP([], 106, 128, 6, -Math.PI / 2, Math.PI * 1.5, 20), 2.0, 2.12);
    P(arw, 2.2, 2.5, '#D83A3A'); P([[244, 111], [259, 125], [240, 131]], 2.52, 2.66, '#D83A3A');
    T('uma boa', 272, 98, font(700, 24, F.hand), 24, 2.72, 3.05); T('IDEIA', 268, 146, font(400, 46, F.marker), 46, 3.1, 3.7); P(und, 3.72, 3.92, '#2D6CDF', 3.8);
    P(stairs, 4.65, 5.45);
    P(arcP([], 588, 136, 8, -Math.PI / 2, Math.PI * 1.5, 18), 5.5, 5.62); P([[588, 144], [589, 158], [581, 166]], 5.64, 5.76); P([[589, 158], [598, 166]], 5.77, 5.84); P([[588, 149], [602, 138]], 5.86, 5.94);
    P([[684, 118], [684, 70]], 6.0, 6.14); P(flag, 6.16, 6.34, '#D83A3A'); P(scrib, 6.35, 6.55, '#D83A3A', 3);
    T('META', 732, 132, font(400, 44, F.marker), 44, 6.62, 7.1); T('passo a passo', 736, 170, font(700, 24, F.hand), 24, 7.12, 7.42, '#2D6CDF');
    WB = S; return S;
  };
  R['whiteboard'] = (g, t, W, H) => {
    const D = 8, p = t % D, S = 480, strokes = wbStrokes();
    const cam = p < .4 ? -S + S * eio(seg(p + D, 7.6, 8.4)) : p < 3.95 ? 0 : p < 4.55 ? S * eio(seg(p, 3.95, 4.55)) : p < 7.6 ? S : S + S * eio(seg(p, 7.6, 8.4));
    // quadro: luz e brilho (o brilho é do vidro/laminado: fica parado na tela)
    g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#FFFFFF'], [1, '#EBEBE5']]); g.fillRect(0, 0, W, H);
    g.fillStyle = lin(g, 180, 0, 380, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); path(g, [[290, 0], [380, 0], [250, 252], [160, 252]]); g.fill();
    g.save(); g.translate(-cam, 0);
    // fantasmas de apagador (andam com o quadro)
    g.strokeStyle = 'rgba(120,120,130,.07)'; g.lineWidth = 10; g.lineCap = 'round';
    for (const o of [-2 * S, 0, 2 * S]) { g.beginPath(); g.moveTo(o + 330, 206); g.bezierCurveTo(o + 380, 190, o + 420, 214, o + 470, 196); g.moveTo(o + 800, 60); g.bezierCurveTo(o + 850, 44, o + 890, 70, o + 940, 50); g.stroke(); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    const draw = (st, prog, dx) => {
      if (prog <= 0) return;
      if (st.P) { g.strokeStyle = st.c; g.lineWidth = st.w; g.save(); g.translate(dx, 0); if (trace(g, st.P, 0, prog)) g.stroke(); g.restore(); }
      else { g.font = st.f; if (!st.wd) st.wd = g.measureText(st.s).width; g.save(); g.beginPath(); g.rect(st.x + dx - 4, st.y - st.px * 1.2, (st.wd + 8) * prog, st.px * 1.7); g.clip(); type(g, st.s, st.x + dx, st.y, { f: st.f, fill: st.c, align: 'left', base: 'alphabetic' }); g.restore(); }
    };
    strokes.forEach((st) => { draw(st, seg(p, st.t0, st.t1), 0); if (p < .4 && (st.x > S || (st.P && st.P.pts[0][0] > S))) draw(st, 1, -2 * S); });
    g.restore();
    // mão: segue a ponta do traço atual; entre traços, viaja com suavidade
    let hx, hy;
    const tip = (st, k) => st.P ? pointAt(st.P, k) : [st.x + st.wd * k, st.y - st.px * .32 + Math.sin(k * 34) * st.px * .16];
    strokes.forEach((st) => { if (!st.P && !st.wd) { g.font = st.f; st.wd = g.measureText(st.s).width; } });
    const cur = strokes.find((st) => p >= st.t0 && p <= st.t1);
    if (cur) [hx, hy] = tip(cur, seg(p, cur.t0, cur.t1));
    else {
      let prev = null, next = null; for (const st of strokes) { if (st.t1 < p) prev = st; else if (!next && st.t0 > p) next = st; }
      const a = prev ? tip(prev, 1) : null, b = next ? tip(next, 0) : [tip(strokes[0], 0)[0] + 2 * S, tip(strokes[0], 0)[1]];
      if (!prev) [hx, hy] = tip(strokes[0], 0);
      else { const t0 = prev.t1, t1 = next ? next.t0 : D; const k = eio(seg(p, t0, t1)), lift = Math.sin(Math.PI * k) * 14; hx = lerp(a[0], b[0], k); hy = lerp(a[1], b[1], k) - lift; }
    }
    const hs = handSprite(); g.drawImage(hs, hx - cam - 14, hy - 14, 220, 220);
    // bandeja de alumínio (primeiro plano) com canetas
    g.fillStyle = lin(g, 0, 250, 0, 270, [[0, '#E3E6EA'], [.4, '#C3C8CF'], [1, '#9EA4AD']]); g.fillRect(0, 252, W, 18);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 252, W, 1.5);
    for (const [mx, mc] of [[400, '#D83A3A'], [880, '#2D6CDF']]) for (const o of [-2 * S, 0, 2 * S]) { const X = mx + o - cam; if (X < -60 || X > W + 60) continue; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X + 2, 262, 56, 4); g.fillStyle = '#F4F4F4'; g.beginPath(); g.roundRect(X, 256, 48, 8, 3); g.fill(); g.fillStyle = mc; g.beginPath(); g.roundRect(X + 42, 256, 14, 8, 3); g.fill(); g.fillRect(X + 6, 258, 22, 4); }
  };

  // =====================================================================
  // 7. QUADRINHO / HQ — página com três requadros: cidade, olhos, POW!
  // =====================================================================
  const hqP1 = () => cached('g1-hq-p1', 356, 500, (c) => {
    c.scale(2, 2); const w = 178, h = 250;
    c.fillStyle = '#22306F'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#E2468C'; for (let y = 3, row = 0; y < h; y += 6, row++) for (let x = (row % 2) * 3; x < w; x += 6) { const r = 2.7 * clamp((y - 30) / 200); if (r > .3) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } }
    c.fillStyle = '#FFE14D'; c.beginPath(); c.arc(112, 104, 34, 0, TAU); c.fill();
    c.save(); c.clip(); c.fillStyle = '#F2B01E'; for (let y = 70; y < 140; y += 5) for (let x = 78 + ((y / 5) % 2) * 2.5; x < 148; x += 5) { const r = 1.8 * clamp((x - 100) / 50 + (y - 100) / 90); if (r > .2) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } } c.restore();
    c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.arc(112, 104, 34, 0, TAU); c.stroke();
    const r = rng(12); c.fillStyle = '#111';
    const bl = [[-4, 176, 36], [30, 158, 30], [58, 192, 26], [86, 140, 48], [132, 172, 26], [156, 150, 26]];
    bl.forEach(([x, y, bw]) => { c.fillStyle = '#111'; c.fillRect(x, y, bw, h - y); c.fillStyle = '#FFD94A'; for (let yy = y + 8; yy < h - 6; yy += 10) for (let xx = x + 5; xx < x + bw - 6; xx += 8) if (r() > .55) c.fillRect(xx, yy, 4, 5); });
    c.fillStyle = '#111'; c.fillRect(104, 128, 3, 12); c.fillRect(100, 126, 11, 3);
  });
  R['quadrinho-hq'] = (g, t, W, H) => {
    const D = 7, p = t % D, INK = '#111';
    const panel = (x, y, w, h, q, t0, draw) => {
      const k = seg(q, t0, t0 + .34); if (k <= 0) return; const s = 1 + .1 * (1 - spr(k)), a = (1 - spr(k)) * .03;
      g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(a); g.scale(s, s); g.translate(-x - w / 2, -y - h / 2);
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); draw(x, y, w, h); g.restore();
      g.strokeStyle = INK; g.lineWidth = 3.6; g.strokeRect(x, y, w, h); g.restore();
    };
    const page = (tau) => {
      const fq = Math.floor(tau * 12), q = fq / 12, r = rng(fq * 13 + 7);
      paper(g, W, H, '#F2E6C9');
      let shx = 0, shy = 0; const HIT = 25 / 12, sk = seg(q, HIT, 2.5); if (sk > 0 && sk < 1) { shx = Math.round((r() - .5) * 9 * (1 - sk)); shy = Math.round((r() - .5) * 9 * (1 - sk)); }
      g.save(); g.translate(shx, shy);
      // requadro 1: cidade à noite, herói pousa diante da lua
      panel(10, 10, 178, 250, 1, 0, (x, y, w, h) => {
        g.drawImage(hqP1(), x, y, w, h);
        const hk = seg(q, .1, .6); if (hk > 0) {
          const hx = lerp(x - 20, x + 104, ease(hk)), hy = lerp(y + 50, y + 140, hk) - Math.sin(Math.PI * hk) * 30, crouch = hk >= 1;
          if (!crouch) { g.strokeStyle = '#F4E9D0'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(hx - 14, hy - 14 - i * 6); g.lineTo(hx - 44 - r() * 20, hy - 22 - i * 6); } g.stroke(); }
          g.save(); g.translate(hx, hy); if (!crouch) g.rotate(-.5); g.fillStyle = INK;
          const fl = Math.sin(q * 9) * 3;
          path(g, [[-4, -24], [-30, -14 + fl], [-26, -4 - fl], [-8, -8]]); g.fill();
          path(g, [[-6, -22], [8, -24], [11, -9], [-4, -6]]); g.fill();
          path(g, [[-4, -7], [-15, -3], [-13, 0], [2, 0], [11, -9]]); g.fill();
          g.beginPath(); circ(g, 4, -29, 6.5); g.fill(); path(g, [[0, -33], [1, -41], [4, -34]]); g.fill(); path(g, [[6, -34], [9, -41], [9, -33]]); g.fill();
          path(g, [[8, -22], [18, -14], [15, -11], [6, -16]]); g.fill();
          g.restore();
        }
        g.fillStyle = '#FFD83A'; g.fillRect(x + 6, y + 6, 146, 26); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, 146, 26);
        type(g, 'ENQUANTO ISSO...', x + 13, y + 20, { f: font(400, 14, F.marker), fill: INK, align: 'left' });
      });
      // requadro 2: olhos em close, com retícula de pele e hachuras
      panel(196, 10, 274, 112, q, .35, (x, y, w, h) => {
        g.fillStyle = '#FFE6CC'; g.fillRect(x, y, w, h); g.fillStyle = dotPat(g, '#EE6F78', 5, 1.25); g.fillRect(x, y, w, h);
        g.strokeStyle = INK; g.lineWidth = 1.3; g.beginPath(); for (let i = 0; i < 7; i++) { g.moveTo(x + 124 + i * 4, y + 70); g.lineTo(x + 116 + i * 4, y + 110); g.moveTo(x + w - 18 + i * 4, y + 30); g.lineTo(x + w - 30 + i * 4, y + 100); g.moveTo(x + 4 + i * 4, y + 26); g.lineTo(x - 8 + i * 4, y + 100); } g.stroke();
        const shock = q >= .8, wide = shock ? 1.18 : 1, lift = shock ? -3 : 0;
        for (const sg of [-1, 1]) {
          const ex = x + w / 2 + sg * 64, ey = y + 76;
          g.save(); g.translate(ex, ey); g.scale(sg, 1);
          const eye = () => { g.beginPath(); g.moveTo(-34, -2); g.quadraticCurveTo(-6, -24 * wide, 30, 3); g.quadraticCurveTo(0, 18 * wide, -34, -2); g.closePath(); };
          eye(); g.fillStyle = '#fff'; g.fill(); g.save(); eye(); g.clip();
          g.fillStyle = '#35B3E0'; g.beginPath(); circ(g, 2, 0, 12); g.fill(); g.fillStyle = INK; g.beginPath(); circ(g, 2, 0, shock ? 3 : 6); g.fill(); g.fillStyle = '#fff'; g.beginPath(); circ(g, -3, -4, 2.6); g.fill();
          g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(-30 + i * 12, -14); g.lineTo(-24 + i * 12, -6); } g.stroke();
          g.restore(); eye(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
          g.lineWidth = 5; g.beginPath(); g.moveTo(-34, -3); g.quadraticCurveTo(-6, -25 * wide, 31, 2); g.stroke();
          g.fillStyle = INK; path(g, [[-40, -30 + lift], [-4, -34 + lift], [34, -18 + lift], [30, -12 + lift], [-4, -24 + lift], [-38, -22 + lift]]); g.fill();
          g.restore();
        }
        if (q >= .95) { const dx = x + w - 34, dy = y + 40 + Math.min(1.5, q - .95) * 6; g.fillStyle = '#7FD6FF'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(dx, dy - 12); g.quadraticCurveTo(dx + 8, dy, dx, dy + 5); g.quadraticCurveTo(dx - 8, dy, dx, dy - 12); g.fill(); g.stroke(); }
      });
      // balão (fura o requadro)
      const bk = seg(q, .85, 1.15); if (bk > 0) {
        const s = spr(bk), bx0 = 330, by0 = 34;
        g.save(); g.translate(300, 50); g.scale(s, s); g.translate(-300, -50);
        g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 2.6; g.beginPath(); ell(g, bx0, by0, 82, 20); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(300, 50); g.lineTo(288, 66); g.lineTo(318, 52); g.fill(); g.stroke(); g.fillRect(296, 46, 26, 6);
        type(g, 'NÃO PODE SER!', bx0, by0 + 1, { f: font(400, 17, F.marker), fill: INK });
        g.restore();
      }
      // requadro 3: soco com linhas de velocidade e POW!
      panel(196, 130, 274, 130, q, 1.4, (x, y, w, h) => {
        const hit = fq >= 25, fx0 = x + 184, fy0 = y + 66, inv = fq === 25;
        g.fillStyle = inv ? INK : '#FFD23F'; g.fillRect(x, y, w, h);
        const rr = rng(fq * 3 + 1); g.fillStyle = inv ? '#fff' : INK; g.beginPath();
        for (let i = 0; i < 46; i++) { const a = rr() * TAU, a2 = a + .012 + rr() * .02, r0 = 40 + rr() * 50; g.moveTo(fx0 + Math.cos(a) * r0, fy0 + Math.sin(a) * r0); g.lineTo(fx0 + Math.cos(a) * 400, fy0 + Math.sin(a) * 400); g.lineTo(fx0 + Math.cos(a2) * 400, fy0 + Math.sin(a2) * 400); } g.fill();
        if (hit && !inv) {
          const bs = spr(seg(q, HIT, 2.4)), br = rng(5); g.save(); g.translate(fx0, fy0); g.scale(bs, bs); g.rotate(-.1);
          g.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, rad0 = i % 2 ? 38 : 54 + br() * 12; g.lineTo(Math.cos(a) * rad0 * 1.25, Math.sin(a) * rad0 * .85); } g.closePath(); g.fillStyle = '#FF3B30'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke();
          g.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, rad0 = i % 2 ? 27 : 39; g.lineTo(Math.cos(a) * rad0 * 1.25, Math.sin(a) * rad0 * .85); } g.closePath(); g.fillStyle = '#FFF7D6'; g.fill();
          g.rotate(-.06); const pf = font(400, 42, F.slab);
          g.translate(10, 0); type(g, 'POW!', -3, 3, { f: pf, fill: '#00AEEF' }); type(g, 'POW!', 3, 1, { f: pf, fill: '#E4007C' });
          type(g, 'POW!', 4.5, 4.5, { f: pf, fill: INK, stroke: INK, lw: 5 });
          type(g, 'POW!', 0, 0, { f: pf, fill: '#FFE600', stroke: INK, lw: 5 });
          g.restore();
        }
        // punho
        const wk = seg(q, 1.4, 1.9), pk = seg(q, 1.9, HIT), rec = hit ? spr(seg(q, HIT, 2.5)) : 0;
        let px = lerp(x + 70, x + 50, eio(wk)), sc = .85; if (pk > 0) { px = lerp(x + 50, x + 100, ease(pk)); sc = lerp(.85, 1.25, pk); } if (hit) { px = x + 100 - 8 * rec; sc = 1.25; }
        const py = y + 70 + (wk < 1 ? (r() - .5) * 2 : 0);
        if (pk > 0 && !hit) { g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(px - 40, py + i * 10); g.lineTo(px - 120, py + i * 10); } g.stroke(); }
        g.save(); g.translate(px, py); g.scale(sc, sc);
        const skin = inv ? '#fff' : '#F8C9A0', sleeve = inv ? '#fff' : '#2F6FE4';
        g.fillStyle = sleeve; g.fillRect(-150, -20, 112, 40); if (!inv) { g.fillStyle = dotPat(g, '#173C8C', 5, 1.2); g.fillRect(-150, 6, 112, 14); }
        g.strokeStyle = INK; g.lineWidth = 3.4; g.strokeRect(-150, -20, 112, 40);
        g.fillStyle = skin; g.beginPath(); g.roundRect(-42, -27, 60, 54, 15); g.fill(); g.stroke();
        if (!inv) { g.fillStyle = dotPat(g, '#D9655B', 4, 1.1); g.beginPath(); g.roundRect(-42, 8, 60, 19, [0, 0, 15, 15]); g.fill(); }
        g.lineWidth = 2.6; g.beginPath(); for (const yy of [-13, 0, 13]) { g.moveTo(0, yy); g.quadraticCurveTo(10, yy - 2, 17, yy); } g.moveTo(-30, 10); g.quadraticCurveTo(-8, 20, 8, 14); g.stroke();
        g.restore();
      });
      // legenda final "CONTINUA..." (novo requadro de texto)
      const ck = seg(q, 3.6, 3.9); if (ck > 0) { const s2 = 1 + .25 * (1 - spr(ck)); g.save(); g.translate(412, 244); g.scale(s2, s2); g.rotate(-.03); g.fillStyle = '#FFD83A'; g.fillRect(-56, -13, 112, 26); g.strokeStyle = INK; g.lineWidth = 2.2; g.strokeRect(-56, -13, 112, 26); type(g, 'CONTINUA...', 0, 1, { f: font(400, 14, F.marker), fill: INK }); g.restore(); }
      g.restore();
    };
    const k = eio(seg(p, 6.3, 7.0));
    if (k <= 0) page(p);
    else { page(p); const nx = W * (1 - k); g.fillStyle = lin(g, nx - 18, 0, nx, 0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.35)']]); g.fillRect(nx - 18, 0, 18, H); g.save(); g.translate(nx, 0); page(p - D); g.restore(); }
  };

  // =====================================================================
  // 8. BLUEPRINT — engrenagem em vista frontal + vista explodida do eixo
  // =====================================================================
  R['blueprint'] = (g, t, W, H) => {
    const D = 8, p = t % D, LN = '#E8F2FF', DIM = 'rgba(232,242,255,.8)', GX = 122, GY = 120;
    g.drawImage(cached('g1-bp-bg', 960, 540, (c) => {
      c.scale(2, 2); c.fillStyle = rad(c, 200, 110, 20, 430, [[0, '#1D5A9E'], [1, '#0A2C5A']]); c.fillRect(0, 0, 480, 270);
      c.save(); c.globalAlpha = .07; c.globalCompositeOperation = 'overlay'; c.drawImage(noiseTile(9), 0, 0, 480, 270); c.restore();
      c.strokeStyle = 'rgba(200,225,255,.07)'; c.lineWidth = .6; c.beginPath(); for (let x = 10; x < 480; x += 10) { c.moveTo(x, 0); c.lineTo(x, 270); } for (let y = 10; y < 270; y += 10) { c.moveTo(0, y); c.lineTo(480, y); } c.stroke();
      c.strokeStyle = 'rgba(200,225,255,.15)'; c.lineWidth = .8; c.beginPath(); for (let x = 10; x < 480; x += 50) { c.moveTo(x, 0); c.lineTo(x, 270); } for (let y = 10; y < 270; y += 50) { c.moveTo(0, y); c.lineTo(480, y); } c.stroke();
      c.strokeStyle = 'rgba(232,242,255,.55)'; c.lineWidth = 1.2; c.strokeRect(8.5, 8.5, 463, 253);
    }), 0, 0, W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // base fixa: linhas de centro, eixo, carimbo
    g.strokeStyle = 'rgba(232,242,255,.5)'; g.lineWidth = .9; g.setLineDash([12, 3, 2, 3]); g.beginPath(); g.moveTo(44, GY); g.lineTo(200, GY); g.moveTo(GX, 44); g.lineTo(GX, 196); g.moveTo(222, GY); g.lineTo(466, GY); g.stroke(); g.setLineDash([]);
    g.strokeStyle = LN; g.lineWidth = 1.4; path(g, [[236, 112], [452, 112], [452, 128], [236, 128]]); g.stroke(); g.beginPath(); g.moveTo(240, 112); g.lineTo(236, 116); g.moveTo(448, 112); g.lineTo(452, 116); g.stroke();
    g.strokeStyle = 'rgba(232,242,255,.7)'; g.lineWidth = 1.2; g.strokeRect(328.5, 220.5, 138, 38); g.beginPath(); g.moveTo(328, 240.5); g.lineTo(466, 240.5); g.moveTo(398.5, 240); g.lineTo(398.5, 258); g.stroke();
    type(g, 'ENGRENAGEM Z16', 336, 231, { f: font(600, 14, F.mono), fill: LN, align: 'left' });
    type(g, 'ESC 1:2', 336, 250, { f: font(400, 14, F.mono), fill: DIM, align: 'left' }); type(g, 'FL 01', 406, 250, { f: font(400, 14, F.mono), fill: DIM, align: 'left' });
    type(g, 'DES. 04-117', 18, 24, { f: font(400, 14, F.mono), fill: 'rgba(232,242,255,.55)', align: 'left' });

    const content = (tau) => {
      const rot = TAU / 4 * eio(seg(tau, 4.3, 7.0));
      // engrenagem (os dentes giram por fase; o traço sempre começa no topo)
      const gp = [], Z = 16, pit = TAU / Z;
      for (let i = 0; i <= Z * 24; i++) { const a = -Math.PI / 2 + i / (Z * 24) * TAU, u = ((((a - rot) / pit) % 1) + 1) % 1; const rr = u < .18 ? 50 : u < .3 ? lerp(50, 60, (u - .18) / .12) : u < .56 ? 60 : u < .68 ? lerp(60, 50, (u - .56) / .12) : 50; gp.push([GX + Math.cos(a) * rr, GY + Math.sin(a) * rr]); }
      const gf = .25 + .75 * ease(seg(tau, 0, 1.1)), holeK = seg(tau, .5, 1.2), vol = ease(seg(tau, 3.6, 4.3)), wipeX = lerp(30, 470, vol);
      if (vol > 0) { g.save(); g.beginPath(); g.rect(0, 0, wipeX, H); g.clip(); path(g, gp); circ(g, GX + 6.5, GY, 6.5); for (let i = 0; i < 4; i++) { const a = rot + Math.PI / 4 + i * Math.PI / 2; circ(g, GX + Math.cos(a) * 33, GY + Math.sin(a) * 33, 8); } g.fillStyle = lin(g, GX - 60, GY - 60, GX + 60, GY + 60, [[0, 'rgba(220,236,255,.24)'], [1, 'rgba(220,236,255,.06)']]); g.fill('evenodd'); g.restore(); }
      g.strokeStyle = LN; g.lineWidth = 1.5; if (trace(g, mkPath(gp), 0, gf)) g.stroke();
      if (holeK > 0) {
        g.lineWidth = 1.3; g.beginPath(); g.arc(GX, GY, 18, -Math.PI / 2, -Math.PI / 2 + TAU * holeK); g.stroke();
        g.beginPath(); g.arc(GX, GY, 6.5, rot, rot + TAU * holeK); g.stroke();
        for (let i = 0; i < 4; i++) { const k = seg(holeK, i * .15, .4 + i * .15), a = rot + Math.PI / 4 + i * Math.PI / 2; if (k > 0) { g.beginPath(); g.arc(GX + Math.cos(a) * 33, GY + Math.sin(a) * 33, 8, a, a + TAU * k); g.stroke(); } }
        g.save(); g.strokeStyle = 'rgba(232,242,255,.35)'; g.lineWidth = .9; g.setLineDash([6, 4]); g.beginPath(); g.arc(GX, GY, 55, 0, TAU * holeK); g.stroke(); g.restore();
      }
      // linhas de projeção (vista frontal → lateral)
      const pk = seg(tau, .9, 1.3);
      if (pk > 0) { g.strokeStyle = 'rgba(232,242,255,.28)'; g.lineWidth = .8; g.setLineDash([3, 3]); g.beginPath(); for (const yy of [60, 180, 102, 138]) { g.moveTo(GX + 8, yy); g.lineTo(lerp(GX + 8, 452, pk), yy); } g.stroke(); g.setLineDash([]); }
      // vista lateral explodida
      const ex = eio(seg(tau, 2.0, 2.7));
      const parts = [[lerp(318, 292, ex), 60, 180, 18, 1.1], [lerp(350, 374, ex), 98, 142, 16, 1.3], [lerp(368, 422, ex), 106, 134, 10, 1.5]];
      if (vol > 0) { g.save(); g.beginPath(); g.rect(0, 0, wipeX, H); g.clip(); g.fillStyle = lin(g, 0, 112, 0, 128, [[0, 'rgba(255,255,255,.3)'], [.4, 'rgba(255,255,255,.05)'], [1, 'rgba(255,255,255,.16)']]); g.fillRect(236, 112, 216, 16);
        g.strokeStyle = 'rgba(232,242,255,.5)'; g.lineWidth = .8; parts.slice(0, 2).forEach(([cx, y0, y1, w]) => { g.save(); g.beginPath(); g.rect(cx - w / 2, y0, w, y1 - y0); if (y1 - y0 > 60) g.rect(cx + w / 2, 102, 10, 36); g.clip(); g.beginPath(); for (let d = -80; d < 140; d += 5) { g.moveTo(cx - 20, y0 + d); g.lineTo(cx + 40, y0 + d - 60); } g.stroke(); g.restore(); }); g.restore(); }
      parts.forEach(([cx, y0, y1, w, t0], i) => {
        const k = seg(tau, t0, t0 + .45); if (k <= 0) return;
        g.strokeStyle = LN; g.lineWidth = 1.4; if (trace(g, mkPath([[cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, y1], [cx - w / 2, y1], [cx - w / 2, y0]]), 0, k)) g.stroke();
        if (k >= 1) { g.lineWidth = 1; g.beginPath();
          if (i === 0) { g.rect(cx + w / 2, 102, 10, 36); g.moveTo(cx - w / 2, 70); g.lineTo(cx + w / 2, 70); g.moveTo(cx - w / 2, 170); g.lineTo(cx + w / 2, 170); }
          if (i === 1) { circ(g, cx, 104, 4.5); circ(g, cx, 136, 4.5); g.moveTo(cx - w / 2, 110); g.lineTo(cx + w / 2, 110); g.moveTo(cx - w / 2, 130); g.lineTo(cx + w / 2, 130); }
          if (i === 2) { g.moveTo(cx, 106); g.lineTo(cx, 100); g.moveTo(cx - 3, 100); g.lineTo(cx + 3, 100); }
          g.stroke(); }
        const bk = seg(tau, 2.6 + i * .15, 2.9 + i * .15); if (bk > 0) {
          const lx = cx + 10, ly = 198; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 2, y1); g.lineTo(lerp(cx + 2, lx, bk), lerp(y1, ly - 10, bk)); g.stroke();
          g.beginPath(); g.arc(lx, ly, 10, -Math.PI / 2, -Math.PI / 2 + TAU * bk); g.stroke();
          if (bk > .8) type(g, String(i + 1), lx, ly + 1, { f: font(600, 14, F.mono), fill: LN });
        }
      });
      // cotas: linhas de chamada, linha de cota com setas, valor
      const dim = (x0, x1, y, yFrom, label, t0) => {
        const k = seg(tau, t0, t0 + .7); if (k <= 0) return;
        const k1 = seg(k, 0, .4), k2 = seg(k, .3, .8), k3 = seg(k, .75, 1), mx = (x0 + x1) / 2, hw = (x1 - x0) / 2 * ease(k2);
        g.strokeStyle = DIM; g.lineWidth = .9; g.beginPath(); for (const xx of [x0, x1]) { g.moveTo(xx, yFrom); g.lineTo(xx, lerp(yFrom, y + (y > yFrom ? 4 : -4), k1)); } if (hw > 0) { g.moveTo(mx - hw, y); g.lineTo(mx + hw, y); } g.stroke();
        if (k2 >= 1) { g.fillStyle = DIM; path(g, [[x0, y], [x0 + 7, y - 2.5], [x0 + 7, y + 2.5]]); g.fill(); path(g, [[x1, y], [x1 - 7, y - 2.5], [x1 - 7, y + 2.5]]); g.fill(); }
        if (k3 > 0) { g.save(); g.font = font(500, 14, F.mono); const tw = g.measureText(label).width; g.beginPath(); g.rect(mx - tw / 2 - 3, y - 20, (tw + 6) * k3, 16); g.clip(); type(g, label, mx, y - 11, { f: font(500, 14, F.mono), fill: LN }); g.restore(); }
      };
      dim(62, 182, 212, 124, 'Ø120', 2.9); dim(236, 452, 46, 108, 'L 216', 3.1);
    };
    // fim: a lâmpada da copiadora varre a folha e deixa a próxima cópia começando
    const sx = lerp(-14, 494, seg(p, 7.05, 7.95));
    if (p < 7.05) content(p);
    else {
      g.save(); g.beginPath(); g.rect(sx, 0, W, H); g.clip(); content(p); g.restore();
      g.save(); g.beginPath(); g.rect(0, 0, sx, H); g.clip(); content(p - D); g.restore();
      g.fillStyle = lin(g, sx - 28, 0, sx + 28, 0, [[0, 'rgba(160,210,255,0)'], [.5, 'rgba(205,234,255,.32)'], [1, 'rgba(160,210,255,0)']]); g.fillRect(sx - 28, 0, 56, H);
      g.fillStyle = 'rgba(236,247,255,.9)'; g.fillRect(sx - 1, 0, 2, H);
    }
  };
})();
