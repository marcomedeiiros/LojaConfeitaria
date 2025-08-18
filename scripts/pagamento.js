const API_CARRINHO_URL = "http://localhost:3000/carrinho";

async function carregarCarrinho() {
  try {
    const resposta = await fetch(API_CARRINHO_URL);
    const json = await resposta.json();
    const produtos = json.data; 

    const lista = document.getElementById("carrinho");
    lista.innerHTML = ""; 

    let total = 0;
    let totalItens = 0;

    produtos.forEach(produto => {
      const precoComDesconto = produto.precoOriginal * (1 - (produto.desconto || 0) / 100);
      const li = document.createElement("li");
      li.textContent = `${produto.nome} x${produto.quantidade} - R$ ${precoComDesconto.toFixed(2).replace('.', ',')}`;
      lista.appendChild(li);

      total += precoComDesconto * produto.quantidade;
      totalItens += produto.quantidade;
    });

    document.getElementById("total-itens").innerText = totalItens;
    document.getElementById("total-final").innerText = total.toFixed(2).replace('.', ',');

  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
  }
}

function simularPagamento() {
  alert("✅ Pagamento simulado com sucesso!");
  const status = document.getElementById('status-pagamento');
  status.textContent = "Status: Pago";
  status.classList.remove('pendente');
  status.classList.add('pago');
}

carregarCarrinho();