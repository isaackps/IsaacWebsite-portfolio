import React, { Component} from 'react';
import logo from '../../logo.png';
import '../../animate.css';

import './Header.css';

export default class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="App-header" id="top">
          <img src={logo} className="App-logo animated bounceIn" alt="logo" />
        </div>
      </div>
    );
  }
}

Header.propTypes = {
};
