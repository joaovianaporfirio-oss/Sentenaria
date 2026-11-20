import React, { useState } from 'react';
import { Check, FileCheck2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { acceptTermsForUser } from '../account/accountService';
import { CURRENT_TERMS_VERSION } from '../account/types';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';

interface NewTermsModalProps {
  uid?: string | null;
  customization: CustomizationSettings;
  onAccepted: () => void;
}

const LOCAL_TERMS_KEY = 'sentenaria_terms_accepted_v2026_1';

export function hasAcceptedLocalTerms(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(LOCAL_TERMS_KEY) === CURRENT_TERMS_VERSION;
  } catch {
    return false;
  }
}

export function markLocalTermsAccepted(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_TERMS_KEY, CURRENT_TERMS_VERSION);
  } catch {
    // Ignore storage errors
  }
}

export const NewTermsModal: React.FC<NewTermsModalProps> = ({
  uid,
  customization,
  onAccepted,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { darkMode, accentColor, blueColor } = customization;

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const sectionCard = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  const handleConfirm = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    soundEngine.playTrincaFormed(1);
    try {
      markLocalTermsAccepted();
      if (uid) {
        await acceptTermsForUser(uid).catch(() => {});
      }
      onAccepted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-terms-title"
        className={`w-full max-w-xl rounded-3xl border-4 p-5 sm:p-6 my-auto shadow-2xl animate-spring-pop ${modalSurface}`}
      >
        <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-1"
              style={{ backgroundColor: blueColor }}
            >
              Atualização • Versão {CURRENT_TERMS_VERSION}
            </span>
            <h2
              id="new-terms-title"
              className="text-xl sm:text-2xl font-black font-display"
            >
              Novos Termos &amp; Conta de Usuário
            </h2>
          </div>
        </div>

        <div className="mt-4 space-y-3 max-h-[52vh] overflow-y-auto pr-1">
          <div className={`p-3.5 rounded-2xl border-2 ${sectionCard}`}>
            <div className="font-black text-sm font-display flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>1. Conta Verificada e Jogo Limpo (Fair Play)</span>
            </div>
            <p className="text-xs font-semibold opacity-80 leading-relaxed">
              Para disputar partidas <strong>Ranqueadas Online</strong>, subir no{' '}
              <strong>Rank Mundial</strong> e adicionar amigos, é necessário
              possuir uma conta autenticada com e-mail verificado. Qualquer
              tentativa de manipulação de pontos, uso de scripts/bots ou
              abandono intencional recorrente poderá resultar em zeramento de
              pontos ou suspensão da conta.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border-2 ${sectionCard}`}>
            <div className="font-black text-sm font-display flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 shrink-0" style={{ color: blueColor }} />
              <span>2. Conduta da Comunidade e Perfil Público</span>
            </div>
            <p className="text-xs font-semibold opacity-80 leading-relaxed">
              Mantenha respeito no chat das salas privadas, no nome de usuário,
              na bio e na foto de perfil. São proibidos conteúdos ofensivos,
              discurso de ódio, spam ou imagens impróprias.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border-2 ${sectionCard}`}>
            <div className="font-black text-sm font-display flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
              <span>3. Privacidade e Dados Armazenados</span>
            </div>
            <p className="text-xs font-semibold opacity-80 leading-relaxed">
              Armazenamos apenas o necessário para seu perfil (ID de conta,
              nome de usuário, foto otimizada, bio, emblemas, lista de amigos e
              pontuação ranqueada) no Firebase. Seu e-mail não é exibido
              publicamente no Rank Mundial.
            </p>
          </div>
        </div>

        <label
          className={`mt-4 p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${
            agreed
              ? 'border-emerald-500 bg-emerald-500/10'
              : darkMode
              ? 'border-[#333C5E] bg-[#222840]'
              : 'border-[#E2D9C5] bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              soundEngine.playMenuClick();
              setAgreed(e.target.checked);
            }}
            className="mt-0.5 w-4 h-4 rounded accent-emerald-500 shrink-0"
          />
          <span className="text-xs font-extrabold leading-relaxed">
            Li e concordo com os <strong>Novos Termos de Uso</strong> e as{' '}
            <strong>Regras de Conduta da Comunidade</strong> do Sentenaria.
          </span>
        </label>

        <button
          type="button"
          disabled={!agreed || submitting}
          onClick={handleConfirm}
          className="mt-4 w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white border-2 border-b-4 transition-all active:translate-y-0.5 disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2"
          style={{
            backgroundColor: accentColor,
            borderColor: 'rgba(0,0,0,0.25)',
          }}
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{submitting ? 'Salvando aceite...' : 'Aceitar e Continuar'}</span>
        </button>
      </div>
    </div>
  );
};
