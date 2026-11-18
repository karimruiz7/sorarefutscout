# SorareFutScout — OAuth application request package

**Status:** draft for submission; not yet sent or approved.  
**Application:** SorareFutScout  
**Professional contact:** sorarescoutfut@gmail.com  
**Website:** https://sorarefutscout.pages.dev  
**Privacy policy (provisional):** https://sorarefutscout.pages.dev/privacidad.html  
**OAuth callback (exact URL):** https://sorarefutscout.pages.dev/auth/sorare/callback

## Short description (English)

SorareFutScout is an independent, public football scouting and lineup-analysis web application for Sorare managers. It helps users compare players using Sorare statistics, fixture information and transparent experimental matchup indices.

## Request to Sorare (English)

**Subject: OAuth application registration request — SorareFutScout**

Hello Sorare Developer Support,

I would like to request OAuth credentials for SorareFutScout, an independent football scouting and lineup-analysis web application currently available as a public beta.

Website: https://sorarefutscout.pages.dev
Contact: sorarescoutfut@gmail.com

SorareFutScout already offers player search, historical Sorare scoring averages (L5/L10/L15), fixture and Game Week information, matchup analysis, and comparisons of alternative SO5/SO7 lineups based on selected players. The tool clearly distinguishes real Sorare data from our own experimental indices and does not claim to predict results.

We are now developing an optional “Connect with Sorare” experience. With each manager’s authorization, we would like to read their basic user identity and owned cards so they can import their eligible collection instead of entering players manually, then prepare and compare lineups using their own cards. Our goal is an easy workflow that takes less than ten minutes. We will verify the available card types and Arcade coverage rather than assuming all cards can be retrieved.

SorareFutScout is not affiliated with or endorsed by Sorare. Because the proposed name contains the Sorare brand, please let us know whether it complies with your branding requirements; we are willing to adjust the public-facing name if necessary. We will not use Sorare's official logo or claim official status.

We request read-only use for this user-facing workflow. We do not seek permission to trade cards, place bids, access users’ email addresses, or submit lineups on their behalf. Authentication is designed to be handled server-side through Cloudflare; application secrets and user tokens will not be exposed in frontend code. We will finalize our privacy documentation and complete end-to-end security tests before enabling connections publicly.

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
| Business model | Not specified; do not invent |
| App logo | A PNG file provided separately by the owner |

## Pre-submission checklist

- [x] Website, public API and main features visible.
- [x] Separate demo from real statistics.
- [x] OAuth initiation, callback and session handling code prepared in GitHub, **disabled until configured and tested**.
- [x] Exact production callback agreed in code.
- [x] PNG logo prepared for review.
- [ ] Owner approves final logo.
- [ ] Privacy page finalized with correct controller identity and legally required disclosures; the public contact email is now provided, but the beta privacy text is still provisional.
- [ ] Owner verifies Sorare's branding requirements for a third-party name containing 'Sorare'.
- [ ] Owner confirms the wording, selects the API/OAuth category in Sorare's official request form, attaches the PNG, and submits the request.
- [ ] Sorare issues OAuth Client ID and Client Secret; configure privately in Cloudflare, NEVER in GitHub or chat.
- [ ] Cloudflare KV namespace set up, end-to-end login/logout/refresh tested and security reviewed before switching on OAuth.
- [ ] Actual card collection import implemented, verified and separately tested for Arcade and competitive cards.

## References

- https://github.com/sorare/api#oauth-authentication--login-with-sorare
- https://sorare.com/settings/developer

Sorare's documentation lists application name, one or more callback URLs, and a PNG logo for an OAuth registration request. It lists access to basic user details and cards within the OAuth scope; access does not include future lineups or trading functionality. Final approval is decided by Sorare.
