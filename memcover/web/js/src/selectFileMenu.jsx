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
var fileOptionsSchema = [];
var fileOptionsAll = [];
var accept_data_ext = ['csv', 'xls', 'xlsx']
var accept_schema_ext = ['json']
rpc.call("TableSrv.show_data", [])
	.then(function(filelist){
		fileOptionsAll = filelist;
		for(var i=0; i<fileOptionsAll.length; i++){
			if(accept_data_ext.indexOf(fileOptionsAll[i].split('.').pop()) != -1) fileOptions.push(fileOptionsAll[i]);
			if(accept_schema_ext.indexOf(fileOptionsAll[i].split('.').pop()) != -1) fileOptionsSchema.push(fileOptionsAll[i]);
		}
	});

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    tables: {},
	    label: "Select files to open:",
	    bsStyle: "default"
	};
    },

    render: function() {
		var loadFileMenuData = this.loadFileMenuData; 
		var filesMenuServer = this.filesMenuServer; 
		var onLoadData = this.props.onLoadData;
		var onFilesServer = this.props.onFilesServer;
		var currentState = this.props.currentState;

		var fileOptionsOld = fileOptions;
		var fileOptionsSchemaOld = fileOptionsSchema;

		var self = this;

		rpc.call("TableSrv.show_data", [])
		.then(function(filelist){
			fileOptionsAll = filelist;
			fileOptions = [];
			fileOptionsSchema = [];
			for(var i=0; i<fileOptionsAll.length; i++){
				if(accept_data_ext.indexOf(fileOptionsAll[i].split('.').pop()) != -1) fileOptions.push(fileOptionsAll[i]);
				if(accept_schema_ext.indexOf(fileOptionsAll[i].split('.').pop()) != -1) fileOptionsSchema.push(fileOptionsAll[i]);
			}
			if(fileOptionsOld.length != fileOptions.length || fileOptionsSchemaOld.length != fileOptionsSchema.length) {
				self.forceUpdate(); // Avoid recursive
			}
		});

		var sizeSelect = 10; //Max size of the select menu
		var sizeSelectSchema = 10; //Max size of the select menu
		if(fileOptions.length < sizeSelect) sizeSelect = fileOptions.length;
		if(fileOptionsSchema.length < sizeSelectSchema) sizeSelectSchema = fileOptionsSchema.length;

		var selectFileData;
		if(fileOptions.length === 0){
			selectFileData = <Input type="text" value="No data files on the server" disabled="disabled"/>;
		} else {
			selectFileData = <select multiple="multiple" id="selData" size={sizeSelect} style={{"background":"transparent", "fontSize":"14px", "margin":"0 auto", "width":"100%"}} onDblClick={function(){ alert("DOUBLE_CLICK"); }}>
				{fileOptions.sort().map(function(option, i){
					return (
						<option value={option} style={{"padding":"5px"}}>{option}</option>
					);
				})}
			</select>;
		}

		var selectFileSchema;
		if(fileOptionsSchema.length === 0){
			selectFileSchema = <Input type="text" value="No schema files on the server" disabled="disabled"/>;
		} else {
			selectFileSchema = <select multiple="multiple" id="selSchema" size={sizeSelectSchema} style={{"background":"transparent", "fontSize":"14px", "margin":"0 auto", "width":"100%"}}>
				{fileOptionsSchema.sort().map(function(option, i){
					return (
						<option value={option} style={{"padding":"5px"}}>{option}</option>
					);
				})}
			</select>;
		}

		return (
			<Modal {...this.props} bsSize="large" title="Open server files" animation={true}>
				<div className='modal-body'>
					<form id="openAddForm" style={{"position": "relative", "width": "50%", "height":"80%", "margin": "0 auto", "left": "0px", "right": "0px"}}>
						<input type="radio" name="radioSelect" id="rOpen" value="Open" defaultChecked={true}/>
						<label for="rOpen" title="Open new data removing current dataset">Open new</label>
						<input type="radio" name="radioSelect" id="rAdd" value="Add" defaultChecked={false} style={{"marginLeft": "15px"}}/>
						<label for="rAdd" title="Add data to current dataset">Add to current</label>
					</form>
					<div style={{position: "relative", width: "50%", margin: "0 auto"}}>
						<h4 style={{"margin": "20px 0 10px 0"}}> Data files: </h4>
						{selectFileData}			
						<h4 style={{"margin": "20px 0 10px 0"}}> Schema files (optional): </h4>
						{selectFileSchema}
					</div>
		
				</div>
				<div className='modal-footer'>
					<Button onClick={this.props.onHide}> Close </Button>
					<ModalTrigger modal={<EditorSchemaMenu onSaveSchema={this.props.onSaveSchema} currentState={this.props.currentState} propsSelectFile={this.props} selected={document.getElementById('selData')}/>}>
						<Button onClick={function(ev) {
							var open = document.getElementById('rOpen').checked;
							var selected = [];
							var selectedSchema = [];
							var sel1 = document.getElementById('selData');
							for (var i=0, iLen=sel1.options.length; i<iLen; i++) if (sel1.options[i].selected) selected.push(sel1.options[i].value);
							var sel2 = document.getElementById('selSchema');
							if(sel2 != null) for (var i=0, iLen=sel2.options.length; i<iLen; i++) if (sel2.options[i].selected) selectedSchema.push(sel2.options[i].value);
							onLoadData(selected, selectedSchema, open, fileOptionsAll);
							//self.props.onHide();
							}} bsStyle="primary"> OK </Button>
					</ModalTrigger>
				</div>
			</Modal>
		)
    }
});
