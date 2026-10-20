
(() => {
  const c = window.POKEDEX_CONFIG;

  async function request(url) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      c.REQUEST_TIMEOUT_MS || 20000
    );

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("La petición tardó demasiado.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function buildUrl(path) {
    const base = c.BASE_URL.replace(/\/+$/, "");
    return base + (path.startsWith("/") ? path : "/" + path);
  }

  function normalize(raw, fallbackId) {
    const id = Number(raw.id ?? raw.numero ?? fallbackId);

    const types = (raw.types ?? raw.tipos ?? []).map(t =>
      typeof t === "string"
        ? t
        : t.name ?? t.nombre ?? t.type?.name ?? "normal"
    );

    const sourceStats = raw.stats ?? raw.estadisticas ?? {};

    const stat = (...keys) => {
      for (const key of keys) {
        if (sourceStats[key] != null) {
          return Number(sourceStats[key]) || 0;
        }
      }
      return 0;
    };

    const sprites = raw.sprites ?? {};
    const sprite =
      raw.sprite ??
      sprites.front ??
      sprites.front_default ??
      "";

    const artwork =
      raw.artwork ??
      raw.image ??
      raw.imagen ??
      sprites.artworkOfficial ??
      sprites.other?.["official-artwork"]?.front_default ??
      sprite;

    const abilities = (raw.abilities ?? raw.habilidades ?? [])
      .map(a => {
        if (typeof a === "string") {
          return { name: a, isHidden: false };
        }

        return {
          name: a.name ?? a.nombre ?? a.ability?.name ?? "Desconocida",
          isHidden: Boolean(a.isHidden ?? a.is_hidden ?? false)
        };
      });

    return {
      id,
      name: raw.name ?? raw.nombre ?? `Pokémon ${id}`,
      genus: raw.genus ?? "",
      image: artwork || sprite,
      sprite,
      artwork: artwork || sprite,
      sprites: {
        front: sprites.front ?? sprite,
        back: sprites.back ?? "",
        frontShiny: sprites.frontShiny ?? "",
        artworkOfficial: artwork || sprite
      },
      types: types.length ? types : ["normal"],
      height: raw.height != null
        ? Number(raw.height) / 10
        : Number(raw.altura ?? 0),
      weight: raw.weight != null
        ? Number(raw.weight) / 10
        : Number(raw.peso ?? 0),
      baseExperience: Number(raw.baseExperience ?? 0),
      captureRate: Number(raw.captureRate ?? 0),
      abilities,
      description:
        raw.flavorText ??
        raw.description ??
        raw.descripcion ??
        "Descripción no disponible.",
      stats: {
        hp: stat("hp", "vida"),
        attack: stat("attack", "ataque"),
        defense: stat("defense", "defensa"),
        "special-attack": stat("specialAttack", "special-attack", "ataque_especial"),
        "special-defense": stat("specialDefense", "special-defense", "defensa_especial"),
        speed: stat("speed", "velocidad")
      },
      evolvesFrom: raw.evolvesFrom ?? null,
      evolvesTo: raw.evolvesTo ?? []
    };
  }

  async function getList() {
    if (c.USE_MOCK_DATA) {
      return window.MOCK_POKEMON.map((p, i) => normalize(p, i + 1));
    }

    const all = [];
    let offset = 0;
    let total = Infinity;
    let pageSize = 20;

    while (offset < total) {
      const url = buildUrl(
        `${c.ENDPOINTS.list}?limit=${pageSize}&offset=${offset}`
      );

      const response = await request(url);
      const page = Array.isArray(response)
        ? response
        : response.data ?? response.results ??
          response.pokemones ?? response.items;

      if (!Array.isArray(page)) {
        throw new Error("La API no devolvió una lista válida.");
      }

      const meta = response.meta ?? {};
      total = Number(meta.total ?? page.length);
      pageSize = Number(meta.limit ?? pageSize) || pageSize;

      all.push(...page.map((p, i) => normalize(p, offset + i + 1)));

      if (page.length === 0 || page.length < pageSize) break;
      offset += page.length;
    }

    return [...new Map(all.map(p => [p.id, p])).values()]
      .sort((a, b) => a.id - b.id);
  }

  async function getDetail(idOrName) {
    if (c.USE_MOCK_DATA) {
      const p = window.MOCK_POKEMON.find(
        x => x.id === Number(idOrName) ||
          x.name.toLowerCase() === String(idOrName).toLowerCase()
      );

      if (!p) throw new Error("Pokémon no encontrado.");
      return normalize(p, idOrName);
    }

    const endpoint = c.ENDPOINTS.detail.replace(
      "{idOrName}",
      encodeURIComponent(String(idOrName))
    );

    const response = await request(buildUrl(endpoint));
    return normalize(response.data ?? response.pokemon ?? response, idOrName);
  }

  async function check() {
    try {
      const list = await getList();
      return {
        ok: list.length > 0,
        demo: Boolean(c.USE_MOCK_DATA),
        message: c.USE_MOCK_DATA
          ? "Estás usando datos de demostración."
          : `API conectada: ${list.length} Pokémon cargados.`
      };
    } catch (error) {
      return {
        ok: false,
        demo: Boolean(c.USE_MOCK_DATA),
        message: error.message || "No se pudo conectar."
      };
    }
  }

  window.PokedexAPI = { getList, getDetail, check, normalize };
})();
