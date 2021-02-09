<template>  
  <div class="container-fluid">
    <div class="row">
      <button class="col-3 toggle" @click="toggle"></button>
        <Drawer @close="toggle" align="left" :closeable="true">
          <div v-if="open" >
            대화 참여자 목록
            <li class="users" v-for="user in users" :key="user.id">
              <span>
                {{user}}
              </span>
            </li>
          </div>
        </Drawer>
      <div class="btn-group" role="group" aria-label="...">
        <button type="button" v-on:click="fontSize=15" class="btn btn-default" id="font">Left</button>
        <button type="button" v-on:click="fontSize=20" class="btn btn-default" id="font">Middle</button>
        <button type="button" v-on:click="fontSize=25" class="btn btn-default" id="font">Right</button>
        <button v-b-modal.modal-1 class="sync" @click="mybtn1">Sync</button>
        <div id="myModal1" class="modal" >
          <div class="modal-content" v-if="modalView1">
            <div class="modal-header">
              <h3>고유키 입력</h3>
              <span class="close" @click="span1">&times;</span>
            </div>
            <div class="modal-body">
              <div class="ukey">
                <input type="id" class="form-control" v-model.lazy="socketSpace" id="socketKey" placeholder="고유키 입력">
              </div>
              <div class="ok">
                <button class="okbtn" @click="handleSubmit">확인</button>
              </div>
            </div>
          </div>
        </div>
        <button @click="mybtn2" class="cal">달력</button>
        <div id="myModal2" class="modal" >
          <div class="modal-content" v-if="modalView2">
            <div class="modal-header">
              <h2>일정</h2>
              <span class="close" @click="span2">&times;</span>
            </div>
            <div class="modal-body">
              <v-calendar :attributes='attributes'
                is-dark
                is-expanded
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-6 offset-lg-3">   
      <div class="card bg-info box">
        <div class="card-header text-white header">
          <h4 class="logo">               
          </h4>
        </div>
        <div class="header2">
          <b-input-group>
            <b-input-group-prepend class="mt-2 nick">
              NickName
            </b-input-group-prepend>
            <b-form-input
              autocomplete="off"
              placeholder="nickname to change"
              v-bind:style="{fontSize: fontSize-5 + 'px' }"
              v-model.lazy="newNickname">
            </b-form-input>
            <b-input-group-append>
              <button class="change" v-on:click="change" variant="btn btn-warning">Change</button>
            </b-input-group-append>
          </b-input-group>
        </div> 
        <div class="chatList">
          <ul class="list-group list-group-flush" id="contain" v-bind:style="{fontSize: fontSize + 'px' }" style="max-height:100%; overflow-y: auto;"> <!-- Message loop,자동 스크롤 -->     
          <li class="list-group-item chat" v-for="message in messages" :key="message.id">
            <span class="float-left a" v-html="message.msg" v-if="message.check==1">
              {{message.msg}}
            </span>
            <span class="float-right b" v-html="message.msg" v-else-if="message.check==0">
              {{message.msg}}
            </span>
            <span class="float-center c" v-html="message.msg" v-else>
              {{message.msg}}
            </span>
            <span class="float-left" v-html="message.time" v-if="message.check==1" v-bind:style="{fontSize: fontSize-7 + 'px' }">
              {{message.time}}
            </span>
            <span class="float-right" v-html="message.time" v-else-if="message.check==0" v-bind:style="{fontSize: fontSize-7 + 'px'}" >
              {{message.time}}
            </span>
            <span class="float-center" v-html="message.time" v-else v-bind:style="{fontSize: fontSize-7 + 'px' }">
              {{message.time}}
            </span>
          </li>
        </ul>
        </div>
        <div class="card-body body"> 
          <div class="mic-group">
              <button id="btn-mic1" class="off" @click="Mic1">시바MIC <span></span></button>
              <button id="btn-mic2" class="off" @click="Mic2">일반MIC <span></span></button>
            </div>
          <form @submit.prevent="send" @input="checkinput"> <!-- Prevent default event for submit, execute send method instead-->
            <div class="form-group">
              <div class="upload" >
                <input
                  class="care"
                  type="hidden"
                  role="uploadcare-uploader"
                  >
              </div>
              <div class="in">
                <input
                  type="text"
                  id="inputtext"
                  autocomplete="off"
                  class="form-control"                
                  placeholder="Enter message here"
                  v-bind:style="{fontSize: fontSize + 'px' }"
                  v-model= newMessage
                /> <!-- binding with newMessage variable -->
              </div>
            </div>
          </form>            
        </div>
        <div>
        <ul class="list-group list-group-typing "> <!-- 타이핑여부 나타내는 부분 -->   
          <li class="list-group-typing" v-for="typing in typingMessage" :key="typing.id">
            <span class="float-bottom" v-bind:style="{fontSize: fontSize + 'px' }">
              {{typing}}
            </span>
          </li>
        </ul>
        </div> 
      </div>
    </div>
  </div>
  
