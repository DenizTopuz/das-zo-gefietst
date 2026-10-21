# NDW verkeersprototype

Angular 22 prototype voor het uitproberen van layouts rond verkeersmanagement en wegwerkzaamheden, gebouwd met `@ndwnu/design-system` en `@ndwnu/map`.

```bash
npm install
npm start        # http://localhost:4200
npm run build
```

## Pagina's

Elke route toont een kaart over de volle pagina (`MapPageComponent`). Routes en lagen staan in `src/app/app.routes.ts`. De lagen staan standaard uit; zet ze aan via de knop *Kaartweergave* (of vooraf met `[defaultVisibleKinds]` op `app-ndw-map`).

| Route | Lagen |
| --- | --- |
| `/dashboard` | incidenten, files |
| `/incidenten` | incidenten, files |
| `/wegwerkzaamheden`, `/wegwerkzaamheden/:id` | wegwerkzaamheden |
| `/kaart` | alles |
| `/maatregelen` | matrixborden |
| `/layout-lab` | alles |

De eerdere, volledige pagina's (dashboard, tabel, detail, enzovoort) staan in git-tag `template-v1-paginas`.

## Componentlogboek

Wijzigingen aan componenten en afwijkingen van het design system staan in [COMPONENT-CHANGELOG.md](COMPONENT-CHANGELOG.md), met een `CC-nnn`-ID en een link naar de bijbehorende NDW Storybook-pagina.

## Structuur
- `src/app/data` – modellen, dummy data en `TrafficDataService` (signals, GeoJSON).
- `src/app/map/ndw-map.component.ts` – herbruikbare kaart (extends `MapComponent` uit `@ndwnu/map`). Bevat altijd `ndw-map-display` om te wisselen tussen NWB- en OSM-stijl (`NDWMapStyle` / `NDWOSMMapStyle`) en het aan/uit zetten van lagen.
- `src/app/shared/map-page.component.ts` – de pagina met alleen een kaart. Vervang het template om een layout te bouwen.
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
