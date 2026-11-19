# SorareFutScout — OAuth application request package

**Status:** draft for submission; not yet sent or approved. Do not attach secrets to the request.  
**Application:** SorareFutScout  
**Professional contact:** sorarescoutfut@gmail.com  
**Operator:** personal project (not a company; full legal controller identity to be completed privately and in the privacy notice before public OAuth activation)  
**Launch model:** free public beta; possible optional Premium in the future (not yet available)  
**Website:** https://sorarefutscout.pages.dev  
**Privacy policy (provisional):** https://sorarefutscout.pages.dev/privacidad.html  
**OAuth callback (exact URL):** https://sorarefutscout.pages.dev/auth/sorare/callback

## Short description (English)

SorareFutScout is an independent, public football scouting and lineup-analysis web application for Sorare managers. It helps users compare players using Sorare statistics, fixture information and transparent experimental matchup indices.

## Request to Sorare (English)

**Subject: OAuth application registration request — SorareFutScout**

Hello Sorare Developer Support,

I am developing SorareFutScout as an independent personal project. It is a free public beta for Sorare Football managers, and I would like to register it for OAuth so users can optionally connect their Sorare accounts. A separate Premium tier may be considered in the future, but no paid tier is currently available.

Website: https://sorarefutscout.pages.dev
Contact: sorarescoutfut@gmail.com

SorareFutScout already offers player search, historical Sorare scoring averages (L5/L10/L15), fixture and Game Week information, matchup analysis, and comparisons of alternative SO5/SO7 lineups based on selected players. The tool clearly distinguishes real Sorare data from our own experimental indices and does not claim to predict results.

We are now developing an optional “Connect with Sorare” experience. With each manager’s authorization, we would like to read their basic user identity and owned cards so they can import their eligible collection instead of entering players manually, then prepare and compare lineups using their own cards. Our goal is an easy workflow that takes less than ten minutes. We will verify the available card types and Arcade coverage rather than assuming all cards can be retrieved.

SorareFutScout is not affiliated with or endorsed by Sorare. Because the proposed name contains the Sorare brand, please let us know whether it complies with your branding requirements; we are willing to adjust the public-facing name if necessary. We will not use Sorare's official logo or claim official status.

We intend to use OAuth only to read the user's basic identity and card collection for the requested workflow. We understand that Sorare's standard OAuth scope also includes other categories of account data; we will not request those fields unless the user-facing purpose and privacy notice are updated. Sorare's OAuth permissions do not authorize trading, bidding, access to email addresses or future private lineups. We will not submit lineups on a user's behalf. Authentication is designed to be handled server-side through Cloudflare; application secrets and user tokens will not be exposed in frontend code. We will finalize our privacy documentation and complete end-to-end security tests before enabling connections publicly.

Application name: SorareFutScout
Production OAuth callback: https://sorarefutscout.pages.dev/auth/sorare/callback

A PNG application logo is available for the registration request.

Could you please advise on the steps required to review and register this OAuth application and provide a Client ID and Client Secret?

Thank you for your time and for making Sorare's developer API available.

Best regards,
The SorareFutScout developer
sorarescoutfut@gmail.com

## Form fields

| Field | Proposed value |
|---|---|
| App name | SorareFutScout |
| Type | Public web application; independent, unofficial beta |
| Category | Sorare Football analytics / player scouting / lineup optimization |
| Website | https://sorarefutscout.pages.dev |
| Contact | sorarescoutfut@gmail.com |
| Callback URL | https://sorarefutscout.pages.dev/auth/sorare/callback |
| Privacy | https://sorarefutscout.pages.dev/privacidad.html (provisional; must be finalized) |
| Permissions | OAuth user basic information and cards, read-only |
| Required access | Authorization Code (user consent) |
| Business model | Free public beta; optional Premium under consideration for the future, not yet launched |
| App logo | PNG image; use the approved SorareFutScout logo with no claim of Sorare endorsement |

## Pre-submission checklist

- [x] Website, public API and main features visible.
- [x] Separate demo from real statistics.
- [x] OAuth initiation, callback and session handling code prepared in GitHub, **disabled until configured and tested**.
- [x] Exact production callback agreed in code.
- [x] PNG logo prepared for review.
- [ ] Owner approves final logo.
- [x] Privacy page expanded for personal free beta with purposes, providers, retention and user rights; contact email provided.
- [ ] Complete controller's legal identity and review all required disclosures (including provider data location/guarantees) before making OAuth available publicly. The privacy text remains provisional.
- [ ] Owner verifies Sorare's branding requirements for a third-party name containing 'Sorare'.
- [ ] Owner uses their EXISTING Sorare account (Sorare restricts individuals to one account) to submit the application, enters sorarescoutfut@gmail.com as professional contact where supported, and does not create a second account.
- [ ] Owner confirms the wording, selects the API/OAuth category in Sorare's official registration/support flow, attaches the PNG, and submits the request.
- [ ] Sorare issues OAuth Client ID and Client Secret; configure privately in Cloudflare, NEVER in GitHub or chat.
- [ ] Cloudflare KV namespace set up, end-to-end login/logout/refresh tested and security reviewed before switching on OAuth.
- [ ] Actual card collection import implemented, verified and separately tested for Arcade and competitive cards.

## References

- https://github.com/sorare/api#oauth-authentication--login-with-sorare
- https://sorare.com/settings/developer

Sorare's documentation lists a unique application name, one or more callback URLs and a PNG logo for OAuth registration. Its single OAuth scope also permits reading certain other categories including auctions, offers, favorites and notifications; SorareFutScout's intended queries are narrower (basic identity and cards). Access does not include email, future lineups or trading operations. Final approval is decided by Sorare. Existing account rule: https://sorare.com/es/help/a/4402904990353/can-i-have-more-than-one-account . Privacy duty guidance: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion .


### Prueba OAuth privada (fase de verificación, antes de abrir al público)

- La infraestructura se ha comprobado con `/api/auth/preflight`: API key, Client ID, Client Secret, contacto y KV cargados, pero esto **no valida aún los permisos frente a Sorare**.
- Un acceso privado opcional está preparado sin habilitar OAuth públicamente.
- En Cloudflare Pages (Production) añadir **únicamente** `SFS_OAUTH_TEST_SECRET` con tipo **Secret**, generado aleatoriamente en un gestor de contraseñas (32+ caracteres fuertes), nunca copiado a GitHub o al chat. Mantener `SFS_OAUTH_ENABLED` **ausente** o distinto de `true`.
- Después del despliegue, abrir `https://sorarefutscout.pages.dev/mi-club.html`, introducir esa clave de prueba en el formulario; el servidor valida la clave y entrega una cookie HttpOnly de **30 minutos**. Sin esa cookie el servidor impide el inicio y el callback OAuth.
- El navegador de prueba podrá autorizar la cuenta de Sorare, crear una sesión cifrada en `SFS_SESSIONS` y luego cerrar sesión. Durante el test, no activar el importador de cartas ni invitar a usuarios.
- Cuando se comprueben acceso y desconexión, quitar **`SFS_OAUTH_TEST_SECRET`**, desplegar de nuevo y comprobar que `/mi-club.html` vuelve a indicar que OAuth está en preparación. La cookie deja de ser válida al borrar el secreto. Limpiar cualquier sesión de prueba guardada en KV cuando proceda.
- Antes de lanzamiento público: revisar política de privacidad, manejo de errores, alertas/monitorización y pruebas de seguridad. Solo entonces se considerará `SFS_OAUTH_ENABLED=true` como activación pública.
