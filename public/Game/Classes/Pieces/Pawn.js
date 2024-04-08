import Piece from "./Piece.js";

//PER I PATTERN:
/*
    4 = dove è la pedina
    1 = dove si muove di base
    2 = eventuali movimenti extra
    3 = si muove "all'infinito" in quella direzione
*/

const movePattern = [
    [2],
    [1],
    [4],
];

const eatPattern = [
    [1,0,1],
    [0,4,0]
];

//N.B. movePattern e eatPattern cambiano in base al colore della pedina
//questo valori funzionano se il pedone è BIANCO

/**
 * @extends Piece
 */
export default class Pawn extends Piece{
    /**
     * 
     * @param {String} color Colore della pedina
     * @param {Number} x Coordinata x di partenza
     * @param {Number} y Coordinata y di partenza
     * @param {Number} uniqueid Numero unico che identifica il pezzo nel campo
     * @param {{white:"up"|"down",black:"down"|"up"}} positions Come sono posizionati i colori nella scacchiera
     */
    constructor(color, x, y, uniqueid, positions){
        //se sei nero devo cambiare come ti muovi
        let reverse = false;    //calcolo se devo reversare le mosse in base al colore del pedone e in base a come è disposto
        if(positions[color] == "up")
            reverse = true;
        if (reverse)
            super("Pawn", color, reverseArray(movePattern), reverseArray(eatPattern), x, y, uniqueid);
        else
            super("Pawn", color, movePattern, eatPattern, x, y, uniqueid);

        this.positions = positions;
        /**
         * Quanto vale la pedina
         * @type {Number}
         */
        this.value = 1;
        /**
         * @type {Boolean}
         * Indica se il pedone ha già effettuato un movimento nel campo
         */
        this.moved = false;
        /**
         * Il pedone alla quale questo può fare l'en passant
         * @type {Pawn}
         */
        this.enPassant = 0;
    }
    /**
     * @description Faccio l'override del metodo padre dato che il pedone si muove in modo differente in base alla prima mossa e seconda
     * @param {Piece[][]} board Campo di gioco
     * @returns {{x:Number,y:Number}[]} Ritorna un vettore di oggeti contenenti le mosse possibili della pedina
     */
    returnPossibleMoves(board) {
        let width = this.movePattern[0].length;
        let height = this.movePattern.length;
        let coord = this.getCenterPosition(this.movePattern);   //ricavo il centro della pedina  
        let result = [];
        let cantMove = false;   //serve per non farti muovere di 2 se c'è una pedina in mezzo
        for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                if(this.movePattern[i][j] == 1 || (!this.moved && this.movePattern[i][j] == 2 && !cantMove)){    //se è 1 vuol dire che mi posso muovere qui, se è 2 puoi muoverti solo se è la prima mossa del pedone
                    //ok devo calcolare la distanza dall'1 al centro del movePattern
                    let deltaX = j - coord.x;
                    let deltaY = i - coord.y;
                    //adesso calcolo la nuova x e y rispetto alla matrice
                    let newX = this.x + deltaX;
                    let newY = this.y + deltaY;
                    //ora controllo che posso MUOVERMI in questo punto e che non ci sia niente
                    if(board[newY] != undefined && board[newY][newX] != undefined){
                        if(board[newY][newX] == 0){
                            if(! (this.color == "white" && this.movePattern[i][j] == 2 && board[newY+1][newX] != 0)){
                                //controllo per l'upgrade, devo tenere conto del colore e della posizione dei pezzi nella scacchiera
                                if (newY == (this.positions[this.color] == "down" ? 0 : board.length - 1)){
                                    result.push({ x: newX, y: newY,upgrade: true});
                                }
                                else
                                    result.push({x:newX,y:newY});
                            }
                        }
                        else{
                            cantMove = true;
                        }
                    }
                }
            }
        }
        this.#checkEnPassant(result);
        return result;
    }
    /**
     * Metodo che controlla se un pedone può fare l'en passant
     * @param {{x:Number,y:Number}[]} result Il vettore con tutte le mosse che il pedone può già fare
     */
    #checkEnPassant(result){
        if(this.enPassant == 0)
            return;
        let piece = this.enPassant;
        //calcolo le coordinate in cui il mio pezzo si potrà muvoere per fare l'en passant
        let newX = piece.x;
        let newY = this.y;
        if(this.positions[this.color] != "up")
            --newY;
        else
            ++newY;
        result.push({x:newX,y:newY,enPassantPiece:{y:piece.y,x:piece.x,color:piece.color,name:piece.name}});
    }
}

/**
 * @description Metodo che riordina le righe di una matrice
 * @param {Number[][]} array Matrice in input
 * @returns {Number[][]} Ritorna una nuova matrice
 */
function reverseArray(array) {
    let length = array.length;
    let newArray = [];
    for(let i = length-1;i>=0;--i)
        newArray.push(array[i]);
    return newArray;
}
