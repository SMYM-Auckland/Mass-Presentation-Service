import type { Deck } from './types';

export const mockDecks: Deck[] = [
  {
    id: 'deck-1',
    fileName: 'SundayMass.pptx',
    sections: [
      {
        id: 'sec-1-1',
        title: 'Opening Rites',
        slides: [
          { id: 's-1-1-1', title: 'Welcome & Announcements', content: 'Welcome to our Sunday Mass! Please silence your phones.', notes: 'Remember to announce the bake sale after mass.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-1-2', title: 'Opening Hymn: All Creatures of Our God and King', content: 'All creatures of our God and King\nLift up your voice and with us sing,\nAlleluia! Alleluia!', notes: 'Verse 1, 2, and 4.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-1-3', title: 'Penitential Rite', content: 'Lord have mercy.\nChrist have mercy.\nLord have mercy.', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
      {
        id: 'sec-1-2',
        title: 'Liturgy of the Word',
        slides: [
          { id: 's-1-2-1', title: 'First Reading: Isaiah 55:1-3', content: 'Thus says the Lord: All you who are thirsty, come to the water!', notes: 'Read by John Smith.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-2', title: 'Responsorial Psalm: Psalm 145', content: 'The hand of the Lord feeds us; he answers all our needs.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-3', title: 'Second Reading: Romans 8:35, 37-39', content: 'What will separate us from the love of Christ?', notes: 'Read by Jane Doe.', type: 'slide', source: 'SundayMass.pptx', hidden: true },
          { id: 's-1-2-4', title: 'Gospel Acclamation', content: 'Alleluia, Alleluia, Alleluia', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-5', title: 'Gospel: Matthew 14:13-21', content: 'Taking the five loaves and the two fish, and looking up to heaven, he said the blessing, broke the loaves, and gave them to the disciples.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-6', title: 'Homily', content: 'Homily by Fr. Michael', notes: 'Fr. Michael speaks for 10-12 minutes.', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
      {
        id: 'sec-1-3',
        title: 'Liturgy of the Eucharist',
        slides: [
          { id: 's-1-3-1', title: 'Offertory Hymn: The Summons', content: 'Will you come and follow me if I but call your name?', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-3-2', title: 'Holy, Holy, Holy', content: 'Holy, Holy, Holy Lord God of hosts...', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
      {
        id: 'sec-1-4',
        title: 'Concluding Rites',
        slides: [
          { id: 's-1-4-1', title: 'Final Blessing', content: 'The Lord be with you.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-4-2', title: 'Closing Hymn: Holy God, We Praise Thy Name', content: 'Holy God, we praise thy name; Lord of all, we bow before thee!', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-4-3', title: 'Thank You', content: 'Thank you for joining us!', dataAiHint: 'church interior', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
    ],
  },
  {
    id: 'deck-2',
    fileName: 'Hymns.pptx',
    sections: [
        {
            id: 'sec-2-1',
            title: 'Common Hymns',
            slides: [
                { id: 's-2-1-1', title: 'Amazing Grace', content: 'Amazing grace! How sweet the sound\nThat saved a wretch like me!', type: 'slide', source: 'Hymns.pptx' },
                { id: 's-2-1-2', title: 'How Great Thou Art', content: 'O Lord my God, when I in awesome wonder\nConsider all the worlds Thy Hands have made', type: 'slide', source: 'Hymns.pptx' },
            ]
        }
    ]
  }
];

export const mockVerses = [
    { id: 'v-1', type: 'verse', source: 'VerseView', title: 'John 3:16', content: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.'},
    { id: 'v-2', type: 'verse', source: 'VerseView', title: 'Proverbs 3:5-6', content: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.'}
] as any[]; // Using any to fit into Slide[] type easily
