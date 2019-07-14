import React from 'react';
import githubLogo from '../../github-logo.jpg';
import linkedinLogo from '../../LinkedIn-Logo.png';


import './Contact.css';

export default class Contact extends React.Component {
  render() {
    return (
      <div id="Contact" className="ContactBG">
        <h1 className="contactTitle">Contact</h1>
        <h2 className="contactSubTitle">Feel free to contact me!</h2>
        <div className="contactContent">
          <a href="mailto:isaac.kps@gmail.com?Subject=Hello!!" target="_top">
            <div className="contactLeft">
              <h4 className="ContactDetail">Email: <span>isaac.kps@gmail.com</span></h4>
            </div>
          </a>
          <a href="https://github.com/isaackps" target= "_blank" rel="noreferrer noopener">
            <div className="contactMid">
              <img src={githubLogo} className="Logo" alt='gitHub logo'/>
              <p className="ContactDetail2">Github</p>
            </div>
          </a>
          <a href="https://www.linkedin.com/in/isaackoh89/" target= "_blank" rel="noreferrer noopener">
            <div className="contactRight">
              <img src={linkedinLogo} className="Logo" alt='linkedIn logo'/>
              <p className="ContactDetail2">LinkedIn</p>
            </div>
          </a>
        </div>
      </div>
    );
  }
}

Contact.propTypes = {
};
