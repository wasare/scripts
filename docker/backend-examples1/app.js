var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const dotenv = require('dotenv');
dotenv.config({ path: './.env'});
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');
var ordersRouter = require('./routes/orders');
var assetsRouter = require('./routes/assets');

var app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN_URL }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/assets', assetsRouter);

module.exports = app;
