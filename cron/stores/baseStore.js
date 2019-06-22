const _ = require('underscore');

module.exports = class BaseStore {
    startImport(callback) {};

    processOffer(callback) {};

    createOffer(doc, offer, callback) {};

    updateOffer(offer, callback) {};

    static normalizeName(name) {
        let normalizedName = name;
        //normalizedName = normalizedName.replace(/[^A-z0-9]/g, '');
        normalizedName = normalizedName.toLowerCase().replace(' ', '');

        return normalizedName;
    };

    static isEqual(a, b) {
        return _.isEqual(a, b)
    };

    static sleep(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};