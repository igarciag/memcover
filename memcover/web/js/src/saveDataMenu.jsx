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
	    label: "Save dataset",
	    bsStyle: "default"
	};
    },

    render: function() {
	var self = this;
	var onSaveData = this.props.onSaveData;		
	var currentState = this.props.currentState;
	var tableName = Object.keys(this.props.currentState.tables)[0];
	var datasetName = (currentState.tables[tableName].dataset_name != null) ? currentState.tables[tableName].dataset_name : "";

	return (

        <Modal {...this.props} bsSize="large" title="Save dataset" animation={true}>
	      <div class="modal-body"> 
				<div style={{"position": "relative", "width": "40%", "margin": "0 auto", "marginBottom": "20px"}}>
					<label> Dataset name </label>
					<Input type="text" id="tableName" defaultValue={datasetName} onChange={function (ev){
							datasetName = ev.target.value;
						}
					}/>			
				</div>
				<div className='modal-footer'>
					<Button onClick={this.props.onHide}> Cancel </Button>
					<Button onClick={function(ev) {
						if(datasetName == null || datasetName == ""){ alert("Please, set a name to dataset"); return; }
						
						// Save the dataset
						onSaveData(datasetName, currentState.tables[tableName].data, currentState.tables[tableName].schema);
						//currentState.tables[tableName].dataset_name = datasetName;
						self.props.onHide();
					}} bsStyle="primary"> OK </Button>
	      		</div>
	      	</div>
	    </Modal>
	)
    }

});
