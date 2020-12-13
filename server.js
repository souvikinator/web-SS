const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const md5 = require("md5");
const fs = require("fs");
const path=require('path');
const zipper = require('zip-local');


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("index", { err_msg: null, progress_status: null, link: null });
});

app.get("/stage", (req, res) => {
  res.render("index", {
    err_msg: null,
    link: "www.xyz.com",
    progress_status: "done",
  });
  res.end();
});

app.post("/process", (req, res) => {
  let form_data = req.body;
  var res_msg = { err_msg: null, progress_status: null, link: null };

  if (form_data.file_input.length > 0) {
    var urls = form_data.file_input_data.split(",");
  } else {
    var urls = form_data.urls_input.split("\r\n");
  }

  let ssType = form_data.ss_type;
  let vpWidth = form_data.view_width > 50 ? parseInt(form_data.view_width) : 0;
  let vpHeight = form_data.view_height > 50 ? parseInt(form_data.view_height) : 0;

  if (urls.length == 0) {
    res_msg.err_msg = `No URL provided`;
    res.render("index", res_msg);
    return;
  }

  for (url of urls) {
    if (!validateURL(url)) {
      res_msg.err_msg = `${url} is invalid`;
      res.render("index", res_msg);
      return;
    }
  }

  if (res_msg.err_msg !== null) {
    return;
  }

  //firgure out a way not to execute res.render multiple times
  //res.render("index",{err_msg:null,link:null,progress_status:"starting"});

  //screenshot
  var saved_img_list = webSnap(urls, vpWidth, vpHeight, ssType);
  saved_img_list.then(function (result) {
    console.log("saved image list=>\n", result);
    //compression
    zipper.sync.zip("./downloads").compress().save(`./downloads/${result[0].split(".jpg")[0]}.zip`);
    //delete images files
    rmImg("./downloads", result);

    res.render("index", {
      err_msg: null,
      link: `/${result[0].split(".jpg")[0]}`,
      progress_status: "done",
    });
    return res.end();
  });
});

//request for file download
app.get("/:id", function (req, res) {
  if (req.params["id"].length > 0) {
    const file = `${__dirname}/downloads/${req.params["id"]}.zip`;
    //a check if file is there or not
    var stats = fs.statSync(file);
    if (stats.isFile()) {
      res.download(file); // Set disposition and send it.
      console.log("file sent!!");
    } else {
      console.log(`${file} [DOES NOT EXISTS]`);
    }
  }
});


//handling 404 and stuff
app.use((req, res) => {
  res.render("index", { err_msg: null, progress_status: null, link: null });
});

app.listen(5000, () => {
  console.log("listening...\n>::5000::<");
});

//Utility function

//url validation
function validateURL(url) {
  var expression = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var regex = new RegExp(expression);

  if (url.match(regex)) {
    return true;
  } else {
    return false;
  }
}

//screenshot
async function webSnap(urls, width, height, type) {
  var downloaded_files = new Array();
  var isFullScr = false;
  let browser = await puppeteer.launch({ headless: true });
  let page = await browser.newPage();
  console.log("starting...");
  for (url of urls) {
    if (width > 50 || height > 50) {
      await page.setViewport({ width: width, height: height });
    }
    if (type == "Full") isFullScr = true;
    //converting url to base64 for unique file name
    let snap_name = md5(url);
    await page.goto(url);
    await page.screenshot({
      path: `./downloads/${snap_name}.jpg`,
      type: "jpeg",
      fullPage: isFullScr,
    });
    downloaded_files.push(`${snap_name}.jpg`);
    console.log(`${snap_name}.jpg [saved]`);
  }
  await page.close();
  await browser.close();
  console.log("exiting...");

  //returning list of downloaded images
  return downloaded_files;
}

//delete files
function rmImg(cdir, img_list) {
  for (const img of img_list) {
    fs.unlink(path.join(cdir, img), (err) => {
      if (err) return false;
      console.log("file deleted successfully");
    });
  }
}
