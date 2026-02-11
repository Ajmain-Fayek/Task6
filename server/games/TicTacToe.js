class TicTacToe {
  constructor() {
    this.board = Array(9).fill(null);
    this.status = "playing";
    this.winner = null;
    this.turn = "X";
  }

  makeMove(index, symbol) {
    if (this.board[index] === null && this.status === "playing" && this.turn === symbol) {
      this.board[index] = symbol;
      this.checkWinner();
      if (this.status === "playing") {
        this.turn = this.turn === "X" ? "O" : "X";
      }
      return true;
    }
    return false;
  }

  checkWinner() {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        this.status = "finished";
        this.winner = this.board[a];
        return;
      }
    }

    if (this.board.every((cell) => cell !== null)) {
      this.status = "finished";
      this.winner = "draw";
    }
  }

  reset(startingSymbol = "X") {
    this.board = Array(9).fill(null);
    this.status = "playing";
    this.winner = null;
    this.turn = startingSymbol;
  }

  getState() {
    return {
      board: this.board,
      status: this.status,
      turn: this.turn,
      winner: this.winner,
    };
  }
}

module.exports = TicTacToe;
