// Grupo 3 — dados e interface: infografico-animado, mapa-animado, isotype, linha-do-tempo, demo-de-interface,
// vidro-fosco-aurora, hud-cyberpunk, terminal-codigo, neo-brutalismo.
// Zonas cobertas pelos selos do monitor: canto sup. direito (x > 210, y < 38) e inf. esquerdo (x < 115, y > 232).
(() => {
  // ---------- utilitários locais ----------
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const quint = (x) => 1 - Math.pow(1 - clamp(x), 5);            // desaceleração enfática (easing de sistema)
  const inq = (x) => Math.pow(clamp(x), 3);                        // saída acelerando
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const pool = {};
  const buf = (k, w, h) => pool[k] || (pool[k] = mk(w, h));
  // sprite em 2x (nítido em DPR 2); shadowBlur/offset dentro do sprite precisam ser dobrados à mão
  const S2 = (key, w, h, draw) => cached('g3:' + key, Math.ceil(w * 2), Math.ceil(h * 2), (c) => { c.scale(2, 2); draw(c, w, h); });
  const NF0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const NF1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const tw = (g, s, f) => { g.font = f; return g.measureText(s).width; };

  // =====================================================================================================
  // 1. INFOGRÁFICO ANIMADO — barras do zero, contador rolando, um dado em cor e o resto em cinza
  // =====================================================================================================
  {
    const YR = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
    const V = [45.5, 48.0, 52.5, 57.6, 62.5, 66.6, 69.8, 73.9, 76.8];
    const X0 = 60, BW = 24, P = 35, YB = 208, K = 1.62, AC = '#FF6A3D';
    R['infografico-animado'] = (g, t, W, H) => {
      const T = t % 8;
      g.drawImage(S2('ig-bg', W, H, (c) => {
        c.fillStyle = '#0B0E14'; c.fillRect(0, 0, W, H);
        c.fillStyle = rad(c, 150, 30, 0, 430, [[0, 'rgba(60,76,112,.55)'], [.6, 'rgba(22,28,42,.25)'], [1, 'rgba(11,14,20,0)']]); c.fillRect(0, 0, W, H);
      }), 0, 0, W, H);

      // câmera: aproximação lenta no dado em destaque, volta no fim
      const cam = eio(seg(T, 2.2, 6.9)) * (1 - eio(seg(T, 7.3, 7.95)));
      const s = 1 + .05 * cam;
      g.save(); g.translate(352, 150); g.scale(s, s); g.translate(-352, -150);

      // grade e eixo
      g.lineWidth = 1;
      [20, 40, 60, 80].forEach(v => {
        const y = YB - v * K; g.strokeStyle = 'rgba(150,165,190,.13)'; g.beginPath(); g.moveTo(44, y); g.lineTo(368, y); g.stroke();
        if (v % 40 === 0) type(g, String(v), 38, y, { f: font(500, 14, F.mono), fill: '#5D6679', align: 'right' });
      });
      g.strokeStyle = '#6A7387'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(44, YB + .75); g.lineTo(368, YB + .75); g.stroke();

      // barras cinza
      for (let i = 0; i < 8; i++) {
        const gk = ease(seg(T, .02 + i * .17, .57 + i * .17)) * (1 - eio(seg(T, 7.35 + i * .055, 7.55 + i * .055)));
        const x = X0 + i * P, h = V[i] * K * gk;
        g.fillStyle = lin(g, 0, YB - 125, 0, YB, [[0, '#3C4557'], [1, '#2A303D']]); g.fillRect(x, YB - h, BW, h);
        if (h > 3) { g.fillStyle = '#4B5569'; g.fillRect(x, YB - h, BW, 2); }
        g.fillStyle = '#6A7387'; g.fillRect(x + BW / 2 - .5, YB + 2, 1, 4);
      }
      // valor de 1940 (âncora da comparação)
      const a0 = ease(seg(T, .6, .9)) * (1 - seg(T, 7.3, 7.4));
      if (a0 > 0) { g.save(); g.beginPath(); g.rect(X0 - 12, YB - V[0] * K - 26, 50, 18 * a0 + 4); g.clip(); type(g, '45,5', X0 + BW / 2, YB - V[0] * K - 12 + (1 - a0) * 10, { f: font(500, 14, F.mono), fill: '#9AA3B5' }); g.restore(); }

      // barra em destaque + contador
      const hk = eio(seg(T, 2.0, 3.5)) * (1 - eio(seg(T, 7.62, 7.98)));
      const x8 = X0 + 8 * P, h8 = V[8] * K * hk, top = YB - h8;
      if (h8 > 0) {
        g.fillStyle = lin(g, 0, YB - V[8] * K, 0, YB, [[0, '#FF8A57'], [1, '#D8432A']]); g.fillRect(x8, top, BW, h8);
        g.fillStyle = 'rgba(255,214,190,.9)'; g.fillRect(x8, top, BW, 2);
        // brilho que sobe pela barra (movimento secundário)
        const sh = seg((T - 3.8) % 2.2, 0, .9);
        if (T > 3.8 && T < 7.3 && sh > 0 && sh < 1) { g.save(); g.beginPath(); g.rect(x8, top, BW, h8); g.clip(); const yy = YB - sh * (h8 + 30); g.fillStyle = lin(g, 0, yy - 18, 0, yy + 18, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(x8, yy - 18, BW, 36); g.restore(); }
        if (hk > .03) type(g, NF1.format(V[8] * hk), 376, YB - V[8] * K + 6, { f: font(800, 30, F.display), fill: '#F4F6FA', align: 'left', base: 'alphabetic' });
        if (hk > .03) type(g, 'anos', 377, YB - V[8] * K + 24, { f: font(500, 14, F.body), fill: '#9AA3B5', align: 'left' });
      }
      g.fillStyle = AC; g.fillRect(x8 + BW / 2 - .5, YB + 2, 1, 4);

      // comparação: linha de 1940 atravessa o gráfico, ganho em cor
      const dl = ease(seg(T, 3.75, 4.4)) * (1 - eio(seg(T, 7.2, 7.5)));
      if (dl > 0) {
        const y0 = YB - V[0] * K, xa = X0 + BW, xb = xa + (x8 + BW + 8 - xa) * dl;
        g.save(); g.strokeStyle = AC; g.globalAlpha = .9; g.lineWidth = 1.5; g.setLineDash([4, 4]); g.lineDashOffset = -T * 14;
        g.beginPath(); g.moveTo(xa, y0); g.lineTo(xb, y0); g.stroke(); g.restore();
        const pk = spr(seg(T, 4.25, 4.85)) * (1 - eio(seg(T, 7.2, 7.4)));
        if (pk > 0) {
          g.save(); g.translate(376, y0 + 20); g.scale(pk, pk);
          type(g, '+31,3', 0, 0, { f: font(700, 19, F.body), fill: AC, align: 'left' });
          type(g, 'desde 1940', 1, 20, { f: font(500, 14, F.body), fill: '#9AA3B5', align: 'left' });
          g.restore();
        }
      }
      g.restore();

      // rótulos fixos (fora da câmera)
      type(g, '1940', X0 + BW / 2, 226, { f: font(500, 14, F.mono), fill: '#7F889B' });
      type(g, '1980', X0 + 4 * P + BW / 2, 226, { f: font(500, 14, F.mono), fill: '#7F889B' });
      type(g, '2020', x8 + BW / 2, 226, { f: font(600, 14, F.mono), fill: AC });
      type(g, 'BRASIL · 1940–2020', 24, 24, { f: font(500, 14, F.mono), fill: '#7F889B', align: 'left', track: 1.2 });
      type(g, 'Expectativa de vida', 24, 50, { f: font(800, 22, F.display), fill: '#F2F4F8', align: 'left' });
      type(g, 'Fonte: IBGE', 466, 254, { f: font(400, 14, F.mono), fill: '#5D6679', align: 'right' });
    };
  }

  // =====================================================================================================
  // 2. MAPA ANIMADO — mapa envelhecido, rota tracejada com a caravela na ponta, zoom e território que se pinta
  // =====================================================================================================
  {
    const NA = [[-66, 45], [-70, 43.5], [-70, 41.6], [-74, 40.5], [-76, 38], [-75.5, 35.5], [-78, 34], [-81, 31.5], [-80.2, 27], [-80.5, 25.2], [-81.8, 26.5], [-82.7, 28.5], [-84, 30], [-86, 30.4], [-89, 30.2], [-90, 29.2], [-94, 29.6], [-97.3, 27.5], [-97.5, 24], [-97.2, 21.5], [-96, 19], [-94.5, 18.2], [-91, 18.6], [-90.4, 21], [-87, 21.5], [-87.6, 18.5], [-88.2, 16], [-86, 15.8], [-83.3, 15], [-83.6, 11], [-82, 9], [-79.5, 9.5], [-77.3, 8.5], [-78, 7.8], [-80.5, 7.3], [-83, 8.2], [-85.7, 10], [-87.5, 13], [-91.5, 14], [-95, 16], [-100, 17], [-110, 23], [-125, 48]];
    const SA = [[-77.5, 7.5], [-75.5, 10.5], [-72, 11.8], [-71.3, 10.8], [-67, 10.6], [-62, 10.6], [-60, 8.5], [-57, 6], [-53.5, 5.6], [-51.5, 4.2], [-50, 1.8], [-48.5, -1], [-44.5, -2.5], [-41, -2.9], [-37.5, -4.6], [-35.4, -5.3], [-34.8, -7.5], [-35.2, -9], [-36.4, -10.5], [-37.2, -11.3], [-38.5, -12.9], [-39, -14], [-39, -15.5], [-39.1, -16.5], [-39.2, -17.7], [-39.7, -19.5], [-40.3, -20.3], [-41, -21.6], [-41.9, -22.8], [-43.2, -23], [-44.7, -23.4], [-46.5, -24], [-48, -25.3], [-48.6, -26.5], [-48.6, -28.3], [-49.7, -29.5], [-51, -31], [-52.5, -33], [-53.5, -34], [-55, -34.9], [-57.5, -35.2], [-57.2, -36.5], [-57.7, -38.2], [-62, -39], [-62.3, -40.8], [-65, -42], [-65, -45], [-67.5, -46.3], [-65.8, -48], [-68.5, -50.5], [-69, -52.5], [-71, -54], [-74, -52], [-75.5, -48], [-74, -43], [-73.5, -37], [-71.5, -30], [-70.3, -18.3], [-75.5, -15], [-78, -10], [-81, -6], [-80.5, -2], [-80, 1], [-78.5, 2.5]];
    const CU = [[-85, 21.8], [-82, 23.2], [-77, 22], [-74.2, 20.2], [-77.5, 19.9], [-80, 21.8], [-84.9, 21.2]];
    const HI = [[-74.5, 18.5], [-72.8, 19.9], [-70, 19.7], [-68.4, 18.6], [-71.5, 17.6], [-74.4, 18.1]];
    const AF = [[-5.9, 35.8], [-9.8, 33.5], [-9.8, 30.5], [-13.2, 27.7], [-14.8, 25], [-16.5, 22.5], [-17.1, 20.8], [-16, 18.5], [-16.5, 16], [-17.4, 14.7], [-16.8, 13.5], [-16.7, 12.3], [-15.2, 11], [-13.7, 9.5], [-13.2, 8.4], [-12, 7], [-10.5, 6.2], [-7.5, 4.4], [-5, 5.1], [-2, 4.8], [1, 5.9], [4, 6.3], [6, 4.3], [8.5, 4.5], [9.8, 3], [9.5, 1], [9.2, -1.5], [11.8, -4.5], [12.3, -6.2], [13.2, -8.8], [13.5, -12], [12, -15], [11.8, -17.5], [13.5, -21], [14.5, -23.5], [15.2, -27], [16.5, -29], [18.4, -34], [20, -34.8], [25.5, -34], [30, -31], [32.9, -26], [35.5, -23.5], [35.3, -21], [36.5, -18.5], [40.3, -15], [40.5, -10.5], [39.3, -5.5], [41.5, -1.8], [44, 1.8], [47.7, 4.5], [51, 10.5], [51.3, 11.8], [48.5, 11.2], [44, 10.4], [43.3, 12.2], [39.5, 15.5], [38.3, 18], [37.2, 21], [35.5, 24], [33.6, 27.5], [32.3, 29.8], [32.4, 31.3], [29, 30.9], [25, 31.6], [20, 30.9], [19.9, 32], [15.3, 32.3], [11.2, 33.3], [10.1, 36.9], [8.5, 36.9], [3, 36.8], [-1.2, 35.5], [-5.3, 35.9]];
    const EU = [[-9.4, 43.2], [-8.9, 42], [-8.8, 40.2], [-9.5, 38.8], [-8.9, 37.9], [-8.9, 37], [-7.4, 37.2], [-6, 36.4], [-5.6, 36], [-4.4, 36.7], [-2.1, 36.7], [-0.7, 37.6], [0.2, 38.8], [-0.3, 39.5], [0.9, 41], [3.2, 41.9], [3.1, 43.1], [4.5, 43.4], [6.5, 43.1], [7.6, 43.8], [8.8, 44.4], [10.2, 43.9], [10.5, 42.9], [12.3, 41.7], [14, 40.8], [15.6, 40.1], [16, 38.9], [15.7, 38], [16.1, 38.1], [17.1, 39], [18.5, 40.1], [17, 40.5], [15.9, 41.5], [14, 42.6], [12.4, 44.5], [12.3, 45.3], [13.7, 45.7], [14.9, 45], [17, 43.5], [19.4, 41.8], [19.4, 40.3], [20.3, 39.5], [21.2, 37.9], [22.5, 36.5], [23, 37.8], [24, 38.2], [22.9, 39.5], [22.8, 40.5], [24.3, 40.9], [26, 40.8], [26.2, 40.2], [26.8, 38.9], [27.3, 37.4], [28.3, 36.7], [30.6, 36.7], [32.5, 36.1], [34.7, 36.8], [36, 36.8], [35.9, 35], [35.5, 33.8], [34.9, 32.5], [34.2, 31.3], [40, 33], [45, 40], [45, 58], [9, 58], [8.6, 54], [5, 53.3], [4, 51.4], [2.5, 51.1], [1.6, 50.9], [0.2, 49.6], [-1.3, 49.7], [-1.6, 48.7], [-4.6, 48.6], [-4.7, 48.0], [-2.2, 47.1], [-1.2, 46], [-1.8, 43.4], [-3.8, 43.5], [-8, 43.7]];
    const UK = [[-5.7, 50.1], [-3.5, 50.4], [-1.2, 50.8], [1.4, 51.2], [1.7, 52.7], [0.2, 53.5], [-0.5, 54.5], [-1.6, 55.6], [-2, 57], [-5, 58.6], [-6.2, 56.8], [-4.9, 55], [-3.1, 54.1], [-3, 53.3], [-4.6, 52.8], [-4.1, 52], [-5.2, 51.7], [-3.2, 51.4], [-4.3, 51.2]];
    const IE = [[-6, 52.2], [-6.2, 53.9], [-5.6, 55.2], [-7.3, 55.3], [-10, 54.2], [-9.8, 52], [-8.4, 51.6]];
    const SICILY = [[12.4, 38.1], [15.6, 38.3], [15.1, 36.7], [12.5, 37.6]];
    const LANDS = [NA, SA, CU, HI, AF, EU, SICILY, UK, IE];
    const WP = [[-9.14, 38.72], [-12.3, 33.5], [-15.5, 28.1], [-19, 21], [-23.6, 15.0], [-27.2, 7.5], [-29.8, 0], [-33.2, -7.8], [-36.6, -13.6], [-39.06, -16.45]];
    const PLACES = [{ n: 'Lisboa', p: [-9.14, 38.72], r: 0, side: 1, dy: 11 }, { n: 'Canárias', p: [-15.5, 28.1], side: -1 }, { n: 'Cabo Verde', p: [-23.6, 15.0], side: -1 }];
    const RELEVO = [[-44, -22.4], [-45.6, -23.1], [-47.3, -24.2], [-48.8, -25.8], [-42.6, -21.4], [-41.4, -12.6], [-41.2, -14], [-42, -11.2], [-6, 31.6], [-4, 32.6], [-2, 33.4], [-8, 30.9]];
    let ROUTE = null; // amostras uniformes da rota: [lon, lat, fração]
    const route = () => {
      if (ROUTE) return ROUTE;
      const pts = [], cr = (a, b, c, d, u) => .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      for (let i = 0; i < WP.length - 1; i++) for (let s = 0; s < 16; s++) {
        const a = WP[Math.max(0, i - 1)], b = WP[i], c = WP[i + 1], d = WP[Math.min(WP.length - 1, i + 2)], u = s / 16;
        pts.push([cr(a[0], b[0], c[0], d[0], u), cr(a[1], b[1], c[1], d[1], u)]);
      }
      pts.push(WP[WP.length - 1]);
      let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(L); }
      ROUTE = pts.map((p, i) => [p[0], p[1], acc[i] / L]);
      PLACES.forEach(pl => { let best = 0, bd = 1e9; ROUTE.forEach(q => { const d = Math.hypot(q[0] - pl.p[0], q[1] - pl.p[1]); if (d < bd) { bd = d; best = q[2]; } }); pl.r = best; });
      return ROUTE;
    };
    const at = (rt, f) => { let i = 1; while (i < rt.length - 1 && rt[i][2] < f) i++; const a = rt[i - 1], b = rt[i], k = (f - a[2]) / Math.max(1e-6, b[2] - a[2]); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(-(b[1] - a[1]), b[0] - a[0])]; };
    const ship = () => S2('mp-ship', 34, 34, (c) => {
      c.translate(17, 22); c.fillStyle = '#3B2616'; c.strokeStyle = '#3B2616'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-13, -2); c.quadraticCurveTo(-11, 5, -4, 5.5); c.lineTo(8, 5.5); c.quadraticCurveTo(13, 4, 14, -4); c.lineTo(9, -1); c.lineTo(-9, -1); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-2, -1); c.lineTo(-2, -19); c.moveTo(6, -1); c.lineTo(6, -15); c.stroke();
      const sail = (x, y, w, h) => { c.fillStyle = '#F4EAD2'; c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y + 2, x + w / 2, y); c.lineTo(x + w / 2 + 1, y + h); c.quadraticCurveTo(x, y + h + 3, x - w / 2 - 1, y + h); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#B3261E'; c.fillRect(x - .9, y + h * .2, 1.8, h * .6); c.fillRect(x - h * .28, y + h * .42, h * .56, 1.8); };
      sail(-2, -17, 11, 12); sail(6, -13, 8, 9);
      c.fillStyle = '#B3261E'; c.beginPath(); c.moveTo(-2, -19); c.lineTo(3, -20.5); c.lineTo(-2, -22); c.fill();
    });
    const rose = () => S2('mp-rose', 64, 70, (c) => {
      c.translate(32, 38); c.strokeStyle = '#4A321D'; c.lineWidth = 1;
      c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.globalAlpha = .5; c.stroke(); c.globalAlpha = 1;
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8 - Math.PI / 2, L = i % 2 ? 13 : 25, w = i % 2 ? 3 : 4.5; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(Math.cos(a + sd * Math.PI / 2) * w, Math.sin(a + sd * Math.PI / 2) * w); c.closePath(); c.fillStyle = i === 0 ? (sd < 0 ? '#B3261E' : '#7E1812') : (sd < 0 ? '#4A321D' : '#E9DBB9'); c.fill(); c.stroke(); } }
      c.fillStyle = '#4A321D'; c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fill();
      c.font = font(700, 14, F.serif); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', 0, -32);
    });
    R['mapa-animado'] = (g, t, W, H) => {
      const T = t % 8, rt = route();
      // câmera: panorama → segue a ponta → chegada → volta ao panorama (em log da escala)
      const rp = eio(seg(T, .5, 5.2)), tip = at(rt, rp);
      const z0 = Math.log(3.6), z1 = Math.log(7.2), z2 = Math.log(9.6);
      const k1 = eio(seg(T, .3, 1.7)), k2 = eio(seg(T, 4.6, 5.8)), k3 = eio(seg(T, 6.9, 7.95));
      let z = Math.exp(lerp(lerp(lerp(z0, z1, k1), z2, k2), z0, k3));
      const fz = Math.exp(z1), fx = tip[0] - 3, fy = Math.min(tip[1] - 2, 52.5 - 135 / fz);
      let cx = lerp(lerp(lerp(-24, fx, k1), -41.5, k2), -24, k3), cy = lerp(lerp(lerp(15, fy, k1), -17.5, k2), 15, k3);
      cy = Math.min(cy, 52.5 - 135 / z);
      const X = (lon) => (lon - cx) * z + 240, Y = (lat) => (cy - lat) * z + 135;
      const path = (pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.closePath(); };

      paper(g, W, H, '#E3CFA3', 11);
      g.fillStyle = 'rgba(96,128,120,.12)'; g.fillRect(0, 0, W, H);
      // graticulado
      g.lineWidth = .7; g.strokeStyle = 'rgba(92,64,38,.17)'; g.beginPath();
      for (let lo = -120; lo <= 60; lo += 10) { g.moveTo(X(lo), 0); g.lineTo(X(lo), H); }
      for (let la = -60; la <= 60; la += 10) { g.moveTo(0, Y(la)); g.lineTo(W, Y(la)); }
      g.stroke(); g.strokeStyle = 'rgba(92,64,38,.32)'; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke();
      // sombreado de costa (água mais escura junto da terra) e terras
      g.lineJoin = 'round';
      [[16, .06], [9, .07], [4, .09]].forEach(([lw, a]) => { g.lineWidth = lw * Math.min(1.4, z / 6); g.strokeStyle = `rgba(52,74,82,${a})`; LANDS.forEach(pl => { path(pl); g.stroke(); }); });
      g.fillStyle = 'rgba(249,239,212,.62)'; LANDS.forEach(pl => { path(pl); g.fill(); });
      // território que se pinta: a parte portuguesa de Tordesilhas
      const tp = eio(seg(T, 5.7, 6.6)) * (1 - eio(seg(T, 7.35, 7.8)));
      const xt = X(-46.6);
      if (tp > 0) {
        g.save(); path(SA); g.clip(); const yTop = Y(6), yBot = Y(-36);
        g.beginPath(); g.rect(xt, yTop, W, (yBot - yTop) * tp); g.clip();
        g.fillStyle = 'rgba(179,38,30,.17)'; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(179,38,30,.28)'; g.lineWidth = 1; g.beginPath(); for (let d = -300; d < 500; d += 7) { g.moveTo(xt + d, yTop); g.lineTo(xt + d + 120, yTop + 120 * 3); } g.stroke();
        g.restore();
      }
      g.strokeStyle = '#5A3E24'; g.lineWidth = 1.15; LANDS.forEach(pl => { path(pl); g.stroke(); });
      // relevo sutil (hachuras de serra)
      g.strokeStyle = 'rgba(90,62,36,.5)'; g.lineWidth = 1; const m = .55 * z / 4;
      g.beginPath(); RELEVO.forEach(([lo, la]) => { const x = X(lo), y = Y(la); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return; g.moveTo(x - 2.2 * m, y + 1.4 * m); g.lineTo(x, y - 1.2 * m); g.lineTo(x + 2.2 * m, y + 1.4 * m); }); g.stroke();
      // meridiano de Tordesilhas
      const ml = ease(seg(T, 5.45, 6.1)) * (1 - eio(seg(T, 7.35, 7.8)));
      if (ml > 0) {
        g.save(); g.strokeStyle = 'rgba(90,40,24,.75)'; g.lineWidth = 1.2; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(xt, Y(8)); g.lineTo(xt, lerp(Y(8), Y(-38), ml)); g.stroke(); g.restore();
        const lk = spr(seg(T, 6.0, 6.5)) * (1 - eio(seg(T, 7.35, 7.6)));
        if (lk > 0) { g.save(); g.translate(xt - 6, Y(-7)); g.scale(lk, lk); type(g, 'Tordesilhas', 0, 0, { f: `italic 500 14px ${F.serif}`, fill: '#6B2A1A', align: 'right', stroke: 'rgba(245,233,205,.85)', lw: 3 }); g.restore(); }
      }

      // rota tracejada (recolhe pela cauda no fim)
      const tail = eio(seg(T, 7.0, 7.85));
      if (rp > tail) {
        g.lineCap = 'round'; g.beginPath(); let first = true;
        for (const q of rt) { if (q[2] < tail) continue; if (q[2] > rp) break; const x = X(q[0]), y = Y(q[1]); first ? g.moveTo(x, y) : g.lineTo(x, y); first = false; }
        g.lineTo(X(tip[0]), Y(tip[1]));
        g.strokeStyle = 'rgba(246,236,210,.8)'; g.lineWidth = 5; g.stroke();
        g.save(); g.setLineDash([7, 5]); g.lineDashOffset = -rp * 400; g.strokeStyle = '#A8241C'; g.lineWidth = 2.6; g.stroke(); g.restore();
      }
      // lugares (surgem quando a caravela passa)
      const out = (i) => 1 - inq(seg(T, 7.25 + i * .12, 7.55 + i * .12));
      PLACES.forEach((pl, i) => {
        const pk = i === 0 ? 1 : spr(seg(rp, pl.r, pl.r + .07)) * out(3 - i); if (pk <= 0.01) return;
        const x = X(pl.p[0]), y = Y(pl.p[1]);
        g.save(); g.translate(x, y); g.scale(pk, pk);
        g.fillStyle = '#F6ECD4'; g.strokeStyle = '#4A321D'; g.lineWidth = 1.3; g.beginPath(); g.arc(0, 0, 3.6, 0, TAU); g.fill(); g.stroke();
        type(g, pl.n, pl.side * 8, pl.dy || -1, { f: `italic 600 15px ${F.serif}`, fill: '#3B2616', align: pl.side > 0 ? 'left' : 'right', stroke: 'rgba(245,233,205,.9)', lw: 3.5 });
        g.restore();
      });
      // chegada: Porto Seguro
      const ar = spr(seg(T, 5.15, 5.7)) * out(0), px = X(-39.06), py = Y(-16.45);
      if (ar > .01) {
        const pr = seg(T, 5.15, 6.4); if (pr > 0 && pr < 1) { g.strokeStyle = `rgba(168,36,28,${.6 * (1 - pr)})`; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 6 + pr * 26, 0, TAU); g.stroke(); }
        g.save(); g.translate(px, py); g.scale(ar, ar);
        g.fillStyle = '#A8241C'; g.beginPath(); g.arc(0, -13, 7, Math.PI, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = '#F6ECD4'; g.beginPath(); g.arc(0, -13, 2.6, 0, TAU); g.fill();
        type(g, 'Porto Seguro', 12, -12, { f: `italic 700 17px ${F.serif}`, fill: '#3B2616', align: 'left', stroke: 'rgba(245,233,205,.9)', lw: 4 });
        type(g, '22 de abril de 1500', 12, 6, { f: `500 14px ${F.serif}`, fill: '#6B4A2C', align: 'left', stroke: 'rgba(245,233,205,.9)', lw: 3.5 });
        g.restore();
      }
      // a caravela na ponta da rota (balança no mar)
      const sk = spr(seg(T, 0, .45)) * (1 - inq(seg(T, 5.0, 5.3)));
      if (sk > .01) {
        const sx = X(tip[0]), sy = Y(tip[1]);
        contact(g, sx, sy + 3, 13, 3.5, .25);
        g.save(); g.translate(sx, sy + Math.sin(t * 4.2) * 1.2); g.rotate(Math.sin(t * 3.1) * .07); g.scale(-sk, sk); g.drawImage(ship(), -17, -24, 34, 34); g.restore();
      }

      // cartela, rosa dos ventos, bordas queimadas
      g.drawImage(S2('mp-burn', W, H, (c) => { c.fillStyle = rad(c, W / 2, H / 2, H * .45, W * .62, [[0, 'rgba(90,55,20,0)'], [1, 'rgba(90,55,20,.32)']]); c.fillRect(0, 0, W, H); }), 0, 0, W, H);
      g.fillStyle = 'rgba(244,233,207,.94)'; g.fillRect(16, 14, 184, 52); g.strokeStyle = '#4A321D'; g.lineWidth = 1.5; g.strokeRect(16, 14, 184, 52); g.lineWidth = .8; g.strokeRect(19.5, 17.5, 177, 45);
      type(g, 'A ROTA DE CABRAL', 108, 33, { f: font(700, 14, F.serif), fill: '#3B2616', track: 1.1 });
      type(g, '1500 · Lisboa → Brasil', 108, 51, { f: `italic 400 14px ${F.serif}`, fill: '#6B4A2C' });
      g.save(); g.translate(436, 222); g.rotate(Math.sin(t * 1.3) * .05); g.drawImage(rose(), -32, -38, 64, 70); g.restore();
    };
  }

  // =====================================================================================================
  // 3. ISOTYPE — figuras iguais em fila, cada uma vale 10 milhões; cor chapada por categoria
  // =====================================================================================================
  {
    const INK = '#1E2630', URB = '#1F4E79', RUR = '#C0492F', PT = 17.8, XS = 90, FS = 1.12, FH = 40.3;
    const fig = (col, hat) => S2('iso-' + col + hat, 18, 43, (c) => {
      c.scale(FS, FS); c.translate(1, 2); c.fillStyle = col;
      c.beginPath(); c.arc(7, 5.2, 4.4, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(.6, 22.5); c.lineTo(.6, 14.8); c.quadraticCurveTo(.6, 10.8, 4.6, 10.8); c.lineTo(9.4, 10.8); c.quadraticCurveTo(13.4, 10.8, 13.4, 14.8); c.lineTo(13.4, 22.5); c.closePath(); c.fill();
      c.fillRect(2, 22, 4.4, 12); c.fillRect(7.6, 22, 4.4, 12);
      if (hat) { c.fillRect(-.6, 1.9, 15.2, 1.9); c.beginPath(); c.roundRect(3.4, -1.6, 7.2, 4, 1.5); c.fill(); }
    });
    const ROWS = [
      { y: 128, year: '1950', tot: 52, n: 5, rur: 3, t0: .08, dt: .12 },
      { y: 206, year: '2020', tot: 212, n: 21, rur: 3, t0: .75, dt: .08 },
    ];
    R['isotype'] = (g, t, W, H) => {
      const T = t % 8;
      paper(g, W, H, '#EEE5D1', 5);
      type(g, 'BRASIL · 1950 → 2020', 24, 20, { f: font(600, 14, F.grot), fill: '#7A6E5D', align: 'left', track: 1.6 });
      type(g, 'Cidade e campo', 24, 44, { f: font(800, 23, F.grot), fill: INK, align: 'left' });
      // legenda mínima, no alto à direita
      const f14 = font(600, 14, F.grot); let x = 466;
      [['campo', RUR, 1], ['cidade', URB, 0]].forEach(([s, c, h]) => { const w = tw(g, s, f14); x -= w; type(g, s, x, 50, { f: f14, fill: INK, align: 'left' }); x -= 12; g.drawImage(fig(c, h), x, 39, 9, 21.5); x -= 16; });
      type(g, '1 figura = 10 milhões', 466, 69, { f: font(500, 14, F.grot), fill: '#7A6E5D', align: 'right' });

      ROWS.forEach((row, ri) => {
        g.fillStyle = 'rgba(30,38,48,.3)'; g.fillRect(XS - 4, row.y + 1, 20 * PT + 22, 1.2);
        for (let i = 0; i < row.n; i++) {
          const ti = row.t0 + i * row.dt, p = seg(T, ti, ti + .3), d = (row.n - 1 - i) * .02 + ri * .02;
          const ex = seg(T, 7.3 + d, 7.47 + d);
          if (p <= 0 || ex >= 1) continue;
          const rur = i < row.rur, xi = XS + i * PT;
          let lift = 0;
          if (ri === 1 && !rur && T > 3.9 && T < 7.0) { const w = Math.sin(T * 4.4 - i * .55); lift = w > .85 ? (w - .85) / .15 * 2.4 : 0; }
          const y = row.y - FH - (1 - spr(p)) * 12 - lift, sy = 1 - inq(ex);
          g.save(); g.translate(0, row.y + 1); g.scale(1, sy); g.translate(0, -row.y - 1);
          g.drawImage(fig(rur ? RUR : URB, rur ? 1 : 0), xi - 1, y - 2, 18, 43); g.restore();
        }
        type(g, row.year, 20, row.y - 19, { f: font(400, 32, F.cond), fill: INK, align: 'left' });
        // total grande: carimba quando a fila fecha
        const tEnd = row.t0 + (row.n - 1) * row.dt + .2, nk = spr(seg(T, tEnd, tEnd + .45)) * (1 - inq(seg(T, 7.25 + ri * .02, 7.4 + ri * .02)));
        if (nk > .01) {
          const f = font(800, 20, F.grot), x = ri === 0 ? XS + row.n * PT + 8 : XS + 20 * PT + 16, y = ri === 0 ? row.y - 17 : row.y - FH - 14;
          g.save(); g.translate(x, y); g.scale(nk, nk); type(g, `${row.tot} mi`, 0, 0, { f, fill: INK, align: ri === 0 ? 'left' : 'right' }); g.restore();
        }
      });

      // a história: a cidade multiplicou por 9 (chave sob as figuras urbanas de 2020)
      const bk = ease(seg(T, 2.85, 3.3)) * (1 - inq(seg(T, 7.1, 7.35)));
      if (bk > 0) {
        const xa = XS + 3 * PT - 1, xb = XS + 20 * PT + 16, xm = (xa + xb) / 2, y = 216, hw = (xb - xa) / 2 * bk;
        g.strokeStyle = URB; g.lineWidth = 2; g.lineCap = 'butt'; g.beginPath();
        g.moveTo(xm - hw, y - 5); g.lineTo(xm - hw, y); g.lineTo(xm + hw, y); g.lineTo(xm + hw, y - 5); g.moveTo(xm, y); g.lineTo(xm, y + 4); g.stroke();
        const lk = spr(seg(T, 3.15, 3.65)) * (1 - inq(seg(T, 7.1, 7.3)));
        if (lk > 0) { g.save(); g.translate(xm, y + 17); g.scale(lk, lk); type(g, 'na cidade: ×9', 0, 0, { f: font(800, 17, F.grot), fill: URB }); g.restore(); }
      }
    };
  }

  // =====================================================================================================
  // 4. LINHA DO TEMPO — travelling por um eixo de datas, cartões com foto, faixas de épocas, ano acelerando
  // =====================================================================================================
  {
    const PX = 2.2, AX = 178, XY = (y) => (y - 1500) * PX;
    const ERAS = [[1500, 1822, 'COLÔNIA', '#7A4B32'], [1822, 1889, 'IMPÉRIO', '#35604A'], [1889, 2040, 'REPÚBLICA', '#2B4E78']];
    const CAPS = [[1549, 1763, 'CAPITAL: SALVADOR', '#5E4470'], [1763, 1960, 'CAPITAL: RIO DE JANEIRO', '#86692A'], [1960, 2040, 'BRASÍLIA', '#2F6E73']];
    const MS = [{ y: 1500, c: 'Chegada' }, { y: 1822, c: 'Independência' }, { y: 1889, c: 'República' }, { y: 1960, c: 'Brasília' }];
    const HOLD = [[0, 1.1], [2.3, 3.6], [4.3, 5.5], [6.2, 7.3]];
    const photo = (c, k) => {
      const w = 112, h = 56;
      c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
      const ink = '#3A2819';
      if (k === 0) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#EAD8B6'], [.62, '#CDAE80'], [.63, '#8B6A48'], [1, '#6A4E34']]); c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(250,238,210,.8)'; c.beginPath(); c.arc(82, 22, 9, 0, TAU); c.fill();
        c.fillStyle = ink; c.save(); c.translate(40, 35); c.beginPath(); c.moveTo(-16, -2); c.quadraticCurveTo(-13, 5, -4, 5); c.lineTo(9, 5); c.quadraticCurveTo(15, 3, 16, -4); c.lineTo(-16, -2); c.fill();
        c.fillRect(-3, -24, 1.6, 22); c.fillRect(6, -18, 1.4, 16); c.beginPath(); c.moveTo(-10, -21); c.quadraticCurveTo(-2, -19, 5, -21); c.lineTo(6, -7); c.quadraticCurveTo(-2, -5, -11, -7); c.fill(); c.beginPath(); c.moveTo(2, -16); c.lineTo(12, -16); c.lineTo(12, -6); c.lineTo(2, -6); c.fill(); c.restore();
        c.strokeStyle = 'rgba(245,230,200,.35)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(8 + i * 22, 43 + i % 2 * 5); c.lineTo(20 + i * 22, 43 + i % 2 * 5); c.stroke(); }
      } else if (k === 1) {
        c.fillStyle = rad(c, 56, 30, 4, 70, [[0, '#9C7650'], [1, '#3E2A1A']]); c.fillRect(0, 0, w, h);
        c.fillStyle = '#EBD3A0'; c.save(); c.translate(56, 34);
        c.fillRect(-19, 4, 38, 7); c.beginPath(); c.moveTo(-19, 4); c.lineTo(-22, -12); c.lineTo(-11, -2); c.lineTo(-6, -17); c.lineTo(0, -4); c.lineTo(6, -17); c.lineTo(11, -2); c.lineTo(22, -12); c.lineTo(19, 4); c.closePath(); c.fill();
        c.fillRect(-1.2, -26, 2.4, 9); c.fillRect(-4, -23.5, 8, 2.4);
        c.fillStyle = '#6E4A2A'; [-11, 0, 11].forEach(x => { c.beginPath(); c.arc(x, 7.5, 2, 0, TAU); c.fill(); }); c.restore();
      } else if (k === 2) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#E4CFA8'], [1, '#B8966A']]); c.fillRect(0, 0, w, h);
        c.fillStyle = ink; c.save(); c.translate(56, 0);
        c.beginPath(); c.moveTo(-36, 20); c.lineTo(0, 7); c.lineTo(36, 20); c.closePath(); c.fill(); c.fillRect(-38, 20, 76, 5);
        for (let i = 0; i < 6; i++) c.fillRect(-33 + i * 12.4, 27, 4.6, 19); c.fillRect(-38, 46, 76, 3); c.fillRect(-44, 49, 88, 3); c.fillRect(-50, 52, 100, 4);
        c.fillRect(-.6, -2, 1.2, 10); c.fillStyle = '#5B7A4A'; c.fillRect(.6, -2, 9, 5); c.restore();
      } else {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#EEDDBD'], [.78, '#C9A77A'], [.79, '#8A6B4A'], [1, '#735739']]); c.fillRect(0, 0, w, h);
        c.fillStyle = ink; c.save(); c.translate(56, 44);
        c.fillRect(-4.5, -32, 4, 30); c.fillRect(1, -32, 4, 30); c.fillRect(-4.5, -22, 9.5, 2);
        c.fillRect(-46, -4, 92, 4); c.beginPath(); c.arc(-26, -4, 8, Math.PI, 0); c.fill();
        c.beginPath(); c.moveTo(14, -12); c.quadraticCurveTo(26, -1, 38, -12); c.lineTo(36, -11); c.quadraticCurveTo(26, -4, 16, -11); c.fill(); c.beginPath(); c.moveTo(18, -10); c.quadraticCurveTo(26, -3, 34, -10); c.lineTo(30, -4); c.lineTo(22, -4); c.fill();
        c.restore();
      }
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = .35; c.drawImage(noiseTile(9), 0, 0, 128, 128); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      c.fillStyle = rad(c, w / 2, h / 2, 10, 70, [[0, 'rgba(40,24,10,0)'], [1, 'rgba(40,24,10,.45)']]); c.fillRect(0, 0, w, h);
      c.restore();
    };
    const card = (k) => S2('tl-card' + k, 152, 130, (c) => {
      c.translate(14, 10);
      c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 22; c.shadowOffsetY = 10; c.fillStyle = '#F3EBDC'; c.beginPath(); c.roundRect(0, 0, 124, 106, 4); c.fill(); c.restore();
      c.save(); c.translate(6, 6); photo(c, k); c.restore();
      c.fillStyle = '#2A211A'; c.font = font(400, 24, F.cond); c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(String(MS[k].y), 8, 77);
      c.fillStyle = '#5B4B3A'; c.font = font(600, 14, F.body); c.fillText(MS[k].c, 8, 94);
    });
    const camYear = (T) => {
      if (T < 1.1) return 1500; if (T < 2.3) return lerp(1500, 1822, eio(seg(T, 1.1, 2.3)));
      if (T < 3.6) return 1822; if (T < 4.3) return lerp(1822, 1889, eio(seg(T, 3.6, 4.3)));
      if (T < 5.5) return 1889; if (T < 6.2) return lerp(1889, 1960, eio(seg(T, 5.5, 6.2)));
      if (T < 7.3) return 1960; return lerp(1960, 1500, eio(seg(T, 7.3, 8)));
    };
    R['linha-do-tempo'] = (g, t, W, H) => {
      const T = t % 8, cy = camYear(T), cam = XY(cy) - 240, sx = (y) => XY(y) - cam;
      g.drawImage(S2('tl-bg', W, H, (c) => { c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#18202A'], [1, '#0A0D12']]); c.fillRect(0, 0, W, H); c.fillStyle = rad(c, 240, 120, 0, 300, [[0, 'rgba(90,110,140,.16)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(0, 0, W, H); c.fillStyle = rad(c, 240, 112, 0, 120, [[0, 'rgba(242,177,52,.13)'], [1, 'rgba(242,177,52,0)']]); c.fillRect(0, 0, W, H); }), 0, 0, W, H);
      // plano de fundo em parallax: séculos gigantes
      g.strokeStyle = 'rgba(150,170,200,.06)'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < 40; i++) { const x = ((i * 36 - cam * .45) % 1440 + 1440) % 1440 - 60; if (x < W + 10) { g.moveTo(x, 64); g.lineTo(x, AX - 20); } }
      g.stroke();
      // eixo, marcas e séculos
      const y0 = Math.floor((cy - 130) / 10) * 10, y1 = cy + 130;
      g.strokeStyle = '#5A6575'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, AX); g.lineTo(W, AX); g.stroke();
      g.lineWidth = 1; g.beginPath();
      for (let y = y0; y <= y1; y += 10) { const x = sx(y), L = y % 100 === 0 ? 8 : y % 50 === 0 ? 5 : 3; g.moveTo(x, AX); g.lineTo(x, AX + L); }
      g.stroke();
      for (let y = Math.ceil(y0 / 100) * 100; y <= y1; y += 100) type(g, String(y), sx(y), 193, { f: font(500, 14, F.mono), fill: '#7D8796' });
      // faixas paralelas (Histomap): períodos e capitais, rótulo grudado na borda
      const band = (list, by, bh) => list.forEach(([a, b, s, col]) => {
        const xa = sx(a) + 1, xb = sx(b) - 1; if (xb < 0 || xa > W) return;
        const on = cy >= a && cy < b;
        g.fillStyle = col; g.globalAlpha = on ? 1 : .55; rr(g, xa, by, xb - xa, bh, 3); g.fill(); g.globalAlpha = 1;
        const f = font(700, 14, F.grot); const w = tw(g, s, f) + 1.2 * s.length; const lx = clamp(8, xa + 8, xb - w - 8);
        if (xb - xa > w + 16) { g.save(); g.beginPath(); g.rect(xa, by, xb - xa, bh); g.clip(); type(g, s, lx, by + bh / 2 + .5, { f, fill: on ? '#F6EFE2' : 'rgba(246,239,226,.7)', align: 'left', track: 1.2 }); g.restore(); }
      });
      band(ERAS, 201, 20); band(CAPS, 225, 20);
      // agulha do "agora"
      g.fillStyle = '#F2B134'; g.fillRect(239.25, 199, 1.5, 48); poly(g, [[234, 170], [246, 170], [240, 177]]); g.fill();
      // cartões com foto
      const inT = [.05, 2.05, 4.05, 5.95];
      MS.forEach((m, k) => {
        const v = k === 0 ? 1 : spr(seg(T, inT[k], inT[k] + .6));
        const x = sx(m.y); if (v <= .01 || x < -90 || x > W + 90) return;
        const act = Math.abs(cy - m.y) < .5;
        g.strokeStyle = act ? '#F2B134' : '#6B7686'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, AX); g.lineTo(x, AX - 12 * v); g.stroke();
        g.save(); g.translate(x, AX - 12); g.scale(v, v); g.drawImage(card(k), -76, -116, 152, 130);
        if (act) { g.fillStyle = '#F2B134'; g.fillRect(-62, -106, 124, 3); }
        g.restore();
        g.fillStyle = act ? '#F2B134' : '#8C97A6'; g.beginPath(); g.arc(x, AX, act ? 5 : 3.5, 0, TAU); g.fill();
        if (act) { const pr = (T * 1.2) % 1; g.strokeStyle = `rgba(242,177,52,${.6 * (1 - pr)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, AX, 5 + pr * 12, 0, TAU); g.stroke(); }
      });
      // contador de ano
      type(g, 'HISTÓRIA DO BRASIL', 24, 15, { f: font(500, 14, F.mono), fill: '#8A94A3', align: 'left', track: 1.6 });
      type(g, String(Math.round(cy)), 22, 55, { f: font(400, 36, F.cond), fill: '#F4EEE2', align: 'left', base: 'alphabetic' });
    };
  }

  // =====================================================================================================
  // 5. DEMO DE INTERFACE — janela limpa, cursor, clique com ripple, zoom no detalhe, transição de estado
  // =====================================================================================================
  {
    const WX = 70, WY = 34, WW = 340, WH = 204, VIO = '#6D5DFC', OK = '#16A34A';
    const f = (w, px) => font(w, px, F.grot);
    const cursor = () => S2('ui-cur', 26, 30, (c) => {
      c.translate(4, 3); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
      poly(c, [[0, 0], [0, 17], [4.3, 13.2], [7.4, 20], [10.2, 18.8], [7.2, 12.2], [12.6, 12]]); c.fillStyle = '#111'; c.fill();
      c.shadowColor = 'transparent'; c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.lineJoin = 'round'; c.stroke();
    });
    const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
    R['demo-de-interface'] = (g, t, W, H) => {
      const T = t % 7;
      g.drawImage(S2('ui-bg', W, H, (c) => {
        c.fillStyle = lin(c, 0, 0, W, H, [[0, '#E6E1FF'], [1, '#FFE3D4']]); c.fillRect(0, 0, W, H);
        c.fillStyle = rad(c, 410, 30, 0, 220, [[0, 'rgba(160,140,255,.55)'], [1, 'rgba(160,140,255,0)']]); c.fillRect(0, 0, W, H);
        c.fillStyle = rad(c, 60, 260, 0, 240, [[0, 'rgba(255,170,140,.5)'], [1, 'rgba(255,170,140,0)']]); c.fillRect(0, 0, W, H);
      }), 0, 0, W, H);

      const BX = WX + 178 + 14, BY = WY + 74 + 68, BW = 114, BH = 32, fx = BX + BW / 2, fy = BY + BH / 2;
      const zk = eio(seg(T, .9, 2.0)) * (1 - eio(seg(T, 3.0, 3.8))), s = 1 + .5 * zk;
      g.save(); g.translate(lerp(fx, 272, zk), lerp(fy, 150, zk)); g.scale(s, s); g.translate(-fx, -fy);

      g.drawImage(S2('ui-win', WW + 100, WH + 100, (c) => {
        c.translate(50, 40); c.shadowColor = 'rgba(44,30,110,.26)'; c.shadowBlur = 70; c.shadowOffsetY = 36; c.fillStyle = '#fff'; c.beginPath(); c.roundRect(0, 0, WW, WH, 14); c.fill();
        c.shadowColor = 'rgba(0,0,0,.08)'; c.shadowBlur = 4; c.shadowOffsetY = 2; c.fill();
      }), WX - 50, WY - 40, WW + 100, WH + 100);
      g.save(); rr(g, WX, WY, WW, WH, 14); g.clip();
      g.fillStyle = '#F6F6FA'; g.fillRect(WX, WY, WW, 30); g.fillStyle = '#E9EAF0'; g.fillRect(WX, WY + 30, WW, 1);
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(WX + 16 + i * 14, WY + 15, 4.5, 0, TAU); g.fill(); });
      type(g, 'Planos', WX + 70, WY + 15.5, { f: f(600, 14), fill: '#8A90A0', align: 'left' });
      type(g, 'Escolha seu plano', WX + 20, WY + 55, { f: f(800, 18), fill: '#111827', align: 'left' });

      // cartões entram com easing de sistema; saem no fim do loop
      const cin = (i) => quint(seg(T, i * .08, .45 + i * .08)), cout = (i) => inq(seg(T, 6.5 + i * .07, 6.82 + i * .07));
      const hov = eio(seg(T, 1.7, 1.95)) * (1 - eio(seg(T, 5.9, 6.3)));
      const press = seg(T, 2.2, 2.3) * (1 - seg(T, 2.34, 2.44));
      const load = seg(T, 2.44, 2.98), done = spr(seg(T, 2.98, 3.5)) * (1 - eio(seg(T, 6.0, 6.35)));
      [0, 1].forEach(i => {
        const k = cin(i) * (1 - cout(i)); if (k <= 0) return;
        const x = WX + 20 + i * 158, y = WY + 74 + (1 - k) * 14 - (i ? hov * 3 : 0), best = i === 1;
        g.save(); g.globalAlpha = clamp(k * 1.4);
        if (best) { g.shadowColor = 'rgba(80,60,200,.22)'; g.shadowBlur = 10 + hov * 16; g.shadowOffsetY = 4 + hov * 6; }
        rr(g, x, y, 142, 112, 12); g.fillStyle = best ? '#fff' : '#F8F9FB'; g.fill(); noShadow(g);
        g.lineWidth = best ? 2 : 1; g.strokeStyle = best ? VIO : '#E3E6EC'; g.stroke();
        type(g, best ? 'Anual' : 'Mensal', x + 14, y + 20, { f: f(600, 14), fill: best ? VIO : '#6B7280', align: 'left' });
        const pr = best ? 'R$ 29' : 'R$ 49'; type(g, pr, x + 14, y + 48, { f: f(800, 24), fill: '#111827', align: 'left' });
        type(g, '/mês', x + 18 + tw(g, pr, f(800, 24)), y + 51, { f: f(400, 14), fill: '#6B7280', align: 'left' });
        if (best) { rr(g, x + 84, y - 10, 50, 20, 10); g.fillStyle = VIO; g.fill(); type(g, '−40%', x + 109, y + .5, { f: f(700, 14), fill: '#fff' }); }
        // botão
        const bx = x + 14, by = y + 68;
        if (!best) { rr(g, bx, by, BW, BH, 8); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#D5D9E0'; g.lineWidth = 1.5; g.stroke(); type(g, 'Assinar', bx + BW / 2, by + BH / 2 + .5, { f: f(600, 14), fill: '#374151' }); }
        else {
          const sc = 1 - press * .05;
          g.save(); g.translate(bx + BW / 2, by + BH / 2); g.scale(sc, sc);
          rr(g, -BW / 2, -BH / 2, BW, BH, 8); g.fillStyle = done > .02 ? OK : (hov > .5 ? '#5A49F0' : VIO); g.fill();
          const rp = seg(T, 2.26, 2.9); if (rp > 0 && rp < 1) { g.save(); rr(g, -BW / 2, -BH / 2, BW, BH, 8); g.clip(); g.fillStyle = `rgba(255,255,255,${.35 * (1 - rp)})`; g.beginPath(); g.arc(0, 0, 8 + ease(rp) * 64, 0, TAU); g.fill(); g.restore(); }
          if (done > .02) { g.save(); g.scale(.7 + .3 * done, .7 + .3 * done); g.strokeStyle = '#fff'; g.lineWidth = 2.4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-26, 0); g.lineTo(-21, 5); g.lineTo(-13, -5); g.stroke(); type(g, 'Ativo', 6, .5, { f: f(700, 14), fill: '#fff' }); g.restore(); }
          else if (load > 0 && load < 1) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2.4; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.stroke(); g.strokeStyle = '#fff'; g.lineCap = 'round'; const a = T * 9; g.beginPath(); g.arc(0, 0, 7, a, a + 1.8); g.stroke(); }
          else type(g, 'Assinar', 0, .5, { f: f(600, 14), fill: '#fff' });
          g.restore();
        }
        g.restore();
      });
      // toast de confirmação
      const tk = spr(seg(T, 3.5, 4.1)) * (1 - inq(seg(T, 5.8, 6.1)));
      if (tk > .01) {
        const ty = WY + 38 - (1 - tk) * 50, tx = WX + WW / 2;
        g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 16; g.shadowOffsetY = 6; rr(g, tx - 92, ty, 184, 34, 10); g.fillStyle = '#141824'; g.fill(); g.restore();
        g.fillStyle = OK; g.beginPath(); g.arc(tx - 72, ty + 17, 8, 0, TAU); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx - 76, ty + 17); g.lineTo(tx - 73, ty + 20); g.lineTo(tx - 68, ty + 14); g.stroke();
        type(g, 'Assinatura ativa', tx - 58, ty + 17.5, { f: f(600, 14), fill: '#fff', align: 'left' });
        const bar = 1 - seg(T, 3.9, 5.8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(tx - 84, ty + 30, 168 * bar, 2);
      }
      g.restore(); // clip da janela

      // cursor (vive dentro da câmera, como numa gravação ampliada)
      const u = eio(seg(T, .35, 1.85)), ux = eio(seg(T, 4.3, 6.6));
      let [cx, cy] = bez([505, 300], [470, 170], [370, 250], [fx + 34, fy + 6], u);
      if (ux > 0) [cx, cy] = bez([fx + 34, fy + 6], [fx + 60, fy + 20], [420, 280], [505, 300], ux);
      const cs = 1 - press * .16;
      g.save(); g.translate(cx, cy); g.scale(cs, cs); g.drawImage(cursor(), -4, -3, 26, 30); g.restore();
      g.restore(); // câmera

      // callout curto fora da janela
      const ck = spr(seg(T, 4.3, 4.8)) * (1 - inq(seg(T, 5.6, 5.85)));
      if (ck > .01) { g.save(); g.translate(fx, 254); g.scale(ck, ck); rr(g, -52, -12, 104, 24, 12); g.fillStyle = '#111827'; g.fill(); poly(g, [[-5, -12], [5, -12], [0, -18]]); g.fill(); type(g, 'em 1 clique', 0, .5, { f: f(700, 14), fill: '#fff' }); g.restore(); }
    };
  }

  // =====================================================================================================
  // 6. VIDRO FOSCO E AURORA — painéis translúcidos com desfoque real sobre aurora que flui, reflexo que passa
  // =====================================================================================================
  {
    const BLOBS = [['#6C4DFF', 60, 30, 34, 14, 1, 0], ['#00C2FF', 120, 40, 30, 16, 1, 2], ['#FF4FA3', 95, 70, 38, 12, 2, 4], ['#2EF2B0', 30, 70, 26, 14, 1, 1], ['#FFB547', 145, 15, 22, 10, 2, 3]];
    const aurora = (T) => {
      const A = buf('va-a', 160, 90), a = A.getContext('2d'), B = buf('va-b', 80, 45), b = B.getContext('2d');
      a.globalCompositeOperation = 'source-over'; a.fillStyle = '#060824'; a.fillRect(0, 0, 160, 90);
      a.globalCompositeOperation = 'screen';
      BLOBS.forEach(([c, x, y, r, amp, k, ph]) => {
        const bx = x + Math.sin(TAU * T / 7 * k + ph) * amp, by = y + Math.cos(TAU * T / 7 + ph * 1.3) * amp * .6;
        const gr = a.createRadialGradient(bx, by, 0, bx, by, r * 1.6); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); a.fillStyle = gr; a.fillRect(0, 0, 160, 90);
      });
      // cortina de aurora
      a.beginPath(); for (let x = -5; x <= 165; x += 5) { const y = 30 + Math.sin(x * .04 + TAU * T / 7) * 8 + Math.sin(x * .1 - TAU * T / 7 * 2) * 2.5; x < 0 ? a.moveTo(x, y) : a.lineTo(x, y); }
      [[18, 'rgba(60,255,190,.12)'], [9, 'rgba(90,255,205,.2)'], [3.5, 'rgba(170,255,230,.32)']].forEach(([lw, c]) => { a.lineWidth = lw; a.strokeStyle = c; a.stroke(); });
      a.globalCompositeOperation = 'source-over';
      b.filter = 'blur(3px)'; b.drawImage(A, -4, -3, 88, 51); b.filter = 'none';
      return [A, B];
    };
    const shadowSpr = (key, w, h, r) => S2('va-sh' + key, w + 80, h + 80, (c) => { c.translate(40, 34); c.shadowColor = 'rgba(4,2,30,.55)'; c.shadowBlur = 50; c.shadowOffsetY = 20; c.fillStyle = '#000'; c.beginPath(); c.roundRect(0, 0, w, h, r); c.fill(); });
    R['vidro-fosco-aurora'] = (g, t, W, H) => {
      const T = t % 7, [A, B] = aurora(T);
      const px = Math.sin(TAU * T / 7) * 7, py = Math.cos(TAU * T / 7) * 4;
      const P = 24, bgx = -P + px * .35, bgy = -P + py * .35, bgw = W + 2 * P, bgh = H + 2 * P;
      g.drawImage(A, bgx, bgy, bgw, bgh);
      // luz de varredura (reflexo especular passando pelos vidros)
      const sw = seg(T, 2.9, 4.2), swx = lerp(-160, 640, eio(sw));
      const glass = (x, y, w, h, r, key, extra) => {
        g.drawImage(shadowSpr(key, w, h, r), x - 40, y - 34, w + 80, h + 80);
        g.save(); rr(g, x, y, w, h, r); g.clip();
        g.drawImage(B, bgx, bgy, bgw, bgh);
        g.fillStyle = lin(g, 0, y, 0, y + h, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,.06)']]); g.fillRect(x, y, w, h);
        g.globalAlpha = .08; g.globalCompositeOperation = 'overlay'; g.drawImage(noiseTile(31), x, y); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        if (sw > 0 && sw < 1) { g.save(); g.translate(swx, 0); g.transform(1, 0, -.6, 1, 0, 0); g.fillStyle = lin(g, -40, 0, 40, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-40, 0, 80, H); g.restore(); }
        if (extra) extra();
        g.restore();
        rr(g, x + .5, y + .5, w - 1, h - 1, r); g.lineWidth = 1; g.strokeStyle = lin(g, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.8)'], [.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,.4)']]); g.stroke();
      };
      // cartão principal (sempre presente; o conteúdo se constrói)
      const cx = 72 + px, cy = 56 + py, cw = 268, ch = 152;
      const line = (k, dy, draw) => { if (k <= 0) return; g.save(); g.beginPath(); g.rect(cx + 10, cy + dy - 30, cw - 20, 44); g.clip(); g.translate(0, (1 - k) * 34); draw(); g.restore(); };
      const outk = (i) => 1 - inq(seg(T, 6.45 + i * .07, 6.8 + i * .07));
      glass(cx, cy, cw, ch, 24, 'main', () => {
        line(quint(seg(T, .05, .65)) * outk(2), 34, () => type(g, 'APRESENTANDO', cx + 26, cy + 34, { f: font(600, 14, F.grot), fill: 'rgba(255,255,255,.75)', align: 'left', track: 3 }));
        const word = 'Aurora'; let x = cx + 24; const fT = font(400, 50, F.grot);
        for (let i = 0; i < word.length; i++) { const k = quint(seg(T, .3 + i * .05, .95 + i * .05)) * outk(1), wch = tw(g, word[i], fT); line(k, 82, () => type(g, word[i], x, cy + 82, { f: fT, fill: '#fff', align: 'left' })); x += wch - 1; }
        line(quint(seg(T, .95, 1.5)) * outk(0), 122, () => type(g, 'Luz que acompanha você', cx + 26, cy + 122, { f: font(400, 16, F.body), fill: 'rgba(255,255,255,.8)', align: 'left' }));
      });
      // esfera de vidro (refrata o fundo) — plano mais próximo, parallax maior
      const ok = spr(seg(T, 1.9, 2.5)) * (1 - inq(seg(T, 6.4, 6.7)));
      if (ok > .01) {
        const ox = 372 + px * 2.2, oy = 92 + py * 2.2, r = 34 * ok;
        contact(g, ox + 6, oy + r + 16, r * .9, r * .25, .3);
        g.save(); g.beginPath(); g.arc(ox, oy, r, 0, TAU); g.clip();
        g.translate(ox, oy); g.scale(-1.35, 1.35); g.translate(-ox, -oy); g.drawImage(A, bgx, bgy, bgw, bgh);
        g.restore();
        g.save(); g.beginPath(); g.arc(ox, oy, r, 0, TAU); g.clip();
        g.fillStyle = rad(g, ox - r * .35, oy - r * .45, 0, r * 1.2, [[0, 'rgba(255,255,255,.55)'], [.35, 'rgba(255,255,255,.1)'], [1, 'rgba(10,8,40,.35)']]); g.fillRect(ox - r, oy - r, 2 * r, 2 * r);
        if (sw > 0 && sw < 1) { g.translate(swx, 0); g.transform(1, 0, -.6, 1, 0, 0); g.fillStyle = lin(g, -40, 0, 40, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-40, 0, 80, H); }
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(ox, oy, r - .5, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(ox - r * .38, oy - r * .5, r * .22, r * .1, -.6, 0, TAU); g.fill();
      }
      // pílula da frente
      const pk = quint(seg(T, 1.45, 2.15)) * (1 - inq(seg(T, 6.35, 6.75)));
      if (pk > .01) {
        const x = 300 + px * 1.7 + (1 - pk) * 200, y = 180 + py * 1.7;
        glass(x, y, 150, 42, 21, 'pill', () => {
          const pu = (T * 1.1) % 1; g.fillStyle = `rgba(255,95,130,${.5 * (1 - pu)})`; g.beginPath(); g.arc(x + 22, y + 21, 5 + pu * 8, 0, TAU); g.fill();
          g.fillStyle = '#FF5F82'; g.beginPath(); g.arc(x + 22, y + 21, 5, 0, TAU); g.fill();
          type(g, 'Ao vivo · 20h', x + 36, y + 21.5, { f: font(600, 15, F.grot), fill: '#fff', align: 'left' });
        });
      }
    };
  }

  // =====================================================================================================
  // 7. HUD / FUI — anéis concêntricos em velocidades diferentes, dados correndo, mira que trava, glow e scanlines
  // =====================================================================================================
  {
    const CX = 250, CY = 132, CY_ = '#48F2FF', OR = '#FF9A2E';
    const cyan = (a) => `rgba(72,242,255,${a})`;
    const scan = () => S2('hud-scan', 480, 270, (c) => { c.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < 270; y += 3) c.fillRect(0, y, 480, 1.2); });
    R['hud-cyberpunk'] = (g, t, W, H, seed) => {
      const T = t % 8, fr = Math.floor(t * 12), r = rng(fr * 7 + 3);
      g.drawImage(S2('hud-bg', W, H, (c) => {
        c.fillStyle = '#01060A'; c.fillRect(0, 0, W, H);
        c.fillStyle = rad(c, CX, CY, 0, 280, [[0, 'rgba(18,90,110,.45)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(72,242,255,.09)'; for (let y = 8; y < H; y += 16) for (let x = 8; x < W; x += 16) c.fillRect(x, y, 1, 1);
      }), 0, 0, W, H);
      const lock = spr(seg(T, 2.55, 3.05)) * (1 - eio(seg(T, 6.8, 7.3))), locked = T > 2.8 && T < 6.9;
      const ring = (k) => ease(seg(T, .1 + k * .15, .75 + k * .15)) * (1 - eio(seg(T, 7.35 + (3 - k) * .06, 7.8 + (3 - k) * .06)));
      g.lineCap = 'butt';
      // núcleo: globo em wireframe
      const th = T * Math.PI / 10;
      g.strokeStyle = cyan(.8); g.lineWidth = 1; g.beginPath(); g.arc(CX, CY, 30, 0, TAU); g.stroke();
      g.strokeStyle = cyan(.45); g.beginPath();
      for (let i = 0; i < 5; i++) { const rx = Math.abs(26 * Math.sin(th + i * Math.PI / 5)); g.moveTo(CX + rx, CY); g.ellipse(CX, CY, Math.max(.1, rx), 26, 0, 0, TAU); }
      [-13, 0, 13].forEach(dy => { const w = Math.sqrt(26 * 26 - dy * dy); g.moveTo(CX - w, CY + dy); g.lineTo(CX + w, CY + dy); });
      g.stroke();
      // anéis
      let k = ring(0); if (k > 0) { const n = 48, a0 = T * TAU / 16; g.strokeStyle = cyan(.75); g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < n * k; i++) { const a = a0 + i * TAU / n; g.moveTo(CX + Math.cos(a) * 42, CY + Math.sin(a) * 42); g.arc(CX, CY, 42, a, a + TAU / n * .45); } g.stroke(); }
      k = ring(1); if (k > 0) { const a0 = -T * TAU / 12; g.strokeStyle = locked ? OR : CY_; g.lineWidth = 2.6; for (let i = 0; i < 3; i++) { const a = a0 + i * TAU / 3; g.beginPath(); g.arc(CX, CY, 54, a, a + 1.25 * k); g.stroke(); } }
      k = ring(2); if (k > 0) {
        const a0 = T * TAU / 96, sweep = T * 1.9; g.lineWidth = 1;
        for (let i = 0; i < 60 * k; i++) { const a = a0 + i * TAU / 60, L = i % 5 ? 3.5 : 7, d = ((sweep - a) % TAU + TAU) % TAU; g.strokeStyle = cyan(d < .5 ? 1 : .45); g.beginPath(); g.moveTo(CX + Math.cos(a) * 64, CY + Math.sin(a) * 64); g.lineTo(CX + Math.cos(a) * (64 + L), CY + Math.sin(a) * (64 + L)); g.stroke(); }
      }
      k = ring(3); if (k > 0) { const a0 = -T * Math.PI / 8; g.strokeStyle = cyan(.6); g.lineWidth = 1; for (let i = 0; i < 2; i++) { const a = a0 + i * Math.PI; g.beginPath(); g.arc(CX, CY, 80, a, a + 1.7 * k); g.stroke(); g.fillStyle = CY_; g.beginPath(); const e = a + 1.7 * k; g.moveTo(CX + Math.cos(e) * 80, CY + Math.sin(e) * 80); g.lineTo(CX + Math.cos(e - .06) * 86, CY + Math.sin(e - .06) * 86); g.lineTo(CX + Math.cos(e - .06) * 74, CY + Math.sin(e - .06) * 74); g.fill(); } }
      g.strokeStyle = cyan(.5); g.lineWidth = 1; g.beginPath(); [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => { g.moveTo(CX + dx * 88, CY + dy * 88); g.lineTo(CX + dx * 96, CY + dy * 96); }); g.stroke();
      // alvo no globo + colchetes que convergem
      if (lock > .01) {
        const ang = -1.716 + T * Math.PI / 10, bx = CX + 26 * Math.sin(ang), by = CY - 9, hb = lerp(64, 9, clamp(lock));
        g.strokeStyle = OR; g.fillStyle = OR; g.lineWidth = 2; g.beginPath(); g.arc(bx, by, 2.6, 0, TAU); g.fill();
        g.beginPath(); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { const x = bx + sx * hb, y = by + sy * hb; g.moveTo(x, y - sy * 6); g.lineTo(x, y); g.lineTo(x - sx * 6, y); }); g.stroke();
        if (locked) { const lk = ease(seg(T, 2.9, 3.3)); g.lineWidth = 1; g.beginPath(); g.moveTo(bx + 9, by - 9); g.lineTo(lerp(bx + 9, 322, lk), lerp(by - 9, 70, lk)); g.lineTo(lerp(bx + 9, 350, lk), 70); g.stroke(); }
      }
      // painel esquerdo: telemetria
      const pf = ease(seg(T, .2, .8));
      g.strokeStyle = cyan(.7); g.lineWidth = 1.2; g.beginPath();
      [[16, 44, 1, 1], [136, 44, -1, 1], [16, 204, 1, -1], [136, 204, -1, -1]].forEach(([x, y, sx, sy]) => { g.moveTo(x + sx * 12 * pf, y); g.lineTo(x, y); g.lineTo(x, y + sy * 12 * pf); }); g.stroke();
      type(g, 'RASTREIO 04', 24, 58, { f: font(600, 14, F.mono), fill: CY_, align: 'left' });
      g.fillStyle = cyan(.25); g.fillRect(24, 68, 104, 2); g.fillStyle = CY_; g.fillRect(24 + ((T * 40) % 84), 68, 20, 2);
      const rows = [['LAT', () => (-23.5482 + r() * .002).toFixed(4)], ['LON', () => (-46.6361 + r() * .002).toFixed(4)], ['ALT', () => (12408 + r() * 90 | 0) + ''], ['VEL', () => (0.842 + r() * .05).toFixed(3)], ['SINAL', () => (94 + r() * 5 | 0) + '%'], ['SETOR', () => '07']];
      rows.forEach(([l, v], i) => {
        const k = seg(T, .6 + i * .1, .9 + i * .1) * (1 - seg(T, 7.4, 7.5)); if (k <= 0) return;
        const y = 86 + i * 19; type(g, l, 24, y, { f: font(400, 14, F.mono), fill: cyan(.55), align: 'left' });
        const val = v(); type(g, val.slice(0, Math.ceil(val.length * k)), 128, y, { f: font(500, 14, F.mono), fill: i === 5 && locked ? OR : CY_, align: 'right' });
      });
      // painel direito: alvo e energia
      g.strokeStyle = cyan(.7); g.lineWidth = 1.2; g.beginPath();
      [[352, 56, 1, 1], [466, 56, -1, 1], [352, 206, 1, -1], [466, 206, -1, -1]].forEach(([x, y, sx, sy]) => { g.moveTo(x + sx * 12 * pf, y); g.lineTo(x, y); g.lineTo(x, y + sy * 12 * pf); }); g.stroke();
      if (locked) {
        type(g, 'ALVO 07', 362, 72, { f: font(600, 14, F.mono), fill: OR, align: 'left' });
        const d = Math.max(0, 1240 - (T - 2.8) * 180); type(g, NF0.format(d) + ' km', 362, 98, { f: font(400, 28, F.cond), fill: OR, align: 'left' });
      } else type(g, 'SEM ALVO', 362, 72, { f: font(400, 14, F.mono), fill: cyan(.5), align: 'left' });
      const mk2 = ease(seg(T, .5, 1.2)) * (1 - eio(seg(T, 7.4, 7.8)));
      for (let i = 0; i < 6; i++) { const v = (.45 + .5 * (.5 + .5 * noise(T * 2.2 + i * 1.7, i))) * mk2, x = 364 + i * 16; g.fillStyle = cyan(.15); g.fillRect(x, 124, 9, 56); g.fillStyle = i === 2 && locked ? OR : CY_; g.fillRect(x, 180 - 56 * v, 9, 56 * v); }
      type(g, 'ENERGIA 87%', 362, 194, { f: font(400, 14, F.mono), fill: cyan(.7), align: 'left' });
      // faixa de estado
      const blink = locked && Math.floor(T * 5) % 3 === 0;
      g.lineWidth = 1.2; g.strokeStyle = locked ? OR : cyan(.7); g.fillStyle = locked ? 'rgba(255,154,46,.14)' : cyan(.06);
      g.fillRect(168, 222, 164, 26); g.strokeRect(168.5, 222.5, 163, 25);
      if (!blink) type(g, locked ? 'ALVO TRAVADO' : 'VARRENDO SETOR 07', 250, 235.5, { f: font(600, 14, F.mono), fill: locked ? OR : CY_, track: 1 });
      // osciloscópio
      g.strokeStyle = cyan(.7); g.lineWidth = 1; g.beginPath(); for (let x = 352; x <= 466; x += 2) { const y = 236 + Math.sin(x * .19 - T * 9) * 5 * (.6 + .4 * Math.sin(x * .05 + T * 2)); x === 352 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();

      // bloom: cópia reduzida da própria tela, somada por cima
      const dpr = g.getTransform().a, cw = g.canvas.width, chh = g.canvas.height;
      const b1 = buf('hud-b1', 240, 135), b2 = buf('hud-b2', 60, 34), x1 = b1.getContext('2d'), x2 = b2.getContext('2d');
      x1.imageSmoothingQuality = 'high'; x1.clearRect(0, 0, 240, 135); x1.drawImage(g.canvas, 0, 0, cw, chh, 0, 0, 240, 135);
      x2.imageSmoothingQuality = 'high'; x2.clearRect(0, 0, 60, 34); x2.drawImage(b1, 0, 0, 60, 34);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(b1, 0, 0, W, H); g.globalAlpha = .7; g.drawImage(b2, 0, 0, W, H); g.restore();
      // glitch no travamento e no desligamento
      if ((T > 2.8 && T < 2.98) || (T > 7.42 && T < 7.72)) { for (let i = 0; i < 4; i++) { const y = r() * H, h = 4 + r() * 14, dx = (r() - .5) * 30; g.drawImage(g.canvas, 0, y * dpr, cw, h * dpr, dx, y, W, h); } }
      g.drawImage(scan(), 0, 0, W, H);
      if (r() < .08) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, W, H); }
    };
  }

  // =====================================================================================================
  // 8. TERMINAL E CÓDIGO — digitação humana, logs rolando, sucesso/aviso coloridos, cursor piscando
  // =====================================================================================================
  {
    const C = { fg: '#D7DAE0', dim: '#6B7380', grn: '#7EE787', cya: '#79C0FF', yel: '#E3B341', red: '#FF7B72', mag: '#D2A8FF' };
    const LH = 19, TOP = 58, N = 9, TX = 30;
    const typing = (s, t0, sd) => { const r = rng(sd), out = []; let tt = t0; for (let i = 0; i < s.length; i++) { out.push(tt); tt += .045 + r() * .05 + (s[i] === ' ' ? .1 : 0) + (r() < .08 ? .22 : 0); } return out; };
    const CMD1 = 'npm run deploy', CMD2 = 'git push origin main';
    const K1 = typing(CMD1, 8.3, 5), K2 = typing(CMD2, 4.15, 9);
    const prompt = [['➜ ', C.grn], ['projeto ', C.cya], ['git:(', C.cya], ['main', C.red], [') ', C.cya]];
    const typed = (s, ks, τ) => s.slice(0, ks.filter(k => k <= τ).length);
    const bar = (p, n = 12) => [['[', C.dim], ['#bar', C.grn, p, n], ['] ', C.dim], [String(Math.round(p * 100)).padStart(3) + '%', C.fg]];
    const LINES = [
      { t: 1.60, s: () => [['> vite build --mode produção', C.dim]] },
      { t: 1.78, s: () => [['✓ ', C.grn], ['128 módulos transformados', C.fg]] },
      { t: 1.92, s: () => [['  dist/app.js      ', C.dim], ['142,8 kB', C.mag]] },
      { t: 2.10, s: () => [['⚠ ', C.yel], ['capa.png tem 1,8 MB', C.yel]] },
      { t: 2.35, s: () => [['✓ ', C.grn], ['42 testes passaram', C.fg]] },
      { t: 2.50, s: (τ) => [['enviando ', C.fg], ...bar(eio(seg(τ, 2.5, 3.35)))] },
      { t: 3.45, s: () => [['✓ Publicado em 3,8 s  ', C.grn], ['#badge', C.grn]] },
      { t: 3.70, prompt: 1, s: (τ) => [...prompt, [typed(CMD2, K2, τ), C.fg]], keys: K2 },
      { t: 5.55, s: () => [['Enumerando objetos: 12, pronto.', C.fg]] },
      { t: 5.72, s: (τ) => [['Comprimindo: ', C.fg], [String(Math.round(100 * seg(τ, 5.72, 6.15))).padStart(3) + '% ', C.fg], [`(${Math.round(8 * seg(τ, 5.72, 6.15))}/8)`, C.dim]] },
      { t: 6.30, s: () => [['Para github.com:bp/projeto.git', C.fg]] },
      { t: 6.45, s: () => [['   a1f9c3e..7d2b0e4  ', C.yel], ['main -> main', C.fg]] },
      { t: 6.80, prompt: 1, s: (τ) => [...prompt, [typed(CMD1, K1, τ), C.fg]], keys: K1 },
    ];
    const NL = LINES.length;
    R['terminal-codigo'] = (g, t, W, H) => {
      const T = t % 8;
      g.drawImage(S2('tm-bg', W, H, (c) => {
        c.fillStyle = '#05070A'; c.fillRect(0, 0, W, H); c.fillStyle = rad(c, 240, 150, 0, 300, [[0, 'rgba(40,70,90,.35)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(0, 0, W, H);
        c.save(); c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 40; c.shadowOffsetY = 16; c.fillStyle = '#0D1117'; c.beginPath(); c.roundRect(16, 10, 448, 232, 10); c.fill(); c.restore();
        c.fillStyle = lin(c, 0, 10, 0, 242, [[0, '#111722'], [1, '#0B0F15']]); c.beginPath(); c.roundRect(16, 10, 448, 232, 10); c.fill();
        c.fillStyle = '#161C26'; c.beginPath(); c.roundRect(16, 10, 448, 26, [10, 10, 0, 0]); c.fill(); c.fillStyle = '#232B38'; c.fillRect(16, 36, 448, 1);
        c.strokeStyle = '#2A3342'; c.lineWidth = 1; c.beginPath(); c.roundRect(16.5, 10.5, 447, 231, 10); c.stroke();
        ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(32 + i * 15, 23, 4.5, 0, TAU); c.fill(); });
        c.font = font(500, 14, F.mono); c.fillStyle = '#7D8590'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('zsh — ~/projeto', 84, 23.5);
        c.fillStyle = '#18202B'; c.fillRect(17, 37, 446, 17);
        c.fillStyle = '#D7DAE0'; c.fillText('1:zsh*', 122, 46); c.fillStyle = '#6B7380'; c.fillText('2:logs', 184, 46); c.textAlign = 'right'; c.fillText('main  14:32', 454, 46);
      }), 0, 0, W, H);
      // linhas: iteração anterior inteira + a atual até T (a tela é a cauda de um log infinito → loop sem emenda)
      let cont = NL; const vis = [];
      for (let j = 0; j < NL; j++) vis.push([LINES[j], T + 8]);
      LINES.forEach(L => { if (T >= L.t) { vis.push([L, T]); cont += ease(seg(T, L.t, L.t + .09)); } });
      const start = cont - N, f14 = font(400, 14, F.mono), f14b = font(600, 14, F.mono);
      g.save(); g.beginPath(); g.rect(20, 56, 440, 182); g.clip(); g.textBaseline = 'middle'; g.textAlign = 'left';
      const cw = tw(g, 'M', f14);
      let curX = 0, curY = 0, curOn = false;
      for (let j = Math.max(0, Math.floor(start) - 1); j < vis.length; j++) {
        const [L, τ] = vis[j], y = TOP + (j - start) * LH + 9; if (y < 26) continue;
        let x = TX;
        L.s(τ).forEach(([s, col, p, n]) => {
          if (s === '#bar') { for (let i = 0; i < n; i++) { g.fillStyle = i < Math.round(p * n) ? col : '#26303C'; g.fillRect(x + i * cw + 1, y - 6, cw - 2, 12); } x += n * cw; return; }
          if (s === '#badge') { const fl = seg(τ, 3.45, 3.6); g.fillStyle = fl < 1 ? '#EFFFF2' : col; g.fillRect(x, y - 9, cw * 8, 18); g.font = f14b; g.fillStyle = '#0D1117'; g.fillText(' PRONTO ', x, y + .5); x += cw * 8; return; }
          g.font = col === C.grn && s.startsWith('✓ P') ? f14b : f14; g.fillStyle = col; g.fillText(s, x, y + .5); x += g.measureText(s).width;
        });
        if (j === vis.length - 1 && L.prompt) { curX = x + 1; curY = y; curOn = true; const ks = L.keys, busy = ks.some(k => Math.abs(k - τ) < .25); if (!busy && Math.floor(t * 1.9) % 2) curOn = false; }
      }
      if (curOn) { g.fillStyle = '#D7DAE0'; g.fillRect(curX, curY - 8, cw, 16); }
      g.restore();
      // segmento de estado da barra tmux: âmbar enquanto roda, verde quando termina
      const run = (T > 1.5 && T < 3.45) || (T > 5.45 && T < 6.45);
      g.fillStyle = run ? C.yel : C.grn; g.fillRect(17, 37, 94, 17);
      type(g, run ? '▶ rodando' : '✓ pronto', 26, 46, { f: font(600, 14, F.mono), fill: '#0D1117', align: 'left' });
    };
  }

  // =====================================================================================================
  // 9. NEO-BRUTALISMO — contorno preto grosso, sombra dura deslocada, cor chapada, clique físico
  // =====================================================================================================
  {
    const K = '#111', LW = 3.5;
    const slam = (x) => { x = clamp(x); return x < .55 ? ease(x / .55) * 1.07 : 1.07 - .07 * eio((x - .55) / .45); };
    const box = (g, x, y, w, h, fill, off, r = 6) => { rr(g, x + off, y + off, w, h, r); g.fillStyle = K; g.fill(); rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); g.lineWidth = LW; g.strokeStyle = K; g.stroke(); };
    const star = (g, x, y, r0, r1, n) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, r = i % 2 ? r0 : r1; i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
    R['neo-brutalismo'] = (g, t, W, H) => {
      const T = t % 7;
      g.drawImage(S2('nb-bg', W, H, (c) => { c.fillStyle = '#FFF0CF'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(17,17,17,.2)'; for (let y = 10; y < H; y += 20) for (let x = 10; x < W; x += 20) { c.beginPath(); c.arc(x, y, 1.2, 0, TAU); c.fill(); } }), 0, 0, W, H);
      // faixa corrida (grafismo de primeiro plano)
      g.fillStyle = K; g.fillRect(0, 250, W, 20);
      g.save(); g.beginPath(); g.rect(0, 250, W, 20); g.clip(); const mq = '★ SEM FRESCURA ★ DIRETO AO PONTO ', mw = tw(g, mq, font(400, 14, F.slab)); const mo = -((T * 60) % mw);
      for (let x = mo; x < W; x += mw) type(g, mq, x, 260.5, { f: font(400, 14, F.slab), fill: '#FFD23F', align: 'left' });
      g.restore();

      const wi = slam(seg(T, 5.85, 6.2)), wo = inq(seg(T, 6.55, 6.95));
      if (T < 6.2) {
      // cartão do título: cai e bate (sombra encurta ao pousar)
      const c1 = slam(seg(T, 0, .38)), lift = 1 - c1;
      g.save(); g.translate(0, -lift * 60); box(g, 36, 48, 300, 124, '#fff', 7 + lift * 10); g.restore();
      if (T > .2) type(g, 'FAÇA', 70, 88, { f: font(400, 40, F.slab), fill: K, align: 'left' });
      const hl = ease(seg(T, .3, .5));
      if (hl > 0) { g.fillStyle = '#FF6FB5'; g.fillRect(62, 118, 256 * hl, 42); g.lineWidth = 3; g.strokeStyle = K; g.strokeRect(62, 118, 256 * hl, 42); }
      if (T > .42) type(g, 'BARULHO.', 70, 140, { f: font(400, 40, F.slab), fill: K, align: 'left' });
      // selo NOVO!
      const s1 = slam(seg(T, .85, 1.15));
      if (s1 > 0) { g.save(); g.translate(40, 48); g.rotate(-.25 + Math.sin(T * 2.4) * .06); g.scale(s1, s1); star(g, 4, 4, 26, 33, 12); g.fillStyle = K; g.fill(); star(g, 0, 0, 26, 33, 12); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 3; g.strokeStyle = K; g.stroke(); type(g, 'NOVO!', 0, 1, { f: font(400, 14, F.slab), fill: K }); g.restore(); }
      // cartão do raio
      const s2 = slam(seg(T, 1.15, 1.45));
      if (s2 > 0) { g.save(); g.translate(412, 86); g.rotate(.1 + Math.sin(T * 1.9 + 1) * .04); g.scale(s2, s2); box(g, -34, -34, 68, 68, '#B8FF5C', 6); poly(g, [[6, -24], [-14, 4], [-1, 4], [-6, 24], [15, -6], [2, -6]]); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 3; g.stroke(); g.restore(); }
      // botão com clique físico
      const b1 = slam(seg(T, 1.45, 1.8)), press = seg(T, 2.3, 2.36) * (1 - seg(T, 2.46, 2.52)), ok = T > 2.49;
      if (b1 > 0) {
        const off = 6 * (1 - press), bx = 36 + 6 - off, by = 188 + (1 - b1) * 90 + 6 - off;
        box(g, bx, by, 176, 46, ok ? '#B8FF5C' : '#5CC8FF', off);
        type(g, ok ? 'FEITO! ✓' : 'COMEÇAR →', bx + 88, by + 24, { f: font(400, 18, F.slab), fill: K });
      }
      // contador que entra depois do clique
      const s3 = slam(seg(T, 2.6, 2.95));
      if (s3 > 0) {
        g.save(); g.translate(0, (1 - s3) * -80); box(g, 350, 142, 112, 76, '#FF6FB5', 6);
        const n = Math.round(1204 * ease(seg(T, 2.7, 3.5))); type(g, '+' + NF0.format(n), 406, 172, { f: font(400, 24, F.slab), fill: K });
        type(g, 'inscritos', 406, 199, { f: font(700, 14, F.grot), fill: K }); g.restore();
      }
      // cursor grosso
      const cu = eio(seg(T, 1.7, 2.28)), aw = ease(seg(T, 2.65, 3.3)), cx = lerp(470, 150, cu) + aw * 78 + Math.sin(T * 2) * (T > 3.3 ? 3 : 0), cy = lerp(290, 216, cu) + press * 3 + aw * 14;
      if (T > 1.7 && T < 5.9) { g.save(); g.translate(cx, cy); g.scale(1 - press * .12, 1 - press * .12); const arrow = [[0, 0], [0, 26], [7, 20], [12, 31], [18, 28], [13, 18], [22, 18]]; g.translate(3, 3); poly(g, arrow); g.fillStyle = K; g.fill(); g.translate(-3, -3); poly(g, arrow); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = K; g.stroke(); g.restore(); }
      }
      // fim: painel "DE NOVO!" varre a tela (atrás dele a cena já volta ao começo)
      if (wi > 0 && wo < 1) {
        const x = -W * 1.1 * (1 - wi) + W * 1.15 * wo;
        g.save(); g.translate(x, 0); g.fillStyle = K; g.fillRect(8, 8, W, H); g.fillStyle = '#5CC8FF'; g.fillRect(0, 0, W, H); g.lineWidth = 6; g.strokeStyle = K; g.strokeRect(3, 3, W - 6, H - 6);
        type(g, 'DE NOVO!', W / 2 + 5, H / 2 + 5, { f: font(400, 60, F.slab), fill: K }); type(g, 'DE NOVO!', W / 2, H / 2, { f: font(400, 60, F.slab), fill: '#FFD23F', stroke: K, lw: 6 }); g.restore();
      }
    };
  }
})();
