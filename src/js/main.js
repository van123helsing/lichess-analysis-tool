window.onload = (event) => {
  showMoves();
};

function showMoves(){
  $("#settingsScreen").hide();
  $("#donateScreen").hide();
  $("#aboutScreen").hide();
  $("#movesScreen").show();
  $(".navbtn1").addClass("selectedNavBtn");
  $(".navbtn2").removeClass("selectedNavBtn");
  $(".navbtn3").removeClass("selectedNavBtn");
  $(".navbtn4").removeClass("selectedNavBtn");
}

function showSettings(){
  $("#settingsScreen").show();
  $("#donateScreen").hide();
  $("#movesScreen").hide();
  $("#aboutScreen").hide();
  $(".navbtn1").removeClass("selectedNavBtn");
  $(".navbtn2").addClass("selectedNavBtn");
  $(".navbtn3").removeClass("selectedNavBtn");
  $(".navbtn4").removeClass("selectedNavBtn");
}

function showDonate(){
  $("#settingsScreen").hide();
  $("#donateScreen").show();
  $("#movesScreen").hide();
  $("#aboutScreen").hide();
  $(".navbtn1").removeClass("selectedNavBtn");
  $(".navbtn2").removeClass("selectedNavBtn");
  $(".navbtn3").addClass("selectedNavBtn");
  $(".navbtn4").removeClass("selectedNavBtn");
}

function showAbout(){
  $("#settingsScreen").hide();
  $("#donateScreen").hide();
  $("#movesScreen").hide();
  $("#aboutScreen").show();
  $(".navbtn1").removeClass("selectedNavBtn");
  $(".navbtn2").removeClass("selectedNavBtn");
  $(".navbtn3").removeClass("selectedNavBtn");
  $(".navbtn4").addClass("selectedNavBtn");
}

function importData(){
  var file = $('#file')[0].files[0];
  var fileName = file.name.split(".");
  if (fileName[fileName.length-1] !== "pgn"){
    $('#wrongFilePlaceHolder').show();
    $('#loadingPlaceHolder').hide();
    $('#errorLoading').hide();
  } else {
    $('#wrongFilePlaceHolder').hide();
    $('#loadingPlaceHolder').show();
    $('#errorLoading').hide();
    readFile(file)
  }
}


function readFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    const result = event.target.result;
    try {
      loadGames(result);
    } catch (e) {
      console.log(e);
      $('#wrongFilePlaceHolder').hide();
      $('#loadingPlaceHolder').hide();
      $('#errorLoading').show();
    }
  });

  reader.readAsText(file);
}

function loadGames(str){
  var lines = str.split('\n');
  for(var i = 0; i < lines.length; i++){
    var res = pgnToJs(i,lines);
    if(res.game === null) break;
    games.push(res.game);
    i = res.line;
  }
  $('#loadingPlaceHolder').hide();
  $('#settingsFieldset').prop('disabled', false);
}

function pgnToJs(i,lines){
  g = new game()

  var countNewLines = 0;
  for(var j = 0; j+i < lines.length; j++){
    if(j===0 && lines[i+j] === undefined) return {game:null, line:0};
    if(lines[i+j]===""){ countNewLines++; continue;}
    if(countNewLines === 3) break;

    var l = lines[i + j].startsWith("[") ? lines[i + j].slice(1, -1) : lines[i + j];

    if(l.startsWith("Event"))
      g.event = cleanLine(l);
    else if(l.startsWith("Site"))
      g.site = cleanLine(l);
    else if(l.startsWith("Date"))
      g.date = cleanLine(l);
    else if (l.startsWith("White "))
      g.white = cleanLine(l);
    else if(l.startsWith("Black ")) {
      g.black = cleanLine(l);
      g.computer = g.black.startsWith("lichess AI") || g.white.startsWith("lichess AI");
    }
    else if(l.startsWith("Result"))
      g.result = cleanLine(l);
    else if(l.startsWith("WhiteElo"))
      g.whiteElo = cleanLine(l);
    else if(l.startsWith("BlackElo"))
      g.blackElo = cleanLine(l);
    else if( l.startsWith("Variant"))
      g.variant = cleanLine(l);
    else if( l.startsWith("TimeControl"))
      g.timeControl = cleanLine(l);
    else if( l.startsWith("ECO"))
      g.ECO = cleanLine(l);
    else if( l.startsWith("1.")) {
      g.movesArray = movesToArray(l);
      g.movesPgn = l;
    }
  }
  return {game:g, line:i+j-1};
}

