import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserModel } from './user.model';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserModel> {
    return this.usersService.findById(Number(id));
  }
}
