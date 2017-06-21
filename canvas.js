/**
 * Tablica przechowująca podłączonych do sesji użytkowników.
 * @type {Array}
 */
var listId = new Array();
/**
 * Tablica przechowująca połączenia.
 * @type {Array}
 */
var peerCon= new Array();
/**
 * Tablica przechowująca wszystkie ślady rysowania.
 * @type {Array}
 */
var arrayTrace = new Array();
/**
 * Zmienna przechowująca obiekt Peer.
 */
var peer = null;
/**
 * Zmienna przechowująca tymczasowe połączenie.
 * @type {null}
 */
var peerTemp = null;
/**
 * Zmienna informująca czy rysowanie jest aktywne.
 * @type {Boollean}
 */
var paint;
/**
 * Zmienna przechowująca context, umożliwia rysowanie.
 */
var context;
/**
 * Zmienna przechowująca szerokość obszaru rysowania.
 * @type {Number}
 */
var canvasWidth = 500;
/**
 * Zmienna przechowująca wysokość obszaru rysowania.
 * @type {Number}
 */
var canvasHeight = 200;
/**
 * Tablica przechowująca dostępne kolory.
 * @type {Array}
 */
var colors = ["#000000", "#ff0000", "#009933", "#0099ff", "#fffe11"];
/**
 * Zmienna przechowująca aktualnie wybrany kolor.
 * @type {string}
 */
var currentColor = "#000000";
/**
 * Konstruktor klasy Trace, której obiekt przechowuje informacje o śladzie rysowania jednego użytkownika.
 * @param {Number} id Identyfikator użytkownika
 * @constructor
 */
function Trace(id){
    this.id=id;
    this.clickX = new Array();
    this.clickY = new Array();
    this.clickDrag = new Array();
    this.clickColor = new Array();
    this.nr = new Array();
    this.msg = new Array();
    this.time = new Array();
    this.repeatMsg=new Array();
}
/**
 * Przygotowuje canvas oraz obsługuje zdarzenia.
 */
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
/**
 * Dodaje punkt do śladu gospodarza.
 *@param {Number} x Współrzędna x.
 *@param {Number} y Współrzędna y.
 *@param {Boolean} dragging False oznacza początek nowej linii, true, że jest to kontynuacja.
 */
function addClick(x, y, dragging)
{
    arrayTrace[0].clickX.push(x);
    arrayTrace[0].clickY.push(y);
    arrayTrace[0].clickColor.push(currentColor);
    arrayTrace[0].clickDrag.push(dragging);
}
/**
 * Dodaje punkt do śladu gościa.
 *@param {Number} x Współrzędna x.
 *@param {Number} y Współrzędna y.
 *@param {Boolean} dragging False oznacza początek nowej linii, true kontynuację.
 *@param {String} color Kolor linii, przychodzący z zewnątrz.
 *@param {Number} id Identyfikator użytkownika, od którego pochodzą te dane.
 */
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
/**
 * Czyści context.
 */
function clearCanvas()
{
    context.clearRect(0, 0, canvasWidth, canvasHeight);
}
/**
 * Czyści zapisane ślady rysowania.
 */
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
/**
 * Czyści sesję.
 */
function clearSession(){
    for(var i=1; i<arrayTrace.length;i++){
        peerTemp=null;
        sendJson(peerTemp,JSON.stringify( {"msg":9, "id": peer.id}),arrayTrace[i].id);
    }
    var tmp=arrayTrace.length;
    for(var i=1; i<tmp;i++){
        arrayTrace.pop();
    }
    arrayTrace[0].clickX=new Array();
    arrayTrace[0].clickY=new Array();
    arrayTrace[0].clickColor=new Array();
    arrayTrace[0].clickDrag=new Array();
    clearCanvas();
    listId = new Array();
    peerCon = new Array();
    document.getElementById("listId").innerHTML="";
    document.getElementById("listNr").innerHTML="";
}
/**
 * Rysuje wszystkie ślady.
 */
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
/**
 * Inicjalizuje Peer i obsługuje przychodzące komunikaty.
 * 0 - Prośba o dołączenie do sesji.
 * 1 - Komunikat z identyfikatorem użytkownika do dodania.
 * 2 - Przychodzący punkt do narysowania.
 * 3 - Przychodzący cały ślad.
 * 4 - Komunikat z pytaniem czy użytkownik chce dołączyć do sesji.
 * 5 - Użytkownik zaakceptował zaproszenie do sesji, należy mu wysłać stan sesji.
 * 6 - Komunikat informujący o czyszczeniu pola rysowania.
 * 7 - Odrzucono prośbę o dołączenie do sesji.
 * 8 - Zaakceptowano prośbę o dołączenie do sesji.
 * 9 - Informacja o tym, że należy usunąć użytkownika z sesji.
 * 10 - Użytkownik odrzucił zaproszenie do sesji.
 * 11 - Nadejście potwierdzenia otrzymania wiadomości.
 */
