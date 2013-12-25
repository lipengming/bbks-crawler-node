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
        return parseInt(str.replace(/\D/g,"")) + 1;
    }else{
        return 0;
    }
}