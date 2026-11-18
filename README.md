# SorareFutScout ⚽

Plataforma independiente y no oficial de análisis, comparación de futbolistas y optimización de alineaciones para Sorare Fútbol.

## Web pública
**https://sorarefutscout.pages.dev/**

- [Demo principal](https://sorarefutscout.pages.dev/) — explorador, comparador y optimizador basados en **datos simulados**.
- [Explorador real — beta](https://sorarefutscout.pages.dev/explorador.html) — búsqueda, tarjetas o tabla, retratos, filtros avanzados, gráfico de historial y comparador. Los filtros nuevos están pendientes de validar en producción.
- [Datos reales — beta](https://sorarefutscout.pages.dev/datos-reales.html) — página original de consulta de Sorare, verificada por el propietario el 18-11-2026.

## Fase 1 · Demo
`index.html` contiene el diseño responsive y herramientas de prueba:
- Explorador de jugadores y filtros por posición.
- Comparador de futbolistas.
- Optimizador de alineaciones de 5 o 7 cartas con restricciones simplificadas.
- Importación/exportación de CSV y alta manual de jugadores.

Las puntuaciones iniciales son ficticias. El optimizador no reproduce todas las reglas vigentes de las competiciones.

## Fase 2 · Primera conexión
- `explorador.html`: búsqueda por nombre, páginas de resultados, fichas L5/L10/L15, comparación de dos futbolistas, filtros locales por posición/club/medias mínimas L5-L10-L15, ordenación y selector tarjetas/tabla avanzada. Las fichas muestran un gráfico de las últimas cinco puntuaciones devueltas por Sorare, con huecos para datos faltantes. Si hay una URL válida en la API, enseña el retrato en miniatura; si falta o falla, vuelve a las iniciales.
- `functions/api/search.js`: búsqueda real con `searchPlayers` (12 resultados/página), medias L5/L10/L15 y `pictureUrl(derivative: "avatar")` cuando está disponible. Si Sorare rechaza el campo de imagen, reintenta sin foto para no interrumpir la búsqueda.
- `datos-reales.html`: formulario para consultar futbolistas reales por slug o URL de Sorare.
- `functions/api/player.js`: Cloudflare Pages Function que solicita, mediante GraphQL, nombre, equipo, posición, L5/L10/L15 y cinco resultados.
- Usa el endpoint federado oficial, manejo de errores y caché para evitar consultas redundantes.
- **Validación:** el propietario confirmó la búsqueda y el comparador real el 18-11-2026. Las fotografías y la tabla fueron confirmadas en la web pública con capturas del usuario. Los nuevos filtros de medias y el gráfico de historial requieren comprobar su despliegue. Si falla, la demo principal permanece disponible.

Consulta el [plan de fase 2](docs/FASE2.md).

## Alojamiento
Cloudflare Pages conectado a GitHub. Los cambios de la rama `main` deberían generar nuevos despliegues si la conexión automática sigue activa. Proyecto HTML estático con funciones serverless; sin servicio local ni contraseña de Sorare.

## Seguridad y aviso
Proyecto independiente, no afiliado ni respaldado por Sorare. No se solicitan contraseñas ni claves personales, y no se almacenan credenciales en el repositorio.

## Imágenes y condiciones de uso
Los retratos proceden de URLs devueltas por la API de Sorare; la existencia de una URL pública **no concede automáticamente derechos de reutilización**. Antes de promocionar o monetizar la web hay que revisar los derechos de imagen, las condiciones de uso de Sorare y cualquier autorización aplicable. Si no hay imagen o permiso, mantener las iniciales.


**Alcance de los filtros:** posición, club, mínimos L5/L10/L15 y ordenación se aplican **solo a los resultados de la página cargada** (hasta 12), no a toda la base de datos de Sorare. Las medias históricas no indican automáticamente que un futbolista esté activo o sea elegible en una competición.
