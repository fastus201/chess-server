import {isMyTurn,checkForPossibleMove} from "./clientGameLogic.js"

import { ClientGame, showEndGame,myModal } from "../Lobby/index.js";

/**
 * @description Funzione che crea la scacchiera in html
 * @param {Game} game Oggetto che rappresenta la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client

 */








export function createChessboard (game,gameClientInfo) {
        let board = document.getElementById("chessboard");
        for(let i = 0;i<game.height;++i){
            for(let j = 0;j<game.width;++j){
                let div = document.createElement("div");
                div.classList.add("square");
                //aggiungo i numerini alla prima colonna
                if(j == 0 || i == game.height-1){
                    //se j = 0, creo gli elementi che mostrano il numerino
                    if (j == 0) {
                        let text = document.createElement("div");
                        text.classList.add("text");
                        text.style.setProperty("--x",j);
                        text.style.setProperty("--y",i);

                        //If white is down, i have to reverse number order
                        if (gameClientInfo.positions.white == "down") {
                            text.style.setProperty("--value", JSON.stringify(( gameClientInfo.measures.height - i).toString()));
                        }
                        else
                            text.style.setProperty("--value",JSON.stringify((i+1).toString()));
                        text.style.color = "var(--color"+ ( !(i % 2) + 1)+")";
                        board.append(text);
                    }
                    //sul fondo metto le letterine
                    if(i == game.height-1){
                        let text = document.createElement("div");
                        text.classList.add("text");
                        text.style.setProperty("--x", j);
                        text.style.setProperty("--y", i);
                        text.classList.add("transformed-text");
                        text.style.color = "var(--color"+ ( (j % 2) + 1)+")";
                        if(gameClientInfo.myColor == "black")
                            text.style.setProperty("--value", JSON.stringify(["a","b","c","d","e","f", "g", "h"].reverse()[j]));
                        else
                            text.style.setProperty("--value", JSON.stringify(["a", "b", "c", "d", "e", "f", "g", "h"][j]));
                        board.append(text);
                    }
                }
                //mettere il colore giusto
                if((i + j) % 2 == 0)
                    div.classList.add("color-1");
                else
                    div.classList.add( "color-2");

                //aggiungo l'evento del click per muovere la pedina
                div.setAttribute("id","pos"+i+"."+j);
                div.addEventListener("click", movePieceOnBoard.bind(div, game,gameClientInfo));
                board.append(div);
            }
            
        }
}


/**
 * @description Funzione che crea tutte le immagini delle pedine
 * @param {Game} game Oggetto che rappresenta la partita intera
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client

**/
export function drawPieces(game, gameClientInfo) {
    for (let i = 0; i < game.height; ++i) {
        for (let j = 0; j < game.width; ++j) {
            if (game.chessboard[i][j] != 0) {
                let div = createPiece(j, i, game.chessboard[i][j].name, game.chessboard[i][j].color,gameClientInfo.piecesValue,gameClientInfo.chessboardStyle);
                //If i found enemy pieces
                if(gameClientInfo.myColor != game.chessboard[i][j].color)
                    div.style.cursor = "default";
                dragElement(div, game, gameClientInfo);
            }
        }
    }
}

/**
* @description Funzione che crea le pedine html
* @param {Number} x Coordinata del pezzo x
* @param {Number} y Coordinata del pezzo y
* @param {String} name Nome della pedina
* @param {String} color Colore della pedina
* @param {{Pawn:Number,Knight:Number,Bishop:Number,Rook:Number,King:Number,Queen:Number}} piecesValue I valori dei pezzi
* @param {{value:Number,format:String}} style Indica lo stile attualmente in utilizzo
* @returns {HTMLImageElement} Ritorna l'elemento appena creato 
*/
export function createPiece(x, y, name, color,piecesValue,style) {
    let div = document.createElement("img");
    div.classList.add("piece");
    div.style.setProperty("top", "calc("+y+" * var(--sizeCella))");
    div.style.setProperty("left", "calc(" + x + " * var(--sizeCella))");
    div.setAttribute("id", "ped" + y + "." + x);
    div.setAttribute("color", color);
    div.setAttribute("name",name);
    div.setAttribute("value", piecesValue[name])
    div.setAttribute("src", "./public/Game/img/Piece/" + color + style.value+"/" + name + style.format);
    if (name == "King") {
        div.classList.add("King-" + color);
    }
    document.getElementById("chessboard").append(div);
    return div;
}


/**
 * @description Viene chiamata appena crei l'elemento html per setuppare
 * @param {HTMLElement} element Elemento html rappresentante la pedina
 * @param {Game} game Oggetto che rappresenta il game
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client

 */

