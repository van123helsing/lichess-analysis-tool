var games = [];
var tree = new Tree(null);
var chessGame = new Chess();
var future = [];
var board = null
var stockfish = STOCKFISH();
var evalInProgress = false;
var evaluation = false;
var bestmove = "";
var mate = false;


window.onload = (event) => {
  var whiteSquareGrey = '#a9a9a9'
  var blackSquareGrey = '#696969'

  function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '')
  }

  function greySquare(square) {
    var $square = $('#myBoard .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
      background = blackSquareGrey
    }

    $square.css('background', background)
  }

  function onDragStart(source, piece) {
    // do not pick up pieces if the game is over
    if (chessGame.game_over()) return false

    // or if it's not that side's turn
    if ((chessGame.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (chessGame.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false
    }
  }

  function onDrop(source, target) {
    removeGreySquares()

    // see if the move is legal
    var move = chessGame.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // illegal move
    if (move === null) return 'snapback';

    printHistory();
    drawMoves();
    eval(chessGame.fen());
  }

  function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = chessGame.moves({
      square: square,
      verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the square they moused over
    greySquare(square)

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to)
    }
  }

  function onMouseoutSquare(square, piece) {
    removeGreySquares()
  }

  var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
  }

  board = Chessboard('myBoard', config);

  $('#flipOrientationBtn').on('click', board.flip);
  $('#moveBack').click(function () {
    back()
  });
  stockfish.postMessage("uci");
  stockfish.postMessage("ucinewgame");
  eval(chessGame.fen());
};

stockfish.onmessage = function (event) {
  if (event.startsWith("bestmove")) {
    evalInProgress = false;
    bestmove = event.split(" ")[1];

    if (board !== null){
      $(".ratingContainer").show();
      make_rating_slider();
      drawBestMoveArrow();
    }
  }
  if (event.startsWith("info")) {
    // evaluation = ((event.split(" ")[9]) / 100).toFixed(1);
    evaluation = (event.split(" ")[9]);
    var whiteTurn = chessGame.history().length % 2
    if (whiteTurn !== 0) evaluation = evaluation * (-1);
  }
  console.log(event.data ? event.data : event);
};

function eval(fen) {
  if (evalInProgress) {
    stockfish.postMessage("stop");
  }
  evalInProgress = true;
  stockfish.postMessage("position fen " + fen);
  stockfish.postMessage("go depth 9");
}


function chooseAmove(move) {
  chessGame.move(move);
  onSnapEnd();
  printHistory();
  drawMoves();
  eval(chessGame.fen());
}

function back(index) {
  var moves = chessGame.history();
  if (index === undefined) index = moves.length - 1
  var tmp = new Chess();
  for (var i = 0; i < index; i++) {
    tmp.move(moves[i]);
  }
  var new_fen = tmp.fen();
  board.position(new_fen)
  chessGame = tmp;
  onSnapEnd();
  printHistory();
  drawMoves();
  eval(chessGame.fen());
}

function onSnapEnd() {
  board.position(chessGame.fen())
}

function printHistory() {
  var moves = chessGame.history();
  var txt = "";
  for (var i = 0; i < moves.length; i++) {
    if (isInt(i / 2)) txt = txt + "\xa0" + String((i / 2) + 1) + ". "
    txt = txt + "<b id='move" + i + "' class='movesHistoryHover' onclick='return back(\"" + (parseInt(i) + 1) + "\");'>" + moves[i] + "</b> "
  }
  $("#movesHistory span").html(txt)
}


function drawBestMoveArrow() {
  var from = bestmove.substring(0, 2);
  var to = bestmove.substring(2, 4);
  var $this = $(".square-" + from);
  var offset = $this.offset();
  var width = $this.width();
  var height = $this.height();
  var centerXfrom = offset.left + width / 2;
  var centerYfrom = offset.top + height / 2;
  $this = $(".square-" + to);
  offset = $this.offset();
  width = $this.width();
  height = $this.height();
  var centerXto = offset.left + width / 2;
  var centerYto = offset.top + height / 2;
  let canvas = document.getElementById("evalArrow");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext("2d");
  ctx.lineWidth = 20;
  ctx.strokeStyle = 'steelblue';
  ctx.fillStyle = 'steelbllue';
  console.log(ctx, centerXfrom, centerYfrom, centerXto, centerYto);

  create_arrow(ctx, centerXfrom, centerYfrom, centerXto, centerYto, {
    fillStyle: 'steelblue',
    width: width / 5,
    head_len: width / 1.5,
    ///lineWidth: box1.width / 10,
    ///strokeStyle: "rgba(200,200,200,.4)",
  });
}

