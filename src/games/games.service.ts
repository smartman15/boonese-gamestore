import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SqliteService } from '../database/sqlite.service';
import { UsersService } from '../users/users.service';
import { GameModel } from './game.model';

@Injectable()
export class GamesService {
  constructor(
    private readonly sqliteService: SqliteService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<GameModel[]> {
    const games = await this.sqliteService.all<any>(`
      SELECT g.*, COALESCE(k.availableStock, 0) as availableStock
      FROM games g
      LEFT JOIN (
        SELECT game_id, COUNT(*) as availableStock
        FROM game_keys
        WHERE status = 'AVAILABLE'
        GROUP BY game_id
      ) k ON g.id = k.game_id
      ORDER BY g.id ASC
    `);

    return games.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      price: g.price,
      availableStock: Number(g.availableStock),
    }));
  }

  async findOne(id: number): Promise<GameModel> {
    const game = await this.sqliteService.get<any>(`
      SELECT g.*, COALESCE(k.availableStock, 0) as availableStock
      FROM games g
      LEFT JOIN (
        SELECT game_id, COUNT(*) as availableStock
        FROM game_keys
        WHERE status = 'AVAILABLE' AND game_id = ?
      ) k ON g.id = k.game_id
      WHERE g.id = ?
    `, [id, id]);

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      price: game.price,
      availableStock: Number(game.availableStock),
    };
  }

  async create(body: any): Promise<GameModel> {
    if (!body || !body.requestUserId) {
      throw new BadRequestException('requestUserId is required');
    }
    await this.usersService.validateAdmin(body.requestUserId);

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      throw new BadRequestException('Game name is required');
    }
    if (!body.description || typeof body.description !== 'string') {
      throw new BadRequestException('Game description is required');
    }
    if (body.price === undefined || body.price === null || typeof body.price !== 'number' || body.price < 0) {
      throw new BadRequestException('Valid game price is required');
    }

    const result = await this.sqliteService.run(
      'INSERT INTO games (name, description, price) VALUES (?, ?, ?)',
      [body.name.trim(), body.description.trim(), body.price]
    );

    return this.findOne(result.lastID);
  }

  async update(id: number, body: any): Promise<GameModel> {
    if (!body || !body.requestUserId) {
      throw new BadRequestException('requestUserId is required');
    }
    await this.usersService.validateAdmin(body.requestUserId);

    const existing = await this.sqliteService.get<any>('SELECT * FROM games WHERE id = ?', [id]);
    if (!existing) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    const name = body.name !== undefined ? body.name : existing.name;
    const description = body.description !== undefined ? body.description : existing.description;
    const price = body.price !== undefined ? body.price : existing.price;

    await this.sqliteService.run(
      'UPDATE games SET name = ?, description = ?, price = ? WHERE id = ?',
      [name, description, price, id]
    );

    return this.findOne(id);
  }

  async delete(id: number, requestUserId: number): Promise<{ message: string }> {
    if (!requestUserId) {
      throw new BadRequestException('requestUserId is required');
    }
    await this.usersService.validateAdmin(requestUserId);

    const existing = await this.sqliteService.get<any>('SELECT * FROM games WHERE id = ?', [id]);
    if (!existing) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    // Check for existing transactions
    const txCount = await this.sqliteService.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE game_id = ?',
      [id]
    );

    // Check for sold keys
    const soldCount = await this.sqliteService.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM game_keys WHERE game_id = ? AND status = ?',
      [id, 'SOLD']
    );

    if (
      (txCount && txCount.count > 0) ||
      (soldCount && soldCount.count > 0)
    ) {
      throw new BadRequestException('Cannot delete game with existing transactions or sold keys');
    }

    // Remove remaining unsold available keys
    await this.sqliteService.run('DELETE FROM game_keys WHERE game_id = ?', [id]);
    // Delete game record
    await this.sqliteService.run('DELETE FROM games WHERE id = ?', [id]);

    return { message: `Game with ID ${id} has been deleted successfully` };
  }
}
