require('dotenv').config();
const express = require('express');
const inviteUserRouter = require('./inviteUser');
const app = express();

app.use(express.json());
app.use('/api', inviteUserRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
