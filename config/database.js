const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

// Verifica se o banco de dados existe
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
    } else {
        console.log('Conectado ao MySQL com sucesso!');

        // Verifica se o banco de dados existe
        const dbName = 'banco';
        connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
            if (err) {
                console.error('Erro ao criar o banco de dados:', err);
            } else {
                console.log(`Banco de dados '${dbName}' criado ou já existente.`);

                // Usa o banco de dados
                connection.query(`USE ${dbName}`);

                // Cria a tabela 'usuario'
                connection.query(`
          CREATE TABLE IF NOT EXISTS usuario (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL
          )
        `, (err) => {
                    if (err) {
                        console.error('Erro ao criar a tabela "usuario":', err);
                    } else {
                        console.log('Tabela "usuario" criada ou já existente.');
                    }
                });

                // Cria a tabela 'itens'
                connection.query(`
          CREATE TABLE IF NOT EXISTS itens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            preco DECIMAL(10, 2) NOT NULL,
            usuario_id INT,
            FOREIGN KEY (usuario_id) REFERENCES usuario(id)
          )
        `, (err) => {
                    if (err) {
                        console.error('Erro ao criar a tabela "itens":', err);
                    } else {
                        console.log('Tabela "itens" criada ou já existente.');
                    }
                });
            }
        });
    }
});

// Exporta a conexão para ser usada em outros arquivos
module.exports = connection; 