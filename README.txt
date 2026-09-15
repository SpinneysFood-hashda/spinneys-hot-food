SPINNEYS HOT FOOD WEBSITE
=========================

This is a simple HTML/CSS/JavaScript site matching the supplied screenshot.
It does not require React, Node.js, npm or a database.

FOLDER STRUCTURE
-----------------
index.html
styles.css
app.js
server.py
start.bat
data\products.json
images\

1) Replace data\products.json with your complete JSON response.
2) If you have product images, put them in images\ using the item code:
   images\123002.jpg
   images\123129.jpg
   images\123133.jpg
3) Double-click start.bat.
4) The browser opens http://localhost:8080

IMPORTANT
---------
Do not open index.html directly with file:// because browsers can block
JavaScript fetch() from loading the JSON file. Use start.bat, IIS, or VS Code
Live Server.

HOW THE JSON IS HANDLED
-----------------------
Your JSON has one row per item/location. The site groups rows by No_ so an item
appears once and shows all its locations, e.g. ENAWK, MOA and TNT.

The current JSON does not have a category field. The site therefore infers a
category from Description. If you later add a Category field to your API, the
category logic can be changed easily to use it directly.

DIRECT API OPTION
-----------------
When your ASP.NET API is ready, change this line in app.js:

fetch("data/products.json", { cache: "no-store" })

to your API endpoint, for example:

fetch("http://localhost:50299/Product/GetProductPrice", { cache: "no-store" })

For production, preferably host the website and API under the same HTTPS site,
or configure CORS in the API.
