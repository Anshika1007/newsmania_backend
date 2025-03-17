const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    votes: { 
      type: [Number], 
      default: function () { return new Array(this.options.length).fill(0); } 
    } ,// ✅ Ensure votes array matches options length dynamically
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Poll = mongoose.model("Poll", pollSchema);
module.exports = Poll;
