const express = require("express");
const { generatePoll, getAllPolls, votePoll } = require("../controllers/pollController");

const router = express.Router();

router.post("/generate", generatePoll); // Generate new poll from latest news
router.get("/", getAllPolls); // Fetch all community polls
router.patch("/vote", votePoll);// Vote on a poll

module.exports = router;
