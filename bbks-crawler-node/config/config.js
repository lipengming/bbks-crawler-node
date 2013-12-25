/**
 * Created with IntelliJ IDEA.
 * User: wylipengming
 * Date: 13-12-24
 * Time: 上午9:10
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
    database: "bbks",
    protocol: "mysql",
    host: "127.0.0.1",
    bookname: "root",
    password: "root",
    query: {
        pool: true
    },

    db:{
        'host': "localhost",
        'port': 3306,
        'user': "root",
        'password': "root",
        'database': "bbks",
        'charset': "utf-8",
        'connectionLimit': 10,
        'supportBigNumbers': true,
        'bigNumberStrings': true
    }
};