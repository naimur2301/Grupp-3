const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const {readFile} = require('fs').promises;
const db = new sqlite3.Database('mydatabase.db');

app.use(bodyParser.urlencoded({ extended: true }));
db.run('CREATE TABLE IF NOT EXISTS tickets (id INT, title TEXT, body TEXT)');
app.get('/', async (request, response) => {
    response.send(await readFile('./home.html', 'utf8'));
});

app.get('/submit_form.html', async (request, response) => {
    response.send(await readFile('./submit_form.html', 'utf8'));
});
app.get('/home.html', async (request, response) => {
    response.send(await readFile('./home.html', 'utf8'));
});
app.get('/login.html', async (request, response) => {
    response.send(await readFile('./login.html', 'utf8'));
});

app.get('/logData', (req, res) => {
    db.all('SELECT title, body FROM tickets', [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        // Log the data to the console
        console.log('Data from the "tickets" table:', rows);
    });
});

app.post('/login', (request, response) => {
    // Access form data from request.body
    const username = request.body.username;
    const password = request.body.password;

    // Process the form data (you can save it to a database or perform other actions)
    console.log('Submitted data:', { username, password });

    // Redirect back to the home page or display a thank you message
    response.redirect('/');
});
app.post('/submit_form', (request, response) => {
    // Access form data from request.body
    const title = request.body.title;
    const body = request.body.body;

    db.run('INSERT INTO tickets (title, body) VALUES (?, ?)', [title, body], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    // Process the form data (you can save it to a database or perform other actions)
    console.log('Submitted data:', { title, body });

    // Redirect back to the home page or display a thank you message
    response.redirect('/');
});

app.listen(process.env.PORT || 3000, () => console.log(`app avaiable on http://localhost:3000`));