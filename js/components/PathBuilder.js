"use strict";

const PathBuilder = () => {

    const s = {
        FIELD_DESCRIPTION: 'FIELD_DESCRIPTION',
        PATH_DESCRIPTION: 'PATH_DESCRIPTION',
    }

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        const {field,path} = generatePath({width:20,height:15,length:7,numOfRandomWalls:10})
        console.log({field})
        console.log({path})
        return createObj({
            [s.FIELD_DESCRIPTION]: field,
            [s.PATH_DESCRIPTION]: path,
        })
    }

    const viewWidthPx = 700
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

    const viewBoundaries = SvgBoundaries.fromPoints(fieldCorners).addAbsoluteMargin(cellSize*0.3)

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

    function renderPath() {
        const result = []
        for (let p = 0; p < state[s.PATH_DESCRIPTION].length; p++) {
            const pathElem = state[s.PATH_DESCRIPTION][p]
            const strokeWidth = cellSize*0.1;
            result.push(svgLine({
                key:`path-${p}`,
                from: new Point(fieldXToSvg(pathElem[0].x), fieldYToSvg(pathElem[0].y)),
                to: new Point(fieldXToSvg(pathElem[1].x), fieldYToSvg(pathElem[1].y)),
                props:{stroke: 'black', strokeWidth: strokeWidth}
            }))
        }
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
                        fill:'coral',
                        fontSize: fontSize,
                    },
                    cellValue
                ))
            }
        }
        return result
    }

    return RE.Container.col.top.center({style:{marginTop:'100px'}},{},
        RE.svg(
            {
                width: viewWidthPx,
                height: viewWidthPx,
                boundaries: viewBoundaries,
            },
            background,
            svgPolygon({key: 'field', points: fieldCorners, props: {fill:'white', strokeWidth: 0}}),
            renderObjects(),
            renderCells(),
            renderPath(),
            renderNumbers()
        )
    )
}
