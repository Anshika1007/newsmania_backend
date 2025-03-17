const express = require("express");
const router = express.Router();
const youtubeController = require("../controllers/youtubeController");

router.get("/live", youtubeController.getLiveNews);

module.exports = router;
