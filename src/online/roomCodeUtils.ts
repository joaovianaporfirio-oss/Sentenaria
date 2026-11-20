export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const MAX_CHAT_MESSAGE_LENGTH = 200;
export const MAX_PLAYER_NAME_LENGTH = 20;

// Strips ASCII/Unicode control characters and directional/zero-width spoofing characters
const UNSAFE_CONTROL_AND_BIDI_REGEX =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

export function stripUnsafeTextChars(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(UNSAFE_CONTROL_AND_BIDI_REGEX, '');
}

/**
 * Sanitizes a user-provided player nickname (strips control/bidi characters,
 * collapses excessive whitespace, and enforces max length).
 */
export function sanitizePlayerName(
  rawName: string,
  fallback = 'Jogador'
): string {
  const cleaned = stripUnsafeTextChars(rawName)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PLAYER_NAME_LENGTH);
  return cleaned || fallback;
}

export interface RoomCodeValidationResult {
  valid: boolean;
  normalizedCode: string;
  error: string | null;
}

/**
 * Generates a random 6-character alphanumeric code using only unaccented Latin letters (A-Z) and digits (0-9).
 */
export function generateRoomCode(): string {
  let code = '';
  const len = ROOM_CODE_ALPHABET.length;

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const randomBytes = new Uint32Array(ROOM_CODE_LENGTH);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[randomBytes[i] % len];
    }
    return code;
  }

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * len)];
  }
  return code;
}

/**
 * Validates and normalizes a room code according to the specification:
 * - Accepts uppercase and lowercase letters (converts to uppercase automatically).
 * - Rejects accented characters (e.g., Á, É, Í, Ó, Ú, Ã, Õ, Ç).
 * - Rejects spaces and special characters.
 * - Requires exactly 6 characters.
 */
export function validateAndNormalizeRoomCode(
  rawInput: string
): RoomCodeValidationResult {
  if (typeof rawInput !== 'string' || rawInput.length === 0) {
    return {
      valid: false,
      normalizedCode: '',
      error: 'Digite o código de 6 caracteres da sala.',
    };
  }

  if (/\s/.test(rawInput)) {
    return {
      valid: false,
      normalizedCode: '',
      error: 'O código não pode conter espaços.',
    };
  }

  // Check for accented Latin characters explicitly before general regex
  if (/[À-ÿ]/i.test(rawInput)) {
    return {
      valid: false,
      normalizedCode: '',
      error: 'O código não aceita letras acentuadas ou cedilha.',
    };
  }

  if (/[^a-zA-Z0-9]/.test(rawInput)) {
    return {
      valid: false,
      normalizedCode: '',
      error: 'O código deve conter apenas letras (A–Z) e números (0–9), sem caracteres especiais.',
    };
  }

  const normalized = rawInput.toUpperCase();

  if (normalized.length !== ROOM_CODE_LENGTH) {
    return {
      valid: false,
      normalizedCode: normalized,
      error: `O código deve possuir exatamente ${ROOM_CODE_LENGTH} caracteres (atual: ${normalized.length}).`,
    };
  }

  return {
    valid: true,
    normalizedCode: normalized,
    error: null,
  };
}

/**
 * Sanitizes and validates a chat message.
 */
export function validateChatMessage(rawText: string): {
  valid: boolean;
  sanitized: string;
  error: string | null;
} {
  const cleaned = stripUnsafeTextChars(rawText).trim();
  if (!cleaned) {
    return {
      valid: false,
      sanitized: '',
      error: 'A mensagem não pode estar vazia.',
    };
  }
  if (cleaned.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      valid: false,
      sanitized: cleaned.slice(0, MAX_CHAT_MESSAGE_LENGTH),
      error: `A mensagem excede o limite de ${MAX_CHAT_MESSAGE_LENGTH} caracteres.`,
    };
  }
  return {
    valid: true,
    sanitized: cleaned,
    error: null,
  };
}
