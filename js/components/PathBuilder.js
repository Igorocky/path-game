"use strict";

const PathBuilder = () => {

    const s = {
        FIELD_DESCRIPTION: 'FIELD_DESCRIPTION',
        PATHS: 'PATHS',
        SHOW_PATHS: 'SHOW_PATHS',
    }

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        function getParam(name,defValue) {
            return params?.[name]??prevState?.[name]??defValue
        }

        let field = getParam(s.FIELD_DESCRIPTION)
        let paths = getParam(s.PATHS)

        if (hasNoValue(field)) {
            const {field:newField,paths:newPaths} = generateNewField()
            field = newField
            paths = newPaths
        }
        return createObj({
            [s.FIELD_DESCRIPTION]: field,
            [s.PATHS]: paths,
            [s.SHOW_PATHS]: getParam(s.SHOW_PATHS, false),
            // [s.SHOW_PATHS]: true,
        })
    }

    function generateNewField() {
        const {field,paths} = generatePath2({width:20,height:15,length:7,numOfFakePaths:3})
        console.log({field})
        console.log({paths})
        return {field,paths}
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

    function renderPath({key,path,color}) {
        const strokeWidth = cellSize*0.1;
        return svgPolyline({
            key,
            points:path.map(({x,y}) => new Point(fieldXToSvg(x),fieldYToSvg(y))),
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
        ]
        for (let i = 1; i < paths.length; i++) {
            result.push(renderPath({
                key:`fake-path-${i}`,
                path:paths[i],
                color:i<=fakePathColors.length?fakePathColors[i-1]:fakePathColors[0]
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
        const {field,paths} = generateNewField()
        setState(prevState => createNewState({
            prevState,
            params: {
                [s.SHOW_PATHS]: false,
                [s.FIELD_DESCRIPTION]: field,
                [s.PATHS]: paths,
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

    return RE.Container.col.top.center({style:{marginTop:'10px'}},{},
        RE.Container.row.center.center({},{style:{marginLeft:'20px'}},
            RE.Button({onClick: onShowPath}, 'show path'),
            RE.Button({onClick: onGenerateNew}, 'generate new'),
            RE.Button({onClick: onNext}, 'next'),
        ),
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
