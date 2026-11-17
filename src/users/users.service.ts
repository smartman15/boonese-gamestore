import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SqliteService } from '../database/sqlite.service';
import { UserModel } from './user.model';

@Injectable()
export class UsersService {
  constructor(private readonly sqliteService: SqliteService) {}

  async findById(id: number): Promise<UserModel> {
    const user = await this.sqliteService.get<UserModel>('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async validateAdmin(requestUserId: number): Promise<UserModel> {
    if (!requestUserId) {
      throw new ForbiddenException('requestUserId is required for admin actions');
    }
    const user = await this.sqliteService.get<UserModel>('SELECT * FROM users WHERE id = ?', [requestUserId]);
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied. Admin role required.');
    }
    return user;
  }
}
