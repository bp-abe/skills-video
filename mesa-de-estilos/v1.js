
// 1. quadro a quadro (traço que "ferve" a 12 qps)
R.quadro_a_quadro = (g, t, W, H) => {
  bg(g, W, H, '#F3EBDD'); const f = Math.floor(t * 12); const bounce = Math.abs(Math.sin(t * 3)) * 60;
  g.strokeStyle = '#2B2118'; g.lineWidth = 3; g.lineCap = 'round';
  g.fillStyle = '#E8553D'; wobbleCircle(g, 240, 190 - bounce, 34, f / 12, 3, 1); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(90, 226 + noise(f, 2) * 2); g.bezierCurveTo(200, 222 + noise(f, 3) * 3, 300, 230, 400, 224 + noise(f, 4) * 2); g.stroke();
  g.fillStyle = '#2B2118'; g.beginPath(); g.arc(228, 184 - bounce, 4, 0, TAU); g.arc(252, 184 - bounce, 4, 0, TAU); g.fill();
  g.globalAlpha = .25; g.beginPath(); g.ellipse(240, 228, 40 - bounce * .3, 6, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
};

// 2. isométrico 2.5D (cidade que sobe bloco a bloco)
R.isometrico = (g, t, W, H, seed) => {
  bg(g, W, H, '#CFC8F3'); const p = loop(t, 7), r = rng(seed); const cx = 240, cy = 150, s = 18;
  const iso = (x, y, z) => [cx + (x - y) * s, cy + (x + y) * s * .5 - z];
  const cells = []; for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) cells.push([x, y, 10 + r() * 60, r()]);
  cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  cells.forEach(([x, y, h, k], i) => {
    const grow = ease((p * 1.6 - k * .8)) * h; const top = [iso(x, y, grow), iso(x + 1, y, grow), iso(x + 1, y + 1, grow), iso(x, y + 1, grow)];
    g.fillStyle = '#7D6BD6'; poly(g, [iso(x + 1, y, 0), iso(x + 1, y + 1, 0), top[2], top[1]]); g.fill();
    g.fillStyle = '#5B49B8'; poly(g, [iso(x, y + 1, 0), iso(x + 1, y + 1, 0), top[2], top[3]]); g.fill();
    g.fillStyle = grow > 2 ? '#F4F1FF' : '#B7ADEE'; poly(g, top); g.fill();
  });
};

// 3. vetor chapado (paisagem, sol e prédios em cores sólidas)
R.vetor_chapado = (g, t, W, H) => {
  bg(g, W, H, '#1F3BFF'); const p = loop(t, 6);
  g.fillStyle = '#FF5A36'; g.beginPath(); g.arc(360, 90 + Math.sin(t) * 6, 36, 0, TAU); g.fill();
  const cols = ['#FFD23F', '#00C2A8', '#FF7AB6', '#FFFFFF', '#111']; const b = [[60, 90], [110, 140], [170, 70], [220, 170], [290, 110], [340, 80], [390, 150]];
  b.forEach(([x, h], i) => { const hh = h * spr(p * 3 - i * .12); g.fillStyle = cols[i % 5]; g.fillRect(x, 240 - hh, 44, hh); g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < hh / 22 - 1; k++) g.fillRect(x + 10, 248 - hh + k * 22, 8, 10); });
  g.fillStyle = '#111'; g.fillRect(0, 240, W, 30);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(120 + ((t * 30) % 600) - 60, 60, 30, 12, 0, 0, TAU); g.fill();
};

// 4. animação de linha (um traço contínuo desenha a cidade)
R.linha = (g, t, W, H) => {
  bg(g, W, H, '#0E141B'); const p = loop(t, 6);
  const pts = [[20, 210], [70, 210], [70, 150], [110, 150], [110, 120], [140, 120], [140, 210], [180, 210], [180, 90], [200, 70], [220, 90], [220, 210], [260, 210], [260, 140], [300, 140], [300, 210], [320, 210], [320, 110], [360, 110], [360, 210], [460, 210]];
  let L = 0; const seg = pts.slice(1).map((q, i) => { const d = Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]); L += d; return d; });
  g.strokeStyle = '#E9E3D0'; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]);
  let left = L * eio(p * 1.4); let head = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const k = Math.min(1, left / seg[i]); head = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; g.lineTo(...head); left -= seg[i]; }
  g.stroke(); g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(head[0], head[1], 4, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(233,227,208,.5)'; g.beginPath(); g.arc(380, 70, 22 * ease(p * 2 - .8), 0, TAU); g.stroke();
};

// 5. 3D renderizado (campo de esferas macias, luz suave)
R.render_3d = (g, t, W, H) => {
  bg(g, W, H, '#F4D7DF');
  for (let row = 0; row < 11; row++) for (let col = 0; col < 26; col++) {
    const x = col * 20 + (row % 2) * 10 - 10, y = 110 + row * 15, d = Math.hypot(x - 240 - Math.sin(t) * 80, y - 180);
    const z = Math.sin(d * .05 - t * 3) * 5; const r = 7 + row * .45;
    const gr = g.createRadialGradient(x - r * .35, y - r * .4 + z, 1, x, y + z, r); gr.addColorStop(0, '#FFF3F6'); gr.addColorStop(.6, '#F2A7BD'); gr.addColorStop(1, '#C96C8A');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y + z, r, 0, TAU); g.fill();
  }
  const bob = Math.sin(t * 2) * 6; txt(g, 'soft', 240, 70 + bob, '800 64px system-ui', '#E2507F');
  g.globalAlpha = .6; txt(g, 'soft', 240, 66 + bob, '800 64px system-ui', '#FFC2D3'); g.globalAlpha = 1;
};

