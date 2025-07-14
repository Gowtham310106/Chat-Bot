import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";


function App() {
  return (
    <>
      <ChatInput />
      <ChatMessage message="hello chatbot" sender="user" />
      <ChatMessage message="How can i help You" sender="robot" />


    </>
  )
}

export default App
