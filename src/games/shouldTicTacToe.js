/**
 * Tic-Tac-Toe · Topic: Should (two players)
 *
 * Flow
 *  1. Rock · Paper · Scissors (tap a hand). Tie = play again. The winner starts (X).
 *  2. Each turn the active player answers a question.
 *       correct  -> they mark a square
 *       wrong    -> the other player marks a square (no question for them)
 *       can't    -> the other player marks a square
 *  3. Three in a row wins; a full board is a draw.
 *
 * Questions are shuffled for every game. The server checks answers, so the
 * correct answer never has to be trusted from the browser.
 */

// ── Questions: "Should" yes / no (teacher key included) ─────────────
const CHOICE_QUESTIONS = [
  { subject: "I", note: "", q: "Should I buy these cool sneakers?", hint: "They are on sale today!",
    yes: "Yes, you should.", no: "No, you shouldn't.", answer: "yes" },
  { subject: "You", note: "speaking to one friend", q: "Should you play video games right now?", hint: "Your English exam is tomorrow morning.",
    yes: "Yes, you should.", no: "No, you shouldn't.", answer: "no" },
  { subject: "He", note: "", q: "Should he eat a third slice of pizza?", hint: "He already feels very full.",
    yes: "Yes, he should.", no: "No, he shouldn't.", answer: "no" },
  { subject: "She", note: "", q: "Should she go to the mall with us?", hint: "She has no homework today!",
    yes: "Yes, she should.", no: "No, she shouldn't.", answer: "yes" },
  { subject: "It", note: "using a phone or gadget", q: "Should it (the phone) stay in the sun?", hint: "The screen will get too hot and break.",
    yes: "Yes, it should.", no: "No, it shouldn't.", answer: "no" },
  { subject: "We", note: "", q: "Should we watch a horror movie tonight?", hint: "It looks really scary and you hate scary movies.",
    yes: "Yes, we should.", no: "No, we shouldn't.", answer: "no" },
  { subject: "They", note: "", q: "Should they go skateboarding in the rain?", hint: "The streets are very wet and dangerous.",
    yes: "Yes, they should.", no: "No, they shouldn't.", answer: "no" },
  { subject: "You", note: "speaking to a group of friends", q: "Should you guys order a pizza?", hint: "Everyone is really hungry!",
    yes: "Yes, you should.", no: "No, you shouldn't.", answer: "yes" },
  { subject: "She", note: "", q: "Should she dye her hair pink?", hint: "She really wants a new style for summer.",
    yes: "Yes, she should.", no: "No, she shouldn't.", answer: "yes" },
  { subject: "He", note: "", q: "Should he listen to loud music on the bus?", hint: "The other people on the bus are trying to sleep.",
    yes: "Yes, he should.", no: "No, he shouldn't.", answer: "no" },
];

// ── Questions: put the words in order (answer B is shown) ──────────
const ORDER_QUESTIONS = [
  { q: "What should I wear to the school party?", b: "You should wear your new jeans." },
  { q: "Where should we go this weekend?", b: "We should go to the new shopping mall." },
  { q: "When should I call my friend?", b: "You should call her after dinner." },
  { q: "Who should he invite to the concert?", b: "He should invite his best friend." },
  { q: "Why should we study for the test?", b: "Because the test is very hard!" },
  { q: "What should we order from the café?", b: "You should order a milkshake." },
  { q: "Where should I put my backpack?", b: "You should put it under your desk." },
  { q: "When should they do their homework?", b: "They should do it before they play video games." },
  { q: "Who should I ask for help with my math?", b: "You should ask the new student. He is very smart!" },
  { q: "Why should I watch this movie?", b: "Because it is really funny and cool!" },
];

