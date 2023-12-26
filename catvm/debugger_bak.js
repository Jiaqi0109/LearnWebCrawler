// 框架内存管理，用于解决变量名重复问题
// 调试日志 window.catvm 把框架功能集中管理，

var catvm = {};
// 框架运行内存
catvm.memory = {
    config: {print: true, proxy: true}, // 框架配置：是否打印，是否使用proxy
    htmlelements: {}, // 所有的html节点元素存放位置
    listeners: {}, // 所有事件存放位置
    log: [], // 环境调用日志统一存放点
    storage: {} // localStorage 全局存放点
}; // 默认关闭打印

// 主要用来保护伪造的函数，使其更难被识别

// 主要用来保护伪造的函数，让其更难识破
;
(() => {
    'use strict';
    // 取原型链上的toString
    const $toString = Function.toString;
    // 取方法名 reload
    const myFunction_toString_symbol = Symbol('('.concat('', ')_', (Math.random() + '').toString(36)));
    const myToString = function () {
        return typeof this == 'function' && this[myFunction_toString_symbol] || $toString.call(this);
    };

    function set_native(func, key, value) {
        Object.defineProperty(func, key, {
            "enumerable": false,  // 不可枚举
            "configurable": true, // 可配置
            "writable": true, // 可写
            "value": value
        })
    }

    delete Function.prototype['toString'];// 删除原型链上的toString
    set_native(Function.prototype, "toString", myToString); // 自定义一个getter方法，其实就是一个hook
    //套个娃，保护一下我们定义的toString，避免js对toString再次toString，如：location.reload.toString.toString() 否则就暴露了
    set_native(Function.prototype.toString, myFunction_toString_symbol, "function toString() { [native code] }");
    this.catvm.safefunction = (func) => {
        set_native(func, myFunction_toString_symbol, `function ${myFunction_toString_symbol,func.name || ''}() { [native code] }`);
    }; //导出函数到globalThis，更改原型上的toSting为自己的toString。这个方法相当于过掉func的toString检测点
}).call(this);

// 日志调试功能
catvm.print = {};
catvm.memory.print = []; // 缓存
catvm.print.log = function () {
    if (catvm.memory.config.print) {
        console.table(catvm.memory.log);

    }
};

catvm.print.getAll = function () { // 列出所有日志
    if (catvm.memory.config.print) {
        console.table(catvm.memory.log);

    }
};
// 框架代理功能

catvm.proxy = function (obj) {
    // Proxy 可以多层代理，即 a = new proxy(a); a = new proxy(a);第二次代理
    // 后代理的检测不到先代理的
    if (catvm.memory.config.proxy == false) {
        return obj
    }
    return new Proxy(obj, {
        set(target, property, value) {
            console.table([{"类型":"set-->","调用者":target,"调用属性":property,"设置值":value}]);
            catvm.memory.log.push({"类型":"set-->","调用者":target,"调用属性":property,"设置值":value});
            // console.log("set", target, property, value);
            return Reflect.set(...arguments); //这是一种反射语句，这种不会产生死循环问题
        },
        get(target, property, receiver) {
            console.table([{"类型":"get<--","调用者":target,"调用属性":property,"获取值":target[property]}]);
            catvm.memory.log.push({"类型":"get<--","调用者":target,"调用属性":property,"获取值":target[property]});
            // console.log("get", target, property, target[property]);
            return target[property];  // target中访问属性不会再被proxy拦截，所以不会死循环
        }
    });
}

var EventTarget = function EventTarget() { // 构造函数

};
catvm.safefunction(EventTarget);

// 因为EventTarget是构造函数，而我们要的是原型，因此需要先hook EventTarget.prototype，设置下原型的名字，否则它会使用父亲的名字
Object.defineProperties(EventTarget.prototype, {
    [Symbol.toStringTag]: {
        value: "EventTarget",
        configurable: true
    }
})

