# SorareFutScout — Fase 2: datos reales (beta)

## Estado
- Web pública principal: https://sorarefutscout.pages.dev/
- Demo original: `index.html` (datos ficticios)
- Nueva vista beta: `datos-reales.html` (solo presenta información auténtica si la API responde)
- Backend: `functions/api/player.js`, ruta `/api/player?slug=erling-haland`
- Código fuente: `karimruiz7/sorarefutscout`

## Implementado en el repositorio
- Consulta GraphQL prefijada para un futbolista por su slug de Sorare; no acepta GraphQL arbitrario.
- Campos: nombre, club, posición, medias L5/L10/L15 y últimas 5 puntuaciones.
- Cloudflare Pages Function que consulta `https://api.sorare.com/federation/graphql` (endpoint anunciado el 19 de agosto de 2026).
- Caché de 10 minutos en borde, manejo de errores, respuestas 429 y validación de slug.
- Pantalla de prueba con ejemplos Haaland / Mbappé y un campo para pegar la URL de un jugador.

**Pendiente:** confirmar en Cloudflare que la Function ha sido desplegada y que Sorare permite estas consultas públicas. La subida a GitHub no equivale a una conexión verificada. Si la API rechaza peticiones o cambia el esquema, ajustar el backend sin tocar la demo existente.

## Próximos hitos
- [ ] Verificar que `/datos-reales.html` carga desde Cloudflare.
- [ ] Consultar a Haaland y Mbappé y verificar la respuesta real de la API.
- [ ] Resolver permisos/límites de la API y las condiciones para uso público a escala.
- [ ] Incorporar datos auténticos al explorador y comparador de la página principal.
- [ ] Implementar filtros e historial.
- [ ] Estudiar OAuth para importar la colección personal del usuario con su autorización.
- [ ] Adaptar el optimizador a las reglas efectivas de cada competición.

## Seguridad y transparencia
- Nunca solicitar contraseñas, JWT, claves API o secretos OAuth por chat.
- Si se concede una clave de Sorare, guardarla como secreto en Cloudflare, no en GitHub.
- No mostrar estadísticas ficticias como oficiales ni afirmar que una proyección sea dato de Sorare.
- Proyecto independiente, no afiliado ni patrocinado por Sorare.

## Referencias
- Documentación: https://github.com/sorare/api
- Changelog: https://github.com/sorare/api/blob/master/CHANGELOG.md
- Esquema: https://api.sorare.com/graphql/schema
- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/get-started/
