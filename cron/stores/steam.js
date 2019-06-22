const needle = require('needle');
const gamesModel = require('../../models/gamesModel');
const eachLimit = require('async/eachLimit');
const cheerio = require("cheerio");

const BaseStore = require('./baseStore');

module.exports = class Steam extends BaseStore {
    static startImport(globalCallback) {
        console.log('Steam synchronization started!');

        needle.get('http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json', function (err, res) {
            if (err || res.statusCode !== 200) return globalCallback('Response: ' + err || res.statusCode);

            /** @namespace res.applist.apps */
            const games = res.body.applist.apps;

            eachLimit(games, 160, Steam.processOffer, (err) => { // Fires after all requests finished or error
                console.log("Steam synchronization finished!");
                globalCallback(err); // Error - stop sync
            });
        })
    };

    static processOffer(game, callback) {
        const params = {
            follow: 2,
            headers: {
                'Accept-Language': 'ru,uk;q=0.9,en;q=0.8,la;q=0.7'
            },
            cookies: {
                birthtime: '628466401',
                lastagecheckage: '1-0-1990',
                wants_mature_content: '1',
                steamCountry: 'UA%7C372473302aba84e00c1cbe2c99854df2',
                timezoneOffset: '10800,0',
                CONSENT: 'YES+UA.ru+20161002-18-0'
            }
        };

        needle.get(`https://store.steampowered.com/app/${game.appid}`, params, function (err, res) {
            if (err || res.statusCode !== 200) return callback();

            const $ = cheerio.load(res.body);
            const offer = {};

            offer.steamId = game.appid;
            offer.name = $('.apphub_AppName').text();
            offer._id = BaseStore.normalizeName(offer.name);
            offer.description = $('#game_area_description').html();
            offer.minReq = $('.game_area_sys_req_leftCol').html();
            offer.recommendedReq = $('.game_area_sys_req_rightCol').html();
            offer.releaseDate = $('.date').text();
            offer.languages = $('.game_language_options').html();
            offer.comingSoon = !offer.releaseDate;
            offer.genres = [];
            offer.tags = [];
            offer.movies = [];
            offer.imagesList = [];
            offer.developers = [];

            if (!offer.name) return callback();

            const $genres = $('.block.responsive_apppage_details_left.game_details.underlined_links .details_block:first-child > a');
            $genres.each((i, e) => {
                offer.genres.push($(e).text());
            });

            const $tags = $('.glance_tags.popular_tags a');
            $tags.each((i, e) => {
                offer.tags.push($(e).text().replace(/[\t\n]/g, ''));
            });

            const $movies = $('#highlight_player_area > .highlight_movie');
            $movies.each((i, e) => {
                offer.movies.push($(e).attr('data-mp4-hd-source'));
            });

            const $images = $('.highlight_screenshot_link');
            $images.each((i, e) => {
                offer.imagesList.push($(e).attr('href'));
            });

            const $developers = $('#developers_list a');
            $developers.each((i, e) => {
                offer.developers.push($(e).text());
            });

            gamesModel.findById(offer._id, function (err, doc) {
                if (err) return callback(err);
                //console.log(offer._id + " - " + offer.steamId);

                // console.log('got ' + offer.name);
                // return callback();

                if (doc) {
                    Steam.updateOffer(doc, offer, callback);
                } else {
                    Steam.createOffer(offer, callback);
                }
            });
        })
    };

    static updateOffer(doc, offer, callback) {
        const oldDoc = doc.toJSON();

        doc.set('offers.steam', {
            ...doc.get('offers.steam'),
            url: `store.steampowered.com/app/${offer.steamId}`,
            numInStock: -1,
            isAvalible: true,
            info: {
                activation: 'STEAM',
                image: offer.imagesList[0],
                imagesList: offer.imagesList,
                genres: offer.genres,
                platforms: ['STEAM'],
                tags: offer.tags,
                releaseDate: offer.releaseDate,
                description: offer.description,
                developers: offer.developers,
                movies: offer.movies,
                supportedLanguages: offer.languages,
                recommendedReq: offer.recommendedReq,
                minReq: offer.minReq,
                comingSoon: offer.comingSoon
            },
        });

        if (!super.isEqual(oldDoc, doc.toJSON())) {
            doc.save((err) => {
                console.log('Offer updated Steam');
                callback(err);
            });
        } else {
            console.log('Offer NOT updated Steam');
            callback();
        }
    };

    static createOffer(offer, callback) {
        gamesModel({
            name: offer.name,
            _id: offer._id,
            uri: encodeURI(offer.name),
            offers: {
                steam: {
                    serviceName: 'Steam',
                    serviceURL: 'store.steampowered.com',
                    url: `store.steampowered.com/app/${offer.steamId}`,
                    numInStock: -1,
                    isAvalible: true,
                    info: {
                        activation: 'STEAM',
                        image: offer.imagesList[0],
                        imagesList: offer.imagesList,
                        genres: offer.genres,
                        platforms: ['STEAM'],
                        tags: offer.tags,
                        releaseDate: offer.releaseDate,
                        description: offer.description,
                        developers: offer.developers,
                        movies: offer.movies,
                        supportedLanguages: offer.languages,
                        recommendedReq: offer.recommendedReq,
                        minReq: offer.minReq,
                        comingSoon: offer.comingSoon
                    },
                }
            }
        }).save((err) => {
            if (err && err.code === 11000) // If duplicate key error
                callback();
            else
                callback(err);

            console.log('Offer created Steam!');
        });
    };
};