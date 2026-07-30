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
 * Rationales are written for candidates: step-by-step working, intermediate
 * calculations and the key principle, not just the answer restated.
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
    rationale:
      'Look at the gap between neighbouring terms: 6 - 3 = 3, 9 - 6 = 3 and 12 - 9 = 3, so the ' +
      'series climbs by 3 at every step. Applying the same step to the last term gives 12 + 3 = 15.',
  },
  {
    id: 2, domain: 'V',
    stem: 'Which word does not belong with the others?',
    options: ['Oak', 'Rose', 'Tulip', 'Lily'], answer: 0,
    rationale:
      'Classify each word: a rose, a tulip and a lily are all flowers, while an oak is a tree. ' +
      'The odd one out is the word that does not share the group’s category — Oak.',
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
      'Apply the general rule to the specific case: every box on Shelf 1 is red, and Box K is on ' +
      'Shelf 1, so Box K must be red. The other options go beyond the given facts — nothing says ' +
      'all red boxes are on that shelf, that Box K is the only red one, or that any box there is ' +
      'not red.',
  },
  {
    id: 4, domain: 'A',
    stem: 'Which letter comes next in the series: A, C, E, G, ?',
    options: ['F', 'H', 'I', 'J'], answer: 2,
    rationale:
      'Write the alphabet positions: A(1), C(3), E(5), G(7). Each term moves two positions ' +
      'forward, skipping one letter. Two positions past G(7) is position 9, the letter I.',
  },
  {
    id: 5, domain: 'S',
    stem: 'Identical small cubes are stacked to form a larger cube that is two cubes long on each edge. How many small cubes are used in total?',
    options: ['4', '6', '12', '8'], answer: 3,
    rationale:
      'The large cube is 2 cubes long, 2 wide and 2 high. One layer holds 2 x 2 = 4 cubes, and ' +
      'there are 2 layers, so 4 x 2 = 8 cubes in total — the volume 2 x 2 x 2.',
  },
  {
    id: 6, domain: 'P',
    stem: 'A machine produces 10 parts every 5 minutes. At that rate, how many parts does it produce in 30 minutes?',
    options: ['30', '60', '50', '70'], answer: 1,
    rationale:
      'First count the 5-minute intervals in 30 minutes: 30 / 5 = 6. The machine makes 10 parts ' +
      'in each interval, so the total is 6 x 10 = 60 parts.',
  },
  {
    id: 7, domain: 'N',
    stem: 'What is 20% of 150?',
    options: ['30', '15', '25', '45'], answer: 0,
    rationale:
      'Convert the percentage to a decimal and multiply: 20% = 0.20, and 0.20 x 150 = 30. ' +
      'Quick check: 10% of 150 is 15, and 20% is double that — 30.',
  },
  {
    id: 8, domain: 'V',
    stem: 'Which word is closest in meaning to "rapid"?',
    options: ['Slow', 'Quick', 'Heavy', 'Late'], answer: 1,
    rationale:
      '"Rapid" describes speed, and "quick" means the same thing. "Slow" is its opposite, while ' +
      '"heavy" and "late" describe weight and timing, not speed.',
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
    rationale:
      'Combine the two facts: everyone in Group B failed, yet Rahim passed. If Rahim were in ' +
      'Group B he would have failed, which contradicts what we know — so he cannot be in Group B.',
  },
  {
    id: 10, domain: 'A',
    stem: 'Which number comes next in the series: 2, 4, 8, 16, ?',
    options: ['24', '28', '32', '64'], answer: 2,
    rationale:
      'Test the ratio between terms: 4 / 2 = 2, 8 / 4 = 2 and 16 / 8 = 2 — each term is double ' +
      'the one before. Doubling the last term gives 16 x 2 = 32.',
  },
  {
    id: 11, domain: 'S',
    stem: 'A solid cube is cut once by a flat plane parallel to its base. What is the shape of the exposed cut surface?',
    options: ['Triangle', 'Circle', 'Hexagon', 'Square'], answer: 3,
    rationale:
      'A cut parallel to a face keeps the cut surface the same shape as that face at every ' +
      'height. A cube’s base is a square, so the exposed surface is a square.',
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
      'The rule says: arrives before 9:00 a.m. → recorded as early. Flip it into its ' +
      'contrapositive, which is always equally true: not recorded as early → did not arrive ' +
      'before 9:00 a.m. The stronger claims — never delivered, or exactly at 9:00 — are not ' +
      'supported by anything given.',
  },
  {
    id: 13, domain: 'V',
    stem: 'Bird is to nest as bee is to:',
    options: ['Hive', 'Honey', 'Flower', 'Wing'], answer: 0,
    rationale:
      'State the first relationship in words: a nest is the home a bird lives in. Applying the ' +
      'same relationship to a bee gives its home — a hive. Honey is what it makes, a flower is ' +
      'where it feeds, and a wing is a body part.',
  },
  {
    id: 14, domain: 'P',
    stem: 'Four workers build a wall in 6 days. Working at the same rate, how many days would 8 workers need to build an identical wall?',
    options: ['2', '4', '3', '12'], answer: 2,
    rationale:
      'Measure the wall as a fixed amount of work: 4 workers x 6 days = 24 worker-days. Divide ' +
      'that same work among 8 workers: 24 / 8 = 3 days. Doubling the workforce halves the time.',
  },
  {
    id: 15, domain: 'L',
    stem: 'X is taller than Y, and Y is taller than Z. Who is the shortest?',
    options: ['X', 'Y', 'Cannot be determined', 'Z'], answer: 3,
    rationale:
      'Chain the comparisons: X > Y and Y > Z give the full order X > Y > Z. The shortest person ' +
      'is at the bottom of the chain — Z. The ordering is complete, so it can be determined.',
  },
  {
    id: 16, domain: 'A',
    stem: 'Which number comes next in the series: 1, 4, 9, 16, ?',
    options: ['20', '21', '25', '36'], answer: 2,
    rationale:
      'Recognise the square numbers: 1 = 1 x 1, 4 = 2 x 2, 9 = 3 x 3, 16 = 4 x 4. The next is ' +
      '5 x 5 = 25. (The gaps 3, 5, 7 also grow by 2, so the next gap is 9 and 16 + 9 = 25.)',
  },
  {
    id: 17, domain: 'S',
    stem: 'A square sheet of paper is folded in half, then in half again. A single hole is punched through all the layers. How many holes are there when the sheet is fully unfolded?',
    options: ['2', '4', '8', '1'], answer: 1,
    rationale:
      'Each fold doubles the layers: one fold makes 2 layers, the second makes 4. The punch ' +
      'passes through every layer, putting one hole in each, so unfolding reveals 4 holes.',
  },
  {
    id: 18, domain: 'N',
    stem: 'What is the average of 12, 15, 18, 21 and 24?',
    options: ['18', '15', '17', '20'], answer: 0,
    rationale:
      'Add the five numbers: 12 + 15 + 18 + 21 + 24 = 90, then divide by how many there are: ' +
      '90 / 5 = 18. Shortcut: in an evenly spaced list, the average is the middle value — 18.',
  },
  {
    id: 19, domain: 'V',
    stem: 'Which word is most nearly opposite in meaning to "expand"?',
    options: ['Grow', 'Stretch', 'Shrink', 'Widen'], answer: 2,
    rationale:
      '"Expand" means to become larger. "Grow", "stretch" and "widen" all also describe getting ' +
      'bigger; only "shrink" means becoming smaller, which makes it the opposite.',
  },
  {
    id: 20, domain: 'P',
    stem: 'A tank holds 200 litres and already contains 50 litres. Water flows in at 5 litres per minute. How many minutes will it take to fill the tank?',
    options: ['20', '40', '50', '30'], answer: 3,
    rationale:
      'First find how much is still missing: 200 - 50 = 150 litres. At 5 litres per minute, the ' +
      'time needed is 150 / 5 = 30 minutes. (Using the full 200 litres is the trap — the tank ' +
      'is already partly full.)',
  },
  {
    id: 21, domain: 'L',
    stem: 'Five people stand in a queue, numbered from position 1 at the front to position 5 at the back. R is last, P is third, and P stands immediately in front of Q. Who is fourth?',
    options: ['P', 'Q', 'R', 'Cannot be determined'], answer: 1,
    rationale:
      'Place the fixed people first: R is 5th and P is 3rd. "Immediately in front of" means Q is ' +
      'directly behind P, in position 4 — which is free, since R holds position 5. The remaining ' +
      'two people fill positions 1 and 2.',
  },
  {
    id: 22, domain: 'N',
    stem: 'A sum of 240 is divided between two people in the ratio 3 : 5. What is the smaller share?',
    options: ['90', '80', '96', '150'], answer: 0,
    rationale:
      'The ratio 3 : 5 has 3 + 5 = 8 equal parts, so one part is 240 / 8 = 30. The smaller share ' +
      'takes 3 parts: 3 x 30 = 90. Check: the larger share is 5 x 30 = 150, and 90 + 150 = 240.',
  },
  {
    id: 23, domain: 'A',
    stem: 'Which number comes next in the series: 3, 7, 15, 31, ?',
    options: ['47', '55', '62', '63'], answer: 3,
    rationale:
      'Test the rule "double and add one": 3 x 2 + 1 = 7, 7 x 2 + 1 = 15, 15 x 2 + 1 = 31 — it ' +
      'fits every step. So the next term is 31 x 2 + 1 = 63. (Equivalently, the gaps 4, 8, 16 ' +
      'double each time, giving a next gap of 32: 31 + 32 = 63.)',
  },
  {
    id: 24, domain: 'S',
    stem: 'A large cube, 3 units along each edge, is painted on all its outer surfaces and then cut into 27 unit cubes. How many of the unit cubes have paint on exactly three faces?',
    options: ['4', '6', '8', '12'], answer: 2,
    rationale:
      'A small cube shows three painted faces only where three outer surfaces of the big cube ' +
      'meet — at its corners. A cube has exactly 8 corners, so 8 unit cubes carry paint on three ' +
      'faces, whatever the cube’s size.',
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
      'The policy grants free training to everyone past one year of service. An employee with ' +
      '2 years has completed one year, so they attend without approval — approval binds only ' +
      'those under one year. Option A fails because an 8-month employee CAN attend with ' +
      'approval; C applies the approval rule to everyone, which the policy does not; D talks ' +
      'about frequency, which the policy never mentions.',
  },
  {
    id: 26, domain: 'P',
    stem: 'Machine A produces 120 units per hour and Machine B produces 80 units per hour. Working together from the start, how many hours do they need to produce 1,000 units?',
    options: ['5', '4', '6', '8'], answer: 0,
    rationale:
      'Add the rates first: together the machines make 120 + 80 = 200 units per hour. ' +
      'Time = amount / rate: 1,000 / 200 = 5 hours.',
  },
  {
    id: 27, domain: 'A',
    stem: 'Which letter comes next in the series: B, D, G, K, ?',
    options: ['M', 'N', 'O', 'P'], answer: 3,
    rationale:
      'Convert to alphabet positions: B(2), D(4), G(7), K(11). The gaps are +2, +3, +4 — each ' +
      'one letter wider than the last — so the next gap is +5. Position 11 + 5 = 16, the letter P.',
  },
  {
    id: 28, domain: 'N',
    stem: 'A price is increased by 10%, and the new price is then decreased by 10%. Compared with the original, the final price is:',
    options: ['Unchanged', '1% higher', '1% lower', '2% lower'], answer: 2,
    rationale:
      'Work it through on 100: a 10% rise gives 110; a 10% cut then removes 11 (10% of 110), ' +
      'leaving 99. The final price is 99% of the original — 1% lower. The changes do not cancel ' +
      'because the decrease acts on a larger number than the increase did.',
  },
  {
    id: 29, domain: 'S',
    stem: 'You are facing north. You turn 90 degrees to your right, then 180 degrees, then 90 degrees to your right again. Which direction are you facing now?',
    options: ['North', 'East', 'South', 'West'], answer: 0,
    rationale:
      'Track the facing one turn at a time: start north; a 90-degree right turn points you ' +
      'east; a 180-degree turn reverses you to west; a final 90-degree right turn points you ' +
      'north again.',
  },
  {
    id: 30, domain: 'P',
    stem: 'A team of 6 people can complete a task in 12 days. After 4 days of work, 2 people leave the team. Working at the same individual rate, how many more days does the remaining team need to finish the task?',
    options: ['8', '10', '16', '12'], answer: 3,
    rationale:
      'Measure the task in person-days: 6 x 12 = 72. The first 4 days use 6 x 4 = 24 of them, ' +
      'leaving 72 - 24 = 48 person-days. The remaining 4 people supply 4 person-days per day, ' +
      'so they need 48 / 4 = 12 more days.',
  },
];

