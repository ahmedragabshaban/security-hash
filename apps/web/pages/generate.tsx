import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPrefix, getSuffix, sha1Hex } from '@security-hash/shared';

import { parseHibpPayload } from '../lib/hibp';
import {
  generatePassphrase,
  generatePassword,
  meetsPolicy,
  passphrasePolicies,
  policies,
  PolicyKey,
} from '../lib/generator';
import { BreachStatus, GenerateView } from '../components/generate/GenerateView';

const GeneratePage = () => {
  const MAX_BREACH_RETRIES = 5;
  const MAX_FETCH_RETRIES = 2;

  const [context, setContext] = useState<PolicyKey>('normal');
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [length, setLength] = useState<number>(policies.normal.minLength);
  const [wordCount, setWordCount] = useState<number>(passphrasePolicies.normal.minWords);
  const [output, setOutput] = useState('');
  const [copyState, setCopyState] = useState('');
  const [error, setError] = useState('');
  const [breachStatus, setBreachStatus] = useState<BreachStatus>(null);

  const policy = useMemo(() => policies[context], [context]);
  const minPassphraseWords = useMemo(() => passphrasePolicies[context].minWords, [context]);
  const passphraseHint = useMemo(() => passphrasePolicies[context].recommended, [context]);
  const contextOptions = (Object.keys(policies) as PolicyKey[]).map((key) => ({ key, label: policies[key].label }));
  const policySatisfied = useMemo(
    () => (mode === 'password' ? meetsPolicy(output, context, length) : output.split('-').length >= wordCount),
    [context, length, mode, output, wordCount],
  );

  useEffect(() => {
    setLength((current) => Math.max(current, policy.minLength));
  }, [policy.minLength]);

  useEffect(() => {
    setWordCount((current) => Math.max(current, minPassphraseWords));
  }, [minPassphraseWords]);

  const checkAgainstBreaches = useCallback(async (candidate: string): Promise<number> => {
    const derivedHash = await sha1Hex(candidate);
    const derivedPrefix = getPrefix(derivedHash);
    const derivedSuffix = getSuffix(derivedHash);

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
      try {
        const response = await fetch(`/pwned/range/${derivedPrefix}`);

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            throw new Error(retryAfter ? `RATE_LIMITED:${retryAfter}` : 'RATE_LIMITED');
          }
          throw new Error(`BREACH_SERVICE_${response.status}`);
        }

        return parseHibpPayload(response, derivedSuffix);
      } catch (error) {
        lastError = error;
        if (attempt >= MAX_FETCH_RETRIES) break;
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unable to query the breach service');
  }, [MAX_FETCH_RETRIES]);

  const ensureSafePassword = useCallback(
    async (initial: string) => {
      let candidate = initial;
      let attempts = 0;

      while (attempts <= MAX_BREACH_RETRIES) {
        setBreachStatus({ status: 'checking', attempts });

        try {
          const count = await checkAgainstBreaches(candidate);

          if (count === 0) {
            setBreachStatus({ status: 'safe', attempts });
            setError('');
            setOutput(candidate);
            return;
          }

          attempts += 1;

          if (attempts > MAX_BREACH_RETRIES) {
            setBreachStatus({ status: 'breached', attempts, count });
            setError('Generated password is reported in breaches. Try again later.');
            setOutput(candidate);
            return;
          }

          candidate = generatePassword(context, length);
          setOutput(candidate);
        } catch (err) {
          setBreachStatus({ status: 'error', attempts });
          const message = err instanceof Error ? err.message : '';
          if (message.startsWith('RATE_LIMITED')) {
            const retryAfter = message.split(':')[1];
            setError(retryAfter ? `Rate limited. Try again in ${retryAfter} seconds.` : 'Rate limited. Try again soon.');
          } else {
            setError('Unable to verify the password against breach data right now.');
          }
          setOutput(candidate);
          return;
        }
      }
    },
    [MAX_BREACH_RETRIES, checkAgainstBreaches, context, length],
  );

  const regenerate = useCallback(async () => {
    setCopyState('');
    setError('');
    setBreachStatus(null);

    try {
      const next =
        mode === 'passphrase' ? generatePassphrase(wordCount, minPassphraseWords) : generatePassword(context, length);
      setOutput(next);

      if (mode === 'password') {
        await ensureSafePassword(next);
      }
    } catch (err) {
      setError('Unable to access a secure random generator in this browser.');
    }
  }, [context, ensureSafePassword, length, minPassphraseWords, mode, wordCount]);

  useEffect(() => {
    void regenerate();
  }, [regenerate]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState('Copied to clipboard');
    } catch (err) {
      setCopyState('Copy failed—try again');
    }
  };

  const handleLengthChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setLength(Math.min(64, Math.max(policy.minLength, value)));
  };

  const handleWordCountChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setWordCount(Math.min(10, Math.max(minPassphraseWords, value)));
  };

  return (
    <>
      <Head>
        <title>Generate | Security Hash</title>
      </Head>
      <GenerateView
        contextOptions={contextOptions}
        context={context}
        mode={mode}
        policy={policy}
        minPassphraseWords={minPassphraseWords}
        passphraseHint={passphraseHint}
        length={length}
        wordCount={wordCount}
        output={output}
        copyState={copyState}
        error={error}
        breachStatus={breachStatus}
        policySatisfied={policySatisfied}
        maxBreachRetries={MAX_BREACH_RETRIES}
        onSetContext={setContext}
        onSetMode={setMode}
        onLengthChange={handleLengthChange}
        onWordCountChange={handleWordCountChange}
        onCopy={handleCopy}
        onRegenerate={regenerate}
      />
    </>
  );
};

export default GeneratePage;
