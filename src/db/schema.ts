// Local SQLite schema. Mirrors the Supabase tables (supabase/migrations) plus local-only columns.
// Every synced table has: user_id, created_at, updated_at, deleted_at (soft delete) and `dirty`
// (1 = changed on this device, not yet pushed).

export type ColumnKind = 'text' | 'int' | 'real' | 'bool';

type TableDef = {
  /** Primary key column ("id", or "user_id" for profiles). */
  key: string;
  /** Columns that sync with Supabase (key, user_id and timestamps included). */
  synced: Record<string, ColumnKind>;
  /** Columns that exist only on this device. */
  local?: Record<string, ColumnKind>;
};

const stamps = { created_at: 'text', updated_at: 'text', deleted_at: 'text' } as const;

export const tables = {
  profiles: {
    key: 'user_id',
    synced: {
      user_id: 'text',
      display_name: 'text',
      goal_type: 'text',
      daily_goal: 'int',
      reminder_time: 'text',
      reading_mode: 'text',
      translation_language: 'text',
      onboarding_completed: 'bool',
      notif_daily: 'bool',
      notif_streak: 'bool',
      notif_challenge: 'bool',
      ...stamps,
    },
  },
  books: {
    key: 'id',
    synced: {
      id: 'text',
      user_id: 'text',
      title: 'text',
      author: 'text',
      format: 'text',
      file_size: 'int',
      storage_path: 'text',
      cover_path: 'text',
      cover_seed: 'int',
      total_pages: 'int',
      source_name: 'text',
      finished_at: 'text',
      last_opened_at: 'text',
      ...stamps,
    },
    local: {
      local_path: 'text', // file in the app's document directory
      local_cover: 'text', // extracted cover image
      upload_state: 'text', // pending | uploading | synced | failed
    },
  },
  reading_progress: {
    key: 'id', // = book_id, so two devices never create two rows for one book
    synced: {
      id: 'text',
      user_id: 'text',
      book_id: 'text',
      location: 'text',
      percent: 'real',
      page: 'int',
      chapter: 'text',
      ...stamps,
    },
  },
  reading_sessions: {
    key: 'id',
    synced: {
      id: 'text',
      user_id: 'text',
      book_id: 'text',
      local_date: 'text',
      started_at: 'text',
      ended_at: 'text',
      seconds: 'int',
      pages: 'int',
      ...stamps,
    },
  },
  highlights: {
    key: 'id',
    synced: {
      id: 'text',
      user_id: 'text',
      book_id: 'text',
      color: 'text',
      location: 'text',
      text: 'text',
      chapter: 'text',
      page: 'int',
      ...stamps,
    },
  },
  notes: {
    key: 'id',
    synced: {
      id: 'text',
      user_id: 'text',
      book_id: 'text',
      highlight_id: 'text',
      kind: 'text',
      location: 'text',
      quote: 'text',
      body: 'text',
      chapter: 'text',
      page: 'int',
      ...stamps,
    },
  },
  want_to_read: {
    key: 'id',
    synced: {
      id: 'text',
      user_id: 'text',
      title: 'text',
      author: 'text',
      note: 'text',
      position: 'real',
      added_to_library: 'bool',
      ...stamps,
    },
  },
  challenges: {
    key: 'id',
    synced: {
      id: 'text',
      user_id: 'text',
      period: 'text',
      target_type: 'text',
      target: 'int',
      starts_on: 'text',
      ends_on: 'text',
      status: 'text',
      completed_at: 'text',
      ...stamps,
    },
  },
} as const satisfies Record<string, TableDef>;

export type TableName = keyof typeof tables;

/** Push order: parents before children (foreign keys on the server). */
export const syncOrder: TableName[] = [
  'profiles',
  'books',
  'reading_progress',
  'reading_sessions',
  'highlights',
  'notes',
  'want_to_read',
  'challenges',
];

const sqlType = (k: ColumnKind) => (k === 'text' ? 'TEXT' : k === 'real' ? 'REAL' : 'INTEGER');

export function createTableSql(name: TableName): string {
  const def: TableDef = tables[name];
  const cols = { ...def.synced, ...(def.local ?? {}) };
  const lines = Object.entries(cols).map(([c, k]) => `${c} ${sqlType(k)}${c === def.key ? ' PRIMARY KEY NOT NULL' : ''}`);
  lines.push('dirty INTEGER NOT NULL DEFAULT 0');
  return `CREATE TABLE IF NOT EXISTS ${name} (${lines.join(', ')});`;
}

// ------------------------------------------------------------------------------------------------
// Row types (what the app reads). Booleans are real booleans; dates are ISO strings.
// ------------------------------------------------------------------------------------------------
type Stamps = { user_id: string; created_at: string; updated_at: string; deleted_at: string | null; dirty?: number };

export type BookFormat = 'epub' | 'pdf' | 'txt';
export type UploadState = 'pending' | 'uploading' | 'synced' | 'failed';

export type ProfileRow = Stamps & {
  display_name: string;
  goal_type: 'minutes' | 'pages';
  daily_goal: number;
  reminder_time: string;
  reading_mode: 'slide' | 'scroll';
  translation_language: string;
  onboarding_completed: boolean;
  notif_daily: boolean;
  notif_streak: boolean;
  notif_challenge: boolean;
};

export type BookRow = Stamps & {
  id: string;
  title: string;
  author: string | null;
  format: BookFormat;
  file_size: number;
  storage_path: string | null;
  cover_path: string | null;
  cover_seed: number;
  total_pages: number | null;
  source_name: string | null;
  finished_at: string | null;
  last_opened_at: string | null;
  local_path: string | null;
  local_cover: string | null;
  upload_state: UploadState | null;
};

export type ProgressRow = Stamps & {
  id: string;
  book_id: string;
  location: string;
  percent: number;
  page: number | null;
  chapter: string | null;
};

export type SessionRow = Stamps & {
  id: string;
  book_id: string | null;
  local_date: string;
  started_at: string;
  ended_at: string;
  seconds: number;
  pages: number;
};

export type HighlightRow = Stamps & {
  id: string;
  book_id: string;
  color: string;
  location: string;
  text: string;
  chapter: string | null;
  page: number | null;
};

export type NoteRow = Stamps & {
  id: string;
  book_id: string;
  highlight_id: string | null;
  kind: 'note' | 'meaning' | 'translation';
  location: string | null;
  quote: string | null;
  body: string;
  chapter: string | null;
  page: number | null;
};

export type WantRow = Stamps & {
  id: string;
  title: string;
  author: string | null;
  note: string | null;
  position: number;
  added_to_library: boolean;
};

export type ChallengeRow = Stamps & {
  id: string;
  period: 'week' | 'month';
  target_type: 'books' | 'pages' | 'minutes' | 'goal_days';
  target: number;
  starts_on: string;
  ends_on: string;
  status: 'active' | 'completed' | 'missed';
  completed_at: string | null;
};

export type RowOf = {
  profiles: ProfileRow;
  books: BookRow;
  reading_progress: ProgressRow;
  reading_sessions: SessionRow;
  highlights: HighlightRow;
  notes: NoteRow;
  want_to_read: WantRow;
  challenges: ChallengeRow;
};
