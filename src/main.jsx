import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import StarRating from "./StarRating";
import App from './App.jsx'
import './index.css'

function Test() {
  const [movieRating, setMovieRating] = useState(0);

  return (
    <>
      <StarRating maxRating={10} color="blue" onSetRating={setMovieRating} />
      <p>This movie is rated {movieRating} stars.</p>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* <StarRating maxRating={10} /> */}
    {/* <StarRating maxRating={5} color="red" /> */}
    {/* <Test /> */}
  </React.StrictMode>
);
