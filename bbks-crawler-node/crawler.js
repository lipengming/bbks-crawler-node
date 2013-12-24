var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');
var book  = require('./models/book');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

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
//    crawlerCatlog(host);
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

        //在此处执行操作。。。。。
//        catlog.forEach(function(item,k){
//            //console.log(item.link);
//            crawlerList(item.link);
//        });

        while(catlog.length > 0){
            var item = catlog.pop();
            crawlerList(item.link);
//            process.nextTick(crawlerList(item.link));

            setTimeout(function () {
                console.log('item.link');
            }, 2000);
        }

    });
}

/**
 * 抓取list页面
 * 1、抓取当前页面的书籍
 * 2、跳到下一页，继续抓取
 * @param catlog
 */
function  crawlerList(catlogpage){

    //抓取当前页面
   download(catlogpage,function(err,data){
       var $ = cheerio.load(data);
       //抽取本页数据
       $("#plist").find(".item").each(function(k){
           //抓取一本书
           var link = $(this).find(".info .p-name").find("a").attr('href');
           if(link){
               //解析数据信息，并且入库
               extract(link);
           }
       });

       //2判断：是否有下一页的链接
       var pnext = $("#filter .fore1 .pagin").find(".next");
       if(pnext){
           //存在下一页信息
           //递归调用该函数
           var next = pnext.attr("href");
           if(next){
               console.log(next);
               crawlerList(next);
           }
       }
   });
}


/**
 * 数据详细页面
 * @param infoPage
 */
function extract(infoPage){

    console.log("extract link:"+infoPage);

    download(infoPage,function(err,data){
        if(!err){
            var $ =  cheerio.load(data);

            var base = $("#product-intro");
            if(base){
                //提取数据
                var book = {};

                book.bookname = base.find("#name h1").text().substr(0,45);

                base = base.find(".clearfix");
                book.cover_pic  = base.find("#preview #spec-n1 img").attr("src");//
                book.author  = base.find("#summary-author .dd a").text().substr(0,100);//
                book.isbn  = base.find("#summary-isbn .dd").text().substr(0,2000); //
                book.press = base.find("#summary-ph .dd a").text().substr(0,255); //
                book.price = utils.parseNumber(base.find("#summary-price .dd strong").text().substr(1));
                book.outline  = $("#product-detail .sub-m .sub-mc .con").text().substr(0,2000);

                if(book.bookname && book.isbn){
                    saveData(book);
                }
                else{
                    //将该链接保存到日志
                    saveLog(infoPage,"link");
                    return null;
                }
            }
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
function saveData(params){
    book.Save(params,function(bks){
        if(!bks)
            saveLog(err,'db');
        else
            console.log("ok!");
    });
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