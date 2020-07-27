require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require('./commands');
const boardGenerator = require('./board/board.js')

Object.keys(botCommands).map(key => {
    bot.commands.set(botCommands[key].name, botCommands[key]);
});

const TOKEN = process.env.TOKEN;

bot.login(TOKEN).catch(err => {
    console.log(err)
})

bot.on('ready', () => {
    console.info(`Chess Bot up and running!`);
});


let puzzleInProgress = false


bot.on('message', msg => {
    const args = msg.content.split(/ +/);
    let command = args.shift().toLowerCase();
    const UCI_TEST = new RegExp('([a-h][1-8])([a-h][1-8])([q,r,n,b])?')
    const SAN_TEST = new RegExp('[BRQNK][a-h][1-8]|[BRQNK][a-h]x[a-h][1-8]|[BRQNK][a-h][1-8]x[a-h][1-8]|[BRQNK][a-h][1-8][a-h][1-8]|[BRQNK][a-h][a-h][1-8]|[BRQNK]x[a-h][1-8]|[a-h]x[a-h][1-8]=(B+R+Q+N)|[a-h]x[a-h][1-8]|[a-h][1-8]x[a-h][1-8]=(B+R+Q+N)|[a-h][1-8]x[a-h][1-8]|[a-h][1-8][a-h][1-8]=(B+R+Q+N)|[a-h][1-8][a-h][1-8]|[a-h][1-8]=(B+R+Q+N)|[a-h][1-8]|[BRQNK][1-8]x[a-h][1-8]|[BRQNK][1-8][a-h][1-8]', 'gi')
    let moveComand = false;
    let convertMove = false
    if (SAN_TEST.test(command)) {
        if (!UCI_TEST.test(command)) {
            convertMove = true;
        }
        moveComand = true;
    }

    //board = boardGenerator.NewChessBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',lastMove,'last')
    if (!bot.commands.has(command) && !moveComand) return;
    try {
        if (moveComand && puzzleInProgress) {
            if (convertMove) {
                command = convertSANtoUCI(command, board)
            }
            data = bot.commands.get('move').execute(msg, [command])
        } else {
            data = bot.commands.get(command).execute(msg, args);
        }
        switch (data.type) {
            case 'puzzle':
                if (!puzzleInProgress) {
                    puzzleInProgress = true;
                    activePuzzleData = data.value
                    let fen = data.value.fen;
                    let lastMove = data.value.lastMove;
                    board = boardGenerator.NewChessBoard(fen, lastMove, 'last',activePuzzleData.toPlay)
                    let path = board.generateImage();
                    msg.channel.send('New Puzzle: ' + data.value.toPlay + ' to play', {
                        files: [path]
                    })
                } else {
                    msg.reply('Puzzle is currently active already you goober!')
                }
                break;
            case 'move':
                if (data.value) {
                    let currentMove = data.value
                    if (currentMove in activePuzzleData.lines) {
                        if (activePuzzleData.lines[currentMove] == 'retry') {
                            msg.channel.send(`Nice Move ${msg.author.username}, but it's not the best line! Try again!`)
                            return;
                        } else if (activePuzzleData.lines[currentMove] == 'win') {
                            msg.channel.send(`You won ${msg.author.username}!`)
                            puzzleInProgress = false;
                            activePuzzleData = null
                            return;
                        }
                        msg.channel.send(`Nice move ${msg.author.username}!`)
                        path = board.preformMove(currentMove, true)
                        let opponentMove = Object.keys(activePuzzleData.lines[currentMove])[0]

                        if (activePuzzleData.lines[currentMove][opponentMove] == 'win') {
                            msg.channel.send(`You won ${msg.author.username}!`, {
                                files: [path]
                            })
                            puzzleInProgress = false;
                            activePuzzleData = null
                            return;
                        }

                        path = board.preformMove(opponentMove, true)
                        msg.channel.send('Whats next?', {
                            files: [path]
                        })
                        activePuzzleData.lines = activePuzzleData.lines[currentMove][opponentMove]
                        if (activePuzzleData.lines == 'win') {
                            msg.channel.send(`You won ${msg.author.username}!`)
                            puzzleInProgress = false;
                            activePuzzleData = null
                            return;
                        }
                    } else {

                    }

                }
                break;
            case 'restart':
                console.log('restart puzzle');
                msg.channel.send('canceled Puzzle');
                puzzleInProgress = false;
                break;
            case 'hint':
                if (!puzzleInProgress) {
                    return
                }
                let possibleLines = Object.keys(activePuzzleData.lines)
                for (let line of possibleLines) {
                    if (activePuzzleData.lines[line] !== 'retry') {
                        msg.channel.send(`Try looking at your piece on the square ${line.substring(0,2)}`);
                        return;
                    }
                }
        }
    } catch (error) {
        console.error(error)
        msg.reply('there was an error trying to execute that command!');
    }
});

function convertSANtoUCI(move, board) {
    move = move.replace('x','').replace('+','')
    let player = activePuzzleData.toPlay
    console.log(`converting ${move} to UCI`)
    let possiblePieces = []
    let pieceLetter;
    let destination;

    //assuming a move like nd5 or qh1
    if (move.length ==3){
        pieceLetter = move.substr(0,1);
        destination = move.substr(1,2);
        let pieceToMove = (player=='black') ? pieceLetter.toLowerCase() : pieceLetter.toUpperCase();
        possiblePieces = board.longBoardState.filter(x=>{
            return x.piece==pieceToMove
        })
    }
    //if only one piece could be the one they're talking about, use that piece
    if (possiblePieces.length === 1){
        return possiblePieces[0].coords.join() + move.substr(1,2)
    } else if(possiblePieces.length === 0){
        return 'a1a1' //fake move but won't cause errors #goodshit
    }

    //rook test needs to be same rank or same row
    if(pieceLetter.toLowerCase() == 'r'){
        for (let i in possiblePieces){
            let coords = possiblePieces[i].coords
            if (!(coords.substr(0,1)==destination.substr(0,1) || coords.substr(1,1)==destination.substr(1,1))){
                possiblePieces.splice(i,1);
            }
        }
        if (possiblePieces.length === 1){
            return possiblePieces[0].coords + move.substr(1,2)
        } else {
            return 'a1a1'
        }
    }

    //pawn test move one or two spaces forward, or diagnal. fuck en passant
    if(pieceLetter.toLowerCase() == 'p'){
        //for (let i in possiblePieces){
        //    let coords = possiblePieces[i].coords
        //    if (){
        //        possiblePieces.splice(i,1);
        //    }
        //}
        //if (possiblePieces.length === 1){
        //    return possiblePieces[0].coords + move.substr(1,2)
        //} else {
        //    return 'a1a1'
        //}
    }  
    //queen test
    //bishop test
    //knight test


    return 'a1a1'
}