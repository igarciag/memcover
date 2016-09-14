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

var EditorSchemaMenu = require('./editorSchemaMenu');

var Context = require('context');
var context = new Context(window.location.hostname, 'ws', 19000);
var rpc = context.rpc;

var fileOptions = [];
var fileOptionsAll = [];
var accept_data_ext = ['csv', 'xls', 'xlsx']
rpc.call("TableSrv.show_data", [])
	.then(function(filelist){
		fileOptionsAll = filelist;
		for(var i=0; i<fileOptionsAll.length; i++){
			if(accept_data_ext.indexOf(fileOptionsAll[i].split('.').pop()) != -1) fileOptions.push(fileOptionsAll[i]);
		}
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

		var fileOptionsOld = fileOptions;

		var self = this;

		rpc.call("TableSrv.show_data", [])
		.then(function(filelist){
			fileOptionsAll = filelist;
			fileOptions = [];
			for(var i=0; i<fileOptionsAll.length; i++){
				if(accept_data_ext.indexOf(fileOptionsAll[i].split('.').pop()) != -1) fileOptions.push(fileOptionsAll[i]);
			}
			if(fileOptionsOld.length != fileOptions.length) {
				self.forceUpdate(); // Avoid recursive
				self.forceUpdate(); // Avoid recursive
			}
		});

		var sizeSelect = 20; //Max size of the select menu
		if(fileOptions.length < sizeSelect) sizeSelect = fileOptions.length;

		var selectFile;
		if(fileOptions.length === 0){
			selectFile = <Input type="text" value="No files on the server" disabled="disabled"/>;
		} else {
			selectFile = <select multiple="multiple" id="sel" size={sizeSelect} style={{"background":"transparent", "fontSize":"14px", "margin":"0 auto", "width":"100%"}}>
				{fileOptions.sort().map(function(option, i){
					return (
						<option value={option} style={{"padding":"5px"}}> {option} </option>
					);
				})}
			</select>;
		}

		return (
			<Modal {...this.props} bsSize="large" title="Open server files" animation={true}>
				<div className='modal-body'>
					<form id="openAddForm" style={{"position": "relative", "width": "50%", "height":"80%", "margin": "0 auto", "left": "0px", "right": "0px"}}>
						<input type="radio" name="radioSelect" id="rOpen" defaultChecked={true}> Open </input>
						<input type="radio" name="radioSelect" id="rAdd" defaultChecked={false}> Add </input>
					</form>
					<div style={{position: "relative", width: "50%", margin: "0 auto", top: "10px"}}>
						{selectFile}
					</div>
		
				</div>
				<div className='modal-footer'>
					<Button onClick={this.props.onHide}> Close </Button>
					<ModalTrigger modal={<EditorSchemaMenu onSaveSchema={this.props.onSaveSchema} currentState={this.props.currentState} propsSelectFile={this.props} selected={document.getElementsByTagName('select')[0]}/>}>
						<Button onClick={function(ev) {
							var open = document.getElementById('rOpen').checked;
							selected = [];
							var sel1 = document.getElementsByTagName('select')[0];
							for (var i=0, iLen=sel1.options.length; i<iLen; i++) if (sel1.options[i].selected) selected.push(sel1.options[i].value);
							//if(selected.length == 0) {alert("Please, select files to open\n"); return;}
							onLoadData(selected, open, fileOptionsAll);
							//self.props.onHide();
							}} bsStyle="primary"> OK </Button>
					</ModalTrigger>
				</div>
			</Modal>
		)
    }
});
