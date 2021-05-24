const express = require('express');
const responses = require('../queries/responses.js')

const router = express.Router()

//TODO: Remove this?
router.post('/typeform-webhook/:section', async (req, res) => {
    await responses.storeResponse(req.params.section, req.body)
    res.status(200).json([])
})

router.get('/:slug', async (req, res, next) => {
    try {
        console.log('GETTING REPS')
        let reports = await responses.getReportsFromFormSlug(req.params.slug, false);
        res.json(reports);
    } catch (err) {
        res.status(500);
        res.send('Could not get reports');
        next(err);
    }
})

router.get('/:slug/test', async (req, res, next) => {
    try {
        let reports = await responses.getReportsFromFormSlug(req.params.slug, true);
        res.json(reports);
    } catch (err) {
        res.status(500);
        res.send('Could not get test reports');
        next(err);
    }
})

module.exports = router