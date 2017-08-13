'use strict';

let ModuleManager = require( './module-manager' );
let ControlModule = require( './control-module' );
let ToolModule = require( './tool-module' );

ModuleManager.register( 'control', ControlModule );
ModuleManager.register( 'tool', ToolModule );

let modules = module.exports;
modules.ModuleManager = ModuleManager;