function movesToArray(line){
  var result = [];
  var array = line.split(" ");
  for(var i=0; i<array.length; i++){
    if(i+2 > array.length) break;
    result.push(array[i+1]);
    result.push(array[i+2]);
    i+=2;
  }
  return result;
}

function cleanLine(line){
  var array = line.split(" ");
  array.shift();
  return (array.join(" ")).slice(1,-1);
}

function downloadPgn(){
  var req = new XMLHttpRequest();
  req.open("GET", "https://lichess.org/api/games/user/"+$('#playerName').val(), true);
  req.responseType = "blob";
  req.onload = function (event) {
    if(event.currentTarget.status === 404){
      $("#errorDownloading1").show();
      $("#errorDownloading2").hide();
      $("#downloadingPlaceHolder").hide();
    } else if (event.currentTarget.status === 200){
      $("#errorDownloading1").hide();
      $("#errorDownloading2").hide();
      $("#downloadingPlaceHolder").hide();
      var blob = req.response;
      var fileName = $('#playerName').val() + ".pgn";
      var link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } else {
      $("#errorDownloading1").hide();
      $("#errorDownloading2").show();
      $("#downloadingPlaceHolder").hide();
    }
  };
  req.onprogress = (event) => {
    // event.loaded returns how many bytes are downloaded
    // event.total returns the total number of bytes
    // event.total is only available if server sends `Content-Length` header
    var size = event.loaded;
    $("#downloadingPlaceHolder").show();
    $("#downloadingPlaceHolder").text("Downloaded: " + (size/1000000).toFixed(2) + "MB     (1000 games is aprox. 1MB)");
    // console.log(`Downloaded ${event.loaded} of ${event.total} bytes`);
  }
  req.send();
  return true;
}

function loadBook(){
  $("#loadBook").hide();
  var playingAsWhite = $('#settingsPlayingAsWhite')[0].checked;
  var gameVariants = $('#variantSelect').val();
  var userName = $('#userName').val();
  tree = new Tree(null);
  for(var i = 0; i<games.length; i++){
    // console.log(i);
    var moves = games[i].movesArray;
    var treeNode = tree._root;
    var isWhite = games[i].white === userName;

    if(moves === null || (isWhite && !playingAsWhite) || (!isWhite && playingAsWhite) || !variantsCheck(games[i].variant,gameVariants)){
      continue;
    }
    for(var j = 0; j < moves.length; j++) {
      if(moves[j] === "1-0" || moves[j] === "1/2-1/2" || moves[j] === "0-1"){
        treeNode = tree._root;
        break;
      }

      var flagMoveInTree = false;
      for(var k = 0; k < treeNode.children.length; k++){
        if(moves[j] === treeNode.children[k].move){
          treeNode.allCount+=1;
          treeNode.wonCount+=winDrawDefeat(isWhite,games[i].result, 1);
          treeNode.drawCount+=winDrawDefeat(isWhite,games[i].result, 2);
          treeNode.defeatCount+=winDrawDefeat(isWhite,games[i].result, 3);
          treeNode = treeNode.children[k];
          flagMoveInTree = true;
          break;
        }
      }
      if(!flagMoveInTree){
        var newNode = new Node(moves[j]);
        newNode.allCount+=1;
        newNode.wonCount+=winDrawDefeat(isWhite,games[i].result, 1);
        newNode.drawCount+=winDrawDefeat(isWhite,games[i].result, 2);
        newNode.defeatCount+=winDrawDefeat(isWhite,games[i].result, 3);
        newNode.parent = treeNode;
        treeNode.children.push(newNode)
        treeNode = newNode;
      }
    }
  }
  $("#loadBook").show();
  drawMoves()
}


