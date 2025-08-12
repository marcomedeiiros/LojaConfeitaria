let avaliacoes = [];
const todosBotoes = document.querySelectorAll(".category-btn");

const API_PRODUTOS_URL = "http://localhost:3000/produtos";
const API_AVALIACOES_URL = "http://localhost:3000/avaliacoes";

// 🔹 Definindo params e idDoProduto logo no início
const params = new URLSearchParams(window.location.search);
const idDoProduto = Number(params.get('id')) || 0;
const categoria = params.get('categoria') || '';
const produtoId = params.get("id"); // mantive pq você usa mais abaixo


function gerarBreadcrumb(produto) {
  const breadcrumbEl = document.getElementById("breadcrumb");
  if (!breadcrumbEl) return;
  breadcrumbEl.innerHTML = `
    <a href="index.html">Home</a> &gt;
    <a href="index.html?categoria=${encodeURIComponent(produto.categoria)}">${produto.categoria}</a> &gt;
    <span>${produto.nome}</span>
  `;
}

// Busca título via API + gera breadcrumb
fetch(API_PRODUTOS_URL)
  .then(res => res.json())
  .then(produtos => {
    const produto = produtos.find(p => p.id == idDoProduto);
    if (produto) {
      gerarBreadcrumb(produto);
      document.title = produto.nome;
    } else {
      document.title = "Produto não encontrado";
    }
  });

// Pega parâmetro na URL (função extra que você tinha)
function getParameterByName(name) {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function mostrarAvaliacoes() {
  const container = document.getElementById('reviews-container');
  container.innerHTML = '';

  const avaliacoesDoProduto = avaliacoes.filter(av => av.produtoId == idDoProduto);
  const numeroAvaliacoes = avaliacoesDoProduto.length;

  if (numeroAvaliacoes === 0) {
    container.innerHTML = '<p>Seja o primeiro a avaliar este produto!</p>';
    document.getElementById('numero-avaliacoes').textContent = '0';
    document.getElementById('estrelas-avaliacao').innerHTML = '☆☆☆☆☆';
    document.getElementById('link-opinioes').textContent = '0 OPINIÕES';
    return;
  }

  const somaNotas = avaliacoesDoProduto.reduce((acc, av) => acc + av.rating, 0);
  const media = somaNotas / numeroAvaliacoes;

  const estrelasCheias = Math.floor(media);
  const temMeiaEstrela = (media - estrelasCheias) >= 0.5;
  const estrelasVazias = 5 - estrelasCheias - (temMeiaEstrela ? 1 : 0);

  let estrelasHtml = '';
  for (let i = 0; i < estrelasCheias; i++) {
    estrelasHtml += '<span style="color:#f39c12;">★</span>';
  }
  if (temMeiaEstrela) {
    estrelasHtml += '<span style="color:#f39c12;">☆</span>';
  }
  for (let i = 0; i < estrelasVazias; i++) {
    estrelasHtml += '<span style="color:#ccc;">☆</span>';
  }

  document.getElementById('estrelas-avaliacao').innerHTML = estrelasHtml;
  document.getElementById('numero-avaliacoes').textContent = numeroAvaliacoes;
  document.getElementById('link-opinioes').textContent = `${numeroAvaliacoes} OPINIÃO${numeroAvaliacoes > 1 ? 'ES' : ''}`;

  avaliacoesDoProduto.forEach(av => {
    const stars = "★".repeat(av.rating) + "☆".repeat(5 - av.rating);
    const div = document.createElement('div');
    div.classList.add('review-item');
    div.style.borderBottom = '1px solid #ccc';
    div.style.padding = '10px 0';
    div.innerHTML = `
      <div><strong>${av.author || "Anônimo"}</strong></div>
      <div style="color: #f39c12;">${stars}</div>
      <div>${av.text}</div>
    `;
    container.appendChild(div);
  });
}

// Busca avaliações do backend
async function carregarAvaliacoes() {
  try {
    const res = await fetch(API_AVALIACOES_URL);
    if (!res.ok) throw new Error('Erro ao carregar avaliações');
    avaliacoes = await res.json();
    mostrarAvaliacoes();
  } catch (err) {
    console.error(err);
    const container = document.getElementById('reviews-container');
    container.innerHTML = '<p>Erro ao carregar avaliações.</p>';
  }
}

// Listener para enviar avaliação
const reviewForm = document.getElementById('review-form');
reviewForm.addEventListener('submit', async e => {
  e.preventDefault();

  const text = document.getElementById('review-text').value.trim();
  const rating = parseInt(document.getElementById('review-rating').value);

  if (!text || !rating) {
    alert('Por favor, preencha o comentário e a nota.');
    return;
  }

  const novaAvaliacao = {
    produtoId: idDoProduto,
    text,
    rating,
    author: "Usuário"
  };

  try {
    const res = await fetch(API_AVALIACOES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaAvaliacao),
    });

    if (!res.ok) throw new Error('Erro ao enviar avaliação');

    avaliacoes.push(novaAvaliacao);
    mostrarAvaliacoes();
    reviewForm.reset();

  } catch (err) {
    alert(err.message);
  }
});

