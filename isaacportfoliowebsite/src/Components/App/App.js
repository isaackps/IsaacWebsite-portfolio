import React, { Component } from 'react';
//import { BrowserRouter, Router, Link } from 'react-router-dom';
import Header from '../Header/Header';
import Menu from '../BurgerMenu/BurgerMenu';
import Video from '../VideoBG/VideoBG';
import About from '../About/About';
import Portfolio from '../Portfolio/Portfolio';
import Contact from '../Contact/Contact';
import Footer from '../Footer/Footer';

import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div id="outer-container">
          <Menu pageWrapId={ "page-wrap"} outerContainerId={ "outer-container" }/>
          <main id="page-wrap">
            <Header/>
            <Video/>
            <About/>
            <Portfolio/>
            <Contact/>
            <Footer/>
          </main>
        </div>
      </div>
    );
  }
}

export default App;
