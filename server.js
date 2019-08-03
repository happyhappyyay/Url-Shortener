'use strict';
var bodyParser = require ('body-parser');
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
Promise = require('bluebird');
mongoose.Promise = Promise;

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});

var Url = mongoose.model("Url", new mongoose.Schema(
  { url:String,
  shortNum:Number,
}));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({extended: false}));
app.post("/api/shorturl/new",(req, res)=>{
  const DBL_SLASH = "//";
  const SLASH = "/";
  let url = req.body.url;
  if(validateUrl(url)){
      let host;
      let removedHttp = url.substring(url.indexOf(DBL_SLASH)+DBL_SLASH.length);
      console.log(removedHttp);
      if(removedHttp.includes(SLASH)){
              host = removedHttp.substring(0, removedHttp.indexOf(SLASH));
      }
      else {
        host = removedHttp;
      }
      dns.lookup(host,(err)=>{
        if(err){
              res.json({"error":"invalid URL"});
        }
        else {
          let shortened = Math.floor(Math.random() * 10000);

          findUrlByName(url, (err,data)=>{
            if(data){
            console.log(data.url,data.shortNum);
              if(data.url == url){
                res.json({"original_url":removedHttp, "short_url":data.shortNum});
              }
              else if (data.shortNum == shortened){
                shortened = Math.floor(Math.random()*10000)
              }
            }
            else{
                 let newUrl = new Url({url:url, shortNum: shortened});  
                createAndSaveUrl(newUrl, (err,data)=>{
                    res.json({"original_url":removedHttp, "short_url":shortened});
                         });
                }
            });
        }
      })
  }
  else {
    res.json({"error":"invalid URL"});
  }
});

app.get("/:urlNum",(req,res)=>{
  findUrlByNum(req.params.urlNum, (err,data)=>{
    console.log(req.params.urlNum);
    if(!data){
      res.json({error:"no associated url"});
    }
    else {
     res.redirect(data.url);
    }
               });
})

var createAndSaveUrl = (url, done)=> {
  url.save((err,data)=>{err?done(err):done(null,data)})
   };

var findUrlByName = (url, done)=> {
  Url.findOne({url:url}, (err, data)=>
    err?done(null):done(null, data));
};

var findUrlByNum = (num, done)=> {
  Url.findOne({shortNum:num}, (err, data)=>
    err?done(null):done(null, data));
};

var validateUrl = (url)=>{
//   regex from https://www.regextester.com/93652
  let reg = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g;
  return url.match(reg);
}

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});