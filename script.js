/*
    Developed by: BARI_BGF
    Last updated: 02/11/2022
*/

const GameBoard = document.getElementById("canvas")
const ScoreBoard = document.getElementById("score-board")

// some constants
const GAME_BOARD_WIDTH = 800
const GAME_BOARD_HEIGHT = 400
const GRID_ROWS = GAME_BOARD_HEIGHT / 20
const GRID_COLS = GAME_BOARD_WIDTH / 20
const GAME_OVER_STRING = "GAME OVER!"
const Directions = { UP: 0, DOWN: 1, RIGHT: 2, LEFT: 3 }

// game variables
var FPS = 10
var Start = true
var Running = false
var Score = 0
var HighScore = 0

GameBoard.setAttribute("width", GAME_BOARD_WIDTH)
GameBoard.setAttribute("height", GAME_BOARD_HEIGHT)
ScoreBoard.setAttribute("width", GAME_BOARD_WIDTH)
ScoreBoard.setAttribute("height", 60)

const GBCtx = GameBoard.getContext("2d")
GBCtx.font = "45px Ubuntu"
const SBCtx = ScoreBoard.getContext("2d")
SBCtx.font = "24px Ubuntu"
SBCtx.fillStyle = "white"
SBCtx.fillText("< Arrow keys > to Start", 10, 37)

// function to check if a list 1 contains a list 2
function IncludesList(list1, list2) {
    for (let i1 of list2) {
        if (i1.toString() == "NaN") return false
    }
    let found = false
    for (let i2 of list1) {
        if ((i2.toString() == list2.toString())) {
            found = true
            break
        }
    }
    return found
}
// function to get a random int in a range
function RandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// update the score board
function UpdateScore() {
    SBCtx.clearRect(0, 0, GAME_BOARD_WIDTH, 60)
    SBCtx.fillText(`Score: ${Score}`, 20, 37)
    SBCtx.fillText(`HighScore: ${HighScore}`, GAME_BOARD_WIDTH * 0.57, 37)
}
// game replay function to reinitialize the game vars
function Replay() {
    FPS = 10
    Start = true
    Running = false
    Score = 0
    food = new Food(GBCtx)
    snake = new Snake(GBCtx, food, 1, 1)
    GBCtx.clearRect(0, 0, GAME_BOARD_WIDTH, GAME_BOARD_HEIGHT)
    snake.Draw()
    UpdateScore()
}
// game over function 
function GameOver() {
    GBCtx.fillStyle = "white"
    GBCtx.fillText(GAME_OVER_STRING, (GAME_BOARD_WIDTH - GBCtx.measureText(GAME_OVER_STRING).width) / 2, (GAME_BOARD_HEIGHT + 45) / 2)
    HighScore = Math.max(HighScore, Score)
    UpdateScore()
    setTimeout(() => { Replay() }, 2000)
}

class Food {
    width = GAME_BOARD_WIDTH / GRID_COLS
    height = GAME_BOARD_HEIGHT / GRID_ROWS
    coords = []
    context = null
    foodColor = "yellow"
    constructor(context) {
        this.context = context
    }
    Update(snakeHead) { // update the food coords
        this.coords = [
            { x: RandomInt(0, GRID_COLS - 1) * this.width, y: RandomInt(0, GRID_ROWS - 1) * this.height }
        ]
        if (this.coords[0].x == snakeHead.x && this.coords[0].y == snakeHead.y) {
            this.Update(snakeHead)
        }
    }
    Draw() { // draw the food on game context
        for (let c of this.coords) {
            this.context.fillStyle = this.foodColor
            this.context.fillRect(c.x, c.y, this.width, this.height)
        }
    }
}

class Snake {
    width = GAME_BOARD_HEIGHT / GRID_ROWS
    height = GAME_BOARD_WIDTH / GRID_COLS
    body = []
    bodyColor = "#f55539"
    head = null
    headColor = "#db3f24"
    tail = null
    context = null
    direction = Directions.DOWN
    constructor(context, food, x, y) {
        this.context = context
        this.food = food
        this.body = [
            { x: x * this.width, y: y * this.height },
            { x: x * this.width, y: (y + 1) * this.height },
            { x: x * this.width, y: (y + 2) * this.height }
        ]
        this.head = this.body[this.body.length - 1]
        this.tail = this.body[0]

        this.food.Update(this.head)
    }
    Update() { // update the snake
        this.head = this.body[this.body.length - 1]
        this.tail = this.body[0]
    }
    Draw() { // draw the snake
        this.food.Draw()
        this.context.fillStyle = this.bodyColor
        for (let c of this.body) {
            if (c == this.head) this.context.fillStyle = this.headColor
            this.context.fillRect(c.x, c.y, this.width, this.height)
        }
    }