EventTarget.prototype.addEventListener = function addEventListener(type,callback) {
    debugger; //debugger的意义在于检测到是否检测了该方法
    if(!(type in catvm.memory.listeners)){
        catvm.memory.listeners[type] = [];
    }
    catvm.memory.listeners[type].push(callback);
};
catvm.safefunction(EventTarget.prototype.addEventListener);

EventTarget.prototype.dispatchEvent = function dispatchEvent() {
    debugger;
};
catvm.safefunction(EventTarget.prototype.dispatchEvent);

EventTarget.prototype.removeEventListener = function removeEventListener() {
    debugger;
};
catvm.safefunction(EventTarget.prototype.removeEventListener);

// EventTarget = catvm.proxy(EventTarget);
// EventTarget.prototype = catvm.proxy(EventTarget.prototype);
var WindowProperties = function WindowProperties() { // 构造函数

};
catvm.safefunction(WindowProperties);

Object.defineProperties(WindowProperties.prototype, {
    [Symbol.toStringTag]: {
        value: "WindowProperties",
        configurable: true
    }
})

// 设置原型的父对象
WindowProperties.prototype.__proto__ = EventTarget.prototype;



window = this;
// debugger;
var Window = function Window() { // 构造函数
    // 容易被检测到的  js可以查看堆栈
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(Window);

Object.defineProperties(Window.prototype, {
    [Symbol.toStringTag]: {
        value: "Window",
        configurable: true
    }
})
Window.prototype.__proto__ = WindowProperties.prototype;
window.__proto__ = Window.prototype;


///////////////////////////// 浏览器环境补充
Window.prototype.PERSISTENT = 1;
Window.prototype.TEMPORARY = 0;

// v8没有setTimeout，浏览器有，但是浏览器把这个方法放到this下面，伪造v8有这个东西，因此我们需要伪造一下
window.setTimeout = function (x, delay) {
    // x可能是方法也可能是文本
    typeof (x) == "function" ? x() : undefined;
    typeof (x) == "string" ? eval(x) : undefined;
    // 正确应该 生成UUID，并且保存到内存
    return 123;
};
catvm.safefunction(window.setTimeout);
window.setInterval = function (x, delay) {
    // x可能是方法也可能是文本
    typeof (x) == "function" ? x() : undefined;
    typeof (x) == "string" ? eval(x) : undefined;
    // 正确应该 生成UUID，并且保存到内存
    return 123;
};
catvm.safefunction(window.setInterval);

// 原型下面可以取这个属性\方法，就直接放原型即可
// 只要是方法就需要catvm.safefunction 进行toSting保护
window.open = function open() {
    debugger;
};
catvm.safefunction(window.open);
// 赋值空对象最好使用这种class chrome{} 形式，而不是 {},因为这样我们可以看名字，并且最好挂上代理

window.chrome = catvm.proxy(class chrome {});

// 打个debugger，因为我们还不知道js有没有调用该方法，也许只是获取了一下，看有没有该方法呢
// 等它真正调用的时候，我们再补全其参数及返回
window.DeviceOrientationEvent = function DeviceOrientationEvent() {
    debugger;
};
catvm.safefunction(window.DeviceOrientationEvent);

window.DeviceMotionEvent = function DeviceMotionEvent() {
    debugger;
};
catvm.safefunction(window.DeviceMotionEvent);

// window.localStorage = class localStorage {
// };
// window.localStorage.getItem = function getItem() {
//     debugger;
// };
// catvm.safefunction(window.localStorage.getItem);

// window.localStorage.setItem = function setItem() {
//     debugger;
// };
// catvm.safefunction(window.localStorage.setItem);

// window.localStorage = catvm.proxy(window.localStorage)
//////////////////////


window = catvm.proxy(window);
Window = catvm.proxy(Window);

var Location = function Location() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(Location);

Object.defineProperties(Location.prototype, {
    [Symbol.toStringTag]: {
        value: "Location",
        configurable: true
    }
});
location = {};
location.__proto__ = Location.prototype;


////////// 浏览器代码自动生成部分
location.href = "";
location.port = "";
location.protocol = 'https:';
location.host = '';
////////


location = catvm.proxy(location);

var Navigator = function Navigator() { // 构造函数
    throw new TypeError("Illegal constructor");  // 不允许new Navigator
};
catvm.safefunction(Navigator);

// set name
Object.defineProperties(Navigator.prototype, {
    [Symbol.toStringTag]: {
        value: "Navigator",
        configurable: true
    }
});

navigator = {
    // platform: 'Win32',
    // userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
    // maxTouchPoints: 0,
    // onLine: true,
    // mimeTypes: [{
    //     suffixes: "pdf",
    //     type: "application/pdf"
    // }],
    //
    // plugins: [{
    //     "0": {},
    //     "1": {}
    // }]

};
// 设置原型对象
navigator.__proto__ = Navigator.prototype;


////////// 需要补的内容
Navigator.prototype.plugins = [];
Navigator.prototype.languages = ["zh-CN", "zh"];
Navigator.prototype.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36';
Navigator.prototype.platform = 'Win32';
Navigator.prototype.maxTouchPoints = 0;
Navigator.prototype.onLine = true;
Navigator.prototype.mimeTypes = [{
    suffixes: "pdf",
    type: "application/pdf"
}];
Navigator.prototype.plugins = [{
    "0": {},
    "1": {}
}];
//上面是定义原型的属性
// navigator比较特殊，它会把属性继续定义到 静态属性中，所以我们也做一下
for (var _prototype in Navigator.prototype) {
    navigator[_prototype] = Navigator.prototype[_prototype]; // 将原型上的方法复制一遍给实例
    if (typeof (Navigator.prototype[_prototype]) != "function") {
        // 相当于Object.defineProperty的get方法，Proxy的get方法，hook原型上的所有方法属性
        Navigator.prototype.__defineGetter__(_prototype, function () {
            debugger;
            var e = new Error();
            e.name = "TypeError";
            e.message = "Illegal constructor";
            e.stack = "VM988:1 Uncaught TypeError: Illegal invocation \r\n " +
                "at <anonymous>:1:21";
            throw e;
            // throw new TypeError("Illegal constructor");
        });
    }
}
////////


navigator = catvm.proxy(navigator);

// 从浏览器中知道History是全局的，且原型链只是一层，因此比较好伪造（window有多层所以要伪造多层）
// 浏览器中new会报错，因此我们此处也需要报错
var History = function History() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(History);
// 浏览器
Object.defineProperties(History.prototype, {
    [Symbol.toStringTag]: {
        value: "History",
        configurable: true
    }
});

history = {
    length: 1,
};
history.__proto__ = History.prototype;


////////// 浏览器代码自动生成部分
History.prototype.back = function back() {
    debugger;
};
catvm.proxy(History.prototype.back);
////////


history = catvm.proxy(history);

// 从浏览器中知道Screen是全局的，且原型链只是一层，因此比较好伪造（window有多层所以要伪造多层）
// 浏览器中new会报错，因此我们此处也需要报错
var Screen = function Screen() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(Screen);
// 浏览器
Object.defineProperties(Screen.prototype, {
    [Symbol.toStringTag]: {
        value: "Screen",
        configurable: true
    }
});
screen = {};
screen.__proto__ = Screen.prototype;


////////// 浏览器代码自动生成部分
Screen.prototype.width = 1920;
Screen.prototype.height = 1080;
Screen.prototype.availWidth = 1920;
Screen.prototype.availHeight = 1032;
Screen.prototype.colorDepth = 24;
Screen.prototype.pixelDepth = 24;
////////
// 浏览器中screen是全局的，因此我们也需要定义一个screen

screen = catvm.proxy(screen);

// 从浏览器中知道Storage是全局的，且原型链只是一层，因此比较好伪造（window有多层所以要伪造多层）
// 浏览器中new会报错，因此我们此处也需要报错
var Storage = function Storage() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(Storage);
// 浏览器
Object.defineProperties(Storage.prototype, {
    [Symbol.toStringTag]: {
        value: "Storage",
        configurable: true
    }
});
var localStorage = {};
localStorage.__proto__ = Storage.prototype;


////////// 浏览器代码自动生成部分
function get_length() {
    return Object.keys(catvm.memory.storage).length;
}

Storage.prototype.length = get_length();
Storage.prototype.key = function key(index) {
    return Object.keys(catvm.memory.storage)[index];
};
catvm.safefunction(Storage.prototype.key);
Storage.prototype.getItem = function getItem(keyName) {
    var result = catvm.memory.storage[keyName];
    if (result) {
        return result;
    } else {
        return null;
    }
};
catvm.safefunction(Storage.prototype.getItem);

Storage.prototype.setItem = function setItem(keyName, keyValue) {
    catvm.memory.storage[keyName] = keyValue;
};
catvm.safefunction(Storage.prototype.setItem);

Storage.prototype.removeItem = function removeItem(keyName) {
    delete catvm.memory.storage[keyName];
};
catvm.safefunction(Storage.prototype.removeItem);

Storage.prototype.clear = function clear() {
    catvm.memory.storage = {};
};
catvm.safefunction(Storage.prototype.clear);
////////

// 代理一般挂在实例上
localStorage = catvm.proxy(localStorage);
Storage = catvm.proxy(Storage);

// 存储一些值，避免污染全局变量空间
catvm.memory.mimetype = {};

var MimeType = function MimeType() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(MimeType);



Object.defineProperties(MimeType.prototype, {
    [Symbol.toStringTag]: {
        value: "MimeType",
        configurable: true
    },
});

////////// 浏览器代码自动生成部分
MimeType.prototype.description = "";
MimeType.prototype.enabledPlugin = null;
MimeType.prototype.suffixes = "";
MimeType.prototype.type = "";

for (var _prototype in MimeType.prototype) {
    if (typeof (MimeType.prototype[_prototype]) != "function") {
        // 相当于Object.defineProperty的get方法，Proxy的get方法，hook原型上的所有方法属性
        MimeType.prototype.__defineGetter__(_prototype, function () {
            throw new TypeError("Illegal constructor");
        });
    }
}

////////
catvm.memory.mimetype.new = function (data,initPlugin) {
    var mimetype = {};
    if (data != undefined) {
        mimetype.description = data.description;
        mimetype.enabledPlugin = initPlugin; // plugin实例
        mimetype.suffixes = data.suffixes;
        mimetype.type = data.type;
    }
    // 先赋完值，在指向原型
    mimetype.__proto__ = MimeType.prototype;
    return mimetype;
};

// 代理一般挂在实例上
navigator.plugins = catvm.proxy(navigator.plugins);


// 存储一些值，避免污染全局变量空间
catvm.memory.plugin = {};

var Plugin = function Plugin() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(Plugin);


catvm.memory.plugin.iterator = function values() {
    // debugger;
    return {
        next:function () {
            if(this.index_ == undefined){
                this.index_ = 0;
            }
            var tmp = this.self_[this.index_];
            this.index_ += 1;
            return {value:tmp,done:tmp==undefined};
        },
        self_:this
    }
};
catvm.safefunction(catvm.memory.plugin.iterator);

Object.defineProperties(Plugin.prototype, {
    [Symbol.toStringTag]: {
        value: "Plugin",
        configurable: true
    },
    // 原型上多了个这个,里面是个方法
    [Symbol.iterator]: {
        value: catvm.memory.plugin.iterator,
        configurable: true
    }
});

////////// 浏览器代码自动生成部分
Plugin.prototype.name = "";
Plugin.prototype.filename = "";
Plugin.prototype.description = "";
Plugin.prototype.length = 0;
Plugin.prototype.item = function item(index) {
    // debugger;
    return this[index];
};
catvm.safefunction(Plugin.prototype.item);
Plugin.prototype.namedItem = function namedItem(key) {
    // debugger;
    return this[key];
};
catvm.safefunction(Plugin.prototype.namedItem);


for (var _prototype in Plugin.prototype) {
    if (typeof (Plugin.prototype[_prototype]) != "function") {
        // 相当于Object.defineProperty的get方法，Proxy的get方法，hook原型上的所有方法属性
        Plugin.prototype.__defineGetter__(_prototype, function () {
            // this是实例
            throw new TypeError("Illegal constructor");
            // return this[pr];
        });
    }
}
/*
{ name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format',MimeTypes:[{"description": "Portable Document Format","suffixes": "pdf","type": "application/pdf"},{"description": "xxxxx","suffixes": "xxxxpdf","type": "xxxxapplication/pdf"}]}
 */
////////
catvm.memory.plugin.new = function (data) {
    var plugin = {};
    if (data != undefined) {
        plugin.description = data.description;
        plugin.filename = data.filename;
        plugin.name = data.name;
        // MimeType
        if (data.MimeTypes != undefined) {
            for (let index = 0; index < data.MimeTypes.length; index++) {
                var mimetypedata = data.MimeTypes[index];
                var mimetype = catvm.memory.mimetype.new(mimetypedata, plugin);
                plugin[index] = mimetype;
                // mimetype.type浏览器显示的是灰色名称，下面这种添加属性会是亮的，因此我们需要换一种添加方式
                // plugin[mimetype.type] = mimetype;
                Object.defineProperty(plugin, mimetype.type, {
                    value: mimetype,
                    writable: true // 是否可以改变
                });
            }

            plugin.length = data.MimeTypes.length;
        }
    }
    // 先赋完值，在指向原型
    plugin.__proto__ = Plugin.prototype;
    return plugin;
};

// 代理一般挂在实例上
navigator.plugins = catvm.proxy(navigator.plugins);


// 存储一些值，避免污染全局变量空间
catvm.memory.PluginArray = {};

var PluginArray = function PluginArray() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(PluginArray);


catvm.memory.PluginArray.iterator = function values() {
    // debugger;
    return {
        next:function () {
            if(this.index_ == undefined){
                this.index_ = 0;
            }
            var tmp = this.self_[this.index_];
            this.index_ += 1;
            return {value:tmp,done:tmp==undefined};
        },
        self_:this
    }
};
catvm.safefunction(catvm.memory.plugin.iterator);

Object.defineProperties(PluginArray.prototype, {
    [Symbol.toStringTag]: {
        value: "PluginArray",
        configurable: true
    },
    // 原型上多了个这个,里面是个方法
    [Symbol.iterator]: {
        value: catvm.memory.PluginArray.iterator,
        configurable: true
    }
});
// PluginArray实例, PluginArray这个虽然跟Plugin很像，但是无需被new，浏览器一开始就有该实例 navigator.plugins
catvm.memory.PluginArray._ = {};

////////// ///////////////////浏览器代码自动生成部分
PluginArray.prototype.length = 0;
PluginArray.prototype.item = function item(index) {
    // debugger;
    return this[index];
};
catvm.safefunction(PluginArray.prototype.item);
PluginArray.prototype.namedItem = function namedItem(key) {
    // debugger;
    return this[key];
};
catvm.safefunction(PluginArray.prototype.namedItem);

PluginArray.prototype.refresh = function refresh() {
    debugger;
};
catvm.safefunction(PluginArray.prototype.refresh);

// 适用于 调用原型的属性会抛出异常的对象
for (var _prototype in PluginArray.prototype) {
    if (typeof (PluginArray.prototype[_prototype]) != "function") {
        // 相当于Object.defineProperty的get方法，Proxy的get方法，hook原型上的所有方法属性
        PluginArray.prototype.__defineGetter__(_prototype, function () {
            // this是实例
            throw new TypeError("Illegal constructor");
            // return this[pr];
        });
    }
}
/*
{ name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format',MimeTypes:[{"description": "Portable Document Format","suffixes": "pdf","type": "application/pdf"},{"description": "xxxxx","suffixes": "xxxxpdf","type": "xxxxapplication/pdf"}]}
 */
///////////////////////
catvm.memory.PluginArray.ls = [
        {
            "name": "PDF Viewer",
            "filename": "internal-pdf-viewer",
            "description": "Portable Document Format",
            "MimeTypes": [
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "application/pdf"
                },
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "text/pdf"
                }
            ]
        },
        {
            "name": "Chrome PDF Viewer",
            "filename": "internal-pdf-viewer",
            "description": "Portable Document Format",
            "MimeTypes": [
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "application/pdf"
                },
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "text/pdf"
                }
            ]
        },
        {
            "name": "Chromium PDF Viewer",
            "filename": "internal-pdf-viewer",
            "description": "Portable Document Format",
            "MimeTypes": [
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "application/pdf"
                },
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "text/pdf"
                }
            ]
        },
        {
            "name": "Microsoft Edge PDF Viewer",
            "filename": "internal-pdf-viewer",
            "description": "Portable Document Format",
            "MimeTypes": [
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "application/pdf"
                },
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "text/pdf"
                }
            ]
        },
        {
            "name": "WebKit built-in PDF",
            "filename": "internal-pdf-viewer",
            "description": "Portable Document Format",
            "MimeTypes": [
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "application/pdf"
                },
                {
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                    "type": "text/pdf"
                }
            ]
        }
    ]


