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
//app.use(express.urlencoded({ extended: true }));

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
        
        const title = req.body.title; // Access the title from req.body
        if (!title) {
            //console.error('Title is missing. Using "untitled" as fallback.');
            return cb(null, 'untitled' + path.extname(file.originalname));  // Fallback to "untitled"
        }
        
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

// New endpoint to get fragrance names only
app.get('/fragrance-names', (req, res) => {
    const filePath = path.join(__dirname, '', 'fragrances.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading JSON file: ${err}`);
            return res.status(500).send(`Error reading JSON file: ${err.message}`);
        }

        try {
            const jsonData = JSON.parse(data);
            // Extract the keys (fragrance names)
            const fragranceNames = Object.keys(jsonData);
            res.json(fragranceNames);
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

// New endpoint to handle image uploads
app.post('/upload-image', upload.single('image'), (req, res) => {
    //console.log('Title received:', req.body.title);  // Log to debug
    //console.log('File received:', req.file);  // Log file details to ensure multer is working correctly
    const title = req.body.title; // Access the title from req.body
    const originalFilePath = req.file.path; // Original file path (untitled)

    if (!title) {
        return res.status(400).send('Title is required.');
    }

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize the title
    const fileExtension = path.extname(req.file.originalname); // Extract original file extension
    const newFileName = `${sanitizedTitle}${fileExtension}`; // New file name
    const newFilePath = path.join(req.file.destination, newFileName); // New file path

    // Rename the file after it has been uploaded
    fs.rename(originalFilePath, newFilePath, (err) => {
        if (err) {
        console.error('Error renaming file:', err);
        return res.status(500).send('Error renaming file.');
        }

        if (!req.file) {
            return res.status(400).send('No image uploaded.');
        }
    });

    const imagePath = `images/${req.file.filename}`;  // Get the image path

    res.status(201).send({ message: 'Image uploaded successfully', imagePath});
});


// Endpoint to delete a specific fragrance by its name
app.delete('/fragrances/:name', (req, res) => {
    const fragranceName = req.params.name;  // Get the fragrance name from the URL parameter
    const filePath = path.join(__dirname, '', 'fragrances.json');  // Path to the JSON file
    
    // Function to find the correct image file extension
    const findImageFilePath = (fragranceName) => {
        const imagesDir = path.join(__dirname, '..', 'public', 'images');

        // Read all files in the directory
        const files = fs.readdirSync(imagesDir);

        // Arrays to store names and extensions
        const names = [];
        const extensions = [];

        // Split names and extensions
        files.forEach(file => {
            const extname = path.extname(file);
            const basename = path.basename(file, extname);
            names.push(basename);
            extensions.push(extname);
        });

        // Find the index of the fragranceName
        const index = names.indexOf(fragranceName);

        if (index === -1) {
            return null;  // File not found
        }

        // Recombine name and extension
        return path.join(imagesDir, `${fragranceName}${extensions[index]}`);
    };

    let imageFilePath = findImageFilePath(fragranceName);  // Get the image file path

    // Read the JSON file to get the current fragrances
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading JSON file: ${err}`);
            return res.status(500).send(`Error reading JSON file: ${err.message}`);
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);  // Parse the JSON data
        } catch (parseError) {
            console.error(`Error parsing JSON: ${parseError}`);
            return res.status(500).send(`Error parsing JSON: ${parseError.message}`);
        }

        // Check if the fragrance exists
        if (!jsonData[fragranceName]) {
            return res.status(404).send(`Fragrance "${fragranceName}" not found.`);
        }

        // Delete the fragrance from the JSON data
        delete jsonData[fragranceName];

        // Write the updated JSON data back to the file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error(`Error writing JSON file: ${writeErr}`);
                return res.status(500).send(`Error writing JSON file: ${writeErr.message}`);
            }

             // Delete the associated image file
             fs.unlink(imageFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Error deleting image file: ${unlinkErr}`);
                    // Proceed to send a success message even if the image could not be deleted
                    return res.status(500).send(`Fragrance deleted, but error deleting image file.`);
                }

                res.status(200).send(`Fragrance "${fragranceName}" deleted successfully.`);
            });

        });
    });
});


// Endpoint to fetch fragrance details by name
app.get('/fragrances/:name', (req, res) => {
    const fragranceName = req.params.name;
    const filePath = path.join(__dirname, 'fragrances.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading JSON file: ${err}`);
            return res.status(500).send(`Error reading JSON file: ${err.message}`);
        }

        try {
            // Parse the data as an object
            const fragrances = JSON.parse(data);

            // Find the fragrance by key (name)
            if (fragrances[fragranceName]) {
                const fragranceDetails = fragrances[fragranceName];
                res.json(fragranceDetails);
            } else {
                res.status(404).send('Fragrance not found');
            }
        } catch (parseError) {
            console.error(`Error parsing JSON: ${parseError}`);
            res.status(500).send(`Error parsing JSON: ${parseError.message}`);
        }
    });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