function dragElement(element, game, gameClientInfo) {

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let currentSelected;    //questa variabile la uso solo per draggare il pezzo

    element.onmousedown = dragMouseDown;
    /**
     * @description Funzione che viene chiamata appena clicchi col mouse sul pezzo
     * @param {Event} e Evento del mouse 
     */
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        //If you're not using left click mouse
        if (e.button != 0)
            return;
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        //calcolo le coordinate belle di dove sono
        let [currentX, currentY] = getCoordinates(element, gameClientInfo.measures.sizeCella);

      

        //allora, prima controllo che non sto muovendo per MANGIARE
        //element contiene l'elemento CHE HAI CLICCATO ADESSO
        //info.element quello di prima
        if ( !gameClientInfo.stopped && gameClientInfo.info.element != undefined && gameClientInfo.info.element.getAttribute("color") != element.getAttribute("color")) {
            //è come se lasciassi il pezzo in quel punto
            closeDragElement("move");
            return;
        }
        //dopo che ho controllato se dovevo mangiare, controllo i turni
        //se non è il mio turno annullo tutto oppure se la partita è bloccata
        if (gameClientInfo.ended || gameClientInfo.stopped || element.getAttribute("disabled")  /**/ || !isMyTurn(this.getAttribute("color"), game.turno, gameClientInfo.currentMossa) ||gameClientInfo.myColor != this.getAttribute("color")) {
            document.onmouseup = null;
            document.onmousemove = null;
            return;
        }
        /*TODO
        //Anche se non è il tuo turno, puoi vedere dove potresti muoverti
        if (!isMyTurn(this.getAttribute("color"), game.turno, gameClientInfo.currentMossa)){
            gameClientInfo.showPossibleMoves = true;
        }*/


        //aggiorno la posizione iniziale quando clicco su un pezzo
        gameClientInfo.info.x = getComputedStyle(element).getPropertyValue("left");
        gameClientInfo.info.y = getComputedStyle(element).getPropertyValue("top");
        gameClientInfo.info.element = element;
        //se c'è solo un elemento selezionato lo tolgo
        if (gameClientInfo.currentSelectedSquare.length == 1 || gameClientInfo.currentSelectedSquare.length == 3 ) {
            setElementBackground(gameClientInfo.currentSelectedSquare[gameClientInfo.currentSelectedSquare.length - 1][0], gameClientInfo.currentSelectedSquare[gameClientInfo.currentSelectedSquare.length - 1][1], 1);
            gameClientInfo.currentSelectedSquare.pop();
        }
        let addBackgrund = true;
        if (gameClientInfo.showPossibleMoves) {
            let moves = gameClientInfo.currentSelectedSquare;
            if (moves.length == 2) {
                if (moves[1][0] == currentX && moves[1][1] == currentY) {
                    addBackgrund = false;
                }
            }
        }
        if(addBackgrund){
            gameClientInfo.currentSelectedSquare.push([currentX, currentY]);
            setElementBackground(currentX, currentY, 0);
        }
        //modifico la cella corrente
        currentSelected = document.getElementById("pos" + currentY + "." + currentX);   //aggiorni la casa corrente

        //tolgo la transition da questo elemento e lo metto "sopra" gli altri
        element.classList.add("notransition", "z-index");

        //mostro le possibili mosse che puoi fare

        //prima tolgo quelle selezionate adesso
        removePossibleMoves();
        showPossibleMoves(currentX, currentY, game);
    }
    /**
     * @description Funzione che viene chiamata mentre stai draggando il pezzo in giro
     * @param {Event} e Evento di quando scorri il mouse 
     */
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        //calcolo la coordinata della casella in cui si trova la pedina
        let [currentX, currentY] = getCoordinates(element, gameClientInfo.measures.sizeCella);

        let maxWidth = getMaxMeasure(gameClientInfo.measures.width, gameClientInfo.measures.sizeCella);
        let maxHeight = getMaxMeasure(gameClientInfo.measures.height, gameClientInfo.measures.sizeCella);

        // calculate the new cursor position:
        //DESTRA E SINISTRA
        pos1 = pos3 - e.clientX;
        pos3 = e.clientX;

        element.style.left = (element.offsetLeft - pos1) + "px";
        //CONTROLLO CHE NON ESCI DAL CAMPO
        if (element.offsetLeft - pos1 >= maxWidth)
            element.style.left = maxWidth - 1 + "px";
        if (element.offsetLeft - pos1 <= -1 * gameClientInfo.measures.sizeCella / 2)
            element.style.left = -1 * gameClientInfo.measures.sizeCella / 2 + 1 + "px";

        //SOPRA E SOTTO
        pos2 = pos4 - e.clientY;
        pos4 = e.clientY;

        element.style.top = (element.offsetTop - pos2) + "px";

        if (element.offsetTop - pos2 >= maxHeight)
            element.style.top = maxHeight - 1 + "px";
        if (element.offsetTop - pos2 <= -1 * gameClientInfo.measures.sizeCella / 2)
            element.style.top = -1 * gameClientInfo.measures.sizeCella / 2 + 1 + "px";
        // set the element's new position:

        if (document.getElementById("pos" + currentY + "." + currentX) != undefined) {
            if (document.getElementById("pos" + currentY + "." + currentX) != currentSelected) {    //se sposti la pedina in un altra casella
                if (currentSelected != undefined)
                    currentSelected.classList.remove("square-selected");    //togli il selezionato
                document.getElementById("pos" + currentY + "." + currentX).classList.add("square-selected");    //aggiungi a quella nuova

                currentSelected = document.getElementById("pos" + currentY + "." + currentX);   //aggiorni la casa corrente
            }
        }

    }
    /**
     * @description Funzione che viene chiamata quando rilasci il pezzo sulla scacchiera, viene anche chiamata quando si simula la mangiata cliccando sulla scacchiera
     * @param {String} isClicked Indica se la funzione è stata chiamata per lasciare il pezzo o per simulare la mangiata
     */
    async function closeDragElement(isClicked) {   //viene chiamata quando lasci il pezzo sulla scacchiera
        let [currentX, currentY] = getCoordinates(element, gameClientInfo.measures.sizeCella); //calcolo le coordinate di dove è caduto il pezzo
        let [startFormatX, startFormatY] = convertCoordinates(gameClientInfo.info.x, gameClientInfo.info.y, gameClientInfo.measures.sizeCella);
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;

        //togliere il bordino bianco
        if (currentSelected != undefined)
            currentSelected.classList.remove("square-selected");
        currentSelected = undefined;

        //tolgo il fatto che la pedina sia "sopra" le altre
        element.classList.remove("z-index");
        //vediamo se sei sulla stessa casella
        let isOnSameStart = (currentX == startFormatX && currentY == startFormatY) || gameClientInfo.showPossibleMoves;
        let result;
        if (!isOnSameStart) {
            result = await checkForPossibleMove(parseInt(currentX), parseInt(currentY), game, gameClientInfo); //controlla se puoi muove li la pedina
        }
        //se rilascio il pezzo sullo stesso posto dove lo ho preso non lo muovo
        //oppure anche se semplicemente non posso muovere quel pezzo
        if (result == 0 || isOnSameStart) {
            //se non puoi muoverti ti riporto alla posizione iniziale
            gameClientInfo.info.element.style.left = "calc(var(--sizeCella) *" +startFormatX +")";
            gameClientInfo.info.element.style.top = "calc(var(--sizeCella) *" +startFormatY + ")";;
            document.getElementById("chessboard").classList.add("cursor-pointer");

            //con questo parametro capisco se tu hai draggato il pezzo o hai cliccato per mangiare
            //nel secondo caso, se clicchi dove non puoi mangiare tolgo tutti gli sfondi presenti
            if (isClicked == "move") {
                setElementBackground(gameClientInfo.currentSelectedSquare[gameClientInfo.currentSelectedSquare.length - 1][0], gameClientInfo.currentSelectedSquare[gameClientInfo.currentSelectedSquare.length - 1][1], 1);
                gameClientInfo.currentSelectedSquare.pop();
                removePossibleMoves();
                document.getElementById("chessboard").classList.remove("cursor-pointer");
                Object.keys(gameClientInfo.info).forEach(key => delete gameClientInfo.info[key]);
            }

        }
        //ora vado avanti solo se posso muovere effetivamente la pedina
        else {
            //Ho gia calcolato prima le posizioni finali
            let [finalX,finalY] = [currentX,currentY];
            //se mangi
            if (result == 2) {    //se 2 = mangi la pedina
                //se hai cliccato metto il delay
                let element = document.getElementById("ped"+currentY+"."+currentX);
                element.setAttribute("disabled","true");
                if (isClicked == "move"){
                    setTimeout(eatPiece, gameClientInfo.measures.transition_time - 25,element,gameClientInfo);
                }
                else
                    eatPiece(element,gameClientInfo);

            }
            //in ogni caso muovi la pedina
            animateMovePiece(finalX, finalY, gameClientInfo.info.element, isClicked, gameClientInfo);

        }
        element.offsetHeight;   //per il reflow
        element.classList.remove("notransition");
    }
}
/**
 * @description Funzione che mangia il pezzo graficamente
 * @param {HTMLElement} element Elemento HTML da eliminare
 */
