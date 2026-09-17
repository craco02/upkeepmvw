let inventarioData = [];
let filaEnEdicion = null;
let campoEnEdicion = null;

async function cargarInventario() {
  try {
    const res = await API_FETCH("/api/inventario");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    inventarioData = await res.json();
    renderInventarioTable(inventarioData);
  } catch (error) {
    console.error("Error cargando inventario:", error);
  }
}

cargarInventario();

function renderInventarioTable(items) {
  const tableBody = document.getElementById("inventario-body");
  tableBody.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("tr");
    row.dataset.codigo = item.Codigo;
    row.innerHTML = `
      <td>${item.Codigo}</td>
      <td>${item.Producto}</td>
      <td>${item.UM}</td>
      <td>${item.Unidades}</td>
      <td>${item.StockF9}</td>
      <td>
        <input type="text" class="inventario-input inventario-input--modal" data-campo="CantidadFisica"
          value="${item.CantidadFisica ?? ""}" readonly>
      </td>
      <td>
        <input type="text" class="inventario-input inventario-input--editable" data-campo="Ubicacion"
          value="${item.Ubicacion ?? ""}">
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Filtrar datos dinámicamente
document.getElementById("inventario-search").addEventListener("input", function () {
  const searchValue = this.value.toLowerCase().trim();
  const terms = searchValue.replace(/%/g, " ").split(/\s+/).filter(Boolean);

  const filtered = inventarioData.filter(item => {
    const codigo = String(item.Codigo).toLowerCase();
    const producto = String(item.Producto).toLowerCase();

    return terms.every(term =>
      codigo.includes(term) || producto.includes(term)
    );
  });

  renderInventarioTable(filtered);
});

// Abrir modal al hacer click en el campo Cantidad Física
document.getElementById("inventario-body").addEventListener("click", function (event) {
  const input = event.target.closest(".inventario-input--modal");
  if (!input) return;

  const row = input.closest("tr");
  const codigo = row.dataset.codigo;
  const campo = input.dataset.campo;
  const item = inventarioData.find(i => String(i.Codigo) === String(codigo));
  if (!item) return;

  filaEnEdicion = item;
  campoEnEdicion = campo;

  document.getElementById("inventario-modal-title").textContent = "Actualizar Cantidad Física";
  document.getElementById("inventario-modal-info").textContent = `${item.Codigo} - ${item.Producto}`;
  document.getElementById("inventario-modal-input").value = item[campo] ?? "";
  document.getElementById("inventario-modal-input").type = "number";

  document.getElementById("inventario-modal").style.display = "flex";
  document.getElementById("inventario-modal-input").focus();
});

async function guardarCampo(codigo, campo, valor) {
  const res = await API_FETCH(`/api/inventario/${encodeURIComponent(codigo)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [campo]: valor })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Ubicación es un campo de texto editable directamente en la fila
document.getElementById("inventario-body").addEventListener("change", async function (event) {
  const input = event.target.closest(".inventario-input--editable");
  if (!input) return;

  const row = input.closest("tr");
  const codigo = row.dataset.codigo;
  const item = inventarioData.find(i => String(i.Codigo) === String(codigo));
  if (!item) return;

  const valorAnterior = item[input.dataset.campo];
  const valorNuevo = input.value.trim();

  try {
    const actualizado = await guardarCampo(codigo, input.dataset.campo, valorNuevo);
    item.Ubicacion = actualizado.Ubicacion;
    input.value = actualizado.Ubicacion ?? "";
  } catch (error) {
    console.error("Error guardando ubicación:", error);
    input.value = valorAnterior ?? "";
    alert(error.message || "No se pudo actualizar la ubicación");
  }
});

// Guardar cambio del modal
document.getElementById("inventario-modal-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!filaEnEdicion || !campoEnEdicion) return;

  const nuevoValor = document.getElementById("inventario-modal-input").value.trim();
  if (nuevoValor === "") return;

  const botonGuardar = document.getElementById("inventario-modal-save");
  botonGuardar.disabled = true;
  try {
    const actualizado = await guardarCampo(filaEnEdicion.Codigo, campoEnEdicion, nuevoValor);
    filaEnEdicion.CantidadFisica = actualizado.CantidadFisica;

    const row = document.querySelector(`#inventario-body tr[data-codigo="${filaEnEdicion.Codigo}"]`);
    if (row) {
      const input = row.querySelector(`.inventario-input[data-campo="${campoEnEdicion}"]`);
      if (input) input.value = actualizado.CantidadFisica ?? "";
    }

    cerrarInventarioModal();
  } catch (error) {
    console.error("Error guardando cantidad física:", error);
    alert(error.message || "No se pudo actualizar la cantidad física");
  } finally {
    botonGuardar.disabled = false;
  }
});

// Cerrar modal con botón o clic afuera
document.getElementById("inventario-modal-close").addEventListener("click", cerrarInventarioModal);
document.getElementById("inventario-modal-cancel").addEventListener("click", cerrarInventarioModal);
document.getElementById("inventario-modal").addEventListener("click", function (event) {
  if (event.target === this) cerrarInventarioModal();
});

function cerrarInventarioModal() {
  document.getElementById("inventario-modal").style.display = "none";
  filaEnEdicion = null;
  campoEnEdicion = null;
}
