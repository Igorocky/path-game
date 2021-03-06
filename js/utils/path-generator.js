"use strict";

const EMPTY_CELL = 0
const START_CELL = 1
const WALL_CELL = 2
const TARGET_CELL = 3
const PATH_CELL = 8
const SUB_TARGET_CELL = 9
const POSSIBLE_DIRECTIONS = [{dx:-1,dy:0}, {dx:1,dy:0}, {dx:0,dy:-1}, {dx:0,dy:1}]

function isSameDir(dir1,dir2) {
    return hasValue(dir1) && hasValue(dir2) && (dir1.dx == dir2.dx || dir1.dy == dir2.dy)
}

function isSameNode({x:x1,y:y1,dir:dir1}) {
    return ({x:x2,y:y2,dir:dir2}) => x1==x2 && y1==y2 && (hasNoValue(dir1) || hasNoValue(dir2) || isSameDir(dir1,dir2))
}

function isSamePath(path1,path2) {
    if (hasNoValue(path1) || hasNoValue(path2)) {
        return false
    }
    if (path1.length != path2.length) {
        return false
    }
    for (let i = 0; i < path1.length; i++) {
        if (path1[i].x != path2[i].x || path1[i].y != path2[i].y) {
            return false
        }
    }
    return true
}

function findWallOrTarget({field,startX,startY,targetX,targetY,dir}) {
    if (field[startX][startY] === WALL_CELL) {
        throw new Error('field[startX][startY] === WALL_CELL')
    }
    if (startX == targetX && startY == targetY) {
        throw new Error('startX == targetX && startY == targetY')
    }
    let x = startX + dir.dx
    let y = startY + dir.dy
    while (0 <= x && x < field.length && 0 <= y && y < field[0].length) {
        if (field[x][y] === WALL_CELL) {
            return {x:x-dir.dx, y:y-dir.dy, dir}
        } else if (x == targetX && y == targetY) {
            return {x,y,dir}
        }
        x += dir.dx
        y += dir.dy
    }
    return undefined
}

function getChildNodes({field,x,y,targetX,targetY,parentDir}) {
    const result = []
    for (const dir of POSSIBLE_DIRECTIONS) {
        if (!isSameDir(parentDir,dir)) {
            result.push(findWallOrTarget({field,startX:x,startY:y,targetX,targetY,dir}))
        }
    }
    return result.filter(hasValue)
}

function findShortestPath({field,startX,startY,endX,endY}) {
    if (startX == endX && startY == endY) {
        return [{x:startX,y:startY}]
    }
    const processedNodes = []
    const queue = [{x:startX,y:startY}]
    while (queue.length) {
        const curNode = queue.shift()
        if (hasNoValue(processedNodes.find(isSameNode(curNode)))) {
            processedNodes.push(curNode)
            const children = getChildNodes({field,x:curNode.x,y:curNode.y,targetX:endX,targetY:endY,parentDir:curNode.dir})
                .map(ch => ({...ch, parent:curNode}))
            let target = children.find(({x,y}) => x==endX && y==endY)
            if (hasValue(target)) {
                const path = []
                while (hasValue(target)) {
                    path.unshift({x:target.x, y:target.y})
                    target = target.parent
                }
                return path
            }
            queue.push(...children)
        }
    }
    return undefined
}

function getPossibleEndPoints({field,x,y,d}) {
    const maxX = field.length - 1
    const maxY = field[0].length - 1
    const result = []
    x = x + d.dx
    y = y + d.dy
    while (0 < x && x < maxX && 0 < y && y < maxY
            && field[x][y] !== WALL_CELL && field[x][y] !== SUB_TARGET_CELL && field[x][y] !== START_CELL) {
        if ((field[x][y] === PATH_CELL || field[x][y] === SUB_TARGET_CELL) && result.length) {
            result.pop()
        }
        if (field[x][y] !== PATH_CELL) {
            result.push({x,y})
        }
        x = x + d.dx
        y = y + d.dy
    }
    if ((field[x][y] === START_CELL || field[x][y] === SUB_TARGET_CELL) && result.length) {
        result.pop()
    }
    return result
}

function renderRay({field,start,end}) {
    const dir = start.x == end.x ? {dx:0,dy:start.y<end.y?1:-1} : {dx:start.x<end.x?1:-1,dy:0}
    let x = start.x
    let y = start.y
    while (x != end.x || y != end.y) {
        if (field[x][y] === EMPTY_CELL) {
            field[x][y] = PATH_CELL
        }
        x = x + dir.dx
        y = y + dir.dy
    }
}

