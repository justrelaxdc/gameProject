const needle = require('needle');
const gamesModel = require('../../models/gamesModel');
const each = require('async/each');

const BaseStore = require('./baseStore');

module.exports = class Steampay extends BaseStore {
    static startImport(globalCallback) {
        console.log('Steampay synchronization started!');
        needle.get('https://steampay.com/api/products', function (error, response) { // Get data form api
            if (error || response.statusCode !== 200) globalCallback(error || response.statusCode);
            if (!response.body.products) globalCallback('got no products Steampay'); // If we got smth else send error

            // Go through all objects in array at the time
            each(response.body.products, Steampay.processOffer, (err) => { // Fires after all requests finished or error
                console.log("Steampay synchronization finished!");
                globalCallback(err); // Fire err if it's not empty
            });
        });
    };

    static processOffer(offer, callback) {
        /** @namespace offer.is_available */
        /** @namespace offer.num_in_stock */
        /** @namespace offer.url */
        /** @namespace offer.image */
        /** @namespace offer.title */
        /** @namespace offer.activation */
        /** @namespace offer.prices */
        /** @namespace offer.id */

        gamesModel.findById(BaseStore.normalizeName(offer.title), function (err, doc) {
            if (err) return callback(err);

            if (doc) {
                Steampay.updateOffer(doc, offer, callback);
            } else {
                Steampay.createOffer(offer, callback);
            }
        });
    };

    static updateOffer(doc, offer, callback) {
        const oldDoc = doc.toJSON();
        const newPrices = {
            rub: offer.prices.rub,
            usd: offer.prices.usd,
            eur: offer.prices.eur,
            grn: offer.prices.grn,
        };
        const oldPrices = doc.get('offers.steampay.currentPrice');
        const priceChanged = !super.isEqual(newPrices, oldPrices);

        doc.set('offers.steampay', {
            ...doc.get('offers.steampay'),
            serviceName: 'Steampay',
            serviceURL: 'steampay.com',
            currentPrice: newPrices,
            url: offer.url,
            numInStock: offer.num_in_stock,
            isAvalible: offer.is_available,
            info: {
                image: offer.image,
                activation: offer.activation
            },
            priceStory: {
                ...doc.get('offers.steampay.priceStory'),
                ...(priceChanged && {[Date.now()]: newPrices})
            },
            activation: offer.activation
        });

        if (!super.isEqual(oldDoc, doc.toJSON())) {
            doc.save((err) => {
                console.log('Offer updated Steampay');
                callback(err);
            });
        } else {
            console.log('Offer NOT updated Steampay');
            callback();
        }
    };

    static createOffer(offer, callback) {
        gamesModel({
            name: offer.title,
            _id: BaseStore.normalizeName(offer.title),
            uri: encodeURI(offer.title),
            offers: {
                steampay: {
                    serviceName: 'Steampay',
                    serviceURL: 'steampay.com',
                    currentPrice: {
                        rub: offer.prices.rub,
                        usd: offer.prices.usd,
                        eur: offer.prices.eur,
                        grn: offer.prices.grn,
                    },
                    priceStory: {
                        [Date.now()]: {
                            rub: offer.prices.rub,
                            usd: offer.prices.usd,
                            eur: offer.prices.eur,
                            grn: offer.prices.grn,
                        }
                    },
                    url: offer.url,
                    numInStock: offer.num_in_stock,
                    isAvalible: offer.is_available,
                    info: {
                        image: offer.image,
                        activation: offer.activation
                    }
                }
            }
        }).save((err) => {
            if(err && err.code === 11000) // If duplicate key error
                callback();
            else
                callback(err);
            console.log('Offer created Steampay!');
        });
    };
};


