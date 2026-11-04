export type StoryNode = {
  id: string
  kind: 'prologue' | 'chapter' | 'epilogue'
  title: string
  subtitle: string
  paragraphs: string[]
  pullQuote: string
  mood: 'clarity' | 'fracture' | 'echo' | 'lantern' | 'dawn' | 'voice' | 'closing'
  linkedChairs: string[]
  linkedStars: string[]
}

export const story: StoryNode[] = [
  {
    id: 'prologue',
    kind: 'prologue',
    title: 'The Serpent and the Question',
    subtitle: 'A beginning in the fog',
    paragraphs: [
      'I have always been interested in understanding how things work.',
      'Sometimes that curiosity has taken the form of technology: networks, cybersecurity, and the systems that keep information moving. Sometimes it has meant studying a business problem, or why people make the decisions they do. And sometimes, it has meant trying to understand myself.',
      "I don't think my journey has followed a straight line. It has been a series of different worlds, unexpected interruptions, and attempts to figure out what I want to do with what I have learned.",
      'If I had to give that journey a symbol, I would choose the Ouroboros: the serpent that forms a circle by holding its own tail. It doesn\'t suggest that everything happens for a reason or that every setback makes you stronger. It simply represents the possibility of beginning again.',
    ],
    pullQuote: 'Every ending changes the next beginning.',
    mood: 'closing',
    linkedChairs: [],
    linkedStars: [],
  },
  {
    id: 'systems',
    kind: 'chapter',
    title: 'Learning to understand systems',
    subtitle: 'The first language was engineering',
    paragraphs: [
      'My academic journey began with Computer Science and Engineering. Engineering gave me a way to approach problems: break something complicated into smaller parts, understand the relationships between them, look for patterns, test assumptions, and avoid jumping to conclusions.',
      'That interest took me beyond the classroom: research into firewall technology and network security at the forensic laboratory, where I explored authentication and how security controls fit into a broader system; banking at SBI, where processes, compliance and customer journeys mattered as much as whether a system worked; and a power distribution company, where the questions were about assets, faults and maintenance.',
      'These experiences came from different sectors, but they left me with one question.',
    ],
    pullQuote: 'A system can be technically sound, but is it solving the right problem for the people who depend on it?',
    mood: 'clarity',
    linkedChairs: ['foundry', 'observatory', 'ledger', 'spark'],
    linkedStars: [],
  },
  {
    id: 'interruption',
    kind: 'chapter',
    title: 'The interruption I did not plan for',
    subtitle: 'A harder path, taken honestly',
    paragraphs: [
      'A day before an important set of examinations, I was involved in a serious accident. The physical injury was one part of the experience. The academic consequences were another: the disruption left me with backlogs, and for someone who had been working towards a particular academic path, suddenly being behind was difficult to process.',
      'There was no clever strategy that could make the situation disappear. I had to deal with the situation as it existed. The recovery was not a neat transformation. There were consequences to manage, work to complete, and a new reality to accept.',
      'Effort and planning do not always protect you from disruption. But losing control over the circumstances did not mean losing all control over my response. I focused on what was still possible, and worked through it one step at a time.',
      'What it gave me was a more practical understanding of persistence: sometimes progress is not a spectacular leap forward. Sometimes it is continuing to work when the path has become considerably harder than you expected.',
    ],
    pullQuote: 'I would not describe that period as a story of effortless resilience.',
    mood: 'fracture',
    linkedChairs: ['academy'],
    linkedStars: ['broken-bridge'],
  },
  {
    id: 'outside-classroom',
    kind: 'chapter',
    title: 'The things that happen outside the classroom',
    subtitle: 'Sport, pressure, and making the pieces work',
    paragraphs: [
      'Football has been one of the most significant parts of my life. I have played competitively, including at national level. It offers a different kind of problem-solving: on the field you rarely have the luxury of analysing every variable. You read the situation, recognise patterns, communicate, and decide while the game keeps moving.',
      'You can prepare extensively and still lose. You can make a good individual decision that fails because the team is not aligned. You can make a mistake and still have a chance to contribute in the next phase of play. That taught me to see performance as something larger than individual ability.',
      'I carried that interest into student leadership. I founded Athena Gaming Society, led a team, and organised inter-college tournaments for a large number of students: coordinating people, creating participation, and turning an idea into an experience for someone else.',
    ],
    pullQuote: 'The challenge is not simply to have a good idea. It is to make the different pieces work together.',
    mood: 'echo',
    linkedChairs: ['pitch', 'athena'],
    linkedStars: [],
  },
  {
    id: 'lantern',
    kind: 'chapter',
    title: 'Learning that not every problem is external',
    subtitle: 'A gentle, skippable chapter',
    paragraphs: [
      'There is another part of growing up that is harder to fit into a résumé. Not every setback arrives with a deadline, a mark sheet, or a clearly defined solution. Some are personal. They concern relationships, expectations, and the distance between what you hope will happen and what actually does.',
      'There was a period when a connection with someone mattered deeply to me, and it ultimately ended. There were circumstances I could not control and an ending that took time to accept. I came to understand that people can experience the same situation differently, and that not every loss can be resolved the way you would choose.',
      'I do not want to turn a personal experience into a convenient professional slogan. Losing a connection does not automatically make someone wiser. But it has become part of how I understand uncertainty: I cannot control how another person feels, and moving forward does not require pretending something never mattered.',
      'I share this part because it is honest, not because it is the most important thing about me. I am also an engineer, a footballer, a student, a builder of ideas, and someone still discovering what he wants to create.',
    ],
    pullQuote: 'Some chapters remain meaningful even when they do not end the way you imagined.',
    mood: 'lantern',
    linkedChairs: [],
    linkedStars: ['lantern-star'],
  },
  {
    id: 'building',
    kind: 'chapter',
    title: 'The shift from understanding to building',
    subtitle: 'From systems to products',
    paragraphs: [
      'Over time my interests converged on a different question. I had studied technical systems, seen different operational environments, experienced the discipline of sport and the coordination of student leadership, and explored business ideas, from a football-studs brand to a visa-readiness and document-expiry tracking concept. These are at different stages of exploration. They are not launched ventures. What connects them is how a problem becomes a product.',
      'Who experiences the problem? How do they solve it now? What makes an alternative genuinely useful? What would convince someone to try it? How would you know it works?',
      'That is why I chose the PGP in Technology & Business Management. It is not a rejection of engineering. It is an extension of the questions engineering taught me to ask: not just whether a solution can be built, but whether it should be, and how it reaches the right people.',
      'My analytical challenge result and a team-built instrument that earned a project award are foundations to keep learning from. They do not make me an expert in every domain.',
    ],
    pullQuote: 'I want to understand not just whether a solution can be built, but whether it should.',
    mood: 'dawn',
    linkedChairs: ['academy', 'oracle', 'workshop'],
    linkedStars: ['maybes'],
  },
  {
    id: 'voice',
    kind: 'chapter',
    title: 'Why voice, why growth, and why Wispr Flow',
    subtitle: 'A concept to test',
    paragraphs: [
      "I am interested in the moment when an idea stops existing only in someone's head and becomes something another person can understand, use, or improve. Voice is an interesting part of that: speaking can capture an idea before it disappears and let you begin creating without first organising every sentence.",
      "Growth is not simply attracting attention. It is understanding an audience, communicating a product's value, making it easy to try, and learning whether the first interaction becomes sustained use.",
      'So I explored a proposed campaign called Project Voiceprint: show real voice-first workflows through creator-led content and community participation. Observe a real problem. Demonstrate the voice-first workflow. Measure whether it leads to meaningful trial and activation. Improve using the evidence.',
    ],
    pullQuote: 'This is a concept to test, not a campaign I am claiming to have launched.',
    mood: 'voice',
    linkedChairs: [],
    linkedStars: ['whisper'],
  },
  {
    id: 'ouroboros',
    kind: 'chapter',
    title: 'The Ouroboros',
    subtitle: 'Experience. Disruption. Reflection. Rebuilding.',
    paragraphs: [
      'The symbol is a process I recognise in my own life: Experience. Disruption. Reflection. Rebuilding.',
      'I studied engineering, then saw it applied across industries. I met a serious setback and worked through its consequences. I found meaning in sport and leadership, then grew curious about business and growth. I have had personal endings I could not neatly resolve while still exploring new goals.',
      'I do not believe every problem has a perfect solution, that every failure becomes a success story, or that growth happens in a straight line. The circle is not about returning to exactly the same place. It is about revisiting a question with more context than you had before.',
    ],
    pullQuote: 'The circle is not about returning to the same place. It is about revisiting a question with more context than before.',
    mood: 'closing',
    linkedChairs: [],
    linkedStars: [],
  },
  {
    id: 'next-loop',
    kind: 'epilogue',
    title: 'The Next Loop',
    subtitle: 'A beginning still in progress',
    paragraphs: [
      'I am still exploring where I can contribute most. I want to combine technology, analytical problem-solving, business understanding and creative execution, working on problems that need curiosity rather than assumptions, collaboration rather than isolated effort, and experimentation rather than confidence unsupported by evidence.',
      'This portfolio is not a finished person with a perfectly mapped future. It is a record of experiences, a demonstration of how I think, and a starting point.',
      'The Ouroboros does not promise that the next chapter will be easier. It reminds me that the next chapter is still mine to work on.',
    ],
    pullQuote: 'I am Hridyansh Sandilya. This is where I have been, what I am learning, and the next loop I want to build.',
    mood: 'closing',
    linkedChairs: [],
    linkedStars: [],
  },
]
