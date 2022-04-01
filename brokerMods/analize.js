let analize = {
    formatPriceHistory:(barArray,interpolate) => {
        var closeHistory = [];
        for(let i=0;i<barArray.length;i++) {
            closeHistory.push({
                date:barArray[i].Timestamp,
                price:barArray[i].ClosePrice
            });
        }
        if(interpolate)return analize.interp.interpolateFormated(closeHistory);
        return closeHistory;
    },
    interp: {
        interpolateFormated:(formated) => { // fill in any missing days with interpolated data
                let lastDate;
                let interpolatedData = formated.slice(),currentResultPosition=0;
                for(let i=0;i<formated.length-1;i++) {
                    const thisDate = new Date(formated[i].date);
                    if(i>0 && analize.interp.checkNeedsInterpolation(lastDate, thisDate)) {
                        let dateDif = analize.interp.roundTo(analize.interp.findDateDif(lastDate,thisDate),0.1);
                        for(let j=dateDif-2;j>=0;j--) {
                            let newDate = new Date(lastDate.getTime()+(6.048e+8*(j+1))).toISOString();
                            newDate = newDate.split(':')[0]+":"+newDate.split(':')[1]+":"+"00Z";
                            const priceDif = formated[i].price-formated[i-1].price;
                            const interpPrice = formated[i-1].price+(priceDif*(j/dateDif-2));
                            const newEntry = {
                                date:newDate,
                                price:analize.interp.roundTo(interpPrice,0.01)
                            }
                            interpolatedData.splice(currentResultPosition,0,newEntry)
                        }
                        currentResultPosition+=dateDif-1;
                    }
                    currentResultPosition++;
                    lastDate = thisDate;
                }
                return interpolatedData;
            },
            checkNeedsInterpolation: (lastDate, thisDate) => {  // check if there is a gap in the price history
                let toCompare = new Date(lastDate.valueOf());
                toCompare.setDate(lastDate.getDate()+7);
                return !toCompare.toISOString() == thisDate.toISOString();
            },
            findDateDif:(lastDate, thisDate) => { // find weeks between 2 dates
                const msDif = thisDate-lastDate;
                return msDif*1.65344e-9;
            },
            roundTo:(val,place)=> {
                let newVal = val / place;
                newVal = Math.round(newVal)*place;
                if(newVal.toString().includes('.')) {
                    const placeAfterFloat = place.toString().split('.')[1], afterFloat = newVal.toString().split('.')[1];
                    if(afterFloat.length>placeAfterFloat.length) { // look for js math inperfections
                        let afterFloatArray = afterFloat.split('');
                        afterFloatArray.splice(placeAfterFloat+1, afterFloatArray.length-placeAfterFloat);
                        newVal = Number(newVal.toString().split('.')[0]+"."+afterFloatArray.join(''));
                    }  
                }
                return newVal;
            }
    },


    getPeaks: (input) => {
        let allChange = []
        for(let i=1;i<input.length;i++) {
            let thisChange = 1-(input[i-1].price/input[i].price);
            allChange.push(thisChange);
        }
        let average = 0;
        for(let i=0;i<allChange.length;i++) if(allChange[i]<0)average+=Math.abs(allChange[i]);
        average/=allChange.length;
        
        let lastPeak;
        let allVallys = [];
        for(let i=0;i<allChange.length;i++) {
            if(allChange[i]*-1>average*2 && allChange[i+1]*-1<average*2 && i>1 && lastPeak) {
                if(input[i-1].price-input[i].price>0) {
                    allVallys.push({
                        price:input[i+1].price,
                        date:input[i+1].date,
                        inputIndex:i+1,
                        change:allChange[i+1],
                        peak: {
                            price:input[lastPeak+1].price,
                            date:input[lastPeak+1].date,
                            inputIndex:lastPeak+1,
                            change:allChange[lastPeak+1],
                        }
                    })                    
                }

            }
            else if(allChange[i+1]*-1>average*2 && allChange[i]*-1<average*2) {
                lastPeak = i;
            }
        }
        return allVallys;
    },
    grade: {
        grade:(data) => {
            const dropoffs = analize.grade.compareSlopes(analize.grade.gradeDropoffs(data));
            const upturns = analize.grade.compareSlopes(analize.grade.gradeUpturns(data));
            let averageGrade = Math.abs(dropoffs+upturns)/2;
            return averageGrade;
        },
        gradeDropoffs:(data) => {
            let slopes = [];
            for(let i=0;i<data.length;i++) {
                const peakDate = new Date(data[i].peak.date).getTime();
                const peakPrice = data[i].peak.price;
                const vallyDate = new Date(data[i].date).getTime();
                const vallyPrice = data[i].price;
                const slope = (peakPrice-vallyPrice)/(peakDate-vallyDate);
                slopes.push(slope);    
            }
            return slopes;
        },
        gradeUpturns:(data) => {
            let slopes = [];
            for(let i=0;i<data.length-1;i++) {
                const peakDate = new Date(data[i+1].peak.date).getTime();
                const peakPrice = data[i+1].peak.price;
                const vallyDate = new Date(data[i].date).getTime();
                const vallyPrice = data[i].price;
                const slope = (peakPrice-vallyPrice)/(peakDate-vallyDate);  
                slopes.push(slope);    
            }
            return slopes;
        },
        compareSlopes: (slopes) => {
            let comparedSlopes = [];
            for(let i=0;i<slopes.length;i++) {
                let thisSlope = slopes[i];
                for(let j=0;j<slopes.length;j++) {
                    if(i!=j) {
                        let compared = Math.abs(thisSlope)/Math.abs(slopes[j]);
                        if(compared<1)compared=1/compared;
                        comparedSlopes.push(compared);
                    }
                }
            }
            let average = 0;
            for(let i=0;i<comparedSlopes.length;i++) average+=comparedSlopes[i];
            average/=comparedSlopes.length;
            return average;
        }
    },
    dating: {
        compareDates:(rawData,timeScale) => {
            let firstDate = new Date(rawData[0].date).getTime();
            let lastDate = new Date(rawData[rawData.length-1].date).getTime();
            if(lastDate-firstDate<(timeScale*1.15741e-8)*0.95) return false;
            return true;
        },
        gradeDateDistribution:(peaks,timeScale) => { // find the consitancy of period lengths as well as the average length
            if(peaks.length>timeScale/30) return 10;
            let allTimesDiff = [];
            for(let i=1;i<peaks.length;i++) {
                const lastTime = new Date(peaks[i-1].date).getTime();
                const thisTime = new Date(peaks[i].date).getTime();
                allTimesDiff.push(thisTime-lastTime);
            }
            let allTimesRelitive = [];
            for(let i=0;i<allTimesDiff.length;i++) {
                for(let j=1;j<allTimesDiff.length;j++) if(i!=j) {
                    let thisRelitive = allTimesDiff[i]/allTimesDiff[j];
                    if(thisRelitive<1)thisRelitive=1/thisRelitive;
                    allTimesRelitive.push(thisRelitive);
                }
            }
            let relitiveAverage = 0;
            for(let i=0;i<allTimesRelitive.length;i++) relitiveAverage+=allTimesRelitive[i];
            relitiveAverage/=allTimesRelitive.length;

            let differenceAverage = 0;
            for(let i=0;i<allTimesDiff.length;i++) differenceAverage+=allTimesDiff[i];
            differenceAverage/=allTimesDiff.length;

            return {relitive:relitiveAverage,differnce:differenceAverage};
        }
    },
    bounds: {
        findMinBound:(inputData) => {
            let formated = analize.bounds.format(inputData,false);
            let linReg = analize.math.linReg(formated);
            return linReg;
        },
        findMaxBound:(inputData) => {
            let formated = analize.bounds.format(inputData,true);
            let linReg = analize.math.linReg(formated);
            return linReg;
        },
        compareBounds:(min,max)=> {
            if(min.r<0.70) return false;
            if(max.r<0.70) return false;
            return true;
        },
        format:(peaks,maxBound) => {
            let coords = [];
            for(let i=0;i<peaks.length;i++) {
                let thisPeak = peaks[i];
                if(maxBound) thisPeak = peaks[i].peak;

                let date  = new Date(thisPeak.date).getTime();
                let price = thisPeak.price
                coords.push({x:date,y:price});
            }
            return coords;
        }
    },
    math: {
        linReg:(allPoints) => {
            var lr = {};
            var n = allPoints.length;
            var sum_x = 0;
            var sum_y = 0;
            var sum_xy = 0;
            var sum_xx = 0;
            var sum_yy = 0;
            for (var i = 0; i < allPoints.length; i++) {
                sum_x += allPoints[i].x;
                sum_y += allPoints[i].y;
                sum_xy += (allPoints[i].x*allPoints[i].y);
                sum_xx += (allPoints[i].x*allPoints[i].x);
                sum_yy += (allPoints[i].y*allPoints[i].y);
            }

            lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
            if(isNaN(lr.slope)) {
            lr.slope = Infinity;
            }
            lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
            if(isNaN(lr.intercept)) {
            lr.intercept = 0;
            }
            lr['r'] = (n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y));
            if(isNaN(lr.r)) {
            lr.r = 1;
            }
            return lr;
            }
    }    
}

exports.formatPrice = analize.formatPriceHistory; // turn raw open/close data into a usable format and then fill in any missing data
exports.getPeaks = analize.getPeaks; // find peaks and drop-offs  
exports.grade = analize.grade.grade; // grade upturns and dropoffs based on constancy
exports.findMinBound = analize.bounds.findMinBound; // find a function repersenting the lowest dropoffs
exports.findMaxBound = analize.bounds.findMaxBound; // find a function repersenting the highest points
exports.compareBounds = analize.bounds.compareBounds; // make sure that upper and lower bounds are showing a steady upward trend
exports.compareDates = analize.dating.compareDates; //  make sure that there is enough data to make accurate conclusions
exports.comparePeriords = analize.dating.gradeDateDistribution; // find relitive and absolute differences between dates