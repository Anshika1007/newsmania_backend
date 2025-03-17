const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const pollRoutes = require("./routes/pollRoutes");
const { schedulePolls } = require("./controllers/pollController");
const cron = require("node-cron");
const { deleteOldPolls } = require("./controllers/pollController");
const newsRoutes = require("./routes/geoRoutes");

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Proper CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",  // Development (Local)
  "https://newsmania-five.vercel.app" // Production (Vercel)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.get('/api/ip-location', async (req, res) => {
  try {
      const response = await axios.get('https://ipapi.co/json/');
      res.json(response.data);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch IP location' });
  }
});

// ✅ Fetch News from NewsAPI
app.get("/api/news", async (req, res) => {
  const { category = "general", country = "us" } = req.query;

  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        apiKey: process.env.NEWS_API_KEY, // Get from .env
        category,
        country,
      },
    });

    res.status(200).json(response.data.articles);
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ message: "Error fetching news", details: error.message });
  }
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");

    // ✅ Start Server Only After DB Connection
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ✅ Authentication Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use("/api/youtube", youtubeRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/news", newsRoutes);
// ✅ Schedule Poll Generation (Every 30 minutes)
schedulePolls();

// ✅ Auto-Delete Polls Older Than 24 Hours (Every 24 hours)
cron.schedule("0 0 * * *", async () => {
  await deleteOldPolls();
});