// 6. morphing de formas (círculo → quadrado → triângulo → gota)
R.morph = (g, t, W, H) => {
  bg(g, W, H, '#F5F0E6'); const p = t * .5; const shapes = [
    a => [Math.cos(a), Math.sin(a)],
    a => { const c = Math.cos(a), s = Math.sin(a), m = Math.max(Math.abs(c), Math.abs(s)); return [c / m * .85, s / m * .85]; },
    a => { const k = (a + Math.PI / 2) / TAU * 3, i = Math.floor(k) % 3, f = k - Math.floor(k); const v = [0, 1, 2].map(j => [Math.cos(j / 3 * TAU - Math.PI / 2), Math.sin(j / 3 * TAU - Math.PI / 2)]); const A = v[i], B = v[(i + 1) % 3]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; },
    a => { const s = Math.sin(a); return [Math.cos(a) * (0.6 + .4 * (1 - s) / 2), s]; }];
  const i = Math.floor(p) % 4, f = eio(p - Math.floor(p)); const cols = ['#E8453C', '#1D3FBF', '#F2B31B', '#16A085'];
  g.fillStyle = cols[i]; g.beginPath();
  for (let k = 0; k <= 120; k++) { const a = k / 120 * TAU - Math.PI / 2; const A = shapes[i](a), B = shapes[(i + 1) % 4](a); const x = 240 + (A[0] + (B[0] - A[0]) * f) * 70, y = 135 + (A[1] + (B[1] - A[1]) * f) * 70; k ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.fill();
};

// 7. explicativo com adesivos (cartões brancos com borda e sombra, entrando com mola)
R.adesivos = (g, t, W, H) => {
  bg(g, W, H, '#EDEFF3'); const p = loop(t, 5);
  const items = [[110, 110, '#FF6B4A', 'PASSO 1'], [240, 150, '#3A86FF', 'PASSO 2'], [370, 105, '#FFBE0B', 'PASSO 3']];
  items.forEach(([x, y, c, s], i) => {
    const k = spr(p * 3 - i * .35); if (k <= 0) return; g.save(); g.translate(x, y); g.rotate((i - 1) * .08); g.scale(k, k);
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(-52, -34 + 5, 104, 72); g.fillStyle = '#fff'; g.fillRect(-56, -38, 112, 76);
    g.fillStyle = c; g.beginPath(); g.arc(0, -6, 20, 0, TAU); g.fill(); txt(g, s, 0, 26, '700 12px system-ui', '#222'); g.restore();
  });
  g.strokeStyle = '#222'; g.setLineDash([4, 5]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(150, 125); g.quadraticCurveTo(190, 170, 195, 150); g.moveTo(285, 150); g.quadraticCurveTo(320, 100, 330, 110); g.stroke(); g.setLineDash([]);
};

// 8. HUD cyberpunk (radar, dados correndo, ciano sobre preto)
R.hud = (g, t, W, H, seed) => {
  bg(g, W, H, '#03090C'); const c = '#35E6E6'; g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 1;
  [30, 55, 80].forEach(r => { g.globalAlpha = .7; g.beginPath(); g.arc(160, 135, r, 0, TAU); g.stroke(); });
  g.globalAlpha = 1; const a = t * 1.6; g.beginPath(); g.moveTo(160, 135); g.arc(160, 135, 80, a - .5, a); g.closePath(); g.globalAlpha = .25; g.fill(); g.globalAlpha = 1;
  g.beginPath(); g.moveTo(160, 135); g.lineTo(160 + Math.cos(a) * 80, 135 + Math.sin(a) * 80); g.stroke();
  const r = rng(seed + Math.floor(t * 6)); g.font = '10px ui-monospace,monospace'; g.textAlign = 'left';
  for (let i = 0; i < 12; i++) g.fillText(`${(r() * 99999 | 0).toString(16).toUpperCase().padStart(5, '0')}  ${(r() * 100).toFixed(2)}`, 290, 50 + i * 15);
  g.strokeRect(282, 36, 170, 196); g.fillRect(282, 36, 40 + Math.sin(t * 2) * 30 + 30, 3);
  g.fillStyle = '#FF4D6D'; const bx = 160 + Math.cos(2.2) * 50, by = 135 + Math.sin(2.2) * 50; if (Math.floor(t * 3) % 2) { g.beginPath(); g.arc(bx, by, 4, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(53,230,230,.06)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
};

// 9. colagem (recortes rasgados, halftone, fita)
R.colagem = (g, t, W, H, seed) => {
  bg(g, W, H, '#C9B99A'); const f = Math.floor(t * 8), r = rng(seed);
  const torn = (x, y, w, h, c, rot) => { g.save(); g.translate(x, y); g.rotate(rot + noise(f, x) * .01); const rr = rng(x * 7 + y); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 4, -h / 2 + 5, w, h); g.fillStyle = c; g.beginPath(); for (let i = 0; i <= 20; i++) g.lineTo(-w / 2 + w * i / 20, -h / 2 + rr() * 4); for (let i = 0; i <= 20; i++) g.lineTo(w / 2 - w * i / 20, h / 2 - rr() * 4); g.fill(); g.restore(); };
  torn(150, 130, 190, 150, '#EDE6D6', -.06); torn(330, 110, 150, 120, '#D6322B', .08);
  g.fillStyle = '#1B1B1B'; for (let y = 70; y < 190; y += 7) for (let x = 70; x < 230; x += 7) { const d = Math.hypot(x - 150, y - 125); const rr = clamp(3.2 - d / 28, 0, 3.2); if (rr > .3) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } }
  g.fillStyle = 'rgba(245,235,180,.75)'; g.save(); g.translate(250, 60); g.rotate(-.3); g.fillRect(-40, -9, 80, 18); g.restore();
  txt(g, 'A MENTE', 330, 100, '900 26px Georgia,serif', '#fff'); txt(g, 'É UMA COLAGEM', 330 + Math.sin(f) * 1, 128, '900 16px Georgia,serif', '#fff');
  grain(g, W, H, t, .05, seed);
};

// 10. vidro fosco com aurora (gradientes que respiram atrás de painéis translúcidos)
R.vidro_aurora = (g, t, W, H) => {
  bg(g, W, H, '#0B0E2A');
  [[.8, '#7B5CFF'], [1.3, '#00D1FF'], [.6, '#FF5FA2']].forEach(([s, c], i) => { const x = 240 + Math.sin(t * s + i * 2) * 140, y = 135 + Math.cos(t * s * .8 + i) * 70; const gr = g.createRadialGradient(x, y, 0, x, y, 170); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(11,14,42,0)'); g.globalAlpha = .75; g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  g.globalAlpha = 1; const card = (x, y, w, h, a) => { g.fillStyle = `rgba(255,255,255,${a})`; g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill(); g.stroke(); };
  card(120, 70, 240, 130, .12); card(150 + Math.sin(t) * 6, 150, 150, 40, .18);
  txt(g, 'Aurora', 240, 118, '300 30px system-ui', 'rgba(255,255,255,.92)');
};

// 11. Bauhaus (círculo, quadrado e triângulo em primárias se montando)
R.bauhaus = (g, t, W, H) => {
  bg(g, W, H, '#F1EBDD'); const p = loop(t, 6);
  g.strokeStyle = 'rgba(0,0,0,.12)'; for (let x = 40; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  const k = (i) => spr(p * 3 - i * .4);
  g.fillStyle = '#D62828'; g.beginPath(); g.arc(170, 140, 60 * k(0), 0, TAU); g.fill();
  g.fillStyle = '#1D3557'; g.fillRect(250, 70 - (1 - k(1)) * 200, 70, 140);
  g.fillStyle = '#F4B400'; g.beginPath(); const tk = k(2); g.moveTo(320, 210); g.lineTo(320 + 110 * tk, 210); g.lineTo(320, 210 - 110 * tk); g.fill();
  g.fillStyle = '#111'; g.fillRect(90, 222, 300 * k(3), 8);
};

// 12. synthwave (grade em perspectiva, sol listrado, neon)
R.synthwave = (g, t, W, H) => {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1A0536'); sky.addColorStop(.55, '#5B0F6B'); sky.addColorStop(.56, '#12021F'); sky.addColorStop(1, '#0A0114'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sg = g.createLinearGradient(0, 40, 0, 150); sg.addColorStop(0, '#FFE259'); sg.addColorStop(1, '#FF2E88'); g.fillStyle = sg; g.beginPath(); g.arc(240, 150, 70, Math.PI, 0); g.fill();
  g.fillStyle = '#5B0F6B'; for (let i = 0; i < 5; i++) g.fillRect(170, 112 + i * 8, 140, 2 + i);
  g.strokeStyle = '#FF3BD4'; g.lineWidth = 1.4; const hz = 150;
  for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(240 + i * 8, hz); g.lineTo(240 + i * 80, H); g.stroke(); }
  for (let k = 0; k < 10; k++) { const z = ((k + (t * 1.2) % 1) / 10); const y = hz + Math.pow(z, 2.2) * (H - hz); g.globalAlpha = z; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.globalAlpha = 1; g.shadowColor = '#FF3BD4'; g.shadowBlur = 12; txt(g, 'NEON DRIVE', 240, 60, 'italic 900 30px system-ui', '#FFD6F6'); g.shadowBlur = 0;
};

// 13. pixel art (cena em baixa resolução ampliada, personagem pulando)
R.pixel = (g, t, W, H) => {
  const px = 8; g.imageSmoothingEnabled = false; const cw = W / px, ch = H / px;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { g.fillStyle = y < 20 ? (y < 8 ? '#5AB9EA' : '#8FD3F4') : y < 22 ? '#3FA34D' : '#8B5A2B'; g.fillRect(x * px, y * px, px, px); }
  const off = Math.floor(t * 6) % 12; g.fillStyle = '#2E7D32'; for (let x = -1; x < cw / 12 + 1; x++) { const bx = (x * 12 - off) * px; g.fillRect(bx + 2 * px, 14 * px, 6 * px, 6 * px); g.fillRect(bx + 4 * px, 12 * px, 2 * px, 2 * px); }
  const j = Math.floor(Math.abs(Math.sin(t * 3)) * 5); const hx = 22 * px, hy = (16 - j) * px;
  g.fillStyle = '#E53935'; g.fillRect(hx, hy, 4 * px, 2 * px); g.fillStyle = '#FFCC80'; g.fillRect(hx, hy + 2 * px, 4 * px, 2 * px); g.fillStyle = '#1E88E5'; g.fillRect(hx, hy + 4 * px, 4 * px, 2 * px);
  g.fillStyle = '#fff'; g.font = 'bold 16px ui-monospace,monospace'; g.textAlign = 'left'; g.fillText(`SCORE ${String(Math.floor(t * 37) % 10000).padStart(5, '0')}`, 16, 24);
};

// 14. líquido (metaballs que se fundem)
R.liquido = (g, t, W, H) => {
  bg(g, W, H, '#2A0B3D'); const s = 6, cw = W / s, ch = H / s;
  const balls = [0, 1, 2, 3].map(i => [cw / 2 + Math.sin(t * (.7 + i * .2) + i * 2) * cw * .3, ch / 2 + Math.cos(t * (.9 + i * .15) + i) * ch * .28, 7 + i]);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { let v = 0; for (const [bx, by, r] of balls) v += r * r / ((x - bx) ** 2 + (y - by) ** 2 + .1); if (v > 1) { const k = clamp((v - 1) / 3); g.fillStyle = `rgb(${255},${80 + k * 120 | 0},${140 + k * 80 | 0})`; g.fillRect(x * s, y * s, s, s); } }
};

// 15. letreiro de TV de variedades (texto gordo com contorno, estouro e onomatopeia)
R.variedades = (g, t, W, H) => {
  bg(g, W, H, '#FFE14D'); const p = loop(t, 3); g.save(); g.translate(240, 135);
  g.fillStyle = '#FF3D7F'; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * .5, r = i % 2 ? 90 : 130; g.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * .9); } g.fill();
  const k = spr(p * 2.2); g.scale(k, k); g.rotate(-.08 + Math.sin(t * 8) * .02);
  g.font = '900 54px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 16; g.strokeStyle = '#1B1B1B'; g.strokeText('CHOCANTE!', 0, 0); g.lineWidth = 8; g.strokeStyle = '#fff'; g.strokeText('CHOCANTE!', 0, 0); g.fillStyle = '#FF3D00'; g.fillText('CHOCANTE!', 0, 0);
  g.restore(); txt(g, '?!', 400 + Math.sin(t * 6) * 4, 60, '900 40px system-ui', '#1B1B1B');
};

// 16. tipografia cinética (palavras batendo no ritmo)
R.tipo_cinetica = (g, t, W, H) => {
  bg(g, W, H, '#111'); const words = ['PENSE', 'MAIOR', 'QUE', 'O', 'QUADRO']; const beat = t * 2.4, i = Math.floor(beat) % words.length, f = beat - Math.floor(beat);
  const k = spr(f * 1.6); g.save(); g.translate(240, 135); g.scale(.6 + k * .4, .6 + k * .4);
  txt(g, words[i], 0, 0, '900 92px system-ui', i === 1 ? '#FF4F00' : '#F5F5F0'); g.restore();
  g.fillStyle = '#FF4F00'; g.fillRect(40, 220, 400 * f, 4);
};

// 17. infográfico / dados (barras que crescem e se reordenam)
R.dados = (g, t, W, H) => {
  bg(g, W, H, '#F7F7F2'); const p = loop(t, 6), vals = [[.42, .8], [.9, .5], [.3, .95], [.65, .3]].map(([a, b]) => a + (b - a) * eio(p * 2 - .6));
  const order = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]); const cols = ['#0B6E4F', '#E76F51', '#264653', '#E9C46A'];
  order.forEach(([v, i], rank) => { const y = 50 + rank * 48; g.fillStyle = cols[i]; g.fillRect(90, y, 330 * v * ease(p * 3), 30); txt(g, `${Math.round(v * 100)}%`, 100 + 330 * v * ease(p * 3), y + 15, '600 14px system-ui', '#222', 'left'); txt(g, 'ABCD'[i], 70, y + 15, '700 16px system-ui', '#222', 'right'); });
  g.strokeStyle = '#999'; g.beginPath(); g.moveTo(90, 40); g.lineTo(90, 245); g.stroke();
};

// 18. whiteboard (mão desenhando e escrevendo)
R.whiteboard = (g, t, W, H) => {
  bg(g, W, H, '#FDFDFB'); const p = loop(t, 6); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.lineCap = 'round';
  const k = eio(p * 1.5); g.beginPath(); g.arc(150, 130, 50, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k * 2)); g.stroke();
  const k2 = clamp(k * 2 - 1); g.beginPath(); g.moveTo(230, 130); g.lineTo(230 + 80 * k2, 130); g.stroke();
  if (k2 > .95) { g.beginPath(); g.moveTo(300, 118); g.lineTo(312, 130); g.lineTo(300, 142); g.stroke(); }
  g.save(); g.beginPath(); g.rect(320, 100, 140 * clamp(k * 2 - 1.2), 60); g.clip(); txt(g, 'ideia', 385, 130, 'italic 700 34px "Comic Sans MS",cursive', '#1a1a1a'); g.restore();
  const hx = k < .5 ? 150 + Math.cos(-Math.PI / 2 + TAU * clamp(k * 2)) * 50 : 230 + 80 * k2; const hy = k < .5 ? 130 + Math.sin(-Math.PI / 2 + TAU * clamp(k * 2)) * 50 : 130;
  g.fillStyle = '#E8C4A0'; g.beginPath(); g.ellipse(hx + 24, hy + 30, 20, 30, -.5, 0, TAU); g.fill(); g.fillStyle = '#222'; g.save(); g.translate(hx, hy); g.rotate(-.6); g.fillRect(-3, 0, 6, 40); g.restore();
};

