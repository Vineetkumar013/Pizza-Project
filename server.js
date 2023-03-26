require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 3300
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')
const passport = require('passport')
const Emitter = require('events')

//Database connection
mongoose.set('strictQuery', true);
const dbConnect = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/realtime-Pizza", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("Database error", error);
  }
};

dbConnect();



//Session config
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  store: MongoDbStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/realtime-Pizza"
  }),
  saveUninitialized: false,
  cookie:{max:1000*60*60*24}
}))

//Passport config
const passportInit = require("./app/config/passport")
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use(flash())

//Assets
app.use(express.static("public"))
app.use(express.urlencoded({extended:false}))
app.use(express.json())

//Globle middleware
app.use((req,res,next) => {
  res.locals.session = req.session
  res.locals.user = req.user
  next();
})

//Set Template engine
app.use(expressLayout);
app.set("views", path.join(__dirname,"/resources/views"));
app.set("view engine", "ejs");

require("./routes/web")(app)
app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(PORT , () => {
            console.log(`Listening on port ${PORT}`)
        })

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})

