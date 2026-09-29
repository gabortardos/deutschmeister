import type { SeedTopic } from './types'

/**
 * C2 grammar syllabus (M12.2): 8 topics extending the bank (62 → 70).
 * De-duplicated against everything shipped below C2 — the recorded plan
 * listed Konjunktiv I in Presse/Berichten (→ b2-konjunktiv-i already ships
 * the journalistically neutral reporting set), Nominalstil vs Verbalstil
 * (→ b2-nominalstil) and feste Präpositionalverben + Idiomatik (→ covered
 * by b1-verben-mit-praepositionen + b2-funktionsverbgefuege). C2 instead
 * adds: Modalpartikeln, conditional inversion without wenn, gehobene
 * Konnektoren (sofern / insofern / geschweige denn — reserved here since
 * M12.1), Ellipsen, Wortbildungs-Nuancen, nur prädikative Adjektive,
 * kaum…als + sobald/sowie, and Präpositionspaare (von…aus, auf…hin,
 * aus…heraus, um…willen).
 */
export const C2_TOPICS: SeedTopic[] = [
  {
    key: 'c2-modalpartikeln',
    title: 'Modalpartikeln: doch, ja, mal, eben, wohl',
    cefr: 'C2',
    focus: 'unstressed mood particles that soften, insist, assume or resign — the pulse of spoken German',
    relatedVocabTheme: 'Communication',
    explanationMd: `Modalpartikeln are small **unstressed** words in the midfield that tune the mood of a sentence. They never carry the main stress, cannot answer a question on their own, and are usually untranslatable word-for-word.

## The core set
- **doch** — insistence, friendly pressure: Komm **doch** mit! — Do come along!
- **ja** — shared knowledge: Du weißt **ja**, wie das funktioniert. — You know how that works, after all.
- **mal** — casual, take it easy: Warte **mal**. — Hold on a second.
- **eben / halt** — resigned acceptance: Dann ist es **eben** so. — Then that's just how it is.
- **schon** — reassurance: Das wird **schon** gutgehen. — That will be fine.
- **wohl** — assumption: Er ist **wohl** krank. — He is probably ill.

## Position
Midfield, usually right after the subject or pronoun: *Ich habe **ja** schon gesagt, …*

## Rules of thumb
One particle per clause is normal; stacking two sounds dialectal. In writing they mark dialogue or a conversational tone — formal texts use *wohl* (assumption) most freely.`,
    drills: [
      { type: 'cloze', prompt: 'Das wird ___ gutgehen. (Modalpartikel — Zuversicht)', acceptedAnswers: ['schon'] },
      { type: 'cloze', prompt: 'Dann ist es ___ so. (Modalpartikel — resignierte Akzeptanz; zwei Varianten möglich)', acceptedAnswers: ['eben', 'halt'] },
      { type: 'cloze', prompt: 'Du weißt ___ , dass wir morgen früher anfangen. (Modalpartikel — geteiltes Wissen)', acceptedAnswers: ['ja'] },
      {
        type: 'choice',
        prompt: 'Komm ___ mit! Wir haben noch Platz. (Modalpartikel — freundlicher Nachdruck)',
        promptData: { options: ['doch', 'ja', 'wohl', 'schon'] },
        acceptedAnswers: ['doch'],
      },
      {
        type: 'transform',
        prompt: 'Dann ist es leider so.',
        promptData: { instruction: 'Ersetze „leider" durch eine Modalpartikel resignierter Akzeptanz: „Dann ist es …"' },
        acceptedAnswers: ['Dann ist es eben so.', 'Dann ist es halt so.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Das', 'wird', 'schon', 'gutgehen'] },
        acceptedAnswers: ['Das wird schon gutgehen.'],
      },
      { type: 'translate_en_de', prompt: 'He is probably ill — he looks pale.', acceptedAnswers: ['Er ist wohl krank — er sieht blass aus.', 'Er ist wohl krank, er sieht blass aus.'] },
      { type: 'translate_de_en', prompt: 'Du weißt ja, wie das funktioniert.', acceptedAnswers: ['You know how that works, after all.', 'After all, you know how that works.'] },
    ],
  },
  {
    key: 'c2-konditional-inversion',
    title: 'Bedingungssätze ohne wenn: Hätte ich …, Sollte es …',
    cefr: 'C2',
    focus: 'verb-first conditionals — Konjunktiv II and sollte-inversion replacing wenn in elevated German',
    relatedVocabTheme: 'Abstract',
    explanationMd: `In elevated written German the **wenn** of a conditional clause can disappear: the finite verb moves to position 1 of the subordinate clause, the subject follows directly.

## Konjunktiv II inversion
- **Hätte ich** mehr Zeit, würde ich öfter lesen. — If I had more time, I would read more often.
- **Wäre** du hier geblieben, hättest du es gesehen. — If you had stayed here, you would have seen it.
- **Käme** er früher, könnten wir essen gehen. — If he came earlier, we could go out to eat.

After the comma the main clause behaves as after any fronted element: its finite verb comes next.

## sollte-inversion — formal, future-oriented
- **Sollte es** regnen, verschieben wir das Picknick. — Should it rain, we will postpone the picnic.
- **Solltest du** mich brauchen, ruf mich einfach an. — Should you need me, just call me.

## When to use it
Contracts, formal letters, warnings, literature. Speech prefers **wenn** or **falls**. The inversion is *never* used when wenn means *whenever* (iterative).`,
    drills: [
      { type: 'cloze', prompt: '___ ich mehr Zeit, würde ich öfter lesen. (haben, Konjunktiv II — ohne wenn)', acceptedAnswers: ['Hätte'] },
      { type: 'cloze', prompt: '___ es morgen regnen, verschieben wir die Tour. (sollen — formale Bedingung ohne wenn)', acceptedAnswers: ['Sollte'] },
      { type: 'cloze', prompt: '___ du hier geblieben, hättest du es gesehen. (sein, Konjunktiv II der Vergangenheit — ohne wenn)', acceptedAnswers: ['Wärst', 'Wärest'] },
      {
        type: 'choice',
        prompt: 'Wäre er früher aufgestanden, ___ den Zug noch erreicht.',
        promptData: { options: ['hätte er', 'er hätte', 'hat er', 'hätte'] },
        acceptedAnswers: ['hätte er'],
      },
      {
        type: 'transform',
        prompt: 'Wenn ich Millionär wäre, würde ich viel reisen.',
        promptData: { instruction: 'Forme den Bedingungssatz ohne „wenn" (Verb an Position 1): „…, würde ich viel reisen."' },
        acceptedAnswers: ['Wäre ich Millionär, würde ich viel reisen.'],
      },
      {
        type: 'transform',
        prompt: 'Wenn du mich brauchst, ruf mich einfach an.',
        promptData: { instruction: 'Forme die Bedingung formell mit „sollte" ohne „wenn": „…, ruf mich einfach an."' },
        acceptedAnswers: ['Solltest du mich brauchen, ruf mich einfach an.'],
      },
      { type: 'translate_en_de', prompt: 'Should it rain, we will stay at home.', acceptedAnswers: ['Sollte es regnen, bleiben wir zu Hause.', 'Sollte es regnen, bleiben wir zuhause.'] },
      { type: 'translate_de_en', prompt: 'Hätte ich das gewusst, wäre ich gekommen.', acceptedAnswers: ['Had I known that, I would have come.', 'If I had known that, I would have come.'] },
    ],
  },
  {
    key: 'c2-konnektoren-gehoben',
    title: 'Gehobene Konnektoren: sofern, insofern … als, geschweige denn',
    cefr: 'C2',
    focus: 'elegant connectors of formal written German — conditional sofern, insofern als, and the negative-append geschweige denn',
    relatedVocabTheme: 'Connectors',
    explanationMd: `Three connectors give formal German its precision — all three were deliberately held back from C1.

## sofern — if / provided that
Pure condition, slightly more formal than *falls*, common in contracts:
- **Sofern** keine Einwände bestehen, beginnen wir am Montag. — Provided that there are no objections, we will start on Monday.

## insofern … als — in that / insofar as
Limits a statement to one aspect; **als** introduces the subordinate clause (verb at the end):
- Die Lage ist **insofern** kritisch, **als** die Reserven schrumpfen. — The situation is critical in that the reserves are shrinking.

## geschweige (denn) — let alone
Appended to a **negative** clause; what follows is even less likely. The shared case is kept:
- Er kann kaum lesen, **geschweige denn** schreiben. — He can hardly read, let alone write.
- Ich habe kein Auto, **geschweige** ein Fahrrad. — I don't have a car, let alone a bicycle.

## Register
*sofern* and *insofern als* belong to reports, papers, official letters; *geschweige denn* works in both speech and writing but always needs the negative lead-in.`,
    drills: [
      { type: 'cloze', prompt: '___ keine Einwände bestehen, beginnen wir am Montag. (bedingender Konnektor — formell)', acceptedAnswers: ['Sofern'] },
      { type: 'cloze', prompt: 'Er kann kaum lesen, ___ denn schreiben. („ganz zu schweigen von" — Konnektor)', acceptedAnswers: ['geschweige'] },
      { type: 'cloze', prompt: 'Die Lage ist insofern kritisch, ___ die Reserven schrumpfen. (nach insofern — Verb am Ende)', acceptedAnswers: ['als'] },
      {
        type: 'choice',
        prompt: '___ das Wetter mitspielt, findet die Feier im Garten statt.',
        promptData: { options: ['Sofern', 'Insofern', 'Geschweige', 'Zumindest'] },
        acceptedAnswers: ['Sofern'],
      },
      {
        type: 'transform',
        prompt: 'Wenn keine Fragen offen sind, schließen wir die Sitzung.',
        promptData: { instruction: 'Ersetze „wenn" durch den gehobenen bedingenden Konnektor: „…, schließen wir die Sitzung."' },
        acceptedAnswers: ['Sofern keine Fragen offen sind, schließen wir die Sitzung.'],
      },
      {
        type: 'transform',
        prompt: 'Die Wohnung hat keinen Balkon, von einer Terrasse ganz zu schweigen.',
        promptData: { instruction: 'Formuliere mit „geschweige" (+ Akkusativ): „Die Wohnung hat keinen Balkon, …"' },
        acceptedAnswers: ['Die Wohnung hat keinen Balkon, geschweige eine Terrasse.'],
      },
      { type: 'translate_en_de', prompt: 'Provided that there are no objections, we will start on Monday.', acceptedAnswers: ['Sofern keine Einwände bestehen, beginnen wir am Montag.'] },
      { type: 'translate_de_en', prompt: 'Er kann kaum lesen, geschweige denn schreiben.', acceptedAnswers: ['He can hardly read, let alone write.'] },
    ],
  },
  {
    key: 'c2-ellipsen',
    title: 'Ellipsen: gesprochene Auslassungen',
    cefr: 'C2',
    focus: 'dropping redundant material — Wenn nötig …, Alles klar?, verbless second clauses — how German compresses naturally',
    relatedVocabTheme: 'Communication',
    explanationMd: `An **Ellipse** omits what the listener can reconstruct. German uses four patterns constantly.

## Wenn-clause reduction
*Wenn* + subject + *sein* collapses to **Wenn + adjective/participle**:
- **Wenn nötig**, rufen wir an. — If necessary, we will call.
- **Wenn möglich**, bringen wir Getränke mit. — If possible, we will bring drinks.

## Question and answer formulas
- **Alles klar?** — Everything OK?
- **Kommst mit?** — Coming along? (the *du* is dropped with the verb ending)
- **Wo? Wann? Warum?** as full answers.

## Coordination ellipsis
When two clauses share the verb, the second drops it — the case endings carry the grammar:
- Er trank den Kaffee, sie **den** Tee. — He drank the coffee, she the tea.

## Modal remainder
The auxiliary survives alone after *aber*:
- Ich würde gern kommen, **kann** aber nicht. — I would like to come, but I can't.

Ellipses mark lively speech and tight prose; in formal writing the full form is safer.`,
    drills: [
      { type: 'cloze', prompt: 'Wenn ___ , rufen wir dich an. (nötig — Ellipse im wenn-Satz)', acceptedAnswers: ['nötig'] },
      { type: 'cloze', prompt: 'Ich würde gern kommen, ___ aber nicht. (können — Modalrest in der Ellipse)', acceptedAnswers: ['kann'] },
      { type: 'cloze', prompt: 'Er trank den Kaffee, sie ___ Tee. (Artikel — Koordinationsellipse ohne Verb)', acceptedAnswers: ['den'] },
      {
        type: 'choice',
        prompt: '___ klar? (Begrüßungs-Ellipse)',
        promptData: { options: ['Alles', 'Alles ist', 'Ist alles', 'Alles war'] },
        acceptedAnswers: ['Alles'],
      },
      {
        type: 'transform',
        prompt: 'Kommst du mit?',
        promptData: { instruction: 'Kürze die Frage um das Pronomen (Ellipse im Vertrauten-Ton): „…?"' },
        acceptedAnswers: ['Kommst mit?'],
      },
      {
        type: 'transform',
        prompt: 'Wenn es möglich ist, bringen wir Getränke mit.',
        promptData: { instruction: 'Kürze den wenn-Satz zur Ellipse: „…, bringen wir Getränke mit."' },
        acceptedAnswers: ['Wenn möglich, bringen wir Getränke mit.'],
      },
      { type: 'translate_en_de', prompt: 'If necessary, we will call you.', acceptedAnswers: ['Wenn nötig, rufen wir dich an.', 'Wenn nötig, rufen wir Sie an.'] },
      { type: 'translate_de_en', prompt: 'Ich würde gern kommen, kann aber nicht.', acceptedAnswers: ["I would like to come, but I can't.", 'I would like to come, but I cannot.'] },
    ],
  },
  {
    key: 'c2-wortbildung-nuancen',
    title: 'Wortbildung mit Nuance: -bar, -fähig, zer-, ent-',
    cefr: 'C2',
    focus: 'suffix and prefix shades — lösbar vs löslich, arbeitsfähig, the destructive zer- and the reversing ent-',
    relatedVocabTheme: 'Abstract',
    explanationMd: `Advanced learners pick words apart wrongly at their peril: near-twins differ in nuance.

## -bar vs. -lich
Both attach to verbs, but they mean different things:
- **lösbar** — solvable (a problem you can solve): eine **lösbare** Aufgabe
- **löslich** — soluble (dissolves chemically): Vitamin C ist in Wasser **löslich**
Likewise *trinkbar* (drinkable) vs. *trinklich* (rare, taste); -bar = "can be X-ed".

## -bar vs. -fähig
- **-bar** — the *object* can be X-ed: machbar, behebbar, kündbar
- **-fähig** — the *subject* is capable: arbeitsfähig, lernfähig, schulfähig

## zer- — destruction, coming apart
Inseparable, no *ge-* in the Partizip II:
- zerbrechen → zerbrach → **zerbrochen**; zerreißen, zerstören, **zerplatzt**

## ent- — removal, reversal
- entfernen (remove), entladen (unload), entkleiden (unclothe), entspannen (relax, "de-tense")

## ver- — completion, change of state
- verschwinden, verbringen, verlieren — the event runs to its end; often no literal "wrong" left.`,
    drills: [
      { type: 'cloze', prompt: 'Diese Aufgabe ist ___ . (lösen — „man kann sie lösen")', acceptedAnswers: ['lösbar'] },
      { type: 'cloze', prompt: 'Vitamin C ist in Wasser ___ . (lösen — chemische Eigenschaft)', acceptedAnswers: ['löslich'] },
      { type: 'cloze', prompt: 'Der Luftballon ist ___ . (zerplatzen, Partizip II — ohne ge-)', acceptedAnswers: ['zerplatzt'] },
      {
        type: 'choice',
        prompt: 'Nach der OP ist der Patient wieder voll ___ .',
        promptData: { options: ['arbeitsfähig', 'arbeitsbar', 'arbeitslos', 'arbeitsam'] },
        acceptedAnswers: ['arbeitsfähig'],
      },
      {
        type: 'transform',
        prompt: 'Man kann diesen Fehler beheben.',
        promptData: { instruction: 'Formuliere mit dem Suffix „-bar" als Adjektiv: „Dieser Fehler ist …"' },
        acceptedAnswers: ['Dieser Fehler ist behebbar.'],
      },
      {
        type: 'transform',
        prompt: 'Die Batterie kann aufgeladen werden.',
        promptData: { instruction: 'Formuliere mit dem Suffix „-bar": „Die Batterie ist …"' },
        acceptedAnswers: ['Die Batterie ist aufladbar.'],
      },
      { type: 'translate_en_de', prompt: 'This mistake can be corrected.', acceptedAnswers: ['Dieser Fehler ist korrigierbar.'] },
      { type: 'translate_de_en', prompt: 'Der Vertrag ist kündbar.', acceptedAnswers: ['The contract can be terminated.', 'The contract is terminable.'] },
    ],
  },
  {
    key: 'c2-adjektive-praedikativ',
    title: 'Nur prädikative Adjektive: egal, leid, schuld, quitt, gewachsen',
    cefr: 'C2',
    focus: 'adjectives that refuse the slot before a noun — and the cases they govern (mir egal, es leid, an + Dat schuld, + Dat gewachsen)',
    relatedVocabTheme: 'Emotions',
    explanationMd: `A handful of everyday adjectives exist **only after sein/werden/bleiben** — they never stand before a noun and take no adjective endings. Each governs a case.

## The set
- **egal** (+ Dativ der Person): Das ist **mir** egal. — I don't care.
- **leid** (+ es im Akkusativ): Ich bin **es** leid, jeden Tag zu pendeln. — I'm tired of commuting every day.
- **schuld** (+ an + Dativ): Du bist **an allem** schuld! — It's all your fault!
- **quitt** (+ mit): Jetzt sind wir **quitt**. — Now we're even (debts cancelled).
- **gewachsen** (+ Dativ): Sie ist **der Aufgabe** gewachsen. — She is equal to the task.
- Similar dative-experience forms: Mir ist **bange**. — I'm afraid.

## Why it matters
*Der egale Vorschlag* is impossible — a noun-slot needs another word (*der gleichgültige Vorschlag*).

## Fixed frames
- Es ist mir egal, ob … / wie … / wann …
- Ich bin es leid, dass … / zu + Infinitiv
- Er ist der Lage (noch nicht) gewachsen.`,
    drills: [
      { type: 'cloze', prompt: 'Das ist ___ egal. (Dativ: ich)', acceptedAnswers: ['mir'] },
      { type: 'cloze', prompt: 'Ich bin ___ leid, jeden Tag zu pendeln. (Akkusativ: es)', acceptedAnswers: ['es'] },
      { type: 'cloze', prompt: 'Du bist an allem ___ ! (nur prädikatives Adjektiv)', acceptedAnswers: ['schuld'] },
      {
        type: 'choice',
        prompt: 'Ist sie der Aufgabe ___?',
        promptData: { options: ['gewachsen', 'gewachsenen', 'gewachsene', 'wach'] },
        acceptedAnswers: ['gewachsen'],
      },
      {
        type: 'transform',
        prompt: 'Sie kann diese schwierige Aufgabe bewältigen.',
        promptData: { instruction: 'Formuliere mit „gewachsen" (+ Dativ): „Sie ist …"' },
        acceptedAnswers: ['Sie ist dieser schwierigen Aufgabe gewachsen.'],
      },
      {
        type: 'transform',
        prompt: 'Wir schulden uns gegenseitig nichts mehr.',
        promptData: { instruction: 'Formuliere mit „quitt": „…"' },
        acceptedAnswers: ['Jetzt sind wir quitt.', 'Wir sind jetzt quitt.'],
      },
      { type: 'translate_en_de', prompt: "I don't care when you come.", acceptedAnswers: ['Es ist mir egal, wann du kommst.', 'Es ist mir egal, wann Sie kommen.'] },
      { type: 'translate_de_en', prompt: 'Ich bin es leid, immer aufzuräumen.', acceptedAnswers: ["I'm tired of always cleaning up.", 'I am tired of always cleaning up.', 'I am sick of always tidying up.'] },
    ],
  },
  {
    key: 'c2-kaum-als',
    title: 'kaum … als, sobald, sowie — zeitliche Präzision',
    cefr: 'C2',
    focus: 'narrative kaum … als (no sooner … than) plus the formal as-soon-as set sobald / seit(dem) / sowie',
    relatedVocabTheme: 'Media',
    explanationMd: `## kaum … als
The dramatic "no sooner … than": **kaum** fronts the first clause, its verb follows immediately, and **als** (never *wenn*) introduces the interruption. Past tenses only.
- **Kaum war** ich zu Hause, **als** das Telefon klingelte. — I had hardly got home when the phone rang.
- **Kaum hatte** er das Büro betreten, als das Meeting begann. — He had scarcely entered the office when the meeting began.

## sobald — as soon as (neutral)
Works in every tense, including the future: **Sobald** der Zug hält, steigen wir aus.

## sowie — as soon as (formal)
Elevated written German, business letters: **Sowie** die Ergebnisse vorliegen, informieren wir Sie.

## seit / seitdem — since
Ongoing span + **Präsens**: **Seitdem** sie hier arbeitet, geht es ihm besser. (seit = also a preposition with Dativ: seit einem Jahr.)

## Choosing
Narrative drama → kaum … als; planning → sobald; officialese → sowie. *Nachdem* stays for plain "after" with tense logic (Perfekt → Präsens).`,
    drills: [
      { type: 'cloze', prompt: 'Kaum war ich zu Hause, ___ klingelte das Telefon. (Konnektor nach dem kaum-Satz)', acceptedAnswers: ['als'] },
      { type: 'cloze', prompt: '___ hatte er das Büro betreten, als das Meeting begann. (kaum-Satz: Verb direkt danach)', acceptedAnswers: ['Kaum'] },
      { type: 'cloze', prompt: '___ die Ergebnisse vorliegen, informieren wir Sie. (formell für „sobald")', acceptedAnswers: ['Sowie'] },
      {
        type: 'choice',
        prompt: 'Kaum war er angekommen, ___ sich die ersten Gäste beschwerten.',
        promptData: { options: ['als', 'wenn', 'wann', 'dass'] },
        acceptedAnswers: ['als'],
      },
      {
        type: 'transform',
        prompt: 'Kurz nachdem ich mich gesetzt hatte, klopfte es.',
        promptData: { instruction: 'Formuliere dramatisch mit „Kaum …, als …": „…"' },
        acceptedAnswers: ['Kaum hatte ich mich gesetzt, als es klopfte.', 'Kaum hatte ich mich hingesetzt, als es klopfte.'],
      },
      {
        type: 'transform',
        prompt: 'Wir informieren Sie sofort, sobald die Ergebnisse da sind.',
        promptData: { instruction: 'Formuliere formell mit „Sowie" am Satzanfang: „…, informieren wir Sie."' },
        acceptedAnswers: ['Sowie die Ergebnisse vorliegen, informieren wir Sie.'],
      },
      { type: 'translate_en_de', prompt: 'No sooner had he arrived than the phone rang.', acceptedAnswers: ['Kaum war er angekommen, als das Telefon klingelte.', 'Kaum war er da, als das Telefon klingelte.'] },
      { type: 'translate_de_en', prompt: 'Sobald der Zug hält, steigen wir aus.', acceptedAnswers: ['As soon as the train stops, we get off.', 'We get off as soon as the train stops.', 'As soon as the train stops, we will get off.'] },
    ],
  },
  {
    key: 'c2-praepositionspaare',
    title: 'Präpositionspaare: von … aus, auf … hin, um … willen',
    cefr: 'C2',
    focus: 'two-part prepositional frames — viewpoint von … aus, reaction auf … hin, motive aus … heraus, and the genitive um … willen',
    relatedVocabTheme: 'Work',
    explanationMd: `German brackets a noun between two prepositions to express viewpoint, reaction or motive — a hallmark of sophisticated prose.

## von … aus — starting point / viewpoint
- **Von** meinem Fenster **aus** sieht man den See. — From my window you can see the lake.
- **Von** seiner Position **aus** ist das verständlich. — From his position that is understandable.

## auf … hin — in response to (auf + Akkusativ … hin)
- **Auf** deinen Brief **hin** habe ich das Angebot angenommen. — In response to your letter I accepted the offer.
- **Auf** die Warnung **hin** stoppte die Polizei das Auto.

## aus … heraus — out of a state (aus + Dativ … heraus)
- Sie handelte **aus** reiner Verzweiflung **heraus**. — She acted out of sheer despair.
- **Aus** dem Bauch **heraus** entschieden. — Decided by gut feeling.

## um … willen — for the sake of (+ Genitiv)
- **Um** der Kinder **willen** blieb sie in der Stadt. — For the children's sake she stayed in the city.
- **Um** des Friedens **willen** wurde der Vertrag geschlossen.

Note the case discipline: *auf … hin* takes Akkusativ, *aus … heraus* Dativ, *um … willen* Genitiv.`,
    drills: [
      { type: 'cloze', prompt: '___ meinem Fenster aus sieht man den See. (Standpunkt-Angabe)', acceptedAnswers: ['Von'] },
      { type: 'cloze', prompt: 'Auf deinen Brief ___ habe ich das Angebot angenommen. (als Reaktion auf)', acceptedAnswers: ['hin'] },
      { type: 'cloze', prompt: 'Um ___ willen blieb sie in der Stadt. (die Kinder, Genitiv)', acceptedAnswers: ['der Kinder'] },
      { type: 'cloze', prompt: 'Sie handelte ___ reiner Verzweiflung heraus. (Präposition des Motivs)', acceptedAnswers: ['aus'] },
      {
        type: 'choice',
        prompt: '___ des Friedens willen wurde der Vertrag geschlossen.',
        promptData: { options: ['Um', 'Für', 'Aus', 'Auf'] },
        acceptedAnswers: ['Um'],
      },
      {
        type: 'transform',
        prompt: 'Weil ich deinen Brief bekommen habe, habe ich gekündigt.',
        promptData: { instruction: 'Formuliere mit „auf … hin": „… habe ich gekündigt."' },
        acceptedAnswers: ['Auf deinen Brief hin habe ich gekündigt.'],
      },
      { type: 'translate_en_de', prompt: 'For the sake of the children, she stayed.', acceptedAnswers: ['Um der Kinder willen blieb sie.', 'Um der Kinder willen ist sie geblieben.'] },
      { type: 'translate_de_en', prompt: 'Von seinem Standpunkt aus ist die Entscheidung verständlich.', acceptedAnswers: ['From his point of view, the decision is understandable.', 'From his standpoint, the decision is understandable.'] },
    ],
  },
]
