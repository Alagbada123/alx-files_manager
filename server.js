#!/usr/bin/node

import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Increase the limit for JSON body
app.use(express.json({ limit: '10mb' }));

app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
