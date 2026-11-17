# HTML Čítačka: návod

Offline prehliadač HTML balíkov (ZIP) pre iPad a iPhone. JavaScript, CSS, `fetch` aj odkazy medzi stránkami fungujú ako na webe. Dáta zostávajú len v zariadení.

## Obsah priečinka
| Súbor | Účel |
|---|---|
| `index.html` | appka (knižnica a prehliadač) |
| `sw.js` | Service Worker: offline režim a sprístupnenie súborov z balíkov |
| `manifest.json` | názov a ikona pre „Pridať na plochu“ |
| `fflate.js` | knižnica na rozbaľovanie ZIP (MIT licencia, `FFLATE-LICENSE.txt`) |
| `icons/` | ikony appky |

## 1. Nasadenie na GitHub Pages (raz)
1. Prihlás sa na github.com.
2. Vytvor repozitár **New repository**, názov napr. `citacka`, typ Public.
3. **Add file → Upload files** a nahraj obsah tohto priečinka (nie priečinok samotný, `index.html` musí byť v koreni repozitára).
4. **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**.
5. Po 1 až 2 minútach bude appka na `https://TVOJMENO.github.io/citacka/`.

Funguje aj na inom HTTPS hostingu. Bez HTTPS sa Service Worker nespustí.

## 2. Inštalácia na iPade a iPhone
1. Otvor adresu v **Safari**.
2. **Zdieľať → Pridať na plochu**.
3. Spusti appku z plochy raz s internetom.

**Dôležité:** appka na ploche má vlastné úložisko oddelené od Safari. Balíky pridávaj vždy v appke spustenej z plochy.

## 3. Príprava balíkov
- Zazipuj priečinok s reportom. Môže obsahovať podpriečinky, CSS, JS, JSON, obrázky, písma aj video.
- Odkazy musia byť **relatívne**: `strana2.html`, `css/styl.css`, `../data/d.json`. Nie `C:\...`, `file://` ani `/css/...`.
- Úvodná stránka sa zvolí takto: `index.html`, inak jediný HTML súbor, inak si ju vyberieš pri prvom otvorení. Zmeniť ju môžeš cez `⋯`.
- Spoločný koreňový priečinok v ZIP-e sa odstráni automaticky.
- HTML ukladaj v **UTF-8**.
- V názvoch súborov **nepoužívaj diakritiku ani medzery**. Windows ich v ZIP-e niekedy zakóduje inak a odkaz sa potom nenájde.
- Môžeš pridať aj samostatný `.html` súbor bez ZIP-u.

## 4. Používanie
- **+ Pridať**: vyber jeden alebo viac ZIP/HTML zo Súborov.
- Rovnaký názov balíka: na výber máš Nahradiť, Ponechať obe alebo Zrušiť.
- **⋯** pri balíku: Premenovať, Zmeniť úvodnú stránku, Zmazať.
- V prehliadači: `‹ Knižnica`, `←` späť v rámci balíka, `⌂` úvodná stránka, `↻` obnoviť.
- Odkazy `target="_blank"` v rámci balíka sa otvoria v čítačke. Externé odkazy sa otvoria v Safari.

## 5. Zdieľanie s kolegami
- Pošli im odkaz na čítačku (kroky z časti 2).
- ZIP-y posielaj zvlášť (e-mail, OneDrive, Teams, AirDrop).

## 6. Obmedzenia
- iOS môže dáta webovej appky po dlhšom nepoužívaní vymazať. Originálne ZIP-y si nechaj v Súboroch.
- Veľké balíky (stovky MB) sa rozbaľujú v pamäti a na starších zariadeniach môžu zlyhať. Odporúčam do 100 MB na balík.
- Dáta v čítačke sú oddelené pre každé zariadenie a nesynchronizujú sa.

## 7. Aktualizácia čítačky
Po zmene súborov čítačky zvýš v `sw.js` hodnotu `VERSION` (napr. `citacka-v2`) a nahraj súbory na GitHub. Zariadenia si novú verziu stiahnu pri ďalšom spustení s internetom. Niekedy treba appku zavrieť a otvoriť dvakrát.
