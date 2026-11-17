import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SqliteService } from '../database/sqlite.service';
import { UsersService } from '../users/users.service';
import { GameKeyModel } from './game-key.model';

@Injectable()
export class GameKeyService {
  constructor(
    private readonly sqliteService: SqliteService,
    private readonly usersService: UsersService,
  ) {}

  async createGameKey(body: any): Promise<GameKeyModel> {
    if (!body || !body.requestUserId) {
      throw new BadRequestException('requestUserId is required');
    }
    await this.usersService.validateAdmin(body.requestUserId);

    if (!body.gameId || typeof body.gameId !== 'number') {
      throw new BadRequestException('Valid gameId is required');
    }
    if (!body.keyCode || typeof body.keyCode !== 'string' || body.keyCode.trim() === '') {
      throw new BadRequestException('keyCode is required');
    }

    // Verify game exists
    const game = await this.sqliteService.get('SELECT id FROM games WHERE id = ?', [body.gameId]);
    if (!game) {
      throw new NotFoundException(`Game with ID ${body.gameId} not found`);
    }

    const keyCode = body.keyCode.trim();

    // Check key code uniqueness
    const existingKey = await this.sqliteService.get('SELECT id FROM game_keys WHERE key_code = ?', [keyCode]);
    if (existingKey) {
      throw new ConflictException(`Game key code '${keyCode}' already exists`);
    }

    const result = await this.sqliteService.run(
      'INSERT INTO game_keys (game_id, key_code, status) VALUES (?, ?, ?)',
      [body.gameId, keyCode, 'AVAILABLE']
    );

    return this.getKeyById(result.lastID);
  }

  async getKeyById(id: number): Promise<GameKeyModel> {
    const key = await this.sqliteService.get<GameKeyModel>('SELECT * FROM game_keys WHERE id = ?', [id]);
    if (!key) {
      throw new NotFoundException(`Game key with ID ${id} not found`);
    }
    return key;
  }

  async findAvailableKeyForGame(gameId: number): Promise<GameKeyModel | undefined> {
    return this.sqliteService.get<GameKeyModel>(
      'SELECT * FROM game_keys WHERE game_id = ? AND status = ? LIMIT 1',
      [gameId, 'AVAILABLE']
    );
  }

  async countAvailableKeys(gameId: number): Promise<number> {
    const res = await this.sqliteService.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM game_keys WHERE game_id = ? AND status = ?',
      [gameId, 'AVAILABLE']
    );
    return res ? res.count : 0;
  }

  async markKeyAsSold(keyId: number): Promise<void> {
    await this.sqliteService.run(
      'UPDATE game_keys SET status = ? WHERE id = ?',
      ['SOLD', keyId]
    );
  }
}
