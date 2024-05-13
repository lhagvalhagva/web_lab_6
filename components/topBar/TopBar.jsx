import React, { Component } from 'react'; 

import { AppBar, Toolbar, Typography } from '@material-ui/core';
import './TopBar.css';
import axios from "axios";

class TopBar extends Component {
  constructor(props) {
    super(props);
    this.state = {};

  }

  componentDidMount() {


    const url = "http://localhost:3000/test/info";

    axios.get(url)
      .then(()=>{
      console.log("** Succes: fetched data from " + url +" **");

    }).catch(error => {
      if (error.response) {
        console.log("** Error: status code from server is out of the range of 2xx. **\n", error.response.status);
      } else if (error.request) {
        console.log("** Error: request was made and no response was received. **\n", error.request);
      } else {
        console.log("** Error: something happened in the setting up the request. **\n", error.message);
      }
    });
  }

  render() {
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          <Typography variant="h5" style={{flexGrow: 1}}>
            22b1num7166
          </Typography>
          <Typography variant="h5">
            { this.props.match.path.includes("/photos/") && "Photos of " }
            { this.props.match.path.includes("/users/") && "Info of " }
            { this.props.match.params.userId && `${this.props.userName}` }
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
