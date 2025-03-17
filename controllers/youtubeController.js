const youtubeService = require("../services/youtubeService");

const getLiveNews = async (req, res) => {
    try {
        const query = req.query.q || "live news";
        const liveNews = await youtubeService.fetchLiveNews(query);
        res.json(liveNews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLiveNews };
