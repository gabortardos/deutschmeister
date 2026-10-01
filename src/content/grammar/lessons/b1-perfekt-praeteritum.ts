import type { Lesson } from './types'

/** Pilot lesson 3 — B1 "Perfekt vs. Präteritum" (topic g-b1-11). */
export const B1_PERFEKT_LESSON: Lesson = {
  topicId: 'g-b1-11',
  minutes: 6,
  hook: 'German has two workhorses for the past, and choosing between them is not about meaning — it is about **where your words live**: in the air (spoken) or on paper (written). Learn the register rule and your past tense suddenly sounds native.',
  sections: [
    {
      heading: 'Step 1 · The register rule',
      prose: [
        'Both tenses describe exactly the same past event. The **Perfekt** (haben/sein + Partizip II) is the past of **conversation** — talking, phoning, chatting, personal e-mails. The **Präteritum** (ging, kam, sah …) is the past of **narration and writing** — news, reports, novels, fairy tales.',
      ],
      table: {
        caption: 'Same past, different stage',
        headers: ['Where', 'Tense', 'Example'],
        rows: [
          ['Chat with a friend', 'Perfekt', '„Was hast du am Wochenende gemacht?“'],
          ['Conversation', 'Perfekt', '„Ich habe gestern bis sechs gearbeitet.“'],
          ['Newspaper', 'Präteritum', '„Die Polizei fand die Tasche am Bahnhof.“'],
          ['Novel / fairy tale', 'Präteritum', '„Es war einmal ein König …“'],
        ],
      },
    },
    {
      heading: 'Step 2 · The big exception: sein, haben and the modals',
      prose: [
        'In spoken German these verbs **avoid the Perfekt** — even Germans find „ich bin krank gewesen“ clunky. Use the Präteritum forms, always:',
      ],
      table: {
        caption: 'Always Präteritum — even in speech',
        headers: ['Verb', 'Präteritum', 'Avoid in speech'],
        rows: [
          ['sein', 'ich war, du warst', 'ich bin gewesen'],
          ['haben', 'ich hatte', 'ich habe gehabt'],
          ['können', 'ich konnte', 'ich habe gekonnt'],
          ['müssen', 'ich musste', 'ich habe gemusst'],
          ['wollen', 'ich wollte', 'ich habe gewollt'],
        ],
      },
    },
    {
      heading: 'Step 3 · Strong verbs in spoken stories',
      prose: [
        'When you **tell a story aloud** — something dramatic, something with a sequence — strong-verb Präteritum is normal and elegant: „Plötzlich **kam** ein Auto. Ich **blieb** stehen. Es **gab** einen lauten Knall.“',
        'With **weak verbs**, the Perfekt wins in speech: „Ich **habe gearbeitet**“ — „Ich arbeitete“ sounds stiff and bookish when spoken.',
      ],
    },
    {
      heading: 'Step 4 · A four-question decision routine',
      prose: [
        'Is it **sein, haben or a modal**? → Präteritum, even in speech. Are you **writing** a report, story or article? → Präteritum. Are you **talking** about everyday things? → Perfekt. Are you **telling a dramatic story aloud** with strong verbs? → Präteritum is welcome (Perfekt is never wrong here, just less vivid).',
        'Comfort for the exam-minded B1 speaker: in the speaking exam, **Perfekt + the sein/haben/modal exception** will carry every answer safely.',
      ],
    },
  ],
  mistakes: [
    {
      wrong: 'Ich bin krank gewesen. (spoken)',
      right: 'Ich war krank.',
      why: 'sein, haben and modals use the **Präteritum** even in speech — the Perfekt sounds bureaucratic.',
    },
    {
      wrong: 'Wo bist du gewesen? (chatting)',
      right: 'Wo warst du?',
      why: 'Same rule for sein: **warst** is a syllable shorter and completely natural.',
    },
    {
      wrong: '(News site) Die Feuerwehr hat den Brand gelöscht.',
      right: '(News site) Die Feuerwehr löschte den Brand.',
      why: 'In written news the **Präteritum** is the default register; the Perfekt reads as spoken style.',
    },
    {
      wrong: '(Casual speech) Ich arbeitete gestern bis acht.',
      right: '(Casual speech) Ich habe gestern bis acht gearbeitet.',
      why: 'Weak-verb Präteritum in speech sounds bookish — the **Perfekt** is the natural choice.',
    },
  ],
  checkpoints: [
    {
      id: 'cp-1',
      question: 'Chatting with a friend about being tired yesterday — which sounds native?',
      options: ['Ich war müde.', 'Ich bin müde gewesen.', 'Ich bin müde.', 'Ich werde müde.'],
      answer: 0,
      explain: 'sein takes the **Präteritum** in speech: Ich war müde.',
    },
    {
      id: 'cp-2',
      question: 'A news report: „Die Polizei ___ die Tasche am Bahnhof.“ (finden)',
      options: ['hat gefunden', 'fand', 'hat finden', 'findet'],
      answer: 1,
      explain: 'Written news register → **Präteritum**: fand.',
    },
    {
      id: 'cp-3',
      question: 'Casually telling a colleague: „Ich ___ gestern viel gearbeitet.“',
      options: ['arbeitete', 'habe', 'hat', 'war'],
      answer: 1,
      explain: 'Weak verb in speech → **Perfekt**: Ich habe … gearbeitet.',
    },
    {
      id: 'cp-4',
      question: 'Telling a dramatic story aloud: „Plötzlich ___ ein Auto!“ (kommen)',
      options: ['ist gekommen', 'kam', 'hat gekommen', 'kommt'],
      answer: 1,
      explain: 'Strong-verb **Präteritum** is elegant in spoken narration: kam. („ist gekommen“ is not wrong — kam is simply more vivid.)',
    },
  ],
  cheatSheet: [
    '**Perfekt = spoken past** (haben/sein + Partizip II) · **Präteritum = written / narrative past** — same meaning, different register',
    '**Always Präteritum, even in speech**: sein (war) · haben (hatte) · modals (konnte, musste, wollte)',
    '**Strong verbs love the Präteritum in spoken stories**: kam, ging, blieb, gab, fand',
    '**Weak verbs love the Perfekt in speech**: habe gearbeitet (not: arbeitete)',
    'Exam-safe speaking default: Perfekt + war/hatte/modal Präteritum',
  ],
}
