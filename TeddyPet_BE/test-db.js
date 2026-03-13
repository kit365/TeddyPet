const { Client } = require('pg');
const client = new Client({
  user: 'myuser',
  host: 'localhost',
  database: 'teddypet',
  password: 'mypassword',
  port: 5432,
});
client.connect();
client.query('SELECT DISTINCT payment_status FROM bookings;', (err, res) => {
  console.log('Payment Statuses:', res.rows.map(r => r.payment_status));
  client.query('SELECT DISTINCT status FROM bookings;', (err, res) => {
    console.log('Booking Statuses:', res.rows.map(r => r.status));
    client.query('SELECT DISTINCT payment_method FROM bookings;', (err, res) => {
        console.log('Payment Methods:', res.rows.map(r => r.payment_method));
        client.end();
    });
  });
});
