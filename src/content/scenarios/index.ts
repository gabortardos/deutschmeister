import type { CefrLevel, KeyPhrase, Scenario } from '../../db/types'

/** Deterministic build stamp for seed rows (never changes per release). */
const SEED_TS = Date.UTC(2026, 8, 20, 12, 0, 0)

interface SeedScenario {
  id: string
  title: string
  cefr: CefrLevel
  emoji: string
  description: string
  goal: string
  keyPhrases: KeyPhrase[]
}

const SEED: SeedScenario[] = [
  {
    id: 's-cafe',
    title: 'Café bestellen',
    cefr: 'A1',
    emoji: '☕',
    description: 'Order a coffee and a piece of cake at a German café and pay at the end.',
    goal: 'Order a drink and something to eat, ask one question about the offer, and ask for the bill.',
    keyPhrases: [
      { de: 'Ich hätte gern einen Kaffee, bitte.', en: 'I would like a coffee, please.' },
      { de: 'Was empfehlen Sie?', en: 'What do you recommend?' },
      { de: 'Für hier oder zum Mitnehmen?', en: 'For here or to take away?' },
      { de: 'Könnte ich die Rechnung haben, bitte?', en: 'Could I have the bill, please?' },
      { de: 'Das war lecker, danke!', en: 'That was delicious, thank you!' },
    ],
  },
  {
    id: 's-baeckerei',
    title: 'In der Bäckerei',
    cefr: 'A1',
    emoji: '🥨',
    description: 'Buy bread and rolls at the bakery in the morning.',
    goal: 'Buy two items, ask what something costs, and pay by card.',
    keyPhrases: [
      { de: 'Ich möchte zwei Brötchen, bitte.', en: "I'd like two rolls, please." },
      { de: 'Was gibt es heute Frisches?', en: 'What fresh things are there today?' },
      { de: 'Wie viel kostet das Brot?', en: 'How much does the bread cost?' },
      { de: 'Nein danke, das ist alles.', en: 'No thank you, that is everything.' },
      { de: 'Kann ich mit Karte bezahlen?', en: 'Can I pay by card?' },
    ],
  },
  {
    id: 's-supermarkt',
    title: 'Im Supermarkt',
    cefr: 'A1',
    emoji: '🛒',
    description: 'Find products in the supermarket and go through the checkout.',
    goal: 'Ask where two products are, and handle a short exchange at the checkout.',
    keyPhrases: [
      { de: 'Entschuldigung, wo finde ich die Milch?', en: 'Excuse me, where do I find the milk?' },
      { de: 'Haben Sie auch laktosefreie Milch?', en: 'Do you also have lactose-free milk?' },
      { de: 'Ich suche die Kasse.', en: "I'm looking for the checkout." },
      { de: 'Ich hätte gern eine Tüte, bitte.', en: "I'd like a bag, please." },
      { de: 'Was kostet ein Kilo Äpfel?', en: 'What does a kilo of apples cost?' },
    ],
  },
  {
    id: 's-ticket',
    title: 'Ticket kaufen (Öffentliche Verkehrsmittel)',
    cefr: 'A1',
    emoji: '🚋',
    description: 'Buy a ticket for bus, tram or train and find your connection.',
    goal: 'Buy a ticket, ask when the next connection leaves, and find the platform or stop.',
    keyPhrases: [
      { de: 'Eine Fahrkarte nach Berlin, bitte.', en: 'One ticket to Berlin, please.' },
      { de: 'Wann fährt der nächste Zug?', en: 'When does the next train leave?' },
      { de: 'Muss ich umsteigen?', en: 'Do I have to change trains?' },
      { de: 'Wo ist der Bahnsteig?', en: 'Where is the platform?' },
      { de: 'Ist diese Karte auch für die Tram gültig?', en: 'Is this ticket also valid for the tram?' },
    ],
  },
  {
    id: 's-arzt',
    title: 'Arzttermin',
    cefr: 'A2',
    emoji: '🩺',
    description: 'Make a doctor’s appointment and describe your symptoms.',
    goal: 'Book an appointment, describe two symptoms and say how long you have had them, and ask about medication.',
    keyPhrases: [
      { de: 'Ich möchte einen Termin vereinbaren.', en: "I'd like to make an appointment." },
      { de: 'Ich habe seit drei Tagen Halsschmerzen.', en: "I've had a sore throat for three days." },
      { de: 'Haben Sie diese Woche noch einen freien Termin?', en: 'Do you still have a free appointment this week?' },
      { de: 'Brauche ich eine Überweisung?', en: 'Do I need a referral?' },
      { de: 'Wie oft soll ich die Tabletten nehmen?', en: 'How often should I take the tablets?' },
    ],
  },
  {
    id: 's-buergeramt',
    title: 'Bürgeramt: Anmeldung',
    cefr: 'B1',
    emoji: '🏛️',
    description: 'Register your new address at the Bürgeramt.',
    goal: 'Register your address, hand over your documents, and ask what happens next.',
    keyPhrases: [
      { de: 'Ich möchte mich anmelden.', en: 'I would like to register my address.' },
      { de: 'Hier sind mein Pass und die Wohnungsgeberbestätigung.', en: "Here are my passport and the landlord's confirmation." },
      { de: 'Brauche ich noch weitere Unterlagen?', en: 'Do I need any further documents?' },
      { de: 'Wann bekomme ich die Steueridentifikationsnummer?', en: 'When will I receive my tax ID?' },
      { de: 'Können Sie das bitte langsamer wiederholen?', en: 'Could you please repeat that more slowly?' },
    ],
  },
  {
    id: 's-nachbar',
    title: 'Nachbar small talk',
    cefr: 'A2',
    emoji: '🏠',
    description: 'Chat with your neighbour in the stairwell.',
    goal: 'Introduce yourself, ask one practical question about the building, and end the chat politely.',
    keyPhrases: [
      { de: 'Guten Tag! Wir sind die neuen Nachbarn.', en: 'Hello! We are the new neighbours.' },
      { de: 'Kann ich Sie kurz etwas fragen?', en: 'May I quickly ask you something?' },
      { de: 'Wann wird denn der Müll abgeholt?', en: 'When is the rubbish collected?' },
      { de: 'Entschuldigen Sie die Störung gestern.', en: 'Sorry about the disturbance yesterday.' },
      { de: 'Möchten Sie mal auf einen Kaffee vorbeikommen?', en: 'Would you like to come by for a coffee sometime?' },
    ],
  },
  {
    id: 's-wohnung',
    title: 'Wohnungssuche',
    cefr: 'B1',
    emoji: '🏡',
    description: 'Call about a flat advert and arrange a viewing.',
    goal: 'Ask if the flat is still available, ask about rent and conditions, and arrange a viewing.',
    keyPhrases: [
      { de: 'Ich habe Ihre Anzeige gelesen. Ist die Wohnung noch frei?', en: 'I read your ad. Is the flat still available?' },
      { de: 'Wie hoch ist die Miete ohne Nebenkosten?', en: 'What is the rent without utilities?' },
      { de: 'Wann wäre eine Besichtigung möglich?', en: 'When would a viewing be possible?' },
      { de: 'Sind Haustiere erlaubt?', en: 'Are pets allowed?' },
      { de: 'Ab wann ist die Wohnung bezugsfrei?', en: 'From when is the flat available?' },
    ],
  },
  {
    id: 's-telefon',
    title: 'Telefonieren',
    cefr: 'B1',
    emoji: '📞',
    description: 'Make a phone call and leave a message with a colleague’s office.',
    goal: 'Ask for a person, explain why you are calling, and leave a callback message.',
    keyPhrases: [
      { de: 'Guten Tag, kann ich bitte Herrn Weber sprechen?', en: 'Hello, may I speak to Mr Weber, please?' },
      { de: 'Es geht um unseren Termin am Freitag.', en: "It's about our appointment on Friday." },
      { de: 'Kann ich eine Nachricht hinterlassen?', en: 'Can I leave a message?' },
      { de: 'Er kann mich gerne morgen zurückrufen.', en: 'He is welcome to call me back tomorrow.' },
      { de: 'Ich rufe später noch einmal an.', en: "I'll call again later." },
    ],
  },
  {
    id: 's-arbeit',
    title: 'Arbeit / Besprechung',
    cefr: 'B2',
    emoji: '💼',
    description: 'Take part in a team meeting and talk about project status.',
    goal: 'Give a short project update, respond to a critical question, and agree on next steps.',
    keyPhrases: [
      { de: 'Können wir den Termin auf nächste Woche verschieben?', en: 'Can we move the meeting to next week?' },
      { de: 'Ich schicke Ihnen das Protokoll nach dem Meeting.', en: "I'll send you the minutes after the meeting." },
      { de: 'Wie ist der Stand bei dem Projekt?', en: 'What is the status of the project?' },
      { de: 'Da sehe ich noch Handlungsbedarf.', en: 'I still see a need for action there.' },
      { de: 'Fassen wir zusammen: Wer macht was bis wann?', en: 'Let us summarise: who does what by when?' },
    ],
  },
  {
    id: 's-fitness',
    title: 'Im Fitnessstudio',
    cefr: 'A2',
    emoji: '🏋️',
    description:
      'Small talk and practical questions at the gym (A2/B1): machines, duration, weights, reps and sets, training with a partner.',
    goal: 'Ask how a machine works, talk about how long you have been training, discuss sets/reps/weight, and find a training partner.',
    keyPhrases: [
      { de: 'Wie funktioniert dieses Gerät?', en: 'How does this machine work?' },
      { de: 'Kannst du mir zeigen, wie die Beinpresse funktioniert?', en: 'Can you show me how the leg press works?' },
      { de: 'Wie viel Gewicht soll ich nehmen?', en: 'How much weight should I use?' },
      { de: 'Ich mache 3 Sätze mit 12 Wiederholungen.', en: 'I do 3 sets of 12 reps.' },
      { de: 'Wie lange trainierst du schon?', en: 'How long have you been training?' },
      { de: 'Welche Muskeln trainiert dieses Gerät?', en: 'Which muscles does this machine train?' },
      { de: 'Trainierst du lieber allein oder mit einem Partner?', en: 'Do you prefer training alone or with a partner?' },
    ],
  },
]

export const SEED_SCENARIOS: Scenario[] = SEED.map((s) => ({ ...s, updatedAt: SEED_TS, custom: false }))

