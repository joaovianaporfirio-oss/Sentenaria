# Sentenaria — Jogo de Estratégia em Tabuleiro 9×9

**Sentenaria** é um jogo de estratégia abstrata e tática disputado em um tabuleiro de **9×9 (81 casas)**, inspirado na clareza do *Nintendo Wii Shop Channel*, na estética artesanal de camadas de *Paper Mario* e na expressividade tátil do *Duolingo*.

---

## Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm**

### Passos para Executar em Desenvolvimento
1. Instale as dependências (caso ainda não estejam instaladas):
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra o endereço exibido no terminal (por padrão `http://localhost:5173`) no navegador.

### Executar Testes Automatizados
```bash
npm test
```

### Gerar Build de Produção
```bash
npm run build
npm run preview
```

---

## Regras e Mecânicas Implementadas

1. **Tabuleiro 9×9 (81 casas)**:
   - O **Jogador Vermelho** sempre inicia a partida.
   - O **Jogador Vermelho não pode posicionar peças na região central 3×3** (casas `D4` a `F6`, linhas e colunas de índice `3..5`).
   - O **Jogador Azul** joga em seguida e possui acesso livre a todas as casas disponíveis, incluindo a região central 3×3.
2. **Formação de Trincas**:
   - Três símbolos iguais consecutivos alinhados na **horizontal, vertical ou diagonal** formam uma trinca válida (+1 ponto).
3. **Modos de Jogo**:
   - **Modo Regular**: Uma vez que uma trinca é formada, suas 3 casas não podem ser reutilizadas para formar novas trincas (exige 3 casas inéditas por trinca).
   - **Modo Adjacente**: Permite reutilizar **1 símbolo** pertencente a uma trinca já formada como pivô para construir novas trincas adjacentes, desde que **pelo menos 2 das 3 casas utilizadas nunca tenham participado de nenhuma trinca anteriormente**.
4. **Sistemas de Pontuação**:
   - **Modo 8 Pontos**: Vence imediatamente o primeiro jogador que alcançar 8 pontos (8 trincas).
   - **Modo Livre**: Sem limite de pontos; a partida prossegue até que todas as 81 casas estejam preenchidas ou não existam mais jogadas válidas para o jogador do turno.

---

## Arquitetura do Projeto

- `src/core/types.ts` & `src/core/constants.ts`: Tipagens fortes e pré-computação das 224 linhas possíveis de trincas no tabuleiro 9×9.
- `src/core/trincaDetector.ts`: Motor centralizado e determinístico de detecção e validação de trincas para os modos Regular e Adjacente.
- `src/core/scoringSystem.ts`: Sistema de pontuação e verificação de encerramento para os modos 8 Pontos e Livre.
- `src/core/gameEngine.ts`: Máquina de estados pura e independente da interface gráfica.
- `src/ai/aiEngine.ts`: Inteligência artificial em 3 níveis (**Fácil**, **Médio** e **Difícil** com Minimax, poda Alpha-Beta, Tabela de Transposição com Hashing Zobrist, Iterative Deepening e avaliação heurística sensível ao tempo e às restrições do centro 3×3).
- `src/audio/soundEngine.ts`: Sintetizador de efeitos sonoros em tempo real via Web Audio API.
- `src/customization/themePresets.ts` & `src/settings/storageManager.ts`: Temas predefinidos, modo escuro nativo, estilos de tabuleiro/símbolos e persistência local via `localStorage`.
- `src/components/`: Componentes visuais responsivos (`MainMenu`, `GameScreen`, `BoardView`, `PlayerSymbol`, `CustomizerModal`, `SettingsModal`, `RulesModal`).
