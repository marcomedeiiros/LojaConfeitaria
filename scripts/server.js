const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

const arquivoProdutos = path.join(__dirname, '../data/produtos.json');
const arquivoAvaliacoes = path.join(__dirname, '../data/avaliacoes.json');

app.use(cors());
app.use(express.json());

// --- Produtos ---

// GET todos os produtos
app.get('/produtos', (req, res) => {
  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo produtos:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo produtos' });
    }
    res.json(JSON.parse(data));
  });
});

// POST novo produto
app.post('/produtos', (req, res) => {
  const novoProduto = req.body;

  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo produtos:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo produtos' });
    }

    let produtos = JSON.parse(data);
    novoProduto.id = produtos.length > 0 ? produtos[produtos.length - 1].id + 1 : 1;
    produtos.push(novoProduto);

    fs.writeFile(arquivoProdutos, JSON.stringify(produtos, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar produto:', err);
        return res.status(500).json({ erro: 'Erro ao salvar produto' });
      }
      res.status(201).json(novoProduto);
    });
  });
});

// DELETE produto
app.delete('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo produtos:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo produtos' });
    }

    let produtos = JSON.parse(data);
    const novoArray = produtos.filter(p => p.id !== id);

    if (novoArray.length === produtos.length)
      return res.status(404).json({ erro: 'Produto não encontrado' });

    fs.writeFile(arquivoProdutos, JSON.stringify(novoArray, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar arquivo produtos:', err);
        return res.status(500).json({ erro: 'Erro ao salvar arquivo produtos' });
      }
      res.status(204).send();
    });
  });
});

// PUT editar produto
app.put('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const produtoAtualizado = req.body;

  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo produtos:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo produtos' });
    }

    let produtos = JSON.parse(data);
    const index = produtos.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ erro: 'Produto não encontrado' });

    produtos[index] = { id, ...produtoAtualizado };

    fs.writeFile(arquivoProdutos, JSON.stringify(produtos, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar produto:', err);
        return res.status(500).json({ erro: 'Erro ao salvar produto' });
      }
      res.json(produtos[index]);
    });
  });
});

// --- Avaliações ---

// GET todas as avaliações
app.get('/avaliacoes', (req, res) => {
  fs.readFile(arquivoAvaliacoes, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]); // arquivo não existe
      console.error('Erro ao ler arquivo avaliações:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo avaliações' });
    }
    try {
      const avaliacoes = JSON.parse(data);
      res.json(avaliacoes);
    } catch (parseErr) {
      console.error('Erro ao parsear avaliações:', parseErr);
      res.status(500).json({ erro: 'Erro ao interpretar arquivo avaliações' });
    }
  });
});

// POST nova avaliação
app.post('/avaliacoes', (req, res) => {
  const novaAvaliacao = req.body;

  if (!novaAvaliacao.produtoId || !novaAvaliacao.rating || !novaAvaliacao.text) {
    return res.status(400).json({ erro: 'Faltando dados obrigatórios: produtoId, rating, text' });
  }

  fs.readFile(arquivoAvaliacoes, 'utf8', (err, data) => {
    let avaliacoes = [];

    if (!err) {
      try {
        avaliacoes = JSON.parse(data);
      } catch {
        avaliacoes = [];
      }
    } else if (err.code !== 'ENOENT') {
      console.error('Erro ao ler arquivo avaliações:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo avaliações' });
    }

    novaAvaliacao.id = avaliacoes.length > 0 ? avaliacoes[avaliacoes.length - 1].id + 1 : 1;
    avaliacoes.push(novaAvaliacao);

    fs.writeFile(arquivoAvaliacoes, JSON.stringify(avaliacoes, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar avaliação:', err);
        return res.status(500).json({ erro: 'Erro ao salvar avaliação' });
      }
      console.log('Avaliação salva:', novaAvaliacao);
      res.status(201).json(novaAvaliacao);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});