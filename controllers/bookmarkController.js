const Bookmark = require('../models/Bookmark');

exports.addBookmark = async (req, res) => {
    try {
        const { title, url, description, urlToImage, source } = req.body;
        const userId = req.user.userId; 

        const bookmark = new Bookmark({ 
            user: userId, 
            title, 
            url, 
            description, 
            urlToImage, 
            source: source || { name: "Unknown Source" }  // ✅ Ensure it's an object
        });
        await bookmark.save();

        res.status(201).json({ message: "Bookmark added!", bookmark });
    } catch (error) {
        res.status(500).json({ message: "Error adding bookmark", error });
    }
};

exports.getBookmarks = async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ user: req.user.userId })
            .select("title url description urlToImage source dateAdded"); // Return all fields

        res.json(bookmarks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bookmarks", error });
    }
};




// Remove a bookmark by ID
exports.removeBookmark = async (req, res) => {
    try {
        const bookmarkId = req.params.id;
        const userId = req.user.userId;

        // Check if the bookmark exists for the logged-in user
        const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: userId });
        if (!bookmark) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        await Bookmark.findByIdAndDelete(bookmarkId);

        res.json({ message: "Bookmark removed successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error removing bookmark", error });
    }
};
