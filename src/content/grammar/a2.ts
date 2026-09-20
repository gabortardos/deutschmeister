import type { SeedTopic } from './types'

/** A2 grammar syllabus (12 topics): spoken past → adjective endings. */
export const A2_TOPICS: SeedTopic[] = [
  {
    key: 'a2-perfekt',
    title: 'Perfekt: the spoken past',
    cefr: 'A2',
    focus: 'haben/sein + Partizip II — the German everyday past tense',
    relatedVocabTheme: 'Free Time',
    explanationMd: `Germans talk about the past with the **Perfekt**: a helping verb (haben or sein) in position 2 plus the **Partizip II** at the end.

- Ich **habe** Fußball **gespielt**. — I played football.
- Sie **ist** nach Berlin **gefahren**. — She went to Berlin.

## haben or sein?
- **sein** with movement (gehen, fahren, fliegen) and state change (aufstehen, werden, sterben)
- **haben** with everything else, and always with transitive verbs (a direct object)

## Building the Partizip II
- regular: ge- + stem + -t → machen → **gemacht**, arbeiten → **gearbeitet**
- irregular: ge- + changed stem + -en → essen → **gegessen**, sehen → **gesehen**
- verbs on -ieren: no ge- → studieren → **studiert**, telefonieren → **telefoniert**
- separable verbs: prefix + ge in the middle → aufstehen → **aufgestanden**, einkaufen → **eingekauft**

## Examples
- Wir **haben** einen Film **gesehen**. — We watched a film.
- Er **ist** um 6 Uhr **aufgestanden**. — He got up at 6.`,
    drills: [
      { type: 'cloze', prompt: 'Ich ___ gestern ins Kino gegangen.', acceptedAnswers: ['bin'] },
      { type: 'cloze', prompt: 'Wir ___ einen Film gesehen.', acceptedAnswers: ['haben'] },
      { type: 'cloze', prompt: 'Sie ___ nach Berlin gefahren.', acceptedAnswers: ['ist'] },
      { type: 'cloze', prompt: 'Ich habe gestern viel ___. (arbeiten)', promptData: { hint: 'Partizip II' }, acceptedAnswers: ['gearbeitet'] },
      { type: 'cloze', prompt: 'Er hat ein Buch ___. (lesen)', promptData: { hint: 'Partizip II' }, acceptedAnswers: ['gelesen'] },
      {
        type: 'choice',
        prompt: 'Ich habe in München ___. (studieren)',
        promptData: { options: ['studiert', 'gestudiert', 'studieren', 'studierte'] },
        acceptedAnswers: ['studiert'],
      },
      { type: 'translate_en_de', prompt: 'I have eaten.', acceptedAnswers: ['Ich habe gegessen.'] },
      { type: 'translate_de_en', prompt: 'Wir sind nach Hause gegangen.', acceptedAnswers: ['We went home.', 'We have gone home.'] },
    ],
  },
  {
    key: 'a2-praeteritum-modal',
    title: 'Präteritum: war, hatte & modals',
    cefr: 'A2',
    focus: 'The written/simple past of sein, haben and the modal verbs',
    relatedVocabTheme: 'Verbs',
    explanationMd: `The Präteritum (simple past) is mainly written. But for **sein**, **haben** and the **modal verbs**, Germans use it even in speech — so these forms are essential.

## sein → war
- ich **war** · du **warst** · er **war** · wir **waren** · ihr **wart** · sie **waren**

## haben → hatte
- ich **hatte** · du **hattest** · er **hatte** · wir **hatten** · ihr **hattet** · sie **hatten**

## Modals
- können → ich **konnte** · müssen → ich **musste** · wollen → ich **wollte**
- dürfen → ich **durfte** · sollen → ich **sollte** · mögen → ich **mochte**

## Examples
- Ich **war** gestern krank. — I was sick yesterday.
- Wir **hatten** keine Zeit. — We had no time.
- Sie **konnte** nicht kommen. — She could not come.
- Als Kind **wollte** ich Pilot werden. — As a child I wanted to become a pilot.`,
    drills: [
      { type: 'cloze', prompt: 'Ich ___ gestern krank.', acceptedAnswers: ['war'] },
      { type: 'cloze', prompt: 'Wir ___ keine Zeit.', acceptedAnswers: ['hatten'] },
      { type: 'cloze', prompt: 'Sie ___ nicht kommen. (können, Präteritum)', acceptedAnswers: ['konnte'] },
      {
        type: 'choice',
        prompt: 'Als Kind ___ ich Pilot werden. (wollen, Präteritum)',
        promptData: { options: ['wollte', 'will', 'gewollt', 'wollten'] },
        acceptedAnswers: ['wollte'],
      },
      {
        type: 'transform',
        prompt: 'Ich habe keine Zeit gehabt.',
        promptData: { instruction: 'Rewrite in the Präteritum.' },
        acceptedAnswers: ['Ich hatte keine Zeit.'],
      },
      { type: 'translate_en_de', prompt: 'I was in Berlin.', acceptedAnswers: ['Ich war in Berlin.'] },
      { type: 'translate_de_en', prompt: 'Er musste gestern arbeiten.', acceptedAnswers: ['He had to work yesterday.'] },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Wir', 'waren', 'letzte', 'Woche', 'im', 'Urlaub'] },
        acceptedAnswers: ['Wir waren letzte Woche im Urlaub.'],
      },
    ],
  },
  {
    key: 'a2-weil',
    title: 'Reasons with weil',
    cefr: 'A2',
    focus: 'Subordinate clauses with weil — the verb goes to the very end',
    relatedVocabTheme: 'Emotions',
    explanationMd: `**weil** (because) introduces a subordinate clause — and in a subordinate clause the conjugated verb moves to the **very end**.

- Ich bleibe zu Hause, **weil** ich krank **bin**.
- Er lacht, **weil** der Film lustig **ist**.

## Compare
- Der Bus kam spät. **Deshalb** war ich zu spät. (main clause: verb 2nd)
- Ich war zu spät, **weil** der Bus spät **kam**. (weil-clause: verb last)

## Useful connectors
- **weil** — because (verb last)
- **denn** — because (verb stays 2nd, more casual)
- **deshalb / deswegen** — therefore (starts a main clause, verb 2nd)

## Examples
- Sie ist glücklich, **weil** sie Urlaub **hat**.
- Ich lerne Deutsch, **weil** ich in Wien arbeite.`,
    drills: [
      { type: 'cloze', prompt: 'Ich bleibe zu Hause, ___ ich krank bin.', acceptedAnswers: ['weil'] },
      { type: 'cloze', prompt: 'Er lacht, weil der Film lustig ___. (sein)', acceptedAnswers: ['ist'] },
      { type: 'cloze', prompt: 'Ich war zu spät, weil der Bus spät ___. (kommen)', acceptedAnswers: ['kam'] },
      {
        type: 'choice',
        prompt: 'Which sentence is correct?',
        promptData: { options: ['…, weil ich müde bin.', '…, weil ich bin müde.', '…, weil bin ich müde.', '…, weil ich müde.'] },
        acceptedAnswers: ['…, weil ich müde bin.'],
      },
      {
        type: 'transform',
        prompt: 'Ich habe keine Zeit. (deshalb)',
        promptData: { instruction: 'Connect with „weil“: „Ich kann nicht kommen, …“' },
        acceptedAnswers: ['Ich kann nicht kommen, weil ich keine Zeit habe.'],
      },
      { type: 'translate_en_de', prompt: 'I am staying home because it is raining.', acceptedAnswers: ['Ich bleibe zu Hause, weil es regnet.'] },
      { type: 'translate_de_en', prompt: 'Sie ist glücklich, weil sie Urlaub hat.', acceptedAnswers: ['She is happy because she is on vacation.', 'She is happy because she has vacation.'] },
    ],
  },
  {
    key: 'a2-dass',
    title: 'dass-clauses',
    cefr: 'A2',
    focus: 'Reporting thoughts and facts with dass — verb at the end',
    relatedVocabTheme: 'Communication',
    explanationMd: `**dass** (that) introduces a subordinate clause that reports a thought, fact or feeling. Like with weil, the conjugated verb goes to the **end**.

- Ich glaube, **dass** er recht **hat**. — I think that he is right.
- Sie sagt, **dass** sie müde **ist**. — She says that she is tired.

## Common lead-ins
- Ich glaube / Ich denke / Ich hoffe, **dass** …
- Es ist wichtig / Es ist gut, **dass** …
- Er hat gesagt, **dass** …

## Example paragraph
- Ich finde, **dass** Deutsch schön **klingt**.
- Wir wissen, **dass** die Prüfung schwer **ist**.

In English the that is often dropped — in German **dass** must stay.`,
    drills: [
      { type: 'cloze', prompt: 'Ich denke, ___ er recht hat.', acceptedAnswers: ['dass'] },
      { type: 'cloze', prompt: 'Sie sagt, dass sie müde ___. (sein)', acceptedAnswers: ['ist'] },
      { type: 'cloze', prompt: 'Ich hoffe, dass das Wetter gut ___. (werden)', acceptedAnswers: ['wird'] },
      {
        type: 'choice',
        prompt: 'Which sentence is correct?',
        promptData: { options: ['Ich glaube, dass er kommt.', 'Ich glaube, dass kommt er.', 'Ich glaube, dass er kommen.', 'Ich glaube dass, er kommt.'] },
        acceptedAnswers: ['Ich glaube, dass er kommt.'],
      },
      {
        type: 'transform',
        prompt: 'Das Wetter ist gut. (Ich glaube, …)',
        promptData: { instruction: 'Combine into one sentence with „dass“.' },
        acceptedAnswers: ['Ich glaube, dass das Wetter gut ist.'],
      },
      { type: 'translate_en_de', prompt: 'I think that she is right.', acceptedAnswers: ['Ich denke, dass sie recht hat.'] },
      { type: 'translate_de_en', prompt: 'Es ist wichtig, dass wir Zeit haben.', acceptedAnswers: ['It is important that we have time.', "It's important that we have time."] },
    ],
  },
  {
    key: 'a2-wenn-als',
    title: 'wenn & als',
    cefr: 'A2',
    focus: 'When-questions of time: repeated (wenn) vs. one-time past (als)',
    relatedVocabTheme: 'Weather',
    explanationMd: `Both words mean "when", but they split the job:

## wenn — whenever / if (repeated or future)
- **Wenn** es regnet, bleibe ich zu Hause. — Whenever it rains, I stay home.
- **Wenn** ich Zeit habe, komme ich. — If/When I have time, I'll come.

## als — once in the past
- **Als** ich ein Kind war, wohnte ich in Wien. — When I was a child, I lived in Vienna.
- **Als** es gestern regnete, … — When it rained yesterday, …

## Rule of thumb
Past + happened **once** → als · past + happened **repeatedly** → wenn · present/future → wenn

Both are subordinating: the verb of the wenn/als clause goes to the **end**.
- **Wenn** ich müde **bin**, schlafe ich sofort.`,
    drills: [
      { type: 'cloze', prompt: '___ ich ein Kind war, wohnte ich in Wien.', acceptedAnswers: ['Als'] },
      { type: 'cloze', prompt: '___ es regnet, bleibe ich zu Hause.', acceptedAnswers: ['Wenn'] },
      {
        type: 'choice',
        prompt: '___ ich gestern nach Hause kam, war niemand da.',
        promptData: { options: ['Als', 'Wenn', 'Wann', 'Dass'] },
        acceptedAnswers: ['Als'],
      },
      {
        type: 'choice',
        prompt: '___ ich Zeit habe, gehe ich schwimmen.',
        promptData: { options: ['Wenn', 'Als', 'Ob', 'Weil'] },
        acceptedAnswers: ['Wenn'],
      },
      { type: 'cloze', prompt: 'Wenn ich müde ___, schlafe ich sofort. (sein)', acceptedAnswers: ['bin'] },
      { type: 'translate_en_de', prompt: 'When I was young, I lived in Berlin.', acceptedAnswers: ['Als ich jung war, wohnte ich in Berlin.'] },
      { type: 'translate_de_en', prompt: 'Wenn das Wetter gut ist, gehen wir wandern.', acceptedAnswers: ['When the weather is good, we go hiking.'] },
    ],
  },
  {
    key: 'a2-komparativ',
    title: 'Komparativ',
    cefr: 'A2',
    focus: 'Comparing with -er … als and the irregular forms',
    relatedVocabTheme: 'Shopping',
    explanationMd: `To compare two things, German uses **-er** plus **als** (than).

- Peter ist **größer als** Anna. — Peter is taller than Anna.
- Dieses Handy ist **billiger als** das andere. — This phone is cheaper than the other one.

## Building the comparative
- short adjectives: + **er** → klein → kleiner, billig → billiger
- umlaut for a/o/u in one-syllable adjectives: alt → **älter**, groß → **größer**, jung → **jünger**
- long adjectives: no umlaut, just -er → interessant → **interessanter**

## Irregulars
- gut → **besser** · viel → **mehr** · gern → **lieber** · hoch → **höher**

## Examples
- Ich trinke **lieber** Tee **als** Kaffee. — I prefer tea to coffee.
- Die Bahn ist **teurer als** der Bus. — The train is more expensive than the bus.`,
    drills: [
      { type: 'cloze', prompt: 'Peter ist ___ als Anna. (groß)', acceptedAnswers: ['größer'] },
      { type: 'cloze', prompt: 'Dieses Handy ist ___ als das andere. (billig)', acceptedAnswers: ['billiger'] },
      { type: 'cloze', prompt: 'Ich trinke ___ Tee als Kaffee. (gern)', acceptedAnswers: ['lieber'] },
      {
        type: 'choice',
        prompt: 'Mein Bruder ist ___ als ich. (alt)',
        promptData: { options: ['älter', 'alter', 'am ältesten', 'mehr alt'] },
        acceptedAnswers: ['älter'],
      },
      {
        type: 'choice',
        prompt: 'Dieser Film ist ___ als der andere. (interessant)',
        promptData: { options: ['interessanter', 'interessanter als', 'am interessantesten', 'mehr interessant'] },
        acceptedAnswers: ['interessanter'],
      },
      { type: 'translate_en_de', prompt: 'The train is faster than the bus.', acceptedAnswers: ['Der Zug ist schneller als der Bus.'] },
      { type: 'translate_de_en', prompt: 'Dieser Kaffee ist besser als der andere.', acceptedAnswers: ['This coffee is better than the other one.'] },
    ],
  },
  {
    key: 'a2-superlativ',
    title: 'Superlativ',
    cefr: 'A2',
    focus: 'am -sten / das -ste — talking about the best, biggest, most',
    relatedVocabTheme: 'City',
    explanationMd: `The superlative has two jobs: after a verb (**am … sten**) and before a noun (**the -ste form**).

## am + -sten (predicate use)
- Anna ist **am größten**. — Anna is the tallest.
- Das war **am schönsten**. — That was the most beautiful.

## article + -ste (before a noun)
- Das ist **die größte** Stadt. — That is the biggest city.
- Er trinkt **den besten** Kaffee. — He drinks the best coffee.

## Forms
- klein → **am kleinsten** / das kleinste
- groß → **am größten** / die größte
- alt → **am ältesten** / der älteste (spelling: -sten after t/d → -esten)
- gut → **am besten** / der beste · viel → **am meisten** · gern → **am liebsten**

## Examples
- Der Zug ist **am schnellsten**. — The train is the fastest.
- Der Montag ist für viele **der schlimmste** Tag.`,
    drills: [
      { type: 'cloze', prompt: 'Anna ist ___ in der Klasse. (groß)', acceptedAnswers: ['die Größte', 'am größten'] },
      { type: 'cloze', prompt: 'Das ist die ___ Stadt in Deutschland. (groß)', acceptedAnswers: ['größte'] },
      { type: 'cloze', prompt: 'Ich trinke ___ Kaffee. (gut)', acceptedAnswers: ['den besten'] },
      {
        type: 'choice',
        prompt: 'Der Sommer ist ___ (warm)',
        promptData: { options: ['am wärmsten', 'am warmsten', 'am wärmste', 'die wärmste'] },
        acceptedAnswers: ['am wärmsten'],
      },
      {
        type: 'choice',
        prompt: 'Montag ist ___ Tag der Woche. (schlimm)',
        promptData: { options: ['der schlimmste', 'am schlimmsten', 'der schlimmsten', 'am schlimmste'] },
        acceptedAnswers: ['der schlimmste'],
      },
      { type: 'translate_en_de', prompt: 'This is the best restaurant in the city.', acceptedAnswers: ['Das ist das beste Restaurant in der Stadt.'] },
      { type: 'translate_de_en', prompt: 'Ich trinke am liebsten Tee.', acceptedAnswers: ['I like tea the most.', 'I most like tea.', 'My favorite drink is tea.'] },
    ],
  },
  {
    key: 'a2-wechselpraepositionen',
    title: 'Two-way prepositions',
    cefr: 'A2',
    focus: 'in, an, auf, unter, über, vor, hinter, neben, zwischen — Dativ vs Akkusativ',
    relatedVocabTheme: 'Home',
    explanationMd: `Nine prepositions take **Dativ or Akkusativ** depending on the question:

- **Wo?** (where, at rest) → **Dativ**: dem / der / dem / den
- **Wohin?** (where to, movement) → **Akkusativ**: den / die / das / die

## The nine
in, an, auf, unter, über, vor, hinter, neben, zwischen

## Rest → Dativ (wo?)
- Das Buch liegt **auf dem** Tisch. — The book is on the table.
- Ich bin **in der** Küche. — I am in the kitchen.

## Movement → Akkusativ (wohin?)
- Ich stelle das Buch **auf den** Tisch. — I put the book onto the table.
- Ich gehe **in die** Küche. — I am going into the kitchen.

## Examples
- Er sitzt **an dem** (am) Fenster. — He sits at the window.
- Wir hängen das Bild **an die** Wand. — We hang the picture onto the wall.`,
    drills: [
      { type: 'cloze', prompt: 'Das Buch liegt ___ dem Tisch.', acceptedAnswers: ['auf'] },
      { type: 'cloze', prompt: 'Ich stelle das Buch auf ___ Tisch.', promptData: { hint: 'movement → Akkusativ' }, acceptedAnswers: ['den'] },
      { type: 'cloze', prompt: 'Ich bin in ___ Küche.', promptData: { hint: 'rest → Dativ' }, acceptedAnswers: ['der'] },
      { type: 'cloze', prompt: 'Ich gehe in ___ Küche.', promptData: { hint: 'movement → Akkusativ' }, acceptedAnswers: ['die'] },
      {
        type: 'choice',
        prompt: 'Die Lampe hängt ___ der Decke. (wo?)',
        promptData: { options: ['an', 'in', 'auf den', 'über'] },
        acceptedAnswers: ['an'],
      },
      {
        type: 'choice',
        prompt: 'Wo wohnt sie? — Sie wohnt ___ Zürich.',
        promptData: { options: ['in', 'nach', 'zu', 'an'] },
        acceptedAnswers: ['in'],
      },
      { type: 'translate_en_de', prompt: 'The phone is on the table.', acceptedAnswers: ['Das Handy ist auf dem Tisch.', 'Das Telefon ist auf dem Tisch.'] },
      { type: 'translate_de_en', prompt: 'Ich hänge das Bild an die Wand.', acceptedAnswers: ['I am hanging the picture on the wall.', 'I hang the picture on the wall.'] },
    ],
  },
  {
    key: 'a2-dat-praepositionen',
    title: 'Dativ prepositions',
    cefr: 'A2',
    focus: 'mit, nach, aus, bei, seit, von, zu — always Dativ',
    relatedVocabTheme: 'Transport',
    explanationMd: `A fixed group of prepositions **always** takes the Dativ — memorize them as a chant: **aus, bei, mit, nach, seit, von, zu**.

## The Dativ articles
- dem (maskulin/neuter) · der (feminin) · den + -n (plural)

## Examples
- Ich fahre **mit dem** Bus. — I take the bus.
- Sie kommt **aus der** Türkei. — She comes from Turkey.
- Wir gehen **nach Hause**. — We are going home. (fixed phrase)
- Ich bin **seit einem** Jahr hier. — I have been here for a year.
- Das Geschenk ist **von meiner** Mutter. — The present is from my mother.
- Ich gehe **zur** (zu der) Schule. — I am going to school.

## Watch out
**nach** for cities and countries (nach Berlin, nach Österreich — but **in die** Schweiz, **in die** Türkei).
**zu** for people and places (zu Anna, zum Arzt, zur Post).`,
    drills: [
      { type: 'cloze', prompt: 'Ich fahre ___ dem Bus zur Arbeit.', acceptedAnswers: ['mit'] },
      { type: 'cloze', prompt: 'Sie kommt ___ der Türkei.', acceptedAnswers: ['aus'] },
      { type: 'cloze', prompt: 'Ich wohne ___ meinem Bruder. (bei + Dativ)', acceptedAnswers: ['bei'] },
      { type: 'cloze', prompt: 'Ich gehe ___ Arzt.', promptData: { hint: 'zu + dem' }, acceptedAnswers: ['zum'] },
      {
        type: 'choice',
        prompt: 'Wir fahren ___ Italien.',
        promptData: { options: ['nach', 'zu', 'in die', 'bei'] },
        acceptedAnswers: ['nach'],
      },
      {
        type: 'choice',
        prompt: 'Ich gehe ___ Post.',
        promptData: { options: ['zur', 'zu der die', 'zum', 'nach'] },
        acceptedAnswers: ['zur'],
      },
      { type: 'translate_en_de', prompt: 'I am coming with the train.', acceptedAnswers: ['Ich komme mit dem Zug.'] },
      { type: 'translate_de_en', prompt: 'Das ist ein Geschenk von meinem Bruder.', acceptedAnswers: ['That is a present from my brother.', 'That is a gift from my brother.'] },
    ],
  },
  {
    key: 'a2-reflexiv',
    title: 'Reflexive verbs',
    cefr: 'A2',
    focus: 'sich freuen, sich waschen… — reflexive pronouns and sich-verbs',
    relatedVocabTheme: 'Health',
    explanationMd: `Reflexive verbs act back on the subject; they need a **reflexive pronoun** (mich, dich, sich, uns, euch, sich).

## The pronouns
- ich **mich** · du **dich** · er/sie/es **sich**
- wir **uns** · ihr **euch** · sie/Sie **sich**

## Examples
- Ich **freue mich** auf den Urlaub. — I am looking forward to the vacation.
- Du **musst dich** beeilen. — You have to hurry.
- Er **wascht sich** die Hände. — He is washing his hands.
- Wir **treffen uns** um acht. — We are meeting at eight.

## Common reflexive verbs
sich freuen (auf) · sich beeilen · sich interessieren (für) · sich erinnern (an) · sich fühlen · sich treffen

Many are only "logic-reflexive" in German — you just have to learn them with **sich**.`,
    drills: [
      { type: 'cloze', prompt: 'Ich freue ___ auf den Urlaub.', acceptedAnswers: ['mich'] },
      { type: 'cloze', prompt: 'Du musst ___ beeilen.', acceptedAnswers: ['dich'] },
      { type: 'cloze', prompt: 'Er erinnert ___ an den Termin.', acceptedAnswers: ['sich'] },
      { type: 'cloze', prompt: 'Wir treffen ___ um acht.', acceptedAnswers: ['uns'] },
      {
        type: 'choice',
        prompt: 'Ich interessiere ___ für Musik.',
        promptData: { options: ['mich', 'mir', 'sich', 'mein'] },
        acceptedAnswers: ['mich'],
      },
      {
        type: 'transform',
        prompt: 'Ich beeile mich.',
        promptData: { instruction: 'Change the subject to „ihr“.' },
        acceptedAnswers: ['Ihr beeilt euch.'],
      },
      { type: 'translate_en_de', prompt: 'I feel good.', acceptedAnswers: ['Ich fühle mich gut.'] },
      { type: 'translate_de_en', prompt: 'Sie erinnert sich an dich.', acceptedAnswers: ['She remembers you.'] },
    ],
  },
  {
    key: 'a2-imperativ',
    title: 'Imperative',
    cefr: 'A2',
    focus: 'Commands and requests for du, ihr and Sie',
    relatedVocabTheme: 'Communication',
    explanationMd: `German has three imperative forms, one per "you".

## du-form: stem only (drop -st, no pronoun)
- Komm **mit**! — Come along!
- Sprich **langsam**! — Speak slowly!
- Sei **ruhig**! — Be quiet! (sein → sei)
- Stem vowel changes carry over: nehmen → **Nimm** das Buch!

## ihr-form: like present tense, no pronoun
- Kommt **mit**!
- Sprecht **langsam**!

## Sie-form: infinitive + Sie
- Kommen Sie **mit**!
- Sprechen Sie **langsam**, bitte.

## Softening
Add **bitte** or **doch mal**: Komm doch mal vorbei! — Do drop by!

## Examples
- Mach die Tür zu! — Close the door!
- Räum bitte dein Zimmer auf! — Please tidy your room!
- Entschuldigen Sie die Störung. — Sorry for the interruption.`,
    drills: [
      { type: 'cloze', prompt: '___ bitte langsam! (du, sprechen)', acceptedAnswers: ['Sprich'] },
      { type: 'cloze', prompt: '___ Sie bitte das noch einmal! (wiederholen)', acceptedAnswers: ['Wiederholen'] },
      {
        type: 'choice',
        prompt: '___ die Tür zu! (ihr, machen)',
        promptData: { options: ['Macht', 'Mach', 'Machen', 'Machst'] },
        acceptedAnswers: ['Macht'],
      },
      {
        type: 'choice',
        prompt: '___ das Buch! (du, nehmen)',
        promptData: { options: ['Nimm', 'Nehm', 'Nimmst', 'Nehmen'] },
        acceptedAnswers: ['Nimm'],
      },
      {
        type: 'transform',
        prompt: 'Du machst die Tür zu.',
        promptData: { instruction: 'Turn it into a du-imperative.' },
        acceptedAnswers: ['Mach die Tür zu!'],
      },
      { type: 'translate_en_de', prompt: 'Please speak slowly. (to someone you would call Sie)', acceptedAnswers: ['Sprechen Sie bitte langsam!'] },
      { type: 'translate_de_en', prompt: 'Komm doch mal vorbei!', acceptedAnswers: ['Drop by sometime!', 'Come by sometime!'] },
    ],
  },
  {
    key: 'a2-adjektivendungen',
    title: 'Adjective endings',
    cefr: 'A2',
    focus: '-e and -en after der-words; -e/-er/-e after ein-words (Nom/Akk)',
    relatedVocabTheme: 'Adjectives',
    explanationMd: `When an adjective stands **before a noun**, it takes an ending. The easy cases first:

## After der/die/das (Nominativ)
- der **neu e** Wagen · die **alt e** Stadt · das **klein e** Haus

## After der/die/das (Akkusativ) — everything becomes -en except feminine
- Ich sehe den **neu en** Wagen. (maskulin)
- Ich sehe die **alt e** Stadt. (feminin — stays -e)
- Ich sehe das **klein e** Haus. (neuter — stays -e)

## Rule of thumb for der-words
Nominativ singular and non-masculine Akkusativ → **-e** · everything else → **-en**

## After ein-words (ein, kein, mein…)
- ein **gut er** Mann · eine **gut e** Idee · ein **gut es** Buch
- The adjective must show the gender that ein hides: -er (m), -e (f), -es (n)

## Examples
- Das ist ein **schöner** Tag. — That is a beautiful day.
- Ich habe eine **kleine** Frage. — I have a small question.
- Wir suchen ein **billiges** Hotel. — We are looking for a cheap hotel.`,
    drills: [
      { type: 'cloze', prompt: 'Das ist der ___ Wagen von meinem Vater. (neu)', acceptedAnswers: ['neue'] },
      { type: 'cloze', prompt: 'Ich sehe den ___ Mann. (alt)', acceptedAnswers: ['alten'] },
      { type: 'cloze', prompt: 'Das ist eine ___ Idee. (gut)', acceptedAnswers: ['gute'] },
      { type: 'cloze', prompt: 'Wir suchen ein ___ Hotel. (billig)', acceptedAnswers: ['billiges'] },
      { type: 'cloze', prompt: 'Das ist ein ___ Tag. (schön)', acceptedAnswers: ['schöner'] },
      {
        type: 'choice',
        prompt: 'Ich habe eine ___ Frage. (klein)',
        promptData: { options: ['kleine', 'kleiner', 'kleines', 'kleinen'] },
        acceptedAnswers: ['kleine'],
      },
      { type: 'translate_en_de', prompt: 'That is a beautiful city.', acceptedAnswers: ['Das ist eine schöne Stadt.'] },
      { type: 'translate_de_en', prompt: 'Der alte Mann wohnt hier.', acceptedAnswers: ['The old man lives here.'] },
    ],
  },
]
