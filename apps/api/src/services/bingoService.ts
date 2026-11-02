import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

export interface DefaultTile {
  index: number;
  title: string;
  description: string;
  hint: string;
  icon: string;
  color: string;
  isCenter?: boolean;
}

export const CANONICAL_TILES: DefaultTile[] = [
  {
    index: 0,
    title: "Speaker Spotter",
    description: "Take a photo of a speaker on stage or take a selfie with a speaker!",
    hint: "Catch our keynote or breakout speakers delivering insights.",
    icon: "fa-microphone-alt",
    color: "#FEE7A6"
  },
  {
    index: 1,
    title: "Take a Picture of a Slide",
    description: "Take a clear picture of an insightful slide or architecture diagram.",
    hint: "Look for cloud architecture, AI workflows, or code demos.",
    icon: "fa-chalkboard-teacher",
    color: "#FBD3CF"
  },
  {
    index: 2,
    title: "Cloud Networking",
    description: "Introduce yourself to a fellow developer and snap a networking photo.",
    hint: "Connect with new friends, exchange LinkedIn or GitHub!",
    icon: "fa-handshake",
    color: "#CEEEF8"
  },
  {
    index: 3,
    title: "Hands-on Code Lab",
    description: "Snap your laptop or phone trying a Google Cloud codelab, cloud shell, or demo.",
    hint: "Show your hands-on coding setup or completed challenge.",
    icon: "fa-laptop-code",
    color: "#CEEEF8"
  },
  {
    index: 4,
    title: "GCCD Community Spirit",
    description: "Pose at the GDG/GCCD photo booth or snap the event banner with the brackets logo!",
    hint: "Official Community Centerpiece Challenge! { DevFest / GCCD }",
    icon: "fa-code",
    color: "#FFFFFF",
    isCenter: true
  },
  {
    index: 5,
    title: "Swag & Badges",
    description: "Show off your event badge, lanyard, GCCD stickers, or swag items.",
    hint: "Display your favorite developer stickers or conference swag.",
    icon: "fa-id-badge",
    color: "#C9F4CA"
  },
  {
    index: 6,
    title: "Recharge & Connect",
    description: "Capture your coffee break, lunch, or energy snack with community members.",
    hint: "Great ideas start over coffee and conference conversations!",
    icon: "fa-mug-hot",
    color: "#C9F4CA"
  },
  {
    index: 7,
    title: "Sponsor Showcase",
    description: "Visit a sponsor or community showcase booth and snap their demo or banner.",
    hint: "Engage with industry partners and discover new developer tools.",
    icon: "fa-store-alt",
    color: "#FEE7A6"
  },
  {
    index: 8,
    title: "Q&A & Community Cheer",
    description: "Snap a photo during the Q&A session, quiz, or final group celebration!",
    hint: "Be an active participant during speaker Q&A or quiz rounds.",
    icon: "fa-question-circle",
    color: "#FBD3CF"
  }
];

export function generateHumanFriendlyBingoId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0, 1, O, I
  const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GCCD-${p1}-${p2}`;
}

export function evaluateWinConditions(tiles: Array<{ status: string; tile_index: number }>): {
  isWinner: boolean;
  fullHouse: boolean;
  linesCount: number;
  lines: string[];
  winTier: string;
} {
  const completed = Array(9).fill(false);
  tiles.forEach(t => {
    if (t.status === 'completed') {
      completed[t.tile_index] = true;
    }
  });

  const lines: string[] = [];

  // Rows
  if (completed[0] && completed[1] && completed[2]) lines.push('Top Row (Row 1)');
  if (completed[3] && completed[4] && completed[5]) lines.push('Middle Row (Row 2)');
  if (completed[6] && completed[7] && completed[8]) lines.push('Bottom Row (Row 3)');

  // Columns
  if (completed[0] && completed[3] && completed[6]) lines.push('Left Column (Col 1)');
  if (completed[1] && completed[4] && completed[7]) lines.push('Center Column (Col 2)');
  if (completed[2] && completed[5] && completed[8]) lines.push('Right Column (Col 3)');

  // Diagonals
  if (completed[0] && completed[4] && completed[8]) lines.push('Main Diagonal (↘)');
  if (completed[2] && completed[4] && completed[6]) lines.push('Anti-Diagonal (↙)');

  const fullHouse = completed.every(Boolean);
  const isWinner = fullHouse || lines.length > 0;

  let winTier = 'Participant';
  if (fullHouse) {
    winTier = 'Full House Grand Prize';
  } else if (lines.length >= 3) {
    winTier = `Triple Line Winner (${lines.length} Lines)`;
  } else if (lines.length > 0) {
    winTier = `${lines.length} Line Winner`;
  }

  return {
    isWinner,
    fullHouse,
    linesCount: lines.length,
    lines,
    winTier
  };
}

export async function logActivity(participantId: string | null, cardId: string | null, action: string, metadata: any = {}) {
  try {
    await db.query(
      `INSERT INTO activity_log (participant_id, card_id, action, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [participantId, cardId, action, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.warn('Activity log write error:', err);
  }
}
