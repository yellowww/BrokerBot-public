var graph = {
    canvas: undefined,
    c:undefined,
    init:()=> {
        graph.canvas = document.getElementById("graphCanvas");
        document.getElementById("graphContainer").style.display = "block";
        graph.c = graph.canvas.getContext('2d');
        graph.canvas.width = window.innerWidth*0.55;
        graph.canvas.height = window.innerWidth*0.25;
        graph.draw.drawAll();
    },
    draw: {
        drawHistory: () => {
            const padding = 0.15;
            const history = main.viewData.investment.rawPrice;
            const maxHistoryPrice = Math.max(...history.map(entry=>entry.price))*(1+padding),maxEventPrice = main.viewData.investment.future.sellPoint.price.min*(1+padding),maxPrice = maxHistoryPrice>maxEventPrice?maxHistoryPrice:maxEventPrice, minPrice = Math.min(...history.map(entry=>entry.price))*(1-padding), priceDiff = maxPrice-minPrice;
            const maxHistoryDate = new Date(history[history.length-1].date).getTime(), maxEventDate = main.viewData.investment.future.sellPoint.date.acc, maxDate = maxHistoryDate>maxEventDate? maxHistoryDate:maxEventDate;
            const minHistroyDate = new Date(history[0].date).getTime();
            graph.c.beginPath();
            graph.c.lineWidth = 3;
            graph.c.strokeStyle = "rgb(200,200,200)"
            for(let i=0;i<history.length;i++) {
                const x = (new Date(history[i].date).getTime()-minHistroyDate)/(maxDate-minHistroyDate)*graph.canvas.width;
                const y = (1-(history[i].price-minPrice)/priceDiff)*graph.canvas.height;
                if(i==0) {graph.c.moveTo(x,y)} else {graph.c.lineTo(x,y)};
            }
            graph.c.stroke();
        },
        drawEvents: () => {
            const padding = 0.15;
            const history = main.viewData.investment.rawPrice;
            const future = main.viewData.investment.future;
            const maxHistoryPrice = Math.max(...history.map(entry=>entry.price))*(1+padding),maxEventPrice = main.viewData.investment.future.sellPoint.price.min*(1+padding),maxPrice = maxHistoryPrice>maxEventPrice?maxHistoryPrice:maxEventPrice, minPrice = Math.min(...history.map(entry=>entry.price))*(1-padding), priceDiff = maxPrice-minPrice;
            const maxHistoryDate = new Date(history[history.length-1].date).getTime(), maxEventDate = main.viewData.investment.future.sellPoint.date.acc, maxDate = maxHistoryDate>maxEventDate? maxHistoryDate:maxEventDate;
            const minHistroyDate = new Date(history[0].date).getTime();
            const lastPeak = main.viewData.investment.dataGathered.lastPeak;
            graph.c.strokeStyle = "rgb(200,200,0)";
            graph.c.beginPath();
            graph.c.lineWidth=3;
            let coord = graph.draw.getCoordFromDate(lastPeak.peak.date, lastPeak.peak.price,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.moveTo(coord.x,coord.y);
            coord = graph.draw.getCoordFromDate(lastPeak.date, lastPeak.price,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.lineTo(coord.x,coord.y);
            coord = graph.draw.getCoordFromDate(future.nextPeak.date.acc, future.nextPeak.price.min,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.lineTo(coord.x,coord.y);
            coord = graph.draw.getCoordFromDate(future.nextDrop.date.acc, future.nextDrop.price.max,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.lineTo(coord.x,coord.y);
            coord = graph.draw.getCoordFromDate(future.sellPoint.date.acc, future.sellPoint.price.min,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.lineTo(coord.x,coord.y);
            graph.c.stroke();
        },
        fillBuySellRegions:() => {
            const padding = 0.15;
            const history = main.viewData.investment.rawPrice;
            const future = main.viewData.investment.future;
            const maxHistoryPrice = Math.max(...history.map(entry=>entry.price))*(1+padding),maxEventPrice = main.viewData.investment.future.sellPoint.price.min*(1+padding),maxPrice = maxHistoryPrice>maxEventPrice?maxHistoryPrice:maxEventPrice, minPrice = Math.min(...history.map(entry=>entry.price))*(1-padding), priceDiff = maxPrice-minPrice;
            const maxHistoryDate = new Date(history[history.length-1].date).getTime(), maxEventDate = main.viewData.investment.future.sellPoint.date.acc, maxDate = maxHistoryDate>maxEventDate? maxHistoryDate:maxEventDate;
            const minHistroyDate = new Date(history[0].date).getTime();

            const buyPoint = graph.draw.getCoordFromDate(future.nextDrop.date.min, future.nextDrop.price.max,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.fillStyle = "rgba(0,0,100,0.3)";
            graph.c.fillRect(buyPoint.x,buyPoint.y,graph.canvas.width,graph.canvas.height);

            const sellPoint = graph.draw.getCoordFromDate(future.nextPeak.date.min, future.nextPeak.price.min,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.fillStyle = "rgba(0,100,0,0.3)";
            graph.c.fillRect(sellPoint.x,0,graph.canvas.width,sellPoint.y);
        },
        getCoordFromDate:(date,price,minHistroyDate,maxDate,minPrice,priceDiff) => {
            let x = (new Date(date).getTime()-minHistroyDate)/(maxDate-minHistroyDate)*graph.canvas.width;
            let y = (1-(price-minPrice)/priceDiff)*graph.canvas.height;
            return {x:x,y:y};
        },
        drawIndicatorLines:()=> {         
            const padding = 0.15;       
            const history = main.viewData.investment.rawPrice;
            const maxHistoryPrice = Math.max(...history.map(entry=>entry.price))*(1+padding),maxEventPrice = main.viewData.investment.future.sellPoint.price.min*(1+padding),maxPrice = maxHistoryPrice>maxEventPrice?maxHistoryPrice:maxEventPrice, minPrice = Math.min(...history.map(entry=>entry.price))*(1-padding), priceDiff = maxPrice-minPrice;
            const maxHistoryDate = new Date(history[history.length-1].date).getTime(), maxEventDate = main.viewData.investment.future.sellPoint.date.acc, maxDate = maxHistoryDate>maxEventDate? maxHistoryDate:maxEventDate;
            const minHistroyDate = new Date(history[0].date).getTime();
            graph.c.lineWidth = 2;
            graph.c.strokeStyle = "rgb(50,50,50)";
            graph.c.fillStyle = "rgb(110,110,110)";
            graph.c.font = "12px Arial";
            const amountOfBars = Math.round(graph.canvas.width/120);
            for(let i=1;i<amountOfBars;i++) {
                graph.c.beginPath();  
                const x = i*graph.canvas.width/amountOfBars;
                const thisDate = new Date((i/amountOfBars)*(maxDate-minHistroyDate)+minHistroyDate);
                const formatedDate = date.format(thisDate);
                graph.c.moveTo(x,0);
                graph.c.lineTo(x,graph.canvas.height-20);
                graph.c.stroke();
                graph.c.fillText(formatedDate, x, graph.canvas.height-5);
            }
            graph.c.strokeStyle = "rgb(40,40,40)";
            graph.c.fillStyle = "rgb(130,130,130)";
            for(let i=1;i<6;i++) {
                const y = (6-i)*graph.canvas.height/6;
                const price = i/6*priceDiff+minPrice;
                const digets = ("$"+Math.round(price*10)/10).length;
                graph.c.fillText("$"+Math.round(price*10)/10,0,y);
                graph.c.beginPath();
                graph.c.moveTo(8*digets,y);
                graph.c.lineTo(graph.canvas.width,y);
                graph.c.stroke();
            }
        },
        drawBounds:()=> {
            const padding = 0.15;
            const history = main.viewData.investment.rawPrice;
            const maxHistoryPrice = Math.max(...history.map(entry=>entry.price))*(1+padding),maxEventPrice = main.viewData.investment.future.sellPoint.price.min*(1+padding),maxPrice = maxHistoryPrice>maxEventPrice?maxHistoryPrice:maxEventPrice, minPrice = Math.min(...history.map(entry=>entry.price))*(1-padding), priceDiff = maxPrice-minPrice;
            const maxHistoryDate = new Date(history[history.length-1].date).getTime(), maxEventDate = main.viewData.investment.future.sellPoint.date.acc, maxDate = maxHistoryDate>maxEventDate? maxHistoryDate:maxEventDate;
            const minHistroyDate = new Date(history[0].date).getTime();
            const minBound = main.viewData.investment.dataGathered.minBound, maxBound = main.viewData.investment.dataGathered.maxBound;

            const minLeftCoords = graph.draw.getCoordFromDate(minHistroyDate,minHistroyDate*minBound.slope+minBound.intercept,minHistroyDate,maxDate,minPrice,priceDiff);
            const minRightCoords = graph.draw.getCoordFromDate(maxDate,maxDate*minBound.slope+minBound.intercept,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.beginPath();
            graph.c.strokeStyle = "rgba(200,0,0,0.5)";
            graph.c.lineWidth = 5;
            graph.c.moveTo(minLeftCoords.x,minLeftCoords.y);
            graph.c.lineTo(minRightCoords.x,minRightCoords.y);
            graph.c.stroke();

            const maxLeftCoords = graph.draw.getCoordFromDate(minHistroyDate,minHistroyDate*maxBound.slope+maxBound.intercept,minHistroyDate,maxDate,minPrice,priceDiff);
            const maxRightCoords = graph.draw.getCoordFromDate(maxDate,maxDate*maxBound.slope+maxBound.intercept,minHistroyDate,maxDate,minPrice,priceDiff);
            graph.c.beginPath();
            graph.c.strokeStyle = "rgba(0,200,200,0.5)";
            graph.c.lineWidth = 5;
            graph.c.moveTo(maxLeftCoords.x,maxLeftCoords.y);
            graph.c.lineTo(maxRightCoords.x,maxRightCoords.y);
            graph.c.stroke();
        },
        drawAll:() => {
            graph.draw.drawIndicatorLines(); 
            graph.draw.drawBounds();    
            graph.draw.fillBuySellRegions();  
            graph.draw.drawHistory();
            graph.draw.drawEvents();
        }
    },
    resize:() => {
        graph.c.clearRect(0,0,graph.canvas.width,graph.canvas.height);
        graph.init();
    }
}