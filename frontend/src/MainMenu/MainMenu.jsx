import FireLogo from "./FireLogo";
import ForestBackground from "./ForestBackground";
import Campfire from "./Campfire";
import "./MainMenu.css";

export default function MainMenu({ onPlay }) {
    return (
        <div className="main-menu">
            <ForestBackground />
            <Campfire />

            <div className="menu-content">
                <FireLogo />

                <button className="play-button" onClick={onPlay}>
                    NEW GAME
                </button>
            </div>
        </div>
    );
}