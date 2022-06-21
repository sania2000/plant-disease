let mongoose = require('mongoose')

const photoSchema = mongoose.Schema({
    userId:{},
    photoId:{},
    responses:{}
}
)


module.exports = mongoose.model('Photo', photoSchema)