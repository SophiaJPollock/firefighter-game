
import { useState } from 'react';
import MainMenu from '../MainMenu/MainMenu';
import './GameSetup.css';

function GameSetup({ onBack, onStart, busy = false, error = '' }) {
  // Game settings:
  const [costMode, setCostMode] = useState('distance');
  const [layout, setLayout] = useState('grid');

  // Start game:
  function handleStart(event) {
    event.preventDefault();
    onStart({ costMode, layout });
  }

  return (
    <div className="game-setup">

      {/* Forest background: */}
      <div aria-hidden="true">
        <MainMenu onPlay={() => {}} />
      </div>

      {/* Hide main menu content: */}
      <style>{`
        .game-setup .menu-content {
          display: none;
        }
      `}</style>

      {/* Yellow window: */}
      <div className="setup-window">
        <h1>GAME SETTINGS</h1>

        <form onSubmit={handleStart}>

          {/* Defence cost: */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend>
              <h2>DEFENCE COST</h2>
            </legend>

            <p>
              <label>
                <input
                  type="radio"
                  name="cost"
                  value="distance"
                  checked={costMode === 'distance'}
                  onChange={() => setCostMode('distance')}
                />
                Distance-based
              </label>
            </p>

            <p>
              <label>
                <input
                  type="radio"
                  name="cost"
                  value="random"
                  checked={costMode === 'random'}
                  onChange={() => setCostMode('random')}
                />
                Random
              </label>
            </p>
          </fieldset>

          <hr />

          {/* Graph layout: */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend>
              <h2>GRAPH LAYOUT</h2>
            </legend>

            {[
              ['grid', 'Grid'],
              ['force', 'Force-directed'],
              ['circular', 'Circular'],
            ].map(([value, label]) => (
              <p key={value}>
                <label>
                  <input
                    type="radio"
                    name="layout"
                    value={value}
                    checked={layout === value}
                    onChange={() => setLayout(value)}
                  />
                  {label}
                </label>
              </p>
            ))}
          </fieldset>

          <hr />

          {/* Error message: */}
          {error && (
            <p
              role="alert"
              style={{
                color: '#87331e',
                textAlign: 'center',
                fontSize: 10,
                lineHeight: 2,
              }}
            >
              {error}
            </p>
          )}

          {/* Buttons: */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 10,
            }}
          >
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              style={{ flex: 1 }}
            >
              BACK
            </button>

            <button
              type="submit"
              disabled={busy}
              style={{ flex: 1 }}
            >
              {busy ? 'STARTING...' : 'START GAME'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default GameSetup;