function initField({width,height}) {
    return ints(0,width-1).map(x => ints(0,height-1).map(y=>EMPTY_CELL))
}

function getDistinctPart({base,arr,eq}) {
    let i = 0
    while (i < base.length && i < arr.length && eq(base[i],arr[i])) {
        i++
    }
    return arr.filter((e,idx) => i <= idx)
}

function getDistinctPartsOfPaths({paths}) {
    const result = []
    for (let i = 1; i < paths.length; i++) {
        result.push(getDistinctPart({base:paths[0],arr:paths[i],eq:(a,b) => a.x==b.x && a.y==b.y}))
    }
    return result
}

function isComplicatedEnough({distinctPartsOfPaths,mainPathLength,minDistinctLength}) {
    return distinctPartsOfPaths.every((part,idx) => {
        // console.log('-------------------------------------------------------')
        // console.log({part})
        // console.log({minDistinctLength})
        // console.log({mainPathLength})
        // console.log({idx})
        // console.log("Math.min(minDistinctLength, mainPathLength - idx) = " + JSON.stringify(Math.min(minDistinctLength, mainPathLength - idx)));
        const res = part.length >= Math.min(minDistinctLength, mainPathLength - idx)
        // console.log("res = " + JSON.stringify(res));
        return res
    })
}

function generatePath({width,height,length,numOfFakePaths,returnHistory}) {
    let resultCandidate = generatePathInner({width,height,length,numOfFakePaths,returnHistory})
    if (!numOfFakePaths) {
        return resultCandidate
    } else {
        const minDistinctLength = 2
        let results = []
        results.push({
            res:resultCandidate,
            distinctParts: getDistinctPartsOfPaths({paths:resultCandidate.paths})
        })
        let isLastComplexEnough = isComplicatedEnough({
            mainPathLength:results.last().res.paths[0].length,
            minDistinctLength,
            distinctPartsOfPaths:results.last().distinctParts
        })
        while (!(isLastComplexEnough || results.length >= 10)) {
            resultCandidate = generatePathInner({width,height,length,numOfFakePaths,returnHistory})
            results.push({
                res:resultCandidate,
                distinctParts: getDistinctPartsOfPaths({paths:resultCandidate.paths})
            })
            isLastComplexEnough = isComplicatedEnough({
                mainPathLength:results.last().res.paths[0].length,
                minDistinctLength,
                distinctPartsOfPaths:results.last().distinctParts
            })
        }
        // console.log("results.length = " + JSON.stringify(results.length));
        // console.log("isLastComplexEnough = " + JSON.stringify(isLastComplexEnough));
        // console.log("distinctLengths = " + JSON.stringify(results.map(r => r.distinctParts.map(p=>p.length).join(','))));
        // console.log({results})
        if (isLastComplexEnough) {
            return results.last().res
        } else {
            results = results.map(r => ({...r,cnt:r.distinctParts.map(dp=>dp.length?1:0).sum()}))
            const maxCnt = results.map(r => r.cnt).max()
            results = results.filter(r => r.cnt == maxCnt)
            results = results.map(r => ({...r,sum:r.distinctParts.map(dp=>dp.length).sum()}))
            const maxSum = results.map(r => r.sum).max()
            return results.find(r => r.sum == maxSum).res
        }
    }
}

