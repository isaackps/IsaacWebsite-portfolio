import React, {Component} from 'react';
import FooterLogo from '../../Isaaclogo.png'

import './Footer.css';

export default class Footer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="footerBG">
        <img src={FooterLogo} className='footerLogo'/>
        <h5 className='footerContent'>Designed by Isaac Koh, Portfolio 2017</h5>
      </div>);
  }
}

Footer.propTypes = {
};
