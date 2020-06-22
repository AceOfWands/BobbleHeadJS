export default class ExtendedDomElement{

    constructor(element){
        this.__element = element;

        return new Proxy(element,{
            'get': this.wrapResults.bind(this)
        });
    }

    wrapResults(target, name){
        if(name in this)
            return this[name];

        let response = target[name];
        if(typeof response == 'function'){
            let realFunction = target[name];
            response = function(){
                let functionReturnValue = realFunction.apply(target, arguments);

                functionReturnValue = this.wrapObject(functionReturnValue);

                return functionReturnValue;
            }.bind(this);
        }

        return  response;
    }

    getFirstElementByTagName(name){
        let selectedObject = this.__element.getElementsByTagName(name)[0];

        return this.wrapObject(selectedObject);
    }

    existsElementByTagName(name){
        return this.__element.getElementsByTagName(name).length > 0;
    }

    wrapObject(object){
        if((object instanceof Element) ||
            (object instanceof HTMLCollection))
            object = new ExtendedDomElement(object);

        return object;
    }

    *[Symbol.iterator](){
        for(let item of this.__element)
            yield this.wrapObject(item);
    }
}