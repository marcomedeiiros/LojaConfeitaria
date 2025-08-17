let textoPesquisa = "";
let categoriaAtual = "all";
let ordenacaoAtual = "nomeProduto";
let modoEdicao = false;
let idEditando = null;
let produtos = [];
let favoritos = [];

const containerProdutos = document.querySelector(".products-container");
const input = document.querySelector(".search-input");
const todosBotoes = document.querySelectorAll(".category-btn");
const modalAddProduto = document.getElementById("modalAddProduto");
const btnFecharModal = document.getElementById("btnFecharModal");
const formAddProduto = document.getElementById("formAddProduto");
const ordenarSelect = document.getElementById("ordenarSelect");
const badgeFavoritos = document.getElementById("badge-favoritos");

const API_URL = "http://localhost:3000/produtos";
const API_AVALIACOES_URL = "http://localhost:3000/avaliacoes";

async function carregarProdutos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao carregar produtos.");
    produtos = await res.json();
    mostrarProdutos();
  } catch (error) {
    alert(error.message);
  }
}

async function carregarAvaliacoes() {
  try {
    const res = await fetch(API_AVALIACOES_URL);
    if (!res.ok) throw new Error("Erro ao carregar avaliações");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function atualizarProdutosComAvaliacoes(avaliacoes) {

  const avaliacoesPorProduto = {};
  avaliacoes.forEach(av => {
    if (!avaliacoesPorProduto[av.produtoId]) {
      avaliacoesPorProduto[av.produtoId] = [];
    }
    avaliacoesPorProduto[av.produtoId].push(av.rating);
  });

  produtos = produtos.map(prod => {
    const avals = avaliacoesPorProduto[prod.id] || [];
    const soma = avals.reduce((acc, val) => acc + val, 0);
    const media = avals.length ? soma / avals.length : 0;
    return {
      ...prod,
      rating: media,
      avaliacoes: avals.length,
    };
  });
}

function atualizarBadges() {
  const badge = document.getElementById("badge-favoritos");
  if (badge) badge.textContent = favoritos.length;
}

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

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite-btn");
  if (!btn) return;

  const card = btn.closest(".product-card");
  if (!card) return;

  const produtoId = Number(card.dataset.id);
  const produto = produtos.find(p => p.id === produtoId);
  if (!produto) return;

  const icon = btn.querySelector("i");
  const index = favoritos.findIndex(f => f.id === produtoId);

  if (index === -1) {
    favoritos.push({
      id: produto.id,
      nome: produto.nome,
      imagem: produto.imagem,
      precoOriginal: produto.precoOriginal,
      desconto: produto.desconto || 0
    });
    btn.classList.add("favoritado");
    icon.classList.replace("fa-heart-o", "fa-heart");
    icon.style.color = "red";
    btn.setAttribute("aria-pressed", "true");
    mostrarPopup("Adicionado aos favoritos");
  } else {
    favoritos.splice(index, 1);
    btn.classList.remove("favoritado");
    icon.classList.replace("fa-heart", "fa-heart-o");
    icon.style.color = "";
    btn.setAttribute("aria-pressed", "false");
    mostrarPopup("Removido dos favoritos");
  }

  atualizarListaFavoritos();
  atualizarBadges();
  salvarFavoritosServidor();
});

