const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./banco/ecommerce.db', (erro) => {
    if (erro) {
        console.error('Erro ao conectar ao banco de dados:', erro.message);
    } else {
        console.log('Banco conectado.');
    }
});

const criarTabelas = [
    `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em DATETIME DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS restaurantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT,
        senha TEXT,
        responsavel TEXT,
        telefone TEXT,
        endereco TEXT,
        criado_em DATETIME DEFAULT (datetime('now','localtime')),
        descricao TEXT,
        categoria_id INTEGER REFERENCES categorias(id),
        usuario_id INTEGER REFERENCES usuarios(id)
    )`,

    
    `CREATE TABLE IF NOT EXISTS produtos (
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
    )`
];

const adicionarColunas = (tabela, definicoes, callback) => {
    db.all(`PRAGMA table_info(${tabela})`, (erroConsulta, colunas) => {
        if (erroConsulta) {
            console.error(`Erro ao verificar a tabela ${tabela}:`, erroConsulta.message);
            return;
        }

        const existentes = new Set(colunas.map((coluna) => coluna.name));
        const proximaColuna = (indice) => {
            if (indice >= definicoes.length) {
                return callback();
            }

            const [nome, definicao] = definicoes[indice];
            if (existentes.has(nome)) {
                return proximaColuna(indice + 1);
            }

            db.run(`ALTER TABLE ${tabela} ADD COLUMN ${definicao}`, (erroAlteracao) => {
                if (erroAlteracao) {
                    console.error(`Erro ao adicionar ${nome} em ${tabela}:`, erroAlteracao.message);
                    return;
                }
                existentes.add(nome);
                proximaColuna(indice + 1);
            });
        };

        proximaColuna(0);
    });
};

db.serialize(() => {
    const criarProximaTabela = (indice) => {
        if (indice >= criarTabelas.length) {
            return migrarRestaurantes();
        }

        db.run(criarTabelas[indice], (erro) => {
            if (erro) {
                console.error('Erro ao criar estrutura do banco de dados:', erro.message);
                return;
            }
            criarProximaTabela(indice + 1);
        });
    };

    const migrarRestaurantes = () => {
        adicionarColunas('restaurantes', [
            ['email', 'email TEXT'],
            ['senha', 'senha TEXT'],
            ['responsavel', 'responsavel TEXT'],
            ['telefone', 'telefone TEXT'],
            ['endereco', 'endereco TEXT'],
            ['criado_em', "criado_em DATETIME DEFAULT (datetime('now','localtime'))"],
            ['descricao', 'descricao TEXT'],
            ['categoria_id', 'categoria_id INTEGER REFERENCES categorias(id)'],
            ['usuario_id', 'usuario_id INTEGER REFERENCES usuarios(id)']
        ], migrarProdutos);
    };

    const migrarProdutos = () => {
        adicionarColunas('produtos', [
            ['categoria', 'categoria TEXT'],
            ['valor', 'valor FLOAT'],
            ['estoque', 'estoque INTEGER DEFAULT 0'],
            ['descricao', 'descricao TEXT'],
            ['imagem', 'imagem TEXT'],
            ['restaurante_id', 'restaurante_id INTEGER REFERENCES restaurantes(id)'],
            ['calorias', 'calorias REAL'],
            ['proteina', 'proteina REAL'],
            ['carboidrato', 'carboidrato REAL'],
            ['gordura', 'gordura REAL'],
            ['vegano', 'vegano INTEGER NOT NULL DEFAULT 0'],
            ['sem_gluten', 'sem_gluten INTEGER NOT NULL DEFAULT 0'],
            ['sem_lactose', 'sem_lactose INTEGER NOT NULL DEFAULT 0'],
            ['low_carb', 'low_carb INTEGER NOT NULL DEFAULT 0'],
            ['porcao_gramas', 'porcao_gramas INTEGER'],
            ['disponivel_hoje', 'disponivel_hoje INTEGER NOT NULL DEFAULT 1']
        ], migrarVinculosExistentes);
    };

    const migrarVinculosExistentes = () => {
        db.run(`
            UPDATE restaurantes
            SET categoria_id = (
                SELECT c.id
                FROM categorias c
                WHERE c.nome = restaurantes.nome
                  AND IFNULL(c.descricao, '') = IFNULL(restaurantes.descricao, '')
            )
            WHERE categoria_id IS NULL
              AND (
                  SELECT COUNT(*)
                  FROM categorias c
                  WHERE c.nome = restaurantes.nome
                    AND IFNULL(c.descricao, '') = IFNULL(restaurantes.descricao, '')
              ) = 1
              AND (
                  SELECT COUNT(*)
                  FROM restaurantes r
                  WHERE r.nome = restaurantes.nome
                    AND IFNULL(r.descricao, '') = IFNULL(restaurantes.descricao, '')
              ) = 1
        `, (erroVinculo) => {
            if (erroVinculo) {
                console.error('Erro ao vincular restaurantes às categorias existentes:', erroVinculo.message);
                return;
            }

            db.run(`
                UPDATE produtos
                SET restaurante_id = (
                    SELECT r.id
                    FROM restaurantes r
                    WHERE r.nome = produtos.categoria
                )
                WHERE restaurante_id IS NULL
                  AND (
                      SELECT COUNT(*)
                      FROM restaurantes r
                      WHERE r.nome = produtos.categoria
                  ) = 1
            `, (erroProdutos) => {
                if (erroProdutos) {
                    console.error('Erro ao migrar produtos para classificação por restaurante:', erroProdutos.message);
                }
            });
        });
    };

    criarProximaTabela(0);
});

module.exports = db;