function winDrawDefeat(white, result, mode){
  if(mode === 1){ //win
    if (white) {
      return result === "1-0" ? 1 : 0;
    } else {
      return result === "0-1" ? 1 : 0;
    }
  } else if (mode === 2){ //draw
    return result === "1/2-1/2" ? 1 : 0;
  } else if (mode === 3){ //defeat
    if (!white) {
      return result === "1-0" ? 1 : 0;
    } else {
      return result === "0-1" ? 1 : 0;
    }
  }
}


function variantsCheck(variant, selectedVariants){
  for(var n = 0; n<selectedVariants.length; n++)
    if(selectedVariants[n] === variant)
      return true;
  return false;
}

function drawMoves(){

  var playingAsWhite = $('#settingsPlayingAsWhite')[0].checked;
  var moves = chessGame.history();
  $(".opponentMove").hide();
  $(".noMoveFound").hide();
  $(".boxMovesBook tbody").html("");
  var opponentMoveFlag = false;

  if(playingAsWhite && !isInt(moves.length/2))
    opponentMoveFlag = true

  if(!playingAsWhite && isInt(moves.length/2))
    opponentMoveFlag = true

  var treeNode = tree._root;
  for(var i = 0; i < moves.length; i++){
    var moveFoundFlag = false;
    for(var j = 0; j < treeNode.children.length; j++){
      if(moves[i] === treeNode.children[j].move){
        moveFoundFlag = true;
        treeNode = treeNode.children[j];
        break;
      }
    }
    if(!moveFoundFlag){
      $(".noMoveFound").css({"display":"block"});
      return;
    }
  }

  var txt = "";
  var clonedArray = treeNode.children.slice();
  var sorted = clonedArray.sort((a, b) => (a.allCount < b.allCount) ? 1 : -1)

  if(!opponentMoveFlag) {
    for (var i = 0; i < sorted.length; i++) {
      let node = sorted[i];
      txt = txt + "<tr class='tableRow tableRow" + i + "' onclick='return chooseAmove(\"" + node.move + "\");'>" +
        "<td>" + node.move + "</td>" +
        "<td>" + node.allCount + "</td>" +
        "<td>" +
        "<div class=\"bar\">" +
        "<span class=\"white\" style='width: " + getPercentage(node.wonCount, node.allCount) + "%'>&nbsp; "
        // + getPercentage(node.wonCount,node.allCount)
        + "</span>" +
        "<span class=\"draws\" style='width: " + getPercentage(node.drawCount, node.allCount) + "%'>&nbsp; "
        // + getPercentage(node.drawCount,node.allCount)
        + "</span>" +
        "<span class=\"black\" style='width: " + getPercentage(node.defeatCount, node.allCount) + "%'>&nbsp; "
        // + getPercentage(node.defeatCount,node.allCount)
        + "</span>" +
        "</div></td></tr>";
    }
  } else {
    txt = txt + "<tr class='opponentMoves'><td></td><td></td><td>Opponent is on the move.</td></tr>"
    for (var i = 0; i < sorted.length; i++) {
      let node = sorted[i];
      txt = txt + "<tr class='opponentMoves'>" +
        "<td>" + node.move + "</td>" +
        "<td>" + node.allCount + "</td>" +
        "<td>" +
        "<div class=\"bar\">" +
        "<span class=\"white\" style='width: " + getPercentage(node.wonCount, node.allCount) + "%'>&nbsp; "
        // + getPercentage(node.wonCount,node.allCount)
        + "</span>" +
        "<span class=\"draws\" style='width: " + getPercentage(node.drawCount, node.allCount) + "%'>&nbsp; "
        // + getPercentage(node.drawCount,node.allCount)
        + "</span>" +
        "<span class=\"black\" style='width: " + getPercentage(node.defeatCount, node.allCount) + "%'>&nbsp; "
        // + getPercentage(node.defeatCount,node.allCount)
        + "</span>" +
        "</div></td></trclass>";
    }
  }
  $(".boxMovesBook tbody").html(txt);
}

function getPercentage(a,b){
  var m = a/b;
  return parseInt(m*100);
}

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a,b) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}


function isInt(n) {
  return n % 1 === 0;
}