function generatePathInner({width,height,length,numOfFakePaths,returnHistory}) {
    if (width < 5 || height < 5) {
        throw new Error('width < 5 || height < 5')
    }
    if (numOfFakePaths < 0 || length < numOfFakePaths) {
        throw new Error('numOfFakePaths < 0 || length < numOfFakePaths')
    }

    const p = {
        BEGIN: 'BEGIN',
        POSSIBLE_ENDPOINTS_FOUND: 'POSSIBLE_ENDPOINTS_FOUND',
        PATH_ELEM_ADDED: 'PATH_ELEM_ADDED',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED',
    }
    const s = {
        PREV_STATE: 'PREV_STATE',
        PHASE: 'PHASE',
        ID: 'ID',
        FIELD: 'FIELD',
        START_X: 'START_X',
        START_Y: 'START_Y',
        TARGETS: 'TARGETS',
        POSSIBLE_ENDPOINTS: 'POSSIBLE_ENDPOINTS',
    }

    let stateId = 1
    let state = createObj({[s.PHASE]:p.BEGIN,[s.ID]:stateId++})
    while (!(state[s.PHASE] == p.COMPLETED || state[s.PHASE] == p.FAILED)) {
        state = getNextState(state)
    }
    if (state[s.PHASE] == p.FAILED) {
        throw new Error('state[s.PHASE] == p.FAILED')
    }

    const result = extractFieldInfoFromState(state)
    if (returnHistory) {
        result.history = extractHistoryFromState(state)
    }
    return result

    function extractHistoryFromState(state) {
        const result = []
        while (hasValue(state)) {
            if (state[s.PHASE] == p.PATH_ELEM_ADDED) {
                result.unshift(extractFieldInfoFromState(state))
            }
            state = state[s.PREV_STATE]
        }
        return result
    }

    function extractFieldInfoFromState(state) {
        const finalField = cloneField(state[s.FIELD])
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (finalField[x][y] === PATH_CELL || finalField[x][y] === SUB_TARGET_CELL) {
                    finalField[x][y] = EMPTY_CELL
                }
            }
        }
        const mainTarget = state[s.TARGETS][0]
        finalField[mainTarget.x][mainTarget.y] = TARGET_CELL

        return {
            field: finalField,
            paths: state[s.TARGETS].map(target =>
                findShortestPath({
                    field:finalField,
                    startX:state[s.START_X],
                    startY:state[s.START_Y],
                    endX:target.x,
                    endY:target.y,
                })
            ),
        }
    }

    function getNextState(prevState) {
        if (prevState[s.PHASE] == p.COMPLETED || prevState[s.PHASE] == p.FAILED) {
            return prevState
        }

        const nextStateHolder = objectHolder(prevState)
        nextStateHolder.set(s.PREV_STATE, prevState)
        if (prevState[s.PHASE] == p.BEGIN) {
            nextStateHolder.set(s.FIELD, initField({width,height}))
            const curX = randomInt(2,width-3)
            const curY = randomInt(2,height-3)
            nextStateHolder.get(s.FIELD)[curX][curY] = START_CELL
            nextStateHolder.set(s.START_X, curX)
            nextStateHolder.set(s.START_Y, curY)
            nextStateHolder.set(s.TARGETS, [{x: curX, y: curY}])
            nextStateHolder.set(s.PHASE, p.PATH_ELEM_ADDED)
            nextStateHolder.set(s.ID, stateId++)
        } else if (prevState[s.PHASE] == p.PATH_ELEM_ADDED) {
            const shortestPathForLatestTarget = findShortestPath({
                field:prevState[s.FIELD],
                startX:prevState[s.START_X],
                startY:prevState[s.START_Y],
                endX:prevState[s.TARGETS].last().x,
                endY:prevState[s.TARGETS].last().y
            })
            if (shortestPathForLatestTarget.length-1 == length) {
                if (prevState[s.TARGETS].length-1 < numOfFakePaths) {
                    nextStateHolder.setObj(createStateWithNewFakeTarget({prevState}))
                } else {
                    nextStateHolder.set(s.PHASE, p.COMPLETED)
                    nextStateHolder.set(s.ID, stateId++)
                }
            } else {
                nextStateHolder.set(s.POSSIBLE_ENDPOINTS, determinePossibleEndpoints({
                    field:prevState[s.FIELD], prevPath:shortestPathForLatestTarget
                }))
                nextStateHolder.set(s.PHASE, p.POSSIBLE_ENDPOINTS_FOUND)
                nextStateHolder.set(s.ID, stateId++)
            }
        } else if (prevState[s.PHASE] == p.POSSIBLE_ENDPOINTS_FOUND) {
            if (prevState[s.POSSIBLE_ENDPOINTS].length == 0) {
                if (prevState[s.TARGETS].length == 1) {
                    const pastStateToContinueFrom = findPastStateToContinueFrom({state:prevState})
                    if (hasNoValue(pastStateToContinueFrom)) {
                        nextStateHolder.set(s.PHASE, p.FAILED)
                        nextStateHolder.set(s.ID, stateId++)
                    } else {
                        nextStateHolder.setObj(pastStateToContinueFrom)
                    }
                } else {
                    if (prevState[s.TARGETS].length-1 < numOfFakePaths) {
                        nextStateHolder.setObj(createStateWithNewFakeTarget({prevState}))
                    } else {
                        nextStateHolder.set(s.PHASE, p.COMPLETED)
                        nextStateHolder.set(s.ID, stateId++)
                    }
                }
            } else {
                nextStateHolder.setObj(applyRandomEndpoint({prevState,length}))
            }
        }
        return nextStateHolder.get()
    }

    function createStateWithNewFakeTarget({prevState}) {
        const prevTargets = prevState[s.TARGETS]
        const shortestPathForMainTarget = findShortestPath({
            field:prevState[s.FIELD],
            startX:prevState[s.START_X],
            startY:prevState[s.START_Y],
            endX:prevTargets[0].x,
            endY:prevTargets[0].y
        })
        const nextStateHolder = objectHolder(prevState)
        nextStateHolder.set(s.PREV_STATE, prevState)
        nextStateHolder.set(s.TARGETS, [...prevTargets, shortestPathForMainTarget[prevTargets.length-1]])
        nextStateHolder.set(s.PHASE, p.PATH_ELEM_ADDED)
        nextStateHolder.set(s.ID, stateId++)
        return nextStateHolder.get()
    }

    function applyRandomEndpoint({prevState,length}) {
        const possibleEndpoints = prevState[s.POSSIBLE_ENDPOINTS]
        const endpointIdx = randomInt(0, possibleEndpoints.length-1)
        const endPoint = possibleEndpoints[endpointIdx]
        prevState[s.POSSIBLE_ENDPOINTS] = removeAtIdx(possibleEndpoints, endpointIdx)
        const prevField = prevState[s.FIELD]
        const prevTargets = prevState[s.TARGETS]
        const prevEndX = prevTargets.last().x
        const prevEndY = prevTargets.last().y
        const dir = prevEndX == endPoint.x ? {dx:0,dy:prevEndY<endPoint.y?1:-1} : {dx:prevEndX<endPoint.x?1:-1,dy:0}
        const startX = prevState[s.START_X]
        const startY = prevState[s.START_Y]
        const prevFieldShortestPath = findShortestPath({
            field:prevField, startX, startY, endX: prevEndX, endY: prevEndY
        })

        const newField = cloneField(prevField)
        renderRay({field:newField,start:{x:prevEndX,y:prevEndY},end:endPoint})
        newField[endPoint.x][endPoint.y] = SUB_TARGET_CELL
        if (prevFieldShortestPath.length != length) {
            newField[endPoint.x+dir.dx][endPoint.y+dir.dy] = WALL_CELL
        }
        const newTargets = modifyAtIdx(prevTargets,prevTargets.length-1,() => endPoint)

        if (validateField({
            startX,startY,prevTargets,newTargets,prevField,newField
        })) {
            const nextStateHolder = objectHolder(prevState)
            nextStateHolder.set(s.FIELD, newField)
            nextStateHolder.set(s.TARGETS, newTargets)
            nextStateHolder.set(s.POSSIBLE_ENDPOINTS, null)
            nextStateHolder.set(s.PREV_STATE, prevState)
            nextStateHolder.set(s.PHASE, p.PATH_ELEM_ADDED)
            nextStateHolder.set(s.ID, stateId++)
            return nextStateHolder.get()
        } else {
            return prevState
        }
    }

    function validateField({startX,startY,prevTargets,newTargets,prevField,newField}) {
        if (prevTargets.length != newTargets.length) {
            throw new Error('oldTargets.length != newTargets.length')
        }
        const oldShortestPaths = prevTargets.map(t => findShortestPath({
            field:prevField,startX,startY,endX:t.x,endY:t.y
        }))
        const newShortestPaths = newTargets.map(t => findShortestPath({
            field:newField,startX,startY,endX:t.x,endY:t.y
        }))
        for (let i = 0; i < prevTargets.length-1; i++) {
            if (!isSamePath(oldShortestPaths[i],newShortestPaths[i])) {
                return false
            }
        }
        if (hasNoValue(newShortestPaths.last())) {
            return false
        }
        return isSamePath(
            oldShortestPaths.last(),
            removeAtIdx(newShortestPaths.last(), newShortestPaths.last().length-1)
        )
    }

    function cloneField(field) {
        const cloned = initField({width:field.length,height:field[0].length})
        for (let x = 0; x < field.length; x++) {
            for (let y = 0; y < field[0].length; y++) {
                cloned[x][y] = field[x][y]
            }
        }
        return cloned
    }

    function findPastStateToContinueFrom({state}) {
        while (hasValue(state) && !(state[s.PHASE] == p.POSSIBLE_ENDPOINTS_FOUND && state[s.POSSIBLE_ENDPOINTS].length > 0)) {
            state = state[s.PREV_STATE]
        }
        return state
    }

    function determinePossibleEndpoints({field,prevPath}) {
        const dirs = prevPath.length == 1 ? [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]
            : prevPath[prevPath.length-1].x == prevPath[prevPath.length-2].x ? [{dx:1,dy:0},{dx:-1,dy:0}]
                : [{dx:0,dy:1},{dx:0,dy:-1}]

        const possibleEndpoints = []
        const x = prevPath.last().x
        const y = prevPath.last().y
        for (const dir of dirs) {
            possibleEndpoints.push(...getPossibleEndPoints({field,x,y,d:dir}))
        }
        return possibleEndpoints
    }
}