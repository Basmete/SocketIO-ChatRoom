import React, { useState, useEffect } from "react";
import queryString from "query-string";
import io from "socket.io-client";

import TextContainer from "../TextContainer/TextContainer";
import Messages from "../Messages/Messages";
import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";

import "./Chat.css";
import InviteInput from "../InviteInput/InviteInput";
import VideoWindow from "../VideoWindow/VideoWindow";

const ENDPOINT = "localhost:5000";
let socket = io(ENDPOINT);



const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const ENDPOINT = "localhost:5000";
  

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    

    setRoom(room);
    setName(name);

    socket.emit("join", { name, room }, (error) => {
      if (error) {
        alert(error);
      }
    });
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on("message", (message) => {
      console.log(message);
      setMessages((messages) => [...messages, message]);
    });

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });
  }, []);

  const inviteRefCreator = (name, room) => {
    return `localhost:3000/chat?name=${name}&room=${room}`;
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (message) {
      socket.emit("sendMessage", message, () => setMessage(""));
    }
  };

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
        <InviteInput room={room} invite={inviteRefCreator} />
      </div>
      <TextContainer users={users} />
      <VideoWindow socket={socket} /> 
    </div>
  );
};

export default Chat;
