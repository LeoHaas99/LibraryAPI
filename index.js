const express = require("express");
const app = express();
const port = 5000;
const libraryRouter = require("./routes/library");
const authorsRouter = require("./routes/authors");
const statisticsRouter = require("./routes/statistics");
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
app.use(express.static('public')); //to access the files in public folder
app.use(cors());
app.use(fileUpload());
app.use(express.json());
const db = require('./services/db');
const helper = require('./helper');
const config = require('./config');
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});
app.use("/library", libraryRouter);
app.use("/authors", authorsRouter);
app.use("/statistics", statisticsRouter);
/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

// file upload api
app.post('/upload', (req, res) => {

  if (!req.files) {
    return res.status(500).send({ msg: "file is not found" })
  }
  //allowed file types
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  // accessing the file
  let myFile = req.files.image;
  if (!allowedTypes.includes(myFile.mimetype)) {
    return res.status(500).send({ msg: "Wrong file type, images of type jpeg, jpg, png and webp are allowed" });
  }
  const name = path.parse(myFile.name).name;
  const ext = path.parse(myFile.name).ext;
  myFile.name = name + "_" + Date.now() + ext;

  //  mv() method places the file inside public directory
  myFile.mv(`${__dirname}/public/${myFile.name}`, function (err) {
    if (err) {
      console.log(err)
      return res.status(500).send({ msg: "Error occured" });
    }
    // returing the response with file path and name
    return res.send({ name: myFile.name, path: `http://localhost:5000/${myFile.name}` });
  });
})

// file remove api
app.delete('/remove/:fileUrl', (req, res) => {
  console.log(`${__dirname}/public/${req.params.fileUrl}`)
  fs.unlink(`${__dirname}/public/${req.params.fileUrl}`, function (err) {
    if (err) {
      console.log(err)
      return res.status(500).send({ msg: "Error occured" });
    }
    return res.send({ msg: "File deleted succesfully" });
  });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