/* ======================= ADVANCED (ids 101–130) ========================== */

const ADVANCED_ITEMS: Item[] = [
  {
    id: 101, domain: 'L',
    stem: 'In a certain code, BLUE is written as CMVF. How is GREEN written in the same code?',
    options: ['HSFFO', 'HSEFO', 'GSFFN', 'HRFFO'], answer: 0,
    rationale:
      'Compare the example letter by letter: B→C, L→M, U→V, E→F — every ' +
      'letter moves one step forward in the alphabet. Apply the same +1 shift to GREEN: ' +
      'G→H, R→S, E→F, E→F, N→O, spelling HSFFO.',
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
    rationale:
      '"All managers are engineers" places the managers entirely inside the engineers group — ' +
      'so those managers are engineers who are managers, meaning some engineers are managers. ' +
      'Reversing it to "all engineers are managers" does not follow (there may be engineers who ' +
      'manage nothing), and consultants are never mentioned.',
  },
  {
    id: 103, domain: 'L',
    stem: 'Anna is older than Ben but younger than Carla. Dev is older than Carla, and Erin is younger than Ben. Who is the middle one of the five in age?',
    options: ['Ben', 'Carla', 'Anna', 'Dev'], answer: 2,
    rationale:
      'Turn each clue into an ordering: Carla > Anna, Anna > Ben, Dev > Carla, Ben > Erin. ' +
      'Chained together: Dev > Carla > Anna > Ben > Erin. With five people fully ordered, the ' +
      'middle (third) position belongs to Anna.',
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
      'Arming requires BOTH conditions together. Since the system did not arm, the pair cannot ' +
      'both have held — at least one failed. But the facts cannot tell you WHICH: it could be ' +
      'the alarm, the door, or both. That is why the specific options A and B are not forced, ' +
      'and only the "at least one" statement must be true.',
  },
  {
    id: 105, domain: 'L',
    stem: 'Five runners finish a race. J finishes before K but after L. M finishes before L, and N finishes after K. Who wins the race?',
    options: ['L', 'M', 'J', 'K'], answer: 1,
    rationale:
      'Convert each clue to an order: L before J, J before K (from the first sentence), M ' +
      'before L, and K before N. Chained: M, L, J, K, N. Everyone else finishes behind M, so ' +
      'M wins.',
  },
  {
    id: 106, domain: 'N',
    stem: 'A laptop priced at 80,000 is sold at a 15% discount. What is the sale price?',
    options: ['68,000', '65,000', '72,000', '70,000'], answer: 0,
    rationale:
      'A 15% discount means paying 100% - 15% = 85% of the price: 80,000 x 0.85 = 68,000. ' +
      'Check by parts: 10% of 80,000 is 8,000 and 5% is 4,000, so the discount is 12,000 and ' +
      '80,000 - 12,000 = 68,000.',
  },
  {
    id: 107, domain: 'N',
    stem: 'If 3x - 7 = 20, what is the value of 2x + 5?',
    options: ['21', '23', '19', '25'], answer: 1,
    rationale:
      'Solve for x first: add 7 to both sides (3x = 27), then divide by 3 (x = 9). Now evaluate ' +
      'the requested expression: 2 x 9 + 5 = 18 + 5 = 23.',
  },
  {
    id: 108, domain: 'N',
    stem: 'A car travels 240 km in the first 3 hours and 200 km in the next 2 hours. What is its average speed for the whole journey?',
    options: ['85 km/h', '90 km/h', '88 km/h', '92 km/h'], answer: 2,
    rationale:
      'Average speed is TOTAL distance over TOTAL time — not the average of the two speeds. ' +
      'Distance: 240 + 200 = 440 km. Time: 3 + 2 = 5 hours. 440 / 5 = 88 km/h. (Averaging ' +
      '80 km/h and 100 km/h to get 90 ignores that the car spent longer at the slower speed.)',
  },
  {
    id: 109, domain: 'N',
    stem: 'The ratio of men to women in an office is 5 : 3. If there are 24 women, how many people work in the office altogether?',
    options: ['40', '56', '64', '72'], answer: 2,
    rationale:
      'Women hold 3 ratio parts, and 24 women / 3 parts = 8 people per part. Men hold 5 parts: ' +
      '5 x 8 = 40. Altogether: 40 men + 24 women = 64 people.',
  },
  {
    id: 110, domain: 'N',
    stem: "A worker's salary rises from 50,000 to 57,500. What is the percentage increase?",
    options: ['12%', '15%', '17.5%', '20%'], answer: 1,
    rationale:
      'Percentage increase = rise / ORIGINAL x 100. The rise is 57,500 - 50,000 = 7,500, and ' +
      '7,500 / 50,000 = 0.15, i.e. 15%. The base is always the original salary, not the new one.',
  },
  {
    id: 111, domain: 'V',
    stem: 'Which word is closest in meaning to "concise"?',
    options: ['Brief', 'Detailed', 'Vague', 'Lengthy'], answer: 0,
    rationale:
      '"Concise" means expressing much in few words — the same idea as "brief". "Detailed" and ' +
      '"lengthy" point the opposite way, and "vague" concerns clarity, not length.',
  },
  {
    id: 112, domain: 'V',
    stem: 'Which word is most nearly opposite in meaning to "reluctant"?',
    options: ['Hesitant', 'Eager', 'Careful', 'Anxious'], answer: 1,
    rationale:
      '"Reluctant" means unwilling to act; its opposite is being keen to act — "eager". ' +
      '"Hesitant" is the trap: it is a near-synonym of reluctant, not its opposite.',
  },
  {
    id: 113, domain: 'V',
    stem: 'Author is to novel as sculptor is to:',
    options: ['Statue', 'Chisel', 'Stone', 'Gallery'], answer: 0,
    rationale:
      'Make the relationship explicit: an author is the maker, a novel is the finished work. ' +
      'A sculptor’s finished work is a statue. The chisel is the tool, stone is the raw ' +
      'material and a gallery is the venue — none of them is the product.',
  },
  {
    id: 114, domain: 'V',
    stem: 'Which word does not belong with the others?',
    options: ['Whisper', 'Murmur', 'Mutter', 'Shout'], answer: 3,
    rationale:
      'Whisper, murmur and mutter all describe speaking quietly; shout is speaking loudly. ' +
      'The word that breaks the group’s shared quality of quietness is "shout".',
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
      'The word "only" makes both conditions necessary: no refund without a receipt AND return ' +
      'within 14 days — exactly option B. Option A fails because a late return may still earn ' +
      'store credit; C fails because "may be offered at discretion" is not a guarantee; D ' +
      'invents an exception for faulty items that the policy never states.',
  },
  {
    id: 116, domain: 'S',
    stem: 'A cube is unfolded into a cross-shaped net, with face X at the centre of the cross. When the cube is folded back up, how many faces share an edge with X?',
    options: ['3', '4', '5', '2'], answer: 1,
    rationale:
      'Fold the cross in your mind: the four faces attached to the centre swing up to become ' +
      'X’s four neighbouring walls, each sharing one edge with X. The sixth face folds over ' +
      'the top and lands opposite X, touching only the neighbours. So 4 faces share an edge ' +
      'with X — true of any face of a cube.',
  },
  {
    id: 117, domain: 'S',
    stem: 'A rectangular box measures 4 units by 3 units by 2 units. How many 1-unit cubes fit inside it exactly?',
    options: ['20', '22', '24', '26'], answer: 2,
    rationale:
      'Fill the box in layers: the bottom layer is 4 x 3 = 12 cubes, and the box is 2 layers ' +
      'tall, so 12 x 2 = 24. This is the volume formula in action: length x width x height.',
  },
  {
    id: 118, domain: 'S',
    stem: 'You walk 3 km north, then 4 km east, then 3 km south. How far are you from your starting point?',
    options: ['10 km', '4 km', '6 km', '5 km'], answer: 1,
    rationale:
      'Net out each direction separately: 3 km north followed by 3 km south cancels to zero, ' +
      'leaving only the 4 km east. You end 4 km due east of the start. (Adding all legs to get ' +
      '10 km measures distance WALKED, not distance FROM the start.)',
  },
  {
    id: 119, domain: 'S',
    stem: 'A clock shows 3:30. What is the angle between the hour hand and the minute hand?',
    options: ['90 degrees', '75 degrees', '60 degrees', '105 degrees'], answer: 1,
    rationale:
      'Position each hand. Minute hand at 30 minutes: straight down, 180 degrees. Hour hand: at ' +
      '3:00 it sat at 90 degrees, and by 3:30 it has moved half of the 30-degree gap to the 4, ' +
      'reaching 90 + 15 = 105 degrees. The angle between them is 180 - 105 = 75 degrees. ' +
      '(90 degrees is the trap — it forgets the hour hand moves during the half hour.)',
  },
  {
    id: 120, domain: 'S',
    stem: 'A large cube, 3 units along each edge, is painted on all its outer surfaces and then cut into 27 unit cubes. How many of the unit cubes have paint on exactly two faces?',
    options: ['6', '8', '12', '10'], answer: 2,
    rationale:
      'Exactly two painted faces occur where two outer surfaces meet without a third — along ' +
      'the middle of each edge of the big cube. In a 3 x 3 x 3 cube each edge has exactly one ' +
      'such middle cube, and a cube has 12 edges: 12 cubes. (Corners give three faces, face ' +
      'centres one, and the core none.)',
  },
  {
    id: 121, domain: 'A',
    stem: 'Which number comes next in the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '36'], answer: 1,
    rationale:
      'The gaps are 4, 6, 8, 10 — growing by 2 each step — so the next gap is 12 and ' +
      '30 + 12 = 42. (Equivalently each term is n x (n + 1): 1x2, 2x3, 3x4, 4x5, 5x6, and the ' +
      'next is 6 x 7 = 42.)',
  },
  {
    id: 122, domain: 'A',
    stem: 'Which number comes next in the series: 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '15'], answer: 2,
    rationale:
      'Each term is the sum of the two before it: 1 + 1 = 2, 1 + 2 = 3, 2 + 3 = 5, 3 + 5 = 8 — ' +
      'the Fibonacci rule. The next term is 5 + 8 = 13.',
  },
  {
    id: 123, domain: 'A',
    stem: 'Which pair comes next in the series: AZ, BY, CX, ?',
    options: ['DW', 'DV', 'EW', 'DX'], answer: 0,
    rationale:
      'Two interleaved patterns: the first letters step forward from the start of the alphabet ' +
      '(A, B, C, ...) while the second letters step backward from the end (Z, Y, X, ...). The ' +
      'fourth pair is D with W. (Each pair also mirrors: D is 4th from the start, W is 4th ' +
      'from the end.)',
  },
  {
    id: 124, domain: 'A',
    stem: 'Which number comes next in the series: 5, 10, 8, 16, 14, 28, ?',
    options: ['30', '24', '26', '32'], answer: 2,
    rationale:
      'The series alternates two operations — double, then subtract 2: 5 x 2 = 10, ' +
      '10 - 2 = 8, 8 x 2 = 16, 16 - 2 = 14, 14 x 2 = 28. The last step was a doubling, so the ' +
      'subtraction comes next: 28 - 2 = 26.',
  },
  {
    id: 125, domain: 'A',
    stem: 'Which number comes next in the series: 81, 27, 9, 3, ?',
    options: ['0', '1', '3', '2'], answer: 1,
    rationale:
      'Each term is the previous one divided by 3: 81 / 3 = 27, 27 / 3 = 9, 9 / 3 = 3. ' +
      'Continuing the same rule, 3 / 3 = 1.',
  },
  {
    id: 126, domain: 'P',
    stem: 'A project needs 180 hours of work. Two employees each work on it for 6 hours a day. How many days does the project take?',
    options: ['12', '18', '15', '20'], answer: 2,
    rationale:
      'Total the daily effort first: 2 employees x 6 hours = 12 hours of work per day. ' +
      'Days needed = total work / daily effort = 180 / 12 = 15 days.',
  },
  {
    id: 127, domain: 'P',
    stem: 'A shop buys an item for 400, marks the price up by 25%, then sells it at 10% off the marked price. What is the final sale price?',
    options: ['440', '450', '460', '475'], answer: 1,
    rationale:
      'Apply the two steps in order. Markup: 400 x 1.25 = 500, the marked price. Discount: 10% ' +
      'off THE MARKED price, so 500 x 0.90 = 450. The percentages cannot simply be netted to ' +
      '+15% of cost (which would give 460), because they act on different amounts.',
  },
  {
    id: 128, domain: 'P',
    stem: 'Pipe A fills a tank in 6 hours and pipe B fills the same tank in 3 hours. With both pipes open, how long does the tank take to fill?',
    options: ['2 hours', '2.5 hours', '3 hours', '4.5 hours'], answer: 0,
    rationale:
      'Convert to rates per hour: A fills 1/6 of the tank, B fills 1/3 = 2/6. Together they ' +
      'fill 1/6 + 2/6 = 3/6 = 1/2 of the tank each hour, so a full tank takes 2 hours. ' +
      '(Averaging 6 and 3 to get 4.5 is the trap — rates add, times do not.)',
  },
  {
    id: 129, domain: 'P',
    stem: 'A train 200 metres long passes a signal post in 10 seconds. What is its speed in kilometres per hour?',
    options: ['60 km/h', '66 km/h', '72 km/h', '80 km/h'], answer: 2,
    rationale:
      'Passing a post means the train travels its own length: 200 m in 10 s = 20 m/s. Convert ' +
      'to km/h by multiplying by 3.6 (there are 3,600 seconds in an hour and 1,000 metres in a ' +
      'kilometre): 20 x 3.6 = 72 km/h.',
  },
  {
    id: 130, domain: 'P',
    stem: 'An investment of 20,000 earns 8% simple interest per year. What is its total value after 3 years?',
    options: ['24,800', '25,194', '24,000', '23,600'], answer: 0,
    rationale:
      'Simple interest is earned on the ORIGINAL sum every year: 20,000 x 0.08 = 1,600 per ' +
      'year, so 3 years earn 1,600 x 3 = 4,800. Total value: 20,000 + 4,800 = 24,800. (25,194 ' +
      'is the compound-interest figure — the trap.)',
  },
];

