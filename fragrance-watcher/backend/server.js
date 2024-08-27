// backend/server.js
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Endpoint to run the script
app.post('/api/run-script', (req, res) => {
  const scriptPath = path.join(__dirname, 'scrape.js');

  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ error: 'Failed to run the script' });
    }
    console.log(`Script output: ${stdout}`);
    console.error(`Script error output: ${stderr}`);
    
    const resultsPath = path.join(__dirname, 'results.json');
    fs.readFile(resultsPath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        return res.status(500).json({ error: 'Failed to read the results' });
      }
      try {
        const parsedData = JSON.parse(data);
        res.json(parsedData);
      } catch (jsonError) {
        console.error(`Error parsing JSON: ${jsonError.message}`);
        res.status(500).json({ error: 'Failed to parse JSON' });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
