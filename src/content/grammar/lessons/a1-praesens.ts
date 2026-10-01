import type { Lesson } from './types'

/**
 * Pilot lesson 1 — A1 "Present tense: regular verbs" (topic g-a1-02),
 * opening with the pronoun cast (the ROADMAP's "A1 Präsens/Pronomen").
 */
export const A1_PRAESENS_LESSON: Lesson = {
  topicId: 'g-a1-02',
  minutes: 5,
  hook: 'Almost every German sentence you will ever say starts here. Learn six tiny endings once, and every regular verb — wohnen, lernen, machen, spielen, arbeiten — becomes usable today. That is thousands of verbs for the price of six.',
  sections: [
    {
      heading: 'Step 1 · Meet the cast: the subject pronouns',
      prose: [
        'German has one pronoun for every slot in a conversation. They are the actors — and the verb changes costume depending on who acts. Here is the full cast:',
      ],
      table: {
        caption: 'Subject pronouns',
        headers: ['Person', 'Pronomen', 'English'],
        rows: [
          ['1st sg', 'ich', 'I'],
          ['2nd sg', 'du', 'you (one person, informal)'],
          ['3rd sg', 'er · sie · es', 'he · she · it'],
          ['1st pl', 'wir', 'we'],
          ['2nd pl', 'ihr', 'you (several people, informal)'],
          ['3rd pl', 'sie', 'they'],
          ['formal', 'Sie', 'you (formal — capital S, always)'],
        ],
      },
    },
    {
      heading: 'Step 2 · The one pattern: stem + ending',
      prose: [
        'Take the infinitive (the dictionary form, always ending in **-en** or **-n**), cut off the -en, and you have the **stem**. Then glue on the personal ending:',
      ],
      table: {
        caption: 'wohnen — to live',
        headers: ['Person', 'Form', 'Ending'],
        rows: [
          ['ich', 'wohn**e**', '**-e**'],
          ['du', 'wohn**st**', '**-st**'],
          ['er · sie · es', 'wohn**t**', '**-t**'],
          ['wir', 'wohn**en**', '**-en**'],
          ['ihr', 'wohn**t**', '**-t**'],
          ['sie · Sie', 'wohn**en**', '**-en**'],
        ],
      },
    },
    {
      heading: 'Step 3 · The spelling slide: stems ending in -t or -d',
      prose: [
        'When the stem ends in **-t** or **-d** (arbeiten, finden, antworten), the endings -st and -t would become a tongue-twister — so an extra **e** slides in before them:',
      ],
      table: {
        caption: 'arbeiten — to work',
        headers: ['Person', 'Form'],
        rows: [
          ['ich', 'arbeite'],
          ['du', 'arbeit**e**st'],
          ['er · sie · es', 'arbeit**e**t'],
          ['wir', 'arbeiten'],
          ['ihr', 'arbeit**e**t'],
          ['sie · Sie', 'arbeiten'],
        ],
      },
    },
    {
      heading: 'Step 4 · Sound like a local',
      prose: [
        'Germans often trim the ich ending in speech: *ich komm’*, *ich glaub’*. Dropping the final e is natural in conversation — but keep the full **-e** while you are learning; it is never wrong.',
        'Questions simply flip the room, and the ending you just learned does the work: **Wohnst du in Berlin?** — Do you live in Berlin? **Arbeitet ihr viel?** — Do you (all) work a lot?',
      ],
    },
  ],
  mistakes: [
    {
      wrong: 'Ich wohnen in Hamburg.',
      right: 'Ich wohne in Hamburg.',
      why: 'The infinitive never conjugates itself. ich always takes **-e**.',
    },
    {
      wrong: 'Er wohnst hier.',
      right: 'Er wohnt hier.',
      why: '-st belongs to **du** only. er/sie/es takes **-t**.',
    },
    {
      wrong: 'Du arbeitst viel.',
      right: 'Du arbeitest viel.',
      why: 'Stems ending in -t/-d insert an **e** before -st/-t: du arbeit**e**st.',
    },
    {
      wrong: 'Sie spielt Gitarre. (to a professor)',
      right: 'Sie spielen Gitarre.',
      why: 'Formal **Sie** conjugates like *they* — plural ending **-en**, never -t.',
    },
  ],
  checkpoints: [
    {
      id: 'cp-1',
      question: '„Und du? Wo ___ du?“ (wohnen)',
      options: ['wohne', 'wohnst', 'wohnt', 'wohnen'],
      answer: 1,
      explain: 'du is the informal you — it always takes **-st**: du wohnst.',
    },
    {
      id: 'cp-2',
      question: '„Er ___ jeden Tag Deutsch.“ (lernen)',
      options: ['lerne', 'lernst', 'lernt', 'lernen'],
      answer: 2,
      explain: 'er/sie/es takes **-t**: er lernt. Only du gets -st.',
    },
    {
      id: 'cp-3',
      question: '„Wir ___ am Samstag Fußball.“ (spielen)',
      options: ['spiele', 'spielst', 'spielt', 'spielen'],
      answer: 3,
      explain: 'wir keeps the infinitive form: wir spielen.',
    },
    {
      id: 'cp-4',
      question: '„Ihr ___ sehr schnell!“ (arbeiten)',
      options: ['arbeitet', 'arbeitest', 'arbeite', 'arbeiten'],
      answer: 0,
      explain: 'ihr takes -t, and -t-stems slide in an e: ihr arbeit**e**t. (arbeitest would be du.)',
    },
    {
      id: 'cp-5',
      question: 'You address a stranger: „___ Sie aus Deutschland?“ (kommen) — which form is correct?',
      options: ['Kommst', 'Kommt', 'Kommen', 'Komme'],
      answer: 2,
      explain: 'Formal **Sie** takes the plural ending -en: **Kommen** Sie?',
    },
  ],
  cheatSheet: [
    'Stem + endings: **-e · -st · -t · -en · -t · -en** (ich · du · er/sie/es · wir · ihr · sie/Sie)',
    'Only **du** takes -st · only er/sie/es and ihr take -t',
    'Stems ending in **-t/-d** insert an e: du arbeit**e**st, er arbeit**e**t',
    '**sie** = she (sie wohnt) or they (sie wohnen) · **Sie** (capital S) = formal you (Sie spielen)',
    'The ich **-e** is often dropped in casual speech (ich komm’) — safe to keep it while learning',
  ],
}
