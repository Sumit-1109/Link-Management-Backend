const mongoose = require("mongoose");

const LinkSchema = new mongoose.Schema({
  originalURL: {
    type: String,
    required: true,
  },
  shortURL: {
    type: String,
    required: true,
    unique: true,
  },
  expirationDate: {
    type: Date,
  },
  remarks: {
    type: String,
    default: "",
  },
  clicks: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ip: {
        type: String,
      },
      device: {
        type: String,
        enum: ["Mobile", "Desktop", "Tablet"],
      },
    },
  ],
  totalClicks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

LinkSchema.pre("save", function (next) {
  if (this.expirationDate && new Date() > this.expirationDate) {
    this.status = "inactive";
  } else {
    this.status = "active";
  }
  next();
});

LinkSchema.index({ shortURL: 1, createdBy: 1 });

module.exports = mongoose.model("Link", LinkSchema);
