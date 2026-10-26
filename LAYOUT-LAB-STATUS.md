# Layout lab: status en overdracht

Branch: `ndw-template-v2`. Brief en analyse: `ndw-layout-voorstel/` (ANALYSE.md, CLAUDE-CODE-BRIEF.md, wireframes).

## Starten
```bash
npm install
npm start          # http://localhost:4200  →  menu "Layout lab"  →  /layout-lab/t1 … t6
```
Elke template heeft een directe URL: `/layout-lab/t1` … `/layout-lab/t6`. Parameters: `weergave` (kaart|lijst|beide), `indeling` (onder|naast), `id` (geselecteerd record, opent het detail), `breedte` (compact|ruim), `kaart` (aan|uit, alleen T4), `verdieping` (open|dicht, T3 en T6), `periode`, `gebied`, `bron` en `indicator` (T3 en T6).

## Klaar en werkend (in de browser gecontroleerd)
- **Layout lab-shell** met aparte prototypebalk: templatekiezer T1–T6, variantkiezer, "Herstel indeling", demo-toestand (normaal, laden, herstelbare fout, geen brondata, live-update) en een inklapbare toelichting.
- **T2 Werkvoorraad + kaart**: vier weergaven (onder, naast, alleen kaart, alleen resultaten), verstelbare scheiding (slepen, pijltjes, Home/End, presets), behoud van filters, selectie, sortering en kaartpositie, detail docked of eigen weergave, smalle weergave (390 px: één vlak, "Terug naar resultaten" met herstel van scrollpositie), filters als dock, overlay of dialoog, lege/laad/fout-toestanden.
- **T1 Kaart verkennen**: filters en lagen oproepbaar, preview bij markerklik, detail rechts, "Resultaten tonen" opent T2 met dezelfde filters.
- **T4 Bewerken + context**: validatielijst, kaartcontext (met of zonder kaart), formulier met validatie en foutoverzicht, opslaan, bescherming van onopgeslagen wijzigingen (dialoog met opslaan / verwerpen / blijven; ook bij verlaten van de template).
- **T5 Overzicht + detail**: tabel zonder kaart, detail, "Bewerken" opent T4, "Nieuw object" opent een leeg record in T4.
- **T3 Analyse + kaart**: globale scope (periode, gebied, bron, vergelijken met vorige periode), indicatorkaarten (selecteerbaar, met definitie, bron en actualiteit), trendgrafiek met tabelalternatief, gekoppelde kaart met puntgrootte volgens de gekozen indicator, resultaten als verdieping (Zonder/Met resultaten), detail van een geselecteerd laadpunt, selectie sluit als het record buiten de scope valt, smal: één kolom (analyse, dan kaart).
- **T6 Dashboard zonder kaart**: zelfde scope en indicatoren (Datadekking, Meldingen, Gemiddelde duur, Aandachtspunten), trend, vergelijking per gebied (gebied kiezen zet de globale scope) en onderliggende resultaten via "Bekijk resultaten".
- URL en toestand: refresh, directe links en browser-terug; toestand per template bewaard bij wisselen; layoutvoorkeuren in localStorage (`ndw-lab:v1:<template>`).

## Nog te doen
1. **Niet volledig getest**: T4 (kaart kiezen, browser-terug met onopgeslagen wijzigingen), T2 bij 1280×800, T3/T6 met toetsenbord en schermlezer.
2. Op smalle schermen is het werkvlak in T3 klein doordat de prototypebalk veel ruimte inneemt; de balk is prototype, niet product.
3. Mockdata van T6 is afgeleid van de meldingen; de aantallen per periode zijn schaling, geen echte tijdreeks.

## Te valideren ontwerpkeuzes
- Drempels: smal onder 760 px; detail docked vanaf 560 + 400 px werkruimte (800 px bij kaart en lijst naast elkaar); kaart minimaal 400 px bij "naast elkaar".
- T1: markerklik toont eerst een preview; een keuze uit de lijst opent direct het detail.
- Live-update toont een melding met "Vernieuwen" en verschuift geen selectie.
- T3/T6: indicatorkeuze stuurt één gelabelde verdieping en een kaartpunt-grootte; periode/gebied/bron zijn globaal. Nog te valideren met Linda (T3) en Power BI-gebruikers (T6).
- Eigen onderdelen naast het design system: splitter, resultatentabel, filterpaneel (zie logboek).
