// "use strict";
const app = new PIXI.Application(1200, 900);
document.querySelector("#game").appendChild(app.view);
app.renderer.backgroundColor = 0xaaaaaa;

PIXI.loader.
    add(["Images/tile1.png", "Images/tile2.png", "Images/header.png",
        "Images/BigBlack.png", "Images/MedBlack.png", "Images/SmallBlack.png", "Images/TinyBlack.png",
        "Images/BigTan.png", "Images/MedTan.png", "Images/SmallTan.png", "Images/TinyTan.png"]).
    on("progress", e => { console.log(`progress=${e.progress}`) }).
    load(setup);

let board = [];  // A 2D array of Stacks
let playerStack = [];
let opponentStack = [];
let stage;
let gameScene;
let movingPiece;
let playersTurn;
let player;
let opponent;
let gameover = false;
let headerText;
let timer;
let moveSound;

// Function that gets called at the start of the game that is used to set up the board.
function setup(){
    // stage exists.
    if (stage) {
        // Remove everything from the stage...
        for (let i = stage.children.length - 1; i >= 0; i--) {
            stage.removeChild(stage.children[i]);
        }
    }
    // Create the move sound.
    moveSound = new Howl({
        src: ['Sounds/moveSound.wav']
    });
    gameover = false;
    stage = app.stage;
    gameScene = new PIXI.Container();
    gameScene.visible = true;
    stage.addChild(gameScene);
    // Start update loop
    app.ticker.add(gameLoop);
    playersTurn = true;
    // Initalize each row to be an empty set of pieces.
    let row1 = [new Stack(), new Stack(), new Stack(), new Stack()];
    let row2 = [new Stack(), new Stack(), new Stack(), new Stack()];
    let row3 = [new Stack(), new Stack(), new Stack(), new Stack()];
    let row4 = [new Stack(), new Stack(), new Stack(), new Stack()];
    // Link up each row with each corresponding entry in board.
    board[0] = row1;
    board[1] = row2;
    board[2] = row3;
    board[3] = row4;
    timer = 0;
    let header = new PIXI.Sprite(PIXI.loader.resources["Images/header.png"].texture);
    gameScene.addChild(header);
    header.x = 200;
    header.y = 0;
    // Text indicating state of the game.
    headerText = new PIXI.Text("Your turn to move!");
    headerText.style = new PIXI.TextStyle({
        fill: 0xBBBBBB,
        fontSize: 60,
        fontFamily: 'Arial',
        stroke: 0x000000,
        strokeThickness: 6
    });
    headerText.x = 210;
    headerText.y = 10;
    gameScene.addChild(headerText);
    // Label for players stack.
    let playerLable = new PIXI.Text("Player\nStacks");
    playerLable.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 35,
        fontFamily: 'Arial',
        stroke: 0x000000,
        strokeThickness: 6
    })
    playerLable.x = 45;
    playerLable.y = 0;
    gameScene.addChild(playerLable);
    // Label for opponent stack.
    let opponentLable = new PIXI.Text("Opponent\n   Stacks");
    opponentLable.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 35,
        fontFamily: 'Arial',
        stroke: 0x000000,
        strokeThickness: 6
    })
    opponentLable.x = 1015;
    opponentLable.y = 0;
    gameScene.addChild(opponentLable);
    let xOffSet = 200;
    let yOffSet = 100;
    // Create grid of cells.
    for (let i = yOffSet; i < 800 + yOffSet; i += 200) {
        for (let j = xOffSet; j < 800 + xOffSet; j += 200) {
            let path;
            // Creates a grid like patter
            if ((((i - yOffSet) / 200) % 2) == (((j - xOffSet) / 200) % 2)) {
                path = "Images/tile1.png";
            }
            else {
                path = "Images/tile2.png";
            }
            let square = new PIXI.Sprite(PIXI.loader.resources[path].texture);
            gameScene.addChild(square);
            square.x = j;
            square.y = i;
        }
    }
    // Create each piece in an opponent stack
    let ostack1 = new Stack();
    let ostack2 = new Stack();
    let ostack3 = new Stack();
    ostack1.makeStack("Opponent");
    ostack2.makeStack("Opponent");
    ostack3.makeStack("Opponent");
    // Add them to the scene.
    for (let i = 3; i >= 0; i--) {
        gameScene.addChild(ostack1.stack[i]);
        gameScene.addChild(ostack2.stack[i]);
        gameScene.addChild(ostack3.stack[i]);
    }
    // Position them.
    for (let i = 0; i < 4; i++) {
        ostack1.stack[i].x = 1100;
        ostack1.stack[i].y = (400);
        ostack2.stack[i].x = 1100;
        ostack2.stack[i].y = (600);
        ostack3.stack[i].x = 1100;
        ostack3.stack[i].y = (800);
    }
    opponentStack[0] = ostack1;
    opponentStack[1] = ostack2;
    opponentStack[2] = ostack3;

    // Create each piece in the players stack.
    let pstack1 = new Stack();
    let pstack2 = new Stack();
    let pstack3 = new Stack();
    pstack1.makeStack("Player");
    pstack2.makeStack("Player");
    pstack3.makeStack("Player");
    // Add them to the scene.
    for (let i = 3; i >= 0; i--) {
        gameScene.addChild(pstack1.stack[i]);
        gameScene.addChild(pstack2.stack[i]);
        gameScene.addChild(pstack3.stack[i]);
    }
    // Position them.
    for (let i = 0; i < 4; i++) {
        pstack1.stack[i].x = 100;
        pstack1.stack[i].y = (200);
        pstack2.stack[i].x = 100;
        pstack2.stack[i].y = (400);
        pstack3.stack[i].x = 100;
        pstack3.stack[i].y = (600);
    }
    playerStack[0] = pstack1;
    playerStack[1] = pstack2;
    playerStack[2] = pstack3;
    // subscribe player pieces to the events.
    for(let i = 0; i < 4; i++){
        subscribe(playerStack[0].stack[i]);
        subscribe(playerStack[1].stack[i]);
        subscribe(playerStack[2].stack[i]);
    }  
    // Create both the player and opponent objects.
    player = new Player("Player", playerStack, board);
    opponent = new Player("Opponent", opponentStack, board);  

    // Reset button style.
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFFFF00,
        fontSize: 60,
        fontFamily: 'Arial',
        stroke: 0x000000,
        strokeThickness: 6
    });
    // Reset buttons.
    let resetButton = new PIXI.Text("Reset");
    resetButton.style = buttonStyle;
    resetButton.x = 830
    resetButton.y = 10;
    resetButton.interactive = true;
    resetButton.buttonMode = true;
    resetButton.on("pointerup", setup);
    resetButton.on('pointerover', e=>e.target.alpha = 0.7);
    resetButton.on('pointerout', e=>e.currentTarget.alpha = 1.0);
    gameScene.addChild(resetButton);
}
// Hook up the piece to all of the event listeners.
function subscribe(p){
     // Add events
     p.interactive = true;
     p.buttonMode = true;
     p
         // events for drag start
         .on('mousedown', onDragStart)
         .on('touchstart', onDragStart)
         // events for drag end
         .on('mouseup', onDragEnd)
         .on('mouseupoutside', onDragEnd)
         .on('touchend', onDragEnd)
         .on('touchendoutside', onDragEnd)
         // events for drag move
         .on('mousemove', onDragMove)
         .on('touchmove', onDragMove);
}
// Piece has started moving.
function onDragStart(event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        //this.alpha = 0.5;
        this.dragging = true;
        this.startx = this.x;
        this.starty = this.y;
        movingPiece = this;
        let piece = this;
        gameScene.removeChild(piece);
        gameScene.addChild(piece);
}
// Piece has finished moving.
function onDragEnd() {
    this.dragging = false;
    this.data = null;
    // Check to see mouse was released on the moving piece.
    if (this == movingPiece) {
        // Piece was able to be moved.
        if (player.movePiece(this.x, this.y, this, board, playerStack)) {
            headerText.text = "Opponent is thinking...";
            playersTurn = false;
            // Check if it was a winning move.
            if (checkWin("Player")) {
                gameover = true ;
                setPiecesInteractive(false);
                headerText.text = "You win!";
                headerText.style.fill = 0x00FF00;
            }
        }
    }
    moveSound.play();
}
// Piece is currently being moved.
function onDragMove() {
    if (this.dragging) {
        let newPosition = this.data.getLocalPosition(this.parent);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
    }
}
// The main loop of the game.
function gameLoop() {
    // Game hasn't ended.
    if (!gameover) {
        // Players turn to move.
        if (playersTurn) {
            headerText.text = "Your turn to move...";
        }
        // Opponents turn to move.
        else {
            timer += .005;
            // Wait a certain amount of time...
            if (timer > .4) {
                // Disable player from moving pieces.
                setPiecesInteractive(false);
                // Process opponents moves.
                let piece = opponent.calculateMove(playerStack, opponentStack, board);
                moveSound.play();
                gameScene.removeChild(piece);
                gameScene.addChild(piece);
                playersTurn = true;
                // If the opponent won..
                if (checkWin("Opponent")) {
                    headerText.text = "You lose!";
                    headerText.style.fill = 0xFF0000;
                    gameover = true;
                    setPiecesInteractive(false);
                }
                // otherwise it is now the players turn again.
                else {
                    setPiecesInteractive(true);
                }
                timer = 0;
            }
        }
    }
}

