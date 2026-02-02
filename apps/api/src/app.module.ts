import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_CONFIG, loadConfig } from './config';
import { AppController } from './app.controller';
import { PasswordController } from './password.controller';
import { HibpService } from './hibp.service';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const config = loadConfig();
        return {
          throttlers: [
            {
              ttl: config.rateLimitTtlSeconds,
              limit: config.rateLimitMaxRequests,
            },
          ],
        };
      },
    }),
  ],
  controllers: [AppController, PasswordController],
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: loadConfig,
    },
    HibpService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [APP_CONFIG],
})
export class AppModule {}
