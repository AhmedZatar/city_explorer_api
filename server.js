'use strict';

const express = require('express');

require('dotenv').config();

const cors =require('cors');

const server = express();

server.use(express.static('./public'));

const PORT = process.env.PORT || 3030;

server.use(cors());



server.get('/data',(req,res)=>{
  res.send('you are in the data page');
});

server.get('/test',(req,res)=>{
  res.send('you are in the test page !');
});

server.get('/location',(req,res)=>{
  let locationData = require('./data/location.json');
  let locationRes = new Location(locationData);
  console.log(locationRes);

  res.send(locationRes);




});

function Location(locData){

  this.search_query = 'Lynnwood';
  this.formatted_query=locData[0].display_name;
  this.latitude=locData[0].lat;
  this.longitude= locData[0].lon;

}


server.get('/weather',(req,res)=>{
  let weatherData = require('./data/weather.json').data;
  let allweatherdata=[];
  weatherData.forEach((item)=>{

    let weatherRes = new Weather(item);

    allweatherdata.push(weatherRes);

  });


  console.log(allweatherdata);
  res.send(allweatherdata);
});


function Weather(locData){
  this.forecast=locData.weather.description;
  this.time=convertDate(locData.datetime);

}

function convertDate(d){
  let date = new Date (d);

  date = date.toDateString();


  return date;

}



server.get('*',(req,res)=>{
  let errObj = {
    status:500,
    resText:'Sorry, something went wrong'
  };
  res.status(404).send(errObj);
});


server.listen(PORT,()=>{
  console.log(`my port is ${PORT}`);

});
