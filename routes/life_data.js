"use strict";

//MISSÄ TÄMÄN TIEDOSTON PITÄISI SIJAITA?

//TÄHÄN TIEDOSTOON LISÄTÄÄN VIIKKOJEN JA NIIDEN SISÄLTÖJEN LUKEMINEN TIEDOSTOSTA
//MILLOIN KANNATTAA KÄYTTÄÄ ANONYYMEJA FUNKTIOITA? PYSYVÄTKÖ TÄSSÄ TEIDOSTOSSA MÄÄRITELLYT MUUTTUJAN TÄMÄN TIEDOSTON SISÄLLÄ?

//HUOM! Date.getDate palauttaa vain kuukauden päivän
//HUOM! Pitäisikö ajat käsitellä UTC:nä?
//HUOM! VOISI YLEISTÄÄ (TEHDÄ YLEISTÄMISEN LOPPUUN) NIIN, ETTÄ MYÖS KUUKUSIA TAI VUOSIA VOI
//KÄSITELLÄ PELKKIEN VIIKKOJEN SIJAAN.

//Span is a time span.
//Large week is more thorough representation of small week. It has more properties.

var express = require('express');
var router = express.Router();


//var tv = "text of test variable";

console.log("life_data alkaa");

var ldFileIo = require('./file_io');
var df = require('./date_functions');

// TÄYTTÄÄ TIEDOSTON ESIMERKEILLÄ: (EI IHAN TOIMI, KOSKA PITÄÄ OLLA WEEKS-OMINAISUUS JA AALTOSULUT YM.)
/*var wos = defineWeekObjects();
simplifyDates(wos);
var completeObject = {weeks:wos};
var wosJsonString = JSON.stringify(completeObject);
ldFileIo.writeLifeFile(wosJsonString);*/

//ldFileIo.readLifeFile();
//console.log("luettu");

//KYSYMYS: MITÄ KAUTTA app-tiedoston virheidenkäsittelijöitä kutsutaan?
    
router.get('/', function(req, res, next){
    console.log("life_data.js: router.getin callback-funktiota kutsuttu");
    //POISTETTU: var weekObjects = defineWeekObjects();
    //POISTETTU: simplifyDates(weekObjects);
    //console.log("weekObjects[0]: " + weekObjects[0].span.firstDate + ", " + weekObjects[0].span.lastDate + ", " + weekObjects[0].note);
    //POISTETTU: var weekObjectsJson = JSON.stringify(weekObjects);
    //console.log("weekObjectsJson: " + weekObjectsJson);
    ldFileIo.readLifeFile(function(fileContent){
        var weekDataJson = fileContent;
        weekDataJson = preprocessLdForClient(weekDataJson);
        //console.log("weekDataJson: " + weekDataJson);
        res.type('text/plain');
        res.json(weekDataJson);
        console.log("vastattu");
    });
});

router.post('/', function(req, res){
    console.log("life_datalle post");
    //console.log("req: " + req + ", res: " + res);
    //console.log(req.body);
    //console.log(typeof req.body);
    //console.log("a first date: " + req.body.weeks[0].firstDate);
    //console.log("tässä");
    var newLifeData = req.body;
    saveLifeData(newLifeData);
    res.send("serverin vastaus");
});

module.exports = router;

var spanLength = 7;

/*
 * Parses and saves the life data.
 * @param {object} rawLifeData - as it is sent by client (MERKKIJONO VAI OBJEKTI????)
 * @returns {undefined}
 */
function saveLifeData(rawLifeData){
//RAJATAPAUKSET??
    //newWeeks are weeks form the client
    var newWeeks = rawLifeData.weeks;
    var newBd = rawLifeData.newBd;
    var newDd = rawLifeData.newDd;
    console.log("newBd: " + msToDate(newBd));
    console.log("newDd: " + msToDate(newDd));
    var firstRawWeekMs = newWeeks[0].firstDate;//span.firstDate;
    //console.log(newWeeks.length);
    var lastRawWeekMs = newWeeks[newWeeks.length - 1].firstDate;//.span.firstDate;
    newWeeks = removeNotelessWeeks(newWeeks);
    newWeeks = toLargeFormat(newWeeks);
    ldFileIo.readLifeFile(function(fileContent){
        var existingWeekData = fileContent;
        existingWeekData = JSON.parse(existingWeekData);
        var existingWeeks = existingWeekData.weeks;
        var finalArray;
        if(existingWeeks.length === 0){
            finalArray = newWeeks;
        }else{
            //console.log("existing weeks:" + JSON.stringify(obj, null, 4));
            var beforePart = getWeeksBefore(existingWeeks, firstRawWeekMs);
            var afterPart = getWeeksAfter(existingWeeks, lastRawWeekMs);
            finalArray = beforePart.concat(newWeeks).concat(afterPart);
        }
        saveLdAsJson(finalArray, newBd, newDd);
    });
}

