
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });

app.use(express.static('public'));

let waitingA = [];
let waitingB = [];
let sockets = {};

function pair() {
  while (waitingA.length && waitingB.length) {
    const a = waitingA.shift();
    const b = waitingB.shift();
    sockets[a].opponent = b;
    sockets[b].opponent = a;
    io.to(a).emit('match', { opponent: sockets[b].name });
    io.to(b).emit('match', { opponent: sockets[a].name });
  }
}

io.on('connection', socket => {
  sockets[socket.id] = { id: socket.id };
  socket.on('join', ({ name }) => {
    sockets[socket.id].name = name;
    const teamAcount = waitingA.length;
    const teamBcount = waitingB.length;
    if (teamAcount <= teamBcount) {
      sockets[socket.id].team = 'A';
      waitingA.push(socket.id);
    } else {
      sockets[socket.id].team = 'B';
      waitingB.push(socket.id);
    }
    socket.emit('joined', sockets[socket.id].team);
    pair();
  });
  socket.on('move', move => {
    sockets[socket.id].move = move;
    const oppId = sockets[socket.id].opponent;
    if (!oppId) return;
    if (sockets[oppId] && sockets[oppId].move) {
      const oppMove = sockets[oppId].move;
      const yourMove = move;
      const outcome = judge(yourMove, oppMove);
      io.to(socket.id).emit('result', { yourMove, oppMove, outcome });
      io.to(oppId).emit('result', {
        yourMove: oppMove,
        oppMove: yourMove,
        outcome: inverse(outcome)
      });
      delete sockets[socket.id].move;
      delete sockets[oppId].move;
    }
  });
  socket.on('disconnect', () => {
    waitingA = waitingA.filter(id => id !== socket.id);
    waitingB = waitingB.filter(id => id !== socket.id);
  });
});

function judge(a, b) {
  if (a === b) return 'Draw';
  if (
    (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper')
  )
    return 'You win';
  return 'You lose';
}
function inverse(res) {
  if (res === 'You win') return 'You lose';
  if (res === 'You lose') return 'You win';
  return res;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server on ' + PORT));
