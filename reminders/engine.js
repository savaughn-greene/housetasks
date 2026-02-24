require('dotenv').config();
const twilio = require('twilio');
const db = require('../db');

// Lazy-initialize Twilio so the module loads safely even with placeholder creds
let _twilioClient = null;
function getTwilioClient() {
  if (!_twilioClient) {
    _twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _twilioClient;
}

/**
 * Send an SMS to Sav.
 */
async function sendSMS(message) {
  try {
    await getTwilioClient().messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.SAV_PHONE_NUMBER,
    });
    console.log(`[SMS SENT] ${message.substring(0, 60)}...`);
  } catch (err) {
    console.error('[SMS ERROR]', err.message);
  }
}

/**
 * Calculate days until a date string (YYYY-MM-DD).
 */
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Fire a specific reminder by ID (called from scheduler).
 * Checks for overrides before sending.
 */
async function fireReminder(reminderId) {
  const reminder = db.getReminderById(reminderId);
  if (!reminder || !reminder.active) return;

  // Check for today's override
  if (db.hasOverrideForToday(reminderId)) {
    console.log(`[REMINDER] Skipping reminder #${reminderId} (override active)`);
    return;
  }

  await sendSMS(reminder.message);
  db.updateReminderLastSent(reminderId);
}

/**
 * Daily event check — runs at 8am.
 * Sends alerts for events within reminder_days_before threshold.
 */
async function checkUpcomingEvents() {
  // Get events where today is within their reminder window
  const allEvents = db.getAllUpcomingEvents(100);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const event of allEvents) {
    if (event.reminded) continue;

    const eventDate = new Date(event.date + 'T00:00:00');
    const daysLeft = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft <= event.reminder_days_before && daysLeft >= 0) {
      const daysText = daysLeft === 0
        ? 'TODAY'
        : daysLeft === 1
          ? 'tomorrow'
          : `in ${daysLeft} days`;

      const msg = `🎉 Heads up: "${event.title}" is ${daysText}${event.notes ? ' — ' + event.notes : ''}. Need a gift or card?`;
      await sendSMS(msg);
      db.markEventReminded(event.id);
    }
  }
}

module.exports = { fireReminder, checkUpcomingEvents, sendSMS };
