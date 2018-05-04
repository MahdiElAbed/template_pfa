<template>
    <div class="rtc">
        <div id="demoContainer">
            <div id="connectControls">
                <input type="checkbox" checked="checked" id="shareAudio"/>Share audio
                <input type="checkbox" checked="checked" id="shareVideo"/>Share video<br/>
                <input type="checkbox" checked="checked" id="expectAudio"/>Expect audio
                <input type="checkbox" checked="checked" id="expectVideo"/>Expect video<br/>

                <input type="checkbox" id="useFreshIce"
                       v-on:click="easyrtc.setUseFreshIceEachPeerConnection(this.value);"/>Fresh Ice<br/>
                <button id="connectButton" v-on:click="connect()">Connect</button>
                <button id="sendMessage">sendMessage</button>
                <button id="disconnectButton" v-on:click="disconnect()">Disconnect</button>
                <br/>
                <button id="hangupButton" disabled="disabled" v-on:click="hangup()">Hangup</button>
                <div id="iam">Not yet connected...</div>
                <br/>
                <strong>Connected users:</strong>
                <div id="otherClients"></div>
                <div id="acceptCallBox"> <!-- Should be initially hidden using CSS -->

                </div>

                <div id="videos">
                    <video autoplay="autoplay" id="selfVideo" class="easyrtcMirror" muted="muted" volume="0"></video>
                    <video autoplay="autoplay" id="callerVideo"></video>
                    <div id="acceptCallLabel"></div>
                    <button id="callAcceptButton">Accept</button>
                    <button id="callRejectButton">Reject</button>
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
        padding: 0;
    }

    li {
        display: inline-block;
        margin: 0 10px;
    }

    a {
        color: #42b983;
    }
</style>