const express = require('express');
const router = express.Router();
const db = require('../banco/database');

// Página inicial do cliente
router.get('/', (req, res) => {
    db.all('SELECT * FROM categorias ORDER BY nome', [], (erro, categorias) => {
        if (erro) {
            console.error(erro.message);
            return res.status(500).send('Não foi possível carregar as categorias.');
        }

        res.render('pagina-inicial/index', { categorias });
    });
});

router.get('/pratos', (req, res) => {
    const categoria = (req.query.categoria || '').trim();

    const sql = categoria
    ? 'SELECT * FROM produtos WHERE categoria = ? ORDER BY nome'
    : 'SELECT * FROM produtos ORDER BY nome';

    const params = categoria ? [categoria] : [];

    db.all(sql, params, (erro, produtos) => {
        if (erro) {
            console.error(erro.message);
            return res.status(500).send('Não foi possível carregar os pratos.');
        }

        db.all('SELECT * FROM categorias ORDER BY nome', [], (erroCategorias, categorias) => {
            if (erroCategorias) {
                console.error(erroCategorias.message);
                return res.status(500).send('Não foi possível carregar as categorias.');
            }

            res.render('cliente/pratos', {
                produtos,
                categorias,
                categoriaSelecionada: categoria
            });
        });
    });
});

router.get('/pratos/:id', (req, res) => {
    db.get(
        'SELECT * FROM produtos WHERE id = ?',
        [req.params.id],
        (erro, produto) => {
            if (erro) {
                console.error(erro.message);
                return res.status(500).send('Não foi possível carregar o prato.');
            }

            if (!produto) {
                return res.status(404).send('Prato não encontrado.');
            }

            res.render('cliente/detalhe-prato', { produto });
        }
    );
});



module.exports = router;
