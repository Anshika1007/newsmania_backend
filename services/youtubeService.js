const axios = require("axios");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

const fetchLiveNews = async (query = "live news") => {
    try {
        const response = await axios.get(YOUTUBE_API_URL, {
            params: {
                part: "snippet",
                type: "video",
                eventType: "live",
                q: query,
                key: YOUTUBE_API_KEY,
                maxResults: 10, // Fetch 10 live videos
            },
        });

        return response.data.items.map((video) => ({
            videoId: video.id.videoId,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails.medium.url,
        }));
    } catch (error) {
        console.error("Error fetching live news:", error);
        throw new Error("Failed to fetch live news.");
    }
};

module.exports = { fetchLiveNews };
