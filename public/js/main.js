let main = {
    viewData:undefined
}
let date = {
    format:(date) => {
        const y = date.getYear()-100, mo = date.getMonth()+1, d = date.getDate();
        const h = date.getHours(), mi = date.getMinutes(), s = date.getSeconds();
        return mo+"/"+d+"/"+y+" "+h+":"+mi+":"+s;
    }
}

var math = {
    roundTo:(value,place) => {
        const newVal = Math.round(value/place)*place;
        if(newVal.toString().includes('.')) {
            if(newVal.toString().split('.')[1].length>place.toString().split('.')[1].length) return math.roundTo(value+0.001,place);
        }
        return newVal;
    }
}

window.onload = () => {
    if(window.location.pathname != "/") {      
        window.location.href = "http://"+window.location.host+"/"; 
    }
    loader.start();
    requestAllData(viewData => {    
        window.onresize = graph.resize;
        window.onkeydown = gui.closeOverlays;
        main.viewData = viewData;
        loader.stop();
        gui.init();
        graph.init();
    });

};



const requestAllData = (cb) => {
    ajax.ping((pingSucsess)=> {
        if(pingSucsess) {
            ajax.newReq("http://localhost:3006/loadData", (viewData) => {
                if(viewData.error) {
                    document.getElementById("loadingText").style.filter = "opacity(0)";
                    loader.color = "rgb(140,0,0)";
                    const errorE = document.getElementById("loadingError");
                    errorE.innerHTML = viewData.message;
                    errorE.style.display = "block";
                } else if(viewData.reloadTicker){
                    document.getElementById("loadingText").style.color = "rgb(140,140,0)";
                    loader.color = "rgb(90,90,0)";
                    document.getElementById("loadingText").innerHTML = "Gathering ticker data...<br><br>This can take several minutes<br>Reload page when the server console says this process has finished."
                }else{
                    document.getElementById("subtitle").style.display = "inline-block";
                    document.getElementById("yahooFinance").innerHTML = `Open ${viewData.investment.dataGathered.ticker} in Yahoo Finance`;
                    document.getElementById("yahooFinanceAnchor").href = "https://finance.yahoo.com/quote/"+viewData.investment.dataGathered.ticker
                    cb(viewData); 
                }
            });
        } else {
            document.getElementById("loadingText").style.filter = "opacity(0)";
            loader.color = "rgb(140,0,0)";
            const errorE = document.getElementById("loadingError");
            errorE.innerHTML = "Network error, check your internet.";
            errorE.style.display = "block";
        }
    })

}