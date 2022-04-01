const Alpaca = require('@alpacahq/alpaca-trade-api');
const main = require('../main.js');
let  market = {
    login:undefined,
    preformLogin:(config)=> {
        market.login = new Alpaca({
            keyId:config.apiKey,
            secretKey:config.secretKey,
            paper:true
        });
    }, 
    searchTicker: async(ticker,timeScale,cb) => {
        let time = new Date().getTime();

        let endTime=time-8.64e+7*2;
        endTime = new Date(endTime);

        let startTime = endTime.getTime()-(timeScale*8.64e+7);
        startTime = new Date(startTime).toISOString().split('T')[0];
        endTime = endTime.toISOString().split('T')[0];
        market.login.getMultiBarsV2(
            ticker,
            {
                start: startTime,
                end: endTime,
                limit: 1000,
                timeframe: "1Week",
                adjustment: "all",
            },
            market.login.configuration
        ).then((resp)=>cb(resp));
        
    },
    newOrder:(ticker,amount,action) => {
        market.login.createOrder({
            symbol:ticker,
            qty:amount,
            side:action,
            type:'market',
            time_in_force:'gtc'
        });
    },
    checkInvestments:(cb)=> {
        market.login.getPositions().then((account)=>{cb(account)});
    },
    getPrice:(ticker,cb)=> {
        market.login.getLatestTrade(ticker).then((res)=>cb(res));
    },
    getBuyingPower:(cb)=> {
        market.login.getAccount()
        .then(account=>cb(account.buying_power));
    }
}

exports.searchTicker = market.searchTicker;
exports.getAccount = market.checkInvestments;
exports.searchPrice = market.getPrice;
exports.newOrder = market.newOrder;
exports.getBuyingPower = market.getBuyingPower;
exports.preformLogin = market.preformLogin;