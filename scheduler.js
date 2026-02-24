const cron = require('node-cron');
const db = require('./db');
const { fireReminder, checkUpcomingEvents } = require('./reminders/engine');

function startScheduler() {
  console.log('Starting scheduler...');

  // ── Daily event check at 8am ─────────────────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running daily event check');
    await checkUpcomingEvents();
  });

  // ── Register cron jobs for all active DB reminders ───────────────────────
  registerReminderJobs();

  console.log('Scheduler started.');
}

/**
 * Load all active reminders from the DB and register a cron job for each.
 * Called once on startup. If you add reminders at runtime, restart the server
 * (or call this again) to pick them up.
 */
function registerReminderJobs() {
  const reminders = db.getActiveReminders();
  let registered = 0;

  for (const reminder of reminders) {
    if (!cron.validate(reminder.cron_expression)) {
      console.warn(`[CRON] Invalid cron expression for reminder #${reminder.id}: "${reminder.cron_expression}"`);
      continue;
    }

    // Capture reminderId in closure
    const reminderId = reminder.id;
    cron.schedule(reminder.cron_expression, async () => {
      console.log(`[CRON] Firing reminder #${reminderId}`);
      await fireReminder(reminderId);
    });

    registered++;
  }

  console.log(`  Registered ${registered} reminder cron jobs`);
}

module.exports = { startScheduler };
