require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

// Swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

//Connect DB
const connectDB = require("./db/connect");

// Middleware auth
const authenticateUser =require("./middleware/authentication");

// routes
const jobsRouter = require("./routes/jobs");
const authRouter = require("./routes/auth"); 

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');


app.set('trust proxy', 1);
app.use(rateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
	  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	  // store: ... , // Redis, Memcached, etc. See below.
  }
));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.get('/', (req, res)=>{
  res.send('<h1>Jobs API</h1><a href="/api-docs">Documentation</a>');
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// routes
app.use('/api/v1/jobs', authenticateUser, jobsRouter);
app.use('/api/v1/auth', authRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