export function eatPiece(element,gameClientInfo) {
    //salvo nel vettore dei pezzi mangiati quello che ho appena mangiato
    let color = element.getAttribute("color");
    gameClientInfo.eatenPieces[color].push([element.getAttribute("name"), gameClientInfo.piecesValue[element.getAttribute("name")]]);
    updateEatenPieces(gameClientInfo.eatenPieces[color],color,gameClientInfo.positions,gameClientInfo.chessboardStyle);
    updateScore(gameClientInfo.eatenPieces,gameClientInfo.positions);
    element.remove();
}

/**
 * @description Funzione che cambia la grafica quando dei pezzi vengono mangiati
 * @param {[[String,Number]]} eatenPieces Vettore con gli elementi al momento mangiati dalla persona + il loro valore
 * @param {String} color Colore dei pezzi che sto analizzando al momento
 * @param {{white:String,black:String}} positions La configurazione dei pezzi
 * @param {{value:Number,format:String}} style Lo stile attualmente in uso
 */
export function updateEatenPieces(eatenPieces,color,positions,style) {
    //calcolo (attraverso un insert sort) dove aggiungere la pedina
    let currentIndex = eatenPieces.length - 1; //controllo l'ultimo elemento
    let lastAdded = eatenPieces[currentIndex];   //lastAdded contiene l'ultimo pezzo mangiato


    while (currentIndex >= 0 && ( eatenPieces[currentIndex][1] >= lastAdded[1] || eatenPieces[currentIndex][2] )  ){    //l'ultimo controllo serve nei casi degli upgrade quando "fingo" che hai mangiato una pedina per aumentaere il punteggio    


        if (eatenPieces[currentIndex][0] == lastAdded[0] && currentIndex != eatenPieces.length -1 )   //se trovo un nome uguale (non deve essere il prima però), mi fermo
            break;
            
        --currentIndex;
    }


    eatenPieces.splice(currentIndex+1,0,lastAdded);
    eatenPieces.pop();
    //[eatenPieces[currentIndex], eatenPieces[eatenPieces.length - 1]] = [ eatenPieces[eatenPieces.length - 1],eatenPieces[currentIndex]];
    //creo l'elemento html da aggiungere a quelli presenti
    let container = document.getElementById(positions[color == "white" ? "black" : "white"] + "-pieces");
    let img = document.createElement("img");
    img.className = "captured-piece captured-piece-"+color+" captured-piece-"+lastAdded[0]+"-"+color;
    img.src = "./public/Game/img/smallPiece/" + color + style.value+"/" + lastAdded[0] + style.format;
    let collection = document.querySelectorAll(".captured-piece-" + color);

    if(currentIndex == -1)  //se è cosi vuol dire che devo aggiungerlo all'inizio
    {
        container.insertBefore(img,collection.item(0));
    }
    else if(collection.length > 0 && currentIndex != eatenPieces.length-1)
        collection.forEach((piece,index)=>{
            if(index == currentIndex){
                    container.insertBefore(img, collection.item(index+1));
                return;
            }
        });
    else
        container.append(img);
    
}
/**
 * @description Funzione che aggiorna il punteggio dei giocatori riguardo i pezzi mangiati
 * @param {[[String,Number]]} eatenPieces Il vettore con i pezzi mangiati da entrambi i colori
 * @param {{white:String,black:String}} positions La configurazione dei pezzi
 */