/*
 * 
 * @param {Array.<SmallWeek>} allWeeks
 * @returns {Array.<SmallWeek>}
 */
function removeNotelessWeeks(allWeeks){
    return allWeeks.filter(function(w){
        if(w.note === "") return false;
        return true;
    });
}

function toLargeFormat(weeks){
    return weeks.map(weekToLargeFormat);
}

/*
 * Helper of toLargeFormat
 * @returns {undefined}
 */
function weekToLargeFormat(week){
    var lastDateMs = getSpanLastDateMilliseconds(week.firstDate, 7);
    return {span:{firstDate:week.firstDate, lastDate:lastDateMs}, note:week.note};
}

/*
 * Pre-condition: weeks is not empty;
 * @param {Array.<LargeWeeks>} weeks
 * @param {number} time - milliseconds
 * @returns {Array.<LargeWeeks>} - weeks before time, exclusive.
 */
function getWeeksBefore(weeks, time){
//    var index = getIndexByDate(weeks, msToDate(time));
//    var before = weeks.slice(0, index);
//    return before;
    if(weeks.length === 0){
        throw "weeks is empty.";
    }
    var timeLocation = getLocationOfDateRelativeToArray(weeks, msToDate(time));
    var emptyArray = [];
    if(timeLocation.isBefore){
        return emptyArray;
    }else if(timeLocation.isAfter){
        return weeks;
    }else if(timeLocation.isInArray){
        return weeks.slice(0, timeLocation.index); //ENTÄ JOS ON VIIMEINEN INDEKSI?
    }else if(timeLocation.isBetweenIndices){
        return weeks.slice(timeLocation.betweenIndices.afterIndex);
    }
}

/*
 * Pre-condition: weeks is not empty;
 * @param {Array.<LargeWeeks>} weeks
 * @param {number} time - milliseconds
 * @returns {Array.<LargeWeeks>} - weeks after time, exclusive.
 */
function getWeeksAfter(weeks, time){
    if(weeks.length === 0){
        throw "weeks is empty.";
    }
    var timeLocation = getLocationOfDateRelativeToArray(weeks, msToDate(time));
    var emptyArray = [];
    if(timeLocation.isBefore){
        return weeks;
    }else if(timeLocation.isAfter){
        return emptyArray;
    }else if(timeLocation.isInArray){
        return weeks.slice(timeLocation.index + 1); //ENTÄ JOS ON VIIMEINEN INDEKSI?
    }else if(timeLocation.isBetweenIndices){
        return weeks.slice(timeLocation.betweenIndices.afterIndex);
    }
}

/*
 * Saves life data as JSON.
 * @param {Array.<LargeWeek>} weeksArray
 * @param {Date} bd
 * @param {Date} dd
 * @returns {}
 */
function saveLdAsJson(weeksArray, bd, dd){
    var final = {};
    final.weeks = weeksArray;
    final.bd = bd;
    final.dd = dd;
    //add dates in alternate form for readability
    final.weeks = final.weeks.map(function(w){
        w.span.firstDateAltForm = msToDate(w.span.firstDate);
        w.span.lastDateAltForm = msToDate(w.span.lastDate);
        return w;
    });
    final.bdAltForm = msToDate(final.bd);
    final.ddAltForm = msToDate(final.dd);
    var finalString = JSON.stringify(final, null, 4);
    ldFileIo.writeLifeFile(finalString);
}

