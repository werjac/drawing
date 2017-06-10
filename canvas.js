var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var clickColor = new Array();
var listId = new Array();
var peerCon= new Array();
var peer = null;
var peerTemp=null;
var paint;
var context;
var canvasWidth = 490;
var canvasHeight = 220;
var colors = ["#000000", "#ff0000", "#009933", "#0099ff", "#fffe11"];
var currentColor = "#000000";


function prepareSimpleCanvas()
{
    context = document.getElementById('canvas').getContext("2d");
    $('#canvas').mousedown(function(e)
    {
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
        paint = true;
        sendPoint(mouseX,mouseY,false);
        addClick(mouseX, mouseY, false);
        redraw();
    });
    $('#canvas').mousemove(function(e){
        if(paint){
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;
            sendPoint(mouseX,mouseY,true);
            addClick(mouseX, mouseY, true);
            redraw();
        }
    });
    $('#canvas').mouseup(function(e){
        paint = false;
        redraw();
    });
    $('#canvas').mouseleave(function(e){
        paint = false;
    });
    $('#clearCanvas').mousedown(function(e)
    {
        clickX = new Array();
        clickY = new Array();
        clickDrag = new Array();
        clickColor = new Array();
        clearCanvas();
    });
}

function addClick(x, y, dragging)
{
    clickX.push(x);
    clickY.push(y);
    clickColor.push(currentColor);
    clickDrag.push(dragging);
}

function addClick2(x, y, dragging, color)
{
    clickX.push(x);
    clickY.push(y);
    clickColor.push(color);
    clickDrag.push(dragging);
}

function clearCanvas()
{
    context.clearRect(0, 0, canvasWidth, canvasHeight);
}

function redraw()
{
    clearCanvas();
    var radius = 5;
    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = radius;
    for(var i=0; i < clickX.length; i++)
    {
        context.beginPath();
        if(clickDrag[i] && i){
            context.moveTo(clickX[i-1], clickY[i-1]);
        }else{
            context.moveTo(clickX[i]-1, clickY[i]);
        }
        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.strokeStyle = clickColor[i];
        context.stroke();
    }
}


function preparePeerJS(){
    if (peer == null) peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3});
    peer.on('open', function(id){
        document.getElementById('pid').innerHTML= "Your id: "+ id;
    });
    $(document).ready(function() {
        peer.on('connection', function(connection) {
            connection.on('data', function(data) {
                var json = JSON.parse(data);
                if(json.msg == 2){
                    addClick2(json.x, json.y, json.dragging, json.color);
                    redraw();
                }
                else if(json.msg == 0 ){
                    confirmationId(json.id);
                }
                else if(json.msg == 1){
                    addUser(json.id);
                }
                else if(json.msg ==3) {
                    for(var i=0; i<json.x.length; i++){
                        addClick2(json.x[i],json.y[i],json.dragging[i],json.color[i]);
                        redraw();
                    }
                }
                //$('#receive').append(data);
            });
        });
    });
}
function confirmationId(id){
    var conf = confirm("Do you want to add user: " + id + " to the session?");
    if(conf == true){
        addUser(id);
        peerTemp=null;
        sendJson(peerTemp, JSON.stringify( {"msg":1, "id": peer.id}), id);
        for( var i=0; i<listId.length; i++){
            if(id!=listId[i]){
                sendJson(peerTemp,JSON.stringify( {"msg":1, "id": id}), listId[i]);
                sendJson(peerTemp,JSON.stringify( {"msg":1, "id": listId[i]}),id);
            }
        }
        sendAllPoints(id);
    }
    else{
        console.log("Abend");
    }
}
function sendJson(peerCon, json, id){
    if(peerCon != null){
        peerCon.send(json);
    }
    else{
        peerCon = peer.connect(id);
        peerCon.on('open', function () {
            peerCon.send(json);
        });
    }
}
function sendPoint(X,Y,dragging) {
    for (i = 0; i < listId.length; i++) {
        if (peerCon[i] != null) {
            peerCon[i].send(JSON.stringify({"msg": 2, "x": X, "y": Y, "dragging": dragging, "color": currentColor}));
        }
        else {
            peerCon[i] = peer.connect(listId[i]);
            peerCon[i].on('open', function () {
                peerCon[i].send(JSON.stringify({"msg": 2, "x": X, "y": Y, "dragging": dragging, "color": currentColor}));
            });
        }
    }
}
function sendAllPoints(id){
    var points = {"msg": 3, "x": clickX, "y": clickY, "dragging": clickDrag,"color": clickColor };
    peerTemp = null;
    sendJson(peerTemp, JSON.stringify(points),id);
}

function changeColor(){
    currentColor = colors[document.getElementById("selectColor").value];
    document.getElementById("selectColor").setAttribute("style","background:"+currentColor);

}
function addUser(id){
    listId.push(id);
    peerTemp = peer.connect(listId[listId.length-1]);
    peerCon.push(peerTemp);
    var node = document.createElement("li");
    var textnode = document.createTextNode(listId[listId.length-1]);
    node.appendChild(textnode)
    document.getElementById("listId").appendChild(node);
}
function joinToOther(){
    peerTemp = null;
    sendJson( peerTemp, JSON.stringify({"msg" : 0, "id": peer.id}), document.getElementById("otherId").value);
    document.getElementById("otherId").value='';
}

function send(){
    dId=document.getElementById("setId").value;
    c = peer.connect(dId);
    c.on('open', function() {
        c.send(document.getElementById("message").value);
    });
}