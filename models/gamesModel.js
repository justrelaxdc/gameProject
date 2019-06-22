const mdb = require('../config/db');

// Create a schema
const info = {
    activation: String,
    image: String,
    imagesList: Array,
    genres: Array,
    platforms: Array,
    gameModes: Array,
    tags: Array,
    features: Object,
    releaseDate: String,
    description: String,
    isFree: Boolean,
    developers: Array,
    movies: Array,
    supportedLanguages: String,
    recommendedReq: String,
    minReq: String,
    comingSoon: Boolean
};

const offers = {
    type: Map,
    of: {
        serviceName: String,
        serviceURL: String,
        currentPrice: {
            rub: Number,
            usd: Number,
            eur: Number,
            grn: Number
        },
        priceStory: {
            type: Map,
            of: {
                rub: Number,
                usd: Number,
                eur: Number,
                grn: Number
            }
        },
        url: String,
        numInStock: Number,
        isAvalible: Boolean,
        info: info,
    }
};

const gameSchema = new mdb.Schema({
    name: {type: String, unique: true},
    _id: String,
    uri: String,
    offers: offers,
    comments: [Object]
});

gameSchema.index({name: 'text', 'info.description': 'text'}, {weights: {name: 3, 'info.description': 2}});
gameSchema.post('findById', function (error, res, next) {
    console.log('Some error occur');
    console.log(error);
});

module.exports = mdb.model('Games', gameSchema);