export function updateScore(eatenPieces,positions) {
    const computeScore = (array) =>{
        let somma = 0;
        for(let piece of array)
            somma+=piece[1]
        return somma;
    }
    const setScore = (score,color) =>{
        let position = positions[color];
        document.getElementById("score-"+position).innerText = "+"+score;
        document.getElementById("score-"+(position == "up"?"down":"up")).innerText = "";
    }
    let firstScore = computeScore(eatenPieces["white"]);
    let secondScore = computeScore(eatenPieces["black"]);
    if(firstScore > secondScore)
        setScore(firstScore-secondScore,"black");
    else if(secondScore > firstScore)
        setScore(secondScore-firstScore,"white");
    else{
        document.getElementById("score-up").innerText = "";
        document.getElementById("score-down").innerText = "";
    }
}


//muovi i pezzi cliccando col mouse e basta sulla SCACCHIERA, senza draggare
/**
 * @description Funzione che muove i pezzi nel campo, CLICCANDOCI sopra
 * @param {Game} game Oggetto che contiene tutta la partita 
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client

 */
export async function movePieceOnBoard(game, gameClientInfo) {
    if (JSON.stringify(gameClientInfo.info) == "{}" )
        return;
    let coord = this.id.split("pos")[1].split(".");   //ricavo le coordinate di dove ho cliccato
    let result = await checkForPossibleMove(parseInt(coord[1]), parseInt(coord[0]), game, gameClientInfo); //controlla se puoi muove li la pedina;
    if (result == 1) {
        if(!gameClientInfo.showPossibleMoves)
            animateMovePiece(coord[1], coord[0], gameClientInfo.info.element, "move", gameClientInfo);
        return;
    }
    //se arrivi qui vuol dire che hai CLICCATO su un punto della scacchiera dove non puoi muovere
    let can = true;
    //Se non è il tuo turno ma stai comunque visualizzando le possibili mosse da fare, non ti permetto di togliere i background già esistenti
    if(gameClientInfo.showPossibleMoves){
        let x = gameClientInfo.info.x.split("px")[0] / gameClientInfo.measures.sizeCella;
        let y = gameClientInfo.info.y.split("px")[0] / gameClientInfo.measures.sizeCella;

        if (gameClientInfo.currentSelectedSquare.length > 1 && gameClientInfo.currentSelectedSquare[1][0] == x && gameClientInfo.currentSelectedSquare[1][1] == y)
            can = false;
    }   
    if(can){
        setElementBackground(gameClientInfo.info.x.split("px")[0] / gameClientInfo.measures.sizeCella, gameClientInfo.info.y.split("px")[0] / gameClientInfo.measures.sizeCella, 1);
        gameClientInfo.currentSelectedSquare.pop();
    }
    Object.keys(gameClientInfo.info).forEach(key => delete gameClientInfo.info[key]);

    removePossibleMoves();
    document.getElementById("chessboard").classList.remove("cursor-pointer");
}


/**
 * @description Funzione che muove l'elemento HTML nella scacchiera
 * @param {Number} endX Coordinata x dove muovere il pezzo
 * @param {Number} endY Coordinata y dove muovere il pezzo
 * @param {HTMLElement} element Elemento html che rappresenta la pedina
 * @param {String} mode Stringa che indica con quale criterio si stava muovendo la piedina, drag/move/not modify
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client

 */
export function animateMovePiece(endX, endY, element, mode, gameClientInfo) {
     if (element == undefined)
        return;
    //metto la pedina che si sta muovendo sopra le altr
    if (mode == "move" || mode == "not-modify")
        element.classList.add("z-index");
    //la sposto nel campo
    element.style.top = "calc(" + endY + " * var(--sizeCella))";
    element.style.left = "calc(" + endX + " * var(--sizeCella))";
    //quando finisce l'animazione tolgo il fatto che la pedina stia sopra le altre
    setTimeout(() => {
        element.classList.remove("z-index");
    }, gameClientInfo.measures.transition_time-25);
    element.setAttribute("id", "ped" + endY + "." + endX); //modifico l'attributo per la x e y

    if (mode == "not-modify")
        return;

    //cambiare lo sfondo dove arriva la pedina

    //se 3 elementi sono già colorati, tolgo lo sfondo ai primi 2
    if (gameClientInfo.currentSelectedSquare.length > 2) {
        setElementBackground(gameClientInfo.currentSelectedSquare[0][0], gameClientInfo.currentSelectedSquare[0][1], 1);
        setElementBackground(gameClientInfo.currentSelectedSquare[1][0], gameClientInfo.currentSelectedSquare[1][1], 1);
        //tolgo i primi 2 elementi dal vettore
        gameClientInfo.currentSelectedSquare.splice(0, 2);
    }
    if (gameClientInfo.currentSelectedSquare.length != 2) {
        setElementBackground(endX, endY, 0);
        gameClientInfo.currentSelectedSquare.push([endX, endY]);
    }



    //azzero info, non piu cliccato niente
    Object.keys(gameClientInfo.info).forEach(key => delete gameClientInfo.info[key]);

    //tolgo il pointer a tutto il campo
    document.getElementById("chessboard").classList.remove("cursor-pointer");

    //tolgo tutti i div che mostravano i posti in cui potevo andare
    removePossibleMoves();

}



