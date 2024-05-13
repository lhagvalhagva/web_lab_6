var express = require("express");
var app = express();

var mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
var async = require("async");

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require("./schema/user.js");
var Photo = require("./schema/photo.js");
var SchemaInfo = require("./schema/schemaInfo.js");

// Connect to the MongoDB instance
mongoose.connect("mongodb://127.0.0.1/cs142project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We have the express static module (http://expressjs.com/en/starter/static-files.html)
// do all the work for us.
app.use(express.static(__dirname));
/**
 * The __dirname is a global variable that represents the directory name of the current module.
 * So, when a client makes a request for a file, the Express application will check the current
 * directory for the file and return it to the client if it exists.
 */

app.get("/", function (request, response) {
  console.log("Simple web server of files from " + __dirname);
  response.send("Simple web server of files from " + __dirname);
});

/*
 * Use Express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params objects.
  console.log("/test called with param1 = ", request.params.p1);

  var param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error.  We pass it back to the browser with an Internal Service
        // Error (500) error code.
        console.error("Doing /user/info error:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object - This
        // is also an internal error return.
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an async
    // call to each collections. That is tricky to do so we use the async package
    // do the work.  We put the collections into array and use async.each to
    // do each .count() query.
    var collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count; // adding count property into collections's element
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          var obj = {}; // count obj
          for (var i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
            // assign each count value into the count obj
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400) status.
    response.status(400).send("Bad param " + param);
  }
});

app.get("/user/list", function (request, response) {
  User.find({}, function (err, users) {
    // Error handling
    if (err) {
      console.log("** Get user list: Error! **");
      response.status(500).send(JSON.stringify(err));
    } else {
      /**
       * "user" returned from Mongoose is Array type: Array of user objects.
       * also need to be processed as Mongoose models and models from frontend do not allign perpectly.
       */
      console.log("** Read server path /user/list Success! **");
      const userList = JSON.parse(JSON.stringify(users)); // convert Mongoose data to Javascript obj

      /**
       * * async method with "async.each()"
       */
      // const newUserList = [];
      // async.each(userList, (user, doneCallback) => {
      //     const { first_name, last_name, _id } = user;
      //     newUserList.push({ first_name, last_name, _id });
      //     doneCallback(err);
      //     console.log("From async: ", newUserList);
      // }, error => {
      //     if (error) {
      //         console.log(error);
      //     } else {
      //         response.json(newUserList);
      //     }
      // });

      /**
       * * non-async method
       * Get only wanted user proeprties from Database's model,
       * and construct a new users obj to response.
       */
      const newUsers = userList.map((user) => {
        const { first_name, last_name, _id } = user;
        return { first_name, last_name, _id };
      });

      // Send response to client
      response.json(newUsers);
    }
  });
});

app.get("/user/:id", function (request, response) {
  const id = request.params.id;

  User.findOne({ _id: id }, function (err, user) {
    if (err) {
      console.log(`** User ${id}: Not Found! **`);
      response.status(400).send(JSON.stringify(err));
    } else {
      console.log(`** Read server path /user/${id} Success! **`);
      const userObj = JSON.parse(JSON.stringify(user));
      delete userObj.__v;
      response.json(userObj);
    }
  });
});

app.get("/photosOfUser/:id", function (request, response) {
  var id = request.params.id;

  Photo.find({ user_id: id }, (err, photos) => {
    if (err) {
      console.log(`** Photos for user with id ${id}: Not Found! *`);
      response
        .status(400)
        .send(JSON.stringify(`** Photos for user with id ${id}: Not Found **`));
    } else {
      console.log(`** Read server path /photosOfUser/${id} Success! **`);
      let count = 0;
      const photoList = JSON.parse(JSON.stringify(photos));
      photoList.forEach((photo) => {
        delete photo.__v;
        async.eachOf(
          photo.comments,
          (comment, index, callback) => {
            User.findOne({ _id: comment.user_id }, (error, user) => {
              if (!error) {
                const userObj = JSON.parse(JSON.stringify(user));
                const { location, description, occupation, __v, ...rest } =
                  userObj;
                photo.comments[index].user = rest;
                delete photo.comments[index].user_id;
              }
              callback(error);
            });
          },
          (error) => {
            count += 1;
            if (error) {
              response
                .status(400)
                .send(
                  JSON.stringify(
                    `** Photos for user with id ${id}: Not Found **`
                  )
                );
            } else if (count === photoList.length) {
              console.log("Done all  async() processing");
              response.json(photoList);
            }
          }
        );
      });
    }
  });
});

var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
