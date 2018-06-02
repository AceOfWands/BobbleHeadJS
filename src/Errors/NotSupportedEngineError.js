import FrameworkError from './FrameworkError.js';

export default class NotSupportedEngineError extends FrameworkError{
	constructor(){
		super('Current Javascript Engine doesn\'t support the framework.');
	}
};