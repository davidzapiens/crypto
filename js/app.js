const USUARIOS = [
  { usuario: "admin", password: "1234" },
  { usuario: "david", password: "2025" },
];

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const mainSection = document.getElementById("main-section");
  const modal = document.getElementById("coinModal");
  const closeModal = document.querySelector(".close-modal");
  
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

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    const existe = USUARIOS.find(
      (u) => u.usuario === usuario && u.password === password
    );

    if (existe) {
      localStorage.setItem("usuarioActivo", usuario);
      loginSection.style.display = "none";
      mainSection.style.display = "block";
      iniciarApp();
    } else {
      alert("Usuario o contraseña incorrectos.");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("usuarioActivo");
    location.reload();
  });
});

const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true";
const COIN_DETAIL_URL = "https://api.coingecko.com/api/v3/coins/";
const NEWS_API_URL = "https://newsapi.org/v2/everything";
const NEWS_API_KEY = "TU_API_KEY"; // Necesitarás registrarte en newsapi.org para obtener una API key

function iniciarApp() {
  cargarMercado();
}

async function cargarMercado() {
  try {
    const respuesta = await fetch(API_URL);
    const datos = await respuesta.json();
    const tabla = document.querySelector("#crypto-table tbody");
    tabla.innerHTML = "";

    datos.forEach((coin) => {
      const row = document.createElement("tr");
      row.style.cursor = "pointer";
      row.innerHTML = `
        <td><img src="${coin.image}" width="24"/> ${coin.name}</td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td style="color:${coin.price_change_percentage_24h >= 0 ? "#22c55e" : "#ef4444"}">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </td>
        <td><canvas id="spark-${coin.id}" width="100" height="30"></canvas></td>
        <td>
          <button onclick="event.stopPropagation(); comprar('${coin.id}', ${coin.current_price})">Comprar</button>
          <button onclick="event.stopPropagation(); vender('${coin.id}', ${coin.current_price})">Vender</button>
        </td>
      `;
      
      // Agregar el evento click a la fila completa
      row.onclick = function() {
        console.log('Click en moneda:', coin.id); // Para debugging
        mostrarDetallesMoneda(coin.id);
      };
      tabla.appendChild(row);
      dibujarSparkline(`spark-${coin.id}`, coin.sparkline_in_7d.price);
    });
  } catch (error) {
    console.error("Error al cargar mercado:", error);
  }
}

function actualizarCartera() {
  document.getElementById("usd-balance").textContent = cartera.USD.toFixed(2);
  document.getElementById("btc-balance").textContent = cartera.BTC.toFixed(6);
  document.getElementById("eth-balance").textContent = cartera.ETH.toFixed(6);
  localStorage.setItem("cartera", JSON.stringify(cartera));
}

function registrarOrden(tipo, id, cantidad, total) {
  const fecha = new Date().toLocaleString();
  historial.unshift(`${fecha} — ${tipo} ${cantidad} ${id.toUpperCase()} por $${total.toFixed(2)}`);
  localStorage.setItem("historial", JSON.stringify(historial));
  renderHistorial();
}

function renderHistorial() {
  const ul = document.getElementById("order-history");
  ul.innerHTML = "";
  historial.forEach((orden) => {
    const li = document.createElement("li");
    li.textContent = orden;
    ul.appendChild(li);
  });
}

function comprar(id, precio) {
  const monto = prompt(`¿Cuánto desea invertir en ${id.toUpperCase()} (USD)?`);
  if (!monto || isNaN(monto) || monto <= 0) return;
  if (monto > cartera.USD) {
    alert("Fondos insuficientes.");
    return;
  }
  const cantidad = monto / precio;
  cartera.USD -= parseFloat(monto);
  cartera[id.toUpperCase()] = (cartera[id.toUpperCase()] || 0) + cantidad;
  registrarOrden("Compra", id, cantidad, parseFloat(monto));
  actualizarCartera();
}

function vender(id, precio) {
  const cantidad = prompt(`¿Cuánto desea vender de ${id.toUpperCase()}?`);
  if (!cantidad || isNaN(cantidad) || cantidad <= 0) return;
  if (cantidad > (cartera[id.toUpperCase()] || 0)) {
    alert("No tiene suficiente saldo.");
    return;
  }
  const total = cantidad * precio;
  cartera.USD += total;
  cartera[id.toUpperCase()] -= parseFloat(cantidad);
  registrarOrden("Venta", id, cantidad, total);
  actualizarCartera();
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

modalTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    modalTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    const tabId = tab.getAttribute("data-tab");
    document.querySelectorAll("[id$='-tab']").forEach(content => {
      content.style.display = "none";
    });
    document.getElementById(tabId + "-tab").style.display = "block";
    
    if (tabId === "chart" && chartInstance) {
      chartInstance.update();
    }
  });
});

async function mostrarDetallesMoneda(id) {
  console.log('Mostrando detalles de:', id); // Para debugging
  try {
    // Primero obtenemos los datos del mercado para la gráfica
    const respuestaMercado = await fetch(API_URL);
    const datosMercado = await respuestaMercado.json();
    const datosMoneda = datosMercado.find(coin => coin.id === id);

    // Luego obtenemos los detalles completos de la moneda
    const respuesta = await fetch(COIN_DETAIL_URL + id);
    if (!respuesta.ok) {
      throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    const datos = await respuesta.json();

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
    elementos.imagen.src = datos.image.large;
    elementos.nombre.textContent = datos.name;
    elementos.precio.textContent = `$${datos.market_data.current_price.usd.toLocaleString()}`;
    elementos.cambio.textContent = `${datos.market_data.price_change_percentage_24h.toFixed(2)}%`;
    elementos.marketCap.textContent = `$${datos.market_data.market_cap.usd.toLocaleString()}`;
    elementos.volumen.textContent = `$${datos.market_data.total_volume.usd.toLocaleString()}`;
    elementos.alto.textContent = `$${datos.market_data.high_24h.usd.toLocaleString()}`;
    elementos.bajo.textContent = `$${datos.market_data.low_24h.usd.toLocaleString()}`;
    
    // Actualizar gráfica
    const chartCanvas = document.getElementById("modal-chart");
    if (chartCanvas && datosMoneda && datosMoneda.sparkline_in_7d) {
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      const ctx = chartCanvas.getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: datosMoneda.sparkline_in_7d.price.map((_, i) => `Día ${i + 1}`),
          datasets: [{
            label: "Precio USD",
            data: datosMoneda.sparkline_in_7d.price,
            borderColor: "#a78bfa",
            backgroundColor: "rgba(167, 139, 250, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              grid: {
                color: "rgba(167, 139, 250, 0.1)"
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
    
    // Cargar noticias
    try {
      const newsResponse = await fetch(
        `${NEWS_API_URL}?q=${datos.name} crypto&apiKey=${NEWS_API_KEY}&language=es&pageSize=5`
      );
      const newsData = await newsResponse.json();
      
      const newsContainer = document.getElementById("modal-news");
      if (newsContainer) {
        newsContainer.innerHTML = newsData.articles.map(article => `
          <div class="news-card">
            <h4>${article.title}</h4>
            <p>${article.description}</p>
            <small>${new Date(article.publishedAt).toLocaleDateString()}</small>
          </div>
        `).join("");
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
