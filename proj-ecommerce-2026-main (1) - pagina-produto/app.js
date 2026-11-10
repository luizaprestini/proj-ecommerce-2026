const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./banco/database');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'segredo_super_secreto',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    const carrinho = req.session.carrinho || [];
    res.locals.quantidadeCarrinho = carrinho.reduce(
        (total, item) => total + item.quantidade,
        0
    );
    next();
});

app.get('/', (req, res) => {
    db.all('SELECT * FROM categorias ORDER BY nome', [], (erro, categorias) => {
        if (erro) {
            console.error('Erro ao carregar categorias da página inicial:', erro.message);
            return res.status(500).send('Não foi possível carregar as categorias.');
        }

        res.render('pagina-inicial/index', {
            titulo: 'Página Inicial',
            categorias
        });
    });
});

const appCarrinho = require('./rotas/rotas-carrinho');
app.use('/carrinho', appCarrinho);

const clientRoutes = require('./rotas/cliente');
app.use('/', clientRoutes);

const adminRoutes = require('./rotas/admin');
app.use('/admin', adminRoutes);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
}

module.exports = app;