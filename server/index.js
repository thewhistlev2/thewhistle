const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const session = require('express-session')
const dotenv = require('dotenv');
const errorhandler = require('errorhandler');
const localtunnel = require('localtunnel');
const _ = require('underscore');

const routeAuth = require('../middleware/routeAuth.js')
const api = require('./api/index.js')
const { logError } = require('./utils/errors/logError.js')


const app = express()

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js');
const nuxtConfig = require('../nuxt.config.js');
config.dev = !(process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'staging')

async function configNuxt() {
    // Init Nuxt.js
    const nuxt = new Nuxt(config);

    // Build only in dev mode
    if (config.dev) {
        const builder = new Builder(nuxt);
        await builder.build();
    } else {
        await nuxt.ready();
    }
    return nuxt;
}

async function start() {
    dotenv.config();
    let nuxt = await configNuxt();
    const { host, port } = nuxt.options.server;
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(cookieParser());
    app.use(session({
        secret: '9dj48bhkldhr48fj3890drkgb6739&#HF(&5j5&*^%',
        resave: true,
        saveUninitialized: false,
        cookie: {
            maxAge: 60000
        }
    }))
    app.use(routeAuth)
    app.use('/api', api)
    app.use(nuxt.render)
    app.use(errorhandler({log: logError}));
    // Listen the server
    app.listen(process.env.PORT || 3000)

    if (config.dev) {
        try {
            let tunnel = await localtunnel({ port: port, subdomain: process.env.LOCALTUNNEL_SUBDOMAIN });
            console.info('\nTunnel setup at', tunnel.url);
        } catch (err){
            console.info('Error setting up localtunnel');
        }
    }

    process.on('unhandledRejection', (reason, p) => {
        // application specific logging, throwing an error, or other logic here
    });

    consola.ready({
        message: `Server listening on http://${host}:${port}`,
        badge: true
    })

    /* let users = require('./queries/users.js');
    let hash = users.hash;
    let pwd = await hash('newpassword');

    /* const responses = require('../server/queries/responses.js');
    const payload = {"form_response":{"form_id":"Bks8di","token":"1cdb10914e1428399fca09d6976e2b29","landed_at":"2019-06-12T12:56:26Z","submitted_at":"2019-06-12T12:56:33Z","definition":{"id":"Bks8di","title":"ghjkl","fields":[{"id":"UlkKrBxbI2m1","title":"How good","type":"opinion_scale","ref":"d4b76659-b1c5-4184-b92f-00edccbdad69","properties":{}},{"id":"FnkrDwaGeauK","title":"City","type":"multiple_choice","ref":"3447acbd-b470-4889-99ca-61636ac7901f","properties":{},"choices":[{"id":"UNWxktK1yZgR","label":"A"},{"id":"bBW8e1vazOwd","label":"B"},{"id":"wZr53o7oLwwD","label":"C"},{"id":"ROpK3h0KJNDL","label":"D"}]},{"id":"tXKSSANrdGW0","title":"A choice","type":"multiple_choice","ref":"be8e3452-e4ca-4142-84f5-4aa8f280f378","properties":{},"choices":[{"id":"jWutiJKgmX6m","label":"A"},{"id":"JhbG7XW9cQAW","label":"B"},{"id":"flWvr0GQnY27","label":"C"}]},{"id":"kTUGCk0ROpcd","title":"Tell us","type":"short_text","ref":"9979e48b-e482-4542-b368-0a4fe328d47d","properties":{}}]},"answers":[{"type":"number","number":2,"field":{"id":"UlkKrBxbI2m1","type":"opinion_scale","ref":"d4b76659-b1c5-4184-b92f-00edccbdad69"}},{"type":"choice","choice":{"label":"A"},"field":{"id":"FnkrDwaGeauK","type":"multiple_choice","ref":"3447acbd-b470-4889-99ca-61636ac7901f"}},{"type":"choice","choice":{"label":"A"},"field":{"id":"tXKSSANrdGW0","type":"multiple_choice","ref":"be8e3452-e4ca-4142-84f5-4aa8f280f378"}},{"type":"text","text":"dsadsad","field":{"id":"kTUGCk0ROpcd","type":"short_text","ref":"9979e48b-e482-4542-b368-0a4fe328d47d"}}]}}
    responses.storeResponse(payload); */
}

start()