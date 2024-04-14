import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

import { createChessboard, drawPieces, handleKeyPress,animateMovePiece, setElementBackground, eatPiece,goForwardMove, showPossibleMoves } from "../Game/graphic.js";
import { analysePieceMove, analysePieceEat } from "../Game/clientGameLogic.js"

import Game from "../Game/Classes/Game.js";

export let myModal = new bootstrap.Modal(document.getElementById('endModal'), {});



const socket = io();
let myNickname;

//These values may change based on client screen
const measures = {
    sizeCella: 100,
    transition_time: 225
}
let chessboardStyle = 0;  //default value = 0

/**
 * @typedef {{myName:String,myColor:String,stopped:Boolean,ended:Boolean,modalOpen:Boolean,showPossibleMoves:Boolean,measures:{width:Number,height:Number,sizeCella:Number,transition_time:Number},info:{x:String,y:String,element:HTMLElement},currentSelectedSquare:[[Number],[Number]],currentMossa:Number,positions:{white:Number,black:Number},chessboardStyle:{value:Number,format:String},eatenPieces:{white:Array,black:Array},piecesValue:{String}}} ClientGame Contiene le informazioni aggiuntive per scacchi lato client
 */
export const ClientGame = {};

//Called when your opponent has accepted the game you were looking for
socket.on("gameStarting", (/**@type {{noplayer:true|undefined,opponent:String,color:String}}*/response)=>{
    setGame(myNickname, response.opponent, response.settings, response.color);
});



window.onload = () =>{
    document.getElementById("start-game-btn").addEventListener("click",lookForGame);
    document.getElementById("change-btn").addEventListener("click",changeStyle);
    setUpStyle(-1);

}
//Funzione per cercare una  partita
function lookForGame() {
    //get my nickname
    myNickname = document.getElementById("nickname").value;
    if(myNickname == "")
        return;

    document.getElementById("btn-text").style.display = "none";
    document.getElementById("spinner").style.display = "inline-block";
    document.getElementById("nickname").setAttribute("disabled",true);
    this.setAttribute("disabled",true);
    socket.emit("lookForGame", myNickname, (/**@type {{noplayer:true|undefined,opponent:String,color:String,settings:{width:Number,height:Number,mode:Number}}}*/response)=>{
        if(!response.noplayer)  //if i have found a game
            setGame(myNickname,response.opponent,response.settings,response.color);
        //if not i just wait for another player
    });
}

function changeStyle() {
    chessboardStyle = !chessboardStyle | 0;
    setUpStyle(-1);
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
        myName:myNickname,
        myColor:color,  //Save my color (So i know which pieces i can move)
        stopped: false,
        ended: false,
        modalOpen:false,
        showPossibleMoves:false,
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
    adjustMeasure();



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


    //To adjust game sizes
    window.onresize = adjustMeasure;
   

    function adjustMeasure() {
        let width = window.innerWidth;
        let height = window.innerHeight;


        let maxWidth = gameClientInfo.measures.sizeCella * gameClientInfo.measures.width;
        
        while (maxWidth >= width - 30) {
            gameClientInfo.measures.sizeCella --;
            maxWidth = gameClientInfo.measures.sizeCella * gameClientInfo.measures.width;
        }
        while (maxWidth <= width - 30 && width < 800) {
            gameClientInfo.measures.sizeCella++;
            maxWidth = gameClientInfo.measures.sizeCella * gameClientInfo.measures.width;
        }
        let maxHeight = gameClientInfo.measures.sizeCella * gameClientInfo.measures.height;
        while (maxHeight >= height - 125) {
            gameClientInfo.measures.sizeCella --;
            maxHeight = gameClientInfo.measures.sizeCella * gameClientInfo.measures.height;
        }
        while (maxHeight <= height - 125 && height < 675) {
            gameClientInfo.measures.sizeCella++;
            maxHeight = gameClientInfo.measures.sizeCella * gameClientInfo.measures.height;
        }
        
        
        
    
        document.querySelector(":root").style.setProperty("--sizeCella", gameClientInfo.measures.sizeCella + "px");
    }


    //Called when your enemy moves a piece
    socket.on("movePieceFromServer", (data) => {
        //It means that you are looking at old Moves
        while(gameClientInfo.currentMossa != 0)
            goForwardMove(game,gameClientInfo);
        //Add colored square
        //If one square is already colored, delete it, if 3 are, delete the last one
        if (gameClientInfo.currentSelectedSquare.length == 1 || gameClientInfo.currentSelectedSquare.length == 3) {
            setElementBackground(gameClientInfo.currentSelectedSquare[gameClientInfo.currentSelectedSquare.length - 1][0], gameClientInfo.currentSelectedSquare[gameClientInfo.currentSelectedSquare.length - 1][1], 1);
            gameClientInfo.currentSelectedSquare.pop();
        }
        gameClientInfo.currentSelectedSquare.push([data.x,data.y]);
        setElementBackground(data.x,data.y,0);

        if(data.eat){
            analysePieceEat(data.x,data.y,data.move,game,gameClientInfo,"Server");
            setTimeout(eatPiece, gameClientInfo.measures.transition_time - 25, document.getElementById("ped"+data.move.y+"."+data.move.x), gameClientInfo);
        }
        
        else
            analysePieceMove(data.x,data.y,data.move,game,gameClientInfo,"Server");
        
        animateMovePiece(data.move.x, data.move.y, document.getElementById("ped"+data.y+"."+data.x), "move", gameClientInfo);
        if(gameClientInfo.showPossibleMoves)
            gameClientInfo.showPossibleMoves = false;
    });


    socket.on("winForDisconnection",()=>{
        
        gameClientInfo.ended = true;
        showEndGame(["disconnection",opponent],gameClientInfo,gameClientInfo.myColor);
    });


    socket.on("disconnect", () => {
        gameClientInfo.ended = true;
        showEndGame(["yourDisconnect",gameClientInfo.myName],gameClientInfo);
    })


}

