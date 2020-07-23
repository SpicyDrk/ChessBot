const fs = require('fs')

let _PData;
module.exports = {
    name: 'puzzle',
    description: 'Starts a new puzzle',
    execute(msg, args) {
      let puzzleData;

      //todo, dynamically generate puzzle list. this works for now. 
      let puzzleList = [...Array(4930).keys()].map(x=>x+1) //dont have 1.json, oof
      
      puzzleNum = Math.floor(Math.random()*puzzleList.length)+1

      console.log('Starting Puzzle :' + puzzleNum.toString());
      data = fs.readFileSync('./puzzles/'+puzzleNum+'.json');
      picPath = './puzzles/'+puzzleNum+'.png';
      let _data = JSON.parse(data);
      puzzleData = {
        toPlay : _data.data.puzzle.color,
        rating : _data.data.puzzle.rating,
        lines : _data.data.puzzle.lines,
        data: _data.data,
        fen: fixFen(_data.data.game.treeParts.slice(-1).pop()['fen']),
        lastMove: _data.data.game.treeParts.slice(-1).pop()['uci']
      }
      return {type:'puzzle',value:puzzleData}
    },
  };

function fixFen(fen){
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
    if (spots >= 8 ){
      break;
    }
  }
  fixedLastRow = fixedLastRow 
  fixedFen = fen.split('/')
  fixedFen[7] = fixedLastRow
  fixedFen = fixedFen.join('/')
  return fixedFen
}