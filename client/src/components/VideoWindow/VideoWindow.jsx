import React, { useEffect } from "react";
import "./VideoWindow.css";

const VideoWindow = ({ socket }) => {
  const ENDPOINT = "localhost:5000";
  

  // START P2P CONNECTING FOR VIDEOCHAT //
  let isAlreadyCalling = false;
  let getCalled = false;

  const existingCalls = [];
  const { RTCPeerConnection, RTCSessionDescription } = window;
  const peerConnection = new RTCPeerConnection();
  // ******** //

  // HELP FUNC FOR VIDEOCHAT //
  function unselectUsersFromList() {
    const alreadySelectedUser = document.querySelectorAll(
      ".active-user.active-user--selected"
    );

    alreadySelectedUser.forEach((el) => {
      el.setAttribute("class", "active-user");
    });
  }

  function createUserItemContainer(socketId) {
    const userContainerEl = document.createElement("div");

    const usernameEl = document.createElement("p");

    userContainerEl.setAttribute("class", "active-user");
    userContainerEl.setAttribute("id", socketId);
    usernameEl.setAttribute("class", "username");
    usernameEl.innerHTML = `Socket: ${socketId}`;

    userContainerEl.appendChild(usernameEl);

    userContainerEl.addEventListener("click", () => {
      unselectUsersFromList();
      userContainerEl.setAttribute(
        "class",
        "active-user active-user--selected"
      );
      const talkingWithInfo = document.getElementById("talking-with-info");
      talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
      callUser(socketId);
    });

    return userContainerEl;
  }

  async function callUser(socketId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit("call-user", {
      offer,
      to: socketId,
    });
  }

  function updateUserList(socketIds) {
    const activeUserContainer = document.getElementById(
      "active-user-container"
    );

    socketIds.forEach((socketId) => {
      const alreadyExistingUser = document.getElementById(socketId);
      if (!alreadyExistingUser) {
        const userContainerEl = createUserItemContainer(socketId);

        activeUserContainer.appendChild(userContainerEl);
      }
    });
  }
  //****************//

  // SOCKET LISTENERS FOR VIDEOCHAT //

  socket.on("update-user-list", ({ users }) => {
    updateUserList(users);
  });

  socket.on("remove-user", ({ socketId }) => {
    const elToRemove = document.getElementById(socketId);

    if (elToRemove) {
      elToRemove.remove();
    }
  });

  socket.on("call-made", async (data) => {
    if (getCalled) {
      const confirmed = window.confirm(
        `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
      );

      if (!confirmed) {
        socket.emit("reject-call", {
          from: data.socket,
        });

        return;
      }
    }

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    socket.emit("make-answer", {
      answer,
      to: data.socket,
    });
    getCalled = true;
  });

  socket.on("answer-made", async (data) => {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );

    if (!isAlreadyCalling) {
      callUser(data.socket);
      isAlreadyCalling = true;
    }
  });

  socket.on("call-rejected", (data) => {
    alert(`User: "Socket: ${data.socket}" rejected your call.`);
    unselectUsersFromList();
  });

  peerConnection.ontrack = function ({ streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo) {
      remoteVideo.srcObject = stream;
    }
  };

  navigator.getUserMedia(
    { video: true, audio: true },
    (stream) => {
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }

      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));
    },
    (error) => {
      console.warn(error.message);
    }
  );
  //********************************//

  useEffect(() => {
    navigator.getUserMedia(
      { video: true, audio: true },
      (stream) => {
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
          localVideo.srcObject = stream;
        }
      },
      (error) => {
        console.warn(error.message);
      }
    );
  }, []);

  return (
    <div className="content-container">
       <div className="active-users-panel" id="active-user-container">
         <h3 className="panel-title">Active Users:</h3>
       </div>
       <div className="video-chat-container">
         <h2 className="talk-info" id="talking-with-info"> 
            Click on user you want to call
         </h2>
         <div class="video-container">
           <video autoplay className="remote-video" id="remote-video"></video>
           <video autoplay muted className="local-video" id="local-video"></video>
         </div>
       </div>
     </div>
  );
};

export default VideoWindow;