/**
 * @description Funzione che mostra sul campo, quando clicchi la pedina, dove quest'ultima può andare
 * @param {Number} x Coordinata x della pedina su cui hai cliccato
 * @param {Number} y Coordinata y della pedina su cui hai cliccato
 * @param {Game} game Oggetto che contiene la partita
 */
export function showPossibleMoves(x, y, game) {
    if (game.chessboard[y][x] == 0 || game.chessboard[y][x] == undefined)
        return;
    let moves = game.chessboard[y][x].returnPossibleMoves(game.chessboard);

    moves = game.filterPossibleMoves(moves, game.chessboard[y][x]);

    game.checkForCastle(moves, game.chessboard[y][x]);

    //moves è un vettore di oggeti {x,y}

    //mostro i ::after dei .square per far vedere i punti
    for (let i = 0; i < moves.length; ++i) {
        //controllo se è presente un en-passant (lo faccio qui e non dopo perche lo considero una mossa di spostamento)
        if (moves[i].enPassantPiece) {
            let div = document.getElementById("pos" + moves[i].y + "." + moves[i].x);
            div.classList.add("square-sel-eat");
            div.style.setProperty("--display2", "block");
        }
        else {
            let div = document.getElementById("pos" + moves[i].y + "." + moves[i].x);
            div.classList.add("square-sel");
            div.style.setProperty("--display", "block");
        }


    }

    //mostra anche i posti in cui puoi mangiare
    let eats = game.chessboard[y][x].returnPossibleEats(game.chessboard);

    eats = game.filterPossibleMoves(eats, game.chessboard[y][x]);
    //mostro i ::before dei .square per fare vedere i posti in cui puoi muoverti

    for (let i = 0; i < eats.length; ++i) {
        let div = document.getElementById("pos" + eats[i].y + "." + eats[i].x);
        div.classList.add("square-sel-eat");
        div.style.setProperty("--display2", "block");
    }
}




/**
 * @description Funzione che setta lo sfondo di una casella
 * @param {Number} x Coordinata x della casella
 * @param {Number} y Coordinata y della casella
 * @param {Boolean} remove Indica se devi rimuovere o aggiungere lo sfondo
 */
export function setElementBackground(x, y, remove) {
    // ( se sono su una cella scura lo sfondo sarà chiaro, altrimenti il contrario)
    y = parseInt(y);
    x = parseInt(x);
    if (!remove) {
        if ((y + x) % 2 == 0)
            document.getElementById("pos" + y + "." + x).classList.add("selected-light","selected");
        else
            document.getElementById("pos" + y + "." + x).classList.add("selected-dark","selected");
    }
    else {
        if ((y + x) % 2 == 0)
            document.getElementById("pos" + y + "." + x).classList.remove("selected-light","selected");
        else
            document.getElementById("pos" + y + "." + x).classList.remove("selected-dark","selected");
    }
}

 /**
 * @description Funzione che rimuove i posti che mostrano dove si possono muovere le pedina
 */

export function removePossibleMoves() {
    let divs = document.querySelectorAll(".square-sel");
    divs.forEach((div) => {
        div.style.setProperty("--display", "none");
        div.classList.remove("square-sel")
    });

    let divs2 = document.querySelectorAll(".square-sel-eat");
    divs2.forEach((div) => {
        div.style.setProperty("--display2", "none");
        div.classList.remove("square-sel-eat")
    });

}



/**
 * @description Funzione che agisce in base al risultato del movimento della pedina, viene chiamata appena dopo una mossa
 * @param {String[]} result Risultato del movimento della pedina, quello di base(la posizione 0), e
 * @param {Number} endY Coordinata y dell'ultima mossa
 * @param {Number} endX Coordinata x dell'ultima mossa
 * @param {Game} game Oggetto game che rappresenta la partita
 * @param {ClientGame} gameClientInfo Contains extra information about client side game
 */
export function checkAfterMove(results, endY, endX, game,gameClientInfo) {
    let mainResult = results[0];
    if (mainResult == "check") {  //se è scacco, coloro il re
        setColorKing("whatever", "remove", gameClientInfo);  //prima lo tolgo poi lo metto
        setColorKing((game.chessboard[endY][endX].color == "black" ? "white" : "black"), "set", gameClientInfo);
    }
    else if (mainResult == "checkmate") {
        gameClientInfo.ended = true;
        showEndGame(results, gameClientInfo, game.chessboard[endY][endX].color);
        return;
    }
    else if (mainResult == "draw") {
        gameClientInfo.ended = true;
        showEndGame(results, gameClientInfo,game.chessboard[endY][endX].color);
        return;
    }
    //se non è scacco
    else {
        setColorKing("whatever", "remove", gameClientInfo);
        return null;
    }
}

