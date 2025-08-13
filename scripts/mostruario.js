let avaliacoes = [];
const todosBotoes = document.querySelectorAll(".category-btn");

const API_PRODUTOS_URL = "http://localhost:3000/produtos";
const API_AVALIACOES_URL = "http://localhost:3000/avaliacoes";

const params = new URLSearchParams(window.location.search);
const idDoProduto = Number(params.get('id')) || 0;
const categoria = params.get('categoria') || '';
const produtoId = params.get("id"); 

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
  if (!container) return;  // Segurança extra

  container.innerHTML = '';

  const avaliacoesDoProduto = avaliacoes.filter(av => av.produtoId == idDoProduto);
  const numeroAvaliacoes = avaliacoesDoProduto.length;

  if (numeroAvaliacoes === 0) {
    container.innerHTML = '<p>Seja o primeiro a avaliar este produto!</p>';
    const numeroEl = document.getElementById('numero-avaliacoes');
    const estrelasEl = document.getElementById('estrelas-avaliacao');
    const linkOpinioesEl = document.getElementById('link-opinioes');
    if (numeroEl) numeroEl.textContent = '0';
    if (estrelasEl) estrelasEl.innerHTML = '☆☆☆☆☆';
    if (linkOpinioesEl) linkOpinioesEl.textContent = '0 OPINIÕES';
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
    // Usar uma meia estrela real seria ideal, mas como você usa '☆' para meia, mantive.
    estrelasHtml += '<span style="color:#f39c12;">☆</span>';
  }
  for (let i = 0; i < estrelasVazias; i++) {
    estrelasHtml += '<span style="color:#ccc;">☆</span>';
  }

  const estrelasEl = document.getElementById('estrelas-avaliacao');
  const numeroEl = document.getElementById('numero-avaliacoes');
  const linkOpinioesEl = document.getElementById('link-opinioes');

  if (estrelasEl) estrelasEl.innerHTML = estrelasHtml;
  if (numeroEl) numeroEl.textContent = numeroAvaliacoes;
  if (linkOpinioesEl) linkOpinioesEl.textContent = `${numeroAvaliacoes} OPINIÃO${numeroAvaliacoes > 1 ? 'ES' : ''}`;

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
    if (container) container.innerHTML = '<p>Erro ao carregar avaliações.</p>';
  }
}

async function carregarSessaoGostar() {
  try {
    // Busca produtos e avaliações
    const [resProdutos, resAvaliacoes] = await Promise.all([
      fetch(API_PRODUTOS_URL),
      fetch(API_AVALIACOES_URL)
    ]);

    if (!resProdutos.ok || !resAvaliacoes.ok) {
      throw new Error('Erro ao carregar dados.');
    }

    const produtos = await resProdutos.json();
    const avaliacoes = await resAvaliacoes.json();

    // ID do produto atual (da URL)
    const params = new URLSearchParams(window.location.search);
    const idAtual = parseInt(params.get("id"), 10);

    // Junta produtos com suas avaliações
    const produtosComAvaliacoes = produtos.map(prod => {
      const avs = avaliacoes.filter(a => a.produtoId === prod.id);
      const media =
        avs.length > 0
          ? avs.reduce((soma, av) => soma + av.rating, 0) / avs.length
          : 0;

      return {
        ...prod,
        avaliacao: media,
        totalAvaliacoes: avs.length
      };
    });

    // Filtra para não mostrar o produto atual
    const produtosFiltrados = produtosComAvaliacoes.filter(
      p => p.id !== idAtual
    );

    // Seleciona container
    const container = document.querySelector('.products-container');
    if (!container) return;

    container.innerHTML = '';

    // Pega produtos aleatórios
    const produtosAleatorios = produtosFiltrados
      .sort(() => Math.random() - 0.5)
      .slice(0, 9);

    // Monta cards
    produtosAleatorios.forEach(prd => {
      const precoFinal = (prd.precoOriginal * (1 - (prd.desconto || 0) / 100))
        .toFixed(2).replace('.', ',');

      const precoOriginalFormatado = prd.precoOriginal
        ? prd.precoOriginal.toFixed(2).replace('.', ',')
        : '';

      let estrelasHtml = '';
      for (let i = 0; i < 5; i++) {
        const diff = prd.avaliacao - i;
        if (diff >= 1) estrelasHtml += '<i class="fa fa-star" style="color:#f39c12;"></i>';
        else if (diff >= 0.5) estrelasHtml += '<i class="fa fa-star-half-o" style="color:#f39c12;"></i>';
        else estrelasHtml += '<i class="fa fa-star-o" style="color:#ccc;"></i>';
      }

      container.innerHTML += `
        <div class="product-card" tabindex="0" aria-label="${prd.nome}, preço R$${precoFinal}">
          ${prd.desconto > 0 ? `<div class="product-discount">-${prd.desconto}%</div>` : ""}

          <button class="favorite-btn" aria-label="Favoritar ${prd.nome}">
            <i class="fa fa-heart-o"></i>
          </button>

          <a href="./mostruarioProduto.html?id=${prd.id}">
            <img class="product-img" src="${prd.imagem}" alt="${prd.nome}" title="${prd.nome}" />
          

          <div class="product-info">
            <h3 class="product-name">${prd.nome}</h3>
            <p class="product-description">${prd.descricao || ''}</p>

            <div class="product-rating">
              ${estrelasHtml}
              <span class="rating-count">(${prd.totalAvaliacoes})</span>
            </div>

            <p class="product-price">
              ${prd.desconto > 0 ? `<span class="price-original">R$ ${precoOriginalFormatado}</span>` : ""}
              R$ <span class="price-final">${precoFinal}</span>
            </p>
            </a>
            <button class="product-button" type="button">
              <i class="fa fa-shopping-cart"></i> Adicionar ao Carrinho
            </button>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error(error);
  }
}

const reviewForm = document.getElementById('review-form');
if (reviewForm) {
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
}

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
if (imgMain) {
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
}

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
    const imgMainEl = document.getElementById("img-produto-main");
    if (imgMainEl) {
      imgMainEl.src = produto.imagem;
      imgMainEl.alt = produto.nome;
    }
    const nomeProdEl = document.getElementById("nome-produto");
    if (nomeProdEl) nomeProdEl.textContent = produto.nome;
    const descProdEl = document.getElementById("descricao-produto");
    if (descProdEl) descProdEl.textContent = produto.descricao;
    const imgBoxEl = document.getElementById("img-box-img");
    if (imgBoxEl) {
      imgBoxEl.src = produto.imagem;
      imgBoxEl.alt = produto.nome + " box image";
    }

    // Atualiza preços
    const precoOriginal = produto.precoOriginal;
    const precoComDesconto = precoOriginal * (1 - produto.desconto / 100);

    const precoOriginalEl = document.getElementById("preco-original");
    if (precoOriginalEl) precoOriginalEl.textContent = `R$ ${precoOriginal.toFixed(2).replace('.', ',')}`;
    const precoComDescEl = document.getElementById("preco-com-desconto");
    if (precoComDescEl) precoComDescEl.textContent = `R$ ${precoComDesconto.toFixed(2).replace('.', ',')}`;

    const discountBadge = document.getElementById("discount-badge");
    if (discountBadge) {
      if (produto.desconto && produto.desconto > 0) {
        discountBadge.textContent = `-${produto.desconto}%`;
        discountBadge.style.display = "block";
      } else {
        discountBadge.style.display = "none";
      }
    }

    gerarBreadcrumb(produto);

  } catch (error) {
    alert(error.message);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  carregarProduto();
  carregarAvaliacoes();
  carregarSessaoGostar();
});