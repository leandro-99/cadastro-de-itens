const express = require('express');
const router = express.Router();
const connection = require('../config/database');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Rota para servir a página inicial
router.get('/', (req, res) => {
    const filePath = path.join(__dirname, '..', 'views', 'index.html');
    res.sendFile(filePath);
});

// Middleware para verificar se o usuário está logado
function verificarLogin(req, res, next) {
    if (req.session.usuario) {
        next(); // Se estiver logado, permite o acesso à próxima rota
    } else {
        res.redirect('/login'); // Se não estiver logado, redireciona para o login
    }
}

// Rota para servir a página de login
router.get('/login', (req, res) => {
    const filePath = path.join(__dirname, '..', 'views', 'login.html');
    res.sendFile(filePath);
});

// Rota para processar o login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Verifique as credenciais no banco de dados
    connection.query('SELECT * FROM usuario WHERE email = ? AND senha = ?',
        [email, senha], (err, results) => {
            if (err) {
                console.error('Erro ao consultar usuário:', err);
                res.send('Erro ao fazer login.');
            } else {
                if (results.length > 0) {
                    // Cria a sessão do usuário
                    req.session.usuario = results[0];
                    console.log('Login bem-sucedido!');
                    res.redirect('/lista-itens'); // Redireciona para a lista de itens
                } else {
                    console.log('Credenciais inválidas.');
                    res.send('Credenciais inválidas.');
                }
            }
        });
});

// Rota para servir a página de registro
router.get('/cadastro', (req, res) => {
    const filePath = path.join(__dirname, '..', 'views', 'register.html');
    res.sendFile(filePath);
});

// Rota para lidar com o envio do formulário de cadastro
router.post('/cadastrar', (req, res) => {
    const { nome, email, senha } = req.body;

    // Insira os dados no banco de dados
    connection.query('INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, senha], (err, results) => {
            if (err) {
                console.error('Erro ao inserir usuário:', err);
                res.send('Erro ao cadastrar usuário.');
            } else {
                console.log('Usuário cadastrado com sucesso!');
                res.redirect('/login');
                // Feche a conexão após a inserção ser concluída
                connection.end();
            }
        });
});

// Rota para servir a página de redefinição de senha
router.get('/redefinir-senha', (req, res) => {
    const filePath = path.join(__dirname, '..', 'views', 'reset_pass.html');
    res.sendFile(filePath);
});

// Rota para processar a solicitação de redefinição de senha
router.post('/redefinir-senha', (req, res) => {
    const { email } = req.body;

    // Aqui você pode adicionar lógica para enviar um e-mail de redefinição de senha
    console.log('Solicitação de redefinição de senha para o email:', email);
    res.send('Se o e-mail estiver registrado, um link de redefinição de senha será enviado.');
});

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seu-email@gmail.com',
        pass: 'sua-senha'
    }
});

// Rota para processar a solicitação de redefinição de senha
router.post('/redefinir-senha', (req, res) => {
    const { email } = req.body;

    // Verificar se o e-mail está cadastrado no banco de dados
    connection.query('SELECT * FROM usuario WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Erro ao consultar usuário:', err);
            res.send('Erro ao solicitar redefinição de senha.');
            return;
        }

        if (results.length === 0) {
            // Se o e-mail não estiver cadastrado, informe ao usuário
            res.send('E-mail não cadastrado.');
            return;
        }

        // Gerar um token de redefinição
        const token = crypto.randomBytes(20).toString('hex');
        const expirationDate = Date.now() + 3600000; // O token expira em 1 hora

        // Armazenar o token e a data de expiração no banco de dados
        connection.query('UPDATE usuario SET reset_token = ?, reset_token_expiration = ? WHERE email = ?',
            [token, expirationDate, email], (err, results) => {
                if (err) {
                    console.error('Erro ao atualizar usuário:', err);
                    res.send('Erro ao solicitar redefinição de senha.');
                    return;
                }

                // Enviar o e-mail
                const mailOptions = {
                    from: 'seu-email@gmail.com',
                    to: email,
                    subject: 'Redefinição de Senha',
                    text: `Você está recebendo este e-mail porque recebemos uma solicitação de redefinição de senha para sua conta.\n\n` +
                        `Clique no link a seguir para redefinir sua senha:\n\n` +
                        `http://localhost:3000/redefinir-senha/${token}\n\n` +
                        `Se você não solicitou uma redefinição de senha, ignore este e-mail.\n`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Erro ao enviar e-mail:', error);
                        res.send('Erro ao enviar e-mail de redefinição de senha.');
                    } else {
                        console.log('E-mail enviado:', info.response);
                        res.send('Se o e-mail estiver registrado, um link de redefinição de senha será enviado.');
                    }
                });
            });
    });
});

// Rota para servir a página de redefinição de senha com o token
router.get('/redefinir-senha/:token', (req, res) => {
    const { token } = req.params;

    // Verificar o token e sua validade
    connection.query('SELECT * FROM usuario WHERE reset_token = ? AND reset_token_expiration > ?',
        [token, Date.now()], (err, results) => {
            if (err) {
                console.error('Erro ao verificar token:', err);
                res.send('Erro ao verificar token.');
                return;
            }

            if (results.length > 0) {
                // Exibir a página de redefinição de senha
                res.sendFile(path.join(__dirname, '..', 'views', 'new_pass.html'));
            } else {
                res.send('Token inválido ou expirado.');
            }
        });
});

// Rota para processar a nova senha
router.post('/nova-senha', (req, res) => {
    const { token, nova_senha } = req.body;

    // Verificar o token e atualizar a senha
    connection.query('SELECT * FROM usuario WHERE reset_token = ? AND reset_token_expiration > ?',
        [token, Date.now()], (err, results) => {
            if (err) {
                console.error('Erro ao verificar token:', err);
                res.send('Erro ao verificar token.');
                return;
            }

            if (results.length > 0) {
                // Atualizar a senha e limpar o token
                connection.query('UPDATE usuario SET senha = ?, reset_token = NULL, reset_token_expiration = NULL WHERE reset_token = ?',
                    [nova_senha, token], (err, results) => {
                        if (err) {
                            console.error('Erro ao atualizar senha:', err);
                            res.send('Erro ao redefinir senha.');
                        } else {
                            res.send('Senha redefinida com sucesso.');
                        }
                    });
            } else {
                res.send('Token inválido ou expirado.');
            }
        });
});

// Exporta o roteador para ser usado no arquivo principal
module.exports = router;
