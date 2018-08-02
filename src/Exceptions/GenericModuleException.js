import FrameworkException from './FrameworkException.js';

export default class GenericModuleException extends FrameworkException{
	constructor(message){
		super(message);
	}
};