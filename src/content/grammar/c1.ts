import type { SeedTopic } from './types'

/**
 * C1 grammar syllabus (M12.1): 12 topics extending the A1–B2 bank (50 → 62).
 * De-duplicated against B2/B1: the B2 file already ships Konjunktiv I,
 * Konjunktiv II Vergangenheit, subjektive Modalverben, N-Deklination,
 * Nominalstil, Genitiv-Präpositionen & -relativsätze, Pronominaladverbien,
 * Passiversatz, Funktionsverbgefüge, Partizipialsätze and je…desto — so C1
 * adds what is genuinely missing: als-ob comparisons, politeness KII,
 * Futur II, Bekommen-Passiv, Korrelat-es, connector nuances, erweiterte
 * Attribute, Gerundiv, prepositional/was/wo relatives, genitive verbs,
 * Satzklammer/Ausklammerung and Appositionen.
 */
export const C1_TOPICS: SeedTopic[] = [
  {
    key: 'c1-konjunktiv2-als-ob',
    title: 'Irreale Vergleichsätze: als ob & als wenn',
    cefr: 'C1',
    focus: 'als ob + Konjunktiv II — unreal comparisons with synthetic verb forms and past counterfactuals',
    relatedVocabTheme: 'Emotions',
    explanationMd: `After **als ob** / **als wenn** the verb stands in the **Konjunktiv II** — what looks real is *not*. The clause is subordinate, so the finite verb moves to the very end.

## Gegenwart — synthetic forms preferred
- Er tut, als ob er alles **wüsste**. — He acts as if he knew everything.
- Sie sieht aus, als ob sie **müde wäre**. — She looks as if she were tired.
- Ich fühle mich, als ob ich im falschen Film **wäre**.

Frequent synthetic forms: *wäre, hätte, käme, gäbe, ginge, wüsste, könnte, dürfte, müsste, sollte*. The würde-Ersatz is possible, but sounds less elegant here.

## Vergangenheit — Konjunktiv II der Vergangenheit
- Sie sah aus, als ob sie **geweint hätte**. — She looked as if she had been crying.
- Er tat, als ob er **nichts bemerkt hätte**. — He pretended not to have noticed anything.

## als (without ob)
Literary and shorter: *Er sah aus, als hätte er gewonnen.* The verb follows immediately after **als**.

## als ob vs. wie wenn
Same meaning; **als ob** is the standard written form, **wie wenn** colloquial.`,
    drills: [
      { type: 'cloze', prompt: 'Er tut, als ob er die Antwort ___ . (wissen, Konjunktiv II)', acceptedAnswers: ['wüsste'] },
      { type: 'cloze', prompt: 'Sie sah aus, als ob sie ___ hätte. (weinen, Partizip II)', acceptedAnswers: ['geweint'] },
      { type: 'cloze', prompt: 'Du siehst aus, als ob du müde ___ . (sein, Konjunktiv II)', acceptedAnswers: ['wärest', 'wärst'] },
      { type: 'cloze', prompt: 'Ich fühle mich, als ob ich im falschen Film ___ . (sein, Konjunktiv II)', acceptedAnswers: ['wäre'] },
      {
        type: 'choice',
        prompt: 'Er benimmt sich, als ob er der Chef ___ .',
        promptData: { options: ['wäre', 'ist', 'war', 'sein'] },
        acceptedAnswers: ['wäre'],
      },
      {
        type: 'transform',
        prompt: 'Er tut so, als ob er krank ist.',
        promptData: { instruction: 'Rewrite the comparison clause in the Konjunktiv II: „Er tut so, als ob er …"' },
        acceptedAnswers: ['Er tut so, als ob er krank wäre.'],
      },
      { type: 'translate_en_de', prompt: 'He acts as if he knew everything.', acceptedAnswers: ['Er tut, als ob er alles wüsste.', 'Er benimmt sich, als ob er alles wüsste.'] },
      { type: 'translate_de_en', prompt: 'Sie sah aus, als ob sie geweint hätte.', acceptedAnswers: ['She looked as if she had been crying.', 'She looked as though she had cried.', 'She looked as if she had cried.'] },
    ],
  },
  {
    key: 'c1-hoeflichkeit-konjunktiv2',
    title: 'Höflichkeit: Konjunktiv II in Bitten & Wünschen',
    cefr: 'C1',
    focus: 'Dürfte ich, Wären Sie so freundlich, Ich hätte gern — hedges and polite formulas in formal German',
    relatedVocabTheme: 'Communication',
    explanationMd: `The Konjunktiv II is the engine of **politeness**. Direct Indikativ questions sound blunt; the Konjunktiv II turns them into requests.

## Softened questions
- **Dürfte ich** Sie kurz stören? — Might I disturb you briefly?
- **Könntest du** mir kurz helfen? — Could you help me for a second?
- **Würden Sie** das Fenster schließen? — Would you close the window?

## Wishes & offers
- Ich **hätte** gern einen Termin am Freitag. — I would like an appointment on Friday.
- Ich **würde** gerne wissen, wie das funktioniert. — I would like to know how that works.
- An Ihrer Stelle **würde ich** das Angebot annehmen. — In your place I would accept the offer.

## Fixed polite frames
- **Wären Sie so freundlich**, mir zu antworten?
- Ich **hätte eine Bitte**. — I have a request (softened).
- Es **wäre nett**, wenn Sie mir Bescheid geben könnten.

Common synthetic stems for this register: *ich käme, du fändest, er gäbe, ihr wüsstet, sie kämen*.`,
    drills: [
      { type: 'cloze', prompt: '___ ich Sie kurz stören? (dürfen, Konjunktiv II — höfliche Frage)', acceptedAnswers: ['Dürfte'] },
      { type: 'cloze', prompt: 'Ich ___ gern einen Termin am Freitag. (haben, Konjunktiv II)', acceptedAnswers: ['hätte'] },
      { type: 'cloze', prompt: '___ Sie mir bitte helfen? (werden, Konjunktiv II — höfliche Bitte)', acceptedAnswers: ['Würden'] },
      {
        type: 'choice',
        prompt: 'Ich ___ gern zwei Karten für heute Abend.',
        promptData: { options: ['hätte', 'habe', 'hatte', 'würde'] },
        acceptedAnswers: ['hätte'],
      },
      {
        type: 'transform',
        prompt: 'Hilf mir bitte kurz.',
        promptData: { instruction: 'Make the request politely with the Konjunktiv II (du-Form): „Könntest du …"' },
        acceptedAnswers: ['Könntest du mir bitte kurz helfen?'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Ich', 'hätte', 'gern', 'einen', 'Termin', 'am', 'Freitag'] },
        acceptedAnswers: ['Ich hätte gern einen Termin am Freitag.'],
      },
      { type: 'translate_en_de', prompt: 'Could you please send me the documents?', acceptedAnswers: ['Könnten Sie mir bitte die Unterlagen schicken?', 'Könntest du mir bitte die Unterlagen schicken?'] },
      { type: 'translate_de_en', prompt: 'Dürfte ich Sie kurz stören?', acceptedAnswers: ['Might I disturb you briefly?', 'Could I bother you for a moment?', 'May I disturb you briefly?'] },
    ],
  },
  {
    key: 'c1-futur2',
    title: 'Futur II — Vermutungen über die Vergangenheit',
    cefr: 'C1',
    focus: 'werden + Partizip II + haben/sein — assumptions about the past and completed future events',
    relatedVocabTheme: 'Everyday',
    explanationMd: `## Formation
**werden** (position 2) + **Partizip II** + **haben/sein** (clause end).
- Er **wird** den Zug **verpasst haben**. — He will have missed the train.
- In einer Woche **werden** wir das Projekt **abgeschlossen haben**. — In a week we will have finished the project.

## Two readings
1. **Assumption about the past** (with *wohl, sicher, wahrscheinlich, bereits*):
   - Sie **wird** die Nachricht wohl schon **bekommen haben**. — She will probably have received the message already.
2. **Future event completed** by a reference point:
   - Bis Montag **werden** wir die Antwort **erhalten haben**. — By Monday we will have received the answer.

## sein or haben?
Like the Perfekt: motion or change of state → **sein** (Er wird schon **gegangen sein**.), everything else → **haben**.

## vs. Perfekt + modal word
„Er ist wohl gegangen" states a fact with a guessword; the Futur II makes the *guessing itself* explicit and softer.`,
    drills: [
      { type: 'cloze', prompt: 'Er ___ den Zug verpasst haben. (werden, 3. Person Singular)', acceptedAnswers: ['wird'] },
      { type: 'cloze', prompt: 'Sie werden die Aufgabe wohl bereits ___ haben. (erledigen, Partizip II)', acceptedAnswers: ['erledigt'] },
      { type: 'cloze', prompt: 'Du wirst die Nachricht schon ___ haben. (bekommen, Partizip II)', acceptedAnswers: ['bekommen'] },
      {
        type: 'choice',
        prompt: 'Die Gäste ___ wohl schon gegangen sein.',
        promptData: { options: ['werden', 'würden', 'wären', 'hätten'] },
        acceptedAnswers: ['werden'],
      },
      {
        type: 'transform',
        prompt: 'Vermutlich hat er den Termin vergessen.',
        promptData: { instruction: 'Rewrite as a Futur II assumption: „Er …"' },
        acceptedAnswers: ['Er wird den Termin vergessen haben.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Wir', 'werden', 'die', 'Prüfung', 'bestanden', 'haben'] },
        acceptedAnswers: ['Wir werden die Prüfung bestanden haben.'],
      },
      { type: 'translate_en_de', prompt: 'She will probably have received the letter.', acceptedAnswers: ['Sie wird den Brief wahrscheinlich bekommen haben.', 'Sie wird den Brief wohl bekommen haben.'] },
      { type: 'translate_de_en', prompt: 'Er wird wohl schon gegangen sein.', acceptedAnswers: ['He will probably have left already.', 'He has probably already left.', 'He will probably already be gone.'] },
    ],
  },
  {
    key: 'c1-bekommen-passiv',
    title: 'Bekommen-Passiv (Dativ-Passiv)',
    cefr: 'C1',
    focus: 'bekommen/kriegen/erhalten + Partizip II — promoting the dative beneficiary to subject',
    relatedVocabTheme: 'Work',
    explanationMd: `German has a passive for **dative objects**: the verbs **bekommen / kriegen / erhalten** replace *werden*, and the dative beneficiary becomes the subject.

## Aktiv vs. Bekommen-Passiv
- Man hat **mir** das Gehalt ausgezahlt. (Aktiv)
- Das Gehalt ist **mir** ausgezahlt worden. (Vorgangspassiv — clunky)
- **Ich** habe das Gehalt **ausgezahlt bekommen**. (Bekommen-Passiv — natural)

## Formation
Subject (formerly dative) + haben/sein + … + Partizip II + **bekommen/kriegen/erhalten** at the very end.
- Sie **bekam** das Stipendium **ausgezahlt**. — She had the scholarship paid out.
- Wir **haben** die Karten **geschickt bekommen**. — We were sent the tickets.
- Er **erhält** die Ergebnisse **mitgeteilt**. — He is informed of the results.

## Register
**bekommen** neutral · **kriegen** spoken/colloquial · **erhalten** formal and written.`,
    drills: [
      { type: 'cloze', prompt: 'Sie ___ das Gehalt am Monatsende ausgezahlt. (bekommen, Präteritum)', acceptedAnswers: ['bekam'] },
      { type: 'cloze', prompt: 'Wir haben das Paket zugeschickt ___ . (bekommen, Partizip II)', acceptedAnswers: ['bekommen'] },
      { type: 'cloze', prompt: 'Der Patient ___ die Ergebnisse mitgeteilt. (erhalten, Präsens)', acceptedAnswers: ['erhält'] },
      {
        type: 'choice',
        prompt: 'Ich habe die Rechnung zugeschickt ___ .',
        promptData: { options: ['bekommen', 'worden', 'werden', 'gewesen'] },
        acceptedAnswers: ['bekommen'],
      },
      {
        type: 'transform',
        prompt: 'Man hat mir die Karten geschickt.',
        promptData: { instruction: 'Rewrite in the Bekommen-Passiv: „Ich …"' },
        acceptedAnswers: ['Ich habe die Karten geschickt bekommen.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Sie', 'bekam', 'das', 'Stipendium', 'ausgezahlt'] },
        acceptedAnswers: ['Sie bekam das Stipendium ausgezahlt.'],
      },
      { type: 'translate_en_de', prompt: 'We were sent the documents.', acceptedAnswers: ['Wir haben die Unterlagen geschickt bekommen.', 'Wir haben die Unterlagen zugeschickt bekommen.'] },
      { type: 'translate_de_en', prompt: 'Er bekommt das Gehalt überwiesen.', acceptedAnswers: ['He has his salary transferred.', 'His salary is transferred to him.', 'He gets his salary transferred.'] },
    ],
  },
  {
    key: 'c1-es-korrelat',
    title: 'Korrelat-es & unpersönliche Sätze',
    cefr: 'C1',
    focus: 'es in Vorfeld and Mittelfeld — es scheint, es gelingt, ich habe es eilig, es fällt mir schwer, … zu',
    relatedVocabTheme: 'Verbs',
    explanationMd: `**es** appears in three advanced jobs:

## 1. Unpersönliches es (weather, states, general statements)
- **Es** regnet. — It is raining.
- **Es** wird spät. — It is getting late.
- **Es** handelt sich um einen Irrtum. — It is a misunderstanding.

## 2. Vorfeld-es as placeholder for a following clause
- **Es** fällt mir schwer, früh aufzustehen. = Früh aufzustehen fällt mir schwer.
- **Es** scheint, dass er krank ist. — It seems that he is sick.
When something else fills position 1, the placeholder drops — but a **Korrelat-es stays in the Mittelfeld**: *Mir fällt **es** schwer, früh aufzustehen.*

## 3. Korrelat-es with fixed verb phrases (Akkusativ)
- Ich habe **es** eilig. — I am in a hurry.
- Ich habe **es** ihm versprochen. — the promise = es
- Wie bringst du **es** fertig, so früh aufzustehen? — How do you manage it?`,
    drills: [
      { type: 'cloze', prompt: '___ gelingt mir nicht, früh aufzustehen. (Vorfeld-Platzhalter)', acceptedAnswers: ['Es'] },
      { type: 'cloze', prompt: 'Ich habe ___ eilig, den Zug zu erreichen. (Korrelat im Mittelfeld)', acceptedAnswers: ['es'] },
      { type: 'cloze', prompt: '___ scheint, dass er krank ist. (unpersönliches Verb)', acceptedAnswers: ['Es'] },
      {
        type: 'choice',
        prompt: '___ scheint, dass er die Prüfung besteht.',
        promptData: { options: ['Es', 'Er', 'Das', 'Sie'] },
        acceptedAnswers: ['Es'],
      },
      {
        type: 'transform',
        prompt: 'Dass du gekommen bist, freut mich.',
        promptData: { instruction: 'Move the clause to the end and start with the placeholder: „… freut mich, dass …"' },
        acceptedAnswers: ['Es freut mich, dass du gekommen bist.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence (comma before the infinitive group is optional here).',
        promptData: { tokens: ['Mir', 'fällt', 'es', 'schwer', 'früh', 'aufzustehen'] },
        acceptedAnswers: ['Mir fällt es schwer früh aufzustehen.', 'Mir fällt es schwer, früh aufzustehen.'],
      },
      { type: 'translate_en_de', prompt: 'It is difficult for me to get up early.', acceptedAnswers: ['Mir fällt es schwer, früh aufzustehen.', 'Mir fällt es schwer früh aufzustehen.'] },
      { type: 'translate_de_en', prompt: 'Es scheint, dass er die Wahrheit sagt.', acceptedAnswers: ['It seems that he is telling the truth.', 'It seems that he tells the truth.', 'It seems he is telling the truth.'] },
    ],
  },
  {
    key: 'c1-konnektoren-nuancen',
    title: 'Konnektoren mit Nuance: auch wenn, es sei denn, zumal',
    cefr: 'C1',
    focus: 'concessive, exceptive and speaker-set conditional connectors — auch wenn, wenn auch, es sei denn, vorausgesetzt, zumal',
    relatedVocabTheme: 'Connectors',
    explanationMd: `C1 connectors sharpen the logical relation between clauses:

## auch wenn — concession (even if / even though)
- Ich gehe joggen, **auch wenn** es regnet. — The rain does not stop me (real or hypothetical).
vs. **obwohl** (only factual): *Ich gehe joggen, obwohl es regnet.*

## wenn auch — partial concession
- Ein guter Film, **wenn auch** etwas lang. — A good film, if a bit long.

## es sei denn — except if (unless)
- Wir fliegen morgen, **es sei denn**, der Streik wird abgesagt. — … unless the strike is cancelled.

## vorausgesetzt (, dass) — a condition set by the speaker
- Du bekommst das Zimmer, **vorausgesetzt**, du zahlst im Voraus. — Provided that you pay in advance.

## zumal — reinforcing cause (all the more since)
- Der Ausflug lohnt sich nicht, **zumal** das Wetter schlecht ist. — … especially since the weather is bad.`,
    drills: [
      { type: 'cloze', prompt: 'Ich gehe joggen, ___ es regnet. (Konzession — selbst bei Regen)', acceptedAnswers: ['auch wenn'] },
      { type: 'cloze', prompt: 'Ich komme um zehn, ___ der Zug hat Verspätung. (Ausnahme-Bedingung — nur wenn nicht)', acceptedAnswers: ['es sei denn'] },
      { type: 'cloze', prompt: 'Du bekommst das Zimmer, ___ dass du im Voraus zahlst. (Bedingung des Sprechers)', acceptedAnswers: ['vorausgesetzt'] },
      { type: 'cloze', prompt: 'Der Ausflug lohnt sich nicht, ___ das Wetter schlecht ist. (verstärkender Grund)', acceptedAnswers: ['zumal'] },
      {
        type: 'choice',
        prompt: 'Ich gehe trotzdem spazieren, ___ das Wetter schlecht ist. (verstärkender Grund)',
        promptData: { options: ['zumal', 'obwohl', 'denn', 'aber'] },
        acceptedAnswers: ['zumal'],
      },
      {
        type: 'transform',
        prompt: 'Nur wenn du mich anrufst, helfe ich dir.',
        promptData: { instruction: 'Rewrite with „vorausgesetzt": „Ich helfe dir, …"' },
        acceptedAnswers: ['Ich helfe dir, vorausgesetzt, dass du mich anrufst.'],
      },
      { type: 'translate_en_de', prompt: "I'll come unless I'm sick.", acceptedAnswers: ['Ich komme, es sei denn, ich bin krank.', 'Ich komme, es sei denn, dass ich krank bin.'] },
      { type: 'translate_de_en', prompt: 'Auch wenn es spät ist, ruft sie noch an.', acceptedAnswers: ['Even if it is late, she still calls.', 'She still calls even if it is late.', 'She calls even though it is late.'] },
    ],
  },
  {
    key: 'c1-erweiterte-attribute',
    title: 'Erweiterte Attribute',
    cefr: 'C1',
    focus: 'reduced relative clauses as pre-nominal participle phrases — das 2019 verabschiedete Gesetz',
    relatedVocabTheme: 'Media',
    explanationMd: `Written German (news, administration, academia) compresses relative clauses into **participle phrases before the noun**:

## From relative clause to attribute
- das Gesetz, **das 2019 verabschiedet wurde** → das **2019 verabschiedete** Gesetz
- die Fragen, **die die Schüler gestellt haben** → die **von den Schülern gestellten** Fragen
- die Zahl, **die rasch steigt** → die **rasch steigende** Zahl

## Rules
- **Partizip II** (passive or completed) with a normal adjective ending: *das beschlossene Gesetz*.
- **Partizip I** (active, ongoing): *der lachende Mann*, *die steigende Zahl*.
- The agent enters with **von**, time spans as bare years, manner adverbs stay inside the frame.
- With an article the ending is weak (*das neu**e** Gesetz*, *die gestellte**n** Fragen*); without an article it is strong (*ein 2019 verabschiedete**s** Gesetz*).

## Reading strategy
Find the noun right after the participle block, then unfold the block back into a relative clause.`,
    drills: [
      { type: 'cloze', prompt: 'Das ___ Gesetz tritt 2026 in Kraft. (beschließen, Partizip II — vom Bund)', acceptedAnswers: ['beschlossene'] },
      { type: 'cloze', prompt: 'Die von den Schülern ___ Fragen wurden beantwortet. (stellen, Partizip II)', acceptedAnswers: ['gestellten'] },
      { type: 'cloze', prompt: 'Die ___ Zahl der Nutzer wächst weiter. (steigen, Partizip I)', acceptedAnswers: ['steigende'] },
      {
        type: 'choice',
        prompt: 'Das ___ Gutachten überzeugte alle. (prüfen, Partizip II — von der Kommission)',
        promptData: { options: ['geprüfte', 'prüfende', 'zu prüfende', 'prüfte'] },
        acceptedAnswers: ['geprüfte'],
      },
      {
        type: 'transform',
        prompt: 'Das Gesetz, das 2019 verabschiedet wurde, tritt in Kraft.',
        promptData: { instruction: 'Compress the relative clause into a participle attribute: „Das …"' },
        acceptedAnswers: ['Das 2019 verabschiedete Gesetz tritt in Kraft.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Das', 'gestern', 'veröffentlichte', 'Ergebnis', 'überraschte', 'alle'] },
        acceptedAnswers: ['Das gestern veröffentlichte Ergebnis überraschte alle.'],
      },
      { type: 'translate_en_de', prompt: 'The documents examined by the authority were complete.', acceptedAnswers: ['Die von der Behörde geprüften Unterlagen waren vollständig.', 'Die von der Behörde überprüften Unterlagen waren vollständig.'] },
      { type: 'translate_de_en', prompt: 'Die laufend steigenden Kosten belasten das Budget.', acceptedAnswers: ['The continuously rising costs strain the budget.', 'The constantly increasing costs burden the budget.'] },
    ],
  },
  {
    key: 'c1-gerundivum',
    title: 'Gerundiv: zu + Infinitiv als Attribut',
    cefr: 'C1',
    focus: 'die zu prüfenden Unterlagen — a modal-passive infinitive phrase replacing a relative clause with müssen',
    relatedVocabTheme: 'Authorities',
    explanationMd: `The **Gerundiv** packs *müssen + Passiv* into an attribute before the noun:

## Unfolding
- die **zu prüfenden** Unterlagen = die Unterlagen, **die geprüft werden müssen**
- eine **nicht zu unterschätzende** Aufgabe = eine Aufgabe, die man nicht unterschätzen darf
- das **am Schalter auszufüllende** Formular = das Formular, das am Schalter ausgefüllt werden muss

## Formation
**zu + Infinitiv** in front of the noun with a normal adjective ending; separable verbs interleave: *abzuschließende Verträge* (ab … zu … schließen).
- Negation: **nicht zu** + Infinitiv — often means "cannot/should not be …ed".

## Typical habitat
Official German (Behördendeutsch): forms, applications, notices — and academic prose.

## vs. Partizip I
*die steigende Zahl* (is rising) vs. *die zu prüfende Zahl* (must be checked) — the Gerundiv is modal, not descriptive.`,
    drills: [
      { type: 'cloze', prompt: 'Die ___ Unterlagen liegen im Büro. (prüfen + zu — die geprüft werden müssen)', acceptedAnswers: ['zu prüfenden'] },
      { type: 'cloze', prompt: 'Das ist ein ___ Risiko. (nicht unterschätzen + zu)', acceptedAnswers: ['nicht zu unterschätzendes'] },
      { type: 'cloze', prompt: 'Geben Sie das ___ Formular am Schalter ab. (ausfüllen + zu)', acceptedAnswers: ['auszufüllende'] },
      {
        type: 'choice',
        prompt: 'Das ist eine ___ Entscheidung. (vertreten — sie kann vertreten werden)',
        promptData: { options: ['zu vertretende', 'vertretende', 'vertretene', 'zu vertreten'] },
        acceptedAnswers: ['zu vertretende'],
      },
      {
        type: 'transform',
        prompt: 'Die Unterlagen, die geprüft werden müssen, sind bereit.',
        promptData: { instruction: 'Replace the relative clause with a Gerundiv attribute: „Die …"' },
        acceptedAnswers: ['Die zu prüfenden Unterlagen sind bereit.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Die', 'zu', 'prüfenden', 'Unterlagen', 'liegen', 'bereit'] },
        acceptedAnswers: ['Die zu prüfenden Unterlagen liegen bereit.'],
      },
      { type: 'translate_en_de', prompt: 'The forms to be filled out are on the counter.', acceptedAnswers: ['Die auszufüllenden Formulare liegen am Schalter.', 'Die auszufüllenden Formulare liegen auf dem Tresen.'] },
      { type: 'translate_de_en', prompt: 'Das ist eine nicht zu unterschätzende Aufgabe.', acceptedAnswers: ['That is a task that should not be underestimated.', 'That is a challenge not to be underestimated.', 'This is a task not to be underestimated.'] },
    ],
  },
  {
    key: 'c1-relativsaetze-praeposition',
    title: 'Relativsätze mit Präposition, was & wo',
    cefr: 'C1',
    focus: 'mit dem, über die, wofür — prepositional relatives plus wo (places) and was (general or neuter)',
    relatedVocabTheme: 'Abstract',
    explanationMd: `## Preposition + relative pronoun
The verb decides the preposition; the case follows from that preposition:
- Der Mann, **mit dem** ich spreche, ist Arzt. (sprechen **mit** + Dativ)
- Das Buch, **über das** wir sprachen, ist neu. (sprechen **über** + Akkusativ)
- Die Kollegin, **der** ich vertraue, hilft mir. (vertrauen + Dativ!)

## wo — for places (any gender)
- Die Stadt, **wo** ich wohne, ist klein. (= in der)
Also: *der Ort, das Haus, das Dorf, wo …*

## was — after alles, nichts, etwas, das, vieles
- **Alles, was** er sagt, ist wichtig. — Everything he says is important.
- Das, **was** du sagst, stimmt. — What you are saying is right.

## wo(r)- compounds (formal written German)
- Das Thema, **worauf** er stolz ist, … — everyday speech prefers **auf das**.`,
    drills: [
      { type: 'cloze', prompt: 'Der Mann, mit ___ ich spreche, ist Arzt. (Relativpronomen, Dativ)', acceptedAnswers: ['dem'] },
      { type: 'cloze', prompt: 'Das Buch, über ___ wir sprachen, ist neu. (Relativpronomen, Akkusativ)', acceptedAnswers: ['das'] },
      { type: 'cloze', prompt: 'Die Stadt, ___ ich wohne, ist klein. (Relativadverb für Orte)', acceptedAnswers: ['wo'] },
      { type: 'cloze', prompt: 'Das, ___ du sagst, stimmt. (Relativpronomen nach „das")', acceptedAnswers: ['was'] },
      {
        type: 'choice',
        prompt: 'Die Kollegin, ___ ich vertraue, hilft mir. (vertrauen + Dativ)',
        promptData: { options: ['der', 'die', 'dem', 'den'] },
        acceptedAnswers: ['der'],
      },
      {
        type: 'transform',
        prompt: 'Kennst du die Firma? Ich arbeite für sie.',
        promptData: { instruction: 'Combine into one sentence with a prepositional relative clause: „Kennst du die Firma, …"' },
        acceptedAnswers: ['Kennst du die Firma, für die ich arbeite?'],
      },
      { type: 'translate_en_de', prompt: 'The house in which I live is old.', acceptedAnswers: ['Das Haus, in dem ich wohne, ist alt.', 'Das Haus, in welchem ich wohne, ist alt.'] },
      { type: 'translate_de_en', prompt: 'Alles, was er tut, gelingt ihm.', acceptedAnswers: ['Everything he does succeeds.', 'Everything that he does turns out well.', 'He succeeds at everything he does.'] },
    ],
  },
  {
    key: 'c1-verben-genitiv',
    title: 'Verben mit Genitivergänzung',
    cefr: 'C1',
    focus: 'bedürfen, gedenken, sich erfreuen, beschuldigen, entbehren — formal verbs governing the genitive',
    relatedVocabTheme: 'Law',
    explanationMd: `A small closed set of formal verbs takes a **Genitiv object** instead of an accusative or dative one:

## The core set
- **bedürfen** (es bedarf) — to require: Das Projekt **bedarf einer Genehmigung**.
- **gedenken** — to commemorate: Wir **gedenken der Opfer**.
- **sich erfreuen** — to enjoy: Sie **erfreut sich bester Gesundheit**. — She enjoys excellent health.
- **beschuldigen / anklagen** — to accuse (jemanden **einer Sache**): Man **beschuldigt ihn des Diebstahls**.
- **entbehren** — to lack: Der Bericht **entbehrt jeder Grundlage**. — The report lacks any basis.

## Notes
- These verbs live in written, formal, journalistic or legal registers; in casual speech *brauchen* replaces *bedürfen*.
- **entbehren nicht** + Genitiv is a fixed ironic frame: *Der Film entbehrt nicht einer gewissen Komik.* — The film is not without a certain humor.`,
    drills: [
      { type: 'cloze', prompt: 'Das Projekt bedarf ___ Genehmigung. (unbestimmter Artikel im Genitiv)', acceptedAnswers: ['einer'] },
      { type: 'cloze', prompt: 'Wir gedenken ___ Verstorbenen. (bestimmter Artikel im Genitiv)', acceptedAnswers: ['der'] },
      { type: 'cloze', prompt: 'Man beschuldigt ihn ___ Diebstahls. (Genitiv beim Verb beschuldigen)', acceptedAnswers: ['des'] },
      {
        type: 'choice',
        prompt: 'Der Angeklagte bedarf ___ Verteidigers.',
        promptData: { options: ['eines', 'einen', 'einem', 'ein'] },
        acceptedAnswers: ['eines'],
      },
      {
        type: 'transform',
        prompt: 'Wir denken an die Opfer des Krieges.',
        promptData: { instruction: 'Rewrite with „gedenken" + Genitiv: „Wir …"' },
        acceptedAnswers: ['Wir gedenken der Opfer des Krieges.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Das', 'Vorhaben', 'bedarf', 'der', 'Zustimmung', 'des', 'Rates'] },
        acceptedAnswers: ['Das Vorhaben bedarf der Zustimmung des Rates.'],
      },
      { type: 'translate_en_de', prompt: 'The project needs a permit.', acceptedAnswers: ['Das Projekt bedarf einer Genehmigung.', 'Das Vorhaben bedarf einer Genehmigung.'] },
      { type: 'translate_de_en', prompt: 'Sie erfreut sich bester Gesundheit.', acceptedAnswers: ['She enjoys the best of health.', 'She is in excellent health.', 'She enjoys excellent health.'] },
    ],
  },
  {
    key: 'c1-satzklammer',
    title: 'Satzklammer, Vorfeld & Ausklammerung',
    cefr: 'C1',
    focus: 'the verb bracket (finite verb + participle/infinitive/prefix) — placing adverbials inside or after the frame',
    relatedVocabTheme: 'Abstract',
    explanationMd: `German main clauses are held together by the **Satzklammer**: **finite verb** (position 2) … **closing element** at the end (participle, infinitive, separable prefix or comparable).

## Building the frame
- Ich **habe** die E-Mail noch nicht **beantwortet**. (haben … beantwortet)
- Er **will** nach Berlin **ziehen**. (will … ziehen)
- Er **ruft** dich nach dem Essen **an**. (ruft … an)

## Vorfeld — position 1 selects the topic
- **Den Bericht** habe ich gestern gelesen. — the report is the topic (object in position 1), not *ich*.

## Ausklammerung — after the bracket (Nachfeld)
Heavy or contrastive elements may follow the closing verb; this is marked but acceptable:
- Er hat **gearbeitet** — **den ganzen Tag**. → neutral: Er hat **den ganzen Tag gearbeitet**.
Comparisons and infinitive groups also commonly stand in the Nachfeld: *Es ist besser, **nachzudenken**, als zu reden.*

## Double infinitive (Ersatzinfinitiv)
- Sie hat den Wagen waschen **lassen**. (not: ~~gelassen~~)`,
    drills: [
      { type: 'cloze', prompt: 'Ich habe die E-Mail noch nicht ___ . (beantworten — rechte Klammer)', acceptedAnswers: ['beantwortet'] },
      { type: 'cloze', prompt: 'Er ruft dich nach dem Essen ___ . (anrufen — trennbares Präfix als Klammer)', acceptedAnswers: ['an'] },
      { type: 'cloze', prompt: '___ Bericht habe ich gestern gelesen. (Vorfeld: Objekt als Thema)', acceptedAnswers: ['Den'] },
      {
        type: 'choice',
        prompt: 'Sie hat den Wagen waschen ___ .',
        promptData: { options: ['lassen', 'gelassen', 'lässt', 'zu lassen'] },
        acceptedAnswers: ['lassen'],
      },
      {
        type: 'transform',
        prompt: 'Er hat gearbeitet den ganzen Tag.',
        promptData: { instruction: 'Move the adverbial inside the Satzklammer (Mittelfeld): „Er …"' },
        acceptedAnswers: ['Er hat den ganzen Tag gearbeitet.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Wir', 'haben', 'gestern', 'lange', 'telefoniert'] },
        acceptedAnswers: ['Wir haben gestern lange telefoniert.'],
      },
      { type: 'translate_en_de', prompt: 'He wanted to call you yesterday.', acceptedAnswers: ['Er wollte dich gestern anrufen.', 'Er wollte Sie gestern anrufen.'] },
      { type: 'translate_de_en', prompt: 'Den Bericht habe ich gestern gelesen.', acceptedAnswers: ['I read the report yesterday.', 'I did read the report yesterday.', 'As for the report, I read it yesterday.'] },
    ],
  },
  {
    key: 'c1-appositionen',
    title: 'Appositionen',
    cefr: 'C1',
    focus: 'noun phrases in apposition between commas — case agreement with the reference noun',
    relatedVocabTheme: 'Society',
    explanationMd: `An **Apposition** renames a noun, is set off by a comma pair (or dashes), and takes the **same case** as its reference noun:

## Nominativ
- Berlin, **die Hauptstadt Deutschlands**, liegt an der Spree.

## Accusative object → accusative apposition
- Ich habe Herrn Müller, **meinen Nachbarn**, getroffen. — I met Mr. Müller, my neighbor.

## After a genitive noun → genitive apposition
- Wir gedenken Goethes, **des großen Dichters**. — We commemorate Goethe, the great poet.

## After a dative noun → dative apposition
- Sie sprach mit Dr. Weber, **einem bekannten Arzt**. — She spoke with Dr. Weber, a well-known doctor.

## Punctuation & register
The comma pair is obligatory; removing it must not change the sentence. Titles directly before names are **not** appositions (no comma): *Bundeskanzler Scholz* — but *Scholz, der Bundeskanzler, …* is one.`,
    drills: [
      { type: 'cloze', prompt: 'Berlin, ___ Hauptstadt Deutschlands, liegt an der Spree. (Apposition im Nominativ)', acceptedAnswers: ['die'] },
      { type: 'cloze', prompt: 'Ich habe Herrn Müller, ___ Nachbarn, getroffen. (Apposition im Akkusativ)', acceptedAnswers: ['meinen'] },
      { type: 'cloze', prompt: 'Wir gedenken Goethes, ___ großen Dichters. (Apposition im Genitiv)', acceptedAnswers: ['des'] },
      { type: 'cloze', prompt: 'Sie sprach mit Dr. Weber, ___ bekannten Arzt. (Apposition im Dativ)', acceptedAnswers: ['einem'] },
      {
        type: 'choice',
        prompt: 'Günter Grass, ___ Autor, wurde ausgezeichnet. (Apposition im Nominativ)',
        promptData: { options: ['der', 'den', 'dem', 'des'] },
        acceptedAnswers: ['der'],
      },
      {
        type: 'transform',
        prompt: 'Mein Onkel ist Arzt. Mein Onkel wohnt nebenan.',
        promptData: { instruction: 'Combine into one sentence with an apposition: „Mein Onkel, …"' },
        acceptedAnswers: ['Mein Onkel, ein Arzt, wohnt nebenan.'],
      },
      { type: 'translate_en_de', prompt: 'Vienna, the capital of Austria, is beautiful.', acceptedAnswers: ['Wien, die Hauptstadt Österreichs, ist schön.', 'Wien, die Hauptstadt von Österreich, ist schön.'] },
      { type: 'translate_de_en', prompt: 'Ich habe Frau Schmidt, unsere Lehrerin, gesehen.', acceptedAnswers: ['I saw Mrs. Schmidt, our teacher.', 'I saw Ms. Schmidt, our teacher.', 'I have seen Mrs. Schmidt, our teacher.'] },
    ],
  },
]
