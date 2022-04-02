const market = require('./brokerMods/market.js');
const analizer = require('./brokerMods/analize.js');
const invest = require('./brokerMods/invest.js');

const fs = require('fs');
let envSaved = false;
let env = {
    pendingOrder:false,
    orderSide:undefined,
    orderSymbol:undefined,
}
let config;

let currentFocus; // ticker data that the algorithm is looking to invest in

init = () => {
    main.loadEnv(()=> {
        main.loadConfig((loaded)=> {
            exports.config = loaded;
            config = loaded;
            market.preformLogin(loaded);
            setTimeout(()=> {
                main.checkForDifferentConfig((reloadInvestments)=> {
                    if(reloadInvestments) main.gatherTickerData(main.initiateProfitScan);
                    else main.initiateProfitScan();
                });            
            },500)
        });
    });

};

const compileViewData = (cb) => {
    if(currentFocus == "reloadTicker") {cb({reloadTicker:true});return;};
    let currentlyInvested, investment;
    market.getAccount(currentInvestmenmts=> {
        currentlyInvested = currentInvestmenmts.length>0;
        if(currentlyInvested) {
            main.doDataChunk([currentInvestmenmts[0].symbol], (tickerData => {
                market.searchTicker([currentInvestmenmts[0].symbol],config.timeScale, (tickerBars) => {
                    const interpolated = analizer.formatPrice(tickerBars.get(currentInvestmenmts[0].symbol), true); 
                    investment = {
                        rawPrice:interpolated,
                        future: {
                            nextPeak:invest.findNextPeak(tickerData[0]),
                            nextDrop:invest.findNextDrop(tickerData[0]),
                            sellPoint:invest.findNextSellPoint(tickerData[0])
                        },
                        dataGathered:tickerData[0]
                    };                
                    cb({
                        sucsess:true,
                        invested:currentlyInvested,
                        investment:investment,
                        marketOpen:main.checkIfMarketOpen(),
                        config:{
                            risk:config.risk
                        }
                    });
                return;
                });

                
            }));
        } else {
            if(currentFocus) {
                main.doDataChunk([currentFocus.ticker], (tickerData) => {
                    market.searchTicker([currentFocus.ticker],config.timeScale, (tickerBars) => {
                        const interpolated = analizer.formatPrice(tickerBars.get(currentFocus.ticker), true);
                        investment = {
                            rawPrice:interpolated,
                            future: {
                                nextPeak:invest.findNextPeak(currentFocus),
                                nextDrop:invest.findNextDrop(currentFocus),
                                sellPoint:invest.findNextSellPoint(currentFocus)
                            },
                            dataGathered:tickerData[0]
                        };
                        cb({
                            sucsess:true,
                            invested:currentlyInvested,
                            investment:investment,
                            marketOpen:main.checkIfMarketOpen(),
                            config:{
                                risk:config.risk
                            }
                        });
                        return;
                    });                    
                });

            } else {
                setTimeout(()=>{compileViewData(cb)},1000);
                return;
            }
        }
    });       
};