//TESTAUSTA VARTEN
function writeMockFile(){
    var wos = defineWeekObjects();
    var bd = new Date(1975, 0, 0, 0, 0, 0);
    var dd = new Date(2000, 0, 0, 0, 0, 0);
    simplifyDates(wos);
    var completeObject = {weeks:wos, bd:bd, dd:dd};
    var wosJsonString = JSON.stringify(completeObject);
    ldFileIo.writeLifeFile(wosJsonString);
}

/*
 * 
 * @param {type} dataJson
 * @returns {String} dataJson without parts before bd and after dd
 */
function preprocessLdForClient(dataJson){
    //console.log(dataJson);
    var ld = JSON.parse(dataJson);
    var weeks = ld.weeks;
    var bd = ld.bd;
    var dd = ld.dd;
    var bdAsDate = msToDate(bd);
    var ddAsDate = msToDate(dd);
    console.assert(gtae(bd));
    console.assert(gtae(dd));
    console.assert(!weeks.some(function(e, i){
        if(typeof e.span.firstDate === 'undefined') console.log("undefined indeksissä " + i);
        return typeof e.span.firstDate === 'undefined';
    }));
        
    //console.log("weeks.length: " + weeks.length);
    //console.log("weeks ennen poistoa: " + JSON.stringify(weeks, null, 2));
    weeks = removeOutsideWeeks(weeks, bdAsDate, ddAsDate);
    //console.log("weeks.length: " + weeks.length);
    console.assert(gtae(weeks));
    //console.log("weeks ennen täyttöä: " + JSON.stringify(weeks, null, 2));
    weeks = fillMissingWeeks(weeks, bdAsDate, ddAsDate);
    ld.weeks = weeks;
    var ldString = JSON.stringify(ld);
    console.log("viimeinen viikko asiakkaalle: " + msToDate(weeks[weeks.length - 1].span.firstDate));
    console.log("asiakkaalle lähetetään: " + ldString);
    return ldString;
}

/*
 * VOISIKO KÄYTTÄÄ HYÖDYKSI getWeeksAfter ja -Before-FUNKTIOITA? -SE POISTAA MYÖS PÄIVÄMÄÄRIEN KOHDALLA OLEVAT,
 * MUUTA TÄSSÄ TAPAUKSESSA NE PITÄISI JÄTTÄÄ
 * @param {Array.<LargeWeek>} weeks
 * @param {Date} bd
 * @param {Date} dd
 * @returns {Array.<LargeWeek>} - Weeks without weeks that are outside inclusive bd and dd time span
 */
function removeOutsideWeeks(weeks, bd, dd){
    //cma(arguments);
    console.assert(gtae(weeks));
    //console.log(typeof bd);
    console.assert(bd instanceof Date);
    console.assert(dd instanceof Date);
    if(weeks.length === 0){
        return weeks;
    }
    //var firstIndex = getLocationOfDateInArray(weeks, bd); //getIndexByDate(weeks, bd);
    //var lastIndex = getLocationOfDateInArray(weeks, dd); //getIndexByDate(weeks, dd);
    var firstIndex;
    var lastIndex; //this is included to the remaining part of the array
    var bdLocation = getLocationOfDateRelativeToArray(weeks, bd);
    var ddLocation = getLocationOfDateRelativeToArray(weeks, dd);
    var emptyArray = [];
    //0, 1, | 2, 3, | 4
    //alkuindeksi: 2
    //loppuindeksi: 3
    
    //determine first index
    if(bdLocation.isBefore){
        firstIndex = 0;
    }else if(bdLocation.isAfter){
        //console.log("removeOutsideWeeks: syntymä on kaikkien jälkeen");
        return emptyArray;
    }else if(bdLocation.isInArray){
        firstIndex = bdLocation.index;
    }else if(bdLocation.isBetweenIndices){
        firstIndex = bdLocation.betweenIndices.afterIndex;
    }else{
        throw "Error.";
    }
    
    //determine last index
    if(ddLocation.isBefore){
        //console.log("removeOutsideWeeks: kuolema on kaikkia ennen");
        return emptyArray;
    }else if(ddLocation.isAfter){
        lastIndex = weeks.length - 1;
    }else if(ddLocation.isInArray){
        lastIndex = bdLocation.index;
    }else if(ddLocation.isBetweenIndices){
        lastIndex = ddLocation.betweenIndices.beforeIndex;
    }else{
        throw "Error.";
    }
    //console.log("bd: " + bd + ", dd: " + dd);
    //console.log("firstIndex: " + firstIndex);
    //console.log("lastIndex: " + lastIndex);
    // + 1 because the element in the last index needs to be included
    //console.log("weeks removeOutsideWeeks: " + JSON.stringify(weeks, null, 2));
    //console.log("removeOutsideWeeks: indeksit: " + firstIndex + ", " + lastIndex);
    var filteredWeeks = weeks.slice(firstIndex, lastIndex + 1);
    //console.log("filteredWeeks: " + JSON.stringify(filteredWeeks, null, 2));
    //console.assert(gtae(filteredWeeks));
    return filteredWeeks;
}

