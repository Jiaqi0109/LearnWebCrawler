// 框架内存管理，用于解决变量名重复问题
// 调试日志 window.catvm 把框架功能集中管理，

var catvm = {};
// 框架运行内存
catvm.memory = {
    htmlelements: {}, // 所有的html节点元素存放位置
    listeners: {}, // 所有事件存放位置
    log: [], // 环境调用日志统一存放点
    storage: {} // localStorage 全局存放点
}; // 默认关闭打印

catvm.config = {
    // 框架配置：是否打印，是否使用proxy ...
    print: true,
    proxy: true,
    href: 'https://www.zhihu.com/'
}
