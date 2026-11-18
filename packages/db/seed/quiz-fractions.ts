export interface QuizQuestion {
  id: string;
  q: string;
  options: [string, string, string, string];
  /** index into options */
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

/** CBSE Class 5 Maths — "Parts and Wholes" (fractions). 20 questions. */
export const FRACTIONS_CLASS5: QuizQuestion[] = [
  {
    id: "frac-01",
    q: "What fraction of a pizza is left if you eat 3 of its 8 equal slices?",
    options: ["3/8", "5/8", "8/5", "3/5"],
    answer: 1,
    explanation: "8 slices minus 3 eaten leaves 5 out of 8.",
  },
  {
    id: "frac-02",
    q: "Which fraction is equal to 1/2?",
    options: ["2/3", "3/6", "1/3", "2/5"],
    answer: 1,
    explanation: "3 is half of 6, so 3/6 = 1/2.",
  },
  {
    id: "frac-03",
    q: "What is 1/4 + 2/4?",
    options: ["3/8", "3/4", "2/4", "1/2"],
    answer: 1,
    explanation: "Same denominators: add the tops. 1 + 2 = 3, so 3/4.",
  },
  {
    id: "frac-04",
    q: "Which is bigger: 3/5 or 2/5?",
    options: ["3/5", "2/5", "They are equal", "Cannot tell"],
    answer: 0,
    explanation: "Same size parts — 3 parts is more than 2 parts.",
  },
  {
    id: "frac-05",
    q: "In 4/7, what is the denominator?",
    options: ["4", "7", "11", "3"],
    answer: 1,
    explanation: "The denominator is the bottom number — the total equal parts.",
  },
  {
    id: "frac-06",
    q: "What is 5/6 − 2/6?",
    options: ["3/6", "3/0", "7/6", "3/12"],
    answer: 0,
    explanation: "Same denominators: subtract the tops. 5 − 2 = 3.",
  },
  {
    id: "frac-07",
    q: "Simplify 4/8 to its lowest terms.",
    options: ["2/3", "1/2", "1/4", "3/4"],
    answer: 1,
    explanation: "Divide top and bottom by 4: 4/8 = 1/2.",
  },
  {
    id: "frac-08",
    q: "Which fraction shows one whole?",
    options: ["1/5", "5/1", "5/5", "0/5"],
    answer: 2,
    explanation: "All 5 parts out of 5 make one whole.",
  },
  {
    id: "frac-09",
    q: "What is half of 10 mangoes?",
    options: ["2", "5", "10", "20"],
    answer: 1,
    explanation: "Split 10 into 2 equal groups — 5 in each.",
  },
  {
    id: "frac-10",
    q: "What is 1/3 of 12 bananas?",
    options: ["3", "4", "6", "9"],
    answer: 1,
    explanation: "12 shared into 3 equal groups gives 4.",
  },
  {
    id: "frac-11",
    q: "Which is the smallest fraction?",
    options: ["1/2", "1/3", "1/8", "1/4"],
    answer: 2,
    explanation: "With the same top, more parts means smaller pieces — 1/8.",
  },
  {
    id: "frac-12",
    q: "Write 7/4 as a mixed number.",
    options: ["1 3/4", "1 1/4", "3 1/4", "7 1/4"],
    answer: 0,
    explanation: "7 quarters = 4 quarters (1 whole) + 3 quarters.",
  },
  {
    id: "frac-13",
    q: "Write 2 1/3 as an improper fraction.",
    options: ["5/3", "7/3", "6/3", "3/7"],
    answer: 1,
    explanation: "2 wholes = 6 thirds, plus 1 third = 7/3.",
  },
  {
    id: "frac-14",
    q: "Which fraction is equivalent to 2/3?",
    options: ["4/6", "3/4", "2/6", "6/4"],
    answer: 0,
    explanation: "Multiply top and bottom by 2: 2/3 = 4/6.",
  },
  {
    id: "frac-15",
    q: "What is 1/2 + 1/4?",
    options: ["2/6", "3/4", "1/6", "2/4"],
    answer: 1,
    explanation: "1/2 is 2/4. 2/4 + 1/4 = 3/4.",
  },
  {
    id: "frac-16",
    q: "A ribbon is 1 metre long. Ammu cuts 3/10 of it. How much is left?",
    options: ["3/10 m", "7/10 m", "10/3 m", "1/10 m"],
    answer: 1,
    explanation: "10/10 − 3/10 = 7/10 of a metre.",
  },
  {
    id: "frac-17",
    q: "Which is greater: 3/4 or 2/3?",
    options: ["3/4", "2/3", "They are equal", "Cannot tell"],
    answer: 0,
    explanation: "3/4 = 9/12 and 2/3 = 8/12, so 3/4 is greater.",
  },
  {
    id: "frac-18",
    q: "There are 20 students. 1/4 of them wear glasses. How many wear glasses?",
    options: ["4", "5", "10", "15"],
    answer: 1,
    explanation: "20 ÷ 4 = 5.",
  },
  {
    id: "frac-19",
    q: "What fraction of an hour is 15 minutes?",
    options: ["1/2", "1/3", "1/4", "1/6"],
    answer: 2,
    explanation: "60 minutes ÷ 15 = 4, so 15 minutes is 1/4 hour.",
  },
  {
    id: "frac-20",
    q: "What is 3/5 of 25 rupees?",
    options: ["₹5", "₹10", "₹15", "₹20"],
    answer: 2,
    explanation: "1/5 of 25 is 5, so 3/5 is 3 × 5 = 15.",
  },
];
