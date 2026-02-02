import axios from 'axios';
import { Injectable, ServiceUnavailableException, Inject } from '@nestjs/common';
import NodeCache from 'node-cache';
import { APP_CONFIG, AppConfig } from './config';
import { HibpSuffix, parseHibpRangeResponse } from './password.utils';

export type HibpResponse = {
  cached: boolean;
  prefix: string;
  results: HibpSuffix[];
};

@Injectable()
export class HibpService {
  private cache: NodeCache;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.cache = new NodeCache({ stdTTL: this.config.cacheTtlSeconds });
  }

  async fetchHashes(prefix: string): Promise<HibpResponse> {
    const cached = this.cache.get<HibpSuffix[]>(prefix);
    if (cached) {
      return { cached: true, prefix, results: cached };
    }

    try {
      const response = await axios.get<string>(`${this.config.hibpBaseUrl}/range/${prefix}`, {
        timeout: this.config.requestTimeoutMs,
        responseType: 'text',
        transformResponse: (data) => data,
        headers: this.config.hibpAddPadding ? { 'Add-Padding': 'true' } : undefined,
      });

      const results = parseHibpRangeResponse(response.data);
      this.cache.set(prefix, results);

      return { cached: false, prefix, results };
    } catch (error) {
      throw new ServiceUnavailableException('HIBP service unavailable. Please try again later.');
    }
  }
}
