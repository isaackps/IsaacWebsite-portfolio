import React from 'react';
import CQ from '../../ClinicQueue_Color.png';
import Squirrel from '../../SquirrelLogo.png';
import SuperLaundry from '../../SuperLaundry.png';
import SpaceInvaders from '../../SpaceInvaders.png';

import './Portfolio.css';

export default class Portfolio extends React.Component {

  render() {
    return (
      <div className="Portfolio" id="Portfolio">
        <h1 className="PortfolioTitle">Portfolio</h1>
        <h3 className="PortfolioSubTitle">Web Development Projects</h3>

        <div className="PortfolioItem1">
          <a href="https://clinicq.sg/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={CQ} className="CQ animated infinite rubberBand" alt="Clinic Queues"/>
          </a>
          <p className="PortfolioDescription">Clinic Queues Website</p>
        </div>
        <div className="PortfolioItem2">
          <a href="https://13.59.144.224/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={Squirrel} className="Squirrel animated infinite swing" alt="Squirrel"></img>
          </a>
          <p className="PortfolioDescription">Squirrel Website</p>
        </div>
        <div className="PortfolioItem3">
          <a href="http://52.221.226.37:3000/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={SuperLaundry} className="SuperLaundry animated infinite jello" alt="Super Laundry"></img>
          </a>
          <p className="PortfolioDescription">Super Laundry Website</p>
        </div>
        <div className="PortfolioItem4">
          <a href="https://isaackps.github.io/Super-Game/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={SpaceInvaders} className="SpaceInvaders animated infinite pulse" alt="Super Space Destroy-YA!"></img>
          </a>
          <p className="PortfolioDescription">Super Space Destroy-YA! Game Webpage</p>
        </div>
      </div>
    );
  }
}

Portfolio.propTypes = {
};
