const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const arquivoProdutos = path.join(__dirname, 'produtos.json');

app.use(cors());
app.use(express.json());

// GET todos os produtos
app.get('/produtos', (req, res) => {
  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler arquivo' });
    res.json(JSON.parse(data));
  });
});

// POST novo produto
app.post('/produtos', (req, res) => {
  const novoProduto = req.body;

  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler arquivo' });

    let produtos = JSON.parse(data);

    novoProduto.id = produtos.length > 0 ? produtos[produtos.length - 1].id + 1 : 1;

    produtos.push(novoProduto);

    fs.writeFile(arquivoProdutos, JSON.stringify(produtos, null, 2), (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar produto' });
      res.status(201).json(novoProduto);
    });
  });
});


// DELETE novo produto
app.delete('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler arquivo' });

    let produtos = JSON.parse(data);

    const novoArray = produtos.filter(p => p.id !== id);

    if (novoArray.length === produtos.length)
      return res.status(404).json({ erro: 'Produto não encontrado' });

    fs.writeFile(arquivoProdutos, JSON.stringify(novoArray, null, 2), (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar arquivo' });
      res.status(204).send();
    });
  });
});

// editar produtos
app.put('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const produtoAtualizado = req.body;

  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler arquivo' });

    let produtos = JSON.parse(data);

    const index = produtos.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ erro: 'Produto não encontrado' });

    produtos[index] = { id, ...produtoAtualizado };

    fs.writeFile(arquivoProdutos, JSON.stringify(produtos, null, 2), (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar produto' });
      res.json(produtos[index]);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});