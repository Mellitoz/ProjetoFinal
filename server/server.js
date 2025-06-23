const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('../firebase/firebase-config.json');

// Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const itensRef = db.collection('itens');
const comandasRef = db.collection('comandas');
const configRef = db.collection('config');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('client'));


/* =====================================
   ROTA DE LOGIN (NOVO)
===================================== */
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    // Lógica de autenticação simples (substituir por uma consulta ao DB no futuro)
    if (usuario === 'atendente' && senha === 'senha123') {
        // Em um app real, aqui você geraria um Token JWT
        res.json({ success: true, message: 'Login bem-sucedido!' });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});


/* =====================================
   ROTAS DE ITENS
===================================== */

// GET - Listar todos os itens
app.get('/itens', async (req, res) => {
  try {
    const snapshot = await itensRef.orderBy('nome').get();
    const itens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(itens);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar itens', error: err.message });
  }
});

// POST - Adicionar novo item
app.post('/itens', async (req, res) => {
  const { nome, tipo, preco } = req.body;
  try {
    const docRef = await itensRef.add({ nome, tipo, preco });
    res.status(201).json({ id: docRef.id, message: 'Item cadastrado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao cadastrar item', error: err.message });
  }
});

// PUT - Atualizar item
app.put('/itens/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, tipo, preco } = req.body;
  try {
    await itensRef.doc(id).update({ nome, tipo, preco });
    res.json({ message: 'Item atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar item', error: err.message });
  }
});

// DELETE - Excluir item
app.delete('/itens/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await itensRef.doc(id).delete();
    res.json({ message: 'Item excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir item', error: err.message });
  }
});

/* =====================================
   ROTAS DE COMANDAS
===================================== */

// GET - Listar todas as comandas (ROTA ADICIONADA)
app.get('/comandas', async (req, res) => {
    try {
        const snapshot = await comandasRef.get();
        const comandas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(comandas);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar comandas', error: err.message });
    }
});


// POST - Registrar nova comanda
app.post('/comandas', async (req, res) => {
  const dados = req.body;

  if (!dados) {
    return res.status(400).json({ message: 'Corpo do pedido em falta ou malformado.' });
}

  if (!dados.numeroComanda) {
    return res.status(400).json({ message: 'Número da comanda é obrigatório.' });
  }
  // Verificar se já existe uma comanda com este número
  const snapshot = await comandasRef.where('numeroComanda', '==', dados.numeroComanda).get();
  if(!snapshot.empty){
    return res.status(400).json({message: `A comanda número ${dados.numeroComanda} já existe.`});
  }

  try {
    await comandasRef.add({
      numeroComanda: String(dados.numeroComanda),
      precoKg: dados.precoKg,
      peso: dados.peso,
      valorPrato: dados.valorPrato,
      extras: dados.extras, // Campo padronizado para 'extras'
      valorTotal: dados.valorTotal,
      data: admin.firestore.FieldValue.serverTimestamp() // Adiciona data de criação
    });

    res.status(201).json({ message: 'Comanda salva com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao salvar comanda', error: err.message });
  }
});

// GET - Buscar comanda por número
app.get('/comandas/:numeroComanda', async (req, res) => {
  const { numeroComanda } = req.params;
  try {
    const snapshot = await comandasRef.where('numeroComanda', '==', numeroComanda).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    const doc = snapshot.docs[0];
    const comanda = { id: doc.id, ...doc.data() };
    res.json(comanda);

  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar a comanda.', error: err.message });
  }
});

// DELETE - Excluir comanda por ID (ROTA ADICIONADA)
app.delete('/comandas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await comandasRef.doc(id).delete();
        res.json({ message: 'Comanda paga e removida com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao excluir a comanda.', error: err.message });
    }
});

/* =====================================
   ROTAS DE CONFIG - PREÇO DO QUILO
===================================== */

// GET - Obter o preço atual do quilo
app.get('/quilo', async (req, res) => {
  try {
    const doc = await configRef.doc('quilo').get();
    if (doc.exists) {
      res.json(doc.data());
    } else {
      res.json({ precoKg: 0 }); // Retorna 0 se não estiver definido
    }
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar preço do kg', error: err.message });
  }
});

// POST - Atualizar o preço do quilo
app.post('/quilo', async (req, res) => {

 if (!req.body) {
    return res.status(400).json({ message: 'Corpo do pedido em falta ou malformado.' });
  }

  try {
    let { precoKg } = req.body;
    precoKg = parseFloat(precoKg);

    if (isNaN(precoKg) || precoKg < 0) {
      return res.status(400).json({ message: 'Valor inválido para o preço do kg.' });
    }

    await configRef.doc('quilo').set({ precoKg });
    res.json({ message: 'Preço do kg atualizado com sucesso!', precoKg });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao salvar preço do kg', error: err.message });
  }
});

/* =====================================
   INICIAR SERVIDOR
===================================== */
const PORT = 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🔥 AssistFood rodando com Firebase na porta ${PORT}`);
    });
}

module.exports = app; 