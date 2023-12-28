var HTMLCanvasElement = function HTMLCanvasElement() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(HTMLCanvasElement);

Object.defineProperties(HTMLCanvasElement.prototype, {
    [Symbol.toStringTag]: {
        value: "HTMLCanvasElement",
        configurable: true
    }
});

// TODO 原型链未完整

////////// 浏览器代码自动生成部分

////////

var CanvasRenderingContext2D = function CanvasRenderingContext2D () {}
Object.defineProperties(HTMLCanvasElement.prototype, {
    [Symbol.toStringTag]: {
        value: "CanvasRenderingContext2D",
        configurable: true
    }
});
catvm.safefunction(CanvasRenderingContext2D)

// 用户创建div
catvm.memory.htmlelements["canvas"] = function () {
    var canvas = new (function () {});
    /////////////////////////
    canvas.height = 150;
    canvas.width = 300;
    canvas.getContext = function getContext (contextType) {
        if (contextType == '2d') {
            var canvasRenderingContext2D = {};
            canvasRenderingContext2D.__proto__ = CanvasRenderingContext2D.prototype;
            canvasRenderingContext2D.toString = function toString () {
                return '[object CanvasRenderingContext2D]'
            }
            return canvasRenderingContext2D;
        } else {
            debugger;
        }
    };
    /////////////////////////
    canvas.__proto__ = HTMLCanvasElement.prototype;
    return canvas;
}
