export interface Participant {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
}

export type TileStatus = 'not_finished' | 'completed';
export type CardStatus = 'draft' | 'submitted' | 'verified' | 'winner' | 'rejected';

export interface BingoTile {
  id?: string;
  card_id?: string;
  tile_index: number;
  title: string;
  description: string;
  status: TileStatus;
  image_url: string | null;
  image_path?: string | null;
  crop_data?: string | null;
  uploaded_at?: string | null;
  hint?: string;
  icon?: string;
  color?: string;
  isCenter?: boolean;
}

export interface WinEvaluation {
  isWinner: boolean;
  fullHouse: boolean;
  linesCount: number;
  lines: string[];
  winTier: string;
}

export interface BingoCard {
  id: string;
  participant_id: string;
  bingo_id: string;
  status: CardStatus;
  total_completed: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  win_tier?: string | null;
  tiles: BingoTile[];
}

export interface CheckBingoResult {
  found: boolean;
  bingoId: string;
  participantName: string;
  organization?: string;
  status: CardStatus;
  totalCompleted: number;
  submittedAt: string | null;
  winTier: string;
  winEvaluation: WinEvaluation;
}
