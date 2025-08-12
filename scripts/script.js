let textoPesquisa = "";
let categoriaAtual = "all";
let ordenacaoAtual = "nomeProduto"; // ordenação inicial
let modoEdicao = false;
let idEditando = null;
let produtos = [];

const containerProdutos = document.querySelector(".products-container");
const input = document.querySelector(".search-input");
const todosBotoes = document.querySelectorAll(".category-btn");
const modalAddProduto = document.getElementById("modalAddProduto");
const btnFecharModal = document.getElementById("btnFecharModal");
const formAddProduto = document.getElementById("formAddProduto");
const ordenarSelect = document.getElementById("ordenarSelect");

const API_URL = "http://localhost:3000/produtos"; // backend

// Carrega os produtos do backend
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

function mostrarProdutos() {
  let htmlProdutos = "";

  // Filtra produtos conforme busca e categoria
  let produtosFiltrados = produtos.filter((prd) => {
    const passouCategoria =
      categoriaAtual === "all" || prd.categoria === categoriaAtual;
    const passouPesquisa = prd.nome
      .toLowerCase()
      .includes(textoPesquisa.toLowerCase());
    return passouPesquisa && passouCategoria;
  });

  // Ordena produtos conforme opção selecionada
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

  // Cria cards para cada produto
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

    htmlProdutos += `
      <div class="product-card" tabindex="0" aria-label="${prd.nome}, preço R$${precoFinal}">
        ${prd.desconto > 0 ? `<div class="product-discount">-${prd.desconto}%</div>` : ""}
        
        <button class="favorite-btn" aria-label="Favoritar ${prd.nome}">
          <i class="fa fa-heart-o"></i>
        </button>

        <a href="./mostruarioProduto.html?id=${prd.id}">
        <img class="product-img" src="${prd.imagem}" alt="${prd.nome}" title="${prd.nome}" />
        </a>

        
        <div class="product-info">
          <h3 class="product-name">${prd.nome}</h3>
          <p class="product-description">${prd.descricao}</p>

          <div class="product-rating">
            ${estrelasHtml} <span class="rating-value">${rating.toFixed(1)}</span> (${avaliacoes})
          </div>

          <p class="product-price">
            ${prd.desconto > 0
        ? `<span class="price-original">R$ ${precoOriginalFormatado}</span>`
        : ""
      }
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
            <i class="fa fa-shopping-cart"></i> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
  });

  // Card para adicionar produto
  htmlProdutos += `
    <div class="add-product-card" tabindex="0" role="button" aria-label="Adicionar produto" id="btnAdicionarProduto">
      <div class="add-product-content">
        <span>+</span>
        <p>Adicionar Produto</p>
      </div>
    </div>
  `;

  containerProdutos.innerHTML = htmlProdutos;

  // Abrir modal para adicionar
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

  // Remover produto
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

  // Editar produto
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


// Função para pegar o parâmetro da URL
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

      // Supondo que sua lista de produtos esteja no array `produtos`
      produtos = produtos.filter(prod => prod.id !== id);

      // Se estiver usando localStorage
      localStorage.setItem('produtos', JSON.stringify(produtos));

      // Re-renderiza os produtos
      renderizarProdutos();
    });
  });

  adicionarEventosRemocao();
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

// Adiciona produto via API POST
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

window.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();

  input.addEventListener("input", pesquisar);

  todosBotoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const categoria = botao.getAttribute("data-category");
      trocarCategoria(categoria);
    });
  });

  btnFecharModal.addEventListener("click", fecharModal);

  modalAddProduto.addEventListener("click", (e) => {
    if (e.target === modalAddProduto) {
      fecharModal();
    }
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

  // Inicializa
  showSlide(0);
  startInterval();
});