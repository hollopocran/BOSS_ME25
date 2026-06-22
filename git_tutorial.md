# Guia Prático de Git & GitHub Desktop (BOSS ME-25 Editor)

Este guia serve como um lembrete rápido de como sincronizar o projeto **BOSS ME-25 Editor** entre computadores usando o Git e o GitHub Desktop, sem precisar de pendrive.

---

## 💻 1. Primeira Configuração no Novo Computador

Se você está em um novo computador e quer baixar o projeto pela primeira vez:

1. Baixe e instale o [GitHub Desktop](https://desktop.github.com/).
2. Abra o aplicativo e faça login com sua conta do GitHub.
3. No menu superior, clique em **File** ➡️ **Clone repository...** (ou use o atalho `Ctrl + Shift + O`).
4. Selecione a aba **GitHub.com**.
5. Procures na lista por **`hollopocran/BOSS_ME25`**.
6. Em **Local path** (caminho local), escolha a pasta onde quer que o projeto seja salvo (ex: `C:\Dev\BOSS_ME25`).
7. Clique em **Clone**.

*Pronto! Todo o projeto (código, interface e presets suportados) será baixado para este computador.*

---

## 🚀 2. Como Enviar Alterações (Push)

Sempre que você terminar de programar ou alterar arquivos no computador atual e quiser salvar essas alterações na nuvem:

1. Abra o **GitHub Desktop**.
2. Na coluna esquerda, em **Changes**, você verá todos os arquivos que você modificou ou adicionou.
3. No canto inferior esquerdo, no campo **Summary (required)**, escreva uma frase curta resumindo o que você mudou.
   * *Exemplo: "Ajuste na interface do painel" ou "Correção no botão de presets"*.
4. Clique no botão azul **Commit to main**.
5. No topo da tela, clique no botão **Push origin** para enviar as alterações para o GitHub.

---

## 📥 3. Como Baixar Alterações no Outro Computador (Pull)

Quando você for trabalhar no outro computador e quiser trazer as alterações mais recentes que você enviou:

1. Abra o **GitHub Desktop**.
2. No menu do topo, clique em **Fetch origin** (Buscar do servidor).
3. Se houver novas atualizações, o botão mudará para **Pull origin**. Clique nele.
4. O GitHub Desktop atualizará todos os arquivos da sua pasta local de forma automática.

---

## ⚠️ Observações Importantes (Arquivos Grandes)

Para evitar erros de limite de tamanho e lentidão ao enviar o projeto para o GitHub:
* O arquivo `.gitignore` foi configurado para **ignorar automaticamente** a pasta de áudio `BT/` (backing tracks) e os binários compilados das pastas `build/` e `engine/`.
* Se você adicionar novas backing tracks ou gerar novos executáveis pesados, eles ficarão salvos apenas localmente em sua máquina, o que é o comportamento esperado. O GitHub guardará apenas o código-fonte leve e os presets principais.
