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

function removeCharAt(str, index) {
    return str.substr(0, index) + str.substr(index + 1);
}

function removeElementAt(arr, index) {
    arr.splice(index, 1);
    return arr;
}

//////////////////////////////////////////////////////

const SIZE = 50;
const STARTING_RULES = 4;
const LESS_THAN_DELETE_THRESHOLD = 5;
const LEARN_DELAY = 10;

var BOARD = getArray2d(SIZE, false);
var ISTARGET = getArray2d(SIZE, false);

var CELLS = [];

var CHECKS = [[-1, -1], [0, -1], [1, -1],
              [-1,  0],          [1,  0],
              [-1,  1], [0,  1], [1,  1]];

var RULE_STRENGTH = [];

//                012345678
var RULE_ALIVE = 'ABCDEFGHI';
var RULE_DEAD =  'abcdefghi';

var RULE_SIZE = RULE_ALIVE.length;

var TIMEOUT;
var ISRUNNING = false;

var CYCLE = 0;

//////////////////////////////////////////////////////

function generateRules(num) {
    var result = '';
    for (var i = 0; i < num; i++) {
        while (true) {
            var index = Math.floor(Math.random() * RULE_SIZE);
            var newRule = Math.random() >= 0.5 ? RULE_ALIVE.substr(index, 1) : RULE_DEAD.substr(index, 1);
            if (result.indexOf(newRule) == -1) {
                result += newRule;
                break;
            }
        }
    }
    return result;
}

//return array of [rule, strength]
function allNearbyRules(x, y) {
    var all = [];
    for (var c = 0; c < 8; c++) {
        var check = CHECKS[c];
        var cx = wrap(x + check[0], SIZE);
        var cy = wrap(y + check[1], SIZE);
        var otherRules = CELLS[cx][cy].getAttribute("name");
        for (var i = 0; i < otherRules.length; i++) {
            all.push([otherRules.charAt(i), RULE_STRENGTH[cx][cy][i]]);
        }
    }
    return all;
}

//return array of [max_strength, array_of_rules]
function bestNearbyRules(x, y) {
    var all = allNearbyRules(x, y);
    var max = -1000;
    //find max strength
    for (var i = 0; i < all.length; i++) {
        if (all[i][1] > max) {
            max = all[i][1];
        }
    }
    var best = [];
    //add all rules with that max
    for (var i = 0; i < all.length; i++) {
        if (all[i][1] == max && best.indexOf(all[i][0]) == -1) {
            best.push(all[i][0]);
        }
    }
    return [max, best];
}

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
            cell.setAttribute("name", generateRules(STARTING_RULES));
            cell.className = 'dead';
            cell.onclick = function () { flipCell(this); };
            row.appendChild(cell);
            arr.push(cell);
        }
        table.appendChild(row);
        CELLS.push(arr);
    }
}

function setUpRuleStrengths() {
    for (var x = 0; x < SIZE; x++) {
        var row = [];
        for (var y = 0; y < SIZE; y++) {
            var stren = [];
            for (var i = 0; i < CELLS[x][y].getAttribute("name").length; i++) {
                stren.push(0);
            }
            row.push(stren);
        }
        RULE_STRENGTH.push(row);
    }
}

function applyRules(x, y, src) {
    var sum = 0;
    var rules = CELLS[x][y].getAttribute("name");
    //check how many are alive
    for (var c = 0; c < 8; c++) {
        var check = CHECKS[c];
        var cx = wrap(x + check[0], SIZE);
        var cy = wrap(y + check[1], SIZE);
        sum += src[cx][cy] ? 1 : 0;
        //reinforce rules if alive and by target
        if (src[x][y] && ISTARGET[cx][cy]) {
            for (var i = 0; i < rules.length; i++) {
                RULE_STRENGTH[x][y][i]++;
            }
        }
    }
    //apply rules
    for (var i = 0; i < rules.length; i++) {
        var r = RULE_ALIVE.indexOf(rules.charAt(i));
        if (r == -1) {
            r = RULE_DEAD.indexOf(rules.charAt(i));
            if (src[x][y] && sum == r) {
                updateCell(x, y, false);
            }
        } else {
            if (!src[x][y] && sum == r) {
                updateCell(x, y, true);
            }
        }
    }
}

function learnRules(x, y){
    var bestget = bestNearbyRules(x, y);
    var rules = CELLS[x][y].getAttribute("name");
    var max = -1000;
    //find our max strength
    for (var i = 0; i < rules.length; i++) {
        if (RULE_STRENGTH[x][y][i] > max) {
            max = RULE_STRENGTH[x][y][i];
        }
    }
    //only consider nearby rules if they are better than anything we have
    var bestStrength = bestget[0];
    if (max < bestStrength) {
        var bestRules = bestget[1];
        //add good rules to our rules
        for (var i = 0; i < bestRules.length; i++) {
            if (rules.indexOf(bestRules[i]) == -1) {
                rules += bestRules[i];
                RULE_STRENGTH[x][y].push(bestStrength);
            }
        }
        //remove rules less than the threshold
        for (var i = 0; i < rules.length; i++) {
            if (RULE_STRENGTH[x][y][i] <= bestStrength - LESS_THAN_DELETE_THRESHOLD) {
                RULE_STRENGTH[x][y] = removeElementAt(RULE_STRENGTH[x][y], i);
                rules = removeCharAt(rules, i);
            }
        }
        CELLS[x][y].setAttribute("name", rules);
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
                applyRules(x, y, src);
                learnRules(x, y);
            }
        }
    }
    CYCLE++;
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
setUpRuleStrengths();