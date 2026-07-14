var getSocialsResponse = require("./options/socials.js");

var QR = {
  "menu": require("./options/menu.js"),
  "pricing": require("./options/pricing.js"),
  "colours": require("./options/colours.js"),
  "hours": require("./options/hours.js"),
  "turnaround": require("./options/turnaround.js"),
  "1": require("./options/pricing.js"),
  "2": require("./options/colours.js"),
  "3": require("./options/quote.js"),
  "4": require("./options/turnaround.js"),
  "5": require("./options/hours.js"),
  "7": require("./options/blasting.js"),
  "8": require("./options/terms.js"),
  "9": require("./options/gallery.js"),
  "10": getSocialsResponse,
  "11": require("./options/tech_support.js"),
  "12": require("./options/accounts.js"),
  "13": require("./options/tps.js")
};

function getSocialsResponse() {
  return QR["10"];
}

function getGalleryMenu(page) {
  var { getGalleryList } = require("./gallery.js");
  return getGalleryList(page);
}

function getColorResponse(index) {
  var { getColorByIndex } = require("./gallery.js");
  return getColorByIndex(index);
}

function buildMenu() {
  return QR;
}

module.exports = { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu, QR };
