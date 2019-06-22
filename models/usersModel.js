const mdb = require('../config/db');
const ObjectId = require("mongoose/lib/schema").ObjectId;

const userSchema = new mdb.Schema({
    name: String,
    login: String,
    password: String,
    favorites: [ObjectId], // User's favorite games ids
    followPrice: [ObjectId], // Games ids user follows price
    leftComments: [ObjectId] // Games ids where user left comments
});

module.exports = mdb.model('Users', userSchema);