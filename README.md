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

`main` is de **basis/fundering**: Angular 22 + design system + kaart + dummydata. Wijzig `main` alleen om de template zelf te verbeteren.

```bash
# nieuw project of applicatie vanaf de template
git switch main
git switch -c project/<naam>

# terug naar de basis
git switch main
git switch -c feature/<idee> template-v1   # of vanaf de vastgezette tag

# basisverbeteringen doorgeven aan een project
git switch project/<naam> && git merge main
```

De tag `template-v1` markeert de eerste, schone versie van de basis.
