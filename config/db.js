const mongoose = require('mongoose');

const userName = 'main-nodejs-server';
const userPassword = '998877asdf';
const dbName = 'Game-store';

// Connect to the database
mongoose.connect(`mongodb+srv://${userName}:${userPassword}@cluster0-bjcoo.mongodb.net/${dbName}?retryWrites=true`, { useNewUrlParser: true, autoReconnect: true, ssl: true });

mongoose.set('useCreateIndex', true);

process.on('uncaughtException', function (err) { // Prevent uncaughtException Error: read ECONNRESET to crush app when too  much requests to mongo
    console.error(err.stack);
});

module.exports = mongoose;