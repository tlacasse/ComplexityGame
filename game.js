//////////////////////////////////////////////////////

function getArray2d(dim, val) {
    var a = [];
    for (var i = 0; i < dim; i++) {
        var b = [];
        for (var j = 0; j < dim; j++) {
            b.push(val);
        }
        a.push(b);
    }
    return a;
}

var _scale = 10000;

function coordToCode(x, y) {
    return (_scale * x) + y;
}

function codeToCoord(code) {
    code = Number(code);
    var x = Math.floor(code / _scale);
    var y = code - (x * _scale);
    return [x, y];
}

//////////////////////////////////////////////////////

var SIZE = 20;

var BOARD = getArray2d(SIZE, false);

//////////////////////////////////////////////////////

function flipCell(cell) {
    var coord = codeToCoord(cell.id);
    console.log(coord);
    BOARD[coord[0]][coord[1]] = !BOARD[coord[0]][coord[1]];
    cell.className = BOARD[coord[0]][coord[1]] ? 'alive' : 'dead';
}

function setUpBoard() {
    var table = document.getElementById('table');
    var frac = String(table.clientWidth / SIZE);
    for (var i = 0; i < SIZE; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < SIZE; j++) {
            var cell = document.createElement('td');
            cell.style.width = frac;
            cell.style.height = frac;
            cell.id = String(coordToCode(i, j));
            cell.className = 'dead';
            cell.onclick = function () { flipCell(this); };
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

//////////////////////////////////////////////////////

setUpBoard();