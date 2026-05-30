export type QuestionType = "summary" | "mcq" | "matching" | "matching_info";

export interface TestData {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  sections: {
    type: QuestionType;
    title: string;
    instructions: string;
    data: any;
  }[];
  answers: Record<string, string | number>;
}

export const READING_TESTS: TestData[] = [
  {
    id: "music-and-emotions",
    title: "Music and the emotions",
    subtitle: "Neuroscientist Jonah Lehrer considers the emotional power of music",
    paragraphs: [
      "Why does music make us feel? On the one hand, music is a purely abstract art form, devoid of language or explicit ideas. And yet, even though music says little, it still manages to touch us deeply. When listening to our favourite songs, our body betrays all the symptoms of emotional arousal. The pupils in our eyes dilate, our pulse and blood pressure rise, the electrical conductance of our skin is lowered, and the cerebellum, a brain region associated with bodily movement, becomes strangely active. Blood is even re-directed to the muscles in our legs. In other words, sound stirs us at our biological roots.",
      "A recent paper in Nature Neuroscience by a research team in Montreal, Canada, marks an important step in revealing the precise underpinnings of 'the potent pleasurable stimulus' that is music. Although the study involves plenty of fancy technology, including functional magnetic resonance imaging (fMRI) and ligand-based positron emission tomography (PET) scanning, the experiment itself was rather straightforward. After screening 217 individuals who responded to advertisements requesting people who experience 'chills' to instrumental music, the scientists narrowed down the subject pool to ten. They then asked the subjects to bring in their playlist of favourite songs - virtually every genre was represented, from techno to tango - and played them the music while their brain activity was monitored. Because the scientists were combining methodologies (PET and fMRI), they were able to obtain an impressively exact and detailed portrait of music in the brain. The first thing they discovered is that music triggers the production of dopamine - a chemical with a key role in setting people's moods - by the neurons (nerve cells) in both the dorsal and ventral regions of the brain. As these two regions have long been linked with the experience of pleasure, this finding isn't particularly surprising.",
      "What is rather more significant is the finding that the dopamine neurons in the caudate - a region of the brain involved in learning stimulus-response associations, and in anticipating food and other 'reward' stimuli - were at their most active around 15 seconds before the participants' favourite moments in the music. The researchers call this the 'anticipatory phase' and argue that the purpose of this activity is to help us predict the arrival of our favourite part. The question, of course, is what all these dopamine neurons are up to. Why are they so active in the period preceding the acoustic climax? After all, we typically associate surges of dopamine with pleasure, with the processing of actual rewards. And yet, this cluster of cells is most active when the 'chills' have yet to arrive, when the melodic pattern is still unresolved.",
      "One way to answer the question is to look at the music and not the neurons. While music can often seem (at least to the outsider) like a labyrinth of intricate patterns, it turns out that the most important part of every song or symphony is when the patterns break down, when the sound becomes unpredictable. If the music is too obvious, it is annoyingly boring, like an alarm clock. Numerous studies, after all, have demonstrated that dopamine neurons quickly adapt to predictable rewards. If we know what's going to happen next, then we don't get excited. This is why composers often introduce a key note in the beginning of a song, spend most of the rest of the piece in the studious avoidance of the pattern, and then finally repeat it only at the end. The longer we are denied the pattern we expect, the greater the emotional release when the pattern returns, safe and sound.",
      "To demonstrate this psychological principle, the musicologist Leonard Meyer, in his classic book Emotion and Meaning in Music (1956), analysed the 5th movement of Beethoven's String Quartet in C-sharp minor, Op. 131. Meyer wanted to show how music is defined by its flirtation with - but not submission to - our expectations of order. Meyer dissected 50 measures (bars) of the masterpiece, showing how Beethoven begins with the clear statement of a rhythmic and harmonic pattern and then, in an ingenious tonal dance, carefully holds off repeating it. What Beethoven does instead is suggest variations of the pattern. He wants to preserve an element of uncertainty in his music, making our brains beg for the one chord he refuses to give us. Beethoven saves that chord for the end.",
      "According to Meyer, it is the suspenseful tension of music, arising out of our unfulfilled expectations, that is the source of the music's feeling. While earlier theories of music focused on the way a sound can refer to the real world of images and experiences - its 'connotative' meaning - Meyer argued that the emotions we find in music come from the unfolding events of the music itself. This 'embodied meaning' arises from the patterns the symphony invokes and then ignores. It is this uncertainty that triggers the surge of dopamine in the caudate, as we struggle to figure out what will happen next. We can predict some of the notes, but we can't predict them all, and that is what keeps us listening, waiting expectantly for our reward, for the pattern to be completed.",
    ],
    sections: [
      {
        type: "summary",
        title: "Questions 27-31",
        instructions:
          "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        data: {
          startNumber: 27,
          text: [
            "Participants, who were recruited for the study through advertisements, had their brain activity monitored while listening to their favourite music. It was noted that the music stimulated the brain's neurons to release a substance called ",
            " in two of the parts of the brain which are associated with feeling ",
            ". Researchers also observed that the neurons in the area of the brain called the ",
            " were particularly active just before the participants' favourite moments in the music - the period known as the ",
            ". Activity in this part of the brain is associated with the expectation of 'reward' stimuli such as ",
            ".",
          ],
        },
      },
      {
        type: "mcq",
        title: "Questions 32-36",
        instructions: "Choose the correct letter, A, B, C or D.",
        data: {
          questions: [
            {
              id: "32",
              question: "What point does the writer emphasise in the first paragraph?",
              options: [
                "how dramatically our reactions to music can vary",
                "how intense our physical responses to music can be",
                "how little we know about the way that music affects us",
                "how much music can tell us about how our brains operate",
              ],
            },
            {
              id: "33",
              question:
                "What view of the Montreal study does the writer express in the second paragraph?",
              options: [
                "Its aims were innovative.",
                "The approach was too simplistic.",
                "It produced some remarkably precise data.",
                "The technology used was unnecessarily complex.",
              ],
            },
            {
              id: "34",
              question:
                "What does the writer find interesting about the results of the Montreal study?",
              options: [
                "the timing of participants' neural responses to the music",
                "the impact of the music on participants' emotional state",
                "the section of participants' brains which was activated by the music",
                "the type of music which had the strongest effect on participants' brains",
              ],
            },
            {
              id: "35",
              question: "Why does the writer refer to Meyer's work on music and emotion?",
              options: [
                "to propose an original theory about the subject",
                "to offer support for the findings of the Montreal study",
                "to recommend the need for further research into the subject",
                "to present a view which opposes that of the Montreal researchers",
              ],
            },
            {
              id: "36",
              question:
                "According to Leonard Meyer, what causes the listener's emotional response to music?",
              options: [
                "the way that the music evokes poignant memories in the listener",
                "the association of certain musical chords with certain feelings",
                "the listener's sympathy with the composer's intentions",
                "the internal structure of the musical composition",
              ],
            },
          ],
        },
      },
      {
        type: "matching",
        title: "Questions 37-40",
        instructions: "Complete each sentence with the correct ending, A-F, below.",
        data: {
          options: [
            { value: "A", label: "our response to music depends on our initial emotional state." },
            { value: "B", label: "neuron activity decreases if outcomes become predictable." },
            { value: "C", label: "emotive music can bring to mind actual pictures and events." },
            {
              value: "D",
              label: "experiences in our past can influence our emotional reaction to music.",
            },
            {
              value: "E",
              label: "emotive music delays giving listeners what they expect to hear.",
            },
            {
              value: "F",
              label: "neuron activity increases prior to key points in a musical piece.",
            },
          ],
          questions: [
            { id: "37", prompt: "The Montreal researchers discovered that" },
            { id: "38", prompt: "Many studies have demonstrated that" },
            { id: "39", prompt: "Meyer's analysis of Beethoven's music shows that" },
            { id: "40", prompt: "Earlier theories of music suggested that" },
          ],
        },
      },
    ],
    answers: {
      "27": "dopamine",
      "28": "pleasure",
      "29": "caudate",
      "30": "anticipatory phase",
      "31": "food",
      "32": 1,
      "33": 2,
      "34": 0,
      "35": 1,
      "36": 3,
      "37": "F",
      "38": "B",
      "39": "E",
      "40": "C",
    },
  },
  {
    id: "oxytocin-love-hormone",
    title: "Oxytocin",
    subtitle: "The positive and negative effects of the chemical known as the 'love hormone'",
    paragraphs: [
      "A. Oxytocin is a chemical, a hormone produced in the pituitary gland in the brain. It was through various studies focusing on animals that scientists first became aware of the influence of oxytocin. They discovered that it helps reinforce the bonds between prairie voles, which mate for life, and triggers the motherly behaviour that sheep show towards their newborn lambs. It is also released by women in childbirth, strengthening the attachment between mother and baby. Few chemicals have as positive a reputation as oxytocin, which is sometimes referred to as the 'love hormone'. One sniff of it can, it is claimed, make a person more trusting, empathetic, generous and cooperative. It is time, however, to revise this wholly optimistic view. A new wave of studies has shown that its effects vary greatly depending on the person and the circumstances, and it can impact on our social interactions for worse as well as for better.",
      "B. Oxytocin's role in human behaviour first emerged in 2005. In a groundbreaking experiment, Markus Heinrichs and his colleagues at the University of Freiburg, Germany, asked volunteers to do an activity in which they could invest money with an anonymous person who was not guaranteed to be honest. The team found that participants who had sniffed oxytocin via a nasal spray beforehand invested more money than those who received a placebo instead. The study was the start of research into the effects of oxytocin on human interactions. 'For eight years, it was quite a lonesome field,' Heinrichs recalls. 'Now, everyone is interested.' These follow-up studies have shown that after a sniff of the hormone, people become more charitable, better at reading emotions on others' faces and at communicating constructively in arguments. Together, the results fuelled the view that oxytocin universally enhanced the positive aspects of our social nature.",
      "C. Then, after a few years, contrasting findings began to emerge. Simone Shamay-Tsoory at the University of Haifa, Israel, found that when volunteers played a competitive game, those who inhaled the hormone showed more pleasure when they beat other players, and felt more envy when others won. What's more, administering oxytocin also has sharply contrasting outcomes depending on a person's disposition. Jennifer Bartz from Mount Sinai School of Medicine, New York, found that it improves people's ability to read emotions, but only if they are not very socially adept to begin with. Her research also shows that oxytocin in fact reduces cooperation in subjects who are particularly anxious or sensitive to rejection.",
      "D. Another discovery is that oxytocin's effects vary depending on who we are interacting with. Studies conducted by Carolyn DeClerck of the University of Antwerp, Belgium, revealed that people who had received a dose of oxytocin actually became less cooperative when dealing with complete strangers. Meanwhile, Carsten De Dreu at the University of Amsterdam in the Netherlands discovered that volunteers given oxytocin showed favouritism: Dutch men became quicker to associate positive words with Dutch names than with foreign ones, for example. According to De Dreu, oxytocin drives people to care for those in their social circles and defend them from outside dangers. So, it appears that oxytocin strengthens biases, rather than promoting general goodwill, as was previously thought.",
      "E. There were signs of these subtleties from the start. Bartz has recently shown that in almost half of the existing research results, oxytocin influenced only certain individuals or in certain circumstances. Where once researchers took no notice of such findings, now a more nuanced understanding of oxytocin's effects is propelling investigations down new lines. To Bartz, the key to understanding what the hormone does lies in pinpointing its core function rather than in cataloguing its seemingly endless effects. There are several hypotheses which are not mutually exclusive. Oxytocin could help to reduce anxiety and fear. Or it could simply motivate people to seek out social connections. She believes that oxytocin acts as a chemical spotlight that shines on social clues - a shift in posture, a flicker of the eyes, a dip in the voice - making people more attuned to their social environment. This would explain why it makes us more likely to look others in the eye and improves our ability to identify emotions. But it could also make things worse for people who are overly sensitive or prone to interpreting social cues in the worst light.",
      "F. Perhaps we should not be surprised that the oxytocin story has become more perplexing. The hormone is found in everything from octopuses to sheep, and its evolutionary roots stretch back half a billion years. 'It's a very simple and ancient molecule that has been co-opted for many different functions,' says Sue Carter at the University of Illinois, Chicago, USA. 'It affects primitive parts of the brain like the amygdala, so it's going to have many effects on just about everything.' Bartz agrees. 'Oxytocin probably does some very basic things, but once you add our higher-order thinking and social situations, these basic processes could manifest in different ways depending on individual differences and context.'",
    ],
    sections: [
      {
        type: "matching",
        title: "Questions 14-17",
        instructions:
          "Which paragraph contains the following information? Write the correct letter, A-F.",
        data: {
          options: [
            { value: "A", label: "Paragraph A" },
            { value: "B", label: "Paragraph B" },
            { value: "C", label: "Paragraph C" },
            { value: "D", label: "Paragraph D" },
            { value: "E", label: "Paragraph E" },
            { value: "F", label: "Paragraph F" },
          ],
          questions: [
            {
              id: "14",
              prompt: "reference to research showing the beneficial effects of oxytocin on people",
            },
            { id: "15", prompt: "reasons why the effects of oxytocin are complex" },
            {
              id: "16",
              prompt: "mention of a period in which oxytocin attracted little scientific attention",
            },
            {
              id: "17",
              prompt: "reference to people ignoring certain aspects of their research data",
            },
          ],
        },
      },
      {
        type: "matching",
        title: "Questions 18-20",
        instructions: "Match each research finding with the correct researcher, A-F.",
        data: {
          options: [
            { value: "A", label: "Markus Heinrichs" },
            { value: "B", label: "Simone Shamay-Tsoory" },
            { value: "C", label: "Jennifer Bartz" },
            { value: "D", label: "Carolyn DeClerck" },
            { value: "E", label: "Carsten De Dreu" },
            { value: "F", label: "Sue Carter" },
          ],
          questions: [
            { id: "18", prompt: "People are more trusting when affected by oxytocin." },
            { id: "19", prompt: "Oxytocin increases people's feelings of jealousy." },
            {
              id: "20",
              prompt: "The effect of oxytocin varies from one type of person to another.",
            },
          ],
        },
      },
      {
        type: "summary",
        title: "Questions 21-26",
        instructions:
          "Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.",
        data: {
          startNumber: 21,
          text: [
            "The earliest findings about oxytocin and bonding came from research involving ",
            ". It was also discovered that humans produce oxytocin during ",
            ". An experiment in 2005, in which participants were given either oxytocin or a ",
            ", reinforced the belief that the hormone had a positive effect.\n\nHowever, later research suggests that this is not always the case. A study at the University of Haifa where participants took part in a ",
            " revealed the negative emotions which oxytocin can trigger. A study at the University of Antwerp showed people's lack of willingness to help ",
            " while under the influence of oxytocin. Meanwhile, research at the University of Amsterdam revealed that people who have been given oxytocin consider ",
            " that are familiar to them in their own country to have more positive associations than those from other cultures.",
          ],
        },
      },
    ],
    answers: {
      "14": "B",
      "15": "F",
      "16": "B",
      "17": "E",
      "18": "A",
      "19": "B",
      "20": "C",
      "21": "animals",
      "22": "childbirth",
      "23": "placebo",
      "24": "game",
      "25": "strangers",
      "26": "names",
    },
  },
  {
    id: "bike-sharing-schemes",
    title: "The growth of bike-sharing schemes around the world",
    subtitle: "How Dutch engineer Luud Schimmelpennink helped to devise urban bike-sharing schemes",
    paragraphs: [
      "A. The original idea for an urban bike-sharing scheme dates back to a summer's day in Amsterdam in 1965. Provo, the organisation that came up with the idea, was a group of Dutch activists who wanted to change society. They believed the scheme, which was known as the Witte Fietsenplan, was an answer to the perceived threats of air pollution and consumerism. In the centre of Amsterdam, they painted a small number of used bikes white. They also distributed leaflets describing the dangers of cars and inviting people to use the white bikes. The bikes were then left unlocked at various locations around the city, to be used by anyone in need of transport.",
      "B. Luud Schimmelpennink, a Dutch industrial engineer who still lives and cycles in Amsterdam, was heavily involved in the original scheme. He recalls how the scheme succeeded in attracting a great deal of attention – particularly when it came to publicising Provo's aims – but struggled to get off the ground. The police were opposed to Provo's initiatives and almost as soon as the white bikes were distributed around the city, they removed them. However, for Schimmelpennink and for bike-sharing schemes in general, this was just the beginning. 'The first Witte Fietsenplan was just a symbolic thing,' he says. 'We painted a few bikes white, that was all. Things got more serious when I became a member of the Amsterdam city council two years later.'",
      "C. Schimmelpennink seized this opportunity to present a more elaborate Witte Fietsenplan to the city council. 'My idea was that the municipality of Amsterdam would distribute 10,000 white bikes over the city, for everyone to use,' he explains. 'I made serious calculations. It turned out that a white bicycle – per person, per kilometre – would cost the municipality only 10% of what it contributed to public transport per person per kilometre.' Nevertheless, the council unanimously rejected the plan. 'They said that the bicycle belongs to the past. They saw a glorious future for the car,' says Schimmelpennink. But he was not in the least discouraged.",
      "D. Schimmelpennink never stopped believing in bike-sharing, and in the mid-90s, two Danes asked for his help to set up a system in Copenhagen. The result was the world's first large-scale bike-share programme. It worked on a deposit: 'You dropped a coin in the bike and when you returned it, you got your money back.' After setting up the Danish system, Schimmelpennink decided to try his luck again in the Netherlands – and this time he succeeded in arousing the interest of the Dutch Ministry of Transport. 'Times had changed,' he recalls. 'People had become more environmentally conscious, and the Danish experiment had proved that bike-sharing was a real possibility.' A new Witte Fietsenplan was launched in 1999 in Amsterdam. However, riding a white bike was no longer free; it cost one guilder per trip and payment was made with a chip card developed by the Dutch bank Postbank. Schimmelpennink designed conspicuous, sturdy white bikes locked in special racks which could be opened with the chip card – the plan started with 250 bikes, distributed over five stations.",
      "E. Theo Molenaar, who was a system designer for the project, worked alongside Schimmelpennink. 'I remember when we were testing the bike racks, he announced that he had already designed better ones. But of course, we had to go through with the ones we had.' The system, however, was prone to vandalism and theft. 'After every weekend there would always be a couple of bikes missing,' Molenaar says. 'I really have no idea what people did with them, because they could instantly be recognised as white bikes.' But the biggest blow came when Postbank decided to abolish the chip card, because it wasn't profitable. 'That chip card was pivotal to the system,' Molenaar says. 'To continue the project we would have needed to set up another system, but the business partner had lost interest.'",
      "F. Schimmelpennink was disappointed, but – characteristically – not for long. In 2002 he got a call from the French advertising corporation JC Decaux, who wanted to set up his bike-sharing scheme in Vienna. 'That went really well. After Vienna, they set up a system in Lyon. Then in 2007, Paris followed. That was a decisive moment in the history of bike-sharing.' The huge and unexpected success of the Parisian bike-sharing programme, which now boasts more than 20,000 bicycles, inspired cities all over the world to set up their own schemes, all modelled on Schimmelpennink's. 'It's wonderful that this happened,' he says. 'But financially I didn't really benefit from it, because I never filed for a patent.'",
      "G. In Amsterdam today, 38% of all trips are made by bike and, along with Copenhagen, it is regarded as one of the two most cycle-friendly capitals in the world – but the city never got another Witte Fietsenplan. Molenaar believes this may be because everybody in Amsterdam already has a bike. Schimmelpennink, however, cannot see that this changes Amsterdam's need for a bike-sharing scheme. 'People who travel on the underground don't carry their bikes around. But often they need additional transport to reach their final destination.' Although he thinks it is strange that a city like Amsterdam does not have a successful bike-sharing scheme, he is optimistic about the future. 'In the '60s we didn't stand a chance because people were prepared to give their lives to keep cars in the city. But that mentality has totally changed. Today everybody longs for cities that are not dominated by cars.'",
    ],
    sections: [
      {
        type: "matching",
        title: "Questions 14-18",
        instructions:
          "Which paragraph contains the following information? Write the correct letter, A-G.",
        data: {
          options: [
            { value: "A", label: "Paragraph A" },
            { value: "B", label: "Paragraph B" },
            { value: "C", label: "Paragraph C" },
            { value: "D", label: "Paragraph D" },
            { value: "E", label: "Paragraph E" },
            { value: "F", label: "Paragraph F" },
            { value: "G", label: "Paragraph G" },
          ],
          questions: [
            { id: "14", prompt: "a description of how people misused a bike-sharing scheme" },
            {
              id: "15",
              prompt: "an explanation of why a proposed bike-sharing scheme was turned down",
            },
            { id: "16", prompt: "a reference to a person being unable to profit from their work" },
            {
              id: "17",
              prompt: "an explanation of the potential savings a bike-sharing scheme would bring",
            },
            {
              id: "18",
              prompt: "a reference to the problems a bike-sharing scheme was intended to solve",
            },
          ],
        },
      },
      {
        type: "mcq",
        title: "Questions 19 and 20",
        instructions:
          "Which TWO of the following statements are made in the text about the Amsterdam bike-sharing scheme of 1999? (Answer both separately)",
        data: {
          questions: [
            {
              id: "19",
              question: "First statement:",
              options: [
                "It was initially opposed by a government department.",
                "It failed when a partner in the scheme withdrew support.",
                "It aimed to be more successful than the Copenhagen scheme.",
                "It was made possible by a change in people's attitudes.",
                "It attracted interest from a range of bike designers.",
              ],
            },
            {
              id: "20",
              question: "Second statement:",
              options: [
                "It was initially opposed by a government department.",
                "It failed when a partner in the scheme withdrew support.",
                "It aimed to be more successful than the Copenhagen scheme.",
                "It was made possible by a change in people's attitudes.",
                "It attracted interest from a range of bike designers.",
              ],
            },
          ],
        },
      },
      {
        type: "mcq",
        title: "Questions 21 and 22",
        instructions:
          "Which TWO of the following statements are made in the text about Amsterdam today? (Answer both separately)",
        data: {
          questions: [
            {
              id: "21",
              question: "First statement:",
              options: [
                "The majority of residents would like to prevent all cars from entering the city.",
                "There is little likelihood of the city having another bike-sharing scheme.",
                "More trips in the city are made by bike than by any other form of transport.",
                "A bike-sharing scheme would benefit residents who use public transport.",
                "The city has a reputation as a place that welcomes cyclists.",
              ],
            },
            {
              id: "22",
              question: "Second statement:",
              options: [
                "The majority of residents would like to prevent all cars from entering the city.",
                "There is little likelihood of the city having another bike-sharing scheme.",
                "More trips in the city are made by bike than by any other form of transport.",
                "A bike-sharing scheme would benefit residents who use public transport.",
                "The city has a reputation as a place that welcomes cyclists.",
              ],
            },
          ],
        },
      },
      {
        type: "summary",
        title: "Questions 23-26",
        instructions:
          "Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.",
        data: {
          startNumber: 23,
          text: [
            "The first urban bike-sharing scheme\nThe first bike-sharing scheme was the idea of the Dutch group Provo. The people who belonged to this group were ",
            ". They were concerned about damage to the environment and about ",
            ", and believed that the bike-sharing scheme would draw attention to these issues. As well as painting some bikes white, they handed out ",
            " that condemned the use of cars.\nHowever, the scheme was not a great success: almost as quickly as Provo left the bikes around the city, the ",
            " took them away. According to Schimmelpennink, the scheme was intended to be symbolic. The idea was to get people thinking about the issues.",
          ],
        },
      },
    ],
    answers: {
      "14": "E",
      "15": "C",
      "16": "F",
      "17": "C",
      "18": "A",
      "19": 1,
      "20": 3,
      "21": 3,
      "22": 4,
      "23": "activists",
      "24": "consumerism",
      "25": "leaflets",
      "26": "police",
    },
  },
  {
    id: "saffron-spice",
    title: "Saffron",
    subtitle: "The world's most costly spice",
    paragraphs: [
      "Saffron, a spice with a very distinctive bitter taste, notes of hay and metal, and a striking crimson hue, is one of the most highly sought-after commodities in the world, and has been for millennia. Crocus sativus, the only crocus flower from which saffron comes, is a member of the iris family that grows perennially from corms, underground plant stems. It is native to southwestern Asia, in and around Greece, and was recorded in a wall painting in Akrotiri in Santorini from about the middle of the second millennium BC. It is also mentioned in an Assyrian 7th century BC botanical treatise. Crocus sativus is a delicate flower which grows in woodland and scrub, as well as meadows. Flowering in autumn, it is grown in various regions of the world, primarily along a belt stretching eastwards from the Mediterranean across Iran to India and beyond. It is a sterile plant that does not grow in the wild and needs to be propagated vegetatively, and possibly derives from Crocus cartwightianus, from southwest Asia.",
      "In the world of spices, saffron is by far the most valuable. To help put its value into perspective, a ton of rice in 2017 might cost about $350–360, whereas a kilo of saffron would command between $1,000 and $11,000. The high prices the spice still has today are due in no small part to the fact that it takes about 150,000 crocus flowers to produce about one kilogram of spice. Other factors affecting its worth are the fact that to produce merely one kilogram, a field 2000² metres is needed, along with an army of workers to pluck the flowers.",
      "The price of saffron is also influenced by the quality. This, in turn, is dictated by the components of the spice, such as the inclusion of the stamina, the male or pollen-producing parts of a flower, which add bulk but have no effect on flavour. The price is also sensitive to the age of the spice. As the new crop becomes available, bulk buyers of saffron will look for brittleness in the threads and debris at the bottom of the containers, which is an indication of old crop. The colour of the saffron stigmata can also dictate the price, with reddish-brown colour, as opposed to the vibrant crimson, signifying inferior quality.",
      "Crocus sativus that produce saffron grow to 20–30 centimetres in height, and produce up to four flowers of six petals with rounded points. The parts of the flower used to produce the saffron are the female crimson stigmata and their styles, together called threads. The male yellow part of the flower is also harvested and used in the spice, but this produces an inferior product as it does not produce any taste.",
      "Today, Crocus sativus is grown commercially in Azerbaijan, Greece, India, Iran, Morocco and Spain, with Iran, the world's largest producer of saffron, accounting for over 90% of the total global yield of approximately 300 tons annually. It is, however, also produced in small quantities, for example in Mund in Switzerland, where about one kilogram a year is produced. At one time in the 16th century, it was even a commercial product in Essex in southeast England, but all that remains is the name, Saffron Walden. A suburb of London, Croydon (from old-English, Grog) a place where crocuses were grown 1,200 years ago, also owes its names to the crocus.",
      "The harvest of this most costly of spices takes place in the autumn. The ground where the crocus flower is grown is kept free of all vegetation. When the flowers appear at the end of October/beginning of November, vast numbers of people are employed, working 24 hours a day in shifts to pluck the flowers by hand, leaving the corm, a bulbous tuber, to flower again the following year. The petals are discarded as waste and the threads or styles are dried traditionally in a saffron kiln. The fresh threads and stigmas need to be dried as a soon as possible to prevent them being ruined by decomposition or mould, and are laid out on mesh screens, which are then baked over hot coals in heated rooms for 10 to 12 hours. The dried spice is subsequently kept in sealed glass containers.",
      "Apart from the culinary uses of saffron, saffron has been used in folk or herbal medicine. In Europe in medieval times, it was used almost as a panacea to treat a vast array of disorders ranging from respiratory problems such as coughs, colds and asthma, as well as smallpox and cancer, blood disorders heart diseases, paralysis, gout and eye disorders. Its yellow colour was also thought of as a cure for jaundice. Among the ancient Egyptians, saffron was used to treat poisoning, and as a digestive and a tonic for dysentery and measles.",
      "It is unlikely that the price or desirability of saffron will decrease, but it is likely that more regions of the world will start to grow the spice, provided the market focuses on its status and value.",
    ],
    sections: [
      {
        type: "mcq",
        title: "Questions 1-5",
        instructions:
          "Do the following statements agree with the information given in Reading Passage 1? (TRUE/FALSE/NOT GIVEN)",
        data: {
          questions: [
            {
              id: "1",
              question: "Crocus sativus is grown from seeds.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
            },
            {
              id: "2",
              question: "The crocus flower from which saffron comes needs to be cultivated.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
            },
            {
              id: "3",
              question:
                "The price of saffron is governed only by the volume of plants required to produce the spice.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
            },
            {
              id: "4",
              question:
                "The quality of saffron is affected more by age than the inclusion of male stamina.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
            },
            {
              id: "5",
              question: "Large quantities of saffron are produced in Switzerland.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
            },
          ],
        },
      },
      {
        type: "summary",
        title: "Questions 6-10",
        instructions:
          "Complete the flow-chart below. Choose ONE WORD ONLY from the passage for each answer.",
        data: {
          startNumber: 6,
          text: [
            "Harvesting saffron\n\nNo ",
            " allowed to grow around the crocus flowers\n↓\nFlowers picked by large numbers of people by ",
            " with the corm being left\n↓\nOnce petals removed, styles are put into a special ",
            " to dry saffron\n↓\nDone immediately after harvesting to stop fresh threads being ",
            "\n↓\nDried spice subsequently kept in airtight ",
            " made of glass",
          ],
        },
      },
      {
        type: "matching",
        title: "Questions 11-13",
        instructions: "Complete each sentence with the correct ending A-E, below.",
        data: {
          options: [
            { value: "A", label: "a treatment which contained saffron." },
            { value: "B", label: "a district where crocuses are still grown." },
            { value: "C", label: "saffron of the best quality." },
            { value: "D", label: "the bulk of today's saffron production." },
            { value: "E", label: "a reference to saffron in its name." },
          ],
          questions: [
            { id: "11", prompt: "Iran is responsible for" },
            { id: "12", prompt: "In southeast England, one town has" },
            { id: "13", prompt: "In Ancient Egypt, a cure for poisoning was" },
          ],
        },
      },
    ],
    answers: {
      "1": 1, // FALSE
      "2": 0, // TRUE
      "3": 1, // FALSE
      "4": 2, // NOT GIVEN
      "5": 1, // FALSE
      "6": "vegetation",
      "7": "hand",
      "8": "kiln",
      "9": "ruined",
      "10": "containers",
      "11": "D",
      "12": "E",
      "13": "A",
    },
  },
];
