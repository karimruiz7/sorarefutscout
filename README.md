# SorareFutScout ⚽

Plataforma independiente y no oficial de análisis, comparación de futbolistas y optimización de alineaciones para Sorare Fútbol.

## Fase 1: demostración interactiva

La web está desarrollada como un único archivo estático `index.html` y puede abrirse directamente desde un navegador. Incluye:

- Panel general con datos de ejemplo.
- Explorador de jugadores, búsqueda y filtros por posición.
- Comparación de futbolistas.
- Optimizador de alineaciones de cinco o siete cartas, con restricciones simplificadas.
- Importación/exportación de CSV y alta manual de jugadores.
- Almacenamiento local en el navegador, sin servidor ni registro.

**Importante:** las métricas iniciales son ficticias y las proyecciones son ilustrativas. Todavía no existe integración con Sorare, sincronización de colecciones, precios ni estadísticas oficiales. El optimizador no aplica todas las reglas de los concursos reales y debe considerarse una prueba.

## Publicación en GitHub Pages

En este repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → Folder: /(root) → Save**.

Cuando GitHub confirme la publicación, la dirección será:

https://karimruiz7.github.io/sorarefutscout/

## Siguiente etapa

Estudiar las condiciones y disponibilidad de la API oficial de Sorare, diseñar la obtención de datos reales y un backend seguro para cualquier futura autenticación. Nunca compartas credenciales ni tokens de Sorare en el código o en un repositorio público.

## Aviso

Proyecto independiente y no afiliado, patrocinado ni respaldado por Sorare. No utiliza logos oficiales ni imágenes de futbolistas.
