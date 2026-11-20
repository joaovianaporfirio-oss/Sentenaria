import React from 'react';
import { User } from 'lucide-react';

interface PlayerAvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  borderColor?: string;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<PlayerAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  src,
  name = '',
  size = 'md',
  borderColor,
  className = '',
}) => {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex items-center justify-center font-black font-display shrink-0 border-2 bg-sky-500/15 text-sky-600 dark:text-sky-300 select-none ${SIZE_MAP[size]} ${className}`}
      style={borderColor ? { borderColor } : undefined}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `Avatar de ${name}` : 'Avatar do jogador'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : initial ? (
        <span>{initial}</span>
      ) : (
        <User className="w-1/2 h-1/2 opacity-70" />
      )}
    </div>
  );
};
