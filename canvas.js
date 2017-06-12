var listId = new Array();
var peerCon= new Array();
var arrayTrace = new Array();
var peer = null;
var peerTemp = null;
var paint;
var context;
var canvasWidth = 490;
var canvasHeight = 220;
var colors = ["#000000", "#ff0000", "#009933", "#0099ff", "#fffe11"];
var currentColor = "#000000";

function Trace(id){
    this.id=id;
    this.clickX = new Array();
    this.clickY = new Array();
    this.clickDrag = new Array();
    this.clickColor = new Array();
}

function prepareSimpleCanvas()
{
    var trace = new Trace(0);
    arrayTrace.push(trace);
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
        resetCanvas();
        for(var i=0; i<listId.length;i++){
            sendJson(peerCon[i],JSON.stringify({"msg":6}),listId[i]);
        }
    });
}

function addClick(x, y, dragging)
{
    arrayTrace[0].clickX.push(x);
    arrayTrace[0].clickY.push(y);
    arrayTrace[0].clickColor.push(currentColor);
    arrayTrace[0].clickDrag.push(dragging);
}

function addClick2(x, y, dragging, color,id)
{
    var i=0;
    do{i++;}
    while(id!= arrayTrace[i].id)
    arrayTrace[i].clickX.push(x);
    arrayTrace[i].clickY.push(y);
    arrayTrace[i].clickColor.push(color);
    arrayTrace[i].clickDrag.push(dragging);
}

function clearCanvas()
{
    context.clearRect(0, 0, canvasWidth, canvasHeight);
}

function resetCanvas()
{
    for(var i=0; i<arrayTrace.length;i++){
        arrayTrace[i].clickX=new Array();
        arrayTrace[i].clickY=new Array();
        arrayTrace[i].clickColor=new Array();
        arrayTrace[i].clickDrag=new Array();
    }
    clearCanvas();
}
function clearSession(){
    for(var i=1; i<arrayTrace.length;i++){
        arrayTrace.pop();
    }
    arrayTrace[0].clickX=new Array();
    arrayTrace[0].clickY=new Array();
    arrayTrace[0].clickColor=new Array();
    arrayTrace[0].clickDrag=new Array();
    clearCanvas();
}

function redraw()
{
    clearCanvas();
    var radius = 5;
    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = radius;
    for(var j=0; j < arrayTrace.length; j++){
        for(var i=0; i <  arrayTrace[j].clickX.length; i++)
        {
            context.beginPath();
            if( arrayTrace[j].clickDrag[i] && i){
                context.moveTo( arrayTrace[j].clickX[i-1],  arrayTrace[j].clickY[i-1]);
            }else{
                context.moveTo( arrayTrace[j].clickX[i]-1,  arrayTrace[j].clickY[i]);
            }
            context.lineTo( arrayTrace[j].clickX[i],  arrayTrace[j].clickY[i]);
            context.closePath();
            context.strokeStyle =  arrayTrace[j].clickColor[i];
            context.stroke();
        }
    }
}

function preparePeerJS(){
    if (peer == null) peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3});
    peer.on('open', function(id){
        document.getElementById('pid').innerHTML= "Your id: "+ id;
        arrayTrace[0].id=peer.id;
    });
    $(document).ready(function() {
        peer.on('connection', function(connection) {
            connection.on('data', function(data) {
                var json = JSON.parse(data);
                if(json.msg == 2){
                    addClick2(json.x, json.y, json.dragging, json.color,connection.peer);
                    redraw();
                }
                else if(json.msg == 0 ){
                    confirmationId(json.id);
                }
                else if(json.msg == 1){
                    addUser(json.id);
                }
                else if(json.msg ==3) {
                    addTrace(json.trace, connection.peer);
                    redraw();
                }
                else if(json.msg==4){
                    confirmationSession(json.id);
                }
                else if(json.msg==5){
                    sendSessionInfo(json.id);
                }
                else if(json.msg==6) resetCanvas();
                else if(json.msg==7) window.alert("The user "+json.id+" has rejected your request.");
                else if(json.msg==8){
                    window.alert("The user "+json.id+" has accepted your request.");
                    clearSession();
                }
            });
        });
    });
}

function confirmationId(id){
    var conf = confirm("Do you want to add user: " + id + " to the session?");
    if(conf == true){
        addUser(id);
        peerTemp=null;
        sendJson(peerTemp, JSON.stringify( {"msg":8, "id": peer.id}), id);
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
        sendJson(peerTemp, JSON.stringify( {"msg":7, "id": peer.id}), id);
    }
}

function confirmationSession(id){
    var conf = confirm("Do you want to join to session of user: " + id + " ?");
    if(conf==true){
        clearSession();
        addUser(id);
        peerTemp=null;
        sendJson(peerTemp,  JSON.stringify( {"msg":5, "id": peer.id}), id);
    }
}
function addTrace(trace,id){
    var i=0;
    do{i++;}
    while(id!= arrayTrace[i].id)
    arrayTrace[i]=trace;
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
function sendSessionInfo(id){
    addUser(id);
    for( var i=0; i<listId.length; i++){
        if(id!=listId[i]){
            sendJson(peerTemp,JSON.stringify( {"msg":1, "id": id}), listId[i]);
            sendJson(peerTemp,JSON.stringify( {"msg":1, "id": listId[i]}),id);
        }
    }
    sendAllPoints(id);
    window.alert("The user "+id+" joined to the session.");
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
    peerTemp = null;
    for(var i=0;i<arrayTrace.length;i++){
        if(id!=arrayTrace[i].id){
            var points = {"msg": 3, "trace": arrayTrace[i]};
            sendJson(peerTemp, JSON.stringify(points),id);
        }
    }
}

function changeColor(){
    currentColor = colors[document.getElementById("selectColor").value];
    document.getElementById("selectColor").setAttribute("style","background:"+currentColor);

}

function addUser(id){
    listId.push(id);
    var trace = new Trace(id);
    arrayTrace.push(trace);
    peerTemp = peer.connect(listId[listId.length-1]);
    peerCon.push(peerTemp);
    var node = document.createElement("li");
    var textnode = document.createTextNode(listId[listId.length-1]);
    node.appendChild(textnode)
    document.getElementById("listId").appendChild(node);
}

function joinToOther(){
    var joinId = document.getElementById("otherId").value
    if(joinId!=''){
        if(idIsOnList(joinId)==false){
            peerTemp = null;
            sendJson( peerTemp, JSON.stringify({"msg" : 0, "id": peer.id}), document.getElementById("otherId").value);
        }
        else window.alert("You have already joined this session");
    }
    else window.alert("The ID field cannot be empty.");
    document.getElementById("otherId").value='';

}
function idIsOnList(id){
    for(var i=0; i<listId.length;i++){
        if (id == listId[i]) return true;
    }
    return false;
}
function addOtherUser(){
    var userId = document.getElementById("userId").value;
    if(userId!=''){
        if(idIsOnList(userId)==false){
            peerTemp=null;
            sendJson(peerTemp, JSON.stringify({"msg" : 4, "id": peer.id}), userId);
        }
        else window.alert("This ID is already on the list.");
    }
    else window.alert("The ID field cannot be empty.");
    document.getElementById("userId").value='';
}
