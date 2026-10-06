const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const app = express();
const port = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET não configurada; as sessões serão invalidadas ao reiniciar o servidor.');
}

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    name: 'pratocheio.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000
    }
}));

//rota para a página inicial do site principal
app.get('/', (req, res) => {
    res.render('index');
});

//importa as rotas admin
const appAdmin = require('./rotas/admin');
app.use('/admin', appAdmin);


if (require.main === module) {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
}

module.exports = app;