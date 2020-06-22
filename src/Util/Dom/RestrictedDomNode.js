export default class RestrictedDomNode{
    constructor(domElement, topElement = domElement){
        if(!domElement) return domElement;

        this.topElement = topElement;
        this.domElement = domElement;

        return new Proxy(document, {
            get: this.wrapGetter.bind(this)
        });
    }

    wrapGetter(target, name){                
        if(name in this)
            return this[name];

        let realValue = this.domElement[name];
        let returnValue = undefined;

        if(typeof realValue == 'function'){
            let realFunction = realValue;

            returnValue = function(){
                let realFunctionOutput = realFunction.apply(this.domElement, arguments);

                return this.wrapResult(realFunctionOutput);
            }.bind(this);
        }else
            returnValue = this.wrapResult(realValue);
        
        return returnValue;
    }

    wrapResult(result){

        let wrappedResult = result;

        if((result instanceof Node)){
            wrappedResult = new RestrictedDomNode(result, this.topElement);
        }

        return wrappedResult;
    }

    get ownerDocument(){
        return this.wrapResult(this.topElement);
    }

    get nodeType(){
        return this.domElement == this.topElement ? 9 : this.domElement.nodeType;
    }

    get nextSibling(){
        return this.domElement == this.topElement ?
            null :
            this.wrapResult(this.domElement.nextSibling);
    }

    get previousSibling(){
        return this.domElement == this.topElement ?
            null :
            this.wrapResult(this.domElement.previousSibling);
    }

    get parentNode(){
        return this.domElement == this.topElement ?
            null :
            this.wrapResult(this.domElement.parentNode);
    }

    get parentElement(){
        return this.domElement == this.topElement ?
            null :
            this.wrapResult(this.domElement.parentNode);
    }

    getRootNode(){
        return this.wrapResult(this.topElement);
    }

    insertBefore(){
        if(this.domElement != this.topElement)
            return this.wrapResult(
                this.domElement.insertBefore.apply(this.domElement, arguments)
            );

        return null;
    }

    *[Symbol.iterator](){
        for(let item of this.domElement)
            yield this.wrapResult(item);
    }

}