var GALLERY = {
  red: { name: "Red", description: "Bright, bold red powder coat", images: ["https://solomon-ai-izyb.onrender.com/photos/red-gloss-001.jpg","https://solomon-ai-izyb.onrender.com/photos/red-gloss-002.jpg"] },
  bright_red: { name: "Bright Red", description: "Vivid, vibrant red finish", images: ["https://solomon-ai-izyb.onrender.com/photos/red-bright-001.jpg"] },
  dark_red: { name: "Dark Red (Burgundy)", description: "Deep, rich burgundy tone", images: ["https://solomon-ai-izyb.onrender.com/photos/red-dark-001.jpg"] },
  yellow: { name: "Yellow", description: "Bright yellow powder coat", images: ["https://solomon-ai-izyb.onrender.com/photos/yellow-001.jpg"] },
  gold: { name: "Gold", description: "Metallic gold finish", images: ["https://solomon-ai-izyb.onrender.com/photos/gold-001.jpg"] },
  green: { name: "Green", description: "Standard green powder coat", images: ["https://solomon-ai-izyb.onrender.com/photos/green-001.jpg"] },
  dark_green: { name: "Dark Green", description: "Forest green, classic look", images: ["https://solomon-ai-izyb.onrender.com/photos/green-dark-001.jpg"] },
  light_green: { name: "Light Green", description: "Pale, soft green finish", images: ["https://solomon-ai-izyb.onrender.com/photos/green-light-001.jpg"] },
  black: { name: "Black (Gloss)", description: "Classic glossy black", images: ["https://solomon-ai-izyb.onrender.com/photos/black-gloss-001.jpg","https://solomon-ai-izyb.onrender.com/photos/black-gloss-002.jpg"] },
  matte_black: { name: "Matte Black", description: "Modern matte black finish", images: ["https://solomon-ai-izyb.onrender.com/photos/black-matte-001.jpg"] },
  charcoal: { name: "Charcoal", description: "Dark grey-black charcoal", images: ["https://solomon-ai-izyb.onrender.com/photos/charcoal-001.jpg","https://solomon-ai-izyb.onrender.com/photos/charcoal-002.jpg"] },
  white: { name: "White", description: "Clean, bright white", images: ["https://solomon-ai-izyb.onrender.com/photos/white-001.jpg"] },
  cream: { name: "Cream", description: "Warm cream/ivory tone", images: ["https://solomon-ai-izyb.onrender.com/photos/cream-001.jpg"] },
  blue: { name: "Blue", description: "Standard bright blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-001.jpg"] },
  dark_blue: { name: "Dark Blue (Navy)", description: "Deep navy blue finish", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-dark-001.jpg"] },
  light_blue: { name: "Light Blue (Sky)", description: "Soft sky blue tone", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-light-001.jpg"] },
  grey: { name: "Grey", description: "Medium neutral grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-001.jpg"] },
  dark_grey: { name: "Dark Grey", description: "Charcoal-like dark grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-dark-001.jpg"] },
  light_grey: { name: "Light Grey (Silver)", description: "Pale silvery grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-light-001.jpg"] },
  bronze: { name: "Bronze", description: "Rich bronze metallic", images: ["https://solomon-ai-izyb.onrender.com/photos/bronze-001.jpg"] },
  copper: { name: "Copper", description: "Warm copper metallic", images: ["https://solomon-ai-izyb.onrender.com/photos/copper-001.jpg"] },
  silver: { name: "Silver (Metallic)", description: "Bright metallic silver", images: ["https://solomon-ai-izyb.onrender.com/photos/silver-001.jpg"] },
  hammered_black: { name: "Hammered Black", description: "Textured hammered black", images: ["https://solomon-ai-izyb.onrender.com/photos/hammered-black-001.jpg"] },
  hammered_silver: { name: "Hammered Silver", description: "Textured hammered silver", images: ["https://solomon-ai-izyb.onrender.com/photos/hammered-silver-001.jpg"] },
  wrinkle_black: { name: "Wrinkle Black", description: "Wrinkle texture black", images: ["https://solomon-ai-izyb.onrender.com/photos/wrinkle-black-001.jpg"] },
  satin_black: { name: "Satin Black", description: "Satin finish black (hides fingerprints)", images: ["https://solomon-ai-izyb.onrender.com/photos/satin-black-001.jpg"] },
  satin_white: { name: "Satin White", description: "Satin finish white", images: ["https://solomon-ai-izyb.onrender.com/photos/satin-white-001.jpg"] },
  ral_custom: { name: "Custom RAL Code", description: "Any RAL color custom mix", images: ["https://solomon-ai-izyb.onrender.com/photos/ral-custom-001.jpg"] },
  two_tone: { name: "Two-Tone Examples", description: "Dual color combinations", images: ["https://solomon-ai-izyb.onrender.com/photos/two-tone-001.jpg","https://solomon-ai-izyb.onrender.com/photos/two-tone-002.jpg"] }
};

function getGalleryList(page) {
  page = page || 1;
  var keys = Object.keys(GALLERY);
  var perPage = 10;
  var start = (page - 1) * perPage;
  var end = Math.min(start + perPage, keys.length);
  var totalPages = Math.ceil(keys.length / perPage);
  var msg = "COLOUR GALLERY - Page " + page + "/" + totalPages + "\n\n";
  for (var i = start; i < end; i++) {
    msg += (i + 1) + ". " + GALLERY[keys[i]].name + "\n";
  }
  msg += "\nReply with a number to see photos.\n";
  if (page < totalPages) msg += "Type *gallery " + (page + 1) + "* for more.\n";
  msg += "\nFull gallery: https://solomon-ai-izyb.onrender.com/gallery.html\n\nType *menu* to go back.";
  return msg;
}

function getColorByIndex(index) {
  var keys = Object.keys(GALLERY);
  if (index >= 1 && index <= keys.length) {
    var key = keys[index - 1];
    var c = GALLERY[key];
    return c.name + " - " + c.description + "\n\n" + c.images.join("\n") + "\n\nType *menu* to go back.";
  }
  return null;
}

function searchGallery(text) {
  var t = text.toLowerCase().trim();
  for (var key in GALLERY) {
    if (t.includes(key.replace(/_/g, " ")) || key.includes(t.replace(/ /g, "_")) || t === GALLERY[key].name.toLowerCase()) {
      var idx = Object.keys(GALLERY).indexOf(key) + 1;
      return getColorByIndex(idx);
    }
  }
  return null;
}

module.exports = { GALLERY, getGalleryList, getColorByIndex, searchGallery };

