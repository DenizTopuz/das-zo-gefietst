# Component-wijzigingenlogboek

Hier staat welke wijzigingen er aan componenten zijn gedaan, zodat je er per component naar kunt verwijzen
(`CC-nnn`) en het kunt terugleiden naar de NDW Storybook-bibliotheek.

- Storybook: https://design.ndw.nu/ndw-storybook/
- Storybook-changelog: https://design.ndw.nu/ndw-storybook/?path=/docs/docs-changelog--docs
- Package: `@ndwnu/design-system` **14.5.0**, `@ndwnu/map` **4.0.2** (basis voor deze audit)
- Linkpatroon per component: `https://design.ndw.nu/ndw-storybook/?path=/docs/<story-id>`

## Hoe lees je een regel

| Veld | Betekenis |
| --- | --- |
| **ID** | `CC-nnn`, om naar te verwijzen ("pas CC-003 aan") |
| **Type** | `Gebruik` = NDW-component zoals bedoeld · `Afwijking` = wijkt af van het design system · `Eigen` = eigen component zonder NDW-equivalent · `Fix` = verbetering in dit project · `DS-opmerking` = zou in de NDW-bibliotheek zelf moeten |
| **Terug naar Storybook** | Wat er moet gebeuren om weer gelijk te lopen met de bibliotheek, of welke story je moet raadplegen |
| **Status** | `Open` · `Opgelost` · `Te controleren` |

Nieuwe wijzigingen komen **onderaan** de tabel *Wijzigingen*, met het volgende vrije ID.

## Wijzigingen

