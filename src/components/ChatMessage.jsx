import React from 'react'
import botGif from '../assets/robo.gif'
import user from '../assets/user.png'

const ChatMessage = (props) => {
    const {message,sender} = props;
   

   

  return (
    <div>
        {sender === 'robot' && (
            
             <img src={botGif} width="70" />

             ) }

     {message}

     { sender==='user' && (

     <img src={user} width="50" />

     )}
    </div>
  )
}

export default ChatMessage