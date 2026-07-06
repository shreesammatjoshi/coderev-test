require('dotenv').config();
const express = require('express');
const webhookRouter = require('./webhook');
const app = express();

// Keep the raw request body around (as bytes) so the webhook route can
// verify GitHub's HMAC signature against the exact payload GitHub signed.
// Re-serializing req.body with JSON.stringify() is NOT equivalent to the
// original bytes and will cause valid webhooks to fail verification.
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use('/api', webhookRouter);

app.get('/', (req, res) => {
  res.send('AI Code Review Agent is running 🤖');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});