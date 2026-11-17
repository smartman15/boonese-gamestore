import { Controller, Post, Body } from '@nestjs/common';
import { GameKeyService } from './game-key.service';
import { GameKeyModel } from './game-key.model';

@Controller('game-key')
export class GameKeyController {
  constructor(private readonly gameKeyService: GameKeyService) {}

  @Post()
  async createKey(@Body() body: any): Promise<GameKeyModel> {
    return this.gameKeyService.createGameKey(body);
  }
}
