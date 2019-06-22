const bodyParser = require('body-parser');

const {getGames, getGame, findGames} = require('../api/gamesApi');
const {} = require('../api/usersApi');

const urlencodedParser = bodyParser.urlencoded({extended: false});

module.exports = (app) => {
    app.get('/api', (req, res) => {
        res.send('Glad to see you!');
    });

    app.get('/api/games', getGames);
    app.get('/api/games/:name', (req, res) => {
        if(req.query.find === 'true')
            findGames(req, res);
        else
            getGame(req, res);
    });
};

