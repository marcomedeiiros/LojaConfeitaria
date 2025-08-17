let avaliacoes = [];
let favoritos = [];
let carrinho = [];
let produtos = [];

const todosBotoes = document.querySelectorAll(".category-btn");

const API_PRODUTOS_URL = "http://localhost:3000/produtos";
const API_AVALIACOES_URL = "http://localhost:3000/avaliacoes";

const badgeFavoritos = document.getElementById("badge-favoritos");
const badgeCarrinho = document.getElementById("badge-carrinho");

function atualizarBadges() {
  badgeFavoritos.textContent = favoritos.length;
  badgeCarrinho.textContent = carrinho.length;
}

atualizarBadges();

document.addEventListener("click", (e) => {
  if (e.target.closest(".favorite-btn")) {
    const btn = e.target.closest(".favorite-btn");
    const icon = btn.querySelector("i");
    const produtoId = Number(btn.closest(".product-card").getAttribute("data-id"));
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const index = favoritos.findIndex(f => f.id === produtoId);

    if (index === -1) {
      btn.classList.add("favoritado");
      icon.classList.remove("fa-heart-o");
      icon.classList.add("fa-heart");
      icon.style.color = "red";

      favoritos.push({
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        precoOriginal: produto.precoOriginal,
        desconto: produto.desconto || 0,
        quantidade: 1
      });
      mostrarPopup("Adicionado aos favoritos");
    } else {
      btn.classList.remove("favoritado");
      icon.classList.replace("fa-heart", "fa-heart-o");
      icon.style.color = "";
      favoritos.splice(index, 1);
      mostrarPopup("Removido dos favoritos");
    }

    atualizarBadges();
    atualizarLista("popup-favoritos");
    salvarFavoritosServidor();
  }

  if (e.target.closest(".product-button")) {
    const btn = e.target.closest(".product-button");
    const produtoId = Number(btn.closest(".product-card").getAttribute("data-id"));
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const carrinhoItem = carrinho.find(item => item.id === produtoId);
    if (carrinhoItem) {
      carrinhoItem.quantidade += 1;
    } else {
      carrinho.push({
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        precoOriginal: produto.precoOriginal,
        desconto: produto.desconto || 0,
        quantidade: 1
      });
    }

    atualizarListaCarrinho();
    atualizarBadges();
    salvarCarrinhoServidor();
    mostrarPopup("Adicionado ao carrinho");
  }
});

function mostrarPopup(mensagem) {
  let popup = document.createElement("div");
  popup.textContent = mensagem;
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.padding = "15px 25px";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  popup.style.fontSize = "16px";
  popup.style.zIndex = "9999";
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 1500);
}

function adicionarFavorito(item) {
  const itemId = item.id || item;
  if (!favoritos.includes(itemId)) favoritos.push(itemId);
  atualizarBadges();
  atualizarLista("popup-favoritos");
}

function adicionarCarrinho(item) {
  carrinho.push(item);
  atualizarBadges();
  atualizarListaCarrinho();
}

function abrirPopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;
  popup.style.display = "flex";
  setTimeout(() => popup.classList.add("ativo"), 10);
  if (id === "popup-carrinho") atualizarListaCarrinho();
  else atualizarLista(id);
}

function fecharPopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;
  popup.classList.remove("ativo");
  setTimeout(() => popup.style.display = "none", 500);
}

