const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const assetsDir = path.join(__dirname, 'assets');

app.get('/assets', (req, res) => {
  fs.readdir(assetsDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan assets directory');
    }
    const assetUrls = files.map(file => `http://localhost:${port}/assets/${file}`);
    res.json(assetUrls);
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 