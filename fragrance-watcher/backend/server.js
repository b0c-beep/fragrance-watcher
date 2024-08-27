// backend/server.js
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const port = 5000;

//app.use(cors());
//app.use(express.json());

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Endpoint to run the script
app.get('/run-script', (req, res) => {
    // Define the path to your script and the JSON output file
    const scriptPath = path.join(__dirname, '', 'scrape.js');
    const outputPath = path.join(__dirname, '', 'results.json');

    // Use exec to run the script with an increased timeout
    exec(`node "${scriptPath}"`, { timeout: 0 }, (error, stdout, stderr) => {
        console.log('ran script');
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).send(`Error executing script: ${error.message}`);
        }
        if (stderr) {
            console.error(`Script error output: ${stderr}`);
            //return res.status(500).send(`Script error output: ${stderr}`);
        }

        // After the script has finished, read the JSON output file
        fs.readFile(outputPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading JSON file: ${err}`);
                return res.status(500).send(`Error reading JSON file: ${err.message}`);
            }

            // Parse the JSON data
            try {
                const jsonData = JSON.parse(data);
                res.json(jsonData);  // Send the JSON response
            } catch (parseError) {
                console.error(`Error parsing JSON: ${parseError}`);
                res.status(500).send(`Error parsing JSON: ${parseError.message}`);
            }
        });
    });
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
