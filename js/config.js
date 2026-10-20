// Configuración del backend publicado en Render.
window.POKEDEX_CONFIG = {
  USE_MOCK_DATA: false,
  BASE_URL: "https://pokedex-backend-g1ql.onrender.com",
  ENDPOINTS: {
    list: "/api/pokemon",
    detail: "/api/pokemon/{idOrName}"
  },
  PAGE_LIMIT: 20,
  REQUEST_TIMEOUT_MS: 20000
};
