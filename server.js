const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//connect db
mongoose.connect(process.env.MONGO_URI);

//schema
const UserSchema = new mongoose.Schema({
  username: String,
});

const ExerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

//model
const User = mongoose.model('User', UserSchema);
const Exercise = mongoose.model('Exercise', ExerciseSchema);

//Adicionando usuario 
app.post('/api/users', (req, res) => {

  const user = new User({
    username: req.body.username
  });

  user.save((error, data) => {
    if (error || !data) {
      res.send("Erro ao tentar salvar um novo usuário");
    } else {
      res.json({
        username: data.username,
        _id: data._id
      });
    }
  });

});

//Adicionando exercicio
app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  User.findById(id, (error, data) => {
    if (error || !data) {
      res.send("Error ao tentar encontrar o usuario");
    } else {

      const exercise = new Exercise({
        userId: id,
        description,
        duration,
        date: new Date(date)
      })


      exercise.save((error, data) => {
        if (error || !data) {
          res.send("Error ao tentar adicionar novo exercicio")
        } else {
          const { description, duration, date, _id } = data
          res.json({
            username: data.username,
            description,
            duration,
            date: date.toDateString(),
            _id: data.id
          });
        }
      });
    }
  });
});

//consulta por usuario 
app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  const to = new Date(req.query.to);
  const from = new Date(req.query.from);
  const limit = Number(req.query.limit);

  const finalDate = new Date(2999,12,31);
  console.log(finalDate)
  User.findById(id, (error, user) => {
    if (error || !user) {
      res.send("Error ao tentar encontrar o usuario");
    } else {

      Exercise.find({
        userId: id,
        date: {
          $lt: to != "Invalid Date" ? to : finalDate,
          $gt: from != "Invalid Date" ? from : 0,
        }
      })
        .sort("-date")
        .limit(limit)
        .exec(function (error, data) {

          const result = {
            _id: id,
            username: user.username,
            from: from != "Invalid Date" ? from.toDateString() : undefined,
            to: to != "Invalid Date" ? to.toDateString() : undefined,
            count: data.length,
            log: data.map((e) => ({
              description: e.description,
              duration: e.duration,
              date: e.date.toDateString(),
            })),
          }
          res.json(result);
        });
    }
  });
});

app.get('/api/users', (req, res) => {

  User.find({}, 'username _id',(error, users) => {
    if (error || !users) {
      res.send("Error ao tentar encontrar os usuarios");
    } else {
      res.json(users)
    }
  })
})

   

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