function atualizarListaFavoritos() {
  const lista = document.getElementById("lista-favoritos");
  if (!lista) return;

  lista.innerHTML = "";
  if (favoritos.length === 0) {
    lista.innerHTML = "<li>Nenhum item adicionado</li>";
    return;
  }

  favoritos.forEach(fav => {
    const precoComDesconto = (fav.precoOriginal * (1 - (fav.desconto || 0) / 100))
      .toFixed(2).replace(".", ",");
    lista.innerHTML += `
      <li style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${fav.imagem}" alt="${fav.nome}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
          <div>
            <strong>${fav.nome}</strong><br>
            R$ ${precoComDesconto} ${fav.desconto > 0 ? `<span style="color:red;">(-${fav.desconto}%)</span>` : ""}
          </div>
        </div>
        <button onclick="removerFavorito(${fav.id})">
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

async function carregarFavoritos() {
  try {
    const res = await fetch("http://localhost:3000/favoritosinicio");
    if (!res.ok) throw new Error("Erro ao carregar favoritos");
    const json = await res.json();
    favoritos = json.data || [];
    atualizarBadges();
    atualizarListaFavoritos();
    aplicarFavoritosUI();
  } catch (err) {
    console.error(err);
    favoritos = [];
  }
}


document.querySelector('[title="Favoritos"]').addEventListener("click", () => {
  const popup = document.getElementById("popup-favoritos");
  if (!popup) return;
  popup.style.display = "flex";
  setTimeout(() => popup.classList.add("ativo"), 10);
  atualizarListaFavoritos();
});

function fecharPopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;
  popup.classList.remove("ativo");
  setTimeout(() => {
    popup.style.display = "none";
  }, 300);
}

function removerFavorito(id) {
  favoritos = favoritos.filter(fav => fav.id !== id);
  atualizarListaFavoritos();
  atualizarBadges();
  salvarFavoritosServidor();
  fetch('http://localhost:3000/favoritosinicio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favoritos)
  })
    .then(res => res.json())
    .then(() => console.log('Favoritos atualizados no servidor'))
    .catch(err => console.error('Erro ao atualizar favoritos:', err));
}

function salvarFavoritosServidor() {
  fetch('http://localhost:3000/favoritosinicio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favoritos)
  })
    .then(res => res.json())
    .then(() => console.log('Favoritos salvos no servidor'))
    .catch(err => console.error('Erro ao salvar favoritos:', err));
}

document.querySelectorAll(".popup-close").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const target = e.currentTarget.getAttribute("data-target");
    fecharPopup(target);
  });
});

async function carregarProdutos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao carregar produtos.");
    produtos = await res.json();

    const avaliacoes = await carregarAvaliacoes();
    atualizarProdutosComAvaliacoes(avaliacoes);

    mostrarProdutos();
  } catch (error) {
    alert(error.message);
  }
}

function mostrarProdutos() {
  let htmlProdutos = "";

  let produtosFiltrados = produtos.filter((prd) => {
    const passouCategoria =
      categoriaAtual === "all" || prd.categoria === categoriaAtual;
    const passouPesquisa = prd.nome
      .toLowerCase()
      .includes(textoPesquisa.toLowerCase());
    return passouPesquisa && passouCategoria;
  });

  produtosFiltrados.sort((a, b) => {
    switch (ordenacaoAtual) {
      case "nomeProduto":
        return a.nome.localeCompare(b.nome);
      case "maiorPreco":
        return b.preco - a.preco;
      case "menorPreco":
        return a.preco - b.preco;
      case "maisVendido":
        return (b.vendas || 0) - (a.vendas || 0);
      case "lancamento":
        return (
          new Date(b.dataLancamento || "1970-01-01") -
          new Date(a.dataLancamento || "1970-01-01")
        );
      default:
        return 0;
    }
  });

  produtosFiltrados.forEach((prd) => {
    const precoComDesconto = prd.precoOriginal * (1 - (prd.desconto || 0) / 100);
    const precoFinal = precoComDesconto.toFixed(2).replace(".", ",");
    const precoOriginalFormatado = prd.precoOriginal.toFixed(2).replace(".", ",");
    const rating = prd.rating || 0;
    const avaliacoes = prd.avaliacoes || 0;

    let estrelasHtml = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        estrelasHtml += `<i class="fa fa-star" style="color:#f5a623;"></i>`;
      } else if (i - rating < 1) {
        estrelasHtml += `<i class="fa fa-star-half-o" style="color:#f5a623;"></i>`;
      } else {
        estrelasHtml += `<i class="fa fa-star-o" style="color:#ccc;"></i>`;
      }
    }

    const isFavorito = favoritos.some(fav => fav.id === prd.id);

    htmlProdutos += `
  <div class="product-card" data-id="${prd.id}" tabindex="0" aria-label="${prd.nome}, preço R$${precoFinal}">
    ${prd.desconto > 0 ? `<div class="product-discount">-${prd.desconto}%</div>` : ""}

    <button class="favorite-btn" aria-label="Favoritar ${prd.nome}" aria-pressed="${isFavorito}">
      <i class="fa ${isFavorito ? "fa-heart" : "fa-heart-o"}" style="color:${isFavorito ? "red" : ""}"></i>
    </button>

    <a href="./mostruarioProduto.html?id=${prd.id}">
      <img class="product-img" src="${prd.imagem}" alt="${prd.nome}" title="${prd.nome}" />

      <div class="product-info">
        <h3 class="product-name">${prd.nome}</h3>
        <p class="product-description">${prd.descricao}</p>

        <div class="product-rating">
          ${estrelasHtml} <span class="rating-value">${rating.toFixed(1)}</span> (${avaliacoes})
        </div>

        <p class="product-price">
          ${prd.desconto > 0 ? `<span class="price-original">R$ ${precoOriginalFormatado}</span>` : ""}
          R$ <span class="price-final">${precoFinal}</span>
        </p>

        <div class="product-actions">
          <button class="edit-btn" data-id="${prd.id}">
            <i class="fa fa-pencil"></i> Editar
          </button>
          <button class="delete-btn" data-id="${prd.id}">
            <i class="fa fa-trash"></i> Remover
          </button>
        </div>

        <button class="product-button" type="button">
          <i class="fa fa-shopping-cart"></i> Comprar Agora
        </button>
      </div>
    </a>
  </div>
`;
  });

  htmlProdutos += `
    <div class="add-product-card" tabindex="0" role="button" aria-label="Adicionar produto" id="btnAdicionarProduto">
      <div class="add-product-content">
        <span>+</span>
        <p>Adicionar Produto</p>
      </div>
    </div>
  `;

  containerProdutos.innerHTML = htmlProdutos;

  const btnAdicionarProduto = document.getElementById("btnAdicionarProduto");
  if (btnAdicionarProduto) {
    btnAdicionarProduto.addEventListener("click", () => {
      modoEdicao = false;
      idEditando = null;
      formAddProduto.reset();
      modalAddProduto.style.display = "flex";
      formAddProduto.nome.focus();
    });
  }

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Tem certeza que deseja remover este produto?")) {
        try {
          const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Erro ao remover produto");
          produtos = produtos.filter(p => p.id != id);
          mostrarProdutos();
        } catch (error) {
          alert("Erro ao remover produto.");
        }
      }
    });
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const produto = produtos.find(p => p.id == id);
      if (!produto) return;

      modoEdicao = true;
      idEditando = id;

      formAddProduto.nome.value = produto.nome;
      formAddProduto.categoria.value = produto.categoria;
      formAddProduto.preco.value = produto.precoOriginal;
      formAddProduto.desconto.value = produto.desconto;
      formAddProduto.descricao.value = produto.descricao;
      formAddProduto.imagem.value = produto.imagem;

      modalAddProduto.style.display = "flex";
    });
  });
}

function getParameterByName(name) {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const productId = getParameterByName('id');

async function carregarProdutoPorId(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error('Produto não encontrado');
    const produto = await res.json();

    document.getElementById('img-produto').src = produto.imagem;
    document.getElementById('img-produto').alt = produto.nome;
    document.getElementById('nome-produto').textContent = produto.nome;
    document.getElementById('desc-produto').textContent = produto.descricao;
  } catch (error) {
    alert(error.message);
  }
}

if (productId) {
  carregarProdutoPorId(productId);
}

function adicionarEventosRemocao() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = parseInt(this.dataset.id);
      produtos = produtos.filter(prod => prod.id !== id);
      localStorage.setItem('produtos', JSON.stringify(produtos));
      mostrarProdutos();
    });
  });
}

function abrirModal() {
  modalAddProduto.style.display = "flex";
  formAddProduto.reset();
  formAddProduto.nome.focus();
}

function fecharModal() {
  modalAddProduto.style.display = "none";
}

function pesquisar() {
  textoPesquisa = input.value;
  mostrarProdutos();
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

async function adicionarProduto(event) {
  event.preventDefault();

  const nome = formAddProduto.nome.value.trim();
  const categoria = formAddProduto.categoria.value;
  const preco = parseFloat(formAddProduto.preco.value);
  const desconto = parseInt(formAddProduto.desconto.value) || 0;
  const descricao = formAddProduto.descricao.value.trim();
  const imagem = formAddProduto.imagem.value.trim();

  if (
    nome.length < 3 ||
    !categoria ||
    isNaN(preco) ||
    preco <= 0 ||
    desconto < 0 ||
    desconto > 100 ||
    descricao.length < 10 ||
    !imagem
  ) {
    alert(
      "Por favor, preencha todos os campos corretamente.\n- Nome com ao menos 3 caracteres\n- Categoria selecionada\n- Preço maior que zero\n- Desconto entre 0 e 100\n- Descrição com ao menos 10 caracteres\n- URL da imagem válida"
    );
    return;
  }

  const precoComDesconto = preco - preco * (desconto / 100);

  const novoProduto = {
    nome,
    categoria,
    preco: precoComDesconto,
    precoOriginal: preco,
    desconto,
    imagem,
    descricao,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novoProduto),
    });

    if (!res.ok) throw new Error("Erro ao salvar produto");

    const produtoCriado = await res.json();

    produtos.push(produtoCriado);
    fecharModal();
    mostrarProdutos();
  } catch (error) {
    alert("Erro ao adicionar produto.");
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await carregarProdutos();
  await carregarFavoritos();

  input.addEventListener("input", pesquisar);

  todosBotoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      trocarCategoria(botao.getAttribute("data-category"));
    });
  });

  btnFecharModal.addEventListener("click", fecharModal);

  modalAddProduto.addEventListener("click", (e) => {
    if (e.target === modalAddProduto) fecharModal();
  });

  ordenarSelect.addEventListener("change", () => {
    ordenacaoAtual = ordenarSelect.value;
    mostrarProdutos();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalAddProduto.style.display === "flex") {
      fecharModal();
    }
  });

  document.querySelector('[title="Favoritos"]').addEventListener("click", () => {
    const popup = document.getElementById("popup-favoritos");
    if (!popup) return;
    popup.style.display = "flex";
    setTimeout(() => popup.classList.add("ativo"), 10);
    atualizarListaFavoritos();
  });

  document.querySelectorAll(".popup-close").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget.getAttribute("data-target");
      fecharPopup(target);
    });
  });

  formAddProduto.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = formAddProduto.nome.value.trim();
    const categoria = formAddProduto.categoria.value;
    const preco = parseFloat(formAddProduto.preco.value);
    const desconto = parseInt(formAddProduto.desconto.value) || 0;
    const descricao = formAddProduto.descricao.value.trim();
    const imagem = formAddProduto.imagem.value.trim();

    if (
      nome.length < 3 ||
      !categoria ||
      isNaN(preco) ||
      preco <= 0 ||
      desconto < 0 ||
      desconto > 100 ||
      descricao.length < 10 ||
      !imagem
    ) {
      alert(
        "Por favor, preencha todos os campos corretamente.\n- Nome com ao menos 3 caracteres\n- Categoria selecionada\n- Preço maior que zero\n- Desconto entre 0 e 100\n- Descrição com ao menos 10 caracteres\n- URL da imagem válida"
      );
      return;
    }

    const precoComDesconto = preco - preco * (desconto / 100);

    const produtoDados = {
      nome,
      categoria,
      preco: precoComDesconto,
      precoOriginal: preco,
      desconto,
      imagem,
      descricao,
    };

    try {
      let res;
      if (modoEdicao) {
        res = await fetch(`${API_URL}/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produtoDados),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produtoDados),
        });
      }

      if (!res.ok) throw new Error(modoEdicao ? "Erro ao atualizar produto" : "Erro ao salvar produto");

      const produtoResposta = await res.json();

      if (modoEdicao) {
        const index = produtos.findIndex((p) => p.id == idEditando);
        produtos[index] = produtoResposta;
      } else {
        produtos.push(produtoResposta);
      }

      fecharModal();
      mostrarProdutos();
    } catch (error) {
      alert(modoEdicao ? "Erro ao atualizar produto." : "Erro ao adicionar produto.");
    }
  });

  ordenarSelect.value = ordenacaoAtual;
  ordenarSelect.addEventListener("change", () => {
    ordenacaoAtual = ordenarSelect.value;
    mostrarProdutos();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalAddProduto.style.display === "flex") {
      fecharModal();
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".slide");
  const leftArrow = document.querySelector(".left-arrow");
  const rightArrow = document.querySelector(".right-arrow");
  let currentIndex = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
    currentIndex = index;
  }

  function nextSlide() {
    let nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }

  function prevSlide() {
    let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(prevIndex);
  }

  leftArrow.addEventListener("click", () => {
    prevSlide();
    resetInterval();
  });

  rightArrow.addEventListener("click", () => {
    nextSlide();
    resetInterval();
  });

  function startInterval() {
    slideInterval = setInterval(nextSlide, 1000);
  }

  function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
  }

  showSlide(0);
  startInterval();
});