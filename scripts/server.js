const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

const arquivoProdutos = path.join(__dirname, '../data/produtos.json');
const arquivoAvaliacoes = path.join(__dirname, '../data/avaliacoes.json');
const arquivoCarrinho = path.join(__dirname, '../data/carrinho.json');
const arquivoFavoritos = path.join(__dirname, '../data/favoritos.json');

app.use(cors());
app.use(express.json());

app.get('/carrinho', (req, res) => {
  fs.readFile(arquivoCarrinho, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json({ data: [] });
      return res.status(500).json({ erro: 'Erro ao ler arquivo carrinho' });
    }
    try {
      const carrinho = JSON.parse(data);
      res.json(carrinho);
    } catch {
      res.json({ data: [] });
    }
  });
});

app.post('/carrinho', (req, res) => {
  const novoCarrinho = { data: req.body }; 
  fs.writeFile(arquivoCarrinho, JSON.stringify(novoCarrinho, null, 2), (err) => {
    if (err) return res.status(500).json({ erro: 'Erro ao salvar carrinho' });
    res.json({ status: 'ok' });
  });
});

app.get('/favoritos', (req, res) => {
  fs.readFile(arquivoFavoritos, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json({ data: [] });
      return res.status(500).json({ erro: 'Erro ao ler arquivo favoritos' });
    }
    try {
      const favoritos = JSON.parse(data);
      res.json(favoritos);
    } catch {
      res.json({ data: [] });
    }
  });
});

app.post('/favoritos', (req, res) => {
  const novosFavoritos = { data: req.body };
  fs.writeFile(arquivoFavoritos, JSON.stringify(novosFavoritos, null, 2), (err) => {
    if (err) return res.status(500).json({ erro: 'Erro ao salvar favoritos' });
    res.json({ status: 'ok' });
  });
});

app.get('/produtos', (req, res) => {
  fs.readFile(arquivoProdutos, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo produtos:', err);
      return res.status(500).json({ erro: 'Erro ao ler arquivo produtos' });
    }
    res.json(JSON.parse(data));
  });
});

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

app.get('/avaliacoes', (req, res) => {
  fs.readFile(arquivoAvaliacoes, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]); 
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