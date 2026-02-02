export type RiskLevel = 'Unsafe' | 'Risky' | 'Safe-ish';

const CHARACTER_SETS = [/([a-z])/, /([A-Z])/, /([0-9])/, /([^A-Za-z0-9])/];

export const getCharacterSetCount = (value: string): number =>
  CHARACTER_SETS.reduce((total, regex) => total + (regex.test(value) ? 1 : 0), 0);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const computeRiskScore = (input: {
  breachCount: number;
  zxcvbnScore: number;
  length: number;
  characterSets: number;
}): number => {
  if (input.breachCount > 0) return 100;

  const zxcvbnPenalty = (4 - clamp(input.zxcvbnScore, 0, 4)) * 15; // 0..60
  const lengthPenalty = clamp(12 - input.length, 0, 12) * 2; // 0..24
  const varietyPenalty = (4 - clamp(input.characterSets, 0, 4)) * 4; // 0..16

  return clamp(Math.round(zxcvbnPenalty + lengthPenalty + varietyPenalty), 0, 99);
};

export const classifyRisk = (riskScore: number, breachCount: number): RiskLevel => {
  if (breachCount > 0) return 'Unsafe';
  if (riskScore >= 35) return 'Unsafe';
  if (riskScore >= 20) return 'Risky';
  return 'Safe-ish';
};
