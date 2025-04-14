const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let primitives = [];

app.get('/primitives', (req, res) => {
    res.json(primitives);
});

app.post('/primitives', (req, res) => {
    const primitive = req.body;
    primitives.push(primitive);
    res.json(primitives);
});

app.delete('/primitives/:index', (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < primitives.length) {
        primitives.splice(index, 1);
    }
    res.json(primitives);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
