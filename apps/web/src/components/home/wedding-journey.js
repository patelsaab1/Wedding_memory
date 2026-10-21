/**
 * Rohit & Roshni — wedding journey copy and local photo fallbacks.
 * Dates stay as given. No year or location is added here.
 */
export const WEDDING_DATE = '1 May';

export const WEDDING_JOURNEY = {
  eyebrow: 'Our story',
  title: 'From tel to forever',
  description:
    'Four days the family gathered. Tel, haldi, sangeet, and then the vows. On 1 May, Roshni became Rohit’s life partner and ardhangini.',
  finale: {
    names: 'Rohit ♥ Roshni',
    line: 'Ek din, saat phere, aur zindagi bhar ka saath.',
    vow: 'Us din Roshni sirf meri humsafar nahi, meri ardhangini aur meri duniya ban gayi.',
    close: '1 May — The Beginning of Our Forever',
  },
  milestones: [
    {
      mark: '01',
      date: '28 April',
      title: 'The Celebrations Begin',
      subtitle: 'Tel Ceremony',
      story:
        'Our wedding celebrations began with the beautiful traditions of tel, surrounded by the warmth and blessings of our loved ones.',
      albumMatch: /tel/i,
      photoKey: 'tel',
      local: {
        src: '/wall/peek.webp',
        fallback: '/wall/peek.jpg',
        alt: 'Roshni smiling over her embroidered dupatta',
        width: 720,
        height: 480,
      },
      localSide: {
        src: '/hero/veil-480.webp',
        fallback: '/hero/veil-480.jpg',
        alt: 'Roshni behind her wedding veil',
        width: 480,
        height: 720,
      },
    },
    {
      mark: '02',
      date: '29 April',
      title: 'Wrapped in Haldi and Happiness',
      subtitle: 'Haldi Ceremony',
      story:
        'A day filled with haldi, smiles, family, and unforgettable moments as our wedding celebrations grew even more special.',
      albumMatch: /haldi/i,
      photoKey: 'haldi',
      local: {
        src: '/wall/dupatta.webp',
        fallback: '/wall/dupatta.jpg',
        alt: 'Roshni looking up from under her dupatta',
        width: 720,
        height: 480,
      },
    },
    {
      mark: '03',
      date: '30 April',
      title: 'A Night to Remember',
      subtitle: 'Sangeet & Khali Bharat',
      story:
        'Music, celebration, family, and the excitement of a new beginning made this day another beautiful chapter in our wedding story.',
      albumMatch: /sangeet|khali/i,
      photoKey: 'sangeet',
      local: {
        src: '/around/aside.webp',
        fallback: '/around/aside.jpg',
        alt: 'Rohit and Roshni standing together',
        width: 800,
        height: 1200,
      },
      localSide: {
        src: '/around/groom.webp',
        fallback: '/around/groom.jpg',
        alt: 'Rohit standing in sherwani and sehra',
        width: 640,
        height: 960,
      },
    },
    {
      mark: '04',
      date: '1 May',
      title: 'The Day Our Forever Began',
      subtitle: 'Varmala & Wedding Pheras',
      story:
        'On 1 May, we exchanged varmala and took our wedding pheras. That beautiful day, Roshni became Rohit’s life partner and ardhangini. Two lives came together, beginning a journey of love, companionship, and memories to cherish forever.',
      albumMatch: /varmala|phera|shaadi|wedding/i,
      photoKey: 'wedding',
      highlight: true,
      local: {
        src: '/wall/forehead.webp',
        fallback: '/wall/forehead.jpg',
        alt: 'Rohit and Roshni resting their foreheads together',
        width: 1100,
        height: 1650,
      },
      localSide: {
        src: '/around/hands.webp',
        fallback: '/around/hands.jpg',
        alt: 'Rohit and Roshni holding hands',
        width: 1000,
        height: 1500,
      },
    },
  ],
};
