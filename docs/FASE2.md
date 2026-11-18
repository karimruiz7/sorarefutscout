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

## Fase 3.2 — Próximo partido puntuable y filtro opcional
- [x] Verificado en el esquema oficial de Sorare el campo `Player.nextGame(so5FixtureEligible: true)` y `AnyGameInterface.so5Fixture` con fecha, clubes, GW, inicio y fin.
- [x] Añadida Cloudflare Pages Function `functions/api/next-games.js`, hasta 12 futbolistas por consulta con validación de entrada y caché.
- [x] Añadidos botón «Consultar próximos partidos», columna de partido y detalles junto a las cartas del resultado del optimizador.
- [x] Incluido filtro **opcional** de siete días, desactivado mientras faltan datos de alguno de los candidatos del modo elegido. Siete días no es un reemplazo de la GW oficial.
- [x] Validación sintáctica y lógica del filtro de calendario con +1 día, +10 días y ausencia de datos.
- [ ] Verificar respuesta real de la API en Cloudflare y comprobar calendario de cinco jugadores del modo Arcade.
- [ ] Incorporar un selector de Game Week real y reglas de elegibilidad particulares de cada modo, tras verificar en el backend los fixtures oficiales.

No afirmar que se puede predecir titularidad o que «próximo partido puntuable» garantiza que la carta pueda entrar en cualquier competición.

## Fase 3.3 — Etiquetas de dificultad (18-11-2026)
- [x] Incorporar etiquetas con cinco niveles por colores y texto: muy favorable, favorable, equilibrado, difícil y muy difícil.
- [x] Calcular nivel desde el puesto del jugador (atacante vs portero/defensa) y las estadísticas de goles del rival, con umbrales documentados.
- [x] Mostrar estado neutro «Sin evaluar» cuando no haya tres partidos válidos o el rival no esté identificado.
- [x] Añadir explicación accesible «¿Por qué esta dificultad?» junto al partido.
- [x] Mantener el modelo experimental opcional sin afectar el cálculo por medias si no está activado.
- [x] Comprobar sintaxis y clasificación de cinco escenarios sintéticos + desconocido.
- [ ] Confirmar en Cloudflare el aspecto y la consulta real de `/api/matchups`.
- [ ] Valorar mejoras futuras: local/visitante, goles esperados, fuerza de rivales, racha ponderada y Game Week oficial. No añadir métricas sin fuente.

## Fase 3.3.1 — Control de errores 429 en análisis de rivales (18-11-2026)

El usuario observó que, después de pulsar «Analizar enfrentamientos», Sorare devolvió HTTP 429 y los cinco jugadores quedaron como «Sin evaluar». Esto **no** demuestra que los rivales carezcan de resultados: no se recibió una respuesta completa para calcular los índices.

- `functions/api/matchups.js`: transmite `retry-after` y `reason=rate_limit`; respeta la espera de Sorare y la memoriza temporalmente como marcador de caché interno 200 (no representa falsamente una respuesta correcta ante el visitante). En Cloudflare, el enfriamiento de caché es por ubicación de borde, no global.
- `optimizador-real.html`: memoriza el enfriamiento en `sessionStorage`, evita volver a consultar durante ese tiempo y explica los segundos aproximados restantes.
- Las etiquetas ahora distinguen **Límite API** (consulta bloqueada), **Pendiente** (sin consultar), **Sin datos** (hubo respuesta pero insuficiente historial) y los cinco niveles de dificultad calculados.
- Se mantiene sin cambios el optimizador por medias históricas, y no se asignan índices de rival ficticios cuando Sorare no devuelve estadísticas.
- Probada sintaxis JavaScript y mapeo de estados con ejemplos simulados. Falta verificar en Cloudflare el último despliegue y la disponibilidad real de la API tras la pausa.

Referencia: https://github.com/sorare/api#rate-limit

A escala pública probablemente será necesaria una vía autorizada de mayor capacidad de la API, disponible mediante proceso de Sorare. Nunca guardar claves en el frontend o GitHub.

## Fase 3.4 — Selección por Game Week oficial de Sorare (18-11-2026)

