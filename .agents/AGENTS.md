# Regras de Desenvolvimento - BOSS ME-25 Editor

Este documento define os padrões permanentes de layout, design e sincronização que devem ser seguidos em qualquer alteração futura neste projeto.

---

## 1. Padrão de Cards Visuais (Layout & Estrutura)
- **Classe Única**: Todos os cards do painel principal e das barras laterais (ex: Biblioteca, Pedalboard, Backing Player) devem utilizar a estrutura da classe `.effect-card` em vez de `.sidebar-panel`.
- **Hierarquia Interna**:
  - Cabeçalho: `<div class="card-header">` contendo um título `<h3 class="effect-title">`.
  - Corpo: `<div class="card-content">` contendo o conteúdo interno.
- **Retrocompatibilidade**: Para painéis que possuam seletores JavaScript legados (ex: que buscam `.panel-title` ou `.sidebar-panel`), ambas as classes devem ser mantidas juntas no HTML (ex: `<section class="sidebar-panel effect-card">` e `<div class="card-header panel-title">`), ajustando os estilos inline para evitar conflitos de margens e bordas.

## 2. Responsividade, Proporcionalidade e Rolagem Interna (Sem Scrollbars Globais)
- **Telas Ultra-Wide**: O layout deve se ajustar perfeitamente a resoluções de até 2560x1080 (21:9) sem criar barras de rolagem horizontais ou verticais na janela principal (`body`).
- **Comportamento Flexbox**: 
  - O contêiner pai `.sidebar` ou `.app-container` deve utilizar `min-height: 0;` e `height: 100% !important;`.
  - O card de biblioteca (`#libraryCardPanel`) deve possuir `flex-grow: 1; min-height: 0; height: 100% !important;` em conjunto com `.card-content` e `.tab-content` configurados para flexbox e altura total.
  - Listas de patches ou itens (`.patch-list`, `#stemLibraryList`) devem ter `overflow-y: auto !important;` e `max-height: none !important;` para conter a rolagem apenas dentro do próprio elemento.

## 3. Integração e Sincronização da Compilação
- **Pasta de Recursos**: Sempre que um arquivo de desenvolvimento (`app.js`, `style.css`, `index.html`, `main.js`, `preload.js` ou arquivos de documentação `.md`) for modificado, ele **deve obrigatoriamente ser copiado** para a pasta de recursos do executável embutido:
  `dist\BOSS_ME25_Editor-win32-x64\resources\app\`
- Isso garante que os testes em tempo real feitos ao rodar o executável empacotado reflitam exatamente as últimas atualizações do código fonte.

## 4. Herança de Temas e Paleta de Cores
- Elementos estruturais e modais devem utilizar estritamente as variáveis CSS globais (`var(--panel-bg)`, `var(--panel-border)`, `var(--primary-color)`, `var(--text-color)`) em vez de valores absolutos de cor (como `#fff` ou cores estáticas). Isso garante compatibilidade imediata com os temas: escuro (default), claro, cyberpunk, retro e vintage tweed.
