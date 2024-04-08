
import Piece from "./Piece.js";

//PER I PATTERN:
/*
    4 = dove è la pedina
    1 = dove si muove di base
    2 = eventuali movimenti extra
    3 = si muove "all'infinito" in quella direzione
*/

const movePattern = [
    [1, 1, 1],
    [1, 4, 1],
    [1, 1, 1]
];

const eatPattern = movePattern;

export default class King extends Piece {
    /**
     * 
     * @param {String} color Colore della pedina
     * @param {Number} x Coordinata x di partenza
     * @param {Number} y Coordinata y di partenza
     * @param {Number} uniqueid Numero unico che identifica il pezzo nel campo
     */
    constructor(color, x, y, uniqueid) {
        super("King", color, movePattern, eatPattern, x, y, uniqueid);
        /**
        * @type {Boolean}
        * Indica se il pedone ha già effettuato un movimento nel campo
        */
        this.moved = false;
    }


    }
