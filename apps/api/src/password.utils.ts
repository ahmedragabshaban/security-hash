import { BadRequestException } from '@nestjs/common';

export type HibpSuffix = {
  suffix: string;
  count: number;
};

export const validatePrefix = (prefix: string): string => {
  const normalized = prefix?.trim().toUpperCase();

  if (!normalized || normalized.length !== 5 || /[^A-F0-9]/.test(normalized)) {
    throw new BadRequestException('Prefix must be a 5-character hexadecimal string');
  }

  return normalized;
};

export const parseHibpRangeResponse = (payload: string): HibpSuffix[] =>
  payload
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [suffix, count] = line.split(':');

      return {
        suffix: suffix.trim(),
        count: Number(count),
      };
    })
    .filter((entry) => entry.suffix.length > 0 && Number.isFinite(entry.count));
