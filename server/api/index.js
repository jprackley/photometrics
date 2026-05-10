const express = require('express')
const path = require('path')
const app = express()

const clientDistPath = path.join(__dirname, '..', 'dist');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(clientDistPath));

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

//For local execution
if (require.main === module) {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
}

module.exports = app;
