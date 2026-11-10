const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./banco/ecommerce.db', (erro) => {
    if (erro) {
        console.error('Erro ao conectar ao banco de dados:', erro.message);
    } else {
        console.log('Banco conectado.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS restaurantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT,
        senha TEXT,
        responsavel TEXT,
        telefone TEXT,
        endereco TEXT,
        descricao TEXT,
        criado_em DATETIME DEFAULT (datetime('now','localtime')),
        categoria_id INTEGER REFERENCES categorias(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT,
        valor FLOAT,
        estoque INTEGER DEFAULT 0,
        descricao TEXT,
        imagem TEXT,
        restaurante_id INTEGER REFERENCES restaurantes(id),
        calorias REAL,
        proteina REAL,
        carboidrato REAL,
        gordura REAL,
        vegano INTEGER NOT NULL DEFAULT 0,
        sem_gluten INTEGER NOT NULL DEFAULT 0,
        sem_lactose INTEGER NOT NULL DEFAULT 0,
        low_carb INTEGER NOT NULL DEFAULT 0,
        porcao_gramas INTEGER,
        disponivel_hoje INTEGER NOT NULL DEFAULT 1
    )`);
});


module.exports = db;