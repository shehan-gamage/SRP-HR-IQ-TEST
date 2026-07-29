/**
 * Item banks. SERVER ONLY.
 *
 * This module contains the answer keys and the rationales. It must never be
 * imported from a client component, or the key ships to the candidate's
 * browser DURING the sitting and the attempt is compromised. Candidate-facing
 * payloads are built by `publicItems()` in `sitting.ts`, which strips `answer`
 * and `rationale` and applies the per-sitting option shuffle.
 *
 * AFTER submission, the receipt PDF (`receipt.ts`) deliberately discloses the
 * correct answers and rationales to the candidate — a product decision. Every
 * receipt therefore carries its bank's key: refresh items periodically.
 *
 * THREE DIFFICULTY LEVELS — Basic, Advanced, Expert — each a self-contained
 * bank of 30 items, five per domain, sharing the same scoring bands and the
 * same 30-minute limit; difficulty comes from the items alone. Id ranges are
 * disjoint on purpose (1–30, 101–130, 201–230) so a stored answer can never
 * be read against the wrong bank.
 *
 * Editing wording is safe; editing MEANING is not. Stored sittings reference
 * items by id and answers by canonical option index, so never renumber ids,
 * reorder options, or change which option is correct.
 */

export type DomainCode = 'L' | 'N' | 'V' | 'S' | 'A' | 'P';

export const DOMAINS: Record<DomainCode, string> = {
  L: 'Logical / Deductive',
  N: 'Numerical',
  V: 'Verbal',
  S: 'Spatial / Visual',
  A: 'Abstract Patterns',
  P: 'Problem Solving',
};

export interface Item {
  /** Stable id. Never renumber: stored sittings reference these. */
  id: number;
  domain: DomainCode;
  stem: string;
  /** Options in canonical order. The stored answer indexes into this array. */
  options: [string, string, string, string];
  /** Index into `options` of the single defensible correct answer. */
  answer: 0 | 1 | 2 | 3;
  rationale: string;
}

export type Level = 'basic' | 'advanced' | 'expert';

export const LEVELS: Level[] = ['basic', 'advanced', 'expert'];

export const LEVEL_NAMES: Record<Level, string> = {
  basic: 'Basic',
  advanced: 'Advanced',
  expert: 'Expert',
};

/* ========================= BASIC (ids 1–30) ============================== */

