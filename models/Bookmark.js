const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    description: { type: String },  // Store description
    urlToImage: { type: String },   // Store image URL
    source: { 
        type: Object,  // ✅ Store source as an object
        default: { name: "Unknown Source" } 
    },
    dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bookmark', BookmarkSchema);
