<template>
    <div class="rtc">
        <div id="demoContainer">

            <div id="connectControls">
                <div class="sidenav">
                    <div class="list-group">
                        <h3><p class="text-danger ">Options</p></h3>
                        <li class="list-group-item"><input type="checkbox" checked="checked" id="shareAudio"/>Share audio</li>
                        <li class="list-group-item"><input type="checkbox" checked="checked" id="shareVideo"/>Share video</li>
                        <li class="list-group-item"><input type="checkbox" checked="checked" id="expectAudio"/>Expect audio</li>
                        <li class="list-group-item"><input type="checkbox" checked="checked" id="expectVideo"/>Expect video</li>
                        <li class="list-group-item"><input type="checkbox" id="useFreshIce"
                                                           v-on:click="easyrtc.setUseFreshIceEachPeerConnection(this.value);"/>Fresh Ice</li></div></div><br/>
            <br><br/><button type="button" class="btn btn-success" id="connectButton" v-on:click="connect()">Connect</button>
                <button id="sendMessage" type="button" class="btn btn-primary">sendMessage</button>
                <button id="disconnectButton" type="button" class="btn btn-danger" v-on:click="disconnect()">Disconnect</button>
                <br/>
                <br/>
                <button id="hangupButton" disabled="disabled" type="button" class="btn btn-danger"   v-on:click="hangup()">Hangup</button><br/>
                <br/><div id="iam">Not yet connected...</div>
                <strong>Connected users:</strong>
                <div id="otherClients"></div>
                <div id="acceptCallBox"> <!-- Should be initially hidden using CSS -->

                </div>

                <div id="videos">
                    <video autoplay="autoplay" id="selfVideo" class="easyrtcMirror" muted="muted" volume="0"></video>
                    <video autoplay="autoplay" id="callerVideo"></video>
                    <div id="acceptCallLabel"></div>
                    <button id="callAcceptButton" type="button" class="btn btn-success" >Accept</button>
                    <button id="callRejectButton" type="button" class="btn btn-danger" >Reject</button>
                </div>
            </div>
            <div id="audioSinkButtons">
            </div>
            <div id="container">

                <div id="main">

                    <!-- Main Content -->
                    <h2>messaging</h2>
                    <!--show-->
                    <div id="sendMessageArea">
                        <textarea id="sendMessageText"></textarea>
                        <div id="otherClients"></div>
                    </div>
                    <div id="receiveMessageArea">
                        Received Messages:
                        <div id="conversation"></div>
                    </div>
                </div>

            </div>
        </div>

    </div>
</template>

