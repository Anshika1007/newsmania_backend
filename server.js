// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const axios = require("axios");
// const mongoose = require("mongoose");
// const authRoutes = require("./routes/authRoutes");
// const youtubeRoutes = require("./routes/youtubeRoutes");
// const pollRoutes = require("./routes/pollRoutes");
// const { schedulePolls } = require("./controllers/pollController");
// const cron = require("node-cron");
// const { deleteOldPolls } = require("./controllers/pollController");
// const newsRoutes = require("./routes/geoRoutes");
// const bookmarkRoutes=require("./routes/bookmarkRoutes")
// dotenv.config();

// const app = express();
// app.use(express.json());

// // ✅ Proper CORS Configuration
// const allowedOrigins = [
//   "http://localhost:5173", // Local development
//   /https:\/\/newsmania-.*-aasthas-projects-52cfcb27\.vercel\.app/, // All Vercel deployments
//   "https://newsmania-peach.vercel.app" // Your production domain
// ];

// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy",
//     "default-src 'self'; " +
//     "font-src 'self' https://newsmania-backend.onrender.com https://fonts.gstatic.com; " +
//     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
//     "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
//   );
//   next();
// });



// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log("Blocked by CORS:", origin); // Debugging log
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PATCH", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true
// }));

// app.get('/api/ip-location', async (req, res) => {
//   try {
//       const response = await axios.get('https://ipapi.co/json/');
//       res.json(response.data);
//   } catch (error) {
//       res.status(500).json({ error: 'Failed to fetch IP location' });
//   }
// });

// // ✅ Fetch News from NewsAPI
// app.get("/api/news", async (req, res) => {
//   const { category = "general", country = "us" } = req.query;

//   try {
//     const response = await axios.get("https://newsapi.org/v2/top-headlines", {
//       params: {
//         apiKey: process.env.NEWS_API_KEY, // Get from .env
//         category,
//         country,
//       },
//     });

//     res.status(200).json(response.data.articles);
//   } catch (error) {
//     console.error("Error fetching news:", error.message);
//     res.status(500).json({ message: "Error fetching news", details: error.message });
//   }
// });

// // ✅ MongoDB Connection
// mongoose
//   .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log("MongoDB connected");

//     // ✅ Start Server Only After DB Connection
//     const PORT = process.env.PORT || 8080;
//     app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => console.error("MongoDB Connection Error:", err));

// // ✅ Authentication Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/bookmarks',bookmarkRoutes );
// app.use("/api/youtube", youtubeRoutes);
// app.use("/api/polls", pollRoutes);
// app.use("/api/geonews", newsRoutes);
// // ✅ Schedule Poll Generation (Every 30 minutes)
// schedulePolls();

// // ✅ Auto-Delete Polls Older Than 24 Hours (Every 24 hours)
// cron.schedule("0 0 * * *", async () => {
//   await deleteOldPolls();
// });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

// Route imports
const authRoutes = require('./routes/authRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const pollRoutes = require('./routes/pollRoutes');
const newsRoutes = require('./routes/geoRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');

// Controller imports
const { schedulePolls } = require('./controllers/pollController');
const { deleteOldPolls } = require('./controllers/pollController');

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet());
app.disable('x-powered-by');

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173', // Local development
  /https:\/\/newsmania-.*\.vercel\.app/, // All Vercel deployments
  'https://newsmania-peach.vercel.app' // Production domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    isAllowed 
      ? callback(null, true)
      : callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self';" +
    "connect-src 'self' https://newsmania-backend-1.onrender.com https://newsapi.org https://ipapi.co;" +
    "font-src 'self' https://newsmania-backend-1.onrender.com https://fonts.gstatic.com;" +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" +
    "script-src 'self' 'unsafe-inline';" +
    "img-src 'self' data: https://*;"
  );
  next();
});

// API Routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Newsmania Backend API',
    version: '1.0.0',
    endpoints: {
      docs: 'Coming soon',
      news: '/api/news',
      auth: '/api/auth',
      bookmarks: '/api/bookmarks',
      youtube: '/api/youtube',
      polls: '/api/polls',
      geonews: '/api/geonews'
    }
  });
});

// API Endpoints
app.get('/api/ip-location', async (req, res) => {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch IP location',
      details: error.message 
    });
  }
});

app.get('/api/news', async (req, res) => {
  const { category = 'general', country = 'us' } = req.query;

  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey: process.env.NEWS_API_KEY,
        category,
        country,
      },
    });
    res.status(200).json(response.data.articles);
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({ 
      message: 'Error fetching news', 
      details: error.message 
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/geonews', newsRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  
  // Start server
  const PORT = process.env.PORT || 8080;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Schedule background tasks
    schedulePolls();
    cron.schedule('0 0 * * *', async () => {
      await deleteOldPolls();
    });
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle CORS errors specifically
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS Error',
      message: err.message 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Something went wrong!' 
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});