const BASIC_ITEMS: Item[] = [
  {
    id: 1, domain: 'N',
    stem: 'Which number comes next in the series: 3, 6, 9, 12, ?',
    options: ['13', '15', '14', '18'], answer: 1,
    rationale: 'The series increases by 3 at each step, so the next number is 12 + 3 = 15.',
  },
  {
    id: 2, domain: 'V',
    stem: 'Which word does not belong with the others?',
    options: ['Oak', 'Rose', 'Tulip', 'Lily'], answer: 0,
    rationale: 'An oak is a tree; a rose, a tulip and a lily are all flowers.',
  },
  {
    id: 3, domain: 'L',
    stem: 'All the boxes on Shelf 1 are red. Box K is on Shelf 1. Which statement must be true?',
    options: [
      'All red boxes are on Shelf 1',
      'Box K is red',
      'Box K is the only red box on Shelf 1',
      'Some boxes on Shelf 1 are not red',
    ], answer: 1,
    rationale:
      'Every box on Shelf 1 is red, and Box K is one of them, so Box K must be red. ' +
      'The other options reverse or overstate what the statements say.',
  },
  {
    id: 4, domain: 'A',
    stem: 'Which letter comes next in the series: A, C, E, G, ?',
    options: ['F', 'H', 'I', 'J'], answer: 2,
    rationale: 'The series skips one letter at each step. Two letters on from G is I.',
  },
  {
    id: 5, domain: 'S',
    stem: 'Identical small cubes are stacked to form a larger cube that is two cubes long on each edge. How many small cubes are used in total?',
    options: ['4', '6', '12', '8'], answer: 3,
    rationale: 'The larger cube is 2 x 2 x 2 small cubes, and 2 x 2 x 2 = 8.',
  },
  {
    id: 6, domain: 'P',
    stem: 'A machine produces 10 parts every 5 minutes. At that rate, how many parts does it produce in 30 minutes?',
    options: ['30', '60', '50', '70'], answer: 1,
    rationale: '30 minutes contains six 5-minute intervals, and 6 x 10 = 60 parts.',
  },
  {
    id: 7, domain: 'N',
    stem: 'What is 20% of 150?',
    options: ['30', '15', '25', '45'], answer: 0,
    rationale: '20% means 0.20, and 0.20 x 150 = 30.',
  },
  {
    id: 8, domain: 'V',
    stem: 'Which word is closest in meaning to "rapid"?',
    options: ['Slow', 'Quick', 'Heavy', 'Late'], answer: 1,
    rationale: '"Quick" is a direct synonym of "rapid"; none of the other words describes speed.',
  },
  {
    id: 9, domain: 'L',
    stem: 'No student in Group B passed the test. Rahim passed the test. Which statement must be true?',
    options: [
      'Rahim is not in Group B',
      'Rahim is in Group B',
      'All students in Group B passed',
      'No conclusion is possible',
    ], answer: 0,
    rationale: 'If nobody in Group B passed and Rahim passed, then Rahim cannot be in Group B.',
  },
  {
    id: 10, domain: 'A',
    stem: 'Which number comes next in the series: 2, 4, 8, 16, ?',
    options: ['24', '28', '32', '64'], answer: 2,
    rationale: 'Each term is double the one before it, so the next number is 16 x 2 = 32.',
  },
  {
    id: 11, domain: 'S',
    stem: 'A solid cube is cut once by a flat plane parallel to its base. What is the shape of the exposed cut surface?',
    options: ['Triangle', 'Circle', 'Hexagon', 'Square'], answer: 3,
    rationale: 'A cut parallel to the base has the same outline as the base, which is a square.',
  },
  {
    id: 12, domain: 'L',
    stem: 'Every delivery that arrives before 9:00 a.m. is recorded as "early". One delivery was not recorded as "early". Which statement must be true?',
    options: [
      'It arrived before 9:00 a.m.',
      'It did not arrive before 9:00 a.m.',
      'It was not delivered at all',
      'It arrived exactly at 9:00 a.m.',
    ], answer: 1,
    rationale:
      'Every delivery arriving before 9:00 a.m. is recorded as "early", so a delivery without ' +
      'that record cannot have arrived before 9:00 a.m.',
  },
  {
    id: 13, domain: 'V',
    stem: 'Bird is to nest as bee is to:',
    options: ['Hive', 'Honey', 'Flower', 'Wing'], answer: 0,
    rationale: 'A nest is where a bird lives; the matching home for a bee is a hive.',
  },
  {
    id: 14, domain: 'P',
    stem: 'Four workers build a wall in 6 days. Working at the same rate, how many days would 8 workers need to build an identical wall?',
    options: ['2', '4', '3', '12'], answer: 2,
    rationale: 'The wall is a fixed amount of work, so twice the workers finish in half the time: 6 / 2 = 3 days.',
  },
  {
    id: 15, domain: 'L',
    stem: 'X is taller than Y, and Y is taller than Z. Who is the shortest?',
    options: ['X', 'Y', 'Cannot be determined', 'Z'], answer: 3,
    rationale: 'The heights order as X > Y > Z, so Z is the shortest.',
  },
  {
    id: 16, domain: 'A',
    stem: 'Which number comes next in the series: 1, 4, 9, 16, ?',
    options: ['20', '21', '25', '36'], answer: 2,
    rationale: 'These are the squares of 1, 2, 3 and 4; the next square is 5 x 5 = 25.',
  },
  {
    id: 17, domain: 'S',
    stem: 'A square sheet of paper is folded in half, then in half again. A single hole is punched through all the layers. How many holes are there when the sheet is fully unfolded?',
    options: ['2', '4', '8', '1'], answer: 1,
    rationale: 'Two folds make 4 layers, so one punch passes through 4 layers and leaves 4 holes.',
  },
  {
    id: 18, domain: 'N',
    stem: 'What is the average of 12, 15, 18, 21 and 24?',
    options: ['18', '15', '17', '20'], answer: 0,
    rationale: 'The five numbers add up to 90, and 90 / 5 = 18.',
  },
  {
    id: 19, domain: 'V',
    stem: 'Which word is most nearly opposite in meaning to "expand"?',
    options: ['Grow', 'Stretch', 'Shrink', 'Widen'], answer: 2,
    rationale: '"Shrink" is the opposite of "expand"; the other three mean roughly the same as "expand".',
  },
  {
    id: 20, domain: 'P',
    stem: 'A tank holds 200 litres and already contains 50 litres. Water flows in at 5 litres per minute. How many minutes will it take to fill the tank?',
    options: ['20', '40', '50', '30'], answer: 3,
    rationale: 'The tank needs another 150 litres, and 150 / 5 = 30 minutes.',
  },
  {
    id: 21, domain: 'L',
    stem: 'Five people stand in a queue, numbered from position 1 at the front to position 5 at the back. R is last, P is third, and P stands immediately in front of Q. Who is fourth?',
    options: ['P', 'Q', 'R', 'Cannot be determined'], answer: 1,
    rationale: 'P is third and Q stands immediately behind P, so Q is fourth; R is fifth.',
  },
  {
    id: 22, domain: 'N',
    stem: 'A sum of 240 is divided between two people in the ratio 3 : 5. What is the smaller share?',
    options: ['90', '80', '96', '150'], answer: 0,
    rationale: 'The ratio has 8 parts, so each part is 240 / 8 = 30. The smaller share is 3 x 30 = 90.',
  },
  {
    id: 23, domain: 'A',
    stem: 'Which number comes next in the series: 3, 7, 15, 31, ?',
    options: ['47', '55', '62', '63'], answer: 3,
    rationale:
      'Each term is double the previous term plus 1, so the next is 31 x 2 + 1 = 63. ' +
      '(Equivalently, the gaps 4, 8 and 16 double at each step.)',
  },
  {
    id: 24, domain: 'S',
    stem: 'A large cube, 3 units along each edge, is painted on all its outer surfaces and then cut into 27 unit cubes. How many of the unit cubes have paint on exactly three faces?',
    options: ['4', '6', '8', '12'], answer: 2,
    rationale: 'Only the corner cubes are painted on three faces, and a cube has 8 corners.',
  },
  {
    id: 25, domain: 'V',
    stem: 'Read the following policy:\n"A company offers free training to all employees who have completed one year of service. Employees with less than one year of service may attend only with their manager’s approval."\nWhich statement must be true?',
    options: [
      'An employee with 8 months of service can never attend',
      'An employee with 2 years of service may attend without manager approval',
      'Manager approval is required for every employee',
      'Training is offered only once each year',
    ], answer: 1,
    rationale:
      'Completing one year of service guarantees free training, so an employee with two years ' +
      'of service needs no approval. Approval is required only of those with under one year.',
  },
  {
    id: 26, domain: 'P',
    stem: 'Machine A produces 120 units per hour and Machine B produces 80 units per hour. Working together from the start, how many hours do they need to produce 1,000 units?',
    options: ['5', '4', '6', '8'], answer: 0,
    rationale: 'Together the machines produce 200 units per hour, and 1,000 / 200 = 5 hours.',
  },
  {
    id: 27, domain: 'A',
    stem: 'Which letter comes next in the series: B, D, G, K, ?',
    options: ['M', 'N', 'O', 'P'], answer: 3,
    rationale: 'The gaps grow by one letter at each step: +2, +3, +4, then +5. Five letters on from K is P.',
  },
  {
    id: 28, domain: 'N',
    stem: 'A price is increased by 10%, and the new price is then decreased by 10%. Compared with the original, the final price is:',
    options: ['Unchanged', '1% higher', '1% lower', '2% lower'], answer: 2,
    rationale: 'The two changes multiply: 1.10 x 0.90 = 0.99, which is 1% below the original price.',
  },
  {
    id: 29, domain: 'S',
    stem: 'You are facing north. You turn 90 degrees to your right, then 180 degrees, then 90 degrees to your right again. Which direction are you facing now?',
    options: ['North', 'East', 'South', 'West'], answer: 0,
    rationale: 'Starting from north, the three turns leave you facing east, then west, then north again.',
  },
  {
    id: 30, domain: 'P',
    stem: 'A team of 6 people can complete a task in 12 days. After 4 days of work, 2 people leave the team. Working at the same individual rate, how many more days does the remaining team need to finish the task?',
    options: ['8', '10', '16', '12'], answer: 3,
    rationale:
      'The task is 6 x 12 = 72 person-days of work. The first 4 days use 24 of them, leaving 48 ' +
      'person-days for the remaining 4 people: 48 / 4 = 12 days.',
  },
];