/*
 * 
 * @param {type} existingWeeks
 * @param {Date} newFirstDate
 * @param {Date} newLastDate
 * @returns {undefined}
 */
//EI TUNNISTA OLEMASSA OLEVIA VIIKKOJA
function fillMissingWeeks(existingWeeks, newFirstDate, newLastDate){
    console.assert(gtae(existingWeeks, newFirstDate, newLastDate));
    var fullWeekArray = [];
    var existingW;
    console.log("newFirstDate: " + newFirstDate);
    console.log("newLastDate: " + newLastDate);
    console.assert(gtae(existingWeeks));
    for(var d = newFirstDate; !df.isAfterWeek(d, newLastDate); d = df.incrementDate(d, 7)){
        //console.log(d + " ei ollut liian myöhään");
        if(containsWeekForDate(existingWeeks, d)){
            //console.log("contains week of " + d);
            existingW = getWeekOfDate(existingWeeks, d);
            fullWeekArray.push(existingW);
        }else{
            //console.log("doesn't contain week of " + d);
            fullWeekArray.push(createLargeWeek(d));
        }
    }
    return fullWeekArray;
}

/*
 * Helper of fillMissingWeeks
 * @param {Array.<LargeWeek>} weeks
 * @param {Date} date
 * @returns {boolean}
 */
function containsWeekForDate(weeks, date){
    console.assert(gtae(weeks));
    //console.log("weeks lenght: " + weeks.length);
    if(weeks.length === 0){
        console.log("Warning: containsWeekForDate: weeks.length is 0.");
    }
    return weeks.some(function(w){
        //console.log("isDateInWeek(w, date): " + isDateInWeek(w, date));
        return isDateInWeek(w, date);
    });
}

function getWeekOfDate(weeks, date){
    var week = weeks.find(function(w){
       return isDateInWeek(w, date);
    });
    console.assert(gtae(week));
    return week;
}

/*
 * @param {LargeWeek} week
 * @param {Date} date
 * @returns {boolean}
 */
function isDateInWeek(week, date){
    var fd = msToDate(week.span.firstDate);
    var ld = msToDate(week.span.lastDate);
    var dateMs = dateToMs(date);
    //console.log(fd + ", " + ld +", dateMs" + dateMs);
    if(fd <= dateMs && dateMs <= ld)
        return true;
    return false;
}

/*
 * Pre-condition: date is in week array.
 * @param {type} weekArray
 * @param {Date} date
 * @param {boolean} dateAsMilliseconds - optional, default: false
 * @returns {Number} - number i, where
 * date parameter is between weekArray[i].firstDate and
 * weekArray[i + 1].firstDate (inclusive and exclusive)
 */
//function getIndexByDate(weekArray, date){
//    console.assert(date instanceof Date);
//    console.assert(gtae(date));
////    if(date instanceof Date)
////        dateMs = date.getTime();
////    else if(typeof date === 'number')
////        dateMs = date;
////    else{
////        console.log("type: " + (typeof date));
////        throw "Wrong type.";
////    }
//    console.assert(!(typeof weekArray === 'undefined'));
//    console.assert(!containsUnd(weekArray));
//    console.assert(!weekArray.some(function(e){
//        return typeof e === 'undefined';
//    }));
//    console.assert(!weekArray.some(function(e){
//        return typeof e.span.firstDate === 'undefined';
//    }));
//    var dateMs = dateToMs(date);
//    var index;
//    for(var i = 0; i < weekArray.length; i++){
//        var wd = weekArray[i].span.firstDate; // .getTime();
//        if(dateMs >= wd && dateMs <= getSpanLastDateMilliseconds(wd, spanLength)){
//            index = i;
//        }
//    }
//    if(typeof index === 'undefined'){
//        console.log("weekArray.length: " + weekArray.length);
//        console.log("date: " + date);
//        console.log("weekArray: " + JSON.stringify(weekArray, null, 4));
//        throw "Index not found.";
//    }
//    return index;
//}

