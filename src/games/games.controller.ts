import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameModel } from './game.model';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async getAllGames(): Promise<GameModel[]> {
    return this.gamesService.findAll();
  }

  @Get(':id')
  async getGameById(@Param('id') id: string): Promise<GameModel> {
    return this.gamesService.findOne(Number(id));
  }

  @Post()
  async createGame(@Body() body: any): Promise<GameModel> {
    return this.gamesService.create(body);
  }

  @Put(':id')
  async updateGame(@Param('id') id: string, @Body() body: any): Promise<GameModel> {
    return this.gamesService.update(Number(id), body);
  }

  @Delete(':id')
  async deleteGame(@Param('id') id: string, @Body() body: any, @Query('requestUserId') queryUserId?: string): Promise<{ message: string }> {
    const requestUserId = body?.requestUserId || (queryUserId ? Number(queryUserId) : null);
    if (!requestUserId) {
      throw new BadRequestException('requestUserId is required in body or query');
    }
    return this.gamesService.delete(Number(id), Number(requestUserId));
  }
}