// 19. stop motion de papel (peças tremendo levemente a 12 qps)
R.stop_motion = (g, t, W, H, seed) => {
  bg(g, W, H, '#E8DCC4'); const f = Math.floor(t * 12), r = rng(f + seed); const j = () => (r() - .5) * 2.4;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(240 + j(), 222, 90, 10, 0, 0, TAU); g.fill();
  g.fillStyle = '#2F6F4F'; poly(g, [[150 + j(), 220], [240 + j(), 90 + j()], [330 + j(), 220]]); g.fill();
  g.fillStyle = '#F6F1E7'; poly(g, [[212 + j(), 130], [240 + j(), 90], [268 + j(), 130], [255, 124], [240, 136], [226, 124]]); g.fill();
  const cx = 60 + ((f * 4) % 420); g.fillStyle = '#C0392B'; g.beginPath(); g.arc(cx + j(), 206 + Math.abs(Math.sin(f)) * -6, 12, 0, TAU); g.fill();
  grain(g, W, H, t, .04, seed);
};

// 20. recorte de papel em camadas (parallax de planos)
R.papel_camadas = (g, t, W, H) => {
  const cols = ['#F6D6AD', '#E9A178', '#C8625A', '#7A3B4F', '#3B1F3A'];
  cols.forEach((c, i) => { const off = Math.sin(t * .6) * (i + 1) * 8; g.fillStyle = c; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.beginPath(); g.moveTo(-20, H); for (let x = -20; x <= W + 20; x += 20) g.lineTo(x + off, 90 + i * 36 + Math.sin(x * .02 + i * 1.7) * (18 - i * 2)); g.lineTo(W + 20, H); g.fill(); });
  g.shadowBlur = 0; g.shadowOffsetY = 0; g.fillStyle = '#FFF4E0'; g.beginPath(); g.arc(370, 60, 22, 0, TAU); g.fill();
};

// 21. massinha (formas arredondadas, brilho e digitais)
R.massinha = (g, t, W, H) => {
  bg(g, W, H, '#8FC1E3'); const f = Math.floor(t * 12); const sq = 1 + Math.sin(f * .9) * .05;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(240, 222, 70, 12, 0, 0, TAU); g.fill();
  g.save(); g.translate(240, 160); g.scale(1 / sq, sq); const gr = g.createRadialGradient(-20, -30, 5, 0, 0, 70); gr.addColorStop(0, '#FFB0A0'); gr.addColorStop(1, '#E0533C'); g.fillStyle = gr; wobbleCircle(g, 0, 0, 58, f / 12, 3, 2); g.fill(); g.restore();
  g.strokeStyle = 'rgba(120,30,20,.25)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(270, 150, 8 + i * 4, .4, 2.2); g.stroke(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(222, 148, 9, 0, TAU); g.arc(258, 148, 9, 0, TAU); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(224, 150, 4, 0, TAU); g.arc(260, 150, 4, 0, TAU); g.fill();
};

// 22. rotoscopia (silhueta posterizada, traço sobre movimento real)
R.rotoscopia = (g, t, W, H) => {
  bg(g, W, H, '#F2E9D8'); const ph = t * 4; const leg = Math.sin(ph) * .6, arm = Math.cos(ph) * .5; const x = 240 + Math.sin(t * .5) * 20, y = 90 + Math.abs(Math.sin(ph)) * -6;
  g.fillStyle = '#233D4D'; g.strokeStyle = '#233D4D'; g.lineCap = 'round'; g.lineWidth = 14;
  const limb = (ox, oy, a, l) => { g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.sin(a) * l, oy + Math.cos(a) * l); g.stroke(); };
  limb(x, y + 70, leg, 70); limb(x, y + 70, -leg, 70); limb(x, y + 20, arm, 50); limb(x, y + 20, -arm, 50);
  g.lineWidth = 22; limb(x, y + 10, 0, 60); g.beginPath(); g.arc(x, y - 8, 16, 0, TAU); g.fill();
  g.fillStyle = '#FE7F2D'; g.fillRect(0, 238, W, 32);
  g.strokeStyle = 'rgba(35,61,77,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y - 8, 22 + noise(t * 10) * 2, 0, TAU); g.stroke();
};

// 23. documentário de arquivo (foto antiga, Ken Burns, grão e data)
R.arquivo = (g, t, W, H, seed) => {
  const p = loop(t, 8); g.save(); const s = 1.05 + p * .12; g.translate(240 - p * 30, 135); g.scale(s, s); g.translate(-240, -135);
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#D9CBB0'); sk.addColorStop(1, '#8C7B62'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  g.fillStyle = '#4A3F33'; [[60, 120, 60, 110], [140, 90, 50, 140], [210, 130, 80, 100], [310, 100, 40, 130], [360, 140, 90, 90]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
  g.fillStyle = '#2E271F'; g.fillRect(0, 225, W, 50); g.restore();
  g.fillStyle = 'rgba(40,30,20,.25)'; g.fillRect(0, 0, W, H); grain(g, W, H, t, .12, seed); vignette(g, W, H, .7);
  g.fillStyle = '#F4EBD8'; g.font = '500 12px ui-monospace,monospace'; g.textAlign = 'left'; g.fillText('RIO DE JANEIRO · 1922', 18, 250);
  const r = rng(Math.floor(t * 24)); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); const sx = r() * W; g.moveTo(sx, 0); g.lineTo(sx + 2, H); g.stroke();
};

// 24. glitch (fatias deslocadas, separação RGB)
R.glitch = (g, t, W, H, seed) => {
  bg(g, W, H, '#0A0A0A'); const burst = (Math.floor(t * 2) % 3) === 0; const r = rng(Math.floor(t * 20) + seed);
  const drawT = (dx, c) => txt(g, 'SINAL', 240 + dx, 135, '900 90px system-ui', c);
  g.globalCompositeOperation = 'lighter'; drawT(burst ? -6 : -2, '#FF0040'); drawT(burst ? 6 : 2, '#00E5FF'); drawT(0, '#FFFFFF'); g.globalCompositeOperation = 'source-over';
  if (burst) for (let i = 0; i < 7; i++) { const y = r() * H, h = 4 + r() * 16, dx = (r() - .5) * 60; const img = g.getImageData(0, y * (g.getTransform().a || 1), W * (g.getTransform().a || 1), h * (g.getTransform().a || 1)); g.putImageData(img, dx * (g.getTransform().a || 1), y * (g.getTransform().a || 1)); }
  g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
};

// 25. VHS (cores lavadas, faixa de tracking, data)
R.vhs = (g, t, W, H, seed) => {
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#3A6EA5'); sk.addColorStop(1, '#F7B267'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2B2D42'; g.fillRect(0, 200, W, 70); g.fillStyle = '#F25F5C'; g.beginPath(); g.arc(240, 200, 50, Math.PI, 0); g.fill();
  const band = (t * 60) % (H + 40) - 20; g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, band, W, 10); const r = rng(Math.floor(t * 30) + seed); for (let i = 0; i < 60; i++) g.fillRect(r() * W, band + r() * 10, 12, 1);
  g.fillStyle = 'rgba(0,0,0,.06)'; for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
  g.fillStyle = '#fff'; g.font = '600 16px ui-monospace,monospace'; g.textAlign = 'left'; g.fillText('▶ PLAY', 18, 28); g.textAlign = 'right'; g.fillText('JUL 14 1994', W - 18, H - 16);
};

