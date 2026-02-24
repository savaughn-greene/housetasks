require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

/**
 * Send messages to Claude and return the full text response.
 * Uses streaming to avoid timeouts on long responses.
 *
 * @param {string} systemPrompt
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function askClaude(systemPrompt, messages) {
  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const finalMessage = await stream.finalMessage();
  const textBlock = finalMessage.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

module.exports = { askClaude };
