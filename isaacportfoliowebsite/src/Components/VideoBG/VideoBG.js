import React, {Component} from 'react';

import './VideoBG.css';

export default class VideoBG extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videoURL: "https://dl.dropboxusercontent.com/s/y3b6jsznxuae496/Hello.mp4?dl=0"
    }
  }

  render() {
    return (
      <video id="backgroundVideo" loop autoPlay muted>
        <source src={this.state.videoURL} type="video/mp4" />
      </video>
    );
  }
}

VideoBG.propTypes = {
};
