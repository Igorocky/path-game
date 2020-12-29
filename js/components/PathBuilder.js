"use strict";

const PathBuilder = () => {

    const s = {
        FIELD_DESCRIPTION: 'FIELD_DESCRIPTION',
        PATHS: 'PATHS',
        HISTORY: 'HISTORY',
        CUR_VERSION: 'CUR_VERSION',
        SHOW_PATHS: 'SHOW_PATHS',
        SHIFT_PATHS: 'SHIFT_PATHS',
        BALL_COORDS: 'BALL_COORDS',
    }

    useEffect(() => {
        document.onkeydown = onKeyDown
    }, [])

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        function getParam(name,defValue) {
            const fromParams = params?.[name]
            if (fromParams !== undefined) {
                return fromParams
            }
            const fromPrevState = prevState?.[name]
            if (fromPrevState !== undefined) {
                return fromPrevState
            }
            return defValue
        }

        let history = getParam(s.HISTORY)
        let curVersion = getParam(s.CUR_VERSION)

        if (hasNoValue(history)) {
            const {history:newHistory} = generateNewField()
            history = newHistory
            curVersion = history.length-1
        }
        return createObj({
            [s.FIELD_DESCRIPTION]: history[curVersion].field,
            [s.PATHS]: history[curVersion].paths,
            [s.HISTORY]: history,
            [s.CUR_VERSION]: curVersion,
            [s.SHOW_PATHS]: getParam(s.SHOW_PATHS, false),
            [s.SHIFT_PATHS]: getParam(s.SHIFT_PATHS, false),
            [s.BALL_COORDS]: getParam(s.BALL_COORDS, getStartCoords({field:history[curVersion].field})),
        })
    }

    function getStartCoords({field}) {
        for (let x = 0; x <= field.length; x++) {
            for (let y = 0; y <= field[0].length; y++) {
                if (field[x][y] === START_CELL) {
                    return {x,y}
                }
            }
        }
    }

    function generateNewField() {

        // for (let i = 0; i < 1000; i++) {
        //     generatePath({width:20,height:15,length:10,numOfFakePaths:3})
        //     console.log(i)
        // }

        return generatePath({width:20,height:15,length:10,numOfFakePaths:4,returnHistory:true})
    }

    const viewWidthPx = 900
    const background = SVG.rect({key:'background', x:-1000, y:-1000, width:2000, height:2000, fill:'white'})

    const cellSize = 10
    const maxY = state[s.FIELD_DESCRIPTION][0].length-1
    const maxX = state[s.FIELD_DESCRIPTION].length-1
    const numOfColumns = maxX + 1
    const numOfRows = maxY + 1

    const fieldLowerBound = SVG_EX.scale(numOfColumns*cellSize)
    const fieldUpperBound = fieldLowerBound.translateTo(SVG_EY.scale(numOfRows*cellSize).end)
    const fieldCorners = [
        fieldLowerBound.start,
        fieldLowerBound.end,
        fieldUpperBound.end,
        fieldUpperBound.start,
    ]

    const viewBoundaries = SvgBoundaries.fromPoints(...fieldCorners).addAbsoluteMargin(cellSize*0.3)

    function renderCells() {
        const height = cellSize*numOfRows
        const width = cellSize*numOfColumns
        const vertLine = SVG_EY.scale(height)
        const horLine = SVG_EX.scale(width)
        const lineWidth = cellSize * 0.05
        const lineColor = 'lightgrey'
        return [
            ...ints(0,numOfColumns)
                .map(i => vertLine.translateTo(SVG_EX.scale(i*cellSize).end))
                .map((vec,i) => vec.toSvgLine({
                    key:`vert-line-${i}`, props:{stroke: lineColor, strokeWidth: lineWidth}
                })),
            ...ints(0,numOfRows)
                .map(i => horLine.translateTo(SVG_EY.scale(i*cellSize).end))
                .map((vec,i) => vec.toSvgLine({
                    key:`hor-line-${i}`, props:{stroke: lineColor, strokeWidth: lineWidth}
                }))
        ]
    }

    function fieldXToSvg(x) {
        return (maxX-x)*cellSize+cellSize/2
    }

    function fieldYToSvg(y) {
        return -(y*cellSize+cellSize/2)
    }

    function renderObjects() {
        const result = []
        for (let x = 0; x <= maxX; x++) {
            for (let y = 0; y <= maxY; y++) {
                const cellValue = state[s.FIELD_DESCRIPTION][x][y]
                if (cellValue === START_CELL) {
                    result.push(svgCircle({
                        key:`start-${x}-${y}`,
                        c:new Point(fieldXToSvg(x), fieldYToSvg(y)),
                        r:cellSize*0.35,
                        props:{strokeWidth: 0, fill: 'orange'}
                    }))
                    if (state[s.BALL_COORDS] && (state[s.BALL_COORDS].x != x || state[s.BALL_COORDS].y != y)) {
                        result.push(svgCircle({
                            key:`ball-${state[s.BALL_COORDS].x}-${state[s.BALL_COORDS].y}`,
                            c:new Point(fieldXToSvg(state[s.BALL_COORDS].x), fieldYToSvg(state[s.BALL_COORDS].y)),
                            r:cellSize*0.35,
                            props:{strokeWidth: 0, fill: 'green'}
                        }))
                    }
                } else if (cellValue === WALL_CELL) {
                    result.push(renderFilledCell({key:`wall-${x}-${y}`, x, y, color:'blue'}))
                } else if (cellValue === TARGET_CELL) {
                    result.push(renderFilledCell({key:`target-${x}-${y}`, x, y, color:'black'}))
                }
            }
        }
        return result
    }

    function renderFilledCell({key,x,y,color}) {
        let cellBottomVector = SVG_EX.scale(cellSize)
        cellBottomVector = cellBottomVector.translate(null, maxX-x)
        let cellLeftVector = cellBottomVector.rotate(90)
        cellBottomVector = cellBottomVector.translate(cellLeftVector,y)
        cellLeftVector = cellLeftVector.translate(null, y+1)
        let cellUpperVector = cellLeftVector.rotate(-90)
        return svgPolygon({
            key,
            points:[cellBottomVector.start, cellBottomVector.end, cellUpperVector.end, cellUpperVector.start],
            props:{strokeWidth: 0, fill: color}
        })
    }

    function renderPath({key,path,color,dx}) {
        const strokeWidth = cellSize*0.1;
        return svgPolyline({
            key,
            points:path.map(({x,y}) => new Point(fieldXToSvg(x)+(dx??0),fieldYToSvg(y)+(dx??0))),
            props:{fill:'none', stroke: color, strokeWidth: strokeWidth, strokeLinecap:'round', strokeLinejoin:'round'}
        })
    }

    function renderPaths() {
        const paths = state[s.PATHS]
        const result = []
        const fakePathColors = [
            'rgba(255,0,0,0.3)',
            'rgba(0,255,0,0.3)',
            'rgba(0,0,255,0.3)',
            'rgba(255,169,0,0.6)',
        ]
        for (let i = 1; i < paths.length; i++) {
            result.push(renderPath({
                key:`fake-path-${i}`,
                path:paths[i],
                color:i<=fakePathColors.length?fakePathColors[i-1]:fakePathColors[0],
                dx:state[s.SHIFT_PATHS]?i:0
            }))
        }
        result.push(renderPath({key:'main-path',path:paths[0],color:'black'}))
        return result
    }

    function renderNumbers() {
        const fontSize = (cellSize*0.7)+'px'
        const dx = cellSize*0.15
        const dy = cellSize*0.2
        const result = []
        for (let x = 0; x <= maxX; x++) {
            for (let y = 0; y <= maxY; y++) {
                const cellValue = state[s.FIELD_DESCRIPTION][x][y]
                result.push(SVG.text(
                    {
                        key:`cell-value-${x}-${y}`,
                        x:fieldXToSvg(x)- dx,
                        y:fieldYToSvg(y)+ dy,
                        fill:'lightgrey',
                        fontSize: fontSize,
                    },
                    cellValue
                ))
            }
        }
        return result
    }

    function renderPathInfo() {
        return state[s.PATHS].map((path,idx) => RE.div({key:`path-info-${idx}`},`path ${idx}: length = ${path.length}`))
    }

    function getWidthAndHeightOfSvg({viewBoundaries,viewWidthPx}) {
        const viewBoundariesWidth = viewBoundaries.maxX - viewBoundaries.minX
        const viewBoundariesHeight = viewBoundaries.maxY - viewBoundaries.minY
        if (viewBoundariesWidth > viewBoundariesHeight) {
            return {
                width: viewWidthPx,
                height: viewWidthPx * viewBoundariesHeight / viewBoundariesWidth
            }
        } else {
            return {
                width: viewWidthPx * viewBoundariesWidth / viewBoundariesHeight,
                height: viewWidthPx
            }
        }
    }

    function onShowPath() {
        setState(prevState => createNewState({
            prevState,
            params: {[s.SHOW_PATHS]:true}
        }))
    }

    function onGenerateNew() {
        setState(prevState => createNewState({
            prevState,
            params: {
                [s.SHOW_PATHS]: false,
                [s.HISTORY]: null
            }
        }))
    }

    function onNext() {
        if (!state[s.SHOW_PATHS]) {
            onShowPath()
        } else {
            onGenerateNew()
        }
    }

    function moveBall({dir}) {
        setState(prevState => {
            const field = prevState[s.FIELD_DESCRIPTION]
            const maxX = field.length-1
            const maxY = field[0].length-1
            let ballCoords = prevState[s.BALL_COORDS]
            while (0 <= ballCoords.x && ballCoords.x <= maxX && 0 <= ballCoords.y && ballCoords.y <= maxY
                && field[ballCoords.x][ballCoords.y] != TARGET_CELL
                && 0 <= ballCoords.x+dir.dx && ballCoords.x+dir.dx <= maxX && 0 <= ballCoords.y+dir.dy && ballCoords.y+dir.dy <= maxY
                && field[ballCoords.x+dir.dx][ballCoords.y+dir.dy] != WALL_CELL) {
                ballCoords = {x:ballCoords.x+dir.dx, y:ballCoords.y+dir.dy}
            }
            return createNewState({prevState, params: {[s.BALL_COORDS]: ballCoords}})
        })
    }

    function onKeyDown(event) {
        if (event.keyCode == DOWN_KEY_CODE) {
            moveBall({dir:{dx:0,dy:-1}})
        } else if (event.keyCode == UP_KEY_CODE) {
            moveBall({dir:{dx:0,dy:1}})
        } else if (event.keyCode == LEFT_KEY_CODE) {
            moveBall({dir:{dx:1,dy:0}})
        } else if (event.keyCode == RIGHT_KEY_CODE) {
            moveBall({dir:{dx:-1,dy:0}})
        }
    }

    return RE.Container.col.top.left({style:{marginTop:'10px'}},{style:{marginBottom:'5px'}},
        RE.Container.row.left.center({},{style:{marginLeft:'20px'}},
            RE.FormControlLabel({
                control:RE.Checkbox({
                    checked: state[s.SHOW_PATHS],
                    onChange: event => {
                        const target = event.target
                        setState(prevState => createNewState({
                            prevState,
                            params: {[s.SHOW_PATHS]: target.checked}
                        }))
                    }
                }),
                label:'Show paths'
            }),
            RE.FormControlLabel({
                control:RE.Checkbox({
                    checked: state[s.SHIFT_PATHS],
                    onChange: event => {
                        const target = event.target
                        setState(prevState => createNewState({
                            prevState,
                            params: {[s.SHIFT_PATHS]: target.checked}
                        }))
                    }
                }),
                label:'Apply shift'
            }),
            RE.Button({onClick: onNext}, 'next'),
            re(Pagination,{
                numOfPages:state[s.HISTORY].length,
                curPage:state[s.CUR_VERSION]+1,
                onChange: newPage => setState(prevState => createNewState({prevState,params:{[s.CUR_VERSION]:newPage-1}}))
            })
        ),
        // renderPathInfo(),
        RE.svg(
            {
                ...getWidthAndHeightOfSvg({viewBoundaries,viewWidthPx}),
                boundaries: viewBoundaries,
            },
            background,
            svgPolygon({key: 'field', points: fieldCorners, props: {fill:'white', strokeWidth: 0}}),
            renderCells(),
            state[s.SHOW_PATHS] ? renderPaths() : null,
            renderObjects(),
            // renderNumbers()
        )
    )
}
