const express = require("express");
const router = express.Router();
const { addBookmark, getBookmarks, removeBookmark } = require("../controllers/bookmarkController");
const authenticate = require("../middleware/authMiddleware"); // Import the middleware

// Protect these routes with authentication
router.post("/add", authenticate, addBookmark);
router.get("/list", authenticate, getBookmarks);
router.delete("/remove/:id", authenticate, removeBookmark);

module.exports = router;
