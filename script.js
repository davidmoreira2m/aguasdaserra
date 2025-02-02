// Variável global para armazenar o mapa
let mapa;

document.getElementById("print-btn").addEventListener("click", function () {
  window.print();
});

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

// Função para limpar todos os componentes antes de atualizar
function limparComponentes() {
  // Limpar erro de mensagem, se houver
  document.getElementById("erroMensagem").classList.add("hidden");

  // Esconde o popup de sugestões
  document.getElementById("sugestoesPopup").classList.add("hidden");

  // Esconde o resultado com links e QR codes
  document.getElementById("resultado").classList.add("hidden");

  // Limpa QR codes anteriores
  document.getElementById("qrcodeGoogle").innerHTML = "";
  document.getElementById("qrcodeWaze").innerHTML = "";

  // Limpa o conteúdo do mapa (Destruir o mapa existente, se houver)
  if (mapa) {
    mapa.remove(); // Remove o mapa anterior
    mapa = null; // Limpa a variável para evitar problemas na próxima renderização
  }
}

/// Função para criar o mapa com ponto inicial fixo e destino dinâmico
function criarMapa(
  latitudeInicial,
  longitudeInicial,
  latitudeDestino,
  longitudeDestino
) {
  // Cria o mapa com o ponto inicial fixo
  mapa = L.map("map").setView([latitudeInicial, longitudeInicial], 16);

  // Adicionando a camada do OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapa);

  // Criando o ponto de destino com as coordenadas do código informado ou área comum
  var destination = L.latLng(latitudeDestino, longitudeDestino);

  // Criando o marcador apenas para o destino
  L.marker(destination).addTo(mapa);

  // Criando a rota entre o ponto inicial e o destino
  L.Routing.control({
    waypoints: [L.latLng(latitudeInicial, longitudeInicial), destination], // Definindo o ponto inicial fixo e o destino
    routeWhileDragging: true, // Permite mover a rota durante a navegação
    language: "pt-BR", // Configurando idioma para português
    units: "metric", // Configura as unidades como métricas (metros, quilômetros)
    showAlternatives: false, // Não exibe alternativas de rota
    createMarker: function () {
      return null;
    }, // Impede a criação de marcadores adicionais (como o marcador do ponto inicial)
  }).addTo(mapa);
}

// Função para gerar os links e QR codes
function gerarLinksEQRcodes(latitudeDestino, longitudeDestino) {
  const googleMapsUrl = `https://www.google.com/maps?q=${latitudeDestino},${longitudeDestino}`;
  const wazeUrl = `https://waze.com/ul?ll=${latitudeDestino},${longitudeDestino}&navigate=yes`;

  document.getElementById("googleMapsBtn").href = googleMapsUrl;
  document.getElementById("wazeBtn").href = wazeUrl;

  // Limpa QR Codes anteriores e gera novos
  document.getElementById("qrcodeGoogle").innerHTML = "";
  document.getElementById("qrcodeWaze").innerHTML = "";

  new QRCode(document.getElementById("qrcodeGoogle"), {
    text: googleMapsUrl,
    width: 200, // Define o tamanho do QR Code
    height: 200, // Mantém a altura proporcional
  });

  new QRCode(document.getElementById("qrcodeWaze"), {
    text: wazeUrl,
    width: 200, // Define o tamanho do QR Code
    height: 200, // Mantém a altura proporcional
  });
}

// Função para buscar as coordenadas com base no código informado
async function buscarCoordenadas() {
  const dados = await carregarDados();
  if (!dados) return;

  let codigo = document.getElementById("codigo").value.trim().toUpperCase();
  document.getElementById("codigo").value = codigo;

  // Limpar todos os componentes antes de atualizar
  limparComponentes();

  // Busca o local em "lotes" ou "quintas"
  const local = dados.lotes[codigo] || dados.quintas[codigo];

  if (!local) {
    document.getElementById("erroMensagem").classList.remove("hidden");
    document.getElementById("resultado").classList.add("hidden");
    return;
  }

  document.getElementById("erroMensagem").classList.add("hidden");

  // Usando as coordenadas fixas como ponto inicial
  const latitudeInicial = -6.737965;
  const longitudeInicial = -35.628685;

  // Pega as coordenadas do destino do código (exemplo: do local em "lotes" ou "quintas")
  const latitudeDestino = local.latitude;
  const longitudeDestino = local.longitude;

  // Criar o mapa com o ponto inicial fixo e destino dinâmico
  criarMapa(
    latitudeInicial,
    longitudeInicial,
    latitudeDestino,
    longitudeDestino
  );

  // Gerar os links e QR Codes para Google Maps e Waze
  gerarLinksEQRcodes(latitudeDestino, longitudeDestino);

  // Exibir o resultado (links e QR codes)
  document.getElementById("resultado").classList.remove("hidden");

  // Resetar o dropdown
  document.getElementById("areascomuns-dropdown").selectedIndex = 0;
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
  document.getElementById("resultadoTitulo").textContent =
    "Destino: " + document.getElementById("codigo").value;
  document.getElementById("resultadoTitulo").classList.add("print-block");

  document.getElementById("sugestoesPopup").classList.add("hidden");
  // Chama a busca automaticamente após a seleção
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
    })
    .catch((error) => {
      console.error("Erro ao carregar dados.json:", error);
    });

  // Adiciona o evento de seleção do dropdown de áreas comuns
  document
    .getElementById("areascomuns-dropdown")
    .addEventListener("change", async function () {
      const dados = await carregarDados();
      if (!dados) return;

      const areaSelecionada = this.value;
      document.getElementById("resultadoTitulo").textContent =
        "Destino: " + areaSelecionada;
      document.getElementById("resultadoTitulo").classList.add("print-block");
      if (areaSelecionada) {
        // Limpar os componentes antes de atualizar
        limparComponentes();

        // Obtém as coordenadas da área comum selecionada
        const local = dados.areascomuns[areaSelecionada];

        if (local) {
          const latitudeInicial = -6.737965;
          const longitudeInicial = -35.628685;

          const latitudeDestino = local.latitude;
          const longitudeDestino = local.longitude;

          // Criar o mapa com o ponto inicial fixo e destino dinâmico
          criarMapa(
            latitudeInicial,
            longitudeInicial,
            latitudeDestino,
            longitudeDestino
          );

          // Gerar os links e QR Codes para Google Maps e Waze
          gerarLinksEQRcodes(latitudeDestino, longitudeDestino);

          // Exibir o resultado (links e QR codes)
          document.getElementById("resultado").classList.remove("hidden");

          // Limpar o input quando uma área for selecionada
          document.getElementById("codigo").value = "";
        } else {
          document.getElementById("erroMensagem").classList.remove("hidden");
        }
      }
    });
});