function removerCarrinho(id) {
  fetch(`http://localhost:3000/carrinho/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Erro ao remover item do carrinho');
      carrinho = carrinho.filter(item => item.id !== id);
      atualizarListaCarrinho();
      atualizarBadges();
    })
    .catch(err => console.error(err));
}

function removerFavorito(id) {
  favoritos = favoritos.filter(fav => fav.id !== id);
  atualizarLista("popup-favoritos");
  atualizarBadges();
  fetch('http://localhost:3000/favoritos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favoritos)
  })
    .then(res => res.json())
    .then(() => console.log('Favoritos atualizados no servidor'))
    .catch(err => console.error('Erro ao atualizar favoritos:', err));
}

function atualizarLista(idPopup) {
  const listaElement = document.getElementById(idPopup === "popup-favoritos" ? "lista-favoritos" : idPopup);
  if (!listaElement) return;

  listaElement.innerHTML = "";
  const lista = idPopup === "popup-favoritos" ? favoritos : carrinho;

  if (!lista || lista.length === 0) {
    listaElement.innerHTML = "<li>Nenhum item adicionado</li>";
    return;
  }

  lista.forEach(item => {
    const precoComDesconto = (item.precoOriginal * (1 - (item.desconto || 0) / 100))
      .toFixed(2).replace('.', ',');

    listaElement.innerHTML += `
  <li style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:5px;">
      <div style="display:flex; align-items:center; gap:10px;">
          <img src="${item.imagem}" alt="${item.nome}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
          <div>
              <strong>${item.nome}</strong><br>
              R$ ${precoComDesconto} ${item.desconto > 0 ? `<span style="color:red;">(-${item.desconto}%)</span>` : ""}
          </div>
      </div>
      <button onclick="removerFavorito(${item.id})" style="flex-shrink:0;">
        <i class="fa-solid fa-trash"></i>
    </button>
  </li>
`;
  });
}

function aplicarFavoritosUI() {
  favoritos.forEach(fav => {
    const card = document.querySelector(`.product-card[data-id="${fav.id}"]`);
    if (!card) return;

    const btn = card.querySelector(".favorite-btn");
    const icon = btn.querySelector("i");

    btn.classList.add("favoritado");
    icon.classList.remove("fa-heart-o");
    icon.classList.add("fa-heart");
    icon.style.color = "red";
  });
}

function atualizarListaCarrinho() {
  const listaElement = document.getElementById("lista-carrinho");
  if (!listaElement) return;

  listaElement.innerHTML = "";
  if (carrinho.length === 0) {
    listaElement.innerHTML = "<li>Nenhum item adicionado</li>";
    return;
  }

  carrinho.forEach(item => {
    const precoComDesconto = (
      item.precoOriginal * (1 - (item.desconto || 0) / 100) * item.quantidade
    ).toFixed(2).replace('.', ',');


    listaElement.innerHTML += `
      <li style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:5px;">
          <div style="display:flex; align-items:center; gap:10px;">
              <img src="${item.imagem}" alt="${item.nome}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
              <div>
                  <strong>${item.nome}</strong><br>
                  R$ ${precoComDesconto} ${item.desconto > 0 ? `<span style="color:red;">(-${item.desconto}%)</span>` : ""}
              </div>
          </div>
          <div class="carrinho-controles">
              <button onclick="alterarQuantidade(${item.id}, -1)">-</button>
              <span>${item.quantidade}</span>
              <button onclick="alterarQuantidade(${item.id}, 1)">+</button>
              <button onclick="removerCarrinho(${item.id})">
              <i class="fa-solid fa-trash"></i>
              </button>
          </div>
      </li>
    `;
  });
}

async function carregarFavoritos() {
  try {
    const res = await fetch('http://localhost:3000/favoritos');
    if (!res.ok) throw new Error('Erro ao carregar favoritos');
    const json = await res.json();

    favoritos = json.data || [];
    atualizarBadges();
    atualizarLista("popup-favoritos");
  } catch (err) {
    console.error(err);
    favoritos = [];
  }
}

function alterarQuantidade(produtoId, delta) {
  const item = carrinho.find(i => i.id === produtoId);
  if (!item) return;
  item.quantidade = (item.quantidade || 1) + delta;
  if (item.quantidade < 1) item.quantidade = 1;
  atualizarBadges();
  atualizarListaCarrinho();
  salvarCarrinhoServidor();
}

function salvarCarrinhoServidor() {
  fetch('http://localhost:3000/carrinho', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(carrinho)
  })
    .then(res => res.json())
    .then(() => console.log('Carrinho salvo no servidor'))
    .catch(err => console.error('Erro ao salvar carrinho:', err));
}

function salvarFavoritosServidor() {
  fetch('http://localhost:3000/favoritos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favoritos)
  })
    .then(res => res.json())
    .then(() => console.log('Favoritos salvos no servidor'))
    .catch(err => console.error('Erro ao salvar favoritos:', err));
}

document.querySelector('[title="Favoritos"]').addEventListener("click", () => abrirPopup("popup-favoritos"));
document.querySelector('[title="Carrinho"]').addEventListener("click", () => abrirPopup("popup-carrinho"));

document.querySelectorAll(".popup-fechar").forEach(btn => {
  btn.addEventListener("click", (e) => fecharPopup(e.target.getAttribute("data-target")));
});

document.querySelectorAll(".popup-close").forEach(btn => {
  btn.addEventListener("click", (e) => fecharPopup(e.target.getAttribute("data-target")));
});

const params = new URLSearchParams(window.location.search);
const idDoProduto = Number(params.get('id')) || 0;

function gerarBreadcrumb(produto) {
  const breadcrumbEl = document.getElementById("breadcrumb");
  if (!breadcrumbEl) return;
  breadcrumbEl.innerHTML = `
        <a href="index.html">Home</a> &gt;
        <a href="index.html?categoria=${encodeURIComponent(produto.categoria)}">${produto.categoria}</a> &gt;
        <span>${produto.nome}</span>
    `;
}

fetch(API_PRODUTOS_URL)
  .then(res => res.json())
  .then(resProdutos => {
    produtos = resProdutos;
    const produto = produtos.find(p => p.id == idDoProduto);
    if (produto) {
      gerarBreadcrumb(produto);
      document.title = produto.nome;
    } else {
      document.title = "Produto não encontrado";
    }
  });

async function carregarCarrinho() {
  const res = await fetch('http://localhost:3000/carrinho');
  const json = await res.json();
  carrinho = json.data || [];
  atualizarListaCarrinho();
}

function mostrarAvaliacoes() {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = '';
  const avaliacoesDoProduto = avaliacoes.filter(av => av.produtoId == idDoProduto);
  const numeroAvaliacoes = avaliacoesDoProduto.length;

  const estrelasEl = document.getElementById('estrelas-avaliacao');
  const numeroEl = document.getElementById('numero-avaliacoes');
  const linkOpinioesEl = document.getElementById('link-opinioes');

  if (numeroAvaliacoes === 0) {
    container.innerHTML = '<p>Seja o primeiro a avaliar este produto!</p>';
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
  for (let i = 0; i < estrelasCheias; i++) estrelasHtml += '<span style="color:#f39c12;">★</span>';
  if (temMeiaEstrela) estrelasHtml += '<span style="color:#f39c12;">☆</span>';
  for (let i = 0; i < estrelasVazias; i++) estrelasHtml += '<span style="color:#ccc;">☆</span>';

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
    const [resProdutos, resAvaliacoes] = await Promise.all([
      fetch(API_PRODUTOS_URL),
      fetch(API_AVALIACOES_URL)
    ]);

    if (!resProdutos.ok || !resAvaliacoes.ok) throw new Error('Erro ao carregar dados.');

    const produtosResp = await resProdutos.json();
    produtos = produtosResp;
    const avaliacoesData = await resAvaliacoes.json();

    const idAtual = parseInt(params.get("id"), 10);
    const produtosComAvaliacoes = produtos.map(prod => {
      const avs = avaliacoesData.filter(a => a.produtoId === prod.id);
      const media = avs.length > 0 ? avs.reduce((s, a) => s + a.rating, 0) / avs.length : 0;
      return { ...prod, avaliacao: media, totalAvaliacoes: avs.length };
    });

    const produtosFiltrados = produtosComAvaliacoes.filter(p => p.id !== idAtual);
    const container = document.querySelector('.products-container');
    if (!container) return;

    container.innerHTML = '';
    const produtosAleatorios = produtosFiltrados.sort(() => Math.random() - 0.5).slice(0, 9);

    produtosAleatorios.forEach(prd => {
      const precoFinal = (prd.precoOriginal * (1 - (prd.desconto || 0) / 100)).toFixed(2).replace('.', ',');
      const precoOriginalFormatado = prd.precoOriginal ? prd.precoOriginal.toFixed(2).replace('.', ',') : '';

      let estrelasHtml = '';
      for (let i = 0; i < 5; i++) {
        const diff = prd.avaliacao - i;
        if (diff >= 1) estrelasHtml += '<i class="fa fa-star" style="color:#f39c12;"></i>';
        else if (diff >= 0.5) estrelasHtml += '<i class="fa fa-star-half-o" style="color:#f39c12;"></i>';
        else estrelasHtml += '<i class="fa fa-star-o" style="color:#ccc;"></i>';
      }

      container.innerHTML += `
                <div class="product-card" tabindex="0" aria-label="${prd.nome}, preço R$${precoFinal}" data-id="${prd.id}">
                    ${prd.desconto > 0 ? `<div class="product-discount">-${prd.desconto}%</div>` : ""}
                    <button class="favorite-btn" aria-label="Favoritar ${prd.nome}"><i class="fa fa-heart-o"></i></button>
                    <a href="./mostruarioProduto.html?id=${prd.id}">
                        <img class="product-img" src="${prd.imagem}" alt="${prd.nome}" title="${prd.nome}" />
                        <div class="product-info">
                            <h3 class="product-name">${prd.nome}</h3>
                            <p class="product-description">${prd.descricao || ''}</p>
                            <div class="product-rating">${estrelasHtml}<span class="rating-count">(${prd.totalAvaliacoes})</span></div>
                            <p class="product-price">
                                ${prd.desconto > 0 ? `<span class="price-original">R$ ${precoOriginalFormatado}</span>` : ""}
                                R$ <span class="price-final">${precoFinal}</span>
                            </p>
                        </div>
                    </a>
                    <button class="product-button" type="button"><i class="fa fa-shopping-cart"></i> Adicionar ao Carrinho</button>
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
    if (!text || !rating) return alert('Por favor, preencha o comentário e a nota.');

    const novaAvaliacao = { produtoId: idDoProduto, text, rating, author: "Usuário" };

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

    } catch (err) { alert(err.message); }
  });
}

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

