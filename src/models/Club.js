const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    shortName: { type: String, required: true },
    fullName: { type: String, required: true, unique: true },
    venue: { type: String, required: true },
    logoImg: {type: String},
    bannerImg: {type: String},
    link: {type: String}
});

const Club = mongoose.model('club', clubSchema);

module.exports = Club;
