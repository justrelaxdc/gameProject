let bodyParser = require('body-parser');
let path = require('path');

let urlencodedParser = bodyParser.urlencoded({extended: false});

module.exports = (app) => {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../views', 'index.html'));
    });
};