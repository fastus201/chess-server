import Piece from "./Pieces/Piece.js";
import Pawn from "./Pieces/Pawn.js";
import Knight from "./Pieces/Knight.js";
import Bishop from "./Pieces/Bishop.js";
import Rook from "./Pieces/Rook.js";
import Queen from "./Pieces/Queen.js";
import King from "./Pieces/King.js";

import Mossa from "./Mossa.js";

//la grandezza delle scacchiere default è 8 x 8
//di base il nero è SOPRA e il bianco è SOTTO

//corrispondeza numeri/pezzi:
/*
1 = pedone
2 = cavalli
3 = alfieri
4 = torri
5 = regina
6 = re
*/

/**
 * @description Classe che crea la partita a scacchi
 * @author Botta Fabio <fabiobotta4@gmail.com>
 */
export default class Game {
    #width;
    #height;
    #gameMode;
    #chessboard;
    #players;
    #uniqueids;
    #positions;
    /**
     * tutte le mosse fatte fin'ora
     * @type {Mossa[]} 
     */
    #mosse;
    /**
     * 
     * @param {number} width indica la grandezza della scacchiera
     * @param {number} height indica l'altezza della scacchiera 
     * @param {number} gameMode indica la modalità di gioco, ovvero come sono disposti i pezzi (la default è 0, per eventuali aggiunte future)
     * @param {{white:"up"|"down",black:"down"|"up"}} positions Come sono posizionati i colori nella scacchiera
     */
    constructor(width, height, gameMode, positions) {
        this.#width = width;
        this.#height = height;
        this.#gameMode = gameMode;
        this.#positions = positions;

        this.#chessboard = this.#createBoard();
        this.#players;

        this.#mosse = [];
        this.turno = 0;
        /**
         * Tiene conto delle pedine generate nella partita
         * @type {Number}
         */
        this.#uniqueids;
        /**
         * Serve a capire quando la partita è stoppata e non si può muvoere (es. quando devi upgrade un pezzo)
         * @type {Boolean}
         */
        this.stopped = false;

    }

    /**
     * @description Metodo che crea la matrice effettiva di gioco
     * @returns {Piece[][]} matrice che rappresenta il campo formato dagli oggeti specifici per ogni Pedina
     */
    #createBoard() {
        const board = [];
        let originalBoard = this.#getDisposition();  //ricavo la disposzione per cui mettere i pezzi
        //Se la posizione è sopra, reverso tutta la matrice
        if(this.#positions.white == "up"){
            originalBoard.forEach(row=>row.reverse());
            let newArray = [];
            for (let i = this.width - 1; i >= 0; --i)
                newArray.push(originalBoard[i]);
            originalBoard = newArray;
            console.log(originalBoard);
        }
        let uniqeids = 1;
        for (let i = 0; i < this.#height; ++i) {
            board[i] = [];  //creo un vettore ad ogni riga, in modo da creare una matrice
            for (let j = 0; j < this.#width; ++j) {

                //in base al numero creo una pedina diversa
                let color;
                if (i < this.#height / 2)  //il colore dipende dalla posizione dei colori nella matrice e da dove mi trovo adesso a generare
                    color = this.#positions.white == "down" ? "black" : "white";
                else
                    color = this.#positions.white == "down" ? "white" : "black";


                if (originalBoard[i][j] == 1)
                    board[i][j] = new Pawn(color, j, i, ++uniqeids, this.#positions);
                else if (originalBoard[i][j] == 2)
                    board[i][j] = new Knight(color, j, i, ++uniqeids);
                else if (originalBoard[i][j] == 3)
                    board[i][j] = new Bishop(color, j, i, ++uniqeids);
                else if (originalBoard[i][j] == 4)
                    board[i][j] = new Rook(color, j, i, ++uniqeids);
                else if (originalBoard[i][j] == 5)
                    board[i][j] = new Queen(color, j, i, ++uniqeids);
                else if (originalBoard[i][j] == 6)
                    board[i][j] = new King(color, j, i, ++uniqeids);
                else
                    board[i][j] = 0;

            }
        }
        this.#uniqueids = uniqeids;
        return board;
    }
    /**
     * @description Metodo che server per capire che tipo di partita andremo a giocare e quale campo quindi utilizzare
     * @returns {Number[][]} matrice che rappresenta la versione semplificata del campo di scacchi
     */
    #getDisposition() {
        const defaultGame = [
            [4, 2, 3, 5, 6, 3, 2, 4],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [4, 2, 3, 5, 6, 3, 2, 4],
        ];
        /*
        const defaultGame = [
            [0, 0, 0, 0, 6, 0, 0, 0],
            [0, 0, 0, 0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 5, 0, 0, 0],
            [0, 0, 0, 0, 0, 2, 1, 0],
            [0, 0, 0, 6, 0, 2, 0, 0],
        ];*/
        //per ora ho solo queste modalità
        switch (this.#gameMode) {
            case 0:
                return defaultGame;
            default:
                return defaultGame;;
        }
    }

