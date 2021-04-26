'use strict';

const express = require('express');
require('dotenv').config();
const cors =require('cors');



const server = express();
const PORT = process.env.PORT || 3030;
server.use(cors());
const superagent = require('superagent');

server.use(express.static('./public'));



server.get('/location',locationHandelr);
server.get('/weather',weatherHandelr);
server.get('/parks',parkHandelr);
server.get('*',errorHandelr);



function locationHandelr(req,res){

  let cityName = req.query.city;
  let key = process.env.LOCATION_KEY;
  let locURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  superagent.get(locURL)
    .then(locdata=>{
      let locationData =locdata.body;
      let locationRes = new Location(cityName,locationData);
      res.send(locationRes);


    })
    .catch(error=>{

      res.send(error);
    });

}

function weatherHandelr(req,res){

  let cityName=req.query.search_query;
  let key = process.env.WEATHER_KEY;
  let weaURL = `http://api.weatherbit.io/v2.0/forecast/daily?key=${key}&city=${cityName}&days=5`;

  superagent.get(weaURL)
    .then(weadata=>{
      let weatherData = weadata.body.data;

      let allweatherdata = weatherData.map((item)=>{

        return new Weather(item);

      });

      res.send(allweatherdata);
    });

}

function parkHandelr(req,res){

  let cityName=req.query.search_query;
  let key = process.env.PARK_KEY;
  let parkURL = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${key}`;


  superagent.get(parkURL)
    .then(paData=>{

      let parkData=paData.body.data;


      let parkInfo = parkData.map((item)=>{

        return new Park(item);

      });


      res.send(parkInfo);



    });


}

function errorHandelr(req,res){
  let errObj = {
    status:500,
    resText:'Sorry, something went wrong'
  };
  res.status(404).send(errObj);

}


function convertDate(d){
  let date = new Date (d);
  date = date.toDateString();
  return date;
}

function Weather(locData){
  this.forecast=locData.weather.description;
  this.time=convertDate(locData.datetime);

}

function Location(cityName,locData){

  this.search_query = cityName;
  this.formatted_query=locData[0].display_name;
  this.latitude=locData[0].lat;
  this.longitude= locData[0].lon;

}


function Park(cityName){
  this.name=cityName.fullName;
  this.address=`${cityName.addresses[0].line1}, ${cityName.addresses[0].city}, ${cityName.addresses[0].stateCode} ${cityName.addresses[0].postalCode}`;
  this.fee='0.00';
  this.description=cityName.description;
  this.url=cityName.url;

}



server.listen(PORT,()=>{
  console.log(`my port is ${PORT}`);

});
