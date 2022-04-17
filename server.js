const path = require("path");
const formData = require("form-data");
const fs = require("fs");
const express = require("express");
const app = express();
const multer = require("multer");
const axios = require("axios");
const { status } = require("express/lib/response");
    

let id = 100;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, id + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

let responses = []

app.post("/disease", upload.single("image"), async (req, res) => {

    let form = new formData();
	form.append('organs', "leaf");
	form.append('images', fs.createReadStream('./images/100.jpg'));
    try {
        const { status, } = await axios.post(
            "https://my-api.plantnet.org/v2/identify/all?api-key=2b10UwYbG9xqqF6qnzZpgVYe5u",
            form, {
                headers: form.getHeaders()
            }
        );
    
        console.log('status', status);

        if (status == 200){
            const files = ["./images/100.jpg"];

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
        
            axios.post("https://api.plant.id/v2/identify", data).then((ress) => {
                    setTimeout(async function () {        
                        if (ress.data.suggestions[0].probability >= 0.7){
                            if (ress.data.health_assessment.is_healthy == false) {
                                var health_details = ress.data.health_assessment.diseases.filter(
                                    function (el) {
                                        return el.probability >= 0.1;
                                    }
                                );
                                responses.push({plant_name:  ress.data.suggestions[0].plant_name,
                                    common_names: ress.data.suggestions[0].plant_details.common_names,
                                    is_healthy: ress.data.health_assessment.is_healthy,
                                    health_probabilty: ress.data.health_assessment.is_healthy_probability,
                                    health_details})
                            
                                }
                            else {
                                responses.push({plant_name:  ress.data.suggestions[0].plant_name,
                                    common_names: ress.data.suggestions[0].plant_details.common_names,
                                    is_healthy: ress.data.health_assessment.is_healthy,
                                    health_probabilty: ress.data.health_assessment.is_healthy_probability})
                            
                            }
                        
                        res.send(responses)
                        responses = []
                        }
                        else{
                            res.sendStatus(404)
                        }
                        fs.unlinkSync("./images/100.jpg");
                    }, 3);
                })
                .catch((error) => {
                    console.error("Error: ", error);
                    res.sendStatus(404)
                });
            
        }else{
            res.sendStatus(404)
        }
    }catch (error) {
        console.error('error', error);
    }
});



app.listen(2500, () => {
    console.log("server is up");
});