function create_arrow(ctx, x1, y1, x2, y2, options) {
  options = options || {};

  options.width = options.width || 12;
  options.fillStyle = options.fillStyle || "rgb(0,0,200)";
  options.head_len = options.head_len || 30;

  if (options.head_len < options.width + 1) {
    options.head_len = options.width + 1;
  }
  options.head_angle = options.head_angle || Math.PI / 6;

  var angle = Math.atan2(y2 - y1, x2 - x1);

  var ang_neg = angle - options.head_angle;
  var ang_pos = angle + options.head_angle;
  var tri_point1 = {
    x: x2 - options.head_len * Math.cos(ang_neg),
    y: y2 - options.head_len * Math.sin(ang_neg)
  };
  var tri_point2 = {
    x: x2 - options.head_len * Math.cos(ang_pos),
    y: y2 - options.head_len * Math.sin(ang_pos)
  };

  /// Since the line has a width, we need to create a new line by moving the point half of the width and then rotating it to match the line.
  var p1 = rotate_point(x1, y1 + options.width / 2, x1, y1, angle);
  var p2 = rotate_point(x2, y2 + options.width / 2, x2, y2, angle);

  /// Find the point at which the line will reach the bottom of the triangle.
  var int2 = get_intersect(p1.x, p1.y, p2.x, p2.y, tri_point1.x, tri_point1.y, tri_point2.x, tri_point2.y);

  var p3 = rotate_point(x1, y1 - options.width / 2, x1, y1, angle);
  var p4 = rotate_point(x2, y2 - options.width / 2, x2, y2, angle);
  var int3 = get_intersect(p3.x, p3.y, p4.x, p4.y, tri_point1.x, tri_point1.y, tri_point2.x, tri_point2.y);

  ctx.fillStyle = options.fillStyle;
  ctx.beginPath();
  ctx.arc(x1, y1, options.width / 2, angle - Math.PI / 2, angle - Math.PI * 1.5, true);
  ctx.lineTo(int2.x, int2.y);
  ctx.lineTo(tri_point1.x, tri_point1.y);
  ctx.lineTo(x2, y2);
  ctx.lineTo(tri_point2.x, tri_point2.y);
  ctx.lineTo(int3.x, int3.y);
  ctx.closePath();
  if (options.lineWidth) {
    ctx.lineWidth = options.lineWidth;
    ctx.strokeStyle = options.strokeStyle;
    ctx.stroke();
  }
  ctx.fill();
}

function rotate_point(point_x, point_y, origin_x, origin_y, angle) {
  return {
    x: Math.cos(angle) * (point_x - origin_x) - Math.sin(angle) * (point_y - origin_y) + origin_x,
    y: Math.sin(angle) * (point_x - origin_x) + Math.cos(angle) * (point_y - origin_y) + origin_y
  };
}

function get_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  /// See https://en.wikipedia.org/wiki/Line–line_intersection.
  return {
    x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)),
    y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4))
  };
}


function make_rating_slider() {
  var $container = $("div .ratingContainer");
  var $slider_el = $("div .ratingSlider");
  var canvas = document.getElementsByClassName("ratingCanvas")[0];
  console.log(canvas.height,canvas.width);
  var obj = {max: 1000, min: -1000, value: 0};
  var ctx = canvas.getContext("2d");

  function calculate_slope() {
    /// m = change in y-value (y2 - y1)
    ///     change in x-value (x2 - x1)
    obj.m = (100 - 0) / (obj.min - obj.max);
  }

  function draw_marks() {
    var height = canvas.height,
      width = canvas.width,
      qrt_width,
      pos,
      median,
      line_y,
      font_size,
      text;

    median = height / 2;
    /// Draw median.
    ctx.beginPath();
    ctx.lineWidth = height / 150;
    ctx.strokeStyle = "rgba(200,0,0,.9)";
    ctx.moveTo(0, median);
    ctx.lineTo(width, median);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = height / 500;
    ctx.fillStyle = ctx.strokeStyle = "rgba(128,128,128,.6)";
    ctx.textAlign = "center";
    qrt_width = width / 4;

    for (pos = ((obj.min + 1) - (obj.min + 1) % 100); pos < obj.max; pos += 100) {
      if (pos !== 0) {
        text = String(pos / 100);
        // font_size = font_fit.fit(text, {w: width / 2, h: width / 2});
        // ctx.font = font_size + "px " + rating_font_style;
        line_y = median - ((pos / obj.max) * median);
        ctx.moveTo(0, line_y);
        ctx.lineTo(qrt_width, line_y);
        ctx.moveTo(width - qrt_width, line_y);
        ctx.lineTo(width, line_y);
        ctx.fillText(text, width / 2 - 1, line_y + qrt_width / 2);
      }
    }

    ctx.stroke();
  }

  calculate_slope();

  obj.resize = function () {
    $container.width($("#myBoard div").first().width() / 16);
    $container.height($("#myBoard div").first().height());
    ///NOTE: clientWidth/clientHeight gets the width without the board.
    canvas.width = $container.width();
    canvas.height = $container.height();
    console.log(canvas.height,canvas.width);

    draw_marks();
  };

  obj.set_eval = function (value) {
    obj.value = Number(value);
    $slider_el.css("height",((obj.m * Math.max(Math.min(obj.value, obj.max), obj.min)) + 50) + "%");
  };

  /// Set default.
  // obj.set_eval(obj.value);
  obj.resize();

    if (mate === false) {
      obj.set_eval(evaluation);
    }
    // else {
    //   if (e.score === 0) {
    //     obj.set_eval(e.turn === "w" ? -obj.max : obj.max);
    //   } else {
    //     obj.set_eval(e.score > 0 ? obj.max : -obj.max);
    //   }
    // }


};

function getBack(len, x1, y1, x2, y2) {
  return x2 - (len * (x2 - x1) / (Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2))));
}

function game() {
  this.event = null;
  this.site = null;
  this.date = null;
  this.white = null;
  this.black = null;
  this.computer = null;
  this.result = null;
  this.whiteElo = null;
  this.blackElo = null;
  this.variant = null;
  this.timeControl = null;
  this.ECO = null;
  this.movesArray = null;
  this.movesPgn = null;
}


function Node(move) {
  this.move = move;
  this.allCount = 0
  this.wonCount = 0;
  this.drawCount = 0;
  this.defeatCount = 0;
  this.parent = null;
  this.children = [];
}


function Tree(data) {
  this._root = new Node(data);
}
