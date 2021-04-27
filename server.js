'use strict';

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const pg = require('pg');



const server = express();
const PORT = process.env.PORT || 3030;
server.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({connectionString: process.env.DATABASE_URL, ssl:{ rejectUnauthorized:false} });
const superagent = require('superagent');




server.get('/location', locationHandelr);
server.get('/weather', weatherHandelr);
server.get('/parks', parkHandelr);
// server.get('/add', addLocationData);
server.get('/get', getLocationData);
server.get('*', errorHandelr);


// search_query VARCHAR(255),
//     formatted_query VARCHAR(255),
//     latitude VARCHAR(255),
//     longitude



function addLocationData(locationRes) {

  let search = locationRes.search_query;
  let formatted = locationRes.formatted_query;
  let lat = locationRes.latitude;
  let lon = locationRes.longitude;
  let SQL = 'INSERT INTO locationtable (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;';
  let safeValues = [search, formatted, lat, lon];
  client.query(SQL, safeValues);

}

function getLocationData(req, res) {
  let SQL = `SELECT * FROM locationtable;`;
  client.query(SQL)
    .then(result => {
      res.send(result.rows);

    })
    .catch(error => {
      res.send(error);

    });

}


function locationHandelr(req, res) {

  let cityName = req.query.city;

  let SQL = `SELECT * FROM locationtable WHERE search_query=$1;`;
  let safeValues = [cityName];
  client.query(SQL, safeValues)
    .then(data => {
      if (data.rows.length !== 0) {
        console.log(data.rows);

        res.send(data.rows[0]);

      } else {
        let key = process.env.LOCATION_KEY;
        let locURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

        superagent.get(locURL)
          .then(locdata => {
            let locationData = locdata.body;
            let locationRes = new Location(cityName, locationData);
            addLocationData(locationRes);
            res.send(locationRes);

          })
          .catch(error => {

            res.send(error);
          });

      }

    })
    .catch(error => {
      res.send(error);

    });

}

function weatherHandelr(req, res) {

  let cityName = req.query.search_query;
  let key = process.env.WEATHER_KEY;
  let weaURL = `http://api.weatherbit.io/v2.0/forecast/daily?key=${key}&city=${cityName}&days=5`;

  superagent.get(weaURL)
    .then(weadata => {
      let weatherData = weadata.body.data;

      let allweatherdata = weatherData.map((item) => {

        return new Weather(item);

      });

      res.send(allweatherdata);
    })
    .catch(error => {

      res.send(error);
    });

}

function parkHandelr(req, res) {

  let cityName = req.query.search_query;
  let key = process.env.PARK_KEY;
  let parkURL = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${key}`;


  superagent.get(parkURL)
    .then(paData => {

      let parkData = paData.body.data;


      let parkInfo = parkData.map((item) => {

        return new Park(item);

      });

      res.send(parkInfo);

    })
    .catch(error => {

      res.send(error);
    });


}

function errorHandelr(req, res) {
  let errObj = {
    status: 500,
    resText: 'Sorry, something went wrong'
  };
  res.status(404).send(errObj);

}


function convertDate(d) {
  let date = new Date(d);
  date = date.toDateString();
  return date;
}

function Weather(locData) {
  this.forecast = locData.weather.description;
  this.time = convertDate(locData.datetime);

}

function Location(cityName, locData) {

  this.search_query = cityName;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;

}


function Park(cityName) {
  this.name = cityName.fullName;
  this.address = `${cityName.addresses[0].line1}, ${cityName.addresses[0].city}, ${cityName.addresses[0].stateCode} ${cityName.addresses[0].postalCode}`;
  this.fee = '0.00';
  this.description = cityName.description;
  this.url = cityName.url;

}

client.connect()
  .then(() => {

    server.listen(PORT, () => {
      console.log(`my port is ${PORT}`);

    });

  });

