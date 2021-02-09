const express = require('express');    // express모듈을 express상수에 할당  express 모듈 : http 모듈보다 기능이 많은 외부모듈
const app = express();     // express()함수로 애플리케이션 객체 생성
const fs = require("fs");
const server = app.listen(3000,function(){       // listen 함수로 웹서버 설정
    console.log('Listening on port *: 3000');
});

const io = require('socket.io')(server);   // socket.io 모듈을 io 상수에 할당
const dialogflow = require("dialogflow");
const keyFile = JSON.parse(fs.readFileSync("key.json"));
const projectId = keyFile["project_id"];
const privateKey = keyFile["private_key"];
const clientEmail = keyFile["client_email"];

// Instantiates a session client
let config = {
  credentials: {
    private_key: privateKey,
    client_email: clientEmail
  }
};
const sessionClient = new dialogflow.SessionsClient(config);

const axios = require('axios');
app.use(express.static('dist'));


var userCount = 0;    // 채팅에 참여중인 회원 수
var userId = 0;
var userInfo = [];   // 유저 정보 저장(socketId, userNick)
var mysql = require('mysql');
var gpsSocket = null;
// Connection 객체 생성 

var connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'apmsetup',
  database: 'test_chat'  
});  
// Connect
connection.connect(function (err) {   
  if (err) {     
    console.error('mysql connection error');     
    console.error(err);     
    throw err;   
  } 
});

