# SorareFutScout — Fase 2: datos reales (beta)

## Estado
- Web pública principal: https://sorarefutscout.pages.dev/
- Demo original: `index.html` (datos ficticios)
- Nueva vista beta: `datos-reales.html` (consulta individual verificada con Haaland)
- Nuevo explorador: `explorador.html` (búsqueda + filtros locales + ficha + comparador, búsqueda y comparación verificadas; nuevas fotos y tabla pendientes de comprobar)
- Backend: `functions/api/player.js`, ruta `/api/player?slug=erling-haland`
- Backend de búsqueda: `functions/api/search.js`, ruta `/api/search?q=haaland&page=1` (12 jugadores por página)
- Código fuente: `karimruiz7/sorarefutscout`

## Implementado en el repositorio
- Consulta GraphQL prefijada para un futbolista por su slug de Sorare; no acepta GraphQL arbitrario.
- Campos: nombre, club, posición, medias L5/L10/L15 y últimas 5 puntuaciones.
- Cloudflare Pages Function que consulta `https://api.sorare.com/federation/graphql` (endpoint anunciado el 19 de agosto de 2026).
- Caché de 10 minutos en borde, manejo de errores, respuestas 429 y validación de slug.
- Pantalla de prueba con ejemplos Haaland / Mbappé y un campo para pegar la URL de un jugador.

**Estado:** el usuario ha comprobado la consulta individual, la búsqueda y el comparador con datos reales. La nueva consulta de fotografías y medias L10/L15 en listados está subida pero aún no se ha probado en Cloudflare. Si la API rechaza `pictureUrl`, el backend reintenta sin foto. Los retratos se muestran únicamente si la API devuelve una URL HTTPS del dominio Sorare.

## Próximos hitos
- [x] Verificar que `/datos-reales.html` carga desde Cloudflare.
- [x] Consultar a Haaland y verificar la respuesta real de la API.
- [x] Probar `explorador.html` con Haaland y el comparador Haaland/Mbappé, y corregir la paginación desde 1.
- [x] Añadir vistas de tarjetas/tabla avanzada y ordenación por medias L5/L10/L15.
- [x] Solicitar miniaturas opcionales con `pictureUrl(derivative: "avatar")` y fallback a iniciales; sin afirmar aún que se visualizan en todos los jugadores.
- [ ] Comprobar que la tabla, las fotos y la nueva consulta GraphQL funcionan en producción y móvil.
- [ ] Resolver permisos/límites de la API y las condiciones para uso público a escala.
- [x] Añadir un enlace desde la página principal al explorador de datos reales (beta).
- [ ] Integrar los datos reales en todos los módulos del panel original y eliminar datos simulados cuando cada módulo esté validado.
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

## Derechos de imagen
La API de Sorare documenta `Player.pictureUrl(derivative: "avatar")`. El uso de una imagen en una web pública está sujeto a los derechos de los titulares y a los términos de la API: disponer de la URL no equivale a una licencia general de reutilización. Verificar autorizaciones antes de lanzamiento/promoción comercial o desactivar las miniaturas si es necesario.
