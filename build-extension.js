#!/usr/bin/env node

/**
 * MDViewer - Build Script para Extensão do Google Chrome (Manifest V3)
 * Empacota o motor markdown, bibliotecas locais, CSS, assets e componentes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const EXT_SRC = path.join(ROOT_DIR, 'src/extension');
const DIST_DIR = path.join(ROOT_DIR, 'dist/extension');

console.log('📦 Iniciando build da extensão MDViewer para Chrome...');

// 1. Limpar e recriar diretórios de saída
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'lib'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'css'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });

// 2. Empacotar o Motor Markdown com esbuild (Marked + KaTeX + Highlight.js)
console.log('⚡ Empacotando motor de Markdown (Marked, KaTeX, Highlight.js)...');
const engineSrc = path.join(ROOT_DIR, 'src/preload/markdown-engine.js');
const engineOut = path.join(DIST_DIR, 'lib/engine.bundle.js');

const esbuildCommand = `npx esbuild "${engineSrc}" ` +
  `--bundle --minify --format=iife --global-name=MDViewerEngine ` +
  `--footer:js="if (typeof window !== 'undefined') window.MDViewerEngine = MDViewerEngine; if (typeof globalThis !== 'undefined') globalThis.MDViewerEngine = MDViewerEngine;" ` +
  `--outfile="${engineOut}"`;

execSync(esbuildCommand, { stdio: 'inherit', cwd: ROOT_DIR });

// 3. Copiar e sanitizar Mermaid.js para o validador UTF-8 do Chromium
console.log('📊 Copiando e sanitizando Mermaid.js (removendo não-caracteres Unicode U+FFFF)...');
const mermaidSrc = path.join(ROOT_DIR, 'node_modules/mermaid/dist/mermaid.min.js');
const mermaidDest = path.join(DIST_DIR, 'lib/mermaid.min.js');
let mermaidContent = fs.readFileSync(mermaidSrc, 'utf8');
// O validador UTF-8 de extensões do Chromium rejeita o não-caractere Unicode U+FFFF embutido como raw bytes
mermaidContent = mermaidContent.replace(/\uFFFF/g, '\\uFFFF');
fs.writeFileSync(mermaidDest, mermaidContent, 'utf8');

console.log('🛡️  Copiando DOMPurify...');
fs.copyFileSync(path.join(ROOT_DIR, 'node_modules/dompurify/dist/purify.min.js'), path.join(DIST_DIR, 'lib/purify.min.js'));

// 4. Copiar KaTeX CSS e Fontes
console.log('🧮 Copiando estilos e fontes KaTeX...');
const katexCssSrc = path.join(ROOT_DIR, 'node_modules/katex/dist/katex.min.css');
const katexCssDest = path.join(DIST_DIR, 'lib/katex.min.css');
fs.copyFileSync(katexCssSrc, katexCssDest);

const katexFontsSrc = path.join(ROOT_DIR, 'node_modules/katex/dist/fonts');
const katexFontsDest = path.join(DIST_DIR, 'lib/fonts');
fs.cpSync(katexFontsSrc, katexFontsDest, { recursive: true });

// 5. Copiar Estilos CSS Compartilhados
console.log('🎨 Copiando temas e folhas de estilo CSS...');
const cssSrc = path.join(ROOT_DIR, 'src/renderer/css');
const cssDest = path.join(DIST_DIR, 'css');
fs.cpSync(cssSrc, cssDest, { recursive: true });

// 6. Copiar Assets (ícones e sample)
console.log('🖼️  Copiando ícones e assets...');
const assetsSrc = path.join(EXT_SRC, 'assets');
const assetsDest = path.join(DIST_DIR, 'assets');
fs.cpSync(assetsSrc, assetsDest, { recursive: true });

// 7. Copiar Módulos da Extensão (Manifest, Background, Popup, Content, Viewer)
console.log('🧩 Copiando componentes da extensão...');
fs.copyFileSync(path.join(EXT_SRC, 'manifest.json'), path.join(DIST_DIR, 'manifest.json'));
fs.copyFileSync(path.join(EXT_SRC, 'background.js'), path.join(DIST_DIR, 'background.js'));

fs.cpSync(path.join(EXT_SRC, 'popup'), path.join(DIST_DIR, 'popup'), { recursive: true });
fs.cpSync(path.join(EXT_SRC, 'content'), path.join(DIST_DIR, 'content'), { recursive: true });
fs.cpSync(path.join(EXT_SRC, 'viewer'), path.join(DIST_DIR, 'viewer'), { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'src/shared'), path.join(DIST_DIR, 'shared'), { recursive: true });

// 8. Opcional: Gerar arquivo ZIP para publicação / distribuição rápida
const zipOut = path.join(ROOT_DIR, 'dist/mdviewer-chrome-extension.zip');
try {
  console.log('🗜️  Criando pacote comprimido ZIP para instalação rápida...');
  execSync(`cd "${DIST_DIR}" && zip -r "${zipOut}" ./*`, { stdio: 'pipe' });
  console.log(`✅ Arquivo ZIP gerado: ${zipOut}`);
} catch (e) {
  // zip pode não estar disponível em todos os ambientes
}

console.log('\n🎉 Build concluído com sucesso!');
console.log(`📁 Diretório da Extensão: ${DIST_DIR}`);
console.log('\n👉 Para instalar no Google Chrome:');
console.log('1. Abra o Chrome e acesse: chrome://extensions');
console.log('2. Ative o "Modo do desenvolvedor" (chave no canto superior direito)');
console.log('3. Clique em "Carregar sem compactação"');
console.log(`4. Selecione a pasta: ${DIST_DIR}`);
console.log('5. Clique em "Detalhes" da extensão e ative "Permitir acesso aos URLs do arquivo" para abrir arquivos locais!\n');
