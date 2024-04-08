/**
 * @author Botta Fabio <fabiobotta4@gmail.com>
 * @description Rappresenta la pedina generica da cui derivano tutte le altre
 * @classdesc Classe astratta
 */

export default class Piece{
    #color;
    #movePattern;
    #eatPattern;
    #name;
    #x;
    #y;
    #uniqueid;
    /**
    * @param {string} name Il nome della pedina
    * @param {string} color indica il colore del pezzo
    * @param {Number[][]} movePattern indica dove e come la pedina si puo muovere
    * @param {Number[][]} eatPattern indica dove e come la pedina puo mangiare
    * @param {Number} x La coordinata x della pedina 
    * @param {Number} y La coordinata y della pedina 
    * @param {Number} uniqueid Numero unico che identifica il pezzo nel campo
    */
    constructor(name,color,movePattern,eatPattern,x,y,uniqueid){
        this.#name = name;
        this.#color = color;
        this.#movePattern = movePattern;
        this.#eatPattern = eatPattern;
        this.#x = x;
        this.#y = y;
        this.#uniqueid = uniqueid
    }
    /**
     * @description Metodo che ritorna un vettore con tutte le mosse possibili, di spostamento, che può fare una pedina
     * @param {Piece[][]} board Campo di gioco
     * @returns {{x:Number,y:Number}[]} Vettore con tutte le mosse che una pedina può fare
     */
    returnPossibleMoves(board) {
        let width = this.#movePattern[0].length;
        let height = this.#movePattern.length;
        const coord = this.getCenterPosition(this.#movePattern);   //ricavo il centro della pedina  
        const result = [];
        for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                if (this.#movePattern[i][j] == 1 ) {    //se è 1 vuol dire che mi posso muovere qui
                    //ok devo calcolare la distanza dall'1 al centro del movePattern
                    let deltaX = j - coord.x;
                    let deltaY = i - coord.y;
                    //adesso calcolo la nuova x e y rispetto alla matrice
                    let newX = this.#x + deltaX;
                    let newY = this.#y + deltaY;
                    //ora controllo che posso MUOVERMI in questo punto e che non ci sia niente
                    if (board[newY] != undefined && board[newY][newX] != undefined) {
                        if (board[newY][newX] == 0) 
                            result.push({ x: newX, y: newY });
                    }
                }
                //se è 3 vuol dire che devi continuare a muoverti in quella direzione
                if(this.#movePattern[i][j] == 3){
                    //ok devo calcolare la distanza dall'1 al centro del movePattern
                    let deltaX = j - coord.x;
                    let deltaY = i - coord.y;
                    //adesso calcolo la nuova x e y rispetto alla matrice
                    let tmpX = this.#x + deltaX;
                    let tmpY = this.#y + deltaY;

                    //vado avanti finche trovo un posto vuoto
                    while (board[tmpY] != undefined && board[tmpY][tmpX] == 0){
                        result.push({ x: tmpX, y: tmpY });
                        tmpX +=deltaX;
                        tmpY +=deltaY;
                    }

                }
            }
        }
        return result;
    }
    /**
     * @description Metodo che ritorna un vettore con tutte le mosse possibili, di mangiata, che può fare una pedina
     * @param {Piece[][]} board 
     * @returns {{x:Number,y:Number}[]} Vettore con tutte le mosse che una pedina può fare
     */
    returnPossibleEats(board){ 
        let width = this.#eatPattern[0].length;
        let height = this.#eatPattern.length;
        const coord = this.getCenterPosition(this.#eatPattern);   //ricavo il centro della pedina  
        const result = [];
        for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                if (this.#eatPattern[i][j] == 1 ) {    //se è 1 vuol dire che mi posso mangiare qui
                    //ok devo calcolare la distanza dall'1 al centro del movePattern
                    let deltaX = j - coord.x;
                    let deltaY = i - coord.y;
                    //adesso calcolo la nuova x e y rispetto alla matrice
                    let newX = this.#x + deltaX;
                    let newY = this.#y + deltaY;
                    //ora controllo che posso mangiare in questo punto
                    if (board[newY] != undefined && board[newY][newX] != undefined) {
                        //posso mangiare se clicco su una pedina e se le pedine hanno colore diverso
                        if (board[newY][newX] != 0 && board[newY][newX].color != board[this.#y][this.#x].color){
                            //controllo per l'upgrade se sono un pedone
                            if (this.#name == "Pawn" && newY == (this.positions[this.color] == "down" ? 0 : board.length - 1)) {
                                result.push({ x: newX, y: newY, upgrade: true });
                            }
                            else
                                result.push({ x: newX, y: newY });
                        }
                    }
                }
                //se è 3 vuol dire che devi continuare a muoverti in quella direzione
                if(this.movePattern[i][j] == 3){
                    //ok devo calcolare la distanza dall'1 al centro del movePattern
                    let deltaX = j - coord.x;
                    let deltaY = i - coord.y;
                    //adesso calcolo la nuova x e y rispetto alla matrice
                    let tmpX = this.#x + deltaX;
                    let tmpY = this.#y + deltaY;

                    //vado avanti finche trovo un posto vuoto
                    while (board[tmpY] != undefined && board[tmpY][tmpX] == 0){
                        tmpX +=deltaX;
                        tmpY +=deltaY;
                    }

                    //dopo che trovo una pedina controllo che sia di un altro colore (= la posso mangiare)

                    if (board[tmpY] != undefined && board[tmpY][tmpX] != undefined ){
                        if(board[tmpY][tmpX] != 0 && board[tmpY][tmpX].color != board[this.#y][this.#x].color)
                            result.push({x:tmpX,y:tmpY});   
                    }

                }
            }
        }
        return result;
    }


    /**
     * @description Metodo che muove il pezzo nella matrice
     * @param {Number} destX Coordinata x che assumerà questo pezzo
     * @param {Number} destY Coordinata y che assumerà questo pezzo
     * @param {Piece[][]} board Campo di gioco
     * @param {Boolean} movedModifer serve per capire se questa mossa avviene per modificare il campo o per test(come quando filtri le mosse)
     */
    movePieceInMatrix(destX,destY,board,movedModifer){
        if(movedModifer){
            //EN PASSANT
            //se il pedone fa un movimento di 2, e di fianco a lui si ritrova un altro pedone, quest'ultimo puo fare l'en passant
            if (this.#name == "Pawn" && !this.moved) {
                if (Math.abs(destY - this.#y) == 2) {
                    //ok ora controllo se hai di fianco un pedone
                    //se di fianco hai un pedone, dico a quest'ultimo che può fare l'en passant su di me
                    if (this.#x > 0 && board[destY][this.#x - 1].name == "Pawn" &&  board[destY][this.#x - 1].#color !=this.color){
                        board[destY][this.#x - 1].enPassant = this;
                    }
                    if (this.#x < board[0].length - 1 && board[destY][this.#x + 1].name == "Pawn" && board[destY][this.#x + 1].#color != this.color) {
                        board[destY][this.#x + 1].enPassant= this;
                    }
                }
                
            }

            if (board[this.#y][this.#x].moved != undefined && board[this.#y][this.#x].moved == false)
                board[this.#y][this.#x].moved = true;
        }
        board[destY][destX] = board[this.#y][this.#x];
        board[this.#y][this.#x] = 0;

        //cambio la x e la y del pezzo
        this.#x = destX;
        this.#y = destY;

        
    }
    /**
     * @description Metodo che ritorna la posizione della Pedina rispetto alla sua matrice di movimento 
     * @param {Number[][]} pattern Matrice che descrive il movimento di un pezzo
     * @returns {{x:Number,y:Number}} il ritorna le coordinate cercate
     */
    getCenterPosition(pattern){
        let width = pattern.length;
        let height = pattern.length;
        for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                if (pattern[i][j] == 4)
                    return {x:j,y:i};
            }
        }
    }

    
    //getter-setter
    get name(){
        return this.#name;
    }
    get color(){
        return this.#color;
    }
    get movePattern(){
        return this.#movePattern;
    }
    get x(){
        return this.#x;
    }
    get y(){
        return this.#y;
    }
    get eatPattern(){
        return this.#eatPattern;
    }
    get movePattern(){
        return this.#movePattern;
    }
    get uniqueid(){
        return this.#uniqueid;
    }

    
}