/**
 * @description Function called to show end game graphics
 * @param {String[]} reasons How game ended
 * @param {ClientGame} gameClientInfo Client information about game
 * @param {String} color Color of the winner of the game
 */
export function showEndGame(reasons,gameClientInfo,color){
    setTimeout(() => {
        let mainString = "Draw";
        if(reasons[0] == "checkmate"){
            //vedo se sei il vincitore
            let winner = color == gameClientInfo.myColor;
            if(!winner){
                mainString = color.charAt(0).toUpperCase()+color.slice(1) + " has won!";
                document.getElementById("all-modal-content").style.backgroundColor = "var(--color1)";
            }
            else{
                document.getElementById("all-modal-content").style.backgroundColor = "var(--color2)";
                mainString = "You won!";
            }
            document.getElementById("endGame-reason").innerText = "Checkmate";
        }
        else if(reasons[0] == "draw"){
            document.getElementById("endGame-reason").innerText = reasons[1];
            document.getElementById("all-modal-content").style.backgroundColor = "var(--color1)";
        }
        else if(reasons[0] == "yourDisonnect"){

            let color = (gameClientInfo.myColor == "white" ? "black" : "white");
            mainString = color.charAt(0).toUpperCase() + color.slice(1) + " has won!";
            document.getElementById("all-modal-content").style.backgroundColor = "var(--color1)";
            document.getElementById("endGame-reason").innerHTML = "You have been disconnected from the game!";
        }//If someone disconnects ( Not you)
        else{

            mainString = "You won!";
            document.getElementById("all-modal-content").style.backgroundColor = "var(--color2)";
            document.getElementById("endGame-reason").innerHTML = "<i>" + reasons[1] + "</i>" + " disconnects";
        }
        document.getElementById("main-result").innerText = mainString;
        myModal.show();
        gameClientInfo.modalOpen = true;



    }, gameClientInfo.measures.transition_time+50);
}



function setUpStyle(measures) {
    const firstColors = ["#EBECD0", "#84774f"];
    const secondColors = ["#779954", "#dbe3ad"];
    const lightColors = ["#F5F682", "#b08912"]
    const darkColors = ["#B9CA43", "#dcbe6a"];
    if(measures != -1){
        document.querySelector(":root").style.setProperty("--height", measures.height);
        document.querySelector(":root").style.setProperty("--width", measures.width);
        document.querySelector(":root").style.setProperty("--sizeCella", measures.sizeCella + "px");
        document.querySelector(":root").style.setProperty("--delay", measures.transition_time / 1000 + "s");
    }
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