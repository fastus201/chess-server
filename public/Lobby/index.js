import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

import { createChessboard, drawPieces, handleKeyPress,animateMovePiece, setElementBackground, eatPiece,goForwardMove } from "../Game/graphic.js";
import { analysePieceMove, analysePieceEat } from "../Game/clientGameLogic.js"

import Game from "../Game/Classes/Game.js";

const socket = io();
let myNickname;

//These values may change based on client screen
const measures = {
    sizeCella: 100,
    transition_time: 225
}
const chessboardStyle = 0;  //default value

/**
 * @typedef {{myColor:String,measures:{width:Number,height:Number,sizeCella:Number,transition_time:Number},info:{x:String,y:String,element:HTMLElement},currentSelectedSquare:[[Number],[Number]],currentMossa:Number,positions:{white:Number,black:Number},chessboardStyle:{value:Number,format:String},eatenPieces:{white:Array,black:Array},piecesValue:{String}}} ClientGame Contiene le informazioni aggiuntive per scacchi lato client
 */
export const ClientGame = {};

//Called when your opponent has accepted the game you were looking for
socket.on("gameStarting", (/**@type {{noplayer:true|undefined,opponent:String,color:String}}*/response)=>{
    setGame(myNickname, response.opponent, response.settings, response.color);
});



window.onload = () =>{
    document.getElementById("start-game-btn").addEventListener("click",lookForGame);
}
//Funzione per cercare una  partita
function lookForGame() {
    //get my nickname
    myNickname = document.getElementById("nickname").value;

    socket.emit("lookForGame", myNickname, (/**@type {{noplayer:true|undefined,opponent:String,color:String,settings:{width:Number,height:Number,mode:Number}}}*/response)=>{
        if(!response.noplayer)  //if i have found a game
            setGame(myNickname,response.opponent,response.settings,response.color);
        //if not i just wait for another player
    });
}

/**
 * @description Function called when the game is going to start
 * @param {String} me My nickname for the game
 * @param {String} opponent The nickname of my enemy
 * @param {{width:Number,height:Number}} options An object that contains important information about this chess game
 * @param {String} color My color
 */
function setGame(me,opponent,options,color) {
    //First, based on my options and color i create a client object that helps me
    let gameClientInfo = {
        myColor:color,  //Save my color (So i know which pieces i can move)
        measures: {
            width:options.width,
            height:options.height,
            sizeCella:measures.sizeCella,
            transition_time:measures.transition_time
        },
        info: {},    //I save the coords of the piece clicked + its html element  
        currentSelectedSquare: [],//I save the current square colored in the board
        currentMossa: 0, //Default value : 0, this will change if i use arrows keys to go back in the game
        positions: { //where is white/black located in the screen
            white: color == "white" ? "down" : "up",    //your color is always on the bottom
            black: color == "black" ? "down" : "up"
        },
        chessboardStyle: {
            value: chessboardStyle,
            format: [".png", ".svg"][chessboardStyle]
        },
        eatenPieces: {
            white: [],   //array with the pieces eaten (white means that a white piece has been eaten by a BLACK piece)
            black: []
        },
        piecesValue: {  //default values of the piece
            Pawn: 1,
            Knight: 3,
            Bishop: 3,
            Rook: 5,
            Queen: 9,
            King: Infinity
        }
    }



    //Make my name and enemy name visible on screen
    document.getElementById(gameClientInfo.positions[color]+"-name").innerText = me;
    document.getElementById(gameClientInfo.positions[color == "white" ? "black":"white"] + "-name").innerText = opponent;
    setUpStyle(gameClientInfo.measures);    /*Setup colors and style*/

    //Then i have to create the Game object that represent my whole game
    let game = new Game(options.width, options.height, options.mode,gameClientInfo.positions);

    createChessboard(game, gameClientInfo);    //create html elements of square / text

    drawPieces(game, gameClientInfo);  //create html pieces element

    window.addEventListener("keydown", handleKeyPress.bind(null, game, gameClientInfo));    //add event listener that i will use for left/right arrow

    document.getElementById("game-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";


    //Called when your enemy moves a piece
    socket.on("movePieceFromServer", (data) => {
        //It means that you are looking at old Moves
        while(gameClientInfo.currentMossa != 0)
            goForwardMove(game,gameClientInfo);
        //Add colored square
        gameClientInfo.currentSelectedSquare.push([data.x,data.y]);
        setElementBackground(data.x,data.y,0);

        if(data.move.upgrade)
            console.log(data);
        if(data.eat){
            analysePieceEat(data.x,data.y,data.move,game,gameClientInfo,"Server");
            setTimeout(eatPiece, gameClientInfo.measures.transition_time - 25, document.getElementById("ped"+data.move.y+"."+data.move.x), gameClientInfo);
        }
        
        else
            analysePieceMove(data.x,data.y,data.move,game,gameClientInfo,"Server");
        
        animateMovePiece(data.move.x, data.move.y, document.getElementById("ped"+data.y+"."+data.x), "move", gameClientInfo);
    });
}

function setUpStyle(measures) {
    const firstColors = ["#EBECD0", "#84774f"];
    const secondColors = ["#779954", "#dbe3ad"];
    const lightColors = ["#F5F682", "#b08912"]
    const darkColors = ["#B9CA43", "#dcbe6a"];

    document.querySelector(":root").style.setProperty("--height", measures.height);
    document.querySelector(":root").style.setProperty("--width", measures.width);
    document.querySelector(":root").style.setProperty("--sizeCella", measures.sizeCella + "px");
    document.querySelector(":root").style.setProperty("--delay", measures.transition_time / 1000 + "s");

    //imposto i colori
    document.querySelector(":root").style.setProperty("--color1", firstColors[chessboardStyle]);
    document.querySelector(":root").style.setProperty("--color2", secondColors[chessboardStyle]);
    document.querySelector(":root").style.setProperty("--selected-light", lightColors[chessboardStyle]);
    document.querySelector(":root").style.setProperty("--selected-dark", darkColors[chessboardStyle]);
}


/**
 * @description Function that tells to the server that i have moved a piece
 * @param {Number} startY Where does the piece start to move
 * @param {Number} startX where does the piece start to move
 * @param {{x:Number,y:Number,castle:Boolean | undefined,rook:{x:Number,y:Number,endX:Number}|undefined,enPassantPiece:Piece | undefined,upgrade:Boolean | undefined}} move Contains chess move that has been done
 * @param {Boolean} eat If there's been a eat move
*/
export function movePieceToServer(startX,startY,move,causes,eat) {
    socket.emit("movePiece",{x:startX,y:startY,move:move,causes:causes,eat:eat});
}