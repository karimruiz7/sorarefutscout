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
- [x] Añadir filtros de medias mínimas L5/L10/L15 y opción de jugadores con club, sobre la página cargada.
- [x] Añadir un gráfico de las últimas cinco puntuaciones disponibles al abrir la ficha / comparación.
- [ ] Validar la nueva UI de filtros e historial en Cloudflare, escritorio y móvil.
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


## Mejoras de estabilidad tras pruebas del 18-11-2026
- [x] Comprobado en la web pública: miniatura de Haaland y tabla avanzada con medias L5/L10/L15.
- [x] Detectado límite HTTP 429 al buscar Rayan; no indica que la consulta sea incorrecta.
- [x] `functions/api/search.js`: caché compartida local a cada centro de datos de Cloudflare (15 minutos en resultados válidos), respeto de cabecera `Retry-After` de Sorare y periodo de enfriamiento para evitar reconsultas inmediatas.
- [x] `explorador.html`: caché de sesión de 10 minutos para búsquedas repetidas, mantiene últimos resultados si una consulta falla y muestra el tiempo de espera aproximado.
- [ ] Validar el despliegue más reciente y probar una búsqueda repetida de Rayan, sabiendo que el límite de Sorare puede seguir aplicando a búsquedas nuevas.
- [ ] Para tráfico público a escala, evaluar permiso o API key de Sorare que permita mayor tasa de peticiones; guardar la clave solo como secreto de Cloudflare.

## Fase 2.2 — Filtros y gráficos (18-11-2026)
- Añadidos umbrales numéricos L5/L10/L15 (de 0 a 100), checkbox «Solo con club» y botón para restablecer filtros.
- Se usan los datos ya cargados de la API, sin nuevas peticiones por cada filtro; afectan únicamente a los resultados de la página visible, NO a un ranking global.
- Las fichas individuales incluyen gráfico accesible de cinco resultados recientes (`rawPlayerGameScores`), sin inventar las puntuaciones ausentes.
- Mantener una distinción visible entre medias históricas, elegibilidad y proyecciones futuras: son conceptos distintos.
- Estado: el código está publicado en GitHub, pendiente de validación en Cloudflare.

## Fase 2.3 — Plantillas por equipo exacto
- [x] Identificada la causa del error: la búsqueda de texto «Real Madrid» también devolvía jugadores de «Real Oviedo» por similitud de nombre.
- [x] Creado backend `functions/api/club.js` con `football.club(slug).activePlayers` y paginación por cursor.
- [x] Añadidos selector de modo y lista inicial de 5 clubes con slugs comprobados en Sorare.
- [x] Activada detección automática de nombres exactos de clubes conocidos en el buscador general.
- [x] Evitar mezclar jugadores con `activeClub.slug` ajeno al club seleccionado cuando Sorare incluye ese campo.
- [ ] Verificar en producción `/api/club?slug=real-madrid-madrid` y confirmar visualmente que aparece la plantilla en vez de resultados difusos.
- [ ] Contrastar registros oficiales del club para decidir si merece la pena un estado de plantilla confirmado por fuente adicional.
- [ ] Extender el catálogo con clubes identificados por sus slugs Sorare, sin inventar identificadores.

**Advertencia:** no prometer plantillas oficialmente registradas y actualizadas al instante. `activePlayers` significa jugadores activos de ese club según Sorare; no siempre equivale a una lista oficial de inscritos o convocados. La caché dura 15 minutos y limita las peticiones repetidas.

## Fase 3 — Optimizador con medias reales (18-11-2026)
- [x] Añadido `optimizador-real.html` independiente de la demo ficticia.
- [x] Enlazados el explorador, el nuevo optimizador y la portada.
- [x] Selección local de hasta 120 jugadores a partir de `/api/search` y `/api/club`, sin peticiones nuevas para cada combinación.
- [x] Motor SO5/SO7 por programación dinámica, máxima suma de L5/L10/L15, posiciones reglamentarias básicas y un jugador por plaza.
- [x] Probados casos sintéticos SO5, SO7 y equipo imposible sin portero.
- [ ] Probar flujo real: cargar plantilla desde explorador, añadir visibles, abrir optimizador y generar SO5/SO7.
- [ ] Validar permisos de miniaturas y condiciones de reutilización antes de promocionar.
- [ ] Añadir verificación de cartas poseídas mediante OAuth, temporada/escasez, elegibilidad por competición, cap, calendario, lesiones/DNP, sustitutos y proyección futura, tras validar acceso y disponibilidad de datos.

**Nota:** «optimizar» aquí significa maximizar una estadística histórica, no garantizar puntos futuros ni generar automáticamente una alineación válida para todas las competiciones.

## Fase 3.1 — Distinguir colecciones y modalidades

- [x] Confirmado en la ayuda oficial: Arcade, Pro y Arena son tres modos distintos (no equivalen a SO5/SO7).
- [x] Registradas las cuatro ligas del set WNTR de sobres de Sorare: LaLiga, Bundesliga, Premier League, Ligue 1. La lista puede cambiar con otros sets.
- [x] Añadido selector de contexto (libre, Arcade, Pro/Arena) al optimizador.
- [x] Añadidas marcas manuales de propiedad Arcade y Pro/Arena por jugador, persistidas en `localStorage`.
- [x] En Arcade el optimizador permite solo los jugadores marcados como colección Arcade y utiliza SO5.
- [x] En Pro/Arena utiliza solo cartas marcadas manualmente para competición, pero no garantiza elegibilidad real.
- [x] El explorador preserva las marcas de colección al actualizar medias.
- [x] Pruebas de algoritmo: cinco cartas Arcade marcadas dan la suma L5 esperada, una carta exclusiva Pro queda fuera, colección Pro incompleta no construye un equipo.
- [ ] Verificar la actualización publicada en Cloudflare y confirmar el flujo manual.
- [ ] Incorporar verificación de la liga actual de cada jugador desde una fuente documentada, sin inferirla de su nombre.
- [ ] Conectar datos de colección mediante OAuth y validar reglas específicas de tablero / Game Week cuando Sorare conceda acceso autorizado.
