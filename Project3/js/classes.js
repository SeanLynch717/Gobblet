let MAX_INT = Math.pow(2,53) + 1;

// Class that represents a single piece in the game.
class Piece extends PIXI.Sprite {
    // Construct a Piece.
    // @parem sprite - the piece's sprite.
    // @param size - the size of the piece:
    //    3 - Big Boy
    //    2 - Medium Boy
    //    1 - Small Boy
    //    0 - Tiny Boy
    // @param ownership - To whom the piece belongs too:
    //    "Player" - the player
    //    "Opponent" - the AI.
    constructor(size, ownership) {
        // Create player piece of the specified size.
        if (ownership == "Player") {
            if (size == 3) {
                super(PIXI.loader.resources["Images/BigTan.png"].texture);   // Biggest piece at the first position.
            }
            else if (size == 2) {
                super(PIXI.loader.resources["Images/MedTan.png"].texture);
            }
            else if (size == 1) {
                super(PIXI.loader.resources["Images/SmallTan.png"].texture);
            }
            else {
                super(PIXI.loader.resources["Images/TinyTan.png"].texture);   // Smallest piece at the last position. 
            }
        }
        // Create opponent piece of the specified size.
        else {
            if (size == 3) {
                super(PIXI.loader.resources["Images/BigBlack.png"].texture);   // Biggest piece at the first position.
            }
            else if (size == 2) {
                super(PIXI.loader.resources["Images/MedBlack.png"].texture);
            }
            else if (size == 1) {
                super(PIXI.loader.resources["Images/SmallBlack.png"].texture);
            }
            else {
                super(PIXI.loader.resources["Images/TinyBlack.png"].texture);   // Smallest piece at the last position. 
            }
        }
        // Set other piece properties.
        this.size = size;
        this.ownership = ownership;
        this.pivot.set(100, 100);
    }
    // Determine if two pieces are the same.
    equiv(p2){
        return(this.startx == p2.startx && this.starty == p2.starty && this.size == p2.size);
    }
}
// A collection of up to four pieces.
class Stack{
    // Properly construct a Stack object.
    constructor(){
        this.stack = [null, null, null, null];
    }
    // Set up a full stack of pieces.
    makeStack(ownership){
         for(let i = 0; i < 4; i++){
             this.stack[i] = new Piece(3 - i, ownership);
         }
    }
    // Get the top Piece of a stack, null if it is empty.
    top(){
        for(let i = 0; i < 4; i++){
            if(this.stack[i]){
                return this.stack[i];
            }
        }
        return null;
    }
    // Remove the top piece of the stack. Do nothing if empty.
    pop(){
        for(let i = 0; i < 4; i++){
            if(this.stack[i]){
                this.stack[i] = null;
                return;
            }
        }
    }
    // Add this piece to the stack.
    add(piece){
        this.stack[3 - piece.size] = piece;
    }
}
// Class representing a Player in the game.
class Player{
    // Properly contructs a Player object.
    //
    // @param ownership - Either "Player" or "Opponent"
    // @param stacks - the off board stacks associated with this player.
    // @param board - a reference to the board.
    constructor(ownership, stacks, board) {
        this.ownership = ownership;
        this.stacks = stacks;
        this.board = board;
        this.root = null;
    }
    // If possible, move the specified piece to the targetX,targetY location on the board.
    // @param targetX - screen coordinates.
    // @param targetY - screen coordinates.
    movePiece(targetX, targetY, piece, board, stacks) {
        // Target location in board to place the piece.
        let arrI = Math.trunc((200 + (200 * Math.trunc(((targetY - 100) / 200))) - 200) / 200);
        let arrJ = Math.trunc((300 + (200 * Math.trunc(((targetX - 200) / 200))) - 300) / 200);
        // Piece was dropped off within the board, and in a valid position.
        if (targetX > 200 && targetX < 1000 && targetY > 100 && targetY < 900
            && (!board[arrI][arrJ].top() || board[arrI][arrJ].top().size < piece.size)) {
            // Check if this piece is coming from stack1.
            if (stacks[0].top() && stacks[0].top().equiv(piece)) {
                stacks[0].pop();
            }
            // Check if this piece is coming from stack2.
            else if (stacks[1].top() && stacks[1].top().equiv(piece)) {
                stacks[1].pop();
            }
            // Check if this piece is coming from stack3.
            else if (stacks[2].top() && stacks[2].top().equiv(piece)) {
                stacks[2].pop();
            }
            // Piece was moved from on the board.
            else {
                let startArrI = Math.trunc((piece.starty - 200) / 200);
                let startArrJ = Math.trunc((piece.startx - 300) / 200);
                // Remove the piece from the board at the pieces starting position.
                board[startArrI][startArrJ].pop();
            }

            // Snap the piece into the closest square.
            piece.x = 300 + (200 * Math.trunc(((targetX - 200) / 200)));
            piece.y = 200 + (200 * Math.trunc(((targetY - 100) / 200)));

            board[arrI][arrJ].add(piece);
            return true;
        }
        // Piece was dragged somewhere off the board, so set it's position back
        // to where is was before being dragged.
        else {
            // Position the piece back at where it started.
            piece.x = piece.startx;
            piece.y = piece.starty;
        }
    }
    /*
    // The AI is the maximizer
    getChildrenArr(board, playerStacks, opponentStacks, isMaximizer){
        let arr = [];
        let stacks = isMaximizer ? playerStacks : opponentStacks;
        // Calculate every possible move from pieces on the stack off the board, moved onto the board.
        for(let i = 0; i < 3; i++){
            let topPiece;
            if(topPiece = stacks[i].top()){
                for(let row = 0; row < 4; row++){
                    for(let col = 0; col < 4; col++){
                        // The space is empty, or the pieces size is bigger than the piece there.
                        if(!board[row][col].top() || topPiece.size > board[row][col].top().size){
                            // Make a copy of the parent
                            let child = new Node(board, playerStacks, opponentStacks, isMaximizer);
                            child.offboard = true;
                            child.offboardStack = i;
                            child.startX = null;
                            child.startY = null;
                            child.endX = 300 + col * 200;
                            child.endY = 200 + row * 200;
                            topPiece.startx = 0;
                            topPiece.starty = 0; 
                            // Update the copied board to display this move.
                            this.movePiece(300 + col * 200, 200 + row * 200, topPiece, child.gameState.board, isMaximizer ? child.gameState.opponentStacks : child.gameState.playerStacks);
                            // Add this new Gamestate to the child array.
                            arr.push(child);
                        }                  
                    }
                }
            }
        }
        // Calculate every possible move from pieces on the board .
        for(let fromI = 0; fromI < 4; fromI++){
            for(let fromJ = 0; fromJ < 4; fromJ++){
                let topPiece = board[fromI][fromJ].top();
                // There is a piece of type maximizer at this position of the board.
                if(topPiece && ((isMaximizer && topPiece.ownership == "Player") || (!isMaximizer && topPiece.ownership == "Opponent"))){
                    for(let toI = 0; toI < 4; toI++){
                        for(let toJ = 0; toJ < 4; toJ++){
                            if(!board[toI][toJ].top() || topPiece.size > board[toI][toJ].top().size){
                                // Make a copy of the parent
                                let child = new Node(board, playerStacks, opponentStacks, isMaximizer);
                                child.offboard = false;
                                child.offboardStack = null;
                                child.startX = 300 + fromJ * 200;
                                child.startY = 200 + fromI * 200;
                                child.endX = 300 + toJ * 200;
                                child.endY = 200 + toI * 200;
                                topPiece.startx = 300 + fromJ * 200;
                                topPiece.starty = 200 + fromI * 200;
                                // Update the copied board to display this move.
                                this.movePiece(300 + toJ * 200, 200 + toI * 200, topPiece, child.gameState.board, isMaximizer ? child.gameState.opponentStacks : child.gameState.playerStacks);
                                // Add this new Gamestate to the child array.
                                arr.push(child);  
                            }
                        }
                    }
                }
            }
        }
        return arr;
    }
    */
    /*
    // Heuristic for how good the board is for each player.
    // >0 - opponent has advantage.
    // <0 - player has the advantage.
    evaluation(node){
        if(node.isWin("Opponent")){
            return MAX_INT;
        }
        else if(node.isWin("Player")){
            return -MAX_INT;
        }
        let total = 0;
        let board = node.gameState.board;
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 4; j++){
                if(board[i][j].top()){
                    if(board[i][j].top().ownership == "Opponent"){
                        total += 1;
                    }
                    else{
                        total -=1;
                    }
                }
            }
        }
        return total;
    }
    */
    /*
    max(n1, n2){
        if(n1.score > n2.score){
            return n1;
        }
        return n2;
    }
    */
    /*
    min(n1, n2){
        if(n1.score < n2.score){
            return n1;
        }
        return n2;
    }
    */
    /*
    minimax(node, depth, alpha, beta, isMax){
        if(depth == 0 || node.isWin("Player") || node.isWin("Opponent")){
            node.score = this.evaluation(node);
            return node;
        }
        if(isMax){
            let maxEval = new Node(null, null, null, true);
            maxEval.score = -MAX_INT;
            let children = this.getChildrenArr(node.gameState.board, node.gameState.playerStacks, node.gameState.opponentStacks, false);
            for(let i = 0; i < children.length; i++){
                let evl = this.minimax(children[i], depth - 1, alpha, beta, false);
                maxEval = this.max(maxEval, evl);
                alpha = this.max(alpha, evl);
                if(beta.score <= alpha.score){
                    break;
                }
            }
            return maxEval;
        }
        else{
            let minEval = new Node(null, null, null, false);
            minEval.score = MAX_INT;
            let children = this.getChildrenArr(node.gameState.board, node.gameState.playerStacks, node.gameState.opponentStacks, true);
            for(let i = 0; i < children.length; i++){
                let evl = this.minimax(children[i], depth - 1, alpha, beta, true);
                minEval = this.min(minEval, evl);
                beta = this.min(beta, evl);
                if(beta.score <= alpha.score){
                    break;
                }
            }
            return minEval;
        }
    }
    */
    // The basic player stategy. Move a pice to an empty spot on the board.
    basicStrategy(playerStacks, opponentStacks, board) {
        let piece = null;
        // Check for available piece from stack.
        for (let i = 0; i < 3; i++) {
            if (!piece && opponentStacks[i].top()) {
                piece = opponentStacks[i].top();
            }
        }
        // No pieces left in stack, so check the board.
        if (!piece) {
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    if (!piece && board[i][j].top() && board[i][j].top().ownership == "Opponent") {
                        piece = board[i][j].top();
                    }
                }
            }
        }
        let x = -1;
        let y = -1;
        // Look for a position on the board to move the pice too.
        for (let i = 1; i < 3; i++) {
            for (let j = 1; j < 3; j++) {
                if (!board[i][j].top()) {
                    x = j;
                    y = i;
                }
            }
        }
        if (x < 0 && y < 0) {
            do {
                x = Math.trunc((Math.random() * 4));
                y = Math.trunc((Math.random() * 4));
            } while (!(!board[y][x].top() || piece.size > board[y][x].top().size));
        }
        piece.startx = piece.x;
        piece.starty = piece.y;
        this.movePiece(300 + (200 * x), 200 + (200 * y), piece, board, opponentStack);
        return piece;
    }
    winMove(opponentStacks, board){
        let winningX;
        let winningY;
        let total;
        let pieceToMove;
        // horizontal rows.
        for(let i = 0; i < 4; i++){
            total = 0;
            winningX = -1;
            winningY = -1;
            for(let j = 0; j < 4; j++){
                // Theres a piece that belongs to the opponent there.
                if(board[i][j].top() && board[i][j].top().ownership == "Opponent"){
                    total++;
                }
                // The spot is either empty, or is a play piece of size 2 or smaller.
                else if(!board[i][j].top() || (board[i][j].top() && board[i][j].top().size != 3)){
                    winningX = j;
                    winningY = i;
                }
            }
            if (total == 3 && winningX > -1 && winningY > -1) {
               break;
            }
        }
        // No winning move in the horizontal rows
        if (!(total == 3 && winningX > -1 && winningY > -1)) {
            // vertical rows.
            for (let col = 0; col < 4; col++) {
                total = 0;
                winningX = -1;
                winningY = -1;
                for (let row = 0; row < 4; row++) {
                    // Theres a piece that belongs to the opponent there.
                    if (board[row][col].top() && board[row][col].top().ownership == "Opponent") {
                        total++;
                    }
                    // The spot is either empty, or is a play piece of size 2 or smaller.
                    else if (!board[row][col].top() || (board[row][col].top() && board[row][col].top().size != 3)) {
                        winningX = col;
                        winningY = row;
                    }
                }
                if (total == 3 && winningX > -1 && winningY > -1) {
                    break;
                }
            }
        }
        if (!(total == 3 && winningX > -1 && winningY > -1)){
            total = 0;
            winningX = -1;
            winningY = -1;
            for(let i = 0; i < 4; i++){
                if(board[i][i].top() && board[i][i].top().ownership == "Opponent"){
                    total++;
                }
                else if(!board[i][i].top() || (board[i][i]).top() && board[i][i].top().size != 3){
                    winningX = i;
                    winningY = i;
                }
            }
        }
        if (!(total == 3 && winningX > -1 && winningY > -1)){
            total = 0;
            winningX = -1;
            winningY = -1;
            for(let i = 0; i < 4; i++){
                if(board[3-i][i].top() && board[3-i][i].top().ownership == "Opponent"){
                    total++;
                }
                else if(!board[3-i][i].top() || (board[3-i][i]).top() && board[3-i][i].top().size != 3){
                    winningX = i;
                    winningY = 3-i;
                }
            }
        }
        if (total == 3 && winningX > -1 && winningY > -1) {
            // Try to move a piece off of the board.
            for (let k = 0; k < 3; k++) {
                if (pieceToMove = opponentStacks[k].top()) {
                    // There is either no piece in the winning position, or this piece can gobble 
                    if (!board[winningY][winningX].top() || board[winningY][winningX].top().size < pieceToMove.size) {
                        pieceToMove.startx = pieceToMove.x;
                        pieceToMove.starty = pieceToMove.y;
                        this.movePiece((winningX * 200) + 300, (winningY * 200) + 200, pieceToMove, board, opponentStacks);
                        return pieceToMove;
                    }
                }
            }
            // Move a piece from on the board.
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    // Don't select a piece in the winning row.
                    if (row != winningY && (pieceToMove = board[row][col].top()) && pieceToMove.ownership == "Opponent") {
                        if (!board[winningY][winningX].top() || board[winningY][winningX].top().size < pieceToMove.size) {
                            pieceToMove.startx = pieceToMove.x;
                            pieceToMove.starty = pieceToMove.y;
                            this.movePiece((winningX * 200) + 300, (winningY * 200) + 200, pieceToMove, board, opponentStacks);
                            return pieceToMove;
                        }
                    }
                }
            }
        }
    }
    // getPiece - Get any available piece of size pieceSize.
    //
    // @param pieceSize - the size of the piece to get.
    getPiece(opponentStacks, board, pieceSize){
        let piece;
        // March through the opponents stack to try to find a piece.
        for(let k = 0; k < 3; k++){
            if(opponentStacks[k].top() && opponentStacks[k].top().size == pieceSize){
                piece = opponentStacks[k].top();
            }
        }
        // No available piece in opponent stack, look through board for the piece.
        if(!piece){
            for(let row = 0; row < 4;   row++){
                for(let col = 0; col < 4; col++){
                    if(board[row][col].top() && board[row][col].top().ownership == "Opponent" && board[row][col].top().size == pieceSize && !board[row][col].top().isblocking){
                        piece = board[row][col].top();
                    }
                }
            }
        }
        return piece;
    }
    /// blockWin - logic for opponent to block a players immediate win.
    ///
    /// @param opponentStacks - the opponents stacks off of the board.
    /// @param board - the current state of the board.
    blockWin(opponentStacks, board){
        let piece;
        // Try to get a large piece.
        piece = this.getPiece(opponentStacks, board, 3);
        // If there is no available large piece, get a medium piece.
        if(!piece){
            piece = this.getPiece(opponentStacks, board, 2);
        }
        // If there is no available medium piece, get a small piece.
        if(!piece){
            piece = this.getPiece(opponentStacks, board, 1);
        }
        // If there is no available small piece, get a tiny piece.
        if(!piece){
            piece = this.getPiece(opponentStacks, board, 0);
        }
        let blockX;
        let blockY;
        // horizontal rows
        for(let i = 0; i < 4; i++){
            let total = 0;
            blockX = -1; 
            blockY = -1;
            for(let j = 0; j < 4; j++){
                // Another player piece, increment total
                if(board[i][j].top() && board[i][j].top().ownership == "Player"){
                    total++;
                }
                // Potentially a place to block.
                else if(!board[i][j].top() || (board[i][j].top().ownership == "Opponent" && board[i][j].top().size < 3)){
                    blockX = j;
                    blockY = i;
                }
            }
            // Three in a row, and a block position was found.
            if(total == 3 && blockX > -1 && blockY > -1){
                piece.startx = piece.x;
                piece.starty = piece.y;
                piece.isblocking = true;
                // Execute the move.
                if(this.movePiece((blockX * 200) + 300, (blockY * 200) + 200, piece, board, opponentStacks)){
                    return piece;
                }      
                return null;
            }
        }
        // vertical rows
        for(let col = 0; col < 4; col++){
            let total = 0;
            blockX = -1;
            blockY = -1;
            for(let row = 0; row < 4; row++){
                // Another player piece, increment total
                if(board[row][col].top() && board[row][col].top().ownership == "Player"){
                    total++;
                }
                // Potentially a place to block.
                else if(!board[row][col].top() || (board[row][col].top().ownership == "Opponent" && board[row][col].top().size < 3)){
                    blockX = col;
                    blockY = row; 
                }
            }
            // Three in a row, and a block position was found.
            if(total == 3 && blockX > -1 && blockY > -1){
                piece.startx = piece.x;
                piece.starty = piece.y;
                piece.isblocking = true;
                // Execute the move.
                if(this.movePiece((blockX * 200) + 300, (blockY * 200) + 200, piece, board, opponentStacks)){
                    return piece;
                }      
                return null;
            }
        }
        // Top left - bottom right diagonal.
        let total = 0;
        blockX = -1;
        blockY = -1;
        for(let i = 0; i < 4; i++){
            // Another player piece, increment total
            if(board[i][i].top() && board[i][i].top().ownership == "Player"){
                total++;
            }
            // Potentially a place to block.
            else if(!board[i][i].top() || (board[i][i].top().ownership == "Opponent" && board[i][i].top().size < 3)){
                blockX = i;
                blockY = i;
            }
        }
        // Three in a row, and a block position was found.
        if(total == 3 && blockX > -1 && blockY > -1){
            piece.startx = piece.x;
            piece.starty = piece.y;
            piece.isblocking = true;
            // Execute the move.
            if(this.movePiece((blockX * 200) + 300, (blockY * 200) + 200, piece, board, opponentStacks)){
                return piece;
            }      
            return null;
        }
        // Bottom left - top right
        total = 0;
        blockX = -1;
        blockY = -1;
        for(let i = 0; i < 4; i++){
            // Another player piece, increment total
            if(board[3-i][i].top() && board[3-i][i].top().ownership == "Player"){
                total++;
            }
            // Potentially a place to block.
            else if(!board[3-i][i].top() || (board[3 - i][i].top().ownership == "Opponent" && board[3 - i][i].top().size < 3)){
                blockX = i;
                blockY = 3-i;
            }
        }
        // Three in a row, and a block position was found.
        if(total == 3 && blockX > -1 && blockY > -1){
            piece.startx = piece.x;
            piece.starty = piece.y;
            piece.isblocking = true;
            // Execute the move.
            if(this.movePiece((blockX * 200) + 300, (blockY * 200) + 200, piece, board, opponentStacks)){
                return piece;
            }      
            return null;
        }
    }
    // Moderate player strategy. AKA the strategy used in the demonstration.
    moderateStrategy(playerStacks, opponentStacks, board){
        let piece;
        // Atempt to make a winning move.
        if(piece = this.winMove(opponentStacks, board)){
            return piece;
        }
        // Unable to make a winning move, try to make a blocking move.
        if(piece = this.blockWin(opponentStacks, board)){
            return piece;
        }
        // No winning or blocking move were able to be made, so make a regular move.
        return this.basicStrategy(playerStacks, opponentStacks, board);
    }
    // Function that gets and executes the opponents move.
    calculateMove(playerStacks, opponentStacks, board) {
        /*
        let node = new Node(board, playerStacks, opponentStacks, true);
        let min = new Node(null, null, null, true);
        min.score = -MAX_INT;
        let max = new Node(null, null, null, true);
        max.score = MAX_INT;
        let move = this.minimax(node, 3, min, max, true);
        printBoard(move);
        let piece;
        if(move.offboard){
            piece = opponentStacks[move.offboardStack].top();
        }
        else{
            piece = board[(move.startY - 200) / 200][(move.startX - 300) / 200];
        }
        console.log(move);
        //this.movePiece(move.endX, move.endY, piece, board, opponentStacks);
        return piece;
        */
        return this.moderateStrategy(playerStacks, opponentStacks, board);
       //return this.basicStrategy(playerStacks, opponentStacks, board);
    }
}
// // Represents a potential gamestate.
// class GameState{
//     // Properly constructs a GameState object.
//     //
//     // @param board - a reference to the board.
//     // @param playerStack - a reference to the players off board stacks.
//     // @param opponentStacks - a reference to the opponents off board stacks.
//     // @param isMaximizer - whether or not it is the maximizer.
//     constructor(board, playerStacks, opponentStacks, isMaximizer){
//         if(board){
//             this.board = this.copyBoard(board);  
//         }
//         else{
//             this.board = null;
//         }
//         if(playerStacks){
//             this.playerStacks = this.copyStacks(playerStacks);
//         }
//         else{
//             this.playerStacks = null;
//         }
//         if(opponentStacks){
//             this.opponentStacks = this.copyStacks(opponentStacks);
//         }
//         else{
//             this.opponentStacks = null;
//         }
//         this.isMaximizer = isMaximizer;
//     }
//     // Make a copy of the board in order to see possible future positions without effecting the actual board.
//     copyBoard(board){
//         // Make 2D array of Stack objects.
//         let newBoard = [];
//         let row1 = [new Stack(), new Stack(), new Stack(), new Stack()];
//         let row2 = [new Stack(), new Stack(), new Stack(), new Stack()];
//         let row3 = [new Stack(), new Stack(), new Stack(), new Stack()];
//         let row4 = [new Stack(), new Stack(), new Stack(), new Stack()];
//         newBoard[0] = row1;
//         newBoard[1] = row2;
//         newBoard[2] = row3;
//         newBoard[3] = row4;
//         // copy contents of board.
//         for(let i = 0; i < 4; i++){
//             for(let j = 0; j < 4; j++){
//                 for(let k = 0; k < 4; k++){
//                     if(board[i][j].stack[k]){
//                         newBoard[i][j].stack[k] = new Piece(board[i][j].stack[k].size, board[i][j].stack[k].ownership);
//                     }
//                 }
//             } 
//         }
//         return newBoard;
//     }
//     // Make a copy of the stack in order to see possible future positions without effecting the actual stack.
//     copyStacks(stacks){
//         let newStacks = [new Stack(), new Stack(), new Stack()];
//         // copy contents of the stack.
//         for(let i = 0; i < 3; i++){
//             for(let j = 0; j < 4; j++){
//                 if(stacks[i].stack[j]){
//                     newStacks[i].stack[j] = new Piece(stacks[i].stack[j].size, stacks[i].stack[j].ownership);
//                 }
//             }
//         }
//         return newStacks;
//     }
// }
// // Object that represents a node in the gametree.
// class Node{
//     // Properly constructs a Node.
//     constructor(board, playerStacks, opponentStacks, isMaximizer){
//         this.gameState = new GameState(board, playerStacks, opponentStacks, isMaximizer);
//         this.children = [];
//         this.score = 0;
//         this.offboard = null;
//         this.offboardStack = null;
//         this.startX = null;
//         this.startY = null;
//         this.endX = null;
//         this.endY = null;
//     }
//     isWin(ownership) {
//         let board = this.gameState.board;
//         let win = true;
//         // Check horizontal rows.
//         for (let i = 0; i < 4; i++) {
//             for (let j = 0; j < 4; j++) {
//                 if (!board[i][j].top() || board[i][j].top().ownership != ownership) {
//                     win = false;
//                 }
//             }
//             if (win) {
//                 return true;
//             }
//             win = true;
//         }
//         // Check vertical rows
//         for (let i = 0; i < 4; i++) {
//             for (let j = 0; j < 4; j++) {
//                 if (!board[j][i].top() || board[j][i].top().ownership != ownership) {
//                     win = false;
//                 }
//             }
//             if (win) {
//                 return true;
//             }
//             win = true;
//         }
//         // Check diagonals
//         for (let i = 0; i < 4; i++) {
//             if (!board[i][i].top() || board[i][i].top().ownership != ownership) {
//                 win = false;
//             }
//         }
//         if (win) {
//             return true;
//         }
//         win = true;
//         for (let i = 0; i < 4; i++) {
//             if (!board[i][3 - i].top() || board[i][3 - i].top().ownership != ownership) {
//                 win = false;
//             }
//         }
//         if (win) {
//             return true;
//         }
//         return false;
//     }
//     printBoard(){
//         let board = this.gameState.board;
//         for(let i = 0; i < 4; i++){
//             let row = "";
//             for(let j = 0; j < 4; j++){
//                 if(!board[i][j].top()){
//                     row += " NA ";
//                 }
//                 else if(board[i][j].top().ownership == "Player"){
//                     let size = board[i][j].top().size;
//                     row += " P" + size +" ";
//                 }
//                 else{
//                     let size = board[i][j].top().size;
//                     row += " O" + size + " ";
//                 }
//             }
//             console.log(row);
//         }
//         console.log("\n\n\n");
//     }
// }