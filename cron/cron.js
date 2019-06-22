const cron = require('cron');
const series = require('async/series');

const steam = require("./stores/steam");
const steampay = require('./stores/steampay');
const zakazaka = require('./stores/zakazaka');

// Array of all stores' start functions
const dataStores = [
    //steampay.startImport,
    //zakazaka.startImport,
    //steam.startImport,
];

let canCronStart = true;

module.exports.cronInit = () => {

    new cron.CronJob('0 */20 * * * *', function (err) {
        if (!canCronStart || err) return;
        canCronStart = false;

        console.log('Started full synchronization');

        // Go through all stores one after one and save data in db
        series(dataStores, (err) => { // callback fires when all functions are done or err
            canCronStart = true;
            err && console.log('CRON sync error: ' + err);
            console.log('Did full synchronization');
        });
    }, null, true, 'America/Los_Angeles', null, true);

};

