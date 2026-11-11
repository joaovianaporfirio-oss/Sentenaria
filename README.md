# Sentenaria — Jogo de Estratégia em Tabuleiro 9×9

**Sentenaria** é um jogo de estratégia abstrata e tática disputado em um tabuleiro de **9×9 (81 casas)**, inspirado na clareza do *Nintendo Wii Shop Channel*, na estética artesanal de camadas de *Paper Mario* e na expressividade tátil do *Duolingo*.

---

## Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm**

### Passos para Executar em Desenvolvimento
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra o endereço exibido no terminal (por padrão `http://localhost:5173/Sentenaria/`) no navegador.

### Executar Testes Automatizados (Regras + IA + Integração Firebase Online)
```bash
npm test
```

### Gerar Build de Produção e Deploy para GitHub Pages
```bash
npm run build
npm run deploy
```

---

## Regras e Mecânicas Implementadas

1. **Tabuleiro 9×9 (81 casas) e Regra da Região Central 3×3**:
   - O **Jogador Vermelho** sempre inicia a partida.
   - **Restrição da 1ª jogada do Vermelho**: O Jogador Vermelho **não pode realizar sua primeira jogada** no quadrado central 3×3 (`D4` a `F6`, índices `3..5`).
   - **Acesso liberado a partir da 2ª jogada**: A partir da sua segunda jogada, o Jogador Vermelho passa a ter acesso normal à região central 3×3.
   - O **Jogador Azul** possui acesso livre a qualquer casa disponível desde a sua primeira jogada.
2. **Formação de Trincas**:
   - Três símbolos iguais consecutivos alinhados na **horizontal, vertical ou diagonal** formam uma trinca válida (+1 ponto).
3. **Modos de Jogo**:
   - **Modo Regular**: Uma vez que uma trinca é formada, suas 3 casas não podem ser reutilizadas para formar novas trincas (exige 3 casas inéditas por trinca).
   - **Modo Adjacente**: Permite reutilizar **1 símbolo** pertencente a uma trinca já formada como pivô para construir novas trincas adjacentes, desde que **pelo menos 2 das 3 casas utilizadas nunca tenham participado de nenhuma trinca anteriormente**.
4. **Sistemas de Pontuação**:
   - **Modo 8 Pontos**: Vence imediatamente o primeiro jogador que alcançar 8 pontos (8 trincas).
   - **Modo Livre**: Sem limite de pontos; a partida prossegue até que todas as 81 casas estejam preenchidas ou não existam mais jogadas válidas.
5. **Multiplayer Online (2 Jogadores em Salas Privadas via Firebase)**:
   - **Criação de Sala (Host)**: Gera um código único de 6 caracteres alfanuméricos (`A–Z`, `0–9`) e aguarda o segundo jogador na tela de espera.
   - **Entrada na Sala (Convidado)**: Aceita letras maiúsculas e minúsculas (convertidas automaticamente para maiúsculas), rejeitando acentos, espaços, caracteres especiais ou códigos inválidos, com limite estrito de 2 jogadores por sala.
   - **Sincronização e Integridade**: Utiliza transações atômicas (`runTransaction`) no **Firebase Realtime Database** para validar turnos, impedir jogadas simultâneas/fora de ordem e persistir o estado completo da partida.
   - **Presença e Reconexão**: Detecta desconexões em tempo real via `.info/connected` + `onDisconnect()` e recupera automaticamente o progresso quando o jogador retorna.
   - **Chat Privado**: Chat em tempo real exclusivo entre os 2 participantes da sala, com identificação visual de remetente, horário, rolagem automática, envio com `Enter` e limite de 200 caracteres.

---

## Configuração Externa no Console do Firebase

O projeto já está conectado ao **Firebase Realtime Database** do projeto `sentenariabase` (`https://sentenariabase-default-rtdb.firebaseio.com`).

Para aplicar as regras de segurança em produção no Console do Firebase:
1. Acesse o [Firebase Console](https://console.firebase.google.com/) e selecione o projeto **sentenariabase**.
2. No menu lateral, acesse **Realtime Database** -> aba **Regras (Rules)**.
3. Cole o conteúdo do arquivo [`database.rules.json`](./database.rules.json) presente na raiz do projeto e clique em **Publicar (Publish)**.
4. *(Opcional)* Em **Authentication** -> **Sign-in method**, você pode ativar o provedor **Anônimo (Anonymous)** para que `ensurePlayerIdentity` utilize o UID nativo do Firebase Auth (caso desativado, o sistema utiliza automaticamente um token criptográfico de sessão seguro).
