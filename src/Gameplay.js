import React from 'react';
import { Outlet, Link } from "react-router-dom";
import './index.css';

// const Gameplay = props => <Gameplay {...props}/>

function Gameplay() {
    
    return (
        <>  
            {/* back button */}
            <div className="back">
                <Link to={`../`}><button className="button">Quit</button></Link>
            </div>

            <canvas>
                {/* game drawing goes here */}

            </canvas>
        </>
    );
}
export default Gameplay