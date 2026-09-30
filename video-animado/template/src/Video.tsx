/**
 * EXEMPLO NEUTRO — só demonstra sincronia e formato. Não é estilo: substituir por completo.
 * - todo tempo vem de cue()/cueEnd()/blockStart() (medido no WAV), nunca de número solto;
 * - layout por formato com pick(paisagem, retrato);
 * - cada elemento que entra tem um efeito sonoro na lista SFX;
 * - cores só de src/tema.ts.
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {blockStart, cue, cueEnd, useFmt} from './lib';
import {Finish} from './acabamento';
import {Scene, SceneStack, sfx, Sheet, Soundtrack} from './stage';
import {T} from './tema';

const T0 = (id: string) => blockStart(id) - 12;

/** Caixa que entra no frame `at`: marca onde um elemento do vídeo real entraria. */
const Marker: React.FC<{at: number; x: number; y: number; w: number; h: number; label: string}> = ({at, x, y, w, h, label}) => {
	const f = useCurrentFrame() - at;
	if (f < 0) return null;
	const p = interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: T.accent, opacity: p, transform: `scale(${0.9 + 0.1 * p})`, display: 'grid', placeItems: 'center', color: T.surface, fontFamily: 'sans-serif', fontSize: 40}}>
			{label}
		</div>
	);
};

const Block: React.FC<{id: string; from: number; to: number; n: number}> = ({id, from, to, n}) => {
	const {W, H, pick} = useFmt();
	const w = pick(360, 700), h = pick(220, 300);
	return (
		<Sheet from={from} to={to} push={0}>
			{Array.from({length: n}).map((_, i) => (
				<Marker key={i} at={cue(id, i)} label={`${id} · frase ${i}`} w={w} h={h}
					x={pick(160 + i * (w + 60), (W - w) / 2)} y={pick((H - h) / 2, 300 + i * (h + 60))} />
			))}
		</Sheet>
	);
};

const SCENES: Scene[] = [
	{el: (from, to) => <Block id="b1" from={from} to={to} n={1} />, out: 'wipe', next: T0('b2')},
	{el: (from, to) => <Block id="b2" from={from} to={to} n={4} />, out: 'wipe', next: T0('b3')},
	{el: (from, to) => <Block id="b3" from={from} to={to} n={1} />},
];

const SFX = [
	sfx(cue('b1', 0), 'click', 0.4),
	sfx(T0('b2'), 'whoosh', 0.4),
	...[0, 1, 2, 3].map((i) => sfx(cue('b2', i), 'click', 0.4)), // placeholder: trocar pela paleta sonora do conceito (sfxVar + biblioteca/sfx/INDEX.md)
	sfx(T0('b3'), 'whoosh', 0.4),
	sfx(cue('b3', 0), 'click', 0.4),
	sfx(cueEnd('b3', 0) + 4, 'chime', 0.3),
];

export const Video: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: T.bg}}>
		<SceneStack scenes={SCENES} />
		<Finish />
		<Soundtrack sfx={SFX} />
	</AbsoluteFill>
);
