import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SqliteService } from '../database/sqlite.service';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';
import { GameKeyService } from '../game-key/game-key.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly sqliteService: SqliteService,
    private readonly usersService: UsersService,
    private readonly gamesService: GamesService,
    private readonly gameKeyService: GameKeyService,
  ) {}

  async purchase(body: any): Promise<{ transactionId: number; game: string; key: string }> {
    if (!body || !body.userId || typeof body.userId !== 'number') {
      throw new BadRequestException('Valid userId is required');
    }
    if (!body.gameId || typeof body.gameId !== 'number') {
      throw new BadRequestException('Valid gameId is required');
    }

    // 1. Validate user exists
    await this.usersService.findById(body.userId);

    // 2. Validate game exists
    const game = await this.gamesService.findOne(body.gameId);

    // 3. Begin SQLite transaction
    await this.sqliteService.exec('BEGIN TRANSACTION');

    try {
      // 4. Find one available game key
      const availableKey = await this.gameKeyService.findAvailableKeyForGame(body.gameId);

      // 5. If no key exists, rollback and reject
      if (!availableKey) {
        await this.sqliteService.exec('ROLLBACK');
        throw new BadRequestException('No available game keys remaining for this game');
      }

      // 6. Create transaction row
      const createdAt = new Date().toISOString();
      const txResult = await this.sqliteService.run(
        'INSERT INTO transactions (user_id, game_id, game_key_id, price, created_at) VALUES (?, ?, ?, ?, ?)',
        [body.userId, body.gameId, availableKey.id, game.price, createdAt]
      );
      const transactionId = txResult.lastID;

      // 7. Mark key AVAILABLE -> SOLD
      await this.gameKeyService.markKeyAsSold(availableKey.id);

      // 8. Commit transaction
      await this.sqliteService.exec('COMMIT');

      return {
        transactionId,
        game: game.name,
        key: availableKey.key_code,
      };
    } catch (err) {
      // Ensure transaction is rolled back on unexpected error
      try {
        await this.sqliteService.exec('ROLLBACK');
      } catch (rollbackErr) {
        // Ignore rollback failure if transaction already ended
      }

      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(`Purchase transaction failed: ${err.message}`);
    }
  }

  async getTransactionsByUserId(userId: number): Promise<any[]> {
    await this.usersService.findById(userId);

    const rows = await this.sqliteService.all<any>(`
      SELECT 
        t.id as transaction_id,
        t.user_id,
        t.price,
        t.created_at,
        g.id as game_id,
        g.name as game_name,
        g.description as game_description,
        k.id as key_id,
        k.key_code
      FROM transactions t
      JOIN games g ON t.game_id = g.id
      JOIN game_keys k ON t.game_key_id = k.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);

    return rows.map((r) => ({
      transactionId: r.transaction_id,
      userId: r.user_id,
      price: r.price,
      createdAt: r.created_at,
      game: {
        id: r.game_id,
        name: r.game_name,
        description: r.game_description,
      },
      key: {
        id: r.key_id,
        keyCode: r.key_code,
      },
    }));
  }
}
