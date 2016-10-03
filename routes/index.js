var express = require('express');
var router = express.Router();

//var weekData = require('life_data.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express'/*, weekData: weekData*/ });
});

/*function weekDataToJsVariable(weekData){
    return "var weekData" + weekData;
}*/

module.exports = router;


/*
 * 
 * var str = JSON.stringify(obj);
// >> "{"id":0,"folder":"Next","text":"Apple"}"

var obj = JSON.parse(str);
// >> Object({ id: 0, folder: "Next", text: "Apple" })
 */
