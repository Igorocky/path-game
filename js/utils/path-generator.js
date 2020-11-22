"use strict";

const EMPTY_CELL = 0
const START_CELL = 1
const WALL_CELL = 2
const PATH_CELL = 3
const TARGET_CELL = 4

function findStart({field}) {
    for (let x = 0; x < field.length; x++) {
        for (let y = 0; y < field[0].length; y++) {
            if (field[x][y] === START_CELL) {
                return {x,y}
            }
        }
    }
}

function getPossibleEndPoints({field,x,y,d}) {
    const maxX = field.length - 1
    const maxY = field[0].length - 1
    const result = []
    x = x + d.dx
    y = y + d.dy
    while (0 < x && x < maxX && 0 < y && y < maxY && field[x][y] != WALL_CELL) {
        if (field[x][y] === PATH_CELL && result.length) {
            result.pop()
        }
        result.push({x,y})
        x = x + d.dx
        y = y + d.dy
    }
    return result
}

function renderRay({field,start,end,d}) {
    let x = start.x
    let y = start.y
    while (x != end.x || y != end.y) {
        field[x][y] = PATH_CELL
        x = x + d.dx
        y = y + d.dy
    }
}

function initField({width,height}) {
    return ints(0,width-1).map(x => ints(0,height-1).map(y=>EMPTY_CELL))
}

function generatePath({width,height,length,numOfRandomWalls}) {
    const dirs = [
        [{dx:1,dy:0},{dx:-1,dy:0}],
        [{dx:0,dy:1},{dx:0,dy:-1}],
    ]
    const startX = Math.floor(width/2)
    const startY = Math.floor(height/2)

    let field
    let path
    let curX
    let curY
    let curLength
    let curMainDir
    let numOfTries = 0

    function init() {
        field = initField({width,height})
        curX = startX
        curY = startY
        path = [{x:curX,y:curY}]
        curLength = length
        curMainDir = randomInt(0,1)
    }

    init()
    while(curLength > 0) {
        let curSubDir = randomInt(0,1)
        let curDir = dirs[curMainDir][curSubDir]
        let possibleEndPoints = getPossibleEndPoints({field,x:curX,y:curY,d:curDir})
        if (!possibleEndPoints.length) {
            curSubDir = Math.abs(curSubDir-1)
            curDir = dirs[curMainDir][curSubDir]
            possibleEndPoints = getPossibleEndPoints({field,x:curX,y:curY,d:curDir})
        }
        if (!possibleEndPoints.length) {
            init()
            numOfTries++
            if (numOfTries > 100) {
                throw new Error('numOfTries > 100')
            }
        } else {
            const endPoint = possibleEndPoints[randomInt(0,possibleEndPoints.length-1)]
            renderRay({field,start:{x:curX,y:curY},end:{x:endPoint.x,y:endPoint.y},d:curDir})
            path.push({x:endPoint.x,y:endPoint.y})
            curMainDir = Math.abs(curMainDir-1)
            curX = endPoint.x
            curY = endPoint.y
            if (curLength > 1) {
                field[endPoint.x+curDir.dx][endPoint.y+curDir.dy] = WALL_CELL
            }
            curLength--
        }
    }
    const lastPathElem = path[path.length-1]
    field[lastPathElem.x][lastPathElem.y] = TARGET_CELL
    field[startX][startY] = START_CELL

    if (numOfRandomWalls) {
        let emptyCells = []
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (field[x][y] === EMPTY_CELL) {
                    emptyCells.push({x,y})
                }
            }
        }
        while (numOfRandomWalls > 0 && emptyCells.length > 0) {
            const idx = randomInt(0,emptyCells.length-1);
            const rndEmptyCell = emptyCells[idx]
            removeAtIdx(emptyCells,idx)
            field[rndEmptyCell.x][rndEmptyCell.y] = WALL_CELL
            numOfRandomWalls--
        }
    }

    return {field,path}
}