- El optimizador `optimizador-real.html` añade un selector de Game Week a partir de `so5Fixture.gameWeek` y `so5Fixture.displayName` **realmente devueltos** por la API `/api/next-games` de los jugadores seleccionados. No inventa semanas ni sustituye esta numeración por el rango de siete días.
- El desplegable solo se activa cuando todos los futbolistas disponibles en el contexto elegido (Arcade / Pro-Arena / análisis libre) tienen un estado de calendario consultado; las GW aparecen únicamente para jugadores con el próximo partido puntuable identificado. Si no hay GW disponible, se explica.
- Al elegir una GW, el motor de optimización utiliza exclusivamente futbolistas cuyo `nextGame` conocido pertenece a ella. Se señala «En GW seleccionada» o «Fuera de GW» en cada fila de la tabla. Se muestra número de candidatos de la jornada y se avisa si falta cualquier posición. El sistema **no** incorpora una carta de otra jornada para completar el equipo.
- Se conserva el filtro alternativo «partido en los próximos 7 días» pero no se puede activar a la vez que el de GW.
- **Sin nuevas peticiones** de Sorare al cambiar el selector: se aprovechan los datos de calendario ya disponibles y se conservan las etiquetas de dificultad del rival y la selección de cartas.
- **Limitación importante:** la API actual consulta solo el **próximo partido puntuable** de cada jugador, no el calendario completo de múltiples semanas ni todas las posibles competiciones. Por tanto, no garantiza elegibilidad real, no descubre partidos adicionales en futuras GW y no indica si la carta podrá inscribirse en Arcade/Pro/Arena.
- Comprobados sintaxis JavaScript y seis escenarios de selección: varias GW, partida de jugadores en GW, falta de GW, ausencia de partidos, alternancia de selección y equipo incompleto sin posiciones necesarias. Pendiente de validar el flujo en Cloudflare.

Fuente sobre calendario de GW: https://sorare.com/es/help/a/21439051570973/introduction-g-n-rale-sorare-football

## Fase 3.5 — Comparador de hasta 3 alineaciones reales (18-11-2026)

- `optimizador-real.html` calcula ahora hasta **tres combinaciones distintas de futbolistas** ordenadas por máxima suma de la media seleccionada L5/L10/L15. Si se activa «Priorizar rivales», se utiliza el **índice experimental** de enfrentamientos en vez de la media pura.
- Comparador visual: opciones 1/2/3 con su suma y diferencia respecto a la primera, tarjetas de cada once y explicación de qué jugadores entran y salen en cada opción.
- Se respetan **todos los filtros existentes**: Arcade / Pro-Arena / análisis libre, restricciones SO5/SO7, jugadores con próximo partido a siete días o GW Sorare elegida. Solo se consideran los jugadores cargados en la selección local.
- El algoritmo usa programación dinámica por máscaras de puestos, conservando las tres mejores selecciones **únicas por conjunto de jugadores**, para no presentar como alternativa el mismo once con posiciones intercambiadas. No repite jugadores, ni incluye portero en la plaza extra.
- Si solo hay una o dos combinaciones válidas, lo explica y no inventa alternativas. Con exactamente cinco cartas válidas para SO5, normalmente solo aparece una opción; para comparar hacen falta más cartas elegibles.
- No se hacen llamadas adicionales a Sorare para calcular alternativas.
- **Validación técnica:** sintaxis JS comprobada; los resultados top-3 coinciden con enumeración exhaustiva en 10 escenarios SO5/SO7, con y sin portero, con selección limitada, y con ajuste experimental del rival. Falta confirmar la actualización de Cloudflare con la colección real.
- El orden es un análisis estadístico histórico, **no una previsión validada** de puntos o elegibilidad; se desconocen cartas verdaderamente poseídas, alineaciones iniciales y posibles bajas.

## Fase 3.6 · Oportunidad individual de los futbolistas (18-11-2026)

Objetivo: evitar interpretar «defensa fuerte del rival» como equivalente a «mal rendimiento probable de todos los atacantes». Separar la **dificultad del rival**, la **forma individual observada** y la **valoración conjunta experimental**, sin confundirla con una predicción.

