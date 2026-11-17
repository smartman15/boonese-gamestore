export class TransactionModel {
  id: number;
  user_id: number;
  game_id: number;
  game_key_id: number;
  price: number;
  created_at: Date | string;
}
