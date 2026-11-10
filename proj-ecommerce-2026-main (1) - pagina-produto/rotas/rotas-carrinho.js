const express = require('express');
const appCarrinho = express();
const db = require('../banco/database');

// O carrinho na sessão é uma lista de itens: [{ id: 3, quantidade: 2 }, ...]
function obterCarrinho(req) {
    if (!req.session.carrinho) {
        req.session.carrinho = [];
    }
    return req.session.carrinho;
}

// Busca no banco os pratos cujos ids estão no carrinho
function buscarProdutos(ids, callback) {
    if (ids.length === 0) {
        return callback(null, []);
    }
    const marcadores = ids.map(() => '?').join(', ');
    db.all(
        `SELECT * FROM produtos WHERE id IN (${marcadores})`,
        ids,
        callback
    );
}

//================= VER CARRINHO =====================
appCarrinho.get('/', (req, res) => {
    const carrinho = obterCarrinho(req);
    const ids = carrinho.map(item => item.id);

    buscarProdutos(ids, function (erro, produtosBanco) {
        if (erro) {
            console.log(erro.message);
            return res.status(500).send('Erro ao consultar o carrinho.');
        }

        // Junta cada prato com a sua quantidade e calcula o valor parcial
        const itens = [];
        carrinho.forEach(function (item) {
            const produto = produtosBanco.find(p => p.id === item.id);
            if (produto) {
                itens.push({
                    produto: produto,
                    quantidade: item.quantidade,
                    subtotal: produto.valor * item.quantidade
                });
            }
        });

        const total = itens.reduce((soma, item) => soma + item.subtotal, 0);
        const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

        res.render('cliente/carrinho', { itens, total, totalItens });
    });
});

//================= ADICIONAR (ou aumentar quantidade) =====================
appCarrinho.post('/adicionar/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.redirect('/carrinho');
    }

    db.get(
        'SELECT id FROM produtos WHERE id = ?',
        [id],
        function (erro, produto) {
            if (erro) {
                console.log(erro.message);
                return res.status(500).send('Erro ao adicionar ao carrinho.');
            }

            const carrinho = obterCarrinho(req);
            const item = carrinho.find(i => i.id === id);

            if (item) {
                item.quantidade += 1;
            } else {
                carrinho.push({ id: id, quantidade: 1 });
            }

            res.redirect('/carrinho');
        }
    );
});

//================= DIMINUIR QUANTIDADE =====================
appCarrinho.post('/diminuir/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const carrinho = obterCarrinho(req);
    const item = carrinho.find(i => i.id === id);

    if (item) {
        item.quantidade -= 1;
        if (item.quantidade <= 0) {
            req.session.carrinho = carrinho.filter(i => i.id !== id);
        }
    }

    res.redirect('/carrinho');
});

//================= REMOVER =====================
appCarrinho.post('/remover/:id', (req, res) => {
    const id = parseInt(req.params.id);
    req.session.carrinho = obterCarrinho(req).filter(i => i.id !== id);
    res.redirect('/carrinho');
});

//================= ESVAZIAR =====================
appCarrinho.post('/limpar', (req, res) => {
    req.session.carrinho = [];
    res.redirect('/carrinho');
});

module.exports = appCarrinho;