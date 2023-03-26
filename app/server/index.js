const path = require('path');
const express = require('express');
const routes = require('./routes/routes');
const cors = require('cors'); 

const PORT = process.env.PORT || 8000;

const app = express();

app.use(
    cors({
        origin: '*'
    })
);

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));
app.use("/api", routes);

app.get('*', (req,res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
})

app.listen(PORT, () => {
    console.log(`Server listening on Port ${PORT}`);
})