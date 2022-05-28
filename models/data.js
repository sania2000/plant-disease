let mongoose = require('mongoose')

//data schema
let dataSchema = mongoose.Schema({
    photo_id: {
        type: Number
    },
    response:{}
})

module.exports = mongoose.model('plantData', dataSchema)