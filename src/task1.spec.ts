import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from "./app.module";
import { SqliteService } from './database/sqlite.service';


describe('Transactions', () => {
    const request = require('supertest');

    let app: INestApplication;
    let sqliteService: SqliteService;


    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
        .compile();

        sqliteService = moduleRef.get<SqliteService>(SqliteService);

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    })

    test("Send purchase request to POST /transactions/purchase that returns status code 201, keyCode is present, key status in database is SOLD", async ()=>{
        
        const purchaseRequest = {
            userId: 2,
            gameId: 3
        };

        const response = await request(app.getHttpServer())
            .post('/transactions/purchase')
            .send(purchaseRequest)

        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.status).toEqual(201);
        expect(response.body.key).toBeDefined();

        const key = await sqliteService.get<{status: string}>(
            'SELECT status FROM game_keys WHERE key_code = ?',
            [response.body.key]
        )

        expect(key?.status).toEqual('SOLD');
    });
})


