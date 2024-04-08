import express from "express";
const app = express();
import http from "http";
const server = http.createServer(app);

//required for socket.io
import { Server } from "socket.io";
const io = new Server(server);

const __dirname = process.cwd();

//Class Game that represents the chess game 

import Game from "./public/Game/Classes/Game.js";
import Piece from "./public/Game/Classes/Pieces/Piece.js";
/**
 * @description Person who is looking for a match
 * @type {{player:String,socketId:String,matchId:String}}
 */
const possiblePerson = {}; 
/**
 * @description Array with the actual match being played
 * @type {Game[]} 
 */
const currentGames = [];

/**
 * @description Object with the standard settings for chess games
 */
const standardInfo = {
    width:8,
    height:8,
    mode:0
};



//static files used
app.use("/public", express.static('./public/'));

//the main page of the site is the lobby
app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/Pages/index.html");
});

io.on("connection",(socket)=>{

    //when a user is looking for a game
    socket.on("lookForGame",(nickname,callback)=>{
        let myObj = {
            player:nickname,
            socketId:socket.id
        }
        //if there is NOT a player who is looking for a match i add myself there
        if(possiblePerson.player === undefined){
            possiblePerson.player = myObj.player;
            possiblePerson.socketId = myObj.socketId;
            possiblePerson.matchId = generateRandomCode();
            socket.join(possiblePerson.matchId);    //Join socket to game's room
            callback({noplayer:true});
        }
        //the game is starting
        else{
            //ok, there i have to decide who is white and bkack
            let colors = ["white","black"].sort(()=>.5-Math.random());
            //i return to the client that game has started
            callback({opponent:possiblePerson.player,color:colors[0],settings:standardInfo});
            //i also have to tell to the other client that game has started
            io.to(possiblePerson.socketId).emit("gameStarting",{opponent:myObj.player,color:colors[1],settings:standardInfo});

            socket.join(possiblePerson.matchId);    //Join socket to game's room
            currentGames.push({
                gameId: possiblePerson.matchId,
                socketIds:[socket.id,possiblePerson.socketId],
                game:1
            });


            //clear possiblePerson information
            delete possiblePerson.player;
            delete possiblePerson.socketId;
            delete possiblePerson.matchId;

        }
    });

    
    socket.on("movePiece", (/**
     *@type {{x:Number,y:Number,move:{x:Number,y:Number,castle:Boolean | undefined,rook:{x:Number,y:Number,endX:Number}|undefined,enPassantPiece:{x:Number,y:Number} | undefined,upgrade:Boolean | undefined},causes:String,eat:Boolean}} Contains all info about chess move
     */data)=>{
        let room = Array.from(socket.rooms)[1];
        //I have to reverse every y coords present (The chessboard is reserved in every player!!)
        const reverseY = (coord) =>{
            return Math.abs(coord - standardInfo.height + 1)
        }
        //These data are always present
        data.y = reverseY(data.y);
        data.move.y = reverseY(data.move.y);

        if(data.move.castle)
            data.move.rook.y = reverseY(data.move.rook.y);

        if(data.move.enPassantPiece){
            data.move.enPassantPiece.y = reverseY(data.move.enPassantPiece.y);

        }
        socket.to(room).emit("movePieceFromServer",data);
    });

    /**
     * @description Function that generates the random code for chess games
     */
    function generateRandomCode() {
        let code = "";
        for(let i = 0;i<5;++i){
            //In ascii talbe, capital letters go from 65 to 90
            let randomLetter = Math.floor(Math.random() * 26) + 65;
            code+= String.fromCharCode(randomLetter);
        }
        //I add a letter that represent currentGames length so that i'll get always different codes
        code+=String.fromCharCode(currentGames.length + 65);
        return code;
    }

});


server.listen(5000 || process.env, () => {
    console.log(`Server listening on 5000*`);
});