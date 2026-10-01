import type { Lesson } from './types'

/** Pilot lesson 2 — A2 "Adjective endings" (topic g-a2-12). */
export const A2_ADJEKTIV_LESSON: Lesson = {
  topicId: 'g-a2-12',
  minutes: 7,
  hook: 'An adjective before a German noun wears a uniform, and the article in front of it chooses that uniform. One principle — **exactly one element shows gender and case** — generates the entire system, so you can derive every ending instead of memorising tables.',
  sections: [
    {
      heading: 'Step 1 · The one principle',
      prose: [
        'Every German noun phrase must show its **gender** (masculine/feminine/neuter) and **case** exactly once. A **der-word** (der, dieser, jeder …) already shows it. An **ein-word** (ein, kein, mein …) hides it for masculine and neuter. No article at all? Then the **adjective itself** must carry the signal.',
        'That is the whole trick: **der-word → the adjective relaxes (-e/-en). ein-word m/n → the adjective shows the gender (-er/-es). no article → the adjective shows everything.**',
      ],
    },
    {
      heading: 'Step 2 · After der-words — the relaxed declension',
      prose: [
        'The article does the heavy lifting, so the adjective only needs two forms: **-e** in the two easy spots (nominative singular, and accusative for feminine/neuter), **-en** everywhere else.',
      ],
      table: {
        caption: 'der neue Wagen · die alte Stadt · das kleine Haus',
        headers: ['Case', 'Masculine', 'Feminine', 'Neuter'],
        rows: [
          ['Nominativ', 'der neu**e** Wagen', 'die neu**e** Stadt', 'das neu**e** Haus'],
          ['Akkusativ', 'den neu**en** Wagen', 'die neu**e** Stadt', 'das neu**e** Haus'],
          ['Dativ', 'dem neu**en** Wagen', 'der neu**en** Stadt', 'dem neu**en** Haus'],
        ],
      },
    },
    {
      heading: 'Step 3 · After ein-words — the adjective unmasks the gender',
      prose: [
        'ein carries no ending in nominative masculine and accusative neuter — so the adjective steps in and shows what ein hides:',
      ],
      table: {
        caption: 'ein guter Mann · eine gute Idee · ein gutes Buch',
        headers: ['Case', 'Masculine', 'Feminine', 'Neuter'],
        rows: [
          ['Nominativ', 'ein gut**er** Mann', 'eine gut**e** Idee', 'ein gut**es** Buch'],
          ['Akkusativ', 'einen gut**en** Mann', 'eine gut**e** Idee', 'ein gut**es** Buch'],
          ['Dativ', 'einem gut**en** Mann', 'einer gut**en** Idee', 'einem gut**en** Buch'],
        ],
      },
    },
    {
      heading: 'Step 4 · No article — the strong declension',
      prose: [
        'With no article, the adjective takes the full ending the article would have worn:',
      ],
      table: {
        caption: 'kalter Kaffee · kalte Milch · frisches Brot',
        headers: ['Case', 'Masculine', 'Feminine', 'Neuter'],
        rows: [
          ['Nominativ', 'kalt**er** Kaffee', 'kalt**e** Milch', 'frisch**es** Brot'],
          ['Akkusativ', 'kalt**en** Kaffee', 'kalt**e** Milch', 'frisch**es** Brot'],
          ['Dativ', 'mit gut**em** Wein', 'mit kalt**er** Milch', 'mit frisch**em** Brot'],
        ],
      },
    },
    {
      heading: 'Step 5 · A three-second routine for any sentence',
      prose: [
        '1) Which article? **der-word** → -e/-en (Dativ always -en). **ein-word** m/n in Nom/Akk → -er/-es; otherwise -e (Dativ -en). **No article** → strong ending (-er/-e/-es, Dativ -em/-er/-em).',
        '2) Say the whole phrase aloud once — *ein neuer Mann, eine neue Idee, ein neues Buch* — your ear learns the rhythm faster than any table.',
      ],
    },
  ],
  mistakes: [
    {
      wrong: 'Das ist eine neuer Idee.',
      right: 'Das ist eine neue Idee.',
      why: 'Eine already shows feminine — the adjective relaxes to **-e**. -er only when ein hides a masculine.',
    },
    {
      wrong: 'Ich sehe den neu Wagen.',
      right: 'Ich sehe den neuen Wagen.',
      why: 'Masculine accusative after a der-word is not one of the two easy spots → **-en**.',
    },
    {
      wrong: 'Ich trinke gern frisch Wasser.',
      right: 'Ich trinke gern frisches Wasser.',
      why: 'No article → the adjective itself must carry the neuter signal: **-es**.',
    },
    {
      wrong: 'Sie hilft einem klein Kind.',
      right: 'Sie hilft einem kleinen Kind.',
      why: 'Dativ is **-en country** — after ein-words too: einem klein**en** Kind.',
    },
  ],
  checkpoints: [
    {
      id: 'cp-1',
      question: '„Die ___ Stadt hat eine lange Geschichte.“ (alt)',
      options: ['alte', 'alter', 'altes', 'alten'],
      answer: 0,
      explain: 'die = der-word, nominative, one of the two easy spots → **-e**: die alte Stadt.',
    },
    {
      id: 'cp-2',
      question: '„Ich sehe den ___ Mann.“ (alt)',
      options: ['alte', 'alter', 'alten', 'altes'],
      answer: 2,
      explain: 'Masculine accusative after a der-word → **-en**: den alten Mann.',
    },
    {
      id: 'cp-3',
      question: '„Das ist ein ___ Buch.“ (neu — nominative)',
      options: ['neue', 'neuer', 'neues', 'neuen'],
      answer: 2,
      explain: 'ein hides the neuter signal in nominative → the adjective shows it: **-es**.',
    },
    {
      id: 'cp-4',
      question: '„Wir fahren mit dem ___ Auto.“ (schnell — Dativ)',
      options: ['schnelle', 'schneller', 'schnelles', 'schnellen'],
      answer: 3,
      explain: 'Dativ is **-en country**, after der-words too: dem schnellen Auto.',
    },
    {
      id: 'cp-5',
      question: '„Ich trinke gern ___ Kaffee.“ (heiß — no article, Akkusativ)',
      options: ['heißer', 'heiße', 'heißes', 'heißen'],
      answer: 3,
      explain: 'No article + masculine accusative → the adjective wears the ending den would have: **heißen** Kaffee.',
    },
  ],
  cheatSheet: [
    '**One signal rule**: exactly one element shows gender + case — the der-word, the ein-word, or the adjective',
    'der-word: **-e** in nominative sg + feminine/neuter accusative · **-en** everywhere else (all of Dativ)',
    'ein-word m/n Nom/Akk: adjective shows the hidden gender → **-er / -es** · feminine -e · Dativ -en',
    'No article: adjective goes strong — Nom m **-er** / f **-e** / n **-es** · Akk m **-en** · Dativ **-em / -er / -em**',
    'Learn the rhythm, not the table: ein neuer Mann · eine neue Idee · ein neues Buch',
  ],
}

