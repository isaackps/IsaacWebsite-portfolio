import React, {Component} from 'react';
import CQ from '../../ClinicQueue_Color.png';
import Squirrel from '../../SquirrelLogo.png';
import SuperLaundry from '../../SuperLaundry.png';
import SpaceInvaders from '../../SpaceInvaders.png';

import './Portfolio.css';

export default class Portfolio extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="Portfolio" id="Portfolio">
        <h1 className="PortfolioTitle">Portfolio</h1>
        <h3 className="PortfolioSubTitle">Web Development</h3>

        <div className="PortfolioItem1">
          <a href="https://52.76.125.37/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={CQ} className="CQ animated infinite rubberBand" alt="Clinic Queues"/>
            <p className="PortfolioDescription">Clinic Queues Website</p>
          </a>
        </div>
        <div className="PortfolioItem2">
          <a href="https://13.59.144.224/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={Squirrel} className="Squirrel animated infinite swing" alt="Squirrel"></img>
            <p className="PortfolioDescription">Squirrel Website</p>
          </a>
        </div>
        <div className="PortfolioItem3">
          <a href="http://52.221.226.37:3000/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={SuperLaundry} className="SuperLaundry animated infinite jello" alt="Super Laundry"></img>
            <p className="PortfolioDescription">Super Laundry Website</p>
          </a>
        </div>
        <div className="PortfolioItem4">
          <a href="https://isaackps.github.io/Super-Game/" target= "_blank" rel="noreferrer noopener" className="link">
            <img src={SpaceInvaders} className="SpaceInvaders animated infinite pulse" alt="Super Space Destroy-YA!"></img>
            <p className="PortfolioDescription">Super Space Destroy-YA! Game Webpage</p>
          </a>
        </div>
      </div>
    );
  }
}

Portfolio.propTypes = {
};
