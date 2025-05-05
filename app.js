const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();

// Serve static files from 'public' folder (e.g., index.html, style.css)
app.use(express.static('public'));

// Configure multer to upload Word files to 'uploads' directory
const upload = multer({ dest: 'uploads/' });

// POST route to handle file upload and conversion
app.post('/convert', upload.single('wordFile'), (req, res) => {
  const inputPath = path.join(__dirname, req.file.path);
  const outputDir = path.join(__dirname, 'converted');

  // Path to LibreOffice (local system path - must be available on server)
  const soffice = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

  // Execute conversion command
  exec(`${soffice} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Conversion error:', stderr);
      return res.status(500).send('Conversion failed');
    }

    // Wait a bit before reading the converted file
    setTimeout(() => {
      fs.readdir(outputDir, (err, files) => {
        if (err) return res.status(500).send('Error reading output directory');

        const pdfFiles = files.filter(file => file.endsWith('.pdf'));
        if (pdfFiles.length === 0) return res.status(500).send('No PDF generated');

        // Get the most recently modified PDF file
        const latestPdf = path.join(outputDir, pdfFiles.sort((a, b) => {
          return fs.statSync(path.join(outputDir, b)).mtime - fs.statSync(path.join(outputDir, a)).mtime;
        })[0]);

        res.download(latestPdf, 'converted.pdf');
      });
    }, 1000);
  });
});

// ✅ IMPORTANT FOR VERCEL: Export app instead of using app.listen
module.exports = app;
