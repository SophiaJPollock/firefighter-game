import { useState } from 'react';
import './App.css';
import MainMenu from './MainMenu/MainMenu';
import GameSetup from './GameSetup/GameSetup';
import GraphView from './GraphView/GraphView';
import FireLogo from './MainMenu/FireLogo';
import ForestBackground from './MainMenu/ForestBackground';
import Campfire from './MainMenu/Campfire';

// Connect to backend:
const API_URL = 'http://127.0.0.1:8000';

async function apiRequest(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

function App() {
  // Game info:
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Game layout:
  const [gameLayout, setGameLayout] = useState('force');

  // Current screen:
  const [screen, setScreen] = useState('menu');
  const [setupError, setSetupError] = useState('');

  // Start new game:
  async function startGame({ costMode, layout, graphId }) {
    setBusy(true);
    setSetupError('');

    try {
      const state = await apiRequest('/api/new-game', {
        cost_mode: costMode,
        graph_id: graphId,
      });

      setGame(state);
      setGameLayout(layout);
      setSelected(null);
      setError('');
      setMessage('');
      setScreen('game');

    } catch (err) {
      setSetupError(`Could not start game: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Selected vertex:
  const selectedVertex = game?.vertices.find(
    (vertex) => vertex.id === selected
  );

  const canDefend =
    selectedVertex?.status === 'safe' &&
    typeof selectedVertex.cost === 'number' &&
    selectedVertex.cost <= game.budget &&
    !game.game_over &&
    !busy;

  // Game actions:
  async function gameAction(path, body, successMessage) {
    if (busy) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const state = await apiRequest(path, body);

      setGame(state);
      setSelected(null);
      setMessage(successMessage);

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Defend vertex:
  function defendSelected() {
    if (!canDefend) return;

    gameAction(
      '/api/defend',
      { vertex: selected },
      `Vertex ${selected} defended.`
    );
  }

  // End turn:
  function endTurn() {
    if (game.game_over) return;

    gameAction(
      '/api/end-turn',
      undefined,
      'Fire spread. Next turn started.'
    );
  }

  // Restart game:
  function restartGame() {
    gameAction(
      '/api/restart',
      undefined,
      'Game restarted.'
    );
  }

  // Return to setup:
  function goBack() {
    if (busy) return;

    if (
      !game.game_over &&
      !window.confirm('Leave the current game?')
    ) {
      return;
    }

    setSelected(null);
    setError('');
    setMessage('');
    setSetupError('');
    setScreen('setup');
  }

  // Main menu:
  if (screen === 'menu') {
    return <MainMenu onPlay={() => setScreen('setup')} />;
  }

  // Game setup:
  if (screen === 'setup') {
    return (
      <GameSetup
        onBack={() => {
          setSetupError('');
          setScreen('menu');
        }}
        onStart={startGame}
        busy={busy}
        error={setupError}
      />
    );
  }

  // Count vertices:
  const burningCount = game.burning.length;
  const defendedCount = game.defended.length;
  const totalCount = game.vertices.length;
  const savedCount = totalCount - burningCount;

  // Display status:
  const statusLabels = {
    safe: 'Undefended',
    burning: 'Burning',
    defended: 'Defended',
  };

  // Game screen:
  return (
    <div className="game-screen">

      {/* Background: */}
      <div className="game-background">
        <ForestBackground />
        <Campfire />
      </div>

      <main className="app game-app">

        {/* Title and turn: */}
        <header className="game-header">

          <button
            type="button"
            className="back-button"
            onClick={goBack}
            disabled={busy}
          >
            {'< Back'}
          </button>

          <div className="game-heading">
            <FireLogo />
            <p>Protect the graph from spreading fire.</p>
          </div>

          <span className="turn">
            Turn {game.turn}
          </span>

        </header>

        {/* Game stats: */}
        <section className="stats">

          <div className="stat">
            <span>Budget</span>
            <strong>{game.budget}</strong>
          </div>

          <div className="stat">
            <span>Burning</span>
            <strong>{burningCount}</strong>
          </div>

          <div className="stat">
            <span>Defended</span>
            <strong>{defendedCount}</strong>
          </div>

        </section>

        {/* Game over: */}
        {game.game_over && (
          <section className="game-over" role="status">

            <h2>Game over</h2>

            <p>The fire can no longer spread.</p>

            <div className="final-score">
              <strong>
                {savedCount} / {totalCount}
              </strong>

              <span>Vertices saved</span>
            </div>

            <p>{burningCount} vertices burned</p>

          </section>
        )}

        {/* Messages: */}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {message && !game.game_over && (
          <p className="game-message" role="status">
            {message}
          </p>
        )}

        <section className="workspace">

          {/* Graph display: */}
          <div className="graph-panel">
            <GraphView
              game={game}
              layout={gameLayout}
              selected={selected}
              onSelect={setSelected}
              busy={busy}
            />
          </div>

          {/* Game controls: */}
          <aside className="side-panel">

            <h2>Game controls</h2>

            {/* Selected vertex info: */}
            <div className="selection-info">

              {game.game_over ? (
                <p>
                  Restart the game or return to setup
                  to choose a new graph.
                </p>
              ) : selectedVertex ? (
                <>
                  <p>
                    Selected vertex:
                    <strong> {selectedVertex.id}</strong>
                  </p>

                  <p>
                    Status:
                    <strong>
                      {' '}{statusLabels[selectedVertex.status]}
                    </strong>
                  </p>

                  <p>
                    Defence cost:
                    <strong> {selectedVertex.cost}</strong>
                  </p>

                  {selectedVertex.cost > game.budget && (
                    <p className="warning">
                      Not enough budget to defend this vertex.
                    </p>
                  )}
                </>
              ) : (
                <p>
                  Select an undefended vertex on the graph.
                </p>
              )}

            </div>

            {/* Defend button: */}
            <button
              type="button"
              className="defend-button"
              onClick={defendSelected}
              disabled={!canDefend}
            >
              Defend vertex
            </button>

            {/* End turn button: */}
            <button
              type="button"
              className="end-turn-button"
              onClick={endTurn}
              disabled={busy || game.game_over}
            >
              End turn
            </button>

            {/* Restart button: */}
            <button
              type="button"
              className="restart-button"
              onClick={restartGame}
              disabled={busy}
            >
              Restart game
            </button>

            <hr />

            {/* Legend: */}
            <h3>Legend</h3>

            <p className="legend-item">
              <span className="dot red" />
              Burning
            </p>

            <p className="legend-item">
              <span className="dot blue" />
              Defended
            </p>

            <p className="legend-item">
              <span className="dot grey" />
              Undefended
            </p>

            <hr />

            {/* How to play: */}
            <h3>How to play</h3>

            <p>Select an undefended vertex to defend it.</p>

            <p>
              Defend as many vertices as your budget allows.
            </p>

            <p>
              Click End turn when you're ready for the fire
              to spread.
            </p>

          </aside>

        </section>
      </main>
    </div>
  );
}

export default App;