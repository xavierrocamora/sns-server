require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const mongoose = require('mongoose');

const connUri = process.env.MONGO_CONN_URL;
const environment = process.env.NODE_ENV;
const stage = require('./config')[environment];

const app = express();
const router = express.Router();

if (environment !== 'production'){
    app.use(logger('dev'));
}

// Connect to Mongo
mongoose.connect(connUri, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Add routes
const routes = require('./routes/index.js');
app.use('/api/v1', routes(router));


app.listen(`${stage.port}`, () => {
    console.log(`Server now listening at localhost:${stage.port}`);
});