"use strict";

//TÄSSÄ OLETETAAN, ETTÄ AIKAVÄLIT OVAT VIIKKOJA, MUTTA ON TARKOITUS MAHDOLLISTAA MYÖS MUITÄ AJAN YKSIKKÖJÄ
window.onload = function(){
    console.log("calendar_view_main alkaa");
    //var testDate = new Date(1234567890000);
    //console.log("testDate: " + testDate);
    //console.log();
    updateCalendar();
    var saveButton = document.getElementById("save-button");
    saveButton.addEventListener("click", function(){
        var calendarData = createCalendarDataObject();
        sendCalendarData(calendarData);
    });
};

/*
 * Removes the possible existing calendar table and creates a new one.
 * Updates also date pickers.
 * @returns {undefined}
 */
function updateCalendar(){
    console.log("updateTable kutsuttu");
    $.ajax({
        url:'life_data/', type: 'GET', dataType: 'json',
        success: function(responseJson){
            console.log("get was successful!");
            //createTable(responseJson);
            var calendarData = parseServerData(responseJson);
            var weeks = calendarData.weeks;
            createWeekCalendarDiv(weeks);
            updateDateInputValues(calendarData.bd, calendarData.dd);
        }
    });
}

function sendCalendarData(calendarData){
    //var calendarData = {attr1:"lol", attr2:"lel"};
    calendarData = JSON.stringify(calendarData);
    console.log("calendarData:");
    console.log(calendarData);
    $.ajax({
        url:'life_data/', type: 'POST', dataType: 'text',
        contentType:'application/json; charset=utf-8',
        data:calendarData,
        success: function(dataFromServer){
            console.log("post data from server: " + dataFromServer);
            updateCalendar();
        }
    });
}

/*
 * Creates an object based on the input elements' attributes.
 * Return value: the following kind of object:
 * {
 * weeks:[{firstDate:(milliseconds), note:(text)},
 * ...
 * ]
 * }
 */
function createCalendarDataObject(){
    var inputElements = $('[data-is-week-input]');
    var weeks = [];
    //console.log("inputElements.length: " + inputElements.length);
    for(var i = 0; i < inputElements.length; i++){
        var ie = inputElements[i];
        var fdMilliseconds = ie.getAttribute('data-milliseconds');
        fdMilliseconds = parseInt(fdMilliseconds);
        var wo = {firstDate:fdMilliseconds, note:ie.value};
        weeks.push(wo);
    }
    //console.log("createCalendarDataObject: weeks:");
    //console.log(weeks);
    
    //create data about the possibly changed bidthday and death day
    var bdayString = document.getElementById("birthday-picker").value;
    var dDayString = document.getElementById("death-day-picker").value;
    var bdayDate = new Date(bdayString);
    var dDayDate = new Date(dDayString);
    
    //console.log("bdayDate: " + bdayDate);
    //console.log("dDayDate: " + dDayDate);
    return {weeks:weeks, newBd:bdayDate.getTime(), newDd:dDayDate.getTime()};
}

//huom. tuleeko ongelmia siitä, että käytetään tietokoneen paikallista aikaa?

function parseServerData(weeksJSONString){
    var weeksJSON = JSON.parse(weeksJSONString);
    var weeks = weeksJSON.weeks;//weeksJSON.weeks;
    weeks = woMillisecondsToDates(weeks);
    var bdMs = weeksJSON.bd;
    var ddMs = weeksJSON.dd;
    var bd = new Date(bdMs);
    var dd = new Date(ddMs);
    return {weeks:weeks, bd:bd, dd:dd};
}

/*
 * Alters an element which displays the life data.
 */
function createWeekCalendarDiv(weeks){
    var calendarDiv = document.getElementById("calendar");
    murderChildren(calendarDiv);
    for(var i = 0; i < weeks.length; i++){
        var week = weeks[i];
        var weekDiv = document.createElement("div");
        //var weekTextNode = document.createTextNode("" + spanToString(week.span) + " | " + week.note);
        var spanTextNode = document.createTextNode("" + spanToString(week.span));
        var weekNoteInput = createWeekTextBox(week.note, i, week.span.firstDate.getTime()); // INPUT ONKIN TEXTAREA-ELEMENTTI
        //weekDiv.appendChild(weekTextNode);
        weekDiv.appendChild(spanTextNode);
        weekDiv.appendChild(weekNoteInput);
        calendarDiv.appendChild(weekDiv);
    }
}

