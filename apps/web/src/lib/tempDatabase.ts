import { BingoCard, BingoTile, Participant, CheckBingoResult, WinEvaluation } from '../types/bingo.js';

interface TempDBData {
  participants: Participant[];
  cards: Record<string, BingoCard>; // keyed by participant_id
}

const STORAGE_KEY = 'gccd_bingo_temp_db_v1';

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'usr-1', name: 'Dwij Pancholi', email: 'dwij@example.com', organization: 'GCCD Lead' },
  { id: 'usr-2', name: 'Dwij Pancholi', email: 'dwijpancholi12@gmail.com', organization: 'Community Day Attendee' },
  { id: 'usr-3', name: 'Priya Sharma', email: 'priya.sharma@gdgcloud.org', organization: 'Cloud Architect' },
  { id: 'usr-4', name: 'Sarah Jenkins', email: 'sarah.j@google.com', organization: 'Keynote Speaker • Google' },
  { id: 'usr-5', name: 'Alex Rivera', email: 'alex.rivera@techcorp.io', organization: 'DevOps Specialist' },
  { id: 'usr-6', name: 'Aarav Patel', email: 'aarav.patel@developer.community', organization: 'Fullstack Engineer' },
  { id: 'usr-7', name: 'David Chen', email: 'david.chen@cloudbuilders.com', organization: 'GCP Tech Lead' },
  { id: 'usr-8', name: 'Ananya Rao', email: 'ananya.rao@gdg.org.in', organization: 'Community Organizer' },
  { id: 'usr-9', name: 'Rohan Mehta', email: 'rohan.mehta@startup.ai', organization: 'ML Researcher' },
  { id: 'usr-10', name: 'Neha Gupta', email: 'neha.gupta@cloudfest.io', organization: 'Cloud Native Developer' },
  { id: 'usr-11', name: 'Carlos Rodriguez', email: 'carlos.r@google.dev', organization: 'Developer Advocate • Google' },
  { id: 'usr-12', name: 'Sneha Kulkarni', email: 'sneha.k@datascience.in', organization: 'Data Engineer' }
];

const DEFAULT_TILES = [
  {
    title: 'Selfie with a speaker',
    description: 'Selfie with any speaker.',
    icon: 'selfie',
    color: 'tile-yellow'
  },
  {
    title: 'The full auditorium',
    description: 'Photo of the audience hall.',
    icon: 'auditorium',
    color: 'tile-pink'
  },
  {
    title: 'A slide that taught you something',
    description: 'Photo of an insightful slide.',
    icon: 'slide',
    color: 'tile-blue'
  },
  {
    title: 'Selfie with a volunteer',
    description: 'Selfie with an event volunteer.',
    icon: 'volunteer',
    color: 'tile-blue'
  },
  {
    title: 'GDG Cloud Ahmedabad',
    description: 'Photo at the main stage.',
    icon: 'logo',
    color: 'tile-white',
    isCenter: true
  },
  {
    title: 'Selfie with someone new',
    description: 'Selfie with a fellow attendee.',
    icon: 'network',
    color: 'tile-green'
  },
  {
    title: 'Photo booth or standee',
    description: 'Photo at the event booth.',
    icon: 'booth',
    color: 'tile-green'
  },
  {
    title: 'A sponsor booth',
    description: 'Photo at any sponsor booth.',
    icon: 'sponsor',
    color: 'tile-yellow'
  },
  {
    title: 'Selfie with your badge',
    description: 'Selfie showing your event badge.',
    icon: 'badge',
    color: 'tile-pink'
  }
];

