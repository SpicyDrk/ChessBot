const { createCanvas, loadImage } = require('canvas')
const fs = require('fs');
const { error } = require('console');


/**constants */
const cellSize = 45;
const width = 8 * cellSize ;
const height = width;
const margin= 16;
//const TextMargin = 16;

/**
 * Variables
 */
let imgs = {}

/**
 * butts 
/* (__Y__)
/* (  ) )
*/ 

/** 
 * @param {string} fen - FEN position EX 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
 * @param {string} move - move in coordinate format (i.e. f4g4)
 * @param {'last', 'next'} moveType - Either 'last' or 'next'
 * @param {string} pov - Point of view to 
 * Builds a chessboard from FEN(position only) and last move in coordinate format (i.e. f4g4)
 */
class ChessBoard{

    constructor(fen, move=null,moveType=null,pov='white'){
        this._fen = fen;
        this.move = move;
        this.moveType = moveType;
        this._boardState = [];
        this.imgPath;
        this.buildBoardState();
    }

    buildBoardState(){        
        if(this.moveType == 'next'){
            
        } 
        else 
        if(this.moveType == 'last'){
            var boardState = []

            //spreading out fen+changing order so it's easier to iterate through. might break off into another more generic function later idk :3
            let spreadFen = this._fen.split('/').slice().map(x=>x.split(''));
            for(let i=0;i<spreadFen.length; i++){
                for(let j = 0; j<spreadFen[i].length; j++){
                    if(!isNaN(spreadFen[i][j])){
                        let arrayToAdd = [...Array(spreadFen[i][j]-1).fill(1)]
                        spreadFen[i][j]=1
                        spreadFen[i].splice(j,0,...arrayToAdd)
                    }
                }
            }
            let columnsLetters = ['a','b','c','d','e','f','g','h']
            let ranks = [...Array(8).keys()].map(n=>(n+1).toString()).reverse()
            for (let i=0; i<columnsLetters.length; i++){
                let row = [];
                for(let j=0;j<ranks.length; j++){
                    let piece = isNaN(spreadFen[j][i]) ? spreadFen[j][i] : null
                    let coords = [i,j]
                    let square = new Square(piece,coords,columnsLetters[i]+ranks[j],this.move)
                    row.push(square)
                }
                boardState.push(row)
            }
            this._boardState = boardState;
        }
    }

    /**
     * @returns an image path based on boardstate
     */
    generateImage(){
        //intilize the board
        let imgData = imgs;
        let dimension =  width+2*margin
        let canvas = createCanvas(dimension, dimension)
        let context = canvas.getContext('2d')

        //background
        context.fillStyle = '#000000'
        context.fillRect(0,0,canvas.width,canvas.height)

        context.font = 'bold 12pt Menlo'
        context.fillStyle = '#F0D9B5'
        context.textBaseline = 'middle'
        context.textAlign = 'center'

        let a_h = ['a','b','c','d','e','f','g','h'];
        let n_N = [...Array(8).keys()].map(x=>x+1).reverse();
        for (let i in a_h){
            context.fillText(a_h[i],margin+i*cellSize+cellSize/2,margin/2)
            context.fillText(a_h[i],margin+i*cellSize+cellSize/2,height+1.5*margin)
        }
        for (let i in n_N){
            context.fillText(n_N[i],margin/2,margin+i*cellSize+cellSize/2)
            context.fillText(n_N[i],width+1.5*margin,margin+i*cellSize+cellSize/2)
        }




        //go through each point and draw a the rect, and a piece if needs to be drawn.
        for (let i =0; i<this.longBoardState.length; i++){
            //color that shit x/y is based from top left as orgin
            let x=this.longBoardState[i].numericCoords[0]
            let y=this.longBoardState[i].numericCoords[1]
            let color;
            switch (this.longBoardState[i].color){
                case 'light' : {color = '#F0D9B5' ; break;}
                case 'dark' : {color = '#B58863' ; break;}
                case '*light' : {color = '#CDD26A' ; break;}
                case '*dark' : {color = '#AAA23A' ; break;}
                default: '#fff'
            }      
            context.fillStyle = color;
            context.fillRect(x*cellSize+margin, y*cellSize+margin,cellSize,cellSize);

            //console.log(this.longBoardState[i].color, color, x,y,)

            //Add the imgs to the board
            let piece = this.longBoardState[i].piece
            if (piece){
                context.drawImage(imgData[piece].img,x*cellSize+margin,y*cellSize+margin,cellSize,cellSize)
            }
        }
        const buffer = canvas.toBuffer('image/png')
        let path = './img/currentBoard.png';
        fs.writeFileSync(path, buffer)
        return path;
    }