// 26. anime / cel (linhas de velocidade, sombra dura)
R.anime = (g, t, W, H, seed) => {
  bg(g, W, H, '#FFFFFF'); const r = rng(Math.floor(t * 12) + seed); g.strokeStyle = '#111'; for (let i = 0; i < 70; i++) { const a = r() * TAU, r0 = 60 + r() * 40; g.lineWidth = r() * 2 + .5; g.beginPath(); g.moveTo(240 + Math.cos(a) * r0, 135 + Math.sin(a) * r0); g.lineTo(240 + Math.cos(a) * 400, 135 + Math.sin(a) * 400); g.stroke(); }
  g.fillStyle = '#FFD1B3'; g.beginPath(); g.arc(240, 135, 56, 0, TAU); g.fill(); g.fillStyle = '#F2A98A'; g.beginPath(); g.arc(240, 135, 56, -.3, 1.6); g.lineTo(240, 135); g.fill();
  g.fillStyle = '#1F1F3D'; g.beginPath(); g.ellipse(222, 130, 9, 14, 0, 0, TAU); g.ellipse(258, 130, 9, 14, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(225, 124, 3.5, 0, TAU); g.arc(261, 124, 3.5, 0, TAU); g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.arc(240, 135, 56, 0, TAU); g.stroke();
};

// 27. quadrinhos (retícula, requadros, balão)
R.quadrinhos = (g, t, W, H) => {
  bg(g, W, H, '#FFF7E0'); const p = loop(t, 6);
  const panel = (x, y, w, h, c, k) => { if (k <= 0) return; g.save(); g.beginPath(); g.rect(x, y, w * k, h); g.clip(); g.fillStyle = c; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = y; yy < y + h; yy += 6) for (let xx = x; xx < x + w; xx += 6) { g.beginPath(); g.arc(xx, yy, 1.4, 0, TAU); g.fill(); } g.restore(); g.strokeStyle = '#111'; g.lineWidth = 3; g.strokeRect(x, y, w * k, h); };
  panel(20, 20, 200, 230, '#FFD400', ease(p * 3)); panel(230, 20, 230, 110, '#3AB0FF', ease(p * 3 - .5)); panel(230, 140, 230, 110, '#FF4B4B', ease(p * 3 - 1));
  if (p > .45) { g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(120, 80, 70, 34, 0, 0, TAU); g.fill(); g.stroke(); txt(g, 'POW!', 120, 80, '900 30px system-ui', '#111'); }
};

// 28. risografia (duas cores, desalinho de registro, textura)
R.riso = (g, t, W, H, seed) => {
  bg(g, W, H, '#F4F0E6'); const off = 3 + Math.sin(t * 2) * 1.5; g.globalCompositeOperation = 'multiply';
  g.fillStyle = '#FF48B0'; g.beginPath(); g.arc(200 + off, 135, 70, 0, TAU); g.fill(); txt(g, 'RISO', 330 + off, 140, '900 60px system-ui', '#FF48B0');
  g.fillStyle = '#0078BF'; g.beginPath(); g.arc(250, 135 - off, 70, 0, TAU); g.fill(); txt(g, 'RISO', 330, 140 - off, '900 60px system-ui', '#0078BF');
  g.globalCompositeOperation = 'source-over'; const r = rng(seed); g.fillStyle = 'rgba(244,240,230,.55)'; for (let i = 0; i < 1400; i++) g.fillRect(r() * W, r() * H, 1.3, 1.3);
};

// 29. gravura (hachuras que acompanham o volume)
R.gravura = (g, t, W, H) => {
  bg(g, W, H, '#F3EEE2'); g.strokeStyle = '#1C1A17'; g.lineWidth = 1;
  const lx = 240 + Math.cos(t) * 60, ly = 80 + Math.sin(t) * 20;
  for (let y = 60; y < 220; y += 4) { g.beginPath(); for (let x = 160; x < 320; x += 2) { const dx = x - 240, dy = y - 140, d = Math.hypot(dx, dy); if (d > 75) { g.moveTo(x, y); continue; } const shade = clamp((Math.hypot(x - lx, y - ly) - 40) / 120); const ww = 1 + shade * 2.5; g.lineWidth = ww * .6; g.lineTo(x, y + Math.sin(dx * .05) * 3); } g.stroke(); }
  g.lineWidth = 1.5; g.beginPath(); g.arc(240, 140, 75, 0, TAU); g.stroke();
  for (let x = 0; x < W; x += 5) { g.beginPath(); g.moveTo(x, 230); g.lineTo(x + 10, 270); g.stroke(); }
};

