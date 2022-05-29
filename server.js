const path = require("path");
const formData = require("form-data");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

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
let plantData = require('./models/data')




//plantnet api-key
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

// const plantnetApi = ["2b10RQU4Rm7QH4CTKZqpdJFyu", "2b10A0AOC4oABnJVI06YPVgVdu", "2b10qXfZxIjNSHzjIL0cXOvOp",
// "2b1019g2sfS5hUOR0mD7Zta0x", "2b10v4bFYcW5wXbmDwicnEWe", "2b107U7yAF8SrizWuZtaLN4Xq",
// "2b10cARxCplNvJLjXS5OMmrt", "2b10iVujY4n6d9MsL6GE6CrA", "2b100FRT6qqS8C7RIBLFqVt"]

//storing image
let id = 20;

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, id + path.extname(file.originalname));
    },
});
  const upload = multer({ storage });

let responses = []

//posting responses
app.post("/disease", upload.single("image"), async (req, res) =>{

    //reading image
    // let form = new formData();
	// form.append('organs', "leaf");
	// form.append('images', fs.createReadStream("./images/" + id + ".jpg"));

    //checking with plantnet (if user sent proper image)
    // try {
    //     const { status} = await axios.post(
    //         "https://my-api.plantnet.org/v2/identify/all?api-key=2b10W39MttPR3dcxrb6qjXjvu",
    //         form, {
    //             headers: form.getHeaders()
    //         }
    //     );
    
        // console.log('status', status);
        // if (status == 200){

            //sending image to plant.id
            const files = ["./images/" + id + ".jpg"];

            const base64files = files.map((file) => fs.readFileSync(file, "base64"));
        
            const data = {
                api_key: "C71wQQpmQIrFHzpJZq09Dj4bsjnXMX3dbVHJSBZsbti8nkInu3",
                images: base64files,
                modifiers: ["health_auto", "disease_similar_images"],
                plant_details: ["common_names", "url", "wiki_description", "taxonomy"],
                disease_details: [
                    "classification",
                    "common_names",
                    "description",
                    "treatment",
                    "url",
                ],
            };
            axios.post("https://api.plant.id/v2/identify", data).then((ress) =>{
                setTimeout(async function () {

                    //checking if image is proper with plant.id
                    if(ress.data.suggestions[0].probability > 0.2){

                        //checking if the plant is healthy
                        if (ress.data.health_assessment.is_healthy == false) {
                            var health_details = ress.data.health_assessment.diseases.filter(
                                function (el) {
                                    return el.probability >= 0.1;
                                }
                            );

                            //pushing response(unhealthy plant)
                            responses.push({plant_name:  ress.data.suggestions[0].plant_name,
                                common_names: ress.data.suggestions[0].plant_details.common_names,
                                is_healthy: ress.data.health_assessment.is_healthy,
                                health_probabilty: ress.data.health_assessment.is_healthy_probability,
                                health_details});
                            }

                            //pushing responses(healthy plant)
                        else {
                            responses.push({plant_name:  ress.data.suggestions[0].plant_name,
                                common_names: ress.data.suggestions[0].plant_details.common_names,
                                is_healthy: ress.data.health_assessment.is_healthy,
                                health_probabilty: ress.data.health_assessment.is_healthy_probability});
                        }

                        //sending response
                        res.send(responses);

                        //storing model in db
                        let plantdata = new plantData()
                        plantdata.photo_id = id;
                        plantdata.response = responses;
                        plantdata.save((error) => {
                            if (error){
                            console.log(error);
                        }
                            else{
                                console.log('saved');
                            }
                        });
                        
                        //changing id
                        id++;

                        //emtying responses array
                        responses = [];
                    }else{
                        res.sendStatus(404);
                        id++;

                        //storing model in db
                        let plantdata = new plantData()
                        plantdata.photo_id = id;
                        plantdata.response = "not plant";
                        plantdata.save((error) => {
                            if (error){
                            console.log(error);
                        }
                            else{
                                console.log('saved');
                            }
                        });
                    }3})    
            })

    //     }else{
    //         res.sendStatus(404)

    //         //changing id
    //         id++

    //         //storing model in db
    //         let plantdata = new plantData()
    //         plantdata.photo_id = id;
    //         plantdata.response = "not plant";
    //         plantdata.save((error) => {
    //             if (error){
    //             console.log(error);
    //         }
    //             else{
    //                 console.log('saved');
    //             }
    //         });
    //     }
    // }catch(error){
    //     console.log(error)
    //     res.sendStatus(404);
    //     id++;

    //     //storing model in db
    //     let plantdata = new plantData()
    //     plantdata.photo_id = id;
    //     plantdata.response = "not plant";
    //     plantdata.save((error) => {
    //         if (error){
    //         console.log(error);
    //     }
    //         else{
    //             console.log('saved');
    //         }
    //     });
    // }
})

//listening on port 2500
app.listen(2500, () => {
    console.log("server is up");
});