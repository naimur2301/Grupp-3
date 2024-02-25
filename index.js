//Erik was here
//dependencies
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const {readFile} = require('fs').promises;
const multer = require('multer');
const upload = multer();

//local database for testing
const db = new sqlite3.Database('mydatabase.db');


//session middleware for login
app.use(session({
    secret: 'EriksChocolateCookie',
    resave: false,
    saveUninitialized: true
}));


//parser middle ware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//using ejs
app.set('view engine', 'ejs');


//database table for complaints
db.run('CREATE TABLE IF NOT EXISTS tickets (id INT AUTO_INCREMENT PRIMARY KEY, email text, title TEXT, image BLOB, body TEXT)');
//database table for users
db.run('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email TEXT, lgh TEXT, building TEXT, password TEXT, admin INT)');
db.run('CREATE TABLE IF NOT EXISTS admin (id INT AUTO_INCREMENT PRIMARY KEY, email TEXT,  lgh_group INT, password TEXT)');
db.run('CREATE TABLE IF NOT EXISTS worker (id INT AUTO_INCREMENT PRIMARY KEY, email TEXT,  lgh_group INT, password TEXT)');

//this just makes hyperlinks work, idk i think it should probably be in a class or something but I'm too lazy
//there most likely exists a much cleaner way to do this

//this one needs all of this so that it can send the users tickets to the ejs
app.get('/', async (request, response) => 
{
    const email = request.session.userId;
    console.log(email);
    db.all('Select * FROM tickets where email = ?', [email], (err, results) =>
    {
        if(err)
        {
            console.error('Error fetching complaints:', err);
            response.status(500).send('Internal Server Error');
            return;
        }
        else
        {
            console.log('Data from the "tickets" table with logged in user:', results);
            response.render('index', { user: request.session.userId, tickets: results });
        }
    });
});
app.get('/submit_form.html', async (request, response) => 
{
    response.send(await readFile('./submit_form.html', 'utf8'));
});
app.get('/home.html', async (request, response) => 
{
    response.send(await readFile('./home.html', 'utf8'));
});
app.get('/login.html', async (request, response) => 
{
    response.send(await readFile('./login.html', 'utf8'));
});
app.get('/create_account.html', async (request, response) => 
{
    response.send(await readFile('./create_account.html', 'utf8'));
});

//function to log a user out 
app.get('/logout', (req, res) => 
{
    req.session.destroy();
    res.redirect('/');
});


//dumps the database for tickets to server log
app.get('/logData', (req, res) => 
{
    db.all('SELECT user, title, body FROM tickets', [], (err, rows) => {
        if (err) 
        {
            return console.error(err.message);
        } 
        console.log('Data from the "tickets" table:', rows);
        res.redirect('/');
    });
});


//logs in, need to make sure this actually remembers who's logged in, pipe it to the tickets database later
app.post('/login', (request, response) => 
{

    const email = request.body.email;
    const password = request.body.password;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => 
    {
        if (err) 
        {
            console.error(err.message);
            return;
        }
        if (row) 
        {
            console.log('Found user:', row);
            if(row.password == password)
            {
                request.session.userId = row.email;
                response.redirect('/');
            }
            else
            {
                console.log('wrong password');
                response.redirect('/');
            }
        } else 
        {
            console.log('no user found');
            response.redirect('/');
        }
    })
});


//register function, kind of broken
app.post('/register', (request, response) => 
{
    const password = request.body.password;
    const email = request.body.email;
    const lgh = request.body.lgh;
    const building = request.body.building;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => 
    {
        if (err) 
        {
            console.error(err.message);
            return;
        }
    
        if (row) 
        {
            console.log('Found user:', row);
            console.log('no new account created');
            response.redirect('/'); 
        } else 
        {
            console.log('User not found');
            db.run('INSERT INTO users (password, email, lgh, building) VALUES (?, ?, ?, ?)', [password, email, lgh, building], function (err) 
            {
                if (err) 
                {
                    return console.error(err.message);
                }
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            });
            console.log('Submitted data:', { email, password });
            response.redirect('/');
        }
    })
});


//submits a complaint ticket
app.post('/submit_form', upload.single('file'), (request, response) => 
{
    // Access form data from request.body
    const title = request.body.title;
    const body = request.body.body;
    const image = request.file.buffer;
    console.log(image);
    db.run('INSERT INTO tickets (email, title, body, image) VALUES ( ?, ?, ?, ?)', [ request.session.userId ,title, body, image], function (err) 
    {
        if (err) 
        {
            return console.error(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    console.log('Submitted data:', {title, body });
    response.redirect('/');
});


//hosts the website to local port 3000
app.listen(process.env.PORT || 3001, () => console.log(`app avaiable on http://localhost:3000`));