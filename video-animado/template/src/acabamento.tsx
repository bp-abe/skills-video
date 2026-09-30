import React from 'react';
import {AbsoluteFill, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {step} from './lib';
import {T} from './tema';

/** Acabamento final (fica por cima de tudo): grão animado, vinheta, flicker de luz, fade-in do início. */
export const Finish: React.FC<{grain?: number; vignette?: number; flicker?: boolean}> = ({grain = 0, vignette = 0, flicker = false}) => {
	/* Tudo desligado por padrão: grão, vinheta e flicker são escolha de estilo, não acabamento universal. */
	const frame = useCurrentFrame();
	const s = step(frame);
	return (
		<>
			{grain ? <AbsoluteFill
				style={{
					zIndex: 50,
					backgroundImage: `url(${staticFile('img/grain.png')})`,
					backgroundSize: '960px 960px',
					backgroundPosition: `${Math.floor(random(`gx${s}`) * 960)}px ${Math.floor(random(`gy${s}`) * 960)}px`,
					mixBlendMode: 'overlay',
					opacity: grain,
					pointerEvents: 'none',
				}}
			/> : null}
			{vignette ? <AbsoluteFill style={{zIndex: 51, background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(${T.shadow},${vignette}) 100%)`}} /> : null}
			{flicker ? <AbsoluteFill style={{zIndex: 52, background: `rgba(${T.shadow},${0.012 + random(`fl${s}`) * 0.025})`}} /> : null}
			{T.fadeIn ? <AbsoluteFill style={{zIndex: 53, background: T.fadeIn, opacity: interpolate(frame, [0, 8], [1, 0], {extrapolateRight: 'clamp'})}} /> : null}
		</>
	);
};
