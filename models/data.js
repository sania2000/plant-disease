let mongoose = require('mongoose')

//data schema
let dataSchema = mongoose.Schema({
    photo_id: {
        type: Number
    },
    response:{}
})

let Data = module.exports = mongoose.model('plantData', dataSchema)