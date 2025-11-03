// Obtener usuarios del localStorage o usar el array por defecto
const USUARIOS_DEFAULT = [
  { usuario: "admin", password: "1234" },
  { usuario: "david", password: "2025" },
];

let usuarios = JSON.parse(localStorage.getItem('usuarios')) || USUARIOS_DEFAULT;

// Función para guardar usuarios en localStorage
function guardarUsuarios() {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const mainSection = document.getElementById("main-section");
  const modal = document.getElementById("coinModal");
  const closeModal = document.querySelector(".close-modal");
  
  // Elementos de login y registro
  const loginCard = document.getElementById("login-card");
  const registerCard = document.getElementById("register-card");
  const showRegister = document.getElementById("show-register");
  const showLogin = document.getElementById("show-login");
  
  // Cerrar modal con el botón X
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
  
  // Configurar las pestañas del modal
  document.querySelectorAll(".tab-button").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const tabId = tab.getAttribute("data-tab");
      document.querySelectorAll("[id$='-tab']").forEach(content => {
        content.style.display = "none";
      });
      document.getElementById(tabId + "-tab").style.display = "block";
    });
  });

  const usuarioActivo = localStorage.getItem("usuarioActivo");
  if (usuarioActivo) {
    loginSection.style.display = "none";
    mainSection.style.display = "block";
    iniciarApp();
  }

  // Alternar entre login y registro
  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginCard.style.display = "none";
    registerCard.style.display = "block";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerCard.style.display = "none";
    loginCard.style.display = "block";
  });

  // Manejo del formulario de login
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    const existe = usuarios.find(
      (u) => u.usuario === usuario && u.password === password
    );

    const errorDiv = loginCard.querySelector(".error-message") || 
                    document.createElement("div");
    errorDiv.className = "error-message";
    
    if (existe) {
      localStorage.setItem("usuarioActivo", usuario);
      loginSection.style.display = "none";
      mainSection.style.display = "block";
      iniciarApp();
    } else {
      errorDiv.textContent = "Usuario o contraseña incorrectos.";
      errorDiv.style.display = "block";
      if (!loginCard.querySelector(".error-message")) {
        loginCard.querySelector("form").insertBefore(errorDiv, loginCard.querySelector("button"));
      }
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 3000);
    }
  });

  // Manejo del formulario de registro
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevoUsuario = document.getElementById("nuevo-usuario").value;
    const nuevaPassword = document.getElementById("nueva-password").value;
    const confirmarPassword = document.getElementById("confirmar-password").value;

    const errorDiv = registerCard.querySelector(".error-message") || 
                    document.createElement("div");
    errorDiv.className = "error-message";
    
    const successDiv = registerCard.querySelector(".success-message") || 
                      document.createElement("div");
    successDiv.className = "success-message";

    // Validaciones
    if (nuevaPassword !== confirmarPassword) {
      errorDiv.textContent = "Las contraseñas no coinciden.";
      errorDiv.style.display = "block";
      if (!registerCard.querySelector(".error-message")) {
        registerCard.querySelector("form").insertBefore(errorDiv, registerCard.querySelector("button"));
      }
      return;
    }

    if (usuarios.some(u => u.usuario === nuevoUsuario)) {
      errorDiv.textContent = "Este nombre de usuario ya está en uso.";
      errorDiv.style.display = "block";
      if (!registerCard.querySelector(".error-message")) {
        registerCard.querySelector("form").insertBefore(errorDiv, registerCard.querySelector("button"));
      }
      return;
    }

    // Agregar nuevo usuario
    usuarios.push({
      usuario: nuevoUsuario,
      password: nuevaPassword
    });
    
    // Guardar en localStorage
    guardarUsuarios();

    // Mostrar mensaje de éxito
    successDiv.textContent = "¡Registro exitoso! Redirigiendo al login...";
    successDiv.style.display = "block";
    if (!registerCard.querySelector(".success-message")) {
      registerCard.querySelector("form").insertBefore(successDiv, registerCard.querySelector("button"));
    }

    // Limpiar formulario
    e.target.reset();

    // Redireccionar al login después de 2 segundos
    setTimeout(() => {
      registerCard.style.display = "none";
      loginCard.style.display = "block";
      document.getElementById("usuario").value = nuevoUsuario;
      document.getElementById("password").focus();
    }, 2000);
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("usuarioActivo");
    location.reload();
  });
});

const BINANCE_API_URL = "https://api3.binance.com/api/v3"; // Usando el endpoint público alternativo
const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws";

