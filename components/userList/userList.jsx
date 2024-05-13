import * as React from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText } from "@material-ui/core";
import "./userList.css";
import axios from "axios";
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: null,
    };
  }

  componentDidMount() {
    const url = "http://localhost:3000/user/list";

    axios.get(url)
      .then((response) => {
        console.log("** Succes: fetched data from " + url +" **");
        this.setState({ users: response.data });
      })
      .catch((error) => {
        if (error.response) {
          console.log(
            "** Error: status code from server is out of the range of 2xx. **\n",
            error.response.status
          );
        } else if (error.request) {
          console.log(
            "** Error: request was made and no response was received. **\n",
            error.request
          );
        } else {
          console.log(
            "** Error: something happened in the setting up the request. **\n",
            error.message
          );
        }
      });

  }

  render() {
    let userList; // <Link> component

    if (this.state.users) {
      userList = this.state.users.map((user) => (
        <ListItem
          to={`/users/${user._id}`}
          component={Link}
          key={user._id}
          divider
          button
        >
          {/* Link's to must be direct link address */}
          <ListItemText primary={user.first_name + " " + user.last_name} />
        </ListItem>
      ));
    } else {
      userList = (
        <ListItem>Loading User List on &quot;userList.jsx&quot;</ListItem>
      );
    }

    return <List component="nav">{userList}</List>;
  }
}

export default UserList;