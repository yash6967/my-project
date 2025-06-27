const express = require('express');
const router = express.Router();

router.get('/random', (req, res) => {
  const randomNumber = Math.floor(Math.random() * 5) + 1;
  res.json({number: "randomNumber" });
});

module.exports = router;
