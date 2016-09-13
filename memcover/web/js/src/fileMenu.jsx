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

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    tables: {},
	    label: "X",
	    header: "Export to Excel",
	    bsStyle: "default"
	};
    },

    importFileMenuData: function(){
	this.refs.importFileData.getDOMNode().click();
    },

    render: function() {
	var importFileMenuData = this.importFileMenuData;
	var onLoadData = this.props.onLoadData;
	var onImportData = this.props.onImportData;
	var onSaveSchema = this.props.onSaveSchema;
	var onSaveData = this.props.onSaveData;
	var onExportCsv = this.props.onExportCsv;
	var onExportExcel = this.props.onExportExcel;
	var header = this.props.header;
	var currentState = this.props.currentState;
	var tableName = Object.keys(this.props.currentState.tables)[0];
	
	return (

			<BS.DropdownButton className={this.props.className} 
				style={this.props.style} 
				bsStyle={this.props.bsStyle}
				title={this.props.label}>

				<BS.MenuItem onSelect={importFileMenuData}> Import </BS.MenuItem>
				<input style={{"display":"none"}} type="file" multiple="multiple" accept=".csv, .xlsx, .xls" ref="importFileData" onChange={onImportData}/>
				
				<ModalTrigger modal={<SelectFileMenu onLoadData={this.props.onLoadData} onSaveSchema={this.props.onSaveSchema} currentState={this.props.currentState}/>}>
					<BS.MenuItem> Open </BS.MenuItem>		  
				</ModalTrigger>
				
				<ModalTrigger modal={<SaveDataMenu onSaveData={this.props.onSaveData} currentState={this.props.currentState}/>}>
					<BS.MenuItem> Save data </BS.MenuItem>		  
				</ModalTrigger>

				<ModalTrigger modal={<EditorSchemaMenu datasetName={this.props.currentState.tables[tableName].dataset_name} onSaveSchema={this.props.onSaveSchema} currentState={this.props.currentState}/>}>
					<BS.MenuItem> Edit schema </BS.MenuItem>		  
				</ModalTrigger>

				{
				_.values(this.props.tables).map(function(table, i) {
					return(
								<BS.MenuItem eventKey={i} onSelect={ onExportCsv.bind(this, table) }> 
					Export to CSV
					</BS.MenuItem>
					)
				})
				}
				{
				_.values(this.props.tables).map(function(table, i) {
					return(
								<BS.MenuItem eventKey={i} onSelect={ onExportExcel.bind(this, table) }> 
					Export to Excel
					</BS.MenuItem>
					)
				})
				}
            </BS.DropdownButton>
	)
    }

});
