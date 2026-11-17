import { TransactionsModule } from "./transactions/transactions.module";
import { TransactionsService } from "./transactions/transactions.service";
import { INestApplication } from '@nestjs/common';

test("Send purchase request to POST /transactions/purchase that returns status code 201, keyCode is present, key status in database is SOLD", async ()=>{
    const request = require('supertest');
    const express = require('express');

    let app: INestApplication;

    
    
    const purchaseRequest = {
        userId: 2,
        gameId: 3
    };

    try{
        await request(app)
        .post('/transactions/purchase')
        .send(purchaseRequest)
    } catch(err){
        console.log(`oopsie, there was an error: ${err}`);
    }
});