// Change the interactive state of each of the player's pieces
function setPiecesInteractive(interactive){
    // Iterate through playerstack
    for(let i = 0; i < 4; i++){
        if(playerStack[0].stack[i]){
            playerStack[0].stack[i].interactive = interactive;
        }
        if(playerStack[1].stack[i]){
            playerStack[1].stack[i].interactive = interactive;
        }
        if(playerStack[2].stack[i]){
            playerStack[2].stack[i].interactive = interactive;
        }
    }
    // Iterate through the board
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 4; j++){
            for(let k = 0; k < 4; k++){
                if(board[i][j].stack[k]){
                    board[i][j].stack[k].interactive = interactive;
                }
            }
        }
    }
}
// Check if the specified player has won the game.
function checkWin(ownership){
    let win = true;
    // Check horizontal rows.
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 4; j++){
            if(!board[i][j].top() || board[i][j].top().ownership != ownership){
                win = false;
            }
        }
        // There was a win.
        if(win){
            return true;
        }
        win = true;
    }
    // Check vertical rows
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 4; j++){
            if(!board[j][i].top() || board[j][i].top().ownership != ownership){
                win = false;
            }
        }
        // There was a win.
        if(win){
            return true;
        }
        win = true;
    }
    // Check diagonals
    for(let i = 0; i < 4; i++){
        if(!board[i][i].top() || board[i][i].top().ownership != ownership){
            win = false;
        }
    }
    // There was a win.
    if(win){
        return true;
    }
    win = true;
    for(let i = 0; i < 4; i++){
        if(!board[i][3-i].top() || board[i][3-i].top().ownership != ownership){
            win = false;
        }
    }
    // There was a win.
    if(win){
        return true;
    }
    return false;
}
/*
// Debug function to display the internal storage of the board.
function printBoard(){
    for(let i = 0; i < 4; i++){
        let row = "";
        for(let j = 0; j < 4; j++){
            if(!board[i][j].top()){
                row += " NA ";
            }
            else if(board[i][j].top().ownership == "Player"){
                let size = board[i][j].top().size;
                row += " P" + size +" ";
            }
            else{
                let size = board[i][j].top().size;
                row += " O" + size + " ";
            }
        }
        console.log(row);
    }
    console.log("\n\n\n");
}
*/