function trocarCategoria(categoria) {
  categoriaAtual = categoria;

  todosBotoes.forEach((botao) => {
    botao.classList.remove("active");
    if (botao.getAttribute("data-category") === categoria) {
      botao.classList.add("active");
    }
  });

  mostrarProdutos();
}

// Zoom imagem
const imgMain = document.querySelector('.product-main-image > img');
imgMain.addEventListener('mousemove', e => {
  const rect = imgMain.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const xPercent = (x / rect.width) * 100;
  const yPercent = (y / rect.height) * 100;

  imgMain.style.transformOrigin = `${xPercent}% ${yPercent}%`;
  imgMain.style.transform = 'scale(1.5)';
  imgMain.style.transition = 'transform 0.1s ease-out';
});
imgMain.addEventListener('mouseleave', () => {
  imgMain.style.transformOrigin = 'center center';
  imgMain.style.transform = 'scale(1)';
  imgMain.style.transition = 'transform 0.3s ease-in';
});

// Carregar produto
async function carregarProduto() {
  if (!idDoProduto) {
    alert("Produto não especificado.");
    return;
  }

  try {
    const res = await fetch(API_PRODUTOS_URL);
    if (!res.ok) throw new Error("Erro ao carregar produtos.");

    const produtos = await res.json();
    const produto = produtos.find(p => p.id == idDoProduto);

    if (!produto) {
      alert("Produto não encontrado.");
      return;
    }

    // Atualiza informações visuais
    document.getElementById("img-produto-main").src = produto.imagem;
    document.getElementById("img-produto-main").alt = produto.nome;
    document.getElementById("nome-produto").textContent = produto.nome;
    document.getElementById("descricao-produto").textContent = produto.descricao;
    document.getElementById("img-box-img").src = produto.imagem;
    document.getElementById("img-box-img").alt = produto.nome + " box image";

    // Atualiza preços
    const precoOriginal = produto.precoOriginal;
    const precoComDesconto = precoOriginal * (1 - produto.desconto / 100);

    document.getElementById("preco-original").textContent = `R$ ${precoOriginal.toFixed(2).replace('.', ',')}`;
    document.getElementById("preco-com-desconto").textContent = `R$ ${precoComDesconto.toFixed(2).replace('.', ',')}`;

    const discountBadge = document.getElementById("discount-badge");
    if (produto.desconto && produto.desconto > 0) {
      discountBadge.textContent = `-${produto.desconto}%`;
      discountBadge.style.display = "block";
    } else {
      discountBadge.style.display = "none";
    }

    // 🔹 Gera breadcrumb dinâmico com base no produto carregado
    gerarBreadcrumb(produto);

  } catch (error) {
    alert(error.message);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  carregarProduto();
  carregarAvaliacoes();
});