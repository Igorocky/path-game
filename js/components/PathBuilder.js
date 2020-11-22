"use strict";

const PathBuilder = () => {

    const s = {
        FIELD_DESCRIPTION: 'FIELD_DESCRIPTION',
        PATH_DESCRIPTION: 'PATH_DESCRIPTION',
    }

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        return createObj({
            [s.FIELD_DESCRIPTION]: [
                [2,0,0,0,0,0,0,0,0,0,0,2],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,4,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,2,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,1,0,0],
                [0,0,0,0,0,0,0,0,0,2,0,0],
                [2,0,0,0,0,0,0,0,0,0,0,2],
            ],
        [s.PATH_DESCRIPTION]: [
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0],
            ],
        })
    }

    const viewWidthPx = 700
    const background = SVG.rect({key:'background', x:-1000, y:-1000, width:2000, height:2000, fill:"lightgrey"})

    const cellSize = 10
    const numOfCols = state[s.FIELD_DESCRIPTION][0].length
    const numOfRows = state[s.FIELD_DESCRIPTION].length

    const fieldLowerBound = SVG_EX.scale(numOfCols*cellSize)
    const fieldUpperBound = fieldLowerBound.translateTo(SVG_EY.scale(numOfRows*cellSize).end)
    const fieldCorners = [
        fieldLowerBound.start,
        fieldLowerBound.end,
        fieldUpperBound.end,
        fieldUpperBound.start,
    ]

    const viewBoundaries = SvgBoundaries.fromPoints(fieldCorners).addAbsoluteMargin(cellSize*0.3)

    function renderCells() {
        console.log({numOfRows})
        const height = cellSize*numOfRows
        const width = cellSize*numOfCols
        const vertLine = SVG_EY.scale(height)
        const horLine = SVG_EX.scale(width)
        const lineWidth = cellSize * 0.05
        const lineColor = 'grey'
        return [
            ...ints(0,numOfCols)
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

    function renderObjects() {
        const result = []
        for (let r = 0; r < numOfRows; r++) {
            for (let c = 0; c < numOfCols; c++) {
                const cellValue = state[s.FIELD_DESCRIPTION][numOfRows-1-r][c]
                if (cellValue == START_CELL) {
                    result.push(svgCircle({
                        key:`start-${r}-${c}`,
                        c:SVG_EX.scale(c*cellSize+cellSize/2).add(SVG_EY.scale(r*cellSize+cellSize/2)).end,
                        r:cellSize*0.35,
                        props:{strokeWidth: 0, fill: 'yellow'}
                    }))
                } else if (cellValue == WALL_CELL) {
                    result.push(renderFilledCell({key:`wall-${r}-${c}`, rowNum:r, colNum:c, color:'blue'}))
                } else if (cellValue == TARGET_CELL) {
                    result.push(renderFilledCell({key:`wall-${r}-${c}`, rowNum:r, colNum:c, color:'black'}))
                }
            }
        }
        return result
    }

    function renderFilledCell({key,rowNum,colNum,color}) {
        let cellBottomVector = SVG_EX.scale(cellSize)
        cellBottomVector = cellBottomVector.translate(null, colNum)
        let cellLeftVector = cellBottomVector.rotate(90)
        cellBottomVector = cellBottomVector.translate(cellLeftVector,rowNum)
        cellLeftVector = cellLeftVector.translate(null, rowNum+1)
        let cellUpperVector = cellLeftVector.rotate(-90)
        return svgPolygon({
            key,
            points:[cellBottomVector.start, cellBottomVector.end, cellUpperVector.end, cellUpperVector.start],
            props:{strokeWidth: 0, fill: color}
        })
    }

    return RE.Container.col.top.center({style:{marginTop:'100px'}},{},
        RE.svg(
            {
                width: viewWidthPx,
                height: viewWidthPx,
                boundaries: viewBoundaries,
            },
            background,
            svgPolygon({key: 'field', points: fieldCorners, props: {fill:'green', strokeWidth: 0}}),
            renderCells(),
            renderObjects()
        )
    )
}