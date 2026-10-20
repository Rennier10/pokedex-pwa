# Pokédex PWA

## Probar en tu computador
1. Descomprime el ZIP y abre la carpeta `pokedex-pwa` en VS Code.
2. Abre Terminal > New Terminal.
3. Ejecuta `python -m http.server 8080`.
4. Abre `http://localhost:8080` en Chrome.
5. Prueba flechas, búsqueda, catálogo, detalles y aleatorio.

No abras `index.html` directamente con `file://`; para las funciones PWA necesitas HTTP/HTTPS. Las imágenes usan URLs públicas y requieren conexión. Los datos físicos, estadísticas, habilidades y descripciones son de demostración.

## Conectar el backend real
Edita `js/config.js`:
- `USE_MOCK_DATA: false`
- `BASE_URL`: URL HTTPS pública del backend
- `ENDPOINTS.list`: ruta real del listado
- `ENDPOINTS.detail`: ruta real del detalle con `{id}`

`js/api.js` contiene un adaptador inicial para campos como `name/nombre`, `image/imagen`, `types/tipos`, `stats/estadisticas`. Debe ajustarse al JSON real. Si la API requiere autenticación o paginación, también habrá que adaptar el servicio. El backend debe permitir CORS desde el dominio Render del frontend.

## Publicar en Render
1. Sube el contenido de esta carpeta a GitHub.
2. En Render elige **New + > Static Site** y conecta el repositorio.
3. Si el proyecto está en la raíz, deja Root Directory vacío.
4. Build Command: vacío.
5. Publish Directory: `.` (punto).
6. Crea el sitio y abre la URL HTTPS.

## Instalar en Android
Abre la URL de Render en Chrome Android > menú ⋮ > “Instalar aplicación” o “Añadir a pantalla de inicio”. El manifiesto y service worker están incluidos. Para producción conviene generar iconos PNG de 192 y 512 px y añadirlos al manifiesto.