    /**
     * preforms the move on the current board state
     * @param {String} move Move as a string ie a2a3
     * @param {Boolean} genImage option to regenerate image after move
     */
    preformMove(move,genImage=false){
        
        let from = this.longBoardState.find(x=>x.coords==move.substring(0,2));
        //this should only happen during pawn promotion.     
        let promotionPiece;
        let to; 
           
        if (move.length==5){
            promotionPiece = move.slice(-1)
        }
        to = this.longBoardState.find(x=>x.coords==move.substring(2,4));

        for (let square of this.longBoardState){
            square.color = square.color.replace(/\*/g,'')
        }

        to.piece = promotionPiece ? promotionPiece : from.piece
        to.color = '*'+ to.color
        from.color = '*'+ from.color
        from.piece = null;
        this.saveLongBoardState();
        if(genImage){
            return this.generateImage()
        }
    }


    saveLongBoardState(){
        let counter=0;
        let bs = []
        let row =[]
        for (let i=0; i<this.longBoardState.length;i++){            
            row.push(this.longBoardState[i])
            counter++
            if(counter == 8){
                bs.push(row);
                row =[]
                counter=0
            }
        }
        this._boardState = bs;
    }

    /**
     * Sets the boardstate of the board
     */
    set boardState(boardState){
        this.boardState = boardState;
    }

    /**
     * @returns Board State as array of arrays
     */
    get boardState(){
        return this._boardState
    }

    /**
     * @returns Board State as a single array
     */
    get longBoardState(){
        return this._boardState.flat()
    }    

    /**
     * @returns Board State in fen notation
     */
    get fen(){
        return this._fen
    }
    //get
}

class Square {
    constructor(piece=null,numericCoords=null,coords=null,lastMove=null){
        this.coords = coords; //chess notation of coords
        this.mathCoords;
        this.occupied = piece ? true : false; //boolean if occupied
        this.piece = piece; //piece on this square
        this.color = this.findColor(coords,lastMove); //light(+) or dark(+)
        this.numericCoords = numericCoords; //ie [0,0],[1,5]
    }
    findColor(coords,lastMove){
        let c = coords.split('')
        let numLetter = c[0].charCodeAt(0)-96
        let rank = c[1]
        let color = ''
        if(coords == lastMove.substring(0,2) || coords == lastMove.substring(2)){
            color +='*'
        }
        if(numLetter % 2 == rank % 2) {
            color += 'dark'
        } else {
            color += 'light'
        }
        return color       
    }
}

exports.NewChessBoard= (fen,lastMove,nextMove)=>{
    return new ChessBoard(fen,lastMove,nextMove)
}
 
function drawCurrentImg(canvas){
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync('./board.png', buffer)    
}

loadImage('./img/bp.png')
.then(img=>{
    imgs.p={'id':'p',
    'img':img,
    'desc':"Black Pawn"}
    return loadImage('./img/bb.png')
})
.then(img=>{
    imgs.b={'id':'b',
    'img':img,
    'desc':"Black Bishop"}
    return loadImage('./img/bk.png')
})
.then(img=>{
    imgs.k={'id':'k',
    'img':img,
    'desc':"Black King"}
    return loadImage('./img/bn.png')
})
.then(img=>{
    imgs.n={'id':'n',
    'img':img,
    'desc':"Black Knight"}
    return loadImage('./img/bq.png')
})
.then(img=>{
    imgs.q={'id':'q',
    'img':img,
    'desc':"Black Queen"}
    return loadImage('./img/br.png')
})
.then(img=>{
    imgs.r={'id':'r',
    'img':img,
    'desc':"Black Rook"}
    return loadImage('./img/wp.png')
})
.then(img=>{
    imgs.P={'id':'P',
    'img':img,
    'desc':"White Pawn"}
    return loadImage('./img/wb.png')
})
.then(img=>{
    imgs.B={'id':'B',
    'img':img,
    'desc':"White Bishop"}
    return loadImage('./img/wk.png')
})
.then(img=>{
    imgs.K={'id':'K',
    'img':img,
    'desc':"White King"}
    return loadImage('./img/wn.png')
})
.then(img=>{
    imgs.N={'id':'N',
    'img':img,
    'desc':"White Knight"}
    return loadImage('./img/wq.png')
})
.then(img=>{
    imgs.Q={'id':'Q',
    'img':img,
    'desc':"White Queen"}
    return loadImage('./img/wr.png')
})
.then(img=>{
    imgs.R={'id':'R',
    'img':img,
    'desc':"White Rook"}
    //a=this.NewChessBoard('rnbqkbnr/pp4pp/8/2pppp2/8/P7/1PPPPPPP/RNB1KBNR','a2a3','last')
    //a.preformMove('a3a4',true)
    //a.preformMove('a4a5',true)
    //a.preformMove('a5a6',true)
    //a.preformMove('a6b7',true)
    //console.log('t')
})                                                     
.catch(err=>{
    console.log(err)
})
.then(()=>{

})