// 30. aquarela (manchas que se espalham com borda escura)
R.aquarela = (g, t, W, H, seed) => {
  bg(g, W, H, '#FBF8F1'); const r = rng(seed); const p = ease(loop(t, 7) * 1.4);
  [['rgba(58,134,255,.18)', 170, 130], ['rgba(255,93,93,.16)', 280, 150], ['rgba(255,190,11,.2)', 230, 90]].forEach(([c, x, y], i) => {
    for (let k = 0; k < 7; k++) { g.fillStyle = c; g.beginPath(); for (let a = 0; a <= 36; a++) { const an = a / 36 * TAU; const rr = (40 + k * 6) * p * (0.85 + noise(an * 2 + k, i + seed) * .25); a ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.fill(); } });
  for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(0,0,0,${r() * .03})`; g.fillRect(r() * W, r() * H, 2, 2); }
};

// 31. low poly (triângulos facetados com luz que gira)
R.low_poly = (g, t, W, H, seed) => {
  const r = rng(seed); const cols = 9, rows = 6, pts = []; for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) pts.push([x / cols * W + (x % cols ? (r() - .5) * 40 : 0), y / rows * H + (y % rows ? (r() - .5) * 30 : 0)]);
  const L = [Math.cos(t * .7), Math.sin(t * .7)];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const a = pts[y * (cols + 1) + x], b = pts[y * (cols + 1) + x + 1], c = pts[(y + 1) * (cols + 1) + x], d = pts[(y + 1) * (cols + 1) + x + 1];
    [[a, b, c], [b, d, c]].forEach((tri, k) => { const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3; const lum = .35 + .35 * ((cx / W - .5) * L[0] + (cy / H - .5) * L[1]) + (k ? .06 : 0); g.fillStyle = `hsl(${190 + cy / H * 40},55%,${clamp(lum, .1, .8) * 100}%)`; poly(g, tri); g.fill(); g.strokeStyle = g.fillStyle; g.stroke(); }); }
};

// 32. generativo (campo de fluxo de partículas)
R.generativo = (g, t, W, H, seed) => {
  bg(g, W, H, '#07090F'); const r = rng(seed); g.lineWidth = 1.1;
  for (let i = 0; i < 220; i++) { let x = r() * W, y = r() * H; g.strokeStyle = `hsla(${200 + r() * 80},80%,65%,.55)`; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 14; s++) { const a = noise(x * .01 + t * .3, y * .01) * 3 + noise(y * .012, x * .008 + t * .2) * 2; x += Math.cos(a) * 4; y += Math.sin(a) * 4; g.lineTo(x, y); } g.stroke(); }
};

// 33. suíço / grade tipográfica (hierarquia forte, alinhamento rígido)
R.suico = (g, t, W, H) => {
  bg(g, W, H, '#F2F2EE'); const p = loop(t, 6);
  g.fillStyle = '#E30613'; g.fillRect(0, 0, 150 * ease(p * 3), H);
  txt(g, 'Helvetica', 170, 60, '700 44px Helvetica,Arial,sans-serif', '#111', 'left'); g.globalAlpha = ease(p * 3 - .5);
  txt(g, 'Forma segue', 170, 120, '400 26px Helvetica,Arial,sans-serif', '#111', 'left'); txt(g, 'a função.', 170, 150, '400 26px Helvetica,Arial,sans-serif', '#111', 'left'); g.globalAlpha = 1;
  g.fillStyle = '#111'; for (let i = 0; i < 6; i++) g.fillRect(170 + i * 48, 200, 40 * ease(p * 3 - 1 - i * .1), 4);
  txt(g, '1957', 20, 250, '700 16px Helvetica,Arial,sans-serif', '#fff', 'left');
};

// 34. brutalista (tipo gigante, cortes duros, contraste máximo)
R.brutalista = (g, t, W, H) => {
  const flip = Math.floor(t * 1.5) % 2; bg(g, W, H, flip ? '#0000FF' : '#FFFFFF'); const c = flip ? '#FFFFFF' : '#000000';
  txt(g, 'NÃO', 20 - (t * 40) % 60, 120, '900 150px Arial Black,Impact,sans-serif', c, 'left');
  g.fillStyle = c; g.fillRect(0, 200, W, 16); txt(g, 'LEIA ISTO →', W - 16, 245, '700 22px ui-monospace,monospace', c, 'right');
};

// 35. demo de produto / interface (cartões, cursor, clique)
R.interface = (g, t, W, H) => {
  bg(g, W, H, '#EEF1F6'); const p = loop(t, 5);
  g.fillStyle = '#fff'; g.shadowColor = 'rgba(20,30,60,.15)'; g.shadowBlur = 20; g.beginPath(); g.roundRect(90, 40, 300, 190, 14); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#E3E8F0'; g.fillRect(110, 64, 120, 10); g.fillRect(110, 84, 200, 8);
  [0, 1, 2].forEach(i => { const k = spr(p * 3 - .4 - i * .2); g.fillStyle = i === 1 && p > .55 ? '#4F6BFF' : '#F2F4F8'; g.beginPath(); g.roundRect(110, 108 + i * 34, 260 * clamp(k), 26, 8); g.fill(); });
  const cx = 150 + eio(clamp((p - .3) * 3)) * 150, cy = 210 - eio(clamp((p - .3) * 3)) * 70; const click = p > .55 && p < .62;
  g.fillStyle = '#111'; g.save(); g.translate(cx, cy); g.scale(click ? .85 : 1, click ? .85 : 1); poly(g, [[0, 0], [0, 18], [5, 13], [9, 21], [12, 20], [8, 12], [14, 12]]); g.fill(); g.restore();
  if (click) { g.strokeStyle = 'rgba(79,107,255,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.stroke(); }
};

// 36. mapa animado (rota que se desenha, pinos)
R.mapa = (g, t, W, H) => {
  bg(g, W, H, '#DDE6D5'); g.fillStyle = '#B9D3E9'; g.beginPath(); g.moveTo(0, 190); g.bezierCurveTo(120, 160, 200, 250, 480, 210); g.lineTo(480, 270); g.lineTo(0, 270); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 30) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const p = eio(loop(t, 5) * 1.3); const path = (k) => [60 + k * 340, 170 - Math.sin(k * Math.PI) * 110]; g.strokeStyle = '#D7263D'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); for (let i = 0; i <= 60 * p; i++) { const [x, y] = path(i / 60); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
  const pin = (x, y) => { g.fillStyle = '#D7263D'; g.beginPath(); g.arc(x, y - 14, 9, Math.PI, 0); g.lineTo(x, y); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 15, 3.5, 0, TAU); g.fill(); };
  pin(60, 170); const [hx, hy] = path(p); pin(hx, hy);
};

// 37. neon (letreiro que pisca e acende)
R.neon = (g, t, W, H) => {
  bg(g, W, H, '#140A12'); g.fillStyle = '#1E1119'; for (let y = 0; y < H; y += 18) for (let x = (y / 18 % 2) * 20; x < W; x += 40) g.fillRect(x, y, 38, 16);
  const on = !(Math.floor(t * 10) % 17 === 0 || Math.floor(t * 10) % 23 === 0);
  g.shadowColor = '#FF2D95'; g.shadowBlur = on ? 22 : 0; txt(g, 'aberto', 240, 120, 'italic 700 64px "Brush Script MT",cursive', on ? '#FFD1EA' : '#5a3048');
  g.shadowColor = '#2DE2FF'; g.shadowBlur = 16; g.strokeStyle = '#B8F4FF'; g.lineWidth = 3; g.beginPath(); g.roundRect(120, 170, 240, 40, 20); g.stroke(); txt(g, '24 HORAS', 240, 191, '600 18px system-ui', '#B8F4FF'); g.shadowBlur = 0;
};

// 38. blueprint (planta técnica se desenhando, cotas)
R.blueprint = (g, t, W, H) => {
  bg(g, W, H, '#123C69'); g.strokeStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < W; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const p = eio(loop(t, 6) * 1.3); g.strokeStyle = '#E8F1FF'; g.lineWidth = 1.5; g.setLineDash([400 * p, 1000]);
  g.beginPath(); g.arc(240, 135, 60, 0, TAU); g.moveTo(140, 135); g.lineTo(340, 135); g.moveTo(240, 45); g.lineTo(240, 225); g.rect(180, 75, 120, 120); g.stroke(); g.setLineDash([]);
  if (p > .7) { g.fillStyle = '#E8F1FF'; g.font = '11px ui-monospace,monospace'; g.textAlign = 'center'; g.fillText('Ø 120', 240, 60); g.fillText('R 60', 320, 128); }
};

// 39. padrão geométrico em loop (mograph abstrato)
R.mograph = (g, t, W, H) => {
  bg(g, W, H, '#FF5E3A'); for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) { const cx = 30 + x * 52, cy = 30 + y * 52, ph = t * 2 - (x + y) * .35; g.save(); g.translate(cx, cy); g.rotate(ph); const s = 14 + Math.sin(ph) * 8; g.fillStyle = (x + y) % 2 ? '#FFE8D6' : '#2A1E5C'; (x + y) % 3 ? g.fillRect(-s, -s, s * 2, s * 2) : (g.beginPath(), g.arc(0, 0, s, 0, TAU), g.fill()); g.restore(); }
};

// 40. tela dividida (vários quadros ao mesmo tempo)
R.split = (g, t, W, H) => {
  const cols = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#8AB17D']; const p = loop(t, 4);
  for (let i = 0; i < 6; i++) { const x = (i % 3) * 160, y = Math.floor(i / 3) * 135; const k = ease(p * 4 - i * .2); g.fillStyle = cols[i]; g.fillRect(x + 2, y + 2 + (1 - k) * 135, 156, 131); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x + 80 + Math.sin(t * 2 + i) * 30, y + 67, 16, 0, TAU); g.fill(); }
};

// 41. meme / humor de internet (zoom seco, texto de impacto)
R.meme = (g, t, W, H) => {
  const f = loop(t, 2.4); const punch = f > .55; bg(g, W, H, '#6B7A8F'); g.save(); if (punch) { g.translate(240, 135); g.scale(1.6, 1.6); g.translate(-240, -135); }
  g.fillStyle = '#F2D0A4'; g.beginPath(); g.arc(240, 150, 60, 0, TAU); g.fill(); g.fillStyle = '#222'; g.fillRect(212, 138, 14, 6); g.fillRect(254, 138, 14, 6); g.fillRect(222, 176, 36, 4); g.restore();
  const imp = (s, y) => { g.font = '900 30px Impact,Arial Black,sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(s, 240, y); g.fillStyle = '#fff'; g.fillText(s, 240, y); };
  imp('QUANDO O DESPERTADOR', 34); if (punch) imp('TOCA PELA 9ª VEZ', 250);
};

// 42. caligrafia / lettering (escrita revelada no traço)
R.lettering = (g, t, W, H) => {
  bg(g, W, H, '#1D1A2F'); const p = ease(loop(t, 5) * 1.3);
  g.save(); g.beginPath(); g.rect(60, 60, 360 * p, 150); g.clip(); txt(g, 'Obrigado', 240, 135, 'italic 400 76px "Snell Roundhand","Brush Script MT",cursive', '#F6E7C1'); g.restore();
  g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(60 + 360 * p, 130 + Math.sin(p * 30) * 18, 3, 0, TAU); g.fill();
};

// 43. art déco (leque dourado, simetria)
R.art_deco = (g, t, W, H) => {
  bg(g, W, H, '#0F1A24'); g.strokeStyle = '#D4AF37'; g.lineWidth = 2; const p = ease(loop(t, 6) * 2);
  for (let i = 0; i < 13; i++) { const a = Math.PI + i / 12 * Math.PI; g.beginPath(); g.moveTo(240, 230); g.lineTo(240 + Math.cos(a) * 170 * p, 230 + Math.sin(a) * 170 * p); g.stroke(); }
  [60, 110, 160].forEach(r => { g.beginPath(); g.arc(240, 230, r * p, Math.PI, 0); g.stroke(); }); g.strokeRect(20, 20, W - 40, H - 40); g.strokeRect(28, 28, W - 56, H - 56);
  txt(g, 'GRAND', 240, 70, '600 34px Didot,"Bodoni 72",serif', '#D4AF37');
};

// 44. Y2K / cromo (bolha metálica, brilho)
R.y2k = (g, t, W, H) => {
  const b = g.createLinearGradient(0, 0, W, H); b.addColorStop(0, '#B8F2FF'); b.addColorStop(1, '#E3C8FF'); g.fillStyle = b; g.fillRect(0, 0, W, H);
  g.save(); g.translate(240, 135); g.rotate(Math.sin(t) * .1); const gr = g.createLinearGradient(0, -60, 0, 60); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(.45, '#9AA5B1'); gr.addColorStop(.5, '#3A4450'); gr.addColorStop(.7, '#C9D3DD'); gr.addColorStop(1, '#FFFFFF');
  g.fillStyle = gr; g.font = 'italic 900 74px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2000', 0, 0); g.restore();
  const sx = 120 + ((t * 120) % 300); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 3 : 12; g.lineTo(sx + Math.cos(a) * r, 80 + Math.sin(a) * r); } g.fill();
};

// 45. psicodélico (ondas de cor girando)
R.psicodelico = (g, t, W, H) => {
  const s = 6; for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { const dx = x - 240, dy = y - 135, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); const v = Math.sin(d * .06 - t * 3 + Math.sin(a * 3 + t) * 2); g.fillStyle = `hsl(${(v * 60 + t * 40 + d * .5) % 360},90%,${55 + v * 12}%)`; g.fillRect(x, y, s, s); }
};

// 46. ASCII / terminal (texto verde digitando, cursor)
R.ascii = (g, t, W, H) => {
  bg(g, W, H, '#0B0F0B'); const lines = ['> iniciar --modo=video', 'carregando quadros ........ ok', 'renderizando 450/450', '> tudo pronto_']; const chars = Math.floor(t * 18) % 140; let n = chars;
  g.font = '14px ui-monospace,Menlo,monospace'; g.textAlign = 'left'; g.fillStyle = '#39FF7A';
  lines.forEach((l, i) => { if (n <= 0) return; g.fillText(l.slice(0, n), 20, 40 + i * 24); n -= l.length; });
  const art = ['  /\\_/\\ ', ' ( o.o )', '  > ^ < ']; g.fillStyle = 'rgba(57,255,122,.6)'; art.forEach((l, i) => g.fillText(l, 330, 170 + i * 18));
  if (Math.floor(t * 2) % 2) g.fillRect(20, 150, 9, 16); g.fillStyle = 'rgba(57,255,122,.05)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
};

// 47. teatro de sombras (silhuetas recortadas contra luz quente)
R.sombras = (g, t, W, H) => {
  const gr = g.createRadialGradient(240, 120, 20, 240, 135, 300); gr.addColorStop(0, '#FFD27A'); gr.addColorStop(1, '#B34A1A'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1A0E08'; const x = 160 + Math.sin(t * .8) * 30; g.beginPath(); g.ellipse(x, 150, 34, 22, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x + 26, 140); g.lineTo(x + 58, 118 + Math.sin(t * 3) * 4); g.lineTo(x + 40, 150); g.fill();
  g.fillRect(x - 24, 165, 6, 30); g.fillRect(x + 14, 165, 6, 30);
  g.beginPath(); g.moveTo(330, 220); g.lineTo(360, 110); g.lineTo(390, 220); g.fill(); g.fillRect(0, 220, W, 50); vignette(g, W, H, .6);
};

// 48. duotone (foto em duas cores, varredura)
R.duotone = (g, t, W, H) => {
  bg(g, W, H, '#1B1464'); const p = loop(t, 6);
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) { const v = .5 + .5 * Math.sin(Math.hypot(x - 200, y - 150) * .045 - t) * Math.cos((x - y) * .01); if (v > .5) { g.fillStyle = '#FF7E67'; g.fillRect(x, y, 3, 3); } }
  g.fillStyle = '#1B1464'; g.fillRect(0, 0, W * (1 - ease(p * 2)), H); txt(g, 'CONTRASTE', 240, 230, '800 28px system-ui', '#FFF1EC');
};

// 49. Memphis (formas pop dos anos 80, zigue-zague, confete)
R.memphis = (g, t, W, H) => {
  bg(g, W, H, '#FFF4E4'); const pieces = [['z', 80, 70, '#00B3A6'], ['c', 380, 80, '#FF5EAA'], ['t', 120, 200, '#FFC700'], ['s', 330, 200, '#5B5BFF'], ['d', 240, 130, '#111']];
  pieces.forEach(([k, x, y, c], i) => { g.save(); g.translate(x + Math.sin(t + i) * 8, y + Math.cos(t * 1.3 + i) * 6); g.rotate(t * .4 * (i % 2 ? 1 : -1)); g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 6;
    if (k === 'z') { g.beginPath(); for (let j = 0; j < 6; j++) g.lineTo(-40 + j * 16, j % 2 ? -10 : 10); g.stroke(); } else if (k === 'c') { g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fill(); } else if (k === 't') { poly(g, [[0, -28], [26, 20], [-26, 20]]); g.fill(); } else if (k === 's') { g.fillRect(-22, -22, 44, 44); } else { for (let a = 0; a < 5; a++) for (let b = 0; b < 3; b++) { g.beginPath(); g.arc(-24 + a * 12, -12 + b * 12, 2.5, 0, TAU); g.fill(); } } g.restore(); });
};

// 50. mixed media (foto + rabisco por cima)
R.mixed_media = (g, t, W, H, seed) => {
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#9FB7C9'); sk.addColorStop(1, '#5C6F7F'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  g.fillStyle = '#3E4A55'; g.beginPath(); g.ellipse(240, 300, 90, 170, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(240, 110, 42, 0, TAU); g.fill(); grain(g, W, H, t, .08, seed);
  const f = Math.floor(t * 8); g.strokeStyle = '#FFE600'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const r = 62 + noise(a * 2 + f * .5, 3) * 5; i ? g.lineTo(240 + Math.cos(a) * r, 110 + Math.sin(a) * r * .95) : g.moveTo(240 + Math.cos(a) * r, 110 + Math.sin(a) * r); } g.stroke();
  g.beginPath(); g.moveTo(330 + noise(f) * 2, 60); g.lineTo(300, 90); g.moveTo(300, 90); g.lineTo(314, 88); g.moveTo(300, 90); g.lineTo(302, 76); g.stroke(); txt(g, 'ELE!', 360, 50, '800 22px "Marker Felt","Comic Sans MS",cursive', '#FFE600');
};

// 51. ilustração corporativa (personagens de membros longos, cores planas)
R.corporativo = (g, t, W, H) => {
  bg(g, W, H, '#F4F6FB'); const sw = Math.sin(t * 2) * .25;
  g.fillStyle = '#D8E0F5'; g.beginPath(); g.ellipse(240, 150, 150, 90, 0, 0, TAU); g.fill();
  g.strokeStyle = '#3D5AFE'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(230, 150); g.lineTo(230 - 30, 150 + 60); g.moveTo(250, 150); g.lineTo(250 + 30, 150 + 60); g.stroke();
  g.fillStyle = '#FF7A59'; g.beginPath(); g.roundRect(215, 80, 50, 80, 18); g.fill();
  g.strokeStyle = '#FF7A59'; g.lineWidth = 12; g.beginPath(); g.moveTo(262, 95); g.lineTo(262 + Math.cos(-.8 + sw) * 70, 95 + Math.sin(-.8 + sw) * 70); g.stroke();
  g.fillStyle = '#8D5B4C'; g.beginPath(); g.arc(240, 66, 16, 0, TAU); g.fill(); g.fillStyle = '#FFC857'; g.beginPath(); g.roundRect(300, 40 + sw * 20, 70, 44, 8); g.fill();
};

// 52. doodle / rabisco (traço à mão, lo-fi)
R.doodle = (g, t, W, H) => {
  bg(g, W, H, '#FFFDF6'); const f = Math.floor(t * 10); g.strokeStyle = '#2B2B2B'; g.lineWidth = 2.2; g.lineCap = 'round';
  const wig = (x, y) => [x + noise(f + x, y) * 1.5, y + noise(f + y, x) * 1.5];
  g.beginPath(); g.moveTo(...wig(100, 190)); g.quadraticCurveTo(...wig(150, 90), ...wig(200, 190)); g.stroke();
  wobbleCircle(g, 300, 130, 40, f / 10, 2.5, 7); g.stroke(); g.beginPath(); g.moveTo(...wig(285, 125)); g.lineTo(...wig(288, 128)); g.moveTo(...wig(312, 125)); g.lineTo(...wig(315, 128)); g.moveTo(...wig(288, 145)); g.quadraticCurveTo(300, 155, 314, 145); g.stroke();
  g.fillStyle = '#FF6F59'; for (let i = 0; i < 5; i++) { const [x, y] = wig(90 + i * 70, 230); g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  txt(g, 'oi :)', 400, 70, '700 24px "Marker Felt","Comic Sans MS",cursive', '#2B2B2B');
};

// 53. motion 2.5D (camadas de foto separadas com parallax de câmera)
R.parallax_25d = (g, t, W, H) => {
  const p = Math.sin(t * .6); const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#F7C59F'); sk.addColorStop(1, '#EF8354'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  [['#4F5D75', 150, .3, 60], ['#2D3142', 185, .7, 45], ['#1B1E2B', 220, 1.3, 30]].forEach(([c, y, d, amp]) => { g.fillStyle = c; g.beginPath(); g.moveTo(-60, H); for (let x = -60; x <= W + 60; x += 24) g.lineTo(x + p * 20 * d, y - Math.abs(Math.sin(x * .013 * d + d)) * amp); g.lineTo(W + 60, H); g.fill(); });
  g.fillStyle = '#FFF'; g.beginPath(); g.arc(360 + p * 4, 70, 18, 0, TAU); g.fill();
};

// 54. origami (dobras com faces claras e escuras)
R.origami = (g, t, W, H) => {
  bg(g, W, H, '#E7ECEF'); const fold = (Math.sin(t * 1.4) + 1) / 2; g.save(); g.translate(240, 140);
  const wing = (s) => { g.fillStyle = s > 0 ? '#E76F51' : '#C4553B'; poly(g, [[0, -10], [s * 110, -60 + fold * 70], [s * 40, 20]]); g.fill(); };
  wing(-1); wing(1); g.fillStyle = '#F4A261'; poly(g, [[0, -10], [-20, 40], [0, 60], [20, 40]]); g.fill(); g.fillStyle = '#E9C46A'; poly(g, [[0, -10], [0, 60], [20, 40]]); g.fill(); g.restore();
  g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.ellipse(240, 240, 90 - fold * 20, 8, 0, 0, TAU); g.fill();
};


R._generico = R.mograph;

// ---------- amostras adicionais (estilos da pesquisa) ----------
// 3D realista de produto (lata girando, luz de estúdio, reflexo no chão)
R.render_3d_realista = (g, t, W, H) => {
  const b = g.createRadialGradient(240, 110, 20, 240, 135, 320); b.addColorStop(0, '#3B3F46'); b.addColorStop(1, '#0C0D10'); g.fillStyle = b; g.fillRect(0, 0, W, H);
  const draw = (flip) => { g.save(); if (flip) { g.translate(0, 2 * 212); g.scale(1, -1); g.globalAlpha = .18; }
    const w = 70, top = 52, bot = 212; const ph = t * 1.2; const body = g.createLinearGradient(240 - w, 0, 240 + w, 0);
    const hl = .5 + Math.sin(ph) * .35; body.addColorStop(0, '#5A0F14'); body.addColorStop(clamp(hl - .18), '#B3202A'); body.addColorStop(clamp(hl), '#FFE3E3'); body.addColorStop(clamp(hl + .08), '#D22A35'); body.addColorStop(1, '#3A080C');
    g.fillStyle = body; g.beginPath(); g.moveTo(240 - w, top + 10); g.lineTo(240 - w, bot - 8); g.ellipse(240, bot - 8, w, 10, 0, Math.PI, 0, true); g.lineTo(240 + w, top + 10); g.ellipse(240, top + 10, w, 10, 0, 0, Math.PI, true); g.fill();
    const lid = g.createLinearGradient(240 - w, 0, 240 + w, 0); lid.addColorStop(0, '#777'); lid.addColorStop(hl, '#F4F4F4'); lid.addColorStop(1, '#555'); g.fillStyle = lid; g.beginPath(); g.ellipse(240, top + 10, w - 4, 9, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '800 20px system-ui'; g.textAlign = 'center'; g.fillText('ORIGINAL', 240 + Math.sin(ph) * 12, 138); g.restore(); };
  draw(true); draw(false); vignette(g, W, H, .5);
};
// simulação satisfatória (prensa esmagando um bloco macio)
R.satisfatoria = (g, t, W, H) => {
  bg(g, W, H, '#E8E4F4'); const p = loop(t, 3); const press = p < .5 ? eio(p * 2) : 1 - eio((p - .5) * 2); const hgt = 90 - press * 55, wid = 90 + press * 60;
  g.fillStyle = '#B9B2D6'; g.fillRect(0, 222, W, 48);
  const bl = g.createLinearGradient(0, 222 - hgt, 0, 222); bl.addColorStop(0, '#FF9EC4'); bl.addColorStop(1, '#E0578D'); g.fillStyle = bl; g.beginPath(); g.roundRect(240 - wid / 2, 222 - hgt, wid, hgt, 18 - press * 8); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(240 - wid * .2, 222 - hgt * .75, wid * .2, hgt * .12, 0, 0, TAU); g.fill();
  const py = 222 - hgt - 70; g.fillStyle = '#4B4E5C'; g.fillRect(170, py, 140, 70); g.fillStyle = '#6E7283'; g.fillRect(230, 0, 20, py); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(170, py + 62, 140, 8);
};
// live action + grafismo (silhueta "filmada" com rótulos que seguem o movimento)
R.live_action = (g, t, W, H, seed) => {
  const sk = g.createLinearGradient(0, 0, W, H); sk.addColorStop(0, '#6E8B8E'); sk.addColorStop(1, '#2F3E40'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  const x = 200 + Math.sin(t * .8) * 40; g.fillStyle = '#1D2526'; g.beginPath(); g.arc(x, 90, 26, 0, TAU); g.fill(); g.beginPath(); g.roundRect(x - 38, 118, 76, 160, 30); g.fill(); grain(g, W, H, t, .07, seed);
  const tag = (ax, ay, lx, ly, s) => { g.strokeStyle = '#FFF'; g.lineWidth = 1.5; g.beginPath(); g.arc(ax, ay, 5, 0, TAU); g.moveTo(ax, ay); g.lineTo(lx, ly); g.lineTo(lx + 90, ly); g.stroke(); txt(g, s, lx + 4, ly - 9, '600 12px system-ui', '#FFF', 'left'); };
  tag(x + 10, 85, x + 70, 50, 'FOCO: 92%'); tag(x - 20, 170, x + 80, 200, 'RITMO 1,2 s');
  g.strokeStyle = '#F2D024'; g.lineWidth = 2; const s = 1 + Math.sin(t * 4) * .05; g.strokeRect(x - 40 * s, 58 - 4 * s, 80 * s, 70 * s);
};
// xerox / grunge (alto contraste, riscos de fotocópia)
R.xerox = (g, t, W, H, seed) => {
  bg(g, W, H, '#EDEBE6'); const r = rng(Math.floor(t * 6) + seed);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = Math.sin(x * .03) * Math.cos(y * .04 + t * .5) + Math.hypot(x - 170, y - 130) / -120 + .4 + (r() - .5) * .6; if (v > .15) { g.fillStyle = '#111'; g.fillRect(x, y, 2, 2); } }
  g.fillStyle = 'rgba(17,17,17,.7)'; for (let i = 0; i < 5; i++) g.fillRect(r() * W, 0, 1 + r() * 2, H);
  g.fillStyle = '#111'; g.fillRect(270, 90, 190, 90); txt(g, 'NO FUTURE', 365, 136, '900 30px Impact,Arial Black,sans-serif', '#EDEBE6');
};
// isotype (pictogramas contáveis)
R.isotype = (g, t, W, H) => {
  bg(g, W, H, '#F5F1E8'); const p = loop(t, 5); const person = (x, y, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y - 16, 6, 0, TAU); g.fill(); g.fillRect(x - 6, y - 9, 12, 16); g.fillRect(x - 6, y + 7, 5, 11); g.fillRect(x + 1, y + 7, 5, 11); };
  const rows = [['#1B4965', 9], ['#D1495B', 5]];
  rows.forEach(([c, n], ri) => { for (let i = 0; i < n; i++) { if (p * 16 < i + ri * 3) continue; person(110 + i * 30, 100 + ri * 80, c); } txt(g, ri ? '5 em 14' : '9 em 14', 70, 100 + ri * 80, '700 14px system-ui', c, 'right'); });
  txt(g, 'cada figura = 1 milhão', 240, 250, '500 12px system-ui', '#555');
};
// linha do tempo (câmera correndo por datas)
R.timeline = (g, t, W, H) => {
  bg(g, W, H, '#10151C'); const off = (t * 50) % 160; g.strokeStyle = '#3A4655'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 150); g.lineTo(W, 150); g.stroke();
  for (let i = -1; i < 5; i++) { const x = 60 + i * 160 - off, yr = 1900 + (i + Math.floor((t * 50) / 160)) * 20; const c = Math.abs(x - 240) < 60; g.fillStyle = c ? '#F2B134' : '#6B7A8F'; g.beginPath(); g.arc(x, 150, c ? 9 : 6, 0, TAU); g.fill(); txt(g, String(yr), x, 120, `${c ? 800 : 500} ${c ? 26 : 16}px system-ui`, c ? '#F2F2F2' : '#6B7A8F'); if (c) txt(g, 'um fato marcante', x, 185, '400 13px system-ui', '#B9C3CF'); }
};
// neo-brutalismo (bordas pretas grossas, sombra dura, cores vivas)
R.neo_brutal = (g, t, W, H) => {
  bg(g, W, H, '#FFF1D6'); const p = loop(t, 4); const box = (x, y, w, h, c, s, k) => { const o = 8 - k * 4; g.fillStyle = '#111'; g.fillRect(x + o, y + o, w, h); g.fillStyle = c; g.fillRect(x + (8 - o) * 0, y, w, h); g.lineWidth = 3; g.strokeStyle = '#111'; g.strokeRect(x, y, w, h); txt(g, s, x + w / 2, y + h / 2, '800 18px system-ui', '#111'); };
  const press = p > .5 && p < .6 ? 1 : 0; box(80, 60, 150, 70, '#FF90E8', 'CLIQUE', press); box(260, 90, 140, 100, '#90F0FF', 'OK', 0); box(120, 170, 110, 55, '#FFD24D', '★ 4,9', 0);
};
// cartoon anos 30 (rubber hose: braços de mangueira, olhos de torta, P&B)
R.rubber_hose = (g, t, W, H, seed) => {
  bg(g, W, H, '#E9E4D8'); const b = Math.abs(Math.sin(t * 4)); const y = 150 - b * 20; g.strokeStyle = '#111'; g.fillStyle = '#111'; g.lineCap = 'round';
  g.lineWidth = 6; const arm = (s) => { g.beginPath(); g.moveTo(240 + s * 30, y); g.quadraticCurveTo(240 + s * 70, y - 40 - b * 20, 240 + s * 60, y - 70 + Math.sin(t * 8) * 10); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(240 + s * 60, y - 70 + Math.sin(t * 8) * 10, 9, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#111'; };
  arm(-1); arm(1); g.beginPath(); g.ellipse(240, y, 36, 42 - b * 6, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(228, y - 12, 9, 13, 0, 0, TAU); g.ellipse(252, y - 12, 9, 13, 0, 0, TAU); g.fill(); g.fillStyle = '#111'; [[228], [252]].forEach(([x]) => { g.beginPath(); g.moveTo(x, y - 12); g.arc(x, y - 12, 7, -1, 1.2); g.fill(); });
  g.lineWidth = 6; g.beginPath(); g.moveTo(225, y + 40); g.lineTo(215, 222); g.moveTo(255, y + 40); g.lineTo(265, 222); g.stroke(); grain(g, W, H, t, .08, seed); vignette(g, W, H, .6);
};
// mid-century / Saul Bass (recortes angulosos, laranja e preto)
R.mid_century = (g, t, W, H) => {
  bg(g, W, H, '#E4572E'); const p = loop(t, 5); g.fillStyle = '#111';
  const bars = [[60, .0], [130, .15], [200, .3], [270, .45]]; bars.forEach(([x, d]) => { const k = eio(p * 2.5 - d); g.save(); g.translate(x, 135); g.rotate(-.35); g.fillRect(-10, -150 * k, 22, 300 * k); g.restore(); });
  g.fillStyle = '#F4EBD0'; g.beginPath(); g.arc(360, 120, 48 * spr(p * 2.5 - .6), 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(372, 112, 16 * spr(p * 2.5 - .8), 0, TAU); g.fill();
  txt(g, 'VERTIGO', 360, 222, '700 26px Futura,"Trebuchet MS",sans-serif', '#111');
};
// construtivismo (diagonais, vermelho e preto, tipo inclinado)
R.construtivismo = (g, t, W, H) => {
  bg(g, W, H, '#EFE6D2'); const p = loop(t, 5); g.save(); g.translate(240, 135); g.rotate(-.42);
  g.fillStyle = '#C8102E'; g.fillRect(-300, -30, 600 * ease(p * 3), 60); g.fillStyle = '#111'; g.fillRect(-300, 40, 460 * ease(p * 3 - .4), 14);
  txt(g, 'AVANTE!', -40 + (1 - ease(p * 3 - .6)) * -300, 0, '900 48px Impact,Arial Black,sans-serif', '#EFE6D2'); g.restore();
  g.fillStyle = '#111'; g.beginPath(); g.arc(380, 70, 40 * spr(p * 3 - 1), 0, TAU); g.fill(); g.fillStyle = '#C8102E'; g.beginPath(); g.arc(80, 220, 26 * spr(p * 3 - 1.2), 0, TAU); g.fill();
};
// pintura animada (pinceladas que se reorganizam, óleo sobre vidro)
R.pintura = (g, t, W, H, seed) => {
  bg(g, W, H, '#1C2A3A'); const r = rng(seed); g.lineCap = 'round';
  for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H; const a = noise(x * .012 + t * .25, y * .01) * 2.5 + Math.sin(t * .3); const sky = y < 150; const hue = sky ? 205 + noise(x * .01 + t * .1) * 25 : 35 + noise(x * .02) * 15; const l = sky ? 45 + (150 - y) / 6 : 30 + r() * 15;
    g.strokeStyle = `hsl(${hue},${sky ? 55 : 60}%,${l}%)`; g.lineWidth = 3 + r() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 6); g.stroke(); }
  g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(360 + Math.sin(t * .4) * 10, 70, 20, 0, TAU); g.fill();
};
// visualizador de áudio (barras em círculo pulsando)
R.audio_viz = (g, t, W, H) => {
  bg(g, W, H, '#0D0B1E'); const n = 64; for (let i = 0; i < n; i++) { const a = i / n * TAU; const v = .3 + .7 * Math.abs(noise(i * .4 + t * 4, 2) * Math.sin(t * 6 + i * .2)); const r0 = 56, r1 = r0 + v * 60;
    g.strokeStyle = `hsl(${260 + i / n * 80},85%,65%)`; g.lineWidth = 3; g.beginPath(); g.moveTo(240 + Math.cos(a) * r0, 135 + Math.sin(a) * r0); g.lineTo(240 + Math.cos(a) * r1, 135 + Math.sin(a) * r1); g.stroke(); }
  const k = 1 + Math.abs(Math.sin(t * 6)) * .06; g.fillStyle = '#FF4FA3'; g.beginPath(); g.arc(240, 135, 44 * k, 0, TAU); g.fill();
};
// explicativo estilo Vox (recorte de jornal, marca-texto, seta vermelha)
R.vox = (g, t, W, H, seed) => {
  bg(g, W, H, '#1E1E1E'); const p = loop(t, 6); g.save(); g.translate(240, 135); g.rotate(-.03); g.fillStyle = '#EDE7DA'; g.fillRect(-170, -95, 340, 190);
  g.fillStyle = '#9A958B'; for (let i = 0; i < 9; i++) g.fillRect(-150, -70 + i * 18, 300 - (i % 3) * 40, 7);
  g.fillStyle = 'rgba(255,221,0,.75)'; g.fillRect(-152, -2, 250 * ease(p * 3 - .5), 12); g.restore();
  g.strokeStyle = '#E63946'; g.lineWidth = 4; g.lineCap = 'round'; const k = ease(p * 3 - 1.2); g.beginPath(); g.moveTo(420, 40); g.lineTo(420 - 60 * k, 40 + 70 * k); g.stroke();
  if (k > .95) { g.beginPath(); g.moveTo(360, 110); g.lineTo(362, 94); g.moveTo(360, 110); g.lineTo(374, 104); g.stroke(); }
  grain(g, W, H, t, .05, seed);
};
// quadro de investigação (fotos na cortiça ligadas por fio vermelho)
R.investigacao = (g, t, W, H, seed) => {
  bg(g, W, H, '#A67C52'); const r = rng(seed); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(60,35,15,${r() * .25})`; g.fillRect(r() * W, r() * H, 2, 2); }
  const pts = [[90, 70], [250, 60], [390, 110], [150, 190], [320, 205]]; const p = loop(t, 6);
  pts.forEach(([x, y], i) => { g.save(); g.translate(x, y); g.rotate((i - 2) * .06); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-32 + 3, -24 + 4, 64, 48); g.fillStyle = '#F4F1EA'; g.fillRect(-32, -24, 64, 48); g.fillStyle = '#7C8B94'; g.fillRect(-26, -18, 52, 30); g.restore(); });
  g.strokeStyle = '#C1121F'; g.lineWidth = 2; const links = [[0, 1], [1, 2], [0, 3], [3, 4], [1, 4]];
  links.forEach(([a, b], i) => { const k = ease(p * 5 - i * .6); if (k <= 0) return; const A = pts[a], B = pts[b]; g.beginPath(); g.moveTo(A[0], A[1] - 20); g.lineTo(A[0] + (B[0] - A[0]) * k, A[1] - 20 + (B[1] - A[1]) * k); g.stroke(); });
  pts.forEach(([x, y]) => { g.fillStyle = '#E63946'; g.beginPath(); g.arc(x, y - 20, 4, 0, TAU); g.fill(); });
};
// trailer épico (título que surge de um feixe de luz)
R.trailer = (g, t, W, H, seed) => {
  bg(g, W, H, '#050608'); const p = loop(t, 5); const k = eio(p * 2);
  const beam = g.createLinearGradient(0, 135, W, 135); beam.addColorStop(0, 'rgba(120,170,255,0)'); beam.addColorStop(.5, `rgba(200,225,255,${.8 * (1 - Math.abs(p * 2 - 1))})`); beam.addColorStop(1, 'rgba(120,170,255,0)'); g.fillStyle = beam; g.fillRect(0, 132, W, 6);
  g.save(); g.globalAlpha = k; const s = 1.15 - k * .15; g.translate(240, 135); g.scale(s, s); txt(g, 'O ÚLTIMO REINO', 0, 0, '600 38px "Trajan Pro",Georgia,serif', '#D9D2C3'); g.restore();
  g.globalAlpha = 1; txt(g, 'EM BREVE', 240, 190, '500 12px system-ui', `rgba(217,210,195,${k * .8})`); grain(g, W, H, t, .05, seed);
};
// jornal girando até a manchete (clichê de época)
R.manchete = (g, t, W, H) => {
  bg(g, W, H, '#1A1A1A'); const p = loop(t, 4); const k = eio(clamp(p * 1.6)); g.save(); g.translate(240, 135); g.rotate((1 - k) * 8); g.scale(.1 + k * .9, .1 + k * .9);
  g.fillStyle = '#F2EEE3'; g.fillRect(-170, -110, 340, 220); txt(g, 'A GAZETA', 0, -86, '900 22px "Old English Text MT",Georgia,serif', '#111'); g.fillStyle = '#111'; g.fillRect(-160, -70, 320, 2);
  txt(g, 'GUERRA ACABOU!', 0, -40, '900 30px Georgia,serif', '#111'); g.fillStyle = '#9A958B'; for (let i = 0; i < 6; i++) { g.fillRect(-160, -10 + i * 16, 150, 6); g.fillRect(10, -10 + i * 16, 150, 6); } g.restore();
};
// legendas palavra a palavra (a palavra dita acende)
R.legendas = (g, t, W, H) => {
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#4A5568'); sk.addColorStop(1, '#1A202C'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2D3748'; g.beginPath(); g.arc(240, 95, 38, 0, TAU); g.fill(); g.beginPath(); g.roundRect(170, 135, 140, 160, 50); g.fill();
  const words = ['ISSO', 'MUDA', 'TUDO']; const i = Math.floor(t * 2.5) % 3; let x = 240 - 120;
  g.font = '900 34px system-ui'; g.textBaseline = 'middle'; g.textAlign = 'left'; words.forEach((w, j) => { const ww = g.measureText(w).width; const on = j === i; g.lineWidth = 7; g.strokeStyle = '#000'; g.strokeText(w, x, 215); g.fillStyle = on ? '#FFE500' : '#FFFFFF'; if (on) { g.save(); g.translate(x + ww / 2, 215); g.scale(1.12, 1.12); g.translate(-(x + ww / 2), -215); g.strokeText(w, x, 215); g.fillText(w, x, 215); g.restore(); } else g.fillText(w, x, 215); x += ww + 14; });
};
// boneco palito
R.palito = (g, t, W, H) => {
  bg(g, W, H, '#FFFFFF'); const ph = t * 5; const x = 60 + ((t * 70) % 380), y = 150; g.strokeStyle = '#111'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y - 50, 12, 0, TAU); g.moveTo(x, y - 38); g.lineTo(x, y); g.moveTo(x, y - 28); g.lineTo(x + Math.sin(ph) * 16, y - 12); g.moveTo(x, y - 28); g.lineTo(x - Math.sin(ph) * 16, y - 12);
  g.moveTo(x, y); g.lineTo(x + Math.sin(ph) * 14, y + 34); g.moveTo(x, y); g.lineTo(x - Math.sin(ph) * 14, y + 34); g.stroke();
  g.beginPath(); g.moveTo(0, 186); g.lineTo(W, 186); g.stroke(); txt(g, '...', x + 26, y - 74, '700 20px system-ui', '#111');
};

