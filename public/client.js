
const socket = io();
const app = document.getElementById('app');
let state = 'join';
let myTeam = null;
let opponentName = '';
let move = null;

function render() {
  if (state === 'join') {
    app.innerHTML = \`
      <h1>JadedsRPS</h1>
      <input id="name" placeholder="Name/Telegram @..." />
      <button id="joinBtn">Join Game</button>
    \`;
    document.getElementById('joinBtn').onclick = () => {
      const name = document.getElementById('name').value.trim();
      if (!name) return;
      socket.emit('join', { name });
      state = 'wait';
      render();
    };
  } else if (state === 'wait') {
    app.innerHTML = '<h2>Waiting for matchup...</h2>';
  } else if (state === 'play') {
    app.innerHTML = \`
      <h2>VS \${opponentName}</h2>
      <p>Choose your move (3 min timer)</p>
      <button class="throw" data-move="rock">🪨 Rock</button>
      <button class="throw" data-move="paper">📄 Paper</button>
      <button class="throw" data-move="scissors">✂️ Scissors</button>
    \`;
    document.querySelectorAll('.throw').forEach(btn => {
      btn.onclick = () => {
        socket.emit('move', btn.dataset.move);
        move = btn.dataset.move;
        state = 'reveal';
        render();
      };
    });
  } else if (state === 'reveal') {
    app.innerHTML = '<h2>Waiting for opponent...</h2>';
  }
}
render();

socket.on('joined', team => {
  myTeam = team;
});
socket.on('match', ({ opponent }) => {
  opponentName = opponent;
  state = 'play';
  render();
});
socket.on('result', ({ yourMove, oppMove, outcome }) => {
  app.innerHTML = \`
    <h2>Result</h2>
    <p>You: \${yourMove} | Opponent: \${oppMove}</p>
    <h3>\${outcome}</h3>
  \`;
});