for (let index = 0; index < catvm.memory.PluginArray.ls.length; index++) {
    let tmp_plugin = catvm.memory.plugin.new(catvm.memory.PluginArray.ls[index]);
    catvm.memory.PluginArray._[index] = tmp_plugin;
    // mimetype.type浏览器显示的是灰色名称，下面这种添加属性会是亮的，因此我们需要换一种添加方式
    Object.defineProperty(catvm.memory.PluginArray._, tmp_plugin.name, {
        value: tmp_plugin,
    });
}
catvm.memory.PluginArray._.length = catvm.memory.PluginArray.ls.length;

catvm.memory.PluginArray._.__proto__ = PluginArray.prototype;
// 代理一般挂在实例上
catvm.memory.PluginArray._ = catvm.proxy(catvm.memory.PluginArray._);
// 依赖注入
navigator.plugins = catvm.memory.PluginArray._;

// 存储一些值，避免污染全局变量空间
catvm.memory.MimeTypeArray = {};
// MimeTypeArray实例,MimeTypeArray这个虽然跟MimeType很像，但是无需被new，浏览器一开始就有该实例 navigator.mimeTypes
catvm.memory.MimeTypeArray._ = {};


var MimeTypeArray = function MimeTypeArray() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(MimeTypeArray);


catvm.memory.MimeTypeArray.iterator = function values() {
    debugger;
    return {
        next:function () {
            if(this.index_ == undefined){
                this.index_ = 0;
            }
            var tmp = this.self_[this.index_];
            this.index_ += 1;
            return {value:tmp,done:tmp==undefined};
        },
        self_:this
    }
};
catvm.safefunction(catvm.memory.MimeTypeArray.iterator);

