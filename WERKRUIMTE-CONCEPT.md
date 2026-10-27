# Werkruimte: paneelconcept (branch `ndw-template-v3`)

Idee: in plaats van zes templates kiest de gebruiker zelf welke panelen open staan, met de iconen bovenaan. De templates uit het Layout lab worden voorinstellingen.

Openen: menu "Werkruimte" of `/werkruimte` (optioneel `?id=M-103`).

## Hoe het werkt
- **Iconenbalk**: Filters, Analyse, Kaart, Resultaten, Details. Elk icoon is een aan/uit-knop (`aria-pressed`). Naast elkaar of onder elkaar voor kaart en resultaten verschijnt zodra beide aan staan.
- **Voorinstelling**: Kaart verkennen, Werkvoorraad, Lijst met filters, Analyse met kaart, Dashboard. Een eigen combinatie heet "Eigen indeling". "Herstel indeling" zet de panelen terug (filters en selectie blijven).
- **Slimme ruimteverdeling**: de werkruimte beslist per paneel of het gedockt staat of als overlay. Kaart/resultaten houden een minimum (400 of 360 px; 760 px naast elkaar). Eerst wordt Filters overlay, dan Analyse, dan Details. Er past maar één overlay tegelijk; de andere is tijdelijk verborgen en komt terug door op het icoon te klikken. Een melding legt dit uit.
- **Smal (< 760 px)**: één paneel tegelijk; de iconen werken als tabs. Een rij kiezen opent Details als eigen weergave met "Terug naar resultaten".
- **Gedeeld**: zoeken, filters, sortering, selectie, kaartpositie en analyse-scope zijn één toestand, ongeacht welke panelen open staan. Een rij of kaartpunt kiezen opent Details. De paneelkeuze staat in localStorage (`ndw-ws:v1`).

## Nog te onderzoeken
- Breedte van gedockte panelen kunnen verslepen.
- Volgorde van panelen kiezen (nu vast: filters, analyse, midden, details).
- Analyse-scope is losgekoppeld van de filters; moet dat samen?
- Welke voorinstellingen horen erbij (T4 Bewerken ontbreekt nog).
- Drempels voor docken en overlay valideren.
