const market = require('./market.js');
const main = require('../main.js');

let invest = {
    trends: {
        chooseAction:(data,cb) => { // -1 = sell, 0 = hold, 1 = buy
            const nextPeak = invest.trends.findNextPeak(data);
            const nextDrop = invest.trends.findNextDrop(data);
            const sellPoint = invest.trends.findNextSellPoint(data);
            invest.grading.gradePrice(data,data.score,(res)=> {
                console.log('\x1b[32m     Overall Grade: '+res)
            });
            console.log("\x1b[0m","------------Status Report ("+data.ticker+" - "+new Date().toISOString()+")------------")
            console.log("     last event: \x1b[90mprices for the last peak/droppoff\x1b[0m \n     |    peak: $"+data.lastPeak.peak.price+"\n     |    dropoff: $"+data.lastPeak.price);
            console.log("     next peak: \x1b[90mprices and times for the next predicted peak\x1b[0m\n     |    Date: "+new Date(nextPeak.date.acc).toISOString()+"\n     |    Min Date: "+new Date(nextPeak.date.min).toISOString()+"\n     |    \x1b[4mprice: $"+_Math.roundTo(nextPeak.price.min,0.01),'\x1b[0m');
            console.log("     next drop: \x1b[90mprices and times for the next predicted dropoff\x1b[0m\n     |    Date: "+new Date(nextDrop.date.acc).toISOString()+"\n     |    Min Date: "+new Date(nextDrop.date.min).toISOString()+"\n     |    \x1b[4mprice: $"+_Math.roundTo(nextDrop.price.max,0.01)+"\x1b[0m\n");
            console.log("     sell point: \x1b[90mprices and times for the next predicted cash out time\x1b[0m\n     |    Date: "+new Date(sellPoint.date.acc).toISOString()+"\n     |    Min Date: "+new Date(sellPoint.date.min).toISOString()+"\n     |    \x1b[4mprice: $"+_Math.roundTo(sellPoint.price.min,0.01)+"\x1b[0m\n");
            let timeToProfit = Math.round((nextPeak.date.acc - new Date().getTime())*1.15741e-8), holdingTime = Math.round((nextPeak.date.acc - nextDrop.date.min)*1.15741e-8);
            if(holdingTime>timeToProfit)holdingTime = timeToProfit;
            if(timeToProfit>=0) {
                console.log("\x1b[0m\x1b[32m     Estimated Profit: "+_Math.roundTo(nextPeak.price.min/nextDrop.price.max-1,0.001)*200+"% in about "+timeToProfit+" days (holding for "+holdingTime+" days)");
            } else {
                console.log("\x1b[0m\x1b[32m     Estimated Profit: "+_Math.roundTo(nextPeak.price.min/nextDrop.price.max-1,0.001)*200+"% \n     \x1b[31mMissed profit marks\x1b[32m");
            }
            let account;
            market.getAccount((res)=>{
                account = res;
                const isInvested = account.length>0;
                market.searchPrice(data.ticker, (trade)=> {
                    console.log("\x1b[32m     Current Price: $"+trade.Price);
                    let action;
                    if(isInvested) action = (trade.Price>=nextPeak.price.min && new Date(trade.Timestamp).getTime()>nextPeak.date.min)*-1;
                    else action = (trade.Price<=nextDrop.price.max && new Date(trade.Timestamp).getTime()>nextDrop.date.min)*1;
                    cb(action);

                    let actionString = action ? "Buy":"Hold";
                    if(action!=0)actionString = (action==1) ? "Buy":"Sell";
                    console.log("\x1b[32m     action: "+actionString);
                    console.log("\x1b[0m---------------------------------------------");
                });
            });

        },
        findNextPeak:(data) => {
            const prevPeak = data.lastPeak.peak;
            const nextPeakDate = new Date(prevPeak.date).getTime()+data.averagePeriodLength;
            const maxMarginOfError = data.averagePeriodLength*0.6;

            const pricePeak = data.maxBound.intercept+data.maxBound.slope*nextPeakDate;
            let nextPeak = {
                date: {
                    min:nextPeakDate-maxMarginOfError,
                    acc:nextPeakDate
                },
                price: {
                    min:pricePeak
                }
            }
            return nextPeak;
        },
        findNextSellPoint:(data) => {
            const prevPeak = data.lastPeak.peak;
            const nextPeakDate = new Date(prevPeak.date).getTime()+(data.averagePeriodLength*2);
            const maxMarginOfError = data.averagePeriodLength*0.6;

            const pricePeak = data.maxBound.intercept+data.maxBound.slope*nextPeakDate;
            let nextPeak = {
                date: {
                    min:nextPeakDate-maxMarginOfError,
                    acc:nextPeakDate
                },
                price: {
                    min:pricePeak
                }
            }
            return nextPeak;
        },
        findNextDrop:(data) => {
            const prevDrop = data.lastPeak;
            const nextDropDate = new Date(prevDrop.date).getTime()+data.averagePeriodLength;
            const maxMarginOfError = data.averagePeriodLength*0.4;

            const dropPrice = data.minBound.intercept+data.minBound.slope*nextDropDate;
            let nextDrop = {
                date: {
                    min:nextDropDate-maxMarginOfError,
                    acc:nextDropDate
                },
                price: {
                    max:dropPrice
                }
            }
            return nextDrop;
        }
    },
    grading: {
        gradePrice:(tickerData,consGrade,cb) => {
            const  sellPoint = invest.trends.findNextSellPoint(tickerData);
            const nextDrop = invest.trends.findNextDrop(tickerData);
            let newGrade;
            market.searchPrice(tickerData.ticker, (trade)=> {
                const price = trade.Price;
                let grade = price/nextDrop.price.max;
                if(price/nextDrop.price.max<0.9)grade=10/grade;
                newGrade = (consGrade*0.75+grade*0.25);
                const estProfit = (sellPoint.price.min/nextDrop.price.max)-1;
                newGrade = (newGrade*(1-main.config.risk))+((1/estProfit)*main.config.risk); // incorperate consistancy grade with estimated profit based on risk
                cb(newGrade);
            });
            
        }
    }
}

var _Math = {
    roundTo:(value,place)=> {
        return Math.round(value/place)*place;
    }
}

exports.getAction = invest.trends.chooseAction;
exports.gradeFuture = invest.grading.gradePrice;
exports.findNextPeak = invest.trends.findNextPeak
exports.findNextDrop = invest.trends.findNextDrop;
exports.findNextSellPoint = invest.trends.findNextSellPoint;