'use strict'

var React = require('react');
var _ = require('lodash');

var BS = require('react-bootstrap');
var Button = BS.Button;
var Glyphicon = BS.Glyphicon;
var ModalTrigger = BS.ModalTrigger;
var TabbedArea = BS.TabbedArea;
var Button = BS.Button;
var Modal = BS.Modal;
var Input = BS.Input;

var Context = require('context');
var context = new Context(window.location.hostname, 'ws', 19000);
var rpc = context.rpc;

var fileOptions = [];
rpc.call("TableSrv.show_data", [])
		.then(function(filelist){
			fileOptions = filelist;
		});
	
var selected = [];

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    tables: {},
	    label: "Select files to open:",
	    bsStyle: "default"
	};
    },

    clickSubmitButton: function(ev){
		var options = select && select.options;
  		for (var i=0, iLen=options.length; i<iLen; i++) {
    		if (options[i].selected) selected.push(options[i]);
  		}
    },

    render: function() {
	var loadFileMenuData = this.loadFileMenuData; 
	var filesMenuServer = this.filesMenuServer; 
	var onLoadData = this.props.onLoadData;
	var onFilesServer = this.props.onFilesServer;
	var currentState = this.props.currentState;	

	rpc.call("TableSrv.show_data", [])
		.then(function(filelist){
			fileOptions = filelist;
			console.log("SHOW DATAAA", fileOptions);
	});

	var self = this;
	var sizeSelect = 20; //Max size of the select menu
	if(fileOptions.length < sizeSelect) sizeSelect = fileOptions.length;

	var selectMenu;
	if(fileOptions.length === 0) selectMenu = React.createElement(Input, {type:"text", value:"No files on the server", disabled:"disabled"});
	else selectMenu = React.createElement("select", {multiple:"multiple", style: {background: "transparent", fontSize:"14px", margin:"0 auto", width:"100%"},id: "sel", size: sizeSelect},
			//rpc.call("TableSrv.show_data", []).then(function(names){fileOptions = names.sort(); console.log("SHOW DATA:", fileOptions)}),
			fileOptions.sort().map(function(option, i){
				console.log("OPTION:", option);
				return (
					React.createElement("option", {style: {padding: "5px"}, value: option}, option)
				);
			})	
		);

	return (

        <Modal {...this.props} bsSize="large" title="Open server files" animation={true}>
	      <div className='modal-body'>
		  	<form id="openAddForm" style={{"position": "relative", "width": "50%", "height":"80%", "margin": "0 auto", "left": "0px", "right": "0px"}}>
		  		<input type="radio" name="radioSelect" id="rOpen" defaultChecked={true}> Open </input>
		  		<input type="radio" name="radioSelect" id="rAdd" defaultChecked={true}> Add </input>
			</form>
		
		
	      </div>
	      <div className='modal-footer'>
			<Button onClick={this.props.onRequestHide}>Close</Button>
			<Button onClick={this.handleCreateCard}  bsStyle="primary">Create Card</Button>
	      </div>
	    </Modal>
	)
    }

});
