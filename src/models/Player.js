const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true, unique: true },
    playerNumber: { type: Number },  
    position: { type: String, required: true },  
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'club', required: true },  
    stats: {
        matchesPlayed: { type: Number, default: 0 },
        tackles: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        goals: { type: Number, default: 0 }
    },
    profileLink: { type: String }, 
    imageUrl: { type: String },    
}, {
    timestamps: true 
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
