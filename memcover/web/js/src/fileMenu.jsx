'use strict'

var React = require('react');
var _ = require('lodash');

var BS = require('react-bootstrap');
var Button = BS.Button;
var Glyphicon = BS.Glyphicon;
var ModalTrigger = BS.ModalTrigger;

var SelectFileMenu = require('./selectFileMenu');
var SaveDataMenu = require('./saveDataMenu');
var EditorSchemaMenu = require('./editorSchemaMenu');
var ImportSchemaMenu = require('./importSchemaMenu');

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    tables: {},
	    label: "File",
	    bsStyle: "default"
	};
    },

    importFileMenuData: function(){
		console.log("this.refs.importFileData.getDOMNode():", this.refs.importFileData.getDOMNode());
		//this.refs..getDOMNode().click();
		React.findDOMNode(this.refs.importFileData).click();
    },

    render: function() {
	var importFileMenuData = this.importFileMenuData;
	var onLoadData = this.props.onLoadData;
	var onImportData = this.props.onImportData;
	var onImportSchema = this.props.onImportSchema;
	var onSaveSchema = this.props.onSaveSchema;
	var onSaveData = this.props.onSaveData;
	var onExportCsv = this.props.onExportCsv;
	var onExportSchema = this.props.onExportSchema;
	var onExportExcel = this.props.onExportExcel;
	var currentState = this.props.currentState;
	var tableName = Object.keys(this.props.currentState.tables)[0];
	
	return (

			<BS.DropdownButton className={this.props.className} 
				style={this.props.style} 
				bsStyle={this.props.bsStyle}
				title={this.props.label}>
	
				<ModalTrigger modal={<SelectFileMenu onLoadData={this.props.onLoadData} onSaveSchema={this.props.onSaveSchema} currentState={this.props.currentState}/>}>
					<BS.MenuItem> Open from server</BS.MenuItem>		  
				</ModalTrigger>
				
				<ModalTrigger modal={<SaveDataMenu onSaveData={this.props.onSaveData} currentState={this.props.currentState}/>}>
					<BS.MenuItem> Save on server </BS.MenuItem>		  
				</ModalTrigger>

				<ModalTrigger modal={<EditorSchemaMenu datasetName={this.props.currentState.tables[tableName].dataset_name} onSaveSchema={this.props.onSaveSchema} currentState={this.props.currentState}/>}>
					<BS.MenuItem> Edit data schema </BS.MenuItem>		  
				</ModalTrigger>
 				
				 <li className="divider"></li>

				<BS.MenuItem onSelect={importFileMenuData}> Import local files to server </BS.MenuItem>
				<input style={{"display":"none"}} type="file" multiple="multiple" accept=".csv, .xlsx, .xls, .json" ref="importFileData" onChange={onImportData}/>
			
				{
				_.values(this.props.tables).map(function(table, i) {
					return(
								<BS.MenuItem eventKey={i} onSelect={ onExportCsv.bind(this, table) }> 
					Export data to local (csv)
					</BS.MenuItem>
					)
				})
				}
				{
				_.values(this.props.tables).map(function(table, i) {
					return(
								<BS.MenuItem eventKey={i} onSelect={ onExportExcel.bind(this, table) }> 
					Export data to local (xlsx)
					</BS.MenuItem>
					)
				})
				}
				<BS.MenuItem onSelect={onExportSchema}> Export current schema (json) </BS.MenuItem>
            </BS.DropdownButton>
	)
    }

});
