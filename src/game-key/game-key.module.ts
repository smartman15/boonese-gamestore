import { Module } from '@nestjs/common';
import { GameKeyController } from './game-key.controller';
import { GameKeyService } from './game-key.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [GameKeyController],
  providers: [GameKeyService],
  exports: [GameKeyService],
})
export class GameKeyModule {}
