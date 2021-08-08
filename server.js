const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose = require('mongoose');
const { userInfo } = require('os')
const { resourceLimits } = require('worker_threads')

mongoose.connect(process.env.MONGO_URI,{ useUnifiedTopology: true ,useNewUrlParser: true});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());


const { Schema } = mongoose;

//Create userExercise Schema  
const userExerciseSchema = new Schema({
    user:  String, // String is shorthand for {type: String}
    exercise:[{
      description:String,
      duration:Number,
      date: { type: Date, default: Date.now },
    }],

  });
  const UserExercise = mongoose.model('UserExercise',userExerciseSchema );


//route test
  app.get('/hello',(req,res) => {
    UserExercise.findById('610ded0d207f31a4c1cb8b29',(err,data) => {
      if(err) return console.error(err);
      res.json({"who":data.user});

    })
  })

// handle user form submission and create user in mongodb
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  UserExercise.findOne({ user: username }, (err, result) => {
    if (err) return console.error(err);
    if (!result) {
      UserExercise.create({ user: username }, (err, result) => {
        if (err) return console.error(err);
        res.json(result);
      });
    }else {
  
          res.json( `Username already taken.`);
        }
    });
  });

//get user by user name
  app.get('/api/users/:name', (req, res) => {
    let {name} = req.params;
    UserExercise.findOne({ user: name }, (err, result) => {
      if (err) return console.error(err);
      if (result){res.json(result);}
      else{
        res.json( `User doesn't exist.`);
      }   
      });
    });

//handle exercise form submission and insert a exercise recod in given _id doc to mongodb
  app.post('/api/users/:_id/exercises',(req,res) => {
    const {_id} = req.params;
    const {description,duration,date} = req.body;

    UserExercise.findOneAndUpdate(
     {_id:_id},
     { $push: {exercise:{description,duration,date}} },
     {returnOriginal:false,useFindAndModify:false},
      (err,result) => {
        if(err) return console.error(err);
        res.json(result);
      }
    );
});
//GET user's exercise log: GET /api/users/:_id/logs?[from][&to][&limit]
//[ ] = optional
//from, to = dates (yyyy-mm-dd); limit = number      

app.get('/api/users/:_id/logs',(req,res) => {
  const {_id} = req.params;
  const {from,to,limit} = req.query;

//
  const queryUser = (id, from="1900-01-01", to="2100-01-01",limit = 1000) => {
   // console.log(`from: ${new Date(from).toISOString()} to:${new Date(to).toISOString()} limit:${limit}`); //debug

    UserExercise
    .find({
      _id: id,
      exercise:{ $elemMatch:{ date: {$gt: from , $lt: to }}}
    }
    ,{exercise:{$slice:Number(limit)} })
    .exec(
      (err,result) => {
        if(err) return console.error(err);
        res.json(result);
    });
  };
  queryUser(_id,from,to,limit);
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
