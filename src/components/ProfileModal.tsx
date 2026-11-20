import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  Camera,
  Check,
  Copy,
  Flame,
  Loader2,
  LogOut,
  Save,
  Search,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequestByAccountId,
  updateUserProfileFields,
} from '../account/accountService';
import { useAuth } from '../account/AuthContext';
import { BADGE_CATALOG, BadgeId, getBadgeById } from '../account/badges';
import { optimizeAvatarFile } from '../account/imageOptimizer';
import { MAX_BIO_LENGTH } from '../account/types';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';
import { BadgeEmblem, BadgePill } from './BadgeEmblem';
import { PlayerAvatar } from './PlayerAvatar';

interface ProfileModalProps {
  initialTab?: 'profile' | 'badges' | 'friends';
  customization: CustomizationSettings;
  onOpenAuth: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  initialTab = 'profile',
  customization,
  onOpenAuth,
  onClose,
}) => {
  const {
    profile,
    isEmailVerified,
    pendingFriendRequests,
    friends,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'badges' | 'friends'>(
    initialTab
  );
  const [usernameInput, setUsernameInput] = useState(profile?.username || '');
  const [bioInput, setBioInput] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const [avatarSizeKb, setAvatarSizeKb] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Friends search state
  const [friendIdQuery, setFriendIdQuery] = useState('');
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username);
      setBioInput(profile.bio);
      setAvatarPreview(profile.avatar);
    }
  }, [profile?.uid]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!profile) return null;

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

  const handleCopyAccountId = async () => {
    try {
      await navigator.clipboard.writeText(profile.accountId);
      setCopiedId(true);
      soundEngine.playMenuClick();
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedId(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFeedback(null);
    setSaving(true);
    try {
      const optimized = await optimizeAvatarFile(file);
      setAvatarPreview(optimized.dataUrl);
      setAvatarSizeKb(Math.max(1, Math.round(optimized.sizeBytes / 1024)));
      soundEngine.playMenuClick();
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: err?.message || 'Não foi possível processar a imagem.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFeedback(null);

    if (!isEmailVerified) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: 'Confirme seu e-mail antes de salvar alterações no perfil público.',
      });
      return;
    }

    setSaving(true);
    try {
      await updateUserProfileFields(profile, {
        username: usernameInput,
        bio: bioInput,
        avatar: avatarPreview,
      });
      soundEngine.playTrincaFormed(1);
      setFeedback({ type: 'ok', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: err?.message || 'Erro ao salvar perfil.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEquipBadge = async (badgeId: BadgeId) => {
    if (!profile.badges[badgeId] || saving) return;
    setFeedback(null);

    if (!isEmailVerified) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: 'Confirme seu e-mail para equipar emblemas na HUD.',
      });
      return;
    }

    setSaving(true);
    try {
      await updateUserProfileFields(profile, { equippedBadge: badgeId });
      soundEngine.playTrincaFormed(1);
      setFeedback({
        type: 'ok',
        text: `Emblema "${getBadgeById(badgeId).name}" equipado na HUD!`,
      });
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: err?.message || 'Erro ao equipar emblema.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendIdQuery.trim() || friendActionLoading) return;
    setFeedback(null);

    if (!isEmailVerified) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: 'Confirme seu e-mail para enviar pedidos de amizade.',
      });
      return;
    }

    setFriendActionLoading(true);
    try {
      const target = await sendFriendRequestByAccountId(profile, friendIdQuery);
      soundEngine.playTrincaFormed(1);
      setFriendIdQuery('');
      setFeedback({
        type: 'ok',
        text: `Pedido de amizade enviado para ${target.username} (${target.accountId})!`,
      });
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: err?.message || 'Não foi possível enviar o pedido.',
      });
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async (fromUid: string) => {
    setFeedback(null);
    setFriendActionLoading(true);
    try {
      await acceptFriendRequest(profile.uid, fromUid);
      soundEngine.playTrincaFormed(1);
      setFeedback({ type: 'ok', text: 'Novo amigo adicionado!' });
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setFeedback({
        type: 'err',
        text: err?.message || 'Erro ao aceitar pedido.',
      });
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleDeclineRequest = async (fromUid: string) => {
    setFriendActionLoading(true);
    try {
      await declineFriendRequest(profile.uid, fromUid);
      soundEngine.playMenuSecondary();
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    setFriendActionLoading(true);
    try {
      await removeFriend(profile.uid, friendUid);
      soundEngine.playMenuSecondary();
    } finally {
      setFriendActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className={`w-full max-w-2xl rounded-3xl border-4 p-5 sm:p-6 my-auto shadow-2xl animate-spring-pop ${modalSurface}`}
      >
        {/* Top Banner Header (Brawl-Stars-inspired player hero banner) */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <PlayerAvatar
              src={avatarPreview}
              name={profile.username}
              size="lg"
              borderColor={accentColor}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="profile-modal-title"
                  className="text-xl sm:text-2xl font-black font-display truncate"
                >
                  {profile.username}
                </h2>
                <BadgePill badgeId={profile.equippedBadge} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAccountId}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-black border-2 transition-all active:scale-95 ${
                    copiedId
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                      : darkMode
                      ? 'bg-[#262D47] border-[#384266] text-sky-300'
                      : 'bg-sky-50 border-sky-200 text-sky-800'
                  }`}
                >
                  <span>{profile.accountId}</span>
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span className="font-sans text-[10px]">Copiado!</span>
                    </>
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-75" />
                  )}
                </button>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  {profile.points} pts
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSecondary();
              onClose();
            }}
            aria-label="Fechar Perfil"
            className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5 shrink-0"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unverified E-mail Banner inside Profile */}
        {!isEmailVerified && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-extrabold flex flex-wrap items-center justify-between gap-2">
            <span>
              Seu e-mail ainda não foi verificado. Confirme para editar o perfil,
              adicionar amigos e jogar Ranqueado.
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs border-b-2 border-amber-700"
            >
              Verificar Agora
            </button>
          </div>
        )}

        {/* Modular Navigation Tabs */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              { id: 'profile', label: 'Perfil', icon: Camera, count: 0 },
              { id: 'badges', label: 'Emblemas', icon: Award, count: 0 },
              {
                id: 'friends',
                label: 'Amigos',
                icon: Users,
                count: pendingFriendRequests.length,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  setFeedback(null);
                  setActiveTab(t.id);
                }}
                className={`relative py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center justify-center gap-1.5 transition-all active:translate-y-0.5 ${
                  active
                    ? 'text-white'
                    : darkMode
                    ? 'bg-[#222840] border-[#333C5E] text-slate-300'
                    : 'bg-white border-[#E2D9C5] text-slate-700'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: accentColor,
                        borderColor: 'rgba(0,0,0,0.25)',
                      }
                    : undefined
                }
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black leading-none">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-extrabold flex items-center gap-2 border-2 ${
              feedback.type === 'ok'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-500 animate-shake'
            }`}
          >
            {feedback.type === 'ok' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* TAB 1: PROFILE EDITING + STATS */}
        {activeTab === 'profile' && (
          <div className="mt-4 space-y-4 animate-slide-in-right">
            {/* Ranked Stats Strip */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className={`p-3 rounded-2xl border-2 text-center ${cardSurface}`}>
                <div className="text-[10px] font-black uppercase opacity-60">
                  Pontos Ranqueados
                </div>
                <div className="text-2xl font-black font-display text-amber-500 mt-0.5">
                  {profile.points}
                </div>
              </div>
              <div className={`p-3 rounded-2xl border-2 text-center ${cardSurface}`}>
                <div className="text-[10px] font-black uppercase opacity-60">
                  Vitórias Online
                </div>
                <div
                  className="text-2xl font-black font-display mt-0.5"
                  style={{ color: blueColor }}
                >
                  {profile.rankedWins}
                </div>
              </div>
              <div className={`p-3 rounded-2xl border-2 text-center ${cardSurface}`}>
                <div className="text-[10px] font-black uppercase opacity-60 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Melhor Sequência
                </div>
                <div className="text-2xl font-black font-display text-orange-500 mt-0.5">
                  {profile.bestWinStreak}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className={`p-4 rounded-2xl border-2 space-y-3.5 ${cardSurface}`}
            >
              {/* Avatar Upload */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    src={avatarPreview}
                    name={usernameInput}
                    size="md"
                    borderColor={accentColor}
                  />
                  <div>
                    <div className="text-xs font-black">Foto de Perfil</div>
                    <div className="text-[11px] font-semibold opacity-65">
                      PNG, JPEG ou WebP — otimizada automaticamente para 256×256
                      {avatarSizeKb ? ` (${avatarSizeKb} KB)` : ' (≤ 80 KB)'}
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={!isEmailVerified || saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl font-black text-xs text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center gap-1.5 disabled:opacity-45"
                  style={{
                    backgroundColor: blueColor,
                    borderColor: 'rgba(0,0,0,0.25)',
                  }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Enviar Foto</span>
                </button>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider opacity-70 mb-1">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  maxLength={20}
                  disabled={!isEmailVerified}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold border-2 outline-none disabled:opacity-60 ${inputSurface}`}
                />
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                    Sobre (Bio)
                  </label>
                  <span className="text-[10px] font-mono font-bold opacity-55">
                    {bioInput.length}/{MAX_BIO_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={MAX_BIO_LENGTH}
                  disabled={!isEmailVerified}
                  value={bioInput}
                  onChange={(e) =>
                    setBioInput(e.target.value.slice(0, MAX_BIO_LENGTH))
                  }
                  placeholder="Conte um pouco sobre seu estilo de jogo em Sentenaria..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 outline-none resize-none disabled:opacity-60 ${inputSurface}`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    soundEngine.playMenuSecondary();
                    await logout();
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl font-extrabold text-xs text-red-500 border-2 border-red-500/35 hover:bg-red-500/10 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>

                <button
                  type="submit"
                  disabled={!isEmailVerified || saving}
                  className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white border-2 border-b-4 transition-all hover:brightness-105 active:translate-y-0.5 flex items-center gap-2 disabled:opacity-45"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: 'rgba(0,0,0,0.25)',
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Salvar Perfil</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: BADGES (Wakfu + Duolingo Vector Medallions — Zero Emojis) */}
        {activeTab === 'badges' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1 animate-slide-in-right">
            {BADGE_CATALOG.map((badge) => {
              const unlocked = Boolean(profile.badges[badge.id]);
              const isEquipped = profile.equippedBadge === badge.id;
              return (
                <div
                  key={badge.id}
                  className={`group p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5 ${cardSurface} ${
                    unlocked ? '' : 'opacity-65'
                  }`}
                  style={
                    isEquipped
                      ? {
                          borderColor: badge.color,
                          backgroundColor: badge.bgTint,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BadgeEmblem
                      badgeId={badge.id}
                      size="lg"
                      locked={!unlocked}
                    />
                    <div className="min-w-0">
                      <div className="font-black text-sm font-display truncate">
                        {badge.name}
                      </div>
                      <p className="text-[11px] font-semibold opacity-75 leading-snug">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {unlocked ? (
                    <button
                      type="button"
                      disabled={isEquipped || saving || !isEmailVerified}
                      onClick={() => handleEquipBadge(badge.id)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] border-2 border-b-4 shrink-0 transition-all active:translate-y-0.5 active:border-b-2 ${
                        isEquipped
                          ? 'bg-emerald-500 text-white border-emerald-700'
                          : 'text-white hover:brightness-105'
                      }`}
                      style={
                        !isEquipped
                          ? {
                              backgroundColor: badge.color,
                              borderColor: 'rgba(0,0,0,0.25)',
                            }
                          : undefined
                      }
                    >
                      {isEquipped ? 'Equipado' : 'Equipar'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-black uppercase opacity-55 shrink-0">
                      Bloqueado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: FRIENDS SYSTEM */}
        {activeTab === 'friends' && (
          <div className="mt-4 space-y-4 max-h-[58vh] overflow-y-auto pr-1 animate-slide-in-right">
            {/* Add Friend by Account ID */}
            <form
              onSubmit={handleSendFriendRequest}
              className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row gap-2 ${cardSurface}`}
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={friendIdQuery}
                  onChange={(e) => setFriendIdQuery(e.target.value.toUpperCase())}
                  placeholder="Buscar por ID de Conta (ex.: #SNT-4829)"
                  maxLength={12}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold border-2 outline-none ${inputSurface}`}
                />
              </div>
              <button
                type="submit"
                disabled={
                  !friendIdQuery.trim() || friendActionLoading || !isEmailVerified
                }
                className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-45 shrink-0"
                style={{
                  backgroundColor: accentColor,
                  borderColor: 'rgba(0,0,0,0.25)',
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Enviar Pedido</span>
              </button>
            </form>

            {/* Incoming Friend Requests */}
            {pendingFriendRequests.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider opacity-70">
                  Pedidos Recebidos ({pendingFriendRequests.length})
                </div>
                {pendingFriendRequests.map((req) => (
                  <div
                    key={req.fromUid}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 ${cardSurface}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PlayerAvatar
                        src={req.fromAvatar}
                        name={req.fromUsername}
                        size="sm"
                        borderColor={blueColor}
                      />
                      <div className="min-w-0">
                        <div className="font-black text-xs sm:text-sm truncate">
                          {req.fromUsername}
                        </div>
                        <div className="text-[11px] font-bold opacity-70 flex items-center gap-2">
                          <span className="font-mono">{req.fromAccountId}</span>
                          <span>• {req.fromPoints} pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={friendActionLoading}
                        onClick={() => handleAcceptRequest(req.fromUid)}
                        className="px-3 py-1.5 rounded-xl font-black text-xs text-white bg-emerald-500 border-b-2 border-emerald-700"
                      >
                        Aceitar
                      </button>
                      <button
                        type="button"
                        disabled={friendActionLoading}
                        onClick={() => handleDeclineRequest(req.fromUid)}
                        className="px-2.5 py-1.5 rounded-xl font-extrabold text-xs bg-red-500/15 text-red-500 border border-red-500/30"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List with Live Online/Offline Presence */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider opacity-70">
                Meus Amigos ({friends.length})
              </div>

              {friends.length === 0 ? (
                <div
                  className={`p-6 rounded-2xl border-2 text-center text-xs font-bold opacity-65 ${cardSurface}`}
                >
                  Você ainda não adicionou amigos. Compartilhe seu ID{' '}
                  <strong className="font-mono">{profile.accountId}</strong> ou
                  busque o ID de um amigo acima!
                </div>
              ) : (
                friends.map((friend) => {
                  return (
                    <div
                      key={friend.uid}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 ${cardSurface}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <PlayerAvatar
                            src={friend.avatar}
                            name={friend.username}
                            size="sm"
                            borderColor={friend.online ? '#10B981' : undefined}
                          />
                          <span
                            title={friend.online ? 'Online' : 'Offline'}
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#222840] ${
                              friend.online ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs sm:text-sm truncate">
                              {friend.username}
                            </span>
                            <BadgeEmblem
                              badgeId={friend.equippedBadge}
                              size="xs"
                              className="!w-4 !h-4"
                            />
                          </div>
                          <div className="text-[11px] font-bold opacity-70 flex items-center gap-2">
                            <span
                              className={
                                friend.online
                                  ? 'text-emerald-500 font-black'
                                  : 'opacity-65'
                              }
                            >
                              {friend.online ? 'Online' : 'Offline'}
                            </span>
                            <span>•</span>
                            <span className="text-amber-500 font-black">
                              {friend.points} pts
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={friendActionLoading}
                        onClick={() => handleRemoveFriend(friend.uid)}
                        title="Remover amigo"
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/15 transition-colors shrink-0"
                        style={{ color: redColor }}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
