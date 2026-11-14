import React from 'react';
import {
  BookOpen,
  Check,
  Crown,
  Grid,
  Infinity as InfinityIcon,
  Layers,
  Repeat,
  Sparkles,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';
import { PlayerSymbol } from './PlayerSymbol';

interface RulesModalProps {
  customization: CustomizationSettings;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  customization,
  onClose,
}) => {
  const { darkMode, redColor, blueColor, accentColor, symbolStyle } =
    customization;

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const sectionCard = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        className={`w-full max-w-4xl rounded-3xl border-4 p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto shadow-2xl ${modalSurface}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow"
              style={{ backgroundColor: redColor }}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display">
                Manual de Regras — Sentenaria
              </h2>
              <p className="text-xs font-bold opacity-70">
                Modalidades, Modo Adjacente obrigatório, 81 casas livres e Roubo
                de Peça
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSecondary();
              onClose();
            }}
            aria-label="Fechar Regras"
            className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Conceito Básico e Liberdade nas 81 Casas */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
              <span>1. O Conceito de Sentenaria</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed">
              Sentenaria é um jogo de estratégia disputado em um tabuleiro de{' '}
              <strong>9×9 (81 casas)</strong>. Em cada turno, um jogador
              posiciona um símbolo em uma casa vazia disponível.
            </p>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed mt-2">
              Uma <strong>Trinca (1 ponto)</strong> é formada quando três peças
              sob controle do mesmo jogador ficam alinhadas consecutivamente na{' '}
              <strong>horizontal, vertical ou diagonal</strong>.
            </p>
          </div>

          {/* 2. Liberdade Total no Tabuleiro */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Grid className="w-5 h-5" style={{ color: accentColor }} />
              <span>2. Todas as 81 Casas Livres</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed">
              Não existe restrição sobre o quadrado central 3×3 nem sobre
              qualquer região do tabuleiro.
            </p>
            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed mt-2">
              Tanto o jogador{' '}
              <strong style={{ color: redColor }}>Vermelho</strong> (que sempre
              inicia a partida) quanto o jogador{' '}
              <strong style={{ color: blueColor }}>Azul</strong> podem jogar
              livremente em <strong>qualquer uma das 81 casas vazias</strong>{' '}
              desde o primeiro turno!
            </p>
          </div>

          {/* 3. Mecânica de Roubo de Peça (Pie Rule) */}
          <div
            className={`md:col-span-2 p-4 sm:p-5 rounded-2xl border-2 ${sectionCard}`}
          >
            <div className="flex items-center gap-2 font-black text-base sm:text-lg font-display mb-3">
              <Repeat className="w-5 h-5" style={{ color: blueColor }} />
              <span>3. Mecânica de Balanceamento: Roubo de Peça</span>
            </div>

            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed mb-3">
              Logo após o jogador{' '}
              <strong style={{ color: redColor }}>Vermelho</strong> realizar a{' '}
              <strong>primeira jogada da partida</strong> e antes de o jogador{' '}
              <strong style={{ color: blueColor }}>Azul</strong> fazer sua
              primeira jogada no tabuleiro, o Azul deve escolher uma entre duas
              opções:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="font-black text-sm flex items-center gap-2 mb-1.5">
                  <PlayerSymbol
                    player="blue"
                    symbolStyle={symbolStyle}
                    color={blueColor}
                    size="sm"
                  />
                  <span>Opção A — Continuar como Azul</span>
                </div>
                <p className="text-xs font-semibold opacity-80 leading-relaxed">
                  A primeira peça permanece vermelha sob controle do jogador{' '}
                  <strong style={{ color: redColor }}>Vermelho</strong>. O
                  jogador <strong style={{ color: blueColor }}>Azul</strong>{' '}
                  realiza sua primeira jogada normalmente no tabuleiro neste
                  mesmo turno.
                </p>
              </div>

              {/* Option B */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="font-black text-sm flex items-center gap-2 mb-1.5">
                  <Repeat className="w-4 h-4" style={{ color: blueColor }} />
                  <span>Opção B — Roubar a Primeira Peça</span>
                </div>
                <p className="text-xs font-semibold opacity-80 leading-relaxed">
                  A peça colocada pelo Vermelho permanece na mesma casa, mas{' '}
                  <strong>muda de vermelha para azul</strong> e passa a
                  pertencer ao jogador{' '}
                  <strong style={{ color: blueColor }}>Azul</strong> para
                  formação de trincas e pontos. O turno passa imediatamente para
                  o jogador{' '}
                  <strong style={{ color: redColor }}>Vermelho</strong>.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs font-bold opacity-75">
              Importante: o roubo ocorre no máximo uma única vez por partida e{' '}
              <strong>não troca a identidade dos jogadores</strong> (o Jogador 1
              continua sendo Vermelho e o Jogador 2 continua sendo Azul).
            </p>
          </div>

          {/* 4. Modo Adjacente Obrigatório */}
          <div
            className={`md:col-span-2 p-4 sm:p-5 rounded-2xl border-2 ${sectionCard}`}
          >
            <div className="flex items-center gap-2 font-black text-base sm:text-lg font-display mb-2">
              <Layers className="w-5 h-5" style={{ color: accentColor }} />
              <span>4. Regra Obrigatória: Modo Adjacente</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed">
              Em todas as partidas (tanto em <strong>8 Pontos</strong> quanto no{' '}
              <strong>Modo Livre</strong>), o <strong>Modo Adjacente</strong>{' '}
              está sempre ativo. Uma casa que já fez parte de uma trinca pode
              ser reutilizada como <strong>pivô</strong> para construir uma nova
              trinca, desde que{' '}
              <strong>
                pelo menos 2 das 3 casas da nova trinca sejam inéditas
              </strong>{' '}
              (nunca tenham participado de uma trinca anterior). Combinações com
              2 ou 3 casas já utilizadas não pontuam.
            </p>
          </div>

          {/* 5. Modalidade 8 Pontos */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Crown className="w-5 h-5" style={{ color: accentColor }} />
              <span>5. Modalidade: 8 Pontos (Padrão)</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed">
              Cada trinca válida corresponde a <strong>1 ponto</strong>. O
              primeiro jogador a alcançar <strong>8 pontos</strong> vence a
              partida imediatamente!
            </p>
          </div>

          {/* 6. Modalidade Modo Livre */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <InfinityIcon
                className="w-5 h-5"
                style={{ color: accentColor }}
              />
              <span>6. Modalidade: Modo Livre</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed">
              Não existe meta fixa de pontuação. A partida continua até que
              todas as <strong>81 casas estejam preenchidas</strong>, vencendo
              quem conquistar a maior pontuação final!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playMenuClick();
            onClose();
          }}
          className="mt-5 w-full py-3.5 px-6 rounded-2xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center justify-center gap-2"
          style={{
            backgroundColor: accentColor,
            borderColor: 'rgba(0,0,0,0.25)',
          }}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Entendi, Vamos Jogar!</span>
        </button>
      </div>
    </div>
  );
};