/**
 * 
 * @param {String} [color] Color of the king to be colored
 * @param {"Set"} [mode] Based on value, set or remove background
 * @param {ClientGame} gameClientInfo Contains extra information about game from clientSide
 */
function setColorKing(color, mode,gameClientInfo) {
    //I show the color only if your king is being checked
    if (mode == "set") {
        if (color != gameClientInfo.myColor)
            return;
        
        let kingPos = document.querySelector(".King-" + color).id.split("ped")[1].split(".");
        document.getElementById("pos" + kingPos[0] + "." + kingPos[1]).classList.add("king-check");
    }
    else {
        let div = document.querySelector(".king-check");
        if (div != null)
            div.classList.remove("king-check");
    }
}







/**
 * @description Funzione che muove il pezzo da upgradere
 * @param {Game} game Oggetto Game che contiene la partita
 * @param {String} color Stringa del colore del pedone che si sta upgradando
 * @param {Number} startX Coordinata x del pedone che si vuole muovere
 * @param {Number} startY Coordinata y del pedone che si vuole muovere
 * @param {Number} endX Coordinata x dove il pedone si vuole muovere
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 * @returns {Promise} Ritorna il nome del pezzo scelto dall'utente
 */

export async function upgradePiece(game, color, startX, startY, endX, gameClientInfo) {
    let endY = (gameClientInfo.positions[color] == "down" ? 0 : gameClientInfo.measures.height - 1);
    gameClientInfo.stopped = true;    //stoppo il game
    if (document.getElementById("ped" + endY + "." + endX) != null)
        document.getElementById("ped" + endY + "." + endX).style.display = "none";  //metto il pezzo che mangio invisibile
    let pawn = document.getElementById("ped" + startY + "." + startX);
    animateMovePiece(endX, endY, pawn, "move", gameClientInfo);
    //aspetto l'animazione ed elimino il pedone
    setTimeout(() => {
        pawn.remove();
    }, gameClientInfo.measures.transition_time-25);
    let pieceChosen = await choseUpgradePiece(endX, color,gameClientInfo.chessboardStyle,endY);

    //dopo che ottengo il nome del pezzo, lo creo
    createUpgradePiece(endX,color,pieceChosen,gameClientInfo,game);
   
    return new Promise(resolve => resolve(pieceChosen))
}

/**
 * @description Funzione che crea il pezzo upgradato
 * @param {Number} x Coordinata X di dove far spawnare il pezzo 
 * @param {String} color Colore del pezzo da spawnare
 * @param {"Queen" | "Knight" | "Rook" | "Bishop"} pieceChosen Nome del pezzo da spawnare
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 */
export function createUpgradePiece(x,color,pieceChosen,gameClientInfo,game) {
    let y = (gameClientInfo.positions[color] == "down" ? 0 : gameClientInfo.measures.height - 1);
    //dopo che scelgo il pezzo, credo il div di quest'ultimo
    let div = createPiece(x, y, pieceChosen, color, gameClientInfo.piecesValue, gameClientInfo.chessboardStyle);
    if (gameClientInfo.myColor != color)
        div.style.cursor = "default";
    dragElement(div, game, gameClientInfo);

    //aggiungo il pezzo che creo come se lo avessi mangiato in modo da aggiornare correttamente i punti
    let eatenPieces = gameClientInfo.eatenPieces[color == "white" ? "black" : "white"];


    eatenPieces.push(["nothing", gameClientInfo.piecesValue[pieceChosen] - 1/*Tolgo 1 perche il pedone che "sparisce" conta*/, true]);
    updateScore(gameClientInfo.eatenPieces, gameClientInfo.positions);
    gameClientInfo.stopped = false;   //rimetto il game
}

/**
 * @description Funzione che mi fa scegliero il pezzo da upgradere, ritorna il pezzo scelto dall'utente (Una promise)
 * @param {Number} x Coordinata x nella quale il pedone vuole eseguire il pedone
 * @param {String} color Colore della pedina che si sta upgradando
 * @param {{value:Number,style:String}} style Lo stile attualmente in uso della scacchiera
 * @param {Number} endY In che posizione sto facendo spawnare il menu per scegliere il pezzo (0/height-1)
 * @returns {Promise} Ritorna la promise che si resolva quando l'utente clicca contente il nome del pezzo scelto
 */
function choseUpgradePiece(x, color,style,endY) {
    let pieces = ["Queen", "Knight", "Rook", "Bishop"];
    let menu = document.querySelector("#upgrade-menu");
    menu.style.display = "flex";
    //setto le coordinate del mio pezzo
    menu.style.left = "calc("+x+"* var(--sizeCella))";

    menu.style.top = "calc(" + (endY == 0 ? 0 : endY-3)+" *var(--sizeCella))"; 

    //tolgo tutti i pezzi già presenti in precedenza
    document.querySelectorAll(".upgrade-piece").forEach(piece => piece.remove());
    return new Promise((resolve) => {
        for (let i = 0; i < 4; ++i) {
            let img = document.createElement("img");
            img.className = "upgrade-piece";
            img.src = "./public/Game/img/Piece/" + color + style.value+"/" + pieces[i] + style.format;
            img.addEventListener("click", () => {
                //la promise finisce quando clicco per upgradare il pezzo
                menu.style.display = "none";
                resolve(pieces[i]);
            });
            menu.append(img);
        }
    });


}




//gestire le freccie da tastiera
//lo userò per far ripetere le mosse

