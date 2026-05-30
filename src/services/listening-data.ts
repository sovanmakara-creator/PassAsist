export type QuestionType = "fill-in";

export interface ListeningTestData {
  id: string;
  title: string;
  subtitle: string;
  audioSrc: string;
  sections: {
    type: QuestionType;
    title: string;
    instructions: string;
    data: any;
  }[];
  answers: Record<string, string | number>;
}

export const LISTENING_TESTS: ListeningTestData[] = [
  {
    id: "kenton-festival",
    title: "Events during Kenton Festival",
    subtitle: "Section 1 - Questions 1-10",
    audioSrc: "/audio/kenton-festival.mp3",
    sections: [
      {
        type: "fill-in",
        title: "Questions 1-10",
        instructions: "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
        data: {
          startNumber: 1,
          fields: [
            {
              heading: "Opening ceremony (first day)",
              lines: [
                {
                  textParts: ["In town centre, starting at 1 "],
                  inputs: [{ id: "1" }],
                },
                {
                  textParts: ["The mayor will make a speech"],
                  inputs: [],
                },
                {
                  textParts: ["A 2 ", " will perform"],
                  inputs: [{ id: "2" }],
                },
                {
                  textParts: ["Performance of a 3 ", " about Helen Tungate (a 4 ", ")"],
                  inputs: [{ id: "3" }, { id: "4" }],
                },
                {
                  textParts: ["Evening fireworks display situated across the 5 "],
                  inputs: [{ id: "5" }],
                },
              ],
            },
            {
              heading: "Other events",
              lines: [
                {
                  textParts: ["Videos about relationships that children have with their 6 "],
                  inputs: [{ id: "6" }],
                },
                {
                  textParts: ["  Venue: 7 ", " House"],
                  inputs: [{ id: "7" }],
                },
                {
                  textParts: ["Performance of 8 ", " dances"],
                  inputs: [{ id: "8" }],
                },
                {
                  textParts: ["  Venue: the 9 ", " market in the town centre"],
                  inputs: [{ id: "9" }],
                },
                {
                  textParts: ["  Time: 2 and 5 pm every day except 1st day of festival"],
                  inputs: [],
                },
                {
                  textParts: [
                    "Several professional concerts and one by children\n  Venue: library\n  Time: 6.30 pm on the 18th",
                  ],
                  inputs: [],
                },
                {
                  textParts: [
                    "Tickets available online from festival box office and from shops which have the festival 10 ",
                    " in their windows",
                  ],
                  inputs: [{ id: "10" }],
                },
              ],
            },
          ],
        },
      },
    ],
    answers: {
      "1": "2:45",
      "2": "band",
      "3": "play",
      "4": "scientist",
      "5": "river",
      "6": "grandparents",
      "7": "Hansworth",
      "8": "traditional",
      "9": "outdoor",
      "10": "logo",
    },
  },
];
