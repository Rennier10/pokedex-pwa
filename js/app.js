
(() => {
  const $ = s => document.querySelector(s);

  const S = {
    list: [],
    i: 0,
    sound: false,
    detailCache: new Map()
  };

  const typeNames = {
    normal: "NORMAL",
    fire: "FUEGO",
    water: "AGUA",
    electric: "ELÉCTRICO",
    grass: "PLANTA",
    ice: "HIELO",
    fighting: "LUCHA",
    poison: "VENENO",
    ground: "TIERRA",
    flying: "VOLADOR",
    psychic: "PSÍQUICO",
    bug: "BICHO",
    rock: "ROCA",
    ghost: "FANTASMA",
    dragon: "DRAGÓN",
    dark: "SINIESTRO",
    steel: "ACERO",
    fairy: "HADA"
  };

  const statNames = {
    hp: "HP",
    attack: "ATQ",
    defense: "DEF",
    "special-attack": "AT.ESP",
    "special-defense": "DEF.ESP",
    speed: "VEL"
  };

  const pad = n => String(n).padStart(3, "0");

  const esc = s => String(s ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );

  function toast(message) {
    $("#toast").textContent = message;
    setTimeout(() => {
      $("#toast").textContent = "";
    }, 3000);
  }

  function current() {
    return S.list[S.i];
  }

  
function render() {
  const p = current();
  if (!p) return;

  $("#number").textContent = "#" + pad(p.id);
  $("#counter").textContent = pad(p.id) + " / " + pad(S.list.length);
  $("#name").textContent = p.name;

  $("#sprite").classList.add("loading");
  $("#loading").classList.add("visible");
  $("#loading").textContent = "CARGANDO...";

  $("#sprite").onload = () => {
    $("#sprite").classList.remove("loading");
    $("#loading").classList.remove("visible");
  };

  $("#sprite").onerror = () => {
    $("#sprite").classList.remove("loading");
    $("#loading").textContent = "IMAGEN NO DISPONIBLE";
  };

  $("#sprite").src = p.image || p.artwork || p.sprite;
  $("#sprite").alt = "Ilustración de " + p.name;

  $("#height").textContent =
    Number(p.height) > 0 ? Number(p.height).toFixed(1) + " m" : "—";

  $("#weight").textContent =
    Number(p.weight) > 0 ? Number(p.weight).toFixed(1) + " kg" : "—";

  $("#ability").textContent =
    typeof p.abilities?.[0] === "object"
      ? p.abilities[0].name
      : p.abilities?.[0] || "—";

  $("#description").textContent =
    p.description || "Descripción disponible en los detalles.";

  $("#types").innerHTML = (p.types || ["normal"])
    .map(t =>
      `<span class="type ${esc(t)}">${esc(typeNames[t] || t.toUpperCase())}</span>`
    )
    .join("");

  const statNamesOrder = [
    "hp",
    "attack",
    "defense",
    "special-attack",
    "special-defense",
    "speed"
  ];

  const stats = p.stats || {};
  const entries = statNamesOrder.map(key => [key, Number(stats[key] || 0)]);
  const hasRealStats = entries.some(([, value]) => value > 0);

  $("#total").textContent = hasRealStats
    ? "BST " + entries.reduce((sum, [, value]) => sum + value, 0)
    : "BST —";

  $("#stats").innerHTML = hasRealStats
    ? entries.map(([key, value]) => `
        <div class="stat">
          <span>${esc(statNames[key] || key)}</span>
          <b>${value}</b>
          <div class="track">
            <div class="fill"
              style="width:${Math.min(100, value / 255 * 100)}%">
            </div>
          </div>
        </div>
      `).join("")
    : `<p>Abre los detalles del Pokémon para cargar sus estadísticas.</p>`;

  $("#status").textContent =
    window.POKEDEX_CONFIG.USE_MOCK_DATA
      ? "● MODO DEMO"
      : "● API CONECTADA";

  document.title = p.name + " · Pokédex";
renderResults($("#search").value);

// Carga los datos completos sin necesidad de abrir Detalles.
const hasStats = Object.values(p.stats || {}).some(value => Number(value) > 0);

if (!hasStats && !S.detailCache.has(p.id)) {
  loadMainDetails(p.id);
}
}

async function loadMainDetails(id) {
  try {
    const detail = await loadDetails(id);

    // Busca el Pokémon en la lista y actualiza sus datos.
    const index = S.list.findIndex(p => p.id === id);
    if (index === -1) return;

    S.list[index] = {
      ...S.list[index],
      ...detail
    };

    // Actualiza la pantalla principal solo si sigue seleccionado.
    if (current()?.id === id) {
      render();
    }
  } catch (error) {
    console.error("No se pudieron cargar los detalles principales:", error);
  }
}

  function nav(direction) {
    if (!S.list.length) return;

    S.i = (S.i + direction + S.list.length) % S.list.length;
    render();

    if (S.sound) beep();
  }

  function beep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.frequency.value = 520;
      gain.gain.setValueAtTime(0.03, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.08
      );

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
      oscillator.onended = () => context.close();
    } catch (error) {
      // El sonido es opcional.
    }
  }

  function renderResults(queryText) {
    const query = (queryText || "").trim().toLocaleLowerCase("es");
    const element = $("#results");

    if (!query) {
      element.innerHTML = "";
      return;
    }

    const matches = S.list.filter(p =>
      p.name.toLocaleLowerCase("es").includes(query) ||
      String(p.id) === query.replace(/^#/, "")
    ).slice(0, 6);

    element.innerHTML = matches.length
      ? matches.map(p => `
          <button class="result" data-id="${p.id}">
            <img src="${esc(p.image)}" alt="">
            <span>
              <strong>${esc(p.name)}</strong>
              <small>${(p.types || []).map(t =>
                esc(typeNames[t] || t)
              ).join(" · ")}</small>
            </span>
            <em>#${pad(p.id)}</em>
          </button>
        `).join("")
      : "<p style='font-size:10px;color:#9baab7'>No encontramos ese Pokémon.</p>";

    element.querySelectorAll("[data-id]").forEach(button => {
      button.onclick = () => select(button.dataset.id);
    });
  }

  function select(id) {
    const index = S.list.findIndex(p => p.id === Number(id));

    if (index >= 0) {
      S.i = index;
      render();
    }
  }

  // Consulta los datos completos al backend y los guarda en caché.
  async function loadDetails(id) {
    if (S.detailCache.has(id)) {
      return S.detailCache.get(id);
    }

    const pokemon = await PokedexAPI.getDetail(id);
    S.detailCache.set(id, pokemon);

    return pokemon;
  }

  // FUNCIÓN ACTUALIZADA: detalles reales desde Render.
  async function details() {
    const p = current();
    if (!p) return;

    const content = $("#detail-content");

    $("#detail-dialog").showModal();
    content.innerHTML = `
      <div class="detail">
        <h2>${esc(p.name)}</h2>
        <p>Consultando información del backend...</p>
      </div>
    `;

    try {
      const detail = await loadDetails(p.id);

      // Si el usuario cambió de Pokémon mientras cargaba,
      // la ventana seguirá mostrando el detalle solicitado.
      const updated = { ...p, ...detail };

      const abilities = (updated.abilities || [])
        .map(a => {
          const name = typeof a === "string" ? a : a.name;
          const hidden =
            typeof a === "object" && a.isHidden
              ? " (oculta)"
              : "";

          return `<li>${esc(name)}${hidden}</li>`;
        })
        .join("");

      const stats = Object.entries(updated.stats || {})
        .map(([key, value]) => `
          <li>
            ${esc(statNames[key] || key)}:
            <strong>${Number(value) || 0}</strong>
          </li>
        `)
        .join("");

      const evolution = (updated.evolvesTo || [])
        .map(e => esc(typeof e === "string" ? e : e.name))
        .join(", ");

      const previous = updated.evolvesFrom
        ? esc(
            typeof updated.evolvesFrom === "object"
              ? updated.evolvesFrom.name
              : updated.evolvesFrom
          )
        : "Ninguno";

      const types = (updated.types || [])
        .map(t => `
          <span class="type ${esc(t)}">
            ${esc(typeNames[t] || t)}
          </span>
        `)
        .join("");

      content.innerHTML = `
        <div class="detail">
          <small>REGISTRO #${pad(updated.id)}</small>

          <img src="${esc(updated.image)}" alt="${esc(updated.name)}">

          <h2>${esc(updated.name)}</h2>

          <p>${esc(updated.genus || "Pokémon")}</p>

          <div class="types" style="justify-content:center">
            ${types}
          </div>

          <p>${esc(updated.description || "Descripción no disponible.")}</p>

          <p>
            Altura: ${Number(updated.height || 0).toFixed(1)} m<br>
            Peso: ${Number(updated.weight || 0).toFixed(1)} kg<br>
            Experiencia base: ${Number(updated.baseExperience || 0)}<br>
            Tasa de captura: ${Number(updated.captureRate || 0)}
          </p>

          <h3>Habilidades</h3>
          <ul>${abilities || "<li>No disponibles</li>"}</ul>

          <h3>Estadísticas base</h3>
          <ul>${stats || "<li>No disponibles</li>"}</ul>

          <h3>Evolución</h3>
          <p>Anterior: ${previous}</p>
          <p>Siguiente: ${evolution || "No indicada"}</p>
        </div>
      `;

      // Actualizar también la ficha principal con los datos reales.
      const index = S.list.findIndex(item => item.id === updated.id);

      if (index >= 0) {
        S.list[index] = updated;

        if (current()?.id === updated.id) {
          render();
        }
      }
    } catch (error) {
      content.innerHTML = `
        <div class="detail">
          <h2>No se pudieron cargar los detalles</h2>
          <p>${esc(error.message || "Error de conexión con la API.")}</p>
          <button id="retry-details" type="button">Intentar de nuevo</button>
        </div>
      `;

      $("#retry-details").onclick = () => {
        S.detailCache.delete(p.id);
        details();
      };
    }
  }

  function catalog() {
    $("#catalog-list").innerHTML = S.list.map(p => `
      <button class="catalog-item" data-id="${p.id}">
        <img loading="lazy" src="${esc(p.image)}" alt="">
        <span>
          <small>#${pad(p.id)}</small>
          <strong>${esc(p.name)}</strong>
        </span>
      </button>
    `).join("");

    $("#catalog-list").querySelectorAll("[data-id]").forEach(button => {
      button.onclick = () => {
        select(button.dataset.id);
        $("#list-dialog").close();
      };
    });

    $("#list-dialog").showModal();
  }

  document.querySelectorAll("[data-step]").forEach(button => {
    button.onclick = () => nav(Number(button.dataset.step));
  });

  $("#prev").onclick = () => nav(-1);
  $("#next").onclick = () => nav(1);

  $("#random").onclick = () => {
    if (!S.list.length) return;

    S.i = Math.floor(Math.random() * S.list.length);
    render();
    toast("Pokémon aleatorio seleccionado");
  };

  $("#details").onclick = details;

  $("#sound").onclick = () => {
    S.sound = !S.sound;
    toast(S.sound ? "Sonido activado" : "Sonido desactivado");
  };

  $("#search").oninput = event => renderResults(event.target.value);

  $("#clear").onclick = () => {
    $("#search").value = "";
    renderResults("");
    $("#search").focus();
  };

  $("#catalog").onclick = catalog;
  $("#close-list").onclick = () => $("#list-dialog").close();
  $("#close-detail").onclick = () => $("#detail-dialog").close();

  $("#test-api").onclick = async () => {
    const button = $("#test-api");
    button.disabled = true;

    try {
      const result = await PokedexAPI.check();
      toast(result.message);

      $("#status").textContent = result.ok
        ? (result.demo ? "● MODO DEMO" : "● API CONECTADA")
        : "● ERROR API";
    } finally {
      button.disabled = false;
    }
  };

  document.addEventListener("keydown", event => {
    if ($("#detail-dialog").open || $("#list-dialog").open) return;

    if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      nav(-1);
    }

    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      nav(1);
    }

    if (
      event.key === "Enter" &&
      document.activeElement.tagName !== "INPUT"
    ) {
      details();
    }

    if (event.key.toLowerCase() === "r" && S.list.length) {
      S.i = Math.floor(Math.random() * S.list.length);
      render();
    }
  });

  (async () => {
    try {
      S.list = await PokedexAPI.getList();

      if (!S.list.length) {
        throw new Error("La API no devolvió Pokémon.");
      }

      S.list.sort((a, b) => a.id - b.id);
      S.i = Math.max(0, S.list.findIndex(p => p.id === 1));

      render();

      if (
        "serviceWorker" in navigator &&
        location.protocol.startsWith("http")
      ) {
        navigator.serviceWorker
          .register("./service-worker.js")
          .catch(console.warn);
      }
    } catch (error) {
      $("#name").textContent = "ERROR DE CARGA";
      $("#description").textContent = error.message;
      toast("Revisa la configuración de la API");
      console.error("Error cargando la Pokédex:", error);
    }
  })();
})();
