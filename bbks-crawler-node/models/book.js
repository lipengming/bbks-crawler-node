/**
 * Created with IntelliJ IDEA.
 * User: wylipengming
 * Date: 13-12-24
 * Time: 下午12:59
 * To change this template use File | Settings | File Templates.
 */
var database = require("./database");
var EventProxy = require('eventproxy');



//var fields_all = "id, uname, passwd, uemail, gmt_create, gmt_modify";
/**
 * 保存
 * @param params
 * @param cb
 * @constructor
 */
exports.Save = function(params,handler){

    if(params && params.bookname){

        var sql = "insert into tb_book(cover_pic,isbn,outline,press,bookname,price,author) values(?,?,?,?,?,?,?);";
        var args = [params.cover_pic,params.isbn,params.outline,params.press,params.bookname,params.price,params.author];

        var opt = {'sql':sql,'args':args,'handler':handler};
        database.execQuery(opt);
    }

}


exports.BulkSave = function(params,handler){
    var sql = "insert into tb_book(cover_pic,isbn,outline,press,bookname,price,author) values ?;";
    var ep = new EventProxy();

    var pl = params.length + 1;
    var ok = true;//未出错

    ep.after('add_params', pl, function (args) {

        if(args.pop() === true){
            var opt = {'sql':sql,'args':[args],'handler':handler};
            database.execQuery(opt);
        }else{
            bulkException(params,function(){
                console.log("逐个插入....");
            });
            handler(null);
        }
    });

    for(var a=0;a<pl;a++){
        //校验不空且存在
        if(params[a] && params[a].bookname){
            var data = [params[a].cover_pic,params[a].isbn,params[a].outline,params[a].press,params[a].bookname,params[a].price,params[a].author];
            // 触发结果事件
            ep.emit('add_params', data);
            //出发事件
        }else{

            //最后一次必然会触发这里，
            //有水分数据，把数据交给
            if(a == params.length){
                ep.emit('add_params', ok);
            }else{
                ok = false;
                ep.emit('add_params');
            }
        }

    }
}

/**
 * 逐个插入
 * @param params
 * @param handler
 */
function bulkException(datas,handler){
    //逐个插入
    for(var a=0;a<datas.length;a++){
        var params = datas[a];
        if(params && params.bookname){

            var sql = "insert into tb_book(cover_pic,isbn,outline,press,bookname,price,author) values(?,?,?,?,?,?,?);";
            var args = [params.cover_pic,params.isbn,params.outline,params.press,params.bookname,params.price,params.author];

            var opt = {'sql':sql,'args':args,'handler':handler};
            database.execQuery(opt);
        }
    }
}