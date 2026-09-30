// Grupo 2 — Tipografia e humor: tipografia-cinetica, suico-grid, lettering-manuscrito, meme-edit,
// legendas-palavra, letreiro-variedades, boneco-palito.
(() => {
  // ---------- utilitários locais ----------
  const SC = 2; // resolução dos sprites
  const sprite = (key, w, h, fn) => cached('g2:' + key, Math.ceil(w * SC), Math.ceil(h * SC), (c) => { c.scale(SC, SC); fn(c, w, h); });
  const seg = (u, a, b) => clamp((u - a) / (b - a));
  const dry = (x) => { x = clamp(x); return x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2; }; // bezier(.7,0,.3,1)
  const outQ = (x) => 1 - Math.pow(1 - clamp(x), 4);
  const inQ = (x) => clamp(x) ** 3;
  const EMO = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  // texto com contorno em camadas: layers = [[cor, largura], ...] do mais externo ao mais interno
  function outlined(g, s, x, y, f, fill, layers, align = 'center', base = 'alphabetic') {
    g.font = f; g.textAlign = align; g.textBaseline = base; g.lineJoin = 'round'; g.miterLimit = 2;
    for (const [c, w] of layers) { g.strokeStyle = c; g.lineWidth = w; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }

  // =====================================================================================
  // 1. TIPOGRAFIA CINÉTICA — câmera que viaja e gira entre blocos de um cartaz
  // =====================================================================================
  {
    const INK = '#F3EEE4', ACC = '#FF4B1F', BGC = '#0E0E0F';
    const D = 7.2;
    // câmera: [tempo, cx, cy, rot, zoom]
    const K = [
      [0.00, -101, -64, 0, .62], [1.28, -101, -64, 0, .62],
      [1.72, 357, -30, -Math.PI / 2, .92], [2.50, 357, -30, -Math.PI / 2, .92],
      [2.92, -130, 120, 0, .66], [3.62, -130, 120, 0, .66],
      [4.10, 297, 156, 0, 1.85], [4.86, 297, 156, 0, 1.85],
      [5.52, -6, -29, 0, .5], [7.20, -6, -29, 0, .5],
    ];
    const camAt = (u) => {
      let i = 0; while (i < K.length - 2 && u >= K[i + 1][0]) i++;
      const a = K[i], b = K[i + 1], k = eio(seg(u, a[0], b[0]));
      const c = { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), r: lerp(a[3], b[3], k), z: a[4] * Math.pow(b[4] / a[4], k) };
      if (i === 7) c.r += Math.sin(k * Math.PI) * .09; // giro no recuo para o cartaz
      c.r += Math.sin(u * .9) * .006; c.z *= 1 + Math.sin(u * 1.3) * .007; // câmera na mão, respirando
      // cortes na batida do final: dois saltos de zoom
      if (u >= 6.62) c.z *= u >= 6.92 ? 1.34 : 1.16;
      return c;
    };
    const WORDS = [
      { s: 'TODA', x: -440, y: -150, px: 90, f: (px) => font(900, px, F.grot), c: 'ink', t0: 0.0, kind: 'slam' },
      { s: 'GRANDE', x: -440, y: 14, px: 160, f: (px) => font(900, px, F.grot), c: 'acc', t0: 0.34, kind: 'slam' },
      { s: 'ideia', x: 402, y: 120, px: 150, rot: -Math.PI / 2, f: (px) => `italic 400 ${px}px ${F.serif}`, c: 'ink', t0: 1.46, kind: 'drop' },
      { s: 'COMEÇA', x: -440, y: 172, px: 140, f: (px) => font(900, px, F.grot), c: 'ink', t0: 2.8, kind: 'slam' },
      { s: 'pequena.', x: 200, y: 172, px: 50, f: (px) => `italic 400 ${px}px ${F.serif}`, c: 'ink', t0: 3.28, kind: 'type' },
      { s: 'Nº 09 — TIPOGRAFIA CINÉTICA', x: -440, y: -236, px: 30, f: (px) => font(600, px, F.mono), c: 'acc', t0: 5.05, kind: 'type', dt: .025 },
    ];
    const SLAMS = [0, .34, 2.8];
    function pal(u) {
      if (u >= 6.92) return { bg: INK, ink: BGC, acc: ACC };
      if (u >= 6.62) return { bg: ACC, ink: BGC, acc: INK };
      return { bg: null, ink: INK, acc: ACC };
    }
    function drawWord(g, w, u, P) {
      if (u < w.t0) return;
      const col = w.c === 'acc' ? P.acc : P.ink;
      g.font = w.f(w.px); g.fillStyle = col; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      if (w.kind === 'slam') {
        const k = (u - w.t0) / .36, m = g.measureText(w.s).width, ch = w.px * .72;
        const s = 1 + .7 * (1 - spr(k));
        g.save(); g.translate(w.x + m / 2, w.y - ch / 2); g.scale(s, s); g.fillText(w.s, -m / 2, ch / 2); g.restore();
      } else if (w.kind === 'drop') {
        g.save(); g.translate(w.x, w.y); g.rotate(w.rot || 0);
        let x = 0;
        for (let i = 0; i < w.s.length; i++) {
          const chr = w.s[i], cw = g.measureText(chr).width, k = (u - w.t0 - i * .07) / .5;
          if (k > 0) g.fillText(chr, x, -(1 - spr(k)) * 110);
          x += cw;
        }
        g.restore();
      } else {
        const n = Math.min(w.s.length, Math.floor((u - w.t0) / (w.dt || .06)) + 1);
        g.fillText(w.s.slice(0, n), w.x, w.y);
        if (w.s === 'pequena.' && u > 5.6 && Math.floor(u * 2.6) % 2 === 0 && u < 6.62) {
          const m = g.measureText(w.s).width; g.fillStyle = P.acc; g.fillRect(w.x + m + 8, w.y - 38, 5, 46);
        }
      }
    }
    function drawWorld(g, cam, u, W, H, a, P, sh) {
      g.save(); g.globalAlpha = a;
      g.translate(W / 2 + sh[0], H / 2 + sh[1]); g.scale(cam.z, cam.z); g.rotate(-cam.r); g.translate(-cam.x, -cam.y);
      // guias de composição (linhas de base e margem): dão referência ao voo da câmera
      g.strokeStyle = P.bg ? 'rgba(0,0,0,.12)' : 'rgba(243,238,228,.08)'; g.lineWidth = 1.2 / cam.z;
      g.beginPath(); for (const y of [-150, 14, 172]) { g.moveTo(-1600, y); g.lineTo(1600, y); }
      g.moveTo(-450, -1200); g.lineTo(-450, 1200); g.stroke();
      for (const w of WORDS) drawWord(g, w, u, P);
      g.restore();
    }
    R['tipografia-cinetica'] = (g, t, W, H, seed) => {
      const u = t % D, P = pal(u);
      if (P.bg) bg(g, W, H, P.bg);
      else { g.fillStyle = rad(g, W * .5, H * .45, 10, W * .72, [[0, '#262422'], [1, BGC]]); g.fillRect(0, 0, W, H); }
      // tremor de impacto nas batidas
      let sh = [0, 0];
      for (const e of SLAMS) { const d = u - e - .05; if (d > 0 && d < .22) { const r = rng(Math.floor(u * 60) + seed), k = (1 - d / .22) * 7; sh = [(r() - .5) * k, (r() - .5) * k]; } }
      const cam = camAt(u), cp = camAt(Math.max(0, u - .04));
      const v = Math.hypot(cam.x - cp.x, cam.y - cp.y) * cam.z + Math.abs(cam.r - cp.r) * 260 + Math.abs(Math.log(cam.z / cp.z)) * 300;
      if (v > 5 && !P.bg) drawWorld(g, cp, u, W, H, .22, P, sh); // rastro de movimento no voo
      drawWorld(g, cam, u, W, H, 1, P, sh);
      if (!P.bg) vignette(g, W, H, .45);
      filmGrain(g, W, H, t, .09, 5);
    };
  }

  // =====================================================================================
  // 2. SUÍÇO / GRADE — cartaz modernista que se monta e se rearranja sobre a grade
  // =====================================================================================
  {
    const PAPER = '#F0EEE8', INK = '#141414', RED = '#E3200F', D = 8;
    const cx = (i) => 24 + 36 * i, ry = (j) => 21 + 38 * j;
    const FULL = [0, 0, 480, 270], A = [cx(8), ry(1), cx(12), ry(4)], B = [cx(0), ry(1), cx(4), ry(6)];
    const lr = (p, q, k) => p.map((v, i) => lerp(v, q[i], k));
    const G = { hb: (px) => font(800, px, F.grot), hr: (px) => font(400, px, F.grot), hx: (px) => font(900, px, F.grot), hs: (px) => font(600, px, F.grot) };
    function slideText(g, s, x, y, f, fill, k, clipH = 18) { // entra de baixo, recortado pela linha
      g.save(); g.beginPath(); g.rect(x - 4, y - clipH + 3, 400, clipH + 3); g.clip();
      type(g, s, x, y + (1 - dry(k)) * clipH, { f, fill, align: 'left', base: 'alphabetic' }); g.restore();
    }
    R['suico-grid'] = (g, t, W, H) => {
      const u = t % D;
      paper(g, W, H, PAPER, 11);
      g.fillStyle = lin(g, 0, 0, W, H, [[0, 'rgba(255,255,255,.45)'], [.6, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.06)']]); g.fillRect(0, 0, W, H);
      // grade modular: desenha no início e acende durante os rearranjos
      const mv = Math.max(seg(u, 3.3, 3.5) * (1 - seg(u, 4.3, 4.7)), seg(u, 7.0, 7.2));
      const gp = dry(seg(u, .2, .9));
      g.strokeStyle = `rgba(20,20,20,${.09 + .16 * mv})`; g.lineWidth = .7; g.beginPath();
      for (let i = 0; i <= 12; i++) { const x = cx(i) + .35, k = clamp(gp * 1.5 - i * .04); g.moveTo(x, ry(0)); g.lineTo(x, ry(0) + (ry(6) - ry(0)) * k); }
      for (let j = 0; j <= 6; j++) { const y = ry(j) + .35, k = clamp(gp * 1.5 - j * .06); g.moveTo(cx(0), y); g.lineTo(cx(0) + (cx(12) - cx(0)) * k, y); }
      g.stroke();
      // números de coluna na margem inferior (fios e números como grafismo)
      g.fillStyle = `rgba(20,20,20,${.35 * gp})`; g.font = font(600, 7, F.grot); g.textAlign = 'left'; g.textBaseline = 'alphabetic';

      // ---- barra superior: fio grosso e rótulos
      const rp = dry(seg(u, .3, .8));
      g.fillStyle = INK; g.fillRect(cx(0), 45, (cx(12) - cx(0)) * rp, 2.5);
      slideText(g, 'Mesa de Estilos', cx(0), 37, G.hb(14), INK, seg(u, .55, .95));
      slideText(g, 'Grade tipográfica', cx(4), 37, G.hr(14), INK, seg(u, .63, 1.03));
      // contador 01 → 02 (rola dentro da linha)
      { const k = dry(seg(u, 3.5, 3.9)) - dry(seg(u, 7.2, 7.6)), kin = seg(u, .71, 1.11);
        g.save(); g.beginPath(); g.rect(cx(10), 22, cx(12) - cx(10) + 4, 20); g.clip();
        const y0 = 37 + (1 - dry(kin)) * 18;
        type(g, '01', cx(12), y0 - k * 18, { f: G.hb(14), fill: INK, align: 'right', base: 'alphabetic' });
        type(g, '02', cx(12), y0 + (1 - k) * 18, { f: G.hb(14), fill: RED, align: 'right', base: 'alphabetic' });
        g.restore(); }

      // ---- numeral gigante
      g.font = G.hx(166); const m57 = g.measureText('57').width;
      const nk = dry(seg(u, 3.62, 4.22)), nx = lerp(cx(0) - 6, cx(12) - m57 + 5, nk);
      const rise = dry(seg(u, .8, 1.45));
      g.save(); g.beginPath(); g.rect(0, 118, W, 134); g.clip();
      type(g, '57', nx, ry(6) + (1 - rise) * 140, { f: G.hx(166), fill: INK, align: 'left', base: 'alphabetic', track: -6 });
      g.restore();

      // ---- bloco de informação (fio fino + 3 linhas), move-se para o alto no rearranjo
      const ik = dry(seg(u, 3.74, 4.34));
      const ix = lerp(cx(8), cx(6), ik), iy = lerp(ry(4) + 12, ry(1), ik);
      const fp = dry(seg(u, 1.45, 1.9));
      g.fillStyle = INK; g.fillRect(ix, iy, (cx(12) - ix) * fp, 1.2);
      slideText(g, 'Exposição', ix, iy + 20, G.hb(14), INK, seg(u, 1.6, 2.0));
      slideText(g, '12.10 — 30.11', ix, iy + 38, G.hr(14), INK, seg(u, 1.7, 2.1));
      slideText(g, 'Museu do Design', ix, iy + 56, G.hr(14), INK, seg(u, 1.8, 2.2));

      // ---- fio de tempo no rodapé, com marcas nas colunas
      const lp = seg(u, .7, 7.2);
      g.fillStyle = INK; g.fillRect(cx(0), 258, (cx(12) - cx(0)) * lp, 1);
      for (let i = 0; i <= 12; i++) if (cx(i) <= cx(0) + (cx(12) - cx(0)) * lp) g.fillRect(cx(i), 255, 1, 7);
      // ---- bloco vermelho com o título dentro (segue o canto do bloco)
      let rc = lr(FULL, A, dry(seg(u, 0, .7)));
      if (u >= 3.5) rc = lr(A, B, dry(seg(u, 3.5, 4.1)));
      if (u >= 7.2) rc = lr(B, FULL, dry(seg(u, 7.2, 7.85)));
      const [x0, y0, x1, y1] = rc;
      g.fillStyle = RED; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
      const tx = x0 + 12, ty = y0 + 30;
      type(g, 'Forma', tx, ty, { f: G.hb(25), fill: '#fff', align: 'left', base: 'alphabetic', track: -.5 });
      type(g, 'segue a', tx, ty + 26, { f: G.hr(25), fill: '#fff', align: 'left', base: 'alphabetic', track: -.5 });
      type(g, 'função.', tx, ty + 52, { f: G.hr(25), fill: '#fff', align: 'left', base: 'alphabetic', track: -.5 });
      // número do bloco, no rodapé interno
      type(g, '→ 1957', tx, y1 - 11, { f: G.hs(14), fill: INK, align: 'left', base: 'alphabetic' });
      g.restore();

      filmGrain(g, W, H, t, .06, 9);
    };
  }

  // =====================================================================================
  // 3. LETTERING MANUSCRITO — pincel escrevendo "Saudade" num cartão, caneta com sombra
  // =====================================================================================
  {
    const D = 8, U = 33, SL = .2; // unidade = altura-x em px, inclinação
    // letras em unidades (y para baixo, linha de base 0, altura-x -1), origem da letra em ox
    const L_S = [[.15, -.75], [.75, -1.5], [1.45, -2.2], [1.72, -2.28], [1.62, -2.02], [1.18, -2.12], [.78, -2.02], [.7, -1.7], [.98, -1.28], [1.32, -.82], [1.36, -.38], [1.08, -.06], [.62, .02], [.2, -.14], [.02, -.42], [.18, -.62]];
    const L_a = [[.95, -.86], [.6, -1.02], [.22, -.8], [.04, -.4], [.16, -.06], [.46, 0], [.8, -.36], [1.0, -1.0], [.92, -.46], [.96, -.08], [1.16, -.02], [1.42, -.38]];
    const L_u = [[.36, -1.0], [.22, -.5], [.24, -.1], [.5, 0], [.8, -.36], [.98, -1.0], [.92, -.46], [.96, -.08], [1.16, -.02], [1.42, -.38]];
    const L_d = [[.95, -.86], [.6, -1.02], [.22, -.8], [.04, -.4], [.16, -.06], [.46, 0], [.82, -.4], [1.12, -1.3], [1.34, -2.18], [1.18, -1.4], [.98, -.46], [1.0, -.08], [1.2, -.02], [1.46, -.36]];
    const L_e = [[.48, -.58], [.76, -.84], [.6, -1.04], [.3, -.9], [.12, -.48], [.22, -.08], [.54, .02], [.9, -.18], [1.12, -.4]];
    const place = (pts, ox) => pts.map(([x, y]) => [ox + x, y]);
    const WORD = [
      { pts: place(L_S, 0), t0: .55, t1: 1.45 },
      { pts: [...place(L_a, 1.5), ...place(L_u, 2.9).slice(0), ...place(L_d, 4.15), ...place(L_a, 5.6), ...place(L_d, 6.85), ...place(L_e, 8.25)], t0: 1.75, t1: 4.75 },
      { pts: [[1.2, .72], [3.2, .46], [6.0, .5], [8.4, .42], [9.9, .12]], t0: 5.0, t1: 5.55, swash: true },
    ];
    const OX = -160, OY = 20; // posição da palavra no cartão
    function crPoint(p0, p1, p2, p3, s) {
      const d = (a, b) => Math.max(1e-4, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), .5));
      const t0 = 0, t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), tt = t1 + (t2 - t1) * s;
      const L = (a, b, ta, tb) => [((tb - tt) * a[0] + (tt - ta) * b[0]) / (tb - ta), ((tb - tt) * a[1] + (tt - ta) * b[1]) / (tb - ta)];
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3), B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      return L(B1, B2, t1, t2);
    }
    let BUILT = null;
    function build() {
      const sd = [SL, 1], sn = Math.hypot(...sd); sd[0] /= sn; sd[1] /= sn;
      return WORD.map((st) => {
        const P = st.pts.map(([x, y]) => [OX + (x - y * SL) * U, OY + y * U]);
        const E = [P[0], ...P, P[P.length - 1]], raw = [];
        for (let i = 1; i < E.length - 2; i++) for (let s = 0; s < 14; s++) raw.push(crPoint(E[i - 1], E[i], E[i + 1], E[i + 2], s / 14));
        raw.push(P[P.length - 1]);
        // reamostra por comprimento (1.2 px)
        const pts = [raw[0]], cum = [0]; let acc = 0;
        for (let i = 1; i < raw.length; i++) {
          let [ax, ay] = pts[pts.length - 1]; const [bx, by] = raw[i]; let dd = Math.hypot(bx - ax, by - ay);
          while (dd >= 1.2) { const k = 1.2 / dd; ax += (bx - ax) * k; ay += (by - ay) * k; pts.push([ax, ay]); acc += 1.2; cum.push(acc); dd = Math.hypot(bx - ax, by - ay); }
        }
        const n = pts.length, w = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1;
          const down = clamp((dx * sd[0] + dy * sd[1]) / dl);
          if (st.swash) { const s = i / (n - 1); w[i] = 1 + 5.2 * Math.pow(Math.sin(Math.PI * Math.pow(s, .8)), 1.3); }
          else w[i] = 1.3 + 6.4 * Math.pow(down, 1.6);
        }
        const ws = new Float32Array(n); // suaviza
        for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = -5; j <= 5; j++) { const q = i + j; if (q >= 0 && q < n) { s += w[q]; c++; } } ws[i] = s / c; }
        if (!st.swash) for (let i = 0; i < n; i++) { const e = Math.min(cum[i], acc - cum[i]); ws[i] = lerp(1.2, ws[i], clamp(e / 7)); }
        const Lx = new Float32Array(n), Ly = new Float32Array(n), Rx = new Float32Array(n), Ry = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          const h = ws[i] / 2; Lx[i] = pts[i][0] + nx * h; Ly[i] = pts[i][1] + ny * h; Rx[i] = pts[i][0] - nx * h; Ry[i] = pts[i][1] - ny * h;
        }
        return { ...st, pts, n, ws, Lx, Ly, Rx, Ry };
      });
    }
    const idxAt = (st, u) => Math.floor(eio(seg(u, st.t0, st.t1)) * (st.n - 1));
    function ribbon(g, st, i0, i1) {
      if (i1 - i0 < 1) return;
      g.beginPath(); g.moveTo(st.Lx[i0], st.Ly[i0]);
      for (let i = i0 + 1; i <= i1; i++) g.lineTo(st.Lx[i], st.Ly[i]);
      for (let i = i1; i >= i0; i--) g.lineTo(st.Rx[i], st.Ry[i]);
      g.closePath(); g.fill();
      const e = st.pts[i1]; g.beginPath(); g.arc(e[0], e[1], st.ws[i1] / 2, 0, TAU); g.fill();
      const s = st.pts[i0]; g.beginPath(); g.arc(s[0], s[1], st.ws[i0] / 2, 0, TAU); g.fill();
    }
    const CW = 396, CH = 214;
    const card = () => sprite('letCard', CW + 60, CH + 60, (c) => {
      c.translate(30, 30);
      c.save(); shadow(c, 22, 5, 10, 'rgba(0,0,0,.45)'); c.fillStyle = '#F4ECDD'; c.fillRect(0, 0, CW, CH); c.restore();
      c.save(); c.beginPath(); c.rect(0, 0, CW, CH); c.clip(); paper(c, CW, CH, '#F4ECDD', 21);
      c.fillStyle = lin(c, 0, 0, CW, CH, [[0, 'rgba(255,250,240,.5)'], [1, 'rgba(120,90,50,.10)']]); c.fillRect(0, 0, CW, CH); c.restore();
      c.strokeStyle = 'rgba(164,83,58,.55)'; c.lineWidth = 1; c.strokeRect(10.5, 10.5, CW - 21, CH - 21);
      type(c, 'PALAVRAS SEM TRADUÇÃO', CW / 2, 34, { f: font(700, 14, F.serif), fill: '#A4533A', track: 3 });
      c.fillStyle = 'rgba(164,83,58,.6)'; c.fillRect(CW / 2 - 18, 46, 36, 1.2);
      type(c, 'nº 3', CW - 26, CH - 22, { f: `italic 400 14px ${F.serif}`, fill: '#A4533A', align: 'right' });
    });
    const desk = () => sprite('letDesk', 480, 270, (c, w, h) => {
      c.fillStyle = '#2B1D15'; c.fillRect(0, 0, w, h);
      const r = rng(8); c.lineWidth = 1;
      for (let i = 0; i < 70; i++) { const y = r() * h, a = .04 + r() * .07; c.strokeStyle = r() > .5 ? `rgba(255,210,160,${a})` : `rgba(0,0,0,${a * 1.6})`; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 24) c.lineTo(x, y + Math.sin(x * .013 + i) * 3 + noise(x * .01, i) * 2); c.stroke(); }
      c.fillStyle = rad(c, 70, 20, 0, 460, [[0, 'rgba(255,196,120,.38)'], [.5, 'rgba(255,170,90,.08)'], [1, 'rgba(0,0,0,.5)']]); c.fillRect(0, 0, w, h);
    });
    const pen = () => sprite('letPen', 300, 24, (c) => { // caneta ao longo do eixo x, ponta em (0,12)
      c.fillStyle = lin(c, 0, 6, 0, 18, [[0, '#E9D08A'], [.5, '#B8903C'], [1, '#6E5220']]);
      c.beginPath(); c.moveTo(0, 12); c.lineTo(22, 8); c.lineTo(26, 8.5); c.lineTo(26, 15.5); c.lineTo(22, 16); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(60,40,10,.7)'; c.lineWidth = .8; c.beginPath(); c.moveTo(3, 12); c.lineTo(18, 12); c.stroke();
      c.fillStyle = lin(c, 0, 4, 0, 20, [[0, '#4a4a4f'], [.35, '#1b1b1e'], [1, '#050506']]);
      c.beginPath(); c.moveTo(26, 7); c.lineTo(70, 5); c.lineTo(300, 4); c.lineTo(300, 20); c.lineTo(70, 19); c.lineTo(26, 17); c.closePath(); c.fill();
      c.fillStyle = '#C9A24E'; c.fillRect(68, 4.6, 5, 14.8); c.fillRect(76, 4.5, 1.5, 15);
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(80, 7, 220, 1.6);
    });
    const penShadow = () => sprite('letPenSh', 320, 44, (c) => { c.save(); c.shadowBlur = 7; c.shadowColor = 'rgba(40,25,10,.55)'; c.shadowOffsetX = 0; c.shadowOffsetY = 300; c.fillStyle = '#000'; c.beginPath(); c.moveTo(10, 22 - 300); c.lineTo(310, 14 - 300); c.lineTo(310, 30 - 300); c.closePath(); c.fill(); c.restore(); });
    const PEN_A = .62; // ângulo do corpo da caneta
    function drawPen(g, x, y, lift) {
      const sp = penShadow(), pp = pen();
      g.save(); g.translate(x + 5 + lift * .9, y + 7 + lift * 1.3); g.rotate(PEN_A); g.globalAlpha = .75 - lift * .012; g.drawImage(sp, -10, -22, 320, 44); g.restore();
      g.save(); g.translate(x, y - lift); g.rotate(PEN_A); g.drawImage(pp, 0, -12, 300, 24); g.restore();
    }
    const NOTE = 'a presença de uma ausência', NX = -112, NY = 74, NT0 = 5.85, NT1 = 6.75;
    R['lettering-manuscrito'] = (g, t, W, H) => {
      const u = t % D; if (!BUILT) BUILT = build();
      g.drawImage(desk(), 0, 0, W, H);
      g.save(); g.translate(W / 2, H / 2 + 2); g.rotate(-.022);
      contact(g, 6, CH / 2 + 4, CW * .55, 10, .35);
      g.drawImage(card(), -CW / 2 - 30, -CH / 2 - 30, CW + 60, CH + 60);
      // tinta seca + tinta molhada (brilho fresco perto da ponta)
      let tip = null, writing = false;
      for (const st of BUILT) {
        if (u < st.t0) continue;
        const i1 = idxAt(st, u); g.fillStyle = '#1F2A48'; ribbon(g, st, 0, i1);
        const iw = idxAt(st, u - .7);
        if (i1 > iw) { g.fillStyle = 'rgba(62,92,160,.38)'; ribbon(g, st, Math.max(0, iw), i1); }
        if (u <= st.t1) { tip = st.pts[i1]; writing = true; }
      }
      // nota em letra de mão, revelada pela ponta
      g.font = font(500, 21, F.hand); const nw = g.measureText(NOTE).width, nk = eio(seg(u, NT0, NT1));
      if (nk > 0) {
        g.save(); g.beginPath(); g.rect(NX - 4, NY - 26, nw * nk + 4, 36); g.clip();
        type(g, NOTE, NX, NY, { f: font(500, 21, F.hand), fill: '#34406A', align: 'left', base: 'alphabetic' }); g.restore();
        if (u < NT1) { tip = [NX + nw * nk, NY - 6 + Math.sin(u * 60) * 4]; writing = true; }
      }
      // caneta: escreve, levanta entre traços, sai de cena
      let px, py, lift = 0;
      const S0 = BUILT[0], S1 = BUILT[1], S2 = BUILT[2];
      const gaps = [[-.2, S0.t0, [260, 170], S0.pts[0]], [S0.t1, S1.t0, S0.pts[S0.n - 1], S1.pts[0]], [S1.t1, S2.t0, S1.pts[S1.n - 1], S2.pts[0]], [S2.t1, NT0, S2.pts[S2.n - 1], [NX, NY - 6]], [NT1, 7.3, [NX + nw, NY - 6], [300, 190]]];
      if (writing && tip) { [px, py] = tip; }
      else {
        for (const [a, b, p0, p1] of gaps) if (u >= a && u < b) { const k = eio(seg(u, a, b)); px = lerp(p0[0], p1[0], k); py = lerp(p0[1], p1[1], k); lift = Math.sin(Math.PI * k) * 16 + (a === NT1 ? k * 30 : 0) + (a < 0 ? (1 - k) * 30 : 0); }
        if (px === undefined) { px = 300; py = 190; lift = 40; }
      }
      drawPen(g, px, py, lift);
      // troca de cartão: um cartão novo desliza por cima
      if (u >= 7.2) {
        const k = dry(seg(u, 7.2, 7.92)), ox = lerp(-520, 0, k), oy = lerp(40, 0, k);
        g.save(); g.translate(ox, oy); g.rotate(lerp(-.08, 0, k));
        contact(g, 6, CH / 2 + 4, CW * .55, 10, .35); g.drawImage(card(), -CW / 2 - 30, -CH / 2 - 30, CW + 60, CH + 60); g.restore();
      }
      g.restore();
      vignette(g, W, H, .35);
    };
  }

  // =====================================================================================
  // 4. MEME EDIT — foto do gato na geladeira, zoom seco, deep fried, freeze e "continua"
  // =====================================================================================
  {
    const D = 6.0;
    const room = () => sprite('memeRoom', 480, 270, (c, w, h) => {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#1F2941'], [1, '#101626']]); c.fillRect(0, 0, w, h);
      // armários
      c.fillStyle = '#18203A'; c.fillRect(0, 0, 300, 70); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let x = 0; x < 300; x += 75) c.strokeRect(x + 4, 4, 67, 60);
      c.fillStyle = '#2A3553'; c.fillRect(0, 140, 300, 8); c.fillStyle = '#141B2F'; c.fillRect(0, 148, 300, 70);
      // piso
      c.fillStyle = lin(c, 0, 212, 0, h, [[0, '#2A2B34'], [1, '#17181E']]); c.fillRect(0, 212, w, h - 212);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let i = -6; i < 14; i++) { c.beginPath(); c.moveTo(240 + i * 40, 212); c.lineTo(240 + i * 110, h); c.stroke(); } c.beginPath(); c.moveTo(0, 236); c.lineTo(w, 236); c.moveTo(0, 262); c.lineTo(w, 262); c.stroke();
      // geladeira aberta: interior aceso
      c.fillStyle = '#C9CED6'; c.fillRect(308, 8, 150, 212);
      c.fillStyle = lin(c, 318, 0, 448, 0, [[0, '#FFF3D0'], [.5, '#FFFBEA'], [1, '#F2E2B4']]); c.fillRect(318, 18, 130, 192);
      c.fillStyle = 'rgba(160,170,180,.9)'; for (const y of [70, 122, 168]) c.fillRect(318, y, 130, 4);
      const items = [[328, 40, 22, 30, '#E05A3A'], [356, 46, 16, 24, '#3F8F4A'], [380, 34, 26, 36, '#F2F2F2'], [412, 44, 24, 26, '#E8B23A'], [330, 92, 40, 30, '#8A5A3A'], [378, 98, 20, 24, '#C33'], [404, 86, 30, 36, '#DDE'], [336, 138, 60, 30, '#6FA4C8'], [404, 144, 26, 24, '#F0C060']];
      for (const [x, y, iw, ih, col] of items) { c.fillStyle = col; c.fillRect(x, y, iw, ih); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 2, y + 2, 3, ih - 4); }
      c.fillStyle = 'rgba(255,248,220,.25)'; c.fillRect(318, 18, 130, 192);
      // porta aberta (de lado)
      c.fillStyle = lin(c, 458, 0, 480, 0, [[0, '#E6E9EE'], [1, '#9AA2AE']]); poly(c, [[458, 4], [480, 0], [480, 230], [458, 222]]); c.fill();
      // luz derramada no chão e na parede
      c.fillStyle = rad(c, 360, 150, 10, 300, [[0, 'rgba(255,240,200,.35)'], [1, 'rgba(255,240,200,0)']]); c.fillRect(0, 0, w, h);
      c.fillStyle = lin(c, 300, 0, 60, 0, [[0, 'rgba(255,238,190,.35)'], [1, 'rgba(255,238,190,0)']]); poly(c, [[308, 218], [458, 222], [300, 270], [40, 270]]); c.fill();
    });
    function cat(c, u, fr) { // gato sentado olhando para a câmera, luz da geladeira pela direita
      const tilt = fr ? 0 : Math.sin(u * 1.4) * .05, pupil = fr ? (fr > 1 ? 1 : .85) : .55;
      contact(c, 232, 238, 70, 10, .55);
      // cauda
      c.strokeStyle = '#B8612A'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(270, 232); c.quadraticCurveTo(318, 236, 312 + Math.sin(u * 3) * 4, 206); c.stroke();
      // corpo
      c.fillStyle = lin(c, 180, 0, 290, 0, [[0, '#8E4A1E'], [.6, '#D98A43'], [1, '#F6C27E']]);
      c.beginPath(); c.moveTo(196, 238); c.bezierCurveTo(180, 200, 196, 156, 232, 152); c.bezierCurveTo(268, 156, 286, 200, 270, 238); c.closePath(); c.fill();
      c.fillStyle = '#F7E3C8'; c.beginPath(); c.ellipse(234, 206, 18, 30, 0, 0, TAU); c.fill();
      c.fillStyle = '#E9A45C'; c.beginPath(); c.ellipse(214, 236, 14, 6, 0, 0, TAU); c.ellipse(252, 236, 14, 6, 0, 0, TAU); c.fill();
      c.save(); c.translate(232, 124); c.rotate(tilt);
      // orelhas
      for (const s of [-1, 1]) { c.fillStyle = s > 0 ? '#E89A52' : '#B8642C'; poly(c, [[s * 20, -30], [s * 44, -64], [s * 46, -18]]); c.fill(); c.fillStyle = '#E7A0A0'; poly(c, [[s * 25, -30], [s * 41, -54], [s * 42, -24]]); c.fill(); }
      // cabeça
      c.fillStyle = rad(c, 18, -16, 6, 70, [[0, '#F7C27C'], [.55, '#D98A43'], [1, '#86441A']]);
      c.beginPath(); c.ellipse(0, 0, 52, 42, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,55,20,.55)'; for (const [x, w] of [[-14, 5], [0, 6], [14, 5]]) { c.beginPath(); c.ellipse(x, -32, w / 2, 9, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#F7E3C8'; c.beginPath(); c.ellipse(-10, 16, 16, 12, 0, 0, TAU); c.ellipse(10, 16, 16, 12, 0, 0, TAU); c.fill();
      // olhos arregalados
      for (const s of [-1, 1]) {
        const ex = s * 21, ey = -6; c.fillStyle = '#1A1206'; c.beginPath(); c.ellipse(ex, ey, 14.5, 14.5, 0, 0, TAU); c.fill();
        c.fillStyle = rad(c, ex, ey, 2, 14, [[0, '#E7F06A'], [1, '#8FA02A']]); c.beginPath(); c.arc(ex, ey, 13, 0, TAU); c.fill();
        c.fillStyle = '#0A0806'; c.beginPath(); c.ellipse(ex, ey, 12.5 * pupil, 12.5 * pupil, 0, 0, TAU); c.fill();
        c.fillStyle = '#FFFBEA'; c.fillRect(ex + 3, ey - 8, 5, 6); c.beginPath(); c.arc(ex - 5, ey + 5, 1.8, 0, TAU); c.fill();
      }
      c.fillStyle = '#E27C8A'; poly(c, [[-6, 8], [6, 8], [0, 15]]); c.fill();
      c.strokeStyle = '#5A2A1A'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 15); c.lineTo(0, 19); c.moveTo(-8, 22); c.quadraticCurveTo(-4, 25, 0, 19); c.quadraticCurveTo(4, 25, 8, 22); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { c.moveTo(s * 20, 17 + k * 3); c.lineTo(s * 58, 12 + k * 7); } c.stroke();
      c.restore();
    }
    const lo = (k, w, h) => cached('g2:memeLo' + k, w, h, () => {});
    function fried(g, W, H, u, z, fx, fy, lvl, sh, extra) {
      const w = lvl > 1 ? 150 : 200, h = Math.round(w * 9 / 16), cv = lo(lvl, w, h), c = cv.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.save(); c.scale(w / W, h / H); c.translate(W / 2 + sh[0], H / 2 + sh[1]); c.scale(z, z); c.translate(-fx, -fy);
      c.drawImage(room(), 0, 0, W, H); cat(c, u, lvl); if (extra) extra(c); c.restore();
      c.globalCompositeOperation = 'saturation'; c.fillStyle = '#ff0000'; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = .9; c.drawImage(cv, 0, 0);
      c.globalAlpha = lvl > 1 ? .45 : .3; c.fillStyle = '#FF5A00'; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      g.save(); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, W, H); g.restore();
      return cv;
    }
    const IMP = (px) => `400 ${px}px Impact, ${F.cond}`;
    const cap = (g, s, y, px = 32) => outlined(g, s, 240, y, IMP(px), '#fff', [['#000', px * .2]]);
    function arrow(g, x, y) { // seta "continua" (freeze frame)
      g.save(); g.translate(x, y);
      g.fillStyle = lin(g, 0, -17, 0, 17, [[0, '#D8C489'], [.5, '#A8904F'], [1, '#6F5C2C']]);
      poly(g, [[0, 0], [24, -19], [24, -12], [206, -12], [206, 12], [24, 12], [24, 19]]); g.fill();
      g.strokeStyle = '#2A2012'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
      type(g, 'Continua...', 118, 1, { f: `italic 400 20px ${F.serif}`, fill: '#2A2012' });
      g.restore();
    }
    R['meme-edit'] = (g, t, W, H, seed) => {
      const u = t % D, fr = Math.floor(t * 30), r = rng(fr + seed);
      if (u < 1.5) { // foto normal
        g.drawImage(room(), 0, 0, W, H); cat(g, u, 0);
        filmGrain(g, W, H, t, .16, 3);
        cap(g, 'EU ABRINDO A GELADEIRA', 44);
        if (u > .7) cap(g, 'PELA 5ª VEZ', 252, 36);
      } else if (u < 3.4) { // zooms secos com tremor, deep fried
        const lvl = u < 2.6 ? 1 : 2, e = lvl === 1 ? 1.5 : 2.6, d = u - e, amp = (d < .3 ? 14 * (1 - d / .3) : 0) + 2.2;
        const sh = [(r() - .5) * amp, (r() - .5) * amp];
        const z = lvl === 1 ? 2.3 : 4.6, fx = lvl === 1 ? 232 : 253, fy = lvl === 1 ? 128 : 118;
        fried(g, W, H, u, z, fx, fy, lvl, sh, (c) => {
          if (lvl === 1) { c.font = `44px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('😂', 168, 88); c.fillText('💯', 300, 170); }
          c.strokeStyle = '#FF1010'; c.lineWidth = lvl === 1 ? 5 : 3; c.beginPath(); c.ellipse(lvl === 1 ? 253 : 253, 118, 22 * (lvl === 1 ? 1 : .8), 22 * (lvl === 1 ? 1 : .8), 0, 0, TAU); c.stroke();
          if (lvl === 2) { c.font = `18px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💀', 268, 104); }
        });
        filmGrain(g, W, H, t, .3, 3);
        if (lvl === 1) { cap(g, 'EU ABRINDO A GELADEIRA', 44); cap(g, 'PELA 5ª VEZ', 252, 36); }
        else cap(g, 'BRUH', 250, 64);
      } else { // freeze frame sépia + seta
        const sh = [3, -2], cv = fried(g, W, H, 3.39, 4.6, 253, 118, 2, sh, (c) => { c.strokeStyle = '#FF1010'; c.lineWidth = 3; c.beginPath(); c.arc(253, 118, 17.6, 0, TAU); c.stroke(); c.font = `18px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💀', 268, 104); });
        g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = '#9C7A3C'; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'multiply'; g.fillStyle = '#E9D6A8'; g.fillRect(0, 0, W, H); g.restore();
        vignette(g, W, H, .5);
        filmGrain(g, W, H, t, .2, 3);
        arrow(g, lerp(-230, 20, outQ(seg(u, 3.5, 3.85))), 236);
      }
    };
  }

  // =====================================================================================
  // 5. LEGENDAS PALAVRA A PALAVRA — podcast, legenda condensada com a palavra da vez em destaque
  // =====================================================================================
  {
    const D = 6.4;
    const PAGES = [
      { t0: 0, t1: 1.25, w: [['VOCÊ', 0], ['NÃO', .3], ['PRECISA', .6]] },
      { t0: 1.25, t1: 2.6, w: [['DE', 1.25], ['MAIS', 1.45], ['TEMPO', 1.75, 1, '⏰']] },
      { t0: 2.6, t1: 3.4, w: [['PRECISA', 2.6], ['DE', 2.95]] },
      { t0: 3.4, t1: 5.0, w: [['FOCO.', 3.4, 1, '🎯']], big: true },
      { t0: 5.0, t1: 6.4, w: [['TODO', 5.0], ['DIA.', 5.35, 1]] },
    ];
    const WT = PAGES.flatMap((p) => p.w.map((w) => w[1])).concat([6.1]);
    const studio = () => sprite('legBg', 480, 270, (c, w, h) => {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#221C18'], [1, '#0F0D0C']]); c.fillRect(0, 0, w, h);
      // estante desfocada à direita
      c.save(); c.filter = 'blur(2.5px)';
      c.fillStyle = '#3A2C22'; c.fillRect(330, 40, 150, 6); c.fillRect(330, 110, 150, 6);
      const r = rng(4), cols = ['#6B3B2A', '#2F4A5C', '#8A6B3A', '#4B3B55', '#7A2E2E', '#3F5A44'];
      let x = 336; while (x < 470) { const bw = 7 + r() * 9, bh = 40 + r() * 22; c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, 110 - bh, bw, bh); x += bw + 1.5; }
      x = 340; while (x < 470) { const bw = 8 + r() * 10, bh = 26 + r() * 30; c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, 40 - bh + 60, bw, bh); x += bw + 2; }
      // planta à esquerda
      c.fillStyle = '#1E2E1E'; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(52 + Math.sin(i * 2.1) * 26, 120 - i * 9, 26, 7, -.6 + i * .3, 0, TAU); c.fill(); }
      c.fillStyle = '#2B211B'; c.fillRect(34, 160, 40, 50);
      c.restore();
      // abajur quente à esquerda
      c.fillStyle = rad(c, 60, 70, 0, 230, [[0, 'rgba(255,168,88,.42)'], [.4, 'rgba(255,140,60,.12)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,214,150,.9)'; c.beginPath(); c.ellipse(60, 64, 22, 14, 0, 0, TAU); c.fill();
      // neon "no ar"
      c.save(); c.shadowBlur = 14; c.shadowColor = '#FF2A4A'; type(c, 'no ar', 404, 150, { f: font(400, 28, F.script), fill: '#FF6D80' }); c.restore();
      // bokeh de luzes
      for (const [bx, by, br, a] of [[150, 30, 9, .18], [120, 52, 6, .14], [300, 24, 7, .12], [455, 180, 10, .12]]) { c.fillStyle = `rgba(255,200,130,${a})`; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); }
      // mesa
      c.fillStyle = lin(c, 0, 238, 0, h, [[0, '#3A2A1E'], [1, '#1B130D']]); c.fillRect(0, 238, w, h - 238);
      c.fillStyle = 'rgba(255,190,120,.25)'; c.fillRect(0, 238, w, 1.5);
    });
    const mic = () => sprite('legMic', 480, 270, (c) => {
      c.strokeStyle = '#1A1A1C'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-20, 40); c.lineTo(96, 96); c.lineTo(140, 150); c.stroke();
      c.strokeStyle = 'rgba(255,190,120,.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-20, 37); c.lineTo(96, 93); c.stroke();
      c.save(); c.translate(150, 158); c.rotate(-.75);
      c.fillStyle = lin(c, -16, 0, 16, 0, [[0, '#0B0B0C'], [.45, '#2A2A2E'], [1, '#0B0B0C']]); c.beginPath(); c.roundRect(-16, -38, 32, 76, 12); c.fill();
      c.fillStyle = '#18181A'; c.beginPath(); c.roundRect(-17, -40, 34, 30, 12); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-14, -34 + i * 5); c.lineTo(14, -34 + i * 5); c.stroke(); }
      c.fillStyle = 'rgba(255,180,110,.35)'; c.fillRect(-13, -8, 2, 40);
      c.restore();
    });
    function mouthOpen(u) {
      for (let i = 0; i < WT.length - 1; i++) { const a = WT[i], b = WT[i + 1]; if (u >= a && u < b) { const d = Math.min(.42, b - a) * .9, k = (u - a) / d; return k < 1 ? Math.abs(Math.sin(k * Math.PI * 2)) * .9 + .1 : .05; } }
      return .05;
    }
    function speaker(g, u) {
      const hx = 246 + Math.sin(u * 1.7) * 3, hy = 113 + Math.abs(Math.sin(u * 5)) * -1.5 + (u > 3.4 && u < 3.6 ? 3 : 0), tilt = Math.sin(u * 1.1) * .04;
      // torso (moletom)
      g.fillStyle = lin(g, 120, 0, 380, 0, [[0, '#3D4B66'], [.55, '#26304A'], [1, '#161C2C']]);
      g.beginPath(); g.moveTo(112, 270); g.bezierCurveTo(118, 196, 170, 170, 246, 168); g.bezierCurveTo(322, 170, 374, 196, 380, 270); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,90,110,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(312, 176); g.bezierCurveTo(350, 190, 372, 220, 378, 270); g.stroke(); // recorte do neon
      g.fillStyle = '#1B2236'; g.beginPath(); g.ellipse(246, 172, 40, 12, 0, 0, TAU); g.fill();
      g.strokeStyle = '#C9CFDA'; g.lineWidth = 2; g.beginPath(); g.moveTo(232, 178); g.lineTo(229, 214); g.moveTo(260, 178); g.lineTo(263, 214); g.stroke();
      // pescoço
      g.fillStyle = lin(g, hx - 15, 0, hx + 15, 0, [[0, '#B77C58'], [1, '#7E4C32']]); g.fillRect(hx - 15, hy + 22, 30, 34);
      g.save(); g.translate(hx, hy); g.rotate(tilt);
      // cabeça
      g.fillStyle = rad(g, -12, -10, 4, 46, [[0, '#EDBB96'], [.6, '#C98A63'], [1, '#8E573A']]);
      g.beginPath(); g.ellipse(0, 0, 29, 36, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,120,140,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 28, 35, 0, -1.1, .9); g.stroke(); // recorte do neon
      // barba curta
      g.fillStyle = 'rgba(40,26,18,.78)'; g.beginPath(); g.moveTo(-28, 4); g.bezierCurveTo(-26, 34, -12, 38, 0, 38); g.bezierCurveTo(12, 38, 26, 34, 28, 4); g.bezierCurveTo(22, 20, 12, 12, 0, 12); g.bezierCurveTo(-12, 12, -22, 20, -28, 4); g.fill();
      // cabelo
      g.fillStyle = '#1C140F'; g.beginPath(); g.moveTo(-30, -6); g.bezierCurveTo(-34, -44, 30, -50, 30, -8); g.bezierCurveTo(22, -26, -4, -30, -22, -20); g.closePath(); g.fill();
      // olhos, sobrancelhas, boca
      const blink = (u % 3.1) > 3.0 ? .15 : 1, brow = (u > .3 && u < .6) || (u > 3.4 && u < 3.9) ? -3 : 0;
      g.fillStyle = '#1A120E'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 11, -4, 3.4, 3.8 * blink, 0, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.8)'; for (const s of [-1, 1]) g.fillRect(s * 11 - 2, -6, 1.6, 1.6);
      g.strokeStyle = '#1C140F'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); for (const s of [-1, 1]) { g.moveTo(s * 5, -13 + brow); g.lineTo(s * 17, -14 + brow * .5); } g.stroke();
      g.strokeStyle = 'rgba(110,60,40,.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1, -2); g.lineTo(3, 8); g.lineTo(-1, 9); g.stroke();
      const o = mouthOpen(u); g.fillStyle = '#4A1F1A'; g.beginPath(); g.ellipse(0, 19, 8, 1.4 + 6 * o, 0, 0, TAU); g.fill();
      if (o > .45) { g.fillStyle = '#EDE6DC'; g.fillRect(-5, 19 - 6 * o + 1.2, 10, 2.2); }
      // fones
      g.strokeStyle = '#121214'; g.lineWidth = 6; g.beginPath(); g.arc(0, -4, 34, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      for (const s of [-1, 1]) { g.fillStyle = lin(g, s * 30, -14, s * 30, 18, [[0, '#2C2C30'], [1, '#0C0C0E']]); g.beginPath(); g.roundRect(s * 33 - 8, -12, 16, 28, 7); g.fill(); }
      g.fillStyle = 'rgba(255,190,120,.35)'; g.fillRect(-40, -8, 2, 18);
      g.restore();
    }
    const CAP = (px) => font(400, px, F.cond);
    R['legendas-palavra'] = (g, t, W, H) => {
      const u = t % D, page = PAGES.find((p) => u >= p.t0 && u < p.t1) || PAGES[0];
      g.save();
      if (page.big) { g.translate(246, 110); g.scale(1.16, 1.16); g.translate(-246, -110); } // corte com zoom na palavra-chave
      g.drawImage(studio(), 0, 0, W, H); speaker(g, u); g.drawImage(mic(), 0, 0, W, H);
      g.restore();
      vignette(g, W, H, .4);
      // legenda
      const px = page.big ? 72 : 52, y = 222, gap = px * .24;
      const vis = page.w.filter((w) => u >= w[1]); const act = vis[vis.length - 1];
      g.font = CAP(px); const ws = page.w.map((w) => g.measureText(w[0]).width * (w === act ? 1.1 : 1)); const tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
      let x = W / 2 - tot / 2;
      page.w.forEach((w, i) => {
        const on = u >= w[1], cx0 = x + ws[i] / 2; x += ws[i] + gap; if (!on) return;
        const isA = w === act, k = (u - w[1]) / .32, s = (.62 + .38 * spr(k)) * (isA ? 1.1 : 1);
        g.save(); g.translate(cx0, y); g.scale(s, s); g.rotate(isA && w[2] ? -.03 : 0);
        g.font = CAP(px); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
        g.fillStyle = 'rgba(0,0,0,.7)'; g.fillText(w[0], 0, 5);
        g.lineWidth = px * .2; g.strokeStyle = '#000'; g.strokeText(w[0], 0, 0);
        g.fillStyle = isA ? (w[2] ? '#39F26A' : '#FFE500') : '#FFFFFF'; g.fillText(w[0], 0, 0);
        g.restore();
        if (w[3]) { const ke = (u - w[1] - .08) / .4; if (ke > 0) { g.save(); g.translate(page.big ? cx0 + ws[i] / 2 + 34 : cx0, page.big ? y - 28 : y - px - 14); g.scale(spr(ke), spr(ke)); g.rotate(Math.sin(u * 7) * .12); g.font = `34px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(w[3], 0, 0); g.restore(); } }
      });
      filmGrain(g, W, H, t, .07, 4);
    };
  }

  // =====================================================================================
  // 6. LETREIRO DE VARIEDADES — pudim gigante no palco, telops com contorno duplo e wipe
  // =====================================================================================
  {
    const D = 7;
    const set = () => sprite('varSet', 480, 270, (c, w, h) => {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#FF8FC0'], [1, '#FFC2DC']]); c.fillRect(0, 0, w, h);
      // painel de raios atrás do pudim
      c.save(); c.translate(196, 150); for (let i = 0; i < 20; i++) { c.fillStyle = i % 2 ? '#FFE35A' : '#FFF2A6'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 420, i / 20 * TAU, (i + 1) / 20 * TAU); c.closePath(); c.fill(); } c.restore();
      c.fillStyle = rad(c, 196, 140, 20, 280, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,120,180,.25)']]); c.fillRect(0, 0, w, h);
      // bancada
      c.fillStyle = lin(c, 0, 206, 0, h, [[0, '#FFFFFF'], [1, '#F1E4EC']]); c.fillRect(0, 206, w, 12);
      c.fillStyle = lin(c, 0, 218, 0, h, [[0, '#2EC4D6'], [1, '#1A8FA6']]); c.fillRect(0, 218, w, h - 218);
      c.fillStyle = 'rgba(255,255,255,.85)'; for (let x = -20; x < w; x += 44) { c.beginPath(); c.arc(x + 22, 246, 7, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 218, w, 3);
    });
    const bulbs = (g, u) => { // lâmpadas de palco em arco (piscam em sequência)
      for (let i = 0; i < 17; i++) { const a = Math.PI * (1.04 + i / 16 * .92), x = 196 + Math.cos(a) * 176, y = 156 + Math.sin(a) * 140; const on = (i + Math.floor(u * 6)) % 3 === 0;
        g.fillStyle = on ? '#FFFBE0' : '#F2B84A'; g.beginPath(); g.arc(x, y, on ? 4.5 : 3.6, 0, TAU); g.fill(); if (on) { g.fillStyle = 'rgba(255,250,200,.35)'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); } }
    };
    function pudding(g, u) {
      const tap = 1.95, d = u - tap, j = d > 0 ? Math.exp(-d * 2.6) * Math.sin(d * 19) : 0, idle = Math.sin(u * 2.2) * .012;
      const sk = j * .22 + idle, sq = 1 - Math.abs(j) * .08;
      contact(g, 196, 214, 110, 12, .35);
      g.fillStyle = lin(g, 0, 200, 0, 218, [[0, '#FFFFFF'], [1, '#D9D2DA']]); g.beginPath(); g.ellipse(196, 208, 104, 13, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(196, 204, 84, 7, 0, 0, TAU); g.fill();
      g.save(); g.translate(196, 206); g.transform(1, 0, -sk, 1, 0, 0); g.scale(1 + (1 - sq) * .6, sq);
      const top = -92, rt = 50, rb = 70;
      g.fillStyle = lin(g, -rb, 0, rb, 0, [[0, '#D99A2B'], [.35, '#FFD978'], [.7, '#F7C24F'], [1, '#C98418']]);
      g.beginPath(); g.moveTo(-rb, 0); g.bezierCurveTo(-rb, 6, rb, 6, rb, 0); g.lineTo(rt, top); g.bezierCurveTo(rt, top - 12, -rt, top - 12, -rt, top); g.closePath(); g.fill();
      // calda escorrendo
      g.fillStyle = lin(g, 0, top - 14, 0, top + 40, [[0, '#7A2F08'], [1, '#B35A12']]);
      g.beginPath(); g.moveTo(-rt - 1, top); for (let i = 0; i <= 10; i++) { const x = -rt + i * rt * .2, dl = [18, 30, 14, 38, 20, 12, 34, 16, 26, 14, 20][i]; g.lineTo(x - 2, top + dl * .6); g.quadraticCurveTo(x + rt * .1, top + dl + 6, x + rt * .2, top + dl * .5); } g.lineTo(rt + 1, top); g.bezierCurveTo(rt, top - 12, -rt, top - 12, -rt - 1, top); g.fill();
      g.fillStyle = '#6A2604'; g.beginPath(); g.ellipse(0, top - 1, rt, 9, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,230,190,.75)'; g.beginPath(); g.ellipse(-16, top - 3, 18, 3, -.1, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-44, -18); g.bezierCurveTo(-42, -50, -38, -70, -34, -78); g.lineTo(-30, -76); g.bezierCurveTo(-34, -60, -36, -40, -38, -18); g.closePath(); g.fill();
      g.restore();
      // colher que bate
      const sk2 = seg(u, 1.55, tap), back = seg(u, tap + .12, tap + .6), sx = lerp(340, 262, eio(sk2)) + lerp(0, 90, eio(back)), sy = lerp(96, 128, eio(sk2)) - lerp(0, 30, eio(back));
      if (u > 1.5 && back < 1) { g.save(); g.translate(sx, sy); g.rotate(-.5); g.fillStyle = lin(g, 0, -6, 0, 6, [[0, '#FFFFFF'], [1, '#9AA3AE']]); g.beginPath(); g.ellipse(0, 0, 12, 7, 0, 0, TAU); g.fill(); g.fillRect(10, -2, 70, 4); g.restore(); }
      return j;
    }
    const sparkle = (g, x, y, r, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .22 : r, aa = i / 8 * TAU; g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } g.fill(); g.restore(); };
    function wipe(g, u) { // janela de reação no canto (ワイプ)
      const x = 352, y = 12, w = 116, h = 84;
      g.save(); shadow(g, 6, 0, 3, 'rgba(120,0,60,.35)'); g.fillStyle = '#FF3D8B'; g.beginPath(); g.roundRect(x - 4, y - 4, w + 8, h + 8, 14); g.fill(); g.restore();
      g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x - 1, y - 1, w + 2, h + 2, 12); g.fill();
      g.save(); g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 10); g.clip();
      g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#7FD7F0'], [1, '#B9ECF7']]); g.fillRect(x, y, w, h);
      const shock = u > 2.1 && u < 3.6, laugh = u >= 3.9 && u < 6.6, hx = x + 58 + (laugh ? Math.sin(u * 30) * 1.5 : 0), hy = y + 52 + (shock ? -3 : 0);
      g.fillStyle = '#34264A'; g.beginPath(); g.ellipse(hx, hy + 30, 40, 22, 0, 0, TAU); g.fill();
      g.fillStyle = '#2A1B14'; g.beginPath(); g.ellipse(hx, hy - 4, 28, 30, 0, 0, TAU); g.fill();
      g.fillStyle = rad(g, hx - 6, hy - 6, 2, 26, [[0, '#FFE0C8'], [1, '#E9AE8C']]); g.beginPath(); g.ellipse(hx, hy + 2, 20, 23, 0, 0, TAU); g.fill();
      g.fillStyle = '#2A1B14'; g.beginPath(); g.ellipse(hx, hy - 16, 22, 10, 0, Math.PI, TAU); g.fill(); g.fillRect(hx - 22, hy - 17, 44, 6);
      g.fillStyle = '#1A1010';
      if (laugh) { g.strokeStyle = '#1A1010'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.arc(hx - 8, hy + 1, 4, Math.PI * 1.1, Math.PI * 1.9); g.moveTo(hx + 12, hy + 1); g.arc(hx + 8, hy + 1, 4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.moveTo(hx - 8, hy + 10); g.quadraticCurveTo(hx, hy + 22, hx + 8, hy + 10); g.closePath(); g.fill(); }
      else { const e = shock ? 4.5 : 2.8; g.beginPath(); g.arc(hx - 8, hy, e, 0, TAU); g.arc(hx + 8, hy, e, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(hx - 9, hy - 2, 1.6, 1.6); g.fillRect(hx + 7, hy - 2, 1.6, 1.6); g.fillStyle = '#8A2F2F'; g.beginPath(); g.ellipse(hx, hy + 12, shock ? 4 : 5, shock ? 5 : 1.8, 0, 0, TAU); g.fill(); }
      if (shock) { const k = seg(u, 2.2, 3.4), dy = eio(k) * 16; g.fillStyle = '#5BC8FF'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx + 22, hy - 16 + dy); g.quadraticCurveTo(hx + 30, hy - 4 + dy, hx + 22, hy - 2 + dy); g.quadraticCurveTo(hx + 14, hy - 4 + dy, hx + 22, hy - 16 + dy); g.fill(); g.stroke(); }
      g.restore();
      if (u > 2.15 && u < 3.7) { const k = spr((u - 2.15) / .35); g.save(); g.translate(x - 8, y + 70); g.scale(k, k); g.rotate(-.15); outlined(g, '!?', 0, 0, font(400, 30, F.slab), '#FFE600', [['#fff', 12], ['#1E1E2E', 6]]); g.restore(); }
      if (laugh) { const k = spr((u - 3.9) / .3); g.save(); g.translate(x + w / 2, y + h + 18); g.scale(k, k); g.fillStyle = '#1E1E2E'; g.beginPath(); g.roundRect(-34, -11, 68, 22, 11); g.fill(); type(g, '(risos)', 0, 1, { f: font(700, 15, F.body), fill: '#fff' }); g.restore(); }
    }
    function telop(g, s, x, y, px, cols, u0, u, out) { // letras pulam uma a uma, contorno duplo
      const k0 = u - u0; if (k0 < 0) return; const ko = out ? seg(u, out, out + .18) : 0; if (ko >= 1) return;
      const f = font(400, px, F.slab); g.font = f; const tw = g.measureText(s).width;
      const sh = k0 < .25 ? (rng(Math.floor(u * 60))() - .5) * 6 : 0, L = []; let x0 = x - tw / 2;
      for (let i = 0; i < s.length; i++) { const cw = g.measureText(s[i]).width, k = (k0 - i * .035) / .38; if (k > 0) { const sc = spr(k); L.push([s[i], x0 + cw / 2 + sh, (1 - sc) * 26, sc]); } x0 += cw; }
      g.save(); g.translate(x, y); const so = 1 - inQ(ko); g.scale(so, so); g.translate(-x, -y);
      g.font = f; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      const pass = (fn) => { for (const [ch, lx, dy, sc] of L) { g.save(); g.translate(lx, y + dy); g.scale(sc, sc); fn(ch); g.restore(); } };
      pass((ch) => { g.strokeStyle = 'rgba(70,0,50,.4)'; g.lineWidth = px * .44; g.strokeText(ch, 3, 5); });
      pass((ch) => { g.strokeStyle = '#fff'; g.lineWidth = px * .44; g.strokeText(ch, 0, 0); });
      pass((ch) => { g.strokeStyle = '#2A1033'; g.lineWidth = px * .2; g.strokeText(ch, 0, 0); });
      pass((ch) => { g.fillStyle = lin(g, 0, -px * .72, 0, 0, [[0, cols[0]], [1, cols[1]]]); g.fillText(ch, 0, 0); });
      g.restore();
    }
    R['letreiro-variedades'] = (g, t, W, H) => {
      const u = t % D;
      g.drawImage(set(), 0, 0, W, H); bulbs(g, u);
      const j = pudding(g, u);
      // brilhos no pudim (depois do 2º letreiro)
      if (u > 3.6 && u < 6.7) for (const [sx, sy, ph] of [[150, 110, 0], [238, 96, 1.7], [120, 170, 3.1], [270, 160, 4.4]]) { const a = Math.max(0, Math.sin(u * 5 + ph)); if (a > .05) sparkle(g, sx, sy, 5 + a * 7, u + ph); }
      // onomatopeia com linhas de impacto
      if (u > 1.95 && u < 3.45) {
        const k = seg(u, 1.95, 2.1); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
        for (let i = 0; i < 9; i++) { const a = -2.6 + i * .28, r0 = 108 + (i % 2) * 8, r1 = r0 + 22 * k; g.moveTo(196 + Math.cos(a) * r0, 150 + Math.sin(a) * r0 * .8); g.lineTo(196 + Math.cos(a) * r1, 150 + Math.sin(a) * r1 * .8); } g.stroke();
        g.save(); g.translate(78, 118); g.rotate(-.16 + j * .3); const ch = 'BOIIIN!'; g.font = font(400, 30, F.slab); let x = -g.measureText(ch).width / 2;
        for (let i = 0; i < ch.length; i++) { const cw = g.measureText(ch[i]).width, kk = spr((u - 1.97 - i * .04) / .3); if (kk > 0) outlined(g, ch[i], x + cw / 2, Math.sin(u * 14 + i) * 3 * (1 - seg(u, 2.4, 3)), font(400, 30 * kk, F.slab), '#FF3D8B', [['#fff', 12], ['#3A0A2A', 6]]); x += cw; }
        g.restore();
      }
      wipe(g, u);
      // selo do programa
      g.save(); g.translate(16, 14); g.rotate(-.05); g.fillStyle = '#2A1033'; g.beginPath(); g.roundRect(0, 0, 118, 40, 10); g.fill();
      type(g, 'SÁBADO', 59, 15, { f: font(800, 16, F.display), fill: '#FFE600', track: 1 }); type(g, 'ANIMADO', 59, 31, { f: font(800, 14, F.display), fill: '#FF8FC0', track: 2 }); g.restore();
      // faixa pequena + letreiros principais
      const bk = spr(seg(u, .25, .75)), bo = seg(u, 6.55, 6.8);
      if (u > .25 && bo < 1) { g.save(); g.translate(lerp(-200, 0, bk) - bo * 240, 0); g.fillStyle = '#FF3D8B'; poly(g, [[0, 60], [214, 60], [202, 82], [0, 82]]); g.fill(); type(g, 'DESAFIO DA SEMANA', 16, 71.5, { f: font(700, 15, F.body), fill: '#fff', align: 'left', track: 1 }); g.restore(); }
      telop(g, 'PUDIM DE 5 KG?!', 240, 248, 36, ['#FFF7A8', '#FFB000'], .6, u, 3.35);
      telop(g, 'TREMEU TUDO!!', 240, 248, 38, ['#FFE8F3', '#FF3D8B'], 3.55, u, 6.6);
    };
  }

  // =====================================================================================
  // 7. BONECO PALITO — o botão "NÃO APERTE" e o alçapão (timing de piada seca)
  // =====================================================================================
  {
    const D = 6.8, OFF = .6, FLOOR = 208, HOLE = [222, 278], SK = 1.32, BX = 304, SX = 390, STOP = 250;
    const bone = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    const limb = (x, y, a1, l1, a2, l2) => { const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1; return [[x, y], [kx, ky], [kx + Math.sin(a1 + a2) * l2, ky + Math.cos(a1 + a2) * l2]]; };
    function figure(g, x, y, pose, jit) { // y = quadril
      const j = () => (jit() - .5) * 1.1, T = 34 * SK, Lg = 21 * SK, Ar = 17 * SK, HR = 11.5 * SK;
      const nk = [x + pose.lean * 30 + j(), y - T + j()], hd = [nk[0] + pose.lean * 8, nk[1] - HR - 2];
      g.strokeStyle = '#111'; g.lineWidth = 3.8; g.lineCap = 'round'; g.lineJoin = 'round';
      bone(g, [[x, y], nk]);
      bone(g, limb(x, y, pose.l1, Lg, pose.k1, Lg)); bone(g, limb(x, y, pose.l2, Lg, pose.k2, Lg));
      const sh = [nk[0], nk[1] + 6]; bone(g, limb(sh[0], sh[1], pose.a1, Ar, pose.e1, Ar)); bone(g, limb(sh[0], sh[1], pose.a2, Ar, pose.e2, Ar));
      g.fillStyle = '#fff'; g.beginPath(); g.arc(hd[0] + j() * .4, hd[1], HR, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#111';
      if (pose.face) { g.beginPath(); g.arc(hd[0] - 5, hd[1] - 1, 2, 0, TAU); g.arc(hd[0] + 5, hd[1] - 1, 2, 0, TAU); g.fill(); if (pose.face > 1) { g.lineWidth = 2; g.beginPath(); g.moveTo(hd[0] - 4, hd[1] + 7); g.lineTo(hd[0] + 4, hd[1] + 7); g.stroke(); } }
      else if (pose.look) { g.beginPath(); g.arc(hd[0] + 8 * pose.look, hd[1] - 1, 2, 0, TAU); g.fill(); }
      return hd;
    }
    function balloon(g, x, y, s, k) { // balão manuscrito com rabicho para a cabeça (abaixo, à direita)
      if (k <= 0) return; const sc = spr(k); g.save(); g.translate(x, y); g.scale(sc, sc);
      g.font = font(700, 24, F.hand); const w = Math.max(56, g.measureText(s).width + 26), h = 36;
      g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 2.2; g.lineJoin = 'round';
      g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(8, h / 2 - 3); g.lineTo(22, h / 2 + 14); g.lineTo(18, h / 2 - 5); g.fill(); g.stroke();
      g.fillRect(6, h / 2 - 7, 14, 5);
      type(g, s, 0, 1, { f: font(700, 24, F.hand), fill: '#111' }); g.restore();
    }
    const sfx = (g, s, x, y, px, rot, k, col = '#111') => { if (k <= 0 || k >= 1.8) return; const sc = spr(k * 1.2); g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); type(g, s, 0, 0, { f: font(400, px, F.marker), fill: col }); g.restore(); };
    R['boneco-palito'] = (g, t, W, H, seed) => {
      const u = (t + OFF) % D, jit = rng(Math.floor(t * 12) + seed);
      paper(g, W, H, '#FDFCF7', 5);
      g.fillStyle = rad(g, 230, 60, 10, 380, [[0, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, W, H);
      // câmera: punch-in seco nos dois olhares para a câmera
      const HY = FLOOR - 42 * SK - 34 * SK - 12 * SK;
      const pz = (u >= 2.75 && u < 3.25) ? 1.55 : (u >= 3.95 && u < 4.4) ? 1.45 : 1;
      g.save(); if (pz > 1) { g.translate(W / 2, H / 2); g.scale(pz, pz); g.translate(-STOP + 10, -HY - 20); }
      // alçapão: buraco e tampa articulada
      const open = dry(seg(u, 3.78, 3.9)) * (1 - eio(seg(u, 5.05, 5.35))), ang = open * 1.42 + (open > .9 ? Math.sin(u * 22) * .05 * (1 - seg(u, 3.9, 4.4)) : 0);
      if (open > .01) { g.fillStyle = lin(g, 0, FLOOR, 0, FLOOR + 62, [[0, '#0E0E0E'], [1, '#3A3A3A']]); g.fillRect(HOLE[0], FLOOR, HOLE[1] - HOLE[0], 62); }
      // botão no pedestal
      const press = seg(u, 3.3, 3.42) * (1 - seg(u, 3.7, 3.9));
      contact(g, BX, FLOOR + 2, 30, 4, .2);
      g.strokeStyle = '#111'; g.lineWidth = 3.2; g.lineJoin = 'round'; g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(BX - 15, FLOOR); g.lineTo(BX - 11, 158); g.lineTo(BX + 11, 158); g.lineTo(BX + 15, FLOOR); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(BX, 158, 20, 5.5, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#E3261B'; g.beginPath(); g.ellipse(BX, 152 + press * 4, 12, 5.5, 0, Math.PI, TAU); g.lineTo(BX + 12, 156); g.ellipse(BX, 156, 12, 4, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(BX - 7, 149 + press * 4, 6, 2);
      // placa
      g.strokeStyle = '#111'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(SX, FLOOR); g.lineTo(SX + (jit() - .5) * .8, 130); g.stroke();
      contact(g, SX, FLOOR + 1, 14, 3, .16);
      g.save(); g.translate(SX - 4, 98); g.rotate(-.035 + Math.sin(u * 1.3) * .008); g.fillStyle = '#fff'; g.beginPath(); g.rect(-80, -33, 160, 66); g.fill(); g.stroke();
      type(g, 'NÃO APERTE', 0, -12, { f: font(700, 25, F.hand), fill: '#111' });
      const n = u >= 5.55 ? 47 : 46, bump = u >= 5.55 ? spr((u - 5.55) / .35) : 1;
      g.font = font(500, 18, F.hand); const lw = g.measureText('já apertaram: ').width;
      type(g, 'já apertaram: ', -lw / 2 - 10, 15, { f: font(500, 18, F.hand), fill: '#555', align: 'left' });
      g.save(); g.translate(lw / 2 + 2, 15); g.scale(2.2 - 1.2 * bump, 2.2 - 1.2 * bump); type(g, String(n), 0, 0, { f: font(700, 20, F.hand), fill: n === 47 ? '#E3261B' : '#111' }); g.restore();
      g.restore();
      // chão desenhado à mão, com a tampa do alçapão
      g.strokeStyle = '#111'; g.lineWidth = 3.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-30, FLOOR + (jit() - .5)); for (let x = -10; x <= HOLE[0]; x += 29) g.lineTo(Math.min(x, HOLE[0]), FLOOR + noise(x * .05, 2) * .8 + (jit() - .5) * .6); g.lineTo(HOLE[0], FLOOR); g.stroke();
      g.beginPath(); g.moveTo(HOLE[1], FLOOR); for (let x = HOLE[1] + 29; x <= W + 30; x += 29) g.lineTo(x, FLOOR + noise(x * .05, 2) * .8 + (jit() - .5) * .6); g.stroke();
      g.save(); g.translate(HOLE[0], FLOOR); g.rotate(ang); g.fillStyle = '#fff'; g.lineWidth = 2.6; g.beginPath(); g.rect(0, -1.5, HOLE[1] - HOLE[0], 5); g.fill(); g.stroke(); g.restore();
      // personagem
      let x, y = FLOOR - 42 * SK, pose = { lean: 0, l1: .15, k1: -.1, l2: -.15, k2: .1, a1: .35, e1: -.2, a2: -.35, e2: .2 };
      if (u < 2.1) { // caminha até o botão
        const k = u / 2.1, ph = u * 9.5, sw = Math.sin(ph) * (1 - seg(u, 1.9, 2.1)); x = lerp(-40, STOP, 1 - Math.pow(1 - k, 1.6));
        pose = { lean: .06, l1: sw * .55, k1: -Math.max(0, -Math.cos(ph)) * .7, l2: -sw * .55, k2: -Math.max(0, Math.cos(ph)) * .7, a1: -sw * .6, e1: -.4, a2: sw * .6, e2: -.4, look: 1 };
        y -= Math.abs(Math.cos(ph)) * 3 * (1 - seg(u, 1.9, 2.1));
      } else x = STOP;
      if (u >= 2.1 && u < 2.75) pose.look = 1; // lê a placa
      if (u >= 2.75 && u < 3.25) pose.face = 1; // olha para a câmera
      if (u >= 3.25 && u < 3.78) { const k = eio(seg(u, 3.25, 3.4)) * (1 - eio(seg(u, 3.55, 3.75))); pose.a1 = lerp(.35, 1.75, k); pose.e1 = lerp(-.2, .1, k); pose.look = 1; }
      let fall = 0;
      if (u >= 3.78) { pose.face = 2; pose.a1 = 2.6; pose.a2 = -2.6; pose.e1 = .4; pose.e2 = -.4; pose.l1 = .12; pose.l2 = -.12; } // parado no ar
      if (u >= 4.4) { fall = inQ(seg(u, 4.4, 4.72)) * 210; pose.face = 1; }
      if (u < 4.75) {
        g.save(); g.beginPath(); g.rect(-200, -200, W + 400, FLOOR + 201.6); g.rect(HOLE[0] + 2, FLOOR, HOLE[1] - HOLE[0] - 4, 90); g.clip();
        contact(g, x, FLOOR + 2, 18 * (1 - seg(u, 3.78, 3.86)), 3.5, .2);
        if (fall > 0) { g.strokeStyle = 'rgba(17,17,17,.45)'; g.lineWidth = 2; g.beginPath(); for (const dx of [-14, 0, 14]) { g.moveTo(x + dx, y - 90 + fall - 6); g.lineTo(x + dx, y - 90 + fall - 44); } g.stroke(); }
        figure(g, x, y + fall, pose, jit); g.restore();
      }
      // falas e efeitos
      const bx = STOP - 44, by = HY - 44;
      if (u > 2.15 && u < 2.75) balloon(g, bx, by, 'hmm.', (u - 2.15) / .3);
      if (u > 2.8 && u < 3.25) balloon(g, bx, by, '...', (u - 2.8) / .25);
      sfx(g, 'CLIQUE!', BX + 34, 138, 18, .2, (u - 3.34) / .3, '#E3261B');
      if (u > 3.95 && u < 4.4) balloon(g, bx, by, 'ah.', (u - 3.95) / .25);
      if (u > 4.45 && u < 5.0) sfx(g, 'fiuuu', STOP - 58, 176 + seg(u, 4.45, 5) * 10, 20, -.2, (u - 4.45) / .3);
      if (u > 4.85 && u < 5.5) { const k = seg(u, 4.85, 5.3); g.strokeStyle = '#111'; g.lineWidth = 2.2; for (const [dx, r0] of [[-18, 7], [0, 11], [18, 7]]) { g.beginPath(); g.arc(STOP + dx * (1 + k), FLOOR - 7 - k * 14, r0 * (.6 + k * .6), 0, TAU); g.stroke(); } sfx(g, 'POF!', STOP, FLOOR - 40 - k * 6, 26, -.08, (u - 4.85) / .3); }
      if (u > 5.2 && u < 5.62) sfx(g, 'clac', STOP, FLOOR + 26, 16, 0, (u - 5.2) / .25);
      g.restore();
    };
  }
})();
