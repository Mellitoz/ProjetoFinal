// server/server.test.js

const request = require('supertest');
const app = require('./server');

// --- MOCKING SETUP ---
// Primeiro, importamos o módulo que vamos imitar.
// O Jest vai substituir esta importação pela nossa imitação abaixo.
const admin = require('firebase-admin');

// A imitação do Firebase agora expõe as suas próprias funções de mock.
jest.mock('firebase-admin', () => {
    // Criamos as funções de mock aqui dentro, no escopo correto.
    const get = jest.fn();
    const add = jest.fn();
    const update = jest.fn();
    const set = jest.fn();
    const deleteFunc = jest.fn(); // Usamos deleteFunc para não colidir com a palavra 'delete'
    const where = jest.fn();
    const doc = jest.fn(() => ({
        get,
        update,
        set,
        delete: deleteFunc,
    }));

    // Criamos a função firestore e adicionamos FieldValue como uma propriedade
    const firestore = () => ({
        collection: jest.fn(() => ({
            get,
            add,
            doc,
            where,
            orderBy: jest.fn(() => ({ get })),
        })),
    });
    
    firestore.FieldValue = {
        serverTimestamp: jest.fn(),
    };

    // Retornamos um objeto que inclui a estrutura imitada E as próprias funções de mock.
    return {
        initializeApp: jest.fn(),
        credential: { cert: jest.fn() },
        firestore,
        // Expomos as funções para que os testes as possam controlar.
        mockGet: get,
        mockAdd: add,
        mockUpdate: update,
        mockSet: set,
        mockDelete: deleteFunc,
        mockWhere: where,
    };
});

// --- CONTROLE DO SERVIDOR DE TESTES ---
let server;
beforeAll((done) => {
    server = app.listen(3001, done);
});
afterAll((done) => {
    server.close(done);
});

// --- RESET DOS MOCKS ANTES DE CADA TESTE ---
beforeEach(() => {
    // Limpa o estado de todos os mocks para garantir que os testes são independentes.
    jest.clearAllMocks();
});

