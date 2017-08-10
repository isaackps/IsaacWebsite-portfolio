import React, {Component} from 'react';
import { elastic as Menu } from 'react-burger-menu';

import './BurgerMenu.css';

export default class BurgerMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }
  }

  onClick = () => {
    this.setState({
      isOpen: false
    })
  }

  render() {
    return (
      <Menu right isOpen={this.state.isOpen}>
        <a id="home" className="menu-item" href="#top" onClick={this.onClick}>Home</a>
        <a id="home" className="menu-item" href="#top" onClick={this.onClick}>About</a>
        <a id="home" className="menu-item" href="#top" onClick={this.onClick}>Portfolio</a>
        <a id="home" className="menu-item" href="#top" onClick={this.onClick}>Contact</a>
      </Menu>
    );
  }
}

BurgerMenu.propTypes = {
};
