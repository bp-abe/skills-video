/**
 * Tema visual DESTE vídeo — a única fonte de cor e acabamento. Todos os componentes leem daqui.
 *
 * O template vem NEUTRO (cinzas) de propósito: não é um estilo, é um placeholder.
 * Reescrever este arquivo a partir da bíblia visual do vídeo (paleta com contagem fechada).
 * Linha de estilo pedida ("igual ao vídeo X") → copiar o tema.ts daquele projeto e seguir.
 */
/* Fontes DESTE vídeo: carregar só as escolhidas na bíblia visual, por exemplo
 *   import {loadFont} from '@remotion/google-fonts/NomeDaFonte';
 *   const titulo = loadFont('normal', {weights: ['700']}).fontFamily;
 * e referenciar abaixo. O template não traz catálogo de fontes de propósito (ele virava o padrão de todo vídeo). */
export const FONTES = {titulo: 'sans-serif', texto: 'sans-serif'};

export const T = {
	nome: 'neutro (placeholder — substituir)',
	bg: '#808080', // fundo do quadro (atrás das cenas)
	surface: '#a6a6a6', // fundo padrão de cena (Sheet sem textura)
	paper: '#d9d9d9', // borda/fibra exposta de peças recortadas e do rasgo
	ink: '#1a1a1a', // texto e traço principal
	accent: '#4d4d4d', // cor de destaque 1
	accent2: '#666666', // cor de destaque 2
	highlight: '#bfbfbf', // marca-texto
	shadow: '0,0,0', // RGB das sombras projetadas (sombra quente → ex.: '38,24,10')
	fadeIn: '', // cor do fade de abertura ('' = sem fade: o 1º quadro já mostra a cena, nunca preto no feed)
};
