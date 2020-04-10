import React, { useState } from 'react';

import './InviteInput.css';

const InviteInput = ({ room }) => {

  const [ref, setRef] = useState('');
  const [username, setUsername] = useState('')

  const inviteRefCreator = (e, name, room) => {
    e.preventDefault()
    setRef(`localhost:3000/chat?name=${name}&room=${room}`)
    console.log(ref)
  }

  return (
  <form className="form">
    <input
      className="input inp33"
      type="text-area"
      placeholder="Type user to invite"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
    />
    <input
      className="input inp33"
      type="text"
      placeholder="Press 'Create' to create invite ref"
      value={ref}
    />
    <button className="sendButton" onClick={(e) => inviteRefCreator(e, username, room)}>Create</button>
  </form>)
  
}

export default InviteInput;