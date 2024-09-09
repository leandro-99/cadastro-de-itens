const express = require('express');
const router = express.Router();
const path = require('path');
const connection = require('../config/database'); // Importa a conexão com o banco de dados

// Middleware para verificar se o usuário está logado
function verificarLogin(req, res, next) {
  if (req.session.usuario) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Rota para servir a página de lista de itens (protegida pelo middleware)
router.get('/lista-itens', verificarLogin, (req, res) => {
  const filePath = path.join(__dirname, '..', 'views', 'list_item.html');
  res.sendFile(filePath);
});

// Rota para buscar os itens do banco de dados
router.get('/itens', (req, res) => {
  // Verifique se o usuário está logado
  if (!req.session.usuario) {
    return res.status(401).send('Você precisa estar logado para ver seus itens.');
  }

  const usuarioId = req.session.usuario.id;

  connection.query('SELECT * FROM itens WHERE usuario_id = ?', [usuarioId], (err, results) => {
    
    if (err) {
      console.error('Erro ao buscar itens:', err);
      res.status(500).send('Erro ao buscar itens.');
    } else {
      res.json(results);
    }
  });
});

// Rota para servir a página de edição de item 
router.get('/editar-item/:id', verificarLogin, (req, res) => {
  const itemId = req.params.id;

  // Busque os dados do item no banco de dados
  connection.query('SELECT * FROM itens WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar item para edição:', err);
      res.status(500).send('Erro ao buscar item para edição.');
    } else {
      if (results.length > 0) {
        const item = results[0];
        res.render('edit_item', { item }); // Renderize a view 'editar_item' e passe os dados do item
      } else {
        res.status(404).send('Item não encontrado.');
      }
    }
  });
});

// Rota para lidar com o envio do formulário de cadastro de item
router.post('/cadastrar-item', verificarLogin, (req, res) => {
  const { nome, descricao, preco } = req.body;
  const usuarioId = req.session.usuario.id;

  // Insira os dados no banco de dados
  connection.query('INSERT INTO itens (nome, descricao, preco, usuario_id) VALUES (?, ?, ?, ?)',
    [nome, descricao, preco, usuarioId], (err, results) => {
      if (err) {
        console.error('Erro ao inserir item:', err);
        res.send('Erro ao cadastrar item.');
      } else {
        console.log('Item cadastrado com sucesso!');
        res.redirect('/lista-itens');
      }
    });
});

// Rota para lidar com o envio do formulário de edição de item
router.post('/atualizar-item/:id', verificarLogin, (req, res) => {
  const itemId = req.params.id;
  const { nome, descricao, preco } = req.body;

  // Atualize os dados do item no banco de dados
  connection.query('UPDATE itens SET nome = ?, descricao = ?, preco = ? WHERE id = ?',
    [nome, descricao, preco, itemId], (err, results) => {
      if (err) {
        console.error('Erro ao atualizar item:', err);
        res.send('Erro ao atualizar item.');
      } else {
        console.log('Item atualizado com sucesso!');
        res.redirect('/lista-itens');
      }
    });
});

// Rota para deletar um item
router.delete('/deletar-item/:id', verificarLogin, (req, res) => {
  const itemId = req.params.id;

  connection.query('DELETE FROM itens WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Erro ao deletar item:', err);
      res.status(500).send('Erro ao deletar item.');
    } else {
      console.log('Item deletado com sucesso!');
      res.sendStatus(200);
    }
  });
});

// Rota para servir a página de cadastro de itens (protegida pelo middleware)
router.get('/cadastro-itens', verificarLogin, (req, res) => {
  const filePath = path.join(__dirname, '..', 'views', 'register_item.html');
  res.sendFile(filePath);
});

// Exporta o roteador para ser usado no arquivo principal
module.exports = router;
