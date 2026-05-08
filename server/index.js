const express = require('express')
const index = express()
const port = 3000

index.get('/', (req, res) => {
    res.send('Hello Team Photography!')
})

index.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