function preparePeerJS(){
    setInterval(retryMessage,1000);
    if (peer == null) peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3});
    peer.on('open', function(id){
        document.getElementById('pid').innerHTML= "Your id: "+ id;
        arrayTrace[0].id=peer.id;
    });
    $(document).ready(function() {
        peer.on('connection', function(connection) {
            connection.on('data', function(data) {
                var json = JSON.parse(data);
                switch (json.msg){
                    case 2: addClick2(json.x, json.y, json.dragging, json.color,connection.peer);
                        sendConfirmationNr(connection.peer, json.nr);
                        redraw();
                        break;
                    case 0: confirmationId(json.id);
                        break;
                    case 1: addUser(json.id);
                        break;
                    case 3: addTrace(json.trace);
                        redraw();
                        break;
                    case 4: confirmationSession(json.id);
                        break;
                    case 5: sendSessionInfo(json.id);
                        break;
                    case 6: resetCanvas();
                        break;
                    case 7: window.alert("The user "+json.id+" has rejected your request.");
                        break;
                    case 8: window.alert("The user "+json.id+" has accepted your request.");
                        clearSession();
                        break;
                    case 9: deleteUser(json.id);
                        break;
                    case 10: window.alert("The user "+json.id+" has rejected your invitation.");
                        break;
                    case 11: receiveNr(json.id, json.nr, json.msg);
                        break;
                }
                updateNrList();
            });
        });
    });
}
/**
 * Dołączenie lub odrzucenie prośby innego użytkownika o dołączenie do sesji.
 * @param {Number} id Identyfikator użytkownika
 */
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
/**
 * Dołączenie lub odrzucenie zaproszenia do sesji.
 * @param {Number} id Identyfikator użytkownika.
 */
function confirmationSession(id){
    var conf = confirm("Do you want to join to session of user: " + id + " ?");
    if(conf==true){
        clearSession();
        addUser(id);
        peerTemp=null;
        sendJson(peerTemp,  JSON.stringify( {"msg":5, "id": peer.id}), id);
    }
    else sendJson(peerTemp,  JSON.stringify( {"msg":10, "id": peer.id}), id);
    peerTemp.on('close');
}
/**
 * Wysłanie potwierdzenia otrzymania komunikatu.
 * @param {String} id Identyfikator użytkownika.
 * @param {Number} nr Numer wiadomości do potwierdzenia.
 */
function sendConfirmationNr(id,nr){
    var i = listId.indexOf(id);
    sendJson(peerCon[i],  JSON.stringify( {"msg":11, "id": peer.id, "nr":nr}), id);
}
/**
 * Metoda wywoływana gdy przychodzi potwierdzenie dostarczenia, zdejmuje z tablicy numer wiadomości.
 * @param {String}id Identyfikator użytkownika, od którego pochodzi wiadomość.
 * @param {Number}nr Numer wiadomości.
 */
function receiveNr(id,nr,msg){
    var i=0,j=-1;
    do{i++;}
    while(id!= arrayTrace[i].id);
    do{j++;}
    while(nr!= arrayTrace[i].nr[j]);
    if(j> -1){
        arrayTrace[i].time.splice(j,1);
        arrayTrace[i].nr.splice(j,1);
        arrayTrace[i].msg.splice(j,1);
        arrayTrace[i].repeatMsg.splice(j,1);
    }
}
/**
 * Funkcja wywoływana co 1s w celu sprawdzenia czy są komunikaty bez potwierdzenia.
 */
function retryMessage(){

    for(var i=1;i<arrayTrace.length;i++){
        for(var j=0;j<arrayTrace[i].nr.length;j++){
            if(arrayTrace[i].time[j] < new Date().getTime() && arrayTrace[i].repeatMsg[j] <3){
                arrayTrace[i].repeatMsg[j]++;
                arrayTrace[i].time[j]+=5000;
                sendJson(peerCon[i-1],arrayTrace[i].msg,arrayTrace[i].id)
                console.log("Repeat number " + arrayTrace[i].repeatMsg[j] + ". ConfNumber = " + arrayTrace[i].nr[j]);
            }
            else {
                if (arrayTrace[i].repeatMsg[j] == 3) {
                    for (var k = 1; k < arrayTrace.length; k++) {
                        peerTemp = null;
                        sendJson(peerTemp, JSON.stringify({"msg": 9, "id": peer.id}), arrayTrace[k].id);
                        window.alert("The user " + arrayTrace[i].id + " has been disconnected.");
                        deleteUser(arrayTrace[i].id);
                    }
                }
            }

        }
    }
}
/**
 * Aktualizacja listy niepotwierdzonych wiadomości.
 */
function updateNrList(){
    document.getElementById("listNr").innerHTML="";
    for(var i=1; i<arrayTrace.length;i++){
        var node = document.createElement("li");
        var textnode = document.createTextNode(arrayTrace[i].id + "-" + arrayTrace[i].nr.length);
        node.appendChild(textnode);
        document.getElementById("listNr").appendChild(node);
    }
}
/**
 * Aktualizacja listy id.
 */
