const express = require('express');
const router = express.Router();
const { dashboardSL, conquistasSL } = require('../controllers/slController');

router.get('/dashboard', dashboardSL);
router.get('/conquistas', conquistasSL);

module.exports = router;
