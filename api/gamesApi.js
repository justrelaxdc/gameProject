const gamesModel = require('../models/gamesModel');

const getGames = (req, res) => {
    const limit = Number(req.query.limit);

    gamesModel.find((err, games) => {
        if (err) return res.send(err);
        res.send(games);
    }).limit(limit);
};

const getGame = (req, res) => {
    const name = req.params.name;

    gamesModel.findOne({name}, (err, game) => {
        if (err) return res.send(err);
        res.send(game);
    });
};

const findGames = (req, res) => {
    const {name} = req.params;
    const limit = Number(req.query.limit);

    gamesModel.find({$text: {$search: name}}, (err, games) => {
        if (err) return res.send(err);
        res.send(games);
    }).limit(limit);
};

module.exports = {
    getGames,
    getGame,
    findGames
};