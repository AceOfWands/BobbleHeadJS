'use strict';
import Session from './Session.js';
import UserPool from './UserPool.js';
import User from './User.js';
import Role from './Role.js';
import RolePool from './RolePool.js';
import Response from './Response.js';
import Request from './Request.js';
import GenericConfiguration from './GenericConfiguration.js';
import Model from './Model.js';
import ModelInstance from './ModelInstance.js';
import ModelPool from './ModelPool.js';
import Route from './Route.js';
import Router from './Router.js';
import Page from './Page.js';
import PageContext from './PageContext.js';
import AccessController from './AccessController.js';
import AuthenticationMethod from './AuthenticationMethod.js';
import AuthenticationMethods from './AuthenticationMethods.js';
import InternalConnector from './InternalConnector.js';
import ExternalConnector from './ExternalConnector.js';
import GenericConnector from './GenericConnector.js';
import Cacher from './Cacher.js';
import PageBuilder from './PageBuilder.js';
import PageFactory from './PageFactory.js';
import Module from './Module.js';
import ModulePool from './ModulePool.js';
import VirtualPage from './VirtualPage.js';
import Database from './Database.js';
import AppController from './AppController.js';
import XMLParser from './XMLParser.js';
import Context from './Context.js';
import FrameworkException from './Exceptions/FrameworkException.js';
import FrameworkError from './Errors/FrameworkError.js';
import FrameworkEvent from './Events/FrameworkEvent.js';
import CacherLoadedEvent from './Events/CacherLoadedEvent.js';
import AccessControllerLoadedEvent from './Events/AccessControllerLoadedEvent.js';
import PageReadyEvent from './Events/PageReadyEvent.js';
import * as Util from './Util.js';
import ConnectorRequest from './ConnectorRequest.js';
import CacherRequest from './CacherRequest.js';
import ModuleConfiguration from './ModuleConfiguration.js';
import PageConfiguration from './PageConfiguration.js';
import PageNotFoundException from './Exceptions/PageNotFoundException.js';
import RedirectException from './Exceptions/RedirectException.js';
import NotSupportedException from './Exceptions/NotSupportedException.js';
import UnauthorizedException from './Exceptions/UnauthorizedException.js';
import InvalidRouteException from './Exceptions/InvalidRouteException.js';
import ControllerNotFoundException from './Exceptions/ControllerNotFoundException.js';
import ModelNotFoundException from './Exceptions/ModelNotFoundException.js';
import InvalidAuthenticationMethodException from './Exceptions/InvalidAuthenticationMethodException.js';
import GenericModuleException from './Exceptions/GenericModuleException.js';
import NotSupportedEngineError from './Errors/NotSupportedEngineError.js';

export default (function(){
	var BobbleHead = {};
	Object.defineProperties(BobbleHead, {
		UserPool: {
			value: UserPool,
			writable: false
		},
		User: {
			value: User,
			writable: false
		},
		Role: {
			value: Role,
			writable: false
		},
		RolePool: {
			value: RolePool,
			writable: false
		},
		Session: {
			value: Session,
			writable: false
		},
		Response: {
			value: Response,
			writable: false
		},
		Request: {
			value: Request,
			writable: false
		},
		ConnectorRequest: {
			value: ConnectorRequest,
			writable: false
		},
		CacherRequest: {
			value: CacherRequest,
			writable: false
		},
		GenericConfiguration: {
			value: GenericConfiguration,
			writable: false
		},
		ModuleConfiguration: {
			value: ModuleConfiguration,
			writable: false
		},
		PageConfiguration: {
			value: PageConfiguration,
			writable: false
		},
		Model: {
			value: Model,
			writable: false
		},
		ModelInstance: {
			value: ModelInstance,
			writable: false
		},
		ModelPool: {
			value: ModelPool,
			writable: false
		},
		Route: {
			value: Route,
			writable: false
		},
		Router: {
			value: Router,
			writable: false
		},
		Page: {
			value: Page,
			writable: false
		},
		PageContext: {
			value: PageContext,
			writable: false
		},
		AccessController: {
			value: AccessController,
			writable: false
		},
		AuthenticationMethod: {
			value: AuthenticationMethod,
			writable: false
		},
		AuthenticationMethods: {
			value: AuthenticationMethods,
			writable: false
		},
		InternalConnector: {
			value: InternalConnector,
			writable: false
		},
		ExternalConnector: {
			value: ExternalConnector,
			writable: false
		},
		GenericConnector: {
			value: GenericConnector,
			writable: false
		},
		Cacher: {
			value: Cacher,
			writable: false
		},
		PageBuilder: {
			value: PageBuilder,
			writable: false
		},
		PageFactory: {
			value: PageFactory,
			writable: false
		},
		Module: {
			value: Module,
			writable: false
		},
		ModulePool: {
			value: ModulePool,
			writable: false
		},
		VirtualPage: {
			value: VirtualPage,
			writable: false
		},
		Database: {
			value: Database,
			writable: false
		},
		AppController: {
			value: AppController,
			writable: false
		},
		XMLParser: {
			value: XMLParser,
			writable: false
		},
		Context: {
			value: Context,
			writable: false
		},
		defaultCallback: {
			value: Util.defaultCallback,
			writable: false
		},
		Exceptions: {
			value: {
				get FrameworkException(){return FrameworkException},
				set FrameworkException(x){},
				get GenericModuleException(){return GenericModuleException},
				set GenericModuleException(x){},
				get PageNotFoundException(){return PageNotFoundException},
				set PageNotFoundException(x){},
				get RedirectException(){return RedirectException},
				set RedirectException(x){},
				get NotSupportedException(){return NotSupportedException},
				set NotSupportedException(x){},
				get UnauthorizedException(){return UnauthorizedException},
				set UnauthorizedException(x){},
				get InvalidRouteException(){return InvalidRouteException},
				set InvalidRouteException(x){},
				get ControllerNotFoundException(){return ControllerNotFoundException},
				set ControllerNotFoundException(x){},
				get ModelNotFoundException(){return ModelNotFoundException},
				set ModelNotFoundException(x){},
				get InvalidAuthenticationMethodException(){return InvalidAuthenticationMethodException},
				set InvalidAuthenticationMethodException(x){},
			},
			writable: false
		},
		Errors: {
			value: {
				FrameworkError: FrameworkError,
				NotSupportedEngineError: NotSupportedEngineError
			},
			writable: false
		},
		Events: {
			value: {
				get FrameworkEvent(){return FrameworkEvent},
				set FrameworkEvent(x){},
				get CacherLoadedEvent(){return CacherLoadedEvent},
				set CacherLoadedEvent(x){},
				get AccessControllerLoadedEvent(){return AccessControllerLoadedEvent},
				set AccessControllerLoadedEvent(x){},
				get PageReadyEvent(){return PageReadyEvent},
				set PageReadyEvent(x){},
			},
			writable: false
		},
		Util: {
			value: Util,
			writable: false
		},
		init: {
			value: function(configuration = './app.xml'){
				if(BobbleHead.app)
					throw new FrameworkException('BobbleHead is already running');
				Object.defineProperty(BobbleHead, 'app', {
					value: new BobbleHead.AppController(configuration),
					writable: false
				});
				return BobbleHead.app;
			},
			writable: false
		},
	});
	return BobbleHead;
})();