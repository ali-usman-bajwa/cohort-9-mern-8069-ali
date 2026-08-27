const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: 'My new category'
    },
    isDefault: {
        type: Boolean,
        required: false
    },
    color: {
        type: String,
        default: '#187171'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
} , {
    timestamps: true
})

module.exports = mongoose.model('Category', categorySchema)