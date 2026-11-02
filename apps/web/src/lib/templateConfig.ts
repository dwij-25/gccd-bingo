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
    title: 'Selfie with a speaker',
    label: 'Selfie with a speaker'
  },
  {
    index: 1,
    x: 458,
    y: 601,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FCE8E6',
    title: 'The full auditorium',
    label: 'The full auditorium'
  },
  {
    index: 2,
    x: 855,
    y: 601,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E8F0FE',
    title: 'A slide that taught you something',
    label: 'A slide that taught you something'
  },
  {
    index: 3,
    x: 61,
    y: 965,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E8F0FE',
    title: 'Selfie with a volunteer',
    label: 'Selfie with a volunteer'
  },
  {
    index: 4,
    x: 458,
    y: 965,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FFFFFF',
    title: 'GDG Cloud Ahmedabad',
    label: 'GDG Cloud Ahmedabad',
    isCenter: true
  },
  {
    index: 5,
    x: 855,
    y: 965,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E6F4EA',
    title: 'Selfie with someone new',
    label: 'Selfie with someone new'
  },
  {
    index: 6,
    x: 61,
    y: 1330,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#E6F4EA',
    title: 'Photo booth or standee',
    label: 'Photo booth or standee'
  },
  {
    index: 7,
    x: 458,
    y: 1330,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FFE7A5',
    title: 'A sponsor booth',
    label: 'A sponsor booth'
  },
  {
    index: 8,
    x: 855,
    y: 1330,
    width: TILE_SLOT_WIDTH,
    height: TILE_SLOT_HEIGHT,
    radius: TILE_SLOT_RADIUS,
    color: '#FCE8E6',
    title: 'Selfie with your badge',
    label: 'Selfie with your badge'
  }
];
