import test from "node:test";
import request from 'supertest';
import { TransactionsModule } from "./transactions/transactions.module";
import { TransactionsService } from "./transactions/transactions.service";
import { INestApplication } from '@nestjs/common';

test("Send purchase request to POST /transactions/purchase that returns status code 201, keyCode is present, key status in database is SOLD", async ()=>{
    const purchaseRequest = {
        user_id: 2,
        game_id: 3
    };

    try{
        await request()
    }
});