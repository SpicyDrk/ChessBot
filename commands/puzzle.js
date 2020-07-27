const fs = require('fs');
const {
  puzzle
} = require('.');

let puzzles;


module.exports = {
  name: 'puzzle',
  description: 'Starts a new puzzle',
  execute(msg, args) {
    let puzzleData;
    let _data = fs.readFileSync('./puzzles/puzzles.json');
    puzzles = JSON.parse(_data)
    let puzzleNum;
    if (args.length == 0) {
      puzzleNum = Math.floor(Math.random() * puzzles.length)
    } else if (!isNaN(args[0])) {
      puzzleNum = puzzles.findIndex(x => x.id == parseInt(args[0]))
    } else {
      puzzleNum = Math.floor(Math.random() * puzzles.length)
    }

    puzzleData = {
      toPlay: puzzles[puzzleNum].toPlay,
      rating: puzzles[puzzleNum].rating,
      lines: puzzles[puzzleNum].lines,
      fen: puzzles[puzzleNum].startingPos,
      lastMove: puzzles[puzzleNum].lastMove,
      rating: puzzles[puzzleNum].rating
    }
    return {
      type: 'puzzle',
      value: puzzleData
    }
  },
};

function fixFen(fen) {
  brokenFen = fen.split('/')[7].split('')
  fixedLastRow = '';
  let spots = 0;
  for (let i = 0; i < brokenFen.length; i++) {
    if (isNaN(brokenFen[i])) {
      spots = spots + 1
    } else {
      spots = spots + parseInt(brokenFen[i])
    }
    fixedLastRow = fixedLastRow + brokenFen[i]
    if (spots >= 8) {
      break;
    }
  }
  fixedLastRow = fixedLastRow
  fixedFen = fen.split('/')
  fixedFen[7] = fixedLastRow
  fixedFen = fixedFen.join('/')
  return fixedFen
}