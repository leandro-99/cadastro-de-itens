const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');


const app = express();
const port = 3000;

// Configuração do middleware de sessão
app.use(session({
    secret: '145236987125478963',
    resave: false,
    saveUninitialized: false
}));

// Middleware para lidar com dados do formulário
app.use(bodyParser.urlencoded({ extended: false }));

// Servindo arquivos estáticos
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('routes', './routes');

// Importa e usa os roteadores
const indexRoutes = require('./routes/index');
const itensRoutes = require('./routes/itens');
app.use('/', indexRoutes);
app.use('/', itensRoutes);

// Inicie o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
