const express = require('express');
const connectDB = require('./db');

const app = express();
const port = 5000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

// Connect to MongoDB and retrieve data
connectDB()
  .then(({ data, CatData }) => {
    global.foodData = data;
    global.foodCategory = CatData;

    // Start the server only after connecting to MongoDB and retrieving data
    app.listen(port, () => {
      console.log(`Example app listening on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', require('./Routes/Auth'));
