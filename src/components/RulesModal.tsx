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
                Modo Adjacente (Conexão Tática), Roubo de Peça, 81 Casas Livres
                e Modalidades
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
          {/* 1. Conceito Básico */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
              <span>1. O Conceito de Sentenaria</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed">
              Sentenaria é um jogo de estratégia disputado entre{' '}
              <strong>P1</strong> (que sempre inicia a partida) e{' '}
              <strong>P2</strong> em um tabuleiro de{' '}
              <strong>9×9 (81 casas)</strong>. Em cada turno, um jogador
              posiciona um símbolo em uma casa vazia disponível.
            </p>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed mt-2">
              Uma <strong>Trinca (1 ponto)</strong> é formada quando três peças
              sob controle do mesmo jogador ficam alinhadas consecutivamente na{' '}
              <strong>horizontal, vertical ou diagonal</strong>.
            </p>
          </div>

          {/* 2. 81 Casas Livres */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Grid className="w-5 h-5" style={{ color: accentColor }} />
              <span>2. 81 Casas Livres</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed">
              Os dois jogadores (<strong>P1</strong> e <strong>P2</strong>)
              podem utilizar qualquer uma das <strong>81 casas</strong> do
              tabuleiro desde a primeira jogada, sem restrições relacionadas à
              região central.
            </p>
          </div>

          {/* 3. Modo Adjacente (Conexão Tática) */}
          <div
            className={`md:col-span-2 p-4 sm:p-5 rounded-2xl border-2 ${sectionCard}`}
          >
            <div className="flex items-center gap-2 font-black text-base sm:text-lg font-display mb-2">
              <Layers className="w-5 h-5" style={{ color: accentColor }} />
              <span>3. Modo Adjacente (Conexão Tática)</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed">
              É permitido reutilizar uma casa que já participou de uma trinca
              anterior como <strong>pivô</strong> para construir uma nova
              trinca. Para validar uma nova combinação,{' '}
              <strong>pelo menos duas das três casas precisam ser inéditas</strong>{' '}
              (nunca terem participado de uma trinca anterior). Combinações com
              duas ou três casas já utilizadas não pontuam.
            </p>
          </div>

          {/* 4. Roubo de Peça */}
          <div
            className={`md:col-span-2 p-4 sm:p-5 rounded-2xl border-2 ${sectionCard}`}
          >
            <div className="flex items-center gap-2 font-black text-base sm:text-lg font-display mb-3">
              <Repeat className="w-5 h-5" style={{ color: blueColor }} />
              <span>4. Roubo de Peça</span>
            </div>

            <p className="text-xs sm:text-sm font-semibold opacity-85 leading-relaxed mb-3">
              Após a primeira jogada do <strong>P1</strong>, o{' '}
              <strong>P2</strong> pode escolher diretamente no tabuleiro entre
              roubar a primeira peça ou continuar jogando normalmente:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Steal Option */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="font-black text-sm flex items-center gap-2 mb-1.5">
                  <Repeat className="w-4 h-4" style={{ color: blueColor }} />
                  <span>Roubar a primeira peça</span>
                </div>
                <p className="text-xs font-semibold opacity-80 leading-relaxed">
                  Ao clicar diretamente na primeira peça colocada pelo{' '}
                  <strong>P1</strong>, o <strong>P2</strong> rouba a peça
                  imediatamente: ela permanece na mesma casa, muda de cor e de
                  proprietário para o <strong>P2</strong>, e a vez passa na hora
                  para o <strong>P1</strong>.
                </p>
              </div>

              {/* Continue Normal Play */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="font-black text-sm flex items-center gap-2 mb-1.5">
                  <PlayerSymbol
                    player="blue"
                    symbolStyle={symbolStyle}
                    color={blueColor}
                    size="sm"
                  />
                  <span>Jogar em outra casa vazia</span>
                </div>
                <p className="text-xs font-semibold opacity-80 leading-relaxed">
                  Se o <strong>P2</strong> clicar em qualquer outra casa vazia
                  do tabuleiro, sua peça é posicionada normalmente naquela casa,
                  a oportunidade de roubo se encerra permanentemente e a primera
                  peça continua pertencendo ao <strong>P1</strong>.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs font-bold opacity-75">
              Importante: se roubar, a primeira peça muda de cor e de
              proprietário, mas a identidade dos jogadores permanece inalterada
              (<strong>P1</strong> continua sendo <strong>P1</strong> e{' '}
              <strong>P2</strong> continua sendo <strong>P2</strong>).
            </p>
          </div>

          {/* 5. Modalidade 8 Pontos */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Crown className="w-5 h-5" style={{ color: accentColor }} />
              <span>5. Modalidade: 8 Pontos</span>
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