/*
 * PITÄISI JAKAA USEAKSI FUNKTIOKSI 
 * Pre-condition: weekArray is ordered form first to last. weekArray is not empty.
 * @param {Array.<LargeWeek>} weekArray
 * @param {Date} date
 * @returns {(see the 'result' local variable)}
 */
function getLocationOfDateRelativeToArray(weekArray, date){
    console.assert(gtae(weekArray, date));
    console.assert(date instanceof Date);
    if(weekArray.length === 0){
        throw "weekArray is empty.";
    }
    var dateMs = dateToMs(date);
    var result = {isInArray:false, index:-1,
            isBetweenIndices:false, betweenIndices:{beforeIndex:-1, afterIndex:-1},
            isBeforeArray:false, isAfterArray:false};
        
    //Check is date is before or after array and return if it is
    var isInArraySpan = false;
    var isBeforeArray = false;
    var isAfterArray = false;
    var arrayFirstDate = weekArray[0].span.firstDate;
    var arrayLastDate = weekArray[weekArray.length - 1].span.lastDate;
    if(arrayFirstDate <= dateMs && dateMs <= arrayLastDate){
        isInArraySpan = true;
    }else if(dateMs <= arrayFirstDate){
        isBeforeArray = true;
    }else if(dateMs >= arrayLastDate){
        isAfterArray = true;
    }else{
        throw "Error.";
    }   
    if(!isInArraySpan){
        result.isBefore = isBeforeArray;
        result.isAfter = isAfterArray;
        return result;
    }
    
    //Check if date is in array and return if it is.
    var index;
    var wd;
    for(var i = 0; i < weekArray.length; i++){
        wd = weekArray[i].span.firstDate;
        //console.log("wd: " + wd + ", dateMs: " + dateMs + ", getSpanLastDateMilliseconds: " +
        //        getSpanLastDateMilliseconds(wd, spanLength) + ", spanLength: " + spanLength);
        //if(dateMs >= wd && dateMs <= getSpanLastDateMilliseconds(wd, spanLength)){
        if(isDateInWeek(weekArray[i], date)){
            //console.log("indeksi löytynyt");
            index = i;
            result.isInArray = true;
            result.index = i;
            //console.log("indeksi: " + index);
            return result;
        }
    }
    
    //Find the indices on both sides of date, since date is not in any index
    var week;
    var nextWeek;
    for(var i = 0; i < weekArray.length; i++){
        week = weekArray[i];
        if(isAfterWeek(week, date)){
            if(i + 1 <= weekArray.length - 1){
                nextWeek = weekArray[i + 1];
                if(isBeforeWeek(nextWeek, date)){
                    result.isBetweenIndices = true;
                    result.betweenIndices = {beforeIndex:i, afterIndex:i + 1};
                    return result;
                }
            }
        }
    }
    
    //Should have returned already.
    throw "Location not found.";
}

/* 
 * @param {LargeWeek} week
 * @param {Date} date
 * @returns {boolean}
 */
function isBeforeWeek(week, date){
    return dateToMs(date) < week.span.firstDate;
}

/* 
 * @param {LargeWeek} week
 * @param {Date} date
 * @returns {boolean}
 */
function isAfterWeek(week, date){
    return dateToMs(date) > week.span.lastDate;
}

//TESTAUSTA VARTEN, KUTEN JOTKUT MUUTKIN ALLA (VAI OVATKO SITTENKÄÄN?)
function defineWeekObjects(){
    console.log("defineWeekObjects alkaa");
    var beginningDate = new Date(1980, 0, 0, 0, 0, 0);
    var yearCount = 1;
    var spans = createWeeks(beginningDate, yearCount);
    var weekObjects = createWeekObjects(spans);
    console.log("defineWeekObjects päättyy");
    return weekObjects;
}

