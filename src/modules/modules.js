import ModuleManager from './module-manager';
import ControlModule from './control-module';
import ToolModule from './tool-module';

ModuleManager.register( 'control', ControlModule );
ModuleManager.register( 'tool', ToolModule );

export {
    ModuleManager,
    ControlModule,
    ToolModule
};