Object.defineProperties(MimeTypeArray.prototype, {
    [Symbol.toStringTag]: {
        value: "MimeTypeArray",
        configurable: true
    },
    // 原型上多了个这个,里面是个方法
    [Symbol.iterator]: {
        value: catvm.memory.MimeTypeArray.iterator,
        configurable: true
    }
});

////////// ///////////////////浏览器代码自动生成部分
MimeTypeArray.prototype.length = 0;
MimeTypeArray.prototype.item = function item(index) {
    // debugger;
    return this[index];
};
catvm.safefunction(MimeTypeArray.prototype.item);
MimeTypeArray.prototype.namedItem = function namedItem(key) {
    // debugger;
    return this[key];
};
catvm.safefunction(MimeTypeArray.prototype.namedItem);


// 适用于 调用原型的属性会抛出异常的对象
for (var _prototype in MimeTypeArray.prototype) {
    if (typeof (MimeTypeArray.prototype[_prototype]) != "function") {
        // 相当于Object.defineProperty的get方法，Proxy的get方法，hook原型上的所有方法属性
        MimeTypeArray.prototype.__defineGetter__(_prototype, function () {
            // this是实例
            throw new TypeError("Illegal constructor");
            // return this[pr];
        });
    }
}
///////////////////////
// catvm.memory.MimeTypeArray.ls = []  // 所有MimeType存放点
// 遍历 PluginArray实例里面的所有Plugin实例
catvm.memory.MimeTypeArray.mimetype_count = 0;
catvm.memory.MimeTypeArray.mimetype_types = {}; // 所有MimeType.type存放点
for (let index = 0; index < catvm.memory.PluginArray._.length; index++) {
    let tmp_plugin = catvm.memory.PluginArray._[index];
    // 遍历 Plugin实例里面的所有MimeType实例，增加到 MimeTypeArray中
    for(let m_index=0;m_index<tmp_plugin.length;m_index++){
        let tmp_mimetype = tmp_plugin.item(m_index);
        // catvm.memory.MimeTypeArray.ls.push(tmp_mimetype);
        if(!(tmp_mimetype.type in catvm.memory.MimeTypeArray.mimetype_types)){
            catvm.memory.MimeTypeArray.mimetype_types[tmp_mimetype.type] = 1;
            catvm.memory.MimeTypeArray._[catvm.memory.MimeTypeArray.mimetype_count] = tmp_mimetype;
            catvm.memory.MimeTypeArray.mimetype_count += 1;
            // mimetype.type浏览器显示的是灰色名称，下面这种添加属性会是亮的，因此我们需要换一种添加方式
            Object.defineProperty(catvm.memory.MimeTypeArray._, tmp_mimetype.type, {
                value: tmp_mimetype,
            });
        }
    }
}
catvm.memory.MimeTypeArray._.length = catvm.memory.MimeTypeArray.mimetype_count;