### Fórmula explícita (experimental, no oficial)
- Índice inicial de forma: `0.55 × L5 + 0.30 × L10 + 0.15 × L15`, utilizando las **medias reales de Sorare** guardadas desde el explorador. Son pesos elegidos para esta primera versión, no pesos oficiales.
- Si falta L15, se calcula `(0.55 × L5 + 0.30 × L10) / 0.85`; no se inventa un L15 de cero.
- Son necesarios L5 y L10 numéricos. Si faltan, índice no disponible y jugador excluido del criterio «Oportunidad individual», no del resto de los cálculos.
- Ajuste individual del rival (opcional): `0.35 × ajuste de rival` (el índice de enfrentamientos existente está limitado a ±12, por lo que el impacto individual no supera ±4,2).
- Resultado: `max(0,min(100, forma + ajuste_reducido))`, mostrado con una decimal. Si faltan datos del rival, se mantiene el índice **parcial de forma** y se etiqueta expresamente «Rival sin evaluar».
- Tendencia mostrada: `L5 − L10`, «En alza» si >= 8, «En descenso» si <= −8, «Estable» en los demás casos. La tendencia es informativa y **no se suma por segunda vez** a la fórmula.
- Localía: se muestra como contexto (local/visitante cuando Sorare lo identifica); **no se añade bonificación** hasta disponer de evidencia por jugador y localía.
- **No incorpora** minutos previstos, lesiones, titularidad, estado físico, xG, tiros, recencia por fecha, puntos por carta, escasez ni elegibilidad (no verificados por la app). El índice no representa probabilidad ni puntos esperados.

### Interfaz
- Se añade un panel «Oportunidad individual · beta» con los pesos visibles y la casilla **Optimizar por oportunidad individual**.
- La tabla muestra para cada jugador el índice 0–100, tendencia, estado del rival y un desplegable «¿Por qué este índice?» con desglose y localía verificada.
- Es un **tercer criterio independiente**: al activarlo, se desactiva «Priorizar rivales más favorables», y viceversa. El selector L5/L10/L15 se deshabilita mientras el índice combinado está activado para no dar a entender que influye en la fórmula.
- Se respetan filtros por colección Arcade/Pro-Arena, selección de Game Week y SO5/SO7, y el comparador top-3 muestra los índices en vez de presentar cifras como «puntos previstos».
- No se hacen llamadas nuevas a Sorare para calcular el índice: usa datos cargados localmente de jugadores y rivales.

### Validación
- [x] Sintaxis JS verificada y todos los controles con ID estático encontrados en el HTML.
- [x] Casos de prueba con jugador en alza y rival exigente (índice 66,4 frente a media L10 58), tendencia opuesta, ausencia de L15, ausencia de L5 o L10, rival no evaluado, explicación y tres alineaciones distintas.
- [ ] Verificar en producción el despliegue de Cloudflare, los desglose individuales y el cambio entre tres criterios.
- [ ] Calibrar pesos con históricos observados antes de presentar el índice como una señal estadística validada. Revisar fuentes fiables para minutos/titularidad/localía y acciones específicas.

Contexto de Sorare: https://sorare.com/help/a/4402904001809/how-does-scoring-work-in-sorare-football y https://sorare.com/blog/football/l15-%E2%86%92-l10-update-2.

## Fase 3.6.1 · Calendarios que sobreviven a límites de Sorare (18-11-2026)

Incidencia real: el usuario seleccionó ocho jugadores, pero la siguiente consulta de calendario devolvió HTTP 429 y el panel mostró «0 jugadores», desactivó el selector de GW y el índice individual quedó parcial con «rival sin evaluar». La consulta anterior ya había funcionado. La causa inmediata es el límite de Sorare; la caché anterior solo duraba 15 minutos en `sessionStorage`, no recuperaba datos caducados ni compartía jugadores individuales entre selecciones.

**Solución publicada en código:**

