const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')

const surveys = require('../server/queries/surveys.js');

const graphing = require('../server/graphing.js')

const app = express()

var _ = require('underscore');

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}

// TODO - rename route and function
app.get('/update-field', (req, res) => {
  surveys.updateField(req, res)
})

app.get('/update-choice', (req, res) => {
  surveys.updateSurveyChoice(req, res)
})

app.get('/update-dropdown-choice', (req, res) => {
  surveys.updateDropdownChoice(req, res)
})

app.get('/surveyjson/:id', (req, res) => {
  const id = req.params.id;
  surveys.getSurveyJSON(id, res)
})

app.get('/displaygraphjson', (req, res) => {
  graphing.getGraph()
  res.json("graphBOB")
})

start()
