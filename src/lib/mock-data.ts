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
          { id: 's-1-1-1', title: 'Welcome & Announcements', contents: ['Welcome to our Sunday Mass! Please silence your phones.'], layoutType: '1-col', notes: 'Remember to announce the bake sale after mass.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-1-2', title: 'Opening Hymn: All Creatures of Our God and King', contents: ['All creatures of our God and King\nLift up your voice and with us sing,\nAlleluia! Alleluia!'], layoutType: '1-col', notes: 'Verse 1, 2, and 4.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-1-3', title: 'Penitential Rite', contents: ['Lord have mercy.\nChrist have mercy.\nLord have mercy.'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
      {
        id: 'sec-1-2',
        title: 'Liturgy of the Word',
        slides: [
          { id: 's-1-2-1', title: 'First Reading: Isaiah 55:1-3', contents: ['Thus says the Lord: All you who are thirsty, come to the water!'], layoutType: '1-col', notes: 'Read by John Smith.', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-2', title: 'Responsorial Psalm: Psalm 145', contents: ['The hand of the Lord feeds us; he answers all our needs.'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-3', title: 'Second Reading: Romans 8:35, 37-39', contents: ['What will separate us from the love of Christ?'], layoutType: '1-col', notes: 'Read by Jane Doe.', type: 'slide', source: 'SundayMass.pptx', hidden: true },
          { id: 's-1-2-4', title: 'Gospel Acclamation', contents: ['Alleluia, Alleluia, Alleluia'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-5', title: 'Gospel: Matthew 14:13-21', contents: ['Taking the five loaves and the two fish, and looking up to heaven, he said the blessing, broke the loaves, and gave them to the disciples.'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-2-6', title: 'Homily', contents: ['Homily by Fr. Michael'], layoutType: '1-col', notes: 'Fr. Michael speaks for 10-12 minutes.', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
      {
        id: 'sec-1-3',
        title: 'Liturgy of the Eucharist',
        slides: [
          { id: 's-1-3-1', title: 'Offertory Hymn: The Summons', contents: ['Will you come and follow me if I but call your name?'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-3-2', title: 'Holy, Holy, Holy', contents: ['Holy, Holy, Holy Lord God of hosts...'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
        ],
      },
      {
        id: 'sec-1-4',
        title: 'Concluding Rites',
        slides: [
          { id: 's-1-4-1', title: 'Final Blessing', contents: ['The Lord be with you.'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-4-2', title: 'Closing Hymn: Holy God, We Praise Thy Name', contents: ['Holy God, we praise thy name; Lord of all, we bow before thee!'], layoutType: '1-col', type: 'slide', source: 'SundayMass.pptx' },
          { id: 's-1-4-3', title: 'Thank You', contents: ['Thank you for joining us!'], layoutType: '1-col', dataAiHint: 'church interior', type: 'slide', source: 'SundayMass.pptx' },
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
                { id: 's-2-1-1', title: 'Amazing Grace', contents: ['Amazing grace! How sweet the sound\nThat saved a wretch like me!'], layoutType: '1-col', type: 'slide', source: 'Hymns.pptx' },
                { id: 's-2-1-2', title: 'How Great Thou Art', contents: ['O Lord my God, when I in awesome wonder\nConsider all the worlds Thy Hands have made'], layoutType: '1-col', type: 'slide', source: 'Hymns.pptx' },
            ]
        }
    ]
  }
];