/* ======================= ADVANCED (ids 101–130) ========================== */

const ADVANCED_ITEMS: Item[] = [
  {
    id: 101, domain: 'L',
    stem: 'In a certain code, BLUE is written as CMVF. How is GREEN written in the same code?',
    options: ['HSFFO', 'HSEFO', 'GSFFN', 'HRFFO'], answer: 0,
    rationale: 'Each letter moves one step forward in the alphabet: G→H, R→S, E→F, E→F, N→O gives HSFFO.',
  },
  {
    id: 102, domain: 'L',
    stem: 'All managers in the firm are engineers. Which statement must be true?',
    options: [
      'Some engineers are managers',
      'Some managers are not engineers',
      'All engineers are managers',
      'No consultant is an engineer',
    ], answer: 0,
    rationale: 'If every manager is an engineer, then the managers themselves are engineers who are managers.',
  },
  {
    id: 103, domain: 'L',
    stem: 'Anna is older than Ben but younger than Carla. Dev is older than Carla, and Erin is younger than Ben. Who is the middle one of the five in age?',
    options: ['Ben', 'Carla', 'Anna', 'Dev'], answer: 2,
    rationale: 'The ages order as Dev > Carla > Anna > Ben > Erin, which places Anna in the middle.',
  },
  {
    id: 104, domain: 'L',
    stem: 'The security system arms itself only when the alarm is set and the door is locked. Tonight the system did not arm. Which statement must be true?',
    options: [
      'The alarm was not set',
      'The door was not locked',
      'At least one of the two conditions was not met',
      'Both conditions were met',
    ], answer: 2,
    rationale:
      'Arming requires both conditions together. If the system did not arm, at least one of the two ' +
      'failed — but the statements alone cannot tell you which.',
  },
  {
    id: 105, domain: 'L',
    stem: 'Five runners finish a race. J finishes before K but after L. M finishes before L, and N finishes after K. Who wins the race?',
    options: ['L', 'M', 'J', 'K'], answer: 1,
    rationale: 'The finishing order is M, L, J, K, N — so M wins.',
  },
  {
    id: 106, domain: 'N',
    stem: 'A laptop priced at 80,000 is sold at a 15% discount. What is the sale price?',
    options: ['68,000', '65,000', '72,000', '70,000'], answer: 0,
    rationale: 'A 15% discount leaves 85% of the price: 80,000 x 0.85 = 68,000.',
  },
  {
    id: 107, domain: 'N',
    stem: 'If 3x - 7 = 20, what is the value of 2x + 5?',
    options: ['21', '23', '19', '25'], answer: 1,
    rationale: 'From 3x - 7 = 20, x = 9. Then 2 x 9 + 5 = 23.',
  },
  {
    id: 108, domain: 'N',
    stem: 'A car travels 240 km in the first 3 hours and 200 km in the next 2 hours. What is its average speed for the whole journey?',
    options: ['85 km/h', '90 km/h', '88 km/h', '92 km/h'], answer: 2,
    rationale: 'The car covers 440 km in 5 hours, and 440 / 5 = 88 km/h.',
  },
  {
    id: 109, domain: 'N',
    stem: 'The ratio of men to women in an office is 5 : 3. If there are 24 women, how many people work in the office altogether?',
    options: ['40', '56', '64', '72'], answer: 2,
    rationale: '24 women over 3 ratio parts means each part is 8, so there are 40 men and 64 people in total.',
  },
  {
    id: 110, domain: 'N',
    stem: "A worker's salary rises from 50,000 to 57,500. What is the percentage increase?",
    options: ['12%', '15%', '17.5%', '20%'], answer: 1,
    rationale: 'The rise is 7,500 on a base of 50,000, and 7,500 / 50,000 = 15%.',
  },
  {
    id: 111, domain: 'V',
    stem: 'Which word is closest in meaning to "concise"?',
    options: ['Brief', 'Detailed', 'Vague', 'Lengthy'], answer: 0,
    rationale: '"Concise" means expressed in few words, which matches "brief".',
  },
  {
    id: 112, domain: 'V',
    stem: 'Which word is most nearly opposite in meaning to "reluctant"?',
    options: ['Hesitant', 'Eager', 'Careful', 'Anxious'], answer: 1,
    rationale: '"Reluctant" means unwilling; its opposite is "eager". "Hesitant" is a near-synonym.',
  },
  {
    id: 113, domain: 'V',
    stem: 'Author is to novel as sculptor is to:',
    options: ['Statue', 'Chisel', 'Stone', 'Gallery'], answer: 0,
    rationale:
      'An author creates a novel; a sculptor creates a statue. A chisel is the tool and stone is ' +
      'the material, not the finished work.',
  },
  {
    id: 114, domain: 'V',
    stem: 'Which word does not belong with the others?',
    options: ['Whisper', 'Murmur', 'Mutter', 'Shout'], answer: 3,
    rationale: 'Whispering, murmuring and muttering are all quiet ways of speaking; shouting is loud.',
  },
  {
    id: 115, domain: 'V',
    stem: 'Read the following policy:\n"Refunds are issued only for items returned within 14 days with a receipt. Store credit may be offered for later returns at the manager’s discretion."\nWhich statement must be true?',
    options: [
      'An item returned after 14 days can never be accepted',
      'A refund requires both a receipt and return within 14 days',
      'Store credit is guaranteed for late returns',
      'A receipt is unnecessary if the item is faulty',
    ], answer: 1,
    rationale:
      '"Only" makes both conditions necessary for a refund. Store credit for late returns is ' +
      'discretionary, not guaranteed.',
  },
  {
    id: 116, domain: 'S',
    stem: 'A cube is unfolded into a cross-shaped net, with face X at the centre of the cross. When the cube is folded back up, how many faces share an edge with X?',
    options: ['3', '4', '5', '2'], answer: 1,
    rationale: 'The four arms of the cross fold up around the centre face; the remaining face sits opposite X.',
  },
  {
    id: 117, domain: 'S',
    stem: 'A rectangular box measures 4 units by 3 units by 2 units. How many 1-unit cubes fit inside it exactly?',
    options: ['20', '22', '24', '26'], answer: 2,
    rationale: 'The box holds 4 x 3 x 2 = 24 unit cubes.',
  },
  {
    id: 118, domain: 'S',
    stem: 'You walk 3 km north, then 4 km east, then 3 km south. How far are you from your starting point?',
    options: ['10 km', '4 km', '6 km', '5 km'], answer: 1,
    rationale: 'The northward and southward legs cancel out, leaving you 4 km east of the start.',
  },
  {
    id: 119, domain: 'S',
    stem: 'A clock shows 3:30. What is the angle between the hour hand and the minute hand?',
    options: ['90 degrees', '75 degrees', '60 degrees', '105 degrees'], answer: 1,
    rationale:
      'At 3:30 the minute hand points at 180 degrees and the hour hand is halfway between 3 and 4, ' +
      'at 105 degrees. The difference is 75 degrees.',
  },
  {
    id: 120, domain: 'S',
    stem: 'A large cube, 3 units along each edge, is painted on all its outer surfaces and then cut into 27 unit cubes. How many of the unit cubes have paint on exactly two faces?',
    options: ['6', '8', '12', '10'], answer: 2,
    rationale: 'Exactly two painted faces occur on the edge cubes (not corners), and a cube has 12 edges.',
  },
  {
    id: 121, domain: 'A',
    stem: 'Which number comes next in the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '36'], answer: 1,
    rationale: 'The gaps grow by 2 each step: +4, +6, +8, +10, so the next gap is +12 and 30 + 12 = 42.',
  },
  {
    id: 122, domain: 'A',
    stem: 'Which number comes next in the series: 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '15'], answer: 2,
    rationale: 'Each term is the sum of the two before it, so the next is 5 + 8 = 13.',
  },
  {
    id: 123, domain: 'A',
    stem: 'Which pair comes next in the series: AZ, BY, CX, ?',
    options: ['DW', 'DV', 'EW', 'DX'], answer: 0,
    rationale:
      'The first letters run forward from A while the second letters run backward from Z, ' +
      'so the next pair is D with W.',
  },
  {
    id: 124, domain: 'A',
    stem: 'Which number comes next in the series: 5, 10, 8, 16, 14, 28, ?',
    options: ['30', '24', '26', '32'], answer: 2,
    rationale: 'The series alternates between doubling and subtracting 2, so the next term is 28 - 2 = 26.',
  },
  {
    id: 125, domain: 'A',
    stem: 'Which number comes next in the series: 81, 27, 9, 3, ?',
    options: ['0', '1', '3', '2'], answer: 1,
    rationale: 'Each term is a third of the one before it, and 3 / 3 = 1.',
  },
  {
    id: 126, domain: 'P',
    stem: 'A project needs 180 hours of work. Two employees each work on it for 6 hours a day. How many days does the project take?',
    options: ['12', '18', '15', '20'], answer: 2,
    rationale: 'Together they contribute 12 hours a day, and 180 / 12 = 15 days.',
  },
  {
    id: 127, domain: 'P',
    stem: 'A shop buys an item for 400, marks the price up by 25%, then sells it at 10% off the marked price. What is the final sale price?',
    options: ['440', '450', '460', '475'], answer: 1,
    rationale: 'The marked price is 400 x 1.25 = 500, and 10% off gives 500 x 0.90 = 450.',
  },
  {
    id: 128, domain: 'P',
    stem: 'Pipe A fills a tank in 6 hours and pipe B fills the same tank in 3 hours. With both pipes open, how long does the tank take to fill?',
    options: ['2 hours', '2.5 hours', '3 hours', '4.5 hours'], answer: 0,
    rationale: 'The combined rate is 1/6 + 1/3 = 1/2 of the tank per hour, so it fills in 2 hours.',
  },
  {
    id: 129, domain: 'P',
    stem: 'A train 200 metres long passes a signal post in 10 seconds. What is its speed in kilometres per hour?',
    options: ['60 km/h', '66 km/h', '72 km/h', '80 km/h'], answer: 2,
    rationale: '200 metres in 10 seconds is 20 m/s, and 20 x 3.6 = 72 km/h.',
  },
  {
    id: 130, domain: 'P',
    stem: 'An investment of 20,000 earns 8% simple interest per year. What is its total value after 3 years?',
    options: ['24,800', '25,194', '24,000', '23,600'], answer: 0,
    rationale: 'Simple interest is 20,000 x 0.08 x 3 = 4,800, giving a total of 24,800.',
  },
];

