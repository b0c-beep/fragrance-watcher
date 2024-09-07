// backend/server.js
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage for images using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the correct path for the public folder in the root directory
        const imagesPath = path.join(__dirname, '..', 'public', 'images');
        cb(null, imagesPath);  // Directory to save images
    },
    filename: (req, file, cb) => {
         // Use the title from the request body as the file name
         const title = req.body.title || 'untitled';
        
         // Replace any characters that are not letters, numbers, or underscores
         const sanitizedTitle = title.replace(/[^a-zA-Z0-9_]/g, '_');
         
         // Extract the original file extension
         const fileExtension = path.extname(file.originalname);
         
         // Set the filename as the sanitized title with the original file extension
         cb(null, `${sanitizedTitle}${fileExtension}`);
    }
});

const upload = multer({ storage });

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


// Endpoint to get existing fragrance data
app.get('/fragrances', (req, res) => {
    const filePath = path.join(__dirname, '', 'fragrances.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading JSON file: ${err}`);
            return res.status(500).send(`Error reading JSON file: ${err.message}`);
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            console.error(`Error parsing JSON: ${parseError}`);
            res.status(500).send(`Error parsing JSON: ${parseError.message}`);
        }
    });
});

// Endpoint to add a new fragrance
app.post('/fragrances', (req, res) => {
    const newFragrance = req.body;
    const filePath = path.join(__dirname, '', 'fragrances.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading JSON file: ${err}`);
            return res.status(500).send(`Error reading JSON file: ${err.message}`);
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
            
            if(req.file){
                newFragrance.image = `images/${req.file.filename}`;
            }

        } catch (parseError) {
            console.error(`Error parsing JSON: ${parseError}`);
            return res.status(500).send(`Error parsing JSON: ${parseError.message}`);
        }

        
        // Add the new fragrance to the JSON data
        const fragranceKey = Object.keys(newFragrance)[0];
        jsonData[fragranceKey] = newFragrance[fragranceKey];
        

        // Write the updated JSON data back to the file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error(`Error writing JSON file: ${writeErr}`);
                return res.status(500).send(`Error writing JSON file: ${writeErr.message}`);
            }

            res.status(201).send('Fragrance added successfully');
        });
    });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