/* ======================== EXPERT (ids 201–230) =========================== */

const EXPERT_ITEMS: Item[] = [
  {
    id: 201, domain: 'L',
    stem: 'All A are B. No B is C. Which statement must be true?',
    options: ['No A is C', 'Some A are C', 'All C are A', 'Some C are B'], answer: 0,
    rationale:
      'Draw the groups: "All A are B" puts A entirely inside B, and "No B is C" separates B ' +
      'from C completely. Anything inside B — including all of A — is therefore outside C, so ' +
      'no A is a C. Option D directly contradicts "No B is C", and B and C options claim ' +
      'overlaps the premises rule out.',
  },
  {
    id: 202, domain: 'L',
    stem: 'In a code language, PLANT is written as QNDRY. Using the same rule, how is GREAT written?',
    options: ['HTHEY', 'HTGDY', 'HSHDY', 'ITHEY'], answer: 0,
    rationale:
      'Work out the rule from the example, position by position: P+1=Q, L+2=N, A+3=D, N+4=R, ' +
      'T+5=Y — the shift grows by one at each position. Apply +1, +2, +3, +4, +5 to GREAT: ' +
      'G+1=H, R+2=T, E+3=H, A+4=E, T+5=Y, spelling HTHEY.',
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
    rationale:
      'An "at least one is true" statement survives only if one of its branches holds. The ' +
      'report being on time eliminates the first branch (submitted late), so the second branch ' +
      'must be the true one: the data was incomplete. This is process-of-elimination on a ' +
      'disjunction — rule out one side and the other follows.',
  },
  {
    id: 204, domain: 'L',
    stem: 'Five boxes are stacked in a single column. White is on top. Yellow is above Red but not on top. Red is above Green, and Blue is directly below Green. Which box is in the middle of the stack?',
    options: ['Green', 'Red', 'Yellow', 'Blue'], answer: 1,
    rationale:
      'Fix the certainties first: White holds position 1. The chain Yellow above Red, Red ' +
      'above Green, Blue directly below Green orders the other four as Yellow, Red, Green, ' +
      'Blue — and since Yellow cannot be on top, they must fill positions 2, 3, 4, 5 in ' +
      'exactly that order. The middle of five (position 3) is Red.',
  },
  {
    id: 205, domain: 'L',
    stem: 'If A attends the meeting, then B attends. If B attends, then C does not attend. C attended the meeting. Which statement must be true?',
    options: ['B attended', 'A did not attend', 'A attended', 'Nothing can be concluded'], answer: 1,
    rationale:
      'Reason backwards from the known fact, C attended. The second rule says B attending ' +
      'forces C to stay away; since C came, B cannot have attended. The first rule says A ' +
      'attending forces B to attend; since B did not, A cannot have attended either. Two ' +
      'contrapositive steps: C attended → no B → no A.',
  },
  {
    id: 206, domain: 'N',
    stem: 'The product of two consecutive even numbers is 168. What is their sum?',
    options: ['24', '26', '28', '30'], answer: 1,
    rationale:
      'Estimate first: 13 x 13 = 169, so the two even numbers sit either side of 13. Try ' +
      '12 x 14 = 168 — exactly right. Their sum is 12 + 14 = 26.',
  },
  {
    id: 207, domain: 'N',
    stem: 'A price is reduced by 20%, and the reduced price is later cut by a further 25%. What single percentage reduction is equivalent to the two cuts?',
    options: ['45%', '40%', '35%', '55%'], answer: 1,
    rationale:
      'Multiply what REMAINS after each cut, not the percentages: after -20% the price is 0.80 ' +
      'of the original; after a further -25% it is 0.80 x 0.75 = 0.60. Paying 60% means a 40% ' +
      'total reduction. Simply adding 20 + 25 = 45 is the trap — the second cut acts on an ' +
      'already-reduced price.',
  },
  {
    id: 208, domain: 'N',
    stem: 'A deposit of 10,000 earns 10% interest per year, compounded annually. What is its value after 2 years?',
    options: ['12,000', '12,100', '12,500', '11,900'], answer: 1,
    rationale:
      'Compound interest grows on the NEW balance each year. Year 1: 10,000 x 1.10 = 11,000. ' +
      'Year 2: 11,000 x 1.10 = 12,100. Simple interest would give only 12,000 — the extra 100 ' +
      'is year two’s interest on year one’s interest (10% of 1,000).',
  },
  {
    id: 209, domain: 'N',
    stem: 'The average of five numbers is 42. When a sixth number is added, the average rises to 45. What is the sixth number?',
    options: ['58', '54', '60', '62'], answer: 2,
    rationale:
      'Work with totals, not averages. Six numbers averaging 45 total 6 x 45 = 270; the ' +
      'original five averaging 42 total 5 x 42 = 210. The sixth number is the difference: ' +
      '270 - 210 = 60. (It must exceed 45 by enough to pull five numbers up 3 points each: ' +
      '45 + 15 = 60.)',
  },
  {
    id: 210, domain: 'N',
    stem: 'If x : y = 4 : 5 and y : z = 3 : 2, what is x : z?',
    options: ['6 : 5', '5 : 6', '4 : 2', '2 : 1'], answer: 0,
    rationale:
      'Link the two ratios through the shared term y by scaling both to the same y value. ' +
      'y appears as 5 and as 3; their common multiple is 15. Scale: x : y = 4 : 5 = 12 : 15, ' +
      'and y : z = 3 : 2 = 15 : 10. Now x : y : z = 12 : 15 : 10, so x : z = 12 : 10 = 6 : 5.',
  },
  {
    id: 211, domain: 'V',
    stem: 'Which word is closest in meaning to "pragmatic"?',
    options: ['Practical', 'Idealistic', 'Stubborn', 'Cautious'], answer: 0,
    rationale:
      '"Pragmatic" describes dealing with things realistically, guided by what works rather ' +
      'than by theory — in a word, practical. "Idealistic" is its near-opposite; "stubborn" ' +
      'and "cautious" describe temperament, not this outlook.',
  },
  {
    id: 212, domain: 'V',
    stem: 'Which word is most nearly opposite in meaning to "scarce"?',
    options: ['Rare', 'Abundant', 'Limited', 'Precious'], answer: 1,
    rationale:
      '"Scarce" means in short supply; "abundant" means existing in plenty — direct opposites. ' +
      '"Rare" and "limited" are near-synonyms of scarce (the traps), and "precious" describes ' +
      'value, not quantity.',
  },
  {
    id: 213, domain: 'V',
    stem: 'Mitigate is to severity as accelerate is to:',
    options: ['Speed', 'Delay', 'Distance', 'Caution'], answer: 0,
    rationale:
      'Read the analogy as verb-to-quantity-acted-on: to mitigate is to change severity ' +
      '(reduce it); to accelerate is to change speed (increase it). Speed is the quantity the ' +
      'verb operates on — delay, distance and caution are not what accelerating changes.',
  },
  {
    id: 214, domain: 'V',
    stem: 'Which word does not belong with the others?',
    options: ['Transient', 'Fleeting', 'Momentary', 'Permanent'], answer: 3,
    rationale:
      'Transient, fleeting and momentary all describe things lasting only a very short time. ' +
      '"Permanent" means lasting indefinitely — the opposite quality — so it is the word that ' +
      'does not belong.',
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
      'Two obligations stack. The security requirement binds ALL staff — including Nadia — and ' +
      'the privacy requirement "additionally" binds data handlers, which Nadia is. So she must ' +
      'complete both. The word "additionally" rules out replacement (options A and C), and ' +
      'having an extra obligation means she trains MORE often, not less (option D).',
  },
  {
    id: 216, domain: 'S',
    stem: 'A large cube, 4 units along each edge, is painted on all its outer surfaces and then cut into 64 unit cubes. How many of the unit cubes have no paint at all?',
    options: ['4', '16', '8', '12'], answer: 2,
    rationale:
      'Paint touches only the outside, so the unpainted cubes form the hidden inner core. ' +
      'Stripping the one-cube-thick painted shell removes two cubes from each dimension: ' +
      '(4 - 2) x (4 - 2) x (4 - 2) = 2 x 2 x 2 = 8 interior cubes.',
  },
  {
    id: 217, domain: 'S',
    stem: 'A standard die (opposite faces add up to 7) rests with 1 on top and 2 facing north. The die is tipped over once towards the north. Which number is now on top?',
    options: ['5', '2', '6', '3'], answer: 0,
    rationale:
      'First fill in the hidden faces: 1 on top puts 6 (7 - 1) on the bottom, and 2 facing ' +
      'north puts 5 (7 - 2) facing south. Tipping northward rotates the die over its north ' +
      'edge: the top face (1) swings down to the north side, and the south face swings up to ' +
      'become the new top. That south face is 5.',
  },
  {
    id: 218, domain: 'S',
    stem: 'A clock runs for 90 minutes. Through what angle does the hour hand move in that time?',
    options: ['30 degrees', '45 degrees', '90 degrees', '60 degrees'], answer: 1,
    rationale:
      'Find the hour hand’s rate: it covers 360 degrees in 12 hours, i.e. 30 degrees per ' +
      'hour or 0.5 degrees per minute. In 90 minutes it turns 90 x 0.5 = 45 degrees. (Do not ' +
      'confuse it with the minute hand, which would sweep one and a half full turns.)',
  },
  {
    id: 219, domain: 'S',
    stem: 'You walk 5 km east and then 12 km north. How far are you, in a straight line, from your starting point?',
    options: ['17 km', '13 km', '12 km', '15 km'], answer: 1,
    rationale:
      'East and north are at right angles, so the two legs form a right triangle and the ' +
      'straight-line distance is its hypotenuse. Pythagoras: 5 x 5 + 12 x 12 = 25 + 144 = 169, ' +
      'and the square root of 169 is 13 km — the classic 5-12-13 triangle. (17 km is the ' +
      'walked distance, not the straight-line distance.)',
  },
  {
    id: 220, domain: 'S',
    stem: 'A square sheet of paper is folded in half three times, and a single hole is punched through all the layers. How many holes are there when the sheet is fully unfolded?',
    options: ['6', '8', '4', '16'], answer: 1,
    rationale:
      'Each fold doubles the number of layers: 2 after the first fold, 4 after the second, 8 ' +
      'after the third (2 x 2 x 2). The single punch pierces all 8 layers at once, one hole ' +
      'per layer, so the unfolded sheet shows 8 holes.',
  },
  {
    id: 221, domain: 'A',
    stem: 'Which number comes next in the series: 4, 9, 19, 39, 79, ?',
    options: ['158', '159', '157', '160'], answer: 1,
    rationale:
      'Test "double and add one": 4 x 2 + 1 = 9, 9 x 2 + 1 = 19, 19 x 2 + 1 = 39, ' +
      '39 x 2 + 1 = 79 — consistent throughout. The next term is 79 x 2 + 1 = 159. (The gaps ' +
      '5, 10, 20, 40 also double, giving 79 + 80 = 159.)',
  },
  {
    id: 222, domain: 'A',
    stem: 'Which number comes next in the series: 2, 3, 5, 7, 11, 13, ?',
    options: ['15', '16', '17', '19'], answer: 2,
    rationale:
      'These are the prime numbers — divisible only by 1 and themselves — in order. Check the ' +
      'candidates after 13: 14 = 2 x 7 and 15 = 3 x 5 and 16 = 2 x 8 are all composite; 17 ' +
      'has no divisors besides 1 and 17. The next prime is 17.',
  },
  {
    id: 223, domain: 'A',
    stem: 'Which letter comes next in the series: A, C, F, J, O, ?',
    options: ['T', 'U', 'V', 'S'], answer: 1,
    rationale:
      'Convert to alphabet positions: A(1), C(3), F(6), J(10), O(15). The gaps are +2, +3, ' +
      '+4, +5 — growing by one — so the next gap is +6. Position 15 + 6 = 21, the letter U.',
  },
  {
    id: 224, domain: 'A',
    stem: 'Which number comes next in the series: 3, 4, 8, 17, 33, ?',
    options: ['58', '54', '60', '49'], answer: 0,
    rationale:
      'Look at the gaps: 4 - 3 = 1, 8 - 4 = 4, 17 - 8 = 9, 33 - 17 = 16 — these are the ' +
      'square numbers 1 x 1, 2 x 2, 3 x 3, 4 x 4. The next gap is 5 x 5 = 25, so the next ' +
      'term is 33 + 25 = 58.',
  },
  {
    id: 225, domain: 'A',
    stem: 'Which number comes next in the series: 7, 21, 18, 54, 51, ?',
    options: ['153', '147', '156', '150'], answer: 0,
    rationale:
      'The series alternates two operations — multiply by 3, then subtract 3: 7 x 3 = 21, ' +
      '21 - 3 = 18, 18 x 3 = 54, 54 - 3 = 51. The subtraction came last, so the ' +
      'multiplication is next: 51 x 3 = 153.',
  },
  {
    id: 226, domain: 'P',
    stem: 'Asha can finish a job alone in 10 days; Ben can finish it alone in 15 days. They work together for 4 days, then Asha leaves. How many more days does Ben need to finish the job?',
    options: ['4', '5', '6', '7.5'], answer: 1,
    rationale:
      'Convert to daily rates: Asha does 1/10 of the job per day, Ben 1/15. Together: ' +
      '1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6 per day, so 4 days complete 4 x 1/6 = 2/3 of ' +
      'the job. The remaining 1/3 falls to Ben alone at 1/15 per day: (1/3) / (1/15) = 5 days.',
  },
  {
    id: 227, domain: 'P',
    stem: 'An inlet pipe fills a tank in 4 hours, and a drain empties the full tank in 6 hours. If both are open and the tank starts empty, how long does the tank take to fill?',
    options: ['10 hours', '12 hours', '8 hours', '14 hours'], answer: 1,
    rationale:
      'Set the inflow against the outflow as rates: the inlet adds 1/4 of the tank per hour, ' +
      'the drain removes 1/6. Net rate: 1/4 - 1/6 = 3/12 - 2/12 = 1/12 of the tank per hour. ' +
      'Filling the whole tank at 1/12 per hour takes 12 hours.',
  },
  {
    id: 228, domain: 'P',
    stem: 'A trader sells two items at 240 each — one at a 20% profit and the other at a 20% loss. What is the overall result?',
    options: ['No profit, no loss', 'A loss of 20', 'A profit of 20', 'A loss of 40'], answer: 1,
    rationale:
      'Recover each cost from its selling price. Sold at 20% profit: cost = 240 / 1.20 = 200. ' +
      'Sold at 20% loss: cost = 240 / 0.80 = 300. Total cost 200 + 300 = 500 against total ' +
      'revenue 480 — a loss of 20. Equal percentages do not cancel, because they apply to ' +
      'different cost bases.',
  },
  {
    id: 229, domain: 'P',
    stem: 'Two trains leave the same station at the same time in opposite directions, at 90 km/h and 60 km/h. After how many minutes are they 100 km apart?',
    options: ['30', '36', '40', '45'], answer: 2,
    rationale:
      'Moving in opposite directions, their separation grows at the SUM of their speeds: ' +
      '90 + 60 = 150 km/h. Time to be 100 km apart: 100 / 150 = 2/3 of an hour, and ' +
      '2/3 x 60 = 40 minutes.',
  },
  {
    id: 230, domain: 'P',
    stem: "A machine's output doubles every year. It produced 4,000 units in its fourth year. How many units did it produce in its first year?",
    options: ['500', '1,000', '250', '400'], answer: 0,
    rationale:
      'Three doublings separate year one from year four, so reverse them by halving three ' +
      'times: year 3 = 4,000 / 2 = 2,000; year 2 = 2,000 / 2 = 1,000; year 1 = 1,000 / 2 = ' +
      '500 units. (Halving four times is the trap — year four is only three steps from year one.)',
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
