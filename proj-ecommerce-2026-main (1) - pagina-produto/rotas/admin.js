const express = require('express');
const appAdmin = express();
const db = require('../banco/database');
const upload = require('../util/imagens');

const emailCorreto = 'luizap@gmail.com';
const senhaCorreta = '1234';

//================== ROTAS DE LOGIN/INDEX ==================//
appAdmin.get('/index', (req, res) => {
    res.render('admin/index-admin');
});

appAdmin.get('/', (req, res) => {
    res.render('admin/login', { erro: null, email: '' });
});

appAdmin.post('/login', (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    if (email === emailCorreto && senha === senhaCorreta) {
        return res.redirect('/admin/index');
    }

    res.redirect('/admin/index');
});


//================== ROTAS DE CATEGORIAS ==================//
appAdmin.get('/categorias', (req, res) => {
    db.all(
        'SELECT * FROM categorias',
        [],
        function (erro, categorias) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao consultar categorias.');
            }
            db.all(
                'SELECT * FROM produtos',
                [],
                function (erro, produtos) {
                    if (erro) {
                        console.log(erro.message);
                        return res.send('Erro ao consultar pratos.');
                    }

                    categorias.forEach((categoria) => {
                        categoria.pratos = produtos.filter((produto) => {
                            return produto.categoria === categoria.nome;
                        });
                    });

                    res.render('admin/categorias', { categorias });
                }
            );
        }
    );
});

appAdmin.get('/categorias/form-cadastrar', (req, res) => {
    res.render('admin/categorias/cadastro');
});

appAdmin.post('/categorias/cadastrar', (req, res) => {
    const nome = req.body.nome;
    const descricao = req.body.descricao;

    db.run(
        `INSERT INTO categorias (nome, descricao) VALUES (?, ?)`,
        [nome, descricao],
        function (erro) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao cadastrar categoria.');
            }
            res.redirect('/admin/categorias');
        }
    );
});


//ROTA PARA CONSULTAR TODOS OS PRODUTOS
appAdmin.get('/produtos', (req, res) => {
    db.all(
        `SELECT p.*, r.nome AS restaurante
         FROM produtos p
         LEFT JOIN restaurantes r ON r.id = p.restaurante_id`,
        [],
        function (erro, produtos) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao consultar produtos.');
            }
            res.render('admin/produtos/lista', { produtos });
        }
    );
});

//ROTA PARA EXIBIR O FORMULÁRIO DE CADASTRO DE PRODUTOS
appAdmin.get('/produtos/form-cadastrar', (req, res) => {
    db.all(
        'SELECT nome FROM categorias ORDER BY nome',
        [],
        function (erro, categorias) {
            if (erro) {
                console.error('Erro ao consultar categorias:', erro.message);
                return res.status(500).send('Erro ao consultar categorias.');
            }
            res.render('admin/produtos/cadastro', { categorias });
        }
    );
});

appAdmin.post('/produtos/cadastrar', upload.single('imagem'), (req, res) => {
    const imagem = req.file ? req.file.filename : null;

    db.run(
        `INSERT INTO produtos
            (nome, categoria, valor, descricao, imagem, restaurante_id, calorias)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            req.body.nome,
            req.body.categoria,
            req.body.valor,
            req.body.descricao,
            imagem,
            req.body.restaurante_id,
            req.body.calorias
        ],
        function (erro) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao cadastrar produto.');
            }
            res.redirect('/admin/produtos');
        }
    );
});

appAdmin.post('/produtos/:id/excluir', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send('ID de produto inválido.');
    }

    db.run(
        'DELETE FROM produtos WHERE id = ?',
        [id],
        function (erro) {
            if (erro) {
                console.error('Erro ao excluir produto:', erro.message);
                return res.status(500).send('Erro ao excluir produto.');
            }

            if (this.changes === 0) {
                return res.status(404).send('Produto não encontrado.');
            }

            res.redirect('/admin/produtos');
        }
    );
});

module.exports = appAdmin;