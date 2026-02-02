import { FormEvent } from 'react';

export type RiskLevel = 'Unsafe' | 'Risky' | 'Safe-ish';

type CharacterSetUsage = {
  count: number;
  labels: string[];
};

export type BreachState = {
  count: number;
  risk: RiskLevel;
  riskScore: number;
  hash: string;
  prefix: string;
};

const getScoreLabel = (score: number) => {
  const labels = [
    'Very weak and easy to guess.',
    'Weak—common patterns detected.',
    'Fair—some resistance to guessing.',
    'Good—reasonably strong.',
    'Strong—hard to guess.',
  ];

  return labels[score] ?? labels[0];
};

const getRiskHint = (breachCount: number, riskScore: number, hasInput: boolean) => {
  if (!hasInput) return 'Enter a password to see a combined risk assessment.';
  if (breachCount > 0) return 'Found in known breaches—treat as compromised.';
  if (riskScore < 20) return 'No breach detected and the password looks strong.';
  if (riskScore < 35) return 'Not breached but could use more length or variety.';
  return 'This password is too weak to trust on its own.';
};

export const CheckView = (props: {
  password: string;
  showPassword: boolean;
  isWorking: boolean;
  error: string;
  breachState: BreachState | null;
  zxcvbnScore: number;
  riskScore: number;
  combinedRisk: RiskLevel;
  characterSetUsage: CharacterSetUsage;
  strengthFeedback: string;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  const prefix = props.breachState?.prefix ?? '';

  return (
    <>
      <section className="panel">
        <h1>Check if a password is pwned</h1>
        <p>
          Your password never leaves this page. We hash it locally, send only the first 5 characters of the SHA-1
          digest, and compare the returned suffixes.
        </p>
        <form onSubmit={props.onSubmit} className="output-grid">
          <div className="password-field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={props.showPassword ? 'text' : 'password'}
                autoComplete="off"
                placeholder="Enter a password to check..."
                value={props.password}
                onChange={(e) => props.onPasswordChange(e.target.value)}
                required
              />
              <button
                type="button"
                className="ghost"
                onClick={props.onToggleShowPassword}
                aria-label={props.showPassword ? 'Hide password' : 'Show password'}
              >
                {props.showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="hint">Input is masked and never transmitted directly.</p>
            {props.error ? (
              <div className="error" role="alert">
                {props.error}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={props.isWorking}>
              {props.isWorking ? 'Checking…' : 'Check'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel" aria-live="polite">
        <h1>Password strength</h1>
        <div className="output-grid">
          <div className={`status-pill status-${props.combinedRisk.toLowerCase()}`}>
            <span>{props.combinedRisk}</span>
            <span className="hint">
              {getRiskHint(props.breachState?.count ?? 0, props.riskScore, Boolean(props.password.length))}
            </span>
          </div>

          <div className="output-row" style={{ justifyContent: 'space-between' }}>
            <span className="badge">
              <strong>risk score</strong>
              <span>0 (lower) to 100 (higher)</span>
            </span>
            <div style={{ display: 'grid', justifyItems: 'end' }}>
              <strong style={{ fontSize: 18 }}>{props.riskScore} / 100</strong>
              <span className="hint" style={{ textAlign: 'right' }}>
                Based on breach frequency, zxcvbn, length, and character diversity.
              </span>
            </div>
          </div>

          <div className="output-row" style={{ justifyContent: 'space-between' }}>
            <span className="badge">
              <strong>zxcvbn score</strong>
              <span>0 (weak) to 4 (strong)</span>
            </span>
            <div style={{ display: 'grid', justifyItems: 'end' }}>
              <strong style={{ fontSize: 18 }}>{props.zxcvbnScore} / 4</strong>
              <span className="hint" style={{ textAlign: 'right' }}>
                {getScoreLabel(props.zxcvbnScore)}
              </span>
            </div>
          </div>

          <ul className="hint" style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>Length: {props.password.length} characters.</li>
            <li>
              Character sets: {props.characterSetUsage.count}/4
              {props.characterSetUsage.labels.length
                ? ` (${props.characterSetUsage.labels.join(', ')})`
                : ' — no character variety detected yet.'}
            </li>
            <li>
              Breach status:{' '}
              {props.breachState
                ? props.breachState.count > 0
                  ? `Found ${props.breachState.count.toLocaleString()} times in breach data.`
                  : 'Not found in breach data so far.'
                : 'Not checked yet—run the breach lookup.'}
            </li>
            <li>Strength feedback: {props.strengthFeedback}</li>
          </ul>
        </div>
      </section>

      {props.breachState ? (
        <section className="panel" aria-live="polite">
          <h1>Breach results</h1>
          <div className="output-grid">
            <div className="output-row" style={{ justifyContent: 'space-between' }}>
              <div className="badge">
                <strong>Found in breaches</strong>
                <span>number of times</span>
              </div>
              <strong style={{ fontSize: 18 }}>{props.breachState.count.toLocaleString()}</strong>
            </div>
            <div className={`status-pill status-${props.breachState.risk.toLowerCase()}`}>
              <span>{props.breachState.risk}</span>
              <span className="hint">
                {props.breachState.risk === 'Unsafe'
                  ? 'Found in breach data or too weak to trust.'
                  : props.breachState.risk === 'Risky'
                    ? 'Not breached, but improve length and variety.'
                    : 'Not breached and strong based on zxcvbn.'}
              </span>
            </div>
            <div className="output-row">
              <span className="badge">
                <strong>SHA-1 prefix</strong>
                <span>sent to server</span>
              </span>
              <span>{prefix}</span>
            </div>
            <div className="hint">
              Only the first 5 characters of the SHA-1 hash are shared with the backend; the suffix remains local for
              matching.
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};
