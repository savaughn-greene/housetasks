require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sav-agent.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    frequency TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT,
    message TEXT,
    cron_expression TEXT,
    active INTEGER DEFAULT 1,
    last_sent TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    notes TEXT,
    reminder_days_before INTEGER DEFAULT 7,
    reminded INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS conversation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    content TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id INTEGER,
    skip_date TEXT,
    note TEXT
  );
`);

// ─── Profile ─────────────────────────────────────────────────────────────────

function setProfile(key, value) {
  db.prepare('INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)').run(key, value);
}

function getProfile(key) {
  const row = db.prepare('SELECT value FROM profile WHERE key = ?').get(key);
  return row ? row.value : null;
}

function getAllProfile() {
  return db.prepare('SELECT key, value FROM profile').all();
}

function isProfileEmpty() {
  const row = db.prepare('SELECT COUNT(*) as count FROM profile').get();
  return row.count === 0;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function insertCard(card) {
  db.prepare(
    'INSERT OR REPLACE INTO cards (id, name, category, frequency, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(card.id, card.name, card.category, card.frequency, card.notes || null);
}

function getAllCards() {
  return db.prepare('SELECT * FROM cards').all();
}

// ─── Reminders ───────────────────────────────────────────────────────────────

function insertReminder(reminder) {
  return db.prepare(
    'INSERT INTO reminders (card_id, message, cron_expression) VALUES (?, ?, ?)'
  ).run(reminder.card_id, reminder.message, reminder.cron).lastInsertRowid;
}

function getActiveReminders() {
  return db.prepare('SELECT * FROM reminders WHERE active = 1').all();
}

function getReminderById(id) {
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
}

function updateReminderLastSent(id) {
  db.prepare('UPDATE reminders SET last_sent = ? WHERE id = ?').run(
    new Date().toISOString(), id
  );
}

function deactivateReminder(id) {
  db.prepare('UPDATE reminders SET active = 0 WHERE id = ?').run(id);
}

function addReminder({ card_id, message, cron_expression }) {
  return db.prepare(
    'INSERT INTO reminders (card_id, message, cron_expression) VALUES (?, ?, ?)'
  ).run(card_id, message, cron_expression).lastInsertRowid;
}

// ─── Events ──────────────────────────────────────────────────────────────────

function insertEvent(event) {
  return db.prepare(
    'INSERT INTO events (title, date, notes, reminder_days_before) VALUES (?, ?, ?, ?)'
  ).run(
    event.title,
    event.date,
    event.notes || null,
    event.reminder_days_before || 7
  ).lastInsertRowid;
}

function getUpcomingEvents(daysAhead = 7) {
  const today = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = future.toISOString().split('T')[0];

  return db.prepare(
    'SELECT * FROM events WHERE date >= ? AND date <= ? AND reminded = 0 ORDER BY date ASC'
  ).all(todayStr, futureStr);
}

function getAllUpcomingEvents(limit = 10) {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(
    'SELECT * FROM events WHERE date >= ? ORDER BY date ASC LIMIT ?'
  ).all(today, limit);
}

function markEventReminded(id) {
  db.prepare('UPDATE events SET reminded = 1 WHERE id = ?').run(id);
}

// ─── Conversation ─────────────────────────────────────────────────────────────

function saveMessage(role, content) {
  db.prepare(
    'INSERT INTO conversation (role, content, timestamp) VALUES (?, ?, ?)'
  ).run(role, content, new Date().toISOString());
}

function getRecentMessages(limit = 10) {
  return db.prepare(
    'SELECT role, content FROM conversation ORDER BY id DESC LIMIT ?'
  ).all(limit).reverse();
}

function clearOldMessages(keepLast = 50) {
  db.prepare(`
    DELETE FROM conversation WHERE id NOT IN (
      SELECT id FROM conversation ORDER BY id DESC LIMIT ?
    )
  `).run(keepLast);
}

// ─── Overrides ────────────────────────────────────────────────────────────────

function addOverride(reminderId, skipDate, note) {
  db.prepare(
    'INSERT INTO overrides (reminder_id, skip_date, note) VALUES (?, ?, ?)'
  ).run(reminderId, skipDate, note || null);
}

function hasOverrideForToday(reminderId) {
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare(
    'SELECT id FROM overrides WHERE reminder_id = ? AND skip_date = ?'
  ).get(reminderId, today);
  return !!row;
}

// ─── Reminders are empty check ────────────────────────────────────────────────

function areRemindersEmpty() {
  const row = db.prepare('SELECT COUNT(*) as count FROM reminders').get();
  return row.count === 0;
}

module.exports = {
  db,
  // Profile
  setProfile, getProfile, getAllProfile, isProfileEmpty,
  // Cards
  insertCard, getAllCards,
  // Reminders
  insertReminder, getActiveReminders, getReminderById,
  updateReminderLastSent, deactivateReminder, addReminder, areRemindersEmpty,
  // Events
  insertEvent, getUpcomingEvents, getAllUpcomingEvents, markEventReminded,
  // Conversation
  saveMessage, getRecentMessages, clearOldMessages,
  // Overrides
  addOverride, hasOverrideForToday,
};
