require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());


mongoose.connect(
  process.env.MONGODB_URI
).then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error(' MongoDB connection error:', err));


const DataSchema = new mongoose.Schema({}, { strict: false });
const DataModel = mongoose.model('Data', DataSchema);

const upload = multer({ dest: 'uploads/' });


app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    await DataModel.insertMany(data);

    fs.unlinkSync(req.file.path);

    res.send({ message: 'Data uploaded and saved', count: data.length });
  } catch (err) {
    console.error(' Upload error:', err);
    res.status(500).send(' Error processing Excel file');
  }
});


app.get('/api/data', async (req, res) => {
  try {
    const data = await DataModel.find().select('-__v'); 
    res.json(data);
  } catch (err) {
    res.status(500).send(' Failed to fetch data');
  }
});


app.delete('/api/data', async (req, res) => {
  try {
    await DataModel.deleteMany({});
    res.send({ message: ' All uploaded data deleted successfully' });
  } catch (err) {
    console.error(' Error deleting data:', err);
    res.status(500).send(' Failed to delete data');
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
