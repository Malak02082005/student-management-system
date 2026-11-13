require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const app = require('./app');

for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`${name} is missing in .env`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
