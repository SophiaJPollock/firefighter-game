import { useEffect, useState } from 'react';
import './App.css';
import MainMenu from './MainMenu/MainMenu';
import GameSetup from './GameSetup/GameSetup';
import GraphView from './GraphView/GraphView';
import FireLogo from './MainMenu/FireLogo';
import ForestBackground from './MainMenu/ForestBackground';
import Campfire from './MainMenu/Campfire';

// Connect to backend:
const API_URL = 'http://127.0.0.1:8000';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    ...options,
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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Cost mode:
  const [gameCostMode, setGameCostMode] = useState('distance');

  // Graph settings:
  const [gameGraphId, setGameGraphId] = useState('graph_1');
  const [gameLayout, setGameLayout] = useState('force');

  // Current screen:
  const [screen, setScreen] = useState('menu');
  const [setupError, setSetupError] = useState('');

  // Load game:
  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      try {
        const state = await apiRequest('/api/state');

        if (!cancelled) {
          setGame(state);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Could not load the game: ${err.message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGame();

    return () => {
      cancelled = true;
    };
  }, []);

  // Start new game:
  async function startGame({ costMode, layout, graphId = 'graph_1' }) {
    setSetupError('');

    // Check graph settings:
    if (
      !['force', 'radial', 'tree'].includes(layout) ||
      !['graph_1', 'graph_2', 'graph_3'].includes(graphId)
    ) {
      setSetupError('Choose a valid graph and layout.');
      return;
    }

    setBusy(true);

    try {
      const state = await apiRequest('/api/new-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost_mode: costMode,
          graph_id: graphId,
        }),
      });

      setGame(state);
      setGameGraphId(graphId);
      setGameLayout(layout);
      setGameCostMode(costMode);
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

  // Select vertex:
  const selectedVertex = game?.vertices.find(
    (vertex) => vertex.id === selected
  );

  // Check if can defend:
  const canDefend =
    selectedVertex?.status === 'safe' &&
    typeof selectedVertex.cost === 'number' &&
    selectedVertex.cost <= game.budget &&
    !game.game_over &&
    !busy;

  // Defend vertex:
  async function defendSelected() {
    if (!canDefend) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const newState = await apiRequest('/api/defend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vertex: selected,
        }),
      });

      setGame(newState);
      setSelected(null);
      setMessage(`Vertex ${selected} defended.`);

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // End turn:
  async function endTurn() {
    if (busy || game.game_over) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const newState = await apiRequest('/api/end-turn', {
        method: 'POST',
      });

      setGame(newState);
      setSelected(null);

      if (!newState.game_over) {
        setMessage('Fire spread. Next turn started.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Restart game:
  async function restartGame() {
    if (busy) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const newState = await apiRequest('/api/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost_mode: gameCostMode,
          graph_id: gameGraphId,
        }),
      });

      setGame(newState);
      setSelected(null);
      setMessage('Game restarted.');

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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
    return (
      <MainMenu onPlay={() => setScreen('setup')} />
    );
  }

  // Loading screen:
  if (loading) {
    return (
      <main className="app">
        <h1>Firefighter Game</h1>
        <p>Loading game...</p>
      </main>
    );
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

  // Loading error:
  if (!game) {
    return (
      <main className="app">
        <h1>Firefighter Game</h1>
        <p role="alert">{error}</p>
        <p>Unable to start the game.</p>

        <button onClick={() => setScreen('setup')}>
          Back
        </button>
      </main>
    );
  }

  // Count vertices:
  const burningCount = game.burning.length;
  const defendedCount = game.defended.length;

  const undefendedCount = game.vertices.filter(
    (vertex) => vertex.status === 'safe'
  ).length;

  const savedCount = undefendedCount + defendedCount;
  const totalCount = game.vertices.length;

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

            <p>
              {burningCount} vertices burned
            </p>

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
                  Restart the game or return to
                  setup to choose a new graph.
                </p>
              ) : selectedVertex ? (
                <>
                  <p>
                    Selected vertex:
                    <strong>
                      {' '}{selectedVertex.id}
                    </strong>
                  </p>

                  <p>
                    Status:
                    <strong>
                      {' '}
                      {statusLabels[selectedVertex.status]
                        ?? selectedVertex.status}
                    </strong>
                  </p>

                  <p>
                    Defence cost:
                    <strong>
                      {' '}{selectedVertex.cost}
                    </strong>
                  </p>

                  {selectedVertex.cost > game.budget && (
                    <p className="warning">
                      Not enough budget to
                      defend this vertex.
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

            <p>
              Select an undefended vertex to defend it.
            </p>

            <p>
              Defend as many vertices as your budget allows.
            </p>

            <p>
              Click End turn when you're ready for
              the fire to spread.
            </p>

          </aside>

        </section>
      </main>
    </div>
  );
}

export default App;