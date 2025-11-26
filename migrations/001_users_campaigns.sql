-- Migration: create users and campaign_members (Fase 1)
-- Salve como: migrations/001_init_users_campaigns.sql
-- Execute manualmente ou o servidor criará as tabelas se não existirem.

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'player',
  joined_at TEXT,
  PRIMARY KEY (campaign_id, user_id)
);

COMMIT;