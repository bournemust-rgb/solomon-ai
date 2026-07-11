require("dotenv").config();
var express = require("express");
var axios = require("axios");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var delivery = require("./delivery");
var tcdb = require("./tcdb");
var { randomFallback, randomAffirmation, randomTPS } = require('./quotes');
var { getSocialsResponse, FACEBOOK, TIKTOK, WEBSITE } = require('./socials');
var { getGalleryList, getColorByIndex, searchGallery } = require('./gallery');
var { randomGreeting } = require('./greetings');
var { getOrderRef, estimatePrice } = require("./calculator");
var { buildMenu } = require("./menu");
var { smartMatch } = require("./smartmatch");
var { handleMessage } = require("./flows");
var { isAfterHours } = require("./utils");

var app = express();
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

var VT = process.env.WHATSAPP_VERIFY_TOKEN || "solomon_coatings_1988";
var PORT = process.env.PORT || 3000;
var PERSONAL_NUMBER = "27767604350";
var OFFICE_NUMBER = "0219052912";
var OFFICE_EMAIL = "populier@mweb.co.za";
var QUOTE_EMAIL = "infosc@mweb.co.za";


var GOOGLE_REVIEW = "https://g.page/r/your-review-link";
var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

var QR = buildMenu(OFFICE_NUMBER, OFFICE_EMAIL, QUOTE_EMAIL, FACEBOOK, TIKTOK, GOOGLE_REVIEW);

var smartMatchFn = function(text) {
  var t = text.toLowerCase().trim();
  if (t === 'socials' || t === '10') return getSocialsResponse();
  if (t === 'gallery' || t === '9') return getGalleryList(1);
  if (/^gallery \d+$/.test(t)) { var pg = parseInt(t.split(' ')[1]); return getGalleryList(pg); }
  if (/^\d+$/.test(t) && parseInt(t) >= 1 && parseInt(t) <= 30) { var ci = getColorByIndex(parseInt(t)); if (ci) return ci; }
  var galSearch = searchGallery(text);
  if (galSearch) return galSearch;
  return smartMatch(text, QR, estimatePrice, randomAffirmation, randomTPS, randomFallback, randomGreeting, getOrderRef, GOOGLE_REVIEW, FACEBOOK, TIKTOK, OFFICE_EMAIL, OFFICE_NUMBER, QUOTE_EMAIL, tcdb);
};

async function forwardImageToOwner(imageId){
  try{
    if(!WA_TOKEN||!PHONE_ID) return false;
    await axios.post("https://graph.facebook.com/v21.0/"+PHONE_ID+"/messages",
      { messaging_product:"whatsapp", recipient_type:"individual", to:PERSONAL_NUMBER, type:"image", image:{id:imageId} },
      { headers:{ Authorization:"Bearer "+WA_TOKEN } });
    return true;
  }catch(e){ console.error("forwardImage error:", e.response?.data||e.message); return false; }
}

app.get("/health",function(req,res){res.json({status:"healthy",version:"13.0",modules:9});});
app.get("/",function(req,res){res.json({service:"Solomon Coatings",version:"13.0 Modular"});});
app.get("/webhook",function(req,res){ if(req.query["hub.mode"]==="subscribe"&&req.query["hub.verify_token"]===VT) return res.status(200).send(req.query["hub.challenge"]); res.sendStatus(403); });

app.post("/webhook",validateWhatsAppSignature,async function(req,res){
  res.sendStatus(200);
  try{
    var entries=req.body?.entry||[];
    for(var i=0;i<entries.length;i++){
      var changes=entries[i].changes||[];
      for(var j=0;j<changes.length;j++){
        var msgs=changes[j].value?.messages||[];
        for(var k=0;k<msgs.length;k++){
          var from=msgs[k].from, type=msgs[k].type;
          var text=msgs[k].text?.body?.trim()||null;
          var imageId=msgs[k].image?.id||null;
          var afterHours=isAfterHours();
          if(type==="image"&&imageId){
            await forwardImageToOwner(imageId);
            try{await sendMessage(PERSONAL_NUMBER,"Image from "+from);}catch(e){}
            await sendMessage(from,"Thanks! Forwarded to Ridhor 076 760 4350."); continue;
          }
          if(!text) continue;
          var session=await getSession(from);
          var match=await handleMessage(text, from, session, smartMatchFn, QR, delivery, getOrderRef, saveSession, randomGreeting, tcdb);
          if(afterHours){
            var showClosed = Math.floor(Math.random() * 4) === 0;
            if(showClosed) match="Our workshop is closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n"+match;
            try{await sendMessage(PERSONAL_NUMBER,"After-hours from "+from+": "+text);}catch(e){}
          }
          await sendMessage(from,match);
          session.history=session.history||[]; session.history.push({role:"user",content:text},{role:"model",content:match});
          if(session.history.length>40) session.history=session.history.slice(-20);
          await saveSession(from,session);
        }
      }
    }
  }catch(e){console.error("WEBHOOK ERROR:",e.message);}
});

app.listen(PORT,function(){console.log("\nSOLOMON v13.0 MODULAR - 9 modules. index.js is ~100 lines.\n");});