// --- SUÍTE DE TESTES COM ALTA COBERTURA ---
describe('Testes de API do AssistFood', () => {

    // --- ROTAS DE ITENS ---
    describe('/itens', () => {
        it('GET /itens - Deve retornar uma lista de itens e status 200', async () => {
            admin.mockGet.mockResolvedValue({ docs: [{ id: '1', data: () => ({ nome: 'Coca-Cola' }) }] });
            const res = await request(server).get('/itens');
            expect(res.statusCode).toBe(200);
            expect(res.body[0].nome).toBe('Coca-Cola');
        });

        it('GET /itens - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockGet.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).get('/itens');
            expect(res.statusCode).toBe(500);
        });
        
        it('POST /itens - Deve criar um novo item e retornar status 201', async () => {
            admin.mockAdd.mockResolvedValue({ id: 'novoId' });
            const res = await request(server).post('/itens').send({ nome: 'Teste', tipo: 'Bebida', preco: 1 });
            expect(res.statusCode).toBe(201);
        });

        it('POST /itens - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockAdd.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).post('/itens').send({ nome: 'Teste', tipo: 'Bebida', preco: 1 });
            expect(res.statusCode).toBe(500);
        });

        it('PUT /itens/:id - Deve atualizar um item e retornar status 200', async () => {
            admin.mockUpdate.mockResolvedValue(true);
            const res = await request(server).put('/itens/item1').send({ nome: 'Teste' });
            expect(res.statusCode).toBe(200);
        });

        it('PUT /itens/:id - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockUpdate.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).put('/itens/item1').send({ nome: 'Teste' });
            expect(res.statusCode).toBe(500);
        });

        it('DELETE /itens/:id - Deve excluir um item e retornar status 200', async () => {
            admin.mockDelete.mockResolvedValue(true);
            const res = await request(server).delete('/itens/item1');
            expect(res.statusCode).toBe(200);
        });
        
        it('DELETE /itens/:id - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockDelete.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).delete('/itens/item1');
            expect(res.statusCode).toBe(500);
        });
    });

    // --- ROTAS DE COMANDAS ---
    describe('/comandas', () => {
        it('GET /comandas - Deve retornar uma lista de comandas e status 200', async () => {
            admin.mockGet.mockResolvedValue({ docs: [] });
            const res = await request(server).get('/comandas');
            expect(res.statusCode).toBe(200);
        });

        it('GET /comandas - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockGet.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).get('/comandas');
            expect(res.statusCode).toBe(500);
        });

        it('POST /comandas - Deve criar uma comanda e retornar status 201', async () => {
            admin.mockWhere.mockReturnValue({ get: jest.fn().mockResolvedValue({ empty: true }) });
            admin.mockAdd.mockResolvedValue(true);
            const res = await request(server).post('/comandas').send({ numeroComanda: '123' });
            expect(res.statusCode).toBe(201);
        });
        
        it('POST /comandas - Deve retornar 400 se a comanda já existir', async () => {
            admin.mockWhere.mockReturnValue({ get: jest.fn().mockResolvedValue({ empty: false }) });
            const res = await request(server).post('/comandas').send({ numeroComanda: '123' });
            expect(res.statusCode).toBe(400);
        });
        
        it('POST /comandas - Deve retornar 400 se não houver número da comanda', async () => {
            const res = await request(server).post('/comandas').send({ valorTotal: 50 });
            expect(res.statusCode).toBe(400);
        });

        it('POST /comandas - Deve retornar 500 se a verificação falhar', async () => {
            admin.mockWhere.mockReturnValue({ get: jest.fn().mockRejectedValue(new Error('Falha no DB')) });
            const res = await request(server).post('/comandas').send({ numeroComanda: '123' });
            expect(res.statusCode).toBe(500);
        });
        
        it('POST /comandas - Deve retornar 500 se a criação da comanda falhar', async () => {
            admin.mockWhere.mockReturnValue({ get: jest.fn().mockResolvedValue({ empty: true }) });
            admin.mockAdd.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).post('/comandas').send({ numeroComanda: '123' });
            expect(res.statusCode).toBe(500);
        });

        it('GET /comandas/:numero - Deve retornar 404 se a comanda não for encontrada', async () => {
            admin.mockWhere.mockReturnValue({ get: jest.fn().mockResolvedValue({ empty: true }) });
            const res = await request(server).get('/comandas/123');
            expect(res.statusCode).toBe(404);
        });

        it('GET /comandas/:numero - Deve retornar 200 se a comanda for encontrada', async () => {
             admin.mockWhere.mockReturnValue({ get: jest.fn().mockResolvedValue({ empty: false, docs: [{id: '1', data: () => ({numeroComanda: '123'})}] }) });
            const res = await request(server).get('/comandas/123');
            expect(res.statusCode).toBe(200);
        });
        
        it('GET /comandas/:numero - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockWhere.mockReturnValue({ get: jest.fn().mockRejectedValue(new Error('Falha no DB')) });
            const res = await request(server).get('/comandas/123');
            expect(res.statusCode).toBe(500);
        });

        it('DELETE /comandas/:id - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockDelete.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).delete('/comandas/comanda1');
            expect(res.statusCode).toBe(500);
        });
    });

    // --- ROTAS DE CONFIGURAÇÃO ---
    describe('/quilo', () => {
         it('GET /quilo - Deve retornar 200 e 0 se o documento não existir', async () => {
            admin.mockGet.mockResolvedValue({ exists: false });
            const res = await request(server).get('/quilo');
            expect(res.statusCode).toBe(200);
            expect(res.body.precoKg).toBe(0);
        });
        
        it('GET /quilo - Deve retornar 200 se o documento existir', async () => {
            admin.mockGet.mockResolvedValue({ exists: true, data: () => ({precoKg: 55}) });
            const res = await request(server).get('/quilo');
            expect(res.statusCode).toBe(200);
            expect(res.body.precoKg).toBe(55);
        });

        it('GET /quilo - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockGet.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).get('/quilo');
            expect(res.statusCode).toBe(500);
        });
        
        it('POST /quilo - Deve retornar 400 para preço inválido', async () => {
            const res = await request(server).post('/quilo').send({ precoKg: 'abc' });
            expect(res.statusCode).toBe(400);
        });
        
        it('POST /quilo - Deve retornar 500 se o Firestore falhar', async () => {
            admin.mockSet.mockRejectedValue(new Error('Falha no DB'));
            const res = await request(server).post('/quilo').send({ precoKg: 60 });
            expect(res.statusCode).toBe(500);
        });
    });

    // --- ROTA DE LOGIN ---
    describe('/login', () => {
        it('POST /login - Deve retornar 401 para credenciais inválidas', async () => {
            const res = await request(server).post('/login').send({ usuario: 'atendente', senha: 'senha_errada' });
            expect(res.statusCode).toBe(401);
        });
    });
});