    // method to check if snake had crashed
    CheckCrash() {
        // check if snake head touched the borders
        if (this.head.x < 0 || this.head.x > GAME_BOARD_WIDTH - this.width
            || this.head.y < 0 || this.head.y > GAME_BOARD_HEIGHT - this.height) {
            return true
        }
        // check if snake head touched it's self
        let bodyCells = []
        for (let c of this.body) {
            if (c == this.head) continue;
            bodyCells.push([c.x, c.y])
        }
        if (IncludesList(bodyCells, [this.head.x, this.head.y])) return true;
        else return false;
    }

    IncreaseVol() { // increase the snake volume
        let elem = { x: this.tail.x, y: this.tail.y, width: this.width, height: this.height }
        this.body.unshift(elem)
    }

    CheckFood() { // check if snake head touched the food
        if (this.head.x == food.coords[0].x && this.head.y == food.coords[0].y) {
            // increasing the snake's volume, updating the food,
            // increasing the score, and increasing the snakes's speed
            this.IncreaseVol()
            this.food.Update(this.head)
            Score += 1
            FPS += 0.5
        }
    }

    async Move() { // main moving function/method
        /* 
            the main moving idea is to shift the snake's last cell
            and then push it to the front, this way it's going to look
            like it's really moving.
        */
        Running = true
        let elem = this.body.shift() // shift the snake's last cell
        switch (this.direction) { // check of the direction to set the shifted cell coords
            case Directions.UP:
                elem.y = this.head.y - this.height
                elem.x = this.head.x
                break;
            case Directions.DOWN:
                elem.y = this.head.y + this.height
                elem.x = this.head.x
                break;
            case Directions.RIGHT:
                elem.x = this.head.x + this.width
                elem.y = this.head.y
                break;
            case Directions.LEFT:
                elem.x = this.head.x - this.width
                elem.y = this.head.y
                break;
        }

        this.body.push(elem) // pushing the last element to the front
        this.Update() // update the snake
        if (this.CheckCrash() == true) return GameOver(); // check if it has been crashed

        // drawing the snake if it hadn't been crashed
        this.context.clearRect(0, 0, GAME_BOARD_WIDTH, GAME_BOARD_HEIGHT)
        this.CheckFood()
        this.Draw()
        this.food.Draw()
        UpdateScore() // update the score

        // a promise to slow down the snake
        await new Promise((resolve) => {
            setTimeout(() => resolve(), 1000 / FPS)
        })
        window.requestAnimationFrame(() => { this.Move() })
    }
}
// initializing food and snake instances
var food = new Food(GBCtx)
var snake = new Snake(GBCtx, food, 1, 1)

// listening to keyboard input to set the direction
document.addEventListener("keydown", (event) => {
    /*
        first of all we check the direction of snake for not letting it
        turn into the opposite direction.
        if true, we set the direction according the key pressed.
        then we check if it's not running to start the snake's moving method
    */
    switch (event.key) {
        case 'ArrowUp':
            if (snake.direction != Directions.DOWN) {
                snake.direction = Directions.UP
                if (!Running) window.requestAnimationFrame(() => { snake.Move() })
            }
            break;
        case 'ArrowDown':
            if (snake.direction != Directions.UP) {
                snake.direction = Directions.DOWN
                if (!Running) window.requestAnimationFrame(() => { snake.Move() })
            }
            break;
        case 'ArrowRight':
            if (snake.direction != Directions.LEFT) {
                snake.direction = Directions.RIGHT
                if (!Running) window.requestAnimationFrame(() => { snake.Move() })
            }
            break;
        case 'ArrowLeft':
            if (snake.direction != Directions.RIGHT) {
                snake.direction = Directions.LEFT
                if (!Running) window.requestAnimationFrame(() => { snake.Move() })
            }
            break;
        case 'j':
            snake.IncreaseVol()
    }
})

snake.Draw() // drawing the snake for the first time
