import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import {
  resendVerificationEmail,
  signInWithEmailAccount,
  signInWithGoogleAccount,
  signUpWithEmailAccount,
  validateStrongPassword,
  validateUsername,
} from '../account/accountService';
import { useAuth } from '../account/AuthContext';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';
import { markLocalTermsAccepted } from './NewTermsModal';

interface AuthModalProps {
  customization: CustomizationSettings;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  customization,
  onClose,
}) => {
  const { isLoggedIn, isEmailVerified, firebaseUser, refreshVerification, logout } =
    useAuth();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const { darkMode, accentColor, redColor, blueColor } = customization;

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const cardSurface = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  const inputSurface = darkMode
    ? 'bg-[#151929] border-[#2E3654] text-slate-100 focus:border-sky-400'
    : 'bg-slate-50 border-[#DFD5C4] text-slate-800 focus:border-sky-500';

  const handleGoogleLogin = async () => {
    if (loading) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      await signInWithGoogleAccount();
      soundEngine.playTrincaFormed(1);
      onClose();
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setErrorMsg(err?.message || 'Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setInfoMsg(null);

    if (tab === 'register') {
      const uCheck = validateUsername(username);
      if (!uCheck.valid) {
        setErrorMsg(uCheck.error);
        soundEngine.playInvalidMove();
        return;
      }
      const pCheck = validateStrongPassword(password);
      if (!pCheck.valid) {
        setErrorMsg(pCheck.error);
        soundEngine.playInvalidMove();
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('Aceite os Novos Termos para criar sua conta.');
        soundEngine.playInvalidMove();
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'register') {
        await signUpWithEmailAccount({
          username,
          email,
          password,
          termsAccepted,
        });
        markLocalTermsAccepted();
        soundEngine.playTrincaFormed(1);
        setInfoMsg(
          'Conta criada! Enviamos um link de confirmação para o seu e-mail.'
        );
      } else {
        const res = await signInWithEmailAccount(email, password);
        soundEngine.playTrincaFormed(1);
        if (res.user.emailVerified) {
          onClose();
        }
      }
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setErrorMsg(err?.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (loading) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      await resendVerificationEmail();
      soundEngine.playMenuClick();
      setInfoMsg(
        'Novo e-mail de confirmação enviado! Verifique também a caixa de spam.'
      );
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setErrorMsg(err?.message || 'Não foi possível reenviar o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    if (loading) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      const ok = await refreshVerification();
      if (ok) {
        soundEngine.playTrincaFormed(1);
        onClose();
      } else {
        soundEngine.playInvalidMove();
        setErrorMsg(
          'Seu e-mail ainda não consta como confirmado. Clique no link recebido na sua caixa de entrada e tente novamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Email Verification Gate View when logged in with unverified email
  if (isLoggedIn && !isEmailVerified) {
    return (
      <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
        <div
          className={`w-full max-w-md rounded-3xl border-4 p-5 sm:p-6 my-auto shadow-2xl animate-spring-pop ${modalSurface}`}
        >
          <div className="flex items-center justify-between pb-3 border-b-2 border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow">
                <MailCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-display">
                  Confirme seu E-mail
                </h2>
                <p className="text-[11px] font-bold opacity-70">
                  Verificação obrigatória de segurança
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-xl font-black text-white border-2 border-b-4"
              style={{
                backgroundColor: accentColor,
                borderColor: 'rgba(0,0,0,0.25)',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`mt-4 p-4 rounded-2xl border-2 text-xs font-bold leading-relaxed ${cardSurface}`}>
            Enviamos um link de verificação para{' '}
            <strong className="font-mono break-all">
              {firebaseUser?.email}
            </strong>
            . Confirme seu endereço de e-mail para liberar:
            <ul className="mt-2 space-y-1 opacity-85 list-disc list-inside">
              <li>Modo <strong>Ranqueado Online</strong></li>
              <li><strong>Sistema de Amigos</strong> e pedidos por ID</li>
              <li>Edição de <strong>Perfil Público</strong> e <strong>Rank Mundial</strong></li>
            </ul>
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-500 text-xs font-extrabold flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleCheckVerified}
              className="w-full py-3 px-4 rounded-2xl font-black text-sm text-white bg-emerald-500 border-2 border-b-4 border-emerald-700 hover:brightness-105 active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Já confirmei meu e-mail</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleResendEmail}
              className={`w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs border-2 border-b-4 active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 ${
                darkMode
                  ? 'bg-[#262D47] border-[#384266] text-slate-200'
                  : 'bg-white border-[#D8CEBE] text-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reenviar e-mail de confirmação</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await logout();
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="mt-1 text-xs font-extrabold underline opacity-70 hover:opacity-100"
            >
              Sair e entrar com outra conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={`w-full max-w-md rounded-3xl border-4 p-5 sm:p-6 my-auto shadow-2xl animate-spring-pop ${modalSurface}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="auth-modal-title"
                className="text-xl font-black font-display"
              >
                Conta Sentenaria
              </h2>
              <p className="text-xs font-bold opacity-70">
                Salve pontos, emblemas, amigos e dispute o Rank Mundial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSecondary();
              onClose();
            }}
            aria-label="Fechar janela de conta"
            className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Login CTA */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className={`mt-4 w-full py-3 px-4 rounded-2xl font-black text-sm border-2 border-b-4 transition-all hover:-translate-y-0.5 active:translate-y-0.5 flex items-center justify-center gap-2.5 disabled:opacity-50 ${
            darkMode
              ? 'bg-white text-slate-900 border-slate-300'
              : 'bg-white text-slate-800 border-[#D8CEBE]'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.1 0 10 0 12s.6 3.9 1.6 5.6l3.7-2.8z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5L1.6 16.1C3.5 19.9 7.4 23 12 23z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-0.5 bg-black/10 dark:bg-white/10 rounded-full" />
          <span className="text-[11px] font-black uppercase opacity-55">
            ou com e-mail
          </span>
          <div className="flex-1 h-0.5 bg-black/10 dark:bg-white/10 rounded-full" />
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              setErrorMsg(null);
              setTab('login');
            }}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'text-white'
                : darkMode
                ? 'bg-[#222840] border-[#333C5E] text-slate-300'
                : 'bg-white border-[#E2D9C5] text-slate-700'
            }`}
            style={
              tab === 'login'
                ? { backgroundColor: blueColor, borderColor: 'rgba(0,0,0,0.25)' }
                : undefined
            }
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              setErrorMsg(null);
              setTab('register');
            }}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'register'
                ? 'text-white'
                : darkMode
                ? 'bg-[#222840] border-[#333C5E] text-slate-300'
                : 'bg-white border-[#E2D9C5] text-slate-700'
            }`}
            style={
              tab === 'register'
                ? { backgroundColor: redColor, borderColor: 'rgba(0,0,0,0.25)' }
                : undefined
            }
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Conta</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-500 text-xs font-extrabold flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider opacity-75 mb-1">
                Nome de Usuário Único
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex.: MestreTatico"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-bold border-2 outline-none ${inputSurface}`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider opacity-75 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-bold border-2 outline-none ${inputSurface}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider opacity-75 mb-1">
              Senha
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  tab === 'register'
                    ? 'Mín. 8 chars (Maiúscula, minúscula e número)'
                    : 'Sua senha'
                }
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-bold border-2 outline-none ${inputSurface}`}
              />
            </div>
          </div>

          {tab === 'register' && (
            <label className="flex items-start gap-2.5 text-xs font-bold opacity-85 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-sky-500 shrink-0"
              />
              <span>
                Concordo com os <strong>Novos Termos de Uso</strong> e as regras
                da comunidade Sentenaria.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base text-white border-2 border-b-4 transition-all hover:brightness-105 active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              backgroundColor: tab === 'login' ? blueColor : redColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : tab === 'login' ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            <span>
              {loading
                ? 'Processando...'
                : tab === 'login'
                ? 'Entrar na Conta'
                : 'Criar Conta & Verificar E-mail'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
