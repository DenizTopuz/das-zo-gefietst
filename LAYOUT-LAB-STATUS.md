# Layout lab: status en overdracht

Branch: `ndw-template-v2`. Brief en analyse: `ndw-layout-voorstel/` (ANALYSE.md, CLAUDE-CODE-BRIEF.md, wireframes).

## Starten
```bash
npm install
npm start          # http://localhost:4200  →  menu "Layout lab"  →  /layout-lab/t1 … t6
```
Elke template heeft een directe URL: `/layout-lab/t1` … `/layout-lab/t6`. Parameters: `weergave` (kaart|lijst|beide), `indeling` (onder|naast), `id` (geselecteerd record, opent het detail), `breedte` (compact|ruim), `kaart` (aan|uit, alleen T4).

## Klaar en werkend (in de browser gecontroleerd)
- **Layout lab-shell** met aparte prototypebalk: templatekiezer T1–T6, variantkiezer, "Herstel indeling", demo-toestand (normaal, laden, herstelbare fout, geen brondata, live-update) en een inklapbare toelichting.
- **T2 Werkvoorraad + kaart**: vier weergaven (onder, naast, alleen kaart, alleen resultaten), verstelbare scheiding (slepen, pijltjes, Home/End, presets), behoud van filters, selectie, sortering en kaartpositie, detail docked of eigen weergave, smalle weergave (390 px: één vlak, "Terug naar resultaten" met herstel van scrollpositie), filters als dock, overlay of dialoog, lege/laad/fout-toestanden.
- **T1 Kaart verkennen**: filters en lagen oproepbaar, preview bij markerklik, detail rechts, "Resultaten tonen" opent T2 met dezelfde filters.
- **T4 Bewerken + context**: validatielijst, kaartcontext (met of zonder kaart), formulier met validatie en foutoverzicht, opslaan, bescherming van onopgeslagen wijzigingen (dialoog met opslaan / verwerpen / blijven; ook bij verlaten van de template).
- **T5 Overzicht + detail**: tabel zonder kaart, detail, "Bewerken" opent T4, "Nieuw object" opent een leeg record in T4.
- URL en toestand: refresh, directe links en browser-terug; toestand per template bewaard bij wisselen; layoutvoorkeuren in localStorage (`ndw-lab:v1:<template>`).

## Nog te doen
1. **T3 Analyse + kaart** en **T6 Dashboard** zijn nog niet gebouwd (`templates/not-built.page.ts` toont een melding). Plan staat in de brief: globale scope (periode, gebied, bron), KPI's met definitie en actualiteit, trendgrafiek, kaart of tabel als verdieping, indicatorselectie die een gelabelde verdieping stuurt.
2. **Niet volledig getest**: T4 (foutoverzicht na mislukt opslaan, kaart kiezen, browser-terug met onopgeslagen wijzigingen), T5 en T1 op smalle schermen, T2 bij 1280×800.
3. **Logboek** `COMPONENT-CHANGELOG.md`: CC-044 (eigen splitter) en CC-045 (switcher zonder afbreken) staan erin; de rest van het Layout lab (CC-046 en verder) nog toevoegen.
4. Opruimen: `src/app/layout-lab/data/lab-data.ts` heeft ongebruikte exports (`LAADPUNTEN`) die T3 straks gebruikt.

## Te valideren ontwerpkeuzes
- Drempels: smal onder 760 px; detail docked vanaf 560 + 400 px werkruimte (800 px bij kaart en lijst naast elkaar); kaart minimaal 400 px bij "naast elkaar".
- T1: markerklik toont eerst een preview; een keuze uit de lijst opent direct het detail.
- Live-update toont een melding met "Vernieuwen" en verschuift geen selectie.
- Eigen onderdelen naast het design system: splitter, resultatentabel, filterpaneel (zie logboek).