/* ======================== EXPERT (ids 201–230) =========================== */

const EXPERT_ITEMS: Item[] = [
  {
    id: 201, domain: 'L',
    stem: 'All A are B. No B is C. Which statement must be true?',
    options: ['No A is C', 'Some A are C', 'All C are A', 'Some C are B'], answer: 0,
    rationale: 'Every A is inside B, and B shares nothing with C, so no A can be a C.',
  },
  {
    id: 202, domain: 'L',
    stem: 'In a code language, PLANT is written as QNDRY. Using the same rule, how is GREAT written?',
    options: ['HTHEY', 'HTGDY', 'HSHDY', 'ITHEY'], answer: 0,
    rationale:
      'The letters shift by +1, +2, +3, +4, +5 in turn: G→H, R→T, E→H, A→E, T→Y gives HTHEY.',
  },
  {
    id: 203, domain: 'L',
    stem: 'At least one of the following is true: the report was submitted late, or the data was incomplete. The report was submitted on time. Which statement must be true?',
    options: [
      'The data was incomplete',
      'The data was complete',
      'The report was rejected',
      'Neither statement is true',
    ], answer: 0,
    rationale: 'One of the two must hold. The report being on time rules out the first, so the data was incomplete.',
  },
  {
    id: 204, domain: 'L',
    stem: 'Five boxes are stacked in a single column. White is on top. Yellow is above Red but not on top. Red is above Green, and Blue is directly below Green. Which box is in the middle of the stack?',
    options: ['Green', 'Red', 'Yellow', 'Blue'], answer: 1,
    rationale:
      'The only order satisfying every condition is White, Yellow, Red, Green, Blue from top to ' +
      'bottom, which puts Red in the middle.',
  },
  {
    id: 205, domain: 'L',
    stem: 'If A attends the meeting, then B attends. If B attends, then C does not attend. C attended the meeting. Which statement must be true?',
    options: ['B attended', 'A did not attend', 'A attended', 'Nothing can be concluded'], answer: 1,
    rationale:
      'C attending means B did not (otherwise C would have stayed away), and B missing means A ' +
      'did not attend either.',
  },
  {
    id: 206, domain: 'N',
    stem: 'The product of two consecutive even numbers is 168. What is their sum?',
    options: ['24', '26', '28', '30'], answer: 1,
    rationale: 'The numbers are 12 and 14, since 12 x 14 = 168, and 12 + 14 = 26.',
  },
  {
    id: 207, domain: 'N',
    stem: 'A price is reduced by 20%, and the reduced price is later cut by a further 25%. What single percentage reduction is equivalent to the two cuts?',
    options: ['45%', '40%', '35%', '55%'], answer: 1,
    rationale: 'The price becomes 0.80 x 0.75 = 0.60 of the original, a reduction of 40%.',
  },
  {
    id: 208, domain: 'N',
    stem: 'A deposit of 10,000 earns 10% interest per year, compounded annually. What is its value after 2 years?',
    options: ['12,000', '12,100', '12,500', '11,900'], answer: 1,
    rationale: 'Compounding gives 10,000 x 1.10 x 1.10 = 12,100.',
  },
  {
    id: 209, domain: 'N',
    stem: 'The average of five numbers is 42. When a sixth number is added, the average rises to 45. What is the sixth number?',
    options: ['58', '54', '60', '62'], answer: 2,
    rationale: 'The totals are 6 x 45 = 270 and 5 x 42 = 210, so the sixth number is 270 - 210 = 60.',
  },
  {
    id: 210, domain: 'N',
    stem: 'If x : y = 4 : 5 and y : z = 3 : 2, what is x : z?',
    options: ['6 : 5', '5 : 6', '4 : 2', '2 : 1'], answer: 0,
    rationale: 'Scaling both ratios to y = 15 gives x : y : z = 12 : 15 : 10, so x : z = 12 : 10 = 6 : 5.',
  },
  {
    id: 211, domain: 'V',
    stem: 'Which word is closest in meaning to "pragmatic"?',
    options: ['Practical', 'Idealistic', 'Stubborn', 'Cautious'], answer: 0,
    rationale: '"Pragmatic" means guided by practical considerations rather than theory.',
  },
  {
    id: 212, domain: 'V',
    stem: 'Which word is most nearly opposite in meaning to "scarce"?',
    options: ['Rare', 'Abundant', 'Limited', 'Precious'], answer: 1,
    rationale: '"Scarce" means in short supply; its opposite is "abundant". "Rare" is a near-synonym.',
  },
  {
    id: 213, domain: 'V',
    stem: 'Mitigate is to severity as accelerate is to:',
    options: ['Speed', 'Delay', 'Distance', 'Caution'], answer: 0,
    rationale: 'To mitigate is to change severity; to accelerate is to change speed.',
  },
  {
    id: 214, domain: 'V',
    stem: 'Which word does not belong with the others?',
    options: ['Transient', 'Fleeting', 'Momentary', 'Permanent'], answer: 3,
    rationale: 'Transient, fleeting and momentary all describe things that pass quickly; permanent is the opposite.',
  },
  {
    id: 215, domain: 'V',
    stem: 'Read the following policy:\n"All staff must complete security training annually. Staff who handle client data must additionally complete privacy training every six months. Nadia handles client data."\nWhich statement must be true?',
    options: [
      'Nadia completes only privacy training',
      'Nadia must complete both security and privacy training',
      'Privacy training replaces security training for Nadia',
      'Nadia trains less often than other staff',
    ], answer: 1,
    rationale:
      'The security requirement applies to all staff, and the privacy requirement applies ' +
      'additionally to data handlers like Nadia — so she must complete both.',
  },
  {
    id: 216, domain: 'S',
    stem: 'A large cube, 4 units along each edge, is painted on all its outer surfaces and then cut into 64 unit cubes. How many of the unit cubes have no paint at all?',
    options: ['4', '16', '8', '12'], answer: 2,
    rationale: 'The unpainted cubes form the hidden inner core, which is 2 x 2 x 2 = 8 cubes.',
  },
  {
    id: 217, domain: 'S',
    stem: 'A standard die (opposite faces add up to 7) rests with 1 on top and 2 facing north. The die is tipped over once towards the north. Which number is now on top?',
    options: ['5', '2', '6', '3'], answer: 0,
    rationale:
      'Tipping north rolls the top face away to the north side and brings the south face up. ' +
      'The south face is opposite 2, which is 7 - 2 = 5.',
  },
  {
    id: 218, domain: 'S',
    stem: 'A clock runs for 90 minutes. Through what angle does the hour hand move in that time?',
    options: ['30 degrees', '45 degrees', '90 degrees', '60 degrees'], answer: 1,
    rationale: 'The hour hand moves 360 degrees in 12 hours — half a degree per minute — so 90 x 0.5 = 45 degrees.',
  },
  {
    id: 219, domain: 'S',
    stem: 'You walk 5 km east and then 12 km north. How far are you, in a straight line, from your starting point?',
    options: ['17 km', '13 km', '12 km', '15 km'], answer: 1,
    rationale: 'The legs form a right angle, and the square root of 5 x 5 + 12 x 12 = 169 is 13 km.',
  },
  {
    id: 220, domain: 'S',
    stem: 'A square sheet of paper is folded in half three times, and a single hole is punched through all the layers. How many holes are there when the sheet is fully unfolded?',
    options: ['6', '8', '4', '16'], answer: 1,
    rationale: 'Three folds make 2 x 2 x 2 = 8 layers, so one punch leaves 8 holes.',
  },
  {
    id: 221, domain: 'A',
    stem: 'Which number comes next in the series: 4, 9, 19, 39, 79, ?',
    options: ['158', '159', '157', '160'], answer: 1,
    rationale: 'Each term is double the previous term plus 1, so the next is 79 x 2 + 1 = 159.',
  },
  {
    id: 222, domain: 'A',
    stem: 'Which number comes next in the series: 2, 3, 5, 7, 11, 13, ?',
    options: ['15', '16', '17', '19'], answer: 2,
    rationale: 'These are the prime numbers in order, and the next prime after 13 is 17.',
  },
  {
    id: 223, domain: 'A',
    stem: 'Which letter comes next in the series: A, C, F, J, O, ?',
    options: ['T', 'U', 'V', 'S'], answer: 1,
    rationale: 'The gaps grow by one letter each step: +2, +3, +4, +5, then +6. Six letters on from O is U.',
  },
  {
    id: 224, domain: 'A',
    stem: 'Which number comes next in the series: 3, 4, 8, 17, 33, ?',
    options: ['58', '54', '60', '49'], answer: 0,
    rationale: 'The gaps are the square numbers 1, 4, 9 and 16, so the next gap is 25 and 33 + 25 = 58.',
  },
  {
    id: 225, domain: 'A',
    stem: 'Which number comes next in the series: 7, 21, 18, 54, 51, ?',
    options: ['153', '147', '156', '150'], answer: 0,
    rationale: 'The series alternates between multiplying by 3 and subtracting 3, so the next term is 51 x 3 = 153.',
  },
  {
    id: 226, domain: 'P',
    stem: 'Asha can finish a job alone in 10 days; Ben can finish it alone in 15 days. They work together for 4 days, then Asha leaves. How many more days does Ben need to finish the job?',
    options: ['4', '5', '6', '7.5'], answer: 1,
    rationale:
      'Together they complete 1/10 + 1/15 = 1/6 of the job per day, so 4 days finishes 2/3 of it. ' +
      'The remaining 1/3 at Ben’s rate of 1/15 per day takes 5 days.',
  },
  {
    id: 227, domain: 'P',
    stem: 'An inlet pipe fills a tank in 4 hours, and a drain empties the full tank in 6 hours. If both are open and the tank starts empty, how long does the tank take to fill?',
    options: ['10 hours', '12 hours', '8 hours', '14 hours'], answer: 1,
    rationale: 'The net rate is 1/4 - 1/6 = 1/12 of the tank per hour, so it fills in 12 hours.',
  },
  {
    id: 228, domain: 'P',
    stem: 'A trader sells two items at 240 each — one at a 20% profit and the other at a 20% loss. What is the overall result?',
    options: ['No profit, no loss', 'A loss of 20', 'A profit of 20', 'A loss of 40'], answer: 1,
    rationale:
      'The items cost 240 / 1.2 = 200 and 240 / 0.8 = 300, a total of 500 against revenue of 480 — ' +
      'a loss of 20.',
  },
  {
    id: 229, domain: 'P',
    stem: 'Two trains leave the same station at the same time in opposite directions, at 90 km/h and 60 km/h. After how many minutes are they 100 km apart?',
    options: ['30', '36', '40', '45'], answer: 2,
    rationale: 'They separate at 150 km/h, and 100 / 150 of an hour is 40 minutes.',
  },
  {
    id: 230, domain: 'P',
    stem: "A machine's output doubles every year. It produced 4,000 units in its fourth year. How many units did it produce in its first year?",
    options: ['500', '1,000', '250', '400'], answer: 0,
    rationale: 'Working back three doublings from year four: 4,000 / 2 / 2 / 2 = 500 units.',
  },
];

