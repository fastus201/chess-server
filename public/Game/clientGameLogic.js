import { upgradePiece, checkAfterMove, animateMovePiece, updateEatenPieces, updateScore,createUpgradePiece } from "./graphic.js";    
import { movePieceToServer } from "../Lobby/index.js";

import { ClientGame } from "../Lobby/index.js"; //Import type ClientGame





/**
 * @description Funzione che ritorna se è il turno di un determinato giocatore
 * @param {String} color Colore del giocatore
 * @param {Number} turno Turno attuale
 * @param {Number} currentMossa A che punto se arrivato con le mosse (se sei andato indietro nel tempo con le mosse)
 * @returns {Boolean} Se il turno è tuo
 */
export function isMyTurn(color,turno,currentMossa) {
        if(currentMossa != 0 )
            return false;
        if(color == "white")
            return turno == 0; 
        return turno == 1
    }

/**
 * @description Funzione che ritorna se puoi muovert in un punto
 * @param {Number} endX Coordinata x dove il pezzo può muoversi
 * @param {Number} endY Coordinata y dove il pezzo può muoversi
 * @param {Game} game Oggetto game che contiene tutta la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 * @returns {Promise} 0-> non puoi muoverti 1-> puoi muoverti 2-> puoi muoverti mangiando
 */
export async function checkForPossibleMove(endX, endY, game, gameClientInfo) {
    let startX = gameClientInfo.info.x.split("px")[0] / gameClientInfo.measures.sizeCella;
    let startY = gameClientInfo.info.y.split("px")[0] / gameClientInfo.measures.sizeCella;


    if (game.chessboard[startY] == undefined || game.chessboard[startY][startX] == undefined)
        return new Promise(resolve => resolve(0));


    let allPossibleMoves = game.chessboard[startY][startX].returnPossibleMoves(game.chessboard);

    let allPossibleEats = game.chessboard[startY][startX].returnPossibleEats(game.chessboard);

    allPossibleMoves = game.filterPossibleMoves(allPossibleMoves, game.chessboard[startY][startX]);

    allPossibleEats = game.filterPossibleMoves(allPossibleEats, game.chessboard[startY][startX]);

    //controllo eventuali arrochhi
    game.checkForCastle(allPossibleMoves, game.chessboard[startY][startX]);


    for (let move of allPossibleMoves) {
        //controllo se le trovo coordiante che coincidino
        if (move.x == endX && move.y == endY) {
            //se il campo è vuoto, ti sposti normalmente
            if (game.chessboard[endY][endX] == 0) {
                if(!gameClientInfo.showPossibleMoves){
                    let endResult = await analysePieceMove(startX,startY,move,game,gameClientInfo);
                    //i also have to tell to the server the move that i have done (only if it is your turn)
                    movePieceToServer(startX,startY,move, endResult,false);
                }
                return new Promise(resolve => resolve(1));

            }

        }
    }
    //per le mosse di mangiata
    for (let eat of allPossibleEats) {
        if (eat.x == endX && eat.y == endY) {
            if (!gameClientInfo.showPossibleMoves) {
                let endResult = await analysePieceEat(startX,startY,eat,game,gameClientInfo);
                //i also have to tell to the server the move that i have done
                movePieceToServer(startX, startY, eat, endResult,true);
            }
            return new Promise(resolve => resolve(2));

        }
    }
    return new Promise(resolve => resolve(0));

}
    
