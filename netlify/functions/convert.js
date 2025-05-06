const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const libre = require('libreoffice-convert');
const { exec } = require('child_process');


const app = express();
const port = 5000;

app.use(express.static('public'));

// Create folders if not exist
['uploads', 'converted'].forEach(folder => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// WORD TO PDF
app.post('/word-to-pdf', upload.single('docfile'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `converted/${Date.now()}-output.pdf`;
  const ext = '.pdf';

  const fileData = fs.readFileSync(inputPath);
  libre.convert(fileData, ext, undefined, (err, done) => {
    if (err) {
      console.error('Conversion error:', err);
      return res.status(500).send('Conversion failed.');
    }
    fs.writeFileSync(outputPath, done);
    res.download(outputPath, 'converted.pdf');
  });
});

// IMAGES TO PDF
app.post('/images-to-pdf', upload.array('images', 10), (req, res) => {
  const doc = new PDFDocument();
  const outputPath = `converted/${Date.now()}-images.pdf`;
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);
  req.files.forEach((file, index) => {
    if (index !== 0) doc.addPage();
    doc.image(file.path, {
      fit: [500, 700],
      align: 'center',
      valign: 'center'
    });
  });
  doc.end();

  stream.on('finish', () => res.download(outputPath, 'images.pdf'));
});

app.post('/pdf-to-word', upload.single('pdffile'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = `converted/${Date.now()}-output.docx`;
  
    const command = `python scripts/convert_pdf_to_docx.py "${inputPath}" "${outputPath}"`;
  
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Conversion error: ${stderr}`);
        return res.status(500).send('Conversion failed');
      }
      res.download(outputPath, 'converted.docx', (err) => {
        if (err) console.error('Download error:', err);
      });
    });
  });
  

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
