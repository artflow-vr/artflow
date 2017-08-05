let VRControls = require( './vr-controls' );
let FPSControls = require( './fps-controls' );
let TeleporterController = require( './teleporter-control' );

let controls = {};
controls.VRControls = VRControls;
controls.FPSControls = FPSControls;
controls.TeleporterController = TeleporterController;

module.exports = controls;
