# NDW verkeersprototype

Angular 22 prototype voor het uitproberen van layouts rond verkeersmanagement en wegwerkzaamheden, gebouwd met `@ndwnu/design-system` en `@ndwnu/map`.

```bash
npm install
npm start        # http://localhost:4200
npm run build
```

## Pagina's
| Route | Inhoud |
| --- | --- |
| `/dashboard` | KPI's, kaart, laatste incidenten, werkzaamheden |
| `/incidenten` | Lijst + kaart met detailkaart |
| `/wegwerkzaamheden` | AG Grid-tabel of kaart, filters |
| `/wegwerkzaamheden/:id` | Detail met tabs en kaart |
| `/kaart` | Volledige verkeerskaart met alle lagen |
| `/maatregelen` | Matrixborden en verkeersmaatregelen |
| `/layout-lab` | Vier layoutvarianten met dezelfde data |

## Structuur
- `src/app/data` – modellen, dummy data en `TrafficDataService` (signals, GeoJSON).
- `src/app/map/ndw-map.component.ts` – herbruikbare kaart (extends `MapComponent` uit `@ndwnu/map`). Bevat altijd `ndw-map-display` om te wisselen tussen NWB- en OSM-stijl (`NDWMapStyle` / `NDWOSMMapStyle`) en het aan/uit zetten van lagen.
- `src/app/pages` – de pagina's. Kopieer een pagina of een variant uit `layout-lab` om een nieuwe layout te prototypen.
- Kleuren op de kaart worden uit de `--ndw-color-*` tokens gelezen.

## Werken met branches (template → projecten)

Repo: `DenizTopuz/ndw-template` (private, GitHub *template repository*).

- `ndw-template_v1` is de **standaardbranch en de basis/fundering**: Angular 22 + design system + kaart + dummydata. Wijzig deze branch alleen om de template zelf te verbeteren.
- Een grote nieuwe basis wordt een nieuwe branch, bijvoorbeeld `ndw-template_v2`, die je als standaardbranch instelt. `_v1` blijft bestaan.

**Nieuw project of applicatie**
- Op GitHub: *Use this template → Create a new repository* (kopieert de standaardbranch, dus de basis).
- Of in dezelfde repo, in GitHub Desktop: *Current Branch → New Branch*, basis `ndw-template_v1`, naam `project/<naam>`.

**Terug naar de basis**
- Kies in GitHub Desktop de branch `ndw-template_v1`, of in de terminal: `git switch ndw-template_v1`.

**Basisverbeteringen doorgeven aan een project**
```bash
git switch project/<naam>
git merge ndw-template_v1
```

Lokale bladwijzer: de tag `template-v1` wijst naar de eerste schone versie van de basis.