<script>
  export default {
    name: "proj.vue",
    data() {
      return {
        msg: 'Welcome to Your Vue.js App',
        onceOnly: true,
        selfEasyrtcid: "",
        haveSelfVideo : false
      }
    },
    methods: {
//methodes envoi message
      addToConversation(who, msgType, content) {
        // Escape html special characters, then add linefeeds.
        content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        content = content.replace(/\n/g, '<br />');
        document.getElementById('conversation').innerHTML +=
          "<b>" + who + ":</b>&nbsp;"+"<image src="+content+" /> <br />";
      },

      /*convertListToButtons(roomName, occupants, isPrimary) {
        var otherClientDiv = document.getElementById('otherClients');
        var self= this;
        while (otherClientDiv.hasChildNodes()) {
          otherClientDiv.removeChild(otherClientDiv.lastChild);
        }
        for (var easyrtcid in occupants) {
          var button = document.createElement('button');
          button.onclick = function (easyrtcid) {
            return function () {
              self.sendStuffWS(easyrtcid);
            };
          }(easyrtcid);
          var label = document.createTextNode("Send to " + easyrtc.idToName(easyrtcid));
          button.appendChild(label);

          otherClientDiv.appendChild(button);
        }
        if (!otherClientDiv.hasChildNodes()) {
          otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
        }
      },*/
      sendStuffWS(otherEasyrtcid) {
        var text = document.getElementById('sendMessageText').value;
        if(text.replace(/\s/g, "").length === 0) { // Don't send just whitespace
          return;
        }

        easyrtc.sendDataWS(otherEasyrtcid, "message",  text);
        this.addToConversation("Me", "message", text);
        document.getElementById('sendMessageText').value = "";
      },
      // methodes connexion video
      connect() {
        easyrtc.setSocketUrl("//localhost:8083");
        easyrtc.enableAudio(document.getElementById("shareAudio").checked);
        easyrtc.enableVideo(document.getElementById("shareVideo").checked);
        easyrtc.enableDataChannels(true);
        easyrtc.setPeerListener(this.addToConversation);
        easyrtc.setRoomOccupantListener(this.convertListToButtons);
        easyrtc.connect("easyrtc.instantMessaging", this.loginSuccess, this.loginFailure);
        easyrtc.connect("easyrtc.audioVideo", this.loginSuccess, this.loginFailure);
        if (this.onceOnly) {
          easyrtc.getAudioSinkList(function (list) {
            for (let ele of list) {
              addSinkButton(ele.label, ele.deviceId);
            }
          });
          this.onceOnly = false;
        }
      },
      hangup() {
        easyrtc.hangupAll();
        disable('hangupButton');
      },
      loginFailure(errorCode, message) {
        easyrtc.showError(errorCode, message);
      },
      loginSuccess(easyrtcid) {
        this.disable("connectButton");
        this.enable("disconnectButton");
        this.enable('otherClients');
        this.selfEasyrtcid = easyrtcid;
        document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
        easyrtc.showError("noerror", "logged in");
      },
      convertListToButtons(roomName, occupants, isPrimary) {
        this.clearConnectList();
        var otherClientDiv = document.getElementById('otherClients');
        var sendMessage = document.getElementById("sendMessage");

        var self = this;
        for (var easyrtcid in occupants) {
          var button = document.createElement('button');
          sendMessage.onclick = function (easyrtcid) {
            return function () {
              self.sendStuffWS(easyrtcid);
            };
          }(easyrtcid);
          button.onclick = function (easyrtcid) {
            return function () {
              self.performCall(easyrtcid);
            };
          }(easyrtcid);

          var label = document.createTextNode("Call " + easyrtc.idToName(easyrtcid));
          button.appendChild(label);
          otherClientDiv.appendChild(button);
        }
      },
      disconnect() {
        easyrtc.disconnect();
        document.getElementById("iam").innerHTML = "logged out";
        this.enable("connectButton");
        this.disable("disconnectButton");
        easyrtc.clearMediaStream(document.getElementById('selfVideo'));
        easyrtc.setVideoObjectSrc(document.getElementById("selfVideo"), "");
        easyrtc.closeLocalMediaStream();
        easyrtc.setRoomOccupantListener(function () {
        });
        this.clearConnectList();
      },
      disable(domId) {
        document.getElementById(domId).disabled = "disabled";
      },
      enable(domId) {
        document.getElementById(domId).disabled = "";
      },
      clearConnectList() {
        var otherClientDiv = document.getElementById('otherClients');
        while (otherClientDiv.hasChildNodes()) {
          otherClientDiv.removeChild(otherClientDiv.lastChild);
        }
      },
      performCall(otherEasyrtcid) {
        easyrtc.hangupAll();
        var self = this;
        var acceptedCB = function (accepted, easyrtcid) {
          if (!accepted) {
            easyrtc.showError("CALL-REJECTEd", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
            self.enable('otherClients');
          }
        };

        var successCB = function () {
          if (easyrtc.getLocalStream()) {
            console.log(easyrtc.getLocalStream())
            console.log(!this.haveSelfVideo)
            self.setUpMirror();
          }
          self.enable('hangupButton');
        };
        var failureCB = function () {
          self.enable('otherClients');
        };
        easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
        this.enable('hangupButton');
      },
      setUpMirror() {
        console.log(!this.haveSelfVideo)
        if( !this.haveSelfVideo) {
          var selfVideo = document.getElementById("selfVideo");
          easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
          selfVideo.muted = true;
          this.haveSelfVideo = true;
        }
      }
    },
    created () {
      var self = this;
      easyrtc.setStreamAcceptor( function(easyrtcid, stream) {
        self.setUpMirror();
        var video = document.getElementById('callerVideo');
        easyrtc.setVideoObjectSrc(video,stream);
        self.enable("hangupButton");
      });
      easyrtc.setOnStreamClosed( function (easyrtcid) {
        easyrtc.setVideoObjectSrc(document.getElementById('callerVideo'), "");
        self.disable("hangupButton");
      });
    }
  }
</script>

<style scoped>
    h1, h2 {
        font-weight: normal;
    }

    ul {
        list-style-type: none;

    }

    li {

        margin: 5px;
        padding: 15px;
        font-size: 15px;
    }

    a {
        color: #42b983;
    }
    body {

        font-family: Arial, Helvetica, sans-serif;
    }

    body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
    }

    .topnav {
        overflow: hidden;
        background-color: #f2f2f2;
    }
    .sidenav {
        height: 100%; /* Full-height: remove this if you want "auto" height */
        width: 200px; /* Set the width of the sidebar */
        position: fixed; /* Fixed Sidebar (stay in place on scroll) */
        z-index: 1; /* Stay on top */
        top: 0; /* Stay at the top */
        left: 0;
        background-color: #111; /* Black */
        overflow-x: hidden; /* Disable horizontal scroll */
        padding-top: 20px;
    }

    /* The navigation menu links */


    /* When you mouse over the navigation links, change their color */
    .sidenav a:hover {
        color: #f1f1f1;
    }

    /* Style page content */
    .main {
        margin-left: 160px; /* Same as the width of the sidebar */
        padding: 0px 10px;
    }

    /* On smaller screens, where height is less than 450px, change the style of the sidebar (less padding and a smaller font size) */
    @media screen and (max-height: 450px) {
        .sidenav {padding-top: 10px;}
        .sidenav a {font-size: 18px;}
    }

</style>