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

function wrap(x, size) {
    if (x < 0) {
        return size + x;
    }
    if (x >= size) {
        return x - size;
    }
    return x;
}

//////////////////////////////////////////////////////

var SIZE = 50;

var BOARD = getArray2d(SIZE, false);
var ISTARGET = getArray2d(SIZE, false);

var CELLS = [];

var CHECKS = [[-1, -1], [0, -1], [1, -1],
              [-1,  0],          [1,  0],
              [-1,  1], [0, 1],  [1,  1]];

var TIMEOUT;
var ISRUNNING = false;

//////////////////////////////////////////////////////

function flipCell(cell) {
    var coord = codeToCoord(cell.id);
    if (ISRUNNING) {
        var use = !ISTARGET[coord[0]][coord[1]];
        ISTARGET[coord[0]][coord[1]] = use;
        BOARD[coord[0]][coord[1]] = use;
        cell.className = use ? 'target' : 'dead';
    } else {
        BOARD[coord[0]][coord[1]] = !BOARD[coord[0]][coord[1]];
        cell.className = BOARD[coord[0]][coord[1]] ? 'alive' : 'dead';
    }
}

function updateCell(x, y, alive) {
    BOARD[x][y] = alive;
    CELLS[x][y].className = alive ? 'alive' : 'dead';
}

function setUpBoard() {
    var table = document.getElementById('table');
    var frac = String(table.clientWidth / SIZE);
    for (var i = 0; i < SIZE; i++) {
        var row = document.createElement('tr');
        var arr = [];
        for (var j = 0; j < SIZE; j++) {
            var cell = document.createElement('td');
            cell.style.width = frac;
            cell.style.height = frac;
            cell.id = String(coordToCode(i, j));
            cell.className = 'dead';
            cell.onclick = function () { flipCell(this); };
            row.appendChild(cell);
            arr.push(cell);
        }
        table.appendChild(row);
        CELLS.push(arr);
    }
}

function update() {
    var src = [];
    for (var i = 0; i < SIZE; i++) {
        var arr = [];
        for (var j = 0; j < SIZE; j++) {
            arr.push(BOARD[i][j]);
        }
        src.push(arr);
    }
    for (var x = 0; x < SIZE; x++) {
        for (var y = 0; y < SIZE; y++) {
            if (!ISTARGET[x][y]) {
                var sum = 0;
                for (var c = 0; c < 8; c++) {
                    var check = CHECKS[c];
                    var cx = wrap(x + check[0], SIZE);
                    var cy = wrap(y + check[1], SIZE);
                    sum += src[cx][cy] ? 1 : 0;
                }
                if (src[x][y] && (sum < 2 || sum > 3)) {
                    updateCell(x, y, false);
                }
                if (!src[x][y] && sum == 3) {
                    updateCell(x, y, true);
                }
            }
        }
    }
    start();
}

function start() {
    ISRUNNING = true;
    TIMEOUT = setTimeout(update, Number(document.getElementById('speed').value));
}

function stop() {
    ISRUNNING = false;
    clearTimeout(TIMEOUT);
}

//////////////////////////////////////////////////////

setUpBoard();