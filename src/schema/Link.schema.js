const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
    originalURL : {
        type: String,
        required: true
    },
    shortURL : {
        type: String,
        required: true,
        unique: true
    },
    expirationDate: { 
        type: Date 
    },
    clicks: [
    {
      timestamp: { 
        type: Date, 
        default: Date.now 
    },
      ip: String,
      device: String,
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
});

module.exports = mongoose.model('Link', LinkSchema);