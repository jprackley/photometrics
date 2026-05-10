const express = require('express')
const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

//For local execution
if (require.main === module) {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
}

module.exports = app;