/*
 * Return value: array of {firstDate:(date), lastDate:(date)} objects. They represent
 * the weeks from getMonday(beginningDate) to years parameter added to it.
 */
function createWeeks(beginningDate, years){
    var weeks = [];
    var firstMonday = getMonday(beginningDate);
    var finalDate = new Date(firstMonday.getTime());
    finalDate.setFullYear(beginningDate.getFullYear() + years);
    //console.log("final date: " + finalDate);
    //w is some date in a week, not neccessarily the first
    for(var w = firstMonday; !isNextWeekTooLate(w, finalDate); w = incrementDate(w, 7)){
        //console.log("luupissa w: " + w);
        var weekSpan = {firstDate:w, lastDate:incrementDate(w, 6)};
        weeks.push(weekSpan);
    }
    console.log("createWeeks-funktio suoritettu");
    return weeks;
}

/*
 * For each element in weekDates, creates the following kind of object:
 * {span{firstDate:, lastDate:}:, note:}. weekDates is a time span.
 * Returns an array of these objects.
 */
function createWeekObjects(weekDates){
    var weekObjects = [];
    for(var i = 0; i < weekDates.length; i++){
        var wo = createWeekObject(weekDates[i]);
        weekObjects.push(wo);
    }
    return weekObjects;
}

/*
 * weekSpan is {firstDate:(date), lastDate:(date)}
 */
function createWeekObject(weekSpan){
    //console.log("createWeekObject alkaa");
    var wo = {span:null, note:"placeholder note"};
    wo.span = weekSpan;
    return wo;
}

/*
 * Alters the date properties of each element in weekObjects.
 * Transforms them to milliseconds.
 */
function simplifyDates(weekObjects){
    console.log("simplifyDates alkaa");
    for(var i = 0; i < weekObjects.length; i++){
        //console.log("kierros " + i + "alkaa");
        //console.log(weekObjects);
        var fDate = weekObjects[i].span.firstDate;
        //console.log("kierros " + i + "tässä");
        var lDate = weekObjects[i].span.lastDate;
        var sfDate = fDate.getTime();
        var slDate = lDate.getTime();
        weekObjects[i].span.firstDate = sfDate;
        weekObjects[i].span.lastDate = slDate;
        
    }
    console.log("simplifyDates loppuu");
}

/*
 * 
 * @param {Date} firstDate
 * @param {Date} lastDate - optional parameter
 * @returns {LargeWeek}
 */
function createLargeWeek(firstDate, lastDate){
    var ld;
    if(typeof lastDate === 'undefined')
        ld = df.incrementDate(firstDate, 6);
    else
        ld = lastDate;
    return {span:{firstDate:firstDate.getTime(), lastDate:ld.getTime()}, note:""};
}

function dateToMs(date){
    return df.dateToMs(date);
}

function msToDate(ms){
    return df.msToDate(ms);
}

//////////////////////////
//SIIRRETTÄVÄ MUUALLE
/*
 * Check missing arguments -> cma.
 * If any of the elements of argsArrayLike is undefined, throws an error.
 */
function cma(argsArrayLike){
    var arrayOfArguments = Array.prototype.slice.call(argsArrayLike);
    var isUndefined = function(value){
        return (typeof value === 'undefined');
    };
    if(arrayOfArguments.some(isUndefined)){
        throw "Undefined arguments at " + console.trace();
    }
}

/*
 * Get type assertion expression.
 * Accepts any number of arguments.
 * Return value: false, if any of the parameters are undefined. Otherwise returns true.
 */
function gtae(objects){
    var isAnyUndefined = false;
    var isUndefined;
    //console.log("args length:" + arguments.length);
    for(var i = 0; i < arguments.length; i++){
        isUndefined = typeof arguments[i] === 'undefined';
        //console.log("type of nro " + i + ": " + typeof arguments[i]);
        //console.log("arguments[i]" + arguments[i]);
        //console.log("isUndefined: " + isUndefined);
        isAnyUndefined = isAnyUndefined || isUndefined;
        //console.log("isAnyUndefined: " + isAnyUndefined);
    }
    return !isAnyUndefined;
    //VANHA VERSIO:
    //return !(typeof obj === 'undefined');
}

function containsUnd(arr){
    return arr.some(e => typeof e === 'undefined');
}