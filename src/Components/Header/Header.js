import React from 'react';
import logo from '../../logo.png';
import '../../animate.css';

import './Header.css';

export default class Header extends React.Component {
  render() {
    return (
      <div>
        <div className="App-header" id="top">
          <a href="#Top">
            <img src={logo} className="App-logo animated bounceIn" alt="logo" />
          </a>
        </div>
      </div>
    );
  }
}

Header.propTypes = {
};
