import Piece from "./Piece.js";


//PER I PATTERN:
/*
    4 = dove è la pedina
    1 = dove si muove di base
    2 = eventuali movimenti extra
    3 = si muove "all'infinito" in quella direzione
*/

const movePattern = [
    [3, 3, 3],
    [3, 4, 3],
    [3, 3, 3]
];

const eatPattern = movePattern;

/**
 * @extends Piece
 */
export default class Queen extends Piece {
    /**
     * 
     * @param {String} color Colore della pedina
     * @param {Number} x Coordinata x di partenza
     * @param {Number} y Coordinata y di partenza
     * @param {Number} uniqueid Numero unico che identifica il pezzo nel campo
     */
    constructor(color, x, y, uniqueid) {
        super("Queen", color, movePattern, eatPattern, x, y, uniqueid);
        /**
         * Quanto vale la pedina
         * @type {Number}
         */
        this.value = 9;
    }


}
