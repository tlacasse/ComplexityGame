var SIZE = 20;

function setUpBoard() {
    var table = document.getElementById('table');
    var frac = String(table.clientWidth / SIZE);
    for (var i = 0; i < SIZE; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < SIZE; j++) {
            var cell = document.createElement('td');
            cell.style.width = frac;
            cell.style.height = frac;
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

setUpBoard();