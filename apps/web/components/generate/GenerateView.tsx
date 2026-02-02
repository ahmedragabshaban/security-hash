import { Policy, PolicyKey } from '../../lib/generator';

type Mode = 'password' | 'passphrase';

export type BreachStatus =
  | { status: 'checking'; attempts: number }
  | { status: 'safe'; attempts: number }
  | { status: 'breached'; attempts: number; count: number }
  | { status: 'error'; attempts: number }
  | null;

export const GenerateView = (props: {
  contextOptions: Array<{ key: PolicyKey; label: string }>;
  context: PolicyKey;
  mode: Mode;
  policy: Policy;
  minPassphraseWords: number;
  passphraseHint: string;
  length: number;
  wordCount: number;
  output: string;
  copyState: string;
  error: string;
  breachStatus: BreachStatus;
  policySatisfied: boolean;
  maxBreachRetries: number;
  onSetContext: (context: PolicyKey) => void;
  onSetMode: (mode: Mode) => void;
  onLengthChange: (value: number) => void;
  onWordCountChange: (value: number) => void;
  onCopy: () => void;
  onRegenerate: () => void;
}) => {
  return (
    <>
      <section className="panel">
        <h1>Generate a context-aware password</h1>
        <p>
          Pick where the password will be used and we&apos;ll enforce sensible policies. Everything is generated locally
          using <code>crypto.getRandomValues</code>—no data leaves your browser.
        </p>

        <div className="output-grid">
          <div>
            <label>Usage context</label>
            <div className="nav-tabs" role="group" aria-label="Context presets">
              {props.contextOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`nav-tab ${props.context === key ? 'active' : ''}`}
                  onClick={() => props.onSetContext(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="hint">Normal → Important → Sensitive increases minimum length and complexity.</p>
          </div>

          <div>
            <label>Mode</label>
            <div className="password-input">
              <button
                type="button"
                className={props.mode === 'password' ? '' : 'ghost'}
                onClick={() => props.onSetMode('password')}
                aria-pressed={props.mode === 'password'}
              >
                Password
              </button>
              <button
                type="button"
                className={props.mode === 'passphrase' ? '' : 'ghost'}
                onClick={() => props.onSetMode('passphrase')}
                aria-pressed={props.mode === 'passphrase'}
              >
                Passphrase
              </button>
            </div>
            <p className="hint">Use random characters or a simple dashed passphrase from a fixed wordlist.</p>
          </div>

          {props.mode === 'password' ? (
            <div>
              <label htmlFor="length">Length</label>
              <input
                id="length"
                type="number"
                min={props.policy.minLength}
                max={64}
                value={props.length}
                onChange={(event) => props.onLengthChange(Number(event.target.value))}
              />
              <p className="hint">Minimum {props.policy.minLength} characters with required character classes.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="word-count">Words</label>
              <input
                id="word-count"
                type="number"
                min={props.minPassphraseWords}
                max={10}
                value={props.wordCount}
                onChange={(event) => props.onWordCountChange(Number(event.target.value))}
              />
              <p className="hint">{props.passphraseHint}</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <h1>Result</h1>
        {props.error ? (
          <div className="error" role="alert">
            {props.error}
          </div>
        ) : null}
        <div className="output-grid">
          <div className="password-field" aria-live="polite">
            <label htmlFor="generated">{props.mode === 'passphrase' ? 'Passphrase' : 'Password'}</label>
            <div className="password-input">
              <input id="generated" type="text" readOnly value={props.output} aria-readonly />
              <button type="button" className="ghost" onClick={props.onCopy} disabled={!props.output}>
                Copy
              </button>
              <button type="button" onClick={props.onRegenerate}>
                Regenerate
              </button>
            </div>
            <p className="hint">
              Generated with Web Crypto.{' '}
              {props.copyState ? <strong>{props.copyState}</strong> : 'Copy or regenerate anytime.'}
            </p>
            {props.mode === 'password' && props.breachStatus ? (
              <p className="hint" aria-live="polite">
                {props.breachStatus.status === 'checking'
                  ? `Checking against known breaches (attempt ${props.breachStatus.attempts + 1} of ${props.maxBreachRetries + 1})...`
                  : props.breachStatus.status === 'safe'
                    ? 'Not found in breach data.'
                    : props.breachStatus.status === 'breached'
                      ? `Warning: still appears in breaches after ${props.breachStatus.attempts} checks. Regenerate again or try later.`
                      : 'Could not verify against breach data. Copy with caution.'}
              </p>
            ) : null}
          </div>

          {props.mode === 'password' ? (
            <div className="output-row">
              <span className="badge">
                <strong>{props.policy.label}</strong>
                <span>{props.policy.description}</span>
              </span>
              <div className="hint" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                {props.policySatisfied ? 'Meets policy requirements.' : 'Regenerate to satisfy the current policy.'}
              </div>
            </div>
          ) : (
            <div className="output-row">
              <span className="badge">
                <strong>Passphrase</strong>
                <span>{props.wordCount} words separated by dashes</span>
              </span>
              <div className="hint" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                {props.policySatisfied ? 'Ready to copy.' : 'Regenerate for a fresh set of words.'}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
