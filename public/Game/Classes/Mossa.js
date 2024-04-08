

export default class Mossa{
    /**
     * 
     * @param {Number} startX la x iniziale da dove parte il pezzo
     * @param {Number} startY la y iniziale da dove parte il pezzo
     * @param {Number} endX   la x finale dove arriva il pezzo
     * @param {Number} endY   la y finale dove arriva il pezzo
     * @param {Piece} piece il pezzo che ha effetuato il movimento
     * @param {Piece} [pieceEaten] eventuale pezzo che è stato mangiato da questo movimento
     * @param {String} specialMove se questo movimento include una mossa speciale (en-passant,castle,upgrade)
     * @param {Object} [object] Oggetto con le informazioni di un' eventuale mossa speciale
     */
    constructor(startX, startY, endX, endY, piece, pieceEaten, specialMove, object){
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.piece = piece;
        this.pieceEaten = pieceEaten;
        this.specialMove = specialMove;
        this.object = object;
        /**
         * cosa ha causato questa mossa, "check","checkmate","draw"
         * @type {String}
         */
        this.causes = "none";
        /**
         * Specifiche aggiunte in caso di patta, es. materiale insufficiente, per tempo...
         * @type {String} 
         */
        this.extraCauses = "none";
        /**
         * L'eventuale vincitore della partita
         * @param {String} 
         */
        this.winner = "";
    }
}