</template>



<script>
import io from 'socket.io-client';
import Vue from 'vue';
import VCalendar from 'v-calendar';
import Uploadcare from 'uploadcare-widget'
import Drawer from "vue-simple-drawer"
Vue.use(VCalendar);

export default {
  name: "HelloWorld",
  el: '#app',
  components: {
    Drawer
  },
  data: function() {  // data
    return {      
      messages: [],
      newMessage: null,
      typingMessage: [],
      userId: null,
      userSocket: null,
      userNick: null,  
      newNickname: null, 
      oldNick:null,
      fontSize: 15,
      socketSpace: null,
      currentLocation : null,
      currentX : null,
      currentY : null,
      socket: io("https://fe025ca2.ngrok.io"), // socket connection to server
      d: null,
      cal: new Date(2019,9,31),
      mIndex: 0,
      dimage: 0,
      modalView1: false,
      modalView2: false,
      attributes:[{
        // highlight: true,  // Boolean, String, Object
        dot: true,        // Boolean, String, Object
        // bar: true,        // Boolean, String, Object
        // content: 'red',   // Boolean, String, Object // Only objects allowed
        // Your custom data object for later access, if needed
        // We also need some dates to know where to display the attribute
        // We use a single date here, but it could also be an array of dates,
        //  a date range or a complex date pattern.
        dates: null, // Jan 1st
        popover: {label: null},
        // You can optionally provide dates to exclude
        //excludeDates: null,
        // Think of `order` like `z-index`
      }],
      addcaldate: null,
      open: false,
      users: []
    };
  },
  updated(){
    this.$nextTick(function () {
      // 모든 화면이 렌더링된 후 실행합니다.
      this.image();
    });
      
  },
  created() {  // created callback of vue instance
    this.socket.emit("enter",{
      enterNick: "stranger",
      enterSocket: null,
      enterID: null,
      message: null,
      users:[],
    });
    this.socket.on("users", data=>{
      for(var i = 0; i < data.users.length; i++){
        this.users[i] = data.users[i];
      }
    });
    this.socket.on("dusers", userInfo=>{
      this.users.splice(0);
      for(var i = 0; i < userInfo.length; i++){
        console.log("1 " + userInfo[i].userNick);
        this.users.push(userInfo[i].userNick);
      }
    });
    this.socket.on("bot", data=>{
      data.message = data.message.replace(/(?:\r\n|\r|\n)/g, '<br/>');
      this.messages.push({check:1, msg:data.message, time: "ㅤ"+this.date().message});
    });
    this.socket.on("chat-message", data => { // when "chat-message" codfmes from the server 
      this.messages.push({check:1, msg: data.chatNick+": "+ data.message, time: "ㅤ"+this.date().message});
      navigator.vibrate(200);
    });          
    this.socket.on("hi", data => {     // 입장한 userNick 채팅창에 표시
      this.messages.push({check:2,msg:"☆☆☆ "+data.enterNick + " 님이 입장! ☆☆☆"});  
    });
    this.socket.on("info", data => {   // 자신의 소켓ID와 닉네임 받아와서 출력
      this.userId = data.enterId;
      this.userSocket = data.enterSocket;
      this.userNick = data.enterNick;
      this.messages.push({check:2,msg:"☆☆☆ "+this.userNick +" 님이 입장! ☆☆☆"});
      this.messages.push({check:2,msg:"☆ 고유키: "+this.userSocket+" ☆"}); 
    });
    this.socket.on("list",()=>{
      this.open = !this.open;
    });
    this.socket.on("bye", data =>{    // 퇴장한 userNick 채팅창에 표시
      this.messages.push({check:2,msg:"★★★ "+ data.byeNick + " 님이 퇴장! ★★★"});      
    });
    this.socket.on("usertyping", data => {    // user is tpying
      var typingMessage = data.chatNick + " 님이 입력중입니다.";
      var check = true;
      for (var i=0; i<this.typingMessage.length; i++) {
        if (this.typingMessage[i] == typingMessage) {
          check = false;
        }
      }
      if (check == true) {
        this.typingMessage.push(typingMessage);
      }
    });
    this.socket.on("addcal",(data) =>{    // add calendars
      this.attributes.push({dot: true, dates:new Date(data.year,data.month-1, data.day), popover:{label: data.memo}});
      this.mIndex++;
    });
    this.socket.on("delcal", (data)=>{   // delete calendars
      var year = data.delcal.substr(0,4);
      var month = data.delcal.substr(4,2) - 1;
      var day = data.delcal.substr(6,2);
      for(var i=0; i<=this.mIndex; i++){
        if(this.attributes[i].dates == new Date(year, month, day).toString() && this.attributes[i].popover.label == data.delmessage){
          this.attributes.splice(i, 1);
        }
      }
      this.mIndex--;
    });
    this.socket.on("usernottyping", data => {   // user is not typing
      var typingMessage = data.chatNick + " 님이 입력중입니다.";
      for(var i=0; i<this.typingMessage.length; i++)
      {
        if(this.typingMessage[i] == typingMessage)
        {
          this.typingMessage.splice(i,1);
        }
      }
    });
    this.socket.on("nickname", data =>{    // change nickname
      this.messages.push({check:2,
       msg: data.oldNick + " -> " +data.newNick + " 으로 변경!"});      
    });
    this.socket.on("scroll",()=>{     // auto scroll
      this.scroll();
    });
    this.socket.on("sync",(data)=>{
      for(var i = 0; i<=data.attr.length; i++){
        this.attributes.push({dot: data.attr[i].dot, dates: data.attr[i].dates, popover: data.attr[i].popover});
        this.mIndex++;
      }
    });
    this.socket.on("gps", ()=>{
      this.getGeo();
    });
    this.socket.on("weather", ()=>{
      this.getWeather();
    });
    this.socket.on("location", (data) => {   // show location
      this.messages.push({check:1,msg: data.chatLocation, time: "ㅤ"+this.date().message});
    });
    this.socket.on("forecast", (data) => {   // show location
      this.messages.push({check:1,msg:"금오시바: <br> ", time: "ㅤ"});
        this.messages.push({check:1,msg:"현재 온도 " +data.Temp+"도", time: "ㅤ"});
        this.messages.push({check:1,msg:"금일 최고 기온 " +data.MaxTemp+"도", time: "ㅤ"});
        this.messages.push({check:1,msg:"금일 최저 기온 " +data.MinTemp+"도 입니다.", time: "ㅤ"+this.date().message});            
    });    
  },  
  methods: {
    send() {      // implementation of send method for vue instance
      if(this.newMessage.indexOf("금오시바") !== -1){
        this.messages.push({check:0, msg:this.userNick+": " +this.newMessage, time: this.date().message + "ㅤ"});
        
        if(this.newMessage == "금오시바야"){
          this.messages.push({check:1, msg:"금오시바: 월!", time: "ㅤ"+ this.date().message});
        }
        else{
          var subMessage = this.newMessage.substr(this.newMessage.indexOf(" "));
          this.socket.emit("bot", {
            socketId: this.userSocket,
            message: subMessage
        });
        }
        
        //this.messages.push({check:1, msg:"금오시바: 금오시바입니다.", time: "ㅤ"+this.date().message});
      }
      else if(this.newMessage == "!help")
      {
          this.messages.push({check:1, msg:" <명령어 목록><br/>!이름 => 챗봇 이름 알림<br/>!목록 => 현재 접속중인 사용자 알림<br/>!안녕 => 챗봇에게 인사<br/>!일정추가 [내용] => [내용]이 일정에 추가<br/>!일정보기 => [숫자]: [내용] 형태로 추가된 일정 표시<br/>!일정삭제 [숫자] => [숫자] 에 맞는 일정 삭제"});
      }
      
      else if(this.newMessage == null || this.newMessage == ""){  // 공백 입력 방지
      }
      else{
        this.socket.emit("chat-message", {
          message: this.newMessage,        // emitting "chat-message" to the server
          chatNick: this.userNick,
          chatId: this.userId
        });     
      
        this.messages.push({check:0, msg:this.userNick+": "+ this.newMessage, time: this.date().message + "ㅤ"});
      }
      this.newMessage = null;  
      this.socket.emit("nottyping", {
          chatNick: this.userNick,
          chatId: this.userId
        });
      this.socket.emit("scroll");  // auto scroll
    },    
    Mic1(){
      document.getElementById("btn-mic1").setAttribute('class', 'on');
      var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;
      recognition.start();

      var m = (temp) => {
        this.messages.push({check:0, msg:this.userNick+": 금오시바야 "+ temp, time: this.date().message + "ㅤ"});
        console.log(this.userSocket);
        this.socket.emit("bot", {
          message: temp,        // emitting "bot" to the server
          socketId: this.userSocket
        });
      }

      recognition.onresult = function(event) {
          console.log('You said: ', "금오시바야 " + event.results[0][0].transcript);
          m(event.results[0][0].transcript);
          document.getElementById("btn-mic1").setAttribute('class', 'off');
      }; 
    },
    Mic2(){
      document.getElementById("btn-mic2").setAttribute('class', 'on');
      var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;
      recognition.start();
      
      var m = (data) => {
        this.messages.push({check:0, msg:this.userNick+": "+ data, time: this.date().message + "ㅤ"});
        this.socket.emit("chat-message", {
          message: data,        // emitting "bot" to the server
          chatNick: this.userNick,
          chatId: this.userId
        }); 
      }
      recognition.onresult = function(event) {
          console.log('You said: ', event.results[0][0].transcript);
          m(event.results[0][0].transcript);
          document.getElementById("btn-mic2").setAttribute('class', 'off');
      }; 
    },
    mybtn1() {
      var modal = document.getElementById("myModal1");
      if (this.modalView1) {
        this.modalView1 = false;
      } else {
        modal.style.display = "block";
        this.modalView1 = true;
      }
    },  
    mybtn2() {
      var modal = document.getElementById("myModal2");
      if (this.modalView2) {
        this.modalView2 = false;
      } else {
        modal.style.display = "block";
        this.modalView2 = true;
      }
    },
    span1(){
      var modal = document.getElementById("myModal1");
      modal.style.display = "none";
      this.modalView1 = false;
    },
    span2(){
      var modal = document.getElementById("myModal2");
      modal.style.display = "none";
      this.modalView2 = false;
    },
    image(){
      var singleWidget = Uploadcare.SingleWidget('[role=uploadcare-uploader]');
      var temp = null;
      this.dimage = 0;
      var t = (data) => {
        if(this.dimage == 0){
          this.messages.push({check:0, msg:this.userNick+": "+ data, time: this.date().message + "ㅤ"});
          this.socket.emit("chat-message", {
            message: data,        // emitting "chat-message" to the server
            chatNick: this.userNick,
            chatId: this.userId
          }); 
        }
        this.dimage = 1;
      }
      singleWidget.onUploadComplete(function(info){
        temp = '<br/><img width="200" height"280" src="' + info.cdnUrl+'"><br/>';
        t(temp);
      })
    },
    change() {   
      if(this.newNickname==null){
        //null 입력 방지
      }   
      else if(this.newNickname == this.userNick){
        // 중복 입력 방지
      }
      else{
      this.oldNick = this.userNick;   // 변경전 닉네임을 저장하는 변수
      this.socket.emit("change-nickname", {
        oldNick : this.oldNick,
        newNick: this.newNickname,
        chatId: this.userId,
        users:[]
      });     
      this.userId="";
      this.userNick = this.newNickname;
      this.messages.push({check:2,msg:this.oldNick + " -> " +this.userNick + " 으로 변경!"});  
      } 
    },
    scroll() {    	
      var container = this.$el.querySelector("#contain");
      container.scrollTop = container.scrollHeight;
    },
    checkinput() {
      if(this.newMessage == null || this.newMessage == "")
      {
        this.socket.emit("nottyping", {
          chatNick: this.userNick,
          chatId: this.userId
        });
      }
      else
      {
        this.socket.emit("typing", {
          chatNick: this.userNick,
          chatId: this.userId
        });
      }
    },
    handleSubmit(){
      if(this.socketSpace==null){
        //null 방지
      }
      else{
      this.messages.push({check:2, msg:this.socketSpace + "로 동기화!"});
      this.userSocket = this.socketSpace;
      this.socket.emit("sync", {
          socketId: this.userSocket,
          attr: []
        });
      }
      var modal = document.getElementById("myModal1");
      modal.style.display = "none";
      this.modalView1 = false;
    },
    date(){
      this.d = new Date();
      return{
        message: "("+this.d.getHours()+'시'+this.d.getMinutes()+"분)"
      };
    },
    toggle() {
      this.open = !this.open
    },
    getGeo() {
      navigator.geolocation.getCurrentPosition(location => {
      //this.currentLocation = location.coords.latitude + "," + location.coords.longitude;
      this.currentLocation = location.coords.latitude + "," + location.coords.longitude;
      this.socket.emit("geo",{chatLocation : this.currentLocation});
      });
    },
    getWeather() {
      navigator.geolocation.getCurrentPosition(location => {
      this.currentX = location.coords.latitude;
      this.currentY = location.coords.longitude;
      this.socket.emit("weather",{chatLat : this.currentX, chatLon:this.currentY});
      });
    }

  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.chatList {
  height: 100%;
  background:#90deff;
}
.box {
  height: 85vh;
  border:1;
  outline:0;
  background-color: #c3fafa;
  border-radius: 50px !important; 
}
.header{
  height: 10vh;
  padding-top: 30px;
  border:0;
  background-color: #adf5ff;
  border-radius: 50px !important;
  background: url(pics/cali02.png) 0 0 no-repeat; 
  background-size: 160px;
  /* text-indent: -20000px;  */
  background-position: 50% 30%;
}
.header2{
  background-color: #adf5ff;
  border-radius: 50px;
}

.nick{
  background-color: #2ec4f3 !important;
  margin-top:0 !important;
  text-align: center;
  padding-top: 3px;
  padding-right:5px;
  padding-left:5px;
  color:white;
}
.body{
  background-color: #adf5ff;
  border-bottom-left-radius: 50px !important;
  border-bottom-right-radius: 50px !important;
}
.body1{
  background-color: #adf5ff;
}
.sync{
  background-color: #c2e1fd;
  border:0;
  outline:0;
}
.sync:hover{
  background-color:#2ec4f3;
  border: 1px #fff solid;
}
.okbtn{
  border:0;
  outline:0;
  font-size:25px;
  color:white;
  background-color: #2ec4f3;
}
.cal{
  background-color: #c2e1fd;
  border:0;
  outline:0;
}
.cal:hover{
  background-color:#2ec4f3;
  border: 1px #fff solid;
}
.change{
  background-color: #2ec4f3 !important;
  color:white;
  border:0;
  outline:0;
}
.toggle{
  width: 40px;
  height: 40px;
  background: url(pics/list.png) 0 0 no-repeat; 
  background-size: 40px;
  background-color: #c3fafa;
  border: 0;
  outline: 0;
}
.bg-info{
  background-color: #adf5ff !important;
  border-radius: 50px !important; 
}

ul {
  max-height:50vh;
  overflow-y:auto;
}
.ukey{
  float: left; width: 80%;
}
.ok{
  float: left; width: 20%;
}
button.btn-default{
    width: 40px; height: 40px;
    background: url(pics/button01.png) 0 0 no-repeat; 
    background-size: 40px;
    text-indent: -20000px; 
}
/*스크롤바*/
::-webkit-scrollbar{width: 16px;}
::-webkit-scrollbar-track {background-color:#f1f1f1;}
::-webkit-scrollbar-thumb {background-color:#FFF69B;border-radius: 10px;}
::-webkit-scrollbar-thumb:hover {background: #BCDFC9;}
::-webkit-scrollbar-button:start:decrement,::-webkit-scrollbar-button:end:increment {
width:16px;height:100%;background:#FFF69B;} 

.row{
  margin-bottom:10px;
}
.upload{
  float: left; width: 20%;
}
.in{
  float: left; width: 80%;
}
.uploadcare--widget__button_type_open {
    background: #f1f1f1 !important;
    color: #fff;
}
.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  padding-top: 15vh; /* Location of the box */
  padding-left:0;
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content */
.modal-content {
  position: relative;
  background-color: #fefefe;
  margin: auto;
  padding: 0;
  border: 1px solid #888;
  width: 80%;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
  -webkit-animation-name: animatetop;
  -webkit-animation-duration: 0.4s;
  animation-name: animatetop;
  animation-duration: 0.4s
}

/* Add Animation */
@-webkit-keyframes animatetop {
  from {top:-300px; opacity:0} 
  to {top:0; opacity:1}
}

@keyframes animatetop {
  from {top:-300px; opacity:0}
  to {top:0; opacity:1}
}

/* The Close Button */
.close {
  color: white;
  float: right;
  font-size: 40px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: #000;
  text-decoration: none;
  cursor: pointer;
}
.chat{
  background-color: #90deff;
  border:0;
  outline:0;
}
.modal-header {
  padding: 2px 16px;
  background-color: #5e7ff5;
  color: white;
  
}
.b {
    padding : 0px;
    padding-left: 10px;
    padding-right: 12px;
    position: relative;
    background: #36a3e5;
    line-height: 30px;
    text-align: center;
    width: relative;
    height: relative;
    color:white;
    padding-bottom: 10px;
    border-radius: 10px;
}
.a {
    position: relative;
    background: #41aef0;
    line-height: 30px;
    text-align: center;
    width: relative;
    height: relative;
    border-radius: 10px;
    color:white;
    padding : 0px;
    padding-left: 12px;
    padding-right: 10px;
    padding-bottom: 10px;
}

.c {
    position: relative;
    background: #41c8f0;
    line-height: 30px;
    text-align: center;
    width: relative;
    height: relative;
    border-radius: 10px;
    padding : 5px;
    color:white;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 10px;
}
.modal-body {padding: 2px 16px;}
.mic-group{
  padding-bottom: 5px;
}
#btn-mic1{
  margin-right:5px;
  border-radius: 10px;
  background-color: #5e7ff5;
  border:0;
  outline:0;
  padding-left:10px;
  padding-right:10px;
  color:white;
}
#btn-mic1 span{
  display: inline-block;
  margin: 1px 0 0 5px;
  width: 10px;
  height: 10px;
  border: solid 1px #fff;
  background: #bbb;
  border-radius: 50%;
}
#btn-mic1.on span{
  background-color:red;
}

#btn-mic2{
  margin-right:5px;
  border-radius: 10px;
  background-color: #5e7ff5;
  border:0;
  outline:0;
  padding-left:10px;
  padding-right:10px;
  color:white;
}
#btn-mic2 span{
  display: inline-block;
  margin: 1px 0 0 5px;
  width: 10px;
  height: 10px;
  border: solid 1px #fff;
  background: #bbb;
  border-radius: 50%;
}
#btn-mic2.on span{
  background-color:red;
}
</style>
