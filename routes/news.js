const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.NEWS_API_KEY;

// Get news based on category and country
router.get("/", async (req, res) => {
    const { category = "general", country = "us", language = "en" } = req.query;
    console.log("Received Language: ", language); 

    try {
        const response = await axios.get("https://newsapi.org/v2/top-headlines", {
            params: {
                apiKey: API_KEY,
                category,
                country,
                language
            },
        });
        console.log("NewsAPI Response:", response.data);
        res.status(200).json(response.data.articles); // Return only the articles
    } catch (error) {
        console.error("Error fetching news:", error.message);
        res.status(500).json({ message: "Error fetching news", details: error.message });
    }
});

module.exports = router;