// ---------- estilo → amostra ----------
const MAPA = {
  'vetor-chapado': 'vetor_chapado', 'quadro-a-quadro': 'quadro_a_quadro', 'animacao-de-linha': 'linha', 'isometrico': 'isometrico',
  'ilustracao-texturizada': 'riso', 'whiteboard': 'whiteboard', 'quadrinho-hq': 'quadrinhos', 'blueprint': 'blueprint',
  'tipografia-cinetica': 'tipo_cinetica', 'suico-grid': 'suico', 'lettering-manuscrito': 'lettering',
  '3d-realista': 'render_3d_realista', 'low-poly': 'low_poly', '3d-fofo': 'render_3d', 'simulacao-satisfatoria': 'satisfatoria',
  'colagem': 'colagem', 'explicativo-adesivos': 'adesivos', 'live-action-grafismo': 'live_action', 'xerox-grunge': 'xerox',
  'infografico-animado': 'dados', 'mapa-animado': 'mapa', 'isotype': 'isotype', 'linha-do-tempo': 'timeline',
  'demo-de-interface': 'interface', 'vidro-fosco-aurora': 'vidro_aurora', 'hud-cyberpunk': 'hud', 'terminal-codigo': 'ascii', 'neo-brutalismo': 'neo_brutal',
  'synthwave': 'synthwave', 'pixel-art': 'pixel', 'vhs-analogico': 'vhs', 'rubber-hose': 'rubber_hose', 'mid-century': 'mid_century', 'bauhaus': 'bauhaus',
  'y2k-frutiger': 'y2k', 'psicodelico': 'psicodelico', 'construtivismo': 'construtivismo', 'gravura': 'gravura',
  'stop-motion-objetos': 'stop_motion', 'massinha': 'massinha', 'recorte-papel': 'papel_camadas', 'rotoscopia': 'rotoscopia', 'pintura-animada': 'pintura', 'silhueta': 'sombras', 'tinta-aquarela': 'aquarela',
  'morphing': 'morph', 'liquido': 'liquido', 'particulas-generativo': 'generativo', 'loop-geometrico': 'mograph', 'visualizador-audio': 'audio_viz',
  'ken-burns-parallax': 'parallax_25d', 'arquivo-grao': 'arquivo', 'estilo-vox': 'vox', 'quadro-investigacao': 'investigacao', 'trailer-epico': 'trailer', 'manchete-jornal': 'manchete',
  'meme-edit': 'meme', 'legendas-palavra': 'legendas', 'letreiro-variedades': 'variedades', 'boneco-palito': 'palito',
};
Object.entries(MAPA).forEach(([id, k]) => { if (R[k]) R[id] = R[k]; });
