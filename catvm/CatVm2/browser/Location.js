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
location.toString = function toString () {
    return this.href
}


////////// 浏览器代码自动生成部分
location.href = catvm.config.href || '';
location.port = "";
location.protocol = 'https:';
location.host = catvm.config.host || '';
////////


location = catvm.proxy(location);
