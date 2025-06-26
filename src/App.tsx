import React from "react";
import PingPongGame from "./components/PingPongGame";

const App: React.FC = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#181818", paddingTop: 30 }}>
      <h1 style={{ color: "white", textAlign: "center" }}>Ping Pong Game</h1>
      <PingPongGame />
    </div>
  );
};

export default App;