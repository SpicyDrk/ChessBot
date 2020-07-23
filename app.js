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

bot.login(TOKEN).catch(err=>{
    console.log(err)
})

bot.on('ready', () => {
    console.info(`Chess Bot up and running!`);
});


let puzzleInProgress = false


bot.on('message', msg => {
    const args = msg. content.split(/ +/);
    const command = args.shift().toLowerCase();
    const RX = new RegExp('([a-h][1-8])([a-h][1-8])([q,r,n,b])?')
    const moveComand = RX.test(command)
    //board = boardGenerator.NewChessBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',lastMove,'last')
    if (!bot.commands.has(command) && !RX.test(command)) return;
    try {
        if (moveComand){
            data = bot.commands.get('move').execute(msg, [command])
            
        } else {
            data = bot.commands.get(command).execute(msg, args);
        }
        switch(data.type){
            case 'puzzle':
                if (!puzzleInProgress){
                    puzzleInProgress = true;
                    activePuzzleData = data.value
                    let fen = data.value.fen;
                    let lastMove = data.value.lastMove;
                    board = boardGenerator.NewChessBoard(fen,lastMove,'last')
                    let path = board.generateImage();
                    msg.channel.send('New Puzzle: ' + data.value.toPlay + ' to play',{files:[path]})
                }else {
                    msg.reply('Puzzle is currently active already you goober!')
                }
                break;
            case 'move':                
                if(data.value){
                    let currentMove=data.value
                    if(currentMove in activePuzzleData.lines){
                        if (activePuzzleData.lines[currentMove]=='retry'){
                            msg.channel.send(`Nice Move ${msg.author.username}, but it's not the best line! Try again!`)
                            return;
                        } else if(activePuzzleData.lines[currentMove]=='win'){
                            msg.channel.send(`You won ${msg.author.username}!`)
                            puzzleInProgress=false;
                            activePuzzleData = null
                            return;
                        }
                        msg.channel.send(`Nice move ${msg.author.username}!`)
                        path = board.preformMove(currentMove,true)
                        let opponentMove = Object.keys(activePuzzleData.lines[currentMove])[0]

                        if(activePuzzleData.lines[currentMove][opponentMove]=='win'){
                            msg.channel.send(`You won ${msg.author.username}!`, {files:[path]})
                            puzzleInProgress=false;
                            activePuzzleData = null
                            return;
                        }
                        
                        path = board.preformMove(opponentMove,true)
                        msg.channel.send('Whats next?',{files:[path]})
                        activePuzzleData.lines = activePuzzleData.lines[currentMove][opponentMove]
                        if (activePuzzleData.lines=='win'){
                            msg.channel.send(`You won ${msg.author.username}!`)
                            puzzleInProgress=false;
                            activePuzzleData=null
                            return;
                        }
                    } else {
                        
                    }
                    
                }
                break;
            case 'restart':
                console.log('restart puzzle');
                msg.channel.send('canceled Puzzle');
                puzzleInProgress=false;
                break;
            case 'hint':
                if (!puzzleInProgress){
                    return
                }
                let possibleLines = Object.keys(activePuzzleData.lines)
                for (let line of possibleLines){
                    if (activePuzzleData.lines[line]!=='retry'){
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