async function carregarProduto() {
  if (!idDoProduto) return alert("Produto não especificado.");

  try {
    const res = await fetch(API_PRODUTOS_URL);
    if (!res.ok) throw new Error("Erro ao carregar produtos.");

    produtos = await res.json();
    const produto = produtos.find(p => p.id == idDoProduto);
    if (!produto) return alert("Produto não encontrado.");

    const imgMainEl = document.getElementById("img-produto-main");
    if (imgMainEl) { imgMainEl.src = produto.imagem; imgMainEl.alt = produto.nome; }
    const nomeProdEl = document.getElementById("nome-produto");
    if (nomeProdEl) nomeProdEl.textContent = produto.nome;
    const descProdEl = document.getElementById("descricao-produto");
    if (descProdEl) descProdEl.textContent = produto.descricao;
    const imgBoxEl = document.getElementById("img-box-img");
    if (imgBoxEl) { imgBoxEl.src = produto.imagem; imgBoxEl.alt = produto.nome + " box image"; }

    const precoOriginal = produto.precoOriginal;
    const precoComDesconto = precoOriginal * (1 - produto.desconto / 100);
    const precoOriginalEl = document.getElementById("preco-original");
    const precoComDescEl = document.getElementById("preco-com-desconto");
    if (precoOriginalEl) precoOriginalEl.textContent = `R$ ${precoOriginal.toFixed(2).replace('.', ',')}`;
    if (precoComDescEl) precoComDescEl.textContent = `R$ ${precoComDesconto.toFixed(2).replace('.', ',')}`;

    const discountBadge = document.getElementById("discount-badge");
    if (discountBadge) discountBadge.style.display = (produto.desconto && produto.desconto > 0) ? "block" : "none";
    if (discountBadge) discountBadge.textContent = (produto.desconto && produto.desconto > 0) ? `-${produto.desconto}%` : "";

    gerarBreadcrumb(produto);

  } catch (error) { alert(error.message); }
}

window.addEventListener('DOMContentLoaded', async () => {
  await carregarSessaoGostar();
  await carregarFavoritos();
  await carregarSessaoGostar();
  aplicarFavoritosUI();
  await carregarCarrinho();
  atualizarListaCarrinho();
  atualizarBadges();
  carregarProduto();
  carregarAvaliacoes();
});