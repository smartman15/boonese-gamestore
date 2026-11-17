import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('purchase')
  async purchaseGame(@Body() body: any): Promise<{ transactionId: number; game: string; key: string }> {
    return this.transactionsService.purchase(body);
  }

  @Get('user/:userId')
  async getUserTransactions(@Param('userId') userId: string): Promise<any[]> {
    return this.transactionsService.getTransactionsByUserId(Number(userId));
  }
}
