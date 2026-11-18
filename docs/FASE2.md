# SorareFutScout — Fase 2: datos reales

## Estado de partida
- Sitio estático público en Cloudflare Pages: https://sorarefutscout.pages.dev/
- Código fuente en GitHub: `karimruiz7/sorarefutscout`
- `index.html` muestra datos de demostración; deben distinguirse de datos reales.

## Objetivo
Sustituir progresivamente los datos ficticios por datos auténticos de futbolistas y puntuaciones procedentes de la API oficial de Sorare, respetando sus términos y límites.

## Arquitectura
1. Frontend estático (actual `index.html`): presenta jugadores, búsqueda, filtros, comparador y optimizador.
2. Backend serverless (Cloudflare Pages Functions): consulta `https://api.sorare.com/graphql` y transforma resultados a un formato estable para la web. La API de Sorare no admite CORS directo desde dominios externos.
3. Cache y limitación de peticiones: evitar peticiones repetitivas y respetar respuestas 429.
4. Claves, si hicieran falta, solo en secretos de Cloudflare; nunca en GitHub ni código enviado al navegador.

## Orden de implementación
- [ ] Verificar qué datos de futbolistas y puntuaciones se pueden consultar sin inicio de sesión.
- [ ] Crear una primera función que consulte la API desde servidor y gestione errores.
- [ ] Añadir una vista de datos reales a la interfaz, con indicación de origen y fecha de actualización.
- [ ] Ampliar filtros, historial y comparador con valores reales.
- [ ] Estudiar integración de colecciones personales mediante OAuth; requiere Client ID/Secret emitidos por Sorare y consentimiento del usuario.
- [ ] Reajustar el optimizador con reglas actuales de cada concurso.

## Seguridad, propiedad intelectual y transparencia
- No solicitar ni publicar contraseñas, JWT, claves API, secretos OAuth o claves privadas.
- Presentar SorareFutScout como proyecto independiente, no oficial.
- Verificar las condiciones de uso de la API y de las marcas/datos antes de un lanzamiento abierto.
- No presentar proyecciones sintéticas o inventadas como datos oficiales.

## Fuentes oficiales
- https://github.com/sorare/api
- https://sorare.com/es/help/a/10873240230941/c-mo-puedo-obtener-acceso-a-la-api-de-sorare
- https://sorare.com/es/api-terms
