# LabBeregner

LabBeregner er en lille dansk PWA til enhedsomregning og vejledende beregninger af minimumsvægt og procestolerance. Appen er bygget i almindelig HTML, CSS og JavaScript og har ingen eksterne afhængigheder.

## Start lokalt

Appen skal åbnes gennem en lokal webserver, så moduler og service worker fungerer korrekt:

```bash
cd LabBeregner
python3 -m http.server 4173
```

Åbn derefter `http://localhost:4173` i en browser. En anden enkel webserver kan også bruges.

## Test

Kør beregnings- og PWA-testene med:

```bash
node --test
```

Testene dækker enhedsomregning, massefylde, minimumsvægt, maksimal deling, procestolerance, dansk talformat og de centrale PWA-filer.

Hvis Node.js og npm er installeret, kan de tilsvarende genveje `npm start` og `npm test` også bruges.

## Formler

Appen bruger disse definitioner:

- `d`: vægtens deling
- `T`: procestolerance som decimaltal
- `SF`: sikkerhedsfaktor
- teoretisk standardafvigelse: `0,41 × d`

Minimumsvægt uden sikkerhedsfaktor:

```text
MinW = (0,82 × d) / T
```

Mindste nettovægt med sikkerhedsfaktor:

```text
Wmin = (0,82 × d × SF) / T
```

Største tilladte deling for en given nettovægt:

```text
dmax = (W × T) / (0,82 × SF)
```

Nødvendig procestolerance:

```text
T = (0,82 × d × SF) / W
```

Ved omregning mellem masse og volumen anvendes massefylden i `g/mL`. Standardværdien er vand ved `1,000 g/mL`. Der udføres ingen temperaturkorrektion.

## Installation på iPhone

PWA-installation kræver, at appen ligger på en HTTPS-adresse. Åbn adressen i Safari, tryk på delingsknappen og vælg **Føj til hjemmeskærm**. Når appen har været åbnet én gang online, gemmer dens service worker de nødvendige filer til offlinebrug.

## Gratis hosting med GitHub Pages

Læg indholdet af denne mappe i et GitHub-repository. Åbn repository-indstillingerne, vælg **Pages**, vælg deployment fra en branch og peg på den branch og mappe, hvor filerne ligger. GitHub viser derefter den HTTPS-adresse, som kan åbnes og installeres på iPhone.

Hvis appen ligger i en undermappe i et større repository, skal GitHub Pages publicere netop denne mappe eller en kopi af dens indhold. Alle filreferencer er relative og virker derfor også under et projektnavn i URL’en.

## Faglige begrænsninger

Beregningerne anvender den teoretiske `0,41d`-regel og ikke målt repeterbarhed. De er vejledende og erstatter ikke en officiel kvalificering eller GWP-vurdering af vægten. En anbefalet deling siger heller ikke noget om vægtens kapacitet, linearitet, miljøpåvirkninger eller egnethed til en konkret proces.
