/**
 * Created with IntelliJ IDEA.
 * User: wylipengming
 * Date: 13-12-24
 * Time: 下午12:59
 * To change this template use File | Settings | File Templates.
 */
var database = require("./database");


//var fields_all = "id, uname, passwd, uemail, gmt_create, gmt_modify";
/**
 * 保存
 * @param params
 * @param cb
 * @constructor
 */
exports.Save = function(params,handler){
    var sql = "insert into tb_book(cover_pic,isbn,outline,press,bookname,price,author) values(?,?,?,?,?,?,?);";
    var args = [params.cover_pic,params.isbn,params.outline,params.press,params.bookname,params.price,params.author];

    var opt = {'sql':sql,'args':args,'handler':handler};
    database.execQuery(opt);

}





