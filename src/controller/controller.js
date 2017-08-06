let FPSControls = require( './fps-controller' );
let TeleporterController = require( './teleporter-controller' );

require( './vive-controller' );

let controller = {};
controller.FPSControls = FPSControls;
controller.TeleporterController = TeleporterController;

module.exports = controller;
