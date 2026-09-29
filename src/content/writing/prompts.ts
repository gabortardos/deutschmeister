import type { CefrLevel } from '../../db/types'

export interface WritingPrompt {
  id: string
  cefr: CefrLevel
  /** The task in German — what the learner reads and writes against. */
  taskDe: string
  /** English translation of the task (training wheels, especially at A1/A2). */
  taskEn: string
}

/**
 * M11.9 static free-writing prompt bank: 8 tasks per CEFR level (A1→C2, 48
 * total). Progression: everyday present-tense texts at A1, Perfekt narratives
 * and practical notes at A2, opinions and semi-formal emails at B1, Erörterung
 * and formal registers at B2, nuanced essays at C1, stylistic and rhetorical
 * play at C2. Pure data — deterministic append-stable ids, proper orthography.
 * (LLM-generated 🎲 prompts are a Pro feature deferred to M11.10.)
 */
export const WRITING_PROMPTS: readonly WritingPrompt[] = [
  // ---------------------------------------------------------------- A1
  {
    id: 'w-a1-01',
    cefr: 'A1',
    taskDe: 'Stell dich vor: Wie heißt du, woher kommst du und wo wohnst du jetzt?',
    taskEn: 'Introduce yourself: what is your name, where are you from and where do you live now?',
  },
  {
    id: 'w-a1-02',
    cefr: 'A1',
    taskDe: 'Schreibe über deine Familie: Wer gehört dazu, und was macht ihr gern zusammen?',
    taskEn: 'Write about your family: who is part of it, and what do you like doing together?',
  },
  {
    id: 'w-a1-03',
    cefr: 'A1',
    taskDe: 'Beschreibe deinen typischen Tag: Wann stehst du auf? Was machst du morgens, nachmittags und abends?',
    taskEn: 'Describe your typical day: When do you get up? What do you do in the morning, afternoon and evening?',
  },
  {
    id: 'w-a1-04',
    cefr: 'A1',
    taskDe: 'Was ist dein Lieblingsessen? Wann und wo isst du es gern? Beschreibe es.',
    taskEn: 'What is your favourite food? When and where do you like eating it? Describe it.',
  },
  {
    id: 'w-a1-05',
    cefr: 'A1',
    taskDe: 'Beschreibe dein Zimmer oder deine Wohnung: Welche Möbel gibt es? Was gefällt dir besonders?',
    taskEn: 'Describe your room or flat: What furniture is there? What do you especially like?',
  },
  {
    id: 'w-a1-06',
    cefr: 'A1',
    taskDe: 'Was machst du gern in deiner Freizeit? Wie oft und mit wem? Erzähle davon.',
    taskEn: 'What do you like doing in your free time? How often, and with whom? Write about it.',
  },
  {
    id: 'w-a1-07',
    cefr: 'A1',
    taskDe: 'Wie ist das Wetter heute? Was trägst du bei diesem Wetter? Was machst du gern, wenn die Sonne scheint?',
    taskEn: 'What is the weather like today? What are you wearing in this weather? What do you like doing when the sun is out?',
  },
  {
    id: 'w-a1-08',
    cefr: 'A1',
    taskDe: 'Schreibe eine Einkaufsliste für die Woche und erzähle, wo du normalerweise einkaufst.',
    taskEn: 'Write a shopping list for the week and say where you usually go shopping.',
  },
  // ---------------------------------------------------------------- A2
  {
    id: 'w-a2-01',
    cefr: 'A2',
    taskDe: 'Was hast du am Wochenende gemacht? Schreibe fünf bis sechs Sätze im Perfekt.',
    taskEn: 'What did you do at the weekend? Write five to six sentences in the perfect tense.',
  },
  {
    id: 'w-a2-02',
    cefr: 'A2',
    taskDe: 'Du suchst ein Zimmer in einer Wohngemeinschaft. Schreibe eine kurze Anzeige: Wer bist du, was suchst du, ab wann?',
    taskEn: 'You are looking for a room in a shared flat. Write a short ad: who you are, what you are looking for, from when.',
  },
  {
    id: 'w-a2-03',
    cefr: 'A2',
    taskDe: 'Du warst beim Arzt. Schreibe, was dir gefehlt hat und was der Arzt oder die Ärztin gesagt hat.',
    taskEn: 'You went to the doctor. Write what was wrong with you and what the doctor said.',
  },
  {
    id: 'w-a2-04',
    cefr: 'A2',
    taskDe: 'Beschreibe deine Stadt oder dein Dorf: Was gibt es dort zu sehen? Was gefällt dir, was stört dich?',
    taskEn: 'Describe your town or village: What is there to see? What do you like, what bothers you?',
  },
  {
    id: 'w-a2-05',
    cefr: 'A2',
    taskDe: 'Lade eine Freundin oder einen Freund zu deiner Geburtstagsparty ein: Wann und wo ist sie? Was soll der Gast mitbringen?',
    taskEn: 'Invite a friend to your birthday party: When and where is it? What should the guest bring?',
  },
  {
    id: 'w-a2-06',
    cefr: 'A2',
    taskDe: 'Eine Touristin fragt nach dem Weg. Erkläre Schritt für Schritt, wie sie vom Bahnhof zum Museum kommt.',
    taskEn: 'A tourist asks you for directions. Explain step by step how to get from the station to the museum.',
  },
  {
    id: 'w-a2-07',
    cefr: 'A2',
    taskDe: 'Erzähle von deiner letzten Reise: Wohin bist du gefahren, wie war es dort, und was hast du gemacht?',
    taskEn: 'Write about your last trip: Where did you go, what was it like, and what did you do?',
  },
  {
    id: 'w-a2-08',
    cefr: 'A2',
    taskDe: 'Schreibe über deine Arbeit oder dein Studium: Was machst du genau, und wie sieht ein normaler Tag aus?',
    taskEn: 'Write about your job or your studies: What exactly do you do, and what does a normal day look like?',
  },
  // ---------------------------------------------------------------- B1
  {
    id: 'w-b1-01',
    cefr: 'B1',
    taskDe: 'Sollen Handys im Unterricht erlaubt sein? Schreibe deine Meinung mit drei Argumenten und einem Schluss.',
    taskEn: 'Should mobile phones be allowed in class? State your opinion with three arguments and a conclusion.',
  },
  {
    id: 'w-b1-02',
    cefr: 'B1',
    taskDe: 'Du hast online eine kaputte Ware bekommen. Schreibe eine höfliche Beschwerde-E-Mail an den Shop: Anrede, Problem, Forderung, Gruß.',
    taskEn: 'Something you ordered online arrived broken. Write a polite complaint email to the shop: salutation, problem, request, closing.',
  },
  {
    id: 'w-b1-03',
    cefr: 'B1',
    taskDe: 'Erzähle von einem Erlebnis, das du nie vergessen wirst: Was ist passiert, und warum war es besonders?',
    taskEn: 'Write about an experience you will never forget: What happened, and why was it special?',
  },
  {
    id: 'w-b1-04',
    cefr: 'B1',
    taskDe: 'Dein Freund möchte Deutsch lernen und fragt dich um Rat. Schreibe eine E-Mail mit drei konkreten Tipps.',
    taskEn: 'Your friend wants to learn German and asks you for advice. Write an email with three concrete tips.',
  },
  {
    id: 'w-b1-05',
    cefr: 'B1',
    taskDe: 'Schreibe eine Bewertung für ein Restaurant: Wie waren Essen, Service, Preise und Atmosphäre? Würdest du wieder hingehen?',
    taskEn: 'Write a review of a restaurant: How were the food, service, prices and atmosphere? Would you go again?',
  },
  {
    id: 'w-b1-06',
    cefr: 'B1',
    taskDe: 'Du ziehst aus deiner Wohnung aus. Schreibe eine höfliche E-Mail an deine Vermieterin: Kündigung, Auszugstermin und Fragen zur Übergabe.',
    taskEn: 'You are moving out of your flat. Write a polite email to your landlady: notice, move-out date and questions about the handover.',
  },
  {
    id: 'w-b1-07',
    cefr: 'B1',
    taskDe: 'Soziale Medien: Fluch oder Segen? Schreibe einen kurzen Text mit zwei Vorteilen, zwei Nachteilen und deiner Meinung.',
    taskEn: 'Social media: curse or blessing? Write a short text with two advantages, two disadvantages and your own opinion.',
  },
  {
    id: 'w-b1-08',
    cefr: 'B1',
    taskDe: 'Stell dir vor, du hast einen Monat frei und unbegrenzt Geld. Wohin reist du, was machst du dort und warum genau dorthin?',
    taskEn: 'Imagine you have a month off and unlimited money. Where do you travel, what do you do there and why exactly there?',
  },
  // ---------------------------------------------------------------- B2
  {
    id: 'w-b2-01',
    cefr: 'B2',
    taskDe: 'In deiner Stadt soll die Innenstadt autofrei werden. Schreibe einen Leserkommentar mit zwei Argumenten dafür, einem dagegen und deinem Vorschlag.',
    taskEn: 'Your city plans to ban cars from the centre. Write a reader comment with two arguments in favour, one against and your own proposal.',
  },
  {
    id: 'w-b2-02',
    cefr: 'B2',
    taskDe: 'Beschreibe und interpretiere diese fiktive Statistik: 60 Prozent lesen Nachrichten nur online, 20 Prozent nur in Print, 20 Prozent beides.',
    taskEn: 'Describe and interpret this fictional statistic: 60 per cent read news online only, 20 per cent in print only, 20 per cent both.',
  },
  {
    id: 'w-b2-03',
    cefr: 'B2',
    taskDe: 'Schreibe das Anschreiben für eine Bewerbung um ein Praktikum bei einem deutschen Unternehmen: Motivation, Qualifikation, Verfügbarkeit.',
    taskEn: 'Write the cover letter for an internship application at a German company: motivation, qualifications, availability.',
  },
  {
    id: 'w-b2-04',
    cefr: 'B2',
    taskDe: 'Schreibe eine Kritik über einen Film oder ein Buch, das dich beeindruckt hat: Inhalt, Stil, Stärken, Schwächen und Empfehlung.',
    taskEn: 'Write a critique of a film or book that impressed you: content, style, strengths, weaknesses and your recommendation.',
  },
  {
    id: 'w-b2-05',
    cefr: 'B2',
    taskDe: 'Erörtere die Vor- und Nachteile des Homeoffice und beziehe am Ende klar Stellung.',
    taskEn: 'Discuss the advantages and disadvantages of working from home and take a clear position at the end.',
  },
  {
    id: 'w-b2-06',
    cefr: 'B2',
    taskDe: 'In deinem Viertel fehlen Fahrradwege. Schreibe einen formellen Brief an die Stadtverwaltung: Situation, Beschwerde und zwei konkrete Vorschläge.',
    taskEn: 'Your neighbourhood lacks cycle paths. Write a formal letter to the city administration: situation, complaint and two concrete proposals.',
  },
  {
    id: 'w-b2-07',
    cefr: 'B2',
    taskDe: 'Was hilft Neuzugezogenen am besten, in einer Stadt anzukommen: Sprache, Arbeit oder Nachbarschaft? Diskutiere mit Beispielen.',
    taskEn: 'What helps newcomers settle in a city best: language, work or neighbourhood? Discuss with examples.',
  },
  {
    id: 'w-b2-08',
    cefr: 'B2',
    taskDe: 'Fasse in eigenen Worten zusammen, warum immer mehr junge Menschen in Großstädte ziehen, und kommentiere diese Entwicklung kritisch.',
    taskEn: 'Summarise in your own words why more and more young people move to big cities, and comment critically on this trend.',
  },
  // ---------------------------------------------------------------- C1
  {
    id: 'w-c1-01',
    cefr: 'C1',
    taskDe: 'Bildung ist mehr als Berufsvorbereitung. Schreibe einen differenzierten Kommentar zu dieser These.',
    taskEn: 'Education is more than job preparation. Write a nuanced comment on this thesis.',
  },
  {
    id: 'w-c1-02',
    cefr: 'C1',
    taskDe: 'Künstliche Intelligenz verändert die Arbeitswelt. Analysiere Chancen und Risiken und formuliere eine begründete Position.',
    taskEn: 'Artificial intelligence is changing the world of work. Analyse opportunities and risks and state a reasoned position.',
  },
  {
    id: 'w-c1-03',
    cefr: 'C1',
    taskDe: 'Schreibe dieselbe Nachricht zweimal: einmal sehr formell an eine Behörde, einmal locker an eine gute Freundin (Thema: du hast einen Termin versäumt).',
    taskEn: 'Write the same message twice: once very formally to an authority, once casually to a close friend (topic: you missed an appointment).',
  },
  {
    id: 'w-c1-04',
    cefr: 'C1',
    taskDe: 'Jugendsprache, Anglizismen, geschlechtergerechte Sprache: Wie viel Wandel verträgt das Deutsche? Schreibe einen Essay.',
    taskEn: 'Youth slang, anglicisms, gender-inclusive language: How much change can German take? Write an essay.',
  },
  {
    id: 'w-c1-05',
    cefr: 'C1',
    taskDe: 'Schreibe eine kurze Rezension eines Romans deiner Wahl im Stil eines Feuilletons: Ton, Figuren, Sprache, Urteil.',
    taskEn: 'Write a short review of a novel of your choice in the style of a feuilleton: tone, characters, language, verdict.',
  },
  {
    id: 'w-c1-06',
    cefr: 'C1',
    taskDe: 'Verfasse einen offenen Brief an eine Zeitung zu einem Thema, das dir am Herzen liegt — sachlich, aber rhetorisch pointiert.',
    taskEn: 'Write an open letter to a newspaper on a cause close to your heart — factual, but rhetorically pointed.',
  },
  {
    id: 'w-c1-07',
    cefr: 'C1',
    taskDe: 'Erläutere einem breiten Publikum in klarer, präziser Sprache, warum Schlaf für das Lernen so wichtig ist.',
    taskEn: 'Explain to a general audience, in clear and precise language, why sleep is so important for learning.',
  },
  {
    id: 'w-c1-08',
    cefr: 'C1',
    taskDe: 'Eine Stadt will ein historisches Gebäude abreißen. Schreibe eine eloquente Streitschrift für den Erhalt.',
    taskEn: 'A city wants to demolish a historic building. Write an eloquent polemic in favour of preserving it.',
  },
  // ---------------------------------------------------------------- C2
  {
    id: 'w-c2-01',
    cefr: 'C2',
    taskDe: 'Wer benennt, bestimmt: Prüfe diese These über die Macht der Sprache an konkreten Beispielen.',
    taskEn: 'Whoever names a thing controls it: examine this thesis about the power of language with concrete examples.',
  },
  {
    id: 'w-c2-02',
    cefr: 'C2',
    taskDe: 'Schreibe eine satirische Kolumne über einen Alltagsärger deiner Wahl — etwa Bahnfahrten, Behördenpost oder Paketboten.',
    taskEn: 'Write a satirical column about an everyday annoyance of your choice — train journeys, official mail or parcel couriers.',
  },
  {
    id: 'w-c2-03',
    cefr: 'C2',
    taskDe: 'Übersetzen heißt angeblich verraten. Diskutiere diese Behauptung mit Beispielen aus eigener Erfahrung.',
    taskEn: 'Translating, they say, means betraying. Discuss this claim with examples from your own experience.',
  },
  {
    id: 'w-c2-04',
    cefr: 'C2',
    taskDe: 'Schreibe einen kurzen Prosatext im Stil eines Krimis — Thema: der verschwundene Regenschirm.',
    taskEn: 'Write a short prose text in the style of a crime story — topic: the vanished umbrella.',
  },
  {
    id: 'w-c2-05',
    cefr: 'C2',
    taskDe: 'Verfasse eine Polemik für ein Smartphone-Verbot für Kinder unter vierzehn — und widersprich dir danach in drei Sätzen auf überzeugende Weise.',
    taskEn: 'Write a polemic in favour of banning smartphones for children under fourteen — then contradict yourself convincingly in three sentences.',
  },
  {
    id: 'w-c2-06',
    cefr: 'C2',
    taskDe: 'Ist Langeweile eine Ressource? Schreibe einen geistreichen Essay mit einem überraschenden Schluss.',
    taskEn: 'Is boredom a resource? Write a witty essay with a surprising conclusion.',
  },
  {
    id: 'w-c2-07',
    cefr: 'C2',
    taskDe: 'Verfasse eine kurze Festrede für eine Abschlussfeier, die mit einem Bonmot endet.',
    taskEn: 'Write a short ceremonial speech for a graduation celebration that ends with a bon mot.',
  },
  {
    id: 'w-c2-08',
    cefr: 'C2',
    taskDe: 'Ist Humor kulturell übersetzbar? Beantworte die Frage im Stil eines Feuilletons mit konkreten Beispielen.',
    taskEn: 'Is humour culturally translatable? Answer the question in feuilleton style with concrete examples.',
  },
]