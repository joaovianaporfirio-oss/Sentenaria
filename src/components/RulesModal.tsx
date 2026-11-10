import React from 'react';
import {
  BookOpen,
  Check,
  Crown,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  Sparkles,
  Target,
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
                Tudo o que você precisa saber para dominar o tabuleiro 9×9
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
              Sentenaria é disputado em um tabuleiro de{' '}
              <strong>9×9 (81 casas)</strong>. Em cada turno, um jogador
              posiciona um símbolo em uma casa vazia disponível.
            </p>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed mt-2">
              Uma <strong>Trinca (1 ponto)</strong> é formada quando três
              símbolos iguais do mesmo jogador ficam alinhados consecutivamente
              na <strong>horizontal, vertical ou diagonal</strong>.
            </p>
          </div>

          {/* 2. Jogadores e Região Central 3x3 */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Lock className="w-5 h-5" style={{ color: redColor }} />
              <span>2. Assimetria e Região Central 3×3</span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm font-semibold opacity-85">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  <PlayerSymbol
                    player="red"
                    symbolStyle={symbolStyle}
                    color={redColor}
                    size="sm"
                  />
                </div>
                <div>
                  <strong style={{ color: redColor }}>
                    Jogador Vermelho (1º):
                  </strong>{' '}
                  Tem a vantagem de sempre iniciar a partida, mas{' '}
                  <strong>
                    não pode colocar peças nas 9 casas centrais (3×3)
                  </strong>{' '}
                  durante toda a partida.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  <PlayerSymbol
                    player="blue"
                    symbolStyle={symbolStyle}
                    color={blueColor}
                    size="sm"
                  />
                </div>
                <div>
                  <strong style={{ color: blueColor }}>
                    Jogador Azul (2º):
                  </strong>{' '}
                  Joga em segundo, porém{' '}
                  <strong>
                    pode posicionar símbolos em qualquer casa vazia
                  </strong>
                  , inclusive no santuário central 3×3!
                </div>
              </div>
            </div>
          </div>

          {/* 3. Modo Regular vs Modo Adjacente */}
          <div
            className={`md:col-span-2 p-4 sm:p-5 rounded-2xl border-2 ${sectionCard}`}
          >
            <div className="flex items-center gap-2 font-black text-base sm:text-lg font-display mb-3">
              <Layers className="w-5 h-5" style={{ color: accentColor }} />
              <span>3. Modos de Jogo: Regular vs. Adjacente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Regular Mode Box */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="font-black text-sm flex items-center gap-1.5 mb-1.5">
                  <Target className="w-4 h-4" style={{ color: accentColor }} />
                  <span>Modo Regular (Trincas Isoladas)</span>
                </div>
                <p className="text-xs font-semibold opacity-80 leading-relaxed">
                  Assim que uma trinca é formada, suas{' '}
                  <strong>3 casas são seladas</strong> e não podem mais ser
                  reutilizadas para formar novas trincas em nenhuma direção.
                  Cada nova trinca exige <strong>3 casas inéditas</strong>.
                </p>
              </div>

              {/* Adjacent Mode Box */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="font-black text-sm flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-4 h-4" style={{ color: accentColor }} />
                  <span>Modo Adjacente (Conexão Tática)</span>
                </div>
                <p className="text-xs font-semibold opacity-80 leading-relaxed">
                  Permite utilizar <strong>1 símbolo de uma trinca já formada</strong>{' '}
                  como pivô para construir uma nova trinca! Para ser válida,{' '}
                  <strong>
                    pelo menos 2 das 3 casas devem ser inéditas
                  </strong>{' '}
                  (nunca terem participado de trincas antes).
                </p>
              </div>
            </div>
          </div>

          {/* 4. Sistema de Pontuação */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <Crown className="w-5 h-5" style={{ color: accentColor }} />
              <span>4. Modo 8 Pontos</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed">
              Cada trinca válida vale <strong>1 ponto</strong>. O primeiro
              jogador a alcançar <strong>8 pontos</strong> vence a partida
              imediatamente! Ideal para partidas dinâmicas e disputas intensas.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center gap-2 font-black text-base font-display mb-2">
              <InfinityIcon
                className="w-5 h-5"
                style={{ color: accentColor }}
              />
              <span>5. Modo Livre</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-80 leading-relaxed">
              Não há limite de pontos. A partida continua até que todas as{' '}
              <strong>81 casas estejam preenchidas</strong> ou não existam mais
              jogadas válidas para o jogador do turno. Vence quem acumular a
              maior pontuação final!
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
