const db = require('../db');
const { askClaude } = require('../claude');

/**
 * Build the system prompt with live data from the DB.
 */
function buildSystemPrompt() {
  const profileRows = db.getAllProfile();
  const profileText = profileRows.map(r => `${r.key}: ${r.value}`).join('\n');

  const cards = db.getAllCards();
  const cardsText = cards.map(c =>
    `- ${c.name} [${c.category}, ${c.frequency}]${c.notes ? ': ' + c.notes : ''}`
  ).join('\n');

  const upcomingEvents = db.getAllUpcomingEvents(10);
  const eventsText = upcomingEvents.length
    ? upcomingEvents.map(e => `- ${e.title} on ${e.date}${e.notes ? ' (' + e.notes + ')' : ''}`).join('\n')
    : 'No upcoming events.';

  const reminders = db.getActiveReminders();
  const remindersText = reminders.map(r =>
    `- [${r.card_id}] "${r.message}" (cron: ${r.cron_expression})`
  ).join('\n');

  return `You are Sav's personal household agent. You know everything about his life, schedule, and responsibilities.

Your job is to:
1. Answer questions about what he needs to do and when
2. Help him plan (groceries, meals, events)
3. Update his schedule when he tells you things have changed
4. Be brief and direct — he has ADHD, so no walls of text. Max 3-4 sentences unless he asks for more.
5. When he wants to make a change, respond with a JSON action block so the system can update the database.

His profile and current schedule are provided below. Use this as ground truth.

When you need to update something, include this at the END of your response:
<action>
{
  "type": "add_event" | "skip_reminder" | "update_profile" | "add_reminder" | "complete_task",
  "data": { ... relevant fields ... }
}
</action>

For add_event, data needs: title, date (YYYY-MM-DD), notes (optional), reminder_days_before (optional, default 7)
For skip_reminder, data needs: reminder_id (integer), note (optional)
For update_profile, data needs: key, value
For add_reminder, data needs: card_id, message, cron_expression

If no DB update is needed, just reply conversationally. Keep it warm but efficient.

--- SAV'S PROFILE ---
${profileText}

--- HIS FAIR PLAY CARDS ---
${cardsText}

--- UPCOMING EVENTS ---
${eventsText}

--- ACTIVE REMINDERS ---
${remindersText}`;
}

/**
 * Parse an <action>...</action> block from Claude's response.
 * Returns { text, action } where action may be null.
 */
function parseActionBlock(response) {
  const actionMatch = response.match(/<action>\s*([\s\S]*?)\s*<\/action>/);
  if (!actionMatch) {
    return { text: response.trim(), action: null };
  }

  const text = response.replace(/<action>[\s\S]*?<\/action>/, '').trim();

  try {
    const action = JSON.parse(actionMatch[1]);
    return { text, action };
  } catch (err) {
    console.error('Failed to parse action block:', actionMatch[1], err);
    return { text, action: null };
  }
}

/**
 * Execute a structured action returned by Claude.
 */
function executeAction(action) {
  if (!action || !action.type) return;

  console.log('[ACTION]', JSON.stringify(action));

  switch (action.type) {
    case 'add_event': {
      const { title, date, notes, reminder_days_before } = action.data;
      if (title && date) {
        const id = db.insertEvent({ title, date, notes, reminder_days_before });
        console.log(`  Added event #${id}: ${title} on ${date}`);
      }
      break;
    }
    case 'skip_reminder': {
      const { reminder_id, note } = action.data;
      if (reminder_id) {
        const today = new Date().toISOString().split('T')[0];
        db.addOverride(reminder_id, today, note);
        console.log(`  Skipping reminder #${reminder_id} for today`);
      }
      break;
    }
    case 'update_profile': {
      const { key, value } = action.data;
      if (key && value) {
        db.setProfile(key, value);
        console.log(`  Updated profile: ${key} = ${value}`);
      }
      break;
    }
    case 'add_reminder': {
      const { card_id, message, cron_expression } = action.data;
      if (card_id && message && cron_expression) {
        const id = db.addReminder({ card_id, message, cron_expression });
        console.log(`  Added reminder #${id} for card ${card_id}`);
      }
      break;
    }
    default:
      console.log(`  Unknown action type: ${action.type}`);
  }
}

/**
 * Main handler for inbound SMS from Sav.
 */
async function handleInboundSMS(incomingText) {
  // 1. Save incoming message
  db.saveMessage('user', incomingText);

  // 2. Pull conversation history
  const history = db.getRecentMessages(10);

  // 3. Build messages array for Claude (history already includes current message)
  const messages = history.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Ensure messages alternate properly (Claude requires user/assistant alternation)
  // If last message is not from user something is off, but usually it's fine since we just saved
  const cleanedMessages = [];
  for (const msg of messages) {
    if (cleanedMessages.length === 0) {
      if (msg.role !== 'user') continue; // skip leading assistant messages
      cleanedMessages.push(msg);
    } else {
      const lastRole = cleanedMessages[cleanedMessages.length - 1].role;
      if (msg.role === lastRole) {
        // Merge consecutive same-role messages
        cleanedMessages[cleanedMessages.length - 1].content += '\n' + msg.content;
      } else {
        cleanedMessages.push(msg);
      }
    }
  }

  // 4. Build system prompt with live DB data
  const systemPrompt = buildSystemPrompt();

  // 5. Call Claude
  const rawReply = await askClaude(systemPrompt, cleanedMessages);

  // 6. Parse and execute any action block
  const { text: replyText, action } = parseActionBlock(rawReply);
  executeAction(action);

  // 7. Save Claude's reply (without the action block)
  db.saveMessage('assistant', replyText);

  // 8. Clean up old messages to keep DB tidy
  db.clearOldMessages(50);

  return replyText;
}

module.exports = { handleInboundSMS };
