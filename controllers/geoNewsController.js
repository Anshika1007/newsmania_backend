const axios = require("axios");
require("dotenv").config(); // Load .env file

const getNews = async (req, res) => {
  try {
    const { country } = req.params;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "API key is missing!" });
    }

    const response = await axios.get(
      `https://newsdata.io/api/1/news?apikey=${apiKey}&country=${country}&language=en`
    );

    return res.json(response.data.results || []);
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({ message: "Failed to fetch news" });
  }
};

module.exports = { getNews };