const RPS = ["rock", "paper", "scissors"];
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build one shuffled deck of 20 questions (10 yes/no + 10 word order). */
function buildDeck() {
  const choice = CHOICE_QUESTIONS.map((c, i) => {
    const opts = shuffle([
      { text: c.yes, value: "yes" },
      { text: c.no, value: "no" },
    ]);
    return {
      type: "choice",
      key: "c" + i,
      subject: c.subject,
      note: c.note,
      q: c.q,
      hint: c.hint,
      options: opts.map((o) => o.text),
      correctIndex: opts.findIndex((o) => o.value === c.answer),
    };
  });
  const order = ORDER_QUESTIONS.map((o, i) => {
    const tokens = o.q.split(" ");
    const chips = shuffle(tokens.map((t, idx) => ({ text: t, idx })));
    // correctSeq[k] = the chip index that belongs at position k of the question
    const correctSeq = tokens.map((_, k) => chips.findIndex((c) => c.idx === k));
    return {
      type: "order",
      key: "o" + i,
      q: o.q,
      b: o.b,
      chips: chips.map((c) => c.text),
      correctSeq,
    };
  });
  return shuffle([...choice, ...order]);
}

export function createTTTState(playerIds) {
  return {
    type: "tictactoe-should",
    phase: "rps",            // rps | turn | over
    players: playerIds.slice(0, 2),
    rps: {},                 // playerId -> choice (current round)
    rpsNote: "",             // e.g. "Tie! Play again"
    lastRps: null,           // both hands of the last round (shown after both chose)
    xId: null,               // the winner of rock-paper-scissors (starts with X)
    deck: buildDeck(),
    deckPos: 0,
    board: Array(9).fill(null), // playerId or null
    turn: null,              // { deckIndex, activeId, otherId, stage, markBy, result, reveal }
    activeId: null,
    winnerId: null,          // playerId, "draw", or null
    winLine: null,
    rounds: 0,
  };
}

function other(game, id) {
  return game.players.find((p) => p !== id) || null;
}

/** Rock · paper · scissors. Both players tap a hand; a tie replays. */
export function rpsChoose(game, playerId, choice) {
  if (game.phase !== "rps") return { ok: false, error: "Not time for rock, paper, scissors" };
  if (!game.players.includes(playerId)) return { ok: false, error: "You are not in this game" };
  if (!RPS.includes(choice)) return { ok: false, error: "Choose rock, paper or scissors" };
  if (game.rps[playerId]) return { ok: false, error: "You already chose" };
  game.rps[playerId] = choice;

  const [a, b] = game.players;
  if (!game.rps[a] || !game.rps[b]) return { ok: true, waiting: true };

  const x = game.rps[a], y = game.rps[b];
  if (x === y) {
    game.lastRps = { ...game.rps };
    game.rps = {};
    game.rpsNote = "Tie! Choose again.";
    return { ok: true, tie: true };
  }
  const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
  const winnerId = beats[x] === y ? a : b;
  game.lastRps = { ...game.rps };
  game.xId = winnerId;
  game.rpsNote = "";
  game.phase = "turn";
  startTurn(game, winnerId);
  return { ok: true, winner: winnerId };
}

function startTurn(game, activeId) {
  const deckIndex = game.deckPos;
  const q = game.deck[deckIndex];
  game.activeId = activeId;
  game.turn = {
    deckIndex,
    activeId,
    otherId: other(game, activeId),
    stage: "answer",     // answer | mark
    markBy: null,
    result: null,        // correct | wrong | cant
    reveal: null,        // the right answer, shown after answering
    startedAt: Date.now(),
  };
}

/** Public copy of the current question (no answers). */
export function publicQuestion(game) {
  const t = game.turn;
  if (!t) return null;
  const q = game.deck[t.deckIndex];
  const base = {
    number: game.deckPos + 1,
    total: game.deck.length,
    type: q.type,
    key: q.key,
  };
  if (q.type === "choice") {
    return { ...base, subject: q.subject, note: q.note, q: q.q, hint: q.hint, options: q.options };
  }
  return { ...base, q: q.q, b: q.b, chips: q.chips };
}

