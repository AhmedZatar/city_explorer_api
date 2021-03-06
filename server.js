'use strict';

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const pg = require('pg');



const server = express();
const PORT = process.env.PORT || 3030;
server.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
const superagent = require('superagent');




server.get('/location', locationHandelr);
server.get('/weather', weatherHandelr);
server.get('/parks', parkHandelr);
server.get('/movies', moviesHandelr);
server.get('/yelp', yelpHandelr);
server.get('/get', getLocationData);
server.get('*', errorHandelr);




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


function moviesHandelr(req, res) {

  let countryReq = req.query.formatted_query.split(' ');
  let country = countryReq[countryReq.length - 1];

  if (country === 'USA') {
    country = 'United States of America';
  }


  let key = process.env.MOVIE_API_KEY;
  let regionURL = `https://api.themoviedb.org/3/configuration/countries?api_key=${key}`;
  let region;


  superagent.get(regionURL)
    .then(data => {
      let regionData = data.body;
      regionData.forEach((item) => {
        if (item.english_name === country) {
          region = item.iso_3166_1;
          console.log(region);
        }

      });
      let movieURL = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&region=${region}&sort_by=popularity.desc`;
      superagent.get(movieURL)
        .then(data => {
          let moviesData = data.body.results;
          let moviesInfo = moviesData.map((item) => {

            return new Movies(item);
          });

          res.send(moviesInfo);
        });


    })
    .catch(error => {
      res.send(error);
    });

}


function yelpHandelr(req, res) {
  let cityName = req.query.search_query;
  let page = req.query.page;
  let key = process.env.YELP_API_KEY;
  const resultPerPAge = 5;
  const start = ((page - 1) * resultPerPAge + 1);
  let yelpURL = `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${resultPerPAge}&offset=${start}`;
  superagent.get(yelpURL)
    .set('Authorization', `Bearer ${key}`)
    .then(data => {

      let yelpData = data.body.businesses;

      let yelpInfo = yelpData.map((item) => {

        return new Yelp(item);
      });

      res.send(yelpInfo);

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

function Movies(moviesData) {

  this.title = moviesData.title;
  this.overview = moviesData.overview;
  this.average_votes = moviesData.vote_average;
  this.total_votes = moviesData.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${moviesData.poster_path}`;
  this.popularity = moviesData.popularity;
  this.released_on = moviesData.release_date;

}

function Yelp(yelpData){
  this.name=yelpData.name;
  this.image_url=yelpData.image_url;
  this.price=yelpData.price;
  this.rating=yelpData.rating;
  this.url=yelpData.url;
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

