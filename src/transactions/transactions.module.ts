import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';
import { GameKeyModule } from '../game-key/game-key.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    UsersModule,
    GamesModule,
    GameKeyModule,
    DatabaseModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
