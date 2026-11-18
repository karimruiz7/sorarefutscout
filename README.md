# SorareFutScout ⚽

Plataforma independiente y no oficial de análisis, comparación de futbolistas y optimización de alineaciones para Sorare Fútbol.

## Web pública
**https://sorarefutscout.pages.dev/**

- [Demo principal](https://sorarefutscout.pages.dev/) — explorador, comparador y optimizador basados en **datos simulados**.
- [Explorador real — beta](https://sorarefutscout.pages.dev/explorador.html) — búsquedas por jugador/equipo, tablas, retratos, filtros y comparador. Desde aquí se añaden jugadores reales a la selección del optimizador.
- [Optimizador real — beta](https://sorarefutscout.pages.dev/optimizador-real.html) — alineaciones orientativas SO5 / SO7 maximizando la suma de medias históricas L5, L10 o L15 sobre los jugadores elegidos.
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
