const express = require('express');
const rateLimit = require('express-rate-limit');
const requestIp = require('request-ip');
const GameDig = require('gamedig');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(requestIp.mw());

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Middleware to check for private IP addresses
function checkPrivateIP(req, res, next) {
  const ip = req.clientIp;
  const isPrivate = ip.startsWith('10.') || ip.startsWith('172.16.') || ip.startsWith('192.168.') || ip === '127.0.0.1';
  if (isPrivate) {
    return res.status(403).json({ message: 'Private IPs are not allowed.' });
  }
  next();
}

// Apply the rate limiting middleware to specific route
app.use('/api/query', apiLimiter);

// Apply the private IP check middleware to specific route
app.use('/api/query', checkPrivateIP);

// POST route for querying GameDig
app.post('/api/query', async (req, res) => {
  const { type, host, port } = req.body;

  if (!type || !host || !port) {
    return res.status(400).json({ message: 'Missing required fields: type, host, or port.' });
  }

  try {
    const query = await GameDig.query({
      type,
      host,
      port,
    });
    return res.json(query);
  } catch (error) {
    return res.status(500).json({ message: 'Error querying server.', error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
