const bodyParser = require("body-parser");
const hbs = require("hbs");
const express = require("express");
const express_session = require("express-session");
const mysql = require("mysql2");
const app = express();
app.set("view engine", "hbs");
hbs.registerPartials(__dirname+"/views/partials");
app.use(express.static(__dirname+"/public"));
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(express_session(
    {secret:"secret", 
    cookie: {maxage: 86006060*60}, 
    saveUninitialized: true, 
    resave: true}));

function connection_db()
{
    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "book_store",
        debug: false,
        multipleStatements: true
        });

    return connection;
}

hbs.registerHelper('isundefined', function(value){
    console.log(value);
    if(typeof value == 'undefined') return undefined
    else return true;
});

app.get("/", function(request, response){

    var connection = connection_db();

    connection.query("SELECT id_book, image, name from books limit 4;", function(err,data){

        if (err) throw err;

       // console.log(request.session.session);
        connection.end();
       // console.log(data);
        response.render("index", {books:data, session: request.session.session});
    });
});

app.get("/catalog", function(request, response){
    
    var connection = connection_db();

    connection.query("SELECT DISTINCT genre from books;SELECT * from books;",[1,2], function(err,data){

        if (err) throw err;

        connection.end();
        console.log(data);
        response.render("catalog", {genrelist:data[0], books:data[1], session: request.session.session});
    });
});

app.post("/catalog", urlencodedParser, function(request,response){
    var connection = connection_db();
    //выбирает те книги, жанр которых был передан при выполнении формы
    connection.query(`SELECT DISTINCT genre from books;SELECT * from books where genre='${request.body.bookgenre}';`,[1,2], function(err,data){
        
        if (err) throw err;
        connection.end();
        console.log(data);
        response.render("catalog", {genrelist:data[0], books:data[1], session: request.session.session});
    });
});
app.get("/book/:id", function(request, response){

    if(typeof request.session.session!=='undefined')
    var user = request.session.session;
    else
    var user = "";  
   
    var connection = connection_db();

     connection.query("SELECT * from books where id_book="+JSON.stringify(request.params.id)+"; Select id_tab from tab a inner join users b on a.id_user=b.id_user where id_book="+ JSON.stringify(request.params.id) +" and b.email='"+user+"'",[1,2],function(err,data){

        if(err) throw err;

        connection.end();

        response.render("book", {book:data[0][0], bought:data[1][0], session: request.session.session});
    });
    
});

app.get("/profile", function(request,response){

    if(typeof request.session.session=='undefined')
    response.redirect("/");
    else{
    var connection = connection_db();

    connection.query("SELECT * from users where email='"+request.session.session+"'", function(err,data){

        if(err)
        throw err;

        connection.end();

        console.log(data[0]);
        response.render("profile",{session: request.session.session, profile:data[0]});
    });}
});

app.get("/bought", function(request,response){

    if(typeof request.session.session=='undefined')
    response.redirect("/");
    else{

    var connection = connection_db();

    connection.query("SELECT * from books a inner join tab b on a.id_book=b.id_book inner join users c on b.id_user=c.id_user where email='"+request.session.session+"'", function(err,data){

        if(err)
        throw err;

        connection.end();

        console.log(data);
        response.render("bought",{session: request.session.session, books:data});
    });}
});

app.get("/logout", function(request,response){

    request.session.destroy();
    response.redirect("/");
});

app.post("/login", urlencodedParser, function(request, response){

    var connection = connection_db();

    connection.query(`SELECT id_user from users where email='${request.body.email}' and password='${request.body.password}'`, function(err,data){

        if (err) throw err;

        connection.end();

        if(typeof data[0]=='undefined')
        response.end("Ошибка");
        else{
            request.session.session=`${request.body.email}`;
            response.end("Удача");
        }
    });

});

app.post("/registration", urlencodedParser, function(request,response){

    var connection = connection_db();

    connection.query(`SELECT id_user from users where email='${request.body.email}'`, function(err,data){

        if(typeof data[0]=='undefined')
        {
            connection.execute(`INSERT INTO users value(null,'${request.body.name}','${request.body.surname}','${request.body.email}','${request.body.password}')`);

            connection.end();

            request.session.session = `${request.body.email}`;
            response.end("Удача");
        }
        else
        {
            connection.end();
            response.end("Ошибка");
        }
    });
});
app.get("/search", function(req,res){
    res.redirect("/");
    });
app.post("/search", urlencodedParser, function(request, response){
    //переменная получает значение из формы поиска, которому 
    // с двух сторон удаляют пробелы, а все пробелы между словами заменяются на |
    var finalQuery = `${request.body.searchinput}`.trim().replace(/\s+/gi,"|").toLowerCase();
    console.log(finalQuery);
    //проверка на то, что переменная не пустая
    if(finalQuery!=='')
    {
        //подключение бд
        var connection = connection_db();
        //создание запроса, который при помощи функции regexp (регулярное выражение mysql) 
        // проверяется наличие тех слов, которые были введены в строку поиска в имени или описании книги
        // при этом строки данных из таблицы переведены в нижний регистр
    connection.query(`SELECT * from books where lower(name) regexp '`+ finalQuery +`' or lower(description) regexp '`+ finalQuery +`'`, function(err,data){
        //выкидывает при ошибке
        if(err) throw err;
        //закрытие подключения
        connection.end();
        //render страницы search с переданным массивом полученных книг в результате выполнения запроса
        response.render("search", {req: `${request.body.searchinput}`, books:data, session: request.session.session});
    });
    }
    else 
    {
        //в случае если поиск пустой, перенаправит на главную
        response.redirect('/');
    }

});

app.post("/buy", urlencodedParser, function(request,response){

    var connection = connection_db();
    console.log(`${request.body.bookid}`.slice(27));
    connection.query("INSERT INTO tab SELECT null,"+`${request.body.bookid}`.slice(27)+", id_user from users where email='"+request.session.session+"'", function(err,data){
        if(err) throw err;
        connection.end();
        response.end();
    })
});
app.listen(3000);