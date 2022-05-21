import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { auth } from './midlewares/auth.midleware.js';
import passport from 'passport';
import UserRouter from './router/user.router.js';
import AuthRouter from './router/auth.router.js';
// import getRandomController from './router/random.router.js';
import './config/db.config.js';
import parseArgs from 'minimist';
import { fork } from 'child_process';

dotenv.config();
const calc = fork('./src/helpers/random_sinBloqueo.js');
const args = parseArgs(process.argv.slice(2));
const PORT = args.port;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(passport.initialize());
/* -------------------------------------------------------------------------- */
/*                                     EJS                                    */
/* -------------------------------------------------------------------------- */

app.set('view engine', 'ejs');
app.set('views', path.resolve('src/views'));
/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */

app.use('/user', UserRouter);
app.use('/login', AuthRouter);
// app.use('/api/randoms?', getRandomController);//aca funciona con la forma bloqueante y modularizado

app.get('/api/randoms?', (req, res) => {
  const { cant } = req.query;
  calc.on('message', (resultado) => {
    console.log('resultado:', resultado);
    res.status(200).json(resultado);
  });
  if (cant) {
    const stringCantidad = cant.toString();
    calc.send(stringCantidad);
  } else {
    calc.send('10000000');
  }
});
app.get('/info', (req, res) => {
  const obj = {
    Argumentos: args,
    SO: process.platform,
    NodeV: process.version,
    Rss: process.memoryUsage(),
    PathEjecucion: process.execPath,
    ProcessId: process.pid,
    CarpetaProyecto: process.cwd(),
  };
  res.status(200).json({ obj });
});

app.get('/', (req, res) => {
  res.render('input');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/inicio', auth, (req, res) => {
  const { user } = req.user;
  res.render('index', { user: user.userName });
});

const server = app.listen(PORT, () => {
  console.log(` 🚀🔥server is runing at http://localhost:${PORT} 🚀🔥`);
});

server.on('error', (err) => {
  console.log(err);
});
