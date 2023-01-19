const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cay2pw3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const servicesCollection = client.db("doctors").collection("services");
        const bookingCollection = client.db("doctors").collection("booking");

        app.get('/services', async(req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)

        });

        app.get('/availabel', async(req, res) => {
            const date = req.query.date;
            const service = await servicesCollection.find().toArray();
            const query = { date: date }
            const booking = await bookingCollection.find(query).toArray();
            service.forEach(service => {
                const servicesBooking = booking.filter(book => book.treatment === service.name);
                const bookedSlots = servicesBooking.map(book => book.slot);
                const availabel = service.slots.filter(slot => !bookedSlots.includes(slot));
                service.slots = availabel
            })

            res.send(service)
        })



        app.post('/booking', async(req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result })
        })

    } finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})