import React from 'react';
import FooterLogo from '../../Isaaclogo.png'

import './Footer.css';

export default class Footer extends React.Component {
  render() {
    return (
      <div className="footerBG">
        <img src={FooterLogo} className='footerLogo' alt='footer logo'/>
        <h5 className='footerContent'>Designed by Isaac Koh, Portfolio 2017</h5>
      </div>);
  }
}

Footer.propTypes = {
};