io.on('connection', (socket) => {
    console.log(socket.client.id); // Prints client socket id
    socket.on('chat-message', (data) => {         // 브로드캐스트 chat-message
        socket.broadcast.emit('chat-message', (data));
        io.emit('scroll');
    });
    async function tryDF (data) {
        let response = await detectIntent(projectId, socket.client.id, data.message, "ko-KR");
        console.log("response:" + response.queryResult.fulfillmentText);
        
        if(response.queryResult.fulfillmentText == "안녕"){
            var hi = new Date();
            if(hi.getHours() < 12){
                data.message = "좋은 아침!";
            }
            else if(hi.getHours() < 18){
                data.message = "점심은 맛있었나요?";
            }
            else{
                data.message = "잘자요~";
            }
            ToBot(data);
        }
        else if(response.queryResult.fulfillmentText == "목록"){
            io.to(socket.client.id).emit('list');
            io.emit('scroll');
        }
        else if(response.queryResult.fulfillmentText == "일정추가"){
            let payload = response.queryResult.fulfillmentMessages.find(elem=>{return elem.message==='payload'});
            if (payload.payload.fields.year.stringValue ==""){
                payload.payload.fields.year.stringValue = "2019";
            }
            if (payload.payload.fields.month.stringValue.length == "1"){
                payload.payload.fields.month.stringValue = "0" + payload.payload.fields.month.stringValue;
            }
            if (payload.payload.fields.day.stringValue.length == "1"){
                payload.payload.fields.day.stringValue = "0" + payload.payload.fields.day.stringValue;
            }

            var date = payload.payload.fields.year.stringValue + payload.payload.fields.month.stringValue + payload.payload.fields.day.stringValue;

            var query = connection.query('insert into users (uid, cid, date,memo) values(null, '+connection.escape(data.socketId)+ ', '+ 
            connection.escape(date) + ', ' +connection.escape(payload.payload.fields.cal.stringValue) + ')');

            data.year = payload.payload.fields.year.stringValue;
            data.month = payload.payload.fields.month.stringValue;
            data.day = payload.payload.fields.day.stringValue;
            data.memo = payload.payload.fields.cal.stringValue;
            data.message = "일정이 추가 되었습니다."

            io.to(socket.client.id).emit('addcal',(data));
            ToBot(data);
        }
        else if(response.queryResult.fulfillmentText == "일정조회"){
            console.log(data.socketId);
            var query = connection.query('select * from users where cid='+connection.escape(data.socketId) + 'order by date', (err, results, filed)=>{
                console.log(results.length);
                if(results.length != 0){
                    data.message = "일정은\n";
                    for(var k = 0; k < results.length; k++){
                        data.message = data.message + k + ": "+ results[k].date + " "+results[k].memo + "\n";
                    }
                    data.message = data.message + "입니다.";
                }
                else{   // 추가한 일정이 없을 때
                    data.message = "추가하신 일정이 없습니다. ";
                    
                }
                ToBot(data);
            });
        }
        else if(response.queryResult.fulfillmentText == "일정삭제"){
            let payload = response.queryResult.fulfillmentMessages.find(elem=>{return elem.message==='payload'});
            console.log(payload.payload.fields.hint.stringValue);
            var query = connection.query('select * from users where cid='+connection.escape(data.socketId) + 'order by date', (err, results, filed)=>{
                if(results.length!=0){
                    data.delmessage = results[payload.payload.fields.hint.stringValue].memo
                    data.delcal = results[payload.payload.fields.hint.stringValue].date
                    console.log(results[payload.payload.fields.hint.stringValue].memo);
                    console.log(results[payload.payload.fields.hint.stringValue].date);
                    var query1 = connection.query('delete from users where uid='+connection.escape(results[payload.payload.fields.hint.stringValue].uid));
                    data.message = "일정이 삭제되었습니다.";
                    io.to(socket.client.id).emit('delcal',(data));
                    ToBot(data)
                }
                else{
                    data.message = "삭제하실 일정이 없습니다. ";
                    io.to(socket.client.id).emit('delcal',(data));
                    ToBot(data)
                }
            });
        }
        else if(response.queryResult.fulfillmentText == "GPS"){
            let payload = response.queryResult.fulfillmentMessages.find(elem=>{return elem.message==='payload'});
            console.log(payload.payload.fields.hint.stringValue);
            for(var key in userInfo){
                if(payload.payload.fields.hint.stringValue == userInfo[key].userNick){
                    gpsSocket = socket.client.id;
                    io.to(userInfo[key].socketId).emit('gps',(data));
                    io.emit('scroll');
                }
            }
        }
        else if(response.queryResult.fulfillmentText == "날씨"){
            io.to(socket.client.id).emit('weather',(data));
            io.emit('scroll');
        }
        else{
            data.message = response.queryResult.fulfillmentText
            ToBot(data)
        }
        
    };
    function ToBot(data){
        io.to(socket.client.id).emit("bot", {
            message: "금오시바: " + data.message
        });
        io.emit('scroll');
    }
    socket.on('bot', async data => {
        await tryDF(data);
    });
    socket.on('enter', (data) => {
        data.enterNick = data.enterNick + userId;
        data.enterId = userId;
    
        userInfo.push({socketId: socket.client.id, userNick: data.enterNick});
        
        data.enterSocket = userInfo[userCount].socketId;

        socket.broadcast.emit('hi', (data));     // 입장 닉네임을 연결된 소켓에게 전송
  
        io.to(socket.client.id).emit('info', (data));     // 연결된 소켓에게 소켓의 닉네임과 socketId 전송
        userCount++;
        userId++;

        for(var i = 0; i < userCount; i++){
            data.users[i] = userInfo[i].userNick;
        }
        io.emit('users',(data));
        io.emit('scroll');
    });
    socket.on('disconnect',()=>{
        console.log(socket.client.id); // Prints client socket id
        for(var key in userInfo){
            if(userInfo[key].socketId == socket.client.id){        
                socket.broadcast.emit('bye', {byeNick: userInfo[key].userNick});
                userInfo.splice(key,1);
                break;
            }
        }
        userCount--;
        io.emit('dusers',(userInfo));
        io.emit('scroll');
    });
    socket.on('typing', (data) => {
        socket.broadcast.emit('usertyping',(data));
    });
    socket.on('nottyping', (data) => {
        socket.broadcast.emit('usernottyping', (data));
    });
    socket.on('change-nickname', (data) => {
        for(var key in userInfo){
            if(userInfo[key].socketId == socket.client.id){        
                userInfo[key].userNick = data.newNick;
                break;
            }
        }
        for(var i = 0; i < userInfo.length; i++ ){
            console.log(userInfo[i].userNick);
            data.users[i] = userInfo[i].userNick;
        }
        io.emit('users',(data));
        socket.broadcast.emit('nickname',(data));
        io.emit('scroll');
    });
    socket.on('scroll',()=>{
        io.emit('scroll');
    });
    socket.on('sync',(data)=>{
        var query = connection.query('select * from users where cid='+connection.escape(data.socketId) + 'order by date', (err, results, filed)=>{
            for(var i = 0; i < results.length; i++){
                data.attr.push({dot: true, dates:new Date(results[i].date.substr(0,4),results[i].date.substr(4,2)-1,results[i].date.substr(6,2)-(-1)), popover:{label: results[i].memo}})
            }
            io.to(socket.client.id).emit('sync',(data));
            io.to(socket.client.id).emit("scroll");
        });
    });
    socket.on('geo', (data) => {         // 좌표 데이터
        var url1 = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=';
        var url2 = '&key=AIzaSyBT0xauTHcBN0wTB9qXEPDY8OXwobPCsJY&language=ko';
        var baseURL = url1+ data.chatLocation +url2;

        axios.get(baseURL)
        .then((results) => {
            var code = results.data;
            var addressFile = JSON.stringify(code);
            var parsed = JSON.parse(addressFile);
            data.chatLocation = parsed.results[0].formatted_address;
        console.log(parsed.results[0].formatted_address);
        io.to(gpsSocket).emit("location", {chatLocation: "금오시바: " + parsed.results[0].formatted_address});
        io.emit('scroll');
        })
        .finally(function () {
            // always executed
          });
    });
    socket.on('weather', (data) => {        
        var url1 = 'http://api.openweathermap.org/data/2.5/weather?lat=';
        var url2 = '&lon=';
        var apikey = '&appid=c3425641b5498d635e3e24cb876d8c08';
        var baseURL = url1+ data.chatLat+url2+data.chatLon + apikey;

        axios.get(baseURL)
        .then((weather) => {
            var code = weather.data;
            var addressFile = JSON.stringify(code);
            var parsed = JSON.parse(addressFile);
            data.Temp = Math.floor(parsed.main.temp-273);
            data.Temp_min= Math.floor(parsed.main.temp_min-273);
            data.Temp_max=Math.floor(parsed.main.temp_max-273);
            io.to(socket.client.id).emit("forecast", {Temp: data.Temp,MinTemp:data.Temp_min,MaxTemp:data.Temp_max});
            io.emit('scroll');
        })
        .finally(function () {
            // always executed
          });
        });
        io.emit('scroll');
    });
async function detectIntent(projectId, sessionId, query, languageCode) {
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);
  
    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
          languageCode: languageCode
        }
      }
    };
  
    const responses = await sessionClient.detectIntent(request);
    return responses[0];
}