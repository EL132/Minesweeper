import { checkLose, checkWin, revealTile, TILE_STATUSES, createBoard, markTile, nearbyTiles } from './minesweeper.js'


const boardElement = document.querySelector('.board')
const minesLeftText = document.querySelector('[data-mine-count]')
const messageText = document.querySelector('.subtext')
const rangeWraps = document.querySelectorAll('.range-wrap')
const startButton = document.querySelector('button')
const timer = document.querySelector('.timer')

let boardSize
let numberOfMines
let board

startButton.addEventListener('click', () => {
    startTimer()

    boardSize = Number(document.querySelector('#boardSize').innerText)
    numberOfMines = Number(document.querySelector('#numberOfMines').innerText)

    board = createBoard(boardSize, numberOfMines)

    board.forEach(row => {
        row.forEach(tile => {
            boardElement.append(tile.element)
            tile.element.addEventListener('click', () => {
                revealTile(board, tile)
                checkGameOver()
                tile.element.style.border = '2px solid yellowgreen'
            })
            tile.element.addEventListener('contextmenu', e => {
                e.preventDefault()
                markTile(tile)
                listMinesLeft()
                tile.element.style.border = '2px solid yellowgreen'
            })
        })
    })

    boardElement.style.setProperty('--size', boardSize)
    minesLeftText.textContent = numberOfMines

    rangeWraps.forEach(wrap => {
        wrap.style.display = 'none'
    })

    startButton.style.display = 'none'

    startAI()
})

rangeWraps.forEach(wrap => {
    const range = wrap.querySelector('.range')
    const output = wrap.querySelector('.output')

    range.addEventListener('input', () => {
        output.textContent = range.value;
    })
})

let time
let myInterval
function startTimer() {
    timer.style.display = 'inline'
    time = new Date()
    myInterval = setInterval(() => {
        timer.textContent = Math.floor((new Date() - time) / 1000)
    }, 1000)
}

function listMinesLeft() {
    const markedTilesCount = board.reduce((count, row) => {
        return count + row.filter(tile => tile.status === TILE_STATUSES.MARKED).length
    }, 0)

    minesLeftText.textContent = numberOfMines - markedTilesCount;
}

function checkGameOver() {
    const win = checkWin(board)
    const lose = checkLose(board)

    if(win || lose) {
        // boardElement is the entire board itself 
        boardElement.addEventListener('click', stopProp, {capture: true})
        boardElement.addEventListener('contextmenu', stopProp, {capture: true})
        clearInterval(myInterval)
    }

    if(win) {
        messageText.textContent = "you win lfg"
    }

    if(lose) {
        messageText.textContent = "you lose, lol"
        board.forEach(row => {
            row.forEach(tile => {
                if(tile.status === TILE_STATUSES.MARKED)
                    markTile(tile)
                if(tile.mine)
                    revealTile(board, tile)
            })
        })
    }
}

function stopProp(e) {
    e.stopImmediatePropagation()
}

function startAI() {
    setTimeout(() => {
        // click randomly until the AI has something to build off 
        while(numberOfClickedTiles() < 10) {
            let tile = randomTile()
            // don't want to end the game too early, so use the gameBoard knowledge to prevent this
            if(tile.mine === false)
                tile.element.click()
        }
        smartPickTile()
    }, 1000)
}

function randomTile() {
    let r = Math.floor(Math.random() * boardSize)
    let c = Math.floor(Math.random() * boardSize)

    return board[r][c]
}

function numberOfClickedTiles() {
    let numberOfClickedTiles = 0;

    board.forEach(row => {
        row.forEach(tile => {
            if(tile.status === TILE_STATUSES.NUMBER)
                numberOfClickedTiles++
        })
    })

    return numberOfClickedTiles
}

function smartPickTile() {
    setTimeout(() => {
        // AIStuff() --> this will be when the actual tile is picked bc i didn't want to have all of the AI code 
        // inside of a setTimeout()
        AIStuff()
        smartPickTile()
    }, 1000)
}


//hidden[i].element.click() --> syntax of clicking my chosen tile

function AIStuff() {
    markTiles()
    revealTiles()
}

function markTiles() {
    // make method that marks and looks at number on tile, if number on tile equals the amount of hidden tiles or
    // marked tiles around, then mark all of the hidden tiles
    // nearbyTiles gives an array of tiles
    let numberOfMarkedAndHidden = 0;
    //let numberOfHidden = 0;-
    //let arrayOfNearby = []

    board.forEach(row => {
        row.forEach(tile => {
            // create an array of nearby tiles for every tile on the board 
            numberOfMarkedAndHidden = 0

            let arrayOfNearby = nearbyTiles(board, tile)
            
            // so at this point i have an an array with all the nearby tiles and i am going through and checking if each
            // nearby tile is either marked or hidden
            arrayOfNearby.forEach(tile2 => {
                if(tile2.status === TILE_STATUSES.MARKED || tile2.status === TILE_STATUSES.HIDDEN) 
                    numberOfMarkedAndHidden++
                // else if(tile.status === TILE_STATUSES.HIDDEN)
                //     numberOfHidden++
                
                // if(numberOfMarkedAndHidden === tile.mines) {
                //     markSurroundingTiles(board, tile)
                //     //at this point i am now able to mark the hidden tiles
                // }       
            })

            // now check if number on tile equals the number of hidden tiles or marked tiles
            if(numberOfMarkedAndHidden == tile.mines) {
                markSurroundingTiles(board, tile)
                //at this point i am now able to mark the hidden tiles around tile
            }
        })
    })

    /*
    board.forEach(row => {
        row.forEach(tile => {
            if(tile.mine === false) {
                    tile.element.click()
            }
        })
    })
    this is cheat code win 
    */
}


