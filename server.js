const path = require("path");
const formData = require("form-data");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

//connecting to db
mongoose.connect('mongodb://127.0.0.1:27017/plantTips')
const db = mongoose.connection;

//check db connection
db.once('open', () => {
    console.log ('connected');
});

//check for db errors
db.on('error', (error) => {
    console.log(error)
})

//init app
const app = express();

//body-parser middleware
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

//bring in models
let plantData = require('./models/data');
// const { isDate } = require("util/types");
// let Photo = require('./models/photos')




//plantnet api-key
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

const plantnetApi = ["2b10RQU4Rm7QH4CTKZqpdJFyu", "2b10A0AOC4oABnJVI06YPVgVdu", 
"2b10qXfZxIjNSHzjIL0cXOvOp", "2b1019g2sfS5hUOR0mD7Zta0x", "2b10v4bFYcW5wXbmDwicnEWe",
"2b107U7yAF8SrizWuZtaLN4Xq", "2b10cARxCplNvJLjXS5OMmrt", "2b10iVujY4n6d9MsL6GE6CrA",
"2b100FRT6qqS8C7RIBLFqVt"]

const key = plantnetApi[getRandomInt(8)]

//storing image
let id = getRandomInt(10000000);

storage = multer.diskStorage({
 destination: (req, file, cb) => {
       cb(null, "images");
},
filename: (req, file, cb) => {
      cb(null, id + path.extname(file.originalname));
   }});

const upload = multer({ storage });

let responses = []

   

//posting responses
app.post("/disease", upload.single("image"), async (req, res) =>{
    //getting user's id
    // const userId = req.params.id

    //reading image
    let form = new formData();
	form.append('organs', "leaf");
	form.append('images', fs.createReadStream("./images/" + id + ".jpg"));

    //setting headers for plantnet
    try {
        var {status, data} = await axios.post(
            "https://my-api.plantnet.org/v2/identify/all?api-key=" + key,
            form, 
            {
                headers: form.getHeaders()
            }
        );
    
       

        //getting status from plantnet
        if (data.results[0].score < 0.25 || status != 200){
            //changing id
            id++;
            return res.sendStatus(404);
        }
        console.log(status)
        console.log(data.results[0].score)

        // //setting headers for plant.id
        const files = ["./images/" + id + ".jpg"];
        const base64files = files.map((file) => fs.readFileSync(file, "base64"));
        data = {
            api_key: "C71wQQpmQIrFHzpJZq09Dj4bsjnXMX3dbVHJSBZsbti8nkInu3",
            images: base64files,
            modifiers: ["health_auto", "disease_similar_images"],
            plant_details: ["common_names",
            "url",
            "wiki_description",
            "taxonomy"],
            disease_details: [
                "classification",
                "common_names",
                "description",
                "treatment",
                "url"]
            };

        //sending photo to plant.id    
        axios.post("https://api.plant.id/v2/identify", data).then((ress) =>{

            //checking if image is proper with plant.id
            if(ress.data.suggestions[0].probability < 0.1){
                id = getRandomInt(10000000);
                res.sendStatus(404);
            }
            else{
            //declaring variables
                const plantName = ress.data.suggestions[0].plant_name;
                const commonNames = ress.data.suggestions[0].plant_details.common_names;
                const isHealthy = ress.data.health_assessment.is_healthy;
                const healthProbability = ress.data.health_assessment.is_healthy_probability;
                var health_details = ress.data.health_assessment.diseases
                //checking if the plant is healthy
                if (ress.data.health_assessment.is_healthy == false) {
                
                    //pushing response(unhealthy plant)
                    responses.push(
                        {plant_name: plantName ,
                        common_names: commonNames,
                        is_healthy: isHealthy,
                        health_probabilty: healthProbability,
                        health_details}
                        );
                    }

                //pushing responses(healthy plant)
                responses.push(
                    {plant_name: plantName,
                    common_names: commonNames,
                        is_healthy: isHealthy,
                    health_probabilty: healthProbability}
                    );

                
                //sending response
                id = getRandomInt(10000000);
                res.send(responses);

            //storing model in db
                let plantdata = new plantData()
                plantdata.photo_id = id;
                plantdata.response = responses;
                plantdata.save((error) => {
                    if (error){
                    console.log(error);
                }else{
                        console.log('saved');
                    }
                });

            //new Photo model
            // let photo = new Photo()
            // photo.userId = userId;
            // photo.photoId = id;
            // photo.responses = responses
            // photo.date = isDate()
            // photo.save()
            // photo.save((error) => {
            //     if (error){
            //     console.log(error);
            // }else{
            //         console.log('saved');
            //     }
            // });

            //emtying responses array
                responses = [];
            }}
            )}
        catch(error){
            id = getRandomInt(10000000);
            console.log(error)
            res.sendStatus(404);
    }
})

//getting images
app.get('/history/:id', async(req, res) => {
    const userid = req.params.id
    try{
        await Photo.find({userId:userid}, function(err, docs) {
            res.send(docs)
        }).clone()
    }catch(error){
        console.log(error)
    }
})

//listening on port 2500
app.listen(2500, () => {
    console.log("server is up");
});