/*
 * HUOM! dataset-attribuutin tilalla voisi käyttää getAttribute- ja setAttribute-funktioita,
 * koska datasettiä ei tueta monissa selaimissa (?)
 * Pre-condition: there isn't an HTML element with the id "ie(ordinalNumber)"
 */
function createWeekTextBox(initialText, ordinalNumber, firstDateMs){
    var inputElement = document.createElement("textarea");
    //inputElement.type = "text";
    inputElement.value = initialText;
    inputElement.class = "note-input";
    inputElement.id = "ie" + ordinalNumber;
    //inputElement.setAttribute('data-milliseconds', firstDateMs);
    inputElement.dataset.milliseconds = firstDateMs;
    inputElement.dataset.isWeekInput = true;
    //console.log("isWeekInput: " + inputElement.dataset.isWeekInput);
    //console.log("data-lol: " + $('[data-lol]')[0].dataset.lol);
    //console.log("input element data-milliseocnds: " + inputElement.dataset.milliseconds);
    return inputElement;
}

/*
 * span is a {firstDate:(date), lastDate:(date)} object
 */
function spanToString(span){
    var weekString = "";
    weekString += "" + span.firstDate.toDateString() + " - " + span.lastDate.toDateString();
    return weekString;
}

/*
 * @param {type????} weekObjects
 * @returns {unresolved} - weekObjects in which milliseconds are changed to dates.
 */
function woMillisecondsToDates(weekObjects){
    //console.log(weekObjects);
    for(var i = 0; i < weekObjects.length; i++){
        var fMilliseconds = weekObjects[i].span.firstDate;
        var fDate = new Date(fMilliseconds);
        var lMilliseconds = weekObjects[i].span.lastDate;
        var lDate = new Date(lMilliseconds);
        //console.log("milliseconds: " + milliseconds + " and their type: " + (typeof milliseconds));
        //console.log("the date: " + date);
        weekObjects[i].span.firstDate = fDate;
        weekObjects[i].span.lastDate = lDate;
    }
    return weekObjects;
}

/*
 * Determines and sets new values for date inputs (birthday and death-day elements)
 */
function updateDateInputValues(bd, dd){
    //console.log("updateDateInputValues alkaa");
    //console.log("calendarData paramteri:");
    //console.log(calendarData);
    
    //NÄIN TEHDÄÄN, JOS PÄÄTELLÄÄN SYNTYMÄ- JA KUOLINPÄIVÄT EIKÄ LUOTETA PALVELIMEN ANTAMIIN TIETOIHIN
//    var minAndMaxWeek = getMinAndMaxWeek(calendarData);
//    var min = minAndMaxWeek.min;
//    var max = minAndMaxWeek.max;
//    var bdInput = document.getElementById("birthday-picker");
//    var ddInput = document.getElementById("death-day-picker");
//    setDateInputValue(bdInput, min);
//    setDateInputValue(ddInput, max);
    var bdInput = document.getElementById("birthday-picker");
    var ddInput = document.getElementById("death-day-picker");
    setDateInputValue(bdInput, bd);
    setDateInputValue(ddInput, dd);
}

/*
 * Pre-condition: calendarData.weeks array is ordered from the first week to the last,
 * and calendarData is a following kind of object: {weeks:[{span:{firstDate:(Date), lastDate(Date)},
 * note:(string)},...]}
 * KORJAUS: calendarData is an array of week objects
 * Return value: firstDate attribute of the first week, and lastDate of the last week (Date objects)
 */
function getMinAndMaxWeek(calendarData){
    var cd = calendarData;
    var lastIndex = cd.length - 1;
    return {min:cd[0].span.firstDate, max:cd[lastIndex].span.lastDate};
}

/*
 * dateInput is an element and value is a Date.
 * TOIMIIKO TÄMÄ VARMASTI AINA OIKEIN?? ESIM LÄHELLÄ VUOROKAUDEN VAIHTUMISTA EI-UTC-AJASSA?
 */
function setDateInputValue(dateInput, value){
    //12 LOPUSSA ON VÄLTTÄMÄTON, MUTTA MITÄ SE TEKEE?
    dateInput.valueAsDate = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
}

/*
 * Removes child nodes of el.
 */
function murderChildren(el){
    while(el.hasChildNodes()){
        el.removeChild(el.lastChild);
    }
}