function generateBingoId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GCCD-${p1}-${p2}`;
}

function createInitialCard(participantId: string): BingoCard {
  const tiles: BingoTile[] = DEFAULT_TILES.map((t, idx) => ({
    id: `tile-${participantId}-${idx}`,
    tile_index: idx,
    title: t.title,
    description: t.description,
    status: 'not_finished',
    image_url: null,
    image_path: null,
    color: t.color,
    icon: t.icon,
    isCenter: t.isCenter,
    uploaded_at: null
  }));

  const now = new Date().toISOString();
  return {
    id: `card-${participantId}`,
    participant_id: participantId,
    bingo_id: generateBingoId(),
    status: 'draft',
    created_at: now,
    updated_at: now,
    submitted_at: null,
    total_completed: 0,
    tiles
  };
}

class TempDatabase {
  private data: TempDBData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): TempDBData {
    if (typeof window === 'undefined') {
      return { participants: INITIAL_PARTICIPANTS, cards: {} };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.participants && parsed.cards) {
          // Ensure default participants are present
          INITIAL_PARTICIPANTS.forEach(ip => {
            if (!parsed.participants.some((p: Participant) => p.email.toLowerCase() === ip.email.toLowerCase())) {
              parsed.participants.push(ip);
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load temp database from localStorage, initializing fresh', e);
    }

    const initial: TempDBData = {
      participants: [...INITIAL_PARTICIPANTS],
      cards: {}
    };
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(data: TempDBData = this.data) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save temp database to localStorage', e);
    }
  }

  public login(name: string, email: string): { participant: Participant; card: BingoCard; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    let participant = this.data.participants.find(p => p.email.toLowerCase() === cleanEmail);

    if (!participant) {
      throw new Error(
        `Participant "${cleanEmail}" is not found in the registered GCCD attendee roster. Please verify your email or check at the event registration desk.`
      );
    }

    // Update name if changed
    if (cleanName && cleanName.length > 1) {
      participant.name = cleanName;
    }

    // Retrieve or initialize Bingo card
    if (!this.data.cards[participant.id]) {
      this.data.cards[participant.id] = createInitialCard(participant.id);
    }

    this.saveToStorage();
    return {
      participant,
      card: this.data.cards[participant.id],
      token: `demo-token-${participant.id}-${Date.now()}`
    };
  }

  public getCard(participantId: string): BingoCard {
    if (!this.data.cards[participantId]) {
      this.data.cards[participantId] = createInitialCard(participantId);
      this.saveToStorage();
    }
    return this.data.cards[participantId];
  }

  public uploadTile(participantId: string, tileIndex: number, imageDataUrl: string, cropData?: any): { success: boolean; imageUrl: string; updatedAt: string; totalCompleted: number; canSubmit: boolean } {
    const card = this.getCard(participantId);
    if (card.status !== 'draft') {
      throw new Error('This card has already been submitted and is locked for editing.');
    }

    const tile = card.tiles.find(t => t.tile_index === tileIndex);
    if (!tile) {
      throw new Error(`Tile index ${tileIndex} not found.`);
    }

    const now = new Date().toISOString();
    tile.image_url = imageDataUrl;
    tile.crop_data = cropData ? (typeof cropData === 'string' ? cropData : JSON.stringify(cropData)) : null;
    tile.status = 'completed';
    tile.uploaded_at = now;

    card.total_completed = card.tiles.filter(t => t.status === 'completed' && t.image_url).length;
    card.updated_at = now;

    this.saveToStorage();

    return {
      success: true,
      imageUrl: imageDataUrl,
      updatedAt: now,
      totalCompleted: card.total_completed,
      canSubmit: card.total_completed >= 9
    };
  }

  public removeTile(participantId: string, tileIndex: number): { success: boolean; totalCompleted: number; updatedAt: string } {
    const card = this.getCard(participantId);
    if (card.status !== 'draft') {
      throw new Error('This card has already been submitted and is locked for editing.');
    }

    const tile = card.tiles.find(t => t.tile_index === tileIndex);
    if (tile) {
      tile.image_url = null;
      tile.status = 'not_finished';
      tile.uploaded_at = null;
    }

    const now = new Date().toISOString();
    card.total_completed = card.tiles.filter(t => t.status === 'completed' && t.image_url).length;
    card.updated_at = now;

    this.saveToStorage();

    return {
      success: true,
      totalCompleted: card.total_completed,
      updatedAt: now
    };
  }

  public saveDraft(participantId: string, _tiles: any[]): { success: boolean; savedAt: string; totalCompleted: number } {
    const card = this.getCard(participantId);
    if (card.status !== 'draft') {
      throw new Error('Cannot modify a submitted card.');
    }

    const now = new Date().toISOString();
    card.updated_at = now;
    card.total_completed = card.tiles.filter(t => t.status === 'completed' && t.image_url).length;
    this.saveToStorage();

    return {
      success: true,
      savedAt: now,
      totalCompleted: card.total_completed
    };
  }

  public submitCard(participantId: string): { success: boolean; card: BingoCard; bingoId: string; winEvaluation: WinEvaluation } {
    const card = this.getCard(participantId);
    const completedCount = card.tiles.filter(t => t.status === 'completed' && t.image_url).length;
    if (completedCount < 9) {
      throw new Error(`Cannot submit: Only ${completedCount} of 9 challenges are completed. All 9 tiles must be green.`);
    }

    const now = new Date().toISOString();
    card.status = 'submitted';
    card.submitted_at = now;
    card.updated_at = now;

    const winEvaluation = this.evaluateLines(card);

    this.saveToStorage();

    return {
      success: true,
      card,
      bingoId: card.bingo_id,
      winEvaluation
    };
  }

  public evaluateLines(card: BingoCard): WinEvaluation {
    const completed = new Set(
      card.tiles
        .filter(t => t.status === 'completed' && t.image_url)
        .map(t => t.tile_index)
    );

    const LINES = [
      { name: 'Row 1 (Top)', indices: [0, 1, 2] },
      { name: 'Row 2 (Middle)', indices: [3, 4, 5] },
      { name: 'Row 3 (Bottom)', indices: [6, 7, 8] },
      { name: 'Column 1 (Left)', indices: [0, 3, 6] },
      { name: 'Column 2 (Center)', indices: [1, 4, 7] },
      { name: 'Column 3 (Right)', indices: [2, 5, 8] },
      { name: 'Diagonal (Top-Left to Bottom-Right)', indices: [0, 4, 8] },
      { name: 'Diagonal (Top-Right to Bottom-Left)', indices: [2, 4, 6] }
    ];

    const matchedLines = LINES.filter(line => line.indices.every(idx => completed.has(idx))).map(l => l.name);

    let winTier = 'Submitted — Under Review';
    if (completed.size === 9) {
      winTier = 'Grand Full-Card Champion 🌟';
    } else if (matchedLines.length >= 3) {
      winTier = 'Triple Line Winner 🏆';
    } else if (matchedLines.length >= 2) {
      winTier = 'Double Line Winner 🥈';
    } else if (matchedLines.length === 1) {
      winTier = 'Single Line Winner 🥉';
    }

    return {
      isWinner: card.status === 'winner' || completed.size === 9,
      fullHouse: completed.size === 9,
      linesCount: matchedLines.length,
      winTier,
      lines: matchedLines
    };
  }

  public checkBingo(bingoId: string): CheckBingoResult {
    const cleanId = bingoId.trim().toUpperCase();
    const card = Object.values(this.data.cards).find(c => c.bingo_id.toUpperCase() === cleanId);

    if (!card) {
      throw new Error(`No Bingo card found with ID "${cleanId}". Please check your ID and try again.`);
    }

    const participant = this.data.participants.find(p => p.id === card.participant_id);
    const winEval = this.evaluateLines(card);

    return {
      found: true,
      bingoId: card.bingo_id,
      participantName: participant ? participant.name : 'Unknown Attendee',
      organization: participant?.organization,
      status: card.status,
      totalCompleted: card.total_completed,
      submittedAt: card.submitted_at,
      winTier: card.status === 'winner' ? 'Verified Grand Winner 🏆' : winEval.winTier,
      winEvaluation: winEval
    };
  }

  public getAdminSubmissions(statusFilter?: string) {
    const submissions = Object.values(this.data.cards).map(card => {
      const participant = this.data.participants.find(p => p.id === card.participant_id);
      const winEval = this.evaluateLines(card);
      return {
        id: card.id,
        bingo_id: card.bingo_id,
        status: card.status,
        participant_name: participant ? participant.name : 'Unknown',
        email: participant ? participant.email : '',
        organization: participant?.organization || 'Attendee',
        created_at: card.created_at,
        submitted_at: card.submitted_at,
        total_completed: card.total_completed,
        lines_count: winEval.lines.length,
        win_tier: winEval.winTier,
        tiles: card.tiles
      };
    });

    const filtered = statusFilter ? submissions.filter(s => s.status === statusFilter) : submissions;

    const stats = {
      totalParticipants: this.data.participants.length,
      totalSubmissions: submissions.filter(s => s.status === 'submitted' || s.status === 'winner').length,
      totalCompleted: submissions.filter(s => s.total_completed === 9).length,
      totalWinners: submissions.filter(s => s.status === 'winner').length
    };

    return { submissions: filtered, stats };
  }

  public adminMarkWinner(bingoId: string, isWinner: boolean, winTier?: string) {
    const card = Object.values(this.data.cards).find(c => c.bingo_id.toUpperCase() === bingoId.trim().toUpperCase());
    if (!card) {
      throw new Error(`Bingo card not found: ${bingoId}`);
    }

    card.status = isWinner ? 'winner' : 'submitted';
    card.updated_at = new Date().toISOString();
    this.saveToStorage();

    return {
      success: true,
      card,
      winTier: winTier || (isWinner ? 'Verified Winner' : 'Submitted')
    };
  }
}

export const tempDatabase = new TempDatabase();