// this is me doing this because after the first iteration i only have stuff marked and i cant mark more unless i reveal tiles 
function revealTiles() {
    // logic for revealing tiles: 
    // if number of marked tiles around given tile equals tiles.mines , then click the hidden tiles around it

    // create array of hidden tiles and go through and click those 

    let numberOfMarkedInReveal = 0;
    

    board.forEach(row => {
        row.forEach(tile => {
            numberOfMarkedInReveal = 0;

            // array for all the hidden elements to eventually reveal them after 
            let arrayOfHidden = [];

            let arrayOfNearby = nearbyTiles(board, tile)

            arrayOfNearby.forEach(tile2 => {
                if(tile2.status === TILE_STATUSES.MARKED) 
                {
                    numberOfMarkedInReveal++
                }
                if(tile2.status === TILE_STATUSES.HIDDEN) {
                    arrayOfHidden.push(tile2)
                }
            })

            if(numberOfMarkedInReveal == tile.mines && numberOfMarkedInReveal != 0)
            {
                arrayOfHidden.forEach(tileInHidden => {
                    tileInHidden.element.click()
                })
            }

            // go through all of the tiles that are hidden and reveal them
                           
        })
    })
}


function markSurroundingTiles(board, tile) {
    //will have to call markTile()
    // check if not already marked 
    let r = tile.r
    let c = tile.c


    // tile is basically being used as the reference point for the center, tileInLoop is the tile we are going to click

    for(let rOffset = -1; rOffset <= 1; rOffset++) {
        for(let cOffset = -1; cOffset <= 1; cOffset++) {
            // create this tile that is at location relative to initial tile
            const tileInLoop = board[r + rOffset]?.[c + cOffset]
            if(tileInLoop && tileInLoop.status === TILE_STATUSES.HIDDEN) {       // does the tile exist and is the status currently hidden
                // this is the end product of all functions calling each other, should flag the tile
                markTile(tileInLoop)
                console.log("we got to inside if statement within nested for loops within markSurroundingTiles")
            }
        }
    }
}



/*
AI stuff function daniel and i try 

// this is an array of tiles 
    let revealedOnes = getRevealedOneTiles()
    console.log(revealedOnes.length)

    if(revealedOnes.length === 1 || revealedOnes.length === 0) {
        let tile = randomTile()
        tile.element.click()
    }
    
    let i = 0;
    // i am going through each tile in revealedOnes and essentially checking all the tiles around it to see if there is a nearby unrevealed tile
    for(let r = 0; r < board.length; r++) {
        for(let c = 0; c < board.length; c++) {
            // board[r][c] --> accessing a tile, which has multiple data pieces inside of it
            if(revealedOnes[i].r === board[r][c].r && revealedOnes[i].c === board[r][c].c) {
                i++
                let numberOfHiddenTiles
                // THIS IS THE STARTING TILE 
                let tileReveal = null;

                // if top left
                if(board[r - 1][c - 1].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r - 1][c - 1]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // if middle left
                if(board[r][c - 1].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r][c - 1]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // if bottom left
                if(board[r + 1][c - 1].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r + 1][c - 1]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // middle top
                if(board[r - 1][c].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r - 1][c]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // middle bottom
                if(board[r + 1][c].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r + 1][c]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // if bottom right
                if(board[r + 1][c + 1].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r + 1][c + 1]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // midle right
                if(board[r][c + 1].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r][c + 1]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }
                // top right 
                if(board[r - 1][c + 1].status === TILE_STATUSES.HIDDEN) {
                    numberOfHiddenTiles++
                    tileReveal = board[r - 1][c + 1]
                    if(numberOfHiddenTiles < 2) {
                        break
                    }
                }

                if(numberOfHiddenTiles === 1) {
                    tileReveal.element.click()
                }
            }
        }
    }

    //revealedOnes[].element.click()

    // will still need to reveal a tile
*/

//previous code
/* 
// check if all 7 are revealed
// only deal with the ones that have one empty space around it 
// false unless proven true

// constantly checking if tile value is zero, if yes, reveal all tiles around it 

// bascially focus on the corners, check the top left and right and bottom corners with a value of a one ; subtract one from the value of the tiles around it, bc the tile around it
// is now a zero, so there are no tiles around it, and the numbers all get the value subtracted --> 2 becomes 1 and 3 becoms 2 etc. 

function ifZeroReveal(tile) {

}


function getHiddenTiles() {
    let hidden = []
    // to access the r, hidden[0].r

    board.forEach(row => {
        row.forEach(tile => {
            if(tile.status === TILE_STATUSES.HIDDEN)
                hidden.push(tile)
        })
    })

    return hidden
}


function getRevealedOneTiles() {
    let revealed = []
    // to access the r, hidden[0].r

    board.forEach(row => {
        row.forEach(tile => {
            if(tile.status === TILE_STATUSES.NUMBER && tile.mines == 1)
                revealed.push(tile)
        })
    })

    return revealed
}

*/