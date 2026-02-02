import request from 'supertest';
import nock from 'nock';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { APP_CONFIG, AppConfig } from '../src/config';

describe('PasswordController (integration)', () => {
  let app: INestApplication;

  const createApp = async (overrideConfig?: Partial<AppConfig>) => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_CONFIG)
      .useValue({
        hibpBaseUrl: 'https://api.pwnedpasswords.com',
        hibpAddPadding: false,
        cacheTtlSeconds: 60,
        requestTimeoutMs: 100,
        rateLimitMaxRequests: 2,
        rateLimitTtlSeconds: 60,
        port: 0,
        ...overrideConfig,
      })
      .compile();

    const nestApp = moduleRef.createNestApplication();
    await nestApp.init();
    return nestApp;
  };

  afterEach(async () => {
    nock.cleanAll();
    if (app) {
      await app.close();
    }
  });

  it('returns cached responses on repeated prefix', async () => {
    app = await createApp();

    const prefix = 'ABCDE';
    nock('https://api.pwnedpasswords.com')
      .get(`/range/${prefix}`)
      .reply(200, '12345:10');

    const first = await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(200);
    expect(first.body.cached).toBe(false);

    const second = await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(200);
    expect(second.body.cached).toBe(true);
    expect(second.body.results).toEqual([{ suffix: '12345', count: 10 }]);
    expect(nock.isDone()).toBe(true);
  });

  it('maps HIBP failures to 503', async () => {
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

    await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(200);
    await request(app.getHttpServer()).get(`/pwned/${prefix}`).expect(429);
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