let main = {
    initiateProfitScan:()=> {
        if(main.checkIfMarketOpen() || currentFocus == "reloadTicker" || currentFocus == undefined) {
            if(!env.pendingOrder) {
                market.getAccount(currentInvestmenmts=> {
                    if(currentInvestmenmts.length>0) {
                        main.doDataChunk([currentInvestmenmts[0].symbol], (tickerData => {
                            main.startActions(tickerData[0]);
                        }));
                    } else {
                        main.findBestProfitabilty(bestInvestments=> {
                            main.startActions(bestInvestments[0].ticker);
                        });
                    }
                });            
            } else {
                market.getAccount(currentInvestmenmts=> {
                    console.log("\x1b[33m%s\x1b[0m",`-=-=-=-=-=-=-=-=-=-=-=-=\n     Waiting for pending order... (${new Date().toISOString()})\n     ${(env.orderSide+1 ? "Buying ":"Selling ") +env.orderSymbol}...\n-=-=-=-=-=-=-=-=-=-=-=-=`);
                    if(env.orderSide+1) {if(currentInvestmenmts.length>0) env.pendingOrder = false;} // buying
                    else {if(currentInvestmenmts.length==0) env.pendingOrder = false;}; // selling
                    setUninteruptedTimeout(main.initiateProfitScan,900000);             
                });

            }           
        } else {
            console.log('\x1b[31m%s\x1b[0m',`-=-=-=-=-=-=-=-=-=-=-=-=\n     Market not open (${new Date().toISOString()})\n-=-=-=-=-=-=-=-=-=-=-=-=`);
            setUninteruptedTimeout(main.initiateProfitScan,1800000);
        }
 

    },
    startActions:(ticker,cb) => {
        invest.getAction(ticker, (action) => {
            currentFocus = ticker;
            let actionString = action ? "buy":"hold";
            if(action!=0)actionString = (action==1) ? "buy":"sell";
            if(actionString!="hold") {
                market.getBuyingPower((buyingPower)=> {
                    market.searchPrice(ticker.ticker,tickerPrice => {
                        market.getAccount(portfolio=> {
                            let qty;
                            if(action+1)qty = Math.floor(buyingPower*0.65/tickerPrice.Price);
                            else qty = portfolio[0].qty
                            market.newOrder(ticker.ticker,qty,actionString);
                            env.pendingOrder = true;
                            env.orderSide = action;        
                            env.orderSymbol = ticker.ticker;                         
                        });
                    });
                });
            };
            setUninteruptedTimeout(main.initiateProfitScan,900000);
        });
    },
    findBestProfitabilty:(cb) => {
        main.loadInvestFile((allInvestData)=> {
            const maxIteration = (allInvestData.investments.length>75) ? 75:allInvestData.investments.length;
            let allGrades = [];
            for(let i=0;i<maxIteration;i++) {
                const thisIteration = i;
                invest.gradeFuture(allInvestData.investments[i],allInvestData.investments[i].score,(res) => {
                    allGrades.push({score:res,ticker:allInvestData.investments[thisIteration]});
                    if(thisIteration==maxIteration-1) cb(allGrades.sort((a, b) => (a.score > b.score ? 1 : -1)));
                });
            }
        });
    },
    gatherTickerData:(cb) => {
        currentFocus = "reloadTicker";
        const startDate = new Date().getTime();
        main.findBestInvestments((bestInvestments)=> {
            const timeSpent = Math.round((new Date().getTime()-startDate)/60000)
            main.writeBestToFile(bestInvestments, ()=> {
                console.log("\n=-=--=-=-=-=-=-=-=-=-=-=-= \n\n   Recieved all data! ("+bestInvestments.length+" eligble) in "+timeSpent+"m \n   Data written to /data/investData.json\n\n=-=--=-=-=-=-=-=-=-=-=-=-=\n");
                if(bestInvestments.length>0)console.log("Best investment: "+bestInvestments[0].ticker+" ("+bestInvestments[0].score+")");  
                cb();              
            });
        });
    },
    findBestInvestments: (cb)=> {
        console.log("-=-=-=-=-=-=-=-\n\nOutdated investData file found, regathering data...\nThis can take several minutes.\n\n-=-=-=-=-=-=-=-")
        loadTickers((allTickers) => {
            const loadMax = allTickers.length-1;
            if(allTickers) {
                let allGraded = [];
                let currentChunkStart = 0,chunkIndex=0;
                let hasReterned = true;
                const loop = setInterval(()=> {
                    if(hasReterned) {
                        hasReterned = false;
                        console.log("-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+")
                        console.log("     Requesting new data chunk... ("+(chunkIndex+1)+"/"+Math.ceil(allTickers.length/200)+")");
                        let currentChunkEnd = 200;
                        if(currentChunkEnd>allTickers.length) currentChunkEnd = allTickers.length;
                        const tickerChunk = allTickers.slice().splice(currentChunkStart,currentChunkEnd);
                        currentChunkStart+=200;
                        if(tickerChunk.length>0) {
                            main.doDataChunk(tickerChunk, (graded)=> {
                                
                                console.log("     Ticker data recieved ("+(chunkIndex+1)+"/"+Math.ceil(allTickers.length/200)+")");                  
                                chunkIndex++;
                                hasReterned = true;
                                allGraded = allGraded.concat(graded);
                                console.log("     "+graded.length+" elegible tickers found | "+allGraded.length+" total");
                                if(currentChunkStart>=loadMax) {
                                    clearInterval(loop);
                                    let sorted = allGraded.sort((a, b) => (a.score > b.score ? 1 : -1));
                                    cb(sorted);
                                } 
                            });
                        } else {
                            clearInterval(loop);
                            let sorted = allGraded.sort((a, b) => (a.score > b.score ? 1 : -1));
                            cb(sorted)                           
                        }
                        
                    }
                   
                },20000);

            }
        });
    },
    doDataChunk:(tickerChunk, cb)=> {
        market.searchTicker(tickerChunk, config.timeScale, (allTickerData) => {
            let allGraded = []
            for(let i=0;i<tickerChunk.length;i++) {
                if(allTickerData.has(tickerChunk[i])) {

                    const interpolated = analizer.formatPrice(allTickerData.get(tickerChunk[i]), true);
                    const peaks = analizer.getPeaks(interpolated);
                    if(peaks.length>3) {

                        const trendGrade = analizer.grade(peaks);
                        const periodData = analizer.comparePeriords(peaks,config.timeScale);
                        const grade = (trendGrade*0.7)+(periodData.relitive*0.3);

                        const minBound = analizer.findMinBound(peaks);
                        const maxBound = analizer.findMaxBound(peaks);
                        const isValidBounds = analizer.compareBounds(minBound,maxBound); // check for steady upward growth
                        const isValidDates = analizer.compareDates(interpolated,peaks,config.timeScale); // check for many, similar length periods
                        if(!isNaN(grade) && grade != Infinity && isValidBounds && isValidDates && periodData.differnce>14) {
                            allGraded.push({
                                ticker:tickerChunk[i],
                                minBound:minBound,
                                maxBound:maxBound,
                                score:grade,
                                averagePeriodLength:periodData.differnce,
                                grades:{
                                    periodTrend:periodData.relitive,
                                    priceTrend:trendGrade
                                },
                                lastPeak:peaks[peaks.length-1]
                            });                        
                        }                   
                    }                    
                }

            }
            cb(allGraded);
        });
    },
    writeBestToFile:(data, cb)=> {
        fs.writeFile(__dirname+"/data/investData.json",
            JSON.stringify({
                timestamp:new Date().getTime(),
                timeScale:config.timeScale,
                investments:data
            })
            ,(err)=>{if(err)console.log(err);else cb()}
        );
    },
    loadInvestFile:(cb) => {
        fs.readFile(__dirname+"/data/investData.json",'utf8',(err,file) => {
            if(err)console.log(err);else cb(JSON.parse(file));
        });
    },
    loadConfig:(cb) => {
        fs.readFile(__dirname+"/data/config.json",'utf8',(err,file) => {
            if(err)console.log(err);else cb(JSON.parse(file));
        });
    },
    checkForDifferentConfig:(cb) => {
        main.loadInvestFile((invData)=> {
            if(new Date().getTime()-invData.timestamp>6.048e+8) {cb(true);return};
            cb(invData.timeScale != config.timeScale);
        });
    },
    checkIfMarketOpen:() => {
        const now = new Date();
        if(now.getHours()>15 || (now.getHours() == 9 && now.getMinutes()<30) || now.getHours()<9)return false;
        if(now.getDay() == 0 || now.getDay() == 6) return false;
        return true;
    },
    exitCleanup:(error,origin) => {
        const errorMessage = {
            error:error.stack,
            type:error.code,
            timestamp:new Date().toISOString()
        }
        fs.readFile('./data/errorLog.json', 'utf8',(err,file) => {
            if(err) console.error(err);
            const previousErrors = JSON.parse(file);
            previousErrors.errors.push(errorMessage);
            fs.writeFile('./data/errorLog.json',JSON.stringify(previousErrors),(err) => {
                if(err)console.log("error writing to error log: \n"+err);
                main.writeEnv(() => {
                    console.log("\x1b[31m-------------------\nError contacting Alpaca API, this could mean: \n\n     1) You have outdated API keys.\n        Enter \x1b[36mnode updateKeys.js\x1b[31m, then navigate to \x1b[36mhttp://localhost:3006\x1b[31m to change API keys.\n\n     2) This error could also be caused by an interuption in your internet connection.\n\n     3) This issue will also be thrown if the port 3006 is already in use.\n\n     If the issue persists it is caused by an internal error.\n     Errors loged to data/errorLog.json \n-------------------\x1b[0m");
                    setTimeout(()=>process.exit(0),200);                    
                });
            });
        });

    },
    envCleanup:() => {
        main.writeEnv(() => {
            setTimeout(()=>{process.exit(1);},50);
        })
    },
    updateConfig:(loaded)=> {
        config = loaded
        exports.config = loaded;
    },
    loadEnv:(cb) => {
        fs.readFile("./data/env.json", "utf8",(err,file) => {
            if(err)console.log(err);
            env = JSON.parse(file);
            cb();
        });
    },
    writeEnv:(cb) => {
        if(!envSaved) {
            envSaved = true;
            fs.writeFile("./data/env.json",JSON.stringify(env),(err) => {
                if(err)console.log(err);
                cb();
            }); 
        }

    }
}

