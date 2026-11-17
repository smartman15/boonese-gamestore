import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';

@Injectable()
export class SqliteService implements OnModuleInit, OnModuleDestroy {
  private db: sqlite3.Database;

  async onModuleInit() {
    const dbPath = path.resolve(process.cwd(), 'boonese-gamestore.sqlite');
    this.db = new (sqlite3.verbose().Database)(dbPath);
    await this.initTables();
    await this.seedData();
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async initTables() {
    await this.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS game_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        key_code TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY(game_id) REFERENCES games(id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        game_key_id INTEGER NOT NULL,
        price INTEGER NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(game_id) REFERENCES games(id),
        FOREIGN KEY(game_key_id) REFERENCES game_keys(id)
      );
    `);
  }

  private async seedData() {
    // Seed users
    const userCount = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (userCount && userCount.count === 0) {
      await this.run('INSERT INTO users (id, username, email, role) VALUES (1, ?, ?, ?)', ['admin', 'admin@boonese.com', 'ADMIN']);
      await this.run('INSERT INTO users (id, username, email, role) VALUES (2, ?, ?, ?)', ['user1', 'user1@boonese.com', 'USER']);
      await this.run('INSERT INTO users (id, username, email, role) VALUES (3, ?, ?, ?)', ['user2', 'user2@boonese.com', 'USER']);
    }

    // Seed games
    const gameCount = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM games');
    if (gameCount && gameCount.count === 0) {
      const initialGames = [
        { id: 1, name: 'Grand Theft Auto VI', description: 'Action-adventure game set in the open world state of Leonida.', price: 799000, keyPrefix: 'GTA06' },
        { id: 2, name: 'Monster Hunter Wilds', description: 'Hunting action RPG with dynamic environments and dangerous monsters.', price: 699000, keyPrefix: 'MHWLD' },
        { id: 3, name: 'Elden Ring: Nightreign', description: 'Co-op action RPG expansion in the Lands Between.', price: 599000, keyPrefix: 'ERNTR' },
        { id: 4, name: 'Kingdom Come: Deliverance II', description: 'Story-driven action RPG set in 15th Century Bohemia.', price: 649000, keyPrefix: 'KCD02' },
        { id: 5, name: 'Clair Obscur: Expedition 33', description: 'Turn-based RPG featuring real-time mechanics and painterly visuals.', price: 549000, keyPrefix: 'COE33' },
        { id: 6, name: "Assassin's Creed Shadows", description: 'Stealth action RPG set in feudal Japan featuring Naoe and Yasuke.', price: 699000, keyPrefix: 'ACSDW' },
        { id: 7, name: "Baldur's Gate 3", description: 'Award-winning story-rich RPG set in the Dungeons & Dragons universe.', price: 699000, keyPrefix: 'BG300' },
        { id: 8, name: 'Cyberpunk 2077 Ultimate Edition', description: 'Open-world action adventure featuring the complete Night City story.', price: 749000, keyPrefix: 'CP207' },
        { id: 9, name: 'Hogwarts Legacy', description: 'Immersive open-world action RPG set in the 1800s Wizarding World.', price: 599000, keyPrefix: 'HWLGC' },
        { id: 10, name: 'Red Dead Redemption 2', description: 'Epic tale of honor and loyalty at the dawn of the modern age.', price: 499000, keyPrefix: 'RDR02' }
      ];

      for (const g of initialGames) {
        await this.run(
          'INSERT INTO games (id, name, description, price) VALUES (?, ?, ?, ?)',
          [g.id, g.name, g.description, g.price]
        );

        // Seed 3 keys for each game in UUUUU-WWWWW-XXXXX-YYYYY-ZZZZZ format
        for (let k = 1; k <= 3; k++) {
          const keyCode = `${g.keyPrefix}-KEY0${k}-AAAAA-BBBBB-C000${k}`;
          await this.run(
            'INSERT INTO game_keys (game_id, key_code, status) VALUES (?, ?, ?)',
            [g.id, keyCode, 'AVAILABLE']
          );
        }
      }
    }
  }
}
