1. Syfte och mål
Syftet med applikationen Kallprat är att hjälpa användare att snabbt hitta idéer till samtalsstartare och kallprat i vardagliga och professionella sammanhang.
Målet är att skapa:

En enkel, snabb och mobilvänlig webapp
Som är helt statisk
Byggd i React
Hostad via GitHub Pages


2. Målgrupp

Privatpersoner som vill ha hjälp att starta konversationer
Konsulter, kollegor eller personer i sociala sammanhang
Användare utan teknisk bakgrund

Inloggning eller personliga konton ingår inte i version 1.

3. Omfattning (Scope)
Ingår

Frontend (React)
Statisk data (JSON eller motsvarande)
Publicering via GitHub Pages
Grundläggande UI och interaktion

Ingår inte

Backend
Databas
Autentisering
Realtidsdata eller externa API:er
AI‑generering (kan komma i framtida version)


4. Funktionella krav
4.1 Navigering och struktur

Applikationen ska ha en tydlig startsida
Startsidan ska visa tillgängliga kategorier
Exempel på kategorier:

Nyheter
Sport
Historia
Teknik
Intressanta händelser
Allmänt kallprat




4.2 Visa kallprat per kategori

Användaren ska kunna välja en kategori
Applikationen ska visa ett kallprat i taget
Användaren ska kunna:

Slumpa fram ett nytt kallprat
Se eventuella följdfrågor kopplade till kallpratet




4.3 Slumpfunktion

Det ska finnas en funktion för att slumpa fram:

Ett kallprat inom vald kategori


Samma kallprat får visas igen vid ny slump


4.4 Datamodell
Kallprat ska lagras statiskt, t.ex. i JSON‑format.
Varje kallprat ska minst innehålla:

Unikt ID
Kategori
Text för samtalsstartare
(Valfritt) Lista med följdfrågor


5. Icke‑funktionella krav
5.1 Prestanda

Applikationen ska ladda snabbt (<2 sekunder på normal uppkoppling)
Ingen serverkommunikation efter sidladdning

5.2 Responsivitet

Ska fungera väl på:

Mobil
Surfplatta
Desktop




5.3 Tillgänglighet

Text ska vara lättläst
Klickytor ska vara tillräckligt stora för mobil
Kontraster ska vara rimliga


5.4 Underhållbarhet

Nya kallprat ska enkelt kunna läggas till utan ändring i kod
Tydlig komponentstruktur i React


6. Tekniska krav
6.1 Frontend

React (Create React App eller Vite)
JavaScript eller TypeScript (valfritt, beslutas av utvecklare)
Ingen backend

6.2 Data

Statisk data (JSON eller motsvarande)
Ingen extern datakälla

6.3 Hosting

GitHub Pages
Applikationen ska fungera korrekt via GitHub Pages URL


7. Begränsningar och antaganden

Applikationen är publik
Inget behov av användarkonton
All data är fördefinierad
Ingen SEO‑optimering krävs i version 1
Routing ska fungera utan serverside‑stöd (eller undvikas)


8. Acceptanskriterier
Applikationen anses färdig när:

✅ Den går att öppna via GitHub Pages
✅ Användaren kan välja kategori
✅ Ett kallprat visas tydligt
✅ Användaren kan slumpa nytt kallprat
✅ Appen fungerar på mobil och desktop
✅ Ingen backend eller server krävs


9. Framtida förbättringar (ej del av denna leverans)

Favoriter
Sökfunktion
Dagens kallprat
Dark mode
AI‑genererade kallprat via API


10. Leverans

Källkod i GitHub‑repo
README med instruktion för deploy
App publicerad på GitHub Pages