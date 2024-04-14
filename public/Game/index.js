import Game from "./Classes/Game.js";

import {createChessboard,drawPieces,handleKeyPress} from "./graphic.js";


const measures = {
    width:8,
    height:8,
    sizeCella:100,
    transition_time:225
}
const chessboardStyle = 1;

const firstColors = ["#EBECD0","#84774f"];
const secondColors = ["#779954","#dbe3ad"];
const lightColors = ["#F5F682","#b08912"]
const darkColors = ["#B9CA43","#dcbe6a"];

document.querySelector(":root").style.setProperty("--height", measures.height);
document.querySelector(":root").style.setProperty("--width", measures.width);
document.querySelector(":root").style.setProperty("--sizeCella", measures.sizeCella +"px");
document.querySelector(":root").style.setProperty("--delay", measures.transition_time/1000 + "s");

//imposto i colori
document.querySelector(":root").style.setProperty("--color1", firstColors[chessboardStyle]);
document.querySelector(":root").style.setProperty("--color2", secondColors[chessboardStyle]);
document.querySelector(":root").style.setProperty("--selected-light", lightColors[chessboardStyle]);
document.querySelector(":root").style.setProperty("--selected-dark", darkColors[chessboardStyle]);


/**
 * @param {{measures:{width:Number,height:Number,sizeCella:Number,transition_time:Number},info:{x:String,y:String,element:HTMLElement},currentSelectedSquare:[[Number],[Number]],currentMossa:Number,positions:{white:Number,black:Number},chessboardStyle:{value:Number,format:String},eatenPieces:{white:Array,black:Array},piecesValue:{String}}} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 */
function loadGame(){
    let gameClientInfo = {
        measures:measures,
        info: {},    //salvo le coordinate attuale della cella che hai premuto e l'elemento html
        currentSelectedSquare: [],//salvo i pezzi colorati al momento
        currentMossa: 0, //di default currentMossa è uguale a 0, //mi servirà per andare avanti/indietro con le mosse
        positions:{ //da che lato è presente il bianco o il nero nello schermo (sopra/sotto)
            white:"down",
            black:"up"
        },
        chessboardStyle:{
            value:chessboardStyle,
            format:[".png",".svg"][chessboardStyle]
        },
        eatenPieces:{
            white:[],   //il colore dei pezzi mangiati, sono stati mangiati quindi da un colore opposto
            black:[]
        },
        piecesValue:{
            Pawn:1,
            Knight:3,
            Bishop:3,
            Rook:5,
            Queen:9,
            King:Infinity
        }
    }

    let game = new Game(gameClientInfo.measures.width,gameClientInfo.measures.height, 0); //creo l'oggeto Game
    
    createChessboard(game,gameClientInfo);    //creo il div della scacchiera

    drawPieces(game, gameClientInfo);  // posso posizionare le pedine nel punto giusto

    window.addEventListener("keydown", handleKeyPress.bind(null, game, gameClientInfo));

}