- El frontend `optimizador-real.html` migra snapshots antiguos `sessionStorage` (v1 y v2) al almacenamiento local por jugador `sorarefutscout:next-games:per-player:v1`, preservando **la fecha original de obtención**.
- Los calendarios recientes (edad menor que cuatro horas, fecha de partido vigente) no requieren nuevas llamadas. El botón «Consultar próximos partidos» solicita solo los futbolistas sin calendarios recientes; divide la consulta en lotes de hasta seis para conservar éxitos parciales si otro lote resulta limitado.
- Los calendarios de hasta 36 horas se pueden **mostrar claramente como anteriores/sin confirmar**, pero nunca habilitan filtros de Game Week ni ajustan rivales hasta actualizarse. Se descartan las fechas pasadas.
- El frontend detecta HTTP 429, registra el tiempo de espera `Retry-After` y bloquea nuevos intentos desde el navegador hasta que pase el periodo. El backend `functions/api/next-games.js` utiliza un marcador de enfriamiento en Cloudflare (caché local de borde), respetando el tiempo de Sorare. No almacena 429 como éxito.
- Se conservan los últimos análisis de rivales durante seis horas en almacenamiento local; también se migran los resultados existentes en `sessionStorage`. El índice «Oportunidad individual» muestra cuántos jugadores tienen **rival evaluado** y cuántos solo un **índice parcial de forma**.
- Los filtros de jornadas siguen siendo estrictos: no se inventan partidos, y los datos antiguos no se consideran actuales para optimizar.
- **Validación técnica:** JS sintácticamente válido, sin controles HTML duplicados ni ausentes; escenarios simulados de migración de sesión antigua, persistencia al recargar, conservación de la marca temporal, datos anteriores que no habilitan GW, descarte de partidos caducados y manejo de espera API. Pendiente probar Cloudflare contra Sorare sin superar su límite.

**Limitación:** esta solución reduce consultas duplicadas, pero no puede eludir el límite de Sorare. Si el usuario abrió una pestaña nueva sin caché ni datos históricos locales, debe respetar `Retry-After`. Para un servicio público con tráfico, estudiar la generación de una API key autorizada en https://sorare.com/settings/developer, guardándola únicamente en secretos de Cloudflare (nunca en GitHub ni frontend).

Referencia oficial: https://github.com/sorare/api#rate-limit

## Fase 4.1 — Preparación de OAuth Sorare (18-11-2026)

Objetivo de producto: conectar Sorare, importar cartas compatibles y preparar las mejores alineaciones en pocos pasos. Diez minutos es un objetivo futuro de experiencia, no una función validada.

### Implementación

- [x] Página `/mi-club.html` con estado de conexión y cierre de sesión.
- [x] Página `/privacidad.html` informativa provisional; faltan datos del responsable y un canal de contacto antes de permitir OAuth al público.
- [x] Navegación desde Inicio, Explorador, Optimizador y Disponibilidad.
- [x] Rutas Cloudflare Pages Functions: `/auth/sorare/start`, `/auth/sorare/callback`, `/api/auth/config`, `/api/auth/session`, `POST /api/auth/logout`.
- [x] Flujo Authorization Code backend con `state` aleatorio, cookie segura `HttpOnly`/`Secure`/`SameSite=Lax`, comparación de estado y verificación del perfil autenticado.
- [x] Sesión cifrada AES-GCM con clave derivada mediante HKDF del OAuth Client Secret y persistencia en Cloudflare KV `SFS_SESSIONS` durante 7 días. Tokens no expuestos al navegador. Refresh y cierre de sesión mediante backend.
- [x] OAuth deshabilitado mientras falten credenciales, KV o el contacto de privacidad. La clave pública de servidor `SORARE_API_KEY` es independiente.
- [ ] Registrar la aplicación OAuth en Sorare desde https://sorare.com/settings/developer y obtener Client ID y Client Secret.
- [ ] Configurar nombre SorareFutScout, website `https://sorarefutscout.pages.dev` y callback EXACTO `https://sorarefutscout.pages.dev/auth/sorare/callback`.
- [ ] En Cloudflare Production: `SORARE_OAUTH_CLIENT_ID` (variable), `SORARE_OAUTH_CLIENT_SECRET` (secreto), `SFS_PRIVACY_CONTACT` (contacto privado mediante correo público) y vincular KV bajo nombre `SFS_SESSIONS`.
- [ ] Completar revisión de privacidad y probar el flujo OAuth real con autorización, renovación y desconexión.
- [ ] Implementar importación de cartas de solo lectura con paginación y distinguir si Sorare facilita también el modo Arcade; todavía sin verificar.
- [ ] Realizar auditoría de seguridad y escala antes de activar OAuth a usuarios públicos.

Sorare OAuth da acceso autorizado a información básica y cartas; no proporciona email, futuras alineaciones privadas ni operaciones de compraventa. Enlaces: https://github.com/sorare/api#oauth-authentication--login-with-sorare

**Activación deliberada:** el backend solo activa OAuth cuando, además de credenciales, KV y contacto, se configura explícitamente `SFS_OAUTH_ENABLED=true` en Production. No activar esta variable hasta completar revisión de privacidad y pruebas del registro.