/* ============================ Bank registry ============================== */

export interface Bank {
  level: Level;
  name: string;
  durationSec: number;
  items: Item[];
}

export const BANKS: Record<Level, Bank> = {
  basic: { level: 'basic', name: LEVEL_NAMES.basic, durationSec: 30 * 60, items: BASIC_ITEMS },
  advanced: { level: 'advanced', name: LEVEL_NAMES.advanced, durationSec: 30 * 60, items: ADVANCED_ITEMS },
  expert: { level: 'expert', name: LEVEL_NAMES.expert, durationSec: 30 * 60, items: EXPERT_ITEMS },
};

/** Resolve a stored level string to its bank; unknown/legacy values mean Basic. */
export function bankFor(level: string | null | undefined): Bank {
  return BANKS[level as Level] ?? BANKS.basic;
}

/* Back-compat: the Basic bank is the original assessment. All banks share the
   same shape (30 items, five per domain), so TOTAL_ITEMS holds for every level. */
export const ITEMS = BASIC_ITEMS;
export const TOTAL_ITEMS = BASIC_ITEMS.length;
export const DEFAULT_DURATION_SEC = BANKS.basic.durationSec;
/** Reasonable-adjustment multiplier: 25% extra time. */
export const EXTRA_TIME_MULTIPLIER = 1.25;
