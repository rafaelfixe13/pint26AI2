const express = require('express');
const router = express.Router();
const {
  getAllBadges,
  createBadge,
  updateBadge,
} = require('../controllers/badgeController');

router.get('/', getAllBadges);
router.post('/', createBadge);
router.put('/:id', updateBadge);

module.exports = router;