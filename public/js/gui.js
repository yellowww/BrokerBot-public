var gui = {
    init:() => {
        if(!main.viewData.marketOpen) document.getElementById("marketOpen").style.display = "inline-block";
        document.getElementById("moreInfoButton").style.display = "block";
        document.getElementById("riskRange").value = main.viewData.config.risk*1000;
        document.getElementById("openConfig").style.display = "block";
        document.getElementById("riskRangeValue").innerHTML = 'risk percent: '+(document.getElementById('riskRange').value/10)+'%';
        document.getElementById("moreInfoAlpaca").style.display = "inline-block";
        document.getElementById("statTitle").innerHTML = `Viewing ${main.viewData.investment.dataGathered.ticker} stats:`
        document.getElementById("isInvested").innerHTML = main.viewData.invested?"You are invested":"You are not invested";
        document.getElementById("consistencyScore").innerHTML = `Consistency score: ${math.roundTo(main.viewData.investment.dataGathered.score,0.001)}`;
        document.getElementById("periodLength").innerHTML = `Average period Length: ${Math.round(main.viewData.investment.dataGathered.averagePeriodLength*1.15741e-8)} days`;
        if(main.viewData.investment.future.nextPeak.date.acc>new Date().getTime()) {
            document.getElementById("profitTime").innerHTML = `Estimated time until profit: ${Math.round((main.viewData.investment.future.nextPeak.date.acc-new Date().getTime())*1.15741e-8)} days`;
        } else {
            document.getElementById("profitTime").innerHTML = "Missed profit marks!";
            document.getElementById("profitTime").style.color = "rgb(190,80,80)";
        }
        if(main.viewData.investment.future.nextDrop.date.acc-new Date().getTime()>0) {
            document.getElementById("purchaseTime").innerHTML = `Estimated time until purchase: ${Math.round((main.viewData.investment.future.nextDrop.date.acc-new Date().getTime())*1.15741e-8)} days`;
            if(main.viewData.investment.future.sellPoint.date.acc>new Date().getTime()) {
                document.getElementById("profitTime").innerHTML = `Estimated time until profit: ${Math.round((main.viewData.investment.future.sellPoint.date.acc-new Date().getTime())*1.15741e-8)} days`;
            }
        }
        document.getElementById("estimatedProfit").innerHTML = `Estimated profit: ${math.roundTo((1-main.viewData.investment.future.nextDrop.price.max/main.viewData.investment.future.nextPeak.price.min)*200,0.1)}%`;
    },
    closeOverlays:(e)=> {
        if(e.key == "Escape") {
            document.getElementById("moreInfoContainer").style.display = "none";
            document.getElementById("alpacaInfoContainer").style.display = "none";
            document.getElementById("editConfigContainer").style.display = "none";
            document.body.style.overflow = "auto";
        }
    },
    closeKeyOverlays:(e) => {
        if(e.key == "Escape") {
            document.getElementById("alpacaInfoContainer").style.display = "none";
            document.body.style.overflow = "auto";            
        }
    },
    lockMainContent:() => {
        document.body.style.overflow = "hidden";
        window.scrollTo(0,0);
    }
}