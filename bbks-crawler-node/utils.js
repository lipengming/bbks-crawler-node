/**
 * Created with IntelliJ IDEA.
 * User: wylipengming
 * Date: 13-12-24
 * Time: 下午1:25
 * To change this template use File | Settings | File Templates.
 */


/**
 * 取数字
 * 如￥19.20得到：19.20
 * @param str
 * @returns {Number}
 */
exports.parseNumber = function parseNumber(str){
    if(str){
        var num = parseInt(str.replace(/\D/g,"")) + 1;

        return num;
    }else{
        return 0;
    }
}



/**********************一。验证类*****************************/

//对象是否存在
exports.isObj = function isObj(str){
    if(str==null||typeof(str)=='undefined')
        return false;
    return true;
}

//字符串判断
exports.isString = function isObj(str){
    return ((typeof str =="string") && (str.constructor == String));
}

//去除字符串中的空格
exports.strTrim = function strTrim(str){
    if(!isObj(str))
        return 'undefined';
    str=str.replace(/^/s+/|/s+$/g,'');  //原来是： /^/s+|/s+$/g
    return str;
}