import React from 'react';
import {Composition} from 'remotion';
import {EDIT_TOTAL} from './edicao/Edicao';
import {FPS, TOTAL} from './lib';

// Cada modo só é carregado quando a composição é aberta: o modo edição não executa o Video.tsx (e vice-versa).
const video = () => import('./Video').then((m) => ({default: m.Video}));
const edicao = () => import('./edicao/Edicao').then((m) => ({default: m.Edicao}));

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="Video-16x9" lazyComponent={video} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
		<Composition id="Video-9x16" lazyComponent={video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
		{/* modo edição de vídeo gravado (public/edit/edl.json, gerado por scripts/edicao/cortar.py) */}
		<Composition id="Edicao-16x9" lazyComponent={edicao} durationInFrames={EDIT_TOTAL} fps={FPS} width={1920} height={1080} />
		<Composition id="Edicao-9x16" lazyComponent={edicao} durationInFrames={EDIT_TOTAL} fps={FPS} width={1080} height={1920} />
		<Composition id="Edicao-1x1" lazyComponent={edicao} durationInFrames={EDIT_TOTAL} fps={FPS} width={1080} height={1080} />
	</>
);
