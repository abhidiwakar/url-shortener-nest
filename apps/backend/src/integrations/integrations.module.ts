import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { UrlsModule } from '../urls/urls.module';
import { UsersModule } from '../users/users.module';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [ApiKeysModule, UrlsModule, UsersModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