function updateIdList(){
    document.getElementById("listId").innerHTML="";
    for(var i=0; i<listId.length;i++){
        var node = document.createElement("li");
        var textnode = document.createTextNode(listId[i]);
        node.appendChild(textnode);
        document.getElementById("listId").appendChild(node);
    }
}
/**
 * Usunięcie użytkownika i jego ślady z sesji.
 * @param {Number} id Identyfikator użytkownika.
 */
function deleteUser(id){
    var i = listId.indexOf(id);
    if (i > -1) {
        listId.splice(i, 1);
        peerCon.splice(i, 1);
    }
    i=0;
    do{i++;}
    while(id!= arrayTrace[i].id);
    if (i > -1) {
        arrayTrace.splice(i, 1);
    }
    updateNrList();
    updateIdList();
    redraw();
}
/**
 * Dodanie całego śladu użytkownika do tablicy.
 * @param {Object} trace Ślad użytkownika.
 */
function addTrace(trace){
    var i=0;
    do{i++;}
    while(trace.id!= arrayTrace[i].id)
    arrayTrace[i]=trace;
}
/**
 * Uniwersalna funkcja do wysyłania komunikatów.
 * @param {Object} peerCon Połączenie.
 * @param {String} json Treść komunikatu w formacie JSON.
 * @param {Number} id Identyfikator odbiorcy.
 */
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
/**
 * Wysłanie informacji o sesji do nowego użytkownika, identyfikatorów podłączonych i śladów.
 * @param {Number} id Identyfikator użytkownika.
 */
function sendSessionInfo(id){
    addUser(id);
    peerTemp=null;
    for( var i=0; i<listId.length; i++){
        if(id!=listId[i]){
            sendJson(peerTemp,JSON.stringify( {"msg":1, "id": id}), listId[i]);
            peerTemp.on('close');
            sendJson(peerTemp,JSON.stringify( {"msg":1, "id": listId[i]}),id);
            peerTemp.on('close');
        }
    }
    sendAllPoints(id);
    window.alert("The user "+id+" joined to the session.");
}
/**
 * Wysłanie punktu do wszystkich użytkowników sesji.
 * @param {Number} X Współrzędna x.
 * @param {Number} Y Współrzędna y.
 * @param {Boolean} dragging false oznacza początek nowej linii, true kontynuację.
 */
function sendPoint(X,Y,dragging) {
    for (i = 0; i < listId.length; i++) {
        var nr = Math.floor((Math.random() * 10000) + 1);
        var msg = JSON.stringify({"msg": 2, "x": X, "y": Y, "dragging": dragging, "color": currentColor, "nr": nr });
        arrayTrace[i+1].time.push(new Date().getTime()+5000);
        arrayTrace[i+1].msg.push(msg);
        arrayTrace[i+1].nr.push(nr);
        arrayTrace[i+1].repeatMsg.push(0);
        if (peerCon[i] != null) {
            peerCon[i].send(msg);
        }
        else {
            peerCon[i] = peer.connect(listId[i]);
            peerCon[i].on('open', function () {
                peerCon[i].send(msg);
            });
        }
    }
}
/**
 * Wysłanie wszystkich śladów sesji do danego użytkownika.
 * @param {Number} id Identyfikator użytkownika.
 */
function sendAllPoints(id){
    peerTemp = null;
    for(var i=0;i<arrayTrace.length;i++){
        if(id!=arrayTrace[i].id){
            arrayTrace[i].nr=new Array();
            var points = {"msg": 3, "trace": arrayTrace[i]};
            sendJson(peerTemp, JSON.stringify(points),id);
        }
    }
}
/**
 * Zmiana koloru rysowania.
 */
function changeColor(){
    currentColor = colors[document.getElementById("selectColor").value];
    document.getElementById("selectColor").setAttribute("style","background:"+currentColor);

}
/**
 * Dodanie użytkownika do listy odbiorców.
 * @param {Number} id Identyfikator użytkownika.
 */
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
/**
 * Funkcja wywoływana po naciśnięciu "End and Join", służy do wysłania prośby o dołączenie do sesji.
 */
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
/**
 * Sprawdzenie czy użytkownik o danym id jest już na liście odbiorców.
 * @param {Number} id Identyfikator użytkownika.
 * @returns {boolean} True - jest na liście, False - nie ma na liście.
 */
function idIsOnList(id){
    if(id==peer.id) return true;
    for(var i=0; i<listId.length;i++){
        if (id == listId[i]) return true;
    }
    return false;
}
/**
 * Funkcja wywoływana po naciśnięciu "Add", służy do wysłania zaproszenie do użytkownika.
 */
function addOtherUser(){
    var userId = document.getElementById("userId").value;
    if(userId!=''){
        if(idIsOnList(userId)==false){
            peerTemp=null;
            sendJson(peerTemp, JSON.stringify({"msg" : 4, "id": peer.id}), userId);
            peerTemp.on('close');
        }
        else window.alert("This ID is already on the list.");
    }
    else window.alert("The ID field cannot be empty.");
    document.getElementById("userId").value='';
}