catvm.memory.MimeTypeArray._.__proto__ = MimeTypeArray.prototype;
// 依赖注入
navigator.mimeTypes = catvm.memory.MimeTypeArray._;
// 代理一般挂在实例上
navigator.mimeTypes  = catvm.proxy(navigator.mimeTypes)
var HTMLDivElement = function HTMLDivElement() { // 构造函数
    throw new TypeError("Illegal constructor");
};
catvm.safefunction(HTMLDivElement);

Object.defineProperties(HTMLDivElement.prototype, {
    [Symbol.toStringTag]: {
        value: "HTMLDivElement",
        configurable: true
    }
});

// TODO 原型链

////////// 浏览器代码自动生成部分

////////


// 用户创建div
catvm.memory.htmlelements["div"] = function () {
    var div = new (function () {});
    /////////////////////////
    div.align = "";
    /////////////////////////
    div.__proto__ = HTMLDivElement.prototype;
    return div;
}


// 从浏览器中知道Document是全局的，new Document会返回一个对象
var Document = function Document() { // 构造函数
};
catvm.safefunction(Document);

Object.defineProperties(Document.prototype, {
    [Symbol.toStringTag]: {
        value: "Document",
        configurable: true
    }
});
document = {};
document.__proto__ = Document.prototype;


////////// 浏览器代码自动生成部分
document.cookie = '';
document.referrer = location.href || '';
document.getElementById = function getElementById(id) {
    debugger;
    // 用id匹配当前环境内存中已有的Element，没找到则返回null
    return null;
};
catvm.safefunction(document.getElementById);

document.getElementsByTagName = function getElementsByTagName(tag_name) {
    var map_tag = {'body': ["<body link=\"#0000cc\" mpa-version=\"7.16.14\" mpa-extension-id=\"ibefaeehajgcpooopoegkifhgecigeeg\" style=\"\"></body>"]};
    debugger;
    return map_tag[tag_name]
};
catvm.safefunction(document.getElementsByTagName);


document.addEventListener = function addEventListener(type, listener, options, useCapture) {
    debugger;
};
catvm.safefunction(document.addEventListener);


document.createElement = function createElement(tagName) {
    var tagName = tagName.toLowerCase() + "";
    if (catvm.memory.htmlelements[tagName] == undefined) {
        debugger;
    } else {
        var tagElement = catvm.memory.htmlelements[tagName]();
        return catvm.proxy(tagElement);
    }
};
catvm.safefunction(document.createElement);
////////


document = catvm.proxy(document);

debugger;
debugger
catvm.print.getAll();