/**
 * @description Function that given a chess move, analyse it and do what is needed
 * @param {Number} startY Where does the piece start to move
 * @param {Number} startX where does the piece start to move
 * @param {{x:Number,y:Number,castle:Boolean | undefined,rook:{x:Number,y:Number,endX:Number}|undefined,enPassantPiece:Piece | undefined,upgrade:Boolean | undefined}} move Contains chess move that has been done
 * @param {Game} game Oggetto game che contiene tutta la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 * @param {"Server"|undefined} functionCaller Who is calling this function 
 * @returns {Promise} Returns what this move caused
*/
export async function analysePieceMove(startX,startY,move,game,gameClientInfo,functionCaller) {
    let endY = move.y, endX = move.x;
    //aggiungo la parte dell'arroco (è direttamente salvato nella se quest'ultima si tratta di un arrocco)
    if (move.castle) {
        //se POSSO ARROCCARE, oltre a muovere il re devo anche muovere la torre
        let rookCoord = move.rook;
        let res = game.movePiece(startY, startX, endY, endX, "castle", rookCoord);
        animateMovePiece(rookCoord.endX, rookCoord.y, document.getElementById("ped" + rookCoord.y + "." + rookCoord.x), "not-modify", gameClientInfo);
        checkAfterMove(res, endY, endX, game,gameClientInfo);
        return new Promise(resolve=>resolve(res));
    }
    //se è presente l'en passant, muovo normalmente il pedone ma elimino quello da mangiare
    else if (move.enPassantPiece != undefined) {
        let color = game.chessboard[startY][startX].color == "white" ? "black" : "white";
        let res = game.movePiece(startY, startX, endY, endX, "en-passant", move.enPassantPiece);
        gameClientInfo.eatenPieces[color].push(["Pawn", 1]);
        updateEatenPieces(gameClientInfo.eatenPieces[color], color, gameClientInfo.positions, gameClientInfo.chessboardStyle);
        updateScore(gameClientInfo.eatenPieces, gameClientInfo.positions);
        //aggiorno i pezzi mangiati
        document.getElementById("ped" + move.enPassantPiece.y + "." + move.enPassantPiece.x).remove();
        checkAfterMove(res, endY, endX, game,gameClientInfo);
        return new Promise(resolve => resolve(res));
    }
    else if (move.upgrade) {
        return computeUpgrade(startX, startY, endX,endY,move, game, gameClientInfo, functionCaller);
    }
    //se non devo fare niente di speciale
    else {
        //muovo il pezzo
        let res = game.movePiece(startY, startX, endY, endX, false);

        checkAfterMove(res, endY, endX, game,gameClientInfo);
        return new Promise(resolve => resolve(res));
    }

}

/**
 * @description Function that given a chess move (EAT), analyse it and do what is needed
 * @param {Number} startY Where does the piece start to move
 * @param {Number} startX where does the piece start to move
 * @param {{x:Number,y:Number,upgrade:Boolean | undefined}} eat Contains chess EAT that has been done
 * @param {Game} game Oggetto game che contiene tutta la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 * @param {"Server"|undefined} functionCaller Who is calling this function  
 * @returns {Promise} Returns what this eat caused 
*/
export async function analysePieceEat(startX, startY, eat, game, gameClientInfo,functionCaller) {
    let endY = eat.y,endX = eat.x;
    if (eat.upgrade) {
        return computeUpgrade(startX,startY,endX,endY,eat,game,gameClientInfo,functionCaller);
    }
    else {
        let res = game.movePiece(startY, startX, endY, endX);
        checkAfterMove(res, endY, endX, game,gameClientInfo);
        return new Promise(resolve => resolve(res));
    }
}
/**
 * @description Function that manage what happens when a piece has to be upgraded
 * @param {Number} startY Where does the piece start to move
 * @param {Number} startX where does the piece start to move
 * @param {Number} endX Where does the piece arrives
 * @param {Number} endY Where does the piece arrives
 * @param {{x:Number,y:Number,upgrade:Boolean | undefined}} move Contains chess move that has been done
 * @param {Game} game Oggetto game che contiene tutta la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 * @param {"Server"|undefined} functionCaller Who is calling this function 
 */
async function computeUpgrade(startX,startY,endX,endY,move,game,gameClientInfo,functionCaller) {
    let pieceChosen;
    if (functionCaller == "Server") {  //Se la funzione è stata chiamata dal server, so già che pezzo ha scielto l'utente
        pieceChosen = move.pieceChosen;
        let pieceToDelete = document.getElementById("ped" + endY + "." + endX);   //N.B this exists if i am doing and eat move
        let pawn = document.getElementById("ped" + startY + "." + startX);
        animateMovePiece(endX, endY, pawn, "move", gameClientInfo);
        let color = game.chessboard[startY][startX].color;
        setTimeout(() => {
            pawn.remove();
            createUpgradePiece(move.x, color, pieceChosen, gameClientInfo, game);
            if (pieceToDelete != null)
                pieceToDelete.remove();
        }, gameClientInfo.measures.transition_time - 20);
    }
    else
        pieceChosen = await upgradePiece(game, game.chessboard[startY][startX].color, startX, startY, move.x, gameClientInfo);
    let res = game.movePiece(startY, startX, endY, endX, "upgrade", { piece: pieceChosen });  //muove il pezzo nel campo
    move.pieceChosen = pieceChosen; //Salvo nella mossa il pezzo che ho scelto (Mi servirà per comunicarlo al server)
    checkAfterMove(res, endY, endX, game,gameClientInfo);
    return new Promise(resolve => resolve(res));
}