loadTickers = (cb) => {
    fs.readFile(__dirname+"/data/allTickers.txt", 'utf8', (err, file) => {
        if (err) return err;
        cb(file.split('\n'));
    });
}


const setUninteruptedTimeout = (cb, delay) => {
    const startTime = new Date().getTime();
    const loop = setInterval(()=> {
        const thisTime = new Date().getTime();
        if(thisTime-startTime>delay) {
            cb();
            clearInterval(loop);
            return;
        }
    },15000);
}





exports.init = init;



// csv from https://www.nasdaq.com/market-activity/stocks/screener
loadTickersFromCSV = () => {
    let allTickers = [];
    fs.readFile(__dirname+"/data/allData.csv", 'utf8', (err, file) => {
        if(err) console.log(err)
        const split = file.split("\n");
        for(let i=1;i<split.length-1;i++) {
            let ticker = split[i].split(",")[0];
            ticker = ticker.replace(/ /g,'');
            if(!ticker.includes('^') && !ticker.includes('/')) allTickers.push(ticker);         
        }
        console.log(allTickers)
        fs.writeFile(__dirname+"/data/allTickers.txt",allTickers.join('\n'),(err)=>{if(err)console.log(err)});
    });
}

exports.compileViewData = compileViewData;
exports.exitCleanup = main.exitCleanup;
exports.loadConfig = main.loadConfig;
exports.updateConfig = main.updateConfig;
exports.envCleanup = main.envCleanup