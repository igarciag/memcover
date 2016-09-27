'use strict'

var React = require('react');
var _ = require('lodash');

var BS = require('react-bootstrap');

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    tables: {},
	    label: "Analysis",
	    header: "Export to Excel",
	    bsStyle: "default"
	};
    },

    openFileMenu: function(){
	this.refs.openFile.getDOMNode().click();
    },

    render: function() {
	var openFileMenu = this.openFileMenu; 
	var onSave = this.props.onSave;
	var onOpen = this.props.onOpen;
	var onExport = this.props.onExport;
	var header = this.props.header;
	return (

            <BS.DropdownButton className={this.props.className} 
		    style={this.props.style} 
		    bsStyle={this.props.bsStyle} 
		    title={this.props.label}>

	      <BS.MenuItem onSelect={openFileMenu}> Open analysis </BS.MenuItem>
	      <input style={{"display":"none"}} type="file" ref="openFile" onChange={onOpen}/>
	      <BS.MenuItem onSelect={onSave}> Save analysis </BS.MenuItem>
            </BS.DropdownButton>
	)
    }

});
