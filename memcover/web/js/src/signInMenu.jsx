'use strict'

var React = require('react');
var _ = require('lodash');

var BS = require('react-bootstrap');
var Button = BS.Button;
var Glyphicon = BS.Glyphicon;
var ModalTrigger = BS.ModalTrigger;
var Input = BS.Input;

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    label: "Login",
	    bsStyle: "default"
	};
    },

    render: function() {
	var currentState = this.props.currentState;

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length,c.length);
			}
		}
		return "";
	}

	var c_username = getCookie("username");
	var self = this;
	
	if(currentState.logged == true) {
		this.props.label = "Hi, "+currentState.username;
		return (
			<BS.DropdownButton className={this.props.className} 
				style={this.props.style} 
				bsStyle={this.props.bsStyle}
				title={this.props.label}>
				<BS.MenuItem> Change password </BS.MenuItem>
				<BS.MenuItem> Preferences </BS.MenuItem>
				<BS.MenuItem> ... </BS.MenuItem>
				<li className="divider"></li>
				<BS.MenuItem> Close session </BS.MenuItem>
            </BS.DropdownButton>
		)
	} else {
		return (

			<BS.DropdownButton id="login_dropdown" className={this.props.className} 
				style={this.props.style} 
				bsStyle={this.props.bsStyle}
				title={this.props.label}>
				<div id="login_div" style={{"width": "250px"}}>
						<div style={{"position": "relative", "width": "80%", "margin": "0 auto"}}>
							<div className="input-group" style={{"marginTop":"15px"}}>
								<span className="input-group-addon">
									<i className="glyphicon glyphicon-user"></i>
								</span>
								<input id="username" type="text" className="form-control" placeholder="Username" defaultValue={c_username}/>
							</div>
							<div className="input-group" style={{"marginTop":"10px"}}>
								<span className="input-group-addon">
									<i className="glyphicon glyphicon-lock"></i>
								</span>
								<input id="pass" type="password" className="form-control" placeholder="Password"/>
							</div>
							<div style={{"marginTop":"10px"}}>
								<input id="remember" style={{"float": "left", "marginRight": "10px"}} type="checkbox" value="1"/>
								<label class="string optional" for="user_remember_me"> Remember me</label>
							</div>
							<BS.MenuItem>
							<Button class="btn btn-primary" type="submit" style={{"clear": "left", "width": "100%", "height": "32px", "fontSize": "13px", "marginTop":"10px", "marginBottom":"7px"}} bsStyle="primary" onClick={function(ev) {
								var e_error = document.getElementById("login_error");
								var e_username = document.getElementById("username").value;
								var e_pass = document.getElementById("pass").value;
								var e_remember = document.getElementById("remember").checked;
								//if(e_username != "admin" || e_pass != "admin"){ e_error.style.display = 'block'; return; }
								console.log("LOGIN CORRECT");
								if(e_remember) document.cookie = "username="+e_username;
								e_error.style.display = 'none';
								currentState.username = e_username;
								currentState.logged = true;
								//window.location = "success.html";
								//document.getElementById("login_div").style.display = 'none';
							}}> Sign In </Button>
							</BS.MenuItem>
							<div id="login_error" style={{"display":"none"}}>
								<i id="login_error_icon" className="glyphicon glyphicon-remove"></i>
								<label className="string optional" for="login_error_icon" style={{"marginLeft":"3px", "fontWeight": "normal", "fontSize":"13px", "color":"red"}}> Invalid username or password </label>
							</div>
							<div id="login_ok" style={{"display":"none"}}>
								<i id="login_ok_icon" className="glyphicon glyphicon-ok-sign"></i>
								<label className="string optional" for="login_ok_icon" style={{"marginLeft":"3px", "fontWeight": "normal", "fontSize":"13px", "color":"green"}}> Invalid username or password </label>
							</div>					
						</div>
				</div>
            </BS.DropdownButton>
		);
	}
	}

});
