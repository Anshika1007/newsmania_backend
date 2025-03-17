const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Poll = require("../models/pollModel");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const cron = require("node-cron");

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const newsApiKey = process.env.NEWS_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// 🚀 **Generate & Store a New Poll**
let nextPollTime = new Date(Date.now() + 15 * 60 * 1000); 
const generatePoll = async () => {
  try {
    console.log("📝 Generating a new poll...");

    // ✅ Step 1: Fetch Latest News
    const newsResponse = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`
    );

    const articles = newsResponse?.data?.articles;
    if (!articles || articles.length === 0) {
      console.error("❌ No latest news found.");
      return;
    }

    // ✅ Step 2: Select a Random News Headline
    const randomNews = articles[Math.floor(Math.random() * articles.length)];
    const newsTitle = randomNews.title || "Breaking News";
    const newsTopic = newsTitle.split(":")[0];

    // ✅ Step 3: Generate an **Opinion-Based** Poll Using AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Based on the latest news headline:  
      **"${newsTitle}"**  
      
      Generate a **user opinion-based multiple-choice poll question**.  
      The poll should ask users for their **thoughts or stance** on the topic, NOT factual knowledge.  

      Format:  
      **Question:** [Opinion-Based Poll Question]  
      **Options:**  
      1) Option A  
      2) Option B  
      3) Option C  
      4) Option D  

      Keep it **engaging** and **controversial if needed** to spark discussion.
    `;

    const result = await model.generateContent(prompt);

    if (!result?.response?.candidates?.length) {
      console.error("❌ No valid poll question found.");
      return;
    }

    const pollText = result.response.candidates[0]?.content?.parts?.[0]?.text?.trim();
    if (!pollText) {
      console.error("❌ AI response format incorrect.");
      return;
    }

    // ✅ Extract Question & Options
    const lines = pollText.split("\n").map((line) => line.trim());
    const questionLine = lines.find((line) => line.startsWith("**Question:**"));
    const optionsStartIndex = lines.findIndex((line) => line.startsWith("1)"));

    if (!questionLine || optionsStartIndex === -1) {
      console.error("❌ Failed to extract poll data.");
      return;
    }

    const question = questionLine.replace("**Question:**", "").trim();
    const options = lines
      .slice(optionsStartIndex)
      .map((opt) => opt.replace(/^\d+\)/, "").trim())
      .filter(Boolean)
      .slice(0, 4);

    if (options.length < 2) {
      console.error("❌ AI generated less than 2 options. Skipping poll.");
      return;
    }

    // ✅ Save Poll in DB
    const newPoll = new Poll({
      topic: newsTopic,
      question,
      options,
      votes: new Array(options.length).fill(0),
      createdAt: new Date(),
    });
    await newPoll.save();
    nextPollTime = new Date(Date.now() + 15 * 60 * 1000);

    console.log("✅ New poll generated:", question);
  } catch (error) {
    console.error("❌ Error generating poll:", error.message);
  }
};

// 🚀 **Get All Active Polls (Last 24 Hours)**
const getAllPolls = async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const polls = await Poll.find({ createdAt: { $gte: oneDayAgo } }).sort({ createdAt: -1 });

    res.json({
      polls: polls.map((poll) => ({
        _id: poll._id,
        topic: poll.topic,
        question: poll.question,
        options: poll.options,
        votes: poll.votes,
        totalVotes: poll.votes.reduce((sum, v) => sum + v, 0),
      })),
      nextPollTime: nextPollTime.getTime(),
    });
  } catch (error) {
    console.error("❌ Error fetching polls:", error.message);
    res.status(500).json({ error: "Failed to fetch polls." });
  }
};

// 🚀 **Vote on a Poll**
const votePoll = async (req, res) => {
  try {
    const { pollId, optionIndex } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({ error: "Invalid poll ID" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    // ✅ Ensure optionIndex is a valid number
    if (
      typeof optionIndex !== "number" || 
      isNaN(optionIndex) || 
      optionIndex < 0 || 
      optionIndex >= poll.options.length
    ) {
      return res.status(400).json({ error: "Invalid option selected" });
    }

    // ✅ Ensure votes array is correctly initialized
    if (!poll.votes || poll.votes.length !== poll.options.length) {
      poll.votes = new Array(poll.options.length).fill(0);
    }

    poll.votes[optionIndex] += 1;
    poll.markModified("votes"); // 🔥 Force MongoDB to detect change

    console.log("🛠 Before Saving Poll Votes:", poll.votes);
    await poll.save();
    console.log("✅ After Saving Poll Votes:", poll.votes);

    // Return updated poll
    const updatedPoll = await Poll.findById(pollId);
    res.json({ message: "✅ Vote recorded successfully!", poll: updatedPoll });
  } catch (error) {
    console.error("❌ Error voting on poll:", error.message);
    res.status(500).json({ error: "Failed to vote on poll." });
  }
};


// 🚀 **Auto-Delete Polls Older Than 24 Hours**
const deleteOldPolls = async () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const deletedPolls = await Poll.deleteMany({ createdAt: { $lt: oneDayAgo } });
    console.log(`🗑️ Deleted ${deletedPolls.deletedCount} old polls.`);
  } catch (error) {
    console.error("❌ Error deleting old polls:", error.message);
  }
};

// 🕒 **Schedule Poll Generation & Cleanup**
const schedulePolls = () => {
  console.log("⏳ Scheduling poll generation every 15 minutes & deletion every 24 hours.");

  // ✅ Generate a new poll every 15 minutes (Production)
  cron.schedule("*/15 * * * *", async () => {
    console.log("🔄 Generating a new poll...");
    await generatePoll();
  });

  // ✅ Delete polls older than 24 hours daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("🗑️ Deleting old polls...");
    await deleteOldPolls();
  });
};

module.exports = { generatePoll, getAllPolls, votePoll, schedulePolls };
