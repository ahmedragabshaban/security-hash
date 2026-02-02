export type PolicyKey = 'normal' | 'important' | 'sensitive';

export type Policy = {
  label: string;
  minLength: number;
  includeSymbols: boolean;
  avoidAmbiguous?: boolean;
  description: string;
};

export const policies: Record<PolicyKey, Policy> = {
  normal: {
    label: 'Normal',
    minLength: 12,
    includeSymbols: false,
    description: 'Everyday logins. Uppercase, lowercase, and digits only.',
  },
  important: {
    label: 'Important',
    minLength: 16,
    includeSymbols: true,
    description: 'Financial or email accounts. Symbols required.',
  },
  sensitive: {
    label: 'Sensitive',
    minLength: 20,
    includeSymbols: true,
    avoidAmbiguous: true,
    description: 'Admin or recovery keys. Avoids ambiguous characters.',
  },
};

export const passphrasePolicies: Record<PolicyKey, { minWords: number; recommended: string }> = {
  normal: { minWords: 4, recommended: 'Four to five words is usually strong and easy to remember.' },
  important: { minWords: 5, recommended: 'Aim for five or more words for important accounts.' },
  sensitive: { minWords: 6, recommended: 'Prefer longer passphrases (six+ words) for sensitive contexts.' },
};

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";
const AMBIGUOUS = "O0oIl1|'`\"<>/\\";

const WORD_LIST = [
  'anchor',
  'bridge',
  'cobalt',
  'delta',
  'ember',
  'fable',
  'glisten',
  'harbor',
  'ion',
  'jetty',
  'keystone',
  'lumen',
  'mosaic',
  'nectar',
  'onyx',
  'prairie',
  'quartz',
  'ripple',
  'spruce',
  'tandem',
  'umber',
  'velvet',
  'wander',
  'yonder',
  'zephyr',
];

const stripAmbiguous = (charset: string, avoidAmbiguous: boolean | undefined) =>
  avoidAmbiguous
    ? charset
        .split('')
        .filter((char) => !AMBIGUOUS.includes(char))
        .join('')
    : charset;

const getPolicySets = (policyKey: PolicyKey): string[] => {
  const policy = policies[policyKey];
  const baseSets = [LOWERCASE, UPPERCASE, DIGITS];
  if (policy.includeSymbols) {
    baseSets.push(SYMBOLS);
  }

  return baseSets.map((set) => stripAmbiguous(set, policy.avoidAmbiguous));
};

const randomChar = (charset: string): string => {
  if (!charset.length) {
    throw new Error('Charset cannot be empty');
  }
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return charset[random[0] % charset.length];
};

const shuffle = (chars: string[]): string[] => {
  const result = [...chars];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = random[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const generatePassword = (policyKey: PolicyKey, requestedLength: number): string => {
  const policy = policies[policyKey];
  const length = Math.max(policy.minLength, requestedLength);
  const sets = getPolicySets(policyKey);
  const combined = sets.join('');

  const guaranteed = sets.map((set) => randomChar(set));
  const remaining = length - guaranteed.length;

  const randomPool = new Uint32Array(remaining);
  crypto.getRandomValues(randomPool);

  const password = [...guaranteed];
  for (let i = 0; i < remaining; i += 1) {
    password.push(combined[randomPool[i] % combined.length]);
  }

  return shuffle(password).join('');
};

export const generatePassphrase = (wordCount: number, minWords: number): string => {
  const count = Math.max(minWords, Math.min(wordCount, 10));
  const randomPool = new Uint32Array(count);
  crypto.getRandomValues(randomPool);

  const words = Array.from({ length: count }, (_, index) => WORD_LIST[randomPool[index] % WORD_LIST.length]);
  return words.join('-');
};

export const meetsPolicy = (value: string, policyKey: PolicyKey, requestedLength: number): boolean => {
  const policy = policies[policyKey];
  const length = Math.max(policy.minLength, requestedLength);
  if (value.length < length) return false;

  const sets = getPolicySets(policyKey);
  return sets.every((set) => value.split('').some((char) => set.includes(char)));
};

