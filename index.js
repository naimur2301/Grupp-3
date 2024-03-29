//Erik was here
//dependencies
//todo

//for the ultra beta the only thing needed is the filtering by building groups and creating groups

//for the finished working I need to make the UI fucking epic, this part will suck so fucking hard I hate it
//also I need to code an epic scheduling system
//and a scheduling editor
//implement safety check so that normal users cannot acces admin 

//clean up my messy ass code, not enough files
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
//db.run('DROP TABLE IF EXISTS tickets');
db.run('CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY, email text, title TEXT, image BLOB, body TEXT, progress INT)');
//database table for users
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, lgh TEXT, building TEXT, password TEXT, admin INT)');

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
app.get('/admin', async (request, response) => 
{
    const email = request.session.userId;
    console.log(email);
    db.all('Select * FROM tickets', (err, results) =>
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
            response.render('admin', { user: request.session.userId, tickets: results });
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
app.get('/create_admin.html', async (request, response) => 
{
    response.send(await readFile('./create_admin.html', 'utf8'));
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
                if(row.admin == 2)
                {
                    response.redirect('/admin');
                }
                else
                {
                    response.redirect('/');
                }
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
            db.run('INSERT INTO users (password, email, lgh, building, admin) VALUES (?, ?, ?, ?, ?)', [password, email, lgh, building, 1], function (err) 
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

app.post('/register_admin', (request, response) => 
{
    const password = request.body.password;
    const email = request.body.email;
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
            db.run('INSERT INTO users (password, email, building, admin) VALUES (?, ?, ?, ?)', [password, email, building, 2], function (err) 
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
    const image = request.file ? request.file.buffer : null;
    console.log(image);
    db.run('INSERT INTO tickets (email, title, body, image, progress) VALUES ( ?, ?, ?, ?, ?)', [ request.session.userId ,title, body, image, 0], function (err) 
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

app.post('/delete', (req, res) => {
    const entryId = req.body.entryId;
    console.log(entryId);
    db.run('DELETE FROM tickets WHERE id = ?', entryId, (err) => {
        if (err) {
            //return res.status(500).send('Error deleting entry from the database.');
            console.log('fuckup')
        }
        console.log('Entry deleted successfully.');
    });
    //res.redirect('/admin');
});

app.post('/submit_status', (req, res) => {
    const selectedOption = parseInt(req.body.progress, 10);
    const id = parseInt(req.body.selectedId, 10);
    console.log(req.body);
    console.log("rAAHHAHAAH");
    console.log(selectedOption);
    console.log("rAAHHAHAAH");
    db.run('UPDATE tickets SET progress = ? WHERE id = ?', [selectedOption, id], function(err) {
        if (err) {
            return console.error(err.message);
        }
    
        console.log(`Rows affected: ${this.changes}`);
    });
    res.redirect('/admin');
});


//hosts the website to local port 3000
app.listen(process.env.PORT || 3001, () => console.log(`app avaiable on http://localhost:3000`));