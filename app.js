'use strict'

const express = require('express');
const app = express();
const port = parseInt(process.env.PORT) || 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
