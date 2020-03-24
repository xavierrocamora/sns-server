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
mongoose.connect(connUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Bodyparser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Add routes
const routes = require('./routes/index.js');
app.use('/api/v1', routes(router));

// Error handling
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });
  
  app.use((err, req, res, next) => {
    if (environment !== 'production') {
      console.log(err.stack);
    }
  
    res.status(err.status || 500);
    res.json({ message: err.message });
  });

app.listen(`${stage.port}`, () => {
    console.log(`Server now listening at localhost:${stage.port}`);
});