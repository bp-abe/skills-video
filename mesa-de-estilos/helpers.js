// Amostras dos estilos: cada função desenha o quadro no tempo t (s) num canvas 480×270.
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const spr = (x) => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(10 * x); };
const loop = (t, d) => (t % d) / d;
function rng(s) { let a = s >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const noise = (x, s = 0) => Math.sin(x * 1.7 + s) * .5 + Math.sin(x * 3.1 + s * 2.3) * .3 + Math.sin(x * 7.3 + s * .7) * .2;
function bg(g, W, H, c) { g.fillStyle = c; g.fillRect(0, 0, W, H); }
function txt(g, s, x, y, font, fill, align = 'center', base = 'middle') { g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y); }
function grain(g, W, H, t, a = .06, seed = 1) { const r = rng(Math.floor(t * 24) + seed); g.fillStyle = `rgba(255,255,255,${a})`; for (let i = 0; i < 420; i++) g.fillRect(r() * W, r() * H, 1, 1); g.fillStyle = `rgba(0,0,0,${a})`; for (let i = 0; i < 420; i++) g.fillRect(r() * W, r() * H, 1, 1); }
function vignette(g, W, H, a = .5) { const v = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .65); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
function wobbleCircle(g, x, y, r, t, amp = 2, seed = 0) { g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; const rr = r + noise(a * 3 + Math.floor(t * 8) * 1.3, seed) * amp; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }

const lerp = (a, b, k) => a + (b - a) * k;
const pingpong = (t, d) => { const x = (t % (2 * d)) / d; return x < 1 ? x : 2 - x; };

// ---------- fontes (carregadas pela página e pela bancada; sempre com fallback) ----------
const F = {
  display: '"Syne", "Arial Black", sans-serif', body: '"Hanken Grotesk", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace',
  serif: '"Fraunces", Georgia, serif', didone: '"Playfair Display", "Bodoni 72", Didot, serif', cond: '"Bebas Neue", Impact, sans-serif',
  slab: '"Archivo Black", "Arial Black", sans-serif', pixel: '"Press Start 2P", ui-monospace, monospace', term: '"VT323", ui-monospace, monospace',
  hand: '"Caveat", "Marker Felt", cursive', marker: '"Permanent Marker", "Marker Felt", cursive', script: '"Pacifico", "Brush Script MT", cursive',
  grot: '"Inter Tight", "Helvetica Neue", Arial, sans-serif',
};
const font = (w, px, fam) => `${w} ${px}px ${fam}`;

// ---------- cache de texturas (desenhadas uma vez, reusadas em todo quadro) ----------
const _cache = new Map();
function cached(key, w, h, draw) { let c = _cache.get(key); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); _cache.set(key, c); } return c; }
// ruído monocromático 256×256 (base de grão e textura)
const noiseTile = (seed = 1, amp = 1) => cached(`noise${seed}_${amp}`, 256, 256, (c, w, h) => { const d = c.createImageData(w, h), r = rng(seed); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - .5) * 255 * amp; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } c.putImageData(d, 0, 0); });
// grão de filme barato: ladrilho de ruído deslocado a cada quadro, em overlay
function filmGrain(g, W, H, t, a = .12, seed = 1) { const tile = noiseTile(seed); const f = Math.floor(t * 24), r = rng(f * 13 + seed); g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'overlay'; const ox = -r() * 256, oy = -r() * 256; for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) g.drawImage(tile, x, y); g.restore(); }
// textura de papel (fibras + ruído) no tom pedido, cacheada por tom
function paper(g, W, H, tone = '#EFE8DA', seed = 3) { const c = cached(`paper${tone}${seed}`, W, H, (p, w, h) => { p.fillStyle = tone; p.fillRect(0, 0, w, h); const r = rng(seed); p.globalAlpha = .06; for (let i = 0; i < 1600; i++) { p.fillStyle = r() > .5 ? '#000' : '#fff'; p.fillRect(r() * w, r() * h, 1 + r() * 2, 1); } p.globalAlpha = .05; p.strokeStyle = '#6b5b45'; for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, a = r() * TAU, l = 4 + r() * 14; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); } const v = p.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,40,20,.14)'); p.globalAlpha = 1; p.fillStyle = v; p.fillRect(0, 0, w, h); }); g.drawImage(c, 0, 0, W, H); }
// sombra suave (usar em volta de um desenho) e sombra de contato no chão
function shadow(g, blur = 16, ox = 0, oy = 6, color = 'rgba(0,0,0,.28)') { g.shadowBlur = blur; g.shadowOffsetX = ox; g.shadowOffsetY = oy; g.shadowColor = color; }
function noShadow(g) { g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; g.shadowColor = 'transparent'; }
function contact(g, x, y, rx, ry, a = .35) { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); }
// degradês rápidos: stops = [[0,'#fff'],[1,'#000']]
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, c]) => gr.addColorStop(k, c)); return gr; }
function rad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([k, c]) => gr.addColorStop(k, c)); return gr; }
// texto com espaçamento (letterSpacing do canvas) e opções
function type(g, s, x, y, { f, fill = '#000', align = 'center', base = 'middle', track = 0, stroke, lw = 0 } = {}) { g.font = f; g.textAlign = align; g.textBaseline = base; if ('letterSpacing' in g) g.letterSpacing = `${track}px`; if (stroke) { g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); } g.fillStyle = fill; g.fillText(s, x, y); if ('letterSpacing' in g) g.letterSpacing = '0px'; }

const R = {};
