// Função para carregar os dados do arquivo JSON
async function carregarDados() {
  try {
    const response = await fetch("dados.json");
    const data = await response.json();
    return data; // Retorna os dados do JSON
  } catch (error) {
    console.error("Erro ao carregar dados.json:", error);
    return null; // Retorna null caso ocorra um erro
  }
}

// Função para buscar as coordenadas com base no código informado
async function buscarCoordenadas() {
  const dados = await carregarDados();
  if (!dados) return;

  let codigo = document.getElementById("codigo").value.trim().toUpperCase();
  document.getElementById("codigo").value = codigo;

  // Busca o local em "lotes" ou "quintas"
  const local = dados.lotes[codigo] || dados.quintas[codigo];

  if (!local) {
    document.getElementById("erroMensagem").classList.remove("hidden");
    document.getElementById("sugestoesPopup").classList.add("hidden"); // Esconde o popup de sugestões
    document.getElementById("resultado").classList.add("hidden");

    // Limpa o campo de input se o código for inválido
    document.getElementById("codigo").value = "";

    return;
  }

  document.getElementById("erroMensagem").classList.add("hidden");
  const googleMapsUrl = `https://www.google.com/maps?q=${local.latitude},${local.longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${local.latitude},${local.longitude}&navigate=yes`;

  document.getElementById("googleMapsBtn").href = googleMapsUrl;
  document.getElementById("wazeBtn").href = wazeUrl;

  document.getElementById("resultado").classList.remove("hidden");

  // Limpa QR Codes anteriores e gera novos
  document.getElementById("qrcodeGoogle").innerHTML = "";
  document.getElementById("qrcodeWaze").innerHTML = "";

  new QRCode(document.getElementById("qrcodeGoogle"), googleMapsUrl);
  new QRCode(document.getElementById("qrcodeWaze"), wazeUrl);

  // Resetando o dropdown para o valor inicial
  document.getElementById("areascomuns-dropdown").value = "";
}

// Função para mostrar sugestões conforme o usuário digita
async function mostrarSugestoes() {
  const dados = await carregarDados();
  if (!dados) return;

  let input = document.getElementById("codigo").value.trim().toUpperCase();

  // Se não houver nada digitado, oculta o popup de sugestões
  if (input.length === 0) {
    document.getElementById("sugestoesPopup").classList.add("hidden");
    return;
  }

  // Filtra os códigos em lotes e quintas que começam com o texto digitado
  // Excluímos os códigos que já foram digitados por completo (iguais ao input)
  const sugestoesLotes = Object.keys(dados.lotes).filter(
    (cod) => cod.startsWith(input) && cod !== input
  );
  const sugestoesQuintas = Object.keys(dados.quintas).filter(
    (cod) => cod.startsWith(input) && cod !== input
  );

  const sugestoes = [...sugestoesLotes, ...sugestoesQuintas];

  exibirSugestoes(sugestoes);
}

// Função para exibir as sugestões em um popup
function exibirSugestoes(sugestoes) {
  const sugestoesPopup = document.getElementById("sugestoesPopup");
  const sugestoesList = document.getElementById("sugestoesList");

  // Limpa as sugestões anteriores
  sugestoesList.innerHTML = "";

  if (sugestoes.length === 0) {
    sugestoesPopup.classList.add("hidden");
    return;
  }

  // Cria um <li> para cada sugestão e adiciona um evento de clique
  sugestoes.forEach((sugestao) => {
    const li = document.createElement("li");
    li.textContent = sugestao;
    li.onclick = () => selecionarSugestao(sugestao);
    sugestoesList.appendChild(li);
  });

  // Força o scroll para o topo do popup sempre que ele for exibido
  sugestoesPopup.scrollTop = 0;

  // Exibe o popup de sugestões
  sugestoesPopup.classList.remove("hidden");
}

// Função chamada ao clicar em uma sugestão
function selecionarSugestao(sugestao) {
  document.getElementById("codigo").value = sugestao;
  document.getElementById("sugestoesPopup").classList.add("hidden");
  // Opcional: chama a busca automaticamente após a seleção
  buscarCoordenadas();
}

// Evento para fechar o popup de sugestões caso o usuário clique fora do container
document.addEventListener("click", function (event) {
  const container = document.querySelector(".input-group");
  if (!container.contains(event.target)) {
    document.getElementById("sugestoesPopup").classList.add("hidden");
  }
});

// Carregar dados e preencher o dropdown de áreas comuns
document.addEventListener("DOMContentLoaded", function () {
  fetch("dados.json")
    .then((response) => response.json())
    .then((data) => {
      const dropdown = document.getElementById("areascomuns-dropdown");

      // Iterando sobre as chaves do objeto 'areascomuns'
      for (let area in data.areascomuns) {
        if (data.areascomuns.hasOwnProperty(area)) {
          const option = document.createElement("option");
          option.value = area; // A chave como valor
          option.textContent = area.charAt(0).toUpperCase() + area.slice(1); // Capitaliza o nome da área
          dropdown.appendChild(option);
        }
      }

      // Adicionar evento de mudança para gerar links e QR Codes
      dropdown.addEventListener("change", function (e) {
        // Esconde a mensagem de erro se ela estiver visível
        const erroMensagem = document.getElementById("erroMensagem");
        if (!erroMensagem.classList.contains("hidden")) {
          erroMensagem.classList.add("hidden");
        }

        const selectedArea = e.target.value;
        const linksContainer = document.getElementById("resultado");
        linksContainer.classList.add("hidden"); // Esconde links e QR Code enquanto não há seleção

        // Apaga o conteúdo do input de lotes
        document.getElementById("codigo").value = "";

        if (selectedArea) {
          const area = data.areascomuns[selectedArea];

          // Gera as URLs do Google Maps e Waze
          const googleMapsUrl = `https://www.google.com/maps?q=${area.latitude},${area.longitude}`;
          const wazeUrl = `https://waze.com/ul?ll=${area.latitude},${area.longitude}&navigate=yes`;

          // Atualiza os links
          document.getElementById("googleMapsBtn").href = googleMapsUrl;
          document.getElementById("wazeBtn").href = wazeUrl;

          // Limpa QR Codes anteriores e gera novos
          document.getElementById("qrcodeGoogle").innerHTML = "";
          document.getElementById("qrcodeWaze").innerHTML = "";

          new QRCode(document.getElementById("qrcodeGoogle"), googleMapsUrl);
          new QRCode(document.getElementById("qrcodeWaze"), wazeUrl);

          linksContainer.classList.remove("hidden"); // Exibe links e QR Codes
        }
      });
    })
    .catch((error) => console.error("Erro ao carregar dados.json:", error));
});