    //muove i pezzi nella scacchiera
    /**
     * @description Metodo che muove una pedina nel campo
     * @param {number} startY  la y di partenza del pezzo
     * @param {number} startX la x di partenza del pezzo
     * @param {number} endY  la y finale de pezzo
     * @param {number} endX  la x finale del pezzo
     * @param {String} specialMove se questa mossa ne ha un'altra speciale
     * @param {{x:Number,y:Number}} [object] parametro opzionale che dipende dalla specialMove
     * @returns {String[]} cosa ha causato questa mossa, checkmate, draw .. + la causa extra, come patta per materiale insufficente, stealmate
     */
    movePiece(startY, startX, endY, endX, specialMove, object) {
        //tolgo l'eventuale mossa di en-passant presente
        this.#removeEnPassant();
        //calcolo la pedina protagonista del movimento
        let pedina = this.#chessboard[startY][startX];
        //prima di muovere il pezzo, aggiungo questa mossa al vettore con tutte le mosse fatte
        if (specialMove == "castle") {
            //se devo arroccare, oltre a muovere il re devo anche muovere la TORRE
            this.#chessboard[object.y][object.x].movePieceInMatrix(object.endX, object.y, this.#chessboard, true);
            this.#mosse.unshift(new Mossa(startX, startY, endX, endY, pedina, this.#chessboard[endY][endX], "castle", object));
        }
        else if (specialMove == "en-passant") {
            //se devo fare l'en-passant, devo togliere dal campo il pezzo che mangio
            this.#chessboard[object.y][object.x] = 0;
            this.#mosse.unshift(new Mossa(startX, startY, endX, endY, pedina, object, false));
        }
        else if (specialMove == "upgrade")
            this.#mosse.unshift(new Mossa(startX, startY, endX, endY, pedina, this.#chessboard[endY][endX], "upgrade", { upgrade: object.piece }));
        else
            this.#mosse.unshift(new Mossa(startX, startY, endX, endY, pedina, this.#chessboard[endY][endX], "none"));
        pedina.movePieceInMatrix(endX, endY, this.#chessboard, true);
        //se devo fare l'upgrade modifico il campo creando un nuovo pezzo
        if (specialMove == "upgrade") {
            this.#chessboard[endY][endX] = new (eval(object.piece))(this.#chessboard[endY][endX].color, endX, endY, this.#uniqueids++);  //eval-> server per creare una oggetto prendendo la classe come stringa
            if (this.#chessboard[endY][endX].moved != undefined)
                this.#chessboard[endY][endX].moved = true;
        }
        //dopo che muovi il pezzo controllo se sei hai fatto scacco matto o se c'è stata patta

        this.#checkAfterMove(pedina, this.#mosse[0]);
        //cambio il turno
        this.turno = !this.turno | 0;

        /*priorità per finire un game
            1) checkmate - stealmate
            2) draw = insufficient material
            3) draw = 50 moves
            4) draw = 3 ripetition
        */
        return [this.#mosse[0].causes, this.#mosse[0].extraCauses];
    }
    /**
     * @description Metodo che controlla cosa succede dopo che un pezzo si muove
     * @param {Piece} pedina Il pezzo che ha effettuato la mossa
     * @param {Mossa} mossa Oggetto che contiene la mossa attuale, va completata per inserire cosa ha causato questa mossa 
     */
    #checkAfterMove(pedina, mossa) {
        //allora, se NON posso muovere neanche un pezzo, potrebbe essere sia patta o MATTO, dipende se se sotto scacco
        let isScacco = this.findScacco(pedina.y, pedina.x);
        mossa.causes = (isScacco || 0) ? "check" : "none";
        if (isScacco)
            console.log("SCACCO");
        if (this.canOtherPiecesMove(pedina.color)) {
            if (!isScacco) {
                mossa.causes = "draw";
                mossa.extraCauses = "Stalemate";
            }
            else {
                mossa.winner = ["white", "black"][this.turno];
                mossa.causes = "checkmate";
            }
            return;
        }
        //ci sono ulteriori ragioni per cui il game potrebbe finire come per materiale insufficiente
        let allWhitePieces = this.getAllPieces("white");
        let allBlackPieces = this.getAllPieces("black");

        let whiteResult = this.#isInsufficientMaterial(allWhitePieces, allBlackPieces);
        let blackResult = this.#isInsufficientMaterial(allBlackPieces, allWhitePieces);

        //se entrambi i giocatori hanno materiale insufficente
        if (whiteResult && blackResult) {
            mossa.causes = "draw";
            mossa.extraCauses = "Insufficient material"
            return;
        }
        //la partita potrebbe finire anche quando si verificano 50 mosse di fila senza mangiare o senza movimenti di pedoni
        const MAXMOVE = 50;
        if (this.#mosse.length >= MAXMOVE) { //prima di tutto controllo se ci sono state almeno 50 mosse
            let cont = 1;
            let result = false;
            for (let i = 0; i < this.#mosse.length; ++i) {
                if (this.#mosse[i].pieceEaten == 0 && this.#mosse[i].piece.name != "Pawn") {
                    ++cont;
                    if (cont > MAXMOVE) {
                        //se ne ho trovate 50 di fila, finisco di cercare
                        result = true;
                        break;
                    }
                }
                else
                    cont = 1;

            }
            //result = 3 -> ci sono state 50 mosse di fila senza mosse utili
            if (result) {
                mossa.causes = "draw";
                mossa.extraCauses = "50 move-rule";
                return;
            }
        }

        //un altro caso di patta sono quando si verificano 3 posizione uguali in tutta la partita
        //per avere la STESSA posizione ripetuta piu volte, non si devo verificare mosse di mangiata, o spostamenti di pedone ( dato che quest'ultimi non possono tornare alla stessa posizione)
        let length = this.#mosse.length;
        let cont = 0;
        while (cont < length && this.#mosse[cont].pieceEaten == 0 && this.#mosse[cont].piece.name != "Pawn") {
            ++cont;
        }
        const areMatrixEquals = (m1, m2) => {
            for (let i = 0; i < this.#width; ++i) {
                for (let j = 0; j < this.#height; ++j) {
                    if (m1[i][j] != m2[i][j])
                        return false;
                }
            }
            return true;
        }
        let currentBoard = this.#chessboard.map(row => row.map(el => el.uniqueid || 0));
        //le mosse che andro a considerare sono quelle che vanno da 0 a cont
        //e solo se sono piu di 2
        if (cont >= 2) {
            let boardArray = [];
            boardArray.push(structuredClone(currentBoard))
            for (let i = 0; i < cont; ++i) {
                let mossa = this.#mosse[i];
                //questo lo faccio per ogni movimento
                currentBoard[mossa.startY][mossa.startX] = mossa.piece.uniqueid;
                currentBoard[mossa.endY][mossa.endX] = 0;
                boardArray.push(structuredClone(currentBoard));
            }
            //adesso in boardArray sono salvati tutti i punti in cui la partita si è trovata
            //ora devo solo trovare quante volte si ripete ogni matrice, se questo numero è maggiore uguale di 2, è patta
            let c = 0;
            let draw = false;
            for (let i = 0; i <= cont; ++i) {
                c = 0;
                for (let j = i + 1; j <= cont; ++j) {
                    if (areMatrixEquals(boardArray[i], boardArray[j])) {
                        ++c;
                    }
                }
                //se c >=2, quella matrice si è ripetuta troppo
                if (c >= 2) {
                    draw = true;
                    break;
                }
            }
            if (draw) {
                mossa.causes = "draw";
                mossa.extraCauses = "Repetition";
            }
        }

    }
    /**
     * @description Funzione che ritorna se dei pezzi hanno materiali insufficiente
     * @param {Piece[]} material Vettore coi pezzi da controllare
     * @param {Piece[]} enemyMaterial Serve per controllare casi particolari in cui il mio materiale è insufficiente solo se il nemico ha solo il re
     * @return {Boolean} Ritorna se il giocatore ha materiale insufficiente
     */
    #isInsufficientMaterial(material, enemyMaterial) {
        let start = 0;  //conto i materiali che trovo
        for (let piece of material) {
            if (piece.name == "King" || piece.name == "Knight" || piece.name == "Bishop")
                ++start;
            if (piece.name == "Queen" || piece.name == "Pawn" || piece.name == "Rook")
                start = 100;
        }
        //se ho due alfieri dello stesso colore (e un re), è insufficente
        //se ho due cavalli e il nemico ha solo il re, è patta
        let positions = [0, 0]
        let knights = 0;
        if (material.length == 3) {
            for (let piece of material) {
                if (piece.name == "Bishop") {
                    positions[(piece.y + piece.x) % 2] = 1;
                }
                if (piece.name == "Knight")
                    ++knights;
            }
        }
        //se ho in campo 2 cavalli, e il nemico ha solo il re, è patta
        if (knights == 2 && enemyMaterial.length == 1)
            return true;
        if (positions[0] != positions[1])
            return true;
        return start < 3;
    }
    /**
     * @description Metodo che serve a eliminare gli eventuali en passant
     */
    #removeEnPassant() {
        for (let i = 0; i < this.#height; ++i) {
            for (let j = 0; j < this.#width; ++j) {
                if (this.#chessboard[i][j].name == "Pawn" && this.#chessboard[i][j].enPassant != 0)
                    this.#chessboard[i][j].enPassant = 0;
            }
        }
    }
    /**
     * @description Metodo che filtra delle mosse di un determinato pezzo in base agli scacchi
     * @param {{x:Number,y:Number}[]} moves Vettore di oggetti che rappresentano ogni mossa possibile che un pezzo può fare
     * @param {Piece} pedina Oggetto Piece che si sta muovendo nel campo
     * @returns {Array} Vettore con le mosse filtrate che il Piece può fare
     */
    filterPossibleMoves(moves, pedina) {
        //se non posso muvoermi da nessuna parte, non faccio niente
        if (moves.length == 0)
            return [];
        let lastMove;
        let startX = pedina.x;
        let startY = pedina.y;
        let pieceEaten = -1;
        //controllo ogni mossa che fa la mia pedina e cerco quella che causa uno scacco
        for (let i = 0; i < moves.length; ++i) {
            //salvo l'ultima mossa
            lastMove = moves[i];

            //muovo la cella in modo da capire se questo movimento causerà scacchi

            //se questa simulazione mi fa mangiare la pedina, la salvo qui dato che la dovrò portare in vita
            if (this.#chessboard[moves[i].y][moves[i].x] != 0) {
                pieceEaten = this.#chessboard[moves[i].y][moves[i].x];
            }
            //ricorda che esiste l'en passant
            if (moves[i].enPassantPiece != undefined) {
                //se è avvenuto un en-passant, considero quella pedina mangiata
                pieceEaten = this.#chessboard[moves[i].enPassantPiece.y][moves[i].enPassantPiece.x];
                this.#chessboard[pieceEaten.y][pieceEaten.x] = 0
            }
            this.#chessboard[pedina.y][pedina.x].movePieceInMatrix(moves[i].x, moves[i].y, this.#chessboard, false);

            //prendo tutti i pezzi di colore opposto al mio


            let pieces = this.getAllPieces(pedina.color == "white" ? "black" : "white");
            for (let piece of pieces) {
                //prendo ogni mossa che tutti i pezzi aversari possono fare per mangiare e controllo se una mossa mangierebbe il re
                //se una di queste mosse causa scaccco, la tolgo
                if (this.findScacco(piece.y, piece.x)) {
                    moves[i] = -1;
                }
            }
            //riporto la pedina alla sua posizione vera
            this.#chessboard[lastMove.y][lastMove.x].movePieceInMatrix(startX, startY, this.#chessboard, false);
            //devo riporare "in vita" il pezzo che per simulare ho mangiato
            if (pieceEaten != -1) {
                this.#chessboard[pieceEaten.y][pieceEaten.x] = pieceEaten;
                pieceEaten = -1;
            }

        }
        return moves.filter(ele => ele != -1);
    }

    /**
     * @description Metodo che controlla se lo scacco di un giocatore può essere bloccato in qualche modo
     * @param {string} color Colore che rappresenta il giocatore che ha appena mosso
     * @returns {Boolean} true | false se i pezzi nemici possono muoversi o no per evitare lo scacco
     */
    canOtherPiecesMove(color) {
        let enemyColor = color == "black" ? "white" : "black";
        let canMove = true;
        let allPieces = this.getAllPieces(enemyColor);
        allPieces.forEach((piece) => {
            //contrllo le MOSSE che i pezzi possono fare per bloccare matto
            let allPossiblePieceMoves = this.#chessboard[piece.y][piece.x].returnPossibleMoves(this.#chessboard);
            allPossiblePieceMoves = this.filterPossibleMoves(allPossiblePieceMoves, piece);
            //se trovo anche solo una mossa, smetto di cercare
            if (allPossiblePieceMoves.length > 0) {
                //console.log(this.#chessboard[piece.y][piece.x]," puo muoversi");
                canMove = false;
                return;
            }
            //faccio lo stesso, controllando le mangiate
            let allPossiblePieceEats = this.#chessboard[piece.y][piece.x].returnPossibleEats(this.#chessboard);
            allPossiblePieceEats = this.filterPossibleMoves(allPossiblePieceEats, piece);
            if (allPossiblePieceEats.length > 0) {
                //console.log(this.#chessboard[piece.y][piece.x],  " puo mangiare");
                canMove = false;
                return;
            }

        });
        if (canMove)
            return true;
        return false;
    }
    /**
     * @description Metodo che controlla, partendo dall'ultima mossa fatta, se avviene uno scacco
     * @param {number} y Coordinata y del pezzo che potrebbe causare scacco
     * @param {number} x Coordinata x del pezzo che potrebbe causare scacco
     * @returns {Boolean} Ritorna true | false se avviene scacco
     */
    findScacco(y, x) {
        let newPedina = this.#chessboard[y][x];
        let additionalMoves = newPedina.returnPossibleEats(this.#chessboard);
        //let kingX = this.kingPosition[newPedina.color == "black" ? 1 : 0][1];
        //let kingY = this.kingPosition[newPedina.color == "black" ? 1 : 0][0];

        for (let addMove of additionalMoves) {
            //calcolo le coordinate del re nemico
            if (this.#chessboard[addMove.y][addMove.x].name == "King")
                return true;
        }
        //sfortunatamente esistono anche gli scacchi di scoperta, che NON sono causa dalla mia pedina [y][x]
        //devo quindi controllare le mosse di ogni pedina per vedere se loro fanno scacco

        return this.findScaccoByColor(newPedina.color);
    }

    /**
     * @description Metodo che ritorna se un re di un determinato colore è stato messo sotto scacco
     * @param {String} color Colore del re eventualmente messo sotto scacco
     * @returns {Boolean} Ritorna se il re è stato messo sotto scacco
     */
    findScaccoByColor(color) {
        let allPieces = this.getAllPieces(color);
        let scacco = false;
        allPieces.forEach(piece => {
            let additionalMoves = piece.returnPossibleEats(this.#chessboard);
            //in questo caso non filtro le mosse dato che l'importante è minacciarae il re, anche se non posso muovere il pezzo
            for (let addMove of additionalMoves) {
                //se una di queste mangiate punta al re
                if (this.#chessboard[addMove.y][addMove.x].name == "King") {
                    scacco = true;
                    return;
                }
            }
        });
        return scacco;
    }

    /**
     * @description Metodo che verifica se il re può arroccare
     * @param {Array.<{x:Number,y:Number}>} moves Vettore di oggetti che rappresentano ogni mossa possibile che un pezzo può fare
     * @param {King} pedina Il re che vuole arroccare
     * @returns {Boolean} Ritorna true|false se il re può arroccare
     */
    checkForCastle(moves, pedina) {
        if (pedina.moved || pedina.name != "King" || this.findScaccoByColor(pedina.color == "black" ? "white" : "black"))
            return;
        //prendo la riga dove sta accadendo l'arrocco
        let row = this.chessboard[pedina.y];
        const compareArray = (arr1, arr2) => {
            let equal = true;
            for (let i = 0; i < arr1.length; ++i) {
                if (JSON.stringify(arr1[i]) != JSON.stringify(arr2[i]))
                    equal = false;
            }
            if (equal)
                return true;
            return false;
        }
        //se c'è la torre all'inizio e non si è mossa controllo la parte a sinistra del re
        if (row[0].name == "Rook" && !row[0].moved) {
            let canMove = true;
            for (let i = 1; i < 4; ++i) {
                if (row[i] != 0)
                    canMove = false;
            }
            //ok il campo è libero per arroccare
            if (canMove) {
                let movesCastle = [{ x: 2, y: pedina.y, castle: true, rook: { x: 0, y: pedina.y, endX: 3 } }, { x: 3, y: pedina.y }];
                //adesso filtro le mosse in modo da capire se posso arroccare e se nessuna parte è sotto scacco
                let filteredMoves = this.filterPossibleMoves(movesCastle, pedina);
                if (compareArray(movesCastle, filteredMoves)) {
                    //ok nessuno pezzo dell'arrocco è sotto scacco, aggiungo la mossa dell'arroco a quelle totali
                    moves.push(movesCastle[0]);
                }
            }
        }
        //se c'è la torre alla FINE e non si è mossa controllo la parte a sinistra del re
        if (row[this.#width - 1].name == "Rook" && !row[this.#width - 1].moved) {
            let canMove = true;
            for (let i = 5; i < this.#width - 1; ++i) {
                if (row[i] != 0)
                    canMove = false;
            }
            //ok il campo è libero per arroccare
            if (canMove) {

                let movesCastle = [{ x: 5, y: pedina.y }, { x: 6, y: pedina.y, castle: true, rook: { x: this.#width - 1, y: pedina.y, endX: 5 } }];
                //adesso filtro le mosse in modo da capire se posso arroccare e se nessuna parte è sotto scacco
                let filteredMoves = this.filterPossibleMoves(movesCastle, pedina);
                if (compareArray(movesCastle, filteredMoves)) {
                    //ok nessuno pezzo dell'arrocco è sotto scacco, aggiungo la mossa dell'arroco a quelle totali
                    moves.push(movesCastle[1]);
                }
            }
        }


    }

    /**
     * @description Metodo che ritorna tutti i pezzi di un determinato colore
     * @param {String} color Colore del giocatore in base a cui prenderò tutti i pezzi 
     * @returns {Piece[]} Vettore con tutti i pezzi
     */
    getAllPieces(color) {
        let result = [];
        for (let i = 0; i < this.#chessboard.length; ++i) {
            for (let j = 0; j < this.#chessboard[0].length; ++j) {
                if (this.#chessboard[i][j] != 0 && this.#chessboard[i][j].color == color)
                    result.push(this.#chessboard[i][j]);
            }
        }
        return result;
    }

    get height() {
        return this.#height;
    }
    get width() {
        return this.#width;
    }
    get chessboard() {
        return this.#chessboard;
    }
    get mosse() {
        return this.#mosse;
    }

}