const express = require('express');
const fs = require('fs');
const bodyParser = require("body-parser");
const path = require('path');
const app = express();



app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/changeAPIKeys",(req,res) => {
    fs.readFile(__dirname+"/data/config.json",'utf8',(err,file) => {
        let parsed = JSON.parse(file);
        parsed.apiKey = req.body.apiKey;
        parsed.secretKey = req.body.secretKey;
        fs.writeFile(__dirname+"/data/config.json", JSON.stringify(parsed), (err) => {
            if(err) console.log(err);
            fs.readFile(__dirname+"/public/html/updateSucsess.html", 'utf8', (err, html) => {
                if(err) {
                    res.status(500).send('sorry, out of order \n'+err);
                }
                res.send(html);
                console.log("\x1b[32m-------------------\nSuccsessfully recieved new API keys\nEnter \x1b[36mnode index.js\x1b[32m to restart server\n-------------------\x1b[0m");
                setTimeout(()=>process.exit(0),200);
            });
        });
    });
});

app.get("/*", function(req,res) {
    fs.readFile(__dirname+"/public/html/updateKeys.html", 'utf8', (err, html) => {
        if(err) {
            res.status(500).send('sorry, out of order \n'+err);
        }
        res.send(html);
    });
});

app.listen(process.env.PORT || 3006, () => console.log('\x1b[33m-------------------\nNavigate to http://localhost:3006 to enter new API keys\n-------------------\x1b[0m'));