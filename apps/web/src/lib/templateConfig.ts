export interface SlotConfig {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  color: string;
  title: string;
  label: string;
  isCenter?: boolean;
}

export const TEMPLATE_VIEWBOX = {
  width: 1241,
  height: 1754
};

// Fixed aspect ratio of every slot rectangle: 324 / 290 = ~1.1172
export const TILE_SLOT_WIDTH = 324;
export const TILE_SLOT_HEIGHT = 290;
export const TILE_SLOT_RADIUS = 26;
export const TILE_ASPECT = TILE_SLOT_WIDTH / TILE_SLOT_HEIGHT;

export const TEMPLATE_SLOTS: SlotConfig[] = [
  {
    index: 0,
    x: 61,
    y: 601,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FFE7A5',
    title: 'Take a picture of a slide',
    label: 'Slide Photo'
  },
  {
    index: 1,
    x: 458,
    y: 601,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FCE8E6',
    title: 'Selfie with a speaker',
    label: 'Speaker Selfie'
  },
  {
    index: 2,
    x: 855,
    y: 601,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E8F0FE',
    title: 'Ask a question during session',
    label: 'Q&A Moment'
  },
  {
    index: 3,
    x: 61,
    y: 965,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E6F4EA',
    title: 'Visit a sponsor booth',
    label: 'Sponsor Booth'
  },
  {
    index: 4,
    x: 458,
    y: 965,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FFFFFF',
    title: 'GDG Cloud Logo / Backdrop',
    label: 'Community Logo',
    isCenter: true
  },
  {
    index: 5,
    x: 855,
    y: 965,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#F3E8FD',
    title: 'Share on Social Media',
    label: 'Social Post'
  },
  {
    index: 6,
    x: 61,
    y: 1330,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FEF7E0',
    title: 'Connect with fellow attendee',
    label: 'Attendee Selfie'
  },
  {
    index: 7,
    x: 458,
    y: 1330,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FCE8E6',
    title: 'Showcase GCCD Swag / Stickers',
    label: 'Swag & Stickers'
  },
  {
    index: 8,
    x: 855,
    y: 1330,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E8F0FE',
    title: 'Attend Closing Ceremony',
    label: 'Closing Ceremony'
  }
];