// Inicializar WebSocket para datos en tiempo real
let binanceWs = null;

function iniciarWebSocket() {
  binanceWs = new WebSocket(BINANCE_WS_URL);
  
  binanceWs.onopen = () => {
    console.log('WebSocket conectado');
    // Suscribirse a los tickers de todas las monedas
    const subscription = {
      method: "SUBSCRIBE",
      params: SYMBOLS.map(symbol => `${symbol.toLowerCase()}@ticker`),
      id: 1
    };
    binanceWs.send(JSON.stringify(subscription));
  };
  
  binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.e === "24hrTicker") {
      actualizarPrecioEnVivo(data);
    }
  };
  
  binanceWs.onerror = (error) => {
    console.error('Error en WebSocket:', error);
  };
  
  binanceWs.onclose = () => {
    console.log('WebSocket desconectado. Reconectando...');
    setTimeout(iniciarWebSocket, 5000);
  };
}
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT', 'DOTUSDT', 'UNIUSDT', 'LINKUSDT', 'SOLUSDT'];

// Función de utilidad para hacer solicitudes a la API de Binance
async function fetchBinanceAPI(endpoint, params = {}) {
  try {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${BINANCE_API_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    // Usamos fetch sin headers personalizados para evitar el preflight CORS
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en solicitud a Binance API (${endpoint}):`, error);
    // Si falla, intentamos con la API pública alternativa de Binance
    try {
      const fallbackUrl = `https://api1.binance.com/api/v3${endpoint}${queryString ? '?' + queryString : ''}`;
      const fallbackResponse = await fetch(fallbackUrl);
      
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`);
      }

      return await fallbackResponse.json();
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
      throw error; // Lanzamos el error original si el fallback también falla
    }
  }
}
const SYMBOL_NAMES = {
  'BTCUSDT': {
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    description: 'Bitcoin es la primera criptomoneda descentralizada del mundo. Creada en 2009 por Satoshi Nakamoto, Bitcoin revolucionó las finanzas digitales introduciendo la tecnología blockchain. Es conocida como "oro digital" y tiene un suministro limitado de 21 millones de monedas.',
    features: ['Pionera en tecnología blockchain', 'Suministro limitado a 21M', 'Prueba de trabajo (PoW)', 'Halving cada ~4 años'],
    website: 'https://bitcoin.org',
    whitepaper: 'https://bitcoin.org/bitcoin.pdf'
  },
  'ETHUSDT': {
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    description: 'Ethereum es una plataforma descentralizada que permite la creación de contratos inteligentes y aplicaciones descentralizadas (dApps). Creada por Vitalik Buterin, revolucionó el espacio cripto introduciendo la programabilidad blockchain.',
    features: ['Contratos Inteligentes', 'DeFi y NFTs', 'Prueba de participación (PoS)', 'EVM (Ethereum Virtual Machine)'],
    website: 'https://ethereum.org',
    whitepaper: 'https://ethereum.org/whitepaper/'
  },
  'BNBUSDT': {
    name: 'Binance Coin',
    image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    description: 'BNB es la criptomoneda nativa del ecosistema Binance. Originalmente creada en Ethereum, ahora opera en su propia blockchain, Binance Smart Chain, ofreciendo transacciones rápidas y económicas.',
    features: ['Usado para reducir comisiones en Binance', 'Staking y gobernanza', 'Smart Chain compatible con EVM', 'Quema trimestral de tokens'],
    website: 'https://www.binance.com/en/bnb',
    whitepaper: 'https://www.binance.com/resources/ico/Binance_WhitePaper.pdf'
  },
  'ADAUSDT': {
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    description: 'Cardano es una blockchain de prueba de participación desarrollada con metodología académica y revisión por pares. Fundada por Charles Hoskinson, se enfoca en la sostenibilidad, escalabilidad e interoperabilidad.',
    features: ['Prueba de participación (PoS)', 'Desarrollo académico revisado por pares', 'Smart Contracts en Plutus', 'Enfoque multicapa'],
    website: 'https://cardano.org',
    whitepaper: 'https://docs.cardano.org/introduction'
  },
  'DOGEUSDT': {
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    description: 'Dogecoin comenzó como una broma basada en un meme de Internet, pero se ha convertido en una de las criptomonedas más populares. Creada por Billy Markus y Jackson Palmer, se distingue por su comunidad activa y enfoque amigable.',
    features: ['Sin límite de suministro', 'Minería conjunta con Litecoin', 'Transacciones rápidas', 'Fuerte comunidad'],
    website: 'https://dogecoin.com',
    whitepaper: 'https://github.com/dogecoin/dogecoin/blob/master/README.md'
  },
  'XRPUSDT': {
    name: 'Ripple',
    image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    description: 'XRP es la criptomoneda nativa de la Red XRP Ledger, diseñada para facilitar transferencias de dinero rápidas y económicas a nivel global. Es especialmente útil para pagos transfronterizos y remesas.',
    features: ['Confirmaciones en segundos', 'Bajo costo por transacción', 'Enfoque en pagos internacionales', 'Protocolo de consenso único'],
    website: 'https://xrpl.org',
    whitepaper: 'https://xrpl.org/technical-overview.html'
  },
  'DOTUSDT': {
    name: 'Polkadot',
    image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    description: 'Polkadot es una plataforma blockchain que permite la interoperabilidad entre diferentes redes. Creada por Gavin Wood, co-fundador de Ethereum, permite la transferencia de cualquier tipo de dato entre blockchains.',
    features: ['Parachains personalizables', 'Interoperabilidad cross-chain', 'Actualizaciones sin bifurcaciones', 'Gobernanza on-chain'],
    website: 'https://polkadot.network',
    whitepaper: 'https://polkadot.network/PolkaDotPaper.pdf'
  },
  'UNIUSDT': {
    name: 'Uniswap',
    image: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
    description: 'Uniswap es un protocolo de intercambio descentralizado (DEX) que facilita el trading automatizado de tokens DeFi. UNI es su token de gobernanza, permitiendo a los holders votar sobre el futuro del protocolo.',
    features: ['Exchange descentralizado', 'Creación automática de mercado', 'Gobernanza comunitaria', 'Pools de liquidez'],
    website: 'https://uniswap.org',
    whitepaper: 'https://uniswap.org/whitepaper-v3.pdf'
  },
  'LINKUSDT': {
    name: 'Chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    description: 'Chainlink es una red de oráculos descentralizada que permite que los contratos inteligentes accedan a datos del mundo real de manera segura. Es fundamental para el funcionamiento de muchas aplicaciones DeFi.',
    features: ['Red de oráculos descentralizada', 'Conexión blockchain-mundo real', 'Verificación de datos', 'Múltiples fuentes de datos'],
    website: 'https://chain.link',
    whitepaper: 'https://link.smartcontract.com/whitepaper'
  },
  'SOLUSDT': {
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    description: 'Solana es una blockchain de alto rendimiento que puede procesar miles de transacciones por segundo con costos muy bajos. Utiliza un mecanismo de consenso único llamado Prueba de Historia.',
    features: ['Alta velocidad (65,000 TPS)', 'Bajas comisiones', 'Prueba de Historia (PoH)', 'Smart Contracts en Rust'],
    website: 'https://solana.com',
    whitepaper: 'https://solana.com/solana-whitepaper.pdf'
  }
};
const CRYPTO_NEWS_URL = "https://min-api.cryptocompare.com/data/v2/news/?lang=ES";

function iniciarApp() {
  cargarMercado();
  iniciarWebSocket(); // Iniciar conexión WebSocket para actualizaciones en tiempo real
}

// Función para actualizar precios en tiempo real
function actualizarPrecioEnVivo(data) {
  const row = document.querySelector(`tr[data-symbol="${data.s}"]`);
  if (!row) return;

  const precioCell = row.querySelector('.precio');
  const cambioCell = row.querySelector('.cambio');
  
  if (precioCell) {
    precioCell.textContent = `$${parseFloat(data.c).toLocaleString()}`;
  }
  
  if (cambioCell) {
    const cambio = parseFloat(data.P);
    cambioCell.textContent = `${cambio.toFixed(2)}%`;
    cambioCell.style.color = cambio >= 0 ? "#22c55e" : "#ef4444";
  }
}

async function cargarMercado() {
  try {
    // Intentar obtener todos los tickers de una vez
    const datosPrecio = await fetchBinanceAPI('/ticker/24hr').catch(async () => {
      // Si falla, intentar obtener individualmente
      const promesasPrecio = SYMBOLS.map(symbol => 
        fetchBinanceAPI('/ticker/24hr', { symbol })
          .catch(err => {
            console.error(`Error al obtener datos para ${symbol}:`, err);
            return null;
          })
      );
      return await Promise.all(promesasPrecio);
    });
    const tabla = document.querySelector("#crypto-table tbody");
    tabla.innerHTML = "";

    datosPrecio.forEach((coin) => {
      if (!coin) return; // Saltamos si hubo error en la obtención de datos
      
      const symbolInfo = SYMBOL_NAMES[coin.symbol];
      if (!symbolInfo) return; // Saltamos si no tenemos información del símbolo

      const row = document.createElement("tr");
      row.style.cursor = "pointer";
      row.setAttribute('data-symbol', coin.symbol);
      row.innerHTML = `
        <td><img src="${symbolInfo.image}" width="24"/> ${symbolInfo.name}</td>
        <td class="precio">$${parseFloat(coin.lastPrice).toLocaleString()}</td>
        <td class="cambio" style="color:${parseFloat(coin.priceChangePercent) >= 0 ? "#22c55e" : "#ef4444"}">
          ${parseFloat(coin.priceChangePercent).toFixed(2)}%
        </td>
        <td><canvas id="spark-${coin.symbol}" width="100" height="30"></canvas></td>
        <td>
          <button onclick="event.stopPropagation(); mostrarDetallesMoneda('${coin.symbol}')">Ver Detalles</button>
        </td>
      `;
      
      // Agregar el evento click a la fila completa
      row.onclick = function() {
        console.log('Click en moneda:', coin.symbol); // Para debugging
        mostrarDetallesMoneda(coin.symbol);
      };
      tabla.appendChild(row);
      
      // Obtener datos para el sparkline
      obtenerDatosHistoricos(coin.symbol, '24h').then(precios => {
        const datos = precios.map(precio => precio[1]);
        dibujarSparkline(`spark-${coin.symbol}`, datos);
      }).catch(error => console.error('Error al cargar sparkline:', error));
    });
  } catch (error) {
    console.error("Error al cargar mercado:", error);
  }
}



function dibujarSparkline(canvasId, datos) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const max = Math.max(...datos);
  const min = Math.min(...datos);
  const escala = canvas.height / (max - min);

  ctx.beginPath();
  ctx.strokeStyle = "#a78bfa";
  datos.forEach((v, i) => {
    const x = (i / datos.length) * canvas.width;
    const y = canvas.height - (v - min) * escala;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Funcionalidad del Modal
const modal = document.getElementById("coinModal");
const closeModal = document.querySelector(".close-modal");
const modalTabs = document.querySelectorAll(".tab-button");
let chartInstance = null;

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

function actualizarGrafica(precios, timeframe) {
  const chartCanvas = document.getElementById("modal-chart");
  if (!chartCanvas) return;
  
  // Asegurarse de que la sección About esté visible
  const aboutSection = document.querySelector('.about-section');
  if (aboutSection) {
    aboutSection.style.display = 'block';
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!precios || precios.length === 0) {
    console.error('No hay datos para mostrar en la gráfica');
    return;
  }

  console.log(`Actualizando gráfica con ${precios.length} puntos de datos`);

  const ctx = chartCanvas.getContext("2d");
  const formatearFecha = (timestamp) => {
    const fecha = new Date(timestamp);
    switch(timeframe) {
      case '24h':
        return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return fecha.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
      case '30d':
        return fecha.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1y':
        return fecha.toLocaleDateString([], { year: 'numeric', month: 'short' });
      default:
        return fecha.toLocaleDateString();
    }
  };

  // Crear gradiente
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
  gradient.addColorStop(1, 'rgba(167, 139, 250, 0.0)');

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: precios.map(precio => formatearFecha(precio[0])),
      datasets: [{
        label: "Precio USD",
        data: precios.map(precio => precio[1]),
        borderColor: "#a78bfa",
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointBorderColor: '#a78bfa',
        pointHoverBorderColor: '#7c3aed',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        pointStyle: 'circle',
        hitRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#a78bfa',
          bodyColor: '#fff',
          bodyFont: {
            size: 14,
            weight: '500'
          },
          titleFont: {
            size: 12,
            weight: '400'
          },
          padding: {
            top: 10,
            right: 15,
            bottom: 10,
            left: 15
          },
          cornerRadius: 8,
          displayColors: false,
          borderColor: 'rgba(167, 139, 250, 0.1)',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              return formatearFecha(precios[context[0].dataIndex][0]);
            },
            label: function(context) {
              return `$${context.parsed.y.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`;
            }
          }
        }
      },
      scales: {
        y: {
          grid: {
            color: "rgba(167, 139, 250, 0.08)",
            drawBorder: false,
            lineWidth: 1
          },
          border: {
            display: false
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            },
            padding: 10,
            color: "#94a3b8",
            font: {
              size: 11,
              weight: '500'
            }
          },
          beginAtZero: false
        },
        x: {
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            maxRotation: 0,
            padding: 10,
            color: "#94a3b8",
            maxTicksLimit: timeframe === '24h' ? 6 : 8,
            font: {
              size: 11,
              weight: '500'
            }
          }
        }
      },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 10,
          left: 10
        }
      }
    }
  });
}

modalTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    modalTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    const tabId = tab.getAttribute("data-tab");
    document.querySelectorAll("[id$='-tab']").forEach(content => {
      content.classList.remove('active');
      content.style.display = "none";
    });
    const activeTab = document.getElementById(tabId + "-tab");
    activeTab.classList.add('active');
    activeTab.style.display = "block";
    
    // Si es la pestaña de gráfica, asegurarse de que se muestre el contenido
    if (tabId === 'chart') {
      if (chartInstance) {
        chartInstance.resize();
      }
      document.querySelector('.about-section').style.display = 'block';
    }
    
    if (tabId === "chart" && chartInstance) {
      chartInstance.update();
    }
  });
});

let selectedTimeframe = '7d';
let activeChartData = null;

async function obtenerDatosHistoricos(symbol, timeframe) {
  if (!symbol || !SYMBOL_NAMES[symbol]) {
    console.error('Símbolo no válido:', symbol);
    throw new Error('Símbolo no válido');
  }

  const ahora = Date.now();
  const intervalos = {
    '24h': {
      interval: '5m',
      startTime: ahora - 24 * 60 * 60 * 1000,
      endTime: ahora
    },
    '7d': {
      interval: '1h',
      startTime: ahora - 7 * 24 * 60 * 60 * 1000,
      endTime: ahora
    },
    '30d': {
      interval: '4h',
      startTime: ahora - 30 * 24 * 60 * 60 * 1000,
      endTime: ahora
    },
    '1y': {
      interval: '1d',
      startTime: ahora - 365 * 24 * 60 * 60 * 1000,
      endTime: ahora
    }
  };

  const { interval, startTime, endTime } = intervalos[timeframe];
  
  try {
    console.log(`Obteniendo datos para ${symbol}, intervalo: ${interval}`);
    const datos = await fetchBinanceAPI('/klines', {
      symbol,
      interval,
      startTime,
      endTime
    });
    
    // Convertir el formato de Binance al formato que espera nuestra gráfica
    return datos.map(vela => [vela[0], parseFloat(vela[4])]); // Usamos el precio de cierre (índice 4)
  } catch (error) {
    console.error('Error al obtener datos históricos:', error);
    throw error;
  }
}

async function mostrarDetallesMoneda(symbol) {
  console.log('Mostrando detalles de:', symbol);
  if (!symbol || !SYMBOL_NAMES[symbol]) {
    console.error('Símbolo no válido:', symbol);
    alert('Error: Moneda no válida');
    return;
  }

  try {
    // Obtener datos de 24h de Binance
    const datos = await fetchBinanceAPI('/ticker/24hr', { symbol });
    
    // Obtener el libro de órdenes para más información
    const datosBook = await fetchBinanceAPI('/depth', { symbol, limit: 5 });

    // Obtener datos históricos iniciales (7 días por defecto)
    let datosHistoricos = [];
    try {
      datosHistoricos = await obtenerDatosHistoricos(symbol, selectedTimeframe);
    } catch (error) {
      console.error('Error al obtener datos históricos:', error);
    }

    const modal = document.getElementById("coinModal");
    if (!modal) {
      console.error('Modal no encontrado');
      return;
    }
    
    // Asegurarse de que todos los elementos existen antes de actualizarlos
    const elementos = {
      imagen: document.getElementById("modal-coin-image"),
      nombre: document.getElementById("modal-coin-name"),
      precio: document.getElementById("modal-price"),
      cambio: document.getElementById("modal-change"),
      marketCap: document.getElementById("modal-market-cap"),
      volumen: document.getElementById("modal-volume"),
      alto: document.getElementById("modal-high"),
      bajo: document.getElementById("modal-low")
    };

    // Verificar que todos los elementos existen
    for (const [key, element] of Object.entries(elementos)) {
      if (!element) {
        console.error(`Elemento ${key} no encontrado en el DOM`);
        return;
      }
    }

    // Actualizar información básica
    const symbolInfo = SYMBOL_NAMES[symbol];
    elementos.imagen.src = symbolInfo.image;
    elementos.nombre.textContent = symbolInfo.name;
    elementos.precio.textContent = `$${parseFloat(datos.lastPrice).toLocaleString()}`;
    elementos.cambio.textContent = `${parseFloat(datos.priceChangePercent).toFixed(2)}%`;
    elementos.marketCap.textContent = `Vol. 24h: $${parseFloat(datos.quoteVolume).toLocaleString()}`;
    elementos.volumen.textContent = `Trades: ${parseInt(datos.count).toLocaleString()}`;
    elementos.alto.textContent = `$${parseFloat(datos.highPrice).toLocaleString()}`;
    elementos.bajo.textContent = `$${parseFloat(datos.lowPrice).toLocaleString()}`;
    
    // Configurar botones de temporalidad
    document.querySelectorAll('.time-button').forEach(button => {
      button.addEventListener('click', async function(e) {
        e.preventDefault();
        const timeframe = this.dataset.time;
        console.log(`Cambiando a timeframe: ${timeframe}`);
        
        selectedTimeframe = timeframe;
        document.querySelectorAll('.time-button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        try {
          const historicData = await obtenerDatosHistoricos(symbol, timeframe);
          console.log(`Datos históricos recibidos: ${historicData.length} puntos`);
          actualizarGrafica(historicData, timeframe);
        } catch (err) {
          console.error('Error al cargar datos históricos:', err);
          alert('No se pudieron cargar los datos históricos');
        }
      });
    });

    // Activar el botón de 7d por defecto y cargar datos iniciales
    const defaultButton = document.querySelector('.time-button[data-time="7d"]');
    if (defaultButton) {
      defaultButton.classList.add('active');
    }
    actualizarGrafica(datosHistoricos, selectedTimeframe);
    
    // Actualizar sección About
    const coinInfo = SYMBOL_NAMES[symbol];
    const aboutSection = document.querySelector('.about-section');
    if (aboutSection) {
      document.querySelector('.coin-name-title').textContent = coinInfo.name;
      document.querySelector('.coin-description').textContent = coinInfo.description;
      
      const featuresList = document.querySelector('.features-list');
      featuresList.innerHTML = coinInfo.features
        .map(feature => `<li>${feature}</li>`)
        .join('');
      
      const websiteLink = document.querySelector('.website-link');
      const whitepaperLink = document.querySelector('.whitepaper-link');
      
      websiteLink.href = coinInfo.website;
      whitepaperLink.href = coinInfo.whitepaper;
    }
    
    // Cargar noticias relacionadas con la criptomoneda
    try {
      const newsContainer = document.getElementById("modal-news");
      
      const newsResponse = await fetch(CRYPTO_NEWS_URL);
      if (!newsResponse.ok) {
        throw new Error(`Error ${newsResponse.status}: ${newsResponse.statusText}`);
      }

      const newsData = await newsResponse.json();
      
      if (newsContainer) {
        if (newsData.Data && newsData.Data.length > 0) {
          newsContainer.innerHTML = newsData.Data
            .filter(article => article.lang === 'ES' || article.lang === 'EN')
            .slice(0, 5)
            .map(article => `
              <div class="news-card">
                <div class="news-image">
                  <img src="${article.imageurl}" alt="${article.source_info.name}" onerror="this.style.display='none'"/>
                </div>
                <div class="news-content">
                  <h4>${article.title}</h4>
                  <p>${article.body.length > 150 ? article.body.substring(0, 150) + '...' : article.body}</p>
                  <div class="news-footer">
                    <small>${new Date(article.published_on * 1000).toLocaleDateString()}</small>
                    <a href="${article.url}" target="_blank" rel="noopener">Leer más</a>
                  </div>
                </div>
              </div>
            `).join("");
        } else {
          newsContainer.innerHTML = `
            <div class="news-card">
              <h4>Sin Noticias</h4>
              <p>No se encontraron noticias recientes para ${symbolInfo.name}.</p>
            </div>`;
        }
      }
    } catch (newsError) {
      console.error('Error al cargar noticias:', newsError);
    }
    
    // Mostrar el modal
    modal.style.display = "block";
    
  } catch (error) {
    console.error("Error al cargar detalles:", error);
    alert('Error al cargar los detalles de la moneda');
  }
}
