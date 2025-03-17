const express = require("express");
const { getNews } = require("../controllers/geoNewsController");
const router = express.Router();

router.get("/:country", getNews);

module.exports = router;
