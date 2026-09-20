import type { SeedTopic } from './types'

/** B1 grammar syllabus (10 topics): passive → plusquamperfekt. */
export const B1_TOPICS: SeedTopic[] = [
  {
    key: 'b1-passiv',
    title: 'Passiv',
    cefr: 'B1',
    focus: 'werden + Partizip II — the passive voice in Präsens and Präteritum',
    relatedVocabTheme: 'Work',
    explanationMd: `The passive focuses on the **action**, not the doer: *werden* + **Partizip II**.

## Präsens Passiv
- Das Haus **wird** renoviert. — The house is being renovated.
- Die E-Mails **werden** beantwortet. — The emails are being answered.

## Präteritum Passiv
- Das Haus **wurde** 1900 gebaut. — The house was built in 1900.
- Die Produkte **wurden** verkauft.

## Perfekt Passiv (state)
- Das Haus **ist gebaut**. (rare) — better: Das Haus ist fertig.

## Mentioning the doer
- **von** + Dativ: Das Bild wurde **von Picasso** gemalt.
- **durch** + Akkusativ: durch einen Fehler

## Examples
- Die Rechnung **wird** morgen **bezahlt**. — The bill will be paid tomorrow.
- Der Termin **wurde** verschoben. — The appointment was postponed.`,
    drills: [
      { type: 'cloze', prompt: 'Das Haus ___ 1900 gebaut.', acceptedAnswers: ['wurde'] },
      { type: 'cloze', prompt: 'Die E-Mails ___ gerade beantwortet.', acceptedAnswers: ['werden'] },
      { type: 'cloze', prompt: 'Das Auto wird ___ (reparieren, Partizip II)', acceptedAnswers: ['repariert'] },
      {
        type: 'choice',
        prompt: 'Das Bild wurde ___ Picasso gemalt.',
        promptData: { options: ['von', 'von der', 'durch den', 'mit'] },
        acceptedAnswers: ['von'],
      },
      {
        type: 'transform',
        prompt: 'Der Mechaniker repariert das Auto.',
        promptData: { instruction: 'Rewrite in the Präsens Passiv. Begin with „Das Auto …“' },
        acceptedAnswers: ['Das Auto wird repariert.'],
      },
      { type: 'translate_en_de', prompt: 'The products are sold worldwide.', acceptedAnswers: ['Die Produkte werden weltweit verkauft.'] },
      { type: 'translate_de_en', prompt: 'Der Termin wurde verschoben.', acceptedAnswers: ['The appointment was postponed.'] },
    ],
  },
  {
    key: 'b1-relativsaetze',
    title: 'Relativsätze',
    cefr: 'B1',
    focus: 'der/die/das + verb-final clauses that describe nouns',
    relatedVocabTheme: 'People',
    explanationMd: `A relative clause describes a noun. The relative pronoun matches gender and number of the noun; its **case** depends on its job inside the clause. The verb goes to the **end**.

## Nominativ
- Das ist der Mann, **der** dort steht. — That is the man who is standing there.
- Die Frau, **die** dort wohnt, ist Ärztin.

## Akkusativ
- Das Auto, **das** ich gekauft habe, ist schnell.
- Der Kollege, **den** ich gestern traf, …

## Dativ
- Die Kollegin, **der** ich geholfen habe, …

## Rule of thumb
Same gender/number as the noun; the ending looks like the **der-words**. After the comma, verb goes last.

## Examples
- Der Termin, **der** morgen stattfindet, ist wichtig.
- Das ist die Firma, **bei der** ich arbeite. (preposition + pronoun)`,
    drills: [
      { type: 'cloze', prompt: 'Das ist der Mann, ___ dort steht.', acceptedAnswers: ['der'] },
      { type: 'cloze', prompt: 'Das Auto, ___ ich gekauft habe, ist schnell.', acceptedAnswers: ['das'] },
      { type: 'cloze', prompt: 'Der Kollege, ___ ich gestern traf, heißt Max.', acceptedAnswers: ['den'] },
      { type: 'cloze', prompt: 'Die Kollegin, ___ ich geholfen habe, ist neu.', acceptedAnswers: ['der'] },
      {
        type: 'choice',
        prompt: 'Die Frau, ___ dort wohnt, ist Ärztin.',
        promptData: { options: ['die', 'der', 'den', 'das'] },
        acceptedAnswers: ['die'],
      },
      {
        type: 'choice',
        prompt: 'Der Film, ___ wir gestern gesehen haben, war gut.',
        promptData: { options: ['den', 'der', 'dem', 'dessen'] },
        acceptedAnswers: ['den'],
      },
      { type: 'translate_en_de', prompt: 'That is the book that I am reading.', acceptedAnswers: ['Das ist das Buch, das ich lese.'] },
      { type: 'translate_de_en', prompt: 'Der Termin, der morgen stattfindet, ist wichtig.', acceptedAnswers: ['The appointment that is taking place tomorrow is important.'] },
    ],
  },
  {
    key: 'b1-konjunktiv-ii',
    title: 'Konjunktiv II',
    cefr: 'B1',
    focus: 'würde + infinitive; hätte, wäre, könnte — polite requests and hypotheticals',
    relatedVocabTheme: 'Shopping',
    explanationMd: `The Konjunktiv II expresses wishes, advice and hypotheticals — and makes requests **polite**.

## würde + infinitive
- Ich **würde** gern ein Auto **kaufen**. — I would like to buy a car.
- Was **würdest** du **tun**? — What would you do?

## The classic forms (no würde)
- **wäre**: Ich **wäre** gern dort. — I would like to be there.
- **hätte**: Ich **hätte** gern einen Kaffee. — I would like a coffee.
- **könnte**: **Könnten** Sie mir helfen? — Could you help me?
- **müsste / sollte / dürfte**: Du **solltest** schlafen. — You should sleep.

## Examples
- **Hätten** Sie einen Moment Zeit? — Do you have a moment? (polite)
- Wenn ich reich **wäre**, **würde** ich reisen. — If I were rich, I would travel.
- Ich **würde** sagen, das ist falsch. — I would say that is wrong.`,
    drills: [
      { type: 'cloze', prompt: 'Ich ___ gern einen Kaffee.', acceptedAnswers: ['hätte'] },
      { type: 'cloze', prompt: '___ Sie mir bitte helfen?', acceptedAnswers: ['Könnten', 'Würden'] },
      { type: 'cloze', prompt: 'Wenn ich reich ___, würde ich reisen.', acceptedAnswers: ['wäre'] },
      { type: 'cloze', prompt: 'Du ___ mehr schlafen. (sollen)', acceptedAnswers: ['solltest'] },
      {
        type: 'choice',
        prompt: 'Ich ___ gern ein neues Handy kaufen.',
        promptData: { options: ['würde', 'wäre', 'hätte', 'könnte'] },
        acceptedAnswers: ['würde'],
      },
      {
        type: 'choice',
        prompt: 'Was ___ du tun, wenn du Millionär wärst?',
        promptData: { options: ['würdest', 'wirst', 'warst', 'wärest du'] },
        acceptedAnswers: ['würdest'],
      },
      { type: 'translate_en_de', prompt: 'I would like a coffee, please.', acceptedAnswers: ['Ich hätte gern einen Kaffee, bitte.', 'Ich hätte gerne einen Kaffee, bitte.', 'Ich würde gern einen Kaffee trinken, bitte.'] },
      { type: 'translate_de_en', prompt: 'Wenn ich Zeit hätte, würde ich kommen.', acceptedAnswers: ['If I had time, I would come.'] },
    ],
  },
  {
    key: 'b1-genitiv',
    title: 'Genitiv',
    cefr: 'B1',
    focus: 'des/der/des and expressing possession without von',
    relatedVocabTheme: 'Society',
    explanationMd: `The Genitiv shows **possession or belonging** — in writing it is standard; in casual speech *von + Dativ* often replaces it.

## Articles
- der/das → **des** (+ -s or -es on the noun): des Mann**es**, des Kind**es**
- die → **der**: der Frau
- plural → **der**: der Kinder

## Possession
- Das ist das Auto **meines Bruders**. — That is my brother's car.
- Die Meinung **der Bürger** ist wichtig. — The citizens' opinion matters.

## Genitiv prepositions
**wegen, während, trotz, aufgrund, anstatt, außerhalb, innerhalb**
- **Wegen des** Wetters bleiben wir zu Hause. — Because of the weather we are staying home.
- **Während der** Woche arbeite ich. — During the week I work.

## Examples
- Die Entwicklung **der Gesellschaft** … — society's development …
- Das Ziel **des Projekts** ist klar.`,
    drills: [
      { type: 'cloze', prompt: 'Wegen ___ Wetters bleiben wir zu Hause.', acceptedAnswers: ['des'] },
      { type: 'cloze', prompt: 'Das ist das Auto ___ Bruders. (mein)', acceptedAnswers: ['meines'] },
      { type: 'cloze', prompt: 'Während ___ Woche arbeite ich.', acceptedAnswers: ['der'] },
      { type: 'cloze', prompt: 'Das ist die Tasche ___ Frau. (die)', acceptedAnswers: ['der'] },
      {
        type: 'choice',
        prompt: 'Die Meinung ___ Bürger ist wichtig. (plural)',
        promptData: { options: ['der', 'des', 'den', 'die'] },
        acceptedAnswers: ['der'],
      },
      {
        type: 'transform',
        prompt: 'Das ist das Auto von meinem Vater.',
        promptData: { instruction: 'Rewrite with the Genitiv possessive.' },
        acceptedAnswers: ['Das ist das Auto meines Vaters.'],
      },
      { type: 'translate_en_de', prompt: "That is my sister's phone.", acceptedAnswers: ['Das ist das Handy meiner Schwester.'] },
      { type: 'translate_de_en', prompt: 'Trotz des Regens gehen wir spazieren.', acceptedAnswers: ['Despite the rain, we are going for a walk.', 'We are going for a walk despite the rain.'] },
    ],
  },
  {
    key: 'b1-konnektoren',
    title: 'Sentence connectors',
    cefr: 'B1',
    focus: 'dennoch, trotzdem, zwar … aber, entweder … oder — position-0 connectors',
    relatedVocabTheme: 'Communication',
    explanationMd: `Connectors link ideas. The key is **where the verb goes**.

## Position-1 connectors (verb stays 2nd, like und/aber/oder)
- **aber** (but) · **und** · **oder** · **sondern** (but rather)
- Ich wollte kommen, **aber** ich hatte keine Zeit.

## Adverb connectors (occupy position 1 themselves → verb before subject)
- **deshalb, deswegen, darum** (therefore): Es regnete, **deshalb** blieben wir zu Hause.
- **trotzdem, dennoch** (nevertheless): Es war teuer, **trotzdem** habe ich es gekauft.
- **dann, danach** (then)

## Two-part connectors
- **zwar … aber**: Der Film war **zwar** lang, **aber** spannend.
- **entweder … oder**: **Entweder** gehe ich ins Kino, **oder** ich bleibe zu Hause.
- **sowohl … als auch**: Er spricht **sowohl** Deutsch **als auch** Englisch.

## Subordinating (verb to the end)
**weil, obwohl, dass, wenn, als, damit** — Er kam, **obwohl** er krank **war**.`,
    drills: [
      { type: 'cloze', prompt: 'Es regnete, ___ blieben wir zu Hause. (therefore)', acceptedAnswers: ['deshalb', 'deswegen', 'darum'] },
      { type: 'cloze', prompt: 'Er kam, ___ er krank war. (contrast: although)', acceptedAnswers: ['obwohl'] },
      { type: 'cloze', prompt: 'Der Film war ___ lang, aber spannend.', acceptedAnswers: ['zwar'] },
      {
        type: 'choice',
        prompt: '___ gehe ich ins Kino, oder ich bleibe zu Hause.',
        promptData: { options: ['Entweder', 'Weder', 'Sowohl', 'Zwar'] },
        acceptedAnswers: ['Entweder'],
      },
      {
        type: 'choice',
        prompt: 'Es war teuer, trotzdem ___ ich es gekauft.',
        promptData: { options: ['habe', 'ich habe', 'hatte ich', 'haben'] },
        acceptedAnswers: ['habe'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Er', 'spricht', 'sowohl', 'Deutsch', 'als', 'auch', 'Englisch'] },
        acceptedAnswers: ['Er spricht sowohl Deutsch als auch Englisch.'],
      },
      { type: 'translate_en_de', prompt: 'I wanted to come, but I had no time.', acceptedAnswers: ['Ich wollte kommen, aber ich hatte keine Zeit.'] },
      { type: 'translate_de_en', prompt: 'Er spricht weder Deutsch noch Englisch.', acceptedAnswers: ['He speaks neither German nor English.'] },
    ],
  },
  {
    key: 'b1-indirekte-fragen',
    title: 'Indirect questions',
    cefr: 'B1',
    focus: 'Polite questions with ob and w-word clauses — verb at the end',
    relatedVocabTheme: 'Travel',
    explanationMd: `Indirect questions are the polite way to ask. They are subordinate clauses: the verb goes to the **end**, and there is **no question mark**.

## With ob (whether/if) — for yes/no questions
- Können Sie mir sagen, **ob** der Zug Verspätung **hat**?
- Ich weiß nicht, **ob** sie heute **kommt**.

## With a w-word
- Können Sie mir sagen, **wo** die Toilette **ist**?
- Ich möchte wissen, **wann** der Kurs **beginnt**.
- Wissen Sie, **wie viel** das Ticket **kostet**?

## Compare
- Direct: Wo ist der Bahnhof?
- Indirect: Entschuldigung, wissen Sie, **wo der Bahnhof ist**?

## Examples
- Ich frage mich, **ob** das **richtig** **ist**. — I wonder whether that is right.
- Sag mir, **warum** du das **getan hast**!`,
    drills: [
      { type: 'cloze', prompt: 'Ich weiß nicht, ___ sie heute kommt.', acceptedAnswers: ['ob'] },
      { type: 'cloze', prompt: 'Wissen Sie, ___ der Bahnhof ist?', acceptedAnswers: ['wo'] },
      { type: 'cloze', prompt: 'Können Sie mir sagen, wann der Kurs ___? (beginnen)', acceptedAnswers: ['beginnt'] },
      {
        type: 'choice',
        prompt: 'Which sentence is correct?',
        promptData: { options: ['Ich weiß nicht, ob er kommt.', 'Ich weiß nicht, ob kommt er.', 'Ich weiß nicht, ob er kommen?', 'Ich weiß nicht ob, er kommt.'] },
        acceptedAnswers: ['Ich weiß nicht, ob er kommt.'],
      },
      {
        type: 'transform',
        prompt: 'Wo ist die Post?',
        promptData: { instruction: 'Make it indirect and polite: „Entschuldigung, wissen Sie, …“' },
        acceptedAnswers: ['Entschuldigung, wissen Sie, wo die Post ist?'],
      },
      { type: 'translate_en_de', prompt: 'I would like to know when the train leaves.', acceptedAnswers: ['Ich möchte wissen, wann der Zug abfährt.'] },
      { type: 'translate_de_en', prompt: 'Können Sie mir sagen, wie viel das kostet?', acceptedAnswers: ['Can you tell me how much that costs?'] },
    ],
  },
  {
    key: 'b1-verben-mit-praepositionen',
    title: 'Verbs with fixed prepositions',
    cefr: 'B1',
    focus: 'warten auf, sich freuen über/auf, denken an — learned as units',
    relatedVocabTheme: 'Emotions',
    explanationMd: `Many German verbs come with a **fixed preposition** — and that preposition decides the case. Learn verb + preposition + case as one chunk.

## With Akkusativ
- **warten auf**: Ich warte **auf den** Bus.
- **denken an**: Ich denke **an dich**.
- **glauben an**: Sie glaubt **an sich** selbst.
- **sich freuen über** (about something now): Ich freue mich **über das** Geschenk.
- **sich freuen auf** (looking forward): Ich freue mich **auf den** Urlaub.
- **sprechen über**: Wir sprechen **über das** Projekt.
- **sich interessieren für**: Ich interessiere mich **für Kunst**.

## With Dativ
- **teilnehmen an**: Ich nehme **am** Kurs teil.
- **abhängen von**: Das hängt **vom** Wetter ab.
- **zweifeln an**: Ich zweifle **an der** Entscheidung.

## da-Compounds (the trick!)
When the object is a thing, use **da(r)- + preposition**:
- Ich denke **daran**. · Ich warte **darauf**. · Das hängt **davon** ab.

## Examples
- Er ärgert sich **über die** Rechnung. — He is annoyed about the bill.
- Wir sprechen **darüber** morgen.`,
    drills: [
      { type: 'cloze', prompt: 'Ich warte ___ den Bus.', acceptedAnswers: ['auf'] },
      { type: 'cloze', prompt: 'Ich freue mich ___ den Urlaub. (looking forward)', acceptedAnswers: ['auf'] },
      { type: 'cloze', prompt: 'Ich denke ___ dich.', acceptedAnswers: ['an'] },
      { type: 'cloze', prompt: 'Das hängt ___ Wetter ab.', acceptedAnswers: ['vom', 'von dem'] },
      {
        type: 'choice',
        prompt: 'Ich interessiere mich ___ Kunst.',
        promptData: { options: ['für', 'auf', 'an', 'über'] },
        acceptedAnswers: ['für'],
      },
      {
        type: 'choice',
        prompt: 'Woran denkst du? — replace the thing with a da-compound: „Ich denke ___.“',
        promptData: { options: ['daran', 'darauf', 'darüber', 'davon'] },
        acceptedAnswers: ['daran'],
      },
      { type: 'translate_en_de', prompt: 'I am waiting for the train.', acceptedAnswers: ['Ich warte auf den Zug.'] },
      { type: 'translate_de_en', prompt: 'Wir sprechen über das Projekt.', acceptedAnswers: ['We are talking about the project.', 'We are discussing the project.'] },
    ],
  },
  {
    key: 'b1-futur-i',
    title: 'Futur I',
    cefr: 'B1',
    focus: 'werden + infinitive — predictions, plans and promises',
    relatedVocabTheme: 'Weather',
    explanationMd: `Futur I = **werden** (position 2) + **infinitive** (end of clause). Germans often use the present tense for fixed plans instead, but Futur I adds prediction, promise or assumption.

## werden
- ich **werde** · du **wirst** · er **wird**
- wir **werden** · ihr **werdet** · sie **werden**

## Examples
- Ich **werde** dich morgen **anrufen**. — I will call you tomorrow.
- Es **wird** morgen **regnen**. — It will rain tomorrow.
- Du **wirst** die Prüfung **bestehen**. — You will pass the exam.

## Present vs Futur I
- Present (fixed plan): Ich fahre morgen nach Berlin. — normal, everyday
- Futur I (prediction/promise): Ich **werde** morgen nach Berlin **fahren**.

## Assumption (with wohl)
- Er **wird wohl** noch im Büro **sein**. — He is probably still at the office.`,
    drills: [
      { type: 'cloze', prompt: 'Ich ___ dich morgen anrufen.', acceptedAnswers: ['werde'] },
      { type: 'cloze', prompt: 'Es ___ morgen regnen.', acceptedAnswers: ['wird'] },
      { type: 'cloze', prompt: 'Du ___ die Prüfung bestehen.', acceptedAnswers: ['wirst'] },
      {
        type: 'choice',
        prompt: 'Ihr ___ die Aufgabe lösen.',
        promptData: { options: ['werdet', 'werden', 'wirst', 'werde'] },
        acceptedAnswers: ['werdet'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Sie', 'wird', 'nächste', 'Woche', 'nach', 'Wien', 'fahren'] },
        acceptedAnswers: ['Sie wird nächste Woche nach Wien fahren.'],
      },
      { type: 'translate_en_de', prompt: 'I will help you tomorrow.', acceptedAnswers: ['Ich werde dir morgen helfen.'] },
      { type: 'translate_de_en', prompt: 'Er wird wohl noch im Büro sein.', acceptedAnswers: ['He is probably still at the office.', 'He will probably still be at the office.'] },
    ],
  },
  {
    key: 'b1-partizipialkonstruktionen',
    title: 'Partizip I & II as adjectives',
    cefr: 'B1',
    focus: 'der fliegende Vogel, das reparierte Auto — participles before nouns',
    relatedVocabTheme: 'Nature',
    explanationMd: `Both participles can work as **adjectives before a noun** — and they take normal adjective endings.

## Partizip I (infinitive + d): active, ongoing
- der **fliegende** Vogel — the flying bird
- das **lachende** Kind — the laughing child
- ein **steigender** Preis — a rising price

## Partizip II: finished/passive meaning
- das **reparierte** Auto — the repaired car
- der **verlorene** Schlüssel — the lost key
- ein **bekannter** Schriftsteller — a well-known writer

## Common Partizip II adjectives
- **bekannt** (known), **verboten** (forbidden), **geöffnet** (open), **geschlossen** (closed)

## Examples
- Die **steigenden** Kosten sind ein Problem. — The rising costs are a problem.
- Der **beschädigte** Stuhl muss repariert werden.
- In der **geöffneten** Tür stand ein Mann.`,
    drills: [
      { type: 'cloze', prompt: 'Der ___ Vogel singt. (fliegen, Partizip I)', acceptedAnswers: ['fliegende'] },
      { type: 'cloze', prompt: 'das ___ Auto (reparieren, Partizip II)', acceptedAnswers: ['reparierte'] },
      { type: 'cloze', prompt: 'der ___ Schlüssel (verlieren, Partizip II)', acceptedAnswers: ['verlorene'] },
      {
        type: 'choice',
        prompt: 'das ___ Kind (lachen, Partizip I)',
        promptData: { options: ['lachende', 'gelachte', 'lachen', 'gelachtes'] },
        acceptedAnswers: ['lachende'],
      },
      {
        type: 'choice',
        prompt: 'Rauchen ist hier ___.',
        promptData: { options: ['verboten', 'verbieten', 'verbotende', 'verbietet'] },
        acceptedAnswers: ['verboten'],
      },
      { type: 'translate_en_de', prompt: 'The rising costs are a problem.', acceptedAnswers: ['Die steigenden Kosten sind ein Problem.'] },
      { type: 'translate_de_en', prompt: 'Der bekannte Schriftsteller schreibt ein Buch.', acceptedAnswers: ['The well-known writer is writing a book.', 'The famous writer is writing a book.'] },
    ],
  },
  {
    key: 'b1-plusquamperfekt',
    title: 'Plusquamperfekt',
    cefr: 'B1',
    focus: 'hatte + Partizip II — the past before the past',
    relatedVocabTheme: 'Time',
    explanationMd: `The Plusquamperfekt (past perfect) describes an event that happened **before** another past event.

- Als ich kam, **hatte** der Zug schon **abgefahren**. — When I arrived, the train had already left.
- Sie **hatte** das Buch **gelesen**, bevor der Film kam.

## Building it
**hatte/war** (Präteritum) + **Partizip II** — same choice as in the Perfekt:
- hatte: Ich **hatte gegessen**. — I had eaten.
- war (movement/change): Er **war gegangen**. — He had left.

## Signal words
**als, nachdem, bevor, schon, bereits**
- **Nachdem** ich gegessen **hatte**, ging ich schlafen. — After I had eaten, I went to bed.

## Examples
- Er **war** nach Hause **gegangen**, bevor wir ankamen.
- Wir **hatten** noch nie Sushi **gegessen**.`,
    drills: [
      { type: 'cloze', prompt: 'Als ich kam, ___ der Zug schon abgefahren.', acceptedAnswers: ['hatte'] },
      { type: 'cloze', prompt: 'Er ___ nach Hause gegangen, bevor wir ankamen.', acceptedAnswers: ['war'] },
      { type: 'cloze', prompt: 'Nachdem ich gegessen ___, ging ich schlafen.', acceptedAnswers: ['hatte'] },
      { type: 'cloze', prompt: 'Wir ___ noch nie Sushi gegessen. (haben)', acceptedAnswers: ['hatten'] },
      {
        type: 'choice',
        prompt: 'Sie ___ den Film schon gesehen, bevor wir ins Kino gingen.',
        promptData: { options: ['hatte', 'hat', 'war', 'wird'] },
        acceptedAnswers: ['hatte'],
      },
      {
        type: 'transform',
        prompt: 'Ich habe gegessen. Dann ging ich schlafen.',
        promptData: { instruction: 'Combine with „Nachdem … , ging ich schlafen.“' },
        acceptedAnswers: ['Nachdem ich gegessen hatte, ging ich schlafen.'],
      },
      { type: 'translate_en_de', prompt: 'The train had already left.', acceptedAnswers: ['Der Zug war schon abgefahren.'] },
      { type: 'translate_de_en', prompt: 'Sie hatte das Buch gelesen, bevor der Film kam.', acceptedAnswers: ['She had read the book before the film came out.', 'She had read the book before the movie came.'] },
    ],
  },
]
