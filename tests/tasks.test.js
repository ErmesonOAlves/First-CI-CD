import request from 'supertest'
import app from "../src/app.js";
import pool from "../src/database/connection.js";

describe('Tasks API', () => {
    beforeEach(async () => {
        await pool.query('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE')
    })
    afterAll(async () => {
        await pool.end();
    })
    test('Should create a new Task', async () => {
        const response = await request(app).post('/tasks').send({
            title: 'Automatizated task',
            description: 'A new automatizated task',
        });
        expect(response.status).toBe(201);
        expect(response.body.status).toBe('OK');
        expect(response.body.task).toEqual(expect.objectContaining({
            id: 1,
            title: 'Automatizated task',
            description: 'A new automatizated task',
            completed: false
        }))
    })

    test('Should return 400 when title is missing', async () => {
        const response = await request(app).post('/tasks').send({
            description: 'A new task',
        })
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('missing required fields')

    })

    test('Should return all tasks', async () => {
        await request(app)
            .post('/tasks')
            .send({
                title: 'Task for listing',
                description: 'Testing GET endpoint'
            });
        const response = await request(app).get('/tasks');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
        expect(response.body.total).toBe(1);
        expect(response.body.tasks.length).toBe(1);
        expect(response.body.tasks[0].title).toBe('Task for listing');
    })

    test('Should return a task by Id', async () => {
        await request(app).post('/tasks').send({
            title: 'Task by ID',
            description: 'Testing GET by ID'
        })
        const response = await request(app).get('/tasks/1');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
        expect(response.body.task.id).toBe(1);
        expect(response.body.task.title).toBe('Task by ID');
    })
    test('Should return 400 when task ID is invalid', async () => {
        const response = await request(app).get('/tasks/abc'); // NOVO: envia ID inválido.

        expect(response.status).toBe(400); // NOVO: espera Bad Request.
        expect(response.body.message).toBe('Invalid task ID'); // NOVO: verifica a mensagem.
    });
    test('Should fail trying to list an not-existing task By ID', async () => {
        const response = await request(app).get('/tasks/3')
        expect(response.status).toBe(404)
        expect(response.body.message).toBe('Task not found')
    })
    test('Should delete a task by Id', async () => {
        await request(app).post('/tasks').send({
            title: 'Task for delete',
            description: 'Testing delete'
        })
        const response = await request(app).delete('/tasks/1');
        expect(response.status).toBe(204);
        expect(response.text).toBe('');
        const result = await pool.query(
            'SELECT * FROM tasks WHERE id = $1',
            [1]
        );

        expect(result.rowCount).toBe(0);

    })
    test('Should fail trying to delete a task by ID not existing', async () => {
        await request(app).post('/tasks').send({
            title: 'Task for delete',
            description: 'Testing delete'
        })
        const response = await request(app).delete('/tasks/3');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Task not found')
    })
    test('Should update a task by Id', async () => {
        await request(app).post('/tasks').send({
            title: 'Task for update',
            description: 'Testing update'
        })
        const response = await request(app).put('/tasks/1').send({
            title: 'Task for update',
            description: 'Testing update',
            completed: true
        })
        expect(response.status).toBe(200);

    })
    test('Should fail trying to update a not existing task', async () => {
        await request(app).post('/tasks').send({
            title: 'Task for update',
            description: 'Testing update'
        })
        const response = await request(app).put('/tasks/30').send({
            title: 'Task for update',
            description: 'Testing update',
            completed: true
        })
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Task not found')

    })
    test('Should return 400 when updating with invalid data', async () => {
        await request(app).post('/tasks').send({
            title: 'Task for invalid update',
            description: 'Testing invalid update'
        });

        const response = await request(app).put('/tasks/1').send({
            title: 'Updated task',
            description: 'Updated description',
            completed: 'true' // NOVO: string em vez de boolean.
        });
        expect(response.status).toBe(400); // NOVO: espera erro de validação.
        expect(response.body.status).toBe('ERROR'); // NOVO: verifica a resposta.
    });
});