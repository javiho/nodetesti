"use strict";
/*
 * This is meant to be used by life_data.js file
 */
//TARVITAANKO NÄITÄ KAHTA?
//var express = require('express');
//var router = express.Router();

//-selaimen lähetettävä json
//-kirjoitettava json tiedostoon
//-luettava json tiedostosta
//-lähetettävä json selaimelle

var fs = require("fs");

var ldFileIo = {

    //MIKÄ ON receiveFileContent??
    readLifeFile: function(receiveFileContent){
        fs.readFile('data_files/life_data.json', function(err, data){
            if (err) {
                return console.error(err);
            }
            receiveFileContent(data.toString());
        });
    },

    writeLifeFile: function(newContent){
        fs.writeFile('data_files/life_data.json', newContent,  function(err) {
            if (err) {
                return console.error(err);
            }
            //console.log("Data written successfully!");
            console.log("Data written successfully!");
            fs.readFile('data_files/life_data.json', function (err, data) {
                if (err) {
                    return console.error(err);
                }
                //console.log("Asynchronous read: " + data.toString());
            });
        });
    }
};

module.exports = ldFileIo;