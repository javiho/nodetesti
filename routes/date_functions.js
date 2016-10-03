"use strict";

//var dateFunctions = {
//    returnLol: function(s){return "lol " + s;},
//    t: t,
//    isAfterWeek: isAfterWeek,
//    msToDate: msToDate,
//    dateToMs: dateToMs,
//    getSpanLastDateMilliseconds: getSpanLastDateMilliseconds,
//    getMonday: getMonday,
//    isMonday: isMonday,
//    isNextWeekTooLate: isNextWeekTooLate,
//    incrementDate: incrementDate
//};

var t = "asdf";

/*
* Only considers days, not times. For instance, 01:00 in last day of the week is after the week.
* @param {Date} date
* @param {Date} weekStartDate
* @returns {boolean}
*/
var isAfterWeek = function(date, weekStartDate){
   var firstDay = weekStartDate;
   if(!isMonday(firstDay)){
       firstDay = getMonday(firstDay);
   }
   var lastDay = incrementDate(date, 6);
   return date.getTime() > lastDay.getTime();
};

var msToDate = function(ms){
    return new Date(ms);
};

var dateToMs = function(date){
    return date.getTime();
};

/*
* PALAUTTAAKO SEURAAVAN VIIKON ENSIMMÄISEN MILLISEKUNTIARVON? ONKO TÄMÄ OK?
* Return value: returns the milliseconds form of the last date of a week,
* where firstDate parameter is the first date of the week.
* Pre-condition: firstDate is a first date of a week
*/
var getSpanLastDateMilliseconds = function(firstDateMs, spanDays){
   var fd = new Date(firstDateMs);
   var daysToIncrement = spanDays - 1;
   var ld = incrementDate(fd, daysToIncrement);
   ld = ld.getTime();
   return ld;
};

/*
* Return value: the first Monday before the day after date parameter.
* ENTÄ JOS HALUTAAN, ETTÄ SUNNUNTAI ON ENSIMMÄINEN VIIKONPÄIVÄ?
*/
var getMonday = function(date){
   var mondayCandidate = new Date(date);
   while(true){
       if(isMonday(mondayCandidate)){
           return mondayCandidate;
       }
       mondayCandidate = incrementDate(mondayCandidate);
   }
};

var isMonday = function(date){
    return date.getDay() === 1;
};

var isNextWeekTooLate = function(currentDate, finalDate){
    var nextWeek = new Date(currentDate);
    nextWeek = incrementDate(nextWeek, 7);
    //console.log("nykyinen " + currentDate + ", seuraava " + nextWeek + ", liian myöhään: " + (nextWeek > finalDate));
    return nextWeek > finalDate;
};

/*
 * Increments date by days parameter. Returns new Date object.
 * Pre-condition: date parameter is a Date or milliseconds representing a Date.
 */
var incrementDate = function(date, days){
    if(typeof(days) === 'undefined'){
        days = 1;
    }
    var newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
};

module.exports = {
    isAfterWeek: isAfterWeek,
    msToDate: msToDate,
    dateToMs: dateToMs,
    getSpanLastDateMilliseconds: getSpanLastDateMilliseconds,
    getMonday: getMonday,
    isMonday: isMonday,
    isNextWeekTooLate: isNextWeekTooLate,
    incrementDate: incrementDate
};