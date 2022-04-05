const path = require("path");
const formData = require("form-data");
const fs = require("fs");
const express = require("express");
const app = express();
const multer = require("multer");
const axios = require("axios");
const API_URL =
    "https://my-api.plantnet.org/v2/identify/all?api-key=2b10UwYbG9xqqF6qnzZpgVYe5u";

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
    form.append("organs", "leaf");
    form.append("images", fs.createReadStream("./images/100.jpg"));

    try {
        const { status, data } = await axios.post(API_URL, form, {
            headers: form.getHeaders(),
        });
        setTimeout(async function () {
            console.log("status", status);
            for (i = 0; i < 1; i++) {
                responses.push(data.results[i]);
            }
        }, 3);
    } catch (error) {
        console.error("error", error);
    }

    const files = ["./images/100.jpg"];

    const base64files = files.map((file) => fs.readFileSync(file, "base64"));

    const data = {
        api_key: "VNs49m3RZ6mRJKDrh3ohE0nyT0Il2yz9dKxxDfUpKdUd9B33yQ",
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

    axios
        .post("https://api.plant.id/v2/identify", data)
        .then((ress) => {
            setTimeout(async function () {
                if (ress.data.health_assessment.is_healthy == false) {
                    var newArray = ress.data.health_assessment.diseases.filter(
                        function (el) {
                            return el.probability >= 0.1;
                        }
                    );
                    const myJs = JSON.stringify(newArray, null, 3);
                    responses.push('health probabilty:' + ress.data.health_assessment.is_healthy_probability + myJs);
                }
                else {
                    responses.push("Your plant is healthy")
                }
                res.send(responses)

                fs.unlinkSync("./images/100.jpg");
            }, 100);
        })
        .catch((error) => {
            console.error("Error: ", error);
        });
});

app.listen(2500, () => {
    console.log("server is up");
});