/** Answer the question (only the active player). */
export function answerQuestion(game, playerId, payload) {
  const t = game.turn;
  if (game.phase !== "turn" || !t || t.stage !== "answer") return { ok: false, error: "No question to answer now" };
  if (playerId !== t.activeId) return { ok: false, error: "Your opponent is answering" };
  const q = game.deck[t.deckIndex];

  let correct = false;
  if (q.type === "choice") {
    const pick = Number(payload && payload.choice);
    if (!Number.isInteger(pick) || pick < 0 || pick > 1) return { ok: false, error: "Choose one answer" };
    correct = pick === q.correctIndex;
    t.reveal = q.options[q.correctIndex];
  } else {
    const order = Array.isArray(payload && payload.order) ? payload.order.map(Number) : [];
    correct = order.length === q.correctSeq.length && order.every((v, i) => v === q.correctSeq[i]);
    t.reveal = q.q;
  }

  t.result = correct ? "correct" : "wrong";
  t.stage = "mark";
  t.markBy = correct ? t.activeId : t.otherId;   // a wrong answer gives the other player the mark
  return { ok: true, correct, reveal: t.reveal, markBy: t.markBy };
}

/** The active player can't answer: the other player marks. */
export function cantAnswer(game, playerId) {
  const t = game.turn;
  if (game.phase !== "turn" || !t || t.stage !== "answer") return { ok: false, error: "No question to skip now" };
  if (playerId !== t.activeId) return { ok: false, error: "Only the player with the question can skip" };
  const q = game.deck[t.deckIndex];
  t.reveal = q.type === "choice" ? q.options[q.correctIndex] : q.q;
  t.result = "cant";
  t.stage = "mark";
  t.markBy = t.otherId;
  return { ok: true, reveal: t.reveal, markBy: t.markBy };
}

function findWin(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

/** Place a mark (only the player who may mark). */
export function placeMark(game, playerId, cell) {
  const t = game.turn;
  if (game.phase !== "turn" || !t || t.stage !== "mark") return { ok: false, error: "Not time to mark" };
  if (playerId !== t.markBy) return { ok: false, error: "Your opponent marks this square" };
  const c = Number(cell);
  if (!Number.isInteger(c) || c < 0 || c > 8) return { ok: false, error: "Choose a square" };
  if (game.board[c]) return { ok: false, error: "That square is taken" };

  game.board[c] = playerId;
  game.rounds += 1;
  const line = findWin(game.board);
  if (line) {
    game.phase = "over";
    game.winnerId = playerId;
    game.winLine = line;
    game.turn = null;
    return { ok: true, over: true, winnerId: playerId, winLine: line };
  }
  if (game.board.every(Boolean) || game.deckPos + 1 >= game.deck.length) {
    game.phase = "over";
    game.winnerId = "draw";
    game.turn = null;
    return { ok: true, over: true, winnerId: "draw" };
  }
  // next turn: the other player asks/answers
  game.deckPos += 1;
  startTurn(game, other(game, t.activeId));
  return { ok: true, over: false };
}

/** Symbol for a player: the RPS winner is X, the other is O. */
export function symbolOf(game, playerId) {
  if (!playerId) return null;
  return playerId === game.xId ? "X" : "O";
}

/** The game as everyone in the room sees it. Hands stay hidden until both players choose. */
export function publicTTT(game) {
  const bothChosen = game.players.every((p) => !!game.rps[p]);
  return {
    type: game.type,
    phase: game.phase,
    players: game.players,
    symbols: Object.fromEntries(game.players.map((p) => [p, symbolOf(game, p)])),
    rps: {
      chosen: Object.fromEntries(game.players.map((p) => [p, !!game.rps[p]])),
      reveal: bothChosen || game.phase !== "rps" ? (bothChosen ? { ...game.rps } : game.lastRps) : null,
      lastRound: game.lastRps,
    },
    rpsNote: game.rpsNote,
    board: game.board.map((owner) => (owner ? symbolOf(game, owner) : null)),
    turn: game.turn ? {
      number: game.deckPos + 1,
      total: game.deck.length,
      activeId: game.turn.activeId,
      stage: game.turn.stage,
      markBy: game.turn.markBy,
      result: game.turn.result,
      reveal: game.turn.reveal,
      question: publicQuestion(game),
    } : null,
    winnerId: game.winnerId,
    winLine: game.winLine,
  };
}
