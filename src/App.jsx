import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import "./index.css";

const average = (arr) => {
  if (arr.length === 0) return 0; // or return NaN
  return arr.reduce((acc, cur) => acc + cur, 0) / arr.length;
};
const API = "https://www.omdbapi.com?apikey=7d57d30b&s=";
export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [watched, setWatched] = useState(function () {
    const storeValue = localStorage.getItem("watched");
    return JSON.parse(storeValue);
  });

  function handleSelectedMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(`${API}${query}`, {
            signal: controller.signal,
          });

          if (!res.ok)
            throw new Error("Something went wrong with fetching movies");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found"); // if movie name is not make sense.

          setMovies(data.Search);
        } catch (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }
      handleCloseMovie();
      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <Navbar>
        <Search query={query} setQuery={setQuery} />
        <NumResult movies={movies} />
      </Navbar>
      <Main>
        <ListBox
          movies={movies}
          isLoading={isLoading}
          error={error}
          onSelectMovie={handleSelectedMovie}
        />
        <WatchedBox
          watched={watched}
          selectedId={selectedId}
          onCloseMovie={handleCloseMovie}
          onAddWatched={handleAddWatched}
          onDeleteWatched={handleDeleteWatched}
        />
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ err }) {
  return (
    <p className="error">
      <span>⛔</span>
      {err}
    </p>
  );
}

function Navbar({ children }) {
  return (
    <>
      <nav className="nav-bar">
        <Logo />
        {children}
      </nav>
    </>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>Popcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEL = useRef(null);
  useEffect(
    function () {
      function callback(e) {
        if (document.activeElement === inputEL.current) return;
        if (e.code === "Enter") {
          inputEL.current.focus();
          setQuery("");
        }
      }
      return () => document.addEventListener("keydown", callback);
    },
    [setQuery]
  );

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      id="search"
      ref={inputEL}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResult({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function ListBox({ movies, isLoading, error, onSelectMovie }) {
  const [isOpen1, setIsOpen1] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen1((open) => !open)}
      >
        {isOpen1 ? "–" : "+"}
      </button>

      {isOpen1 && (
        <>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieLists movies={movies} onSelectMovie={onSelectMovie} />
          )}
          {error && <ErrorMessage err={error} />}
        </>
      )}
    </div>
  );
}

function MovieLists({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <li
          key={movie.imdbID}
          onClick={() => onSelectMovie(movie.imdbID)}
          title={`${movie.Title}`}
        >
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
          <h3>{movie.Title}</h3>
          <div>
            <p>
              <span>🗓</span>
              <span>{movie.Year}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function WatchedBox({
  watched,
  selectedId,
  onCloseMovie,
  onAddWatched,
  onDeleteWatched,
}) {
  const [isOpen2, setIsOpen2] = useState(true);
  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen2((open) => !open)}
      >
        {isOpen2 ? "-" : "+"}
      </button>
      {isOpen2 && (
        <>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={onCloseMovie}
              onAddWatched={onAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesLists
                watched={watched}
                onDeleteWatched={onDeleteWatched}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovies] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);

  useEffect(
    function () {
      if (userRating) countRef.current = countRef.current++;
    },
    [userRating]
  );

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);

  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating: imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
    Awards: awards,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          onCloseMovie();
          console.log("Closing movie");
        }
      }
      document.addEventListener("keydown", callback);
      return () => document.removeEventListener("keydown", callback);
    },
    [onCloseMovie]
  );

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com?apikey=7d57d30b&i=${selectedId}`
        );
        const data = await res.json();
        setMovies(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId, watched]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `${title}`;

      return function () {
        document.title = "Popcorn";
      };
    },
    [title]
  );

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>
                {title} ({year})
              </h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb Rating
              </p>
              <p>{awards}</p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={26}
                    onSetRating={setUserRating}
                    className="star"
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie {watchedUserRating} <span>⭐</span>
                </p>
              )}
            </div>
            <p>
              Plot :<em> {plot}</em>
            </p>
            <p>Starring : {actors}</p>
            <p>Directed by : {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const imdbRatings = watched.map((movie) => movie.imdbRating);
  const validImdbRatings = imdbRatings.filter((rating) => !isNaN(rating));
  const avgImdbRating =
    validImdbRatings.length > 0 ? average(validImdbRatings).toFixed(1) : "0";

  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const formattedAvgUserRating =
    avgUserRating % 1 === 0
      ? avgUserRating.toFixed(0)
      : avgUserRating.toFixed(1);

  // Filter out NaN runtimes and calculate total runtime
  const validRuntimes = watched
    .map((movie) => movie.runtime)
    .filter((runtime) => !isNaN(runtime));
  const totalRuntimeInMinutes = validRuntimes.reduce(
    (total, runtime) => total + runtime,
    0
  );

  // Convert total runtime to hours and remaining minutes
  const totalHours = Math.floor(totalRuntimeInMinutes / 60);
  const remainingMinutes = totalRuntimeInMinutes % 60;

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{formattedAvgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>
            {totalHours}.{remainingMinutes} hr
          </span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesLists({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  const displayRuntime =
    !isNaN(movie.runtime) && movie.runtime !== undefined
      ? `${movie.runtime} min`
      : "N/A";

  const displayImdbRating = !isNaN(movie.imdbRating)
    ? movie.imdbRating.toFixed(1)
    : "N/A";

  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{displayImdbRating}</span>
        </p>
        <p>
          <span title="User rating">🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{displayRuntime}</span>
        </p>

        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
