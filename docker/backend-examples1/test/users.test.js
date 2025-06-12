const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const userRoutes = require('../routes/users');
app.use(express.json());
app.use('/api/users', userRoutes);

describe('POST - cria um usuário', () => {
    let idUser = uuidv4();

    // setup do test => preparação
    beforeAll(async () => {
        let userId = 1; // id é auto incremento 
        await request(app).delete(`/api/users/${userId}`);
    });

    // setup de conclusão do test => limpar o ambiente
    afterAll(async () => {
        let userId = 1;
        await request(app).delete(`/api/users/${userId}`);
    });

    it('Deve criar um usuário', async () => {
        // let idUser = uuidv4(); // => transferir para o escopo acima /pai
        let userData = {
            "email": `${idUser}@example.com`,
            "name": `Usuario ${idUser}`,
            "password": "12345678"
        }
        const user = await request(app).post('/api/users').send(userData);
        console.log(user.body);
        expect(user.statusCode).toBe(201);
        expect(user.body.email).toBe(`${idUser}@example.com`);

    });

    it('Novo usuário deve realizar login', async () => {
        let userLogin = {
            "email": `${idUser}@example.com`,
            "password": "12345678"
        }
        const response = await request(app).post('/api/users/login').send(userLogin);
        expect(response.statusCode).toBe(200);
    });

});


