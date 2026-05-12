# IAI Brand Live Verification Report — 5 Surfaces

Date: 2026-05-12
Status: `LIVE_VERIFICATION_COMPLETE`
Standard: `Master Spec 2`
Rule under test: no public bare `VI/EN` labels; use full bilingual labels only

## 1. Verification method

Live verification used:
- direct public fetch against the production URLs
- targeted string checks for `VI`, `EN`, `Tiếng Việt`, `English`, and language toggle markers
- browser snapshot checks for the public page output

This report measures current public output, not local source intent.

## 2. Surface results

| Surface | URL | Result | Evidence |
|---|---|---|---|
| `home.iai.one` | `https://home.iai.one/` | `FAIL` | Browser snapshot shows bare `VI` in the live header/navigation output. |
| `flow.iai.one` | `https://flow.iai.one/` | `FAIL` | Live HTML contains `data-set-lang=\"vi\">VI</button>` and `data-set-lang=\"en\">EN</button>`. |
| `nft.iai.one` | `https://nft.iai.one/` | `FAIL` | Live HTML still contains `<span class=\"lang-button-code\" data-language-code>VI</span>`. |
| `cios.iai.one` | `https://cios.iai.one/` | `FAIL` | Live HTML still shows bare `VI` inside the language toggle button. |
| `iaifoundation.com` | `https://iaifoundation.com/` | `FAIL` | Live HTML still shows `EN` and `VI` in the language links. |

## 3. Evidence details

### home.iai.one
- Browser snapshot at `https://home.iai.one/` shows `VI` in the current public header output.
- Team 1 interpretation: deploy has not converged to the bilingual branch intent yet.

### flow.iai.one
- Public fetch returned:
  - `data-set-lang="vi" ... >VI</button>`
  - `data-set-lang="en" ... >EN</button>`
  - `VI/EN` also appears in the page body

### nft.iai.one
- Public fetch returned:
  - `<span class="lang-button-code" data-language-code>VI</span>`

### cios.iai.one
- Public fetch returned:
  - bare `VI` still rendered inside the live language toggle

### iaifoundation.com
- Public fetch returned:
  - `<a class="lang-link is-active" ...>EN</a>`
  - `<a class="lang-link" ...>VI</a>`

## 4. Gate decision

Live verification verdict: `FAIL`

Team 1 release-gate implication:
- do not claim `Brandpro v1.0`
- do not claim `Master Spec 2 clean on live`
- do not close the 5-surface verification loop yet

## 5. Re-run condition

Re-run this report only after:
1. `home.iai.one` PR is merged and deployed
2. `flow.iai.one` PR is merged and deployed
3. NFT/CIOS/Foundation delivery path has published the already-fixed source or commit to the live targets

## 6. Expected pass condition

All 5 surfaces must:
- remove bare `VI` / `EN`
- show `🇻🇳 Tiếng Việt` and `🇺🇸 English` or equivalent full-label bilingual switcher
- remain aligned with Master Spec 2
