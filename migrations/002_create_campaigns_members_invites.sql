-- migrations/002_create_campaigns_members_invites.sql
BEGIN TRANSACTION;

-- campaigns já existe (migration 001). Se não existir, crie minimal:
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- campaign members: which users belong to each campaign
CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player', -- 'player' | 'gm' | 'owner'
  joined_at TEXT NOT NULL,
  PRIMARY KEY (campaign_id, user_id)
);

-- invites: master can create invite tokens or target usernames
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  invited_username TEXT,       -- optional: invite by username
  token TEXT,                  -- optional: token link (random)
  role TEXT NOT NULL DEFAULT 'player', -- role offered by invite
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' -- open | accepted | revoked
);

-- ficha_requests: player proposes a ficha to be linked to a campaign
CREATE TABLE IF NOT EXISTS ficha_requests (
  id TEXT PRIMARY KEY,
  ficha_playerId TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TEXT NOT NULL,
  handled_by TEXT,
  handled_at TEXT
);

-- messages: simple campaign messages / announcements
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'note', -- note | info | system
  created_at TEXT NOT NULL
);

-- activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT,
  user_id TEXT,
  action TEXT,
  payload TEXT,
  created_at TEXT
);

COMMIT;
