import request from 'supertest';
import nock from 'nock';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { APP_CONFIG, AppConfig } from '../src/config';

describe('PasswordController (integration)', () => {
  let app: INestApplication;
  let envSnapshot: Record<string, string | undefined> | null = null;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect(/127\.0\.0\.1|localhost/);
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  const createApp = async (overrideConfig?: Partial<AppConfig>) => {
    envSnapshot = {
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_TTL_SECONDS: process.env.RATE_LIMIT_TTL_SECONDS,
    };

    const mergedConfig: AppConfig = {
      hibpBaseUrl: 'https://api.pwnedpasswords.com',
      hibpAddPadding: false,
      cacheTtlSeconds: 60,
      requestTimeoutMs: 100,
      rateLimitMaxRequests: 2,
      rateLimitTtlSeconds: 60,
      port: 0,
      ...overrideConfig,
    };

    process.env.RATE_LIMIT_MAX_REQUESTS = String(mergedConfig.rateLimitMaxRequests);
    process.env.RATE_LIMIT_TTL_SECONDS = String(mergedConfig.rateLimitTtlSeconds);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_CONFIG)
      .useValue(mergedConfig)
      .compile();

    const nestApp = moduleRef.createNestApplication();
    const httpAdapter = nestApp.getHttpAdapter();
    const httpInstance = httpAdapter?.getInstance?.();
    if (httpInstance?.set) {
      httpInstance.set('trust proxy', true);
    }
    await nestApp.init();
    return nestApp;
  };

  afterEach(async () => {
    nock.cleanAll();
    if (app) {
      await app.close();
    }
    if (envSnapshot) {
      process.env.RATE_LIMIT_MAX_REQUESTS = envSnapshot.RATE_LIMIT_MAX_REQUESTS;
      process.env.RATE_LIMIT_TTL_SECONDS = envSnapshot.RATE_LIMIT_TTL_SECONDS;
      envSnapshot = null;
    }
  });

  it('returns 400 for invalid prefix input', async () => {
    app = await createApp();

    const response = await request(app.getHttpServer()).get('/pwned/1234').expect(400);
    expect(response.body.message).toMatch(/5-character hexadecimal/i);
  });

  it('uses cache on repeated prefix (second call avoids upstream)', async () => {
    app = await createApp();

    const prefix = 'ABCDE';
    nock('https://api.pwnedpasswords.com').get(`/range/${prefix}`).reply(200, '12345:10');

    const first = await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(200);
    expect(first.body.cached).toBe(false);

    const second = await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(200);
    expect(second.body.cached).toBe(true);
    expect(second.body.results).toEqual([{ suffix: '12345', count: 10 }]);
    expect(nock.isDone()).toBe(true);
  });

  it('returns 503 with a user-friendly message when HIBP fails', async () => {
    app = await createApp();

    const prefix = 'FFFFF';
    nock('https://api.pwnedpasswords.com').get(`/range/${prefix}`).replyWithError('timeout');

    const response = await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(503);
    expect(response.body.message).toMatch(/HIBP service unavailable/i);
  });

  it('enforces rate limiting', async () => {
    app = await createApp({ rateLimitMaxRequests: 1, rateLimitTtlSeconds: 60 });

    const prefix = 'ABCDE';
    nock('https://api.pwnedpasswords.com').get(`/range/${prefix}`).reply(200, '00000:1');

    const clientIp = '203.0.113.1';
    await request(app.getHttpServer()).get(`/pwned/${prefix}`).set('X-Forwarded-For', clientIp).expect(200);
    await request(app.getHttpServer()).get(`/pwned/${prefix}`).set('X-Forwarded-For', clientIp).expect(429);
  });

  it('adds HIBP response padding header when enabled', async () => {
    app = await createApp({ hibpAddPadding: true });

    const prefix = 'ABCDE';
    nock('https://api.pwnedpasswords.com', {
      reqheaders: {
        'Add-Padding': 'true',
      },
    })
      .get(`/range/${prefix}`)
      .reply(200, '00000:1');

    await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(200);
    expect(nock.isDone()).toBe(true);
  });
});