/**
 * @description Funzione che gestice le frecciette
 * @param {Event} event Evento di quando premi un tasto
 * @param {Game} game Oggetto che contiene la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client

 */
export function handleKeyPress(game, gameClientInfo, event) {
    if(gameClientInfo.stopped)  //If the game is stopped, don't do anything
        return;
    let keyPressed = event.key;
    //mostra la mossa precedente
    //(currentMossa) contiene la mossa a cui sono arrivato
    if (keyPressed == "Enter")
        console.log(socket);
    if (keyPressed == "ArrowLeft") {
        if (gameClientInfo.modalOpen){ 
            myModal.hide();
            gameClientInfo.modalOpen = false;
        }
        goBackMove(game,gameClientInfo);
    } 
    else if (keyPressed == "ArrowRight") {
        if (gameClientInfo.modalOpen) {
            myModal.hide();
            gameClientInfo.modalOpen = false;
        }
        goForwardMove(game,gameClientInfo);
    }
}

/**
 * @description Function that make moves back in time in chess game
 * @param {Game} game Oggetto game che contiene la partita
 * @param {ClientGame} gameClientInfo Contiene le informazioni aggiuntive per scacchi lato client
 */
function goBackMove(game,gameClientInfo) {
    //sono arrivato alla prima mossa della partita
    if (gameClientInfo.currentMossa == game.mosse.length) {
        return;
    }
    //tolgo uno sfondo selezionato se c'è
    if (gameClientInfo.currentSelectedSquare.length > 2) {
        setElementBackground(gameClientInfo.currentSelectedSquare[2][0], gameClientInfo.currentSelectedSquare[2][1], 1);
        gameClientInfo.currentSelectedSquare.pop();
    }

    document.getElementById("chessboard").classList.add("obfuscated");
    let mossa = game.mosse[gameClientInfo.currentMossa];
    animateMovePiece(mossa.startX, mossa.startY, document.getElementById("ped" + mossa.endY + "." + mossa.endX), "move", gameClientInfo);

    //tolgo i due sfondi della mossa attuale
    setElementBackground(mossa.startX, mossa.startY, 1);
    setElementBackground(mossa.endX, mossa.endY, 1);

    //se ho ancora mossa da fare, metto lo sfondo su quelle
    if (gameClientInfo.currentMossa < game.mosse.length - 1) {
        //metto gli sfondi sulla mossa precedente alla tua
        setElementBackground(game.mosse[gameClientInfo.currentMossa + 1].startX, game.mosse[gameClientInfo.currentMossa + 1].startY, 0);
        setElementBackground(game.mosse[gameClientInfo.currentMossa + 1].endX, game.mosse[gameClientInfo.currentMossa + 1].endY, 0);
    }
    //se la mossa ha causato un upgrade del mio pedone
    if (mossa.specialMove == "upgrade") {
        gameClientInfo.eatenPieces[mossa.piece.color == "white" ? "black" : "white"].pop();
        document.getElementById("ped" + mossa.startY + "." + mossa.startX).src = "./public/Game/img/Piece/" + mossa.piece.color + gameClientInfo.chessboardStyle.value + "/Pawn" + gameClientInfo.chessboardStyle.format;
        updateScore(gameClientInfo.eatenPieces, gameClientInfo.positions);
    }
    //se questa mossa ha causato un arrocco, devo spostare anche la torre
    if (mossa.specialMove == "castle") {
        let rookCoord = mossa.object;
        animateMovePiece(rookCoord.x, rookCoord.y, document.getElementById("ped" + rookCoord.y + "." + rookCoord.endX), "move", gameClientInfo);
    }
    //se questa mossa ha causato scacco, tolgo lo sfondo dal re
    if (mossa.causes == "check") {
        setColorKing("das", "remove", gameClientInfo);
    }
    //se la mossa che ho appena simulato causerà scacco, e esiste una mossa dopo la mia lo faccio vedere
    if (gameClientInfo.currentMossa < game.mosse.length - 1 && game.mosse[gameClientInfo.currentMossa + 1].causes == "check") {
        setColorKing("whatever", "remove", gameClientInfo);  //prima lo tolgo poi lo metto
        setColorKing(mossa.piece.color, "set", gameClientInfo);
    }

    //ok se nella mossa un pezzo è stato mangiato
    if (mossa.pieceEaten != 0) {
        //devo anche togliere questo pezzo da quelli mangiati
        let color = mossa.pieceEaten.color;
        let name = mossa.pieceEaten.name;
        let array = gameClientInfo.eatenPieces[color];
        //tolgo l'elemento dal vettore
        for (let i = 0; i < array.length; ++i) {
            if (array[i][0] == name)
                array.splice(i, 1);
        }
        //devo toglierlo anche dall'html
        let allEatenPieces = document.querySelectorAll(".captured-piece-" + name + "-" + color);
        if (allEatenPieces.length > 0)
            allEatenPieces.item(0).remove();
        else
            console.log("ERRORE", name, color, array);
        updateScore(gameClientInfo.eatenPieces, gameClientInfo.positions);
        //lo ricreo prendendo le coordinate di dove è stato mangiato
        createPiece(mossa.pieceEaten.x, mossa.pieceEaten.y, mossa.pieceEaten.name, mossa.pieceEaten.color, gameClientInfo.piecesValue, gameClientInfo.chessboardStyle);
    }
    ++gameClientInfo.currentMossa;
}
/**
 * @description Function that make moves forward in time in chess game
 * @param {Game} game Oggetto game che contiene la partita
 * @param {ClientGame} gameClientInfo Contiene informazioni aggiuntive per scacchi lato client
 * 
*/
export function goForwardMove(game,gameClientInfo) {
    if (gameClientInfo.currentMossa == 0) {   //se è uguale a 0, sei allo stesso punto di partenza
        return;
    }
    let mossa = game.mosse[gameClientInfo.currentMossa - 1];
    //se un pezzo viene mangiato, lo elimini
    //in questo caso lo faccio prima di animare il pezzo im modo da evitare che 2 pezzi abbiano lo stesso id
    if (mossa.pieceEaten != 0) {
        //ricavo il colore del pezzo mangiato e il suo nome
        //devo aggiungere l'elemento html mangiato e il suo corrispondente nel vettore
        let color = mossa.pieceEaten.color;
        let name = mossa.pieceEaten.name;
        let value = mossa.pieceEaten.value;
        let array = gameClientInfo.eatenPieces[color];
        array.push([name, value]);
        updateEatenPieces(array, color, gameClientInfo.positions, gameClientInfo.chessboardStyle);
        updateScore(gameClientInfo.eatenPieces, gameClientInfo.positions);

        //elimino il pezzo html
        document.getElementById("ped" + mossa.pieceEaten.y + "." + mossa.pieceEaten.x).remove();
    }

    animateMovePiece(mossa.endX, mossa.endY, document.getElementById("ped" + mossa.startY + "." + mossa.startX), "move", gameClientInfo);

    //tolgo tutti gli sfondi, solo se devo
    if (gameClientInfo.currentMossa < game.mosse.length) {
        setElementBackground(game.mosse[gameClientInfo.currentMossa].startX, game.mosse[gameClientInfo.currentMossa].startY, 1);
        setElementBackground(game.mosse[gameClientInfo.currentMossa].endX, game.mosse[gameClientInfo.currentMossa].endY, 1);
    }
    //metto gli sfondi solo dove hai mosso
    setElementBackground(mossa.startX, mossa.startY, 0);
    setElementBackground(mossa.endX, mossa.endY, 0);
    //se la mossa ha causato un upgrade del mio pedone
    if (mossa.specialMove == "upgrade") {
        gameClientInfo.eatenPieces[mossa.piece.color == "white" ? "black" : "white"].push(["nothing", gameClientInfo.piecesValue[mossa.object.upgrade] - 1/*-1 per il pedone mangiato*/, true]);
        document.getElementById("ped" + mossa.endY + "." + mossa.endX).src = "./public/Game/img/Piece/" + mossa.piece.color + gameClientInfo.chessboardStyle.value + "/" + mossa.object.upgrade + gameClientInfo.chessboardStyle.format;
        updateScore(gameClientInfo.eatenPieces, gameClientInfo.positions)
    }
    //se questa mossa ha causato un arrocco, devo spostare anche la torre
    if (mossa.specialMove == "castle") {
        let rookCoord = mossa.object;
        animateMovePiece(rookCoord.endX, rookCoord.y, document.getElementById("ped" + rookCoord.y + "." + rookCoord.x), "move", gameClientInfo);
    }
    //se questa mossa ha causato scacco, metto lo sfondo al re
    if (mossa.causes == "check") {
        setColorKing("whatever", "remove", gameClientInfo);  //prima lo tolgo poi lo metto
        setColorKing(mossa.piece.color == "white" ? "black" : "white", "set", gameClientInfo);
    }
    //se non ha causato scacchi tolgo lo sfondo
    else {
        setColorKing("dsaasd", "remove", gameClientInfo);
    }
    --gameClientInfo.currentMossa;
    if (gameClientInfo.currentMossa == 0){
        document.getElementById("chessboard").classList.remove("obfuscated");
        
        //Se questa mossa ha cusato la fine della partita
        if(gameClientInfo.ended){
            showEndGame([mossa.causes,mossa.extraCauses],gameClientInfo,mossa.piece.color);
        }
    }
}
















