require('dotenv').config()
const uri = "mongodb+srv://CorentinDieudonne:corentin@denzel-2xis4.gcp.mongodb.net/test?retryWrites=true";
const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const IMDB = require('./src/IMDB');
const DENZEL_IMDB_ID = "nm0000243";
const DATABASE_NAME = "denzel";
var port = process.env.PORT || 9292;
var exp = Express();

exp.use(BodyParser.json());
exp.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

exp.listen(port, () => {
    MongoClient.connect(uri, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to '" + DATABASE_NAME + " 'database !");
    });
});

exp.get("/movies/populate", async (request, response) => {
    try {
      const movies = await IMDB(DENZEL_IMDB_ID);
      collection.insertMany(movies);
      result = {
        "total": movies.length
      };
      response.send(result);
    } catch (e) {
      console.error(e);
      return response.status(500).send("Error trying to populate the database");
    }
});

exp.get("/movies", (request, response) => {
    collection.find({"metascore": {$gte: 70}}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result[Math.floor(Math.random() * result.length)]);
    });
});

exp.get("/movies/search", (request, response) => {
    var limit = (request.query.limit === undefined ? 5 : parseInt(request.query.limit));
    var metascore = (request.query.metascore === undefined ? 0 : parseInt(request.query.metascore));

    collection.find({"metascore": {$gte: metascore}}).limit(limit).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

exp.get("/movies/:id", (request, response) => {
    collection.findOne({ "id": request.params.id }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});
//To get the
exp.post("/movies/:id", (request, response) => {
    if(request.body.review === undefined || request.body.date === undefined) {
        return response.status(400).send("You have to specify review and date");
    }
    collection.update({"id": request.params.id}, {$set: {"date": request.body.date, "review": request.body.review}}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
    });
    collection.findOne({"id": request.params.id}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        result = {
          "_id": result._id
        };
        response.send(result);
    });
});
