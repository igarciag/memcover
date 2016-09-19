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

module.exports = React.createClass({

    getDefaultProps: function() {
	return {
	    tables: {},
	    label: "Select files to open:",
	    bsStyle: "default"
	};
    },

    render: function() {
		var onImportSchema = this.props.onImportSchema;
		var self = this;

		return (
			<Modal {...this.props} bsSize="large" title="Open server files" animation={true}>
				<div className='modal-body'>
					<div className="container">
						<h4>Imported data file correctly<br/>
						Do you want to import the associated schema (.json)?</h4>
					</div>
				</div>
				<div className='modal-footer'>
					<Button onClick={this.props.onHide}> Cancel </Button>
					<label className="btn btn-primary"> OK
						<input style={{"display":"none"}} type="file" accept=".json" ref="importFileSchema" onChange={function(ev) { onImportSchema(ev); self.props.onHide(); }}/>
            		</label>
				</div>
			</Modal>
		)
    }
});
