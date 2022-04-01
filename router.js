const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require("body-parser");
const app = express();

const main = require("./main.js");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const setupRouts = () => {
    app.use(express.static(path.join(__dirname, 'public')));



    app.get("/loadData",(req,res) => {
        main.compileViewData(viewData=> {
            res.send(JSON.stringify(viewData));
        })
    });    

    app.post("/changeConfig", (req,res) => {
        fs.readFile(__dirname+"/data/config.json",'utf8',(err,file) => {
            let parsed = JSON.parse(file);
            parsed.risk = req.body.riskRange/1000;
            fs.writeFile(__dirname+"/data/config.json", JSON.stringify(parsed), (err) => {
                if(err) console.log(err);
                main.loadConfig((loadedConfig)=> {
                    main.updateConfig(loadedConfig);
                    fs.readFile(__dirname+"/public/html/home.html", 'utf8', (err, html) => {
                        if(err) {
                            res.status(500).send('sorry, out of order \n'+err);
                        }
                        res.send(html);
                        console.log("\x1b[32m-------------------\nSuccsessfully changed configuration\nRestart for changes to take effect\n-------------------\x1b[0m");
                    });
                });
            });
        });
    });
    
    app.get("/*", function(req,res) {
        fs.readFile(__dirname+"/public/html/home.html", 'utf8', (err, html) => {
            if(err) {
                res.status(500).send('sorry, out of order \n'+err);
            }
            res.send(html);
      })
    });
    

    app.listen(process.env.PORT || 3006, () => console.log('\x1b[33m-------------------\nNavigate to http://localhost:3006 to view user interface\n-------------------\x1b[0m'));
};

exports.setupRouts = setupRouts;