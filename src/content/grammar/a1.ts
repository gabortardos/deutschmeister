import type { SeedTopic } from './types'

/** A1 grammar syllabus (13 topics): pronouns & core verbs → separable verbs. */
export const A1_TOPICS: SeedTopic[] = [
  {
    key: 'a1-pronomen-sein-haben',
    title: 'Pronouns, sein & haben',
    cefr: 'A1',
    focus: 'Personal pronouns with the two essential verbs: sein and haben',
    relatedVocabTheme: 'People',
    explanationMd: `German verbs change their form for each person. The two most important verbs are **sein** (to be) and **haben** (to have) — learn them by heart.

## sein — to be
- ich **bin** · du **bist** · er/sie/es **ist**
- wir **sind** · ihr **seid** · sie/Sie **sind**

## haben — to have
- ich **habe** · du **hast** · er/sie/es **hat**
- wir **haben** · ihr **habt** · sie/Sie **haben**

## Examples
- Ich **bin** müde. — I am tired.
- Wir **haben** kein Auto. — We have no car.

Careful: **ihr** (you plural) always has its own forms — ihr *seid*, ihr *habt* — never ihr sind.`,
    drills: [
      { type: 'cloze', prompt: 'Du ___ sehr nett.', promptData: { hint: 'sein' }, acceptedAnswers: ['bist'] },
      { type: 'cloze', prompt: 'Wir ___ keine Zeit.', promptData: { hint: 'haben' }, acceptedAnswers: ['haben'] },
      {
        type: 'choice',
        prompt: '„Ihr ___ aus Berlin.“ — Which form is correct?',
        promptData: { options: ['seid', 'sind', 'bist', 'ist'] },
        acceptedAnswers: ['seid'],
      },
      {
        type: 'transform',
        prompt: 'Ich habe Hunger.',
        promptData: { instruction: 'Change the subject to „du“.' },
        acceptedAnswers: ['Du hast Hunger.'],
      },
      { type: 'translate_en_de', prompt: 'She is tired.', acceptedAnswers: ['Sie ist müde.'] },
      { type: 'translate_de_en', prompt: 'Wir haben ein Auto.', acceptedAnswers: ['We have a car.', 'We have one car.'] },
      { type: 'wordorder', prompt: 'Build the sentence.', promptData: { tokens: ['Ich', 'bin', 'aus', 'Wien'] }, acceptedAnswers: ['Ich bin aus Wien.'] },
    ],
  },
  {
    key: 'a1-praesens-regelmaessig',
    title: 'Present tense: regular verbs',
    cefr: 'A1',
    focus: 'Weak verbs and their personal endings -e, -st, -t, -en, -t, -en',
    relatedVocabTheme: 'Verbs',
    explanationMd: `Regular (weak) verbs keep their stem and add personal endings: **-e, -st, -t, -en, -t, -en**.

## wohnen — to live
- ich wohn**e** · du wohn**st** · er wohn**t**
- wir wohn**en** · ihr wohn**t** · sie wohn**en**

If the stem ends in **-t** or **-d**, an extra e slides in: du arbeit**e**st, er arbeit**e**t, ihr arbeit**e**t.

## Examples
- Ich **wohne** in Graz. — I live in Graz.
- Du **lernst** Deutsch. — You are learning German.
- Er **macht** die Hausaufgaben. — He is doing the homework.

The ich **-e** is often dropped in speech: ich komm(e), ich wohn(e).`,
    drills: [
      { type: 'cloze', prompt: 'Er ___ in Berlin.', promptData: { hint: 'wohnen' }, acceptedAnswers: ['wohnt'] },
      { type: 'cloze', prompt: 'Ich ___ Deutsch.', promptData: { hint: 'lernen' }, acceptedAnswers: ['lerne'] },
      {
        type: 'choice',
        prompt: 'du ___ (machen)',
        promptData: { options: ['machst', 'mache', 'macht', 'machen'] },
        acceptedAnswers: ['machst'],
      },
      {
        type: 'transform',
        prompt: 'Ich spiele Gitarre.',
        promptData: { instruction: 'Change the subject to „ihr“.' },
        acceptedAnswers: ['Ihr spielt Gitarre.'],
      },
      { type: 'translate_en_de', prompt: 'I live in Munich.', acceptedAnswers: ['Ich wohne in München.'] },
      {
        type: 'translate_de_en',
        prompt: 'Wir lernen jeden Tag.',
        acceptedAnswers: ['We learn every day.', 'We study every day.', 'We are learning every day.'],
      },
      { type: 'wordorder', prompt: 'Build the sentence.', promptData: { tokens: ['Du', 'arbeitest', 'viel'] }, acceptedAnswers: ['Du arbeitest viel.'] },
    ],
  },
  {
    key: 'a1-praesens-vokalwechsel',
    title: 'Present tense: stem-changing verbs',
    cefr: 'A1',
    focus: 'a→ä, e→i, e→ie in the du and er/sie/es forms',
    relatedVocabTheme: 'Verbs',
    explanationMd: `Some strong verbs change their stem vowel — but only in the **du** and **er/sie/es** forms. ich, wir and ihr keep the plain stem.

## The three changes
- a → **ä**: fahren → du **fährst**, er **fährt**
- e → **i**: essen → du **isst**, er **isst** · nehmen → du **nimmst**, er **nimmt**
- e → **ie**: lesen → du **liest**, er **liest** · sprechen → du **sprichst**, er **spricht**

## Examples
- Ich **lese** viel, aber er **liest** wenig. — I read a lot, but he reads little.
- Du **sprichst** sehr gut Deutsch. — You speak German very well.
- Wir **fahren** morgen. — We are driving tomorrow.`,
    drills: [
      { type: 'cloze', prompt: 'Du ___ sehr schnell.', promptData: { hint: 'sprechen' }, acceptedAnswers: ['sprichst'] },
      { type: 'cloze', prompt: 'Er ___ einen Apfel.', promptData: { hint: 'essen' }, acceptedAnswers: ['isst'] },
      { type: 'cloze', prompt: 'Ich ___ ein Buch.', promptData: { hint: 'lesen' }, acceptedAnswers: ['lese'] },
      {
        type: 'choice',
        prompt: 'sie (plural) ___ (fahren)',
        promptData: { options: ['fahren', 'fährt', 'fährst', 'fahrt'] },
        acceptedAnswers: ['fahren'],
      },
      {
        type: 'transform',
        prompt: 'Ich nehme den Bus.',
        promptData: { instruction: 'Change the subject to „du“.' },
        acceptedAnswers: ['Du nimmst den Bus.'],
      },
      { type: 'translate_en_de', prompt: 'She is taking the train.', acceptedAnswers: ['Sie nimmt den Zug.'] },
      {
        type: 'translate_de_en',
        prompt: 'Du liest die Zeitung.',
        acceptedAnswers: ['You read the newspaper.', 'You are reading the newspaper.'],
      },
    ],
  },
  {
    key: 'a1-verb-zweit',
    title: 'Verb-second word order',
    cefr: 'A1',
    focus: 'The conjugated verb always sits in position 2 of a main clause',
    relatedVocabTheme: 'Basics',
    explanationMd: `In a German main clause the conjugated verb is always the **second element** — no matter what comes first.

- **Heute** | gehe | ich ins Kino.
- **Am Montag** | habe | ich Zeit.

When something other than the subject starts the sentence, subject and verb **swap places**.

## Examples
- Morgen **kommt** meine Schwester. — My sister is coming tomorrow.
- Heute **arbeite** ich nicht. — I am not working today.
- Am Abend **lese** ich ein Buch. — In the evening I read a book.

Time expressions (*heute, morgen, am Abend, jeden Tag*) very often take position 1.`,
    drills: [
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Heute', 'gehe', 'ich', 'ins', 'Kino'] },
        acceptedAnswers: ['Heute gehe ich ins Kino.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Am', 'Montag', 'habe', 'ich', 'Zeit'] },
        acceptedAnswers: ['Am Montag habe ich Zeit.'],
      },
      { type: 'cloze', prompt: 'Heute ___ ich Fußball.', promptData: { hint: 'spielen' }, acceptedAnswers: ['spiele'] },
      {
        type: 'choice',
        prompt: 'Which sentence is correct?',
        promptData: { options: ['Morgen kommt sie.', 'Morgen sie kommt.', 'Sie morgen kommt.', 'Kommt sie morgen.'] },
        acceptedAnswers: ['Morgen kommt sie.'],
      },
      { type: 'translate_en_de', prompt: 'Today I am working.', acceptedAnswers: ['Heute arbeite ich.'] },
      {
        type: 'translate_de_en',
        prompt: 'Am Abend lese ich ein Buch.',
        acceptedAnswers: ['In the evening I read a book.', 'I read a book in the evening.'],
      },
    ],
  },
  {
    key: 'a1-w-fragen',
    title: 'W-questions',
    cefr: 'A1',
    focus: 'Question words: wer, was, wo, wohin, wann, wie, warum, wie viel',
    relatedVocabTheme: 'Question Words',
    explanationMd: `W-questions start with the question word; the conjugated verb stays in **second** position.

## The question words
- **wer** who · **was** what · **wo** where · **wohin** where to
- **wann** when · **wie** how · **warum** why · **wie viel** how much
- **welch-** which

## Examples
- **Wo** wohnst du? — Where do you live?
- **Wann** beginnt der Kurs? — When does the course start?
- **Warum** lernst du Deutsch? — Why are you learning German?
- **Wie viel** kostet das Ticket? — How much does the ticket cost?`,
    drills: [
      { type: 'cloze', prompt: '___ heißt du?', acceptedAnswers: ['Wie'] },
      { type: 'cloze', prompt: '___ wohnst du?', acceptedAnswers: ['Wo'] },
      {
        type: 'choice',
        prompt: '___ lernst du Deutsch? — Weil ich in Berlin arbeite.',
        promptData: { options: ['Warum', 'Wo', 'Wann', 'Wer'] },
        acceptedAnswers: ['Warum'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the question.',
        promptData: { tokens: ['Wann', 'beginnt', 'der', 'Kurs'] },
        acceptedAnswers: ['Wann beginnt der Kurs?'],
      },
      { type: 'translate_en_de', prompt: 'Where do you live?', acceptedAnswers: ['Wo wohnst du?'] },
      {
        type: 'translate_de_en',
        prompt: 'Was machst du am Wochenende?',
        acceptedAnswers: ['What are you doing on the weekend?', 'What do you do on the weekend?'],
      },
      { type: 'cloze', prompt: '___ kostet das Ticket?', acceptedAnswers: ['Wie viel', 'Wieviel'] },
    ],
  },
  {
    key: 'a1-ja-nein-fragen',
    title: 'Yes/no questions',
    cefr: 'A1',
    focus: 'Verb moves to position 1 when there is no question word',
    relatedVocabTheme: 'Question Words',
    explanationMd: `Yes/no questions have **no question word**: the conjugated verb simply moves to position 1.

- Statement: Du **hast** Zeit. — You have time.
- Question: **Hast** du Zeit? — Do you have time?

## Answering
- **Ja**, ich habe Zeit. — Yes, I have time.
- **Nein**, ich habe keine Zeit. — No, I have no time.
- **Doch!** — Yes I do! (to contradict a negative question)

## Examples
- **Kommst** du mit? — Are you coming along?
- **Sprichst** du Englisch? — Do you speak English?
- **Arbeitest** du morgen? — Are you working tomorrow?`,
    drills: [
      {
        type: 'wordorder',
        prompt: 'Build the question.',
        promptData: { tokens: ['Hast', 'du', 'Zeit'] },
        acceptedAnswers: ['Hast du Zeit?'],
      },
      { type: 'cloze', prompt: '___ du heute Zeit?', promptData: { hint: 'haben' }, acceptedAnswers: ['Hast'] },
      {
        type: 'choice',
        prompt: 'Which question is correct?',
        promptData: { options: ['Arbeitest du morgen?', 'Du arbeitest morgen?', 'Du morgen arbeitest?', 'Arbeiten du morgen?'] },
        acceptedAnswers: ['Arbeitest du morgen?'],
      },
      {
        type: 'transform',
        prompt: 'Du sprichst Englisch.',
        promptData: { instruction: 'Turn it into a yes/no question.' },
        acceptedAnswers: ['Sprichst du Englisch?'],
      },
      { type: 'translate_en_de', prompt: 'Do you have time?', acceptedAnswers: ['Hast du Zeit?'] },
      { type: 'translate_de_en', prompt: 'Kommt sie heute?', acceptedAnswers: ['Is she coming today?', 'Does she come today?'] },
    ],
  },
  {
    key: 'a1-artikel-genus',
    title: 'Articles & gender',
    cefr: 'A1',
    focus: 'der, die, das — noun gender and the patterns that hint at it',
    relatedVocabTheme: 'Food',
    explanationMd: `Every German noun has a grammatical gender: **der** (masculine), **die** (feminine) or **das** (neuter). Always learn nouns **with their article**.

## Helpful patterns
- **die**: -ung (Zeitung), -heit (Gesundheit), -keit, -schaft, -tion/-ion
- **das**: -chen (Mädchen), -lein
- **der**: days, months, seasons; most nouns in -ling and -ismus

## Examples
- **der** Apfel · **die** Banane · **das** Brot
- **Die** Zeitung ist neu. — The newspaper is new.
- **Das** Mädchen ist zehn Jahre alt. — The girl is ten years old.

The plural article is always **die**, for every gender: die Äpfel, die Bananen, die Brote.`,
    drills: [
      { type: 'cloze', prompt: '___ Apfel schmeckt gut.', promptData: { hint: 'maskulin' }, acceptedAnswers: ['Der'] },
      { type: 'cloze', prompt: '___ Banane ist reif.', promptData: { hint: 'feminin' }, acceptedAnswers: ['Die'] },
      {
        type: 'choice',
        prompt: '___ Buch liegt hier.',
        promptData: { options: ['Das', 'Der', 'Die', 'Dem'] },
        acceptedAnswers: ['Das'],
      },
      {
        type: 'choice',
        prompt: 'Which noun is feminine?',
        promptData: { options: ['Zeitung', 'Mädchen', 'Tisch', 'Auto'] },
        acceptedAnswers: ['Zeitung'],
      },
      { type: 'cloze', prompt: '___ Mädchen ist zehn Jahre alt.', promptData: { hint: 'neuter (-chen)' }, acceptedAnswers: ['Das'] },
      { type: 'translate_en_de', prompt: 'The bread is fresh.', acceptedAnswers: ['Das Brot ist frisch.'] },
      { type: 'translate_de_en', prompt: 'Der Käse schmeckt gut.', acceptedAnswers: ['The cheese tastes good.'] },
    ],
  },
  {
    key: 'a1-akkusativ',
    title: 'Akkusativ basics',
    cefr: 'A1',
    focus: 'Direct objects: only masculine visibly changes (der → den, ein → einen)',
    relatedVocabTheme: 'Food',
    explanationMd: `The Akkusativ marks the **direct object** — the thing being seen, eaten, bought… Only **masculine** changes visibly: der → **den**, ein → **einen**. Feminine, neuter and plural look the same as in the Nominativ.

## der → den
- Ich sehe **den** Mann. — I see the man.
- Ich esse **einen** Apfel. — I am eating an apple.
- Ich trinke **einen** Kaffee. — I am drinking a coffee.

## die / das / plural: no change
- Ich kaufe **die** Butter. — I am buying the butter.
- Ich kaufe **das** Brot. — I am buying the bread.

## Typical Akkusativ verbs
sehen, essen, trinken, kaufen, lesen, mögen, brauchen, bestellen`,
    drills: [
      { type: 'cloze', prompt: 'Ich esse ___ Apfel.', promptData: { hint: 'maskulin, Akkusativ' }, acceptedAnswers: ['einen'] },
      { type: 'cloze', prompt: 'Ich trinke ___ Kaffee.', promptData: { hint: 'maskulin, Akkusativ' }, acceptedAnswers: ['einen'] },
      {
        type: 'choice',
        prompt: 'Ich sehe ___ Mann.',
        promptData: { options: ['den', 'der', 'dem', 'des'] },
        acceptedAnswers: ['den'],
      },
      {
        type: 'choice',
        prompt: 'Ich kaufe ___ Butter. (feminin)',
        promptData: { options: ['eine', 'einen', 'ein', 'einer'] },
        acceptedAnswers: ['eine'],
      },
      {
        type: 'transform',
        prompt: 'der Apfel',
        promptData: { instruction: 'Rewrite in the Akkusativ after „kaufen“ — e.g. „Ich kaufe …“' },
        acceptedAnswers: ['den Apfel'],
      },
      { type: 'translate_en_de', prompt: 'I have a car.', acceptedAnswers: ['Ich habe ein Auto.'] },
      { type: 'translate_de_en', prompt: 'Ich möchte einen Kaffee.', acceptedAnswers: ['I would like a coffee.', "I'd like a coffee."] },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Ich', 'bestelle', 'die', 'Suppe'] },
        acceptedAnswers: ['Ich bestelle die Suppe.'],
      },
    ],
  },
  {
    key: 'a1-dativ-grundlagen',
    title: 'Dativ basics',
    cefr: 'A1',
    focus: 'Indirect objects and the Dativ-only verbs helfen, danken, gehören, gefallen',
    relatedVocabTheme: 'People',
    explanationMd: `The Dativ marks the **indirect object** — the person receiving something or being helped. A few verbs take the Dativ directly: **helfen, danken, gehören, gefallen, antworten, passen**.

## Articles in the Dativ
- der → **dem** Mann · die → **der** Frau · das → **dem** Kind
- plural → **den** Kindern (the noun adds -n)

## Examples
- Ich gebe **der** Frau das Buch. — I give the woman the book.
- Ich helfe **dem** Kind. — I am helping the child.
- Das Buch gehört **dem** Mann. — The book belongs to the man.
- Das gefällt **mir**! — I like that!

With **helfen**, the person helped is Dativ — never Akkusativ.`,
    drills: [
      { type: 'cloze', prompt: 'Ich gebe ___ Frau das Buch.', promptData: { hint: 'Dativ, feminin' }, acceptedAnswers: ['der'] },
      { type: 'cloze', prompt: 'Ich danke ___ Lehrerin.', promptData: { hint: 'Dativ, feminin' }, acceptedAnswers: ['der'] },
      {
        type: 'choice',
        prompt: 'Ich gebe ___ Kind ein Geschenk.',
        promptData: { options: ['dem', 'den', 'der', 'das'] },
        acceptedAnswers: ['dem'],
      },
      {
        type: 'choice',
        prompt: 'Which verb takes the Dativ?',
        promptData: { options: ['helfen', 'essen', 'sehen', 'kaufen'] },
        acceptedAnswers: ['helfen'],
      },
      {
        type: 'transform',
        prompt: 'Ich helfe den Mann.',
        promptData: { instruction: 'Fix the case after „helfen“.' },
        acceptedAnswers: ['Ich helfe dem Mann.'],
      },
      { type: 'translate_en_de', prompt: 'I give the teacher the book.', acceptedAnswers: ['Ich gebe dem Lehrer das Buch.', 'Ich gebe das Buch dem Lehrer.'] },
      { type: 'translate_de_en', prompt: 'Sie hilft dem Kind.', acceptedAnswers: ['She is helping the child.', 'She helps the child.'] },
    ],
  },
  {
    key: 'a1-negation',
    title: 'Negation: nicht & kein',
    cefr: 'A1',
    focus: 'Choosing between nicht and kein-/keine to say "not / no"',
    relatedVocabTheme: 'Basics',
    explanationMd: `There are two main ways to say "not": **nicht** and **kein-**.

## nicht — negates verbs, adjectives, and nouns with a definite article or possessive
- Ich schlafe **nicht**. — I am not sleeping.
- Das Haus ist **nicht** groß. — The house is not big.
- Das ist **nicht** mein Auto. — That is not my car.

## kein- — negates nouns with ein or with no article
- Ich habe **keine** Zeit. — I have no time.
- Er trinkt **keinen** Kaffee. — He drinks no coffee (Akkusativ masculine).
- Das ist **kein** Problem. — That is no problem.

## Rule of thumb
Nouns with ein- or without an article → **kein-** · everything else → **nicht**.`,
    drills: [
      { type: 'cloze', prompt: 'Ich habe ___ Zeit.', acceptedAnswers: ['keine'] },
      { type: 'cloze', prompt: 'Das ist ___ mein Auto.', acceptedAnswers: ['nicht'] },
      { type: 'cloze', prompt: 'Er trinkt ___ Kaffee.', promptData: { hint: 'maskulin, Akkusativ' }, acceptedAnswers: ['keinen'] },
      {
        type: 'choice',
        prompt: 'Ich bin ___ müde.',
        promptData: { options: ['nicht', 'kein', 'keine', 'nichts'] },
        acceptedAnswers: ['nicht'],
      },
      {
        type: 'choice',
        prompt: 'Das ist ___ Problem.',
        promptData: { options: ['kein', 'nicht', 'keine', 'keinem'] },
        acceptedAnswers: ['kein'],
      },
      { type: 'translate_en_de', prompt: 'I do not drink tea.', acceptedAnswers: ['Ich trinke keinen Tee.'] },
      { type: 'translate_de_en', prompt: 'Das Haus ist nicht groß.', acceptedAnswers: ['The house is not big.'] },
    ],
  },
  {
    key: 'a1-possessiv',
    title: 'Possessive articles',
    cefr: 'A1',
    focus: 'mein, dein, sein, ihr, unser, euer, Ihr — with ein-word endings',
    relatedVocabTheme: 'People',
    explanationMd: `Possessives first match the **owner**, then take endings like ein-words: **mein, dein, sein, ihr, unser, euer, Ihr**.

## Basic forms (by owner)
- ich → **mein** · du → **dein** · er/sie/es → **sein / ihr / sein**
- wir → **unser** · ihr → **euer** · sie/Sie → **ihr / Ihr**

## Endings follow the noun
- **mein** Bruder (maskulin) · **meine** Schwester (feminin) · **mein** Kind (neuter)
- Ich liebe **meine** Familie. (Akkusativ feminin)

## Examples
- **Dein** Auto ist neu. — Your car is new.
- Er besucht **seine** Eltern. — He is visiting his parents.

Careful: **sein** = his/its, but **ihr** = her/their.`,
    drills: [
      { type: 'cloze', prompt: 'Das ist ___ Bruder.', promptData: { hint: 'ich' }, acceptedAnswers: ['mein'] },
      { type: 'cloze', prompt: 'Ich liebe ___ Familie.', promptData: { hint: 'du' }, acceptedAnswers: ['deine'] },
      { type: 'cloze', prompt: 'Er besucht ___ Eltern.', promptData: { hint: 'er' }, acceptedAnswers: ['seine'] },
      {
        type: 'choice',
        prompt: 'Ist das ___ Tasche? (du)',
        promptData: { options: ['deine', 'dein', 'euer', 'ihre'] },
        acceptedAnswers: ['deine'],
      },
      { type: 'translate_en_de', prompt: 'My sister lives in Hamburg.', acceptedAnswers: ['Meine Schwester wohnt in Hamburg.'] },
      { type: 'translate_de_en', prompt: 'Unser Garten ist klein.', acceptedAnswers: ['Our garden is small.'] },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Dein', 'Auto', 'ist', 'neu'] },
        acceptedAnswers: ['Dein Auto ist neu.'],
      },
    ],
  },
  {
    key: 'a1-modalverben',
    title: 'Modal verbs',
    cefr: 'A1',
    focus: 'können, müssen, wollen, sollen, dürfen, mögen — infinitive at the end',
    relatedVocabTheme: 'Verbs',
    explanationMd: `Modal verbs express ability, necessity and wishes: **können** (can), **müssen** (must), **wollen** (want), **sollen** (should), **dürfen** (may), **mögen** (like).

## Conjugation — ich and er/sie/es share one form!
- können: ich **kann**, du **kannst**, er **kann**
- müssen: ich **muss**, du **musst**, er **muss**
- wollen: ich **will**, du **willst**, er **will**

## Word order
The conjugated modal sits in position 2; the main verb goes to the **end as an infinitive**.
- Ich **muss** heute länger **arbeiten**. — I have to work longer today.
- **Kannst** du schwimmen? — Can you swim?
- Wir **wollen** nach Hause **gehen**. — We want to go home.

Careful: German *will* means "wants to", not "will"!`,
    drills: [
      { type: 'cloze', prompt: 'Ich ___ heute nicht arbeiten.', promptData: { hint: 'können' }, acceptedAnswers: ['kann'] },
      { type: 'cloze', prompt: 'Du ___ mehr schlafen.', promptData: { hint: 'sollen' }, acceptedAnswers: ['sollst'] },
      { type: 'cloze', prompt: 'Wir ___ nach Hause gehen.', promptData: { hint: 'wollen' }, acceptedAnswers: ['wollen'] },
      {
        type: 'choice',
        prompt: '___ du schwimmen?',
        promptData: { options: ['Kannst', 'Kann', 'Könnt', 'Können'] },
        acceptedAnswers: ['Kannst'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Ich', 'muss', 'heute', 'länger', 'arbeiten'] },
        acceptedAnswers: ['Ich muss heute länger arbeiten.'],
      },
      { type: 'translate_en_de', prompt: 'She can speak German.', acceptedAnswers: ['Sie kann Deutsch sprechen.'] },
      { type: 'translate_de_en', prompt: 'Ihr müsst warten.', acceptedAnswers: ['You have to wait.', 'You must wait.'] },
    ],
  },
  {
    key: 'a1-trennbare-verben',
    title: 'Separable verbs',
    cefr: 'A1',
    focus: 'Prefixes like auf-, an-, ein-, aus-, mit- that jump to the end of the clause',
    relatedVocabTheme: 'Verbs',
    explanationMd: `Separable verbs split in main clauses: the stressed prefix (**auf, an, ein, aus, mit, zu…**) jumps to the **end of the sentence**.

## Examples
- aufstehen: Ich **stehe** um 7 Uhr **auf**. — I get up at 7.
- anrufen: Ich **rufe** dich heute **an**. — I will call you today.
- einkaufen: Wir **kaufen** am Samstag **ein**. — We shop on Saturdays.
- mitkommen: **Kommst** du **mit**? — Are you coming along?

## Rules
- The prefix separates in normal main clauses: Er steht früh **auf**.
- With a modal verb it stays together at the end: Ich muss früh **aufstehen**.
- Common prefixes: auf- (up/open), an- (on), ein- (in), aus- (out), mit- (along), zu- (closed)`,
    drills: [
      { type: 'cloze', prompt: 'Er steht um 7 Uhr ___.', promptData: { hint: 'aufstehen' }, acceptedAnswers: ['auf'] },
      { type: 'cloze', prompt: 'Ich rufe dich heute ___.', promptData: { hint: 'anrufen' }, acceptedAnswers: ['an'] },
      {
        type: 'choice',
        prompt: 'Wir kaufen am Samstag ___.',
        promptData: { options: ['ein', 'einkaufen', 'an', 'aus'] },
        acceptedAnswers: ['ein'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Sie', 'steht', 'jeden', 'Morgen', 'früh', 'auf'] },
        acceptedAnswers: ['Sie steht jeden Morgen früh auf.'],
      },
      {
        type: 'choice',
        prompt: 'Which verb is separable?',
        promptData: { options: ['anrufen', 'glauben', 'danken', 'brauchen'] },
        acceptedAnswers: ['anrufen'],
      },
      { type: 'translate_en_de', prompt: 'I get up at six.', acceptedAnswers: ['Ich stehe um sechs Uhr auf.', 'Ich stehe um 6 Uhr auf.'] },
      { type: 'translate_de_en', prompt: 'Wann rufst du an?', acceptedAnswers: ['When are you calling?', 'When do you call?'] },
    ],
  },
]
