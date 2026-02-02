import Head from 'next/head';
import { FormEvent, useMemo, useState } from 'react';
import { getPrefix, getSuffix, sha1Hex } from '@security-hash/shared';

import { parseHibpPayload } from '../lib/hibp';
import { classifyRisk, computeRiskScore, getCharacterSetCount } from '../lib/risk';
import zxcvbn from 'zxcvbn';

import { BreachState, CheckView } from '../components/check/CheckView';

const CHARACTER_SET_LABELS = [
  { label: 'lowercase letters (a-z)', regex: /[a-z]/ },
  { label: 'uppercase letters (A-Z)', regex: /[A-Z]/ },
  { label: 'numbers (0-9)', regex: /[0-9]/ },
  { label: 'symbols', regex: /[^A-Za-z0-9]/ },
];

const getCharacterSetUsage = (value: string) => {
  const active = CHARACTER_SET_LABELS.filter(({ regex }) => regex.test(value));
  return { count: active.length, labels: active.map(({ label }) => label) };
};

const CheckPage = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [breachState, setBreachState] = useState<BreachState | null>(null);
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const strengthResult = useMemo(() => (password ? zxcvbn(password) : null), [password]);
  const zxcvbnScore = strengthResult?.score ?? 0;
  const strengthFeedback = useMemo(() => {
    if (!password) return 'Start typing to receive strength feedback.';
    return strengthResult?.feedback.warning || 'No major weaknesses detected by zxcvbn.';
  }, [password, strengthResult]);
  const characterSetUsage = useMemo(() => getCharacterSetUsage(password), [password]);
  const characterSets = useMemo(() => getCharacterSetCount(password), [password]);
  const riskScore = useMemo(() => {
    return computeRiskScore({
      breachCount: breachState?.count ?? 0,
      zxcvbnScore,
      length: password.length,
      characterSets,
    });
  }, [breachState?.count, characterSets, password.length, zxcvbnScore]);
  const combinedRisk = useMemo(
    () => classifyRisk(riskScore, breachState?.count ?? 0),
    [breachState, riskScore],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBreachState(null);

    if (!password.trim()) {
      setError('Please enter a password to check.');
      return;
    }

    setIsWorking(true);

    try {
      const derivedHash = await sha1Hex(password);
      const derivedPrefix = getPrefix(derivedHash);
      const derivedSuffix = getSuffix(derivedHash);
      const strengthScore = strengthResult?.score ?? zxcvbn(password).score;

      const response = await fetch(`/pwned/range/${derivedPrefix}`);

      if (!response.ok) {
        throw new Error('Unable to query the breach service');
      }

      const count = await parseHibpPayload(response, derivedSuffix);
      const score = computeRiskScore({
        breachCount: count,
        zxcvbnScore: strengthScore,
        length: password.length,
        characterSets: getCharacterSetCount(password),
      });

      setBreachState({
        count,
        riskScore: score,
        risk: classifyRisk(score, count),
        hash: derivedHash,
        prefix: derivedPrefix,
      });
    } catch (err) {
      setError('The breach API is unavailable. Please try again later.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <Head>
        <title>Check | Security Hash</title>
      </Head>

      <CheckView
        password={password}
        showPassword={showPassword}
        isWorking={isWorking}
        error={error}
        breachState={breachState}
        zxcvbnScore={zxcvbnScore}
        riskScore={riskScore}
        combinedRisk={combinedRisk}
        characterSetUsage={characterSetUsage}
        strengthFeedback={strengthFeedback}
        onPasswordChange={setPassword}
        onToggleShowPassword={() => setShowPassword((current) => !current)}
        onSubmit={onSubmit}
      />
    </>
  );
};

export default CheckPage;
