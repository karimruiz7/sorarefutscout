# SorareFutScout ⚽

Plataforma independiente y no oficial de análisis, comparación de futbolistas y optimización de alineaciones para Sorare Fútbol.

## Web pública
**https://sorarefutscout.pages.dev/**

- [Panel principal](https://sorarefutscout.pages.dev/) — herramientas y selección local reales.
- [Demo interactiva](https://sorarefutscout.pages.dev/demo.html) — simulación independiente.
- [Mi club](https://sorarefutscout.pages.dev/mi-club.html) — conexión OAuth en preparación; no importa cartas todavía.
- [Privacidad](https://sorarefutscout.pages.dev/privacidad.html) — documento provisional.
- [Explorador real — beta](https://sorarefutscout.pages.dev/explorador.html) — búsquedas por jugador/equipo, tablas, retratos, filtros y comparador. Desde aquí se añaden jugadores reales a la selección del optimizador.
- [Optimizador real — beta](https://sorarefutscout.pages.dev/optimizador-real.html) — alineaciones orientativas SO5/SO7 según L5/L10/L15, dificultad de rivales o índice individual experimental, con comparador top-3.
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

## Fase 2.3 · Búsquedas exactas de equipos (18-11-2026)
- Se añadió el modo «Por jugador / Por equipo» en el explorador.
- En modo equipo se consulta `functions/api/club.js` mediante la operación `football { club(slug) { activePlayers ... } }` del esquema de Sorare, en vez de buscar por texto.
- Clubes inicialmente habilitados con slugs comprobados en Sorare: Real Madrid, FC Barcelona, Atlético de Madrid, Valencia CF y Real Oviedo.
- Escribir exactamente «Real Madrid» en el buscador de jugadores cambia automáticamente al modo equipo. Así se evita incluir al Real Oviedo por coincidencias difusas de texto.
- Cada página trae hasta 20 miembros y admite páginas adicionales usando un cursor; los datos de los clubes quedan cacheados en Cloudflare durante 15 minutos.
- Los futbolistas devueltos con un `activeClub.slug` distinto del equipo solicitado se excluyen, para no mezclarlos.
- **Precisión:** Sorare ofrece el campo `activePlayers`, pero este listado es «plantilla activa según Sorare», no prueba independiente de la inscripción oficial o convocatoria de un club. Para esas verificaciones se consultará también el sitio oficial de cada equipo.
- **Validación:** código y sintaxis listos en GitHub; la nueva ruta `/api/club` debe probarse después de publicarse en Cloudflare.

## Fase 3 · Primer optimizador estadístico (18-11-2026)
- Página: `optimizador-real.html`.
- El explorador `explorador.html` permite **Añadir al optimizador** por jugador o **Añadir jugadores visibles** en bloque, incluyendo resultados de búsqueda por club.
- La selección se conserva solo en el navegador del visitante mediante `localStorage` (clave `sorarefutscout:optimizer-pool:v1`), hasta 120 futbolistas. No solicita acceso a colecciones ni contraseñas.
- SO5: portero, defensa, centrocampista, delantero y extra de campo.
- SO7: portero, dos defensas, dos centrocampistas, delantero y extra de campo.
- Calcula el máximo exacto de la **suma de medias históricas**, según L5/L10/L15, con programación dinámica y sin repetir futbolistas en la alineación.
- Si faltan posiciones o puntuaciones, muestra un aviso y **no** inventa jugadores.
- El estado se congela al añadir el jugador; actualizarlo desde el explorador reemplaza sus medias guardadas.
- **Limitaciones:** permite marcar manualmente cartas supuestamente poseídas, pero no las comprueba en Sorare; tampoco valida temporada/escasez, XP, capitán, límite L10, múltiples alineaciones, encuentros de la próxima Game Week, DNP, lesiones, sustituciones ni elegibilidad real. No es una predicción de puntuaciones, ni registra alineaciones en Sorare.
- **Validación:** archivos de GitHub publicados y sintaxis JS comprobada; algoritmo validado con casos SO5/SO7 y ausencia de portero. Pendiente confirmar el despliegue en Cloudflare y una prueba de usuario.

Reglas oficiales para las posiciones: https://sorare.com/es/game-rules

## Fase 3.1 · Colecciones Arcade y Pro/Arena (18-11-2026)

Sorare describe tres modos: **Arcade** (colecciones y packs), **Pro** (Hot Streaks) y **Arena** (rankings). La compra de cartas no supone que todas las competiciones tengan cuota de entrada; Sorare indica que no hay fee por inscribir alineaciones. Los formatos SO5 y SO7 se aplican según la competición, no son sinónimos de gratuito y de pago.

- `optimizador-real.html` incorpora «Análisis libre», «Arcade · mi colección de sobres» y «Pro/Arena · mis cartas».
- El análisis libre conserva todos los seleccionados. Arcade filtra exclusivamente los futbolistas marcados manualmente como cartas Arcade y fuerza alineación de cinco. Pro/Arena filtra los marcados como cartas competitivas y permite SO5 o SO7 como análisis básico.
- La tabla permite marcar y desmarcar las cartas por jugador. Se guardan localmente (sin conectar cuentas); modificar las puntuaciones desde el explorador conserva las marcas.
- El set de packs WNTR publicado por Sorare incluía **LaLiga, Bundesliga, Premier League y Ligue 1**, conforme a la captura compartida. Otros sets pueden tener otras ligas. Esto se muestra como información del set, no como validación automática del club de cada jugador.
- **Aún no se comprueba** si una carta realmente pertenece a la colección del usuario, si juega en una de esas ligas, si es elegible para un tablero, ni los objetivos/bonus Arcade.

Referencias oficiales:
- https://sorare.com/es/help/a/17629357197341/What%20are%20the%203%20game%20modes%20in%20Sorare%20Football
- https://sorare.com/blog/football/%F0%9F%86%95-introducing-sorare-set
- https://sorare.com/es/game-rules

**Prueba pendiente:** confirmar despliegue en Cloudflare y marcar cinco jugadores Arcade (portero/defensa/medio/delantero/extra) antes de optimizar.

## Fase 3.2 · Próximos partidos en el optimizador (18-11-2026)

- Nueva función `functions/api/next-games.js`, ruta `/api/next-games?slugs=slug1,slug2`.
- Usa una consulta GraphQL agrupada `players(slugs) { nextGame(so5FixtureEligible: true) { date homeTeam awayTeam so5Fixture ... } }` con hasta 12 futbolistas por petición.
- `optimizador-real.html` muestra el próximo partido registrado de cada futbolista y los datos de GW asociados, cuando Sorare los ofrece.
- Botón de consulta voluntaria, caché de 15 minutos en el servidor y en la pestaña del usuario para reducir límites 429.
- Checkbox opcional «solo jugadores con un partido en los próximos 7 días». Se desactiva hasta que todos los jugadores **del modo elegido** tengan una respuesta; un encuentro desconocido nunca se trata como partido confirmado.
- Este filtro temporal **no equivale** necesariamente a la Game Week de Sorare, ni determina si una carta es válida para Arcade, Pro o Arena, ni predice titularidad/participación. Sigue siendo orientación previa a la integración oficial de cada competición.
- **Validación:** sintaxis y casos de filtrado +1 día / +10 días probados. El endpoint de producción aún debe verificarse tras el despliegue, ya que Sorare puede cambiar el esquema o limitar consultas.

Esquema de referencia: https://api.sorare.com/graphql/schema

## Fase 3.3 · Cinco niveles de dificultad visual (18-11-2026)

- **Nueva UI** en `optimizador-real.html`: cinco etiquetas propias con color y texto junto al próximo enfrentamiento y en las cartas del once optimizado. Son: **Muy favorable**, **Favorable**, **Equilibrado**, **Difícil** y **Muy difícil**. Sin datos suficientes se muestra **Sin evaluar** en gris.
- Los niveles se calculan desde el punto de vista de la **posición del jugador** con los datos de rivales ya analizados en `/api/matchups`. Delantero/centrocampista: goles encajados por el rival. Defensa/portero: goles que marca el rival. Por ello el mismo rival puede aparecer más favorable para un atacante que para un defensa.
- El ajuste experimental existente toma como referencia 1,5 goles/partido, multiplica la diferencia por 7,5 unidades y limita el resultado a ±12. Clasificación: ajuste >= +7,5 muy favorable; [+2,5, +7,5) favorable; (-2,5, +2,5) equilibrado; (-7,5, -2,5] difícil; <= -7,5 muy difícil.
- Junto al partido existe **«¿Por qué esta dificultad?»**: muestra club rival, número de encuentros válidos, goles pertinentes de media y el ajuste calculado; no hay predicciones ni probabilidades.
- La etiqueta visual es **independiente** de activar «Priorizar los rivales más favorables al optimizar»: consultar análisis muestra etiquetas; marcar checkbox aplica el ajuste experimental a la selección de alineación.
- Comprobada la sintaxis JS y el mapeo de los cinco niveles + categoría desconocida con datos ficticios de prueba. Todavía falta verificar el despliegue de Cloudflare y el endpoint de rivales contra Sorare en producción.

No copiar iconografía, colores exactos ni contenidos de herramientas ajenas: etiquetas y explicaciones son de SorareFutScout.

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


### Prueba OAuth privada (fase de verificación, antes de abrir al público)

- La infraestructura se ha comprobado con `/api/auth/preflight`: API key, Client ID, Client Secret, contacto y KV cargados, pero esto **no valida aún los permisos frente a Sorare**.
- Un acceso privado opcional está preparado sin habilitar OAuth públicamente.
- En Cloudflare Pages (Production) añadir **únicamente** `SFS_OAUTH_TEST_SECRET` con tipo **Secret**, generado aleatoriamente en un gestor de contraseñas (32+ caracteres fuertes), nunca copiado a GitHub o al chat. Mantener `SFS_OAUTH_ENABLED` **ausente** o distinto de `true`.
- Después del despliegue, abrir `https://sorarefutscout.pages.dev/mi-club.html`, introducir esa clave de prueba en el formulario; el servidor valida la clave y entrega una cookie HttpOnly de **30 minutos**. Sin esa cookie el servidor impide el inicio y el callback OAuth.
- El navegador de prueba podrá autorizar la cuenta de Sorare, crear una sesión cifrada en `SFS_SESSIONS` y luego cerrar sesión. Durante el test, no activar el importador de cartas ni invitar a usuarios.
- Cuando se comprueben acceso y desconexión, quitar **`SFS_OAUTH_TEST_SECRET`**, desplegar de nuevo y comprobar que `/mi-club.html` vuelve a indicar que OAuth está en preparación. La cookie deja de ser válida al borrar el secreto. Limpiar cualquier sesión de prueba guardada en KV cuando proceda.
- Antes de lanzamiento público: revisar política de privacidad, manejo de errores, alertas/monitorización y pruebas de seguridad. Solo entonces se considerará `SFS_OAUTH_ENABLED=true` como activación pública.

**Comprobación tras configurar el secreto temporal:** visitar `https://sorarefutscout.pages.dev/api/auth/test-access`. El JSON debe mostrar `testAvailable:true` y `granted:false` antes de desbloquear el navegador. No introducir ninguna clave en la URL ni compartirla en capturas.

### Fase 4.2 · Vista previa privada de cartas Football (19-11-2026)

- [x] `/mis-cartas.html`: apartado separado para mostrar cartas de la cuenta OAuth con fotografía de futbolista, club, posición, rareza y temporada.
- [x] `GET /api/my-cards`: consulta de solo lectura autenticada a `currentUser.cards(first:20, sport:FOOTBALL, owned:true, ownedByMe:true)` con paginación mediante cursor.
- [x] Servidor exige sesión cifrada válida, dominio canónico y pase de prueba privada mientras el acceso público esté desactivado.
- [x] No se envían tokens ni secretos al navegador; las respuestas no incluyen datos de cartera, email ni ofertas. `cache-control: no-store`; no se persiste la lista de cartas en el backend.
- [x] La vista no incorpora ni modifica la selección manual del optimizador. Aún no promete importar cartas Arcade.
- [x] Pruebas estáticas y simulaciones de respuesta: colección válida, vacía, identidad distinta, sesión ausente, fallo GraphQL y puerta privada caducada.
- [ ] Confirmar con la cuenta real que la consulta funciona y que el conjunto expuesto por OAuth coincide con las cartas de Sorare Pro, y comprobar independientemente la cobertura Arcade.
- [ ] Diseñar compatibilidad entre `playerSlug` de cartas y el formato actual del optimizador, evitando sobrescribir elecciones manuales o interpretar la tenencia de cartas como elegibilidad oficial.
- [ ] Auditar/optimizar límites API, paginación grande, refuerzo de sesiones, protección contra abuso y experiencia de móvil antes de la apertura pública.

**Prueba privada:** si el usuario desconectó su cuenta, volver a `/mi-club.html` y autorizar de nuevo con la clave temporal; abrir `/mis-cartas.html` y pulsar «Consultar mis cartas». Nunca compartir secretos ni códigos de autorización en capturas. No activar `SFS_OAUTH_ENABLED=true` todavía.

Esquema técnico Sorare verificado: https://api.sorare.com/graphql/schema

### Control de HTTP 429 del endpoint OAuth (19-11-2026)

- Durante la nueva prueba privada, Sorare devolvió `token_http_429` al canjear un código OAuth. La autenticación ya había funcionado antes; no se ha confirmado un problema de credenciales.
- Se ha añadido pausa compartida en KV bajo `sfs:oauth:token-cooldown:v1`. Si el endpoint de token responde `429`, se respeta `Retry-After` cuando existe (acotado a una hora) o una pausa local provisional de 180 segundos si no llega. Esto **no confirma** el tiempo de desbloqueo de Sorare, ya que su documentación especifica `Retry-After` para GraphQL y no necesariamente para el endpoint de OAuth.
- `/auth/sorare/start` evita iniciar otra autorización durante esa pausa, `/api/auth/config` muestra solo `retryAfterSeconds` y `/mi-club.html` oculta el botón con una explicación.
- Una autorización cuya fase de tokens falló requiere un **nuevo código OAuth** después de la pausa; nunca reintentar el mismo código.
- El aviso y la pausa no resuelven necesariamente la causa subyacente del 429. Si persiste tras dejar descansar las peticiones, revisar límites, cabeceras y consultar soporte Sorare sin compartir tokens ni secretos.
- Mantener `SFS_OAUTH_ENABLED` desactivado; no anunciar importación de cartas hasta que esté validada con una sesión real.

Documentación de límites GraphQL de Sorare: https://github.com/sorare/api#rate-limit


### Fase 4.3 — Importación voluntaria de futbolistas desde cartas a optimizador (19-11-2026)

- **Primera prueba real exitosa:** OAuth autenticado; `/api/my-cards` devolvió **20 cartas de 640 totales indicadas**, con fotografía, club, posición, rareza **Common** y temporada 2026 para las cartas visibles. El total de cartas no equivale al total de futbolistas únicos.
- `mis-cartas.html` permite seleccionar **hasta 20 futbolistas únicos** entre las páginas de cartas cargadas, sin importar automáticamente toda la colección de 640 cartas.
- Nuevo endpoint `POST /api/import-player-stats`: requiere sesión OAuth y control privado; una única consulta agrupada a la API pública de fútbol obtiene L5/L10/L15 reales de esos futbolistas. Respeta errores 429 y no modifica cartas, inventario ni alineaciones en Sorare.
- La operación **se inicia solo al pulsar "Añadir seleccionados al optimizador"**. Guarda localmente el conjunto de jugadores (clave `sorarefutscout:optimizer-pool:v1`) con el límite actual de **120 futbolistas**; deduplica por `slug`, conserva marcas `ownedArcade` y `ownedCompetitive` previamente establecidas y no vacía la selección existente.
- **No se marca automáticamente Arcade o Pro/Arena** por ser `Common`. La API confirma la propiedad de cartas recuperadas, pero no garantiza elegibilidad para una competición ni que toda la colección Arcade sea visible en este endpoint.
- Si hay estadísticas sin medias, se importan con valores ausentes indicados, no se inventan puntuaciones. Se muestra aviso de éxito o error.
- Se han validado sintaxis y pruebas simuladas de API: origen no permitido, falta de sesión, puerta privada caducada, selección duplicada, Sorare HTTP 429 y error GraphQL.
- **Pendiente:** probar importación en una sesión real, comprobar calidad de posiciones y medias, manejar varias cuentas en un mismo navegador, aumentar capacidad con paginación adecuada y estudiar cómo importar la colección completa sin sobrecargar la API.

La fuente para límites de modo Arcade: https://help.sorare.com/hc/en-us/articles/33949360053917-What-is-Arcade

## Fase 4.3 · Análisis automático del club completo (19-11-2026)

- `mis-cartas.html`: **Consultar mis cartas y recomendar quinteto** obtiene de forma secuencial todas las páginas de cartas de fútbol que la sesión OAuth autoriza, sin pulsar repetidamente «Cargar más». Conserva la vista individual como opción secundaria.
- `auto-club.js`: deduplica futbolistas por slug, solicita medias L5/L10/L15 en bloques de 20 a la función de estadísticas existente y calcula los tres mejores quintetos SO5 (GK, DF, MD, FW, extra de campo) por programación dinámica, sin repetir futbolistas. Permite cambiar la media sin nuevas peticiones.
- Se respetan respuestas HTTP 429 y `Retry-After`, se secuencian las consultas y se comunica el progreso. Si una página falla o la cuenta cambia, **no se muestra un quinteto parcial**. Los datos se mantienen únicamente en memoria de la pestaña, sin copiar la colección al servidor.
- **Importante:** se optimiza la suma de medias históricas de los futbolistas con estadísticas disponibles, **no** se verifica automáticamente la competición concreta, GW, los partidos de todos los candidatos, rareza/temporada, XP, bonificaciones, titularidad, elegibilidad Arcade, uso previo de la carta ni disponibilidad. Tampoco se envía ninguna alineación a Sorare.
- Sintaxis JS verificada y prueba de alineaciones distintas sin repetición efectuada sobre datos simulados. Pendiente de validar despliegue y funcionamiento con colección real y límites de Sorare.


## Fase 4.4 · Game Week por rareza y candidatos Pro/Arena (20-11-2026)

- Desde `mis-cartas.html` se conserva la recuperación automática de la colección completa y el top-3 general por media histórica L5/L10/L15.
- Nueva capa `auto-gw.js`: **tras el análisis general, automáticamente** separa los futbolistas con cartas en las rarezas Pro conocidas (Limited, Rare, Super Rare y Unique) y consulta `/api/next-games` en lotes de hasta 12 slugs; respeta `429`/`Retry-After`, evita concurrencia y comunica el progreso.
- Agrupa únicamente **el próximo partido SO5 que Sorare devuelve**, con Game Week numérica real, y permite filtrar GW y rareza. Calcula hasta tres quintetos sin repetir futbolistas dentro de la misma rareza. Si no hay jugadores suficientes o la consulta se interrumpe, lo explica sin mostrar una alineación parcial.
- Conserva la rareza y el año declarado de cada carta durante la visita, sin enviar las cartas a un servidor de almacenamiento. La lista y las recomendaciones siguen siendo de solo lectura. No se cambian permisos, OAuth ni secretos.
- **Limitación estricta**: una GW registrada para el próximo partido no es la lista exhaustiva de partidos futuros ni asegura que el jugador participe. Tampoco se valida que una carta pertenezca al grupo In-Season de la competición, bonificaciones, temporada, licencia, disponibilidad, cap, cartas usadas, capitán, sustitutos ni envío de alineaciones. El campo `seasonYear` no acredita elegibilidad In-Season.
- **Arcade** es un modo de Set/misiones distinto de la GW de Pro; no inferir pertenencia ni elegibilidad Arcade por ser Common o por poseer la carta.
- Validaciones efectuadas: sintaxis de JS de los archivos nuevos y de la página, caso de 5 jugadores Limited en una GW con un quinteto propuesto, caso de solo Common (sin consultas GW innecesarias), error 429 con espera demasiado larga (informa calendario incompleto, cero quintetos falsos). **Pendiente comprobar en el despliegue Cloudflare con sesión real**.

Documentación Sorare:
- https://sorare.com/es/help/a/17629357197341/What%20are%20the%203%20game%20modes%20in%20Sorare%20Football
- https://sorare.com/es/help/a/4406429217053/understanding-sorare-cards-pro-common-and-scarcity-levels
- https://sorare.com/es/help/a/28920678508061/what-is-the-arena-how-does-it-work


## Fase 4.5 · Modos por colección, Arcade / Pro / Arena / análisis libre (20-11-2026)

- La colección de cada usuario se lee una sola vez mediante OAuth y se conserva en memoria del navegador; no se asumen las cartas del propietario como configuración universal.
- **Arcade:** `auto-modes.js` distingue cartas con rareza `common` y utiliza exclusivamente los futbolistas cuya colección contiene al menos una de ellas. Genera hasta tres quintetos SO5 por medias L5/L10/L15. La clasificación **no** confirma pertenencia a un Set activo, Tier, objetivo de Game Board ni bonos. Arcade se evalúa independientemente de las GW Pro.
- **Pro:** utiliza el análisis de cartas Limited/Rare/Super Rare/Unique, agrupadas por rareza y siguiente Game Week SO5 registrada. No confirma el tablero exacto, In-Season/Classic ni condiciones de elegibilidad; no se permite mezclar automáticamente distintas rarezas a menos que las reglas de una competición se verifiquen en una fase futura.
- **Arena:** muestra por separado el mismo grupo **preliminar** de candidatos competitivos, con aviso de que Arena tiene reglas, selección, uso de cartas, bonos y restricciones distintas de Pro. Este filtro no certifica una alineación Arena.
- **Análisis libre:** las cartas de todos los tipos pueden contribuir a la clasificación estadística, sin presentar la combinación como inscribible.
- Los cuatro modos se muestran en un selector después de completar el análisis, con conteos calculados exclusivamente a partir de esa colección; puede cambiarse de modo sin nuevas consultas ni importaciones manuales.
- Durante la carga el resumen y progreso permanecen visibles. Una colección con Common precarga Arcade; si no tiene Common pero sí cartas competitivas, precarga Pro; si no hay cartas clasificadas, muestra análisis libre.
- Se mantiene la beta privada existente, el acceso temporal y las políticas de solo lectura. No se ha ampliado la visibilidad, no se han cambiado secretos ni se envían alineaciones a Sorare.
- Validación técnica: sintaxis JS de todos los archivos y simulación cliente de un club mixto Common/Limited, con cambio de vistas, 5 futbolistas Common, render de un quinteto, cambio de Pro a Arena y vuelta al modo libre. **Pendiente prueba real tras Cloudflare.**

Fuentes: https://help.sorare.com/hc/es/articles/33949360053917--Qu%C3%A9-es-Arcade ; https://sorare.com/help/a/17629357197341/what-are-the-3-game-modes-in-sorare-football-arcade-pro-arena


### Rectificación de la fase 4.5 · Common no equivale a Arcade Set (20-11-2026)
La integración original clasificaba cualquier carta con `rarityTyped=common` como "candidato Set" para Arcade. **Este supuesto no es válido**: las reglas oficiales de Sorare distinguen cartas Common y cartas de Set; los tableros requieren cartas del Set concreto, y el ejemplo del tablero WNTR excluye explícitamente Common y Pro. Hasta que encontremos un campo API contrastado que identifique el Set de cada carta:
- El selector Arcade presenta solo una **exploración estadística provisional de cartas Common**, sin certificar elegibilidad.
- Se elimina el rótulo engañoso "Common · candidato Set" y se reemplaza por "Common · Set no verificado".
- El identificador de Set, nivel de Game Board, reglas y elegibilidad siguen pendientes y no se inventan.
- No se modifica el sistema OAuth, la privacidad, las consultas ya funcionales ni la elección separada de Pro/Arena.

Documentación: https://help.sorare.com/hc/en-us/articles/33949360053917-What-is-Arcade ; https://sorare.com/blog/football/%F0%9F%86%95-introducing-sorare-set


## Fase 4.6 · Tablero Divination y capitán (20-11-2026)

- A partir de las capturas compartidas del tablero de Arcade Divination se incorpora un **tablero original de referencia** con seis objetivos, no un clon visual de Sorare: 260, 300, 360, 400, 440 y 480 puntos.
- Recompensas según las capturas: 2.000 Essence, 5.000 Essence, 10 Gems, 30 Gems, 100 € y 1.000 €; las dos recompensas de efectivo muestran bonos adicionales en Sorare que **no se desglosan numéricamente** hasta confirmar todas sus condiciones.
- `auto-board.js` permite seleccionar nivel y ajustar las vidas restantes **manualmente** entre cero y cuatro. Hay cuatro vidas iniciales por nivel según las reglas de Arcade. El formulario **no** afirma leer progreso de la cuenta ni persiste su estado.
- `auto-modes.js` incorpora un ranking exploratorio para cartas Common de SO5 con **un capitán +50 %** aplicado sobre la media histórica L5/L10/L15. Utiliza una programación dinámica de 2 estados por máscara de puestos y retiene ocho configuraciones parciales por estado: las tres alternativas finales son **aproximaciones por mejores combinaciones evaluadas**, no optimización de probabilidad de alcanzar el objetivo ni garantía de óptimo absoluto.
- El panel muestra suma base, aporte adicional del capitán, total histórico ilustrativo y distancia respecto al objetivo seleccionado. No se consideran bonos de edición Divination (Standard/Shiny/Holo/etc.), disponibilidad en próximos partidos, fixture rules ni puntuaciones reales.
- **Limitación crítica:** no se ha identificado en la API un campo verificado de pertenencia al Set Divination de cada carta, ni el nivel/vida real de cada usuario. Se siguen usando cartas `common` únicamente como un subconjunto exploratorio; NO hay una alineación jugable confirmada. El tablero Divination es un preset identificado con fecha y NO debe suponerse vigente en todos los Sets ni en futuras temporadas.
- No se consulta la API de Sorare al seleccionar nivel o cambiar vidas, no se publican nuevas rutas OAuth, no se cambia ningún secreto ni se realiza ninguna acción en Sorare.
- **Pruebas locales:** sintaxis de `auto-modes.js`, `auto-board.js`, `auto-club.js`; mock de 6 jugadores con suma de medias 369 + capitán 42 = 411, actualización de objetivo 260 a 300, ajuste de 4 a 3 vidas; carga de 617 futbolistas simulados y tres quintetos en aproximadamente 1,2 s del entorno de prueba. Falta prueba real en Cloudflare.
- Siguiente fase: identificar el Set/edición en una respuesta de API contrastada; después analizar fechas de partidos, elegir capitán conforme a disponibilidad, gestionar hasta cuatro alineaciones simultáneas sin reutilizar cartas y filtrar por tablero activo.
- Reglas oficiales: https://help.sorare.com/hc/en-us/articles/33949360053917-What-is-Arcade ; https://help.sorare.com/hc/en-us/articles/40621240656797-How-does-scoring-validation-work-in-Arcade
- Guía Divination: https://soraretools.com/en/guides/sorare-divination

## Fase 4.7 · Menú principal «Modos de juego» (20-11-2026)

- Se añade a las páginas principales una rama desplegable **Modos de juego** con dos grupos: **Arcade** (Sets, tableros y misiones) y **Competitivo** (Pro, Arena). **Mi club** sigue reservado a la vinculación de Sorare y la consulta de propiedad.
- Los enlaces llevan a `/mis-cartas.html#arcade`, `#pro`, `#arena`: comparten el acceso OAuth y el análisis completo de una colección, pero abren el modo correspondiente sin hacer una nueva descarga cuando la persona ya está en esa página.
- Para mantener accesibilidad se usa `<details>/<summary>` nativo, navegación de teclado, cierre con Escape y al pulsar fuera, sincronización del elemento activo con el fragmento de URL y CSS compartido (`modos-menu.css`, `modos-menu.js`).
- No son tres páginas independientes ni se almacena la colección al salir de la página: al navegar desde otra sección, la persona debe pulsar consultar cartas. Un cambio de modo dentro de la página no precisa nuevas peticiones de cartas.
- Se conserva intacta la beta privada, el OAuth cifrado y el carácter de solo lectura. No se ha modificado la visibilidad del alojamiento o del repositorio.
- Validaciones: presencia del menú en 7 páginas, comprobación de sintaxis JS y prueba simulada de entrada a Pro por URL y cambio de Arena a Arcade sin repetir el análisis. Falta comprobación visual final en Cloudflare y en móvil.