/**
 * @description Funzione che calcola le coordinate massime in cui ti puoi muovere
 * @param {Number} value Dimensione massima da considerare
 * @param {Number} globalMeasures Contiene la grandezza della cella
 * @returns {Number} Il risultato corretto
 */
function getMaxMeasure(value, sizeCella) {
    return value * sizeCella -sizeCella / 2;
}
/**
 * @description Funzione che ricava le coordinate di un elemeno
 * @param {HTMLElement} element elemento html da cui voglio ricavare le coordinate
 * @param {Object} sizeCella Contiene la grandezza della cella
 * @returns {Number[]} ritorna il vettore con le coordinate
 */
function getCoordinates(element,sizeCella) {
    return convertCoordinates(getComputedStyle(element).getPropertyValue("left"), getComputedStyle(element).getPropertyValue("top"),sizeCella);
}
/**
 * @description Funzione che converte le coordinate rimuovendo i "px" e portandole al centro della pedina
 * @param {String} allX Posizione left di un elemento formato dal numero + "px"
 * @param {String} allY Posizione top di un elemento formato dal numero + "px"
 * @param {Object} sizeCella Contiene la grandezza della cella
 * @returns {Number[]} Ritorna il vettore composto dalle coordinate
 */
function convertCoordinates(allX, allY,sizeCella) {
    return [parseInt((parseInt(allX.split("px")[0]) + parseInt(sizeCella / 2)) / sizeCella), parseInt((parseInt(allY.split("px")[0]) + parseInt(sizeCella / 2)) / sizeCella)];
}

