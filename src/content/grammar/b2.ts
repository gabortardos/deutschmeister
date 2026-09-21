import type { SeedTopic } from './types'

/**
 * B2 grammar syllabus (M5.2): 15 topics extending the A1–B1 bank (35 → 50).
 * Passive variants, Konjunktiv I/II depth, subjektive Modalverben, n-Deklination,
 * Nominalstil, Genitiv relatives & prepositions, Pronominaladverbien,
 * Infinitivkonstruktionen, Passiversatz, Funktionsverbgefüge, Partizipialsätze,
 * advanced connectors.
 */
export const B2_TOPICS: SeedTopic[] = [
  {
    key: 'b2-passiv-modalverben',
    title: 'Passiv mit Modalverben',
    cefr: 'B2',
    focus: 'Modalverb + Partizip II + werden — obligations and possibilities in the passive',
    relatedVocabTheme: 'Work',
    explanationMd: `Modal verbs combine with the passive: **Modalverb** in position 2, **Partizip II + werden** at the end of the clause. It says that something *must, can, should …* be done.

## Präsens
- Das Formular **muss ausgefüllt werden**. — The form has to be filled out.
- Die Rechnung **kann online bezahlt werden**. — The bill can be paid online.

## Präteritum
- Der Antrag **musste geprüft werden**. — The application had to be reviewed.
- Die Mitarbeiter **durften nicht informiert werden**.

## Konjunktiv II
- Der Vertrag **sollte heute unterschrieben werden**. — The contract should be signed today.

## vs. Aktiv mit „man“
- Aktiv: **Man muss** das Formular **ausfüllen**.
- Passiv: Das Formular **muss ausgefüllt werden**.`,
    drills: [
      { type: 'cloze', prompt: 'Die Rechnung ___ noch heute bezahlt werden. (müssen, Präsens)', acceptedAnswers: ['muss'] },
      { type: 'cloze', prompt: 'Der Antrag konnte nicht ___ werden. (ablehnen, Partizip II)', acceptedAnswers: ['abgelehnt'] },
      { type: 'cloze', prompt: 'Diese Aufgabe ___ bis morgen erledigt werden. (können, Präsens)', acceptedAnswers: ['kann'] },
      {
        type: 'choice',
        prompt: 'Der Fehler ___ sofort behoben werden.',
        promptData: { options: ['muss', 'wird', 'ist', 'hat'] },
        acceptedAnswers: ['muss'],
      },
      {
        type: 'transform',
        prompt: 'Man muss den Antrag prüfen.',
        promptData: { instruction: 'Rewrite in the passive with „müssen“: „Der Antrag …“' },
        acceptedAnswers: ['Der Antrag muss geprüft werden.'],
      },
      {
        type: 'wordorder',
        prompt: 'Build the sentence.',
        promptData: { tokens: ['Der', 'Vertrag', 'muss', 'bis', 'Freitag', 'unterschrieben', 'werden'] },
        acceptedAnswers: ['Der Vertrag muss bis Freitag unterschrieben werden.'],
      },
      { type: 'translate_en_de', prompt: 'The form has to be filled out.', acceptedAnswers: ['Das Formular muss ausgefüllt werden.'] },
      { type: 'translate_de_en', prompt: 'Die Rechnung konnte nicht bezahlt werden.', acceptedAnswers: ['The bill could not be paid.', "The bill couldn't be paid.", 'The invoice could not be paid.'] },
    ],
  },
  {
    key: 'b2-zustandspassiv',
    title: 'Zustandspassiv & unpersönliches Passiv',
    cefr: 'B2',
    focus: 'sein + Partizip II (state) vs. werden + Partizip II (process); passive without a subject',
    relatedVocabTheme: 'Everyday',
    explanationMd: `German has **two** passive forms. The **Vorgangspassiv** (*werden*) shows the **action**, the **Zustandspassiv** (*sein*) shows the **resulting state**.

## Vorgangspassiv vs. Zustandspassiv
- Die Tür **wird geöffnet**. — Someone is opening it (process).
- Die Tür **ist geöffnet**. — It is open (state).
- Der Laden **wird** um 9 Uhr **geöffnet**. / Der Laden **ist** von 9 bis 18 Uhr **geöffnet**.

## Präteritum Zustandspassiv
- Das Geschäft **war** den ganzen Tag **geschlossen**.

## Unpersönliches Passiv
Verbs **without an object** can form a passive too — the action itself is the message:
- Hier **wird nicht geraucht**. — No smoking here.
- Während der Party **wird** viel getanzt und **gelacht**.`,
    drills: [
      { type: 'cloze', prompt: 'Der Laden ist von 9 bis 18 Uhr ___. (öffnen, Partizip II)', acceptedAnswers: ['geöffnet'] },
      { type: 'cloze', prompt: 'Das Geschäft ___ zurzeit geschlossen. (Zustand, nicht Vorgang)', acceptedAnswers: ['ist'] },
      { type: 'cloze', prompt: 'In dieser Bibliothek ___ nicht gegessen. (unpersönliches Passiv)', acceptedAnswers: ['wird'] },
      {
        type: 'choice',
        prompt: 'Die Brücke ist auch heute noch ___. (nutzen, Zustandspassiv)',
        promptData: { options: ['genutzt', 'wird genutzt', 'nutzt', 'nutzend'] },
        acceptedAnswers: ['genutzt'],
      },
      {
        type: 'transform',
        prompt: 'Die Tür ist geöffnet.',
        promptData: { instruction: 'Rewrite as Vorgangspassiv (the action, Präsens): „Die Tür …“' },
        acceptedAnswers: ['Die Tür wird geöffnet.'],
      },
      { type: 'cloze', prompt: 'Während der Besprechung wurde viel ___. (lachen, unpersönliches Passiv)', acceptedAnswers: ['gelacht'] },
      { type: 'translate_en_de', prompt: 'Smoking is not allowed here.', acceptedAnswers: ['Hier wird nicht geraucht.'] },
      { type: 'translate_de_en', prompt: 'Das Büro war den ganzen Tag geschlossen.', acceptedAnswers: ['The office was closed all day.'] },
    ],
  },
  {
    key: 'b2-konjunktiv-ii-vergangenheit',
    title: 'Konjunktiv II der Vergangenheit',
    cefr: 'B2',
    focus: 'hätte/wäre + Partizip II — regrets, irreale Bedingungen and wishes about the past',
    relatedVocabTheme: 'Emotions',
    explanationMd: `The Konjunktiv II of the **past** talks about what did **not** happen: **hätte/wäre** + Partizip II.

## Building it
- haben-verbs: **hätte** + Partizip II — Ich **hätte mehr gelernt**. — I should have studied more.
- sein-verbs (movement/change): **wäre** + Partizip II — Ich **wäre gern gekommen**. — I would have liked to come.

## Irreale Bedingungen (Vergangenheit)
- Wenn ich das **gewusst hätte**, **wäre** ich **gekommen**. — If I had known that, I would have come.
- Wenn du früher losgefahren **wärst**, hättest du den Zug erreicht.

## Wünsche & Vorwürfe (doch / nur / bloß)
- Wenn er doch nur auf mich gehört **hätte**!
- **Hätte** ich **bloß** mehr Zeit **gehabt**!

## Irreale Vergleiche
- Er tut, als **hätte** er nichts **gesehen**. — He acts as if he had seen nothing.`,
    drills: [
      { type: 'cloze', prompt: 'Wenn ich mehr gelernt ___, hätte ich die Prüfung bestanden.', acceptedAnswers: ['hätte'] },
      { type: 'cloze', prompt: 'Wenn du früher losgefahren ___, wärst du pünktlich gewesen. (sein)', acceptedAnswers: ['wärst', 'wärest'] },
      { type: 'cloze', prompt: 'Ich ___ gern gekommen, aber ich war krank. (kommen — Konjunktiv II der Vergangenheit)', acceptedAnswers: ['wäre'] },
      {
        type: 'choice',
        prompt: 'Wenn wir ein Taxi ___, hätten wir den Zug erreicht.',
        promptData: { options: ['genommen hätten', 'hätten genommen', 'nahmen', 'nehmen würden'] },
        acceptedAnswers: ['genommen hätten'],
      },
      {
        type: 'transform',
        prompt: 'Ich bin nicht gereist, weil ich kein Geld hatte.',
        promptData: { instruction: 'Rewrite as an irreal conditional about the past: „Wenn ich …“' },
        acceptedAnswers: ['Wenn ich Geld gehabt hätte, wäre ich gereist.'],
      },
      { type: 'cloze', prompt: 'Wenn er doch bloß auf mich gehört ___!', acceptedAnswers: ['hätte'] },
      { type: 'translate_en_de', prompt: 'If I had known that, I would have come.', acceptedAnswers: ['Wenn ich das gewusst hätte, wäre ich gekommen.'] },
      { type: 'translate_de_en', prompt: 'Hätte ich bloß mehr Zeit gehabt!', acceptedAnswers: ['If only I had had more time!'] },
    ],
  },
  {
    key: 'b2-konjunktiv-i',
    title: 'Konjunktiv I & indirekte Rede',
    cefr: 'B2',
    focus: 'sei, habe, werde — reporting what someone said, journalistically neutral',
    relatedVocabTheme: 'Media',
    explanationMd: `The Konjunktiv I **reports** statements without quoting them — neutral, distanced, journalistic.

## Core forms (3rd person)
- sein → **sei**: Der Sprecher sagt, die Lage **sei** stabil.
- haben → **habe**: Sie berichtet, sie **habe** den Vertrag unterschrieben.
- werden → **werde**: Er erklärt, er **werde** morgen anreisen.
- können → **könne** · müssen → **müsse** · wissen → **wisse**

## Past: sei/habe + Partizip II
- Er sagt, er **sei gekommen**. — He says he came.
- Er sagt, er **habe gearbeitet**.

## When Konjunktiv I collides with Indikativ
For plural forms the two often look identical — then switch to **Konjunktiv II**:
- Die Gäste sagten, sie **hätten** keine Zeit. (not: sie haben)

## Indirect questions
- Er fragt, **ob** das stimme. — Wissen Sie, **wo** der Bus **halte**?`,
    drills: [
      { type: 'cloze', prompt: 'Der Sprecher sagt, die Lage ___ stabil. (sein, Konjunktiv I)', acceptedAnswers: ['sei'] },
      { type: 'cloze', prompt: 'Sie berichtet, sie ___ den Vertrag schon unterschrieben. (haben, Konjunktiv I)', acceptedAnswers: ['habe'] },
      { type: 'cloze', prompt: 'Er erklärt, er ___ morgen anreisen. (werden, Konjunktiv I)', acceptedAnswers: ['werde'] },
      { type: 'cloze', prompt: 'Der Politiker behauptet, er ___ von nichts gewusst. (haben, Konjunktiv I Vergangenheit)', acceptedAnswers: ['habe'] },
      {
        type: 'choice',
        prompt: 'Die Gäste sagten, sie ___ keine Zeit. (Konjunktiv I gleicht dem Indikativ → weiche auf Konjunktiv II aus)',
        promptData: { options: ['hätten', 'haben', 'hatten', 'hätten gehabt'] },
        acceptedAnswers: ['hätten'],
      },
      {
        type: 'transform',
        prompt: 'Der Zeuge sagt: „Ich habe den Unfall gesehen.“',
        promptData: { instruction: 'Report the statement with Konjunktiv I: „Der Zeuge sagt, …“' },
        acceptedAnswers: ['Der Zeuge sagt, er habe den Unfall gesehen.'],
      },
      { type: 'translate_en_de', prompt: 'She says that she is tired.', acceptedAnswers: ['Sie sagt, sie sei müde.'] },
      { type: 'translate_de_en', prompt: 'Der Reporter sagt, der Zug sei verspätet.', acceptedAnswers: ['The reporter says that the train is delayed.', 'The reporter says the train is delayed.'] },
    ],
  },
  {
    key: 'b2-modalverben-subjektiv',
    title: 'Subjektive Bedeutung der Modalverben',
    cefr: 'B2',
    focus: 'muss/dürfte/kann as speculation, soll/will as hearsay and self-claim',
    relatedVocabTheme: 'People',
    explanationMd: `Modal verbs can express how **sure** the speaker is — or who **claims** something. Essential for reading between the lines.

## Certainty scale (present)
- **muss** (very certain): Das Licht brennt — er **muss** zu Hause sein.
- **dürfte** (probable): Sie **dürfte** etwa 40 sein.
- **kann/könnte** (possible): Das **kann** stimmen. · Er **könnte** recht haben.
- **mag** (conceding): Das **mag** stimmen, aber …

## Past speculation: modal + Partizip II + haben/sein
- Er **muss abgereist sein**. — He must have left.
- Sie **könnte** das **vergessen haben**.

## Hearsay & claims
- **soll** (others say so): Er **soll** sehr reich sein.
- **will** (claims about himself): Er **will** von nichts gewusst haben.`,
    drills: [
      { type: 'cloze', prompt: 'Das Licht brennt — die Nachbarn ___ zu Hause sein. (sehr sichere Vermutung)', acceptedAnswers: ['müssen'] },
      { type: 'cloze', prompt: 'Sie ___ etwa 40 sein. (wahrscheinliche Vermutung)', acceptedAnswers: ['dürfte'] },
      { type: 'cloze', prompt: 'Er ___ viel Geld gehabt haben, aber ich bin nicht sicher. (Möglichkeit, Vergangenheit)', acceptedAnswers: ['könnte'] },
      {
        type: 'choice',
        prompt: 'Er ___ der Täter sein — so sagt man es wenigstens. (Hörensagen über andere)',
        promptData: { options: ['soll', 'will', 'muss', 'mag'] },
        acceptedAnswers: ['soll'],
      },
      {
        type: 'choice',
        prompt: 'Sie ___ den Chef persönlich kennen — sie behauptet es jedenfalls selbst. (Eigenbehauptung)',
        promptData: { options: ['will', 'soll', 'mag', 'kann'] },
        acceptedAnswers: ['will'],
      },
      {
        type: 'transform',
        prompt: 'Vermutlich ist er schon abgereist. (sehr sicher)',
        promptData: { instruction: 'Rewrite with „müssen“ as a certain speculation: „Er …“' },
        acceptedAnswers: ['Er muss schon abgereist sein.'],
      },
      { type: 'translate_en_de', prompt: 'He is said to be very rich.', acceptedAnswers: ['Er soll sehr reich sein.'] },
      { type: 'translate_de_en', prompt: 'Das dürfte stimmen.', acceptedAnswers: ['That is probably true.', 'That is probably correct.', 'That may well be true.'] },
    ],
  },
  {
    key: 'b2-n-deklination',
    title: 'n-Deklination',
    cefr: 'B2',
    focus: 'weak masculine nouns take -n/-en in every case except Nominativ Singular',
    relatedVocabTheme: 'Abstract',
    explanationMd: `About 5 % of masculine nouns are **weak**: they take **-n/-en** in every case **except** Nominativ Singular.

## The groups
- **-e**: der Kollege → den/dem/des **Kollegen**; der Junge, der Löwe, der Kunde
- foreign words in **-and/-ant/-ent/-ist/-oge**: der Student → den **Studenten**; der Praktikant, der Doktorand, der Journalist, der Psychologe
- **-el**: der Nachbar → den **Nachbarn**
- extra **-ns** in Genitiv: der Gedanke → des **Gedankens**; der Name, der Wille, der Funke
- special: der Herr → den **Herrn**

## Examples
- Ich habe **den Kollegen** gefragt. (Akkusativ)
- Das ist die Meinung **des Journalisten**. (Genitiv)
- Im Namen **des Herrn** … — in the name of the gentleman …

## Signal
A masculine noun with an unexpected **-n/-en** is usually n-Deklination — **not** a plural.`,
    drills: [
      { type: 'cloze', prompt: 'Ich habe den ___ gefragt. (der Kollege, Akkusativ)', acceptedAnswers: ['Kollegen'] },
      { type: 'cloze', prompt: 'Wir sprechen mit dem ___. (der Student, Dativ)', acceptedAnswers: ['Studenten'] },
      { type: 'cloze', prompt: 'Das ist die Meinung des ___. (der Journalist, Genitiv)', acceptedAnswers: ['Journalisten'] },
      { type: 'cloze', prompt: 'Im Namen des ___. (der Herr, Genitiv)', acceptedAnswers: ['Herrn'] },
      {
        type: 'choice',
        prompt: 'Ich folge dem ___ des Redners. (der Gedanke, Dativ)',
        promptData: { options: ['Gedanken', 'Gedanke', 'Gedankens', 'Gedankes'] },
        acceptedAnswers: ['Gedanken'],
      },
      {
        type: 'transform',
        prompt: 'Der Praktikant arbeitet seit Montag bei uns.',
        promptData: { instruction: 'Rewrite in Akkusativ: „Die Firma hat … eingestellt.“' },
        acceptedAnswers: ['Die Firma hat den Praktikanten eingestellt.'],
      },
      { type: 'translate_de_en', prompt: 'Ich habe den Artikel des Journalisten gelesen.', acceptedAnswers: ["I read the journalist's article.", "I have read the journalist's article.", 'I read the article of the journalist.'] },
      { type: 'translate_en_de', prompt: 'I saw the neighbor yesterday. (der Nachbar, Akkusativ)', acceptedAnswers: ['Ich habe den Nachbarn gestern gesehen.', 'Ich habe gestern den Nachbarn gesehen.'] },
    ],
  },
  {
    key: 'b2-nominalstil',
    title: 'Nominalstil & Verbalstil',
    cefr: 'B2',
    focus: 'Nominalisierung — turning verb clauses into preposition + noun phrases, and back',
    relatedVocabTheme: 'Education',
    explanationMd: `Official German loves the **Nominalstil**: instead of a clause with a verb, a preposition + **-ung/-keit/-tion** noun. Same content, denser style.

## Verbalstil ↔ Nominalstil
- **Nachdem** die Rechnung **geprüft wurde**, … → **Nach der Prüfung der Rechnung**, …
- **weil** die Preise **steigen** → **wegen der steigenden Preise**
- **obwohl** das Gesetz **verabschiedet wurde** → **trotz der Verabschiedung des Gesetzes**

## Useful nominalizations
- prüfen → die **Prüfung** · lösen → die **Lösung** · ankommen → die **Ankunft**
- steigen → der **Anstieg** / die **Steigerung** · unterschreiben → die **Unterzeichnung**
- beschließen → der **Beschluss** · verabschieden → die **Verabschiedung**

## When to use which
Verbalstil for speech and clear texts; Nominalstil for news, law and science — impersonal and compact.`,
    drills: [
      { type: 'cloze', prompt: 'Nach der ___ des Vertrags gab es eine Feier. (unterzeichnen → Nomen)', acceptedAnswers: ['Unterzeichnung'] },
      { type: 'cloze', prompt: 'Die ___ des Problems dauerte lange. (lösen → Nomen)', acceptedAnswers: ['Lösung'] },
      { type: 'cloze', prompt: 'Nach der ___ der Gäste begann das Essen. (ankommen → Nomen)', acceptedAnswers: ['Ankunft'] },
      { type: 'cloze', prompt: 'Wegen der starken ___ der Preise klagen die Kunden. (steigen → Nomen)', acceptedAnswers: ['Steigerung'] },
      {
        type: 'choice',
        prompt: 'Nominalstil: „nach der Ankunft des Zuges“ — wie lautet der Verbalstil?',
        promptData: { options: ['nachdem der Zug angekommen war', 'nach der Zug angekommen ist', 'als der Zug danach ankam', 'nachdem der Zug war angekommen'] },
        acceptedAnswers: ['nachdem der Zug angekommen war'],
      },
      {
        type: 'transform',
        prompt: 'Nachdem die Gäste angekommen waren, begann das Essen.',
        promptData: { instruction: 'Rewrite in Nominalstil: „Nach der …“' },
        acceptedAnswers: ['Nach der Ankunft der Gäste begann das Essen.'],
      },
      { type: 'translate_de_en', prompt: 'Nach der Unterzeichnung des Vertrags verließen die Delegationen den Saal.', acceptedAnswers: ['After the signing of the contract, the delegations left the hall.', 'After the contract was signed, the delegations left the hall.'] },
      { type: 'translate_en_de', prompt: 'The solution of the problem took a long time.', acceptedAnswers: ['Die Lösung des Problems dauerte lange.', 'Die Lösung des Problems hat lange gedauert.'] },
    ],
  },
  {
    key: 'b2-relativsaetze-genitiv',
    title: 'Relativsätze mit Genitiv & was/wo',
    cefr: 'B2',
    focus: 'dessen/deren for possession, was after alles/nichts, wo for places',
    relatedVocabTheme: 'People',
    explanationMd: `B1 relative clauses use der/die/das. B2 adds **possession**, **was** and **wo**.

## Genitiv relatives: dessen / deren
- der/das → **dessen**: Der Kollege, **dessen** Auto gestohlen wurde, …
- die / plural → **deren**: Die Frau, **deren** Sohn in Berlin studiert, ist Ärztin.
- Die Firma, **deren** Geschäftsführer zurücktrat, sucht einen Nachfolger.

## was — after alles / nichts / etwas and neuter pronouns
- **Alles, was** er sagt, stimmt. — Everything he says is true.
- Das ist **alles, was** ich weiß.

## wo — for places (short for „in der / in dem“)
- Die Stadt, **wo** ich geboren bin, liegt an der Donau.

## Preposition + wo(r)-
- das Thema, **worüber** wir sprachen — the topic we talked about
- **Wovon** er träumt, bleibt geheim.`,
    drills: [
      { type: 'cloze', prompt: 'Das ist der Kollege, ___ Auto gestohlen wurde.', acceptedAnswers: ['dessen'] },
      { type: 'cloze', prompt: 'Die Frau, ___ Sohn in Berlin studiert, ist Ärztin.', acceptedAnswers: ['deren'] },
      { type: 'cloze', prompt: 'Alles, ___ er sagt, stimmt.', acceptedAnswers: ['was'] },
      { type: 'cloze', prompt: 'Das ist die Stadt, ___ ich geboren bin. (Kurzform von „in der“)', acceptedAnswers: ['wo'] },
      {
        type: 'choice',
        prompt: 'Die Firma, ___ Geschäftsführer zurücktrat, sucht einen Nachfolger.',
        promptData: { options: ['deren', 'dessen', 'die', 'derer'] },
        acceptedAnswers: ['deren'],
      },
      {
        type: 'transform',
        prompt: 'Herr Braun ist mein Kollege. Sein Sohn ist Sänger.',
        promptData: { instruction: 'Combine with a Genitiv relative clause: „Herr Braun, … , ist mein Kollege.“' },
        acceptedAnswers: ['Herr Braun, dessen Sohn Sänger ist, ist mein Kollege.'],
      },
      { type: 'translate_en_de', prompt: 'That is the woman whose car was stolen.', acceptedAnswers: ['Das ist die Frau, deren Auto gestohlen wurde.'] },
      { type: 'translate_de_en', prompt: 'Alles, was er sagte, war falsch.', acceptedAnswers: ['Everything he said was wrong.', 'Everything that he said was wrong.'] },
    ],
  },
  {
    key: 'b2-praepositionen-genitiv',
    title: 'Präpositionen mit Genitiv',
    cefr: 'B2',
    focus: 'aufgrund, anhand, infolge, mangels, hinsichtlich — the formal written set',
    relatedVocabTheme: 'Law',
    explanationMd: `Beyond **wegen/trotz/während**, formal written German has a full set of **Genitiv prepositions** — the glue of news, law and science texts.

## The B2 set
- **aufgrund** (because of): **Aufgrund** der Studie wurde die Methode geändert.
- **anhand** (on the basis of): Die Identität wurde **anhand** des Ausweises geprüft.
- **infolge** (as a result of): **Infolge** des Sturms entfiel das Konzert.
- **mangels** (for lack of): Das Verfahren wurde **mangels** Beweisen eingestellt.
- **innerhalb / außerhalb** (within / outside): **außerhalb** der Öffnungszeiten
- **hinsichtlich** (regarding) · **zugunsten** (in favour of) · **laut** (+ Nom./Dat./Gen.): **laut** dem Bericht

## Examples
- **Aufgrund verschärfter Regeln** wurde der Antrag abgelehnt.
- **Anhand der Daten** lässt sich der Trend belegen.

## Tip
You already know wegen/trotz — these are their formal siblings. If the noun after them carries **des/der/eines/einer**, it is Genitiv.`,
    drills: [
      { type: 'cloze', prompt: '___ zahlreicher Studien ist der Trend eindeutig. (aufgrund)', acceptedAnswers: ['Aufgrund'] },
      { type: 'cloze', prompt: 'Die Identität wurde ___ des Ausweises geprüft. (anhand)', acceptedAnswers: ['anhand'] },
      { type: 'cloze', prompt: '___ schlechter Wetterverhältnisse wurde das Spiel abgesagt. (infolge)', acceptedAnswers: ['Infolge'] },
      { type: 'cloze', prompt: 'Das Experiment scheiterte ___ ausreichender Daten. (mangels)', acceptedAnswers: ['mangels'] },
      {
        type: 'choice',
        prompt: 'Aufgrund ___ verschärften Regeln wurde der Antrag abgelehnt.',
        promptData: { options: ['der', 'den', 'die', 'dem'] },
        acceptedAnswers: ['der'],
      },
      {
        type: 'transform',
        prompt: 'Weil es stark regnete, wurde das Spiel abgesagt.',
        promptData: { instruction: 'Rewrite with „aufgrund“ + Genitiv: „Aufgrund …“' },
        acceptedAnswers: ['Aufgrund des starken Regens wurde das Spiel abgesagt.'],
      },
      { type: 'translate_en_de', prompt: 'The experiment failed because of a lack of time.', acceptedAnswers: ['Das Experiment scheiterte mangels Zeit.'] },
      { type: 'translate_de_en', prompt: 'Anhand der Daten lässt sich der Trend belegen.', acceptedAnswers: ['The trend can be demonstrated on the basis of the data.', 'Based on the data, the trend can be demonstrated.'] },
    ],
  },
  {
    key: 'b2-pronominaladverbien',
    title: 'Pronominaladverbien (da-/wo-)',
    cefr: 'B2',
    focus: 'daran, darauf, worauf, davon — prepositions pointing at things, never people',
    relatedVocabTheme: 'Communication',
    explanationMd: `When a verb's preposition refers to a **thing** (not a person), German uses **da(r)-** or **wo(r)-** compounds.

## The rule
- thing → **da(r)- + Präposition**: Ich denke **daran**. — **Worauf** wartest du? — Ich warte **darauf**.
- person → **Präposition + Pronomen**: Mit **wem** sprichst du? — Mit **ihr**. (never: „mit damit“)

## The r before vowels
an → **daran/woran** · auf → **darauf/worauf** · über → **darüber/worüber** · von → **davon/wovon** · um → **darum/worum**

## Fixed pairs to know
- **daran** denken · **darauf** warten · sich **darüber** freuen · **davon** abhängen · **damit** rechnen · **darum** gehen (in „es geht darum“)

## Statement vs. question
- Ich freue mich **darauf**. — I am looking forward to it.
- **Worauf** freust du dich? — What are you looking forward to?`,
    drills: [
      { type: 'cloze', prompt: 'Ich erinnere mich nicht mehr ___. (an den Termin → da-Wort)', acceptedAnswers: ['daran'] },
      { type: 'cloze', prompt: '___ denkst du gerade? (an + Frage)', acceptedAnswers: ['Woran'] },
      { type: 'cloze', prompt: 'Das hängt stark ___ ab, was du meinst. (von → da-Wort)', acceptedAnswers: ['davon'] },
      { type: 'cloze', prompt: '___ geht es in dem Meeting? (um → w-Frage)', acceptedAnswers: ['Worum'] },
      {
        type: 'choice',
        prompt: 'Freust du dich auf den Urlaub? — Ja, ich freue mich ___. (auf → da-Wort)',
        promptData: { options: ['darauf', 'daraan', 'darüber', 'davon'] },
        acceptedAnswers: ['darauf'],
      },
      {
        type: 'transform',
        prompt: 'Ich denke oft an die Kindheit.',
        promptData: { instruction: 'Replace the noun with a da-compound: „Ich denke oft …“' },
        acceptedAnswers: ['Ich denke oft daran.'],
      },
      { type: 'translate_en_de', prompt: 'What are you waiting for?', acceptedAnswers: ['Worauf wartest du?'] },
      { type: 'translate_de_en', prompt: 'Ich freue mich darauf.', acceptedAnswers: ['I am looking forward to it.', "I'm looking forward to it."] },
    ],
  },
  {
    key: 'b2-infinitivkonstruktionen',
    title: 'Infinitivkonstruktionen mit zu',
    cefr: 'B2',
    focus: 'zu + Infinitiv clauses, um…zu, ohne…zu, anstatt…zu — and when zu is not used',
    relatedVocabTheme: 'Education',
    explanationMd: `Infinitive clauses pack a whole clause into **zu + Infinitiv** at the end — German's favourite way to avoid a subordinate clause.

## Basic: subject-less zu-clause
- Er versucht, pünktlich **anzukommen**. (ankommen → **anzukommen** — separable: zu slips in)
- Wir haben vor, nächstes Jahr **umzuziehen**.

## zu with modal-like verbs
- **brauchen nicht zu** …: Du brauchst nicht **mitzukommen**. (= don't have to)
- **scheinen zu** …: Sie scheint **schlafen** zu wollen? — Sie scheint müde **zu sein**.

## um / ohne / anstatt … zu (different subject needs „damit/dass“)
- Ich lerne Deutsch, **um** in Wien **zu studieren**. (purpose)
- Er ging weg, **ohne** sich **zu verabschieden**. (without)
- **Anstatt** zu klagen, sollte er handeln. (instead of)

## No zu with modal verbs & movement verbs
- Er kann schwimmen. · Ich gehe einkaufen. (never: „kann zu schwimmen“)`,
    drills: [
      { type: 'cloze', prompt: 'Ich habe vor, nächstes Jahr nach Spanien ___. (umziehen)', acceptedAnswers: ['umzuziehen'] },
      { type: 'cloze', prompt: 'Er ging weg, ohne sich ___. (verabschieden)', acceptedAnswers: ['zu verabschieden'] },
      { type: 'cloze', prompt: 'Ich lerne Deutsch, ___ in Wien zu studieren. (Ziel)', acceptedAnswers: ['um'] },
      { type: 'cloze', prompt: 'Du brauchst nicht ___. (mitkommen)', acceptedAnswers: ['mitzukommen'] },
      {
        type: 'choice',
        prompt: 'Er versucht, den Termin ___.',
        promptData: { options: ['zu verschieben', 'verschieben', 'zu verschiebend', 'verschob'] },
        acceptedAnswers: ['zu verschieben'],
      },
      {
        type: 'transform',
        prompt: 'Ich lerne Deutsch, weil ich in Wien studieren will.',
        promptData: { instruction: 'Rewrite with „um … zu“: „Ich lerne Deutsch, um …“' },
        acceptedAnswers: ['Ich lerne Deutsch, um in Wien zu studieren.'],
      },
      { type: 'translate_en_de', prompt: 'She seems to be tired.', acceptedAnswers: ['Sie scheint müde zu sein.'] },
      { type: 'translate_de_en', prompt: 'Er ging weg, ohne sich zu verabschieden.', acceptedAnswers: ['He left without saying goodbye.', 'He went away without saying goodbye.'] },
    ],
  },
  {
    key: 'b2-passiversatz',
    title: 'Passiversatz: lassen & sein + zu',
    cefr: 'B2',
    focus: 'sich lassen and sein + zu + Infinitiv as elegant passive alternatives',
    relatedVocabTheme: 'Abstract',
    explanationMd: `Two elegant alternatives to the passive — common in technical and formal texts.

## sich lassen (= kann/kannst … werden)
- Das Problem **lässt sich lösen**. = Das Problem **kann gelöst werden**.
- Die Daten **lassen sich** online **abrufen**.

## sein + zu + Infinitiv
- müssen-Passiv: Der Antrag **ist bis Freitag einzureichen**. = … **muss bis Freitag eingereicht werden**.
- können-negiert: Dieser Fehler **ist nicht zu vermeiden**. = … **kann nicht vermieden werden**.
- Die Rechnung **ist sofort zu bezahlen**.

## Choosing between them
- **sich lassen** — neutral, spoken & written, „is doable“
- **sein + zu** — formal, technical, obligation-flavoured

## Watch the meaning
- „Das Buch **ist zu lesen**“ — you must/should read it. „Das Buch **lässt sich lesen**“ — it reads well / is readable.`,
    drills: [
      { type: 'cloze', prompt: 'Das Problem ___ sich gut lösen. (sich lassen, Präsens)', acceptedAnswers: ['lässt'] },
      { type: 'cloze', prompt: 'Der Antrag ___ bis Freitag einzureichen. (sein + zu)', acceptedAnswers: ['ist'] },
      { type: 'cloze', prompt: 'Dieser Fehler ist nicht ___ vermeiden. (sein + zu → Infinitiv mit zu)', acceptedAnswers: ['zu'] },
      {
        type: 'choice',
        prompt: 'Die Daten lassen sich online abrufen. — Welcher Passivsatz entspricht dem?',
        promptData: { options: ['Die Daten können online abgerufen werden', 'Die Daten müssen online abgerufen werden', 'Die Daten wurden online abgerufen', 'Die Daten sind online abgerufen worden'] },
        acceptedAnswers: ['Die Daten können online abgerufen werden'],
      },
      {
        type: 'transform',
        prompt: 'Die Rechnung muss sofort bezahlt werden.',
        promptData: { instruction: 'Rewrite with „sein + zu“: „Die Rechnung ist …“' },
        acceptedAnswers: ['Die Rechnung ist sofort zu bezahlen.'],
      },
      {
        type: 'transform',
        prompt: 'Das Problem kann gelöst werden.',
        promptData: { instruction: 'Rewrite with „sich lassen“: „Das Problem …“' },
        acceptedAnswers: ['Das Problem lässt sich lösen.'],
      },
      { type: 'translate_en_de', prompt: 'This manual can be downloaded free of charge.', acceptedAnswers: ['Diese Anleitung lässt sich kostenlos herunterladen.'] },
      { type: 'translate_de_en', prompt: 'Der Antrag ist bis Freitag einzureichen.', acceptedAnswers: ['The application must be submitted by Friday.', 'The application has to be submitted by Friday.'] },
    ],
  },
  {
    key: 'b2-funktionsverbgefuege',
    title: 'Funktionsverbgefüge',
    cefr: 'B2',
    focus: 'fixed verb+noun combos like eine Entscheidung treffen, in Frage kommen',
    relatedVocabTheme: 'Work',
    explanationMd: `A **Funktionsverbgefüge** is a light verb (nehmen, treffen, stellen …) + a fixed noun — the verb carries almost no meaning of its own: „eine Entscheidung **treffen**“ = „entscheiden“.

## The classic set
- eine Entscheidung **treffen** — to decide
- eine Frage **stellen** — to ask · Kritik **üben** — to criticize
- ein Ziel **verfolgen** — to pursue a goal · eine Rolle **spielen**
- in Frage **kommen** — to be an option · zur Verfügung **stehen**
- Rücksicht **nehmen** (auf) — to show consideration
- ein Gespräch **führen** — to have a talk · Maßnahmen **ergreifen/treffen**

## Why they matter
- In texts they replace simple verbs: **zur Sprache bringen** = ansprechen · **außer Kraft setzen** = abschaffen
- The **noun** carries the article and the meaning — the verb is nearly interchangeable with synonyms in the same row: Maßnahmen ergreifen/treffen.

## Test your instinct
Not „eine Entscheidung machen“* — German **trifft** decisions.`,
    drills: [
      { type: 'cloze', prompt: 'Wir müssen bis morgen eine Entscheidung ___. (treffen)', acceptedAnswers: ['treffen'] },
      { type: 'cloze', prompt: 'Der Chef hat in der Besprechung eine wichtige Frage ___. (stellen)', acceptedAnswers: ['gestellt'] },
      { type: 'cloze', prompt: 'Kommt diese Lösung für euch in ___? (feste Wendung)', acceptedAnswers: ['Frage'] },
      { type: 'cloze', prompt: 'Die Daten stehen uns jederzeit zur ___. (feste Wendung)', acceptedAnswers: ['Verfügung'] },
      {
        type: 'choice',
        prompt: 'Die Regierung hat Maßnahmen gegen die Inflation ___.',
        promptData: { options: ['ergriffen', 'gemacht', 'genommen', 'geübt'] },
        acceptedAnswers: ['ergriffen'],
      },
      {
        type: 'choice',
        prompt: 'Welches Verb passt: „Kritik ___“?',
        promptData: { options: ['üben', 'machen', 'nehmen', 'geben'] },
        acceptedAnswers: ['üben'],
      },
      {
        type: 'transform',
        prompt: 'Die Kommission hat entschieden.',
        promptData: { instruction: 'Rewrite with a Funktionsverbgefüge: „Die Kommission hat …“' },
        acceptedAnswers: ['Die Kommission hat eine Entscheidung getroffen.'],
      },
      { type: 'translate_en_de', prompt: 'We have to take the neighbors into consideration.', acceptedAnswers: ['Wir müssen auf die Nachbarn Rücksicht nehmen.', 'Wir müssen Rücksicht auf die Nachbarn nehmen.'] },
    ],
  },
  {
    key: 'b2-partizipialsaetze',
    title: 'Partizipialsätze & Gerundivum',
    cefr: 'B2',
    focus: 'Partizip I/II as compact clauses; das zu lesende Buch — Gerundivum',
    relatedVocabTheme: 'Media',
    explanationMd: `Partizipialsätze compress a relative clause into a single participle — the signature of written German.

## Partizip I (aktiv, gleichzeitig): …end
- **Der in Berlin lebende Künstler** … = der Künstler, **der in Berlin lebt**, …
- das **steigende** Interesse = das Interesse, das steigt

## Partizip II (passiv, vorherig)
- **Die 1990 gegründete Firma** … = die Firma, **die 1990 gegründet wurde**, …
- die **geprüften** Daten = die Daten, die geprüft wurden

## erweitertes Partizip I with zu = Gerundivum (passive necessity)
- das **zu lesende** Buch = das Buch, das **gelesen werden muss/soll**
- die **noch zu klärenden** Fragen = Fragen, die noch geklärt werden müssen

## Position
The participle group sits **before the noun** — commas disappear: „Die von der Kommission geprüfte Akte war vollständig.“`,
    drills: [
      { type: 'cloze', prompt: 'Der in Berlin ___ Künstler malt Städte. (leben → Partizip I als Adjektiv)', acceptedAnswers: ['lebende'] },
      { type: 'cloze', prompt: 'Die 1990 ___ Firma hat heute 500 Mitarbeiter. (gründen, Partizip II)', acceptedAnswers: ['gegründete'] },
      { type: 'cloze', prompt: 'das ___ Buch = das Buch, das gelesen werden muss. (lesen → Gerundivum)', acceptedAnswers: ['zu lesende'] },
      {
        type: 'choice',
        prompt: '„die steigenden Preise“ bedeutet:',
        promptData: { options: ['die Preise, die steigen', 'die Preise, die gestiegen sind', 'die Preise, die steigen müssen', 'die Preise, die gesteigert wurden'] },
        acceptedAnswers: ['die Preise, die steigen'],
      },
      {
        type: 'transform',
        prompt: 'die Firma, die 1990 gegründet wurde',
        promptData: { instruction: 'Compress into a Partizip-II attribute before the noun: „die …“' },
        acceptedAnswers: ['die 1990 gegründete Firma'],
      },
      {
        type: 'transform',
        prompt: 'die Fragen, die noch geklärt werden müssen',
        promptData: { instruction: 'Rewrite as a Gerundivum: „die …“' },
        acceptedAnswers: ['die noch zu klärenden Fragen'],
      },
      { type: 'translate_en_de', prompt: 'The book that must be read', acceptedAnswers: ['das zu lesende Buch', 'Das Buch, das gelesen werden muss.'] },
      { type: 'translate_de_en', prompt: 'Die geprüften Daten waren korrekt.', acceptedAnswers: ['The checked data was correct.', 'The verified data was correct.', 'The checked data were correct.'] },
    ],
  },
  {
    key: 'b2-je-desto',
    title: 'je … desto / je … umso & comparative clauses',
    cefr: 'B2',
    focus: 'proportional increase — je + Komparativ, desto + Komparativ + verb-final',
    relatedVocabTheme: 'Everyday',
    explanationMd: `**Je … desto** links two things that grow together: *the more … the more*.

## The pattern
**je** + Komparativ (verb last!) , **desto/umso** + Komparativ + verb:
- **Je mehr** ich lerne, **desto einfacher** wird es. — The more I study, the easier it gets.
- **Je älter** er wird, **umso weniger** schläft er.

## Word order
- Je-clause: comparative **first**, verb goes to the **end** — „Je länger ich **warte** …“
- Desto-clause: comparative **directly after desto**, then the verb — „… desto **nervöser werde** ich.“

## Common pairs
- je länger … desto schwerer · je weniger … desto besser
- je eher … desto schneller — the sooner … the faster

## Watch out
Always **two comparatives** — never „Je viel ich lerne, desto gut wird es“*.

## Related: Comparative with als
- Er ist größer **als** sein Bruder. — Nicht so schnell wie in B1: „so … wie“ for equality, „…er als“ for difference.`,
    drills: [
      { type: 'cloze', prompt: '___ mehr ich lerne, desto einfacher wird es. (je)', acceptedAnswers: ['Je'] },
      { type: 'cloze', prompt: 'Je älter er wird, ___ weniger schläft er. (desto)', acceptedAnswers: ['desto', 'umso'] },
      { type: 'cloze', prompt: 'Je länger ich warte, desto ___ werde ich. (nervös → Komparativ)', acceptedAnswers: ['nervöser'] },
      {
        type: 'choice',
        prompt: 'Je später der Abend, ___ die Gäste.',
        promptData: { options: ['desto lauter', 'desto laut', 'umso lauteste', 'lauter desto'] },
        acceptedAnswers: ['desto lauter'],
      },
      {
        type: 'transform',
        prompt: 'Wenn ich mehr Geld habe, kaufe ich mehr Bücher.',
        promptData: { instruction: 'Rewrite with „je … desto“: „Je mehr Geld …“' },
        acceptedAnswers: ['Je mehr Geld ich habe, desto mehr Bücher kaufe ich.'],
      },
      { type: 'translate_en_de', prompt: 'The older he gets, the less he sleeps.', acceptedAnswers: ['Je älter er wird, desto weniger schläft er.', 'Je älter er wird, umso weniger schläft er.'] },
      { type: 'translate_de_en', prompt: 'Je eher du kommst, desto besser.', acceptedAnswers: ['The sooner you come, the better.', 'The earlier you come, the better.'] },
      { type: 'translate_en_de', prompt: 'The longer I wait, the more nervous I get.', acceptedAnswers: ['Je länger ich warte, desto nervöser werde ich.', 'Je länger ich warte, umso nervöser werde ich.'] },
    ],
  },
]
