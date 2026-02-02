import { Controller, Get, Param } from '@nestjs/common';
import { HibpService } from './hibp.service';
import { validatePrefix } from './password.utils';

@Controller('pwned')
export class PasswordController {
  constructor(private readonly hibpService: HibpService) {}

  @Get(':prefix')
  async getHashes(@Param('prefix') prefix: string) {
    const normalized = validatePrefix(prefix);
    return this.hibpService.fetchHashes(normalized);
  }
}
