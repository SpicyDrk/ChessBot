const fs = require('fs');


let puzzles = [];
let path = './puzzles/'

fs.readdir(path, 'utf-8', (err, jsons) => {
    for (let json of jsons) {
        try {
            let puzzleData = JSON.parse(fs.readFileSync(path + json));

            let puzzle = {
                rating: puzzleData.data.puzzle.rating,
                startingPos: fixFen(puzzleData.data.game.treeParts.slice(-1).pop().fen),
                lines: puzzleData.data.puzzle.lines,
                lastMove: puzzleData.data.game.treeParts.slice(-1).pop()['uci'],
                toPlay: puzzleData.data.puzzle.color,
                id: puzzleData.data.puzzle.id,
                rating: puzzleData.data.puzzle.rating,
                vote: puzzleData.data.puzzle.vote
            }
            puzzles.push(JSON.stringify(puzzle));
        } catch (err) {
            console.log(err)
        }

    }
    fs.writeFileSync(path + 'puzzles.json', puzzles)
})


function fixFen(fen) {
    brokenFen = fen.split('/')[7].split('')
    fixedLastRow = '';
    let spots = 0;
    var playerToMove = '';
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
    fixedFen = fen.split('/')
    fixedFen[7] = fixedLastRow
    fixedFen = fixedFen.join('/')
    return fixedFen
}