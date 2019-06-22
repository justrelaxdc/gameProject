// Require modules
let express = require('express');

// Require custom modules
let indexController = require('./controllers/indexController');
let apiController = require('./controllers/apiController');
let cron = require('./cron/cron');

// Init app
let app = express();

// Init cron
cron.cronInit();

// Set static files folder
app.use(express.static('./public'));

// Fire controllers
apiController(app);
indexController(app);

// Start listening
app.listen(8200);

