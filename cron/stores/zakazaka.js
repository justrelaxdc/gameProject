const CloudflareBypasser = require('cloudflare-bypasser');
const cheerio = require('cheerio');
const gamesModel = require('../../models/gamesModel');
const forever = require('async/forever');
const each = require('async/each');
const BaseStore = require('./baseStore');

module.exports = class Zakazaka extends BaseStore {
    static startImport(globalCallback) {
        console.log('Zaka-zaka synchronization started!');
        let offset = 0;
        let CFErrorsCount = 0;
        const maxCFErrorsCount = 30;

        const cf = new CloudflareBypasser({
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
        });

        forever((next) => {
                cf.request(`https://zaka-zaka.com/search/sort/sale.desc/offset/${offset}`)
                    .then(res => {
                        const $ = cheerio.load(res.body);
                        const $gamesBlocks = $('.game-block');

                        if ($gamesBlocks.length > 0) { // OK
                            const gamesList = [];

                            $gamesBlocks.each((i, e) => {
                                const gameData = {};
                                const $e = $(e);

                                gameData.name = $e.find('.game-block-name').text();
                                gameData.price = $e.find('.game-block-price').text().replace( /[^0-9]/g, '');
                                gameData.image = 'zaka-zaka.com' + $e.find('.game-block-image').attr('style').replace('background: url(', '').slice(0, -2);
                                gameData.url = $e.attr('href');

                                gamesList.push(gameData);
                            });

                            each(gamesList, Zakazaka.processOffer, err => {
                                offset += 10;
                                next();
                            });
                        } else if ($('.hidden').text()) { // We are blocked
                            if (CFErrorsCount < maxCFErrorsCount) {
                                CFErrorsCount++;
                                next();
                            } else {
                                next('Too much CF errors zaka-zaka.com');
                            }
                        } else { // Finish
                            console.log('Zaka-zaka synchronization finished!');
                            globalCallback();
                        }
                    });
            },
            (err) => { // called when parameter passed to next()
                globalCallback(err);
            });
    };

    static processOffer(offer, callback) {
        /** @namespace offer.name */
        /** @namespace offer.image */
        /** @namespace offer.url */
        /** @namespace offer.price */

        gamesModel.findById(BaseStore.normalizeName(offer.name), function (err, doc) {
            if (err) return callback(err);

            if (doc) {
                Zakazaka.updateOffer(doc, offer, callback);
            } else {
                Zakazaka.createOffer(offer, callback);
            }
        });
    };

    static updateOffer(doc, offer, callback) {
        const oldDoc = doc.toJSON();
        const newPrices = {
            rub: offer.price
        };
        const oldPrices = doc.get('offers.zakazaka.currentPrice');
        const priceChanged = !super.isEqual(newPrices, oldPrices);

        doc.set('offers.zakazaka', {
            ...doc.get('offers.zakazaka'),
            serviceName: 'Zaka-zaka',
            serviceURL: 'zaka-zaka.com',
            currentPrice: newPrices,
            url: offer.url,
            info: {
                image: offer.image
            },
            priceStory: {
                ...doc.get('offers.zakazaka.priceStory'),
                ...(priceChanged && {[Date.now()]: newPrices})
            }
        });

        if (!super.isEqual(oldDoc, doc.toJSON())) {
            doc.save((err) => {
                console.log('Offer updated Zaka-zaka');
                callback(err);
            });
        } else {
            console.log('Offer NOT updated Zaka-zaka');
            callback();
        }
    };

    static createOffer(offer, callback) {
        gamesModel({
            name: offer.name,
            _id: BaseStore.normalizeName(offer.name),
            uri: encodeURI(offer.name),
            offers: {
                zakazaka: {
                    serviceName: 'Zaka-zaka',
                    serviceURL: 'zaka-zaka.com',
                    currentPrice: {
                        rub: offer.price,
                    },
                    priceStory: {
                        [Date.now()]: {
                            rub: offer.price
                        }
                    },
                    url: offer.url,
                    info: {
                        image: offer.image,
                    }
                }
            }
        }).save((err) => {
            if(err && err.code === 11000) // If duplicate key error
                callback();
            else
                callback(err);
            console.log('Offer created Zaka-zaka!');
        });
    };
};


