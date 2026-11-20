export type BadgeId =
  | 'pioneer'
  | 'first_win'
  | 'streak_3'
  | 'veteran_10'
  | 'century_100'
  | 'top_10';

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  color: string;
  shadeColor: string;
  accentLight: string;
  bgTint: string;
}

export const BADGE_CATALOG: readonly BadgeDefinition[] = [
  {
    id: 'pioneer',
    name: 'Pioneiro',
    description: 'Criou sua conta oficial na atualização Novos Termos.',
    color: '#0EA5E9',
    shadeColor: '#0369A1',
    accentLight: '#BAE6FD',
    bgTint: 'rgba(14, 165, 233, 0.14)',
  },
  {
    id: 'first_win',
    name: 'Primeira Vitória',
    description: 'Venceu sua primeira partida Ranqueada Online.',
    color: '#22C55E',
    shadeColor: '#15803D',
    accentLight: '#BBF7D0',
    bgTint: 'rgba(34, 197, 94, 0.14)',
  },
  {
    id: 'streak_3',
    name: 'Sequência de 3',
    description: 'Alcançou 3 vitórias consecutivas no modo Ranqueado.',
    color: '#F97316',
    shadeColor: '#C2410C',
    accentLight: '#FED7AA',
    bgTint: 'rgba(249, 115, 22, 0.14)',
  },
  {
    id: 'veteran_10',
    name: 'Estrategista',
    description: 'Conquistou 10 vitórias no modo Ranqueado Online.',
    color: '#8B5CF6',
    shadeColor: '#6D28D9',
    accentLight: '#DDD6FE',
    bgTint: 'rgba(139, 92, 246, 0.14)',
  },
  {
    id: 'century_100',
    name: 'Centurião',
    description: 'Atingiu 100 ou mais pontos no Rank Mundial.',
    color: '#EAB308',
    shadeColor: '#A16207',
    accentLight: '#FEF08A',
    bgTint: 'rgba(234, 179, 8, 0.16)',
  },
  {
    id: 'top_10',
    name: 'Top 10 Mundial',
    description: 'Alcançou o grupo de elite entre os 10 melhores do mundo.',
    color: '#EC4899',
    shadeColor: '#BE185D',
    accentLight: '#FBCFE8',
    bgTint: 'rgba(236, 72, 153, 0.14)',
  },
] as const;

export function getBadgeById(id: string | undefined | null): BadgeDefinition {
  const found = BADGE_CATALOG.find((b) => b.id === id);
  return found ?? BADGE_CATALOG[0];
}

export function computeUnlockedBadges(params: {
  existing: Record<string, boolean>;
  rankedWins: number;
  bestWinStreak: number;
  points: number;
  worldRank?: number | null;
}): Record<string, boolean> {
  const next: Record<string, boolean> = {
    ...params.existing,
    pioneer: true,
  };
  if (params.rankedWins >= 1) next.first_win = true;
  if (params.bestWinStreak >= 3) next.streak_3 = true;
  if (params.rankedWins >= 10) next.veteran_10 = true;
  if (params.points >= 100) next.century_100 = true;
  if (params.worldRank && params.worldRank <= 10) next.top_10 = true;
  return next;
}
