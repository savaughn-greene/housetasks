require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const { handleInboundSMS } = require('./handlers/inbound-sms');
const { startScheduler } = require('./scheduler');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (req, res) => {
  res.send('Sav Agent is running.');
});

// Twilio SMS webhook
app.post('/webhook/sms', async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;

  // Normalize phone numbers for comparison (strip formatting)
  const normalizePhone = (p) => p ? p.replace(/\s+/g, '').replace(/-/g, '') : '';
  const fromNorm = normalizePhone(from);
  const savNorm = normalizePhone(process.env.SAV_PHONE_NUMBER);

  if (fromNorm !== savNorm) {
    console.log(`Rejected SMS from unknown number: ${from}`);
    return res.sendStatus(403);
  }

  console.log(`[SMS IN] ${from}: ${incomingMsg}`);

  try {
    const reply = await handleInboundSMS(incomingMsg);
    console.log(`[SMS OUT]: ${reply}`);

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml').send(twiml.toString());
  } catch (err) {
    console.error('Error handling SMS:', err);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I ran into an error. Try again in a moment.");
    res.type('text/xml').send(twiml.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Sav Agent listening on port ${PORT}`);
  startScheduler();
});
