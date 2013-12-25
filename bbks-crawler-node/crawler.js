var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');
var bookDao  = require('./models/book');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

var EventProxy = require('eventproxy');
var utils = require('./utils');

////////////////////
//  base url      //
////////////////////

var host = "http://book.jd.com/booksort.html";
var listpage = "http://list.jd.com/1713-3258-3297-0-0-0-0-0-0-0-1-1-1.html";
var detail = "http://item.jd.com/16035246.html";

////////////////////
//  base url      //
////////////////////

var catlog   = [];
var ep = new EventProxy();

////////////////////
//     run        //
////////////////////
crawler();


/**
 * 抓取jd数据主函数
 * 1、抓取目录
 * 2、遍历目录，获取每一则，然后抓取一则
 * 3、读取一类，抓取一页，拿到这一页，
 * 4、先读取数据，然后读取下一页
 *
 */
function crawler(){
      crawlerCatlog(host);
//    crawlerList(listpage);
//    console.log(utils.parseNumber("￥19.20"));


}

/**
 * 抓取所有分类
 * @param startUrl
 */
function crawlerCatlog(startUrl){

    download(startUrl,function(err,data){
        var $ = cheerio.load(data);
        //解析
        $('#booksort .mc ').find('dd').each(function (i) {

            $(this).find('em').each(function(j){

                var this_catlog = $(this).find('a').html(); //分类
                var this_link = $(this).find('a').attr('href'); //链接

                catlog.push({
                    catlog:this_catlog,
                    link:this_link
                });

            });

        });


        ep.tail("classfy-end",function(){
            //从catlog中取出一则，调下一个类型抓取流程
            //console.log("next catlog...............");
            crawlerList(catlog.pop().link);
        });

        //延迟3s
        setTimeout(function(){
            console.log(catlog.length);
            //首次启动
            crawlerList(catlog.pop().link);
        }, 3000);//延时3秒

    });
}


/**
 * 抓取list页面
 * 1、抓取当前页面的书籍
 * 2、跳到下一页，继续抓取
 * @param catlog
 */
function  crawlerList(catlogpage){

    console.log("current catlog......"+catlogpage);
   //抓取当前页面
   download(catlogpage,function(err,data){
       var $ = cheerio.load(data);
       //抽取本页数据
       var doc = $("#plist").find(".item");
       doc.each(function(k){
           //抓取一本书
           var link = $(this).find(".info .p-name").find("a").attr('href');
           if(link){
               //解析数据信息，并且入库
               extract(link);
           }
           //不在此处触发了。。。
           //ep.emit('extract-page-list');
       });

       //当该页的数据抓取并入库之后，进行下一页的操作
       ep.after("extract-page-list",doc.length,function(books){

           console.log("--->"+books.length);

           if(books.length === 0){

               goNext($);

           }else{

               //先把数据存到数据库！
               //完成之后，触发翻页事件

               //！！！！！！！！！！！！批量 ！！！！！！！
               //！！！！！！！！！！！！批量 ！！！！！！！
               //！！！！！！！！！！！！批量 ！！！！！！！
               saveData(books,function(results){

                   //hand the result!!!TODO
                   //触发事件--》翻页
                   //go-next-page
                   //console.log("不该执行。。。。");
                   goNext($);
               });
               //！！！！！！！！！！！！批量 ！！！！！！！
               //！！！！！！！！！！！！批量 ！！！！！！！
           }


           //goNext($);

       });


   });
}

/**
 * 翻下一页
 * @param doc
 */
function goNext(doc){

    //2判断：是否有下一页的链接
    var pnext = doc("#filter .fore1 .pagin").find(".next");
    if(pnext){
        //存在下一页信息
        //递归调用该函数
        var next = pnext.attr("href");
        if(next){
            crawlerList(next);
        }else{
            //console.log("this catlog ended...............");
            //发射结束事件
            ep.emit("classfy-end");
        }
    }
}

/**
 * 数据详细页面
 * @param infoPage
 */
function extract(infoPage){

    download(infoPage,function(err,data){

        var book = {};
        if(!err){
            var $ =  cheerio.load(data);

            var base = $("#product-intro");
            if(base){
                //提取详细数据
                book.url = infoPage;
                book.bookname = base.find("#name h1").text().substr(0,45);

                base = base.find(".clearfix");
                book.cover_pic  = base.find("#preview #spec-n1 img").attr("src");//
                book.author  = base.find("#summary-author .dd a").text().substr(0,100);//
                book.isbn  = base.find("#summary-isbn .dd").text().substr(0,2000); //
                book.press = base.find("#summary-ph .dd a").text().substr(0,255); //
                book.price = utils.parseNumber(base.find("#summary-price .dd strong").text().substr(1));
                book.outline  = $("#product-detail .sub-m .sub-mc .con").text().substr(0,2000);

                //非批量！！！！！！！！
                // 先不校验，直接触发

//                if(book.bookname){
//                    bookDao.Save(book,function(bk){
//                        if(bk)
//                            console.log("ok");
//                    });
//                }
                ep.emit('extract-page-list',book);
            }
        }else{
            //该链接没有抽取成功,将该链接保存到日志
            saveLog(infoPage,"extract-page-fail");
            //return null;
            ep.emit('extract-page-list',book);
        }

    });
}

/**
 * 网页文件下载
 * @param url
 * @param cb
 */
function download(url,cb){
    var req = http.get(url,function(res){
        var buffer = new BufferHelper();
        res.on('data',function(data){
            buffer.concat(data);
        }).on('end',function(){
                var buf = buffer.toBuffer();
                //var buf = new Buffer(html,'binary');
                var str = iconv.decode(buf,'GBK');
                cb(null,str);
            }).on('close',function(){
                console.log('Close recevied!');
            });
    });
    req.on('error',function(error){
        //记录到文件
        saveLog(error,"err");
        //回调
        cb(error,null);
    });
}

/***
 * 保存数据到book 表
 * @param book
 */
function saveData(params,handler){

    if(params instanceof Array){

        bookDao.BulkSave(params,function(results){
            if(results || results !== null){
                //console.log("ok!");
                handler(results);
            }else{
                saveLog("fail save:====start"+params.length,"db-insert-fail");
                //console.log("fail! please see log");
                params.forEach(function(item){
                    saveLog("fail save:"+item.bookname,"db-insert-fail");
                });
                saveLog("fail save:====end"+params.length,"db-insert-fail");
                handler(results);
            }
        });

    }else{
        bookDao.Save(params,function(result){
            if(result){
                //console.log("ok!");
                handler(result);
            }else{
                //console.log("fail! please see log");
                saveLog("fail save:"+params.bookname,"db-insert-fail");
                handler(result);
            }
        });
    }

}


/**
 * 日志保存
 * save log
 * @param logMsg
 */
function saveLog(logMsg,type){
    //记录到文件
    fs.appendFile(type+'.log',new Date().getTime()+' '+logMsg+'\r\n','utf-8');
}


/**
 * 打印信息
 * @param params
 */
function printdb(params){
    if(params instanceof Array){
        params.forEach(function(item){
            console.log("name:"+item.bookname+" isbn:"+item.isbn);
        });
    }else{
        console.log("name:"+params.bookname+" isbn:"+params.isbn);
    }
}