| ID | Datum | Component / plek | Type | Wat | Reden | Terug naar Storybook | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CC-001 | 2026-10-21 | Eigen `<table>` in `pages/dashboard` (werkzaamheden) | Afwijking | Eigen tabelstyling met `ndw-paragraph-md`-mixin; cellen bevatten links en pills | `ndw-simple-table` accepteert alleen tekst/getallen (`rows: (string\|number)[][]`) | [Table / Simple](https://design.ndw.nu/ndw-storybook/?path=/docs/components-table-simple--docs): gebruiken zodra celinhoud (link, pill) ondersteund wordt, of [AG Grid](https://design.ndw.nu/ndw-storybook/?path=/docs/components-table-ag-grid--docs) | Open |
| CC-002 | 2026-10-21 | Tabelkoppen `th`, `pages/dashboard` | Fix | `font-weight` van 700 (browser) naar DS-bold (650) via `@include ndw-paragraph-bold-md` | Afwijking van `--ndw-font-weight-bold` | n.v.t. (volgt nu het DS) | Opgelost (gemeten: 650) |
| CC-003 | 2026-10-21 | [List / Default](https://design.ndw.nu/ndw-storybook/?path=/docs/components-list-default--docs) `ndw-list-item` met `pillLabel` (dashboard, incidenten, layout-lab) | DS-opmerking | Geen wijziging in dit project. Vastgesteld: de pill krimpt tot ±40px en breekt af ("midd/el", "hoo/g") zodra titel/subtitel lang zijn, ook in een rij van 470px. Een bredere kolom helpt niet. | Pill heeft in `ndw-list-item` geen `flex-shrink: 0` / `white-space: nowrap` | Voorstel aan DS-team: pill niet laten krimpen. Tot die tijd: korte subtitel of pill weglaten | Open |
| CC-004 | 2026-10-20 | `app-ndw-map` (`src/app/map`) | Eigen | Wrapper om `MapComponent` (`@ndwnu/map`) + [Map Display](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-display--docs), [Map Button](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-button--docs) en [Map Legend](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-legend--docs). Wisselt NWB-/OSM-stijl en lagen. | Eis: overal een kaartweergaveknop met NWB/OSM | Gebruik zoals gedocumenteerd; geen afwijking in de DS-componenten zelf | Opgelost |
| CC-005 | 2026-10-20 | Zoom-knoppen in `app-ndw-map` | Afwijking | Drie `ndw-map-button`s onder elkaar met eigen flex-kolom in `ndw-map.component.scss` | Storybook heeft [Map Button Group](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-button-group--docs), maar die component wordt niet geëxporteerd in 14.5.0 | Controleren of Map Button Group een (CSS-)patroon of component is; vervangen zodra beschikbaar | Open |
| CC-006 | 2026-10-20 | Kaartkleuren in `ndw-map.component.ts` | Afwijking | Kleuren uit `--ndw-color-*` tokens uitgelezen met `getComputedStyle` en aan MapLibre meegegeven | MapLibre kan geen CSS-variabelen lezen | Geen; vraag aan DS-team of er kaart-tokens (JS) komen | Open |
| CC-007 | 2026-10-20 | Matrixbord-tegel (`.sign`, `pages/measures`) | Eigen | Vierkant bord met rode rand, grijs `X`-kruis en offline-variant, opgebouwd uit tokens | Geen NDW-component voor matrixborden | Eventueel voorstellen als nieuwe component | Open |
| CC-008 | 2026-10-20 | Weekgrafiek (`pages/dashboard`) | Eigen | `<progress>`-balken met tokens | Geen chart-component in het DS; `--ndw-color-data-*` tokens ongebruikt | Overweeg `--ndw-color-data-*` of een DS-grafiek | Open |
| CC-009 | 2026-10-20 | KPI-tegels (`pages/dashboard`) | Eigen | `ndw-card` met zelf opgebouwde inhoud (icoon + getal + hint) | Geen KPI-component; [Dashboard Card](https://design.ndw.nu/ndw-storybook/?path=/docs/components-dashboard-card--docs) is een link-tegel en past niet | Evt. nieuwe component voorstellen | Open |
| CC-010 | 2026-10-20 | Paginamarge (`.page`, alle pagina's) | Afwijking | Elke pagina zet `padding: var(--ndw-spacing-lg)` zelf | [Layout](https://design.ndw.nu/ndw-storybook/?path=/docs/components-layout--docs) geeft geen standaard contentpadding | Controleren of de Layout een content-wrapper heeft | Open |
| CC-011 | 2026-10-20 | `app-page-header` (`src/app/shared`) | Eigen | Titel (`h1`), subtitel en actieknoppen; breadcrumbs via slot | Herhaald kopblok op elke pagina | Evt. voorstellen als DS-patroon | Open |
| CC-012 | 2026-10-20 | Breadcrumbs, `pages/roadworks` detail | Afwijking | Handmatige [Breadcrumbs](https://design.ndw.nu/ndw-storybook/?path=/docs/components-breadcrumbs-breadcrumbs--docs) i.p.v. [Router Breadcrumbs](https://design.ndw.nu/ndw-storybook/?path=/docs/components-breadcrumbs-router-breadcrumbs--docs) | `ndw-router-breadcrumbs` renderde leeg met mijn route-`data` | Uitzoeken welke route-opzet Router Breadcrumbs verwacht; dan terug | Open |
| CC-013 | 2026-10-21 | `ndw-card-header` ([Card](https://design.ndw.nu/ndw-storybook/?path=/docs/components-card--docs)) | DS-opmerking | Geen wijziging. Header is geen koppelement; kaarten hebben dus geen `h2` | Toegankelijkheid: kopstructuur (WCAG 1.3.1) | Voorstel aan DS-team: header als `h2`/`h3` met instelbaar niveau | Open |
| CC-014 | 2026-10-21 | Vaste afmetingen in SCSS (kaarthoogtes, paneelbreedtes 340–360px) | Afwijking | `px`-waarden in `*.page.scss` en `ndw-map.component.scss` | Er zijn geen DS-tokens voor vaste component-/paneelafmetingen | Voorstel: tokens voor paneelbreedte en kaarthoogte | Open |

## Gebruikte NDW-componenten (ongewijzigd, `Gebruik`)

| Component | Storybook | Gebruikt in |
| --- | --- | --- |
| Layout | [Layout](https://design.ndw.nu/ndw-storybook/?path=/docs/components-layout--docs) | `app` |
| Button (`ndwButton`) | [Button](https://design.ndw.nu/ndw-storybook/?path=/docs/components-button--docs) | dashboard, incidenten, werkzaamheid-detail, kaart |
| Card | [Card](https://design.ndw.nu/ndw-storybook/?path=/docs/components-card--docs) | dashboard, incidenten, layout-lab, maatregelen, werkzaamheid-detail, kaart |
| Alert | [Alert](https://design.ndw.nu/ndw-storybook/?path=/docs/components-alert--docs) | maatregelen, werkzaamheid-detail |
| Breadcrumbs | [Breadcrumbs](https://design.ndw.nu/ndw-storybook/?path=/docs/components-breadcrumbs-breadcrumbs--docs) | werkzaamheid-detail |
| Checkbox (switch) | [Checkbox](https://design.ndw.nu/ndw-storybook/?path=/docs/components-form-field-checkbox--docs) | maatregelen |
| Form Field + Input | [Form Field](https://design.ndw.nu/ndw-storybook/?path=/docs/components-form-field--docs), [Input](https://design.ndw.nu/ndw-storybook/?path=/docs/components-form-field-input--docs) | wegwerkzaamheden (zoeken) |
| Icon | [Icon](https://design.ndw.nu/ndw-storybook/?path=/docs/components-icon--docs) | dashboard, incidenten, wegwerkzaamheden, werkzaamheid-detail |
| Key Value List | [Key Value List](https://design.ndw.nu/ndw-storybook/?path=/docs/components-key-value-list--docs) | incidenten, werkzaamheid-detail, kaart |
| List | [List / Default](https://design.ndw.nu/ndw-storybook/?path=/docs/components-list-default--docs) | dashboard, incidenten, layout-lab |
| Map Display, Map Button, Map Legend | [Map Display](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-display--docs), [Map Button](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-button--docs), [Map Legend](https://design.ndw.nu/ndw-storybook/?path=/docs/components-map-map-legend--docs) | `app-ndw-map` (alle kaarten) |
| Pill | [Pill](https://design.ndw.nu/ndw-storybook/?path=/docs/components-pill--docs) | dashboard, incidenten, maatregelen, werkzaamheid-detail, kaart |
| Splitter | [Splitter](https://design.ndw.nu/ndw-storybook/?path=/docs/components-splitter--docs) | layout-lab |
| Switcher | [Switcher](https://design.ndw.nu/ndw-storybook/?path=/docs/components-form-field-switcher--docs) | incidenten, wegwerkzaamheden, layout-lab |
| Tabs | [Tabs](https://design.ndw.nu/ndw-storybook/?path=/docs/components-tabs--docs) | layout-lab, maatregelen, werkzaamheid-detail |
| AG Grid-thema | [Table / AG Grid](https://design.ndw.nu/ndw-storybook/?path=/docs/components-table-ag-grid--docs) | wegwerkzaamheden (`ndwAgGridTheme`) |

## Audit huisstijl (2026-10-21)

Gecontroleerd in code en in de draaiende preview (NDW-thema, geen `data-theme="nwb"`).

**Goed overgenomen**
- Global stylesheet `@ndwnu/design-system/styles/index.scss` geladen; lettertypen DM Sans (koppen) en Nunito Sans (tekst) en Material Symbols Rounded laden en worden toegepast.
- Geen inline `style="…"` of `[style.*]` in templates.
- Geen hardgecodeerde kleuren (hex/rgb) in componentcode; alle `var(--ndw-*)`-tokens die ik gebruik bestaan in het DS.
- Typografie via `.ndw-heading-*` / `.ndw-paragraph-*` en SCSS-mixins.
- Primaire kleur komt overeen met het NDW-thema (oranje); knoppen, kaarten (radius 8px, elevation) volgen het DS.
- Alle componenten zijn standalone, `OnPush`, met signals.
- Overal waar een kaart staat zit `ndw-map-display` met NWB- en OSM-stijl.

**Afwijkingen / aandachtspunten**: zie CC-001, 003, 005, 006, 010, 012, 013 en 014.

**Nog niet gecontroleerd**
- Kleurcontrast (WCAG 2.1 AA) van pills en grijze tekst op grijze achtergrond.
- Toetsenbord-/schermlezergedrag.
- NWB-thema (`data-theme="nwb"`).
- Responsief gedrag onder 1024px.
