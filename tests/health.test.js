import pool from '../src/database/connection.js'
import request from 'supertest'
import app from "../src/app.js";

describe('health check to test if API is running',()=>{
    afterAll(async () => {
    await pool.end();
});
    test('Should return status 200 e confirm API is running',async()=>{
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            status: 'OK',
            message: 'API is running!'
        })
    })

   test('Should confirm database connection', async () => {
    const response = await request(app).get('/db-health'); // NOVO

    expect(response.status).toBe(200); // NOVO
    expect(response.body.status).toBe('success'); // NOVO
    expect(response.body.message).toBe('Database connected'); // NOVO
    expect(response.body.databaseTime).toBeDefined(); // NOVO
});
})
