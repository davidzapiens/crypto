const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true";

// ==== CARGAR DATOS DEL MERCADO ====
async function cargarMercado() {
  try {
    const respuesta = await fetch(API_URL);
    const datos = await respuesta.json();
    const tabla = document.querySelector("#crypto-table tbody");
    tabla.innerHTML = "";

    datos.forEach((coin) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${coin.image}" width="24"/> ${coin.name}</td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td style="color:${coin.price_change_percentage_24h >= 0 ? "#22c55e" : "#ef4444"}">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </td>
        <td><canvas id="spark-${coin.id}" width="100" height="30"></canvas></td>
        <td>
          <button onclick="comprar('${coin.id}', ${coin.current_price})">Comprar</button>
          <button onclick="vender('${coin.id}', ${coin.current_price})">Vender</button>
        </td>
      `;
      tabla.appendChild(row);
      dibujarSparkline(`spark-${coin.id}`, coin.sparkline_in_7d.price);
    });
  } catch (error) {
    console.error("Error al cargar mercado:", error);
  }
}

// ==== GESTIÓN DE CARTERA ====
let cartera = JSON.parse(localStorage.getItem("cartera")) || {
  USD: 10000,
  BTC: 0,
  ETH: 0,
};
let historial = JSON.parse(localStorage.getItem("historial")) || [];

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

// ==== OPERACIONES ====
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

// ==== MINI GRÁFICO SPARKLINE ====
function dibujarSparkline(canvasId, datos) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const max = Math.max(...datos);
  const min = Math.min(...datos);
  const escala = canvas.height / (max - min);

  ctx.beginPath();
  ctx.strokeStyle = "#38bdf8";
  datos.forEach((v, i) => {
    const x = (i / datos.length) * canvas.width;
    const y = canvas.height - (v - min) * escala;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// ==== INICIALIZACIÓN ====
cargarMercado();
actualizarCartera();
renderHistorial();